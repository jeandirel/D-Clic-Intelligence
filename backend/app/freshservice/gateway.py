import asyncio

from app.core.config import Settings
from app.domain.models import ActionCommand, GatewayResult, PolicyDecision
from app.freshservice.client import FreshserviceClient
from app.policy.engine import PolicyEngine


class FreshserviceGateway:
    """Single controlled write/read boundary between D-Clic and Freshservice."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client = FreshserviceClient(settings)
        self.policy = PolicyEngine()
        self._semaphore = asyncio.Semaphore(settings.freshservice_max_concurrency)
        self._executed_commands: set[str] = set()

    async def get_ticket(self, ticket_id: int) -> dict:
        async with self._semaphore:
            return await self.client.get_ticket(ticket_id)

    async def execute(self, command: ActionCommand) -> GatewayResult:
        policy = self.policy.evaluate(command)
        if policy.decision != PolicyDecision.ALLOW:
            return GatewayResult(
                command_id=command.command_id,
                status=policy.decision.value,
                policy=policy,
                dry_run=True,
            )

        if command.command_id in self._executed_commands:
            return GatewayResult(
                command_id=command.command_id,
                status="duplicate_blocked",
                policy=policy,
                dry_run=not self.settings.freshservice_write_enabled,
            )

        if not self.settings.freshservice_write_enabled:
            return GatewayResult(
                command_id=command.command_id,
                status="dry_run",
                policy=policy,
                dry_run=True,
            )

        if command.action != "ticket.update":
            return GatewayResult(
                command_id=command.command_id,
                status="unsupported_action",
                policy=policy,
                dry_run=False,
            )

        async with self._semaphore:
            response = await self.client.update_ticket(command.resource_id, command.payload)
            verified = await self.client.get_ticket(command.resource_id)

        self._executed_commands.add(command.command_id)
        return GatewayResult(
            command_id=command.command_id,
            status="verified",
            verified=True,
            dry_run=False,
            policy=policy,
            freshservice_response={"write": response, "verification": verified},
        )
