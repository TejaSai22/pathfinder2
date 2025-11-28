from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models import CareerDetail, LearningResource, Skill
from app.schemas import CareerDetailResponse, LearningResourceResponse
from app.auth import get_current_user

router = APIRouter(prefix="/careers", tags=["Career Details"])


@router.get("", response_model=List[CareerDetailResponse])
async def get_all_careers(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CareerDetail).order_by(CareerDetail.title))
    return result.scalars().all()


@router.get("/{soc_code}", response_model=CareerDetailResponse)
async def get_career_detail(
    soc_code: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CareerDetail).where(CareerDetail.soc_code == soc_code)
    )
    career = result.scalar_one_or_none()
    
    if not career:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career details not found"
        )
    
    return career


@router.get("/resources/by-skill/{skill_id}", response_model=List[LearningResourceResponse])
async def get_resources_for_skill(
    skill_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LearningResource)
        .where(LearningResource.skill_id == skill_id)
        .order_by(LearningResource.is_free.desc(), LearningResource.title)
    )
    return result.scalars().all()


@router.get("/resources/for-missing-skills", response_model=List[LearningResourceResponse])
async def get_resources_for_missing_skills(
    skill_ids: str,
    db: AsyncSession = Depends(get_db)
):
    ids = [int(x.strip()) for x in skill_ids.split(",") if x.strip().isdigit()]
    
    if not ids:
        return []
    
    result = await db.execute(
        select(LearningResource)
        .where(LearningResource.skill_id.in_(ids))
        .order_by(LearningResource.is_free.desc(), LearningResource.title)
        .limit(10)
    )
    return result.scalars().all()
