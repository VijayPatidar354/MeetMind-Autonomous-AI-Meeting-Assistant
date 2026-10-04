import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Keys
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    
    # Models
    WHISPER_MODEL: str = "whisper-large-v3"
    EMBEDDING_MODEL: str = "models/gemini-embedding-2"
    CHAT_MODEL: str = "gemini-flash-latest"
    
    # Directory paths relative to the project root (Agentic)
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    RECORDINGS_DIR: str = os.path.join(DATA_DIR, "recordings")
    TRANSCRIPTS_DIR: str = os.path.join(DATA_DIR, "transcripts")
    CHROMADB_DIR: str = os.path.join(DATA_DIR, "chroma_db")
    GOOGLE_PROFILE_DIR: str = os.path.join(BASE_DIR, "ai-service", "google_profile")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Instantiate global settings
settings = Settings()

# Ensure data directories exist
os.makedirs(settings.RECORDINGS_DIR, exist_ok=True)
os.makedirs(settings.TRANSCRIPTS_DIR, exist_ok=True)
os.makedirs(settings.CHROMADB_DIR, exist_ok=True)
os.makedirs(settings.GOOGLE_PROFILE_DIR, exist_ok=True)
