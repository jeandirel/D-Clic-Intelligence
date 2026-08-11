from fastapi import APIRouter, HTTPException, Request

from app.data.repositories import IdempotencyConflict
from app.domain.models import ActionCommand, GatewayResult, PolicyResult, TicketIntelligence
from app.freshservice.client import FreshserviceError, FreshserviceRateLimited
from app.freshservice.quota import QuotaExceeded
from app.policy.engine import PolicyEngine
from app.services.ticket_intelligence import TicketIntelligenceService

router = APIRouter(tags=["intelligence"])


def _rate_limit_http(exc: QuotaExceeded | FreshserviceRateLimited) -> HTTPException:
    return HTTPException(
        status_code=429,
        detail=str(exc),
        headers={"Retry-After": str(exc.retry_after_seconds)},
    )


@router.get("/tickets/{ticket_id}/intelligence", response_model=TicketIntelligence)
async def ticket_intelligence(ticket_id: int, request: Request) -> TicketIntelligence:
    try:
        ticket = await request.app.state.runtime.gateway.get_ticket(ticket_id)
        return TicketIntelligenceService().analyze(ticket)
    except (QuotaExceeded, FreshserviceRateLimited) as exc:
        raise _rate_limit_http(exc) from exc
    except FreshserviceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/actions/preview", response_model=PolicyResult)
async def preview_action(command: ActionCommand) -> PolicyResult:
    return PolicyEngine().evaluate(command)


@router.post("/actions/execute", response_model=GatewayResult)
async def execute_action(command: ActionCommand, request: Request) -> GatewayResult:
    try:
        return await request.app.state.runtime.gateway.execute(command)
    except IdempotencyConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except (QuotaExceeded, FreshserviceRateLimited) as exc:
        raise _rate_limit_http(exc) from exc
    except FreshserviceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
