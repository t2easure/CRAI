# CRAI - Game Community Trend Detection System

게임 커뮤니티 데이터를 수집하고 AI로 분석하는 트렌드 감지 시스템.

## 현재 단계: MVP - 데이터 크롤링 파이프라인

---

## 크롤링 타겟

| 플랫폼 | 방식 | Actor / 도구 | 수집 내용 |
|--------|------|-------------|-----------|
| **Reddit** | Apify | `trudax/reddit-scraper-lite` | r/Lineage, r/lineage2, r/LineageM, r/LineageW |
| **Bilibili** | Apify | `zhorex/bilibili-scraper` | 리니지 시리즈 게임별 키워드 영상 |
| **인벤 자유게시판** | crawl4ai (직접 크롤링) | — | 리니지 클래식/리마스터/2/M/2M/W 자유게시판 |

> 수집 데이터 전체에 `game` 필드 포함 (lineage_classic / lineage_remaster / lineage2 / lineage_m / lineage2m / lineage_w)
> 리니지 시리즈 무관 데이터(키워드 오염분) 판별은 AI 분석 단계에서 처리
> Reddit: LineageOS(안드로이드 OS) 관련 글은 키워드 필터링으로 자동 제외

---

## 기술 스택

- **Python** 3.10+
- **apify-client** — Reddit, Bilibili 크롤링
- **crawl4ai** — 인벤 크롤링 (Playwright 기반)
- **python-dotenv** — 환경변수 관리

---

## 프로젝트 구조

```
CheatHunterAI/
├── .env                  # API 키 (git 제외)
├── .env.example          # 환경변수 템플릿
├── requirements.txt
│
├── crawlers/             # 플랫폼별 크롤러 모듈
│   ├── reddit_crawler.py
│   ├── bilibili_crawler.py
│   └── inven_crawler.py
│
├── pipeline/             # 전체 파이프라인 조율
│   └── crawler_runner.py
│
├── data/                 # 수집된 원시 데이터 (플랫폼/게임별 디렉토리)
│   ├── reddit/
│   │   ├── lineage_classic/
│   │   ├── lineage_remaster/
│   │   ├── lineage2/
│   │   ├── lineage_m/
│   │   ├── lineage2m/
│   │   └── lineage_w/
│   ├── bilibili/
│   │   └── (게임별 동일 구조)
│   ├── inven/
│   │   └── (게임별 동일 구조)
│   └── last_run.json     # 마지막 실행 시점 기록
│
└── utils/
    └── config.py         # 환경변수, last_run 관리
```

---

## 시스템 파이프라인

### 전체 흐름

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

Analyzer는 DB에서 원시 데이터를 받아 아래 단계를 순서대로 처리:

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

### 레포트 생성 트리거
- **자동**: 6시간 정기 실행
- **수동**: 사용자가 Dashboard에서 버튼 클릭 시 즉시 생성

---

## 환경 설정

### 1. 패키지 설치
```bash
pip install -r requirements.txt
playwright install chromium
```

### 2. Apify API 토큰 발급
1. [Apify Console](https://console.apify.com/account/integrations) 접속 후 로그인
2. **Default API token** 옆 복사 버튼 클릭

### 3. .env 파일 생성
프로젝트 루트에 `.env` 파일 생성 후 토큰 입력:
```
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxxxxx
```
> `.env`는 `.gitignore`에 포함되어 있어 git에 업로드되지 않음

---

## 실행

전체 파이프라인 (Reddit + Bilibili 병렬 실행, 인벤 순차 실행):
```bash
python -m pipeline.crawler_runner
```

개별 크롤러 실행:
```bash
python -m crawlers.reddit_crawler
python -m crawlers.bilibili_crawler
python -m crawlers.inven_crawler
```

---

## 데이터 수집 로직

- **마지막 실행 시점 기준** 수집: `data/last_run.json`에 저장된 시점 이후 데이터만 수집
- 첫 실행 시 기본값: 24시간 이내
- 실행 완료 후 `last_run.json` 자동 업데이트
- 파일명 형식: `YYYY-MM-DD_HH-MM.json` (같은 날 여러 번 실행해도 덮어쓰지 않음)
- **저장 구조**: `data/{플랫폼}/{game}/YYYY-MM-DD_HH-MM.json` 형태로 게임별 디렉토리 분리
- 모든 수집 데이터에 `game`, `source` 필드 포함
- **6시간 정기 실행** 또는 **사용자 수동 실행** 모두 지원

---

## 인벤 자유게시판 타겟

| 게임 | URL |
|------|-----|
| 리니지 클래식 | `inven.co.kr/board/lineageclassic/6482` |
| 리니지 리마스터 | `inven.co.kr/board/lineage/339` |
| 리니지2 | `inven.co.kr/board/lineage2/381` |
| 리니지M | `inven.co.kr/board/lineagem/5019` |
| 리니지2M | `inven.co.kr/board/lineage2m/5522` |
| 리니지W | `inven.co.kr/board/lineagew/5831` |

---

## Reddit 타겟 서브레딧

| 게임 | 서브레딧 |
|------|---------|
| 리니지 리마스터 | r/Lineage |
| 리니지2 | r/lineage2 |
| 리니지M | r/LineageM |
| 리니지W | r/LineageW |

> LineageOS(안드로이드 OS) 관련 글은 키워드 필터링으로 자동 제외

---

## 개발 로그

### 2026-04-26 ~ 04-27

**크롤링 타겟 선정 과정**
- 초기 타겟: Discord, Bilibili, 인벤
- Discord → Lineage II Official 서버 인증 필요로 보류
- YouTube → 수집 데이터 대부분 16년 전 영상으로 트렌드 탐지 부적합, Bilibili로 교체
- 타겟 게임: 리니지2 → 리니지 클래식 → 리니지M → **리니지 시리즈 전체**로 확장
- 중국 소스 탐색: NGA(로그인 필요), Baidu Tieba(게시판 없음 / 403 봇 차단) 모두 실패
- **최종 확정: Reddit + Bilibili + 인벤 (리니지 시리즈 전 게임)**

**Reddit 크롤러**
- `trudax/reddit-scraper-lite` 선택 (평점 4.3, 20K 사용자)
- r/Lineage, r/lineage2, r/LineageM, r/LineageW 수집
- LineageOS(안드로이드 OS) 관련 글 키워드 필터링으로 자동 제외
- 각 아이템에 `game`, `source` 필드 추가
- 테스트 실행 성공 (Apify 월 한도 소진으로 5/26 이후 재테스트 필요)

**Bilibili 크롤러**
- 멘토 추천 `kuaima/bilibili` → 유료 actor($20/월) 확인, `zhorex/bilibili-scraper`로 교체 (무료)
- 게임별 키워드 구성 (天堂M/天堂2/天堂经典 등 핵/치트/봇/자동사냥/업데이트/서버)
- 각 아이템에 `game`, `keyword`, `source` 필드 추가
- 테스트 실행 성공 (Apify 월 한도 소진으로 5/26 이후 재테스트 필요)
- 데이터 오염 이슈: 키워드 오염분은 AI 분석 단계에서 필터링 예정

**인벤 크롤러**
- crawl4ai + Playwright 기반 직접 크롤링
- 리니지 시리즈 6개 게임 자유게시판 전체 수집
- `JsonCssExtractionStrategy` + `CrawlerRunConfig` 사용
- 수집 항목: 제목, URL, 카테고리, 작성자, 날짜, 조회수, 추천수, game, source
- 페이지당 1.5초 딜레이 (IP 차단 방지)
- 테스트 실행 성공 → **185건 수집 확인** (클래식 66, M 60, 2M 34, 리마스터 16, W 6, 2 3)

**파이프라인**
- `pipeline/crawler_runner.py`: Reddit + Bilibili 병렬 실행, 인벤 순차 실행
- 마지막 실행 시점(`last_run.json`) 기록 후 다음 실행 시 해당 시점 이후 데이터만 수집
- 저장 구조: `data/{플랫폼}/{game}/YYYY-MM-DD_HH-MM.json` (게임별 디렉토리 분리)
- 6시간 정기 크롤링 및 사용자 수동 실행 모두 지원

**Apify 사용량**
- 무료 플랜 월 한도 소진 (2026-04-27 기준, 5/26 초기화 예정)
- Reddit/Bilibili는 5/26 이후 재테스트 필요
- 장기적으로 Reddit 공식 API 또는 유료 플랜 검토 필요

---

## 구현 현황

- [x] 프로젝트 구조 설계
- [x] requirements.txt
- [x] utils/config.py (환경변수 로딩, last_run 관리)
- [x] Reddit 크롤러 — 리니지 시리즈 전 게임, LineageOS 필터링, game 필드
- [x] Bilibili 크롤러 — 게임별 키워드, game 필드
- [x] 인벤 크롤러 — 6개 게임 자유게시판, 185건 수집 확인
- [x] pipeline/crawler_runner.py — 병렬 실행, 게임별 디렉토리 저장
- [ ] AI 분석 모듈 (Claude API 연동, 리니지 시리즈 관련 여부 판별, 카테고리 분류)
- [ ] 보고서 생성 모듈
- [ ] 스케줄러 (6시간 정기 실행)
- [ ] DB 연동 (JSON 파일 → DB 전환)
- [ ] Streamlit 대시보드 (레포트 조회, 수동 실행 버튼)
