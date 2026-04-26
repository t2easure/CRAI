import json
import os
from datetime import date
from apify_client import ApifyClient
from utils.config import APIFY_API_TOKEN, DATA_DIR

ACTOR_ID = "trudax/reddit-scraper-lite"

SUBREDDITS = [
    "https://www.reddit.com/r/lineage2/",
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

    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    print(f"[Reddit] 수집 완료: {len(items)}건")

    output_dir = os.path.join(DATA_DIR, "reddit")
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, f"{date.today()}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"[Reddit] 저장 완료: {output_path}")
    return items


if __name__ == "__main__":
    run()
