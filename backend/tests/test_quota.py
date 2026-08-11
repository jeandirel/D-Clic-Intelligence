import pytest

from app.core.config import Settings
from app.freshservice.quota import FreshserviceQuotaManager, QuotaExceeded


class FakeRedis:
    def __init__(self):
        self.values = {}

    async def eval(self, script, numkeys, key, cost, allowed, ttl):
        current = int(self.values.get(key, 0))
        if current + int(cost) > int(allowed):
            return [0, current]
        current += int(cost)
        self.values[key] = current
        return [1, current]

    async def get(self, key):
        return self.values.get(key)

    async def incrby(self, key, cost):
        self.values[key] = int(self.values.get(key, 0)) + int(cost)

    async def ping(self):
        return True


@pytest.mark.asyncio
async def test_standard_budget_preserves_emergency_reserve():
    settings = Settings(
        freshservice_rate_limit_per_minute=10,
        freshservice_emergency_reserve_percent=20,
    )
    quota = FreshserviceQuotaManager(settings, FakeRedis())

    for _ in range(8):
        await quota.acquire()

    with pytest.raises(QuotaExceeded):
        await quota.acquire()

    await quota.acquire(emergency=True)
    await quota.acquire(emergency=True)

    with pytest.raises(QuotaExceeded):
        await quota.acquire(emergency=True)
