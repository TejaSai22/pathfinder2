from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, Job, Application, Skill, UserRole, ApplicationStatus, advisor_students
from app.schemas import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    BulkApplicationUpdate,
    BulkUpdateResult
)
from app.auth import get_current_user, require_student, require_employer
from app.services.ml_service import SkillData, calculate_weighted_match
from app.services.notification_service import notify_application_submitted, notify_application_status_changed

router = APIRouter(prefix="/applications", tags=["Applications"])


def skill_to_skill_data(skill: Skill) -> SkillData:
    return SkillData(id=skill.id, name=skill.name, is_technical=skill.is_technical)


@router.get("/my-applications", response_model=List[ApplicationResponse])
async def get_my_applications(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.job).selectinload(Job.required_skills),
            selectinload(Application.job).selectinload(Job.employer).selectinload(User.profile)
        )
        .where(Application.applicant_id == current_user.id)
        .order_by(Application.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    app_data: ApplicationCreate,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    job_result = await db.execute(
        select(Job).options(selectinload(Job.required_skills)).where(Job.id == app_data.job_id, Job.is_active == True)
    )
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or not active"
        )
    
    if job.deadline and job.deadline < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The application deadline for this job has passed"
        )
    
    existing = await db.execute(
        select(Application).where(
            Application.job_id == app_data.job_id,
            Application.applicant_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job"
        )
    
    user_result = await db.execute(
        select(User).options(selectinload(User.skills)).where(User.id == current_user.id)
    )
    user = user_result.scalar_one()
    
    candidate_skills = [skill_to_skill_data(s) for s in user.skills]
    job_skills = [skill_to_skill_data(s) for s in job.required_skills]
    match_result = calculate_weighted_match(candidate_skills, job_skills)
    
    application = Application(
        job_id=app_data.job_id,
        applicant_id=current_user.id,
        cover_letter=app_data.cover_letter,
        resume_url=app_data.resume_url,
        match_score=round(match_result.score * 100, 1)
    )
    db.add(application)
    await db.commit()
    
    await notify_application_submitted(db, application, job)
    
    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.job).selectinload(Job.required_skills),
            selectinload(Application.applicant).selectinload(User.profile)
        )
        .where(Application.id == application.id)
    )
    return result.scalar_one()


@router.get("/job/{job_id}", response_model=List[ApplicationResponse])
async def get_job_applications(
    job_id: int,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    job_result = await db.execute(
        select(Job).where(Job.id == job_id, Job.employer_id == current_user.id)
    )
    if not job_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission"
        )
    
    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.applicant).selectinload(User.profile),
            selectinload(Application.applicant).selectinload(User.skills)
        )
        .where(Application.job_id == job_id)
        .order_by(Application.match_score.desc().nullslast(), Application.created_at.desc())
    )
    return result.scalars().all()


@router.put("/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: int,
    update_data: ApplicationUpdate,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.job))
        .where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    if application.job.employer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this application"
        )
    
    old_status = application.status.value
    application.status = update_data.status
    
    if update_data.feedback_notes:
        application.feedback_notes = update_data.feedback_notes
        application.feedback_by = current_user.id
        application.feedback_at = datetime.utcnow()
    
    await db.commit()
    
    await notify_application_status_changed(
        db, application, application.job,
        old_status, update_data.status.value,
        update_data.feedback_notes
    )
    
    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.job).selectinload(Job.required_skills),
            selectinload(Application.applicant).selectinload(User.profile)
        )
        .where(Application.id == application_id)
    )
    return result.scalar_one()


@router.get("/student/{student_id}", response_model=List[ApplicationResponse])
async def get_student_applications(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == UserRole.ADVISOR:
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
    elif current_user.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own applications"
        )
    
    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.job).selectinload(Job.required_skills),
            selectinload(Application.job).selectinload(Job.employer).selectinload(User.profile)
        )
        .where(Application.applicant_id == student_id)
        .order_by(Application.created_at.desc())
    )
    return result.scalars().all()


@router.put("/bulk-update", response_model=BulkUpdateResult)
async def bulk_update_applications(
    update_data: BulkApplicationUpdate,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk update multiple applications at once with transactional safety.
    All updates succeed or all are rolled back.
    Only the employer who owns the jobs can update their applications.
    """
    not_found_ids = []
    unauthorized_ids = []
    applications_to_update = []
    
    for app_id in update_data.application_ids:
        result = await db.execute(
            select(Application)
            .options(
                selectinload(Application.job),
                selectinload(Application.applicant)
            )
            .where(Application.id == app_id)
        )
        application = result.scalar_one_or_none()
        
        if not application:
            not_found_ids.append(app_id)
            continue
            
        if application.job.employer_id != current_user.id:
            unauthorized_ids.append(app_id)
            continue
        
        applications_to_update.append(application)
    
    if not_found_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Applications not found: {not_found_ids}"
        )
    
    if unauthorized_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have permission to update these applications: {unauthorized_ids}"
        )
    
    if not applications_to_update:
        return BulkUpdateResult(
            updated_count=0,
            failed_count=0,
            failed_ids=[],
            message="No applications to update"
        )
    
    try:
        notifications_to_send = []
        
        for application in applications_to_update:
            old_status = application.status.value
            application.status = update_data.status
            
            if update_data.feedback_notes:
                application.feedback_notes = update_data.feedback_notes
                application.feedback_by = current_user.id
                application.feedback_at = datetime.utcnow()
            
            notifications_to_send.append((application, old_status))
        
        await db.commit()
        
        for application, old_status in notifications_to_send:
            try:
                await notify_application_status_changed(
                    db, application, application.job,
                    old_status, update_data.status.value,
                    update_data.feedback_notes
                )
            except Exception:
                pass
        
        return BulkUpdateResult(
            updated_count=len(applications_to_update),
            failed_count=0,
            failed_ids=[],
            message=f"Successfully updated {len(applications_to_update)} application(s)"
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update applications: {str(e)}"
        )
