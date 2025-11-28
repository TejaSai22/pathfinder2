# Pathfinder v2 - IT Career Matching Platform

A specialized, real-time IT career matching platform for UNT College of Information that connects students, employers, and advisors using intelligent skill-based matching algorithms.

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [Feature Documentation](#feature-documentation)
- [API Endpoints](#api-endpoints)
- [Technical Stack](#technical-stack)

---

## Overview

Pathfinder v2 is a comprehensive career matching platform designed specifically for IT professionals. The system uses a weighted Jaccard Similarity algorithm that prioritizes technical IT skills (2x weight) over soft skills, integrates with O*NET database (SOC Code 15- for IT occupations only), and provides role-specific dashboards for students, employers, and academic advisors.

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.com | demo123 |
| Employer | employer@demo.com | demo123 |
| Advisor | advisor@demo.com | demo123 |

---

## Key Features

### Core Platform Features

#### 1. Weighted Matching Algorithm
- Technical IT skills receive **2x weight** compared to soft skills
- Real-time match score calculation (0-100%)
- Skill gap analysis with visual radar charts
- O*NET integration filtering to IT occupations only (SOC Code 15-)

#### 2. Role-Based Dashboards
- **Student Dashboard**: Job discovery, applications, skill management
- **Employer Dashboard**: Job posting, applicant review, interview scheduling
- **Advisor Dashboard**: Student monitoring, guidance notes, analytics

#### 3. Real-Time Updates
- TanStack Query for instant cache invalidation
- Live notification updates
- Immediate match score recalculation

---

### Iteration 1 Features

#### 4. In-App Notifications
- Real-time notification bell with unread count
- Notification types: application status, interview, match alerts, feedback
- Mark individual or all notifications as read
- Notification dropdown accessible from main layout

#### 5. Profile Completion Tracking
- Visual progress indicator showing completion percentage
- **80% gate** for job recommendations - students must complete profile to see matched jobs
- Clear indication of missing profile fields
- Encourages complete profile for better matching

#### 6. Job Deadlines
- Application deadlines displayed on all job cards
- Color-coded urgency indicators:
  - Red: Deadline within 3 days
  - Yellow: Deadline within 7 days
  - Default: More than 7 days remaining
- Automatic validation preventing applications after deadline

#### 7. Employer Feedback System
- Employers can add feedback notes when updating application status
- Feedback visible to students in their applications view
- Dialog modal for composing feedback with status updates
- Timestamped feedback with employer attribution

#### 8. Career Details (O*NET Integration)
- Detailed career information including:
  - Median salary ranges
  - Job growth outlook
  - Education requirements
  - Related occupations
- Linked to IT occupations via SOC codes

#### 9. Learning Resources
- Course recommendations linked to specific skills
- Displayed when viewing jobs with skill gaps
- Metadata includes:
  - Course title and provider
  - Duration and difficulty level
  - Free/Paid badge
  - Direct links to learning platforms

#### 10. Skill Proficiency Ratings
- 1-5 star rating system for user skills
- Visual star display on skill badges
- Proficiency levels affect matching algorithm weighting
- Students can update ratings from profile

#### 11. Resume Upload
- Document upload/download functionality
- Supported formats: PDF, DOC, DOCX
- Secure file storage in backend/uploads directory
- Resume link visible to employers on applications

---

### Iteration 2 Features

#### 12. Interview Scheduling System
Complete interview management with:

**Scheduling Options:**
- Date and time picker
- Duration selection (30min, 45min, 1hr, 1.5hr, 2hr)
- Interview type selection:
  - Video Call (with meeting link field)
  - Phone Call
  - In-Person (with location field)
- Optional notes for candidates

**Interview Status Tracking:**
- `scheduled` - Initial state when created
- `confirmed` - Student has confirmed attendance
- `rescheduled` - Date/time has been changed
- `completed` - Interview finished
- `cancelled` - Interview cancelled

**Interview Page Features:**
- Separate page showing all interviews
- Divided into Upcoming and Past sections
- Quick actions: Confirm, Reschedule, Cancel, Complete
- Color-coded status badges

#### 13. Advanced Filtering & Search
Server-side job filtering with multiple criteria:

| Filter | Description |
|--------|-------------|
| Search | Text search across job title and description |
| Location | Filter by city or "Remote" |
| Salary Range | Minimum and maximum salary filters |
| Experience Level | Entry, Junior, Mid, Senior, Lead |
| Job Type | Full-time, Part-time, Contract, Internship |
| Match Score | Minimum match percentage threshold |

**Sorting Options:**
- By creation date (newest/oldest)
- By match score (highest/lowest)
- By salary (highest/lowest)

#### 14. Analytics Dashboard for Advisors
Comprehensive analytics accessible via "Analytics" tab:

**Overview Statistics:**
- Total assigned students
- Total applications submitted
- Total offers received
- Placement rate percentage

**Visual Charts:**
- **Skill Demand Chart**: Horizontal bar chart showing most requested skills
  - Color-coded: Blue for technical, Green for soft skills
- **Application Status Distribution**: Pie chart showing status breakdown
  - Pending, Reviewing, Interview, Accepted, Rejected

**Performance Tables:**
- **Student Performance**: Ranked list showing:
  - Student name and email
  - Number of applications
  - Average match score
- **Top Employers**: Ranked list showing:
  - Company name
  - Number of job postings
  - Total applications received

#### 15. Bulk Actions for Employers
Multi-select functionality for efficient application management:

**Selection Features:**
- Individual checkbox selection on each applicant card
- "Select All" / "Deselect All" button
- Visual indicator showing number of selected applications

**Bulk Action Toolbar (appears when selections active):**
- **Mark as Reviewing**: Set all selected to "reviewing" status
- **Accept All**: Accept all selected applications
- **Reject All**: Reject all selected applications
- **Clear Selection**: Deselect all

**Confirmation Dialog:**
- Shows count of affected applications
- Optional feedback notes field (applies to all)
- Feedback visible to all affected applicants

**Safety Features:**
- Transactional updates (all succeed or all fail)
- Proper error handling with specific messages
- 404 for not found applications
- 403 for unauthorized applications
- Automatic rollback on any failure

---

## Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Server (Port 5000)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   API Routes │  │ Static Files │  │   Auth/JWT   │       │
│  │   /api/*     │  │   /assets/*  │  │   Cookies    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                   Services Layer                             │
│  ┌────────────┐ ┌────────────────┐ ┌───────────────────┐    │
│  │ ML Service │ │ Notification   │ │ O*NET Integration │    │
│  │ (Matching) │ │ Service        │ │                   │    │
│  └────────────┘ └────────────────┘ └───────────────────┘    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│              Async SQLAlchemy 2.0 + asyncpg                  │
│                                                              │
│                    PostgreSQL Database                       │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure
```
pathfinder-v2/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── database.py          # Async SQLAlchemy configuration
│   │   ├── models.py            # Database models
│   │   ├── schemas.py           # Pydantic validation schemas
│   │   ├── auth.py              # JWT authentication
│   │   ├── seed.py              # Demo data seeding
│   │   ├── services/
│   │   │   ├── ml_service.py          # Weighted matching algorithm
│   │   │   ├── onet_ingest.py         # O*NET data ingestion
│   │   │   └── notification_service.py # Notification creation
│   │   └── routers/
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── users.py         # User management
│   │       ├── jobs.py          # Job CRUD + filtering
│   │       ├── applications.py  # Applications + bulk actions
│   │       ├── skills.py        # Skill management
│   │       ├── notes.py         # Advisor notes
│   │       ├── notifications.py # Notification endpoints
│   │       ├── careers.py       # Career details + learning resources
│   │       ├── interviews.py    # Interview scheduling
│   │       └── analytics.py     # Advisor analytics
│   └── uploads/                 # Resume file storage
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main React application
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Main layout with navigation
│   │   │   └── shared/          # Reusable components
│   │   │       ├── EntityCard.tsx
│   │   │       ├── SkillGapChart.tsx
│   │   │       ├── NotificationsDropdown.tsx
│   │   │       └── ProfileCompletionCard.tsx
│   │   ├── pages/
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── EmployerDashboard.tsx
│   │   │   ├── AdvisorDashboard.tsx
│   │   │   ├── InterviewsPage.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useAuth.ts       # Authentication hook
│   │   │   └── useRealTime.ts   # TanStack Query hooks
│   │   └── lib/
│   │       ├── api.ts           # API client
│   │       └── utils.ts         # Utility functions
│   └── dist/                    # Production build (served by FastAPI)
│
├── replit.md                    # Project documentation
└── README.md                    # This file
```

---

## Getting Started

### Running the Application
The application runs as a single unified service:

```bash
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

### Rebuilding Frontend
After making frontend changes:

```bash
cd frontend && npm run build
```

The FastAPI server automatically serves the built frontend from `frontend/dist/`.

---

## User Roles

### Student
- View matched job listings with skill gap analysis
- Apply to jobs with cover letters
- Manage profile and skills with proficiency ratings
- Upload resume
- View application status and employer feedback
- Manage interview schedule
- Access learning resources for skill gaps

### Employer
- Post and manage job listings
- Set application deadlines
- Review applications with match scores
- Schedule interviews with candidates
- Provide feedback on applications
- Use bulk actions for efficient processing
- View applicant skill analysis

### Advisor
- Monitor assigned students
- View student applications and progress
- Add guidance notes
- Access comprehensive analytics dashboard
- Track placement rates and trends
- Identify in-demand skills

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout |
| GET | /api/auth/me | Get current user |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/jobs | List jobs with filtering |
| GET | /api/jobs/{id} | Get job details |
| POST | /api/jobs | Create job (employer) |
| PUT | /api/jobs/{id} | Update job |
| DELETE | /api/jobs/{id} | Delete job |
| GET | /api/jobs/{id}/skill-gap | Get skill gap analysis |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/applications/my-applications | Get user's applications |
| POST | /api/applications | Submit application |
| GET | /api/applications/job/{job_id} | Get job applications (employer) |
| PUT | /api/applications/{id}/status | Update status with feedback |
| PUT | /api/applications/bulk-update | Bulk update applications |

### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/interviews | List all interviews |
| POST | /api/interviews | Schedule interview |
| PATCH | /api/interviews/{id} | Update interview |
| DELETE | /api/interviews/{id} | Cancel interview |

### Analytics (Advisor Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/overview | Get overview statistics |
| GET | /api/analytics/skill-demand | Get skill demand data |
| GET | /api/analytics/application-trends | Get status distribution |
| GET | /api/analytics/student-performance | Get student rankings |
| GET | /api/analytics/top-employers | Get employer rankings |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | List notifications |
| GET | /api/notifications/unread-count | Get unread count |
| PUT | /api/notifications/{id}/read | Mark as read |
| PUT | /api/notifications/read-all | Mark all as read |

---

## Technical Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL with asyncpg driver
- **ORM**: SQLAlchemy 2.0 (async)
- **Authentication**: JWT tokens in HttpOnly cookies
- **Password Hashing**: passlib with bcrypt
- **Validation**: Pydantic v2

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + ShadCN UI
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Charts**: Recharts

### Key Dependencies
```
Backend:
- fastapi
- sqlalchemy[asyncio]
- asyncpg
- python-jose[cryptography]
- passlib[bcrypt]
- pydantic[email]

Frontend:
- react
- @tanstack/react-query
- recharts
- tailwindcss
- @radix-ui/react-*
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| SESSION_SECRET | JWT signing secret key |

---

## License

This project is developed for UNT College of Information.
