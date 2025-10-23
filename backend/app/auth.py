from __future__ import annotations
from dataclasses import dataclass
from typing import Optional

from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from argon2 import PasswordHasher
from email_validator import validate_email, EmailNotValidError

from . import db
from .models import User, Role


auth_bp = Blueprint("auth", __name__)
ph = PasswordHasher()


@dataclass
class AuthResponse:
    id: int
    name: str
    email: str
    role: str


@auth_bp.post("/register")
def register():
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", Role.STUDENT.value)

    if not name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # In dev we do not require deliverability (MX) check
        validate_email(email, check_deliverability=False)
    except EmailNotValidError as e:
        return jsonify({"error": str(e)}), 400

    if role not in {r.value for r in Role}:
        return jsonify({"error": "Invalid role"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    pwd_hash = ph.hash(password)
    user = User(name=name, email=email, password_hash=pwd_hash, role=Role(role))
    db.session.add(user)
    db.session.commit()

    login_user(user)
    return jsonify(AuthResponse(user.id, user.name, user.email, user.role.value).__dict__), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(force=True)
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user: Optional[User] = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    try:
        ph.verify(user.password_hash, password)
    except Exception:
        return jsonify({"error": "Invalid credentials"}), 401

    login_user(user)
    return jsonify(AuthResponse(user.id, user.name, user.email, user.role.value).__dict__), 200


@auth_bp.post("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"ok": True})


@auth_bp.get("/me")
@login_required
def me():
    u = current_user
    return jsonify(AuthResponse(u.id, u.name, u.email, u.role.value).__dict__)
