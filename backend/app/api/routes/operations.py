from __future__ import annotations

from fastapi import APIRouter, Query, Request, Response

from app.observability.metrics import FRESHSERVICE_LOCAL_USAGE, metrics_payload

router = APIRouter(tags=["operations"])


@router.get("/operations/readiness")
async def readiness(request: Request) -> dict:
    runtime = request.app.state.runtime
    database_ok = await runtime.database.healthcheck()
    redis_ok = await runtime.quota.healthcheck()
    return {
        "status": "ready" if database_ok and redis_ok else "degraded",
        "database": database_ok,
        "redis": redis_ok,
        "freshservice_configured": bool(
            runtime.settings.freshservice_domain and runtime.settings.freshservice_api_key
        ),
        "freshservice_writes_enabled": runtime.settings.freshservice_write_enabled,
    }


@router.get("/operations/quota")
async def quota(request: Request) -> dict:
    runtime = request.app.state.runtime
    used = await runtime.quota.current_usage()
    FRESHSERVICE_LOCAL_USAGE.set(used)
    limit = runtime.settings.freshservice_rate_limit_per_minute
    reserve = round(limit * runtime.settings.freshservice_emergency_reserve_percent / 100)
    return {
        "window": "minute",
        "configured_limit": limit,
        "used_by_dclic": used,
        "standard_budget": max(1, limit - reserve),
        "emergency_reserve": reserve,
    }


@router.get("/operations/audit")
async def audit(request: Request, limit: int = Query(default=50, ge=1, le=200)) -> list[dict]:
    events = await request.app.state.runtime.audit.recent(limit=limit)
    return [
        {
            "id": event.id,
            "event_type": event.event_type,
            "command_id": event.command_id,
            "actor_id": event.actor_id,
            "correlation_id": event.correlation_id,
            "data": event.data,
            "created_at": event.created_at,
        }
        for event in events
    ]


@router.get("/metrics", include_in_schema=False)
async def prometheus_metrics() -> Response:
    payload, content_type = metrics_payload()
    return Response(content=payload, headers={"Content-Type": content_type})
