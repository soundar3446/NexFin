from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://nexfin:nexfin@localhost:5432/nexfin"
    cors_origins: str = "http://localhost:5173"

    auth_token_url: str = ""
    auth_client_id: str = ""
    auth_client_secret: str = ""

    core_api_base_url: str = ""

    hf_api_token: str = ""
    hf_model: str = "Qwen/Qwen2.5-7B-Instruct"
    hf_router_url: str = "https://router.huggingface.co/v1/chat/completions"

    # OpenAI-compatible chat API (OpenAI, Groq, Gemini OpenAI compat, local Ollama, etc.)
    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4o-mini"

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
