import asyncio
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from db.database import delete_expired_json_files, delete_expired_posts
from pipeline.crawler_runner import run_all


def _format_summary(results: dict) -> str:
    parts = []
    for source in ("Reddit", "Bilibili", "인벤"):
        result = results.get(source, {})
        if result.get("status") == "success":
            parts.append(f"{source} {result.get('count', 0)}건")
        else:
            parts.append(f"{source} 실패")
    return ", ".join(parts)


async def run_crawling_job() -> None:
    started = datetime.now()
    print(f"[Scheduler] 크롤링 시작: {started.strftime('%Y-%m-%d %H:%M:%S')}")
    try:
        results = await run_all()
        print(f"[Scheduler] 크롤링 완료: {_format_summary(results)}")
        deleted_posts = delete_expired_posts(days=30)
        deleted_json = delete_expired_json_files(days=30)
        print(f"[Scheduler] 만료 처리 완료: posts {deleted_posts}건 삭제, json {deleted_json}개 삭제")
    except Exception as exc:
        print(f"[Scheduler] 크롤링 실패: {exc}")
    finally:
        finished = datetime.now()
        print(f"[Scheduler] 실행 종료: {finished.strftime('%Y-%m-%d %H:%M:%S')}")


async def main() -> None:
    print("[Scheduler] 시작. 즉시 1회 실행 후 6시간 간격으로 반복.")
    await run_crawling_job()

    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_crawling_job, trigger="interval", hours=6)
    scheduler.start()

    next_run = scheduler.get_jobs()[0].next_run_time
    if next_run is not None:
        print(f"[Scheduler] 다음 실행: {next_run.strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        while True:
            await asyncio.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        print("[Scheduler] 종료 신호 수신. 스케줄러를 중단합니다.")
        scheduler.shutdown(wait=False)


if __name__ == "__main__":
    asyncio.run(main())
