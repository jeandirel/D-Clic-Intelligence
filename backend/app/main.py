from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.operations import router as operations_router
from app.api.routes.tickets import router as tickets_router
from app.core.config import get_settings
from app.core.runtime import AppRuntime

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    runtime = AppRuntime(settings)
    app.state.runtime = runtime
    await runtime.startup()
    try:
        yield
    finally:
        await runtime.shutdown()


app = FastAPI(
    title="D-Clic Intelligence API",
    version="0.2.0",
    description="AI ServiceOps Command Center and governed Freshservice control plane.",
    lifespan=lifespan,
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
app.include_router(operations_router, prefix=settings.api_prefix)


@app.get("/")
async def root() -> dict:
    return {
        "name": "D-Clic Intelligence",
        "status": "running",
        "version": "0.2.0",
        "docs": "/docs",
        "api": settings.api_prefix,
    }
