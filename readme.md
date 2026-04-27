# CRAI - Game Community Trend Detection System

게임 커뮤니티 데이터를 수집하고 AI로 분석하는 트렌드 감지 시스템.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **백엔드** | Python 3.10+, FastAPI, APScheduler |
| **프론트엔드** | Next.js 14, TypeScript, Tailwind CSS, recharts |
| **DB** | PostgreSQL (AWS RDS) |
| **크롤링** | Apify (Reddit, Bilibili), crawl4ai + Playwright (인벤) |
| **인프라** | AWS EC2, AWS RDS |

---

## 프로젝트 구조

```
CRAI/
├── .env                    # API 키 및 DB 연결 정보 (git 제외)
├── .env.example            # 환경변수 템플릿
├── readme.md
├── ssh.bat                 # EC2 SSH 접속 스크립트
│
├── backend/
│   ├── requirements.txt
│   ├── api/
│   │   ├── main.py         # FastAPI 앱 진입점
│   │   └── routers/
│   │       ├── posts.py    # GET /posts
│   │       ├── stats.py    # GET /stats, GET /logs
│   │       ├── crawl.py    # POST /crawl
│   │       └── reports.py  # GET/POST /reports (AI 연동 예정)
│   ├── crawlers/
│   │   ├── reddit_crawler.py
│   │   ├── bilibili_crawler.py
│   │   └── inven_crawler.py
│   ├── pipeline/
│   │   └── crawler_runner.py   # 전체 크롤러 병렬 실행
│   ├── scheduler/
│   │   └── scheduler.py        # 6시간 정기 실행
│   ├── db/
│   │   ├── database.py         # RDS 연결, CRUD, 로그
│   │   ├── preprocess.py       # 데이터 전처리
│   │   └── cli.py              # DB CLI 유틸
│   └── utils/
│       └── config.py           # 환경변수, last_run 관리
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # 메인 대시보드
│   │   ├── layout.tsx
│   │   └── api/                # FastAPI 프록시 라우트
│   │       ├── posts/route.ts
│   │       ├── stats/route.ts
│   │       └── crawl/route.ts
│   └── components/
│       ├── Sidebar.tsx         # 게임/소스 필터
│       ├── StatsChart.tsx      # 수집 현황 차트
│       ├── PostsTable.tsx      # 게시글 목록 테이블
│       └── CrawlButton.tsx     # 수동 크롤링 버튼
│
└── data/                   # 수집된 원시 데이터 (로컬 백업)
    ├── reddit/
    ├── bilibili/
    ├── inven/
    └── last_run.json
```

---

## 시스템 파이프라인

```
[Community] --6시간 주기 크롤링--> [DB] --30일 경과 데이터 자동 flush-->

[DB] --data--> [Analyzer] --분석 내용 검증--> [Validator]
                  ↑                                 |
                  |--------검증 불통과, 재생성-------|
                                                    |
                                       검증 통과, 최종 레포트 저장
                                                    |
                                                   [DB]
                                                    |
                                        저장된 레포트 로드
                                                    |
[User] --레포트 요청--> [Dashboard] <---------------/
```

### Analyzer 내부 파이프라인

```
원시 데이터 (Reddit + Bilibili + 인벤)
  ↓
1. 필터 에이전트      → 필터 검증   (리니지 시리즈 무관 데이터 제거, 게임별 분류)
  ↓
2. 번역 에이전트      → 번역 검증   (중국어/영어 → 한국어 통일)
  ↓
3. 분류 에이전트      → 분류 검증   (핵/봇/치트, 업데이트/패치, 시세/경제, 여론/감정)
  ↓
4. 분석 에이전트      → 분석 검증   (트렌드 감지, 이상 징후 탐지)
  ↓
5. 보고서 에이전트    → 보고서 검증 (형식, 필수 항목 포함 여부)
  ↓
최종 레포트 → Validator
```

각 검증 실패 시 해당 에이전트 재시도. Validator 최종 검증 불통과 시 Analyzer 전체 재실행.

---

## 환경 설정

### 1. 패키지 설치
```bash
cd backend
pip install -r requirements.txt
playwright install chromium
```

### 2. .env 파일 생성
```
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://user:password@your-rds-endpoint:5432/crai
```

---

## 실행

### 백엔드 (FastAPI)
```bash
cd backend
uvicorn api.main:app --reload --port 8001
# → http://localhost:8001
# → http://localhost:8001/docs (Swagger UI)
```

### 프론트엔드 (Next.js)
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 스케줄러 (EC2에서 실행)
```bash
cd backend
nohup python -m scheduler.scheduler > scheduler.log 2>&1 &
```

### 크롤러 수동 실행
```bash
cd backend
python -m pipeline.crawler_runner
```

---

## 크롤링 타겟

| 플랫폼 | 방식 | 수집 내용 |
|--------|------|-----------|
| **Reddit** | Apify `trudax/reddit-scraper-lite` | r/Lineage, r/lineage2, r/LineageM, r/LineageW |
| **Bilibili** | Apify `zhorex/bilibili-scraper` | 리니지 시리즈 게임별 키워드 영상 |
| **인벤** | crawl4ai (직접 크롤링) | 리니지 클래식/리마스터/2/M/2M/W 자유게시판 |

> Reddit: LineageOS(안드로이드 OS) 관련 글은 키워드 필터링으로 자동 제외

---

## 역할 분담

| 담당 | 브랜치 | 작업 내용 |
|------|--------|----------|
| 팀장 | main / crawler | 크롤러 파이프라인, FastAPI 백엔드, AWS 연동, AI 분석 모듈 (예정) |
| 팀원 A | scheduler-db | DB 연동 (RDS), 데이터 전처리, 만료 처리, 크롤링 로그, 스케줄러, CLI |
| 팀원 B | dashboard | Next.js 대시보드 (수집 현황 차트, 데이터 테이블, 수동 실행 버튼) |

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
- [x] 인벤 크롤러 — 6개 게임 자유게시판 (crawl4ai + Playwright), KST 날짜 처리
- [x] pipeline/crawler_runner.py — Reddit/Bilibili 병렬 실행, RDS 자동 저장, 중복 skip
- [x] DB 연동 (AWS RDS PostgreSQL) — posts, crawl_logs 테이블
- [x] 스케줄러 — 6시간 정기 실행, 30일 만료 데이터 자동 삭제
- [x] FastAPI 백엔드 — /posts, /stats, /crawl, /reports (port 8001)
- [x] Next.js 대시보드 — 수집 현황 차트, 게임/소스별 필터, 게시글 테이블, 수동 크롤링 버튼
- [x] AWS EC2 + RDS 연동
- [x] 크롤링 로그 기록 (crawl_logs) 및 마지막 크롤링 시간 표시

### 미완료 (6~9주차)
- [ ] AI 분석 모듈 (Claude API)
  - [ ] 필터 에이전트 — 리니지 무관 데이터 제거, 게임별 분류
  - [ ] 번역 에이전트 — 중국어/영어 → 한국어
  - [ ] 분류 에이전트 — 핵/봇, 업데이트, 시세, 여론 카테고리
  - [ ] 분석 에이전트 — 트렌드 감지, 이상 징후 탐지
  - [ ] 보고서 에이전트 — 최종 리포트 생성
- [ ] Validator — 각 에이전트 검증 및 재시도 로직
- [ ] 보고서 저장 (trend_reports 테이블) 및 조회 UI
