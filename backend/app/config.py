from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://dash:dash@db:5432/dash_financeiro"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # JWT (required — no defaults for secrets)
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Google OAuth
    google_client_id: str = ""

    # Admin seed (required — no defaults for credentials)
    admin_email: str
    admin_password: str

    # SMTP (optional — falls back to console)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    email_verify_url: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
