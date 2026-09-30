"""
SOW §6.2 Admin Controls — restricted admin functionality with mandatory audit logging.
  - Manual entitlement overrides
  - Workflow resets (explicit, logged)
  - Document regeneration (idempotent)
  - Trigger scheduled notifications manually
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.api.v1.deps import require_admin
from app.models.entitlement import Entitlement
from app.models.workflow import WorkflowSession
from app.models.audit_log import AuditLog

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────

class EntitlementOverridePayload(BaseModel):
    subscription_tier: Optional[str] = None
    subscription_status: Optional[str] = None
    sam_onboarding_status: Optional[str] = None
    reason: str


class WorkflowResetPayload(BaseModel):
    reason: str


# ── Entitlement Override ─────────────────────────────────────────────────

@router.post("/entitlements/{workspace_id}/override")
def override_entitlement(
    workspace_id: str,
    payload: EntitlementOverridePayload,
    admin_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Manual entitlement override with mandatory audit logging (SOW §6.2)."""
    entitlement = db.query(Entitlement).filter_by(workspace_id=workspace_id).first()
    if not entitlement:
        raise HTTPException(status_code=404, detail="Entitlement not found")

    prev_tier = entitlement.subscription_tier
    prev_status = entitlement.subscription_status
    prev_sam = entitlement.sam_onboarding_status

    if payload.subscription_tier:
        entitlement.subscription_tier = payload.subscription_tier
    if payload.subscription_status:
        entitlement.subscription_status = payload.subscription_status
        entitlement.compliance_subscription_status = payload.subscription_status
    if payload.sam_onboarding_status:
        entitlement.sam_onboarding_status = payload.sam_onboarding_status

    audit = AuditLog(
        workspace_id=workspace_id,
        actor_type="admin",
        actor_id=str(admin_user.id),
        event_type="admin.entitlement.override",
        previous_state=f"{prev_tier}/{prev_status}/{prev_sam}",
        new_state=f"{entitlement.subscription_tier}/{entitlement.subscription_status}/{entitlement.sam_onboarding_status}",
        extra_data={"reason": payload.reason},
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "previous": {"tier": prev_tier, "status": prev_status, "sam": prev_sam},
        "current": {
            "tier": entitlement.subscription_tier,
            "status": entitlement.subscription_status,
            "sam": entitlement.sam_onboarding_status,
        },
    }


# ── Workflow Reset ───────────────────────────────────────────────────────

@router.post("/workflows/{workspace_id}/reset")
def reset_workflow(
    workspace_id: str,
    payload: WorkflowResetPayload,
    admin_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Explicit workflow reset with mandatory audit logging (SOW §6.2)."""
    session = db.query(WorkflowSession).filter_by(workspace_id=workspace_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Workflow session not found")

    prev_status = session.status
    prev_step = session.current_step

    session.status = "not_started"
    session.current_step = "business_info"
    session.completed_steps = []
    session.step_data = {}

    # Also reset entitlement sam_onboarding_status if completed
    entitlement = db.query(Entitlement).filter_by(workspace_id=workspace_id).first()
    prev_sam = None
    if entitlement and entitlement.sam_onboarding_status == "completed":
        prev_sam = entitlement.sam_onboarding_status
        entitlement.sam_onboarding_status = "active"
        entitlement.sam_onboarding_completed_at = None

    audit = AuditLog(
        workspace_id=workspace_id,
        actor_type="admin",
        actor_id=str(admin_user.id),
        event_type="admin.workflow.reset",
        previous_state=f"{prev_status}/{prev_step}",
        new_state="not_started/business_info",
        extra_data={
            "reason": payload.reason,
            "sam_status_reset": prev_sam,
        },
    )
    db.add(audit)
    db.commit()

    return {"success": True, "previous_status": prev_status, "new_status": "not_started"}


# ── Document Regeneration ────────────────────────────────────────────────

@router.post("/documents/{workspace_id}/regenerate")
def regenerate_documents(
    workspace_id: str,
    admin_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Idempotent document regeneration — deactivates old docs, generates new (SOW §6.2)."""
    from app.services.document_service import generate_documents

    result = generate_documents(db, workspace_id, actor_id=str(admin_user.id))

    audit = AuditLog(
        workspace_id=workspace_id,
        actor_type="admin",
        actor_id=str(admin_user.id),
        event_type="admin.document.regenerate",
        new_state="regenerated",
        extra_data={"document_count": len(result.get("documents", []))},
    )
    db.add(audit)
    db.commit()

    return result


# ── Trigger Notifications ────────────────────────────────────────────────

@router.post("/notifications/trigger")
def trigger_notifications(
    admin_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Manually trigger scheduled deadline notifications (SOW M4)."""
    from app.workers.notifications import send_deadline_notifications

    result = send_deadline_notifications()

    audit = AuditLog(
        workspace_id=admin_user.workspace_id,
        actor_type="admin",
        actor_id=str(admin_user.id),
        event_type="admin.notifications.trigger",
        extra_data=result,
    )
    db.add(audit)
    db.commit()

    return result
