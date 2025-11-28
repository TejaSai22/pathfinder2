from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Notification, NotificationType, User, Application, Job
from typing import Optional


async def create_notification(
    db: AsyncSession,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    link: Optional[str] = None
) -> Notification:
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        link=link
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


async def notify_application_submitted(db: AsyncSession, application: Application, job: Job):
    await create_notification(
        db=db,
        user_id=application.applicant_id,
        notification_type=NotificationType.APPLICATION_SUBMITTED,
        title="Application Submitted",
        message=f"Your application for '{job.title}' has been submitted successfully.",
        link=f"/applications"
    )


async def notify_application_status_changed(
    db: AsyncSession,
    application: Application,
    job: Job,
    old_status: str,
    new_status: str,
    feedback_notes: Optional[str] = None
):
    status_messages = {
        "reviewed": "Your application is being reviewed",
        "interview": "Congratulations! You've been selected for an interview",
        "accepted": "Great news! Your application has been accepted",
        "rejected": "We regret to inform you that your application was not selected"
    }
    
    message = status_messages.get(new_status, f"Your application status has been updated to {new_status}")
    message = f"{message} for the position '{job.title}'."
    
    if feedback_notes:
        message += f" Employer notes: {feedback_notes}"
    
    await create_notification(
        db=db,
        user_id=application.applicant_id,
        notification_type=NotificationType.APPLICATION_STATUS_CHANGED,
        title=f"Application Update: {new_status.title()}",
        message=message,
        link=f"/applications"
    )


async def notify_interview_scheduled(
    db: AsyncSession,
    user_id: int,
    job_title: str,
    interview_date: datetime
):
    await create_notification(
        db=db,
        user_id=user_id,
        notification_type=NotificationType.INTERVIEW_SCHEDULED,
        title="Interview Scheduled",
        message=f"Your interview for '{job_title}' has been scheduled for {interview_date.strftime('%B %d, %Y at %I:%M %p')}.",
        link=f"/applications"
    )


async def notify_advisor_note(db: AsyncSession, student_id: int, advisor_name: str):
    await create_notification(
        db=db,
        user_id=student_id,
        notification_type=NotificationType.ADVISOR_NOTE,
        title="New Advisor Note",
        message=f"{advisor_name} has added a new note to your profile.",
        link=f"/profile"
    )


async def notify_profile_incomplete(db: AsyncSession, user_id: int, completion_pct: int):
    await create_notification(
        db=db,
        user_id=user_id,
        notification_type=NotificationType.PROFILE_INCOMPLETE,
        title="Complete Your Profile",
        message=f"Your profile is only {completion_pct}% complete. Complete it to get better job recommendations!",
        link=f"/profile"
    )
