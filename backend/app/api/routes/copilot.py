from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query, Request

from app.data.repositories import IdempotencyConflict
from app.domain.copilot import (
    CopilotAnalysis,
    CopilotAnalysisRequest,
    CopilotContext,
    CopilotExecuteRequest,
    CopilotPreview,
    CopilotPreviewRequest,
    CopilotTicketList,
    SpeechTokenResponse,
    VisualizationRequest,
    VisualizationResponse,
)
from app.domain.models import ActionCommand, ActionRisk, GatewayResult
from app.freshservice.client import FreshserviceError, FreshserviceRateLimited
from app.freshservice.quota import QuotaExceeded
from app.services.copilot import CopilotService
from app.services.speech import AzureSpeechService, SpeechConfigurationError

router = APIRouter(prefix="/copilot", tags=["copilot"])


def _service(request: Request) -> CopilotService:
    runtime = request.app.state.runtime
    return CopilotService(runtime.settings, runtime.gateway, runtime.redis)


def _rate_limit_http(exc: QuotaExceeded | FreshserviceRateLimited) -> HTTPException:
    return HTTPException(
        status_code=429,
        detail=str(exc),
        headers={"Retry-After": str(exc.retry_after_seconds)},
    )


def _freshservice_http(exc: Exception) -> HTTPException:
    if isinstance(exc, (QuotaExceeded, FreshserviceRateLimited)):
        return _rate_limit_http(exc)
    return HTTPException(status_code=502, detail=str(exc))


@router.get("/status")
async def copilot_status(request: Request) -> dict:
    settings = request.app.state.runtime.settings
    return {
        "freshservice_configured": bool(settings.freshservice_domain and settings.freshservice_api_key),
        "freshservice_writes_enabled": settings.freshservice_write_enabled,
        "llm_configured": bool(settings.openai_api_key),
        "llm_model": settings.openai_model if settings.openai_api_key else None,
        "speech_configured": bool(settings.azure_speech_key and settings.azure_speech_region),
        "speech_voice": settings.azure_speech_voice,
        "speech_language": settings.azure_speech_language,
        "mode": "production",
    }


@router.get("/tickets", response_model=CopilotTicketList)
async def list_copilot_tickets(
    request: Request,
    page: int = Query(default=1, ge=1, le=500),
    per_page: int = Query(default=30, ge=1, le=100),
    updated_since: str | None = None,
    ticket_type: str | None = None,
    email: str | None = None,
    filter_name: str | None = None,
) -> CopilotTicketList:
    try:
        return await _service(request).list_tickets(
            page=page,
            per_page=per_page,
            updated_since=updated_since,
            ticket_type=ticket_type,
            email=email,
            filter_name=filter_name,
        )
    except (FreshserviceError, QuotaExceeded, FreshserviceRateLimited) as exc:
        raise _freshservice_http(exc) from exc


@router.get("/tickets/filter", response_model=CopilotTicketList)
async def filter_copilot_tickets(
    request: Request,
    query: str = Query(min_length=3, max_length=512),
    page: int = Query(default=1, ge=1, le=500),
) -> CopilotTicketList:
    try:
        return await _service(request).filter_tickets(query, page=page)
    except (FreshserviceError, QuotaExceeded, FreshserviceRateLimited) as exc:
        raise _freshservice_http(exc) from exc


@router.get("/tickets/{ticket_id}/context", response_model=CopilotContext)
async def ticket_context(ticket_id: int, request: Request) -> CopilotContext:
    try:
        return await _service(request).get_context(ticket_id)
    except (FreshserviceError, QuotaExceeded, FreshserviceRateLimited) as exc:
        raise _freshservice_http(exc) from exc


@router.post("/analyze", response_model=CopilotAnalysis)
async def analyze_ticket(payload: CopilotAnalysisRequest, request: Request) -> CopilotAnalysis:
    try:
        return await _service(request).analyze(payload.ticket_id)
    except (FreshserviceError, QuotaExceeded, FreshserviceRateLimited) as exc:
        raise _freshservice_http(exc) from exc


@router.post("/preview", response_model=CopilotPreview)
async def preview_ticket_update(payload: CopilotPreviewRequest, request: Request) -> CopilotPreview:
    try:
        return await _service(request).preview(payload)
    except (FreshserviceError, QuotaExceeded, FreshserviceRateLimited) as exc:
        raise _freshservice_http(exc) from exc


@router.post("/execute", response_model=GatewayResult)
async def execute_ticket_update(payload: CopilotExecuteRequest, request: Request) -> GatewayResult:
    try:
        preview = await _service(request).preview(payload)
        if not preview.changed_fields:
            raise HTTPException(status_code=400, detail="No ticket field has changed")
        command = ActionCommand(
            command_id=payload.command_id,
            actor_id=payload.actor_id,
            action="ticket.update",
            resource_id=payload.ticket_id,
            payload=preview.payload,
            risk=ActionRisk.MEDIUM,
            approved=payload.approved,
            reason=payload.reason,
            correlation_id=payload.command_id,
        )
        return await request.app.state.runtime.gateway.execute(command)
    except IdempotencyConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except HTTPException:
        raise
    except (FreshserviceError, QuotaExceeded, FreshserviceRateLimited) as exc:
        raise _freshservice_http(exc) from exc


@router.post("/visualize", response_model=VisualizationResponse)
async def create_visualization(payload: VisualizationRequest, request: Request) -> VisualizationResponse:
    try:
        return await _service(request).visualize(payload)
    except (FreshserviceError, QuotaExceeded, FreshserviceRateLimited) as exc:
        raise _freshservice_http(exc) from exc


@router.post("/voice/token", response_model=SpeechTokenResponse)
async def issue_speech_token(request: Request) -> SpeechTokenResponse:
    try:
        return await AzureSpeechService(request.app.state.runtime.settings).issue_token()
    except SpeechConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Azure Speech token error: {exc}") from exc
