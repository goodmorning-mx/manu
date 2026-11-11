from __future__ import annotations

from typing import Any

import httpx

from app.config import get_settings

API_URL = "https://api.judge.me/api/v1"
TIMEOUT = 20.0


class JudgeMeError(RuntimeError):
    """A safe, user-facing Judge.me API failure."""


def _credentials() -> tuple[str, str]:
    settings = get_settings()
    shop = settings.judgeme_shop_domain.strip()
    token = settings.judgeme_api_token.strip()
    if not shop or not token:
        raise JudgeMeError("Conecta Judge.me para cargar las reseñas.")
    return shop, token


def _request(method: str, path: str, **kwargs: Any) -> Any:
    shop, token = _credentials()
    try:
        response = httpx.request(
            method,
            f"{API_URL}{path}",
            params={"shop_domain": shop, **kwargs.pop("params", {})},
            headers={"X-Api-Token": token, "Accept": "application/json"},
            timeout=TIMEOUT,
            **kwargs,
        )
        response.raise_for_status()
        return response.json() if response.content else {}
    except httpx.TimeoutException as exc:
        raise JudgeMeError("Judge.me tardó demasiado en responder.") from exc
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (401, 403):
            raise JudgeMeError("Judge.me rechazó las credenciales configuradas.") from exc
        raise JudgeMeError("Judge.me no pudo completar la operación.") from exc
    except (httpx.RequestError, ValueError) as exc:
        raise JudgeMeError("No se pudo conectar con Judge.me.") from exc


def list_reviews(*, published: bool, page: int = 1, per_page: int = 50) -> list[dict[str, Any]]:
    payload = _request(
        "GET",
        "/reviews",
        params={"published": str(published).lower(), "hidden": "false", "page": page, "per_page": per_page},
    )
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get("reviews"), list):
        return payload["reviews"]
    raise JudgeMeError("Judge.me devolvió una respuesta que no pudimos interpretar.")


def publish_review(review_id: int) -> None:
    _request("PUT", f"/reviews/{review_id}", json={"curated": "ok", "hidden": False})
