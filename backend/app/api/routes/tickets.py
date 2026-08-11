from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.domain.models import ActionCommand, GatewayResult, PolicyResult, TicketIntelligence
from app.freshservice.client import FreshserviceError
from app.freshservice.gateway import FreshserviceGateway
from app.policy.engine import PolicyEngine
from app.services.ticket_intelligence import TicketIntelligenceService

router = APIRouter(tags=["intelligence"])


@router.get("/tickets/{ticket_id}/intelligence", response_model=TicketIntelligence)
async def ticket_intelligence(
    ticket_id: int,
    settings: Settings = Depends(get_settings),
) -> TicketIntelligence:
    try:
        gateway = FreshserviceGateway(settings)
        ticket = await gateway.get_ticket(ticket_id)
        return TicketIntelligenceService().analyze(ticket)
    except FreshserviceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/actions/preview", response_model=PolicyResult)
async def preview_action(command: ActionCommand) -> PolicyResult:
    return PolicyEngine().evaluate(command)


@router.post("/actions/execute", response_model=GatewayResult)
async def execute_action(
    command: ActionCommand,
    settings: Settings = Depends(get_settings),
) -> GatewayResult:
    try:
        return await FreshserviceGateway(settings).execute(command)
    except FreshserviceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
