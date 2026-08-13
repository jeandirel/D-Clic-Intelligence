from __future__ import annotations

import asyncio

from app.core.config import Settings
from app.data.repositories import AuditRepository, CommandRepository
from app.domain.models import ActionCommand, ActionRisk, GatewayResult, PolicyDecision
from app.freshservice.client import FreshserviceClient
from app.observability.metrics import ACTION_RESULTS, POLICY_DECISIONS
from app.policy.engine import PolicyEngine


class FreshserviceGateway:
    """Single controlled write/read boundary between D-Clic and Freshservice."""

    def __init__(
        self,
        *,
        settings: Settings,
        client: FreshserviceClient,
        commands: CommandRepository,
        audit: AuditRepository,
    ) -> None:
        self.settings = settings
        self.client = client
        self.commands = commands
        self.audit = audit
        self.policy = PolicyEngine()
        self._semaphore = asyncio.Semaphore(settings.freshservice_max_concurrency)

    async def get_ticket(self, ticket_id: int, *, include: str | None = None) -> dict:
        async with self._semaphore:
            return await self.client.get_ticket(ticket_id, include=include)

    async def list_tickets(self, **kwargs) -> dict:
        async with self._semaphore:
            return await self.client.list_tickets(**kwargs)

    async def filter_tickets(self, query: str, **kwargs) -> dict:
        async with self._semaphore:
            return await self.client.filter_tickets(query, **kwargs)

    async def get_ticket_conversations(self, ticket_id: int, **kwargs) -> dict:
        async with self._semaphore:
            return await self.client.get_ticket_conversations(ticket_id, **kwargs)

    async def get_ticket_fields(self, **kwargs) -> dict:
        async with self._semaphore:
            return await self.client.get_ticket_fields(**kwargs)

    async def list_groups(self, **kwargs) -> dict:
        async with self._semaphore:
            return await self.client.list_groups(**kwargs)

    async def list_agents(self, **kwargs) -> dict:
        async with self._semaphore:
            return await self.client.list_agents(**kwargs)

    async def execute(self, command: ActionCommand) -> GatewayResult:
        correlation_id = command.correlation_id or command.command_id
        policy = self.policy.evaluate(command)
        POLICY_DECISIONS.labels(
            decision=policy.decision.value,
            policy_id=policy.policy_id,
        ).inc()

        await self.audit.record(
            "policy.evaluated",
            command_id=command.command_id,
            actor_id=command.actor_id,
            correlation_id=correlation_id,
            data={
                "decision": policy.decision.value,
                "policy_id": policy.policy_id,
                "reason": policy.reason,
                "action": command.action,
                "resource_id": command.resource_id,
            },
        )

        if policy.decision != PolicyDecision.ALLOW:
            ACTION_RESULTS.labels(status=policy.decision.value).inc()
            return GatewayResult(
                command_id=command.command_id,
                status=policy.decision.value,
                policy=policy,
                dry_run=True,
            )

        registered = await self.commands.register(command)
        if not registered:
            prior_status = await self.commands.get_status(command.command_id)
            ACTION_RESULTS.labels(status="duplicate_blocked").inc()
            await self.audit.record(
                "command.duplicate_blocked",
                command_id=command.command_id,
                actor_id=command.actor_id,
                correlation_id=correlation_id,
                data={"prior_status": prior_status},
            )
            return GatewayResult(
                command_id=command.command_id,
                status="duplicate_blocked",
                policy=policy,
                dry_run=not self.settings.freshservice_write_enabled,
            )

        if not self.settings.freshservice_write_enabled:
            await self.commands.set_status(command.command_id, "dry_run")
            ACTION_RESULTS.labels(status="dry_run").inc()
            await self.audit.record(
                "command.dry_run",
                command_id=command.command_id,
                actor_id=command.actor_id,
                correlation_id=correlation_id,
                data={"action": command.action, "payload": command.payload},
            )
            return GatewayResult(
                command_id=command.command_id,
                status="dry_run",
                policy=policy,
                dry_run=True,
            )

        if command.action != "ticket.update":
            await self.commands.set_status(command.command_id, "unsupported_action")
            ACTION_RESULTS.labels(status="unsupported_action").inc()
            return GatewayResult(
                command_id=command.command_id,
                status="unsupported_action",
                policy=policy,
                dry_run=False,
            )

        await self.commands.set_status(command.command_id, "executing")
        await self.audit.record(
            "command.executing",
            command_id=command.command_id,
            actor_id=command.actor_id,
            correlation_id=correlation_id,
            data={"action": command.action, "resource_id": command.resource_id},
        )

        emergency = command.approved and command.risk in {ActionRisk.HIGH, ActionRisk.CRITICAL}

        try:
            async with self._semaphore:
                response = await self.client.update_ticket(
                    command.resource_id,
                    command.payload,
                    emergency=emergency,
                )
                verified = await self.client.get_ticket(command.resource_id)
        except Exception as exc:
            await self.commands.set_status(command.command_id, "failed")
            ACTION_RESULTS.labels(status="failed").inc()
            await self.audit.record(
                "command.failed",
                command_id=command.command_id,
                actor_id=command.actor_id,
                correlation_id=correlation_id,
                data={"error_type": type(exc).__name__, "message": str(exc)[:500]},
            )
            raise

        await self.commands.set_status(command.command_id, "verified")
        ACTION_RESULTS.labels(status="verified").inc()
        await self.audit.record(
            "command.verified",
            command_id=command.command_id,
            actor_id=command.actor_id,
            correlation_id=correlation_id,
            data={
                "action": command.action,
                "resource_id": command.resource_id,
                "verified": True,
            },
        )
        return GatewayResult(
            command_id=command.command_id,
            status="verified",
            verified=True,
            dry_run=False,
            policy=policy,
            freshservice_response={"write": response, "verification": verified},
        )
