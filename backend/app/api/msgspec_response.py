"""Custom JSONResponse that encodes with msgspec.json.

Lets route handlers return msgspec.Struct, plain dicts, or anything
msgspec can serialize — no Pydantic involved.

Why `to_jsonable` exists:
  FastAPI runs `jsonable_encoder` on a route's return value BEFORE
  handing it to the response class. `jsonable_encoder` doesn't
  understand `msgspec.Struct` (it tries `dict(obj)`, then `vars(obj)`,
  then gives up). Handlers must return something jsonable_encoder can
  swallow — i.e. a plain dict. `to_jsonable(struct)` does the
  conversion in one call so handlers stay one-liner-clean.
"""

from __future__ import annotations

import msgspec
import msgspec.json
from fastapi.responses import JSONResponse


def to_jsonable(value: object) -> object:
    """Convert msgspec.Struct (or a list of them) to JSON-able dicts.

    Pass-through for anything that isn't a msgspec.Struct — so handlers
    can return `dict`, `list`, `None`, or `msgspec.Struct` and the
    call site stays uniform.
    """
    if isinstance(value, msgspec.Struct):
        return msgspec.to_builtins(value)
    if isinstance(value, list) and value and isinstance(value[0], msgspec.Struct):
        return [msgspec.to_builtins(item) for item in value]
    return value


class MsgspecJSONResponse(JSONResponse):
    """JSONResponse that runs every payload through msgspec.json.encode."""

    media_type = "application/json"

    def render(self, content: object) -> bytes:
        return msgspec.json.encode(content)