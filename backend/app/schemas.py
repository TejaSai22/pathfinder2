from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models import UserRole, ApplicationStatus, InterviewStatus


class SkillBase(BaseModel):
    name: str
    is_technical: bool = True
    category: Optional[str] = None


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: int

    class Config:
        from_attributes = True


class ProfileBase(BaseModel):
    first_name: str = ""
    last_name: str = ""
    headline: Optional[str] = None
    bio: Optional[str] = None
    academic_background: Optional[str] = None
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    email: EmailStr
    role: UserRole


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: UserRole


class UserResponse(UserBase):
    id: int
    created_at: datetime
    profile: Optional[ProfileResponse] = None
    skills: List[SkillResponse] = []

    class Config:
        from_attributes = True


class UserWithStats(UserResponse):
    avg_match_score: Optional[float] = None
    application_count: int = 0


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class JobBase(BaseModel):
    title: str
    description: str
    location: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    onet_soc_code: Optional[str] = None


class JobCreate(JobBase):
    required_skill_ids: List[int] = []


class JobUpdate(JobBase):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    required_skill_ids: Optional[List[int]] = None


class JobResponse(JobBase):
    id: int
    employer_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    required_skills: List[SkillResponse] = []

    class Config:
        from_attributes = True


class JobWithMatch(JobResponse):
    match_score: float = 0.0
    matched_technical: List[str] = []
    matched_soft: List[str] = []
    missing_technical: List[str] = []
    missing_soft: List[str] = []


class ApplicationBase(BaseModel):
    cover_letter: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    job_id: int


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus
    cover_letter: Optional[str] = None


class ApplicationResponse(ApplicationBase):
    id: int
    job_id: int
    applicant_id: int
    status: ApplicationStatus
    match_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    job: Optional[JobResponse] = None
    applicant: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class NoteBase(BaseModel):
    content: str
    note_type: str = "general"


class NoteCreate(NoteBase):
    student_id: int


class NoteUpdate(BaseModel):
    content: Optional[str] = None
    note_type: Optional[str] = None


class NoteResponse(NoteBase):
    id: int
    advisor_id: int
    student_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SkillGapData(BaseModel):
    skill: str
    candidate: int
    required: int
    is_technical: bool
    matched: bool


class SkillGapAnalysis(BaseModel):
    overall_score: float
    technical_score: float
    soft_score: float
    matched_technical: List[str]
    matched_soft: List[str]
    missing_technical: List[str]
    missing_soft: List[str]
    radar_data: List[SkillGapData]


class ONetOccupationResponse(BaseModel):
    id: int
    soc_code: str
    title: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class InterviewBase(BaseModel):
    scheduled_at: datetime
    duration_minutes: int = 60
    interview_type: str = "video"
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class InterviewCreate(InterviewBase):
    application_id: int


class InterviewUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    interview_type: Optional[str] = None
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[InterviewStatus] = None


class InterviewResponse(InterviewBase):
    id: int
    application_id: int
    status: InterviewStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InterviewWithDetails(InterviewResponse):
    applicant_name: str
    applicant_email: str
    job_title: str
    company_name: str
