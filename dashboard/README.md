# CheatHunterAI Dashboard

CheatHunterAI 프로젝트의 게임 커뮤니티 수집 데이터를 시각화하고 크롤러를 제어하는 Next.js 대시보드입니다.

## 역할 및 기능

- 크롤러가 수집한 게시글 현황 실시간 조회
- 게임별 / 소스별 수집 건수 차트 시각화
- 게임 및 소스 필터링 + 페이지네이션 게시글 목록
- 브라우저에서 크롤러 파이프라인 즉시 실행

## 실행 방법

```bash
cd dashboard
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

> 루트의 `.env` 파일에 `APIFY_API_TOKEN`이 설정되어 있어야 크롤링이 정상 동작합니다.

## API 엔드포인트

### `GET /api/posts`

수집된 게시글 목록을 반환합니다. (페이지네이션)

| 파라미터 | 설명 | 기본값 |
|---|---|---|
| `game` | 게임 필터 (`lineage_classic`, `lineage_remaster`, `lineage2`, `lineage_m`, `lineage2m`, `lineage_w`) | 전체 |
| `source` | 소스 필터 (`reddit`, `bilibili`, `inven`) | 전체 |
| `page` | 페이지 번호 | `1` |
| `limit` | 페이지당 건수 | `20` |

**응답 예시**

```json
{
  "posts": [...],
  "total": 340,
  "page": 1,
  "totalPages": 17
}
```

### `GET /api/stats`

전체 수집 현황 통계를 반환합니다.

**응답 예시**

```json
{
  "total": 340,
  "byGame": { "lineage_classic": 131, "lineage2": 16, ... },
  "bySource": { "inven": 317, "reddit": 6, "bilibili": 17 },
  "lastRun": "2026-04-27T00:07:00.000Z"
}
```

### `POST /api/crawl`

크롤러 파이프라인(`pipeline.crawler_runner`)을 실행합니다.

**응답 예시**

```json
{ "success": true, "message": "..." }
```

## 향후 연동 계획

### DB 연동

현재는 `data/` 디렉토리의 JSON 파일을 직접 읽습니다.  
추후 PostgreSQL 등 DB로 이관할 경우 `app/api/posts/route.ts`의 파일 읽기 로직을 DB 쿼리로 교체하면 됩니다.

### AI 분석 리포트 연동

메인 페이지 하단에 "AI 분석 리포트" 섹션이 준비되어 있습니다.  
AI 분석 결과가 생성되면 `/api/reports` 엔드포인트를 추가하고 해당 섹션 컴포넌트를 구현하면 됩니다.
