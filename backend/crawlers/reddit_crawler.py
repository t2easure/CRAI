import json
import os
from datetime import datetime, timezone, timedelta
from apify_client import ApifyClient
from utils.config import APIFY_API_TOKEN, DATA_DIR

ACTOR_ID = "trudax/reddit-scraper-lite"

SUBREDDITS = [
    {"url": "https://www.reddit.com/r/Lineage/", "game": "lineage_remaster"},
    {"url": "https://www.reddit.com/r/lineage2/", "game": "lineage2"},
    {"url": "https://www.reddit.com/r/LineageM/", "game": "lineage_m"},
    {"url": "https://www.reddit.com/r/LineageW/", "game": "lineage_w"},
]

LINEAGEOS_KEYWORDS = ["lineageos", "lineage os", "android", "rom", "aosp", "pixel", "samsung rom"]

def is_lineageos(item: dict) -> bool:
    text = " ".join([
        item.get("title", ""),
        item.get("body", ""),
        item.get("communityName", ""),
    ]).lower()
    return any(kw in text for kw in LINEAGEOS_KEYWORDS)

def is_recent(item: dict, since: datetime) -> bool:
    created_at = item.get("createdAt", "")
    if not created_at:
        return False
    dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    return dt >= since

def run():
    client = ApifyClient(APIFY_API_TOKEN)
    since = datetime.now(timezone.utc) - timedelta(hours=48)
    all_items = []

    for subreddit in SUBREDDITS:
        game = subreddit["game"]
        print(f"[Reddit] crawling r/{subreddit['url'].split('/r/')[1].strip('/')} ...")

        run_input = {
            "startUrls": [{"url": subreddit["url"]}],
            "maxPostCount": 50,
            "maxComments": 20,
            "proxy": {"useApifyProxy": True},
        }

        run = client.actor(ACTOR_ID).call(run_input=run_input)
        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

        items = [
            i for i in items
            if i.get("dataType") != "community"
            and is_recent(i, since)
            and not is_lineageos(i)
        ]

        for item in items:
            item["game"] = game
            item["source"] = "reddit"

        print(f"  -> {len(items)} items")
        all_items.extend(items)

    print(f"[Reddit] total: {len(all_items)} items ({since.strftime('%Y-%m-%d %H:%M')} since)")

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    by_game: dict = {}
    for item in all_items:
        by_game.setdefault(item["game"], []).append(item)

    for game, items in by_game.items():
        output_dir = os.path.join(DATA_DIR, "reddit", game)
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{timestamp}.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"[Reddit/{game}] saved {len(items)} items -> {output_path}")

    return all_items


if __name__ == "__main__":
    run()
