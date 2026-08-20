"""User ORM model — Tortoise + SQLite.

PK is a string UUID hex so we don't need to deal with UUIDField's
storage quirks across SQLite versions. `email` is unique-indexed.
"""

from __future__ import annotations

from tortoise import fields
from tortoise.models import Model


class User(Model):
    id = fields.CharField(pk=True, max_length=64)
    email = fields.CharField(max_length=255, unique=True)
    hashed_password = fields.CharField(max_length=255)
    name = fields.CharField(max_length=128, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "users"