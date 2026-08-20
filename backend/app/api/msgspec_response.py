"""Custom JSONResponse that encodes with msgspec.json.

Lets route handlers return msgspec.Struct, plain dicts, or anything
msgspec can serialize — no Pydantic involved.
"""

from __future__ import annotations

from fastapi.responses import JSONResponse
import msgspec.json


class MsgspecJSONResponse(JSONResponse):
    """JSONResponse that runs every payload through msgspec.json.encode."""

    media_type = "application/json"

    def render(self, content: object) -> bytes:
        return msgspec.json.encode(content)