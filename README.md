# AI Code Review Platform

An AI-powered code review platform that automatically reviews pull requests using LLM and posts feedback directly on GitHub.

## Demo

Open a PR → webhook fires → AI fetches the diff → reviews it → posts inline comments back to GitHub and shows results in real time on the dashboard.

![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

## Architecture
GitHub PR → Webhook Service → RabbitMQ → AI Review Worker → Groq LLM
↓
PostgreSQL
↓
Notification Worker → Socket.io → Next.js Dashboard
### Services

| Service | Port | Responsibility |
|---|---|---|
| API Gateway | 3000 | Auth, rate limiting, proxy, Swagger |
| Auth Service | 3001 | JWT, refresh tokens, bcrypt |
| Webhook Service | 3002 | GitHub HMAC validation, RabbitMQ publish |
| Review Query Service | 3003 | REST endpoints for reviews and stats |
| AI Review Worker | 3004 | Consume queue, fetch diff, call LLM, persist |
| Notification Worker | 3005 | RabbitMQ consumer, Socket.io real-time push |
| Next.js Frontend | 3006 | Dashboard, repositories, PR reviews |

## Tech Stack

**Backend**
- NestJS monorepo with 6 microservices
- TypeORM + PostgreSQL
- RabbitMQ for async message passing
- Redis for sessions
- Socket.io for real-time updates
- Passport JWT with refresh token rotation
- Prometheus + Grafana for observability

**Frontend**
- Next.js 14 App Router
- Tailwind CSS
- Zustand for auth state
- React Query for server state
- Socket.io client for real-time updates

**Infrastructure**
- Docker Compose for local development
- GitHub Actions CI/CD
- ngrok for webhook tunneling in development

## Design Decisions

**Why RabbitMQ over direct HTTP calls?**
AI review processing can take 5-30 seconds. Doing this synchronously in the webhook handler would time out GitHub's webhook delivery. RabbitMQ decouples the webhook receipt from the processing — we acknowledge the webhook immediately and process asynchronously.

**Why DDD with separate services?**
Each service has a single bounded context. The webhook service only cares about receiving and validating events. The AI worker only cares about processing reviews. This makes each service independently deployable and testable.

**Why refresh token rotation?**
Access tokens expire in 15 minutes. Refresh tokens are stored in HttpOnly cookies (not localStorage) making them inaccessible to XSS attacks. On every refresh, a new refresh token is issued (rotation) so stolen tokens can be detected.

**Why Prometheus + Grafana?**
Queue depth, review processing latency, and Claude API latency are the three metrics that matter most for this system. Grafana gives a live view of pipeline health that can be shown during demos.

## Getting Started

### Prerequisites

- Node.js 22+
- Docker + Docker Compose
- ngrok account (free)
- Groq API key (free at console.groq.com)
- GitHub App

### Setup

**1. Clone the repo**
```bash
git clone https://github.com/kazi-akib-javed/ai-code-review.git
cd ai-code-review
```

**2. Install dependencies**
```bash
yarn install
```

**3. Configure environment**
```bash
cp .env.example .env
```

Fill in `.env`:
- `CLAUDE_API_KEY` — your Groq API key from console.groq.com
- `GITHUB_APP_ID` — from your GitHub App settings
- `GITHUB_APP_PRIVATE_KEY` — contents of the downloaded .pem file
- `GITHUB_WEBHOOK_SECRET` — random secret set in your GitHub App

**4. Start infrastructure**
```bash
docker compose up -d
```

**5. Start all services**
```bash
yarn start:all
```

**6. Start frontend**
```bash
yarn start:frontend
```

**7. Tunnel webhook service**
```bash
ngrok http 3002
```

Set the ngrok URL + `/api/v1/webhooks/github` as your GitHub App webhook URL.

### Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3006 |
| Swagger API docs | http://localhost:3000/api/docs |
| RabbitMQ management | http://localhost:15672 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3100 |

## Git Workflow

This project follows trunk-based development with conventional commits.

**Branch naming:** `feat/`, `fix/`, `chore/`, `refactor/`, `test/`

**Commit format:** `type(scope): description`

**Examples:**
feat(ai-worker): integrate Groq API for diff analysis
fix(webhook-svc): correct tsconfig outDir path
chore(infra): add prometheus scrape config

**Flow:** `feat/*` → `develop` (squash merge) → `main` (merge commit + tag)

## API Documentation

Swagger UI available at `http://localhost:3000/api/docs`

Endpoints:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/repositories`
- `GET /api/v1/repositories/:id/pull-requests`
- `GET /api/v1/pull-requests/:prId/review`
- `GET /api/v1/repositories/:id/stats`
- `POST /api/v1/webhooks/github`

## CI/CD

GitHub Actions runs on every push to `develop` and `main`:

1. **Lint** — ESLint across all apps
2. **Test** — Jest unit tests with coverage
3. **Build** — Compile all 6 NestJS services

Deployment via SSH on push to `main`.

## Releases

| Version | Description |
|---|---|
| v0.4.0 | Full end-to-end pipeline with GitHub bot comments |
| v0.3.0 | Next.js frontend with real-time Socket.io |
| v0.2.0 | API gateway, Swagger, Prometheus metrics |
| v0.1.0 | Backend services complete |# test
