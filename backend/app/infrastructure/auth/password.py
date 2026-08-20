"""bcrypt password hashing via passlib.

Single CryptContext lives in the module — every call funnels through
the same context, so rounds + scheme are consistent.
"""

from __future__ import annotations

from passlib.context import CryptContext

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Hash a plain-text password."""
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time verification of a plain password against a bcrypt hash."""
    return _pwd.verify(plain, hashed)