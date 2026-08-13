from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class CopilotTicket(BaseModel):
    id: int
    subject: str
    description_text: str = ""
    requester_id: int | None = None
    requester_name: str | None = None
    requester_email: str | None = None
    status: int | None = None
    status_label: str | None = None
    priority: int | None = None
    priority_label: str | None = None
    source: int | None = None
    source_label: str | None = None
    ticket_type: str | None = None
    urgency: int | None = None
    impact: int | None = None
    group_id: int | None = None
    group_name: str | None = None
    responder_id: int | None = None
    responder_name: str | None = None
    category: str | None = None
    sub_category: str | None = None
    item_category: str | None = None
    due_by: datetime | None = None
    fr_due_by: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    tags: list[str] = Field(default_factory=list)
    custom_fields: dict[str, Any] = Field(default_factory=dict)
    assets: list[dict[str, Any]] = Field(default_factory=list)
    stats: dict[str, Any] = Field(default_factory=dict)
    changes: list[dict[str, Any]] = Field(default_factory=list)
    related_tickets: list[dict[str, Any]] = Field(default_factory=list)


class CopilotTicketList(BaseModel):
    tickets: list[CopilotTicket]
    page: int
    per_page: int
    source: Literal["freshservice"] = "freshservice"


class CopilotContext(BaseModel):
    ticket: CopilotTicket
    conversations: list[dict[str, Any]] = Field(default_factory=list)
    requester: dict[str, Any] | None = None
    ticket_fields: list[dict[str, Any]] = Field(default_factory=list)
    groups: list[dict[str, Any]] = Field(default_factory=list)
    agents: list[dict[str, Any]] = Field(default_factory=list)
    generated_at: datetime
    source: Literal["freshservice"] = "freshservice"


class CopilotAnalysisRequest(BaseModel):
    ticket_id: int
    actor_id: str = Field(default="copilot-user", min_length=1, max_length=128)


class CopilotAnalysis(BaseModel):
    ticket_id: int
    summary: str
    improved_description: str
    suggested_priority: int | None = Field(default=None, ge=1, le=4)
    suggested_group_id: int | None = None
    suggested_group_name: str | None = None
    suggested_category: str | None = None
    suggested_sub_category: str | None = None
    suggested_item_category: str | None = None
    confidence: float = Field(ge=0, le=1)
    missing_information: list[str] = Field(default_factory=list)
    next_best_action: str
    draft_reply: str
    internal_note: str
    evidence: list[str] = Field(default_factory=list)
    mode: Literal["openai", "bootstrap"]
    model: str | None = None
    generated_at: datetime


class CopilotPreviewRequest(BaseModel):
    ticket_id: int
    actor_id: str = Field(min_length=1, max_length=128)
    description: str | None = None
    priority: int | None = Field(default=None, ge=1, le=4)
    group_id: int | None = None
    responder_id: int | None = None
    category: str | None = None
    sub_category: str | None = None
    item_category: str | None = None
    custom_fields: dict[str, Any] = Field(default_factory=dict)
    reason: str = "Copilot recommendation reviewed by agent"


class CopilotPreview(BaseModel):
    ticket_id: int
    before: dict[str, Any]
    after: dict[str, Any]
    payload: dict[str, Any]
    changed_fields: list[str]
    requires_human_approval: bool = True
    policy_id: str = "P-HITL-001"


class CopilotExecuteRequest(CopilotPreviewRequest):
    approved: bool = False
    command_id: str = Field(min_length=3, max_length=128)


class VisualizationRequest(BaseModel):
    prompt: str = Field(min_length=2, max_length=1000)
    updated_since: datetime | None = None
    workspace_id: int | None = None


class VisualizationDatum(BaseModel):
    label: str
    value: float
    secondary: float | None = None


class VisualizationResponse(BaseModel):
    title: str
    subtitle: str
    kind: Literal["bar", "line", "donut", "heatmap"]
    unit: str
    data: list[VisualizationDatum]
    insights: list[str]
    source: Literal["freshservice"] = "freshservice"
    ticket_count: int
    scope: str
    generated_at: datetime


class SpeechTokenResponse(BaseModel):
    token: str
    region: str
    language: str
    voice: str
    expires_in_seconds: int = 600
