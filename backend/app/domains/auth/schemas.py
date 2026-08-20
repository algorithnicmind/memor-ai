"""Auth DTOs — msgspec.Struct, no pydantic anywhere in our code."""

from __future__ import annotations

import msgspec


class RegisterRequest(msgspec.Struct, kw_only=True):
    email: str
    password: str
    name: str | None = None


class LoginRequest(msgspec.Struct, kw_only=True):
    email: str
    password: str


class UserOut(msgspec.Struct, kw_only=True):
    id: str
    email: str
    name: str | None = None
    created_at: str | None = None


class TokenResponse(msgspec.Struct, kw_only=True):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut