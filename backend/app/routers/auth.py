from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, Profile, UserRole
from app.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    set_auth_cookie,
    clear_auth_cookie,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role
    )
    db.add(new_user)
    await db.flush()
    
    profile = Profile(user_id=new_user.id)
    db.add(profile)
    await db.commit()
    
    result = await db.execute(
        select(User)
        .where(User.id == new_user.id)
        .options(selectinload(User.profile), selectinload(User.skills))
    )
    new_user = result.scalar_one()
    
    token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role.value})
    set_auth_cookie(response, token)
    
    return new_user


@router.post("/login", response_model=UserResponse)
async def login(
    login_data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User)
        .where(User.email == login_data.email)
        .options(selectinload(User.profile), selectinload(User.skills))
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if user.role != login_data.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered as {user.role.value}, not {login_data.role.value}"
        )
    
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    set_auth_cookie(response, token)
    
    return user


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return current_user
