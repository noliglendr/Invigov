"""
Stripe webhook handler.
No JWT auth — Stripe calls this directly.
All events are processed idempotently via stripe_events table.
"""
import stripe
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.entitlement_service import (
    handle_checkout_completed,
    handle_payment_succeeded,
    handle_payment_failed,
    handle_subscription_updated,
    handle_subscription_deleted,
)
from app.models.stripe_event import StripeEvent

router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    db: Session = SessionLocal()
    try:
        # Idempotency check
        existing = db.query(StripeEvent).filter_by(stripe_event_id=event["id"]).first()
        if existing:
            return {"status": "already_processed"}

        # Record the event before processing
        db_event = StripeEvent(
            stripe_event_id=event["id"],
            event_type=event["type"],
            payload=event,
            processing_status="pending",
        )
        db.add(db_event)
        db.commit()

        # Dispatch to handler
        handlers = {
            "checkout.session.completed": handle_checkout_completed,
            "invoice.payment_succeeded": handle_payment_succeeded,
            "invoice.payment_failed": handle_payment_failed,
            "customer.subscription.updated": handle_subscription_updated,
            "customer.subscription.deleted": handle_subscription_deleted,
        }
        handler = handlers.get(event["type"])
        if handler:
            handler(db, event["data"]["object"])

        db_event.processing_status = "success"
        db.commit()

    except Exception as e:
        db.rollback()
        if "db_event" in locals():
            db_event.processing_status = "failed"
            db_event.error_message = str(e)
            db.commit()
        raise
    finally:
        db.close()

    return {"status": "ok"}
