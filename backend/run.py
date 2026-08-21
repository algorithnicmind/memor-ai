#!/usr/bin/env python
"""Smart runner for Memorai Backend with automatic port collision handling.

Usage:
    python run.py [--port 8000] [--host 0.0.0.0] [--reload]
"""

from __future__ import annotations

import argparse
import os
import socket
import sys
import uvicorn


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Check whether a local TCP port is already in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def find_available_port(preferred_port: int, fallback_ports: list[int] | None = None) -> int:
    """Return the preferred port if free, or the first free fallback port."""
    if fallback_ports is None:
        fallback_ports = [8005, 8000, 8001, 8080, 8888]

    if not is_port_in_use(preferred_port):
        return preferred_port

    print(f"[!] Port {preferred_port} is currently in use by another application.")
    for port in fallback_ports:
        if not is_port_in_use(port):
            print(f"[+] Found available port: {port}")
            return port

    # Dynamically find any free ephemeral port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        ephemeral = s.getsockname()[1]
        print(f"[+] Found dynamically allocated free port: {ephemeral}")
        return ephemeral


def main():
    parser = argparse.ArgumentParser(description="Memorai Backend Runner")
    parser.add_argument("--port", type=int, default=8005, help="Preferred port (default: 8005)")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host binding (default: 127.0.0.1)")
    parser.add_argument("--reload", action="store_true", default=True, help="Enable auto-reload")
    parser.add_argument("--auto-port", action="store_true", default=True, help="Auto-switch to available port if occupied")

    args = parser.parse_args()

    active_port = args.port
    if args.auto_port and is_port_in_use(active_port, args.host):
        active_port = find_available_port(args.port)

    print("=" * 60)
    print(" [Memorai] Starting Backend API")
    print(f" Host: {args.host}")
    print(f" Active Port: {active_port}")
    print(f" Swagger Docs: http://localhost:{active_port}/docs")
    print(f" Health Check: http://localhost:{active_port}/health")
    print("=" * 60)

    # Change cwd to backend directory if running from repo root
    current_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(current_dir)
    sys.path.insert(0, current_dir)

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=active_port,
        reload=args.reload,
    )


if __name__ == "__main__":
    main()
