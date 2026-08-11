from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["system"])


@router.get("/health")
async def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "service": "dclic-intelligence-api",
        "environment": settings.app_env,
        "freshservice_configured": bool(settings.freshservice_domain and settings.freshservice_api_key),
        "freshservice_write_enabled": settings.freshservice_write_enabled,
    }
