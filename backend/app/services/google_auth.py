from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from ..config import settings


async def verify_google_token(credential: str) -> dict:
    """Validate a Google ID token and return user info.

    Returns dict with keys: sub, email, name, picture (all strings).
    Raises ValueError on invalid token.
    """
    id_info = id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        settings.google_client_id,
    )
    return {
        "sub": id_info["sub"],
        "email": id_info["email"],
        "name": id_info.get("name", ""),
        "picture": id_info.get("picture", ""),
    }
