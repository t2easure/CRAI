# CRAI - Game Community Trend Detection System

게임 커뮤니티 데이터를 수집하고 AI로 분석하는 트렌드 감지 시스템.

## 현재 단계: MVP - 데이터 크롤링 파이프라인

---

## 크롤링 타겟

| 플랫폼 | 방식 | 선정 이유 |
|--------|------|-----------|
| **Discord** | Apify (`curious_coder/discord-data-scraper`) | 특정 오픈 서버/채널 메시지 수집. Apify 클라우드 사용으로 학교 IP 차단 위험 없음 |
| **Bilibili** | Apify (`kuaima/bilibili`) | 글로벌 게임 트렌드 영상, 핵 튜토리얼 등. Discord로 유저 유입되는 1차 경로 |
| **인벤 자유게시판** | crawl4ai (직접 크롤링) | 국내 게임 여론 파악용 기존 타겟 |

Discord·Bilibili는 Apify 클라우드로, 인벤은 crawl4ai로 분산 수집한다.

---

## 기술 스택

- **Python** 3.10+
- **apify-client** — Discord, Bilibili 크롤링
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
│   ├── discord_crawler.py
│   ├── bilibili_crawler.py
│   └── inven_crawler.py
│
├── pipeline/             # 전체 파이프라인 조율
│   └── runner.py
│
├── data/                 # 수집된 원시 데이터
│   ├── discord/
│   ├── bilibili/
│   └── inven/
│
└── utils/
    └── config.py         # 환경변수 로딩, 공통 상수
```

---

## 환경 설정

```bash
pip install -r requirements.txt
cp .env.example .env
# .env에 APIFY_API_TOKEN 입력
```

---

## 구현 현황

- [x] 프로젝트 구조 설계
- [x] requirements.txt
- [x] utils/config.py (환경변수 로딩)
- [ ] Discord 크롤러
- [ ] Bilibili 크롤러
- [ ] 인벤 크롤러
- [ ] pipeline/runner.py (통합 실행)
