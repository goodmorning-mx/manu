# Manu

Manu is a private review moderation panel for a Shopify store using Judge.me.
The React dashboard separates pending reviews from published reviews and lets
an administrator publish reviews one at a time. Authentication is provided by
the shared `gm-auth` module; Judge.me private credentials stay in the backend.

## Local development

Copy `.env.example` to `.env`, set Judge.me's private API token and your
`*.myshopify.com` domain, then start the app with Docker Compose:

```bash
cp .env.example .env
docker compose up --build
```

Open <http://localhost:8080>. Create the first administrator once, before any
other account exists. Export `MANU_ADMIN_EMAIL`, `MANU_ADMIN_PASSWORD` (at
least 12 characters), and optionally `MANU_ADMIN_NAME` in your shell first:

```bash
docker compose exec -e MANU_ADMIN_EMAIL -e MANU_ADMIN_PASSWORD -e MANU_ADMIN_NAME backend python -m app.bootstrap_admin
```

The command creates the `manu` organization and one admin membership. It
refuses to create another account once any user exists. Do not put the initial
password into Git, `.env.example`, workflow inputs, or logs.

## Runtime configuration

The backend requires `DATABASE_URL`, a unique `AUTH_SECRET` of at least 32
characters, `JUDGEME_SHOP_DOMAIN`, and `JUDGEME_API_TOKEN`. Keep Judge.me's
private token and the JWT secret in the backend runtime secret store only.
Never send either value to the React frontend.

The panel reads pending and published reviews from Judge.me. Publishing a
pending review updates its Judge.me status; no review body or customer email is
copied to Manu's database. The MVP fetches the first page (50 records) of each
status and publishes reviews individually.

## Checks

```bash
cd frontend && npm ci && npm run typecheck && npm run build
cd ../backend && pip install -r requirements.txt && alembic history --verbose
```

See [docs/architecture.md](docs/architecture.md) and
[docs/rollback.md](docs/rollback.md) for operating details.
