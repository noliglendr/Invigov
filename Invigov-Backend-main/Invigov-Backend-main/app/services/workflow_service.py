"""
Milestone 2: Workflow Engine Implementation
Handles SAM.gov procurement workflow state machine, save/resume, and preflight validation.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.workflow import WorkflowSession, RepsCertsResponse, WORKFLOW_STEPS
from app.models.entitlement import Entitlement
from app.models.audit_log import AuditLog
from app.models.business_profile import BusinessProfile
from app.core.encryption import encrypt, decrypt


# ============================================================================
# FAR/DFARS Clause Definitions (20+ clauses as per SOW)
# ============================================================================

FAR_CLAUSES = {
    "FAR_52_203_2": {
        "title": "Certificate of Independent Price Determination",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "cert_independent_price",
                "question": "Do you certify independent price determination?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_209_5": {
        "title": "Certification Regarding Responsibility Matters",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "no_felony_conviction",
                "question": "No felony conviction in the preceding 3 years?",
                "type": "boolean"
            },
            {
                "id": "no_tax_delinquency",
                "question": "No federal tax delinquency?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_212_3": {
        "title": "Offeror Representations and Certifications (Commercial)",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "commercial_cert",
                "question": "Do you certify commercial item compliance?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_219_1": {
        "title": "Small Business Program Representations",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "is_small_business",
                "question": "Is your business a small business?",
                "type": "boolean"
            },
            {
                "id": "is_wosb",
                "question": "Woman-Owned Small Business (WOSB)?",
                "type": "boolean"
            },
            {
                "id": "is_sdvosb",
                "question": "Service-Disabled Veteran-Owned Small Business (SDVOSB)?",
                "type": "boolean"
            },
            {
                "id": "is_hubzone",
                "question": "HUBZone Small Business?",
                "type": "boolean"
            },
            {
                "id": "is_8a",
                "question": "8(a) Small Disadvantaged Business?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_222_21": {
        "title": "Prohibition of Segregated Facilities",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "no_segregated_facilities",
                "question": "Do you certify no segregated facilities?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_222_26": {
        "title": "Equal Opportunity",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "equal_opportunity_compliance",
                "question": "Do you comply with Equal Opportunity requirements?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_222_35": {
        "title": "Equal Opportunity for Veterans",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "veteran_equal_opportunity",
                "question": "Do you comply with veteran equal opportunity requirements?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_222_36": {
        "title": "Equal Opportunity for Workers with Disabilities",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "disability_equal_opportunity",
                "question": "Do you comply with disability equal opportunity requirements?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_223_6": {
        "title": "Drug-Free Workplace",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "drug_free_workplace",
                "question": "Do you maintain a drug-free workplace?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_225_2": {
        "title": "Buy American Certificate",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "buy_american_compliance",
                "question": "Do you comply with Buy American Act requirements?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_232_33": {
        "title": "Payment by Electronic Funds Transfer",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "eft_payment_acceptance",
                "question": "Do you accept payment by EFT?",
                "type": "boolean"
            }
        ]
    },
    "DFARS_252_204_7012": {
        "title": "Covered Defense Telecommunications Equipment",
        "applicable_to": ["corporation", "llc", "partnership", "nonprofit"],  # Excludes sole_proprietor
        "questions": [
            {
                "id": "no_covered_telecom",
                "question": "Do you certify no use of covered telecommunications equipment?",
                "type": "boolean"
            }
        ]
    },
    "DFARS_252_225_7001": {
        "title": "Buy American — Balance of Payments Program",
        "applicable_to": ["corporation", "llc", "partnership", "nonprofit"],
        "questions": [
            {
                "id": "buy_american_dfars",
                "question": "Do you comply with DFARS Buy American requirements?",
                "type": "boolean"
            }
        ]
    },
    # Additional FAR clauses to reach 20+
    "FAR_52_204_10": {
        "title": "Reporting Executive Compensation and First-Tier Subcontract Awards",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "exec_comp_reporting",
                "question": "Will you comply with executive compensation reporting?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_209_10": {
        "title": "Prohibition on Contracting with Inverted Domestic Corporations",
        "applicable_to": ["corporation"],
        "questions": [
            {
                "id": "not_inverted_corp",
                "question": "Are you NOT an inverted domestic corporation?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_219_28": {
        "title": "Post-Award Small Business Program Rerepresentation",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "small_business_rerepresent",
                "question": "Will you rerepresent small business status post-award if required?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_222_50": {
        "title": "Combating Trafficking in Persons",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "anti_trafficking",
                "question": "Do you comply with anti-trafficking requirements?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_223_18": {
        "title": "Encouraging Contractor Policies to Ban Text Messaging While Driving",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "no_texting_while_driving",
                "question": "Do you have policies against texting while driving?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_225_13": {
        "title": "Restrictions on Certain Foreign Purchases",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "foreign_purchase_restrictions",
                "question": "Do you comply with foreign purchase restrictions?",
                "type": "boolean"
            }
        ]
    },
    "FAR_52_233_3": {
        "title": "Protest After Award",
        "applicable_to": ["all"],
        "questions": [
            {
                "id": "protest_understanding",
                "question": "Do you understand protest procedures?",
                "type": "boolean"
            }
        ]
    },
    "DFARS_252_203_7000": {
        "title": "Requirements Relating to Compensation of Former DoD Officials",
        "applicable_to": ["corporation", "llc", "partnership", "nonprofit"],
        "questions": [
            {
                "id": "no_improper_dod_hiring",
                "question": "Do you comply with former DoD official hiring restrictions?",
                "type": "boolean"
            }
        ]
    },
}


def get_applicable_clauses(business_type: str) -> dict:
    """
    Filter FAR/DFARS clauses based on entity type.
    Sole proprietors exclude DFARS clauses.
    """
    applicable = {}
    for clause_id, clause_data in FAR_CLAUSES.items():
        if "all" in clause_data["applicable_to"] or business_type in clause_data["applicable_to"]:
            applicable[clause_id] = clause_data
    return applicable


# ============================================================================
# Core Workflow Functions
# ============================================================================

def get_or_create_session(db: Session, workspace_id: str):
    """
    GET /api/v1/workflow/session
    Returns existing session or creates a new one.
    Enforces one active session per workspace.
    """
    # Check if session already exists
    session = db.query(WorkflowSession).filter(
        WorkflowSession.workspace_id == workspace_id,
        WorkflowSession.status.in_(["not_started", "in_progress", "preflight"])
    ).first()

    if session:
        # Return existing session with step data
        return {
            "id": str(session.id),
            "workspace_id": str(session.workspace_id),
            "status": session.status,
            "current_step": session.current_step,
            "step_data": session.step_data or {},
            "completed_steps": session.completed_steps or [],
            "started_at": session.started_at.isoformat(),
            "last_active_at": session.last_active_at.isoformat(),
        }

    # Create new session
    new_session = WorkflowSession(
        workspace_id=workspace_id,
        status="not_started",
        current_step="business_info",
        step_data={},
        completed_steps=[],
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Log session creation
    audit_log = AuditLog(
        workspace_id=workspace_id,
        event_type="workflow.session.created",
        actor_type="system",
        actor_id=None,
        extra_data={"session_id": str(new_session.id)},
    )
    db.add(audit_log)
    db.commit()

    return {
        "id": str(new_session.id),
        "workspace_id": str(workspace_id),
        "status": new_session.status,
        "current_step": new_session.current_step,
        "step_data": {},
        "completed_steps": [],
        "started_at": new_session.started_at.isoformat(),
        "last_active_at": new_session.last_active_at.isoformat(),
    }


def save_step(db: Session, workspace_id: str, step_name: str, data: dict):
    """
    POST /api/v1/workflow/step/{step_name}
    Saves step data and updates workflow state.
    Handles encryption for sensitive fields (EIN, banking).
    All data stored in workflow_sessions.step_data JSONB field.
    """
    # Validate step name
    if step_name not in WORKFLOW_STEPS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid step: {step_name}"
        )

    # Get or create session
    session = db.query(WorkflowSession).filter(
        WorkflowSession.workspace_id == workspace_id,
        WorkflowSession.status.in_(["not_started", "in_progress", "preflight"])
    ).first()

    if not session:
        session = WorkflowSession(
            workspace_id=workspace_id,
            status="in_progress",
            current_step=step_name,
            step_data={},
            completed_steps=[],
        )
        db.add(session)
        db.flush()

    # Initialize step_data if needed
    if not session.step_data:
        session.step_data = {}

    # Copy data for modification (don't modify original)
    step_data = data.copy()

    # Process step-specific encryption
    if step_name == "business_info":
        # Encrypt EIN before storing
        ein = step_data.get("ein")
        if ein:
            import base64
            encrypted_ein = encrypt(ein)
            step_data["ein"] = base64.b64encode(encrypted_ein).decode('utf-8')
            step_data["ein_last_four"] = ein[-4:] if len(ein) >= 4 else ein

    elif step_name == "banking_info":
        # Encrypt banking information before storing
        import base64
        routing_number = step_data.get("routing_number")
        account_number = step_data.get("account_number")

        if routing_number:
            encrypted_routing = encrypt(routing_number)
            step_data["routing_number"] = base64.b64encode(encrypted_routing).decode('utf-8')
            step_data["routing_last_four"] = routing_number[-4:] if len(routing_number) >= 4 else routing_number

        if account_number:
            encrypted_account = encrypt(account_number)
            step_data["account_number"] = base64.b64encode(encrypted_account).decode('utf-8')
            step_data["account_last_four"] = account_number[-4:] if len(account_number) >= 4 else account_number

    elif step_name == "reps_certs":
        # Store FAR/DFARS responses in separate table for querying
        responses = data.get("responses", {})

        # Get business type for clause filtering
        business_type = session.step_data.get("business_info", {}).get("business_type", "corporation")
        applicable_clauses = get_applicable_clauses(business_type)

        # Save each clause response
        for clause_id, clause_response in responses.items():
            if clause_id in applicable_clauses:
                existing = db.query(RepsCertsResponse).filter(
                    RepsCertsResponse.workspace_id == workspace_id,
                    RepsCertsResponse.workflow_session_id == session.id,
                    RepsCertsResponse.far_clause == clause_id
                ).first()

                if existing:
                    existing.responses = clause_response
                    existing.completed_at = datetime.utcnow()
                else:
                    reps_certs = RepsCertsResponse(
                        workspace_id=workspace_id,
                        workflow_session_id=session.id,
                        far_clause=clause_id,
                        clause_title=applicable_clauses[clause_id]["title"],
                        responses=clause_response,
                        completed_at=datetime.utcnow(),
                    )
                    db.add(reps_certs)

    # Update session step_data with processed data
    session.step_data[step_name] = step_data
    session.status = "in_progress"
    session.last_active_at = datetime.utcnow()

    # Mark step as completed if not already
    if not session.completed_steps:
        session.completed_steps = []

    if step_name not in session.completed_steps:
        session.completed_steps.append(step_name)

    # Update current step to next in sequence
    try:
        current_index = WORKFLOW_STEPS.index(step_name)
        if current_index < len(WORKFLOW_STEPS) - 1:
            session.current_step = WORKFLOW_STEPS[current_index + 1]
    except ValueError:
        pass

    # Mark the session as modified to ensure JSONB update
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(session, "step_data")

    db.commit()
    db.refresh(session)

    # Log step completion
    audit_log = AuditLog(
        workspace_id=workspace_id,
        event_type=f"workflow.step.{step_name}",
        actor_type="user",
        actor_id=str(workspace_id),
        extra_data={
            "session_id": str(session.id),
            "step": step_name,
        },
    )
    db.add(audit_log)
    db.commit()

    return {
        "success": True,
        "step": step_name,
        "current_step": session.current_step,
        "completed_steps": session.completed_steps,
    }


def get_preflight_status(db: Session, workspace_id: str):
    """
    GET /api/v1/workflow/preflight
    Validates all required fields before workflow completion.
    Returns blocking issues and readiness status.
    """
    session = db.query(WorkflowSession).filter(
        WorkflowSession.workspace_id == workspace_id
    ).first()

    if not session:
        # No session exists, all checks fail
        return {
            "is_ready": False,
            "checks": [
                {"name": "workflow_session", "passed": False, "message": "No workflow session found", "blocking": True}
            ],
            "blocking_count": 1,
        }

    step_data = session.step_data or {}
    business_info = step_data.get("business_info", {})
    naics_info = step_data.get("naics_codes", {})
    banking_info = step_data.get("banking_info", {})

    checks = []
    blocking_count = 0

    # Check business info fields
    if not business_info.get("legal_name"):
        checks.append({"name": "legal_name", "passed": False, "message": "Legal name is required", "blocking": True})
        blocking_count += 1
    else:
        checks.append({"name": "legal_name", "passed": True, "message": "Legal name provided", "blocking": False})

    if not business_info.get("ein"):
        checks.append({"name": "ein", "passed": False, "message": "EIN is required", "blocking": True})
        blocking_count += 1
    else:
        checks.append({"name": "ein", "passed": True, "message": "EIN provided (encrypted)", "blocking": False})

    if not business_info.get("address_line1"):
        checks.append({"name": "address", "passed": False, "message": "Address is required", "blocking": True})
        blocking_count += 1
    else:
        checks.append({"name": "address", "passed": True, "message": "Address provided", "blocking": False})

    # Check NAICS codes
    if not naics_info.get("primary_naics"):
        checks.append({"name": "primary_naics", "passed": False, "message": "Primary NAICS code is required", "blocking": True})
        blocking_count += 1
    else:
        checks.append({"name": "primary_naics", "passed": True, "message": "Primary NAICS provided", "blocking": False})

    # Check banking info
    if not banking_info.get("account_number"):
        checks.append({"name": "banking_info", "passed": False, "message": "Banking information is required", "blocking": True})
        blocking_count += 1
    else:
        checks.append({"name": "banking_info", "passed": True, "message": "Banking info provided (encrypted)", "blocking": False})

    # Check reps & certs
    business_type = business_info.get("business_type", "corporation")
    applicable_clauses = get_applicable_clauses(business_type)

    reps_certs_count = db.query(RepsCertsResponse).filter(
        RepsCertsResponse.workspace_id == workspace_id
    ).count()

    expected_count = len(applicable_clauses)
    if reps_certs_count < expected_count:
        checks.append({
            "name": "reps_certs",
            "passed": False,
            "message": f"Incomplete ({reps_certs_count}/{expected_count} clauses completed)",
            "blocking": True
        })
        blocking_count += 1
    else:
        checks.append({"name": "reps_certs", "passed": True, "message": "All FAR/DFARS clauses completed", "blocking": False})

    is_ready = blocking_count == 0

    # Update session preflight results
    if session:
        session.preflight_results = {
            "is_ready": is_ready,
            "checks": checks,
            "blocking_count": blocking_count,
            "checked_at": datetime.utcnow().isoformat(),
        }
        if is_ready:
            session.status = "preflight"
        db.commit()

    return {
        "is_ready": is_ready,
        "checks": checks,
        "blocking_count": blocking_count,
    }


def complete_workflow(db: Session, workspace_id: str):
    """
    POST /api/v1/workflow/complete
    Marks workflow as completed and updates entitlement status.
    Triggers SAM onboarding status = 'completed' (one-time lock).
    Saves all workflow data to business_profiles table.
    """
    # Verify preflight status
    preflight = get_preflight_status(db, workspace_id)
    if not preflight["is_ready"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "preflight_failed",
                "message": "Cannot complete workflow. Please resolve all blocking issues.",
                "checks": preflight["checks"],
            }
        )

    # Get session
    session = db.query(WorkflowSession).filter(
        WorkflowSession.workspace_id == workspace_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow session not found"
        )

    if session.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow already completed"
        )

    # Extract workflow data from step_data
    step_data = session.step_data or {}
    business_info = step_data.get("business_info", {})
    naics_info = step_data.get("naics_codes", {})
    banking_info = step_data.get("banking_info", {})

    # Save or update business profile
    business_profile = db.query(BusinessProfile).filter(
        BusinessProfile.workspace_id == workspace_id
    ).first()

    if not business_profile:
        business_profile = BusinessProfile(workspace_id=workspace_id)
        db.add(business_profile)

    # Map business info (encrypted fields are base64 encoded in step_data)
    import base64
    business_profile.legal_name = business_info.get("legal_name")
    business_profile.dba_name = business_info.get("dba_name")

    # Decode base64 back to bytes for database storage
    ein_b64 = business_info.get("ein")
    if ein_b64:
        business_profile.ein_encrypted = base64.b64decode(ein_b64)
    business_profile.ein_last_four = business_info.get("ein_last_four")

    business_profile.address_line1 = business_info.get("address_line1")
    business_profile.address_line2 = business_info.get("address_line2")
    business_profile.city = business_info.get("city")
    business_profile.state = business_info.get("state")
    business_profile.zip_code = business_info.get("zip_code")
    business_profile.country = business_info.get("country", "US")
    business_profile.business_type = business_info.get("business_type")
    business_profile.uei_number = business_info.get("uei_number")

    # Map NAICS info
    business_profile.naics_codes = naics_info.get("naics_codes")
    business_profile.primary_naics = naics_info.get("primary_naics")
    business_profile.annual_receipts_avg = naics_info.get("annual_receipts_avg")
    business_profile.total_employees = naics_info.get("total_employees")

    # Map banking info (encrypted fields are base64 encoded in step_data)
    routing_b64 = banking_info.get("routing_number")
    if routing_b64:
        business_profile.banking_routing_encrypted = base64.b64decode(routing_b64)
    business_profile.routing_last_four = banking_info.get("routing_last_four")

    account_b64 = banking_info.get("account_number")
    if account_b64:
        business_profile.banking_account_encrypted = base64.b64decode(account_b64)
    business_profile.banking_account_holder = banking_info.get("account_holder")
    business_profile.bank_name = banking_info.get("bank_name")

    business_profile.updated_at = datetime.utcnow()

    # Mark session as completed
    session.status = "completed"
    session.completed_at = datetime.utcnow()
    session.current_step = "complete"

    # Update entitlement to 'completed' (one-time lock)
    entitlement = db.query(Entitlement).filter(
        Entitlement.workspace_id == workspace_id
    ).first()

    if entitlement:
        old_status = entitlement.sam_onboarding_status
        entitlement.sam_onboarding_status = "completed"
        entitlement.sam_onboarding_completed_at = datetime.utcnow()

        # Log entitlement change
        audit_log = AuditLog(
            workspace_id=workspace_id,
            event_type="entitlement.sam_onboarding.completed",
            actor_type="system",
            actor_id=None,
            previous_state=old_status,
            new_state="completed",
            extra_data={
                "trigger": "workflow_completion",
            },
        )
        db.add(audit_log)

    db.commit()
    db.refresh(session)

    # Create compliance deadlines for renewal tracking
    from app.services.compliance_service import create_workflow_deadlines
    try:
        deadlines_result = create_workflow_deadlines(
            db=db,
            workspace_id=workspace_id,
            workflow_session_id=session.id
        )
        deadlines_created = deadlines_result["created_count"]
    except Exception as e:
        # Log error but don't fail workflow completion
        deadlines_created = 0
        print(f"Error creating compliance deadlines: {e}")

    # Log workflow completion
    audit_log = AuditLog(
        workspace_id=workspace_id,
        event_type="workflow.completed",
        actor_type="user",
        actor_id=str(workspace_id),
        previous_state="in_progress",
        new_state="completed",
        extra_data={
            "session_id": str(session.id),
            "completed_at": session.completed_at.isoformat(),
            "business_profile_saved": True,
            "compliance_deadlines_created": deadlines_created,
        },
    )
    db.add(audit_log)
    db.commit()

    return {
        "success": True,
        "status": "completed",
        "completed_at": session.completed_at.isoformat(),
        "message": "Workflow completed successfully. SAM onboarding access is now read-only.",
        "compliance_deadlines_created": deadlines_created,
    }


def get_far_clauses_for_entity(business_type: str):
    """
    Helper function to get filtered FAR/DFARS clauses.
    Used by frontend to display appropriate questions.
    """
    return get_applicable_clauses(business_type)
