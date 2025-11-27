"""
O*NET Ingest Service: IT-Only Filter

This service handles ingestion of O*NET occupational data,
strictly filtering to only include IT/Computer occupations.

Rule: Only ingest occupations where SOC_Code starts with '15-'
(Computer and Mathematical Occupations).
"""

from typing import List, Dict, Optional
from dataclasses import dataclass


IT_SOC_PREFIX = "15-"

IT_OCCUPATIONS = [
    {"soc_code": "15-1211", "title": "Computer Systems Analysts", "description": "Analyze science, engineering, business, and other data processing problems to develop and implement solutions to complex applications problems, system administration issues, or network concerns."},
    {"soc_code": "15-1212", "title": "Information Security Analysts", "description": "Plan, implement, upgrade, or monitor security measures for the protection of computer networks and information."},
    {"soc_code": "15-1221", "title": "Computer and Information Research Scientists", "description": "Conduct research into fundamental computer and information science as theorists, designers, or inventors."},
    {"soc_code": "15-1231", "title": "Computer Network Support Specialists", "description": "Analyze, test, troubleshoot, and evaluate existing network systems, such as local area networks, wide area networks, cloud networks, and Internet systems."},
    {"soc_code": "15-1232", "title": "Computer User Support Specialists", "description": "Provide technical assistance to computer users. Answer questions or resolve computer problems for clients in person, via telephone, or electronically."},
    {"soc_code": "15-1241", "title": "Computer Network Architects", "description": "Design and implement computer and information networks, such as local area networks, wide area networks, intranets, extranets, and other data communications networks."},
    {"soc_code": "15-1242", "title": "Database Administrators", "description": "Administer, test, and implement computer databases, applying knowledge of database management systems."},
    {"soc_code": "15-1243", "title": "Database Architects", "description": "Design strategies for enterprise databases, data warehouse systems, and multidimensional networks."},
    {"soc_code": "15-1244", "title": "Network and Computer Systems Administrators", "description": "Install, configure, and maintain an organization's local area network, wide area network, data communications network, operating systems, and physical and virtual servers."},
    {"soc_code": "15-1251", "title": "Computer Programmers", "description": "Create, modify, and test the code and scripts that allow computer applications to run."},
    {"soc_code": "15-1252", "title": "Software Developers", "description": "Research, design, and develop computer and network software or specialized utility programs."},
    {"soc_code": "15-1253", "title": "Software Quality Assurance Analysts and Testers", "description": "Develop and execute software tests to identify software problems and their causes."},
    {"soc_code": "15-1254", "title": "Web Developers", "description": "Develop and implement websites, web applications, application databases, and interactive web interfaces."},
    {"soc_code": "15-1255", "title": "Web and Digital Interface Designers", "description": "Design digital user interfaces or websites. Develop and test layouts, interfaces, functionality, and navigation menus."},
    {"soc_code": "15-1299", "title": "Computer Occupations, All Other", "description": "All computer occupations not listed separately."},
    {"soc_code": "15-2011", "title": "Actuaries", "description": "Analyze statistical data, such as mortality, accident, sickness, disability, and retirement rates."},
    {"soc_code": "15-2021", "title": "Mathematicians", "description": "Conduct research in fundamental mathematics or in application of mathematical techniques to science, management, and other fields."},
    {"soc_code": "15-2031", "title": "Operations Research Analysts", "description": "Formulate and apply mathematical modeling and other optimizing methods to develop and interpret information."},
    {"soc_code": "15-2041", "title": "Statisticians", "description": "Develop or apply mathematical or statistical theory and methods to collect, organize, interpret, and summarize numerical data."},
    {"soc_code": "15-2051", "title": "Data Scientists", "description": "Develop and implement methods to analyze, visualize, and transform complex data sets into actionable insights."},
]

IT_SKILLS = [
    {"name": "Python", "is_technical": True, "category": "Programming Languages"},
    {"name": "JavaScript", "is_technical": True, "category": "Programming Languages"},
    {"name": "TypeScript", "is_technical": True, "category": "Programming Languages"},
    {"name": "Java", "is_technical": True, "category": "Programming Languages"},
    {"name": "C++", "is_technical": True, "category": "Programming Languages"},
    {"name": "C#", "is_technical": True, "category": "Programming Languages"},
    {"name": "Go", "is_technical": True, "category": "Programming Languages"},
    {"name": "Rust", "is_technical": True, "category": "Programming Languages"},
    {"name": "Ruby", "is_technical": True, "category": "Programming Languages"},
    {"name": "PHP", "is_technical": True, "category": "Programming Languages"},
    {"name": "Swift", "is_technical": True, "category": "Programming Languages"},
    {"name": "Kotlin", "is_technical": True, "category": "Programming Languages"},
    {"name": "SQL", "is_technical": True, "category": "Databases"},
    {"name": "PostgreSQL", "is_technical": True, "category": "Databases"},
    {"name": "MySQL", "is_technical": True, "category": "Databases"},
    {"name": "MongoDB", "is_technical": True, "category": "Databases"},
    {"name": "Redis", "is_technical": True, "category": "Databases"},
    {"name": "Elasticsearch", "is_technical": True, "category": "Databases"},
    {"name": "React", "is_technical": True, "category": "Frontend Frameworks"},
    {"name": "Vue.js", "is_technical": True, "category": "Frontend Frameworks"},
    {"name": "Angular", "is_technical": True, "category": "Frontend Frameworks"},
    {"name": "Next.js", "is_technical": True, "category": "Frontend Frameworks"},
    {"name": "Node.js", "is_technical": True, "category": "Backend Frameworks"},
    {"name": "Django", "is_technical": True, "category": "Backend Frameworks"},
    {"name": "FastAPI", "is_technical": True, "category": "Backend Frameworks"},
    {"name": "Spring Boot", "is_technical": True, "category": "Backend Frameworks"},
    {"name": "Express.js", "is_technical": True, "category": "Backend Frameworks"},
    {"name": "AWS", "is_technical": True, "category": "Cloud Platforms"},
    {"name": "Azure", "is_technical": True, "category": "Cloud Platforms"},
    {"name": "Google Cloud", "is_technical": True, "category": "Cloud Platforms"},
    {"name": "Docker", "is_technical": True, "category": "DevOps"},
    {"name": "Kubernetes", "is_technical": True, "category": "DevOps"},
    {"name": "CI/CD", "is_technical": True, "category": "DevOps"},
    {"name": "Git", "is_technical": True, "category": "Version Control"},
    {"name": "Linux", "is_technical": True, "category": "Operating Systems"},
    {"name": "Machine Learning", "is_technical": True, "category": "Data Science"},
    {"name": "Deep Learning", "is_technical": True, "category": "Data Science"},
    {"name": "TensorFlow", "is_technical": True, "category": "Data Science"},
    {"name": "PyTorch", "is_technical": True, "category": "Data Science"},
    {"name": "Data Analysis", "is_technical": True, "category": "Data Science"},
    {"name": "REST APIs", "is_technical": True, "category": "API Development"},
    {"name": "GraphQL", "is_technical": True, "category": "API Development"},
    {"name": "Microservices", "is_technical": True, "category": "Architecture"},
    {"name": "System Design", "is_technical": True, "category": "Architecture"},
    {"name": "Agile/Scrum", "is_technical": True, "category": "Methodologies"},
    {"name": "Cybersecurity", "is_technical": True, "category": "Security"},
    {"name": "Network Security", "is_technical": True, "category": "Security"},
    {"name": "Communication", "is_technical": False, "category": "Soft Skills"},
    {"name": "Teamwork", "is_technical": False, "category": "Soft Skills"},
    {"name": "Problem Solving", "is_technical": False, "category": "Soft Skills"},
    {"name": "Critical Thinking", "is_technical": False, "category": "Soft Skills"},
    {"name": "Leadership", "is_technical": False, "category": "Soft Skills"},
    {"name": "Time Management", "is_technical": False, "category": "Soft Skills"},
    {"name": "Adaptability", "is_technical": False, "category": "Soft Skills"},
    {"name": "Creativity", "is_technical": False, "category": "Soft Skills"},
    {"name": "Attention to Detail", "is_technical": False, "category": "Soft Skills"},
    {"name": "Project Management", "is_technical": False, "category": "Soft Skills"},
]


def is_it_occupation(soc_code: str) -> bool:
    """
    Check if an occupation SOC code is in the IT sector.
    
    Args:
        soc_code: The SOC code to check (e.g., "15-1252")
    
    Returns:
        True if the occupation is an IT occupation (starts with '15-')
    """
    return soc_code.startswith(IT_SOC_PREFIX)


def filter_it_occupations(occupations: List[Dict]) -> List[Dict]:
    """
    Filter a list of occupations to only include IT-related ones.
    
    Args:
        occupations: List of occupation dictionaries with 'soc_code' key
    
    Returns:
        Filtered list containing only IT occupations
    """
    return [occ for occ in occupations if is_it_occupation(occ.get("soc_code", ""))]


def get_default_it_occupations() -> List[Dict]:
    """
    Get the default list of IT occupations for initial database seeding.
    
    Returns:
        List of IT occupation dictionaries
    """
    return IT_OCCUPATIONS


def get_default_skills() -> List[Dict]:
    """
    Get the default list of IT skills for initial database seeding.
    
    Returns:
        List of skill dictionaries with name, is_technical, and category
    """
    return IT_SKILLS


def get_technical_skills() -> List[Dict]:
    """Get only technical skills."""
    return [s for s in IT_SKILLS if s["is_technical"]]


def get_soft_skills() -> List[Dict]:
    """Get only soft skills."""
    return [s for s in IT_SKILLS if not s["is_technical"]]


def get_skills_by_category(category: str) -> List[Dict]:
    """Get skills filtered by category."""
    return [s for s in IT_SKILLS if s.get("category") == category]


def get_skill_categories() -> List[str]:
    """Get unique skill categories."""
    return list(set(s.get("category", "Other") for s in IT_SKILLS))
