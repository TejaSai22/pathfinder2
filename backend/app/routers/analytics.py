from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, Job, Application, Skill, UserRole, advisor_students, ApplicationStatus
from app.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/analytics", tags=["Analytics"])


class OverviewStats(BaseModel):
    total_students: int
    total_applications: int
    total_interviews: int
    total_offers: int
    placement_rate: float
    avg_match_score: float


class SkillDemand(BaseModel):
    skill_name: str
    demand_count: int
    is_technical: bool


class ApplicationTrend(BaseModel):
    status: str
    count: int
    percentage: float


class StudentPerformance(BaseModel):
    student_id: int
    student_name: str
    email: str
    application_count: int
    avg_match_score: float
    status_distribution: dict


class TopEmployer(BaseModel):
    employer_name: str
    job_count: int
    application_count: int


@router.get("/overview", response_model=OverviewStats)
async def get_overview_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.ADVISOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only advisors can access analytics"
        )
    
    students_result = await db.execute(
        select(advisor_students.c.student_id).where(
            advisor_students.c.advisor_id == current_user.id
        )
    )
    student_ids = [row[0] for row in students_result.fetchall()]
    
    if not student_ids:
        return OverviewStats(
            total_students=0,
            total_applications=0,
            total_interviews=0,
            total_offers=0,
            placement_rate=0.0,
            avg_match_score=0.0
        )
    
    total_students = len(student_ids)
    
    apps_result = await db.execute(
        select(
            func.count(Application.id).label('total'),
            func.count(case((Application.status == ApplicationStatus.INTERVIEW, 1))).label('interviews'),
            func.count(case((Application.status == ApplicationStatus.ACCEPTED, 1))).label('offers'),
            func.avg(Application.match_score).label('avg_score')
        ).where(Application.applicant_id.in_(student_ids))
    )
    app_stats = apps_result.first()
    
    if app_stats is None:
        total_applications = 0
        total_interviews = 0
        total_offers = 0
        avg_match_score = 0.0
    else:
        total_applications = app_stats.total or 0
        total_interviews = app_stats.interviews or 0
        total_offers = app_stats.offers or 0
        avg_match_score = float(app_stats.avg_score or 0)
    
    placement_rate = (total_offers / total_students * 100) if total_students > 0 else 0
    
    return OverviewStats(
        total_students=total_students,
        total_applications=total_applications,
        total_interviews=total_interviews,
        total_offers=total_offers,
        placement_rate=round(placement_rate, 1),
        avg_match_score=round(avg_match_score, 1)
    )


@router.get("/skill-demand", response_model=List[SkillDemand])
async def get_skill_demand(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 10
):
    if current_user.role != UserRole.ADVISOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only advisors can access analytics"
        )
    
    result = await db.execute(
        select(
            Skill.name,
            Skill.is_technical,
            func.count(Skill.id).label('demand_count')
        )
        .join(Job.required_skills)
        .where(Job.is_active == True)
        .group_by(Skill.id, Skill.name, Skill.is_technical)
        .order_by(func.count(Skill.id).desc())
        .limit(limit)
    )
    
    return [
        SkillDemand(
            skill_name=row.name,
            demand_count=row.demand_count,
            is_technical=row.is_technical
        )
        for row in result.fetchall()
    ]


@router.get("/application-trends", response_model=List[ApplicationTrend])
async def get_application_trends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.ADVISOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only advisors can access analytics"
        )
    
    students_result = await db.execute(
        select(advisor_students.c.student_id).where(
            advisor_students.c.advisor_id == current_user.id
        )
    )
    student_ids = [row[0] for row in students_result.fetchall()]
    
    if not student_ids:
        return []
    
    result = await db.execute(
        select(
            Application.status,
            func.count(Application.id).label('count')
        )
        .where(Application.applicant_id.in_(student_ids))
        .group_by(Application.status)
    )
    
    trends = result.fetchall()
    total = sum(int(row[1]) for row in trends) or 1
    
    return [
        ApplicationTrend(
            status=str(row[0].value),
            count=int(row[1]),
            percentage=round(int(row[1]) / total * 100, 1)
        )
        for row in trends
    ]


@router.get("/student-performance", response_model=List[StudentPerformance])
async def get_student_performance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.ADVISOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only advisors can access analytics"
        )
    
    students_result = await db.execute(
        select(User)
        .join(advisor_students, advisor_students.c.student_id == User.id)
        .where(advisor_students.c.advisor_id == current_user.id)
        .options(selectinload(User.profile))
    )
    students = students_result.scalars().all()
    
    performance_data = []
    for student in students:
        apps_result = await db.execute(
            select(
                func.count(Application.id).label('count'),
                func.avg(Application.match_score).label('avg_score'),
                Application.status
            )
            .where(Application.applicant_id == student.id)
            .group_by(Application.status)
        )
        apps = apps_result.fetchall()
        
        total_apps = sum(int(row[0]) for row in apps)
        avg_score = 0.0
        status_dist: dict = {}
        
        for row in apps:
            count_val = int(row[0])
            status_val = row[2]
            avg_val = row[1]
            status_dist[str(status_val.value)] = count_val
            if avg_val:
                avg_score = float(avg_val)
        
        name = f"{student.profile.first_name} {student.profile.last_name}" if student.profile else student.email
        
        performance_data.append(StudentPerformance(
            student_id=student.id,
            student_name=name,
            email=student.email,
            application_count=total_apps,
            avg_match_score=round(avg_score, 1),
            status_distribution=status_dist
        ))
    
    performance_data.sort(key=lambda x: x.application_count, reverse=True)
    return performance_data


@router.get("/top-employers", response_model=List[TopEmployer])
async def get_top_employers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 5
):
    if current_user.role != UserRole.ADVISOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only advisors can access analytics"
        )
    
    result = await db.execute(
        select(
            User.id,
            func.count(Job.id.distinct()).label('job_count'),
            func.count(Application.id).label('app_count')
        )
        .join(Job, Job.employer_id == User.id)
        .outerjoin(Application, Application.job_id == Job.id)
        .where(User.role == UserRole.EMPLOYER)
        .group_by(User.id)
        .order_by(func.count(Application.id).desc())
        .limit(limit)
    )
    
    employers_data = result.fetchall()
    
    employer_ids = [row[0] for row in employers_data]
    if not employer_ids:
        return []
    
    profiles_result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id.in_(employer_ids))
    )
    profiles_map = {u.id: u for u in profiles_result.scalars().all()}
    
    results = []
    for row in employers_data:
        user_id = row[0]
        job_count = int(row[1])
        app_count = int(row[2])
        
        user = profiles_map.get(user_id)
        if user and user.profile and user.profile.company_name:
            employer_name = user.profile.company_name
        else:
            employer_name = "Unknown"
        
        results.append(TopEmployer(
            employer_name=employer_name,
            job_count=job_count,
            application_count=app_count
        ))
    
    return results
