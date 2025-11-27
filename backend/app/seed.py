from sqlalchemy import select, insert
from app.database import AsyncSessionLocal
from app.models import Skill, ONetOccupation, User, Profile, Job, UserRole, user_skills, job_skills, advisor_students
from app.services.onet_ingest import get_default_skills, get_default_it_occupations
from app.auth import get_password_hash


async def seed_initial_data():
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(Skill).limit(1))
            if result.scalar_one_or_none():
                return
            
            skills_data = get_default_skills()
            skill_map = {}
            for skill_data in skills_data:
                skill = Skill(
                    name=skill_data["name"],
                    is_technical=skill_data["is_technical"],
                    category=skill_data.get("category")
                )
                db.add(skill)
                await db.flush()
                skill_map[skill.name] = skill.id
            
            occupations_data = get_default_it_occupations()
            for occ_data in occupations_data:
                occupation = ONetOccupation(
                    soc_code=occ_data["soc_code"],
                    title=occ_data["title"],
                    description=occ_data.get("description")
                )
                db.add(occupation)
            
            demo_employer = User(
                email="employer@demo.com",
                password_hash=get_password_hash("demo123"),
                role=UserRole.EMPLOYER
            )
            db.add(demo_employer)
            await db.flush()
            
            employer_profile = Profile(
                user_id=demo_employer.id,
                first_name="Tech",
                last_name="Corp",
                company_name="TechCorp Inc.",
                company_description="A leading technology company focused on innovative software solutions.",
                location="San Francisco, CA"
            )
            db.add(employer_profile)
            
            demo_student = User(
                email="student@demo.com",
                password_hash=get_password_hash("demo123"),
                role=UserRole.STUDENT
            )
            db.add(demo_student)
            await db.flush()
            
            student_profile = Profile(
                user_id=demo_student.id,
                first_name="Alex",
                last_name="Johnson",
                headline="Computer Science Graduate | Aspiring Software Developer",
                bio="Recent CS graduate passionate about building scalable web applications.",
                academic_background="B.S. Computer Science, Stanford University, 2024",
                location="Palo Alto, CA"
            )
            db.add(student_profile)
            
            student_skills = ["Python", "JavaScript", "React", "SQL", "Git", "Problem Solving", "Teamwork"]
            for skill_name in student_skills:
                if skill_name in skill_map:
                    await db.execute(
                        insert(user_skills).values(user_id=demo_student.id, skill_id=skill_map[skill_name])
                    )
            
            demo_advisor = User(
                email="advisor@demo.com",
                password_hash=get_password_hash("demo123"),
                role=UserRole.ADVISOR
            )
            db.add(demo_advisor)
            await db.flush()
            
            advisor_profile = Profile(
                user_id=demo_advisor.id,
                first_name="Dr. Sarah",
                last_name="Mitchell",
                headline="Career Advisor | 15+ Years in Tech Recruitment",
                bio="Helping IT professionals find their dream careers.",
                location="New York, NY"
            )
            db.add(advisor_profile)
            
            await db.execute(
                insert(advisor_students).values(advisor_id=demo_advisor.id, student_id=demo_student.id)
            )
            
            job1 = Job(
                employer_id=demo_employer.id,
                title="Junior Software Developer",
                description="We are looking for a motivated Junior Software Developer to join our growing team. You will work on building web applications using modern technologies.",
                location="San Francisco, CA (Hybrid)",
                salary_min=80000,
                salary_max=100000,
                job_type="Full-time",
                experience_level="Entry Level",
                onet_soc_code="15-1252"
            )
            db.add(job1)
            await db.flush()
            
            job1_skills = ["Python", "JavaScript", "React", "SQL", "Git", "Communication", "Problem Solving"]
            for skill_name in job1_skills:
                if skill_name in skill_map:
                    await db.execute(
                        insert(job_skills).values(job_id=job1.id, skill_id=skill_map[skill_name])
                    )
            
            job2 = Job(
                employer_id=demo_employer.id,
                title="Data Scientist",
                description="Join our data team to build ML models and derive insights from large datasets.",
                location="Remote",
                salary_min=120000,
                salary_max=160000,
                job_type="Full-time",
                experience_level="Mid Level",
                onet_soc_code="15-2051"
            )
            db.add(job2)
            await db.flush()
            
            job2_skills = ["Python", "SQL", "Machine Learning", "TensorFlow", "Data Analysis", "Critical Thinking"]
            for skill_name in job2_skills:
                if skill_name in skill_map:
                    await db.execute(
                        insert(job_skills).values(job_id=job2.id, skill_id=skill_map[skill_name])
                    )
            
            job3 = Job(
                employer_id=demo_employer.id,
                title="Full Stack Engineer",
                description="Build end-to-end features for our flagship product using React and Node.js.",
                location="Austin, TX",
                salary_min=100000,
                salary_max=140000,
                job_type="Full-time",
                experience_level="Mid Level",
                onet_soc_code="15-1254"
            )
            db.add(job3)
            await db.flush()
            
            job3_skills = ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "REST APIs"]
            for skill_name in job3_skills:
                if skill_name in skill_map:
                    await db.execute(
                        insert(job_skills).values(job_id=job3.id, skill_id=skill_map[skill_name])
                    )
            
            await db.commit()
            print("Initial data seeded successfully!")
            
        except Exception as e:
            await db.rollback()
            print(f"Seed data already exists or error: {e}")
