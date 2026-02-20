import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..config import settings
from ..database import get_db
from ..models.user import User
from ..schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    TokenResponse,
    RefreshRequest,
    RefreshResponse,
)
from ..schemas.user import UserRead
from ..core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from ..core.activity_logger import log_activity
from ..services.email_service import send_verification_email
from ..services.google_auth import verify_google_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    }


@router.post("/register", status_code=201)
@limiter.limit("5/minute")
async def register(
    data: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email ja cadastrado")

    token = str(uuid.uuid4())
    user = User(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
        role="user",
        is_active=True,
        email_verified=False,
        is_approved=False,
        verification_token=token,
    )
    db.add(user)
    await log_activity(
        db, user.id, "register", "auth",
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    await send_verification_email(data.email, token)

    return {
        "message": "Cadastro realizado. Verifique seu email para ativar a conta."
    }


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        await log_activity(
            db, "unknown", "login_failed", "auth",
            details=f"email={data.email}",
            ip_address=request.client.host if request.client else None,
        )
        await db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciais invalidas")

    if not verify_password(data.password, user.hashed_password):
        await log_activity(
            db, user.id, "login_failed", "auth",
            ip_address=request.client.host if request.client else None,
        )
        await db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciais invalidas")

    if not user.email_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Email nao verificado")
    if not user.is_approved:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Conta pendente de aprovacao pelo administrador")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Conta desativada")

    await log_activity(
        db, user.id, "login", "auth",
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
        user=_user_dict(user),
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token, expected_type="refresh")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalido")

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario invalido")

    return RefreshResponse(
        access_token=create_access_token(user.id, user.role),
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(
    data: GoogleAuthRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    if not settings.google_client_id:
        raise HTTPException(
            status.HTTP_501_NOT_IMPLEMENTED,
            "Google OAuth nao configurado",
        )

    try:
        google_info = await verify_google_token(data.credential)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token Google invalido")

    google_id = google_info["sub"]
    email = google_info["email"]
    name = google_info.get("name", "")

    # Try to find user by google_id first, then by email
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Link existing user to Google
            user.google_id = google_id
        else:
            # Create new user via Google
            user = User(
                email=email,
                name=name,
                google_id=google_id,
                role="user",
                is_active=True,
                email_verified=True,  # Google already verified email
                is_approved=False,  # Still needs admin approval
            )
            db.add(user)

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Conta desativada")
    if not user.is_approved:
        await log_activity(
            db, user.id, "google_auth_pending", "auth",
            ip_address=request.client.host if request.client else None,
        )
        await db.commit()
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Conta pendente de aprovacao pelo administrador",
        )

    await log_activity(
        db, user.id, "google_auth", "auth",
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
        user=_user_dict(user),
    )


@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token invalido")

    user.email_verified = True
    user.verification_token = None
    await db.commit()

    return {"message": "Email verificado com sucesso. Aguarde aprovacao do administrador."}


@router.get("/me", response_model=UserRead)
async def get_me(user: User = Depends(get_current_user)):
    return user
