# CRAI — Game Community Trend Detection System

게임 커뮤니티(Reddit · Bilibili · 인벤) 데이터를 자동 수집하고 AI 에이전트로 분석하여
주간 트렌드 리포트를 생성하는 시스템.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **백엔드** | Python 3.10+, FastAPI, APScheduler |
| **프론트엔드** | Next.js 14, TypeScript, Tailwind CSS, recharts |
| **DB** | PostgreSQL (AWS RDS) |
| **크롤링** | Apify (Reddit, Bilibili), crawl4ai + Playwright (인벤) |
| **인프라** | AWS EC2 (t3.small, us-east-1), AWS RDS |

---

## 프로젝트 구조

```
CRAI/
├── .env                        # API 키 및 DB 연결 정보 (git 제외)
├── .env.example                # 환경변수 템플릿
├── readme.md
├── ec2.md                      # EC2 서버 세팅 및 운영 가이드
├── ssh.bat                     # EC2 SSH 접속 스크립트 (Windows)
│
├── backend/
│   ├── requirements.txt
│   ├── api/
│   │   ├── main.py             # FastAPI 앱 진입점 (CORS, 라우터 등록, DB 초기화)
│   │   └── routers/
│   │       ├── posts.py        # GET /posts — 게시글 목록 (페이지네이션, 게임/소스 필터)
│   │       ├── stats.py        # GET /stats, GET /logs
│   │       ├── crawl.py        # POST /crawl — 수동 크롤링 트리거
│   │       └── reports.py      # GET/POST/DELETE /reports — 트렌드 리포트 CRUD
│   ├── crawlers/
│   │   ├── reddit_crawler.py   # Apify reddit-scraper-lite, r/Lineage 계열 4개 서브레딧
│   │   ├── bilibili_crawler.py # Apify bilibili-scraper, 게임별 중국어 키워드 검색
│   │   └── inven_crawler.py    # crawl4ai + Playwright, 6개 게임 자유게시판
│   ├── pipeline/
│   │   └── crawler_runner.py   # Reddit/Bilibili 병렬 실행 + 인벤 순차 실행 → DB 저장
│   ├── scheduler/
│   │   └── scheduler.py        # 시작 시 즉시 1회 + 6시간 간격 반복, 30일 만료 처리
│   ├── db/
│   │   ├── database.py         # RDS 연결, 테이블 초기화, CRUD, 만료 삭제
│   │   ├── preprocess.py       # HTML 태그 제거, 날짜 정규화, 빈 항목 필터
│   │   └── cli.py              # 터미널 DB 조회 CLI (stats / posts / logs)
│   └── utils/
│       └── config.py           # APIFY_API_TOKEN, DATABASE_URL, DATA_DIR
│
├── frontend/
│   ├── lib/
│   │   └── gameLabels.ts       # GAME_LABELS 상수 (컴포넌트 공통 사용)
│   ├── app/
│   │   ├── page.tsx            # 메인 대시보드 (수집 현황 + 게시글 목록 + AI 리포트)
│   │   ├── layout.tsx
│   │   └── api/                # Next.js → FastAPI 프록시 라우트
│   │       ├── posts/route.ts  # → GET /posts
│   │       ├── stats/route.ts  # → GET /stats
│   │       └── crawl/route.ts  # → POST /crawl
│   └── components/
│       ├── Sidebar.tsx         # 게임/소스 필터 사이드바
│       ├── StatsChart.tsx      # 게임별/소스별 수집 현황 막대 차트 (recharts)
│       ├── PostsTable.tsx      # 게시글 목록 테이블 (페이지네이션)
│       ├── CrawlButton.tsx     # 수동 크롤링 버튼 (진행 중 상태 표시)
│       └── TrendReport.tsx     # AI 트렌드 리포트 카드 (아코디언 상세 보기)
│
└── data/                       # 수집된 원시 데이터 로컬 JSON 백업 (30일 후 자동 삭제)
    ├── reddit/{game}/YYYY-MM-DD_HH-MM.json
    ├── bilibili/{game}/YYYY-MM-DD_HH-MM.json
    └── inven/{game}/YYYY-MM-DD_HH-MM.json
```

---

## 시스템 파이프라인

```
[커뮤니티] --6시간 주기 크롤링--> [DB] --30일 경과 데이터 자동 flush-->

[DB] --데이터--> [Analyzer] --분석 내용--> [Validator]
                    ↑                            |
                    |-----검증 불통과, 재생성-----|
                                                 |
                                    검증 통과, 최종 리포트 저장
                                                 |
                                                [DB]
                                                 |
                                     저장된 리포트 로드
                                                 |
[User] --리포트 요청--> [Dashboard] <-----------/
```

### Analyzer 내부 파이프라인 (6~9주차 구현 예정)

```
원시 데이터 (Reddit + Bilibili + 인벤)
  ↓
1. 필터 에이전트   → 필터 검증   (리니지 시리즈 무관 데이터 제거, 게임별 분류)
  ↓
2. 번역 에이전트   → 번역 검증   (중국어/영어 → 한국어 통일)
  ↓
3. 분류 에이전트   → 분류 검증   (핵/봇/치트, 업데이트/패치, 시세/경제, 여론/감정)
  ↓
4. 분석 에이전트   → 분석 검증   (트렌드 감지, 이상 징후 탐지)
  ↓
5. 보고서 에이전트 → 보고서 검증 (형식, 필수 항목 포함 여부)
  ↓
최종 리포트 → Validator
```

각 검증 실패 시 해당 에이전트 재시도. Validator 최종 검증 불통과 시 Analyzer 전체 재실행.

---

## DB 스키마

### `posts` — 수집된 게시글

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PK | |
| url | TEXT UNIQUE | 중복 저장 방지 키 |
| title | TEXT | HTML 태그 제거 후 저장 |
| content | TEXT | HTML 태그 제거 후 저장 |
| author | TEXT | |
| date | TEXT | `YYYY-MM-DD` 또는 `YYYY-MM-DD HH:MM` 정규화 |
| game | TEXT | `lineage_classic` / `lineage_remaster` / `lineage2` / `lineage_m` / `lineage2m` / `lineage_w` |
| source | TEXT | `reddit` / `bilibili` / `inven` |
| keyword | TEXT | Bilibili 검색 키워드 |
| views | TEXT | |
| recommend | TEXT | |
| raw | TEXT | 원본 JSON 전체 |
| created_at | TEXT | UTC ISO 문자열 |

> `created_at` 기준 30일 경과 시 스케줄러가 자동 삭제.

### `crawl_logs` — 크롤링 실행 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PK | |
| run_at | TEXT | UTC ISO 문자열 |
| source | TEXT | `reddit` / `bilibili` / `inven` |
| game | TEXT | |
| status | TEXT | `success` / `error` |
| count | INTEGER | 수집된 건수 |
| error_msg | TEXT | 에러 시 메시지 |

### `trend_reports` — AI 분석 리포트

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PK | |
| created_at | TEXT | UTC ISO 문자열 |
| game | TEXT | |
| period_start | TEXT | 분석 기간 시작 (`YYYY-MM-DD`) |
| period_end | TEXT | 분석 기간 종료 (`YYYY-MM-DD`) |
| summary | TEXT | 한 줄 요약 |
| category_filter | TEXT | 필터 에이전트 결과 |
| category_translation | TEXT | 번역 에이전트 결과 |
| category_classification | TEXT | 분류 에이전트 결과 |
| category_analysis | TEXT | 분석 에이전트 결과 |
| full_report | TEXT | 전체 리포트 마크다운 |
| keywords | TEXT | 키워드 콤마 구분 문자열 (조회 시 리스트로 변환) |
| trend_level | TEXT | `hot` / `rising` / `normal` |
| post_count | INTEGER | 분석에 사용된 게시글 수 |

---

## API 엔드포인트

백엔드: `http://localhost:8001` | Swagger UI: `http://localhost:8001/docs`

### 게시글

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/posts` | 게시글 목록 조회 |

**쿼리 파라미터**

| 파라미터 | 기본값 | 설명 |
|---------|--------|------|
| game | - | 게임 필터 (없으면 전체) |
| source | - | 소스 필터 (없으면 전체) |
| page | 1 | 페이지 번호 |
| limit | 20 | 페이지당 건수 (최대 100) |

**응답**
```json
{
  "posts": [...],
  "total": 1234,
  "page": 1,
  "totalPages": 62
}
```

### 통계 & 로그

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/stats` | 수집 통계 (전체/게임별/소스별 건수, 마지막 크롤링 시간) |
| GET | `/logs` | 크롤링 실행 로그 (최신순, `?limit=50`) |

**GET /stats 응답**
```json
{
  "total": 1234,
  "byGame": {"lineage_m": 500, "lineage2": 200, ...},
  "bySource": {"reddit": 300, "bilibili": 200, "inven": 734},
  "lastRun": "2026-04-28T10:00:00+00:00"
}
```

### 크롤링

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/crawl` | 크롤러 즉시 실행 (비동기, 수 분 소요) |

### 트렌드 리포트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/reports` | 리포트 목록 조회 (`?game=&limit=20`) |
| GET | `/reports/{id}` | 리포트 단건 조회 |
| POST | `/reports` | 리포트 저장 (AI 에이전트가 호출) |
| DELETE | `/reports/{id}` | 리포트 삭제 |

**POST /reports 바디**
```json
{
  "game": "lineage_m",
  "period_start": "2026-04-21",
  "period_end": "2026-04-28",
  "summary": "...",
  "category_filter": "...",
  "category_translation": "...",
  "category_classification": "...",
  "category_analysis": "...",
  "full_report": "...",
  "keywords": ["키워드1", "키워드2"],
  "trend_level": "hot",
  "post_count": 125
}
```

---

## 크롤링 타겟

| 플랫폼 | 방식 | 수집 내용 | 기간 |
|--------|------|-----------|------|
| **Reddit** | Apify `trudax/reddit-scraper-lite` | r/Lineage, r/lineage2, r/LineageM, r/LineageW | 최근 48시간 |
| **Bilibili** | Apify `zhorex/bilibili-scraper` | 게임별 중국어 키워드 (外挂/hack/bot/更新 등) | 최근 48시간 |
| **인벤** | crawl4ai + Playwright (직접 크롤링) | 리니지 클래식/리마스터/2/M/2M/W 자유게시판 (각 2페이지) | 최근 48시간 |

> Reddit: LineageOS(안드로이드 OS) 관련 글은 키워드 필터링으로 자동 제외 (`lineageos`, `android`, `rom`, `aosp` 등)

> 인벤: 목록 날짜(HH:MM, MM-DD) 파싱 후 상세 페이지에서 정확한 날짜 및 본문 재수집. 봇 차단 방지를 위해 요청 간 1초 대기.

### Bilibili 검색 키워드 (게임별)

| 게임 | 키워드 |
|------|--------|
| lineage_m | 天堂M 外挂, 天堂M hack, 天堂M cheat, 天堂M bot, 天堂M 脚本, 天堂M 辅助, 天堂M 更新, 天堂M 私服, lineage m hack, lineage m bot, lineage m update |
| lineage2 | 天堂2 外挂, 天堂2 hack, 天堂2 bot, 天堂2 更新, lineage2 hack |
| lineage_classic | 天堂经典 外挂, 天堂经典 脚本, 天堂经典 更新, lineage classic hack |
| lineage_remaster | 天堂重制版 外挂, 天堂重制版 更新, 天堂重制版 游戏 |
| lineage2m | 天堂2M 外挂, 天堂2M 更新, 天堂2M 游戏, lineage 2m hack |
| lineage_w | 天堂W 外挂, 天堂W 更新, lineage w hack |

---

## 데이터 전처리

`save_posts()` 호출 전 `preprocess.py`에서 자동 적용:

- title, content에서 HTML 태그 제거
- date 필드를 `YYYY-MM-DD` 또는 `YYYY-MM-DD HH:MM` 형식으로 통일 (ISO 8601, 슬래시 구분자, trailing Z, 타임존 오프셋 모두 처리)
- title 또는 url이 비어있는 항목 제거
- 모든 문자열 필드 앞뒤 공백 제거
- url 기준 중복 데이터 DB에서 자동 skip (`ON CONFLICT DO NOTHING`)

---

## 환경 설정

### 1. 패키지 설치

```bash
cd backend
pip install -r requirements.txt
playwright install chromium
```

```bash
cd frontend
npm install
```

### 2. .env 파일 생성 (프로젝트 루트 `CRAI/`)

```
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://user:password@your-rds-endpoint:5432/crai?sslmode=require
```

> `.env`는 git에 올라가지 않으므로 직접 생성해야 함.

---

## 실행

### 백엔드 (FastAPI)

```bash
cd backend
uvicorn api.main:app --reload --port 8001
# → http://localhost:8001
# → http://localhost:8001/docs  (Swagger UI)
```

### 프론트엔드 (Next.js)

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

> 프론트엔드는 `/api/*` 요청을 `localhost:8001`로 프록시. 백엔드가 먼저 실행되어야 함.

### 스케줄러 (EC2에서 실행)

```bash
cd backend
nohup python3 -m scheduler.scheduler > scheduler.log 2>&1 &

# 로그 확인
tail -f scheduler.log

# 실행 중인지 확인
ps aux | grep scheduler

# 중지
kill <PID>
```

시작 시 즉시 1회 실행 후 6시간 간격으로 반복. 실행마다 30일 만료 posts 및 로컬 JSON 파일 자동 삭제.

### 크롤러 수동 실행

```bash
cd backend
python -m pipeline.crawler_runner
```

---

## DB CLI

```bash
cd backend

# 수집 통계 (전체/게임별/소스별 건수)
python -m db.cli stats

# 게시글 목록 조회
python -m db.cli posts
python -m db.cli posts --game lineage_m --source inven --limit 50

# 크롤링 로그 조회
python -m db.cli logs
python -m db.cli logs --limit 20
```

---

## EC2 서버

> 상세 설정 및 운영 가이드: **[ec2.md](./ec2.md)**

| 항목 | 값 |
|------|-----|
| 인스턴스 ID | i-0b1ebb5edea89778f |
| 퍼블릭 IP | 98.80.229.24 |
| 유저명 | ubuntu |
| 키 페어 | ku-hys-01-key.pem |
| OS | Ubuntu 24.04 LTS |
| 인스턴스 타입 | t3.small, us-east-1 |

```powershell
# Windows PowerShell
ssh -i "C:\path\to\ku-hys-01-key.pem" ubuntu@98.80.229.24
```

EC2 코드 업데이트:
```bash
cd ~/CRAI
git pull origin main
```

> **주의:** 장기간 미사용 시 AWS 콘솔에서 **중지(Stop)** 해두세요. **종료(Terminate)는 인스턴스 삭제이므로 절대 누르지 말 것.**

---

## 역할 분담

| 담당 | 브랜치 | 작업 내용 |
|------|--------|----------|
| 팀장 | main / crawler | 크롤러 파이프라인, FastAPI 백엔드, AWS 연동, AI 분석 모듈 (예정) |
| 팀원 A | scheduler-db | DB 연동 (RDS), 데이터 전처리, 만료 처리, 크롤링 로그, 스케줄러, CLI |
| 팀원 B | dashboard | Next.js 대시보드 (수집 현황 차트, 데이터 테이블, 수동 실행 버튼, AI 리포트 UI) |

### 개발 일정

| 주차 | 진행 내용 |
|------|----------|
| 1~2주차 | 기획 확정 및 개발 환경 셋팅, 크롤러 및 DB 프로토타입 구현 |
| 3~5주차 | 데이터 파이프라인 안정화 및 대시보드 구축 (중간발표) |
| 6~9주차 | Analyzer/Validator 에이전트 코어 로직 구현 및 AI 연동 |
| 10~11주차 | 통합 테스트(QA) 및 오탐률 최적화, 최종 데모 빌드 완성 (최종발표) |

---

## 구현 현황

### 완료

- [x] 프로젝트 구조 설계 (backend / frontend 분리)
- [x] Reddit 크롤러 — 리니지 시리즈 전 게임, LineageOS 필터링
- [x] Bilibili 크롤러 — 게임별 키워드 검색
- [x] 인벤 크롤러 — 6개 게임 자유게시판 (crawl4ai + Playwright), KST 날짜 처리, 상세 페이지 본문 수집
- [x] pipeline/crawler_runner.py — Reddit/Bilibili 병렬 실행, RDS 자동 저장, 중복 skip
- [x] 데이터 전처리 — HTML 태그 제거, 날짜 정규화, 빈 항목 필터
- [x] DB 연동 (AWS RDS PostgreSQL) — posts, crawl_logs, trend_reports 테이블
- [x] 스케줄러 — 6시간 정기 실행, 30일 만료 데이터 자동 삭제 (posts + 로컬 JSON)
- [x] FastAPI 백엔드 — /posts, /stats, /logs, /crawl, /reports (port 8001)
- [x] Next.js 대시보드 — 수집 현황 차트, 게임/소스별 필터, 게시글 테이블, 수동 크롤링 버튼
- [x] TrendReport 컴포넌트 — 리포트 카드 + 아코디언 상세 보기 (더미 데이터로 UI 완성)
- [x] AWS EC2 + RDS 연동
- [x] 크롤링 로그 기록 (crawl_logs) 및 마지막 크롤링 시간 표시
- [x] DB CLI — stats / posts / logs 조회

### 미완료 (6~9주차)

- [ ] AI 분석 모듈 (Claude API)
  - [ ] 필터 에이전트 — 리니지 무관 데이터 제거, 게임별 분류
  - [ ] 번역 에이전트 — 중국어/영어 → 한국어
  - [ ] 분류 에이전트 — 핵/봇, 업데이트, 시세, 여론 카테고리
  - [ ] 분석 에이전트 — 트렌드 감지, 이상 징후 탐지
  - [ ] 보고서 에이전트 — 최종 리포트 생성
- [ ] Validator — 각 에이전트 검증 및 재시도 로직
- [ ] 대시보드 AI 리포트 섹션 — 더미 데이터 → 실제 `/reports` API 연동
