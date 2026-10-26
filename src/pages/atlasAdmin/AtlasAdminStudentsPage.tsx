import { Fragment, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { ChevronDownRegular, CircleDotSolid, MagnifyingGlass, Plus, XmarkRegular } from '@/icons'
import {
  ADMIN_DEMO_LEARNERS,
  ADMIN_DEPARTMENTS,
  STAGE_LABEL,
  bucketOf,
  byNeed,
  formatExamDate,
  relativeDays,
  type Learner,
  type PipelineBucket,
} from '@/data/atlasAdmin/learners'
import { LOCATIONS, jobRoleOf, membersOfLocation } from '@/data/atlasAdmin/organization'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { ATLAS_BUTTON_PRIMARY, ATLAS_BUTTON_SECONDARY, CARD, CHIP, CHIP_ON, EYEBROW, PAGE_H1, PAGE_SUB } from './adminStyles'
import { ChipMenu, MenuItem, PreparedPill, ReadinessCell, StagePill } from './adminUi'
import { InviteLearnersDialog } from './InviteLearnersDialog'
import { StudentsEmptyState } from './StudentsEmptyState'

/**
 * ATLAS ADMIN · STUDENTS — rebuilt from colibri-b2b.vercel.app/students
 * (2026-10-19). The admin's home: six pipeline tiles that filter the roster,
 * search and filter chips, and the roster itself, sorted by who needs the
 * admin first. Everything here works on the fixture (`learners.ts`):
 *
 *   - a TILE filters the table to its bucket, and picks the sort that bucket
 *     wants (days since enrolment for Not started, a missing exam date first
 *     for Prepared to pass);
 *   - SEARCH matches name, email and department;
 *   - the CHIPS stack (Quiet 7 days, No hiring manager, Hidden from report,
 *     a Department, and the Filter menu's three) and show above the table
 *     as applied, with Clear all;
 *   - the three DEMO chips open those learners' records;
 *   - rows SELECT, with a bar for the selection; EXPORT downloads the rows
 *     in view as CSV; SHOW MORE adds 25.
 */

type Quick = 'quiet7' | 'noManager' | 'hidden' | 'new30' | 'quiet2' | 'readyNoDate' | 'low'

const QUICK_LABEL: Record<Quick, string> = {
  quiet7: 'Quiet 7 days',
  noManager: 'No hiring manager',
  hidden: 'Hidden from report',
  new30: 'New in last 30 days',
  quiet2: 'Quiet 2 days',
  readyNoDate: 'Ready, no exam date',
  low: 'Trending low',
}

const QUICK_TEST: Record<Quick, (l: Learner) => boolean> = {
  quiet7: (l) => l.lastActiveDays >= 7 && l.stage !== 'licensed',
  noManager: (l) => l.hiringManager === null,
  hidden: (l) => l.hiddenFromReport,
  new30: (l) => l.enrolledDaysAgo <= 30,
  quiet2: (l) => l.lastActiveDays >= 2 && l.stage !== 'licensed',
  readyNoDate: (l) => l.stage === 'ready-to-test' && !l.examDate,
  low: (l) => l.readiness === 'low' && l.stage !== 'licensed',
}

/** A filter can arrive in the address — `?filter=quiet7` — which is how the
 *  Progress report's View links open a filtered roster (2026-10-19). */
export const STUDENT_FILTER_PARAM = 'filter'

type Tile = { id: PipelineBucket; label: string; color: string; bar: string; note: string; title?: string }

const PAGE = 25

export function AtlasAdminStudentsPage() {
  const navigate = useNavigate()
  /* The outcome tiles follow the Left Nav design control: Lite sets them
     straight on the page, each stroked in primary 200; Standard keeps the
     blue container running on under the roster card, tiles unstroked. */
  const lite = useFeatureFlag('atlas-admin-left-nav').variant === 'lite'
  // The Design bar's Student Analysis: which outcome row the page shows.
  const analysis = useFeatureFlag('atlas-admin-student-analysis').variant ?? 'dial'
  const { showToast, learners: ADMIN_LEARNERS } = useAdminStore()
  const [bucket, setBucket] = useState<PipelineBucket>('all')
  const [search, setSearch] = useState('')
  const [params] = useSearchParams()
  const [quick, setQuick] = useState<Quick[]>(() => {
    const f = params.get(STUDENT_FILTER_PARAM)
    return f && f in QUICK_LABEL ? [f as Quick] : []
  })
  // Settings → Departments → Open filter arrives as `?department=`.
  const [department, setDepartment] = useState<string | null>(() => new URLSearchParams(window.location.search).get('department'))
  // Organization → View in Students arrives as `?location=` (a location id)
  // or `?role=` (a job role).
  const [location, setLocation] = useState(() => LOCATIONS.find((x) => x.id === new URLSearchParams(window.location.search).get('location')) ?? null)
  const [role, setRole] = useState<string | null>(() => new URLSearchParams(window.location.search).get('role'))
  const [shown, setShown] = useState(PAGE)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [licensedWindow, setLicensedWindow] = useState('90d')
  const [inviting, setInviting] = useState(false)

  const counts = useMemo(() => {
    const by = (b: PipelineBucket) => ADMIN_LEARNERS.filter((l) => bucketOf(l) === b)
    const notStarted = by('not-started')
    const inProgress = by('in-progress')
    const offTrack = by('off-track')
    const prepared = by('prepared')
    return {
      all: ADMIN_LEARNERS.length - by('licensed').length,
      total: ADMIN_LEARNERS.length,
      notStarted: notStarted.length,
      inviteOpen: notStarted.filter((l) => l.stage === 'invite-open').length,
      neverLaunched: notStarted.filter((l) => l.stage === 'never-started').length,
      inProgress: inProgress.length,
      inCourse: inProgress.filter((l) => l.stage === 'in-course').length,
      inPrep: inProgress.filter((l) => l.stage === 'prepping').length,
      offTrack: offTrack.length,
      noPrep: offTrack.filter((l) => l.stage === 'done-no-prep').length,
      noActivity: offTrack.filter((l) => l.stage === 'stalled').length,
      prepared: prepared.length,
      scheduled: prepared.filter((l) => l.examDate).length,
      licensed: by('licensed').length,
    }
  }, [ADMIN_LEARNERS])

  const tiles: Tile[] = [
    { id: 'all', label: 'All', color: 'var(--admin-ink)', bar: 'var(--admin-ink)', note: 'Active pipeline' },
    {
      id: 'not-started',
      label: 'Not Started',
      color: 'var(--admin-ink)',
      bar: 'var(--admin-faint)',
      note: `${counts.inviteOpen} invite open · ${counts.neverLaunched} never launched`,
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      color: 'var(--admin-ink)',
      bar: 'var(--admin-muted)',
      note: `${counts.inCourse} in course · ${counts.inPrep} in prep`,
    },
    {
      id: 'off-track',
      label: 'Off Track',
      color: 'var(--admin-ink)',
      bar: 'var(--admin-brand)',
      note: `${counts.noPrep} no prep · ${counts.noActivity} no recent activity`,
    },
    {
      id: 'prepared',
      label: 'Prepared to Pass',
      color: 'var(--admin-success)',
      bar: 'var(--admin-success)',
      note: `${counts.scheduled} exams scheduled`,
      title: 'Course is done, exam prep is at least 80%, and two simulations are passed.',
    },
    { id: 'licensed', label: 'Licensed', color: 'var(--admin-success-ink)', bar: 'var(--admin-success-ink)', note: 'Exam passed' },
  ]
  const tileCount: Record<PipelineBucket, number> = {
    all: counts.all,
    'not-started': counts.notStarted,
    'in-progress': counts.inProgress,
    'off-track': counts.offTrack,
    prepared: counts.prepared,
    licensed: counts.licensed,
  }

  const inLocation = useMemo(() => new Set(location ? membersOfLocation(location, ADMIN_LEARNERS).map((l) => l.id) : []), [location, ADMIN_LEARNERS])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = ADMIN_LEARNERS.filter((l) => {
      if (bucket === 'all' ? bucketOf(l) === 'licensed' : bucketOf(l) !== bucket) return false
      if (department && l.team !== department) return false
      if (location && !inLocation.has(l.id)) return false
      if (role && jobRoleOf(l) !== role) return false
      if (q && !`${l.name} ${l.email} ${l.team}`.toLowerCase().includes(q)) return false
      return quick.every((k) => QUICK_TEST[k](l))
    })
    if (bucket === 'not-started') return list.sort((a, b) => b.enrolledDaysAgo - a.enrolledDaysAgo)
    if (bucket === 'prepared') return list.sort((a, b) => Number(!!a.examDate) - Number(!!b.examDate) || byNeed(a, b))
    return list.sort(byNeed)
  }, [ADMIN_LEARNERS, bucket, department, location, inLocation, role, search, quick])

  const sortLabel =
    bucket === 'not-started' ? 'days since enrollment' : bucket === 'prepared' ? 'missing exam date' : 'who needs you first'
  const visible = rows.slice(0, shown)
  const allVisibleSelected = visible.length > 0 && visible.every((l) => selected.has(l.id))

  const pickBucket = (b: PipelineBucket) => {
    setBucket(b)
    setShown(PAGE)
  }
  const toggleQuick = (k: Quick) => {
    setQuick((q) => (q.includes(k) ? q.filter((x) => x !== k) : [...q, k]))
    setShown(PAGE)
  }
  const clearAll = () => {
    setQuick([])
    setDepartment(null)
    setSearch('')
    setShown(PAGE)
  }
  const toggleRow = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const openLearner = (l: Learner) => navigate(`${ADMIN_BASE}/students/recruit/${encodeURIComponent(l.id)}${window.location.search}`)

  const exportCsv = (list: Learner[]) => {
    const head = ['Name', 'Email', 'Team', 'Content %', 'Exam prep %', 'Stage', 'Last active', 'Exam date']
    const body = list.map((l) => [
      l.name,
      l.email,
      l.team,
      l.contentPct ?? '',
      l.prepPct ?? '',
      STAGE_LABEL[l.stage],
      relativeDays(l.lastActiveDays),
      l.examDate ?? '',
    ])
    const csv = [head, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'students.csv'
    a.click()
    URL.revokeObjectURL(a.href)
    showToast(`Exported ${list.length} ${list.length === 1 ? 'student' : 'students'}`)
  }

  const applied = [
    ...quick.map((k) => ({ key: k, label: QUICK_LABEL[k], clear: () => toggleQuick(k) })),
    ...(department ? [{ key: 'dept', label: department, clear: () => setDepartment(null) }] : []),
    ...(location ? [{ key: 'location', label: location.name, clear: () => setLocation(null) }] : []),
    ...(role ? [{ key: 'role', label: role, clear: () => setRole(null) }] : []),
  ]

  // Nobody on the roster yet — the first-run office.
  if (ADMIN_LEARNERS.length === 0) return <StudentsEmptyState />

  /** The outcome cards (Atlas UX Design 527:603 / 527:746): the status pill,
   *  the count, a thin rule and its share of the roster, then a one-line note.
   *  Selecting a card slides its pill open into the status colour.
   *  `columns`: 3 (two rows, Dial (3×2)) or 6 (one row, Dial — 12px
   *  apart, and Licensed's window under its figures so every card's figures
   *  share a line). The one row never squeezes a card narrower than its
   *  content, and a pill is as wide at rest as selected (tokens.css), so a
   *  card always has room for its selected pill. Its cards are not size
   *  containers — containment would hide their content's width from the grid. */
  const statusGrid = (columns: 3 | 6) => (
    <div style={{ display: 'grid', gap: columns === 6 ? 12 : 20, gridTemplateColumns: columns === 6 ? 'repeat(6, minmax(min-content, 1fr))' : 'repeat(3, minmax(0, 1fr))' }}>
      {STATUS_ORDER.map((id) => tiles.find((x) => x.id === id)!).map((t) => {
        const n = tileCount[t.id]
        const active = bucket === t.id
        const [strip] = STATUS_TONE[t.id]
        const oneRow = columns === 6
        /* The figures' rules: primary 100 on the white selected card; at rest primary 200 lightened 20%. */
        const figureRule = `1px solid ${active ? 'var(--admin-atlas-primary-100)' : 'color-mix(in srgb, var(--admin-atlas-primary-200), white 20%)'}`
        const windowBelow = oneRow
        /* Our own chevron, 10px in from the right edge — Chrome's native arrow ignores padding. */
        const licensedPicker =
          t.id === 'licensed' ? (
            <span className={windowBelow ? undefined : 'cre-admin-status-window'} style={{ position: 'relative', display: 'inline-flex', flex: 'none', alignSelf: 'flex-start' }}>
              <select
                aria-label="Licensed time window"
                value={licensedWindow}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setLicensedWindow(e.target.value)}
                style={{ ...SELECT, marginTop: undefined, appearance: 'none', padding: '4px 24px 4px 10px', width: 'auto', cursor: 'pointer' }}
              >
                <option value="90d">Last 90 days</option>
                <option value="year">This year</option>
                <option value="all">All time</option>
              </select>
              <ChevronDownRegular aria-hidden size={10} style={{ position: 'absolute', right: 10, top: '50%', translate: '0 -50%', pointerEvents: 'none', color: 'var(--admin-text)' }} />
            </span>
          ) : null
        return (
          <div key={t.id} style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
            <div
              role="button"
              tabIndex={0}
              title={t.title}
              aria-pressed={active}
              onClick={() => pickBucket(t.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  pickBucket(t.id)
                }
              }}
              className="cre-admin-tile cre-admin-status-card"
              /* 3×2: primary 200 edge always; selected fills white. One row: no edge (primary 200 on hover, tokens.css) — at rest the
                 search field's fill, selected white and lifted on the tiles' 4/4 15% shadow. */
              style={{
                ...STATUS_CARD,
                borderColor: oneRow ? 'transparent' : 'var(--admin-atlas-primary-200)',
                background: active ? 'var(--admin-surface)' : oneRow ? 'var(--admin-fill)' : 'none',
                boxShadow: active && oneRow ? 'var(--admin-shadow-tile-active)' : undefined,
                /* One row: at least the dial's ring (its box less DIAL_INSET each side) less 4px. */
                minHeight: oneRow ? DIAL_SIZE_ONE_ROW - 2 * DIAL_INSET - 4 : undefined,
              }}
            >
              <div style={{ ...STATUS_BODY, padding: 16, containerType: oneRow ? 'normal' : 'inline-size' }}>
                {/* Licensed's window sits top right, across from its pill (in the one-row version, under its figures). */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  {/* Default: a status-coloured dot beside the label. Active: the dot slides open, left to right, into a filled pill (tokens.css). */}
                  <span className="cre-admin-status-pill" data-active={active || undefined} style={{ '--pill': strip } as CSSProperties}>
                    <span aria-hidden className="cre-admin-status-pill-fill" />
                    <CircleDotSolid aria-hidden size={12} className="cre-admin-status-pill-icon" />
                    {t.id === 'all' ? 'Active Students' : t.label}
                  </span>
                  {windowBelow ? null : licensedPicker}
                </div>
                {/* One row: a rule 8px above and below the figures, across the card (figureRule). */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    /* One row: 18px either side of the count | share rule (8 more than the 3×2's 10). */
                    gap: oneRow ? 18 : 10,
                    marginTop: oneRow ? 6 : 2,
                    marginBottom: oneRow ? 2 : 0,
                    ...(oneRow ? { padding: '8px 0', borderTop: figureRule, borderBottom: figureRule } : null),
                  }}
                >
                  {/* Playfair's -1.68px tracking trails the count too; 2px back puts the rule mid-way between the figures' ink. */}
                  <span style={{ ...STATUS_COUNT, marginRight: 2 }}>{n.toLocaleString('en-US')}</span>
                  <span aria-hidden style={STATUS_SEP} />
                  {/* One row: the share lighter than the count — primary 400 (600 read the same as the count's 800). */}
                  <span style={oneRow ? { ...STATUS_COUNT, color: 'var(--admin-atlas-primary-400)' } : STATUS_COUNT}>{counts.total ? Math.round((n / counts.total) * 100) : 0}%</span>
                </div>
                {t.id === 'licensed' ? (windowBelow ? licensedPicker : null) : (
                  <p style={STATUS_DESC}>
                    {/* Each " · " value on its own line, its figures in semibold (split on the numbers: every odd piece is one). */}
                    {(t.id === 'all' ? 'Students active in learning pipeline' : t.note).split(' · ').map((line, l) => (
                      <Fragment key={l}>
                        {l ? <br /> : null}
                        {line.split(/(\d[\d,]*)/).map((part, i) => (i % 2 ? <b key={i} style={{ fontWeight: 600 }}>{part}</b> : part))}
                      </Fragment>
                    ))}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  /** The outcome tiles; `withBars` false drops each tile's progress bar. */
  const tileGrid = (withBars: boolean) => (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
      {tiles.map((t) => {
        const n = tileCount[t.id]
        const active = bucket === t.id
        return (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            title={t.title}
            aria-pressed={active}
            onClick={() => pickBucket(t.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                pickBucket(t.id)
              }
            }}
            className="cre-admin-tile"
            style={{ ...TILE, borderColor: lite ? 'var(--admin-atlas-primary-200)' : 'var(--admin-fill-soft)', ...(active ? TILE_ACTIVE : null) }}
          >
            <p style={EYEBROW}>{t.label}</p>
            {/* Without the bars, Off Track's red moves to its count and Prepared's green takes a step darker. */}
            <p style={{ ...TILE_NUMBER, color: withBars ? t.color : t.id === 'off-track' ? 'var(--admin-brand)' : t.id === 'prepared' ? 'var(--admin-success-strong)' : t.color }}>{n}</p>
            {withBars ? (
              <span style={TRACK}>
                <span style={{ display: 'block', height: '100%', borderRadius: 9999, width: `${Math.max(2, Math.round((n / counts.total) * 100))}%`, background: t.bar }} />
              </span>
            ) : null}
            {t.id === 'licensed' ? (
              // As on the Dial cards: no note, the window says "Passed …" itself, as wide as its longest option.
              <select
                aria-label="Licensed time window"
                value={licensedWindow}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setLicensedWindow(e.target.value)}
                style={{ ...SELECT, width: 'auto', display: 'block' }}
              >
                <option value="90d">Passed last 90 days</option>
                <option value="year">Passed this year</option>
                <option value="all">Passed all time</option>
              </select>
            ) : (
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--admin-text)' }}>{t.note}</p>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={PAGE_H1}>Students</h2>
          <p style={PAGE_SUB}>
            <b style={{ fontWeight: 600 }}>{counts.total} students</b> · Active pipeline plus licensed in the last 90 days
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={() => exportCsv(rows)} style={ATLAS_BUTTON_SECONDARY}>
            Export
          </button>
          <button type="button" onClick={() => setInviting(true)} style={ATLAS_BUTTON_PRIMARY}>
            Invite learners
          </button>
        </div>
      </header>

      <section aria-label="Pipeline outcomes" style={lite ? undefined : { ...CARD, border: 'none', padding: `24px 24px ${24 + UNDERLAP}px`, marginBottom: -(24 + UNDERLAP), background: 'var(--admin-atlas-primary-100)' }}>
        {/* One of four, by the Student Analysis design control. Dial: the dial
            and the six status cards in one row, each in its own panel, side by
            side and the same height (2026-10-26). Dial (3×2): Dial's layout
            until then — the dial beside a 3×2 grid on one primary 100 panel,
            32px in — kept to come back to. Then the tiles with progress bars,
            or plain. */}
        {analysis === 'dial' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
          {/* The eyebrow and dial centred across, 16px from the top, 24px in at the sides. On the cards' resting fill, square on the right, running
              ANALYSIS_RADIUS on under the cards panel (its padding grows to match, so the dial stays put). */}
          <div
            style={{
              ...ANALYSIS_PANEL,
              background: 'var(--admin-fill)',
              borderRadius: `${ANALYSIS_RADIUS}px 0 0 ${ANALYSIS_RADIUS}px`,
              marginRight: -ANALYSIS_RADIUS,
              flex: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
              padding: `16px ${24 + ANALYSIS_RADIUS}px 16px 24px`,
            }}
          >
            <p style={EYEBROW}>Student Compliance</p>
            <StatusDial
              size={DIAL_SIZE_ONE_ROW}
              active={bucket}
              onPick={pickBucket}
              total={counts.total}
              parts={(['in-progress', 'off-track', 'prepared', 'licensed', 'not-started'] as const).map((id) => ({ id, n: tileCount[id], color: STATUS_TONE[id][0] }))}
            />
          </div>
          {/* The cards centred on the dial: a box the dial's height, level with it (the dial panel's 16px + eyebrow 18 + gap 8), the grid centred in it. */}
          <div style={{ ...ANALYSIS_PANEL, position: 'relative', flex: '1 1 480px', minWidth: 0, padding: `${16 + 18 + 8}px 24px 16px` }}>
            <div style={{ height: DIAL_SIZE_ONE_ROW, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>{statusGrid(6)}</div>
          </div>
        </div>
        ) : analysis === 'dial-grid' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 40, padding: 32, borderRadius: 18, background: 'var(--admin-atlas-primary-100)' }}>
          {/* Top-aligned, 15px down (a card's 1px edge + 14px padding), so this eyebrow shares the top cards' baseline. */}
          <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 15 }}>
            <p style={EYEBROW}>Student Compliance</p>
            <StatusDial
              active={bucket}
              onPick={pickBucket}
              total={counts.total}
              parts={(['in-progress', 'off-track', 'prepared', 'licensed', 'not-started'] as const).map((id) => ({ id, n: tileCount[id], color: STATUS_TONE[id][0] }))}
            />
          </div>
          <div style={{ flex: '1 1 480px', minWidth: 0 }}>{statusGrid(3)}</div>
        </div>
        ) : (
          tileGrid(analysis === 'progress-bar')
        )}
      </section>

      {/* `clip`, not `hidden`: it rounds the corners the same way without making the card a scroll box, so the selection bar can pin to the window. */}
      <section style={{ ...CARD, position: 'relative', overflow: 'clip' }}>
        <div style={TOOLBAR}>
          <label style={{ position: 'relative', display: 'block', width: 256 }}>
            <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--admin-faint)', display: 'flex' }}>
              <MagnifyingGlass size={14} aria-hidden />
            </span>
            <input
              type="search"
              aria-label="Search recruits"
              placeholder="name, email, department"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setShown(PAGE)
              }}
              style={SEARCH}
            />
          </label>
          {(['brand-new', 'in-flight', 'complete'] as const).map((k) => (
            <button
              key={k}
              type="button"
              title={ADMIN_DEMO_LEARNERS[k].email}
              onClick={() => openLearner(ADMIN_DEMO_LEARNERS[k])}
              className="cre-admin-chip"
              style={CHIP}
            >
              <Plus size={10} aria-hidden /> Demo: {k === 'brand-new' ? 'brand new' : k === 'in-flight' ? 'in flight' : 'complete'}
            </button>
          ))}
          {(['quiet7', 'noManager', 'hidden'] as const)
            .filter((k) => !quick.includes(k))
            .map((k) => (
              <button
                key={k}
                type="button"
                title={k === 'quiet7' ? 'No activity in the last 7 days' : undefined}
                onClick={() => toggleQuick(k)}
                className="cre-admin-chip"
                style={CHIP}
              >
                <Plus size={10} aria-hidden /> {QUICK_LABEL[k]}
              </button>
            ))}
          <ChipMenu label="Department" icon={<Plus size={10} aria-hidden />} width={256}>
            {(close) =>
              ADMIN_DEPARTMENTS.map((d) => (
                <MenuItem
                  key={d}
                  onSelect={() => {
                    setDepartment(d)
                    setShown(PAGE)
                    close()
                  }}
                >
                  {d}
                </MenuItem>
              ))
            }
          </ChipMenu>
          <ChipMenu label="Filter" icon={<Plus size={10} aria-hidden />}>
            {(close) =>
              (['new30', 'quiet2', 'readyNoDate'] as const)
                .filter((k) => !quick.includes(k))
                .map((k) => (
                  <MenuItem
                    key={k}
                    onSelect={() => {
                      toggleQuick(k)
                      close()
                    }}
                  >
                    {QUICK_LABEL[k]}
                  </MenuItem>
                ))
            }
          </ChipMenu>
        </div>

        {applied.length || search ? (
          <div style={{ ...TOOLBAR, background: 'var(--admin-fill-soft)' }}>
            {applied.map((a) => (
              <button key={a.key} type="button" onClick={a.clear} aria-label={`Remove ${a.label}`} style={CHIP_ON}>
                {a.label}
                <XmarkRegular size={10} aria-hidden />
              </button>
            ))}
            <button type="button" onClick={clearAll} style={{ ...TEXT_BUTTON, marginLeft: 4 }}>
              Clear all
            </button>
          </div>
        ) : null}

        {selected.size ? (
          <div style={{ ...TOOLBAR, position: 'sticky', top: 'var(--admin-header-h, 0px)', zIndex: 5, paddingTop: 20, paddingBottom: 20, background: 'var(--admin-atlas-secondary-100)', color: 'var(--admin-atlas-neutral-800)' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{selected.size} selected</span>
            <button
              type="button"
              onClick={() => {
                showToast(`Nudge sent to ${selected.size} ${selected.size === 1 ? 'learner' : 'learners'}`)
                setSelected(new Set())
              }}
              style={ATLAS_BUTTON_PRIMARY}
            >
              Send nudge
            </button>
            <button
              type="button"
              onClick={() => exportCsv(ADMIN_LEARNERS.filter((l) => selected.has(l.id)))}
              style={ATLAS_BUTTON_SECONDARY}
            >
              Export selected
            </button>
            <button type="button" className="cre-admin-text-link" onClick={() => setSelected(new Set())} style={{ ...TEXT_BUTTON, color: 'var(--admin-atlas-primary-500)', marginLeft: 'auto' }}>
              Clear selection
            </button>
          </div>
        ) : null}

        <div style={{ overflowX: 'auto' }}>
          {/* Fixed layout on set column widths: the whole roster fits the card at 1310px, and no column moves when a status card refilters it. */}
          <table style={{ width: '100%', minWidth: ROSTER_MIN, tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <colgroup>
              {ROSTER_COLS.map((c) => (
                <col key={c.key} style={c.width ? { width: c.width } : undefined} />
              ))}
            </colgroup>
            <thead style={{ background: 'var(--admin-fill-soft)' }}>
              <tr>
                {/* On the headers' bottom line, like the two-line headers' second line. */}
                <th className="cre-admin-sticky-col" style={{ ...TH, width: 40, padding: '12px 16px', verticalAlign: 'bottom' }}>
                  <input
                    type="checkbox"
                    aria-label="Select all visible"
                    checked={allVisibleSelected}
                    onChange={() =>
                      setSelected((s) => {
                        const next = new Set(s)
                        visible.forEach((l) => (allVisibleSelected ? next.delete(l.id) : next.add(l.id)))
                        return next
                      })
                    }
                    /* 3px down so its centre meets the capitals' centre on that line. */
                    style={{ ...CHECKBOX, position: 'relative', top: 3 }}
                  />
                </th>
                {ROSTER_COLS.slice(1).map((c) => (
                  <th key={c.key} style={{ ...TH, verticalAlign: 'bottom' }}>
                    {c.label}
                    {c.label2 ? (
                      <>
                        <br />
                        {c.label2}
                      </>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((l) => (
                <tr key={l.id} className="cre-admin-row" style={{ borderTop: '1px solid var(--admin-rule)' }}>
                  <td className="cre-admin-sticky-col" style={{ ...TD, padding: '12px 16px' }}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${l.name}`}
                      checked={selected.has(l.id)}
                      onChange={() => toggleRow(l.id)}
                      style={{ ...CHECKBOX, display: 'block' }}
                    />
                  </td>
                  <td style={TD}>
                    <button type="button" className="cre-admin-name" onClick={() => openLearner(l)} style={NAME}>
                      {l.name}
                    </button>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.email}
                    </p>
                  </td>
                  <td style={{ ...TD, color: 'var(--admin-text)' }}>{l.team}</td>
                  <td style={PCT_TD}>{l.contentPct === null ? '—' : `${l.contentPct}%`}</td>
                  <td style={PCT_TD}>{l.prepPct === null ? '—' : `${l.prepPct}%`}</td>
                  <td style={TD}>
                    <ReadinessCell readiness={l.readiness} score={l.score} />
                  </td>
                  <td style={TD}>
                    <PreparedPill value={l.preparedToPass} />
                  </td>
                  <td style={TD}>
                    <StagePill stage={l.stage} />
                  </td>
                  <td style={{ ...TD, whiteSpace: 'nowrap', color: 'var(--admin-text)' }}>{relativeDays(l.lastActiveDays)}</td>
                  <td style={{ ...TD, whiteSpace: 'nowrap', fontWeight: l.examDate ? 700 : undefined, color: 'var(--admin-text)' }}>{formatExamDate(l.examDate)}</td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ ...TD, padding: 32, textAlign: 'center', color: 'var(--admin-muted)' }}>
                    No students match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <footer style={FOOTER}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-muted)' }}>
            Showing {visible.length} of {rows.length} · sorted by {sortLabel}
          </p>
          {visible.length < rows.length ? (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} style={TEXT_BUTTON}>
              Show more
            </button>
          ) : null}
        </footer>
      </section>

      {inviting ? <InviteLearnersDialog onClose={() => setInviting(false)} /> : null}
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

/** The status cards' dial, in the learner Home's ring style: a thick
 *  round-capped arc per status from 12 o'clock — In progress, Off track,
 *  Prepared, Licensed, Not started — each its share of the roster, a hair
 *  apart so the caps don't touch. */
function StatusDial({
  total,
  parts,
  active,
  onPick,
  size = DIAL_SIZE,
}: {
  total: number
  parts: { id: PipelineBucket; n: number; color: string }[]
  active: PipelineBucket
  onPick: (id: PipelineBucket) => void
  /** The square it draws in; the ring sits DIAL_INSET inside it. The centre text keeps its size. */
  size?: number
}) {
  const stroke = 8
  const r = size / 2 - DIAL_INSET - stroke / 2
  const c = 2 * Math.PI * r
  const gap = stroke + 2 // the round caps reach stroke / 2 past each end
  const lens = parts.map((p) => (total ? (c * p.n) / total : 0))
  const arcs = parts.map((p, i) => ({ ...p, offset: lens.slice(0, i).reduce((a, b) => a + b, 0), len: Math.max(0, lens[i] - gap) }))
  return (
    <div style={{ position: 'relative', flex: 'none', width: size, height: size }}>
      {/* Each arc selects its card. */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="group" aria-label={`${total} students by status`} style={{ display: 'block' }}>
        {/* Whatever is selected: a disc 8px inside the ring's inner edge, in the selected status's colour at 15% (Not started's pale tan at 25%). */}
        <circle
          aria-hidden
          cx={size / 2}
          cy={size / 2}
          r={r - stroke / 2 - 8}
          fill={active === 'all' ? 'var(--admin-atlas-status-active)' : (parts.find((p) => p.id === active)?.color ?? 'none')}
          fillOpacity={active === 'not-started' ? 0.25 : 0.15}
          style={{ pointerEvents: 'none' }}
        />
        {arcs.map((a) =>
          a.len > 0 ? (
            <circle
              key={a.id}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              role="button"
              tabIndex={0}
              aria-label={`${a.n} ${a.id.replace('-', ' ')}: show these students`}
              aria-pressed={active === a.id}
              onClick={() => onPick(a.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick(a.id))}
              style={{ stroke: a.color, cursor: 'pointer', outline: 'none' }}
              strokeWidth={active === a.id ? stroke + 4 : stroke}
              strokeLinecap="round"
              /* Selected, its caps reach 2px further each end — so its dash is 4px shorter and starts 2px later, keeping the gaps. */
              strokeDasharray={`${Math.max(0, a.len - (active === a.id ? 4 : 0))} ${c}`}
              strokeDashoffset={-(a.offset + gap / 2 + (active === a.id ? 2 : 0))}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ) : null,
        )}
      </svg>
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={DIAL_LABEL}>Total</span>
        <span style={{ fontFamily: 'var(--admin-font-playfair)', fontWeight: 900, fontVariantNumeric: 'lining-nums tabular-nums', fontSize: 'var(--admin-atlas-h5-size)', lineHeight: 'var(--admin-atlas-h5-line)', color: 'var(--admin-ink)' }}>{total}</span>
        <span style={DIAL_LABEL}>Students</span>
      </div>
    </div>
  )
}

/* PartnerHub's status cards (Students' top tile row). */
/* Their order: In progress before Not started (2026-10-23, Eric). */
const STATUS_ORDER: PipelineBucket[] = ['all', 'in-progress', 'not-started', 'off-track', 'prepared', 'licensed']
const BODY_FONT = 'var(--font-body)'
/* The Atlas Style Guide's status colours (Figma 270:39). */
const STATUS_TONE: Record<PipelineBucket, [string]> = {
  all: ['var(--admin-atlas-status-active)'],
  'not-started': ['var(--admin-atlas-status-not-started)'],
  'in-progress': ['var(--admin-atlas-status-in-progress)'],
  'off-track': ['var(--admin-atlas-status-off-track)'],
  prepared: ['var(--admin-atlas-status-prepared)'],
  licensed: ['var(--admin-atlas-status-licensed)'],
}
/* Atlas UX Design 527:603 (Active) / 527:746 (Default): 14px corners; 16px in (the one-row version 24px top and bottom). A flex column, so every card in a row fills to the tallest. */
const STATUS_CARD: CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'none', borderStyle: 'solid', borderWidth: 1, borderRadius: 14, cursor: 'pointer', textAlign: 'left' }
/* A size container, so Licensed's window can drop to its own line when the card is too narrow for it beside the pill (tokens.css). */
const STATUS_BODY: CSSProperties = { containerType: 'inline-size', flex: 1, minWidth: 0, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 8 }
const STATUS_DESC: CSSProperties = { margin: 0, fontFamily: BODY_FONT, fontSize: 11, lineHeight: '13px', color: 'var(--admin-text)' }
/* Playfair Bold with lining figures (`lnum`): every digit on one baseline — its default old-style figures drop 3, 4, 5, 7, 9 below it. */
const STATUS_COUNT: CSSProperties = { fontFamily: 'var(--admin-font-playfair)', fontSize: 28, fontWeight: 700, lineHeight: '20px', letterSpacing: '-1.68px', whiteSpace: 'nowrap', fontVariantNumeric: 'lining-nums proportional-nums', color: 'var(--admin-atlas-ink)' }
/* The 1px rule between count and share, as tall as the figures less 1px each end. */
const STATUS_SEP: CSSProperties = { flex: 'none', width: 1, margin: '1px 0', borderRadius: 1, background: 'var(--admin-atlas-primary-200)' }
/* The small caps over and under the dial's total. */
const DIAL_LABEL: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--admin-muted)' }
/* The dial's default square, and the gap between its edge and the ring's outer edge (leaving room for a selected arc's 12px stroke). */
const DIAL_SIZE = 168
const DIAL_INSET = 4
/* The one-row version's smaller dial (2026-10-26). */
const DIAL_SIZE_ONE_ROW = 150
/* One panel of the Dial analysis: Atlas primary 100, 32px in. */
const ANALYSIS_RADIUS = 18
const ANALYSIS_PANEL: CSSProperties = { boxSizing: 'border-box', padding: 32, borderRadius: ANALYSIS_RADIUS, background: 'var(--admin-atlas-primary-100)' }
/* How far the outcome container's blue runs on beneath the roster card (Standard nav). */
const UNDERLAP = 24
const TILE: CSSProperties = {
  borderRadius: 11,
  borderWidth: 1,
  borderStyle: 'solid', // colour by Left Nav, at the tile
  background: 'var(--admin-fill-soft)', // the roster's header row; the selected tile is white
  padding: 16,
  textAlign: 'left',
  cursor: 'pointer',
  outline: 'none',
}
const TILE_ACTIVE: CSSProperties = { background: 'var(--admin-surface)', outline: '1px solid var(--admin-atlas-primary-200)', outlineOffset: -1, boxShadow: 'var(--admin-shadow-tile-active)' }
/* The count: the Atlas H5 size (32/34) in Playfair Black, as the Dial cards' figures. */
const TILE_NUMBER: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--admin-font-playfair)',
  fontSize: 'var(--admin-atlas-h5-size)',
  fontWeight: 900,
  lineHeight: 'var(--admin-atlas-h5-line)',
  letterSpacing: '-0.01em',
  fontVariantNumeric: 'lining-nums tabular-nums',
}
const TRACK: CSSProperties = {
  marginTop: 12,
  display: 'block',
  height: 6,
  overflow: 'hidden',
  borderRadius: 9999,
  background: 'var(--admin-fill)',
}
const SELECT: CSSProperties = {
  marginTop: 8,
  width: '100%',
  borderRadius: 6,
  border: '1px solid var(--admin-rule)',
  background: 'var(--admin-surface)',
  padding: '4px 6px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--admin-text)',
}
const TOOLBAR: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  padding: '12px 20px',
  borderBottom: '1px solid var(--admin-rule)',
}
const SEARCH: CSSProperties = {
  width: '100%',
  height: 36,
  boxSizing: 'border-box',
  borderRadius: 9999,
  border: 'none',
  background: 'var(--admin-fill)',
  padding: '0 12px 0 34px',
  fontSize: 14,
  color: 'var(--admin-ink)',
  outline: 'none',
}
const TEXT_BUTTON: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--admin-ink)',
  cursor: 'pointer',
}
const TH: CSSProperties = {
  padding: '12px',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--admin-muted)',
  whiteSpace: 'nowrap',
}
const TD: CSSProperties = { padding: '12px', verticalAlign: 'middle' }
/* The progress columns: just the figure, no ring, in bold like every figure in the rows (2026-10-26). */
const PCT_TD: CSSProperties = { ...TD, whiteSpace: 'nowrap', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--admin-text)' }
/* The roster's columns, widths fixed so filtering never moves them. Learner
   takes what is left; at the card's 1310px every column shows. Long headers
   break onto a second line. */
const ROSTER_COLS: { key: string; label?: string; label2?: string; width?: number }[] = [
  { key: 'select', width: 48 },
  { key: 'learner', label: 'Learner' },
  { key: 'team', label: 'Team', width: 150 },
  /* Each its widest content across the whole roster, plus 24px of padding (measured 2026-10-26). */
  { key: 'content', label: 'Progress', label2: '(content)', width: 100 },
  { key: 'prep', label: 'Progress', label2: '(exam prep)', width: 110 },
  { key: 'readiness', label: 'Readiness', width: 112 },
  { key: 'prepared', label: 'Prepared', label2: 'to Pass', width: 142 },
  { key: 'stage', label: 'Stage', width: 128 },
  { key: 'active', label: 'Last active', width: 108 },
  { key: 'exam', label: 'Exam date', width: 112 },
]
/* Below this the card scrolls sideways — Learner keeps 262px, its longest email. */
const ROSTER_MIN = ROSTER_COLS.reduce((n, c) => n + (c.width ?? 262), 0)
const CHECKBOX: CSSProperties = { width: 16, height: 16, accentColor: 'var(--admin-brand)', cursor: 'pointer' }
const NAME: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--admin-ink)',
  cursor: 'pointer',
}
const FOOTER: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '12px 20px',
  borderTop: '1px solid var(--admin-rule)',
}
