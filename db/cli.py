import argparse

from db.database import get_crawl_logs, get_posts, get_stats, init_db


def _print_kv_line(title: str, data: dict) -> None:
    if not data:
        print(f"{title}: -")
        return
    pairs = ", ".join(f"{k}={v}" for k, v in sorted(data.items()))
    print(f"{title}: {pairs}")


def _print_table(rows: list[dict], columns: list[str]) -> None:
    if not rows:
        print("데이터가 없습니다.")
        return

    widths = {col: len(col) for col in columns}
    for row in rows:
        for col in columns:
            widths[col] = max(widths[col], len(str(row.get(col, ""))))

    sep = "-+-".join("-" * widths[col] for col in columns)
    header = " | ".join(col.ljust(widths[col]) for col in columns)
    print(header)
    print(sep)
    for row in rows:
        print(" | ".join(str(row.get(col, "")).ljust(widths[col]) for col in columns))


def cmd_stats() -> None:
    stats = get_stats()
    print(f"전체: {stats.get('total', 0)}건")
    _print_kv_line("게임별", stats.get("by_game", {}))
    _print_kv_line("소스별", stats.get("by_source", {}))


def cmd_posts(game: str, source: str, limit: int) -> None:
    posts = get_posts(game=game, source=source)[:limit]
    _print_table(posts, ["id", "source", "game", "title", "url", "created_at"])


def cmd_logs(limit: int) -> None:
    logs = get_crawl_logs(limit=limit)
    _print_table(logs, ["id", "run_at", "source", "game", "status", "count", "error_msg"])


def main() -> None:
    init_db()

    parser = argparse.ArgumentParser(description="DB 조회 CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("stats", help="수집 통계 조회")

    posts_parser = sub.add_parser("posts", help="게시글 조회")
    posts_parser.add_argument("--game", type=str, default=None)
    posts_parser.add_argument("--source", type=str, default=None)
    posts_parser.add_argument("--limit", type=int, default=20)

    logs_parser = sub.add_parser("logs", help="크롤링 로그 조회")
    logs_parser.add_argument("--limit", type=int, default=50)

    args = parser.parse_args()

    if args.command == "stats":
        cmd_stats()
    elif args.command == "posts":
        cmd_posts(game=args.game, source=args.source, limit=args.limit)
    elif args.command == "logs":
        cmd_logs(limit=args.limit)


if __name__ == "__main__":
    main()
