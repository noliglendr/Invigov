from fastapi import APIRouter
from app.api.v1.endpoints import auth, payments, workflow, documents, compliance, admin
from app.api.v1.webhooks import stripe as stripe_webhook

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["compliance"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(stripe_webhook.router, prefix="/webhooks", tags=["webhooks"])
