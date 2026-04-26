import json
import os
from datetime import date, datetime, timezone
from apify_client import ApifyClient
from utils.config import APIFY_API_TOKEN, DATA_DIR, get_last_run

ACTOR_ID = "trudax/reddit-scraper-lite"

def is_recent(item: dict, since: datetime) -> bool:
    created_at = item.get("createdAt", "")
    if not created_at:
        return False
    dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    return dt >= since

SUBREDDITS = [
    "https://www.reddit.com/r/Lineage/",
    "https://www.reddit.com/r/MMORPG/",
]

def run():
    client = ApifyClient(APIFY_API_TOKEN)

    run_input = {
        "startUrls": [{"url": url} for url in SUBREDDITS],
        "maxPostCount": 50,
        "maxComments": 20,
        "proxy": {"useApifyProxy": True},
    }

    print("[Reddit] actor 실행 중...")
    run = client.actor(ACTOR_ID).call(run_input=run_input)

    since = get_last_run()
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    items = [i for i in items if i.get("dataType") != "community" and is_recent(i, since)]
    print(f"[Reddit] 수집 완료: {len(items)}건 ({since.strftime('%Y-%m-%d %H:%M')} 이후)")

    output_dir = os.path.join(DATA_DIR, "reddit")
    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    output_path = os.path.join(output_dir, f"{timestamp}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"[Reddit] 저장 완료: {output_path}")
    return items


if __name__ == "__main__":
    run()
