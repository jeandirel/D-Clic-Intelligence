from __future__ import annotations

from redis.asyncio import Redis

from app.core.config import Settings
from app.data.db import Database
from app.data.repositories import AuditRepository, CommandRepository
from app.freshservice.client import FreshserviceClient
from app.freshservice.gateway import FreshserviceGateway
from app.freshservice.quota import FreshserviceQuotaManager


class AppRuntime:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.database = Database(settings)
        self.redis = Redis.from_url(settings.redis_url, decode_responses=True)
        self.quota = FreshserviceQuotaManager(settings, self.redis)
        self.audit = AuditRepository(self.database)
        self.commands = CommandRepository(self.database)
        self.client = FreshserviceClient(settings, self.quota)
        self.gateway = FreshserviceGateway(
            settings=settings,
            client=self.client,
            commands=self.commands,
            audit=self.audit,
        )

    async def startup(self) -> None:
        if self.settings.auto_create_database_tables:
            await self.database.init_models()

    async def shutdown(self) -> None:
        await self.client.close()
        await self.redis.aclose()
        await self.database.close()
