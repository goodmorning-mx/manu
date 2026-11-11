from gm_auth import AuthService, AuthSettings

from app.config import get_settings
from app.database import create_database_engine

settings = get_settings()
auth_service = AuthService(create_database_engine(), AuthSettings(settings.auth_secret))
