from __future__ import annotations
from dataclasses import dataclass
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

from .. import db
from ..models import Profile, JobPosting


@dataclass
class CareerRecommendation:
    title: str
    score: float


@dataclass
class JobMatch:
    id: int
    title: str
    score: float


class RecommendationService:
    def __init__(self) -> None:
        # Two simple "models": TF-IDF cosine for careers and KNN for jobs
        self._career_vectorizer = TfidfVectorizer(stop_words="english")
        self._job_vectorizer = TfidfVectorizer(stop_words="english")
        self._nn = NearestNeighbors(metric="cosine")

        # Static small career corpus for demo
        self._career_titles = [
            "Data Scientist",
            "Cybersecurity Analyst",
            "Software Development Engineer",
            "Data Analyst",
            "Machine Learning Engineer",
        ]
        self._career_skills = [
            "python statistics machine learning pandas numpy sklearn",
            "network security threat analysis incident response siem",
            "java javascript react sql git algorithms data structures",
            "excel sql tableau data visualization python",
            "python deep learning pytorch tensorflow numpy",
        ]
        self._career_matrix = self._career_vectorizer.fit_transform(self._career_skills)

    def _profile_text(self, profile: Profile | None) -> str:
        if not profile:
            return ""
        skills = " ".join(s.name for s in profile.skills)
        interest = profile.interests or ""
        edu = profile.education_history or ""
        return f"{skills} {interest} {edu}"

    def get_career_recommendations(self, student_profile: Profile | None, top_n: int = 5) -> list[dict[str, Any]]:
        q = self._profile_text(student_profile)
        if not q.strip():
            # Return defaults
            return [
                {"title": t, "score": float(0.0)} for t in self._career_titles[:top_n]
            ]
        q_vec = self._career_vectorizer.transform([q])
        sims = 1 - (self._career_matrix @ q_vec.T).toarray().ravel()  # cosine distance
        # Convert to similarity
        sim_scores = 1 - sims
        order = np.argsort(sim_scores)[::-1][:top_n]
        return [
            {"title": self._career_titles[i], "score": float(sim_scores[i])}
            for i in order
        ]

    def get_job_matches(self, student_profile: Profile | None, top_n: int = 10) -> list[dict[str, Any]]:
        # Build job corpus from DB
        jobs = JobPosting.query.all()
        if not jobs:
            return []
        docs = [
            (j.id, f"{j.title} {j.description} {' '.join(s.name for s in j.required_skills)}")
            for j in jobs
        ]
        ids, texts = zip(*docs)
        X = self._job_vectorizer.fit_transform(texts)
        self._nn.fit(X)

        q = self._profile_text(student_profile)
        if not q.strip():
            # Return arbitrary top N
            return [
                {"id": int(jobs[i].id), "title": jobs[i].title, "score": 0.0}
                for i in range(min(top_n, len(jobs)))
            ]
        q_vec = self._job_vectorizer.transform([q])
        distances, indices = self._nn.kneighbors(q_vec, n_neighbors=min(top_n, len(jobs)))
        results: list[dict[str, Any]] = []
        for d, idx in zip(distances[0], indices[0]):
            job_id = int(ids[idx])
            job = db.session.get(JobPosting, job_id)
            results.append({"id": job.id, "title": job.title, "score": float(1 - d)})
        return results
