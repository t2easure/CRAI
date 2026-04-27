import sys
import traceback
import asyncio

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
from concurrent.futures import ThreadPoolExecutor
from crawlers import reddit_crawler, bilibili_crawler, inven_crawler
from db.database import init_db, log_crawl, save_posts
from utils.config import update_last_run


def _run_safe(name, source, run_fn):
    try:
        items = run_fn()
        saved = save_posts(items)
        log_crawl(source=source, game="all", status="success", count=saved)
        return name, {"status": "success", "count": len(items), "saved": saved}
    except Exception as e:
        traceback.print_exc()
        log_crawl(source=source, game="all", status="error", count=0, error_msg=str(e))
        return name, {"status": "error", "error": str(e)}


async def run_all():
    init_db()
    crawlers_sync = [
        ("Reddit", "reddit", reddit_crawler.run),
        ("Bilibili", "bilibili", bilibili_crawler.run),
    ]

    print("[Pipeline] 전체 크롤러 병렬 실행 시작\n")

    # Reddit, Bilibili는 동기 함수라 ThreadPoolExecutor로 병렬 실행
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=len(crawlers_sync)) as executor:
        tasks = [
            loop.run_in_executor(executor, _run_safe, name, source, run_fn)
            for name, source, run_fn in crawlers_sync
        ]
        sync_results = await asyncio.gather(*tasks)

    # 인벤은 async 함수라 직접 await
    print("\n[인벤] 크롤러 시작...")
    try:
        items = await inven_crawler.crawl()
        saved = save_posts(items)
        log_crawl(source="inven", game="all", status="success", count=saved)
        inven_result = ("인벤", {"status": "success", "count": len(items), "saved": saved})
    except Exception as e:
        traceback.print_exc()
        log_crawl(source="inven", game="all", status="error", count=0, error_msg=str(e))
        inven_result = ("인벤", {"status": "error", "error": str(e)})

    results = dict(list(sync_results) + [inven_result])

    update_last_run()

    print(f"\n{'='*40}")
    print("[Pipeline] 전체 실행 완료")
    for name, result in results.items():
        if result["status"] == "success":
            print(f"  {name}: {result['count']}건 수집")
        else:
            print(f"  {name}: 실패 - {result['error']}")
    print(f"{'='*40}")

    return results


if __name__ == "__main__":
    asyncio.run(run_all())
