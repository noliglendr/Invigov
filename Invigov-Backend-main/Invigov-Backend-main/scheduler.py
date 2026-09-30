#!/usr/bin/env python
"""
Scheduler entrypoint — enqueues RQ jobs on a cron-like schedule.

Run with:
    python scheduler.py

Schedule:
    - send_deadline_notifications    — daily at 09:00 UTC
    - check_subscription_status_sync — every hour at :00

This process runs an infinite loop using only the standard library (time /
datetime) and the rq + redis packages already present in requirements.txt.
No rq-scheduler or APScheduler dependency is required.

Environment:
    REDIS_URL — required. Set in .env or as an environment variable.
"""

import logging
import os
import sys
import time
from datetime import datetime, timezone

# Ensure the project root is on sys.path when running as a script.
sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

from redis import Redis
from rq import Queue

from app.core.config import settings
from app.workers.scheduler import (
    QUEUE_NAME_NOTIFICATIONS,
    NOTIFICATION_JOB_TIMEOUT,
    NOTIFICATION_RESULT_TTL,
    SUBSCRIPTION_SYNC_TIMEOUT,
    SUBSCRIPTION_SYNC_TTL,
)

# Tick resolution: check every 60 seconds to keep scheduling accurate.
TICK_INTERVAL_SECONDS = 60

# Hour (UTC) at which daily notification job fires.
DAILY_NOTIFICATION_HOUR_UTC = 9


def _build_redis_connection() -> Redis:
    """Return a Redis connection that works for both redis:// and rediss:// URLs."""
    is_tls = settings.REDIS_URL.startswith("rediss://")
    kwargs = {}
    if is_tls:
        kwargs["ssl_cert_reqs"] = None
    return Redis.from_url(settings.REDIS_URL, **kwargs)


def _enqueue_deadline_notifications(q: Queue) -> None:
    """Enqueue send_deadline_notifications as an RQ job."""
    job = q.enqueue(
        "app.workers.notifications.send_deadline_notifications",
        job_timeout=NOTIFICATION_JOB_TIMEOUT,
        result_ttl=NOTIFICATION_RESULT_TTL,
    )
    logger.info(
        "Enqueued send_deadline_notifications — job_id=%s queue=%s",
        job.id,
        q.name,
    )


def _enqueue_subscription_sync(q: Queue) -> None:
    """Enqueue check_subscription_status_sync as an RQ job."""
    job = q.enqueue(
        "app.workers.notifications.check_subscription_status_sync",
        job_timeout=SUBSCRIPTION_SYNC_TIMEOUT,
        result_ttl=SUBSCRIPTION_SYNC_TTL,
    )
    logger.info(
        "Enqueued check_subscription_status_sync — job_id=%s queue=%s",
        job.id,
        q.name,
    )


def main() -> None:
    conn = _build_redis_connection()

    try:
        conn.ping()
        logger.info("Redis connection established: %s", settings.REDIS_URL)
    except Exception as exc:
        logger.critical("Cannot connect to Redis: %s", exc)
        sys.exit(1)

    q = Queue(QUEUE_NAME_NOTIFICATIONS, connection=conn)

    # Track which periods have already fired to avoid duplicate enqueues
    # within the same minute-tick.
    last_notification_day: int | None = None   # calendar day (0–365)
    last_sync_hour: int | None = None          # hour of day (0–23)

    logger.info(
        "Scheduler started. "
        "Deadline notifications: daily at %02d:00 UTC. "
        "Subscription sync: hourly.",
        DAILY_NOTIFICATION_HOUR_UTC,
    )

    # Enqueue the subscription sync immediately on startup so the first run
    # doesn't have to wait up to an hour.
    _enqueue_subscription_sync(q)
    now = datetime.now(tz=timezone.utc)
    last_sync_hour = now.hour

    while True:
        try:
            now = datetime.now(tz=timezone.utc)
            current_day = now.timetuple().tm_yday  # day-of-year 1..366
            current_hour = now.hour

            # --- Daily deadline notifications at DAILY_NOTIFICATION_HOUR_UTC ---
            if (
                current_hour == DAILY_NOTIFICATION_HOUR_UTC
                and current_day != last_notification_day
            ):
                _enqueue_deadline_notifications(q)
                last_notification_day = current_day

            # --- Hourly subscription sync at the top of every hour ---
            if current_hour != last_sync_hour:
                _enqueue_subscription_sync(q)
                last_sync_hour = current_hour

        except Exception as exc:
            # Log unexpected errors but keep the scheduler loop alive.
            logger.exception("Scheduler loop error: %s", exc)

        time.sleep(TICK_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
