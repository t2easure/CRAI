import json
import os
from datetime import date, datetime, timezone, timedelta
from apify_client import ApifyClient
from utils.config import APIFY_API_TOKEN, DATA_DIR

THREE_MONTHS_AGO = datetime.now(timezone.utc) - timedelta(days=90)

def is_recent(item: dict) -> bool:
    publish_date = item.get("publishDate", "")
    if not publish_date:
        return False
    dt = datetime.fromisoformat(publish_date)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt >= THREE_MONTHS_AGO

ACTOR_ID = "zhorex/bilibili-scraper"

KEYWORDS = [
    "天堂2 hack",
    "天堂2 cheat",
    "天堂2 bot",
    "天堂2 外挂",
    "天堂2 update",
    "天堂2 patch",
    "lineage2 hack",
    "lineage2 update",
]

def run():
    client = ApifyClient(APIFY_API_TOKEN)

    all_items = []

    for keyword in KEYWORDS[:3]:
        print(f"[Bilibili] 검색 중: '{keyword}'")

        run_input = {
            "mode": "search",
            "searchQuery": keyword,
            "maxResults": 10,
        }

        run = client.actor(ACTOR_ID).call(run_input=run_input)
        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
        recent = [i for i in items if is_recent(i)]
        print(f"  → {len(items)}건 수집 / {len(recent)}건 (3개월 이내)")
        all_items.extend(recent)

    print(f"[Bilibili] 전체 수집 완료: {len(all_items)}건")

    output_dir = os.path.join(DATA_DIR, "bilibili")
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, f"{date.today()}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    print(f"[Bilibili] 저장 완료: {output_path}")
    return all_items


if __name__ == "__main__":
    run()
