from typing import ClassVar

from app.domain.models import ActionCommand, ActionRisk, PolicyDecision, PolicyResult


class PolicyEngine:
    """Deterministic authorization layer. AI confidence never grants permission by itself."""

    _always_blocked: ClassVar[frozenset[str]] = frozenset({"asset.delete", "user.delete"})
    _approval_actions: ClassVar[frozenset[str]] = frozenset(
        {"ticket.update", "ticket.close", "ticket.delete", "problem.create", "change.update"}
    )

    def evaluate(self, command: ActionCommand) -> PolicyResult:
        if command.action in self._always_blocked:
            return PolicyResult(
                decision=PolicyDecision.DENY,
                policy_id="P-BLOCK-DESTRUCTIVE-001",
                reason="Destructive action is blocked by policy.",
            )

        requires_approval = (
            command.risk in {ActionRisk.HIGH, ActionRisk.CRITICAL}
            or command.action in self._approval_actions
        )
        if requires_approval and not command.approved:
            return PolicyResult(
                decision=PolicyDecision.REQUIRE_APPROVAL,
                policy_id="P-HITL-001",
                reason="This action requires explicit human approval before execution.",
            )

        return PolicyResult(
            decision=PolicyDecision.ALLOW,
            policy_id="P-ALLOW-AFTER-CONTROLS-001",
            reason="Action is allowed after deterministic policy controls.",
        )
