from fastapi import APIRouter, Query

from db.database import get_posts

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("")
def list_posts(
    game: str = Query(None),
    source: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * limit
    posts, total = get_posts(game=game, source=source, limit=limit, offset=offset)
    total_pages = max(1, -(-total // limit))
    return {"posts": posts, "total": total, "page": page, "totalPages": total_pages}
