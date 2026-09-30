# M4 implementation: RQ background worker for deadline notifications
# Runs daily at 09:00 — only sends to active subscriptions

import logging
from datetime import datetime, date
from sqlalchemy import and_
import resend

from app.core.database import SessionLocal
from app.core.config import settings
from app.models.compliance import ComplianceDeadline
from app.models.entitlement import Entitlement
from app.models.user import Workspace, User
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


def send_deadline_notifications():
    """
    RQ job: check compliance_deadlines for upcoming deadlines.
    Send email notifications at 30d / 14d / 7d / 1d intervals.
    Only fires for workspaces with compliance_subscription_status == 'active'.
    Idempotent: notification_sent_XXd flags prevent duplicate sends.

    Designed to run as a standalone RQ job with no FastAPI context.
    Scheduled daily at 09:00 UTC by scheduler.py.
    """
    logger.info("send_deadline_notifications: starting job")
    db = SessionLocal()

    try:
        today = date.today()

        # Get all pending (not completed) deadlines
        deadlines = db.query(ComplianceDeadline).filter(
            ComplianceDeadline.is_completed == False
        ).all()

        notifications_sent = 0

        for deadline in deadlines:
            # Check if workspace has active compliance subscription
            entitlement = db.query(Entitlement).filter(
                Entitlement.workspace_id == deadline.workspace_id
            ).first()

            # Check new tier model first, fallback to legacy
            has_access = (
                (entitlement and entitlement.subscription_tier == 'complete' and entitlement.subscription_status == 'active')
                or (entitlement and entitlement.compliance_subscription_status == 'active')
            )
            if not has_access:
                continue

            # Calculate days until deadline
            days_remaining = (deadline.deadline_date - today).days

            # Determine which notification to send
            should_send = False
            notification_interval = None

            if days_remaining <= 1 and not deadline.notification_sent_1d:
                should_send = True
                notification_interval = '1d'
                deadline.notification_sent_1d = True
            elif days_remaining <= 7 and not deadline.notification_sent_7d:
                should_send = True
                notification_interval = '7d'
                deadline.notification_sent_7d = True
            elif days_remaining <= 14 and not deadline.notification_sent_14d:
                should_send = True
                notification_interval = '14d'
                deadline.notification_sent_14d = True
            elif days_remaining <= 30 and not deadline.notification_sent_30d:
                should_send = True
                notification_interval = '30d'
                deadline.notification_sent_30d = True

            if should_send:
                # Get workspace owner email
                workspace = db.query(Workspace).filter(
                    Workspace.id == deadline.workspace_id
                ).first()

                if not workspace:
                    continue

                owner = db.query(User).filter(
                    and_(
                        User.workspace_id == workspace.id,
                        User.role == 'owner'
                    )
                ).first()

                if not owner:
                    continue

                # Send email notification
                try:
                    _send_deadline_email(
                        to_email=owner.email,
                        workspace_name=workspace.name or "Your workspace",
                        deadline_title=deadline.title,
                        deadline_date=deadline.deadline_date,
                        days_remaining=days_remaining,
                        deadline_type=deadline.deadline_type
                    )

                    notifications_sent += 1

                    # Audit log
                    audit = AuditLog(
                        workspace_id=deadline.workspace_id,
                        event_type=f"notification.deadline.{notification_interval}",
                        actor_type="system",
                        extra_data={
                            "deadline_id": deadline.id,
                            "deadline_title": deadline.title,
                            "days_remaining": days_remaining,
                            "notification_interval": notification_interval
                        }
                    )
                    db.add(audit)

                except Exception as e:
                    # Log error but continue processing other deadlines
                    error_log = AuditLog(
                        workspace_id=deadline.workspace_id,
                        event_type="notification.deadline.failed",
                        actor_type="system",
                        extra_data={
                            "deadline_id": deadline.id,
                            "error": str(e),
                            "notification_interval": notification_interval
                        }
                    )
                    db.add(error_log)

        db.commit()

        result = {
            "status": "success",
            "notifications_sent": notifications_sent,
            "timestamp": datetime.utcnow().isoformat(),
        }
        logger.info("send_deadline_notifications: complete — %s", result)
        return result

    except Exception as e:
        db.rollback()
        logger.exception("send_deadline_notifications: unhandled error — %s", e)
        raise
    finally:
        db.close()


def _send_deadline_email(
    to_email: str,
    workspace_name: str,
    deadline_title: str,
    deadline_date: date,
    days_remaining: int,
    deadline_type: str
):
    """
    Send deadline reminder email via Resend.
    """
    if not settings.RESEND_API_KEY:
        raise ValueError("RESEND_API_KEY not configured")

    resend.api_key = settings.RESEND_API_KEY

    # Determine urgency level
    if days_remaining <= 1:
        urgency = "URGENT"
        urgency_color = "#DC2626"  # red-600
    elif days_remaining <= 7:
        urgency = "CRITICAL"
        urgency_color = "#EA580C"  # orange-600
    elif days_remaining <= 14:
        urgency = "WARNING"
        urgency_color = "#F59E0B"  # amber-500
    else:
        urgency = "NOTICE"
        urgency_color = "#2563EB"  # blue-600

    # Map deadline type to friendly name
    deadline_type_names = {
        "sam_renewal": "SAM.gov Registration Renewal",
        "reps_certs_renewal": "Representations & Certifications Update",
        "cage_code_renewal": "CAGE Code Annual Review",
        "custom": "Custom Deadline"
    }

    deadline_type_display = deadline_type_names.get(deadline_type, deadline_title)

    # Email subject
    subject = f"[{urgency}] {deadline_title} - {days_remaining} day{'s' if days_remaining != 1 else ''} remaining"

    # Email HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 32px 40px; border-bottom: 1px solid #E5E7EB;">
                                <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">INVIGOV</h1>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280;">Federal Contract Intelligence Platform</p>
                            </td>
                        </tr>

                        <!-- Urgency Banner -->
                        <tr>
                            <td style="padding: 24px 40px; background-color: {urgency_color};">
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.05em;">
                                    {urgency} - Compliance Deadline Approaching
                                </p>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td style="padding: 32px 40px;">
                                <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
                                    Hello from <strong>{workspace_name}</strong>,
                                </p>

                                <p style="margin: 0 0 24px 0; font-size: 14px; color: #374151;">
                                    This is a reminder that you have an upcoming compliance deadline:
                                </p>

                                <!-- Deadline Card -->
                                <div style="background-color: #F9FAFB; border-left: 4px solid {urgency_color}; padding: 16px 20px; margin: 0 0 24px 0; border-radius: 4px;">
                                    <h2 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
                                        {deadline_title}
                                    </h2>
                                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #6B7280;">
                                        <strong>Type:</strong> {deadline_type_display}
                                    </p>
                                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #6B7280;">
                                        <strong>Due Date:</strong> {deadline_date.strftime('%B %d, %Y')}
                                    </p>
                                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: {urgency_color};">
                                        {days_remaining} day{'s' if days_remaining != 1 else ''} remaining
                                    </p>
                                </div>

                                <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
                                    <strong>Recommended Actions:</strong>
                                </p>

                                <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; color: #374151; line-height: 1.6;">
                                    <li>Log in to your INVIGOV dashboard to review requirements</li>
                                    <li>Gather necessary documentation and supporting materials</li>
                                    <li>Complete required submissions before the deadline</li>
                                    <li>Mark the deadline as complete in your compliance tracker</li>
                                </ul>

                                <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                                    <tr>
                                        <td style="background-color: #2563EB; border-radius: 6px; text-align: center;">
                                            <a href="{settings.FRONTEND_URL}/dashboard/compliance" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                                                View Compliance Dashboard →
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.5;">
                                    <strong>Note:</strong> This is an automated reminder based on your compliance subscription. You will receive additional reminders as the deadline approaches. To manage notification preferences, please visit your account settings.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 24px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
                                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">
                                    © 2024 INVIGOV. All rights reserved.
                                </p>
                                <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                                    You're receiving this email because you have an active compliance subscription. This notification is part of your federal contracting compliance monitoring service.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    params = {
        "from": f"INVIGOV Compliance Alerts <{settings.EMAIL_FROM}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content,
    }

    response = resend.Emails.send(params)

    if not response or "id" not in response:
        raise Exception(f"Resend API error: {response}")

    return response


def check_subscription_status_sync():
    """
    RQ job: hourly Stripe API sync for all active subscriptions.
    Fallback in case webhooks are missed.

    Checks Stripe API directly for subscription status and updates
    local database to match. This prevents issues where webhooks
    might be delayed or missed entirely.

    Designed to run as a standalone RQ job with no FastAPI context.
    Scheduled hourly by scheduler.py.
    """
    import stripe

    logger.info("check_subscription_status_sync: starting job")
    db = SessionLocal()

    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY

        # Get all entitlements with active subscriptions (new model + legacy)
        from sqlalchemy import or_
        entitlements = db.query(Entitlement).filter(
            or_(
                (Entitlement.subscription_status == 'active') & (Entitlement.subscription_tier.in_(['intelligence', 'complete'])),
                Entitlement.compliance_subscription_status == 'active'
            )
        ).all()

        sync_count = 0
        mismatch_count = 0

        for entitlement in entitlements:
            if not entitlement.stripe_subscription_id:
                continue

            try:
                # Fetch subscription from Stripe
                subscription = stripe.Subscription.retrieve(
                    entitlement.stripe_subscription_id
                )

                # Check if status differs
                stripe_status = subscription.status  # active, past_due, canceled, etc.

                if stripe_status in ['canceled', 'unpaid']:
                    # Update local status to match Stripe (new + legacy fields)
                    entitlement.subscription_status = 'canceled'
                    entitlement.subscription_tier = 'free'
                    entitlement.compliance_subscription_status = 'canceled'

                    audit = AuditLog(
                        workspace_id=entitlement.workspace_id,
                        event_type="sync.subscription_status_mismatch",
                        actor_type="system",
                        extra_data={
                            "stripe_subscription_id": entitlement.stripe_subscription_id,
                            "stripe_status": stripe_status,
                            "local_status": "active",
                            "action": "corrected_to_canceled"
                        }
                    )
                    db.add(audit)
                    mismatch_count += 1

                elif stripe_status == 'past_due':
                    # Payment failed - set to expired (new + legacy fields)
                    entitlement.subscription_status = 'expired'
                    entitlement.compliance_subscription_status = 'expired'

                    audit = AuditLog(
                        workspace_id=entitlement.workspace_id,
                        event_type="sync.subscription_status_mismatch",
                        actor_type="system",
                        extra_data={
                            "stripe_subscription_id": entitlement.stripe_subscription_id,
                            "stripe_status": stripe_status,
                            "local_status": "active",
                            "action": "corrected_to_expired"
                        }
                    )
                    db.add(audit)
                    mismatch_count += 1

                sync_count += 1

            except stripe.error.StripeError as e:
                # Log Stripe API error but continue processing
                error_log = AuditLog(
                    workspace_id=entitlement.workspace_id,
                    event_type="sync.stripe_api_error",
                    actor_type="system",
                    extra_data={
                        "stripe_subscription_id": entitlement.stripe_subscription_id,
                        "error": str(e)
                    }
                )
                db.add(error_log)

        db.commit()

        result = {
            "status": "success",
            "subscriptions_checked": sync_count,
            "mismatches_corrected": mismatch_count,
            "timestamp": datetime.utcnow().isoformat(),
        }
        logger.info("check_subscription_status_sync: complete — %s", result)
        return result

    except Exception as e:
        db.rollback()
        logger.exception("check_subscription_status_sync: unhandled error — %s", e)
        raise
    finally:
        db.close()
