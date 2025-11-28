from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, Profile, Skill, Application, UserRole, advisor_students
from app.schemas import (
    UserResponse,
    UserWithStats,
    ProfileUpdate,
    ProfileResponse,
    SkillResponse,
    ProfileCompletionResponse
)
from app.auth import get_current_user, require_advisor

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.skills))
        .where(User.id == current_user.id)
    )
    user = result.scalar_one_or_none()
    return user


@router.put("/me/profile", response_model=ProfileResponse)
async def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
    
    for field, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    return profile


@router.put("/me/skills", response_model=List[SkillResponse])
async def update_my_skills(
    skill_ids: List[int],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Skill).where(Skill.id.in_(skill_ids)))
    skills = result.scalars().all()
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.skills))
        .where(User.id == current_user.id)
    )
    user = result.scalar_one()
    
    user.skills = list(skills)
    await db.commit()
    
    return skills


@router.get("/me/profile-completion", response_model=ProfileCompletionResponse)
async def get_profile_completion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.skills))
        .where(User.id == current_user.id)
    )
    user = result.scalar_one()
    
    required_fields = ['first_name', 'last_name', 'headline', 'bio', 'academic_background', 'location']
    missing_fields = []
    completed_fields = 0
    
    if user.profile:
        for field in required_fields:
            value = getattr(user.profile, field, None)
            if value and str(value).strip():
                completed_fields += 1
            else:
                missing_fields.append(field.replace('_', ' ').title())
    else:
        missing_fields = [f.replace('_', ' ').title() for f in required_fields]
    
    has_skills = len(user.skills) > 0
    skill_count = len(user.skills)
    
    if has_skills:
        completed_fields += 1
    else:
        missing_fields.append("Skills")
    
    total_fields = len(required_fields) + 1
    completion_percentage = int((completed_fields / total_fields) * 100)
    
    can_get_recommendations = completion_percentage >= 80
    
    return ProfileCompletionResponse(
        completion_percentage=completion_percentage,
        missing_fields=missing_fields,
        has_skills=has_skills,
        skill_count=skill_count,
        can_get_recommendations=can_get_recommendations
    )


@router.get("/students", response_model=List[UserWithStats])
async def get_assigned_students(
    current_user: User = Depends(require_advisor),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.skills))
        .join(advisor_students, User.id == advisor_students.c.student_id)
        .where(advisor_students.c.advisor_id == current_user.id)
    )
    students = result.scalars().all()
    
    student_stats = []
    for student in students:
        app_result = await db.execute(
            select(func.count(Application.id), func.avg(Application.match_score))
            .where(Application.applicant_id == student.id)
        )
        count, avg_score = app_result.one()
        
        student_data = UserWithStats(
            id=student.id,
            email=student.email,
            role=student.role,
            created_at=student.created_at,
            profile=student.profile,
            skills=student.skills,
            application_count=count or 0,
            avg_match_score=float(avg_score) if avg_score else None
        )
        student_stats.append(student_data)
    
    return student_stats


@router.post("/students/{student_id}/assign")
async def assign_student(
    student_id: int,
    current_user: User = Depends(require_advisor),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.id == student_id, User.role == UserRole.STUDENT)
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.assigned_students))
        .where(User.id == current_user.id)
    )
    advisor = result.scalar_one()
    
    if student not in advisor.assigned_students:
        advisor.assigned_students.append(student)
        await db.commit()
    
    return {"message": "Student assigned successfully"}


@router.get("/students/{student_id}", response_model=UserWithStats)
async def get_student_detail(
    student_id: int,
    current_user: User = Depends(require_advisor),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(advisor_students)
        .where(
            advisor_students.c.advisor_id == current_user.id,
            advisor_students.c.student_id == student_id
        )
    )
    if not result.first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This student is not assigned to you"
        )
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.skills))
        .where(User.id == student_id)
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    app_result = await db.execute(
        select(func.count(Application.id), func.avg(Application.match_score))
        .where(Application.applicant_id == student.id)
    )
    count, avg_score = app_result.one()
    
    return UserWithStats(
        id=student.id,
        email=student.email,
        role=student.role,
        created_at=student.created_at,
        profile=student.profile,
        skills=student.skills,
        application_count=count or 0,
        avg_match_score=float(avg_score) if avg_score else None
    )
