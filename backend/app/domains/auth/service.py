"""AuthService — register / login / me.

Email is normalised (strip + lower). Passwords >= 8 chars. Duplicate
email → 409-shaped error. Wrong password → generic "invalid email
or password" so we don't leak which side is wrong.
"""

from __future__ import annotations

import uuid

from email_validator import EmailNotValidError, validate_email

from app.core.config import AppConfig, get_config_from_env
from app.domains.auth.models import User
from app.domains.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.infrastructure.auth.jwt import create_access_token
from app.infrastructure.auth.password import hash_password, verify_password


class AuthError(Exception):
    """Base auth error — subclasses carry semantics the route layer maps to HTTP."""


class EmailTakenError(AuthError):
    """Registration: the email is already in use (409)."""


class BadCredentialsError(AuthError):
    """Login: email or password is wrong (401). Same message either way."""


class InvalidInputError(AuthError):
    """Registration: input failed format/length checks (400)."""


class UserNotFoundError(AuthError):
    """Me: the JWT points at a user that no longer exists (401)."""


def _user_to_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


class AuthService:
    def __init__(self, config: AppConfig | None = None) -> None:
        self.config = config or get_config_from_env()

    async def register(self, req: RegisterRequest) -> TokenResponse:
        email = self._normalise_email(req.email)
        self._validate_password(req.password)
        existing = await User.get_or_none(email=email)
        if existing is not None:
            raise EmailTakenError("email already registered")
        user = await User.create(
            id=str(uuid.uuid4()),
            email=email,
            hashed_password=hash_password(req.password),
            name=(req.name or "").strip() or None,
        )
        return self._issue_token(user)

    async def login(self, req: LoginRequest) -> TokenResponse:
        email = self._normalise_email(req.email)
        user = await User.get_or_none(email=email)
        if user is None or not verify_password(req.password, user.hashed_password):
            raise BadCredentialsError("invalid email or password")
        return self._issue_token(user)

    async def me(self, user_id: str) -> UserOut:
        user = await User.get_or_none(id=user_id)
        if user is None:
            raise UserNotFoundError("user no longer exists")
        return _user_to_out(user)

    # ---- internals -------------------------------------------------------

    def _normalise_email(self, email: str) -> str:
        try:
            return validate_email(email, check_deliverability=False).normalized.lower()
        except EmailNotValidError as err:
            raise InvalidInputError(f"invalid email: {err}") from err

    @staticmethod
    def _validate_password(password: str) -> None:
        if len(password) < 8:
            raise InvalidInputError("password must be at least 8 characters")

    def _issue_token(self, user: User) -> TokenResponse:
        ttl = self.config.auth.jwt_ttl_minutes
        secret = self.config.auth.jwt_secret
        if not secret:
            raise RuntimeError("JWT_SECRET is not configured")
        token, _ = create_access_token(user.id, ttl, secret)
        return TokenResponse(
            access_token=token,
            expires_in=ttl * 60,
            user=_user_to_out(user),
        )