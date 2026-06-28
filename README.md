# DevFlow — AI-Powered Code Review Platform

A modern code review platform with AI-powered analysis, real-time pair programming, team analytics, and skill tracking. Built with React + Express + SQLite + OpenRouter AI.

## Demo

- **Email:** `demo@devflow.ai`
- **Password:** `demo123`

One-click login from the login page — no setup required.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Recharts, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, SQLite, JWT Auth, Socket.IO |
| **AI** | OpenRouter API (falls back to pattern-based analysis if key is missing or credits are low) |

**No Docker, no PostgreSQL, no Redis required.** SQLite runs as a single file (`backend/prisma/devflow.db`).

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Rajeshkumar80/DevFlow.git
cd DevFlow

# 2. Backend
cd backend
npm install
npx prisma generate
npm run dev          # → http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev          # → http://localhost:3000
```

Open http://localhost:3000 and log in with the demo account.

## Project Structure

```
DevFlow/
├── backend/
│   └── src/
│       ├── db/              # Prisma client singleton
│       ├── generated/       # Generated Prisma client (Prisma 6)
│       ├── middleware/       # JWT auth, error handler, rate limiting
│       ├── routes/          # REST API endpoints (16 routes)
│       ├── services/        # Business logic (AuthService, ReviewService, etc.)
│       ├── types/           # TypeScript interfaces
│       └── utils/           # Logger
│   └── prisma/
│       ├── schema.prisma    # Database schema (11 models)
│       └── devflow.db       # SQLite database (auto-created)
├── frontend/
│   └── src/
│       ├── components/      # Pages & UI components
│       │   ├── auth/        # Login, Register
│       │   ├── dashboard/   # Main dashboard
│       │   ├── review/      # Reviews list, detail, approve/reject
│       │   ├── analytics/   # Charts, Pulse Calendar, tooltips
│       │   ├── settings/    # Profile, API Keys, Team, Notifications, Security
│       │   ├── pair/        # Real-time pair programming session
│       │   └── learning/    # Skill tracking & learning paths
│       ├── services/        # Axios API client, auth API
│       ├── store/           # Zustand auth store (user state in localStorage)
│       ├── types/           # TypeScript types
│       └── styles/          # Tailwind CSS
└── README.md
```

## Features

### AI Code Analysis
- Submit code for automated review via OpenRouter AI
- Real AI scoring: performance, security, maintainability, readability, testability
- Falls back to pattern-based analysis if AI is unavailable
- Configure API key and model in Settings > API Keys

### Code Reviews
- Create, list, filter, and sort reviews
- Approve / Request Changes / Reject with comments
- Priority levels: critical, high, medium, low
- Status tracking: open, in_progress, approved, changes_requested, rejected

### Real-Time Pair Programming
- Live code editing with sync
- Built-in chat and terminal
- Session history

### Team Analytics
- AI Scores Trend (line chart with hover tooltips)
- Severity Distribution (bar chart with hover tooltips)
- Review Velocity (weekly line chart with hover tooltips)
- Top Contributors (bar chart with hover tooltips)
- Pulse Calendar — contribution dot matrix (replaces GitHub heatmap)

### Settings (6 tabs)
- **Profile** — Edit name, email, bio
- **API Keys** — Configure OpenRouter API key with validation
- **Team** — Invite/remove team members
- **Notifications** — Configure alert preferences
- **Security** — Change password, manage sessions
- **Integrations** — GitHub, Slack, Jira connections

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Login (sets httpOnly cookies) |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Logout (clears cookies) |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/reviews/:repoId` | Create review |
| `GET` | `/api/v1/reviews/:repoId` | List reviews |
| `GET` | `/api/v1/reviews/:repoId/:reviewId` | Get review |
| `PATCH` | `/api/v1/reviews/:repoId/:reviewId/status` | Update status |
| `DELETE` | `/api/v1/reviews/:repoId/:reviewId` | Delete review (owner only) |

### Analysis
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/:reviewId/analyze` | Run AI analysis |
| `POST` | `/api/v1/:reviewId/batch-analyze` | Batch analysis |
| `GET` | `/api/v1/:reviewId/issues` | Get issues |

### Comments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/:reviewId/comments` | Add comment (HTML sanitized) |
| `GET` | `/api/v1/:reviewId/comments` | Get comments |
| `PATCH` | `/api/v1/:reviewId/comments/:commentId/resolve` | Resolve comment |
| `DELETE` | `/api/v1/:reviewId/comments/:commentId` | Delete comment |

### Other
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/notifications` | List notifications |
| `GET` | `/api/v1/analytics/team/:teamId` | Team analytics |
| `GET` | `/api/v1/analytics/developer/:userId` | Developer analytics |
| `POST` | `/api/v1/repositories` | Create repository |
| `GET` | `/api/v1/settings` | Get settings |
| `POST` | `/api/v1/settings` | Update settings |

## Security

All 12 vulnerabilities identified and fixed:

| # | Vulnerability | Fix |
|---|---|---|
| 1-3 | No ownership checks on reviews | Ownership validation + field whitelist on update |
| 4 | Hardcoded JWT fallback secret | Throws error if `JWT_SECRET` not set |
| 5 | No email format validation | Regex validation on registration |
| 6 | Refresh tokens never invalidated | Token blacklist on logout |
| 7 | Wildcard CORS | Strict origin validation |
| 8 | Tokens in localStorage | httpOnly cookies with `sameSite: strict` |
| 9 | Password hash in register response | Stripped via Prisma select |
| 10 | No HTML sanitization | `escapeHtml()` on comments |
| 11 | 10mb JSON body limit | Reduced to 2mb |
| 12 | Weak password requirements | Requires 8+ chars, uppercase, lowercase, number |

## Environment Variables

Backend `backend/.env`:

```env
DATABASE_URL="file:./devflow.db"
JWT_SECRET="<auto-generated 48-byte key>"
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

## Scripts

### Backend
| Script | Description |
|---|---|
| `npm run dev` | Dev server with hot reload (port 5000) |
| `npm run build` | Compile TypeScript |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma migrate dev` | Run migrations |
| `npx prisma studio` | Browse database |

### Frontend
| Script | Description |
|---|---|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## License

MIT
