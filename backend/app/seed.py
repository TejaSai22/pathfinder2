from sqlalchemy import select, insert
from app.database import AsyncSessionLocal
from app.models import Skill, ONetOccupation, User, Profile, Job, UserRole, user_skills, job_skills, advisor_students, CareerDetail, LearningResource
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
            
            career_details = [
                CareerDetail(
                    soc_code="15-1252",
                    title="Software Developers",
                    description="Design, develop, and test software applications. Work with programming languages and development frameworks.",
                    median_salary=120730,
                    job_outlook="22% growth (much faster than average)",
                    education_required="Bachelor's degree in computer science or related field",
                    work_environment="Most work in offices or remotely. May work on teams with other developers.",
                    typical_duties="Write and test code, debug programs, collaborate with team members, review code, maintain software systems.",
                    career_progression="Junior Developer -> Mid-Level Developer -> Senior Developer -> Tech Lead -> Engineering Manager"
                ),
                CareerDetail(
                    soc_code="15-2051",
                    title="Data Scientists",
                    description="Use analytical techniques and scientific principles to extract insights from data.",
                    median_salary=103500,
                    job_outlook="35% growth (much faster than average)",
                    education_required="Master's degree preferred; Bachelor's in statistics, math, or computer science",
                    work_environment="Office settings, often work with cross-functional teams including business analysts and engineers.",
                    typical_duties="Collect and analyze data, build predictive models, create visualizations, present findings to stakeholders.",
                    career_progression="Data Analyst -> Data Scientist -> Senior Data Scientist -> Principal Data Scientist -> Chief Data Officer"
                ),
                CareerDetail(
                    soc_code="15-1254",
                    title="Web Developers",
                    description="Design and create websites. Responsible for the look and technical aspects of web applications.",
                    median_salary=78300,
                    job_outlook="23% growth (much faster than average)",
                    education_required="Associate's or Bachelor's degree in web development or related field",
                    work_environment="Office or remote work. May work as freelancers or in agencies.",
                    typical_duties="Design user interfaces, write frontend and backend code, ensure site performance, optimize for SEO.",
                    career_progression="Junior Web Developer -> Web Developer -> Senior Web Developer -> Full Stack Developer -> Technical Architect"
                ),
                CareerDetail(
                    soc_code="15-1212",
                    title="Information Security Analysts",
                    description="Plan and implement security measures to protect computer networks and systems.",
                    median_salary=112000,
                    job_outlook="32% growth (much faster than average)",
                    education_required="Bachelor's degree in cybersecurity, computer science, or related field",
                    work_environment="Work in offices or security operations centers. May respond to incidents 24/7.",
                    typical_duties="Monitor networks for breaches, install security software, conduct penetration testing, develop security policies.",
                    career_progression="Security Analyst -> Senior Security Analyst -> Security Engineer -> Security Architect -> CISO"
                )
            ]
            for career in career_details:
                db.add(career)
            
            await db.flush()
            
            learning_resources = [
                LearningResource(skill_id=skill_map.get("Python"), title="Python for Everybody", provider="Coursera", resource_type="course", url="https://www.coursera.org/specializations/python", is_free=False, estimated_hours=80),
                LearningResource(skill_id=skill_map.get("Python"), title="Learn Python - Codecademy", provider="Codecademy", resource_type="course", url="https://www.codecademy.com/learn/learn-python-3", is_free=True, estimated_hours=25),
                LearningResource(skill_id=skill_map.get("JavaScript"), title="JavaScript: The Complete Guide", provider="Udemy", resource_type="course", url="https://www.udemy.com/course/javascript-the-complete-guide-2020-beginner-advanced/", is_free=False, estimated_hours=52),
                LearningResource(skill_id=skill_map.get("JavaScript"), title="JavaScript.info Tutorial", provider="javascript.info", resource_type="tutorial", url="https://javascript.info/", is_free=True, estimated_hours=40),
                LearningResource(skill_id=skill_map.get("React"), title="React - The Complete Guide", provider="Udemy", resource_type="course", url="https://www.udemy.com/course/react-the-complete-guide-incl-redux/", is_free=False, estimated_hours=48),
                LearningResource(skill_id=skill_map.get("React"), title="React Official Tutorial", provider="React.dev", resource_type="tutorial", url="https://react.dev/learn", is_free=True, estimated_hours=10),
                LearningResource(skill_id=skill_map.get("SQL"), title="SQL for Data Science", provider="Coursera", resource_type="course", url="https://www.coursera.org/learn/sql-for-data-science", is_free=False, estimated_hours=20),
                LearningResource(skill_id=skill_map.get("Machine Learning"), title="Machine Learning by Andrew Ng", provider="Coursera", resource_type="course", url="https://www.coursera.org/learn/machine-learning", is_free=False, estimated_hours=60),
                LearningResource(skill_id=skill_map.get("Docker"), title="Docker for Beginners", provider="Docker Docs", resource_type="documentation", url="https://docs.docker.com/get-started/", is_free=True, estimated_hours=5),
                LearningResource(skill_id=skill_map.get("TypeScript"), title="TypeScript Handbook", provider="TypeScript Docs", resource_type="documentation", url="https://www.typescriptlang.org/docs/", is_free=True, estimated_hours=15),
            ]
            for resource in learning_resources:
                if resource.skill_id:
                    db.add(resource)
            
            await db.commit()
            print("Initial data seeded successfully!")
            
        except Exception as e:
            await db.rollback()
            print(f"Seed data already exists or error: {e}")
