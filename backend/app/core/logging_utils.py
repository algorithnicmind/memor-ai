"""Centralized logging configuration with switchable profiles."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class LoggingProfile:
    """Represents a named logging profile."""

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
    """Configure process-wide logging using a profile.

    Env overrides:
    - LOG_PROFILE: quiet | standard | verbose | debug
    - LOG_LEVEL: explicit level (e.g., DEBUG, INFO, WARNING)
    """
    raw_profile = (
        profile if profile is not None else (os.getenv("LOG_PROFILE") or "standard")
    )
    normalized_profile = raw_profile.strip().lower()
    selected_profile = PROFILE_ALIASES.get(normalized_profile, normalized_profile)
    selected = PROFILES.get(selected_profile, PROFILES["standard"])

    explicit_level = level if level is not None else os.getenv("LOG_LEVEL")
    resolved_level: int
    if isinstance(explicit_level, int):
        resolved_level = explicit_level
    elif isinstance(explicit_level, str) and explicit_level.strip():
        resolved_level = logging.getLevelName(explicit_level.strip().upper())
        if isinstance(resolved_level, str):
            resolved_level = selected.level
    else:
        resolved_level = selected.level

    logging.basicConfig(
        level=resolved_level,
        format=selected.fmt,
        datefmt=selected.datefmt,
        force=force,
    )

    for logger_name in ("httpx", "openai", "google", "google.genai", "urllib3"):
        logging.getLogger(logger_name).setLevel(selected.noisy_lib_level)

    return selected_profile if selected_profile in PROFILES else "standard"
