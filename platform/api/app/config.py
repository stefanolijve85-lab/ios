from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = Field("development", alias="ENV")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    secret_key: str = Field(..., alias="SECRET_KEY")
    jwt_alg: str = Field("HS256", alias="JWT_ALG")
    jwt_access_ttl_sec: int = Field(900, alias="JWT_ACCESS_TTL_SEC")
    jwt_refresh_ttl_sec: int = Field(2_592_000, alias="JWT_REFRESH_TTL_SEC")

    database_url: str = Field(..., alias="DATABASE_URL")
    redis_url: str = Field("redis://redis:6379/0", alias="REDIS_URL")

    s3_endpoint: str | None = Field(None, alias="S3_ENDPOINT")
    s3_bucket: str = Field("trustline-dev", alias="S3_BUCKET")
    s3_region: str = Field("eu-west-1", alias="S3_REGION")
    s3_access_key: str | None = Field(None, alias="S3_ACCESS_KEY")
    s3_secret_key: str | None = Field(None, alias="S3_SECRET_KEY")

    ocr_provider: str = Field("mock", alias="OCR_PROVIDER")
    azure_docintel_endpoint: str | None = Field(None, alias="AZURE_DOCINTEL_ENDPOINT")
    azure_docintel_key: str | None = Field(None, alias="AZURE_DOCINTEL_KEY")

    llm_provider: str = Field("mock", alias="LLM_PROVIDER")
    anthropic_api_key: str | None = Field(None, alias="ANTHROPIC_API_KEY")
    openai_api_key: str | None = Field(None, alias="OPENAI_API_KEY")

    vies_base: str = Field(
        "https://ec.europa.eu/taxation_customs/vies/services/checkVatService",
        alias="VIES_BASE",
    )

    cors_origins: str = Field("http://localhost:3000", alias="CORS_ORIGINS")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()  # type: ignore[call-arg]
