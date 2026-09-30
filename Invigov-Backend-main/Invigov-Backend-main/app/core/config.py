from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str
    DIRECT_URL: str = ""

    # Redis
    REDIS_URL: str
    UPSTASH_REDIS_REST_URL: str = ""
    UPSTASH_REDIS_REST_TOKEN: str = ""

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_PRICE_ID_INTELLIGENCE: str = ""
    STRIPE_PRICE_ID_COMPLETE: str = ""

    # Storage Configuration
    STORAGE_TYPE: str = "local"  # "local" or "r2"
    LOCAL_STORAGE_PATH: str = "./storage/documents"

    # Cloudflare R2
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_ENDPOINT_URL: str = ""
    R2_PUBLIC_DOMAIN: str = ""

    # Encryption (AES-256 for EIN, banking fields)
    ENCRYPTION_KEY: str

    # CORS
    ALLOWED_ORIGINS: str | List[str] = '["http://localhost:3000"]'

    # Frontend URL (for Stripe redirects)
    FRONTEND_URL: str = "http://localhost:3000"

    # Email (Resend)
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@samgov-platform.com"

    # Sentry
    SENTRY_DSN: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    def model_post_init(self, __context) -> None:
        # Parse ALLOWED_ORIGINS if it's a JSON string
        if isinstance(self.ALLOWED_ORIGINS, str):
            try:
                self.ALLOWED_ORIGINS = json.loads(self.ALLOWED_ORIGINS)
            except json.JSONDecodeError:
                self.ALLOWED_ORIGINS = [self.ALLOWED_ORIGINS]


settings = Settings()
