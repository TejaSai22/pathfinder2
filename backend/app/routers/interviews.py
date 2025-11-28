from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.database import get_db
from app.models import User, Application, Interview, Job, UserRole, ApplicationStatus, InterviewStatus
from app.schemas import InterviewCreate, InterviewUpdate, InterviewResponse, InterviewWithDetails
from app.auth import get_current_user

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.get("", response_model=List[InterviewWithDetails])
async def get_my_interviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == UserRole.EMPLOYER:
        result = await db.execute(
            select(Interview)
            .join(Application)
            .join(Job)
            .where(Job.employer_id == current_user.id)
            .options(
                selectinload(Interview.application)
                .selectinload(Application.job),
                selectinload(Interview.application)
                .selectinload(Application.applicant)
                .selectinload(User.profile)
            )
            .order_by(Interview.scheduled_at)
        )
    elif current_user.role == UserRole.STUDENT:
        result = await db.execute(
            select(Interview)
            .join(Application)
            .where(Application.applicant_id == current_user.id)
            .options(
                selectinload(Interview.application)
                .selectinload(Application.job)
                .selectinload(Job.employer)
                .selectinload(User.profile),
                selectinload(Interview.application)
                .selectinload(Application.applicant)
                .selectinload(User.profile)
            )
            .order_by(Interview.scheduled_at)
        )
    else:
        return []
    
    interviews = result.scalars().all()
    response = []
    for interview in interviews:
        app = interview.application
        applicant = app.applicant
        job = app.job
        employer = job.employer if hasattr(job, 'employer') else None
        
        response.append(InterviewWithDetails(
            id=interview.id,
            application_id=interview.application_id,
            scheduled_at=interview.scheduled_at,
            duration_minutes=interview.duration_minutes,
            interview_type=interview.interview_type,
            location=interview.location,
            meeting_link=interview.meeting_link,
            notes=interview.notes,
            status=interview.status,
            created_at=interview.created_at,
            updated_at=interview.updated_at,
            applicant_name=f"{applicant.profile.first_name} {applicant.profile.last_name}" if applicant.profile else applicant.email,
            applicant_email=applicant.email,
            job_title=job.title,
            company_name=employer.profile.company_name if employer and employer.profile else "Unknown Company"
        ))
    
    return response


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def schedule_interview(
    interview_data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can schedule interviews"
        )
    
    result = await db.execute(
        select(Application)
        .join(Job)
        .where(Application.id == interview_data.application_id)
        .where(Job.employer_id == current_user.id)
        .options(selectinload(Application.job))
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or you don't have permission"
        )
    
    from datetime import timedelta
    start_time = interview_data.scheduled_at
    end_time = start_time + timedelta(minutes=interview_data.duration_minutes)
    
    existing = await db.execute(
        select(Interview)
        .where(Interview.application_id == interview_data.application_id)
        .where(Interview.status != InterviewStatus.CANCELLED)
        .where(Interview.scheduled_at < end_time)
        .where(Interview.scheduled_at + timedelta(minutes=60) > start_time)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An interview is already scheduled for this time"
        )
    
    application.status = ApplicationStatus.INTERVIEW
    
    interview = Interview(
        application_id=interview_data.application_id,
        scheduled_at=interview_data.scheduled_at,
        duration_minutes=interview_data.duration_minutes,
        interview_type=interview_data.interview_type,
        location=interview_data.location,
        meeting_link=interview_data.meeting_link,
        notes=interview_data.notes
    )
    
    db.add(interview)
    await db.commit()
    await db.refresh(interview)
    
    return interview


@router.patch("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: int,
    update_data: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Interview)
        .join(Application)
        .join(Job)
        .where(Interview.id == interview_id)
        .options(selectinload(Interview.application).selectinload(Application.job))
    )
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    
    if current_user.role == UserRole.EMPLOYER and interview.application.job.employer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    if current_user.role == UserRole.STUDENT and interview.application.applicant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(interview, field, value)
    
    await db.commit()
    await db.refresh(interview)
    
    return interview


@router.delete("/{interview_id}", response_model=InterviewResponse)
async def cancel_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Interview)
        .join(Application)
        .join(Job)
        .where(Interview.id == interview_id)
        .options(selectinload(Interview.application).selectinload(Application.job))
    )
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    
    if current_user.role == UserRole.EMPLOYER and interview.application.job.employer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    interview.status = InterviewStatus.CANCELLED
    await db.commit()
    await db.refresh(interview)
    
    return interview
