import pytest

from app.core.config import Settings
from app.data.db import Database
from app.data.repositories import CommandRepository, IdempotencyConflict
from app.domain.models import ActionCommand, ActionRisk


@pytest.mark.asyncio
async def test_command_id_is_persistent_and_idempotent():
    settings = Settings(database_url="sqlite+aiosqlite:///:memory:")
    database = Database(settings)
    await database.init_models()
    repository = CommandRepository(database)

    command = ActionCommand(
        command_id="cmd-123",
        actor_id="agent-1",
        action="ticket.update",
        resource_id=42,
        payload={"priority": 3},
        risk=ActionRisk.LOW,
    )

    assert await repository.register(command) is True
    assert await repository.register(command) is False
    await database.close()


@pytest.mark.asyncio
async def test_command_id_cannot_be_reused_for_another_payload():
    settings = Settings(database_url="sqlite+aiosqlite:///:memory:")
    database = Database(settings)
    await database.init_models()
    repository = CommandRepository(database)

    first = ActionCommand(
        command_id="cmd-456",
        actor_id="agent-1",
        action="ticket.update",
        resource_id=42,
        payload={"priority": 2},
        risk=ActionRisk.LOW,
    )
    second = first.model_copy(update={"payload": {"priority": 4}})

    await repository.register(first)
    with pytest.raises(IdempotencyConflict):
        await repository.register(second)

    await database.close()
