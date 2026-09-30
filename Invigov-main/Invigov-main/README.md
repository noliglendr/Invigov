# INVIGOV Frontend — SAM.gov Workflow Automation MVP

Next.js frontend for the SAM.gov Workflow Automation platform. Provides a guided multi-step registration workflow, Stripe-integrated billing, compliance dashboard, and document generation/download interface.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS, Radix UI
- **Forms:** React Hook Form + Zod validation
- **State:** React Query (TanStack Query)
- **HTTP:** Axios with JWT interceptor
- **Payments:** Stripe Checkout (redirect)
- **Deployment:** Vercel

## Prerequisites

- Node.js 18+
- npm or yarn
- Running backend API (`invigov-backend`)

## Setup

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.local.example .env.local

# Edit .env.local with your values:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Start development server
npm run dev
```

The app runs at `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (test or live) |

## Project Structure

```
src/
  app/
    (auth)/login, register   — Authentication pages
    dashboard/               — Main dashboard
      billing/               — Subscription management + Stripe checkout
      workflow/              — 7-step SAM.gov registration wizard
      compliance/            — Compliance deadline tracking
    verify-email/            — Email verification flow
    privacy/, terms/         — Legal pages
  components/
    workflow/steps/          — Step form components (business-info, naics, banking, reps-certs, etc.)
    ui/                      — Shared UI components (Button, Card, Input, etc.)
  lib/
    api.ts                   — Axios instance with JWT + 401/403 interceptors
    utils.ts                 — Utility functions
  hooks/
    useAutoSave.ts           — Auto-save hook for workflow forms
  types/
    index.ts                 — TypeScript interfaces
  middleware.ts              — Route protection (auth redirect)
```

## Key Features

- **7-Step Workflow Wizard** — Business info, NAICS codes, banking, reps & certs, document review, preflight, completion
- **Auto-Save** — Form data saved with 500ms debounce
- **Entitlement Gating** — UI gates backed by server-side enforcement
- **Document Generation** — PDF generation and signed-URL downloads
- **Read-Only Mode** — Completed workflows are locked; documents remain downloadable
- **3-Tier Subscription** — Free, Intelligence, Complete (via Stripe)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |

## Deployment

Deployed to Vercel. Environment variables must be set in the Vercel dashboard.

```bash
# Production build
npm run build

# Or deploy via Vercel CLI
npx vercel --prod
```

## Security

- All entitlement checks are enforced server-side (SOW §4.4)
- Frontend UI gating is for UX only — never treated as a security boundary
- JWT tokens stored in cookies (httpOnly preferred) with localStorage fallback
- 401 responses redirect to login; 403 (payment_required) redirects to billing
- No sensitive data (EIN, banking) stored or displayed in frontend — only masked values from API
