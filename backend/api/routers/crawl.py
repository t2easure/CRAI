import asyncio
import sys

from fastapi import APIRouter

router = APIRouter(prefix="/crawl", tags=["crawl"])


@router.post("")
async def crawl():
    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "pipeline.crawler_runner",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            return {"success": False, "message": stderr.decode(errors="replace")}
        return {"success": True, "message": stdout.decode(errors="replace")}
    except Exception as e:
        return {"success": False, "message": str(e)}
