"""Tortoise ORM configuration.

Single source of truth for connection + app registration. The lifespan
handler in app/main.py calls Tortoise.init(config=TORTOISE_ORM) and
then Tortoise.generate_schemas() — no aerich, no migration files.

DB path resolution: relative paths in `DATABASE_URL` are anchored to
the `backend/` folder (this file's parent's parent's parent), not the
cwd. That keeps the layout predictable regardless of where the server
is launched from.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# backend/app/infrastructure/database/tortoise_config.py → backend/
_BACKEND_DIR = Path(__file__).resolve().parents[2]


def _db_url() -> str:
    """Resolve the SQLite URL, ensuring the parent dir exists.

    If `DATABASE_URL` is relative, anchor it to the backend folder.
    Absolute paths pass through unchanged.
    """
    url = os.getenv("DATABASE_URL", "sqlite://data/memorai.db")
    if url.startswith("sqlite:///"):
        path = url.removeprefix("sqlite:///")
    elif url.startswith("sqlite://"):
        path = url.removeprefix("sqlite://")
    else:
        return url
    db_path = Path(path)
    if not db_path.is_absolute():
        db_path = _BACKEND_DIR / db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite://{db_path.as_posix()}"


TORTOISE_ORM = {
    "connections": {"default": _db_url()},
    "apps": {
        "models": {
            "models": [
                "app.infrastructure.database.models",
                "app.domains.auth.models",
            ],
            "default_connection": "default",
        },
    },
}
