import json
import os
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Any

from db.preprocess import preprocess
from utils.config import DATA_DIR


DB_PATH = os.path.abspath(os.path.join(DATA_DIR, "crai.db"))


def _get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """DB 및 테이블 초기화. 없으면 생성."""
    with _get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE,
                title TEXT,
                content TEXT,
                author TEXT,
                date TEXT,
                game TEXT,
                source TEXT,
                keyword TEXT,
                views TEXT,
                recommend TEXT,
                raw TEXT,
                created_at TEXT
            )
            """
        )
        conn.commit()


def save_posts(items: list[dict]) -> int:
    """아이템 리스트 저장. 중복 url은 skip. 저장된 건수 반환."""
    if not items:
        return 0

    items = preprocess(items)
    if not items:
        return 0

    now_utc = datetime.now(timezone.utc).isoformat()
    inserted = 0

    with _get_connection() as conn:
        cur = conn.cursor()
        for item in items:
            row = {
                "url": item.get("url"),
                "title": item.get("title"),
                "content": item.get("content") or item.get("body") or item.get("description"),
                "author": item.get("author") or item.get("username"),
                "date": item.get("date") or item.get("publishDate") or item.get("createdAt"),
                "game": item.get("game"),
                "source": item.get("source"),
                "keyword": item.get("keyword"),
                "views": item.get("views") or item.get("view"),
                "recommend": item.get("recommend") or item.get("upvotes"),
                "raw": json.dumps(item, ensure_ascii=False),
                "created_at": now_utc,
            }

            cur.execute(
                """
                INSERT OR IGNORE INTO posts (
                    url, title, content, author, date, game, source,
                    keyword, views, recommend, raw, created_at
                )
                VALUES (
                    :url, :title, :content, :author, :date, :game, :source,
                    :keyword, :views, :recommend, :raw, :created_at
                )
                """,
                row,
            )
            if cur.rowcount > 0:
                inserted += 1

        conn.commit()

    return inserted


def get_posts(game: str = None, source: str = None, since: str = None) -> list[dict]:
    """
    조건별 posts 조회.
    - game: 특정 게임만 필터 (None이면 전체)
    - source: 특정 소스만 필터 (None이면 전체)
    - since: ISO format 날짜 문자열, created_at >= since 조건 (None이면 전체)
    반환: list of dict (컬럼명 → 값)
    """
    query = "SELECT * FROM posts WHERE 1=1"
    params: list[Any] = []

    if game:
        query += " AND game = ?"
        params.append(game)
    if source:
        query += " AND source = ?"
        params.append(source)
    if since:
        query += " AND created_at >= ?"
        params.append(since)

    query += " ORDER BY created_at DESC"

    with _get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]


def get_stats() -> dict:
    """
    게임별/소스별 수집 건수 반환.
    """
    with _get_connection() as conn:
        by_game_rows = conn.execute(
            "SELECT game, COUNT(*) AS cnt FROM posts GROUP BY game"
        ).fetchall()
        by_source_rows = conn.execute(
            "SELECT source, COUNT(*) AS cnt FROM posts GROUP BY source"
        ).fetchall()
        total_row = conn.execute("SELECT COUNT(*) AS cnt FROM posts").fetchone()

    return {
        "by_game": {row["game"]: row["cnt"] for row in by_game_rows if row["game"]},
        "by_source": {row["source"]: row["cnt"] for row in by_source_rows if row["source"]},
        "total": total_row["cnt"] if total_row else 0,
    }


def delete_expired_posts(days: int = 30) -> int:
    """
    created_at 기준 days일 이상 지난 posts 삭제.
    삭제된 건수 반환.
    """
    threshold = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    with _get_connection() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM posts WHERE created_at < ?", (threshold,))
        conn.commit()
        return cur.rowcount


def delete_expired_json_files(days: int = 30) -> int:
    """
    data/{플랫폼}/{game}/ 디렉토리의 JSON 파일 중
    파일명 날짜(YYYY-MM-DD) 기준 days일 이상 지난 파일 삭제.
    삭제된 파일 수 반환.
    """
    threshold_date = (datetime.now() - timedelta(days=days)).date()
    removed = 0

    for platform in ("reddit", "bilibili", "inven"):
        platform_dir = os.path.abspath(os.path.join(DATA_DIR, platform))
        if not os.path.isdir(platform_dir):
            continue

        for game in os.listdir(platform_dir):
            game_dir = os.path.join(platform_dir, game)
            if not os.path.isdir(game_dir):
                continue

            for filename in os.listdir(game_dir):
                if not filename.endswith(".json"):
                    continue

                date_prefix = filename[:10]
                try:
                    file_date = datetime.strptime(date_prefix, "%Y-%m-%d").date()
                except ValueError:
                    continue

                if file_date <= threshold_date:
                    os.remove(os.path.join(game_dir, filename))
                    removed += 1

    return removed
