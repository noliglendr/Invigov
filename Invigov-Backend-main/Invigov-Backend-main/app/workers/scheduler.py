# Queue names and job registration for RQ-based scheduling.
# This module provides helpers used by both scheduler.py (enqueuer)
# and notifications.py (self-rescheduling jobs).

QUEUE_NAME_DEFAULT = "default"
QUEUE_NAME_NOTIFICATIONS = "notifications"

# Job timeout / TTL constants
NOTIFICATION_JOB_TIMEOUT = 3600       # 1 hour max execution time
NOTIFICATION_RESULT_TTL = 86400       # keep result for 24 h
SUBSCRIPTION_SYNC_TIMEOUT = 1800      # 30 min max
SUBSCRIPTION_SYNC_TTL = 7200          # keep result for 2 h
