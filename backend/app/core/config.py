from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    app_env: str = "development"
    log_level: str = "INFO"
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000"

    # Freshservice
    freshservice_domain: str = ""
    freshservice_api_key: str = ""
    freshservice_write_enabled: bool = False
    freshservice_timeout_seconds: float = 15.0
    freshservice_max_concurrency: int = Field(default=5, ge=1, le=100)
    freshservice_rate_limit_per_minute: int = Field(default=100, ge=10, le=10000)
    freshservice_emergency_reserve_percent: int = Field(default=20, ge=0, le=90)
    freshservice_max_retries: int = Field(default=2, ge=0, le=5)
    freshservice_workspace_id: int | None = None
    copilot_ticket_page_size: int = Field(default=30, ge=1, le=100)
    copilot_visual_max_pages: int = Field(default=3, ge=1, le=10)

    # LLM intelligence. Kept server-side only.
    openai_api_key: str = ""
    openai_model: str = "gpt-5-mini"
    openai_timeout_seconds: float = 45.0

    # Azure AI Speech. The subscription key never goes to the browser;
    # the backend exchanges it for a short-lived bearer token.
    azure_speech_key: str = ""
    azure_speech_region: str = ""
    azure_speech_voice: str = "fr-FR-DeniseNeural"
    azure_speech_language: str = "fr-FR"

    # Data
    database_url: str = "postgresql+psycopg://dclic:dclic@localhost:5432/dclic"
    redis_url: str = "redis://localhost:6379/0"
    auto_create_database_tables: bool = True

    @property
    def freshservice_base_url(self) -> str:
        domain = self.freshservice_domain.strip().removeprefix("https://").removeprefix("http://")
        return f"https://{domain}/api/v2" if domain else ""

    @property
    def parsed_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
