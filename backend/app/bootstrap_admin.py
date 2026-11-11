"""Create the first Manu administrator from runtime-only environment values."""

from __future__ import annotations

import os

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from app.auth import auth_service
from app.config import get_settings
from gm_auth.models import organizations, users


def main() -> None:
    email = os.environ.get("MANU_ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("MANU_ADMIN_PASSWORD", "")
    name = os.environ.get("MANU_ADMIN_NAME", "Manu Administrator").strip() or "Manu Administrator"
    if not email or len(password) < 12:
        raise SystemExit("Set MANU_ADMIN_EMAIL and a MANU_ADMIN_PASSWORD of at least 12 characters.")

    settings = get_settings()
    with auth_service.engine.begin() as connection:
        connection.execute(
            insert(organizations).values(
                id=settings.organization_id,
                slug=settings.organization_id,
                name="Manu",
                created_at=func.now(),
            ).on_conflict_do_nothing(index_elements=[organizations.c.id])
        )
        count = connection.execute(select(func.count()).select_from(users)).scalar_one()
    if count:
        raise SystemExit("An account already exists. Initial administrator creation is disabled.")

    auth_service.create_user(
        email=email,
        name=name,
        password=password,
        organization_id=settings.organization_id,
        roles={"admin"},
        permissions={"reviews.read", "reviews.publish"},
    )
    print(f"Created initial Manu administrator: {email}")


if __name__ == "__main__":
    main()
