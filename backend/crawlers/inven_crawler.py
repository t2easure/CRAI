import json
import os
import asyncio
from datetime import datetime, timezone, timedelta
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy
from utils.config import DATA_DIR

BOARDS = [
    {"game": "lineage_classic", "url": "https://www.inven.co.kr/board/lineageclassic/6482"},
    {"game": "lineage_remaster", "url": "https://www.inven.co.kr/board/lineage/339"},
    {"game": "lineage2", "url": "https://www.inven.co.kr/board/lineage2/381"},
    {"game": "lineage_m", "url": "https://www.inven.co.kr/board/lineagem/5019"},
    {"game": "lineage2m", "url": "https://www.inven.co.kr/board/lineage2m/5522"},
    {"game": "lineage_w", "url": "https://www.inven.co.kr/board/lineagew/5831"},
]

MAX_PAGES = 2

list_schema = {
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

detail_schema = {
    "name": "inven_detail",
    "baseSelector": "body",
    "fields": [
        {"name": "date", "selector": ".articleDate", "type": "text"},
        {"name": "content", "selector": "#powerbbsContent", "type": "text"},
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


def _parse_list_date(date_str: str, now_kst: datetime) -> str:
    """목록 날짜(HH:MM, MM-DD, YYYY-MM-DD)를 YYYY-MM-DD 또는 YYYY-MM-DD HH:MM 문자열로 변환."""
    date_str = date_str.strip()
    today = now_kst.date()
    if ":" in date_str and "-" not in date_str:
        candidate = datetime.strptime(f"{today} {date_str}", "%Y-%m-%d %H:%M")
        if candidate > now_kst.replace(tzinfo=None):
            candidate -= timedelta(days=1)
        return candidate.strftime("%Y-%m-%d %H:%M")
    elif len(date_str) == 5:
        candidate = datetime.strptime(f"{today.year}-{date_str}", "%Y-%m-%d").date()
        year = today.year if candidate <= today else today.year - 1
        return f"{year}-{date_str}"
    return date_str


def _is_recent(date_str: str, since: datetime) -> bool:
    """날짜 문자열이 since 이후인지 확인."""
    KST = timezone(timedelta(hours=9))
    since_date = since.astimezone(KST).date()
    try:
        if len(date_str) == 16:
            post_date = datetime.strptime(date_str, "%Y-%m-%d %H:%M").date()
        else:
            post_date = datetime.strptime(date_str[:10], "%Y-%m-%d").date()
        return post_date >= since_date
    except ValueError:
        return False


async def _fetch_detail(crawler, url: str) -> dict:
    """상세 페이지에서 정확한 날짜와 본문 가져오기."""
    try:
        result = await crawler.arun(url=url, config=detail_config)
        if result.extracted_content:
            data = json.loads(result.extracted_content)
            if data:
                return {"date": data[0].get("date", ""), "content": data[0].get("content", "")}
    except Exception:
        pass
    return {}


async def crawl_board(crawler, board: dict, since: datetime) -> list:
    game = board["game"]
    base_url = board["url"]
    all_items = []
    KST = timezone(timedelta(hours=9))
    now_kst = datetime.now(KST)

    for page in range(1, MAX_PAGES + 1):
        url = f"{base_url}?p={page}"
        print(f"[Inven/{game}] page {page}...")

        result = await crawler.arun(url=url, config=list_config)
        if not result.success:
            print(f"  -> failed: {result.error_message}")
            break

        items = json.loads(result.extracted_content) if result.extracted_content else []
        if not items:
            print(f"  -> no data, stop")
            break

        # URL 보정 + 목록 날짜 변환
        for item in items:
            if item.get("url") and not item["url"].startswith("http"):
                item["url"] = "https://www.inven.co.kr" + item["url"]
            item["game"] = game
            item["source"] = "inven"
            raw_date = item.get("date", "").strip()
            if raw_date:
                item["date"] = _parse_list_date(raw_date, now_kst)

        # 목록 날짜 기준으로 기간 내 게시글만 필터 (상세 요청 최소화)
        recent_items = [i for i in items if _is_recent(i.get("date", ""), since)]
        print(f"  -> {len(items)} total / {len(recent_items)} recent, fetching details...")

        # 상세 페이지 순차 (봇 차단 방지)
        for item in recent_items:
            if item.get("url"):
                detail = await _fetch_detail(crawler, item["url"])
                if detail.get("date"):
                    item["date"] = detail["date"]
                if detail.get("content"):
                    item["content"] = detail["content"]
            await asyncio.sleep(1)

        all_items.extend(recent_items)

        if len(recent_items) < len(items):
            break

        await asyncio.sleep(1.5)

    return all_items


async def crawl():
    from db.database import save_posts
    all_items = []
    since = datetime.now(timezone.utc) - timedelta(hours=48)

    from crawl4ai import BrowserConfig
    browser_cfg = BrowserConfig(
        headless=True,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    )
    async with AsyncWebCrawler(config=browser_cfg, verbose=False) as crawler:
        for board in BOARDS:
            items = await crawl_board(crawler, board, since)
            if items:
                saved = save_posts(items)
                print(f"[Inven/{board['game']}] {len(items)} items collected, {saved} saved to DB")
            else:
                print(f"[Inven/{board['game']}] 0 items collected")
            all_items.extend(items)

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
