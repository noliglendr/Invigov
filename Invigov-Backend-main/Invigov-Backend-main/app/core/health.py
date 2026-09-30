from app.core.database import engine
from app.core.redis import redis_client
from app.core.config import settings
from sqlalchemy import text


async def check_health() -> dict:
    status = {"db": "error", "redis": "error", "r2": "error"}

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        status["db"] = "ok"
    except Exception:
        pass

    try:
        redis_client.ping()
        status["redis"] = "ok"
    except Exception as e:
        # Include partial URL info (safe: shows host only) to help diagnose env var issues
        try:
            from urllib.parse import urlparse
            parsed = urlparse(settings.REDIS_URL)
            status["redis_host"] = parsed.hostname or "unknown"
        except Exception:
            pass
        status["redis_error"] = str(e)[:120]

    try:
        from app.services.storage import check_r2_connection
        if check_r2_connection():
            status["r2"] = "ok"
    except Exception:
        pass

    return status
