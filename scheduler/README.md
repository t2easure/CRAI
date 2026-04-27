# Scheduler + DB 가이드

## 스케줄러 역할

`scheduler/scheduler.py`는 크롤링 파이프라인을 자동 실행합니다.

- 시작 시 `run_all()`을 즉시 1회 실행
- 이후 6시간 간격으로 반복 실행
- 실행 시작/종료 로그 출력
- 실행 완료 후 만료 데이터 정리
  - `delete_expired_posts(days=30)`
  - `delete_expired_json_files(days=30)`

실행:

```bash
python -m scheduler.scheduler
```

## DB 위치 및 테이블 구조

- DB 파일: `data/crai.db`
- 주요 테이블:
  - `posts`
    - 수집 게시글 저장
    - `url`은 UNIQUE (중복 URL은 저장 skip)
  - `crawl_logs`
    - 크롤링 실행 기록 저장
    - source/game/status/count/error_msg 포함

## DB 조회 함수 사용 예시

```python
from db.database import get_posts, get_stats, get_crawl_logs

# 게시글 조회 (필터 optional)
rows = get_posts(game="lineage_m", source="inven")

# 통계 조회
stats = get_stats()
print(stats["total"], stats["by_game"], stats["by_source"])

# 최근 실행 로그 조회
logs = get_crawl_logs(limit=20)
print(logs)
```

## CLI 사용 예시

`db/cli.py`는 간단한 조회용 커맨드 인터페이스를 제공합니다.

```bash
# 전체/게임별/소스별 통계
python -m db.cli stats

# 게시글 조회 (옵션 필터)
python -m db.cli posts --game lineage_m --source inven --limit 10

# 최근 실행 로그
python -m db.cli logs --limit 20
```
