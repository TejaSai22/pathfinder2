from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional

from flask_login import UserMixin
from sqlalchemy import Integer, String, DateTime, Enum as SAEnum, Text, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import db, login_manager


class Role(str, Enum):
    STUDENT = "student"
    EMPLOYER = "employer"
    ADVISOR = "advisor"
    ADMIN = "admin"


profile_skills = Table(
    "profile_skills",
    db.metadata,
    mapped_column("profile_id", ForeignKey("profiles.id"), primary_key=True),
    mapped_column("skill_id", ForeignKey("skills.id"), primary_key=True),
)

job_skills = Table(
    "job_skills",
    db.metadata,
    mapped_column("job_id", ForeignKey("job_postings.id"), primary_key=True),
    mapped_column("skill_id", ForeignKey("skills.id"), primary_key=True),
)


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    role: Mapped[Role] = mapped_column(SAEnum(Role), default=Role.STUDENT, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    profile: Mapped[Optional[Profile]] = relationship("Profile", uselist=False, back_populates="student")
    job_postings: Mapped[list[JobPosting]] = relationship("JobPosting", back_populates="employer", cascade="all, delete-orphan")

    def get_id(self) -> str:  # Flask-Login expects str
        return str(self.id)


@login_manager.user_loader
def load_user(user_id: str) -> Optional["User"]:
    return db.session.get(User, int(user_id))


class Profile(db.Model):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    education_history: Mapped[Optional[str]] = mapped_column(Text)
    interests: Mapped[Optional[str]] = mapped_column(Text)

    student: Mapped[User] = relationship("User", back_populates="profile")
    skills: Mapped[list[Skill]] = relationship("Skill", secondary=profile_skills, back_populates="profiles")


class Skill(db.Model):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(120))

    profiles: Mapped[list[Profile]] = relationship("Profile", secondary=profile_skills, back_populates="skills")
    jobs: Mapped[list[JobPosting]] = relationship("JobPosting", secondary=job_skills, back_populates="required_skills")


class JobPosting(db.Model):
    __tablename__ = "job_postings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(120))
    salary: Mapped[Optional[str]] = mapped_column(String(120))
    date_posted: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    employer: Mapped[User] = relationship("User", back_populates="job_postings")
    required_skills: Mapped[list[Skill]] = relationship("Skill", secondary=job_skills, back_populates="jobs")
    applications: Mapped[list[Application]] = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class ApplicationStatus(str, Enum):
    SUBMITTED = "Submitted"
    VIEWED = "Viewed"
    SHORTLISTED = "Shortlisted"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"


class Application(db.Model):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job_postings.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    application_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[ApplicationStatus] = mapped_column(SAEnum(ApplicationStatus), default=ApplicationStatus.SUBMITTED)

    job: Mapped[JobPosting] = relationship("JobPosting", back_populates="applications")
    student: Mapped[User] = relationship("User")
