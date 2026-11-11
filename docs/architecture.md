# Manu architecture

## MVP flow

- The React/Vite app uses `@goodmorning/gm-auth` for email/password login.
- FastAPI mounts `gm-auth` under `/auth`; JWT signing uses the backend-only
  `AUTH_SECRET` setting.
- The initial Alembic migration installs the module's SQLAlchemy tables and
  creates the `manu` organization. Existing auth tables and user data are kept
  during rollback.
- `GET /reviews?published=false|true` requests one page of reviews from Judge.me.
- `POST /reviews/{id}/publish` updates a Judge.me review to curated/visible.
- Both review endpoints require an authenticated `admin` role. The UI only
  displays reviewer name and review/product details, not reviewer email.
- Manu does not duplicate review text or customer details in its PostgreSQL
  database. Judge.me remains the source of truth.

The dashboard fetches up to 50 reviews per status and publishes one review per
action. Pagination, bulk moderation, webhooks, Shopify admin OAuth, user
management, and review editing are outside the first MVP.

## Configuration

Backend runtime only:

- `DATABASE_URL`: Factory-managed private PostgreSQL connection.
- `AUTH_SECRET`: generated, persistent JWT signing secret (32+ characters).
- `JUDGEME_SHOP_DOMAIN`: Shopify domain ending in `myshopify.com`.
- `JUDGEME_API_TOKEN`: Judge.me private API token with read/write access.

Do not expose `AUTH_SECRET` or `JUDGEME_API_TOKEN` as frontend build variables.
The initial administrator is created once by `python -m app.bootstrap_admin`
using `MANU_ADMIN_EMAIL`, `MANU_ADMIN_PASSWORD`, and optional `MANU_ADMIN_NAME`
in that process's environment. The script stops if any user already exists.
