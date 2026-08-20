"""FastAPI dependencies — `current_user` + `get_memory`.

`current_user` is the auth boundary: it pulls a Bearer token off the
request, decodes it, and resolves the User row. Routes that gate
data behind authentication depend on it; the user_id the route uses
MUST come from `current_user.id`, never from the request body
(prevents an attacker from forging a user_id to read someone else's
memories).

`get_memory` returns the lifespan-managed Memory singleton from
`app.state.memory`.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import get_config_from_env
from app.domains.auth.models import User
from app.domains.memory.service import Memory
from app.infrastructure.auth.jwt import InvalidTokenError, decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


async def current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    secret = get_config_from_env().auth.jwt_secret
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT secret is not configured",
        )
    try:
        user_id = decode_token(token, secret)
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await User.get_or_none(id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="user no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_memory(request: Request) -> Memory:
    """Return the Memory singleton built in app.state at startup."""
    memory: Memory | None = getattr(request.app.state, "memory", None)
    if memory is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="memory engine not initialised",
        )
    return memory