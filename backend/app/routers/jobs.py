from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, Job, Skill, Application, UserRole, advisor_students
from app.schemas import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobWithMatch,
    SkillGapAnalysis
)
from app.auth import get_current_user, require_employer
from app.services.ml_service import (
    SkillData,
    calculate_weighted_match,
    get_skill_gap_analysis
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def skill_to_skill_data(skill: Skill) -> SkillData:
    return SkillData(id=skill.id, name=skill.name, is_technical=skill.is_technical)


@router.get("", response_model=List[JobWithMatch])
async def list_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    active_only: bool = Query(True),
    limit: int = Query(50, le=100),
    offset: int = Query(0)
):
    query = select(Job).options(
        selectinload(Job.required_skills),
        selectinload(Job.employer).selectinload(User.profile)
    )
    
    if active_only:
        query = query.where(Job.is_active == True)
    
    query = query.order_by(Job.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    user_result = await db.execute(
        select(User).options(selectinload(User.skills)).where(User.id == current_user.id)
    )
    user = user_result.scalar_one()
    candidate_skills = [skill_to_skill_data(s) for s in user.skills]
    
    jobs_with_match = []
    for job in jobs:
        job_skills = [skill_to_skill_data(s) for s in job.required_skills]
        match_result = calculate_weighted_match(candidate_skills, job_skills)
        
        job_data = JobWithMatch(
            id=job.id,
            employer_id=job.employer_id,
            title=job.title,
            description=job.description,
            location=job.location,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            job_type=job.job_type,
            experience_level=job.experience_level,
            onet_soc_code=job.onet_soc_code,
            is_active=job.is_active,
            created_at=job.created_at,
            updated_at=job.updated_at,
            required_skills=job.required_skills,
            match_score=round(match_result.score * 100, 1),
            matched_technical=match_result.matched_technical,
            matched_soft=match_result.matched_soft,
            missing_technical=match_result.missing_technical,
            missing_soft=match_result.missing_soft
        )
        jobs_with_match.append(job_data)
    
    jobs_with_match.sort(key=lambda x: x.match_score, reverse=True)
    return jobs_with_match


@router.get("/my-jobs", response_model=List[JobResponse])
async def get_my_jobs(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Job)
        .options(selectinload(Job.required_skills))
        .where(Job.employer_id == current_user.id)
        .order_by(Job.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    skill_result = await db.execute(
        select(Skill).where(Skill.id.in_(job_data.required_skill_ids))
    )
    skills = skill_result.scalars().all()
    
    job = Job(
        employer_id=current_user.id,
        title=job_data.title,
        description=job_data.description,
        location=job_data.location,
        salary_min=job_data.salary_min,
        salary_max=job_data.salary_max,
        job_type=job_data.job_type,
        experience_level=job_data.experience_level,
        onet_soc_code=job_data.onet_soc_code,
        required_skills=list(skills)
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    result = await db.execute(
        select(Job).options(selectinload(Job.required_skills)).where(Job.id == job.id)
    )
    return result.scalar_one()


@router.get("/{job_id}", response_model=JobWithMatch)
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Job)
        .options(selectinload(Job.required_skills))
        .where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    user_result = await db.execute(
        select(User).options(selectinload(User.skills)).where(User.id == current_user.id)
    )
    user = user_result.scalar_one()
    candidate_skills = [skill_to_skill_data(s) for s in user.skills]
    job_skills = [skill_to_skill_data(s) for s in job.required_skills]
    match_result = calculate_weighted_match(candidate_skills, job_skills)
    
    return JobWithMatch(
        id=job.id,
        employer_id=job.employer_id,
        title=job.title,
        description=job.description,
        location=job.location,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        job_type=job.job_type,
        experience_level=job.experience_level,
        onet_soc_code=job.onet_soc_code,
        is_active=job.is_active,
        created_at=job.created_at,
        updated_at=job.updated_at,
        required_skills=job.required_skills,
        match_score=round(match_result.score * 100, 1),
        matched_technical=match_result.matched_technical,
        matched_soft=match_result.matched_soft,
        missing_technical=match_result.missing_technical,
        missing_soft=match_result.missing_soft
    )


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Job)
        .options(selectinload(Job.required_skills))
        .where(Job.id == job_id, Job.employer_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission"
        )
    
    update_data = job_data.model_dump(exclude_unset=True)
    
    if "required_skill_ids" in update_data:
        skill_ids = update_data.pop("required_skill_ids")
        skill_result = await db.execute(select(Skill).where(Skill.id.in_(skill_ids)))
        job.required_skills = list(skill_result.scalars().all())
    
    for field, value in update_data.items():
        setattr(job, field, value)
    
    await db.commit()
    await db.refresh(job)
    return job


@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.employer_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission"
        )
    
    await db.delete(job)
    await db.commit()
    return {"message": "Job deleted successfully"}


@router.get("/{job_id}/skill-gap", response_model=SkillGapAnalysis)
async def get_job_skill_gap(
    job_id: int,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Job).options(selectinload(Job.required_skills)).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    target_user_id = user_id if user_id and current_user.role in [UserRole.EMPLOYER, UserRole.ADVISOR] else current_user.id
    
    if user_id and current_user.role == UserRole.ADVISOR:
        advisor_check = await db.execute(
            select(advisor_students).where(
                advisor_students.c.advisor_id == current_user.id,
                advisor_students.c.student_id == user_id
            )
        )
        if not advisor_check.first():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This student is not assigned to you"
            )
    
    user_result = await db.execute(
        select(User).options(selectinload(User.skills)).where(User.id == target_user_id)
    )
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    candidate_skills = [skill_to_skill_data(s) for s in user.skills]
    job_skills = [skill_to_skill_data(s) for s in job.required_skills]
    
    analysis = get_skill_gap_analysis(candidate_skills, job_skills)
    return SkillGapAnalysis(**analysis)
