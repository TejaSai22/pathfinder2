"""
ML Service: Weighted Jaccard Similarity Algorithm (Benjamin Fix)

This module implements the weighted matching algorithm that ensures
IT/technical skills carry more weight than soft skills when calculating
match scores between candidates and job requirements.

Formula:
- Tech_Matches = (Matching Technical Skills) * 2
- Soft_Matches = (Matching Soft Skills) * 1
- Total_Score = (Tech_Matches + Soft_Matches) / (Total_Job_Weighted_Requirements)
"""

from typing import List, Dict, Set, Tuple
from dataclasses import dataclass


@dataclass
class SkillData:
    """Represents a skill with its technical classification."""
    id: int
    name: str
    is_technical: bool


@dataclass
class MatchResult:
    """Result of the weighted matching algorithm."""
    score: float
    matched_technical: List[str]
    matched_soft: List[str]
    missing_technical: List[str]
    missing_soft: List[str]
    technical_score: float
    soft_score: float


TECHNICAL_WEIGHT = 2.0
SOFT_WEIGHT = 1.0


def calculate_weighted_match(
    candidate_skills: List[SkillData],
    job_requirements: List[SkillData]
) -> MatchResult:
    """
    Calculate weighted Jaccard similarity between candidate skills and job requirements.
    
    Technical skills receive 2x weight compared to soft skills.
    This ensures IT-focused candidates get appropriately high scores.
    
    Args:
        candidate_skills: List of skills the candidate possesses
        job_requirements: List of skills required for the job
    
    Returns:
        MatchResult with detailed breakdown of match score
    """
    if not job_requirements:
        return MatchResult(
            score=0.0,
            matched_technical=[],
            matched_soft=[],
            missing_technical=[],
            missing_soft=[],
            technical_score=0.0,
            soft_score=0.0
        )
    
    candidate_skill_names = {s.name.lower() for s in candidate_skills}
    
    tech_requirements = [s for s in job_requirements if s.is_technical]
    soft_requirements = [s for s in job_requirements if not s.is_technical]
    
    matched_technical = []
    missing_technical = []
    for skill in tech_requirements:
        if skill.name.lower() in candidate_skill_names:
            matched_technical.append(skill.name)
        else:
            missing_technical.append(skill.name)
    
    matched_soft = []
    missing_soft = []
    for skill in soft_requirements:
        if skill.name.lower() in candidate_skill_names:
            matched_soft.append(skill.name)
        else:
            missing_soft.append(skill.name)
    
    tech_matches_weighted = len(matched_technical) * TECHNICAL_WEIGHT
    soft_matches_weighted = len(matched_soft) * SOFT_WEIGHT
    
    total_tech_required = len(tech_requirements) * TECHNICAL_WEIGHT
    total_soft_required = len(soft_requirements) * SOFT_WEIGHT
    total_weighted_requirements = total_tech_required + total_soft_required
    
    if total_weighted_requirements == 0:
        score = 0.0
    else:
        score = (tech_matches_weighted + soft_matches_weighted) / total_weighted_requirements
    
    technical_score = 0.0
    if len(tech_requirements) > 0:
        technical_score = len(matched_technical) / len(tech_requirements)
    
    soft_score = 0.0
    if len(soft_requirements) > 0:
        soft_score = len(matched_soft) / len(soft_requirements)
    
    return MatchResult(
        score=min(score, 1.0),
        matched_technical=matched_technical,
        matched_soft=matched_soft,
        missing_technical=missing_technical,
        missing_soft=missing_soft,
        technical_score=technical_score,
        soft_score=soft_score
    )


def calculate_batch_matches(
    candidate_skills: List[SkillData],
    jobs: List[Tuple[int, List[SkillData]]]
) -> Dict[int, MatchResult]:
    """
    Calculate match scores for a candidate against multiple jobs.
    
    Args:
        candidate_skills: List of skills the candidate possesses
        jobs: List of tuples (job_id, job_requirements)
    
    Returns:
        Dictionary mapping job_id to MatchResult
    """
    results = {}
    for job_id, requirements in jobs:
        results[job_id] = calculate_weighted_match(candidate_skills, requirements)
    return results


def get_skill_gap_analysis(
    candidate_skills: List[SkillData],
    job_requirements: List[SkillData]
) -> Dict:
    """
    Generate detailed skill gap analysis for radar chart visualization.
    
    Returns data structured for frontend radar charts showing
    "My Skills" vs "Job Requirements" comparison.
    """
    match_result = calculate_weighted_match(candidate_skills, job_requirements)
    
    all_skills = set()
    candidate_map = {s.name.lower(): s for s in candidate_skills}
    job_map = {s.name.lower(): s for s in job_requirements}
    all_skills.update(candidate_map.keys())
    all_skills.update(job_map.keys())
    
    radar_data = []
    for skill_name in sorted(all_skills):
        candidate_skill = candidate_map.get(skill_name)
        job_skill = job_map.get(skill_name)
        
        has_skill = 1 if candidate_skill else 0
        required = 1 if job_skill else 0
        is_technical = (candidate_skill and candidate_skill.is_technical) or \
                       (job_skill and job_skill.is_technical)
        
        display_name = skill_name.title()
        if candidate_skill:
            display_name = candidate_skill.name
        elif job_skill:
            display_name = job_skill.name
        
        radar_data.append({
            "skill": display_name,
            "candidate": has_skill,
            "required": required,
            "is_technical": is_technical,
            "matched": has_skill and required
        })
    
    return {
        "overall_score": round(match_result.score * 100, 1),
        "technical_score": round(match_result.technical_score * 100, 1),
        "soft_score": round(match_result.soft_score * 100, 1),
        "matched_technical": match_result.matched_technical,
        "matched_soft": match_result.matched_soft,
        "missing_technical": match_result.missing_technical,
        "missing_soft": match_result.missing_soft,
        "radar_data": radar_data
    }
