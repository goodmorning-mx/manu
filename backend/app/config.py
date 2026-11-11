from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = Field(default="Manu Reviews API", alias="APP_NAME")
    app_env: str = Field(default="local", alias="APP_ENV")
    source_commit: str = Field(default="unknown", alias="SOURCE_COMMIT")
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")
    database_url: str = Field(
        default="postgresql+psycopg://goodmorning:goodmorning_local_password@localhost:5432/goodmorning_mvp",
        alias="DATABASE_URL",
    )
    auth_secret: str = Field(default="local-manu-auth-secret-change-me-2026", alias="AUTH_SECRET")
    organization_id: str = Field(default="manu", alias="ORGANIZATION_ID")
    judgeme_shop_domain: str = Field(default="", alias="JUDGEME_SHOP_DOMAIN")
    judgeme_api_token: str = Field(default="", alias="JUDGEME_API_TOKEN")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def validate_runtime_secrets(self) -> "Settings":
        if self.app_env != "local" and (self.auth_secret.startswith("local-") or len(self.auth_secret) < 32):
            raise ValueError("AUTH_SECRET must be a generated secret of at least 32 characters outside local development.")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
