from fastapi import APIRouter

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
def list_reports():
    # TODO: AI 분석 리포트 조회 (추후 구현)
    return []


@router.post("")
async def create_report():
    # TODO: AI 분석 리포트 즉시 생성 (추후 구현)
    return {"success": False, "message": "아직 구현되지 않았습니다."}
