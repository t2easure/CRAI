'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Sidebar, { type Tab } from '@/components/Sidebar'
import StatsChart from '@/components/StatsChart'
import PostsTable from '@/components/PostsTable'
import CrawlButton from '@/components/CrawlButton'
import TrendReport, { type Report } from '@/components/TrendReport'
import DataTab from '@/components/DataTab'
import type { Post } from '@/app/api/posts/route'
import { GAME_LABELS } from '@/lib/gameLabels'

const DUMMY_REPORTS: Report[] = [
  {
    id: 1,
    created_at: '2026-04-28T10:00:00',
    game: 'lineage_m',
    period_start: '2026-04-21',
    period_end: '2026-04-28',
    summary: '다이아 아이템 시세가 전주 대비 40% 이상 급등하며 거래소 비정상 신호가 관측됩니다.',
    category_filter: '총 125건 수집, 광고/도배 8건 제거, 유효 117건',
    category_translation: '중국어 게시글 14건 번역 완료 (Bilibili)',
    category_classification: '경제/거래 48% · 여론 28% · 핵/봇 14% · 업데이트 10%',
    category_analysis: `다이아 거래 가격이 단기간에 급등하면서 "작업장 의심", "시세 조작" 키워드가 동시에 증가했습니다. 인벤 자유게시판에서는 환전소 이상 징후에 대한 제보 글이 집중되었고, Bilibili에서도 유사한 패턴의 게시글이 관측되어 단일 서버가 아닌 전체 서비스에 걸친 현상으로 판단됩니다. 운영사 대응 여부가 다음 주 여론 방향을 결정할 것으로 보입니다.`,
    full_report: `## 리니지M 경제 이상 신호 리포트 (2026-04-21 ~ 04-28)

### 핵심 요약
다이아 아이템 시세 급등 및 거래소 비정상 패턴 감지. 작업장 활동 의심 신호 복수 플랫폼에서 동시 관측.

### 주요 관측 내용

**인벤 (한국)**
- "다이아 시세 왜 이렇게 올랐냐" 류 게시글 23건 집중
- 거래소 시세 스크린샷 첨부 제보 11건
- "작업장 또 활개친다" 직접 언급 게시글 8건

**Bilibili (중국)**
- 天堂M 외부 툴 관련 영상 조회수 급증 (평균 대비 3.2배)
- 거래 관련 키워드 게시글 전주 대비 +41%

### 분류 비율
경제/거래 48% · 여론 28% · 핵/봇 14% · 업데이트 10%

### 위험도 평가
**높음** — 복수 플랫폼 동시 감지, 단기 급등 패턴`,
    keywords: ['다이아', '시세', '작업장', '거래소', '급등'],
    trend_level: 'hot',
    post_count: 117,
    source_focus: ['inven', 'bilibili'],
    issue_category: '시세/거래',
  },
  {
    id: 2,
    created_at: '2026-04-28T10:00:00',
    game: 'lineage_classic',
    period_start: '2026-04-21',
    period_end: '2026-04-28',
    summary: '4월 정기 패치 이후 밸런스 조정에 대한 긍정/부정 반응이 혼재하며 여론이 갈립니다.',
    category_filter: '총 134건 수집, 광고 12건 제거, 유효 122건',
    category_translation: '번역 대상 없음 (전체 한국어)',
    category_classification: '업데이트/패치 45% · 여론 30% · 경제 15% · 기타 10%',
    category_analysis: `4월 28일 정기 패치 이후 특정 직업 밸런스 조정을 두고 커뮤니티 의견이 양분되고 있습니다. 긍정 반응은 "오랜 숙원이 해결됐다"는 방향이며, 부정 반응은 "다른 직업과의 격차가 더 벌어졌다"는 밸런스 우려입니다. 패치 노트 내용 자체에 대한 관심도가 평소보다 높아 이번 주 인벤 조회수 상위 게시글 다수가 패치 관련 글로 채워졌습니다.`,
    full_report: `## 리니지 클래식 업데이트 반응 리포트 (2026-04-21 ~ 04-28)

### 핵심 요약
4월 정기 패치 밸런스 조정에 대한 커뮤니티 반응 양분. 긍정 우세이나 특정 직업 유저 이탈 신호 감지.

### 주요 관측 내용

**인벤 (한국)**
- 패치 노트 관련 게시글 55건 (전체의 45%)
- 긍정 반응: "드디어 고쳤다", "오래 기다렸다" — 32건
- 부정 반응: "다른 직업은요?", "밸런스 더 망가짐" — 23건
- 패치 이후 특정 직업 커뮤니티 내 이탈 언급 7건

### 분류 비율
업데이트/패치 45% · 여론 30% · 경제 15% · 기타 10%

### 위험도 평가
**보통** — 긍정 우세이나 일부 직업군 불만 지속 모니터링 필요`,
    keywords: ['패치', '밸런스', '직업', '조정', '업데이트'],
    trend_level: 'rising',
    post_count: 122,
    source_focus: ['inven', 'reddit'],
    issue_category: '업데이트',
  },
  {
    id: 3,
    created_at: '2026-04-28T10:00:00',
    game: 'lineage2',
    period_start: '2026-04-21',
    period_end: '2026-04-28',
    summary: '특정 던전에서 봇 의심 유저 신고가 집중되며 운영 대응을 촉구하는 여론이 형성됩니다.',
    category_filter: '총 31건 수집, 제거 없음, 유효 31건',
    category_translation: '영어 게시글 3건 번역 완료 (Reddit)',
    category_classification: '핵/봇 50% · 여론 30% · 업데이트 20%',
    category_analysis: `헬바운드 던전 인근에서 자동사냥 의심 유저 패턴이 반복 관측되고 있습니다. Reddit에서 먼저 제보가 올라온 이후 인벤에서도 동일한 캐릭터명을 언급한 신고 글이 연달아 게시되었습니다. "운영진이 안 잡는다", "신고해도 소용없다"는 불신 여론이 형성 중이며 방치될 경우 경제 이슈로 확산될 가능성이 있습니다.`,
    full_report: `## 리니지2 핵/봇 이슈 리포트 (2026-04-21 ~ 04-28)

### 핵심 요약
헬바운드 던전 봇 집중 신고. Reddit 선행 감지 후 인벤으로 확산. 운영 불신 여론 동반 형성.

### 주요 관측 내용

**Reddit (영어)**
- "Bot spotted in Hellbound again" 류 게시글 5건
- 영상 증거 첨부 신고 2건, 커뮤니티 공감 다수

**인벤 (한국)**
- 동일 캐릭터명 언급 신고 글 9건 (3일 내 집중)
- "신고해도 조치 안 된다" 운영 불신 글 7건

### 분류 비율
핵/봇 50% · 여론 30% · 업데이트 20%

### 위험도 평가
**높음** — 크로스플랫폼 동시 감지, 운영 불신 여론 확산 중`,
    keywords: ['봇', '자동사냥', '신고', '헬바운드', '운영'],
    trend_level: 'hot',
    post_count: 31,
    source_focus: ['reddit', 'inven'],
    issue_category: '핵/봇',
  },
  {
    id: 4,
    created_at: '2026-04-28T10:00:00',
    game: 'lineage_w',
    period_start: '2026-04-21',
    period_end: '2026-04-28',
    summary: '이벤트 보상 체감 논쟁과 과금 피로도 불만이 동시 확산되며 여론이 부정 방향으로 기울고 있습니다.',
    category_filter: '총 87건 수집, 중복 5건 제거, 유효 82건',
    category_translation: '영어 게시글 8건 번역 완료 (Reddit)',
    category_classification: '여론/감정 43% · 이벤트 27% · 경제 18% · 기타 12%',
    category_analysis: `4월 이벤트 보상이 "기대 이하"라는 반응이 Reddit에서 먼저 확산되었고, 이후 과금 피로도("또 유료 패스냐")와 연결되며 부정 여론이 복합적으로 형성되고 있습니다. 단순 불만 게시글이 아니라 실제 결제 중단·게임 이탈을 선언하는 게시글 비중이 눈에 띄게 증가한 점이 특징입니다. 단기 이탈 신호로 해석할 수 있어 주의가 필요합니다.`,
    full_report: `## 리니지W 여론 리포트 (2026-04-21 ~ 04-28)

### 핵심 요약
이벤트 보상 실망 + 과금 피로도 복합 불만. Reddit 선행 확산. 실질 이탈 선언 게시글 증가세.

### 주요 관측 내용

**Reddit (영어)**
- "This event rewards are a joke" 류 공감 게시글 12건
- "Quitting until next update" 이탈 선언 7건

**인벤 (한국)**
- "이벤트 보상 너무 짜다" 게시글 18건
- "또 유료 패스냐" 과금 비판 11건
- 결제 중단 선언 게시글 5건 (전주 대비 +150%)

### 분류 비율
여론/감정 43% · 이벤트 27% · 경제 18% · 기타 12%

### 위험도 평가
**보통** — 이탈 선언 증가 주목, 다음 주 이벤트 대응 여부가 분기점`,
    keywords: ['이벤트', '보상', '과금', '이탈', '피로도'],
    trend_level: 'rising',
    post_count: 82,
    source_focus: ['reddit', 'bilibili'],
    issue_category: '여론',
  },
]

interface Stats {
  total: number
  byGame: Record<string, number>
  bySource: Record<string, number>
  lastRun: string
}

interface PostsResponse {
  posts: Post[]
  total: number
  page: number
  totalPages: number
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [game, setGame] = useState('')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState('')
  const [period, setPeriod] = useState('7d')
  const [page, setPage] = useState(1)
  const [selectedReportId, setSelectedReportId] = useState<number | null>(DUMMY_REPORTS[0]?.id ?? null)
  const [reportDetailId, setReportDetailId] = useState<number | null>(null)

  const [stats, setStats] = useState<Stats | null>(null)
  const [postsData, setPostsData] = useState<PostsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [postsError, setPostsError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError(null)
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('수집 현황을 불러오지 못했습니다.')
      setStats(await res.json())
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : '수집 현황을 불러오지 못했습니다.')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true)
    setPostsError(null)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (game) params.set('game', game)
    if (source) params.set('source', source)
    try {
      const res = await fetch(`/api/posts?${params}`)
      if (!res.ok) throw new Error('근거 게시글을 불러오지 못했습니다.')
      setPostsData(await res.json())
    } catch (error) {
      setPostsError(error instanceof Error ? error.message : '근거 게시글을 불러오지 못했습니다.')
      setPostsData(null)
    } finally {
      setPostsLoading(false)
    }
  }, [game, source, page])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    setPage(1)
  }, [game, source, category, period])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  function handleCrawlComplete() {
    fetchStats()
    fetchPosts()
  }

  const filteredReports = useMemo(() => {
    return DUMMY_REPORTS.filter((report) => {
      const matchGame = !game || report.game === game
      const matchSource = !source || report.source_focus?.includes(source)
      const matchCategory =
        !category ||
        (category === 'update' && report.issue_category === '업데이트') ||
        (category === 'bot' && report.issue_category === '핵/봇') ||
        (category === 'economy' && report.issue_category === '시세/거래') ||
        (category === 'sentiment' && report.issue_category === '여론')

      return matchGame && matchSource && matchCategory
    })
  }, [category, game, source])

  useEffect(() => {
    const nextReport = filteredReports[0]?.id ?? null
    setSelectedReportId((current) =>
      filteredReports.some((report) => report.id === current) ? current : nextReport
    )
  }, [filteredReports])

  const selectedReport = useMemo(
    () => filteredReports.find((report) => report.id === selectedReportId) ?? filteredReports[0] ?? null,
    [filteredReports, selectedReportId]
  )





  function formatDate(iso: string) {
    if (!iso || iso === '없음') return '없음'
    try {
      return new Date(iso).toLocaleString('ko-KR')
    } catch {
      return iso
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        tab={tab}
        game={game}
        source={source}
        category={category}
        period={period}
        onTabChange={setTab}
        onGameChange={setGame}
        onSourceChange={setSource}
        onCategoryChange={setCategory}
        onPeriodChange={setPeriod}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-6 p-6">

          {/* ── 대시보드 탭 ── */}
          {tab === 'dashboard' && (
            <>
              <section className="rounded-[32px] bg-slate-950 px-6 py-6 text-white shadow-xl">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl">
                    {game && (
                      <span className="mb-3 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-100">
                        {GAME_LABELS[game]}
                      </span>
                    )}
                    <h2 className="text-3xl font-semibold leading-tight">Trend Dashboard</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      주요 게임의 커뮤니티 신호를 한 화면에서 읽기
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs text-slate-400">총 관측량</p>
                        <p className="mt-1 text-xl font-semibold text-white">
                          {stats?.total ? stats.total.toLocaleString() : '-'}
                        </p>
                      </div>
                      <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs text-slate-400">마지막 수집</p>
                        <p className="mt-1 text-sm font-medium text-white">
                          {stats ? formatDate(stats.lastRun) : statsLoading ? '불러오는 중...' : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <CrawlButton onComplete={handleCrawlComplete} />
                    </div>
                  </div>
                </div>
              </section>

              {statsError ? (
                <ErrorCard message={statsError} />
              ) : statsLoading || !stats ? (
                <LoadingCard label="플랫폼 비교를 불러오는 중입니다." />
              ) : (
                <StatsChart
                  byGame={stats.byGame ?? {}}
                  bySource={stats.bySource ?? {}}
                  activeGame={game}
                  activeSource={source}
                  onGameSelect={setGame}
                  onSourceSelect={setSource}
                />
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">최신 리포트 주요 이슈</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {filteredReports.length}개 이슈
                  </span>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  {filteredReports.map((report) => (
                    <TrendReport
                      key={report.id}
                      report={report}
                      selected={false}
                      onSelect={() => { setReportDetailId(report.id); setTab('reports') }}
                    />
                  ))}
                </div>
                {filteredReports.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    선택한 조건에 맞는 이슈가 없습니다.
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── 리포트 탭 ── */}
          {tab === 'reports' && (
            <>
              {reportDetailId === null ? (
                /* 목록 뷰 */
                <>
                  <section className="rounded-[32px] bg-slate-950 px-6 py-6 text-white shadow-xl">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div>
                        <h2 className="text-3xl font-semibold">리포트</h2>
                        <p className="mt-2 text-sm text-slate-300">생성된 AI 분석 리포트 목록 — 최신순</p>
                      </div>
                      <button
                        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                        disabled
                        title="AI 파이프라인 구현 예정"
                      >
                        리포트 생성
                      </button>
                    </div>
                  </section>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <ul className="divide-y divide-slate-100">
                      {[...DUMMY_REPORTS]
                        .sort((a, b) => b.created_at.localeCompare(a.created_at))
                        .map((report) => (
                          <li key={report.id}>
                            <button
                              onClick={() => setReportDetailId(report.id)}
                              className="flex w-full items-center gap-4 py-4 text-left transition hover:bg-slate-50 px-2 rounded-xl"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900">
                                  {new Date(report.created_at).toLocaleString('ko-KR')}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-slate-500">{report.summary}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                  {GAME_LABELS[report.game] ?? report.game}
                                </span>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  report.trend_level === 'hot' ? 'bg-red-50 text-red-700' :
                                  report.trend_level === 'rising' ? 'bg-orange-50 text-orange-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {report.trend_level === 'hot' ? '급상승' : report.trend_level === 'rising' ? '상승' : '일반'}
                                </span>
                                <span className="text-xs text-slate-400">→</span>
                              </div>
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                </>
              ) : (
                /* 상세 뷰 */
                (() => {
                  const detail = DUMMY_REPORTS.find((r) => r.id === reportDetailId)
                  if (!detail) return null
                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setReportDetailId(null)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                        >
                          ← 목록으로
                        </button>
                        <span className="text-sm text-slate-400">
                          {new Date(detail.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>

                      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                {GAME_LABELS[detail.game] ?? detail.game}
                              </span>
                              {detail.issue_category && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                  {detail.issue_category}
                                </span>
                              )}
                            </div>
                            <p className="text-base text-slate-700">{detail.summary}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                            detail.trend_level === 'hot' ? 'bg-red-100 text-red-700' :
                            detail.trend_level === 'rising' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {detail.trend_level === 'hot' ? '급상승' : detail.trend_level === 'rising' ? '상승' : '일반'}
                          </span>
                        </div>

                        <div className="rounded-2xl bg-slate-950 p-5 text-white">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">AI 분석</p>
                          <p className="mt-3 text-sm leading-7 text-slate-100">{detail.category_analysis}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <DetailBlock title="이슈 분류" content={detail.category_classification} />
                          <DetailBlock
                            title="관측 플랫폼"
                            content={(detail.source_focus ?? []).map((item) => SOURCE_LABELS[item] ?? item).join(', ')}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {detail.keywords.map((kw) => (
                            <span key={kw} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{kw}</span>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-5">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">상세 리포트</p>
                          <div className="prose prose-sm prose-slate max-w-none">
                            <ReactMarkdown>{detail.full_report}</ReactMarkdown>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            근거 게시글 ({postsData?.posts?.length ?? 0}건 표시)
                          </p>
                          {postsLoading ? (
                            <p className="text-xs text-slate-400">불러오는 중...</p>
                          ) : postsData?.posts?.length ? (
                            <ul className="space-y-2">
                              {postsData.posts.slice(0, 10).map((post) => (
                                <li key={post.url} className="flex items-start gap-2 text-xs">
                                  <span className="mt-0.5 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                                    {SOURCE_LABELS[post.source] ?? post.source}
                                  </span>
                                  <span className="leading-5 line-clamp-2 text-slate-700">{post.title}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-400">게시글 데이터가 없습니다.</p>
                          )}
                        </div>
                      </section>
                    </>
                  )
                })()
              )}
            </>
          )}

          {/* ── 데이터 탭 ── */}
          {tab === 'data' && (
            <>
              <DataTab
                byGame={stats?.byGame ?? {}}
                bySource={stats?.bySource ?? {}}
                activeGame={game}
                activeSource={source}
              />

              {postsError ? (
                <ErrorCard message={postsError} />
              ) : postsLoading ? (
                <LoadingCard label="게시글을 불러오는 중입니다." />
              ) : (
                <PostsTable
                  posts={postsData?.posts ?? []}
                  total={postsData?.total ?? 0}
                  page={postsData?.page ?? page}
                  totalPages={postsData?.totalPages ?? 1}
                  onPageChange={setPage}
                />
              )}
            </>
          )}

        </div>
      </main>
    </div>
  )
}

const SOURCE_LABELS: Record<string, string> = {
  reddit: 'Reddit',
  bilibili: 'Bilibili',
  inven: '인벤',
}

function DetailBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{content}</p>
    </div>
  )
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
      {label}
    </div>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700 shadow-sm">
      {message}
    </div>
  )
}

