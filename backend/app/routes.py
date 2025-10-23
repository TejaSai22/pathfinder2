from __future__ import annotations
from typing import Any
import math

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import or_

from . import db
from .models import User, Profile, Skill, JobPosting, Application, Role, ApplicationStatus
from .ml.service import RecommendationService

api_bp = Blueprint("api", __name__)


def require_roles(*roles: Role):
    def wrapper(fn):
        def inner(*args, **kwargs):
            if current_user.is_anonymous or current_user.role not in roles:
                return jsonify({"error": "Forbidden"}), 403
            return fn(*args, **kwargs)
        inner.__name__ = fn.__name__
        return login_required(inner)
    return wrapper

@api_bp.get("/jobs")
def list_jobs():
    args = request.args
    q = (args.get("q", "") or "").strip()
    location = (args.get("location", "") or "").strip()
    # support repeated ?skill= as well as comma-separated skills
    skill_params = [s.strip() for s in args.getlist("skill") if s and s.strip()]
    skills_csv = args.get("skills", "") or ""
    if skills_csv:
        skill_params.extend([s.strip() for s in skills_csv.split(",") if s.strip()])

    try:
        page = max(int(args.get("page", 1) or 1), 1)
    except Exception:
        page = 1
    try:
        page_size = int(args.get("pageSize", 10) or 10)
    except Exception:
        page_size = 10
    page_size = min(max(page_size, 1), 50)

    query = JobPosting.query
    if q:
        like = f"%{q}%"
        query = query.filter(or_(JobPosting.title.ilike(like), JobPosting.description.ilike(like)))
    if location:
        query = query.filter(JobPosting.location.ilike(f"%{location}%"))
    if skill_params:
        query = query.join(JobPosting.required_skills).filter(Skill.name.in_(skill_params)).distinct()

    total = query.count()
    items = (
        query.order_by(JobPosting.date_posted.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    rows: list[dict[str, Any]] = []
    for j in items:
        rows.append(
            {
                "id": j.id,
                "title": j.title,
                "location": j.location,
                "datePosted": j.date_posted.isoformat(),
                "skills": [s.name for s in j.required_skills],
            }
        )

    return jsonify(
        {
            "items": rows,
            "page": page,
            "pageSize": page_size,
            "total": int(total),
            "totalPages": math.ceil(total / page_size) if page_size else 0,
        }
    )


@api_bp.get("/student/profile")
@require_roles(Role.STUDENT)
def get_profile():
    profile = Profile.query.filter_by(student_id=current_user.id).first()
    if not profile:
        profile = Profile(student_id=current_user.id)
        db.session.add(profile)
        db.session.commit()
    return jsonify({
        "educationHistory": profile.education_history or "",
        "interests": profile.interests or "",
        "skills": [s.name for s in profile.skills],
    })


@api_bp.put("/student/profile")
@require_roles(Role.STUDENT)
def update_profile():
    data = request.get_json(force=True)
    profile = Profile.query.filter_by(student_id=current_user.id).first()
    if not profile:
        profile = Profile(student_id=current_user.id)
        db.session.add(profile)

    profile.education_history = data.get("educationHistory")
    profile.interests = data.get("interests")

    skill_names = [s.strip() for s in data.get("skills", []) if s.strip()]
    skills = []
    for name in skill_names:
        sk = Skill.query.filter_by(name=name).first()
        if not sk:
            sk = Skill(name=name)
            db.session.add(sk)
        skills.append(sk)
    profile.skills = skills
    db.session.commit()
    return jsonify({"ok": True})


@api_bp.get("/student/recommendations/careers")
@require_roles(Role.STUDENT)
def get_career_recs():
    profile = Profile.query.filter_by(student_id=current_user.id).first()
    svc = RecommendationService()
    recs = svc.get_career_recommendations(profile)
    return jsonify(recs)


@api_bp.get("/student/recommendations/jobs")
@require_roles(Role.STUDENT)
def get_job_recs():
    profile = Profile.query.filter_by(student_id=current_user.id).first()
    svc = RecommendationService()
    recs = svc.get_job_matches(profile)
    return jsonify(recs)


@api_bp.post("/applications")
@require_roles(Role.STUDENT)
def apply_to_job():
    data = request.get_json(force=True)
    job_id = int(data.get("jobID"))
    job = db.session.get(JobPosting, job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    app = Application(job_id=job.id, student_id=current_user.id)
    db.session.add(app)
    db.session.commit()
    # In iteration 1, notifications are logged
    return jsonify({"applicationID": app.id, "status": app.status.value})


@api_bp.post("/employer/jobs")
@require_roles(Role.EMPLOYER)
def create_job():
    data = request.get_json(force=True)
    title = data.get("title")
    description = data.get("description")
    location = data.get("location")
    salary = data.get("salary")
    skills = [s.strip() for s in data.get("skills", []) if s.strip()]

    if not title or not description:
        return jsonify({"error": "Missing fields"}), 400

    job = JobPosting(employer_id=current_user.id, title=title, description=description, location=location, salary=salary)
    job_skills = []
    for name in skills:
        sk = Skill.query.filter_by(name=name).first()
        if not sk:
            sk = Skill(name=name)
            db.session.add(sk)
        job_skills.append(sk)
    job.required_skills = job_skills

    db.session.add(job)
    db.session.commit()
    return jsonify({"id": job.id})


@api_bp.get("/employer/jobs/<int:job_id>")
@require_roles(Role.EMPLOYER)
def get_job(job_id: int):
    job = JobPosting.query.filter_by(id=job_id, employer_id=current_user.id).first()
    if not job:
        return jsonify({"error": "Not found"}), 404
    return jsonify({
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "skills": [s.name for s in job.required_skills],
    })


@api_bp.get("/employer/jobs/<int:job_id>/applicants")
@require_roles(Role.EMPLOYER)
def get_applicants(job_id: int):
    job = JobPosting.query.filter_by(id=job_id, employer_id=current_user.id).first()
    if not job:
        return jsonify({"error": "Not found"}), 404
    rows: list[dict[str, Any]] = []
    for a in job.applications:
        stu = db.session.get(User, a.student_id)
        rows.append({
            "applicationID": a.id,
            "studentName": stu.name,
            "status": a.status.value,
        })
    return jsonify(rows)


@api_bp.put("/employer/applications/<int:app_id>")
@require_roles(Role.EMPLOYER)
def update_application(app_id: int):
    data = request.get_json(force=True)
    status = data.get("status")
    if status not in {s.value for s in ApplicationStatus}:
        return jsonify({"error": "Invalid status"}), 400

    app = db.session.get(Application, app_id)
    if not app or app.job.employer_id != current_user.id:
        return jsonify({"error": "Not found"}), 404

    app.status = ApplicationStatus(status)
    db.session.commit()
    return jsonify({"ok": True})


@api_bp.get("/admin/users")
@require_roles(Role.ADMIN)
def list_users():
    users = User.query.all()
    return jsonify([
        {"id": u.id, "name": u.name, "email": u.email, "role": u.role.value}
        for u in users
    ])
