# Pathfinder v2 - IT Career Matching Platform

## Overview
Pathfinder v2 is a specialized, real-time IT career matching platform that connects students, employers, and advisors. The system uses a weighted matching algorithm prioritizing technical IT skills (2x weight) over soft skills.

## Current State
- **Status**: Development complete, both services running
- **Last Updated**: November 27, 2025

## Architecture

### Backend (FastAPI + PostgreSQL)
- **Framework**: FastAPI with async SQLAlchemy 2.0
- **Database**: PostgreSQL with asyncpg driver
- **Authentication**: JWT tokens in HttpOnly cookies
- **Port**: 8000

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS + ShadCN UI
- **State Management**: TanStack Query for real-time updates
- **Port**: 5000

### Key Features
1. **Weighted Matching Algorithm**: Technical IT skills get 2x weight vs soft skills
2. **O*NET Integration**: Filters exclusively to IT occupations (SOC Code 15-)
3. **Role-Based Dashboards**: Student, Employer, Advisor views with shared components
4. **Real-Time Updates**: TanStack Query for instant cache invalidation
5. **Skill Gap Analysis**: Radar chart visualization of skill gaps

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── database.py          # Async SQLAlchemy setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # JWT authentication
│   ├── services/
│   │   ├── ml_service.py    # Weighted matching algorithm
│   │   └── onet_ingest.py   # O*NET data ingestion
│   └── routers/             # API endpoints

frontend/
├── src/
│   ├── App.tsx              # Main application
│   ├── components/
│   │   └── shared/          # Shared UI components
│   │       ├── EntityCard.tsx
│   │       └── SkillGapChart.tsx
│   ├── pages/               # Role-based dashboards
│   ├── hooks/               # Custom React hooks
│   └── lib/api.ts           # API client
```

## Running the Application

### Development
Both services are configured as Replit workflows:
- **Backend API**: `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Frontend**: `cd frontend && npm run dev`

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
