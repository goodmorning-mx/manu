from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.auth import auth_service
from app.config import get_settings
from app.judgeme import JudgeMeError, list_reviews, publish_review
from gm_auth import AuthIdentity, create_auth_router
from gm_auth.dependencies import require_roles

settings = get_settings()

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(create_auth_router(auth_service))

admin_identity = require_roles(auth_service, "admin")


@app.get("/reviews")
def reviews(
    published: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    identity: AuthIdentity = Depends(admin_identity),
) -> dict:
    del identity
    try:
        items = list_reviews(published=published, page=page)
    except JudgeMeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    safe_reviews = []
    for item in items:
        reviewer = item.get("reviewer") if isinstance(item.get("reviewer"), dict) else {}
        safe_reviews.append(
            {
                "id": item.get("id"),
                "title": item.get("title") or "",
                "body": item.get("body") or "",
                "rating": item.get("rating"),
                "product_title": item.get("product_title") or "Reseña de tienda",
                "product_handle": item.get("product_handle") or "",
                "reviewer_name": reviewer.get("name") or item.get("reviewer_name") or "Cliente",
                "created_at": item.get("created_at"),
                "published": published,
            }
        )
    return {"reviews": safe_reviews, "page": page, "per_page": 50}


@app.post("/reviews/{review_id}/publish")
def publish(
    review_id: int,
    identity: AuthIdentity = Depends(admin_identity),
) -> dict[str, str]:
    del identity
    if review_id < 1:
        raise HTTPException(status_code=422, detail="Review ID must be positive.")
    try:
        publish_review(review_id)
    except JudgeMeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"status": "published"}


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "status": "ok",
        "environment": settings.app_env,
    }


@app.get("/version")
def version() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "environment": settings.app_env,
        "commit_sha": settings.source_commit,
    }
