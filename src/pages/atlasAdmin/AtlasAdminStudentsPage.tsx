import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MagnifyingGlass, Plus, XmarkRegular } from '@/icons'
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
import { ChipMenu, MenuItem, PreparedPill, ProgressRing, ReadinessCell, StagePill } from './adminUi'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={PAGE_H1}>Students</h2>
          <p style={PAGE_SUB}>{counts.total} students · Active pipeline plus licensed in the last 90 days</p>
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

      {/* The blue runs on under the roster card: no gap between them, and the
          roster overlaps the blue's last 24px, so it shows at its top corners. */}
      <section aria-label="Pipeline outcomes" style={{ ...CARD, border: 'none', padding: `24px 24px ${24 + UNDERLAP}px`, marginBottom: -(24 + UNDERLAP), background: 'var(--admin-atlas-primary-100)' }}>
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
                style={{ ...TILE, ...(active ? TILE_ACTIVE : null) }}
              >
                <p style={EYEBROW}>{t.label}</p>
                <p style={{ ...TILE_NUMBER, color: t.color }}>{n}</p>
                <span style={TRACK}>
                  <span style={{ display: 'block', height: '100%', borderRadius: 9999, width: `${Math.max(2, Math.round((n / counts.total) * 100))}%`, background: t.bar }} />
                </span>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--admin-text)' }}>{t.note}</p>
                {t.id === 'licensed' ? (
                  <select
                    aria-label="Licensed time window"
                    value={licensedWindow}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setLicensedWindow(e.target.value)}
                    style={SELECT}
                  >
                    <option value="90d">Last 90 days</option>
                    <option value="year">This year</option>
                    <option value="all">All time</option>
                  </select>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ ...CARD, position: 'relative', overflow: 'hidden' }}>
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
          <div style={{ ...TOOLBAR, background: 'var(--admin-atlas-secondary-100)', color: 'var(--admin-atlas-neutral-800)' }}>
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
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead style={{ background: 'var(--admin-fill-soft)' }}>
              <tr>
                <th style={{ ...TH, width: 40, padding: '12px 16px' }}>
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
                    style={CHECKBOX}
                  />
                </th>
                {['Learner', 'Team', 'Progress (content)', 'Progress (exam prep)', 'Readiness', 'Prepared to Pass', 'Stage', 'Last active', 'Exam date'].map(
                  (h) => (
                    <th key={h} style={TH}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((l) => (
                <tr key={l.id} className="cre-admin-row" style={{ borderTop: '1px solid var(--admin-rule)' }}>
                  <td style={{ ...TD, padding: '12px 16px' }}>
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
                  <td style={{ ...TD, whiteSpace: 'nowrap', color: 'var(--admin-text)' }}>{l.team}</td>
                  <td style={TD}>
                    <ProgressRing pct={l.contentPct} color="var(--admin-success-ink)" label="Course content" />
                  </td>
                  <td style={TD}>
                    <ProgressRing pct={l.prepPct} color="var(--admin-slate-700)" label="Exam prep" />
                  </td>
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
                  <td style={{ ...TD, whiteSpace: 'nowrap', color: 'var(--admin-text)' }}>{formatExamDate(l.examDate)}</td>
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

/* How far the outcome container's blue runs on beneath the roster card. */
const UNDERLAP = 24
const TILE: CSSProperties = {
  borderRadius: 11,
  border: '1px solid var(--admin-fill-soft)', // slate-50, two steps lighter than the rule
  background: 'var(--admin-fill-soft)', // the roster's header row; the selected tile is white
  padding: 16,
  textAlign: 'left',
  cursor: 'pointer',
  outline: 'none',
}
const TILE_ACTIVE: CSSProperties = { background: 'var(--admin-surface)', outline: '1px solid var(--admin-atlas-primary-200)', outlineOffset: -1, boxShadow: 'var(--admin-shadow-tile-active)' }
const TILE_NUMBER: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--admin-font-heading)',
  fontSize: 22,
  fontWeight: 700,
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
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
