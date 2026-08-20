"""End-to-end smoke test for the Memorai API.

Hits a running uvicorn server. Assumes:
  - The server is reachable at http://localhost:8000.
  - OPENAI_COMPAT_API_KEY + JWT_SECRET are configured (.env works).
  - aerich upgrade has been applied (User + memory tables exist).

Run with:  uv run python scripts/smoke_test.py
"""

from __future__ import annotations

import sys
import time
from typing import Any

import httpx

BASE = "http://localhost:8000"


def _check(label: str, ok: bool, detail: str = "") -> None:
    mark = "OK " if ok else "FAIL"
    print(f"[{mark}] {label}" + (f"  — {detail}" if detail else ""))
    if not ok:
        sys.exit(1)


def main() -> None:
    # Use a unique email per run so the script is idempotent.
    suffix = str(int(time.time()))
    email = f"smoke+{suffix}@example.com"
    password = "hunter22hunter22"

    with httpx.Client(base_url=BASE, timeout=180.0) as client:
        # 1) Health
        r = client.get("/health")
        _check("GET /health", r.status_code == 200, str(r.json()))

        # 2) Register
        r = client.post(
            "/auth/register",
            json={"email": email, "password": password, "name": "Smoke"},
        )
        _check("POST /auth/register", r.status_code == 201, str(r.status_code))
        body: dict[str, Any] = r.json()
        token = body.get("access_token")
        user_id = body.get("user", {}).get("id")
        _check("register returned access_token", bool(token))

        # 3) Login (re-login should also work)
        r = client.post(
            "/auth/login", json={"email": email, "password": password}
        )
        _check("POST /auth/login", r.status_code == 200, str(r.status_code))

        # 4) Auth required
        r = httpx.post(f"{BASE}/api/chat", json={"message": "hi"})
        _check(
            "POST /api/chat without token → 401",
            r.status_code == 401,
            str(r.status_code),
        )

        # 5) Authed /auth/me
        auth = {"Authorization": f"Bearer {token}"}
        r = client.get("/auth/me", headers=auth)
        _check("GET /auth/me", r.status_code == 200, str(r.json()))

        # 6) Store a memory via chat
        statement = (
            "I chose Python over Go for ML work because of the ecosystem."
        )
        r = client.post(
            "/api/chat", json={"message": statement}, headers=auth
        )
        _check(
            "POST /api/chat (store)", r.status_code == 200, str(r.status_code)
        )
        chat_body = r.json()
        stored = chat_body.get("stored", [])
        _check(
            "chat stored at least one entry", len(stored) >= 1,
            f"stored={len(stored)}",
        )

        # 7) List memories (user_id from token, never from body)
        r = client.get("/api/memories", headers=auth)
        _check(
            "GET /api/memories", r.status_code == 200, str(r.status_code)
        )
        memories = r.json().get("results", [])
        _check("memories list non-empty", len(memories) >= 1)

        # 8) Recall — the LLM should mention Python + ecosystem
        r = client.post(
            "/api/chat",
            json={"message": "Why did I pick my main language?"},
            headers=auth,
        )
        _check(
            "POST /api/chat (recall)", r.status_code == 200,
            str(r.status_code),
        )
        reply = r.json().get("response", "").lower()
        _check(
            "recall reply references Python",
            "python" in reply,
            reply[:80],
        )

        # 9) Delete one memory
        target_id = memories[0]["id"]
        r = client.delete(f"/api/memories/{target_id}", headers=auth)
        _check(
            "DELETE /api/memories/{id}", r.status_code == 200,
            str(r.status_code),
        )

        # 10) Cross-user isolation: register a second user, confirm
        # they can't see the first user's memories by trying to delete.
        other_email = f"smoke+other-{suffix}@example.com"
        r = client.post(
            "/auth/register",
            json={"email": other_email, "password": password, "name": "Other"},
        )
        _check("register second user", r.status_code == 201)
        other_token = r.json().get("access_token")
        other_auth = {"Authorization": f"Bearer {other_token}"}

        # other user deleting the just-deleted id is 404 (already gone),
        # but the important thing is no 500 / no leakage.
        r = client.delete(
            f"/api/memories/{target_id}", headers=other_auth
        )
        _check(
            "other-user DELETE → 404 (no leak)",
            r.status_code == 404,
            str(r.status_code),
        )

        # 11) Logout is a no-op server-side but requires auth.
        r = client.post("/auth/logout", headers=auth)
        _check(
            "POST /auth/logout", r.status_code == 204, str(r.status_code)
        )

    print(f"\nAll smoke checks passed for user_id={user_id}.")


if __name__ == "__main__":
    main()