import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { bucketOf, relativeDays, type Learner } from '@/data/atlasAdmin/learners'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, EYEBROW, HEADING, PAGE_H1, PAGE_SUB, PILL } from './adminStyles'

/**
 * ATLAS ADMIN — MY TEAM (2026-10-20). The reference's /my-team: a manager's
 * direct reports as cards, four counts across the top, an All / Needs
 * attention view and three quick actions. Notifications → Manager sends
 * links here.
 *
 * ⚠ ONE DEPARTURE FROM THE REFERENCE: its five reports are hard-coded
 * securities candidates (Series 7, SIE …) that exist nowhere else in its
 * demo. These five are drawn from the roster — one per situation a manager
 * meets — so View details opens a real record and a nudge lands on it.
 */

type Status = 'on-track' | 'at-risk' | 'behind' | 'complete'

const STATUS: Record<Status, { label: string; bg: string; fg: string }> = {
  'on-track': { label: 'On track', bg: 'var(--admin-success-tint)', fg: 'var(--admin-success-ink)' },
  'at-risk': { label: 'At risk', bg: 'var(--admin-amber-tint)', fg: 'var(--admin-amber)' },
  behind: { label: 'Behind', bg: 'var(--admin-brand-tint)', fg: 'var(--admin-brand)' },
  complete: { label: 'Complete', bg: 'var(--admin-fill)', fg: 'var(--admin-ink)' },
}

/** Which roster learners report to the signed-in manager: the first learner
 *  in each of these stages, so the five cover every status. */
const PICKS: ((l: Learner) => boolean)[] = [
  (l) => l.stage === 'in-course' && (l.contentPct ?? 0) >= 70 && l.lastActiveDays <= 1,
  (l) => l.stage === 'prepping' && l.readiness === 'low',
  (l) => l.stage === 'stalled',
  (l) => l.stage === 'licensed',
  (l) => l.stage === 'ready-to-test' && l.examDate !== null,
]

function statusOf(l: Learner): Status {
  const bucket = bucketOf(l)
  if (bucket === 'licensed') return 'complete'
  if (bucket === 'off-track') return 'behind'
  if (l.lastActiveDays > 3 || (l.stage === 'prepping' && l.readiness === 'low')) return 'at-risk'
  return 'on-track'
}

/** Overall progress: content and prep weighted evenly; licensed is done. */
function progressOf(l: Learner) {
  if (l.stage === 'licensed') return 100
  return Math.round(((l.contentPct ?? 0) + (l.prepPct ?? 0)) / 2)
}

function daysUntil(iso: string | null) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86_400_000)
  return days >= 0 ? days : null
}

export function AtlasAdminMyTeamPage() {
  const { learners, addTouch, showToast } = useAdminStore()
  const navigate = useNavigate()
  const [view, setView] = useState<'all' | 'attention'>('all')

  const team = useMemo(() => {
    const picked: Learner[] = []
    for (const pick of PICKS) {
      const hit = learners.find((l) => pick(l) && !picked.includes(l))
      if (hit) picked.push(hit)
    }
    return picked.map((l) => ({ learner: l, status: statusOf(l), progress: progressOf(l) }))
  }, [learners])

  const attention = team.filter((t) => t.status === 'at-risk' || t.status === 'behind')
  const shown = view === 'all' ? team : attention
  const avg = team.length ? Math.round(team.reduce((n, t) => n + t.progress, 0) / team.length) : 0

  const remind = () => {
    const open = team.filter((t) => t.status !== 'complete')
    open.forEach((t) => addTouch({ learnerId: t.learner.id, kind: 'nudge', note: 'Team reminder from My Team' }))
    showToast(`Reminder sent to ${open.length} ${open.length === 1 ? 'person' : 'people'}`)
  }

  const exportCsv = () => {
    const head = ['Name', 'Email', 'Status', 'Course', 'Progress', 'Last active', 'Exam in (days)']
    const body = team.map((t) => [t.learner.name, t.learner.email, STATUS[t.status].label, t.learner.course, `${t.progress}%`, relativeDays(t.learner.lastActiveDays), daysUntil(t.learner.examDate) ?? ''])
    const csv = [head, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'my-team.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={PAGE_H1}>My team’s progress</h1>
        <p style={PAGE_SUB}>Track your direct reports’ training progress and identify who needs support</p>
      </div>

      <div role="radiogroup" aria-label="View" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>View:</span>
        {(
          [
            ['all', `All (${team.length})`],
            ['attention', `Needs attention (${attention.length})`],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" role="radio" aria-checked={view === k} onClick={() => setView(k)} style={view === k ? SEG_ON : SEG}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <Stat value={team.length} label="Direct reports" />
        <Stat value={team.filter((t) => t.status === 'on-track').length} label="On track" color="var(--admin-success)" />
        <Stat value={attention.length} label="Need attention" color="var(--admin-amber)" />
        <Stat value={`${avg}%`} label="Avg progress" />
      </div>

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'minmax(0, 1fr) 280px', alignItems: 'start' }}>
        <section style={{ ...CARD, padding: 20 }}>
          <h2 style={SECTION_H2}>Direct reports</h2>
          <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
            {shown.map(({ learner: l, status, progress }) => {
              const exam = daysUntil(l.examDate)
              return (
                <li key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderTop: '1px solid var(--admin-rule)' }}>
                  <span aria-hidden style={AVATAR}>
                    {l.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 15, color: 'var(--admin-ink)' }}>{l.name}</strong>
                      <span style={{ ...PILL, background: STATUS[status].bg, color: STATUS[status].fg }}>{STATUS[status].label}</span>
                    </div>
                    <p style={{ margin: '2px 0 8px', fontSize: 13, color: 'var(--admin-muted)' }}>{l.course}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--admin-text)' }}>
                      <span>Progress</span>
                      <span style={TRACK}>
                        <span style={{ ...FILL, width: `${progress}%`, background: STATUS[status].fg }} />
                      </span>
                      <strong style={{ color: 'var(--admin-ink)', fontVariantNumeric: 'tabular-nums' }}>{progress}%</strong>
                      <span>{relativeDays(l.lastActiveDays)}</span>
                      {exam !== null && status !== 'complete' ? <span>Exam in {exam} days</span> : null}
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate(`${ADMIN_BASE}/students/recruit/${encodeURIComponent(l.id)}${window.location.search}`)} style={{ ...BUTTON_OUTLINE, padding: '6px 14px', fontSize: 13 }}>
                    View details
                  </button>
                </li>
              )
            })}
            {shown.length === 0 ? <li style={{ padding: '16px 0', fontSize: 14, color: 'var(--admin-muted)' }}>No direct reports in this view.</li> : null}
          </ul>
        </section>

        <aside style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ ...EYEBROW, marginBottom: 4 }}>Quick actions</h2>
          <button type="button" onClick={remind} style={BUTTON_BRAND}>
            Send team reminder
          </button>
          <button type="button" onClick={exportCsv} style={BUTTON_OUTLINE}>
            Export team report
          </button>
          <button type="button" onClick={() => showToast(`1:1 check-ins requested for ${team.length} direct reports`)} style={BUTTON_OUTLINE}>
            Schedule 1:1 check-ins
          </button>
        </aside>
      </div>
    </div>
  )
}

function Stat({ value, label, color = 'var(--admin-ink)' }: { value: number | string; label: string; color?: string }) {
  return (
    <div style={{ ...CARD, padding: '16px 20px' }}>
      <div style={{ fontFamily: HEADING, fontSize: 28, fontWeight: 700, lineHeight: 1.1, color }}>{value}</div>
      <div style={{ marginTop: 4, fontSize: 13, color: 'var(--admin-text)' }}>{label}</div>
    </div>
  )
}

const SECTION_H2: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 18, fontWeight: 700, color: 'var(--admin-ink)' }
const SEG: CSSProperties = {
  borderRadius: 9999,
  border: '1px solid var(--admin-rule-strong)',
  background: 'var(--admin-surface)',
  padding: '5px 12px',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--admin-text)',
  cursor: 'pointer',
}
const SEG_ON: CSSProperties = { ...SEG, border: '1px solid var(--admin-ink)', background: 'var(--admin-ink)', color: 'var(--admin-surface)' }
const AVATAR: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  width: 40,
  height: 40,
  borderRadius: 9999,
  background: 'var(--admin-fill)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--admin-ink)',
}
const TRACK: CSSProperties = { position: 'relative', width: 120, height: 6, borderRadius: 9999, background: 'var(--admin-fill)', overflow: 'hidden' }
const FILL: CSSProperties = { position: 'absolute', inset: '0 auto 0 0', borderRadius: 9999 }
