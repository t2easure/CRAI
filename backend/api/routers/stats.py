from fastapi import APIRouter, Query

from db.database import get_stats, get_crawl_logs

router = APIRouter(tags=["stats"])


@router.get("/stats")
def stats():
    data = get_stats()
    return {
        "total": data["total"],
        "byGame": data["by_game"],
        "bySource": data["by_source"],
    }


@router.get("/logs")
def logs(limit: int = Query(50, ge=1)):
    return get_crawl_logs(limit=limit)
