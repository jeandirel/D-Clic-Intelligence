from __future__ import annotations

import hashlib
import json
from typing import Any

from sqlalchemy import select

from app.data.db import Database
from app.data.models import ActionCommandRecord, AuditEvent
from app.domain.models import ActionCommand


class IdempotencyConflict(RuntimeError):
    pass


def _command_hash(command: ActionCommand) -> str:
    canonical = {
        "actor_id": command.actor_id,
        "action": command.action,
        "resource_id": command.resource_id,
        "payload": command.payload,
        "risk": command.risk.value,
        "reason": command.reason,
        "recommendation_id": command.recommendation_id,
    }
    raw = json.dumps(canonical, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class CommandRepository:
    def __init__(self, database: Database) -> None:
        self.database = database

    async def register(self, command: ActionCommand) -> bool:
        payload_hash = _command_hash(command)
        async with self.database.session_factory() as session:
            existing = await session.get(ActionCommandRecord, command.command_id)
            if existing:
                if existing.payload_hash != payload_hash:
                    raise IdempotencyConflict(
                        f"command_id {command.command_id!r} was already used with another payload"
                    )
                return False

            session.add(
                ActionCommandRecord(
                    command_id=command.command_id,
                    actor_id=command.actor_id,
                    action=command.action,
                    resource_id=command.resource_id,
                    payload=command.payload,
                    payload_hash=payload_hash,
                    risk=command.risk.value,
                    reason=command.reason,
                    recommendation_id=command.recommendation_id,
                    status="received",
                )
            )
            await session.commit()
            return True

    async def set_status(self, command_id: str, status: str) -> None:
        async with self.database.session_factory() as session:
            record = await session.get(ActionCommandRecord, command_id)
            if record:
                record.status = status
                await session.commit()

    async def get_status(self, command_id: str) -> str | None:
        async with self.database.session_factory() as session:
            record = await session.get(ActionCommandRecord, command_id)
            return record.status if record else None


class AuditRepository:
    def __init__(self, database: Database) -> None:
        self.database = database

    async def record(
        self,
        event_type: str,
        *,
        command_id: str | None = None,
        actor_id: str | None = None,
        correlation_id: str | None = None,
        data: dict[str, Any] | None = None,
    ) -> None:
        async with self.database.session_factory() as session:
            session.add(
                AuditEvent(
                    event_type=event_type,
                    command_id=command_id,
                    actor_id=actor_id,
                    correlation_id=correlation_id,
                    data=data or {},
                )
            )
            await session.commit()

    async def recent(self, limit: int = 100) -> list[AuditEvent]:
        async with self.database.session_factory() as session:
            result = await session.execute(
                select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)
            )
            return list(result.scalars())
