# CRAI - Game Community Trend Detection System

게임 커뮤니티 데이터를 수집하고 AI로 분석하는 트렌드 감지 시스템.

## 현재 단계: MVP - 데이터 크롤링 파이프라인

---

## 크롤링 타겟

| 플랫폼 | 방식 | 수집 내용 |
|--------|------|-----------|
| **Reddit** | Apify (`dead00/reddit-post-scrapper`) | r/lineage2 등 서브레딧 게시글 + 댓글 |
| **YouTube** | Apify (`danek/youtube-search`) | "lineage2 hack" 등 키워드 검색 결과 영상 메타데이터 |
| **인벤 자유게시판** | crawl4ai (직접 크롤링) | 국내 리니지 커뮤니티 여론 |

Reddit·YouTube는 Apify 클라우드로, 인벤은 crawl4ai로 분산 수집한다.

---

## 기술 스택

- **Python** 3.10+
- **apify-client** — Reddit, YouTube 크롤링
- **crawl4ai** — 인벤 크롤링
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
│   ├── youtube_crawler.py
│   └── inven_crawler.py
│
├── pipeline/             # 전체 파이프라인 조율
│   └── runner.py
│
├── data/                 # 수집된 원시 데이터
│   ├── reddit/
│   ├── youtube/
│   └── inven/
│
└── utils/
    └── config.py         # 환경변수 로딩, 공통 상수
```

---

## 환경 설정

### 1. 패키지 설치
```bash
pip install -r requirements.txt
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

## 구현 현황

- [x] 프로젝트 구조 설계
- [x] requirements.txt
- [x] utils/config.py (환경변수 로딩)
- [ ] Reddit 크롤러
- [ ] YouTube 크롤러
- [ ] 인벤 크롤러
- [ ] pipeline/runner.py (통합 실행)
