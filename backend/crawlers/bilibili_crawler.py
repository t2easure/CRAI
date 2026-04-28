import json
import os
from datetime import datetime, timezone, timedelta
from apify_client import ApifyClient
from utils.config import APIFY_API_TOKEN, DATA_DIR

ACTOR_ID = "zhorex/bilibili-scraper"

# 게임별 키워드 (중국 서비스명 기준)
GAME_KEYWORDS = {
    "lineage_remaster": ["天堂重制版 外挂", "天堂重制版 更新", "天堂重制版 游戏"],
    "lineage2": ["天堂2 外挂", "天堂2 hack", "天堂2 bot", "天堂2 更新", "lineage2 hack"],
    "lineage_classic": ["天堂经典 外挂", "天堂经典 脚本", "天堂经典 更新", "lineage classic hack"],
    "lineage_m": [
        "天堂M 外挂", "天堂M hack", "天堂M cheat", "天堂M bot",
        "天堂M 脚本", "天堂M 辅助", "天堂M 更新", "天堂M 私服",
        "lineage m hack", "lineage m bot", "lineage m update",
    ],
    "lineage2m": ["天堂2M 外挂", "天堂2M 更新", "天堂2M 游戏", "lineage 2m hack"],
    "lineage_w": ["天堂W 外挂", "天堂W 更新", "lineage w hack"],
}

def is_recent(item: dict, since: datetime) -> bool:
    publish_date = item.get("publishDate", "")
    if not publish_date:
        return False
    dt = datetime.fromisoformat(publish_date)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt >= since

def run():
    client = ApifyClient(APIFY_API_TOKEN)
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    all_items = []

    for game, keywords in GAME_KEYWORDS.items():
        for keyword in keywords:
            run_input = {
                "mode": "search",
                "searchQuery": keyword,
                "maxResults": 10,
            }

            run = client.actor(ACTOR_ID).call(run_input=run_input)
            items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
            recent = [i for i in items if is_recent(i, since)]

            for item in recent:
                item["game"] = game
                item["keyword"] = keyword
                item["source"] = "bilibili"

            all_items.extend(recent)

    print(f"[Bilibili] total: {len(all_items)} items ({since.strftime('%Y-%m-%d %H:%M')} since)")

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    by_game: dict = {}
    for item in all_items:
        by_game.setdefault(item["game"], []).append(item)

    for game, items in by_game.items():
        output_dir = os.path.join(DATA_DIR, "bilibili", game)
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{timestamp}.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"[Bilibili/{game}] saved {len(items)} items -> {output_path}")

    return all_items


if __name__ == "__main__":
    run()
