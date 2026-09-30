"""
Acceptance criteria test suite — maps 1:1 to SOW Pass/Fail criteria.
All tests must pass before each milestone payment is released.
"""
import pytest
import uuid
from unittest.mock import patch, MagicMock
from sqlalchemy.orm import Session

from app.models.entitlement import Entitlement
from app.models.audit_log import AuditLog
from app.models.workflow import WorkflowSession
from app.models.business_profile import BusinessProfile
from app.models.document import GeneratedDocument


# ---------------------------------------------------------------------------
# Fixtures are now provided by tests/conftest.py (db, test_workspace_id, test_user_id)
# ---------------------------------------------------------------------------


class TestEntitlementGating:
    def test_workflow_blocked_without_payment(self):
        """Workflow access must return 403 without payment."""
        pytest.skip("Implement in Milestone 2")

    def test_stripe_payment_unlocks_workflow(self):
        """Stripe checkout.session.completed must unlock workflow immediately."""
        pytest.skip("Implement in Milestone 2")

    def test_one_time_access_locked_after_completion(
        self, db, test_workspace_id
    ):
        """M3: sam_onboarding_status=completed must block re-entry (403)."""
        from fastapi import HTTPException

        from app.api.v1.deps import require_sam_onboarding_access

        ent = Entitlement(
            workspace_id=test_workspace_id,
            sam_onboarding_status="completed",
            subscription_tier="complete",
            subscription_status="active",
        )
        db.add(ent)
        db.commit()

        mock_user = MagicMock()
        mock_user.workspace_id = test_workspace_id
        mock_user.id = uuid.uuid4()

        # require_sam_onboarding_access blocks 'completed' status — call directly
        with pytest.raises(HTTPException) as exc_info:
            require_sam_onboarding_access(current_user=mock_user, db=db)
        assert exc_info.value.status_code == 403
        assert exc_info.value.detail["code"] == "workflow_already_completed"

    def test_subscription_enables_compliance(self):
        """Active subscription must allow compliance dashboard access."""
        pytest.skip("Implement in Milestone 4")

    def test_subscription_lapse_disables_compliance(self):
        """payment_failed webhook must immediately block compliance access."""
        pytest.skip("Implement in Milestone 2")

    def test_all_access_control_server_side(self):
        """Bypass attempts via direct API calls must all return 403."""
        pytest.skip("Implement in Milestone 2")

    def test_save_resume_workflow(self, db, test_workspace_id):
        """M3: Logout and re-login must restore exact workflow position."""
        from app.services.workflow_service import get_or_create_session, save_step

        save_step(db, test_workspace_id, "business_info", {
            "legal_name": "Test Corp",
            "ein": "123456789",
            "address_line1": "123 Main St",
            "city": "Washington",
            "state": "DC",
            "zip_code": "20001",
            "business_type": "llc",
        })

        db.expunge_all()
        session_data = get_or_create_session(db, test_workspace_id)

        assert session_data["status"] == "in_progress"
        assert "business_info" in session_data["completed_steps"]
        assert session_data["step_data"]["business_info"]["legal_name"] == "Test Corp"

    def test_documents_generate_correctly(
        self, db, test_workspace_id, test_user_id
    ):
        """M3: Generated PDF must contain all required fields."""
        from app.services.document_service import generate_documents

        # Set up completed workflow + profile
        session = WorkflowSession(
            workspace_id=test_workspace_id,
            status="completed",
            current_step="complete",
            completed_steps=["business_info", "naics_codes", "banking_info", "reps_certs", "document_review", "preflight"],
            step_data={"reps_certs": {"responses": {}}},
        )
        db.add(session)

        profile = BusinessProfile(
            workspace_id=test_workspace_id,
            legal_name="Test Corp",
            ein_last_four="6789",
            business_type="llc",
            address_line1="123 Main St",
            city="Washington",
            state="DC",
            zip_code="20001",
            primary_naics="541511",
            naics_codes=["541511"],
            bank_name="Test Bank",
            banking_account_holder="Test Corp",
            routing_last_four="0021",
            account_last_four="7890",
        )
        db.add(profile)
        db.commit()

        with patch("app.services.document_service.storage") as mock_storage:
            mock_storage.upload_file = MagicMock()
            result = generate_documents(db, str(test_workspace_id), actor_id=test_user_id)

        assert len(result["documents"]) == 3
        doc_types = [d["document_type"] for d in result["documents"]]
        assert "sam_checklist" in doc_types
        assert "reps_certs" in doc_types
        assert "banking_authorization" in doc_types

        # Verify audit log was created
        log = db.query(AuditLog).filter(
            AuditLog.workspace_id == test_workspace_id,
            AuditLog.event_type == "document.generated",
        ).first()
        assert log is not None
        assert log.extra_data["document_count"] == 3

    def test_compliance_deadlines_display(self):
        """Compliance dashboard must show deadlines = completion_date + 365 days."""
        pytest.skip("Implement in Milestone 4")
