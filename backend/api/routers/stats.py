from fastapi import APIRouter, Query

from db.database import get_stats, get_crawl_logs, get_timeline

router = APIRouter(tags=["stats"])


@router.get("/stats")
def stats():
    data = get_stats()
    return {
        "total": data["total"],
        "byGame": data["by_game"],
        "bySource": data["by_source"],
        "lastRun": data["last_run"],
    }


@router.get("/stats/timeline")
def timeline(days: int = Query(14, ge=1, le=90)):
    return get_timeline(days=days)


@router.get("/logs")
def logs(limit: int = Query(50, ge=1)):
    return get_crawl_logs(limit=limit)
