from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://nexfin:nexfin@localhost:5432/nexfin"
    cors_origins: str = "http://localhost:5173"

    auth_token_url: str = ""
    auth_client_id: str = ""
    auth_client_secret: str = ""

    core_api_base_url: str = ""

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
