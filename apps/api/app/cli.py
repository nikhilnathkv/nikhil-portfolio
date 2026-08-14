"""Small management CLI.

Usage:
    uv run python -m app.cli create-admin --email admin@example.com --password '...'
"""

from __future__ import annotations

import argparse
import asyncio

from app.core.bootstrap import create_admin_user
from app.core.database import SessionLocal


async def _create_admin(email: str, password: str) -> None:
    async with SessionLocal() as session:
        user = await create_admin_user(session, email=email, password=password)
        print(f"Created admin user: {user.email} ({user.id})")


def main() -> None:
    parser = argparse.ArgumentParser(prog="app.cli")
    sub = parser.add_subparsers(dest="command", required=True)

    admin = sub.add_parser("create-admin", help="Create the initial admin user")
    admin.add_argument("--email", required=True)
    admin.add_argument("--password", required=True)

    args = parser.parse_args()
    if args.command == "create-admin":
        asyncio.run(_create_admin(args.email, args.password))


if __name__ == "__main__":
    main()
