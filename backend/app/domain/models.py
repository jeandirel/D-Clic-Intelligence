from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class PolicyDecision(str, Enum):
    ALLOW = "allow"
    REQUIRE_APPROVAL = "require_approval"
    DENY = "deny"


class ActionRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ActionCommand(BaseModel):
    command_id: str = Field(min_length=3, max_length=128)
    actor_id: str = Field(min_length=1, max_length=128)
    action: str
    resource_id: int
    payload: dict[str, Any] = Field(default_factory=dict)
    risk: ActionRisk = ActionRisk.MEDIUM
    approved: bool = False
    reason: str = ""
    recommendation_id: str | None = None
    correlation_id: str | None = Field(default=None, max_length=128)


class PolicyResult(BaseModel):
    decision: PolicyDecision
    policy_id: str
    reason: str


class GatewayResult(BaseModel):
    command_id: str
    status: str
    verified: bool = False
    dry_run: bool = True
    policy: PolicyResult
    freshservice_response: dict[str, Any] | None = None


class TicketIntelligence(BaseModel):
    ticket_id: int
    summary: str
    sla_risk: float = Field(ge=0, le=1)
    classification_confidence: float = Field(ge=0, le=1)
    recommended_actions: list[dict[str, Any]]
    evidence: list[str] = Field(default_factory=list)
    mode: str = "bootstrap"
