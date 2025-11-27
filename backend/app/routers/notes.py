from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, Note, UserRole, advisor_students
from app.schemas import NoteCreate, NoteUpdate, NoteResponse
from app.auth import get_current_user, require_advisor

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.get("/student/{student_id}", response_model=List[NoteResponse])
async def get_student_notes(
    student_id: int,
    current_user: User = Depends(require_advisor),
    db: AsyncSession = Depends(get_db)
):
    advisor_check = await db.execute(
        select(advisor_students).where(
            advisor_students.c.advisor_id == current_user.id,
            advisor_students.c.student_id == student_id
        )
    )
    if not advisor_check.first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This student is not assigned to you"
        )
    
    result = await db.execute(
        select(Note)
        .where(Note.advisor_id == current_user.id, Note.student_id == student_id)
        .order_by(Note.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(require_advisor),
    db: AsyncSession = Depends(get_db)
):
    advisor_check = await db.execute(
        select(advisor_students).where(
            advisor_students.c.advisor_id == current_user.id,
            advisor_students.c.student_id == note_data.student_id
        )
    )
    if not advisor_check.first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This student is not assigned to you"
        )
    
    note = Note(
        advisor_id=current_user.id,
        student_id=note_data.student_id,
        content=note_data.content,
        note_type=note_data.note_type
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    current_user: User = Depends(require_advisor),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.advisor_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    for field, value in note_data.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    
    await db.commit()
    await db.refresh(note)
    return note


@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    current_user: User = Depends(require_advisor),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.advisor_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    await db.delete(note)
    await db.commit()
    return {"message": "Note deleted successfully"}


@router.get("/my-notes", response_model=List[NoteResponse])
async def get_my_notes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == UserRole.STUDENT:
        result = await db.execute(
            select(Note)
            .where(Note.student_id == current_user.id)
            .order_by(Note.created_at.desc())
        )
    else:
        result = await db.execute(
            select(Note)
            .where(Note.advisor_id == current_user.id)
            .order_by(Note.created_at.desc())
        )
    return result.scalars().all()
