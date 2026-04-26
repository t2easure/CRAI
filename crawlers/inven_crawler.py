import json
import os
import asyncio
from datetime import date, datetime, timezone, timedelta
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy
from utils.config import DATA_DIR, get_last_run

BASE_URL = "https://www.inven.co.kr/board/lineageclassic/6482"
MAX_PAGES = 5

def is_recent(item: dict, since: datetime) -> bool:
    date_str = item.get("date", "").strip()
    if not date_str:
        return False
    today = date.today()
    try:
        if ":" in date_str and "-" not in date_str:
            # HH:MM 형식 → 오늘 날짜로 datetime 생성
            post_dt = datetime.strptime(f"{today} {date_str}", "%Y-%m-%d %H:%M")
        elif len(date_str) == 5:
            post_dt = datetime.strptime(f"{today.year}-{date_str}", "%Y-%m-%d")
        else:
            post_dt = datetime.strptime(date_str, "%Y-%m-%d")
        post_dt = post_dt.replace(tzinfo=timezone.utc)
        return post_dt >= since
    except ValueError:
        return False

schema = {
    "name": "inven_posts",
    "baseSelector": "tbody tr",
    "fields": [
        {"name": "title", "selector": "td.tit a.subject-link", "type": "text"},
        {"name": "url", "selector": "td.tit a.subject-link", "type": "attribute", "attribute": "href"},
        {"name": "category", "selector": "td.tit .category", "type": "text"},
        {"name": "author", "selector": "td.user span.layerNickName", "type": "text"},
        {"name": "date", "selector": "td.date", "type": "text"},
        {"name": "views", "selector": "td.view", "type": "text"},
        {"name": "recommend", "selector": "td.reco", "type": "text"},
        {"name": "comment_count", "selector": "td.tit a.cmt-cnt", "type": "text"},
    ],
}

config = CrawlerRunConfig(
    extraction_strategy=JsonCssExtractionStrategy(schema),
    cache_mode=CacheMode.BYPASS,
)

async def crawl():
    all_items = []
    since = get_last_run()

    async with AsyncWebCrawler(verbose=False) as crawler:
        for page in range(1, MAX_PAGES + 1):
            url = f"{BASE_URL}?p={page}"
            print(f"[인벤] 페이지 {page} 크롤링 중...")

            result = await crawler.arun(url=url, config=config)

            if not result.success:
                print(f"  → 페이지 {page} 실패: {result.error_message}")
                break

            items = json.loads(result.extracted_content) if result.extracted_content else []
            if not items:
                print(f"  → 페이지 {page} 데이터 없음, 중단")
                break

            for item in items:
                if item.get("url") and not item["url"].startswith("http"):
                    item["url"] = "https://www.inven.co.kr" + item["url"]

            recent = [i for i in items if is_recent(i, since)]
            print(f"  → {len(items)}건 수집 / {len(recent)}건 ({since.strftime('%Y-%m-%d %H:%M')} 이후)")
            if len(recent) < len(items):
                all_items.extend(recent)
                break
            all_items.extend(recent)

            await asyncio.sleep(1.5)

    print(f"[인벤] 전체 수집 완료: {len(all_items)}건")

    output_dir = os.path.join(DATA_DIR, "inven")
    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    output_path = os.path.join(output_dir, f"{timestamp}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    print(f"[인벤] 저장 완료: {output_path}")
    return all_items


def run():
    return asyncio.run(crawl())


if __name__ == "__main__":
    run()
