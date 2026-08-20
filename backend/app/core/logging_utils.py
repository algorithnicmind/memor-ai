"""Centralized logging configuration with switchable profiles."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class LoggingProfile:
    """A named logging configuration."""

    level: int
    fmt: str
    datefmt: str | None = None
    noisy_lib_level: int = logging.WARNING


PROFILES: dict[str, LoggingProfile] = {
    "quiet": LoggingProfile(
        level=logging.WARNING,
        fmt="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        noisy_lib_level=logging.ERROR,
    ),
    "standard": LoggingProfile(
        level=logging.INFO,
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        noisy_lib_level=logging.WARNING,
    ),
    "verbose": LoggingProfile(
        level=logging.DEBUG,
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        noisy_lib_level=logging.INFO,
    ),
    "debug": LoggingProfile(
        level=logging.DEBUG,
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        noisy_lib_level=logging.DEBUG,
    ),
}

PROFILE_ALIASES: dict[str, str] = {
    "quite": "quiet",
}


def setup_logging(
    profile: str | None = None,
    *,
    level: str | int | None = None,
    force: bool = True,
) -> str:
    """Configure process-wide logging from a profile (or env override).

    Env overrides:
      - LOG_PROFILE: quiet | standard | verbose | debug
      - LOG_LEVEL:   explicit level (e.g. DEBUG, INFO)
    """
    raw_profile = (
        profile if profile is not None else (os.getenv("LOG_PROFILE") or "standard")
    )
    normalized = raw_profile.strip().lower()
    selected_profile = PROFILE_ALIASES.get(normalized, normalized)
    selected = PROFILES.get(selected_profile, PROFILES["standard"])

    explicit_level = level if level is not None else os.getenv("LOG_LEVEL")
    resolved_level: int
    if isinstance(explicit_level, int):
        resolved_level = explicit_level
    elif isinstance(explicit_level, str) and explicit_level.strip():
        parsed = logging.getLevelName(explicit_level.strip().upper())
        resolved_level = parsed if isinstance(parsed, int) else selected.level
    else:
        resolved_level = selected.level

    logging.basicConfig(
        level=resolved_level,
        format=selected.fmt,
        datefmt=selected.datefmt,
        force=force,
    )

    for logger_name in ("httpx", "openai", "urllib3"):
        logging.getLogger(logger_name).setLevel(selected.noisy_lib_level)

    return selected_profile if selected_profile in PROFILES else "standard"
