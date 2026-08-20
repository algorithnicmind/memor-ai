"""Auth routes — register, login, me, logout.

All handlers are async and return msgspec DTOs. The 4 routes are split between anonymous
(register, login) and protected (me, logout, both gated by `current_user`).
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import current_user
from app.domains.auth.models import User
from app.domains.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.domains.auth.service import (
    AuthService,
    BadCredentialsError,
    EmailTakenError,
    InvalidInputError,
    UserNotFoundError,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
async def register(req: RegisterRequest) -> TokenResponse:
    try:
        return await AuthService().register(req)
    except EmailTakenError as err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(err)
        )
    except InvalidInputError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)
        )


@router.post("/login")
async def login(req: LoginRequest) -> TokenResponse:
    try:
        return await AuthService().login(req)
    except BadCredentialsError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(err),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me")
async def me(
    user: Annotated[User, Depends(current_user)],
) -> UserOut:
    return _user_out(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    user: Annotated[User, Depends(current_user)],
) -> None:
    # No server-side session; logout is purely a client-side token drop.
    # We still require a valid token so we can record *which* user logged out
    # if we later want to write an audit row.
    return None