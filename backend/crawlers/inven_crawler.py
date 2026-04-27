import json
import os
import asyncio
from datetime import date, datetime, timezone, timedelta
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy
from utils.config import DATA_DIR, get_last_run

BOARDS = [
    {"game": "lineage_classic", "url": "https://www.inven.co.kr/board/lineageclassic/6482"},
    {"game": "lineage_remaster", "url": "https://www.inven.co.kr/board/lineage/339"},
    {"game": "lineage2", "url": "https://www.inven.co.kr/board/lineage2/381"},
    {"game": "lineage_m", "url": "https://www.inven.co.kr/board/lineagem/5019"},
    {"game": "lineage2m", "url": "https://www.inven.co.kr/board/lineage2m/5522"},
    {"game": "lineage_w", "url": "https://www.inven.co.kr/board/lineagew/5831"},
]

MAX_PAGES = 5

def is_recent(item: dict, since: datetime) -> bool:
    date_str = item.get("date", "").strip()
    if not date_str:
        return False
    today = date.today()
    try:
        if ":" in date_str and "-" not in date_str:
            post_dt = datetime.strptime(f"{today} {date_str}", "%Y-%m-%d %H:%M")
        elif len(date_str) == 5:
            # MM-DD 형식 — 올해 날짜가 오늘보다 미래면 작년으로 처리
            candidate = datetime.strptime(f"{today.year}-{date_str}", "%Y-%m-%d").date()
            year = today.year if candidate <= today else today.year - 1
            post_dt = datetime.strptime(f"{year}-{date_str}", "%Y-%m-%d")
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

async def crawl_board(crawler, board: dict, since: datetime) -> list:
    game = board["game"]
    base_url = board["url"]
    all_items = []

    for page in range(1, MAX_PAGES + 1):
        url = f"{base_url}?p={page}"
        print(f"[Inven/{game}] page {page}...")

        result = await crawler.arun(url=url, config=config)

        if not result.success:
            print(f"  -> failed: {result.error_message}")
            break

        items = json.loads(result.extracted_content) if result.extracted_content else []
        if not items:
            print(f"  -> no data, stop")
            break

        today = date.today()
        for item in items:
            if item.get("url") and not item["url"].startswith("http"):
                item["url"] = "https://www.inven.co.kr" + item["url"]
            item["game"] = game
            item["source"] = "inven"
            date_str = item.get("date", "").strip()
            if date_str:
                if ":" in date_str and "-" not in date_str:
                    item["date"] = f"{today} {date_str}"
                elif len(date_str) == 5:
                    candidate = datetime.strptime(f"{today.year}-{date_str}", "%Y-%m-%d").date()
                    year = today.year if candidate <= today else today.year - 1
                    item["date"] = f"{year}-{date_str}"

        recent = [i for i in items if is_recent(i, since)]
        print(f"  -> {len(items)} total / {len(recent)} recent")

        if len(recent) < len(items):
            all_items.extend(recent)
            break
        all_items.extend(recent)

        await asyncio.sleep(1.5)

    return all_items


async def crawl():
    all_items = []
    since = get_last_run()

    async with AsyncWebCrawler(verbose=False) as crawler:
        for board in BOARDS:
            items = await crawl_board(crawler, board, since)
            all_items.extend(items)
            print(f"[Inven/{board['game']}] {len(items)} items collected")

    print(f"[Inven] total: {len(all_items)} items")

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    by_game: dict = {}
    for item in all_items:
        by_game.setdefault(item["game"], []).append(item)

    for game, items in by_game.items():
        output_dir = os.path.join(DATA_DIR, "inven", game)
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{timestamp}.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"[Inven/{game}] saved {len(items)} items -> {output_path}")

    return all_items


def run():
    return asyncio.run(crawl())


if __name__ == "__main__":
    run()
