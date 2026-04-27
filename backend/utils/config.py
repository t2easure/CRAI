from dotenv import load_dotenv
import os
import json
from datetime import datetime, timezone, timedelta

load_dotenv()

APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Data output directory
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

LAST_RUN_PATH = os.path.join(DATA_DIR, "last_run.json")

def get_last_run() -> datetime:
    """마지막 실행 시점 반환. 없으면 24시간 전."""
    try:
        with open(LAST_RUN_PATH, "r") as f:
            data = json.load(f)
            return datetime.fromisoformat(data["timestamp"])
    except (FileNotFoundError, KeyError, ValueError):
        return datetime.now(timezone.utc) - timedelta(hours=24)

def update_last_run():
    """현재 시점을 마지막 실행 시점으로 저장."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(LAST_RUN_PATH, "w") as f:
        json.dump({"timestamp": datetime.now(timezone.utc).isoformat()}, f)
