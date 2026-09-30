# M3 implementation: Generate SAM.gov registration documents
# Creates 3 document types × 2 formats (PDF + DOCX) = 6 files total

import uuid
from datetime import datetime, timedelta
from io import BytesIO
from sqlalchemy.orm import Session
from xhtml2pdf import pisa
from docx import Document as DocxDocument
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

from app.models.document import GeneratedDocument
from app.models.business_profile import BusinessProfile
from app.models.workflow import WorkflowSession
from app.models.audit_log import AuditLog
from app.services import storage
from app.services.workflow_service import FAR_CLAUSES, get_far_clauses_for_entity
from app.core.encryption import decrypt


def generate_documents(db: Session, workspace_id: str, actor_id: str = None):
    """
    Generate all 3 SAM.gov registration documents in both PDF and DOCX format.

    Produces 6 files:
      1. SAM Registration Checklist     — PDF + DOCX
      2. Representations & Certifications — PDF + DOCX
      3. Banking Authorization Letter    — PDF + DOCX

    Returns: List of document metadata (all 6 files).
    """
    profile = db.query(BusinessProfile).filter(
        BusinessProfile.workspace_id == workspace_id
    ).first()
    if not profile:
        raise ValueError("Business profile not found. Complete workflow first.")

    session = db.query(WorkflowSession).filter(
        WorkflowSession.workspace_id == workspace_id
    ).first()
    if not session or session.status != "completed":
        raise ValueError("Workflow must be completed before generating documents.")

    safe_name = profile.legal_name.replace(" ", "_")
    documents = []

    # ── 1. SAM Checklist ──────────────────────────────────────────────────────
    checklist_pdf  = _generate_sam_checklist_pdf(profile, session)
    checklist_docx = _generate_sam_checklist_docx(profile, session)

    documents.append(_save_document(
        db=db, workspace_id=workspace_id, workflow_session_id=session.id,
        document_type="sam_checklist",
        filename=f"SAM_Checklist_{safe_name}.pdf",
        file_bytes=checklist_pdf, content_type="application/pdf",
    ))
    documents.append(_save_document(
        db=db, workspace_id=workspace_id, workflow_session_id=session.id,
        document_type="sam_checklist",
        filename=f"SAM_Checklist_{safe_name}.docx",
        file_bytes=checklist_docx,
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ))

    # ── 2. Reps & Certs ───────────────────────────────────────────────────────
    reps_pdf  = _generate_reps_certs_pdf(profile, session)
    reps_docx = _generate_reps_certs_docx(profile, session)

    documents.append(_save_document(
        db=db, workspace_id=workspace_id, workflow_session_id=session.id,
        document_type="reps_certs",
        filename=f"Reps_Certs_{safe_name}.pdf",
        file_bytes=reps_pdf, content_type="application/pdf",
    ))
    documents.append(_save_document(
        db=db, workspace_id=workspace_id, workflow_session_id=session.id,
        document_type="reps_certs",
        filename=f"Reps_Certs_{safe_name}.docx",
        file_bytes=reps_docx,
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ))

    # ── 3. Banking Authorization ───────────────────────────────────────────────
    banking_pdf  = _generate_banking_authorization_pdf(profile)
    banking_docx = _generate_banking_authorization_docx(profile)

    documents.append(_save_document(
        db=db, workspace_id=workspace_id, workflow_session_id=session.id,
        document_type="banking_authorization",
        filename=f"Banking_Auth_{safe_name}.pdf",
        file_bytes=banking_pdf, content_type="application/pdf",
    ))
    documents.append(_save_document(
        db=db, workspace_id=workspace_id, workflow_session_id=session.id,
        document_type="banking_authorization",
        filename=f"Banking_Auth_{safe_name}.docx",
        file_bytes=banking_docx,
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ))

    # SOW §4.4 — audit log
    db.add(AuditLog(
        workspace_id=workspace_id,
        actor_type="user",
        actor_id=actor_id,
        event_type="document.generated",
        new_state="generated",
        extra_data={
            "document_count": len(documents),
            "document_types": [doc.document_type for doc in documents],
            "document_ids": [str(doc.id) for doc in documents],
            "formats": ["pdf", "docx"],
        },
    ))
    db.commit()

    return {
        "documents": [
            {
                "id": str(doc.id),
                "document_type": doc.document_type,
                "filename": doc.filename,
                "content_type": doc.content_type,
                "format": "docx" if doc.filename.endswith(".docx") else "pdf",
                "file_size_bytes": doc.file_size_bytes,
                "generated_at": doc.generated_at.isoformat(),
            }
            for doc in documents
        ]
    }


def get_document_url(db: Session, workspace_id: str, document_id: str, actor_id: str = None):
    """
    Generate a signed download URL for a document (expires in 1 hour).
    Updates download count and last_downloaded_at.

    For local storage, returns file path that will be served by the API endpoint.
    For R2 storage, returns presigned URL.
    """
    doc = db.query(GeneratedDocument).filter(
        GeneratedDocument.id == document_id,
        GeneratedDocument.workspace_id == workspace_id,
        GeneratedDocument.is_active == True
    ).first()

    if not doc:
        raise ValueError("Document not found or access denied.")

    # Generate signed URL (1 hour expiration) or local file path
    signed_url = storage.generate_signed_url(doc.r2_object_key, expires_in=3600)

    # Update download tracking
    doc.download_count += 1
    doc.last_downloaded_at = datetime.utcnow()
    doc.signed_url_expires_at = datetime.utcnow() + timedelta(hours=1)

    # SOW §4.4 — audit log: document download event
    audit_log = AuditLog(
        workspace_id=workspace_id,
        actor_type="user",
        actor_id=actor_id,
        event_type="document.downloaded",
        new_state="downloaded",
        extra_data={
            "document_id": str(doc.id),
            "document_type": doc.document_type,
            "filename": doc.filename,
            "download_count": doc.download_count,
        },
    )
    db.add(audit_log)
    db.commit()

    return {
        "download_url": signed_url,
        "filename": doc.filename,
        "expires_at": doc.signed_url_expires_at.isoformat(),
        "download_count": doc.download_count,
        "storage_type": "local" if signed_url.startswith("/") or signed_url.startswith("\\") or ":\\" in signed_url else "r2"
    }


def _save_document(
    db: Session,
    workspace_id: str,
    workflow_session_id: str,
    document_type: str,
    filename: str,
    file_bytes: bytes,
    content_type: str = "application/pdf",
) -> GeneratedDocument:
    """
    Save a generated document (PDF or DOCX) to R2 and create a DB record.
    Idempotent per filename: deactivates the previous version of the same file.
    """
    # Deactivate previous version of the exact same filename
    existing = db.query(GeneratedDocument).filter(
        GeneratedDocument.workspace_id == workspace_id,
        GeneratedDocument.document_type == document_type,
        GeneratedDocument.filename == filename,
        GeneratedDocument.is_active == True,
    ).first()
    if existing:
        existing.is_active = False

    ext = "docx" if "wordprocessingml" in content_type else "pdf"
    object_key = f"{workspace_id}/{document_type}/{uuid.uuid4()}.{ext}"
    storage.upload_file(object_key, file_bytes, content_type=content_type)

    doc = GeneratedDocument(
        workspace_id=workspace_id,
        workflow_session_id=workflow_session_id,
        document_type=document_type,
        filename=filename,
        r2_object_key=object_key,
        file_size_bytes=len(file_bytes),
        content_type=content_type,
        generated_at=datetime.utcnow(),
        is_active=True,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# ============================================================================
# PDF Generation Functions
# ============================================================================

def _generate_sam_checklist_pdf(profile: BusinessProfile, session: WorkflowSession) -> bytes:
    """
    Generate SAM.gov Registration Checklist PDF.
    Lists all required information for SAM.gov registration.
    Full EIN is shown here — this document is the registrant's working reference.
    """
    # Decrypt EIN — registrant needs the full number to enter into SAM.gov
    try:
        ein_full = decrypt(profile.ein_encrypted) if profile.ein_encrypted else None
        ein_display = f"{ein_full[:2]}-{ein_full[2:]}" if ein_full and len(ein_full) == 9 else (ein_full or f"XX-XXXXX{profile.ein_last_four}")
    except Exception:
        ein_display = f"XX-XXXXX{profile.ein_last_four}" if profile.ein_last_four else "N/A"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: letter;
                margin: 1in;
            }}
            body {{
                font-family: Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.5;
                color: #333;
            }}
            h1 {{
                color: #1e40af;
                font-size: 20pt;
                margin-bottom: 10px;
                border-bottom: 3px solid #1e40af;
                padding-bottom: 5px;
            }}
            h2 {{
                color: #1e40af;
                font-size: 14pt;
                margin-top: 20px;
                margin-bottom: 10px;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .section {{
                margin-bottom: 20px;
                padding: 15px;
                background-color: #f9fafb;
                border-left: 4px solid #3b82f6;
            }}
            .field {{
                margin: 8px 0;
            }}
            .label {{
                font-weight: bold;
                color: #1f2937;
            }}
            .value {{
                color: #4b5563;
                margin-left: 10px;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #d1d5db;
                font-size: 9pt;
                color: #6b7280;
                text-align: center;
            }}
            .checklist-item {{
                margin: 10px 0;
                padding: 10px;
                background-color: white;
                border: 1px solid #e5e7eb;
            }}
            .checkmark {{
                color: #10b981;
                font-weight: bold;
                margin-right: 8px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>SAM.gov Registration Checklist</h1>
            <p>Generated on {datetime.utcnow().strftime('%B %d, %Y')}</p>
        </div>

        <div class="section">
            <h2>Business Information</h2>
            <div class="field">
                <span class="label">Legal Business Name:</span>
                <span class="value">{profile.legal_name}</span>
            </div>
            <div class="field">
                <span class="label">DBA Name:</span>
                <span class="value">{profile.dba_name or 'N/A'}</span>
            </div>
            <div class="field">
                <span class="label">Employer Identification Number (EIN):</span>
                <span class="value">{ein_display}</span>
            </div>
            <div class="field">
                <span class="label">Business Type:</span>
                <span class="value">{profile.business_type.replace('_', ' ').title()}</span>
            </div>
            <div class="field">
                <span class="label">Physical Address:</span>
                <span class="value">{profile.address_line1}, {profile.address_line2 or ''}<br>
                {profile.city}, {profile.state} {profile.zip_code}</span>
            </div>
            <div class="field">
                <span class="label">UEI Number:</span>
                <span class="value">{profile.uei_number or 'Will be assigned during registration'}</span>
            </div>
        </div>

        <div class="section">
            <h2>NAICS Codes</h2>
            <div class="field">
                <span class="label">Primary NAICS:</span>
                <span class="value">{profile.primary_naics}</span>
            </div>
            <div class="field">
                <span class="label">All NAICS Codes:</span>
                <span class="value">{', '.join(profile.naics_codes or [])}</span>
            </div>
            {f'''<div class="field">
                <span class="label">Average Annual Receipts:</span>
                <span class="value">${profile.annual_receipts_avg:,.2f}</span>
            </div>''' if profile.annual_receipts_avg else ''}
            {f'''<div class="field">
                <span class="label">Total Employees:</span>
                <span class="value">{profile.total_employees}</span>
            </div>''' if profile.total_employees else ''}
        </div>

        <div class="section">
            <h2>Banking Information</h2>
            <div class="field">
                <span class="label">Bank Name:</span>
                <span class="value">{profile.bank_name}</span>
            </div>
            <div class="field">
                <span class="label">Account Holder:</span>
                <span class="value">{profile.banking_account_holder}</span>
            </div>
            <div class="field">
                <span class="label">Routing Number (last 4):</span>
                <span class="value">XXXXX{profile.routing_last_four}</span>
            </div>
            <p style="font-size: 9pt; color: #6b7280; margin-top: 10px;">
                <strong>Note:</strong> Full banking details are encrypted and available in the Banking Authorization letter.
            </p>
        </div>

        <div class="section">
            <h2>SAM.gov Registration Steps</h2>

            <div class="checklist-item">
                <span class="checkmark">✓</span>
                <strong>Step 1 — DONE:</strong> Gather all required business information
                <div style="font-size:9pt; color:#6b7280; margin-top:4px; padding-left:22px;">
                    Completed via INVIGOV platform. All fields captured in this document.
                </div>
            </div>

            <div class="checklist-item">
                <span class="checkmark">✓</span>
                <strong>Step 2 — DONE:</strong> Complete Representations &amp; Certifications
                <div style="font-size:9pt; color:#6b7280; margin-top:4px; padding-left:22px;">
                    See the attached Reps &amp; Certs PDF (FAR 52.212-3). Print and sign before submission.
                </div>
            </div>

            <div class="checklist-item">
                <span class="checkmark">□</span>
                <strong>Step 3:</strong> Create a Login.gov account (if you don't have one)
                <div style="font-size:9pt; color:#6b7280; margin-top:4px; padding-left:22px;">
                    Go to <strong>login.gov</strong> → Create an account using your business email.
                    SAM.gov requires Login.gov authentication.
                </div>
            </div>

            <div class="checklist-item">
                <span class="checkmark">□</span>
                <strong>Step 4:</strong> Log in to SAM.gov and start a new Entity Registration
                <div style="font-size:9pt; color:#6b7280; margin-top:4px; padding-left:22px;">
                    Go to <strong>sam.gov</strong> → Sign In → "Register New Entity" → Select "Business or Organization"
                </div>
            </div>

            <div class="checklist-item">
                <span class="checkmark">□</span>
                <strong>Step 5:</strong> Obtain a UEI (Unique Entity Identifier)
                <div style="font-size:9pt; color:#6b7280; margin-top:4px; padding-left:22px;">
                    SAM.gov will assign a 12-character UEI automatically during registration.
                    This replaces the legacy DUNS number. Record it here once assigned: ____________
                </div>
            </div>

            <div class="checklist-item">
                <span class="checkmark">□</span>
                <strong>Step 6:</strong> Enter Core Data (Entity Information)
                <div style="font-size:9pt; color:#6b7280; margin-top:4px; padding-left:22px;">
                    Use the information in Section 1 and Section 2 above. Enter EIN exactly as shown.
                    Select your primary and secondary NAICS codes. Set your fiscal year end date.
                </div>
            </div>

            <div class="checklist-item">
                <span class="checkmark">□</span>
                <strong>Step 7:</strong> Enter EFT Banking Information
                <div style="font-size:9pt; color:#6b7280; margin-top:4px; padding-left:22px;">
                    Navigate to <em>Financial Information</em>. Enter the ABA Routing Number and Account Number
                    exactly as shown in the Banking Authorization letter. Required for all federal payments.
                </div>
            </div>

            <div class="checklist-item">
                <span class="checkmark">□</span>
                <strong>Step 8:</strong> Complete Representations &amp; Certifications online
                <div style="font-size:9pt; color:#6b7280; margin-top:4px; padding-left:22px;">
                    SAM.gov has an online Reps &amp; Certs form. Use your signed Reps &amp; Certs PDF as your reference.
                    Answer each FAR clause question consistently with the attached document.
                </div>
            </div>

            <div class="checklist-item">
                <span class="checkmark">□</span>
                <strong>Step 9:</strong> Review all sections and submit
                <div style="font-size:9pt; color:#6b7280; margin-top:4px; padding-left:22px;">
                    Review every section for accuracy. Once submitted, SAM.gov will validate your EIN with the IRS
                    (1–2 business days) and your banking info with your bank.
                </div>
            </div>

            <div class="checklist-item">
                <span class="checkmark">□</span>
                <strong>Step 10:</strong> Await activation (7–10 business days)
                <div style="font-size:9pt; color:#6b7280; margin-top:4px; padding-left:22px;">
                    You will receive email confirmation when your entity is "Active" in SAM.gov.
                    Check status at sam.gov using your UEI. Active status must be renewed annually.
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Important Notes</h2>
            <ul style="font-size:9.5pt; color:#374151; padding-left:20px; margin:0;">
                <li style="margin-bottom:6px;"><strong>Annual Renewal:</strong> SAM.gov registration expires every 12 months.
                    You must renew before the expiration date to remain eligible for federal awards.</li>
                <li style="margin-bottom:6px;"><strong>Banking Changes:</strong> Any change to banking information must be
                    updated in SAM.gov within 30 days (FAR 52.232-33(g)).</li>
                <li style="margin-bottom:6px;"><strong>IRS Validation:</strong> SAM.gov validates your EIN with the IRS.
                    Ensure your legal name matches exactly what is on file with the IRS.</li>
                <li style="margin-bottom:6px;"><strong>Foreign Ownership:</strong> If your company has foreign ownership or
                    control, additional disclosures may be required under FOCI rules.</li>
                <li><strong>Debarment Check:</strong> Entities on the Excluded Parties List (EPLS) cannot register.
                    Ensure no principals are debarred or suspended.</li>
            </ul>
        </div>

        <div class="footer">
            <p>This document was automatically generated by the SAM.gov Automation Platform.</p>
            <p>For questions or support, please contact your account administrator.</p>
            <p><strong>CONFIDENTIAL:</strong> This document contains sensitive business information.</p>
        </div>
    </body>
    </html>
    """

    # Convert HTML to PDF using xhtml2pdf
    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)

    if pisa_status.err:
        raise ValueError("PDF generation failed for SAM Checklist")

    pdf_buffer.seek(0)
    return pdf_buffer.read()


def _generate_reps_certs_pdf(profile: BusinessProfile, session: WorkflowSession) -> bytes:
    """
    Generate FAR/DFARS Representations and Certifications PDF.
    Mirrors the structure of SAM.gov's online Reps & Certs form (FAR 52.212-3).
    Includes all applicable clauses based on business entity type.
    """
    step_data = session.step_data or {}
    reps_certs_data = step_data.get("reps_certs", {})
    responses_map = reps_certs_data.get("responses", {})

    # Decrypt EIN for display
    try:
        ein_full = decrypt(profile.ein_encrypted) if profile.ein_encrypted else None
        ein_display = f"{ein_full[:2]}-{ein_full[2:]}" if ein_full and len(ein_full) == 9 else (ein_full or f"XX-XXXXX{profile.ein_last_four}")
    except Exception:
        ein_display = f"XX-XXXXX{profile.ein_last_four}" if profile.ein_last_four else "N/A"

    is_sole_prop = profile.business_type == "sole_proprietor"
    is_small = True  # Default; comes from workflow responses

    # Pull key responses
    def get_answer(clause_id: str, question_id: str, default="Not answered") -> str:
        val = responses_map.get(clause_id, {}).get(question_id, default)
        if isinstance(val, bool):
            return "YES" if val else "NO"
        if val is True or str(val).lower() in ("true", "yes", "1"):
            return "YES"
        if val is False or str(val).lower() in ("false", "no", "0"):
            return "NO"
        return str(val) if val else default

    # ---- Build clause rows ----
    def clause_row(clause_id: str, title: str, question: str, q_key: str, note: str = "") -> str:
        ans = get_answer(clause_id, q_key)
        ans_color = "#059669" if ans == "YES" else ("#dc2626" if ans == "NO" else "#6b7280")
        note_html = f'<div class="clause-note">{note}</div>' if note else ""
        return f"""
        <tr class="clause-row">
            <td class="clause-id">{clause_id}</td>
            <td class="clause-title">{title}</td>
            <td class="clause-question">{question}{note_html}</td>
            <td class="clause-answer" style="color:{ans_color}; font-weight:bold;">{ans}</td>
        </tr>"""

    # Small business socioeconomic status from responses
    is_wosb    = get_answer("FAR_52_219_1", "is_wosb")
    is_sdvosb  = get_answer("FAR_52_219_1", "is_sdvosb")
    is_hubzone = get_answer("FAR_52_219_1", "is_hubzone")
    is_8a      = get_answer("FAR_52_219_1", "is_8a")
    is_sb      = get_answer("FAR_52_219_1", "is_small_business")

    # --- Section A: General ------------------------------------------------
    section_a = f"""
    <tr class="section-header"><td colspan="4">SECTION A — General Representations</td></tr>
    {clause_row("FAR_52_203_2",  "Certificate of Independent Price Determination",
                "Do you certify that prices were determined independently, without consultation "
                "with competitors regarding price, terms, or conditions?",
                "cert_independent_price")}
    {clause_row("FAR_52_209_5",  "Certification Regarding Responsibility Matters",
                "No felony conviction within the preceding 24 months?",
                "no_felony_conviction")}
    {clause_row("FAR_52_209_5",  "Certification Regarding Responsibility Matters",
                "No federal tax delinquency?",
                "no_tax_delinquency")}
    {clause_row("FAR_52_209_10", "Prohibition on Contracting with Inverted Domestic Corporations",
                "Is your entity NOT an inverted domestic corporation?",
                "not_inverted_corp")}
    {clause_row("FAR_52_204_10", "Reporting Executive Compensation & First-Tier Subcontract Awards",
                "Will you comply with executive compensation and subcontract award reporting "
                "under 2 C.F.R. Part 170?",
                "exec_comp_reporting")}
    """

    # --- Section B: Small Business -----------------------------------------
    section_b = f"""
    <tr class="section-header"><td colspan="4">SECTION B — Small Business Representations (FAR 52.219-1)</td></tr>
    <tr class="clause-row">
        <td class="clause-id">FAR_52_219_1</td>
        <td class="clause-title">Small Business Program Representations</td>
        <td class="clause-question">
            <table style="width:100%; font-size:9pt;">
                <tr><td>Is a Small Business?</td><td style="font-weight:bold; color:#059669;">{is_sb}</td></tr>
                <tr><td>Woman-Owned Small Business (WOSB)?</td><td style="font-weight:bold;">{is_wosb}</td></tr>
                <tr><td>Service-Disabled Veteran-Owned SB (SDVOSB)?</td><td style="font-weight:bold;">{is_sdvosb}</td></tr>
                <tr><td>HUBZone Small Business?</td><td style="font-weight:bold;">{is_hubzone}</td></tr>
                <tr><td>8(a) Small Disadvantaged Business?</td><td style="font-weight:bold;">{is_8a}</td></tr>
            </table>
        </td>
        <td class="clause-answer">See left</td>
    </tr>
    {clause_row("FAR_52_219_28", "Post-Award Small Business Program Rerepresentation",
                "Will you rerepresent your small business status if required post-award "
                "(e.g., upon contract extension or novation)?",
                "small_business_rerepresent")}
    """

    # --- Section C: Labor & Equal Opportunity ------------------------------
    section_c = f"""
    <tr class="section-header"><td colspan="4">SECTION C — Labor Laws &amp; Equal Opportunity</td></tr>
    {clause_row("FAR_52_222_21", "Prohibition of Segregated Facilities",
                "Do you certify that no segregated facilities are maintained?",
                "no_segregated_facilities")}
    {clause_row("FAR_52_222_26", "Equal Opportunity (Executive Order 11246)",
                "Do you comply with all Equal Opportunity employment requirements?",
                "equal_opportunity_compliance")}
    {clause_row("FAR_52_222_35", "Equal Opportunity for Veterans (VEVRAA)",
                "Do you comply with veteran affirmative action and reporting requirements?",
                "veteran_equal_opportunity")}
    {clause_row("FAR_52_222_36", "Equal Opportunity for Workers with Disabilities (Section 503)",
                "Do you comply with disability affirmative action requirements?",
                "disability_equal_opportunity")}
    {clause_row("FAR_52_222_50", "Combating Trafficking in Persons",
                "Do you comply with anti-trafficking in persons requirements under 22 U.S.C. § 7104(g)?",
                "anti_trafficking")}
    {clause_row("FAR_52_223_6",  "Drug-Free Workplace",
                "Do you maintain a drug-free workplace program per 41 U.S.C. §§ 8101–8106?",
                "drug_free_workplace")}
    {clause_row("FAR_52_223_18", "Policy to Ban Text Messaging While Driving",
                "Do you have and enforce policies prohibiting text messaging while driving "
                "on government business?",
                "no_texting_while_driving")}
    """

    # --- Section D: Trade & Buy American -----------------------------------
    section_d = f"""
    <tr class="section-header"><td colspan="4">SECTION D — Trade Compliance &amp; Buy American</td></tr>
    {clause_row("FAR_52_225_2",  "Buy American Certificate",
                "Do the end products you will deliver comply with the Buy American Act "
                "(41 U.S.C. §§ 8301–8305)?",
                "buy_american_compliance")}
    {clause_row("FAR_52_225_13", "Restrictions on Certain Foreign Purchases",
                "Do you comply with restrictions on purchases from embargoed or sanctioned "
                "countries (OFAC, EAR, ITAR)?",
                "foreign_purchase_restrictions")}
    """

    # --- Section E: Payment & Disputes ------------------------------------
    section_e = f"""
    <tr class="section-header"><td colspan="4">SECTION E — Payment &amp; Disputes</td></tr>
    {clause_row("FAR_52_232_33", "Payment by Electronic Funds Transfer — SAM",
                "Do you accept payment by EFT as required for all federal awards "
                "per FAR 52.232-33?",
                "eft_payment_acceptance")}
    {clause_row("FAR_52_233_3",  "Protest After Award",
                "Do you understand and agree to protest procedures under FAR Subpart 33.1?",
                "protest_understanding")}
    """

    # --- Section F: Commercial Item Reps ----------------------------------
    section_f = f"""
    <tr class="section-header"><td colspan="4">SECTION F — Commercial Item Representations (FAR 52.212-3)</td></tr>
    {clause_row("FAR_52_212_3",  "Offeror Representations and Certifications — Commercial",
                "Do you certify that the items offered are commercial items as defined in "
                "FAR 2.101, and that all representations in FAR 52.212-3 are accurate?",
                "commercial_cert")}
    """

    # --- Section G: DFARS (non-sole-proprietors only) ----------------------
    dfars_note = "" if not is_sole_prop else \
        '<tr class="clause-row"><td colspan="4" style="color:#6b7280; font-style:italic; padding:10px;">DFARS clauses not applicable to Sole Proprietors.</td></tr>'

    if not is_sole_prop:
        section_g = f"""
        <tr class="section-header"><td colspan="4">SECTION G — Defense Contract Supplements (DFARS)</td></tr>
        {clause_row("DFARS_252_204_7012", "Covered Defense Telecommunications Equipment or Services",
                    "Do you certify that you will NOT use covered telecommunications equipment "
                    "or services as a substantial or essential component in any system on a "
                    "DoD contract?",
                    "no_covered_telecom",
                    "Required for all DoD contracts per DFARS 252.204-7012.")}
        {clause_row("DFARS_252_225_7001", "Buy American — Balance of Payments Program",
                    "Do the end items you deliver comply with DFARS 252.225-7001 Balance of "
                    "Payments Program requirements?",
                    "buy_american_dfars")}
        {clause_row("DFARS_252_203_7000", "Requirements Relating to Compensation of Former DoD Officials",
                    "Do you comply with the one-year cooling-off period restrictions on "
                    "hiring former DoD officials under 41 U.S.C. § 2104?",
                    "no_improper_dod_hiring")}
        """
    else:
        section_g = dfars_note

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: letter;
                margin: 0.75in 1in;
            }}
            body {{
                font-family: Arial, sans-serif;
                font-size: 9.5pt;
                line-height: 1.4;
                color: #1f2937;
            }}
            h1 {{
                color: #1e3a8a;
                font-size: 16pt;
                margin-bottom: 4px;
                text-align: center;
            }}
            h2 {{
                color: #1e3a8a;
                font-size: 12pt;
                margin-top: 18px;
                margin-bottom: 6px;
            }}
            .doc-subtitle {{
                text-align: center;
                font-size: 10pt;
                color: #6b7280;
                margin-bottom: 4px;
            }}
            .header-bar {{
                border-bottom: 3px solid #1e3a8a;
                margin-bottom: 16px;
                padding-bottom: 10px;
            }}
            .entity-block {{
                background: #f0f9ff;
                border: 1px solid #bae6fd;
                padding: 12px 16px;
                margin-bottom: 18px;
            }}
            .entity-block table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 9.5pt;
            }}
            .entity-block td {{
                padding: 3px 8px;
            }}
            .entity-block td:first-child {{
                font-weight: bold;
                color: #1e3a8a;
                width: 38%;
            }}
            .clause-table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 9pt;
                margin-bottom: 20px;
            }}
            .clause-table th {{
                background-color: #1e3a8a;
                color: white;
                padding: 7px 10px;
                text-align: left;
                font-size: 9pt;
            }}
            .section-header td {{
                background-color: #dbeafe;
                color: #1e3a8a;
                font-weight: bold;
                font-size: 9.5pt;
                padding: 6px 10px;
                border-top: 2px solid #93c5fd;
            }}
            .clause-row td {{
                padding: 6px 10px;
                border-bottom: 1px solid #e5e7eb;
                vertical-align: top;
            }}
            .clause-row:nth-child(even) td {{
                background-color: #f9fafb;
            }}
            .clause-id {{
                font-family: 'Courier New', monospace;
                font-size: 8pt;
                color: #4b5563;
                white-space: nowrap;
                width: 15%;
            }}
            .clause-title {{
                font-weight: bold;
                color: #1f2937;
                width: 25%;
            }}
            .clause-question {{
                color: #374151;
                width: 48%;
            }}
            .clause-answer {{
                width: 12%;
                text-align: center;
                font-size: 10pt;
            }}
            .clause-note {{
                font-size: 8pt;
                color: #6b7280;
                margin-top: 4px;
                font-style: italic;
            }}
            .cert-box {{
                border: 2px solid #1e3a8a;
                background: #eff6ff;
                padding: 16px;
                margin-top: 24px;
                page-break-inside: avoid;
            }}
            .sig-table {{
                width: 100%;
                margin-top: 30px;
                border-collapse: collapse;
            }}
            .sig-table td {{
                padding: 6px 10px;
                vertical-align: bottom;
            }}
            .sig-line {{
                border-top: 1px solid #000;
                padding-top: 4px;
                font-size: 9pt;
                margin-top: 40px;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #d1d5db;
                font-size: 7.5pt;
                color: #9ca3af;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="header-bar">
            <h1>Representations and Certifications</h1>
            <p class="doc-subtitle">
                FAR 52.212-3 &nbsp;|&nbsp; Federal Acquisition Regulation &nbsp;|&nbsp;
                Generated {datetime.utcnow().strftime('%B %d, %Y')}
            </p>
        </div>

        <div class="entity-block">
            <h2 style="margin-top:0;">Offeror / Contractor Information</h2>
            <table>
                <tr>
                    <td>Legal Business Name</td>
                    <td>{profile.legal_name}</td>
                    <td style="font-weight:bold; color:#1e3a8a; width:20%;">DBA Name</td>
                    <td>{profile.dba_name or 'N/A'}</td>
                </tr>
                <tr>
                    <td>Employer Identification Number (EIN)</td>
                    <td>{ein_display}</td>
                    <td style="font-weight:bold; color:#1e3a8a;">Business Type</td>
                    <td>{profile.business_type.replace('_', ' ').title()}</td>
                </tr>
                <tr>
                    <td>Physical Address</td>
                    <td colspan="3">{profile.address_line1}{(', ' + profile.address_line2) if profile.address_line2 else ''}, {profile.city}, {profile.state} {profile.zip_code}</td>
                </tr>
                <tr>
                    <td>Primary NAICS Code</td>
                    <td>{profile.primary_naics}</td>
                    <td style="font-weight:bold; color:#1e3a8a;">All NAICS Codes</td>
                    <td>{', '.join(profile.naics_codes or [])}</td>
                </tr>
                <tr>
                    <td>UEI Number</td>
                    <td>{profile.uei_number or 'To be assigned by SAM.gov at registration'}</td>
                    <td style="font-weight:bold; color:#1e3a8a;">CAGE Code</td>
                    <td>{profile.cage_code or 'To be assigned upon SAM approval'}</td>
                </tr>
            </table>
        </div>

        <p style="font-size:9pt; color:#6b7280; margin-bottom:12px;">
            The following representations and certifications are made in connection with a federal solicitation
            or SAM.gov registration. All responses are provided by the offeror under penalty of law.
            False statements are subject to criminal penalties under 18 U.S.C. § 1001.
        </p>

        <table class="clause-table">
            <thead>
                <tr>
                    <th style="width:15%;">Clause</th>
                    <th style="width:25%;">Title</th>
                    <th style="width:48%;">Representation / Certification</th>
                    <th style="width:12%; text-align:center;">Response</th>
                </tr>
            </thead>
            <tbody>
                {section_a}
                {section_b}
                {section_c}
                {section_d}
                {section_e}
                {section_f}
                {section_g}
            </tbody>
        </table>

        <div class="cert-box">
            <h2 style="margin-top:0; font-size:11pt;">Offeror Certification</h2>
            <p>
                By signing below, the authorized representative of <strong>{profile.legal_name}</strong> certifies that:
            </p>
            <ul style="margin:8px 0; padding-left:18px; font-size:9.5pt;">
                <li>All representations and certifications above are accurate, current, and complete as of the date signed.</li>
                <li>The offeror acknowledges that these representations are subject to verification by the Government.</li>
                <li>The offeror will immediately notify the Contracting Officer of any change that affects these representations.</li>
                <li>False statements herein are subject to penalties under 18 U.S.C. § 1001 and other applicable law.</li>
                <li>This certification covers all current and follow-on contracts awarded within one year of the date signed,
                    unless a change in circumstances requires earlier notification.</li>
            </ul>

            <table class="sig-table">
                <tr>
                    <td style="width:45%;">
                        <div class="sig-line">Signature of Authorized Representative</div>
                    </td>
                    <td style="width:10%;"></td>
                    <td style="width:45%;">
                        <div class="sig-line">Date</div>
                    </td>
                </tr>
                <tr>
                    <td style="padding-top:14px;">
                        <strong>Printed Name:</strong> _________________________
                    </td>
                    <td></td>
                    <td style="padding-top:14px;">
                        <strong>Title:</strong> ________________________________
                    </td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <p>
                Generated by INVIGOV SAM.gov Automation Platform &nbsp;|&nbsp;
                {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} &nbsp;|&nbsp;
                FAR 52.212-3 Representations and Certifications &nbsp;|&nbsp; CONFIDENTIAL
            </p>
        </div>
    </body>
    </html>
    """

    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)

    if pisa_status.err:
        raise ValueError("PDF generation failed for Reps & Certs")

    pdf_buffer.seek(0)
    return pdf_buffer.read()


def _generate_banking_authorization_pdf(profile: BusinessProfile) -> bytes:
    """
    Generate Banking Authorization Letter for EFT payments.

    Decrypts full routing and account numbers for display — this document
    is the instrument the registrant uses to enter banking data into SAM.gov.
    Handle as HIGHLY CONFIDENTIAL.
    """
    # Decrypt full banking numbers for actual use
    try:
        routing_number = decrypt(profile.banking_routing_encrypted) if profile.banking_routing_encrypted else "N/A"
    except Exception:
        routing_number = f"XXXXX{profile.routing_last_four}" if profile.routing_last_four else "N/A"

    try:
        account_number = decrypt(profile.banking_account_encrypted) if profile.banking_account_encrypted else "N/A"
    except Exception:
        account_number = f"XXXXX{profile.account_last_four}" if profile.account_last_four else "N/A"

    try:
        ein_full = decrypt(profile.ein_encrypted) if profile.ein_encrypted else None
        # Format EIN as XX-XXXXXXX
        ein_display = f"{ein_full[:2]}-{ein_full[2:]}" if ein_full and len(ein_full) == 9 else (ein_full or "N/A")
    except Exception:
        ein_display = f"XX-XXXXX{profile.ein_last_four}" if profile.ein_last_four else "N/A"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: letter;
                margin: 1in;
            }}
            body {{
                font-family: Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.6;
                color: #333;
            }}
            h1 {{
                color: #1e40af;
                font-size: 18pt;
                margin-bottom: 10px;
                text-align: center;
            }}
            h2 {{
                color: #1e40af;
                font-size: 13pt;
                margin-top: 20px;
                margin-bottom: 8px;
            }}
            .letterhead {{
                text-align: center;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 3px solid #1e40af;
            }}
            .confidential-banner {{
                background-color: #dc2626;
                color: white;
                text-align: center;
                padding: 6px;
                font-weight: bold;
                font-size: 10pt;
                margin-bottom: 20px;
                letter-spacing: 2px;
            }}
            .date {{
                text-align: right;
                margin-bottom: 20px;
                font-size: 10pt;
            }}
            .body-text {{
                margin: 15px 0;
                text-align: justify;
            }}
            .banking-details {{
                background-color: #fefce8;
                border: 2px solid #ca8a04;
                padding: 20px;
                margin: 25px 0;
            }}
            .detail-table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }}
            .detail-table td {{
                padding: 8px 10px;
                border-bottom: 1px solid #e5e7eb;
            }}
            .detail-table td:first-child {{
                font-weight: bold;
                color: #92400e;
                width: 45%;
            }}
            .detail-table td:last-child {{
                font-family: 'Courier New', monospace;
                font-size: 11pt;
                color: #1f2937;
                letter-spacing: 1px;
            }}
            .instructions {{
                background-color: #eff6ff;
                border-left: 4px solid #3b82f6;
                padding: 15px;
                margin: 20px 0;
                font-size: 10pt;
            }}
            .instructions ol {{
                margin: 8px 0 0 0;
                padding-left: 18px;
            }}
            .instructions li {{
                margin: 5px 0;
            }}
            .certification {{
                margin-top: 30px;
                padding: 15px;
                border: 1px solid #d1d5db;
                background-color: #f9fafb;
            }}
            .signature-block {{
                margin-top: 40px;
            }}
            .sig-line {{
                display: inline-block;
                border-top: 1px solid #000;
                width: 280px;
                margin-top: 45px;
                padding-top: 4px;
                font-size: 10pt;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 15px;
                border-top: 1px solid #d1d5db;
                font-size: 8pt;
                color: #6b7280;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="confidential-banner">HIGHLY CONFIDENTIAL — FOR AUTHORIZED USE ONLY</div>

        <div class="letterhead">
            <h1>Electronic Funds Transfer (EFT) Banking Authorization</h1>
            <p style="margin:0; font-size:10pt; color:#6b7280;">
                In accordance with FAR 52.232-33 — Payment by Electronic Funds Transfer (SAM)
            </p>
        </div>

        <div class="date">{datetime.utcnow().strftime('%B %d, %Y')}</div>

        <p><strong>To:</strong> &nbsp; System for Award Management (SAM.gov) / Contracting Officer</p>
        <p><strong>From:</strong> &nbsp; {profile.legal_name}</p>
        <p><strong>EIN:</strong> &nbsp; {ein_display}</p>
        <p><strong>Re:</strong> &nbsp; Authorization for Electronic Funds Transfer — Federal Contract Payments</p>

        <div class="body-text">
            <p>
                This letter constitutes the official authorization of <strong>{profile.legal_name}</strong>
                for the United States Government to disburse all contract payments via Electronic Funds
                Transfer (EFT) to the bank account identified below, as required under
                FAR 52.232-33 and 31 C.F.R. Part 208.
            </p>
            <p>
                This authorization supersedes any prior EFT instructions on file and shall remain
                effective until a signed written revocation is delivered to the cognizant contracting
                officer and updated in SAM.gov.
            </p>
        </div>

        <div class="banking-details">
            <h2 style="margin-top:0; color:#92400e;">Complete Banking Information for SAM.gov Entry</h2>
            <table class="detail-table">
                <tr>
                    <td>Financial Institution Name</td>
                    <td>{profile.bank_name}</td>
                </tr>
                <tr>
                    <td>Account Holder (Payee Name)</td>
                    <td>{profile.banking_account_holder}</td>
                </tr>
                <tr>
                    <td>ABA Routing Number</td>
                    <td>{routing_number}</td>
                </tr>
                <tr>
                    <td>Account Number</td>
                    <td>{account_number}</td>
                </tr>
                <tr>
                    <td>Account Type</td>
                    <td>Business Checking</td>
                </tr>
                <tr>
                    <td>Payment Type</td>
                    <td>ACH Credit</td>
                </tr>
            </table>
        </div>

        <div class="instructions">
            <strong>How to enter banking information in SAM.gov:</strong>
            <ol>
                <li>Log in to SAM.gov and navigate to <em>Entity Registrations &gt; Banking Information</em></li>
                <li>Select <strong>Add New EFT Account</strong></li>
                <li>Enter the ABA Routing Number and Account Number exactly as shown above</li>
                <li>Select <strong>Checking</strong> as the account type</li>
                <li>Enter the Payee Name exactly as it appears on your bank account</li>
                <li>Submit and verify the micro-deposit (1–3 business days) if prompted</li>
            </ol>
        </div>

        <div class="certification">
            <p style="margin:0;">
                The undersigned authorized representative of <strong>{profile.legal_name}</strong>
                hereby certifies that:
            </p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>The banking information above is accurate and belongs to the registered entity.</li>
                <li>The signatory is authorized to bind the entity to this EFT authorization.</li>
                <li>Any change to the designated account will be reported to SAM.gov within <strong>30 days</strong>
                    per FAR 52.232-33(g).</li>
                <li>False statements are subject to penalties under 18 U.S.C. § 1001.</li>
            </ul>
        </div>

        <div class="signature-block">
            <table style="width:100%; margin-top:20px;">
                <tr>
                    <td style="width:50%; vertical-align:bottom; padding-right:20px;">
                        <div class="sig-line">Authorized Signature</div>
                    </td>
                    <td style="width:50%; vertical-align:bottom; padding-left:20px;">
                        <div class="sig-line">Date</div>
                    </td>
                </tr>
                <tr>
                    <td style="padding-top:15px; padding-right:20px;">
                        <p style="margin:4px 0;"><strong>Printed Name:</strong> ___________________________</p>
                    </td>
                    <td style="padding-top:15px; padding-left:20px;">
                        <p style="margin:4px 0;"><strong>Title:</strong> ________________________________</p>
                    </td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <p>Generated by INVIGOV SAM.gov Automation Platform &nbsp;|&nbsp; {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>
            <p>FAR 52.232-33 &nbsp;|&nbsp; 31 C.F.R. Part 208 &nbsp;|&nbsp; <strong>DESTROY AFTER USE — CONTAINS SENSITIVE FINANCIAL DATA</strong></p>
        </div>
    </body>
    </html>
    """

    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)

    if pisa_status.err:
        raise ValueError("PDF generation failed for Banking Authorization")

    pdf_buffer.seek(0)
    return pdf_buffer.read()


# ============================================================================
# DOCX Generation Functions
# ============================================================================

def _docx_heading(doc: DocxDocument, text: str, level: int = 1) -> None:
    """Add a styled heading paragraph."""
    p = doc.add_heading(text, level=level)
    p.runs[0].font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)  # blue-700


def _docx_field(doc: DocxDocument, label: str, value: str) -> None:
    """Add a bold-label : value line."""
    p = doc.add_paragraph()
    run_label = p.add_run(f"{label}: ")
    run_label.bold = True
    p.add_run(value or "N/A")
    p.paragraph_format.space_after = Pt(2)


def _docx_table_row(table, cells: list, bold_first: bool = False) -> None:
    row = table.add_row()
    for i, (cell_obj, text) in enumerate(zip(row.cells, cells)):
        cell_obj.text = str(text)
        if bold_first and i == 0:
            cell_obj.paragraphs[0].runs[0].bold = True


def _docx_shade_cell(cell, hex_color: str) -> None:
    """Apply background shading to a table cell."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def _generate_sam_checklist_docx(profile: BusinessProfile, session: WorkflowSession) -> bytes:
    """Generate SAM.gov Registration Checklist as an editable DOCX."""
    try:
        ein_full = decrypt(profile.ein_encrypted) if profile.ein_encrypted else None
        ein_display = f"{ein_full[:2]}-{ein_full[2:]}" if ein_full and len(ein_full) == 9 else f"XX-XXXXX{profile.ein_last_four}"
    except Exception:
        ein_display = f"XX-XXXXX{profile.ein_last_four}" if profile.ein_last_four else "N/A"

    doc = DocxDocument()

    # Page margins
    for section in doc.sections:
        section.top_margin    = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin   = Inches(1)
        section.right_margin  = Inches(1)

    # Title
    title = doc.add_heading("SAM.gov Registration Checklist", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.runs[0].font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)

    sub = doc.add_paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y')}")
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.runs[0].font.color.rgb = RGBColor(0x6B, 0x72, 0x80)
    doc.add_paragraph()

    # Business Information
    _docx_heading(doc, "1. Business Information", level=1)
    _docx_field(doc, "Legal Business Name", profile.legal_name)
    _docx_field(doc, "DBA Name", profile.dba_name or "N/A")
    _docx_field(doc, "Employer Identification Number (EIN)", ein_display)
    _docx_field(doc, "Business Type", profile.business_type.replace("_", " ").title())
    _docx_field(doc, "Physical Address",
                f"{profile.address_line1}{(', ' + profile.address_line2) if profile.address_line2 else ''}, "
                f"{profile.city}, {profile.state} {profile.zip_code}")
    _docx_field(doc, "UEI Number", profile.uei_number or "To be assigned by SAM.gov at registration")
    _docx_field(doc, "CAGE Code", profile.cage_code or "To be assigned upon SAM approval")
    doc.add_paragraph()

    # NAICS Codes
    _docx_heading(doc, "2. NAICS Codes", level=1)
    _docx_field(doc, "Primary NAICS Code", profile.primary_naics or "N/A")
    _docx_field(doc, "All NAICS Codes", ", ".join(profile.naics_codes or []))
    if profile.annual_receipts_avg:
        _docx_field(doc, "Average Annual Receipts", f"${profile.annual_receipts_avg:,.2f}")
    if profile.total_employees:
        _docx_field(doc, "Total Employees", str(profile.total_employees))
    doc.add_paragraph()

    # Banking
    _docx_heading(doc, "3. Banking Information", level=1)
    _docx_field(doc, "Bank Name", profile.bank_name or "N/A")
    _docx_field(doc, "Account Holder", profile.banking_account_holder or "N/A")
    _docx_field(doc, "Routing Number (last 4)", f"XXXXX{profile.routing_last_four}" if profile.routing_last_four else "N/A")
    note = doc.add_paragraph("Note: Full banking details are in the Banking Authorization document.")
    note.runs[0].font.italic = True
    note.runs[0].font.color.rgb = RGBColor(0x6B, 0x72, 0x80)
    doc.add_paragraph()

    # 10-step checklist table
    _docx_heading(doc, "4. SAM.gov Registration Steps", level=1)

    steps = [
        ("✓ DONE", "Gather all required business information",
         "Completed via INVIGOV. All data captured above."),
        ("✓ DONE", "Complete Representations & Certifications",
         "See attached Reps & Certs document. Print and sign before submission."),
        ("☐", "Create a Login.gov account",
         "Go to login.gov → Create account with your business email."),
        ("☐", "Log in to SAM.gov and start Entity Registration",
         "sam.gov → Sign In → Register New Entity → Business or Organization."),
        ("☐", "Obtain UEI (Unique Entity Identifier)",
         "SAM.gov assigns a 12-character UEI automatically. Record it: ____________"),
        ("☐", "Enter Core Data (Entity Information)",
         "Use Section 1 and 2 above. Enter EIN exactly as shown."),
        ("☐", "Enter EFT Banking Information",
         "Navigate to Financial Information. Use the Banking Authorization letter."),
        ("☐", "Complete Reps & Certs online",
         "SAM.gov online form. Use the Reps & Certs PDF as your reference."),
        ("☐", "Review all sections and submit",
         "SAM.gov validates EIN with IRS (1-2 business days)."),
        ("☐", "Await activation (7-10 business days)",
         "You will receive email confirmation when entity is Active."),
    ]

    tbl = doc.add_table(rows=1, cols=3)
    tbl.style = "Table Grid"
    hdr = tbl.rows[0].cells
    for cell, text in zip(hdr, ["Status", "Step", "Instructions"]):
        cell.text = text
        cell.paragraphs[0].runs[0].bold = True
        _docx_shade_cell(cell, "DBEAFE")

    for status, step, instruction in steps:
        row = tbl.add_row().cells
        row[0].text = status
        row[1].text = step
        row[2].text = instruction

    doc.add_paragraph()

    # Important notes
    _docx_heading(doc, "5. Important Notes", level=1)
    notes = [
        "Annual Renewal: SAM.gov registration expires every 12 months. Renew before expiration.",
        "Banking Changes: Any change must be updated in SAM.gov within 30 days (FAR 52.232-33(g)).",
        "IRS Validation: Legal name must match exactly what is on file with the IRS.",
        "Debarment Check: Ensure no principals are debarred or suspended (EPLS).",
    ]
    for note_text in notes:
        p = doc.add_paragraph(style="List Bullet")
        parts = note_text.split(":", 1)
        r1 = p.add_run(parts[0] + ":")
        r1.bold = True
        if len(parts) > 1:
            p.add_run(parts[1])

    # Footer note
    doc.add_paragraph()
    footer = doc.add_paragraph(
        f"CONFIDENTIAL — Generated by INVIGOV SAM.gov Automation Platform — "
        f"{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
    )
    footer.runs[0].font.size = Pt(8)
    footer.runs[0].font.color.rgb = RGBColor(0x9C, 0xA3, 0xAF)

    buf = BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


def _generate_reps_certs_docx(profile: BusinessProfile, session: WorkflowSession) -> bytes:
    """Generate FAR/DFARS Representations & Certifications as an editable DOCX."""
    try:
        ein_full = decrypt(profile.ein_encrypted) if profile.ein_encrypted else None
        ein_display = f"{ein_full[:2]}-{ein_full[2:]}" if ein_full and len(ein_full) == 9 else f"XX-XXXXX{profile.ein_last_four}"
    except Exception:
        ein_display = f"XX-XXXXX{profile.ein_last_four}" if profile.ein_last_four else "N/A"

    step_data = session.step_data or {}
    responses_map = step_data.get("reps_certs", {}).get("responses", {})
    is_sole_prop = profile.business_type == "sole_proprietor"

    def get_answer(clause_id: str, q_id: str) -> str:
        val = responses_map.get(clause_id, {}).get(q_id, "Not answered")
        if isinstance(val, bool):
            return "YES" if val else "NO"
        if str(val).lower() in ("true", "yes", "1"):
            return "YES"
        if str(val).lower() in ("false", "no", "0"):
            return "NO"
        return str(val) if val else "Not answered"

    doc = DocxDocument()
    for section in doc.sections:
        section.top_margin    = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin   = Inches(1)
        section.right_margin  = Inches(1)

    # Title
    title = doc.add_heading("Representations and Certifications", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.runs[0].font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    sub = doc.add_paragraph("FAR 52.212-3  |  Federal Acquisition Regulation")
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.runs[0].font.color.rgb = RGBColor(0x6B, 0x72, 0x80)
    doc.add_paragraph()

    # Entity info table
    _docx_heading(doc, "Offeror / Contractor Information", level=1)
    info_tbl = doc.add_table(rows=5, cols=4)
    info_tbl.style = "Table Grid"
    rows_data = [
        ("Legal Business Name", profile.legal_name, "DBA Name", profile.dba_name or "N/A"),
        ("EIN", ein_display, "Business Type", profile.business_type.replace("_", " ").title()),
        ("Primary NAICS", profile.primary_naics or "N/A", "All NAICS", ", ".join(profile.naics_codes or [])),
        ("Address", f"{profile.address_line1}, {profile.city}, {profile.state} {profile.zip_code}", "UEI", profile.uei_number or "Pending assignment"),
        ("CAGE Code", profile.cage_code or "Pending assignment", "Date", datetime.utcnow().strftime("%B %d, %Y")),
    ]
    for row_obj, (l1, v1, l2, v2) in zip(info_tbl.rows, rows_data):
        for cell, text, bold in [(row_obj.cells[0], l1, True), (row_obj.cells[1], v1, False),
                                  (row_obj.cells[2], l2, True), (row_obj.cells[3], v2, False)]:
            cell.text = text
            if bold:
                cell.paragraphs[0].runs[0].bold = True
                _docx_shade_cell(cell, "DBEAFE")
    doc.add_paragraph()

    # Clauses table
    _docx_heading(doc, "FAR/DFARS Clause Responses", level=1)

    clauses = [
        # (section_title, clause_id, title, question, q_key)
        ("SECTION A — General", "FAR_52_203_2", "Certificate of Independent Price Determination",
         "Prices were determined independently without competitor consultation?", "cert_independent_price"),
        ("SECTION A — General", "FAR_52_209_5", "Certification Regarding Responsibility Matters — Felony",
         "No felony conviction within the preceding 24 months?", "no_felony_conviction"),
        ("SECTION A — General", "FAR_52_209_5", "Certification Regarding Responsibility Matters — Tax",
         "No federal tax delinquency?", "no_tax_delinquency"),
        ("SECTION A — General", "FAR_52_209_10", "Prohibition on Inverted Domestic Corporations",
         "Entity is NOT an inverted domestic corporation?", "not_inverted_corp"),
        ("SECTION A — General", "FAR_52_204_10", "Executive Compensation Reporting",
         "Will comply with executive compensation & subcontract award reporting?", "exec_comp_reporting"),
        ("SECTION B — Small Business", "FAR_52_219_1", "Small Business Status",
         "Is a Small Business per SBA size standards?", "is_small_business"),
        ("SECTION B — Small Business", "FAR_52_219_1", "Woman-Owned Small Business (WOSB)",
         "Qualifies as a WOSB?", "is_wosb"),
        ("SECTION B — Small Business", "FAR_52_219_1", "Service-Disabled Veteran-Owned SB (SDVOSB)",
         "Qualifies as an SDVOSB?", "is_sdvosb"),
        ("SECTION B — Small Business", "FAR_52_219_1", "HUBZone Small Business",
         "Qualifies as a HUBZone SB?", "is_hubzone"),
        ("SECTION B — Small Business", "FAR_52_219_1", "8(a) Small Disadvantaged Business",
         "Qualifies as an 8(a) SDB?", "is_8a"),
        ("SECTION B — Small Business", "FAR_52_219_28", "Post-Award Rerepresentation",
         "Will rerepresent small business status post-award if required?", "small_business_rerepresent"),
        ("SECTION C — Labor", "FAR_52_222_21", "Prohibition of Segregated Facilities",
         "No segregated facilities are maintained?", "no_segregated_facilities"),
        ("SECTION C — Labor", "FAR_52_222_26", "Equal Opportunity (EO 11246)",
         "Complies with Equal Opportunity requirements?", "equal_opportunity_compliance"),
        ("SECTION C — Labor", "FAR_52_222_35", "Equal Opportunity for Veterans (VEVRAA)",
         "Complies with veteran affirmative action requirements?", "veteran_equal_opportunity"),
        ("SECTION C — Labor", "FAR_52_222_36", "Equal Opportunity for Workers with Disabilities",
         "Complies with disability affirmative action (Section 503)?", "disability_equal_opportunity"),
        ("SECTION C — Labor", "FAR_52_222_50", "Combating Trafficking in Persons",
         "Complies with anti-trafficking requirements (22 U.S.C. §7104(g))?", "anti_trafficking"),
        ("SECTION C — Labor", "FAR_52_223_6", "Drug-Free Workplace",
         "Maintains drug-free workplace program (41 U.S.C. §§8101-8106)?", "drug_free_workplace"),
        ("SECTION C — Labor", "FAR_52_223_18", "Policy to Ban Text Messaging While Driving",
         "Has and enforces no-text-while-driving policy?", "no_texting_while_driving"),
        ("SECTION D — Trade", "FAR_52_225_2", "Buy American Certificate",
         "End products comply with Buy American Act (41 U.S.C. §§8301-8305)?", "buy_american_compliance"),
        ("SECTION D — Trade", "FAR_52_225_13", "Restrictions on Certain Foreign Purchases",
         "Complies with OFAC/EAR/ITAR foreign purchase restrictions?", "foreign_purchase_restrictions"),
        ("SECTION E — Payment", "FAR_52_232_33", "Payment by Electronic Funds Transfer",
         "Accepts EFT payment as required for all federal awards?", "eft_payment_acceptance"),
        ("SECTION E — Payment", "FAR_52_233_3", "Protest After Award",
         "Understands and agrees to protest procedures (FAR Subpart 33.1)?", "protest_understanding"),
        ("SECTION F — Commercial", "FAR_52_212_3", "Offeror Representations — Commercial Items",
         "Items offered are commercial items per FAR 2.101?", "commercial_cert"),
    ]

    if not is_sole_prop:
        clauses += [
            ("SECTION G — DFARS", "DFARS_252_204_7012", "Covered Defense Telecommunications Equipment",
             "Will NOT use covered telecom equipment as essential component on DoD contracts?", "no_covered_telecom"),
            ("SECTION G — DFARS", "DFARS_252_225_7001", "Buy American — Balance of Payments",
             "End items comply with DFARS 252.225-7001 Balance of Payments requirements?", "buy_american_dfars"),
            ("SECTION G — DFARS", "DFARS_252_203_7000", "Compensation of Former DoD Officials",
             "Complies with 1-year cooling-off period for former DoD officials (41 U.S.C. §2104)?", "no_improper_dod_hiring"),
        ]

    tbl = doc.add_table(rows=1, cols=4)
    tbl.style = "Table Grid"
    headers = ["Section", "Clause", "Certification", "Response"]
    for cell, hdr_text in zip(tbl.rows[0].cells, headers):
        cell.text = hdr_text
        cell.paragraphs[0].runs[0].bold = True
        _docx_shade_cell(cell, "1E3A8A")
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    current_section = None
    for section_title, clause_id, clause_title, question, q_key in clauses:
        answer = get_answer(clause_id, q_key)
        row = tbl.add_row().cells
        row[0].text = section_title if section_title != current_section else ""
        row[1].text = f"{clause_id}\n{clause_title}"
        row[1].paragraphs[0].runs[0].bold = True
        row[2].text = question
        row[3].text = answer
        # Colour YES green, NO red
        if answer == "YES":
            row[3].paragraphs[0].runs[0].font.color.rgb = RGBColor(0x05, 0x96, 0x69)
        elif answer == "NO":
            row[3].paragraphs[0].runs[0].font.color.rgb = RGBColor(0xDC, 0x26, 0x26)
        current_section = section_title

    doc.add_paragraph()

    # Certification block
    _docx_heading(doc, "Offeror Certification", level=1)
    cert_text = (
        f"The undersigned authorized representative of {profile.legal_name} certifies that all "
        "representations and certifications above are accurate, current, and complete as of the date "
        "signed. False statements are subject to penalties under 18 U.S.C. § 1001."
    )
    doc.add_paragraph(cert_text)
    doc.add_paragraph()

    sig_tbl = doc.add_table(rows=3, cols=2)
    sig_data = [
        ("Signature:", "________________________"),
        ("Printed Name:", "________________________"),
        ("Title / Date:", "________________________"),
    ]
    for row_obj, (label, blank) in zip(sig_tbl.rows, sig_data):
        row_obj.cells[0].text = label
        row_obj.cells[0].paragraphs[0].runs[0].bold = True
        row_obj.cells[1].text = blank

    doc.add_paragraph()
    footer = doc.add_paragraph(
        f"CONFIDENTIAL — Generated by INVIGOV — {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} — FAR 52.212-3"
    )
    footer.runs[0].font.size = Pt(8)
    footer.runs[0].font.color.rgb = RGBColor(0x9C, 0xA3, 0xAF)

    buf = BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


def _generate_banking_authorization_docx(profile: BusinessProfile) -> bytes:
    """Generate Banking Authorization Letter as an editable DOCX."""
    try:
        routing_number = decrypt(profile.banking_routing_encrypted) if profile.banking_routing_encrypted else "N/A"
    except Exception:
        routing_number = f"XXXXX{profile.routing_last_four}" if profile.routing_last_four else "N/A"

    try:
        account_number = decrypt(profile.banking_account_encrypted) if profile.banking_account_encrypted else "N/A"
    except Exception:
        account_number = f"XXXXX{profile.account_last_four}" if profile.account_last_four else "N/A"

    try:
        ein_full = decrypt(profile.ein_encrypted) if profile.ein_encrypted else None
        ein_display = f"{ein_full[:2]}-{ein_full[2:]}" if ein_full and len(ein_full) == 9 else f"XX-XXXXX{profile.ein_last_four}"
    except Exception:
        ein_display = f"XX-XXXXX{profile.ein_last_four}" if profile.ein_last_four else "N/A"

    doc = DocxDocument()
    for section in doc.sections:
        section.top_margin    = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin   = Inches(1.25)
        section.right_margin  = Inches(1.25)

    # CONFIDENTIAL banner
    banner = doc.add_paragraph("HIGHLY CONFIDENTIAL — FOR AUTHORIZED USE ONLY")
    banner.alignment = WD_ALIGN_PARAGRAPH.CENTER
    banner.runs[0].bold = True
    banner.runs[0].font.color.rgb = RGBColor(0xDC, 0x26, 0x26)
    doc.add_paragraph()

    # Title
    title = doc.add_heading("Electronic Funds Transfer (EFT) Banking Authorization", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.runs[0].font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)

    ref = doc.add_paragraph("In accordance with FAR 52.232-33 — Payment by Electronic Funds Transfer (SAM)")
    ref.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ref.runs[0].font.color.rgb = RGBColor(0x6B, 0x72, 0x80)
    doc.add_paragraph()

    # Header fields
    _docx_field(doc, "Date", datetime.utcnow().strftime("%B %d, %Y"))
    _docx_field(doc, "To", "System for Award Management (SAM.gov) / Contracting Officer")
    _docx_field(doc, "From", profile.legal_name)
    _docx_field(doc, "EIN", ein_display)
    _docx_field(doc, "Re", "Authorization for Electronic Funds Transfer — Federal Contract Payments")
    doc.add_paragraph()

    # Body
    body1 = (
        f"This letter constitutes the official authorization of {profile.legal_name} for the United "
        "States Government to disburse all contract payments via Electronic Funds Transfer (EFT) to "
        "the bank account identified below, as required under FAR 52.232-33 and 31 C.F.R. Part 208."
    )
    doc.add_paragraph(body1)
    doc.add_paragraph(
        "This authorization supersedes any prior EFT instructions on file and shall remain effective "
        "until a signed written revocation is delivered to the cognizant contracting officer and "
        "updated in SAM.gov."
    )
    doc.add_paragraph()

    # Banking details table
    _docx_heading(doc, "Complete Banking Information for SAM.gov Entry", level=1)
    bank_tbl = doc.add_table(rows=6, cols=2)
    bank_tbl.style = "Table Grid"
    bank_rows = [
        ("Financial Institution Name", profile.bank_name or "N/A"),
        ("Account Holder (Payee Name)", profile.banking_account_holder or "N/A"),
        ("ABA Routing Number", routing_number),
        ("Account Number", account_number),
        ("Account Type", "Business Checking"),
        ("Payment Type", "ACH Credit"),
    ]
    for row_obj, (label, value) in zip(bank_tbl.rows, bank_rows):
        row_obj.cells[0].text = label
        row_obj.cells[0].paragraphs[0].runs[0].bold = True
        _docx_shade_cell(row_obj.cells[0], "FEF9C3")
        row_obj.cells[1].text = value
        # Highlight routing/account in amber
        if label in ("ABA Routing Number", "Account Number"):
            row_obj.cells[1].paragraphs[0].runs[0].font.bold = True
    doc.add_paragraph()

    # SAM.gov entry instructions
    _docx_heading(doc, "How to Enter Banking Information in SAM.gov", level=1)
    instructions = [
        "Log in to SAM.gov and navigate to Entity Registrations > Banking Information.",
        "Select Add New EFT Account.",
        "Enter the ABA Routing Number and Account Number exactly as shown above.",
        "Select Checking as the account type.",
        "Enter the Payee Name exactly as it appears on your bank account.",
        "Submit and verify the micro-deposit (1-3 business days) if prompted.",
    ]
    for i, step in enumerate(instructions, 1):
        p = doc.add_paragraph(style="List Number")
        p.add_run(step)
    doc.add_paragraph()

    # Certification
    _docx_heading(doc, "Certification", level=1)
    cert_items = [
        "The banking information above is accurate and belongs to the registered entity.",
        "The signatory is authorized to bind the entity to this EFT authorization.",
        f"Any change will be reported to SAM.gov within 30 days per FAR 52.232-33(g).",
        "False statements are subject to penalties under 18 U.S.C. § 1001.",
    ]
    for item in cert_items:
        doc.add_paragraph(item, style="List Bullet")
    doc.add_paragraph()

    # Signature block
    sig_tbl = doc.add_table(rows=3, cols=2)
    sig_data = [
        ("Authorized Signature:", "________________________"),
        ("Printed Name:", "________________________"),
        ("Title / Date:", "________________________"),
    ]
    for row_obj, (label, blank) in zip(sig_tbl.rows, sig_data):
        row_obj.cells[0].text = label
        row_obj.cells[0].paragraphs[0].runs[0].bold = True
        row_obj.cells[1].text = blank

    doc.add_paragraph()
    footer = doc.add_paragraph(
        f"HIGHLY CONFIDENTIAL — INVIGOV SAM.gov Automation Platform — "
        f"{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} — "
        "FAR 52.232-33 | 31 C.F.R. Part 208 — DESTROY AFTER USE"
    )
    footer.runs[0].font.size = Pt(8)
    footer.runs[0].font.color.rgb = RGBColor(0x9C, 0xA3, 0xAF)

    buf = BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()
