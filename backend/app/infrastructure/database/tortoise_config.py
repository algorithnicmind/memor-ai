"""Tortoise ORM configuration.

Single source of truth for connection + app registration. aerich reads
this via the [tool.aerich] block in pyproject.toml; the app reads it
via Tortoise.init() in the lifespan handler.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


def _db_url() -> str:
    """Resolve the SQLite URL, ensuring the parent dir exists."""
    url = os.getenv("DATABASE_URL", "sqlite://backend/data/memorai.db")
    if url.startswith("sqlite:///"):
        path = url.removeprefix("sqlite:///")
    elif url.startswith("sqlite://"):
        path = url.removeprefix("sqlite://")
    else:
        return url
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    return url


TORTOISE_ORM = {
    "connections": {"default": _db_url()},
    "apps": {
        "models": {
            "models": [
                "app.infrastructure.database.models",
                "app.domains.auth.models",
                "aerich.models",
            ],
            "default_connection": "default",
        },
    },
}
