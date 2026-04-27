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
        capture_output=True,
        cwd=str(BACKEND_DIR),
    )
    out = result.stdout.decode(errors="replace")
    err = result.stderr.decode(errors="replace")
    return result.returncode, out, err


@router.post("")
async def crawl():
    try:
        loop = asyncio.get_running_loop()
        returncode, out, err = await loop.run_in_executor(_executor, _run_crawler)
        print(f"[crawl] returncode={returncode}")
        print(f"[crawl] stdout={out[:2000]}")
        print(f"[crawl] stderr={err[:2000]}")
        return {"success": True, "message": out or err or f"done (returncode={returncode})"}
    except Exception as e:
        msg = traceback.format_exc()
        print(f"[crawl ERROR] {msg}")
        return {"success": False, "message": msg}
