# INVIGOV Backend

Federal compliance automation platform - SAM.gov registration workflow, document generation, and deadline tracking.

## Tech Stack

- **Framework**: FastAPI (Python 3.12)
- **Database**: PostgreSQL + SQLAlchemy ORM
- **Migrations**: Alembic
- **Queue**: Redis + RQ
- **Payments**: Stripe (webhooks)
- **Email**: Resend
- **Storage**: Cloudflare R2 (production) / Local filesystem (development)
- **Encryption**: AES-256-GCM for sensitive fields
- **Monitoring**: Sentry

## Local Development Setup

### Prerequisites

- Python 3.12+
- PostgreSQL 15+
- Redis

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd invigov_backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET_KEY` | Secret for signing JWT tokens (generate with `openssl rand -hex 32`) |
| `STRIPE_SECRET_KEY` | Stripe API secret key (test mode: `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_ID_INTELLIGENCE` | Stripe Price ID for Intelligence tier |
| `STRIPE_PRICE_ID_COMPLETE` | Stripe Price ID for Complete tier |
| `ENCRYPTION_KEY` | Base64-encoded 32-byte key for AES-256-GCM |
| `STORAGE_TYPE` | `local` or `r2` |
| `ALLOWED_ORIGINS` | JSON array of allowed CORS origins |
| `FRONTEND_URL` | Frontend URL for Stripe redirects |
| `RESEND_API_KEY` | Resend API key for email |
| `EMAIL_FROM` | Sender email address |

### 3. Run database migrations

```bash
alembic upgrade head
```

### 4. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs` (development only).

### 5. Start the worker (for background jobs)

```bash
python -m app.workers.notifications
```

## Staging Deployment

- **Platform**: Render (render.com)
- **URL**: `https://sam-gov-backend-5kd0.onrender.com`
- **Database**: Render PostgreSQL
- **Redis**: Upstash Redis

## Production Deployment

- **Platform**: Render or any Docker-compatible host
- **Database**: Managed PostgreSQL (Render, Supabase, or AWS RDS)
- **Storage**: Cloudflare R2 (set `STORAGE_TYPE=r2`)
- **Domain**: Configure custom domain in Render dashboard

### Stripe Webhook Setup

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/v1/webhooks/stripe`
3. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Project Structure

```
app/
  api/v1/
    endpoints/     # Route handlers (auth, workflow, payments, documents, compliance)
    webhooks/      # Stripe webhook handler
    deps.py        # Dependency injection (auth guards)
    router.py      # Route aggregation
  models/          # SQLAlchemy models
  schemas/         # Pydantic request/response schemas
  services/        # Business logic layer
  workers/         # Background job processors
  core/
    config.py      # Environment configuration
    database.py    # Database session management
    encryption.py  # AES-256-GCM encryption utilities
    security.py    # Password hashing, JWT operations
    redis.py       # Redis connection
    health.py      # Health check endpoint
alembic/
  versions/        # Database migration scripts
```

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [DATABASE.md](./DATABASE.md) - Database schema and ERD
- [STATE_MACHINES.md](./STATE_MACHINES.md) - Entitlement and workflow state machines
- [API.md](./API.md) - API endpoint documentation
- [RUNBOOK.md](./RUNBOOK.md) - Production deployment runbook
