"""bcrypt password hashing.

Direct `bcrypt` calls instead of passlib. passlib's bcrypt backend runs
a wrap-bug detection routine on first use that triggers bcrypt 4.x's
"password cannot be longer than 72 bytes" guard. Using bcrypt directly
sidesteps that and keeps the surface tiny.

We still respect `BCRYPT_ROUNDS` from config so operators can tune
cost at deploy time.
"""

from __future__ import annotations

import bcrypt

from app.core.config import get_config_from_env


def _rounds() -> int:
    return get_config_from_env().auth.bcrypt_rounds


def hash_password(plain: str) -> str:
    """Hash a plain-text password with bcrypt at the configured cost."""
    rounds = _rounds()
    salt = bcrypt.gensalt(rounds=rounds)
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time verification of a plain password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("ascii"))
    except ValueError:
        # Malformed hash — treat as a mismatch rather than a 500.
        return False
