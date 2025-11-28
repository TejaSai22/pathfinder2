# Pathfinder v2 - IT Career Matching Platform

## Overview
Pathfinder v2 is a specialized, real-time IT career matching platform that connects students, employers, and advisors. The system uses a weighted matching algorithm prioritizing technical IT skills (2x weight) over soft skills.

## Current State
- **Status**: Production-ready, single unified service
- **Last Updated**: November 28, 2025
- **Architecture**: Monolithic deployment (FastAPI serves both API and built frontend)

## Architecture

### Unified Backend (FastAPI + PostgreSQL)
- **Framework**: FastAPI with async SQLAlchemy 2.0
- **Database**: PostgreSQL with asyncpg driver
- **Authentication**: JWT tokens in HttpOnly cookies
- **Port**: 5000 (serves both API and static frontend)
- **Frontend Build**: Pre-built React app served via FastAPI static files

### Frontend (React + TypeScript - Built)
- **Framework**: React 18 with Vite (production build)
- **Styling**: Tailwind CSS + ShadCN UI
- **State Management**: TanStack Query for real-time updates
- **Build Output**: `frontend/dist/` served by FastAPI

### Key Features
1. **Weighted Matching Algorithm**: Technical IT skills get 2x weight vs soft skills
2. **O*NET Integration**: Filters exclusively to IT occupations (SOC Code 15-)
3. **Role-Based Dashboards**: Student, Employer, Advisor views with shared components
4. **Real-Time Updates**: TanStack Query for instant cache invalidation
5. **Skill Gap Analysis**: Radar chart visualization of skill gaps

### New Features (Iteration 1 Enhancements)
6. **In-App Notifications**: Real-time notification system with unread count, mark as read, and notification types (application status, interview, match, feedback)
7. **Profile Completion Tracking**: Progress indicator with 80% gate for job recommendations, shows missing fields
8. **Job Deadlines**: Application deadlines displayed on job cards with color-coded urgency
9. **Employer Feedback**: Feedback notes visible to students in their applications view with dialog modal for employers
10. **Career Details**: O*NET career information with salary ranges, growth outlook, and education requirements
11. **Learning Resources**: Course recommendations linked to specific skills for skill gap remediation, shown when selecting jobs with skill gaps
12. **Skill Proficiency Ratings**: 1-5 star rating system for user skills, affects matching algorithm
13. **Resume Upload**: Document upload/download functionality with file storage in backend/uploads directory

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── database.py          # Async SQLAlchemy setup
│   ├── models.py            # SQLAlchemy models (User, Job, Application, Notification, CareerDetail, LearningResource)
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # JWT authentication
│   ├── seed.py              # Database seed data
│   ├── services/
│   │   ├── ml_service.py         # Weighted matching algorithm
│   │   ├── onet_ingest.py        # O*NET data ingestion
│   │   └── notification_service.py  # Notification creation
│   └── routers/
│       ├── applications.py  # Application endpoints with feedback
│       ├── notifications.py # Notification endpoints
│       ├── careers.py       # Career details and learning resources
│       └── ...              # Other routers

frontend/
├── src/
│   ├── App.tsx              # Main application
│   ├── components/
│   │   ├── Layout.tsx       # Main layout with notifications
│   │   └── shared/          # Shared UI components
│   │       ├── EntityCard.tsx           # Job/applicant cards with deadlines
│   │       ├── SkillGapChart.tsx        # Radar chart
│   │       ├── NotificationsDropdown.tsx # Notifications panel
│   │       └── ProfileCompletionCard.tsx # Profile progress indicator
│   ├── pages/               # Role-based dashboards
│   ├── hooks/               # Custom React hooks
│   └── lib/api.ts           # API client with all endpoints
```

## Running the Application

### Development/Production
Single unified workflow serves everything:
- **Backend API**: `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload`

### Rebuilding Frontend
If you make frontend changes, rebuild with:
```bash
cd frontend && npm run build
```
The FastAPI server will automatically serve the updated build from `frontend/dist/`.

### Demo Accounts
Password for all demo accounts: `demo123`
- Student: student@demo.com
- Employer: employer@demo.com
- Advisor: advisor@demo.com

## Technical Decisions

1. **Async Database**: Using async SQLAlchemy 2.0 with asyncpg for non-blocking database operations
2. **SSL Handling**: Custom SSL context configuration for asyncpg PostgreSQL connections
3. **Unified UI**: All three user roles share common components (EntityCard, SkillGapChart)
4. **No Kanban**: Design choice to use list/card views instead of Kanban boards

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured)
- `SESSION_SECRET`: JWT signing key

## Dependencies

### Backend (Python)
- FastAPI, SQLAlchemy 2.0, asyncpg
- python-jose (JWT), passlib (password hashing)
- pydantic, email-validator

### Frontend (Node.js)
- React 18, TypeScript, Vite
- TanStack Query, React Router
- Tailwind CSS, ShadCN UI, Recharts
