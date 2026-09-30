# System Architecture

## Overview

INVIGOV is a two-tier web application with a FastAPI backend and a Next.js frontend, communicating over REST API.

```
                          +------------------+
                          |   Next.js 14     |
                          |   (Frontend)     |
                          |   Vercel         |
                          +--------+---------+
                                   |
                              HTTPS/REST
                                   |
                          +--------v---------+
                          |   FastAPI        |
                          |   (Backend)      |
                          |   Render         |
                          +--------+---------+
                                   |
              +--------------------+--------------------+
              |                    |                    |
     +--------v------+   +--------v------+   +--------v------+
     |  PostgreSQL   |   |    Redis      |   | Cloudflare R2 |
     |  (Database)   |   |  (Cache/Queue)|   |  (Documents)  |
     +---------------+   +---------------+   +---------------+

External Services:
  - Stripe (payments + webhooks)
  - Resend (transactional email)
  - Sentry (error monitoring)
```

## Request Flow

### Authenticated Request

```
Browser -> Next.js -> FastAPI /api/v1/* -> JWT Validation -> Entitlement Check -> Service Layer -> Database
```

1. Frontend sends request with `Authorization: Bearer <access_token>` header
2. FastAPI middleware validates JWT token, extracts user ID
3. Dependency injection (`deps.py`) loads User and Workspace from database
4. Entitlement guard checks `subscription_tier` and `subscription_status`
5. Service layer executes business logic
6. Response returned to frontend

### Stripe Webhook Flow

```
Stripe -> POST /api/v1/webhooks/stripe -> Signature Verification -> Event Handler -> Entitlement Update -> Audit Log
```

1. Stripe sends event to webhook endpoint
2. Signature verified using `STRIPE_WEBHOOK_SECRET`
3. Idempotency check against `stripe_events` table
4. Event routed to appropriate handler in `entitlement_service`
5. Entitlement state updated in database
6. Audit log entry created

## Service Layer

```
+-------------------+     +-------------------+     +-------------------+
|  auth_service     |     | payment_service   |     | workflow_service  |
|  - register       |     | - create_checkout |     | - get_session     |
|  - verify_email   |     | - create_customer |     | - save_step       |
|  - login          |     +-------------------+     | - complete        |
|  - refresh_token  |                               | - preflight       |
+-------------------+     +-------------------+     +-------------------+
                          | document_service  |
+-------------------+     | - generate_pdfs   |     +-------------------+
| entitlement_svc   |     | - get_download_url|     | compliance_svc    |
| - checkout_done   |     +-------------------+     | - get_dashboard   |
| - payment_ok      |                               | - mark_complete   |
| - payment_fail    |     +-------------------+     | - add_deadline    |
| - sub_deleted     |     | storage_service   |     +-------------------+
+-------------------+     | - upload (R2/local)|
                          | - get_signed_url  |
                          +-------------------+
```

## Security Architecture

### Authentication
- JWT access tokens (15 min TTL) + refresh tokens (7 day TTL)
- Bcrypt password hashing (12 rounds)
- Email verification required before access

### Encryption at Rest
- AES-256-GCM for EIN, routing number, account number
- Encryption key stored as environment variable (base64-encoded 32 bytes)
- Only last 4 digits stored unencrypted for display

### Access Control
- Server-side entitlement enforcement on every gated endpoint
- No UI-only access control
- Subscription status checked on each request via dependency injection

### Document Security
- PDFs contain only masked values (last 4 digits)
- Downloads served via signed URLs with 1-hour expiration
- Download count and timestamp tracked per document

### Webhook Security
- Stripe signature verification on every webhook request
- Idempotent processing (duplicate events ignored)
- All state changes logged to audit trail

## Deployment Architecture

### Staging
- Frontend: Vercel (`sam-gov-frontend.vercel.app`)
- Backend: Render (`sam-gov-backend-5kd0.onrender.com`)
- Database: Render PostgreSQL
- Redis: Upstash
- Storage: Local filesystem

### Production
- Frontend: Vercel (custom domain)
- Backend: Render (custom domain)
- Database: Render PostgreSQL
- Redis: Upstash
- Storage: Cloudflare R2
- Email: Resend (custom domain)
- Payments: Stripe (production keys)
