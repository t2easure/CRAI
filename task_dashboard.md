# Claude Code 작업 지시서 — Next.js 대시보드

아래 내용을 읽고 순서대로 구현해줘. 모든 작업은 `dashboard` 브랜치에서 진행해.

---

## 브랜치 설정

```bash
git checkout dashboard
```

---

## 기술 스택

- **백엔드**: FastAPI (`api/main.py`) — `/posts`, `/stats`, `/logs`, `/crawl` 엔드포인트
- **프론트**: Next.js 14 App Router + TypeScript (`dashboard/`)

---

## 현재 프로젝트 구조

```
CRAI/
├── api/
│   └── main.py              ← FastAPI 백엔드 (완료)
│
└── dashboard/               ← Next.js 프론트
    ├── app/
    │   ├── page.tsx
    │   ├── layout.tsx
    │   ├── globals.css
    │   └── api/
    │       ├── posts/route.ts
    │       ├── stats/route.ts
    │       └── crawl/route.ts
    └── components/
        ├── Sidebar.tsx
        ├── StatsChart.tsx
        ├── PostsTable.tsx
        └── CrawlButton.tsx
```

---

## FastAPI 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/posts` | 게시글 조회. 쿼리: `game`, `source`, `page`, `limit` |
| GET | `/stats` | 전체/게임별/소스별 수집 건수 |
| GET | `/logs` | 최근 크롤링 실행 로그 |
| POST | `/crawl` | 크롤러 즉시 실행 |

---

## 작업 1 — Next.js API Routes → FastAPI 호출로 교체

현재 `app/api/` 의 route.ts 파일들이 `data/` 폴더 JSON을 직접 읽는 방식으로 되어 있음.
이를 FastAPI(`http://localhost:8000`)를 호출하는 방식으로 교체.

### `app/api/posts/route.ts`
```typescript
// FastAPI GET /posts 호출로 교체
const res = await fetch(`http://localhost:8000/posts?${searchParams}`)
return NextResponse.json(await res.json())
```

### `app/api/stats/route.ts`
```typescript
// FastAPI GET /stats 호출로 교체
const res = await fetch('http://localhost:8000/stats')
return NextResponse.json(await res.json())
```

### `app/api/crawl/route.ts`
```typescript
// FastAPI POST /crawl 호출로 교체
const res = await fetch('http://localhost:8000/crawl', { method: 'POST' })
return NextResponse.json(await res.json())
```

작업 완료 후 push:
```bash
git add dashboard/app/api/
git commit -m "feat: Next.js API Routes → FastAPI 연동으로 교체"
git push origin dashboard
```

---

## 실행 방법

### 백엔드
```bash
# 프로젝트 루트에서
uvicorn api.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger UI)
```

### 프론트
```bash
cd dashboard
npm install
npm run dev
# → http://localhost:3000
```

---

## 추후 작업

- FastAPI에 `/reports` 엔드포인트 추가 (AI 분석 결과 연동)
- `page.tsx` 리포트 섹션 실제 데이터로 교체

**머지는 하지 말 것. 팀장이 직접 머지함.**
