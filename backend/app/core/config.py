from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    app_env: str = "development"
    log_level: str = "INFO"
    api_prefix: str = "/api/v1"

    freshservice_domain: str = ""
    freshservice_api_key: str = ""
    freshservice_write_enabled: bool = False
    freshservice_timeout_seconds: float = 15.0
    freshservice_max_concurrency: int = Field(default=5, ge=1, le=100)
    freshservice_rate_limit_per_minute: int = Field(default=100, ge=10, le=10000)
    freshservice_emergency_reserve_percent: int = Field(default=20, ge=0, le=90)
    freshservice_max_retries: int = Field(default=2, ge=0, le=5)

    database_url: str = "postgresql+psycopg://dclic:dclic@localhost:5432/dclic"
    redis_url: str = "redis://localhost:6379/0"
    auto_create_database_tables: bool = True

    @property
    def freshservice_base_url(self) -> str:
        domain = self.freshservice_domain.strip().removeprefix("https://").removeprefix("http://")
        return f"https://{domain}/api/v2" if domain else ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
