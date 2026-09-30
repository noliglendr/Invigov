import redis
from app.core.config import settings


def _make_client():
    is_tls = settings.REDIS_URL.startswith("rediss://")
    kwargs = {"decode_responses": True}
    if is_tls:
        kwargs["ssl_cert_reqs"] = None
    return redis.from_url(settings.REDIS_URL, **kwargs)


class _LazyRedis:
    """
    Defers connection until first use. Re-attempts on each call if previously failed.
    This ensures env-var changes take effect after a redeploy without a fallback mock.
    """
    _client = None

    def _get(self):
        if self._client is None:
            self._client = _make_client()
        return self._client

    def ping(self):
        return self._get().ping()

    def get(self, key):
        return self._get().get(key)

    def set(self, key, value, ex=None):
        return self._get().set(key, value, ex=ex)

    def delete(self, key):
        return self._get().delete(key)

    def expire(self, key, seconds):
        return self._get().expire(key, seconds)

    def exists(self, *keys):
        return self._get().exists(*keys)

    def incr(self, key):
        return self._get().incr(key)


redis_client = _LazyRedis()


def get_redis():
    return redis_client
