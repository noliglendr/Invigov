#!/usr/bin/env python
"""
RQ worker entrypoint.

Run with:
    python worker.py

The worker listens on the 'notifications' and 'default' queues and executes
jobs enqueued by scheduler.py (or any other producer).

Environment:
    REDIS_URL — required. Set in .env or as an environment variable.
"""

import logging
import os
import sys

# Ensure the project root is on sys.path when running as a script.
sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

from redis import Redis
from rq import Queue, Worker

from app.core.config import settings
from app.workers.scheduler import (
    QUEUE_NAME_DEFAULT,
    QUEUE_NAME_NOTIFICATIONS,
)


def _build_redis_connection() -> Redis:
    """Return a Redis connection that works for both redis:// and rediss:// URLs."""
    is_tls = settings.REDIS_URL.startswith("rediss://")
    kwargs = {}
    if is_tls:
        kwargs["ssl_cert_reqs"] = None
    return Redis.from_url(settings.REDIS_URL, **kwargs)


def main() -> None:
    conn = _build_redis_connection()

    # Verify connectivity before starting the worker.
    try:
        conn.ping()
        logger.info("Redis connection established: %s", settings.REDIS_URL)
    except Exception as exc:
        logger.critical("Cannot connect to Redis: %s", exc)
        sys.exit(1)

    queues = [
        Queue(QUEUE_NAME_NOTIFICATIONS, connection=conn),
        Queue(QUEUE_NAME_DEFAULT, connection=conn),
    ]

    logger.info(
        "Starting RQ worker — listening on queues: %s",
        [q.name for q in queues],
    )

    worker = Worker(queues, connection=conn)
    worker.work(with_scheduler=False)


if __name__ == "__main__":
    main()
