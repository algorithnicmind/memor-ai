"""JWT access tokens — HS256, single-issuer.

Caller provides the secret and TTL so the functions stay config-free.
`create_access_token` returns `(token, ttl_minutes)` so callers can
surface `expires_in` in the response.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt


class InvalidTokenError(Exception):
    """Raised when a token cannot be decoded or has expired."""


def create_access_token(
    user_id: str, ttl_minutes: int, secret: str
) -> tuple[str, int]:
    """Sign an HS256 access token. Returns (token, ttl_minutes)."""
    if not secret:
        raise ValueError("JWT secret is required")
    now = datetime.now(UTC)
    exp = now + timedelta(minutes=ttl_minutes)
    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token, ttl_minutes


def decode_token(token: str, secret: str) -> str:
    """Verify + decode an HS256 token. Returns the user id (`sub`).

    Raises `InvalidTokenError` on any decode/verify failure so the
    caller can convert to a 401 without leaking the exact reason.
    """
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.PyJWTError as err:
        raise InvalidTokenError(str(err)) from err
    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise InvalidTokenError("token missing subject")
    return user_id