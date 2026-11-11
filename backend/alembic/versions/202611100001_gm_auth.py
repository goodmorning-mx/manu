"""Install gm-auth and the Manu organization."""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import func, insert, select

revision: str = "202611100001"
down_revision: str | None = "202607150001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    from app.config import get_settings
    from gm_auth.models import metadata as auth_metadata, organizations

    bind = op.get_bind()
    auth_metadata.create_all(bind, checkfirst=True)
    settings = get_settings()
    organization = bind.execute(
        select(organizations.c.id).where(organizations.c.id == settings.organization_id)
    ).first()
    if organization is None:
        bind.execute(
            insert(organizations).values(
                id=settings.organization_id,
                slug=settings.organization_id,
                name="Manu",
                created_at=func.now(),
            )
        )


def downgrade() -> None:
    # Auth tables and user data are retained on application rollback.
    pass
