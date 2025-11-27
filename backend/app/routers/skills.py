from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Skill
from app.schemas import SkillResponse, SkillCreate
from app.auth import get_current_user

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("", response_model=List[SkillResponse])
async def list_skills(
    db: AsyncSession = Depends(get_db),
    technical_only: Optional[bool] = None,
    category: Optional[str] = None,
    search: Optional[str] = None
):
    query = select(Skill)
    
    if technical_only is not None:
        query = query.where(Skill.is_technical == technical_only)
    
    if category:
        query = query.where(Skill.category == category)
    
    if search:
        query = query.where(Skill.name.ilike(f"%{search}%"))
    
    query = query.order_by(Skill.is_technical.desc(), Skill.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/categories", response_model=List[str])
async def get_skill_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Skill.category).distinct().where(Skill.category.isnot(None))
    )
    categories = [r[0] for r in result.all() if r[0]]
    return sorted(categories)
