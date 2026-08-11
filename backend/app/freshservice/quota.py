from __future__ import annotations

from datetime import UTC, datetime

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import Settings


class QuotaExceeded(RuntimeError):
    def __init__(
        self,
        retry_after_seconds: int,
        message: str = "Freshservice quota budget exhausted",
    ) -> None:
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


_LUA_ACQUIRE = """
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local cost = tonumber(ARGV[1])
local allowed = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])
if current + cost > allowed then
  return {0, current}
end
local updated = redis.call('INCRBY', KEYS[1], cost)
if current == 0 then
  redis.call('EXPIRE', KEYS[1], ttl)
end
return {1, updated}
"""


class FreshserviceQuotaManager:
    """Shared account-level budget guard backed by Redis."""

    def __init__(self, settings: Settings, redis: Redis) -> None:
        self.settings = settings
        self.redis = redis

    def _key(self) -> str:
        minute = datetime.now(UTC).strftime("%Y%m%d%H%M")
        return f"dclic:freshservice:quota:{minute}"

    def _retry_after(self) -> int:
        now = datetime.now(UTC)
        return max(1, 60 - now.second)

    async def acquire(self, *, cost: int = 1, emergency: bool = False) -> int:
        limit = self.settings.freshservice_rate_limit_per_minute
        reserve = round(limit * self.settings.freshservice_emergency_reserve_percent / 100)
        allowed = limit if emergency else max(1, limit - reserve)

        result = await self.redis.eval(
            _LUA_ACQUIRE,
            1,
            self._key(),
            cost,
            allowed,
            120,
        )
        permitted = bool(int(result[0]))
        current = int(result[1])
        if not permitted:
            raise QuotaExceeded(self._retry_after())
        return current

    async def consume_additional(self, cost: int) -> None:
        if cost > 0:
            await self.redis.incrby(self._key(), cost)

    async def current_usage(self) -> int:
        value = await self.redis.get(self._key())
        return int(value or 0)

    async def healthcheck(self) -> bool:
        try:
            return bool(await self.redis.ping())
        except RedisError:
            return False
