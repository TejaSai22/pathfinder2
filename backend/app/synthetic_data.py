import random
from sqlalchemy import select, insert
from app.database import AsyncSessionLocal
from app.models import Skill, User, Profile, Job, UserRole, Application, Note, ApplicationStatus, user_skills, job_skills, advisor_students
from app.auth import get_password_hash

UNT_STUDENTS = [
    {
        "email": "maria.garcia@unt.edu",
        "first_name": "Maria",
        "last_name": "Garcia",
        "headline": "MS Data Science Candidate | UNT College of Information",
        "bio": "Graduate student in Data Science at UNT with a focus on machine learning and big data analytics. Previously worked as a data analyst at a healthcare startup.",
        "academic_background": "M.S. Data Science (In Progress), University of North Texas, 2025 | B.S. Mathematics, Texas State University, 2023",
        "location": "Denton, TX",
        "skills": ["Python", "SQL", "Machine Learning", "TensorFlow", "Data Analysis", "R", "Tableau", "Critical Thinking", "Problem Solving"]
    },
    {
        "email": "james.chen@unt.edu",
        "first_name": "James",
        "last_name": "Chen",
        "headline": "Information Science PhD Student | Human-Computer Interaction",
        "bio": "PhD candidate researching AI-driven user interfaces and accessibility in digital systems. Teaching assistant for undergraduate HCI courses.",
        "academic_background": "Ph.D. Information Science (In Progress), University of North Texas | M.S. Computer Science, UT Dallas, 2022",
        "location": "Denton, TX",
        "skills": ["Python", "JavaScript", "React", "User Research", "Data Analysis", "Machine Learning", "Communication", "Leadership", "Critical Thinking"]
    },
    {
        "email": "ashley.williams@unt.edu",
        "first_name": "Ashley",
        "last_name": "Williams",
        "headline": "MS Library Science | Digital Archives Specialist",
        "bio": "Passionate about preserving digital heritage and making information accessible. Interning at the UNT Digital Libraries.",
        "academic_background": "M.S. Library Science (In Progress), University of North Texas, 2025 | B.A. History, University of Oklahoma, 2022",
        "location": "Dallas, TX",
        "skills": ["SQL", "Data Analysis", "Project Management", "Communication", "Problem Solving", "Teamwork"]
    },
    {
        "email": "raj.patel@unt.edu",
        "first_name": "Raj",
        "last_name": "Patel",
        "headline": "MS Information Science | Cybersecurity Focus",
        "bio": "Graduate student specializing in information security and risk management. CompTIA Security+ certified with industry experience in IT support.",
        "academic_background": "M.S. Information Science (In Progress), University of North Texas, 2025 | B.S. IT, Texas Tech University, 2023",
        "location": "Fort Worth, TX",
        "skills": ["Python", "Linux", "Cybersecurity", "Network Security", "SQL", "Cloud Computing", "AWS", "Problem Solving", "Critical Thinking"]
    },
    {
        "email": "sofia.martinez@unt.edu",
        "first_name": "Sofia",
        "last_name": "Martinez",
        "headline": "Learning Technologies PhD | EdTech Researcher",
        "bio": "Researching adaptive learning systems and AI in education. Former K-12 teacher with 5 years of classroom experience.",
        "academic_background": "Ph.D. Learning Technologies (In Progress), University of North Texas | M.Ed. Educational Technology, UNT, 2021",
        "location": "Denton, TX",
        "skills": ["Python", "JavaScript", "Data Analysis", "Machine Learning", "User Research", "Communication", "Leadership", "Teamwork"]
    },
    {
        "email": "marcus.johnson@unt.edu",
        "first_name": "Marcus",
        "last_name": "Johnson",
        "headline": "MS Data Science | Business Analytics Track",
        "bio": "Data science graduate student with a background in finance. Building predictive models for financial markets.",
        "academic_background": "M.S. Data Science (In Progress), University of North Texas, 2025 | B.B.A. Finance, UNT, 2023",
        "location": "Plano, TX",
        "skills": ["Python", "SQL", "Machine Learning", "Data Analysis", "R", "Excel", "Tableau", "Communication", "Critical Thinking"]
    },
    {
        "email": "emily.nguyen@unt.edu",
        "first_name": "Emily",
        "last_name": "Nguyen",
        "headline": "BS Information Science Senior | UX Design Enthusiast",
        "bio": "Senior undergraduate student passionate about creating user-centered digital experiences. President of the UNT UX Club.",
        "academic_background": "B.S. Information Science (In Progress), University of North Texas, 2025",
        "location": "Denton, TX",
        "skills": ["JavaScript", "React", "HTML/CSS", "Figma", "User Research", "Communication", "Teamwork", "Problem Solving"]
    },
    {
        "email": "david.kim@unt.edu",
        "first_name": "David",
        "last_name": "Kim",
        "headline": "MS Information Science | Data Engineering Focus",
        "bio": "Building scalable data pipelines and ETL systems. AWS certified with experience in cloud data architecture.",
        "academic_background": "M.S. Information Science (In Progress), University of North Texas, 2025 | B.S. Computer Science, UT Arlington, 2022",
        "location": "Arlington, TX",
        "skills": ["Python", "SQL", "PostgreSQL", "AWS", "Docker", "Kubernetes", "Apache Spark", "Problem Solving", "Teamwork"]
    },
    {
        "email": "rachel.thompson@unt.edu",
        "first_name": "Rachel",
        "last_name": "Thompson",
        "headline": "MS Library Science | Health Informatics",
        "bio": "Combining library science with healthcare data management. Working on health literacy research projects.",
        "academic_background": "M.S. Library Science (In Progress), University of North Texas, 2025 | B.S. Biology, SMU, 2021",
        "location": "Dallas, TX",
        "skills": ["SQL", "Data Analysis", "Excel", "Project Management", "Communication", "Critical Thinking", "Teamwork"]
    },
    {
        "email": "kevin.brown@unt.edu",
        "first_name": "Kevin",
        "last_name": "Brown",
        "headline": "MS Data Science | Machine Learning Engineer",
        "bio": "Focused on deep learning and natural language processing. Building AI models for text analysis and sentiment detection.",
        "academic_background": "M.S. Data Science (In Progress), University of North Texas, 2025 | B.S. Computer Engineering, Texas A&M, 2023",
        "location": "Denton, TX",
        "skills": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "NLP", "SQL", "Problem Solving", "Critical Thinking"]
    },
    {
        "email": "jennifer.lee@unt.edu",
        "first_name": "Jennifer",
        "last_name": "Lee",
        "headline": "Information Science PhD | Knowledge Management",
        "bio": "Researching organizational knowledge systems and AI-assisted decision making in enterprises.",
        "academic_background": "Ph.D. Information Science (In Progress), University of North Texas | M.S. Information Systems, UT Dallas, 2020",
        "location": "Richardson, TX",
        "skills": ["Python", "SQL", "Data Analysis", "Machine Learning", "Project Management", "Communication", "Leadership", "Critical Thinking"]
    },
    {
        "email": "tyler.jackson@unt.edu",
        "first_name": "Tyler",
        "last_name": "Jackson",
        "headline": "BS Computer Science | Full Stack Developer",
        "bio": "Senior CS student at UNT with internship experience at local startups. Building web applications with modern frameworks.",
        "academic_background": "B.S. Computer Science (In Progress), University of North Texas, 2025",
        "location": "Denton, TX",
        "skills": ["JavaScript", "TypeScript", "React", "Node.js", "Python", "PostgreSQL", "Git", "Teamwork", "Problem Solving"]
    }
]

UNT_ADVISORS = [
    {
        "email": "dr.smith@unt.edu",
        "first_name": "Dr. Robert",
        "last_name": "Smith",
        "headline": "Associate Professor | Information Science | UNT College of Information",
        "bio": "20+ years of experience in information science research and industry consulting. Focus on data management and analytics. Former IBM researcher.",
        "location": "Denton, TX"
    },
    {
        "email": "dr.wilson@unt.edu",
        "first_name": "Dr. Patricia",
        "last_name": "Wilson",
        "headline": "Professor | Data Science | UNT College of Information",
        "bio": "Director of the UNT Data Science program. Research focus on machine learning applications in healthcare. Published 50+ peer-reviewed papers.",
        "location": "Denton, TX"
    },
    {
        "email": "dr.hernandez@unt.edu",
        "first_name": "Dr. Carlos",
        "last_name": "Hernandez",
        "headline": "Assistant Professor | Learning Technologies | UNT College of Information",
        "bio": "Researching AI in education and adaptive learning systems. Leading multiple NSF-funded projects on educational technology.",
        "location": "Denton, TX"
    },
    {
        "email": "dr.chang@unt.edu",
        "first_name": "Dr. Linda",
        "last_name": "Chang",
        "headline": "Career Services Director | UNT College of Information",
        "bio": "15 years in tech recruitment and career development. Helping COI students land their dream jobs in the DFW tech ecosystem.",
        "location": "Denton, TX"
    }
]

DFW_EMPLOYERS = [
    {
        "email": "hr@texastechsolutions.com",
        "first_name": "Sarah",
        "last_name": "Miller",
        "company_name": "Texas Tech Solutions",
        "company_description": "A leading DFW-based technology consulting firm specializing in enterprise software solutions, cloud migration, and digital transformation for Fortune 500 companies.",
        "location": "Dallas, TX",
        "jobs": [
            {
                "title": "Junior Data Analyst",
                "description": "Join our analytics team to help clients make data-driven decisions. You'll work with SQL, Python, and visualization tools to create actionable insights from complex datasets.",
                "location": "Dallas, TX (Hybrid)",
                "salary_min": 65000,
                "salary_max": 80000,
                "job_type": "Full-time",
                "experience_level": "Entry Level",
                "onet_soc_code": "15-2051",
                "skills": ["Python", "SQL", "Data Analysis", "Tableau", "Excel", "Communication"]
            },
            {
                "title": "Cloud Solutions Architect",
                "description": "Design and implement cloud infrastructure solutions on AWS and Azure for enterprise clients. Lead migration projects and optimize cloud costs.",
                "location": "Dallas, TX",
                "salary_min": 120000,
                "salary_max": 160000,
                "job_type": "Full-time",
                "experience_level": "Senior Level",
                "onet_soc_code": "15-1241",
                "skills": ["AWS", "Cloud Computing", "Docker", "Kubernetes", "Linux", "Problem Solving"]
            }
        ]
    },
    {
        "email": "careers@dfwanalytics.com",
        "first_name": "Michael",
        "last_name": "Roberts",
        "company_name": "DFW Analytics Group",
        "company_description": "A data science and AI consulting firm serving healthcare, finance, and retail industries in the Dallas-Fort Worth metroplex.",
        "location": "Fort Worth, TX",
        "jobs": [
            {
                "title": "Machine Learning Engineer",
                "description": "Build and deploy ML models for production systems. Work with TensorFlow, PyTorch, and cloud-based ML services to solve real-world problems.",
                "location": "Fort Worth, TX (Hybrid)",
                "salary_min": 100000,
                "salary_max": 140000,
                "job_type": "Full-time",
                "experience_level": "Mid Level",
                "onet_soc_code": "15-2051",
                "skills": ["Python", "Machine Learning", "TensorFlow", "PyTorch", "SQL", "Docker", "Critical Thinking"]
            },
            {
                "title": "Data Science Intern",
                "description": "Summer internship opportunity for graduate students. Work on real client projects involving predictive analytics and data visualization.",
                "location": "Fort Worth, TX",
                "salary_min": 25,
                "salary_max": 35,
                "job_type": "Internship",
                "experience_level": "Entry Level",
                "onet_soc_code": "15-2051",
                "skills": ["Python", "SQL", "Data Analysis", "Machine Learning", "Communication"]
            }
        ]
    },
    {
        "email": "jobs@northtexashealth.org",
        "first_name": "Jennifer",
        "last_name": "Adams",
        "company_name": "North Texas Health Systems",
        "company_description": "A major healthcare network serving the DFW region with 12 hospitals and 200+ clinics. Committed to leveraging technology for better patient outcomes.",
        "location": "Plano, TX",
        "jobs": [
            {
                "title": "Health Informatics Specialist",
                "description": "Manage and analyze health data systems to improve patient care quality. Work with EHR systems and ensure HIPAA compliance.",
                "location": "Plano, TX",
                "salary_min": 75000,
                "salary_max": 95000,
                "job_type": "Full-time",
                "experience_level": "Entry Level",
                "onet_soc_code": "15-1211",
                "skills": ["SQL", "Data Analysis", "Excel", "Project Management", "Communication", "Critical Thinking"]
            },
            {
                "title": "Clinical Data Analyst",
                "description": "Analyze clinical trial data and healthcare outcomes. Create dashboards and reports for medical staff and administrators.",
                "location": "Plano, TX (Hybrid)",
                "salary_min": 70000,
                "salary_max": 90000,
                "job_type": "Full-time",
                "experience_level": "Entry Level",
                "onet_soc_code": "15-2051",
                "skills": ["Python", "SQL", "Data Analysis", "R", "Tableau", "Communication"]
            }
        ]
    },
    {
        "email": "recruiting@innovateai.io",
        "first_name": "Alex",
        "last_name": "Turner",
        "company_name": "InnovateAI",
        "company_description": "An AI startup focused on natural language processing and conversational AI. Backed by prominent DFW venture capital firms.",
        "location": "Richardson, TX",
        "jobs": [
            {
                "title": "NLP Engineer",
                "description": "Build and improve our conversational AI platform. Work with transformers, BERT, and GPT models for text understanding and generation.",
                "location": "Richardson, TX (Hybrid)",
                "salary_min": 110000,
                "salary_max": 150000,
                "job_type": "Full-time",
                "experience_level": "Mid Level",
                "onet_soc_code": "15-2051",
                "skills": ["Python", "NLP", "Deep Learning", "TensorFlow", "PyTorch", "Machine Learning", "Problem Solving"]
            },
            {
                "title": "Full Stack Developer",
                "description": "Build the web interface for our AI products. Work with React, Node.js, and integrate with our ML backends.",
                "location": "Richardson, TX",
                "salary_min": 90000,
                "salary_max": 120000,
                "job_type": "Full-time",
                "experience_level": "Mid Level",
                "onet_soc_code": "15-1254",
                "skills": ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "REST APIs", "Teamwork"]
            }
        ]
    },
    {
        "email": "hr@dfwfintech.com",
        "first_name": "Robert",
        "last_name": "Chen",
        "company_name": "DFW FinTech Solutions",
        "company_description": "A financial technology company providing banking software and payment solutions to credit unions and regional banks across Texas.",
        "location": "Irving, TX",
        "jobs": [
            {
                "title": "Software Engineer",
                "description": "Develop secure banking applications using modern frameworks. Experience with financial systems and security best practices preferred.",
                "location": "Irving, TX",
                "salary_min": 85000,
                "salary_max": 115000,
                "job_type": "Full-time",
                "experience_level": "Entry Level",
                "onet_soc_code": "15-1252",
                "skills": ["Python", "JavaScript", "SQL", "PostgreSQL", "Git", "Cybersecurity", "Problem Solving"]
            },
            {
                "title": "Database Administrator",
                "description": "Manage and optimize our PostgreSQL and MongoDB databases. Ensure high availability and performance for critical financial systems.",
                "location": "Irving, TX",
                "salary_min": 95000,
                "salary_max": 130000,
                "job_type": "Full-time",
                "experience_level": "Mid Level",
                "onet_soc_code": "15-1242",
                "skills": ["PostgreSQL", "SQL", "Linux", "AWS", "Database Administration", "Problem Solving"]
            }
        ]
    },
    {
        "email": "careers@metrolibraries.org",
        "first_name": "Lisa",
        "last_name": "Washington",
        "company_name": "DFW Metropolitan Library System",
        "company_description": "The largest public library system in North Texas, serving 3 million residents with 40+ branch locations and extensive digital resources.",
        "location": "Dallas, TX",
        "jobs": [
            {
                "title": "Digital Services Librarian",
                "description": "Manage digital collections and online services. Help patrons access e-books, databases, and digital learning resources.",
                "location": "Dallas, TX",
                "salary_min": 55000,
                "salary_max": 70000,
                "job_type": "Full-time",
                "experience_level": "Entry Level",
                "onet_soc_code": "25-4022",
                "skills": ["Data Analysis", "Project Management", "Communication", "Problem Solving", "Teamwork"]
            },
            {
                "title": "Systems Librarian",
                "description": "Maintain and improve library management systems. Work with ILS platforms and develop automation solutions.",
                "location": "Dallas, TX",
                "salary_min": 65000,
                "salary_max": 85000,
                "job_type": "Full-time",
                "experience_level": "Mid Level",
                "onet_soc_code": "15-1211",
                "skills": ["SQL", "Python", "Linux", "Project Management", "Communication", "Problem Solving"]
            }
        ]
    }
]

async def seed_unt_synthetic_data():
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(Skill))
            skills = result.scalars().all()
            skill_map = {s.name: s.id for s in skills}
            
            if not skill_map:
                print("Error: Skills not found. Run initial seed first.")
                return
            
            result = await db.execute(
                select(User).where(User.email.like('%@unt.edu'))
            )
            if result.scalar_one_or_none():
                print("UNT synthetic data already exists!")
                return
            
            student_users = []
            for student_data in UNT_STUDENTS:
                user = User(
                    email=student_data["email"],
                    password_hash=get_password_hash("demo123"),
                    role=UserRole.STUDENT
                )
                db.add(user)
                await db.flush()
                
                profile = Profile(
                    user_id=user.id,
                    first_name=student_data["first_name"],
                    last_name=student_data["last_name"],
                    headline=student_data["headline"],
                    bio=student_data["bio"],
                    academic_background=student_data["academic_background"],
                    location=student_data["location"]
                )
                db.add(profile)
                
                for skill_name in student_data["skills"]:
                    if skill_name in skill_map:
                        await db.execute(
                            insert(user_skills).values(user_id=user.id, skill_id=skill_map[skill_name])
                        )
                
                student_users.append(user)
            
            print(f"Created {len(student_users)} UNT students")
            
            advisor_users = []
            for advisor_data in UNT_ADVISORS:
                user = User(
                    email=advisor_data["email"],
                    password_hash=get_password_hash("demo123"),
                    role=UserRole.ADVISOR
                )
                db.add(user)
                await db.flush()
                
                profile = Profile(
                    user_id=user.id,
                    first_name=advisor_data["first_name"],
                    last_name=advisor_data["last_name"],
                    headline=advisor_data["headline"],
                    bio=advisor_data["bio"],
                    location=advisor_data["location"]
                )
                db.add(profile)
                advisor_users.append(user)
            
            print(f"Created {len(advisor_users)} UNT advisors")
            
            for i, student in enumerate(student_users):
                advisor = advisor_users[i % len(advisor_users)]
                await db.execute(
                    insert(advisor_students).values(advisor_id=advisor.id, student_id=student.id)
                )
            
            all_jobs = []
            for employer_data in DFW_EMPLOYERS:
                user = User(
                    email=employer_data["email"],
                    password_hash=get_password_hash("demo123"),
                    role=UserRole.EMPLOYER
                )
                db.add(user)
                await db.flush()
                
                profile = Profile(
                    user_id=user.id,
                    first_name=employer_data["first_name"],
                    last_name=employer_data["last_name"],
                    company_name=employer_data["company_name"],
                    company_description=employer_data["company_description"],
                    location=employer_data["location"]
                )
                db.add(profile)
                
                for job_data in employer_data["jobs"]:
                    job = Job(
                        employer_id=user.id,
                        title=job_data["title"],
                        description=job_data["description"],
                        location=job_data["location"],
                        salary_min=job_data["salary_min"],
                        salary_max=job_data["salary_max"],
                        job_type=job_data["job_type"],
                        experience_level=job_data["experience_level"],
                        onet_soc_code=job_data["onet_soc_code"]
                    )
                    db.add(job)
                    await db.flush()
                    
                    for skill_name in job_data["skills"]:
                        if skill_name in skill_map:
                            await db.execute(
                                insert(job_skills).values(job_id=job.id, skill_id=skill_map[skill_name])
                            )
                    
                    all_jobs.append(job)
            
            print(f"Created {len(DFW_EMPLOYERS)} DFW employers with {len(all_jobs)} jobs")
            
            applications_created = 0
            for student in student_users[:6]:
                sample_jobs = random.sample(all_jobs, min(3, len(all_jobs)))
                for job in sample_jobs:
                    app = Application(
                        job_id=job.id,
                        applicant_id=student.id,
                        status=random.choice([
                            ApplicationStatus.PENDING,
                            ApplicationStatus.REVIEWED,
                            ApplicationStatus.INTERVIEW
                        ]),
                        cover_letter=f"I am excited to apply for the {job.title} position. As a student at UNT's College of Information, I have developed strong skills that align with this role.",
                        match_score=random.uniform(0.65, 0.95)
                    )
                    db.add(app)
                    applications_created += 1
            
            print(f"Created {applications_created} sample applications")
            
            notes_created = 0
            for i, student in enumerate(student_users[:8]):
                advisor = advisor_users[i % len(advisor_users)]
                note = Note(
                    advisor_id=advisor.id,
                    student_id=student.id,
                    content=f"Met with {student_users[i].email.split('@')[0].replace('.', ' ').title()} to discuss career goals. Strong technical skills, recommend focusing on interview preparation.",
                    note_type="meeting"
                )
                db.add(note)
                notes_created += 1
            
            print(f"Created {notes_created} advisor notes")
            
            await db.commit()
            print("\n=== UNT College of Information Synthetic Data Seeded Successfully! ===")
            print(f"Total: {len(student_users)} students, {len(advisor_users)} advisors, {len(DFW_EMPLOYERS)} employers, {len(all_jobs)} jobs")
            print("\nAll accounts use password: demo123")
            print("\nSample student accounts:")
            for s in UNT_STUDENTS[:3]:
                print(f"  - {s['email']}")
            print("\nSample advisor accounts:")
            for a in UNT_ADVISORS[:2]:
                print(f"  - {a['email']}")
            print("\nSample employer accounts:")
            for e in DFW_EMPLOYERS[:2]:
                print(f"  - {e['email']}")
                
        except Exception as e:
            await db.rollback()
            print(f"Error seeding UNT data: {e}")
            raise


async def run_synthetic_seed():
    await seed_unt_synthetic_data()


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_synthetic_seed())
