# Database Schema

## Entity Relationship Diagram

```
+------------------+       +------------------+       +------------------+
|   workspaces     |       |     users        |       |  entitlements    |
+------------------+       +------------------+       +------------------+
| id (PK, UUID)    |<------| workspace_id (FK)|  1:1  | workspace_id (FK)|
| name             |  1:N  | email (unique)   |<----->| subscription_tier|
| created_at       |       | hashed_password  |       | subscription_    |
| updated_at       |       | is_active        |       |   status         |
+--------+---------+       | email_verified   |       | stripe_customer_ |
         |                 | verification_    |       |   id             |
         |                 |   token          |       | stripe_          |
         |                 | role             |       |   subscription_id|
         |                 | last_login_at    |       +------------------+
         |                 +------------------+
         |
         +--------------------------------------------------+
         |                    |                              |
+--------v---------+ +-------v----------+  +----------------v---+
| workflow_sessions | | business_profiles|  | compliance_        |
+------------------+ +------------------+  |   deadlines        |
| id (PK, UUID)    | | id (PK, UUID)    |  +--------------------+
| workspace_id (FK)| | workspace_id (FK)|  | id (PK, UUID)      |
| status           | |   (unique)       |  | workspace_id (FK)  |
| current_step     | | legal_name       |  | deadline_type      |
| step_data (JSONB)| | ein_encrypted    |  | title              |
| completed_steps  | | business_type    |  | deadline_date      |
| preflight_results| | naics_codes[]    |  | is_completed       |
| started_at       | | banking_routing_ |  | notification_sent_ |
| completed_at     | |   encrypted      |  |   30d/14d/7d/1d    |
+--------+---------+ | banking_account_ |  +--------------------+
         |            |   encrypted      |
         |            +------------------+
         |
+--------v---------+  +------------------+  +------------------+
| reps_certs_      |  | generated_       |  |   audit_logs     |
|   responses      |  |   documents      |  +------------------+
+------------------+  +------------------+  | id (PK, UUID)    |
| id (PK, UUID)    |  | id (PK, UUID)    |  | workspace_id (FK)|
| workspace_id (FK)|  | workspace_id (FK)|  | actor_type       |
| workflow_session_ |  | workflow_session_|  | actor_id         |
|   id (FK)        |  |   id (FK)        |  | event_type       |
| far_clause       |  | document_type    |  | previous_state   |
| responses (JSONB)|  | filename         |  | new_state        |
| is_applicable    |  | r2_object_key    |  | extra_data (JSONB)|
| completed_at     |  | download_count   |  | created_at       |
+------------------+  | generated_at     |  +------------------+
                      | is_active        |
                      +------------------+  +------------------+
                                            | stripe_events    |
                                            +------------------+
                                            | id (PK, UUID)    |
                                            | stripe_event_id  |
                                            |   (unique)       |
                                            | event_type       |
                                            | processing_status|
                                            | payload (JSONB)  |
                                            | processed_at     |
                                            +------------------+
```

## Tables

### workspaces
Tenant container. One workspace per registered account.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default uuid4 |
| name | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, default now |
| updated_at | TIMESTAMP | NOT NULL, auto-update |

### users
User accounts with email verification.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK workspaces, NOT NULL |
| email | VARCHAR(255) | UNIQUE, INDEXED, NOT NULL |
| hashed_password | VARCHAR(255) | NOT NULL |
| is_active | BOOLEAN | default True |
| email_verified | BOOLEAN | default False |
| verification_token | VARCHAR(255) | NULLABLE |
| verification_token_expires_at | TIMESTAMP | NULLABLE |
| role | ENUM(owner, admin, viewer) | default owner |
| created_at | TIMESTAMP | NOT NULL |
| last_login_at | TIMESTAMP | NULLABLE |

### entitlements
Subscription state and Stripe references. One per workspace.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK workspaces, UNIQUE |
| sam_onboarding_status | ENUM | default inactive |
| sam_onboarding_paid_at | TIMESTAMP | NULLABLE |
| sam_onboarding_completed_at | TIMESTAMP | NULLABLE |
| compliance_subscription_status | ENUM | default inactive |
| compliance_subscription_start_at | TIMESTAMP | NULLABLE |
| compliance_subscription_end_at | TIMESTAMP | NULLABLE |
| subscription_tier | ENUM(free, intelligence, complete) | default free |
| subscription_status | ENUM(active, pending_checkout, expired, canceled) | default active |
| subscription_start_at | TIMESTAMP | NULLABLE |
| subscription_end_at | TIMESTAMP | NULLABLE |
| stripe_customer_id | VARCHAR(255) | INDEXED, NULLABLE |
| stripe_subscription_id | VARCHAR(255) | NULLABLE |
| stripe_onboarding_checkout_id | VARCHAR(255) | NULLABLE |
| updated_at | TIMESTAMP | auto-update |

### workflow_sessions
SAM.gov registration workflow state.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK workspaces |
| session_type | ENUM(sam_onboarding, renewal) | default sam_onboarding |
| status | ENUM(not_started, in_progress, preflight, submitted, completed, abandoned) | |
| current_step | VARCHAR(50) | default business_info |
| step_data | JSONB | stores all step form data |
| completed_steps | ARRAY(VARCHAR) | list of completed step names |
| preflight_results | JSONB | NULLABLE |
| started_at | TIMESTAMP | |
| last_active_at | TIMESTAMP | |
| completed_at | TIMESTAMP | NULLABLE |

### business_profiles
Saved business data after workflow completion. Sensitive fields encrypted.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK workspaces, UNIQUE |
| legal_name | VARCHAR(255) | NULLABLE |
| dba_name | VARCHAR(255) | NULLABLE |
| ein_encrypted | BYTEA | AES-256-GCM, NULLABLE |
| ein_last_four | VARCHAR(4) | NULLABLE |
| business_type | ENUM | |
| address_line1..country | VARCHAR | address fields |
| naics_codes | ARRAY(VARCHAR(6)) | |
| primary_naics | VARCHAR(6) | |
| banking_routing_encrypted | BYTEA | AES-256-GCM, NULLABLE |
| routing_last_four | VARCHAR(4) | |
| banking_account_encrypted | BYTEA | AES-256-GCM, NULLABLE |
| account_last_four | VARCHAR(4) | |
| banking_account_holder | VARCHAR(255) | |
| bank_name | VARCHAR(255) | |
| uei_number | VARCHAR(12) | NULLABLE |
| cage_code | VARCHAR(5) | NULLABLE |
| annual_receipts_avg | INTEGER | NULLABLE |
| total_employees | INTEGER | NULLABLE |
| created_at, updated_at | TIMESTAMP | |

### reps_certs_responses
Individual FAR/DFARS clause responses per workflow session.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK workspaces |
| workflow_session_id | UUID | FK workflow_sessions |
| far_clause | VARCHAR(30) | e.g. FAR_52_219_1 |
| clause_title | VARCHAR(255) | NULLABLE |
| responses | JSONB | question_id: value pairs |
| is_applicable | VARCHAR(10) | default yes |
| completed_at | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | |

### generated_documents
Metadata for generated PDF documents.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK workspaces, INDEXED |
| workflow_session_id | UUID | FK workflow_sessions, NULLABLE |
| document_type | ENUM(sam_checklist, reps_certs, banking_authorization) | |
| filename | VARCHAR(255) | |
| r2_object_key | VARCHAR(500) | UNIQUE, INDEXED |
| file_size_bytes | INTEGER | NULLABLE |
| content_type | VARCHAR(100) | default application/pdf |
| download_count | INTEGER | default 0 |
| last_downloaded_at | TIMESTAMP | NULLABLE |
| generated_at | TIMESTAMP | INDEXED |
| generated_by_user_id | UUID | NULLABLE |
| is_active | BOOLEAN | default True |
| deleted_at | TIMESTAMP | NULLABLE |

### compliance_deadlines
Tracked compliance deadlines with notification state.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK workspaces |
| deadline_type | ENUM(sam_renewal, reps_certs_renewal, cage_code_renewal, custom) | |
| title | VARCHAR(255) | |
| description | TEXT | NULLABLE |
| deadline_date | DATE | |
| is_completed | BOOLEAN | default False |
| completed_at | TIMESTAMP | NULLABLE |
| notification_sent_30d | BOOLEAN | default False |
| notification_sent_14d | BOOLEAN | default False |
| notification_sent_7d | BOOLEAN | default False |
| notification_sent_1d | BOOLEAN | default False |
| source_workflow_session_id | UUID | FK workflow_sessions, NULLABLE |
| created_at | TIMESTAMP | |

### audit_logs
Complete audit trail of all state changes.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| workspace_id | UUID | FK workspaces |
| actor_type | ENUM(user, system, admin) | |
| actor_id | VARCHAR(255) | NULLABLE |
| event_type | VARCHAR(100) | e.g. entitlement.subscription.active |
| previous_state | VARCHAR(50) | NULLABLE |
| new_state | VARCHAR(50) | NULLABLE |
| extra_data | JSONB | stripe_event_id, step_name, etc. |
| created_at | TIMESTAMP | INDEXED |

### stripe_events
Webhook event tracking for idempotent processing.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| stripe_event_id | VARCHAR(255) | UNIQUE, INDEXED |
| event_type | VARCHAR(100) | |
| processing_status | ENUM(pending, success, failed) | |
| error_message | TEXT | NULLABLE |
| payload | JSONB | NULLABLE |
| processed_at | TIMESTAMP | |

## Migrations

Managed by Alembic. Migration files in `alembic/versions/`:

1. `001_initial_schema.py` - Users, workspaces, entitlements
2. `002_workflow_tables.py` - Workflow sessions, reps certs
3. `003_business_profiles.py` - Business profiles with encryption
4. `004_generated_documents.py` - Document metadata and storage
5. `005_rename_audit_metadata.py` - Audit log field rename
6. `006_compliance_deadlines.py` - Compliance deadline tracking
7. `007_subscription_tiers.py` - 3-tier subscription model
8. `008_email_verification.py` - Email verification fields
