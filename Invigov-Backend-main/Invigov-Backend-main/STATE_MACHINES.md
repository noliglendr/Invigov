# Entitlement and Workflow State Machines

## 1. Subscription Entitlement State Machine

Manages access control based on Stripe subscription lifecycle.

```
                    +------------------+
                    |      free        |
                    | (default state)  |
                    +--------+---------+
                             |
                    User clicks "Subscribe"
                    POST /payments/checkout/{tier}
                             |
                    +--------v---------+
                    | pending_checkout  |
                    | (Stripe session   |
                    |  created)         |
                    +--------+---------+
                             |
                    Stripe webhook:
                    checkout.session.completed
                             |
                    +--------v---------+
                    |     active       |
                    | (full access)    |
                    +--+-----+-----+--+
                       |     |     |
          +------------+     |     +------------+
          |                  |                  |
  invoice.payment    customer.       invoice.payment
  _succeeded         subscription.   _failed
  (renewal)          deleted         (payment fails)
          |          (canceled)              |
          |                  |               |
  +-------v-------+  +------v--------+  +---v-----------+
  |    active     |  |   canceled    |  |    expired    |
  | (renewed,     |  | tier -> free  |  | (immediate    |
  |  +30 days)    |  | (no access)   |  |  revocation)  |
  +---------------+  +---------------+  +---------------+
```

### State Descriptions

| State | Access Level | Trigger |
|-------|-------------|---------|
| `free` | Read-only compliance dashboard | Default on registration |
| `pending_checkout` | No access (waiting for payment) | Checkout session created |
| `active` | Full access per tier | Payment confirmed |
| `expired` | No access (immediate) | Payment failed |
| `canceled` | No access, tier reset to free | Subscription deleted |

### Tier Access Matrix

| Tier | Workflow | Documents | Compliance | Billing |
|------|----------|-----------|------------|---------|
| free | No | No | Read-only | Yes |
| intelligence | Read-only | Download | Full | Yes |
| complete | Full (create/edit/submit) | Generate + Download | Full | Yes |

### Webhook Event Mapping

| Stripe Event | Handler | State Change |
|-------------|---------|-------------|
| `checkout.session.completed` | `handle_checkout_completed()` | pending_checkout -> active |
| `invoice.payment_succeeded` | `handle_payment_succeeded()` | active -> active (renewed) |
| `invoice.payment_failed` | `handle_payment_failed()` | active -> expired |
| `customer.subscription.updated` | `handle_subscription_updated()` | tier changed |
| `customer.subscription.deleted` | `handle_subscription_deleted()` | active -> canceled |

All transitions are logged to `audit_logs` table with previous_state, new_state, and stripe_event_id.

---

## 2. SAM Onboarding State Machine (Legacy)

One-time payment workflow for SAM.gov registration.

```
  +----------+     checkout      +-----------+     webhook     +--------+
  | inactive | ----------------> | pending_  | -------------> | active |
  +----------+   created         | checkout  |   completed    +----+---+
                                 +-----------+                     |
                                                          workflow complete
                                                                   |
                                                            +------v-----+
                                                            | completed  |
                                                            | (read-only |
                                                            |  locked)   |
                                                            +------------+
```

| State | Description |
|-------|-------------|
| `inactive` | No payment made |
| `pending_checkout` | Stripe checkout session created |
| `active` | Payment confirmed, workflow accessible |
| `completed` | Workflow finished, permanently locked (read-only) |

---

## 3. Workflow Session State Machine

Tracks progress through the 7-step SAM registration workflow.

```
  +-------------+     first step saved     +-------------+
  | not_started | -----------------------> | in_progress |
  +-------------+                          +------+------+
                                                  |
                                           all steps done,
                                           preflight passes
                                                  |
                                           +------v------+
                                           |  preflight  |
                                           +------+------+
                                                  |
                                           POST /complete
                                                  |
                                           +------v------+
                                           |  submitted  |
                                           +------+------+
                                                  |
                                           business profile saved,
                                           deadlines created
                                                  |
                                           +------v------+
                                           |  completed  |
                                           | (read-only) |
                                           +-------------+
```

### Workflow Steps (Sequential)

```
  Step 1          Step 2          Step 3          Step 4
+-----------+   +-----------+   +-----------+   +-----------+
| business  |-->| naics     |-->| banking   |-->| reps &    |
| info      |   | codes     |   | info      |   | certs     |
+-----------+   +-----------+   +-----------+   +-----------+
  EIN (enc)       NAICS codes    Routing (enc)    FAR/DFARS
  Address         Employee cnt   Account (enc)    21 clauses
  Entity type     Receipts       Holder name      Dynamic by
                                 Bank name        entity type

  Step 5          Step 6          Step 7
+-----------+   +-----------+   +-----------+
| document  |-->| preflight |-->| complete  |
| review    |   | validation|   | (locked)  |
+-----------+   +-----------+   +-----------+
  Review PDFs     All checks      Read-only
  before submit   must pass       Download docs
                  Blocking gate   Deadlines created
```

### Save/Resume

- Each step saves data to `step_data` JSONB column
- `current_step` tracks where user left off
- `completed_steps[]` array tracks which steps are done
- User can navigate back to any completed step
- Resuming loads saved data from `step_data`
- `last_active_at` updated on every step save

### Preflight Checks

Before workflow completion, all blocking checks must pass:

| Check | Blocking | Source |
|-------|----------|--------|
| Legal name present | Yes | step_data.business_info |
| EIN present | Yes | step_data.business_info |
| Address complete | Yes | step_data.business_info |
| Primary NAICS set | Yes | step_data.naics_codes |
| Banking info present | Yes | step_data.banking_info |
| All applicable FAR clauses completed | Yes | reps_certs_responses |

### Completion Side Effects

When `POST /workflow/complete` succeeds:
1. `BusinessProfile` created from `step_data` (encrypted fields stored as BYTEA)
2. `WorkflowSession.status` set to `completed`
3. `Entitlement.sam_onboarding_status` set to `completed` (locked)
4. 3 `ComplianceDeadline` records created (+365 days each)
5. Audit log entry: `workflow.completed`
