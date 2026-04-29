import json
import os
import re
import asyncio
from datetime import datetime, timezone, timedelta
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy
from utils.config import DATA_DIR

BOARDS = [
    {"game": "lineage_classic",  "bsn": "84452"},
    {"game": "lineage2",         "bsn": "5264"},
    {"game": "lineage_m",        "bsn": "25908"},
    {"game": "lineage_w",        "bsn": "71905"},
    {"game": "lineage_remaster", "bsn": "842"},
    {"game": "lineage2m",        "bsn": "33316"},
]

MAX_PAGES = 5
BASE_URL = "https://forum.gamer.com.tw"

list_schema = {
    "name": "bahamut_posts",
    "baseSelector": "table.b-list tbody tr.b-list__row:not(.b-list__row--sticky)",
    "fields": [
        {"name": "title",    "selector": "p.b-list__main__title",              "type": "text"},
        {"name": "url",      "selector": "td.b-list__main > a",                "type": "attribute", "attribute": "href"},
        {"name": "author",   "selector": "td.b-list__count p.b-list__count__user a", "type": "text"},
        {"name": "date",     "selector": "td.b-list__time p.b-list__time__edittime a", "type": "text"},
        {"name": "views",    "selector": "span[title*='人氣']",                 "type": "text"},
        {"name": "recommend","selector": "span.b-list__summary__gp",           "type": "text"},
    ],
}

detail_schema = {
    "name": "bahamut_detail",
    "baseSelector": "body",
    "fields": [
        {"name": "date",    "selector": "span.post-created__time", "type": "text"},
        {"name": "content", "selector": "div.c-article__content",  "type": "text"},
    ],
}

list_config = CrawlerRunConfig(
    extraction_strategy=JsonCssExtractionStrategy(list_schema),
    cache_mode=CacheMode.BYPASS,
)

detail_config = CrawlerRunConfig(
    extraction_strategy=JsonCssExtractionStrategy(detail_schema),
    cache_mode=CacheMode.BYPASS,
)


def _parse_date(date_str: str) -> str:
    """바하무트 날짜 포맷 정규화. 작성자명이 붙어있으면 날짜 부분만 추출."""
    date_str = date_str.strip()
    today = datetime.now().date()

    # 상대 시간: "X 小時前", "X 分鐘前" → 오늘 날짜로 처리
    if "前" in date_str:
        return today.strftime("%Y-%m-%d")

    # YYYY-MM-DD 패턴 추출
    m = re.search(r'(\d{4}-\d{2}-\d{2})', date_str)
    if m:
        return m.group(1)

    # MM-DD HH:MM 패턴 추출
    m = re.search(r'(\d{2}-\d{2} \d{2}:\d{2})', date_str)
    if m:
        return f"{today.year}-{m.group(1)}"

    # HH:MM 패턴만
    m = re.search(r'(\d{2}:\d{2})', date_str)
    if m:
        return today.strftime("%Y-%m-%d")

    return date_str


def _is_recent(date_str: str, since: datetime) -> bool:
    TST = timezone(timedelta(hours=8))  # 대만 시간대
    since_date = since.astimezone(TST).date()
    try:
        post_date = datetime.strptime(date_str[:10], "%Y-%m-%d").date()
        return post_date >= since_date
    except ValueError:
        return False


async def _fetch_detail(crawler, url: str) -> dict:
    try:
        result = await crawler.arun(url=url, config=detail_config)
        if result.extracted_content:
            data = json.loads(result.extracted_content)
            if data:
                return {
                    "date": data[0].get("date", ""),
                    "content": data[0].get("content", ""),
                }
    except Exception:
        pass
    return {}


async def crawl_board(crawler, board: dict, since: datetime) -> list:
    game = board["game"]
    bsn = board["bsn"]
    all_items = []

    for page in range(1, MAX_PAGES + 1):
        url = f"{BASE_URL}/B.php?bsn={bsn}&page={page}"
        print(f"[Bahamut/{game}] page {page}...")

        result = await crawler.arun(url=url, config=list_config)
        if not result.success:
            print(f"  -> failed: {result.error_message}")
            break

        items = json.loads(result.extracted_content) if result.extracted_content else []
        if not items:
            print(f"  -> no data, stop")
            break

        for item in items:
            raw_url = item.get("url", "")
            if raw_url and not raw_url.startswith("http"):
                item["url"] = BASE_URL + "/" + raw_url.lstrip("/")
            item["game"] = game
            item["source"] = "bahamut"
            raw_date = item.get("date", "").strip()
            if raw_date:
                item["date"] = _parse_date(raw_date)

        if items:
            print(f"  -> sample item: {items[0]}")
        recent_items = [i for i in items if _is_recent(i.get("date", ""), since)]
        print(f"  -> {len(items)} total / {len(recent_items)} recent, fetching details...")

        for item in recent_items:
            if item.get("url"):
                detail = await _fetch_detail(crawler, item["url"])
                if detail.get("date"):
                    item["date"] = detail["date"]
                if detail.get("content"):
                    item["content"] = detail["content"]
            await asyncio.sleep(0.3)

        all_items.extend(recent_items)

        if len(recent_items) < len(items):
            break

        await asyncio.sleep(0.5)

    return all_items


async def crawl():
    from db.database import save_posts
    all_items = []
    since = datetime.now(timezone.utc) - timedelta(hours=24)

    browser_cfg = BrowserConfig(
        headless=True,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    )
    async with AsyncWebCrawler(config=browser_cfg, verbose=False) as crawler:
        for board in BOARDS:
            items = await crawl_board(crawler, board, since)
            if items:
                saved = save_posts(items)
                print(f"[Bahamut/{board['game']}] {len(items)} collected, {saved} saved")
            else:
                print(f"[Bahamut/{board['game']}] 0 items")
            all_items.extend(items)

    print(f"[Bahamut] total: {len(all_items)} items")

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    by_game: dict = {}
    for item in all_items:
        by_game.setdefault(item["game"], []).append(item)

    for game, items in by_game.items():
        output_dir = os.path.join(DATA_DIR, "bahamut", game)
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{timestamp}.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"[Bahamut/{game}] saved {len(items)} -> {output_path}")

    return all_items


def run():
    return asyncio.run(crawl())


if __name__ == "__main__":
    run()
