from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.tickets import router as tickets_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="D-Clic Intelligence API",
    version="0.1.0",
    description="AI ServiceOps Command Center and governed Freshservice control plane.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(tickets_router, prefix=settings.api_prefix)


@app.get("/")
async def root() -> dict:
    return {
        "name": "D-Clic Intelligence",
        "status": "running",
        "docs": "/docs",
        "api": settings.api_prefix,
    }
