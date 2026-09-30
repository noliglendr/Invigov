"""
Milestone 2 Test: Workflow Engine with Business Profile Integration

Tests the complete workflow flow from step submission to business profile creation.
"""
import pytest
from sqlalchemy.orm import Session
from app.services.workflow_service import (
    get_or_create_session,
    save_step,
    get_preflight_status,
    complete_workflow,
    get_far_clauses_for_entity,
)
from app.models.workflow import WorkflowSession
from app.models.business_profile import BusinessProfile
from app.models.entitlement import Entitlement


def test_workflow_session_creation(db: Session, test_workspace_id: str):
    """Test: Create new workflow session"""
    session_data = get_or_create_session(db, test_workspace_id)

    assert session_data["workspace_id"] == str(test_workspace_id)
    assert session_data["status"] == "not_started"
    assert session_data["current_step"] == "business_info"
    assert session_data["step_data"] == {}
    assert session_data["completed_steps"] == []


def test_save_business_info_step(db: Session, test_workspace_id: str):
    """Test: Save business info step with EIN encryption"""
    business_data = {
        "legal_name": "Test Company LLC",
        "ein": "123456789",
        "address_line1": "123 Main St",
        "city": "Washington",
        "state": "DC",
        "zip_code": "20001",
        "business_type": "llc",
    }

    result = save_step(db, test_workspace_id, "business_info", business_data)

    assert result["success"] is True
    assert result["step"] == "business_info"
    assert "business_info" in result["completed_steps"]

    # Verify encrypted storage
    session = db.query(WorkflowSession).filter(
        WorkflowSession.workspace_id == test_workspace_id
    ).first()

    stored_ein = session.step_data["business_info"]["ein"]
    assert stored_ein != "123456789"  # Should be encrypted
    assert session.step_data["business_info"]["ein_last_four"] == "6789"


def test_far_clauses_filtering(db: Session):
    """Test: FAR/DFARS clauses filter by entity type"""

    # Sole proprietor should NOT get DFARS clauses
    sole_proprietor_clauses = get_far_clauses_for_entity("sole_proprietor")
    assert "DFARS_252_204_7012" not in sole_proprietor_clauses
    assert "FAR_52_219_1" in sole_proprietor_clauses

    # Corporation should get ALL clauses including DFARS
    corporation_clauses = get_far_clauses_for_entity("corporation")
    assert "DFARS_252_204_7012" in corporation_clauses
    assert "FAR_52_219_1" in corporation_clauses

    # Verify we have 20+ clauses total
    assert len(corporation_clauses) >= 20


def test_complete_workflow_saves_business_profile(
    db: Session,
    test_workspace_id: str,
    test_entitlement_active: Entitlement,
):
    """Test: Complete workflow saves data to business_profiles table"""

    # Step 1: Business Info
    save_step(db, test_workspace_id, "business_info", {
        "legal_name": "Test Company LLC",
        "ein": "123456789",
        "address_line1": "123 Main St",
        "city": "Washington",
        "state": "DC",
        "zip_code": "20001",
        "business_type": "llc",
    })

    # Step 2: NAICS Codes
    save_step(db, test_workspace_id, "naics_codes", {
        "naics_codes": ["541511", "541512"],
        "primary_naics": "541511",
        "annual_receipts_avg": 500000,
        "total_employees": 10,
    })

    # Step 3: Banking Info
    save_step(db, test_workspace_id, "banking_info", {
        "routing_number": "021000021",
        "account_number": "1234567890",
        "account_holder": "Test Company LLC",
        "bank_name": "Test Bank",
    })

    # Step 4: Reps & Certs (minimal for testing)
    far_clauses = get_far_clauses_for_entity("llc")
    responses = {}
    for clause_id in far_clauses.keys():
        responses[clause_id] = {"cert": True}

    save_step(db, test_workspace_id, "reps_certs", {"responses": responses})

    # Verify preflight passes
    preflight = get_preflight_status(db, test_workspace_id)
    assert preflight["is_ready"] is True
    assert preflight["blocking_count"] == 0

    # Complete workflow
    result = complete_workflow(db, test_workspace_id)

    assert result["success"] is True
    assert result["status"] == "completed"

    # Verify business profile was created
    business_profile = db.query(BusinessProfile).filter(
        BusinessProfile.workspace_id == test_workspace_id
    ).first()

    assert business_profile is not None
    assert business_profile.legal_name == "Test Company LLC"
    assert business_profile.ein_last_four == "6789"
    assert business_profile.primary_naics == "541511"
    assert business_profile.naics_codes == ["541511", "541512"]
    assert business_profile.business_type == "llc"

    # Verify encrypted fields
    assert business_profile.ein_encrypted is not None
    assert business_profile.banking_account_encrypted is not None

    # Verify entitlement status changed to 'completed'
    entitlement = db.query(Entitlement).filter(
        Entitlement.workspace_id == test_workspace_id
    ).first()
    assert entitlement.sam_onboarding_status == "completed"
    assert entitlement.sam_onboarding_completed_at is not None


def test_preflight_fails_with_missing_fields(db: Session, test_workspace_id: str):
    """Test: Preflight validation catches missing required fields"""

    # Only save partial data (no EIN, no banking)
    save_step(db, test_workspace_id, "business_info", {
        "legal_name": "Test Company",
        "address_line1": "123 Main St",
        "city": "Washington",
        "state": "DC",
        "zip_code": "20001",
    })

    preflight = get_preflight_status(db, test_workspace_id)

    assert preflight["is_ready"] is False
    assert preflight["blocking_count"] > 0

    # Find the specific failure
    checks = {c["name"]: c for c in preflight["checks"]}
    assert checks["ein"]["passed"] is False
    assert checks["ein"]["blocking"] is True


def test_workflow_save_and_resume(db: Session, test_workspace_id: str):
    """Test: User can log out and resume workflow from same step"""

    # Save step 1
    save_step(db, test_workspace_id, "business_info", {
        "legal_name": "Test Company LLC",
        "ein": "123456789",
        "address_line1": "123 Main St",
        "city": "Washington",
        "state": "DC",
        "zip_code": "20001",
        "business_type": "llc",
    })

    # Simulate logout (close session)
    db.expunge_all()

    # Simulate new login session - retrieve workflow
    session_data = get_or_create_session(db, test_workspace_id)

    # Verify data was preserved
    assert session_data["status"] == "in_progress"
    assert "business_info" in session_data["completed_steps"]
    assert session_data["step_data"]["business_info"]["legal_name"] == "Test Company LLC"
    assert session_data["current_step"] == "naics_codes"  # Advanced to next step


# Pytest fixtures — `db` and `test_workspace_id` are provided by tests/conftest.py.


@pytest.fixture
def test_entitlement_active(db: Session, test_workspace_id: str):
    """Create entitlement with 'active' sam_onboarding_status"""
    entitlement = Entitlement(
        workspace_id=test_workspace_id,
        sam_onboarding_status="active",
    )
    db.add(entitlement)
    db.commit()
    return entitlement


if __name__ == "__main__":
    print("M2 Workflow Tests:")
    print("- test_workflow_session_creation")
    print("- test_save_business_info_step")
    print("- test_far_clauses_filtering")
    print("- test_complete_workflow_saves_business_profile")
    print("- test_preflight_fails_with_missing_fields")
    print("- test_workflow_save_and_resume")
    print("\nRun with: pytest tests/test_m2_workflow.py -v")
