import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Learner } from '@/data/atlasAdmin/learners'
import { Download, Play } from '@/icons'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_OUTLINE, CARD, EYEBROW, HEADING, INPUT } from './adminStyles'

/**
 * ATLAS ADMIN — VIDEO ENGAGEMENT (2026-10-20). The reference's
 * /video-engagement: team completion per video, the 1.5× speed flag for
 * audit, a learner × video grid and a drop-off heatmap for one video.
 *
 * ⚠ DEPARTURES FROM THE REFERENCE: its course is "AI for MLO" with five
 * invented learners. Here the videos are Life & Health Pre-Licensing's
 * first four lessons and the learners are the five most active in the
 * roster's course, each cell derived from their content progress — so a
 * name opens a real record. The reference's period filter changes nothing
 * ("date filtering is a follow-up"); here it narrows to who was active in
 * the period.
 */

const VIDEOS = [
  { id: 'v1', short: 'L1: Intro', title: 'Introduction to life insurance', duration: '7:18', mins: 7 },
  { id: 'v2', short: 'L2: Policies', title: 'Policy types: term, whole and universal', duration: '8:42', mins: 8 },
  { id: 'v3', short: 'L3: Riders', title: 'Riders, options and exclusions', duration: '9:05', mins: 9 },
  { id: 'v4', short: 'L4: Health', title: 'Health insurance basics', duration: '6:30', mins: 6 },
] as const

const SPEED_FLAG = 1.5

type Cell = { pct: number | null; sessions: number; maxSpeed: number }

/** A learner's watch record for each video, from their content progress.
 *  The four lessons are the course's first 60%, 15 points each, in order —
 *  so a learner at 40% has finished two, is part-way through the third and
 *  has not opened the fourth. */
function cellsFor(l: Learner, seed: number): Cell[] {
  const content = l.stage === 'licensed' ? 100 : (l.contentPct ?? 0)
  return VIDEOS.map((_, i) => {
    const reach = Math.min(100, Math.max(0, Math.round(((content - i * 15) / 15) * 100)))
    if (reach === 0) return { pct: null, sessions: 0, maxSpeed: 1 }
    const speedy = (seed + i) % 3 === 0
    return { pct: reach, sessions: 1 + ((seed + i) % 3), maxSpeed: speedy ? 1.75 : 1.25 }
  })
}

/** The drop-off curve per video: share still watching at each minute. */
const DROP: Record<string, number[]> = {
  v1: [100, 97, 94, 91, 88, 86, 84, 82],
  v2: [100, 95, 89, 72, 65, 60, 55, 50, 45],
  v3: [100, 96, 92, 88, 79, 70, 66, 63, 61, 58],
  v4: [100, 98, 95, 93, 90, 88, 87],
}
const INSIGHT: Record<string, string> = {
  v1: 'Steady through the end — no single point loses learners.',
  v2: 'Major drop-off around 3:00–4:00 (the universal life section). Consider splitting into two shorter videos or adding a knowledge check.',
  v3: 'Learners leave around 4:00–5:00, where exclusions begin. A worked example there may hold them.',
  v4: 'The shortest video and the best kept — a model for length.',
}

export function AtlasAdminVideoEngagementPage() {
  const { learners } = useAdminStore()
  const [period, setPeriod] = useState<'month' | 'quarter' | 'all'>('month')
  const [video, setVideo] = useState<string>('v2')

  const rows = useMemo(() => {
    const days = period === 'month' ? 30 : period === 'quarter' ? 90 : Infinity
    // Five learners spread across the lessons — one at each fifth of the
    // way through them — so the grid shows the range, not five finishers.
    const pool = learners.filter((l) => (l.contentPct ?? 0) > 5 && (l.contentPct ?? 0) < 75 && l.lastActiveDays <= days).sort((a, b) => (b.contentPct ?? 0) - (a.contentPct ?? 0))
    const picks = pool.length <= 5 ? pool : [0.05, 0.3, 0.5, 0.7, 0.92].map((f) => pool[Math.floor(f * (pool.length - 1))])
    return picks.map((l, i) => ({ learner: l, cells: cellsFor(l, i) }))
  }, [learners, period])

  const started = rows.flatMap((r) => r.cells).filter((c) => c.pct !== null)
  const teamAvg = started.length ? Math.round(started.reduce((n, c) => n + c.pct!, 0) / started.length) : 0
  const completed = started.filter((c) => c.pct === 100).length
  const total = rows.length * VIDEOS.length
  const v = VIDEOS.find((x) => x.id === video)!
  const drop = DROP[video]
  const avgCompletion = Math.round(drop.reduce((a, b) => a + b, 0) / drop.length)

  const exportCsv = () => {
    const head = ['Learner', 'Email', 'Video', 'Completion', 'Sessions', 'Max speed', 'Speed flag']
    const body = rows.flatMap((r) =>
      r.cells.map((c, i) => [r.learner.name, r.learner.email, VIDEOS[i].title, c.pct === null ? 'Not started' : `${c.pct}%`, c.sessions, `${c.maxSpeed}×`, c.maxSpeed > SPEED_FLAG ? 'Yes' : 'No']),
    )
    const csv = [head, ...body].map((row) => row.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'video-audit.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--admin-rule)' }}>
        <div style={{ maxWidth: 560 }}>
          <p style={{ ...EYEBROW, fontSize: 10, color: 'var(--admin-brand)' }}>Video engagement</p>
          <h1 style={{ margin: '4px 0 8px', fontFamily: HEADING, fontSize: 22, fontWeight: 700, color: 'var(--admin-ink)' }}>Life &amp; Health Pre-Licensing</h1>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--admin-text)' }}>
            <strong>Team view</strong> — video completion and drop-off for the course’s first four lessons. Each learner’s own videos are on their record under Students.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select aria-label="Reporting period" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} style={SELECT}>
            <option value="month">This month</option>
            <option value="quarter">This quarter</option>
            <option value="all">All time</option>
          </select>
          <button type="button" onClick={exportCsv} style={BUTTON_OUTLINE}>
            <Download size={13} aria-hidden /> Download audit CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <section style={KPI}>
          <p style={{ ...EYEBROW, fontSize: 10 }}>Team average completion</p>
          <strong style={BIG}>{teamAvg}%</strong>
          <span style={SMALL}>Across started learner–video pairs</span>
        </section>
        <section style={KPI}>
          <p style={{ ...EYEBROW, fontSize: 10 }}>Videos fully completed</p>
          <strong style={BIG}>
            {completed} <span style={{ fontSize: 14, color: 'var(--admin-muted)' }}>/ {total}</span>
          </strong>
          <span style={SMALL}>Watched to the end, at any speed</span>
        </section>
        <section style={KPI}>
          <p style={{ ...EYEBROW, fontSize: 10 }}>Compliance speed flag</p>
          <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--admin-ink)' }}>
            Cells watched faster than <strong>{SPEED_FLAG}×</strong> show an amber badge for audit review. Pre-licensing hours may not count at speed.
          </p>
        </section>
      </div>

      <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: 'var(--admin-fill-soft)', borderBottom: '1px solid var(--admin-rule)' }}>
          <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>Per-learner video completion</strong>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--admin-muted)' }}>Hover a cell for status, sessions, and max speed</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left' }}>Learner</th>
              {VIDEOS.map((x) => (
                <th key={x.id} style={TH} title={x.title}>
                  {x.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ learner: l, cells }) => (
              <tr key={l.id} style={{ borderTop: '1px solid var(--admin-rule)' }}>
                <td style={{ padding: '10px 16px' }}>
                  <Link to={`${ADMIN_BASE}/students/recruit/${encodeURIComponent(l.id)}${window.location.search}`} style={{ color: 'var(--admin-ink)', textDecoration: 'none' }}>
                    {l.name}
                  </Link>
                </td>
                {cells.map((c, i) => {
                  const flagged = c.pct !== null && c.maxSpeed > SPEED_FLAG
                  const color = c.pct === null ? 'var(--admin-faint)' : c.pct === 100 ? 'var(--admin-success-ink)' : c.pct < 50 ? 'var(--admin-brand)' : 'var(--admin-ink)'
                  return (
                    <td
                      key={VIDEOS[i].id}
                      title={c.pct === null ? 'Not started' : `${c.pct === 100 ? 'Completed' : 'In progress'} · ${c.sessions} session${c.sessions === 1 ? '' : 's'} · max ${c.maxSpeed}×`}
                      style={{ padding: '8px 16px', textAlign: 'center' }}
                    >
                      <strong style={{ display: 'block', fontSize: 12, color }}>{c.pct === null ? '—' : `${c.pct}%`}</strong>
                      {flagged ? <span style={SPEED}>SPEED</span> : null}
                    </td>
                  )
                })}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--admin-muted)' }}>
                  No one watched in this period.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--admin-brand-tint)', color: 'var(--admin-brand)' }}>
              <Play size={12} />
            </span>
            <div>
              <strong style={{ fontSize: 15, color: 'var(--admin-ink)' }}>Drop-off heatmap</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>
                {v.title} · Duration {v.duration} · Avg completion {avgCompletion}%
              </p>
            </div>
          </div>
          <select aria-label="Video for heatmap" value={video} onChange={(e) => setVideo(e.target.value)} style={SELECT}>
            {VIDEOS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.short}: {x.title}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
          {drop.map((pct, minute) => (
            <div key={minute} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 40px', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--admin-text)' }}>{minute}:00</span>
              <span style={{ height: 14, borderRadius: 3, background: 'var(--admin-fill-soft)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 3, background: 'var(--admin-brand)', opacity: 0.45 + (pct / 100) * 0.55 }} />
              </span>
              <span style={{ fontSize: 11, textAlign: 'right', color: 'var(--admin-ink)' }}>{pct}%</span>
            </div>
          ))}
        </div>
        <p style={{ margin: '16px 0 0', padding: '10px 12px', borderRadius: 10, background: 'var(--admin-warn-tint)', border: '1px solid var(--admin-warn-edge)', fontSize: 12, color: 'var(--admin-warn-ink)' }}>
          <strong>Insight:</strong> {INSIGHT[video]}
        </p>
      </section>
    </div>
  )
}

const SELECT: CSSProperties = { ...INPUT, width: 'auto', padding: '7px 10px', fontSize: 13, borderRadius: 10 }
const KPI: CSSProperties = { ...CARD, borderRadius: 14, padding: 16 }
const BIG: CSSProperties = { display: 'block', marginTop: 6, fontFamily: HEADING, fontSize: 28, fontWeight: 700, color: 'var(--admin-ink)' }
const SMALL: CSSProperties = { fontSize: 11, color: 'var(--admin-muted)' }
const TH: CSSProperties = { padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', textAlign: 'center' }
const SPEED: CSSProperties = { display: 'inline-block', marginTop: 3, padding: '1px 6px', borderRadius: 9999, background: 'var(--admin-amber-tint)', color: 'var(--admin-amber)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }
