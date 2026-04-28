import asyncio
import subprocess
import sys
import traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/crawl", tags=["crawl"])

BACKEND_DIR = Path(__file__).parent.parent.parent
_executor = ThreadPoolExecutor(max_workers=1)


def _run_crawler():
    result = subprocess.run(
        [sys.executable, "-m", "pipeline.crawler_runner"],
        cwd=str(BACKEND_DIR),
    )
    return result.returncode, "", ""


@router.post("")
async def crawl():
    try:
        loop = asyncio.get_running_loop()
        loop.run_in_executor(_executor, _run_crawler)
        return {"success": True, "message": "크롤링을 시작했습니다. 완료까지 수 분 소요됩니다."}
    except Exception as e:
        msg = traceback.format_exc()
        print(f"[crawl ERROR] {msg}")
        return {"success": False, "message": msg}
