import re
from datetime import datetime


TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(value: str) -> str:
    return TAG_RE.sub("", value or "")


def _normalize_date(raw: str) -> str:
    value = (raw or "").strip()
    if not value:
        return ""

    candidates = [
        ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M"),
        ("%Y-%m-%d", "%Y-%m-%d"),
        ("%Y/%m/%d %H:%M", "%Y-%m-%d %H:%M"),
        ("%Y/%m/%d", "%Y-%m-%d"),
        ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M"),
        ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%d %H:%M"),
    ]

    # trailing Z is common in API payloads
    value = value.replace("Z", "")
    # timezone offset like +00:00
    value = re.sub(r"([+-]\d{2}:\d{2})$", "", value).strip()

    for src_fmt, dst_fmt in candidates:
        try:
            return datetime.strptime(value, src_fmt).strftime(dst_fmt)
        except ValueError:
            continue

    return value


def preprocess(items: list[dict]) -> list[dict]:
    """
    raw 데이터 정제. 아래 처리 수행:
    - title, content에서 HTML 태그 제거
    - date 필드를 'YYYY-MM-DD' 또는 'YYYY-MM-DD HH:MM' 형식으로 통일
    - title, url이 비어있는 아이템 제거
    - 문자열 필드 앞뒤 공백 제거
    """
    cleaned_items: list[dict] = []

    for raw_item in items:
        item = dict(raw_item)

        for key, value in list(item.items()):
            if isinstance(value, str):
                item[key] = value.strip()

        title = _strip_html(item.get("title", ""))
        content_key = "content" if "content" in item else ("body" if "body" in item else "")
        if content_key:
            item[content_key] = _strip_html(item.get(content_key, ""))

        item["title"] = title.strip()
        item["date"] = _normalize_date(
            item.get("date") or item.get("publishDate") or item.get("createdAt") or ""
        )

        if not item.get("title") or not item.get("url"):
            continue

        cleaned_items.append(item)

    return cleaned_items
