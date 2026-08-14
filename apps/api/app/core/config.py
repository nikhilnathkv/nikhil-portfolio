"""Application configuration, loaded from environment variables.

Values come from the process environment (populated by docker-compose from the
root `.env` file, or by the shell when running the API directly).
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Runtime
    api_env: str = Field(default="development")
    api_log_level: str = Field(default="info")

    # Metadata
    project_name: str = Field(default="nikhil-portfolio-api")
    api_v1_prefix: str = Field(default="/api/v1")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://portfolio:portfolio@localhost:5432/portfolio",
    )

    # Security
    session_secret: str = Field(default="change-me-in-production")

    # CORS — comma-separated list of allowed origins.
    cors_origins: str = Field(default="http://localhost:3000")

    # Session / auth cookie
    session_cookie_name: str = Field(default="portfolio_session")
    session_secure: bool = Field(default=False)  # set True in production (HTTPS)
    session_samesite: str = Field(default="lax")
    session_max_age_days: int = Field(default=14)

    # Login brute-force protection
    login_max_attempts: int = Field(default=5)
    login_lockout_seconds: int = Field(default=300)

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def session_max_age_seconds(self) -> int:
        return self.session_max_age_days * 24 * 60 * 60

    @property
    def cookie_secure(self) -> bool:
        # Always secure in production, even if the env var wasn't flipped.
        return self.session_secure or self.is_production

    @property
    def is_production(self) -> bool:
        return self.api_env.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()


settings = get_settings()
