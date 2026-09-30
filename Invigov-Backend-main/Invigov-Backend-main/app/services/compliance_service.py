# M4 implementation: compliance dashboard, deadlines, notifications
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models.compliance import ComplianceDeadline
from app.models.audit_log import AuditLog
import uuid


def calculate_urgency(deadline_date: date) -> str:
    """Calculate urgency level based on days remaining."""
    today = date.today()
    days_remaining = (deadline_date - today).days

    if days_remaining < 0:
        return "critical"
    elif days_remaining <= 7:
        return "critical"
    elif days_remaining <= 30:
        return "warning"
    else:
        return "ok"


def get_dashboard(db: Session, workspace_id):
    """Get compliance dashboard with deadlines and summary statistics."""
    deadlines = db.query(ComplianceDeadline).filter(
        ComplianceDeadline.workspace_id == workspace_id
    ).order_by(ComplianceDeadline.deadline_date).all()

    today = date.today()

    # Format deadlines for frontend
    formatted_deadlines = []
    for deadline in deadlines:
        days_remaining = (deadline.deadline_date - today).days
        formatted_deadlines.append({
            "id": str(deadline.id),
            "type": deadline.deadline_type,
            "title": deadline.title,
            "deadline_date": deadline.deadline_date.isoformat(),
            "days_remaining": days_remaining,
            "urgency": calculate_urgency(deadline.deadline_date),
            "is_completed": deadline.is_completed,
        })

    # Calculate summary statistics
    total_count = len(deadlines)
    completed_count = sum(1 for d in deadlines if d.is_completed)

    return {
        "deadlines": formatted_deadlines,
        "subscription_renewal_date": None,  # Can be implemented later with Stripe data
        "completed_count": completed_count,
        "total_count": total_count,
    }


def mark_deadline_complete(db: Session, workspace_id, deadline_id: str):
    """Mark a compliance deadline as completed."""
    deadline = db.query(ComplianceDeadline).filter(
        ComplianceDeadline.id == deadline_id,
        ComplianceDeadline.workspace_id == workspace_id
    ).first()

    if not deadline:
        raise ValueError("Deadline not found")

    deadline.is_completed = True
    deadline.completed_at = datetime.utcnow()

    audit = AuditLog(
        workspace_id=workspace_id,
        actor_type="user",
        event_type="compliance.deadline.completed",
        previous_state="pending",
        new_state="completed",
        extra_data={
            "deadline_id": str(deadline.id),
            "deadline_type": deadline.deadline_type,
            "title": deadline.title,
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(deadline)

    return {"success": True, "message": "Deadline marked as complete"}


def add_custom_deadline(db: Session, workspace_id, payload):
    """Add a custom compliance deadline."""
    new_deadline = ComplianceDeadline(
        workspace_id=workspace_id,
        deadline_type="custom",
        title=payload.title,
        description=payload.description,
        deadline_date=payload.deadline_date,
        is_completed=False,
    )

    db.add(new_deadline)

    audit = AuditLog(
        workspace_id=workspace_id,
        actor_type="user",
        event_type="compliance.deadline.created",
        new_state="pending",
        extra_data={
            "deadline_type": "custom",
            "title": payload.title,
            "deadline_date": str(payload.deadline_date),
        },
    )
    db.add(audit)
    db.commit()
    db.refresh(new_deadline)

    return {
        "success": True,
        "message": "Custom deadline created",
        "deadline": {
            "id": str(new_deadline.id),
            "title": new_deadline.title,
            "deadline_date": new_deadline.deadline_date.isoformat(),
        }
    }


def create_workflow_deadlines(db: Session, workspace_id, workflow_session_id):
    """
    Automatically create compliance deadlines when SAM workflow is completed.
    Called by workflow_service.complete_workflow().

    Creates three standard deadlines:
    - SAM.gov Registration Renewal (365 days from completion)
    - REPS & Certifications Renewal (365 days from completion)
    - CAGE Code Renewal (365 days from completion)
    """
    today = date.today()

    # Standard renewal periods (all annual)
    deadlines_config = [
        {
            "deadline_type": "sam_renewal",
            "title": "SAM.gov Registration Renewal",
            "description": "Your SAM.gov registration must be renewed annually to maintain active status for government contracting.",
            "days_from_now": 365,
        },
        {
            "deadline_type": "reps_certs_renewal",
            "title": "Representations and Certifications Update",
            "description": "Annual update of representations and certifications is required in SAM.gov.",
            "days_from_now": 365,
        },
        {
            "deadline_type": "cage_code_renewal",
            "title": "CAGE Code Annual Review",
            "description": "Review and update your CAGE Code information annually to ensure accuracy.",
            "days_from_now": 365,
        },
    ]

    created_deadlines = []

    for config in deadlines_config:
        deadline = ComplianceDeadline(
            id=uuid.uuid4(),
            workspace_id=workspace_id,
            deadline_type=config["deadline_type"],
            title=config["title"],
            description=config["description"],
            deadline_date=today + timedelta(days=config["days_from_now"]),
            is_completed=False,
            source_workflow_session_id=workflow_session_id,
        )
        db.add(deadline)
        created_deadlines.append(deadline)

    audit = AuditLog(
        workspace_id=workspace_id,
        actor_type="system",
        event_type="compliance.deadlines.auto_created",
        new_state="pending",
        extra_data={
            "source_workflow_session_id": str(workflow_session_id),
            "created_count": len(created_deadlines),
            "deadline_types": [d.deadline_type for d in created_deadlines],
        },
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "created_count": len(created_deadlines),
        "deadlines": [
            {
                "id": str(d.id),
                "type": d.deadline_type,
                "title": d.title,
                "deadline_date": d.deadline_date.isoformat(),
            }
            for d in created_deadlines
        ],
    }
