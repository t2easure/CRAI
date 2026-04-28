from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from db.database import delete_report, get_report, get_reports, save_report

router = APIRouter(prefix="/reports", tags=["reports"])


class ReportCreate(BaseModel):
    game: str
    period_start: str
    period_end: str
    summary: str
    category_filter: Optional[str] = None
    category_translation: Optional[str] = None
    category_classification: Optional[str] = None
    category_analysis: Optional[str] = None
    full_report: Optional[str] = None
    keywords: Optional[list[str]] = None
    trend_level: Optional[str] = "normal"
    post_count: Optional[int] = 0


@router.get("")
def list_reports(
    game: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    """보고서 목록 조회."""
    return get_reports(game=game, limit=limit)


@router.get("/{report_id}")
def read_report(report_id: int):
    """보고서 단건 조회."""
    report = get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다.")
    return report


@router.post("")
def create_report(report: ReportCreate):
    """보고서 저장 (AI 에이전트가 호출)."""
    payload = report.model_dump()
    if payload.get("keywords") is None:
        payload["keywords"] = []
    report_id = save_report(payload)
    return {"success": True, "id": report_id}


@router.delete("/{report_id}")
def remove_report(report_id: int):
    """보고서 삭제."""
    ok = delete_report(report_id)
    if not ok:
        raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다.")
    return {"success": True}
