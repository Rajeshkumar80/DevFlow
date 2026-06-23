# DevFlow — AI-Powered Code Review Platform

A modern code review platform with AI-powered analysis, real-time pair programming, team analytics, and skill tracking.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query, Recharts, Socket.IO, Framer Motion |
| **Backend** | Node.js, Express, TypeScript, PostgreSQL, Redis, Socket.IO, Bull Queue, Winston |
| **AI** | Claude API (optional — mock analysis works without it) |
| **Infra** | Docker Compose (PostgreSQL 15 + Redis 7) |

## Quick Start

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Backend
cd backend
npm install
npm run dev        # → http://localhost:5000

# 3. Frontend
cd frontend
npm install
npm run dev        # → http://localhost:3000
```

## Demo Account

| Field | Value |
|---|---|
| **Email** | `demo@devflow.ai` |
| **Password** | `demo123` |

The backend runs with an in-memory mock database, so no PostgreSQL setup is required for evaluation.

## Project Structure

```
DevFlow/
├── backend/           # Express API server
│   └── src/
│       ├── db/        # Schema, migrations, seed data
│       ├── middleware/ # Auth JWT, error handling
│       ├── routes/    # REST API endpoints
│       ├── services/  # Business logic
│       ├── types/     # TypeScript interfaces
│       └── utils/     # Logger
├── frontend/          # React SPA
│   └── src/
│       ├── components/ # Pages & shared components
│       ├── services/   # API clients & socket helpers
│       ├── store/      # Zustand state management
│       ├── types/      # TypeScript types
│       └── styles/     # Tailwind CSS
├── docs/
├── docker-compose.yml
└── README.md
```

## Features

- **AI Code Analysis** — Automated review using Claude AI or built-in mock analyzer
- **Real-Time Pair Programming** — Live sync'd code editor with chat & terminal
- **Team Analytics** — Interactive charts for review velocity, scores, and activity
- **Developer Growth** — Skill tracking and AI-recommended learning paths
- **Notifications** — Real-time alerts for reviews, comments, and updates

## API Endpoints

### Auth
`POST /api/v1/auth/register` · `POST /api/v1/auth/login` · `POST /api/v1/auth/refresh`

### Reviews
`POST /api/v1/reviews/:repoId` · `GET /api/v1/reviews/:repoId` · `GET /api/v1/reviews/:repoId/:reviewId`  
`PATCH /api/v1/reviews/:repoId/:reviewId/status` · `DELETE /api/v1/reviews/:repoId/:reviewId`

### Comments
`POST /:reviewId/comments` · `GET /:reviewId/comments` · `PATCH /:reviewId/comments/:commentId/resolve`

### Analysis
`POST /:reviewId/analyze` · `POST /:reviewId/batch-analyze` · `GET /:reviewId/issues`

### Notifications
`GET /api/v1/notifications` · `PATCH /api/v1/notifications/:id/read` · `PATCH /api/v1/notifications/read-all`

### Analytics
`GET /api/v1/analytics/team/:teamId` · `GET /api/v1/analytics/developer/:userId` · `GET /api/v1/analytics/repository/:repoId`

### Repositories
`POST /api/v1/repositories` · `GET /api/v1/repositories/:orgId`

## Scripts

### Backend
| Script | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run migrate` | Run DB migrations |
| `npm run seed` | Seed sample data |
| `npm test` | Run tests |

### Frontend
| Script | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Environment

Backend config via `.env`:
```
PORT=5000
DATABASE_URL=postgresql://devflow_user:dev_password_123@localhost:5432/devflow_dev
JWT_SECRET=devflow-super-secret-key
ANTHROPIC_API_KEY=  # Optional — for real AI analysis
```