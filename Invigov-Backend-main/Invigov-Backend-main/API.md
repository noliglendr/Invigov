# API Documentation

Base URL: `/api/v1`

All authenticated endpoints require `Authorization: Bearer <access_token>` header.

---

## Authentication

### POST /auth/register
Create a new account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "workspace_name": "My Company"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "email": "user@example.com"
}
```

### POST /auth/verify-email?token={token}
Verify email address and receive tokens.

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### POST /auth/resend-verification
Resend verification email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST /auth/login
Authenticate and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### POST /auth/refresh?refresh_token={token}
Get new access token using refresh token.

### GET /auth/me
Get current user profile with entitlement data. Requires authentication.

---

## Payments

### POST /payments/checkout/{tier}
Create Stripe checkout session. Requires authentication.

**Path Parameters:**
- `tier`: `intelligence` or `complete`

**Response (200):**
```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

---

## Workflow

All workflow endpoints require authentication and active subscription (Complete tier).

### GET /workflow/session
Get or create workflow session.

**Response (200):**
```json
{
  "id": "uuid",
  "status": "in_progress",
  "current_step": "naics_codes",
  "step_data": { ... },
  "completed_steps": ["business_info"],
  "started_at": "2026-03-01T00:00:00Z",
  "last_active_at": "2026-03-01T01:00:00Z"
}
```

### POST /workflow/step/business-info
Save business information step.

**Request:**
```json
{
  "legal_name": "ACME Corp",
  "dba_name": "ACME",
  "ein": "12-3456789",
  "business_type": "corporation",
  "address_line1": "123 Main St",
  "city": "Dallas",
  "state": "TX",
  "zip_code": "75001",
  "country": "US",
  "uei_number": "ABC123456789"
}
```

**Response (200):**
```json
{
  "success": true,
  "step": "business_info",
  "current_step": "naics_codes",
  "completed_steps": ["business_info"]
}
```

### POST /workflow/step/naics-codes
Save NAICS codes step.

**Request:**
```json
{
  "primary_naics": "541511",
  "naics_codes": ["541511", "541512", "541519"],
  "annual_receipts_avg": 5000000,
  "total_employees": 50
}
```

### POST /workflow/step/banking-info
Save banking information step. Sensitive fields are encrypted server-side.

**Request:**
```json
{
  "routing_number": "021000021",
  "account_number": "123456789",
  "account_holder": "ACME Corp",
  "bank_name": "Chase Bank"
}
```

### POST /workflow/step/reps-certs
Save FAR/DFARS representations and certifications.

**Request:**
```json
{
  "clauses": [
    {
      "far_clause": "FAR_52_219_1",
      "is_applicable": "yes",
      "responses": {
        "is_small_business": true,
        "is_wosb": false,
        "is_sdvosb": false,
        "is_hubzone": false,
        "is_8a": false
      }
    }
  ]
}
```

### GET /workflow/preflight
Run preflight validation checks.

**Response (200):**
```json
{
  "is_ready": true,
  "checks": [
    { "name": "Legal name present", "passed": true, "blocking": true },
    { "name": "EIN present", "passed": true, "blocking": true },
    { "name": "Address complete", "passed": true, "blocking": true },
    { "name": "Primary NAICS set", "passed": true, "blocking": true },
    { "name": "Banking info present", "passed": true, "blocking": true },
    { "name": "FAR clauses completed", "passed": true, "blocking": true }
  ],
  "blocking_count": 0
}
```

### POST /workflow/complete
Finalize workflow. Creates business profile, generates compliance deadlines.

**Response (200):**
```json
{
  "success": true,
  "status": "completed",
  "completed_at": "2026-03-15T12:00:00Z",
  "compliance_deadlines_created": 3
}
```

### GET /workflow/far-clauses/{business_type}
Get applicable FAR/DFARS clauses for entity type.

**Path Parameters:**
- `business_type`: `sole_proprietor`, `llc`, `corporation`, `partnership`, `nonprofit`

---

## Documents

### POST /documents/generate
Generate all compliance PDFs. Requires active subscription and completed workflow steps.

**Response (200):**
```json
{
  "documents": [
    {
      "id": "uuid",
      "document_type": "sam_checklist",
      "filename": "SAM_Checklist_2026-03-15.pdf",
      "file_size_bytes": 45230,
      "generated_at": "2026-03-15T12:00:00Z"
    },
    {
      "id": "uuid",
      "document_type": "reps_certs",
      "filename": "Reps_Certs_2026-03-15.pdf",
      "file_size_bytes": 62100,
      "generated_at": "2026-03-15T12:00:00Z"
    },
    {
      "id": "uuid",
      "document_type": "banking_authorization",
      "filename": "Banking_Auth_2026-03-15.pdf",
      "file_size_bytes": 31500,
      "generated_at": "2026-03-15T12:00:00Z"
    }
  ]
}
```

### GET /documents/{document_id}/download
Get download URL or file for a document.

**Response (200) - R2 storage:**
```json
{
  "download_url": "https://r2-signed-url...",
  "filename": "SAM_Checklist_2026-03-15.pdf",
  "expires_at": "2026-03-15T13:00:00Z",
  "download_count": 3,
  "storage_type": "r2"
}
```

**Response (200) - Local storage:** Direct file download.

---

## Compliance

Requires active subscription (Complete or Intelligence tier).

### GET /compliance/dashboard
Get compliance deadlines with urgency levels.

**Response (200):**
```json
{
  "deadlines": [
    {
      "id": "uuid",
      "deadline_type": "sam_renewal",
      "title": "SAM.gov Registration Renewal",
      "deadline_date": "2027-03-15",
      "is_completed": false,
      "urgency": "ok",
      "days_remaining": 365,
      "notification_sent_30d": false
    }
  ],
  "completed_count": 0,
  "total_count": 3,
  "subscription_renewal_date": "2026-04-15T00:00:00Z"
}
```

### POST /compliance/deadlines/{deadline_id}/complete
Mark a deadline as completed.

### POST /compliance/deadlines
Create a custom deadline.

**Request:**
```json
{
  "title": "Annual SAM Review",
  "description": "Review and update SAM profile",
  "deadline_date": "2027-06-01"
}
```

---

## Webhooks

### POST /webhooks/stripe
Stripe webhook endpoint. Verified using `STRIPE_WEBHOOK_SECRET`.

**Handled Events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription, set tier |
| `invoice.payment_succeeded` | Confirm active, extend 30 days |
| `invoice.payment_failed` | Set status to expired (immediate) |
| `customer.subscription.updated` | Update tier based on price ID |
| `customer.subscription.deleted` | Set status to canceled, tier to free |

All events are idempotent (checked against `stripe_events` table).

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "detail": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient entitlement)
- `404` - Resource not found
- `409` - Conflict (e.g., workflow already completed)
- `500` - Internal server error
