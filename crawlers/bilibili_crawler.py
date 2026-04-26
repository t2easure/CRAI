import json
import os
from datetime import date, datetime, timezone
from apify_client import ApifyClient
from utils.config import APIFY_API_TOKEN, DATA_DIR, get_last_run

def is_recent(item: dict, since: datetime) -> bool:
    publish_date = item.get("publishDate", "")
    if not publish_date:
        return False
    dt = datetime.fromisoformat(publish_date)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt >= since

ACTOR_ID = "zhorex/bilibili-scraper"

KEYWORDS = [
    # 핵 / 치트 / 봇
    "天堂经典 外挂",
    "天堂经典 hack",
    "天堂经典 cheat",
    "天堂经典 bot",
    "天堂经典 刷怪",       # 몹 파밍 자동화
    "天堂经典 自动打怪",   # 자동사냥
    "天堂经典 脚本",       # 스크립트/매크로
    "天堂经典 辅助",       # 보조 프로그램
    # 업데이트 / 패치 / 서버
    "天堂经典 更新",       # 업데이트
    "天堂经典 patch",
    "天堂经典 新服",       # 신규 서버
    "天堂经典 开服",       # 서버 오픈
    "天堂经典 私服",       # 프라이빗 서버
    # 일반 커뮤니티 여론
    "天堂经典 攻略",       # 공략
    "天堂经典 评测",       # 리뷰/평가
    "天堂经典 游戏",       # 일반 게임플레이
    # 영문 키워드
    "lineage classic hack",
    "lineage classic bot",
    "lineage classic update",
    "lineage classic private server",
]

def run():
    client = ApifyClient(APIFY_API_TOKEN)
    since = get_last_run()

    all_items = []

    for keyword in KEYWORDS:
        print(f"[Bilibili] 검색 중: '{keyword}'")

        run_input = {
            "mode": "search",
            "searchQuery": keyword,
            "maxResults": 10,
        }

        run = client.actor(ACTOR_ID).call(run_input=run_input)
        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
        recent = [i for i in items if is_recent(i, since)]
        print(f"  → {len(items)}건 수집 / {len(recent)}건 ({since.strftime('%Y-%m-%d %H:%M')} 이후)")
        all_items.extend(recent)

    print(f"[Bilibili] 전체 수집 완료: {len(all_items)}건")

    output_dir = os.path.join(DATA_DIR, "bilibili")
    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    output_path = os.path.join(output_dir, f"{timestamp}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    print(f"[Bilibili] 저장 완료: {output_path}")
    return all_items


if __name__ == "__main__":
    run()
