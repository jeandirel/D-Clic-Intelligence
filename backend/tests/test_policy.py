from app.domain.models import ActionCommand, ActionRisk, PolicyDecision
from app.policy.engine import PolicyEngine


def test_low_risk_update_is_allowed() -> None:
    command = ActionCommand(
        command_id="cmd-001",
        actor_id="agent-1",
        action="ticket.update",
        resource_id=42,
        payload={"priority": 2},
        risk=ActionRisk.LOW,
    )
    result = PolicyEngine().evaluate(command)
    assert result.decision == PolicyDecision.ALLOW


def test_high_risk_action_requires_approval() -> None:
    command = ActionCommand(
        command_id="cmd-002",
        actor_id="agent-1",
        action="ticket.close",
        resource_id=42,
        risk=ActionRisk.HIGH,
    )
    result = PolicyEngine().evaluate(command)
    assert result.decision == PolicyDecision.REQUIRE_APPROVAL


def test_destructive_action_is_denied() -> None:
    command = ActionCommand(
        command_id="cmd-003",
        actor_id="admin-1",
        action="asset.delete",
        resource_id=42,
        approved=True,
        risk=ActionRisk.CRITICAL,
    )
    result = PolicyEngine().evaluate(command)
    assert result.decision == PolicyDecision.DENY
