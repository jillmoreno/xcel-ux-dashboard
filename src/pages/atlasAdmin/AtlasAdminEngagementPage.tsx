import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { ADMIN_DEPARTMENTS, bucketOf, type Learner } from '@/data/atlasAdmin/learners'
import { STATES } from '@/data/atlasAdmin/assignments'
import { Download, Sparkles } from '@/icons'
import { AdminDialog } from './AdminDialog'
import { useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, EYEBROW, HEADING, INPUT, PILL } from './adminStyles'

/**
 * ATLAS ADMIN — ENGAGEMENT ANALYTICS (2026-10-20). The reference's
 * /engagement: the headline five, the Rubi tutor roll-up, Completion
 * velocity, the Exam readiness pipeline, twelve weeks of trends and a
 * benchmarking table — scoped by period and by department.
 *
 * ⚠ DEPARTURES FROM THE REFERENCE: its figures are fixed (287 users, Series
 * 7 and SIE pipelines, Seattle and Denver branches) and its two charts draw
 * nothing. Here every number is counted off the store's roster, so it agrees
 * with Students; the pipeline is by state exam, the benchmark is by
 * department (this agency has no branches), and both charts are drawn.
 * Rubi's roll-up stays the reference's demo figures — there is no tutor log
 * to count.
 */

type Period = 7 | 30 | 90

const PERIODS: { days: Period; label: string }[] = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
]

const avg = (ns: number[]) => (ns.length ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length) : 0)

/** Engagement score: activity, content and scores weighted evenly, 0–100. */
function engagementOf(group: Learner[], period: Period) {
  if (!group.length) return 0
  const active = group.filter((l) => l.lastActiveDays <= period).length / group.length
  const content = avg(group.map((l) => l.contentPct ?? 0)) / 100
  const quiz = avg(group.filter((l) => l.score !== null).map((l) => l.score!)) / 100
  return Math.round(((active + content + quiz) / 3) * 100)
}

function readinessOf(l: Learner): 'ready' | 'on-track' | 'at-risk' | 'behind' {
  const b = bucketOf(l)
  if (b === 'prepared' || b === 'licensed') return 'ready'
  if (b === 'off-track') return 'behind'
  if (l.readiness === 'low' || l.lastActiveDays > 7) return 'at-risk'
  return 'on-track'
}

const READY_COLORS = {
  ready: 'var(--admin-success)',
  'on-track': 'var(--admin-chart-blue)',
  'at-risk': 'var(--admin-amber)',
  behind: 'var(--admin-brand)',
} as const
const READY_LABEL = { ready: 'Ready', 'on-track': 'On track', 'at-risk': 'At risk', behind: 'Behind' } as const

export function AtlasAdminEngagementPage() {
  const { learners, showToast } = useAdminStore()
  const [period, setPeriod] = useState<Period>(30)
  const [team, setTeam] = useState('all')
  const [rollup, setRollup] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly')
  const [state, setState] = useState('all')
  const [summary, setSummary] = useState(false)

  const scoped = useMemo(() => (team === 'all' ? learners : learners.filter((l) => l.team === team)), [learners, team])
  const active = scoped.filter((l) => l.lastActiveDays <= period)
  const activePct = scoped.length ? Math.round((1000 * active.length) / scoped.length) / 10 : 0
  const completion = avg(scoped.map((l) => (l.stage === 'licensed' ? 100 : (l.contentPct ?? 0))))
  const quiz = avg(scoped.filter((l) => l.score !== null).map((l) => l.score!))
  const score = engagementOf(scoped, period)
  const expected = 60
  const pace = completion - expected

  const pipeline = STATES.map(([code, name]) => {
    const group = scoped.filter((l) => l.state === code)
    const counts = { ready: 0, 'on-track': 0, 'at-risk': 0, behind: 0 }
    group.forEach((l) => counts[readinessOf(l)]++)
    return { code, name: `${name} Life & Health`, total: group.length, counts }
  }).filter((p) => p.total > 0)

  const benchmark = useMemo(() => {
    const rows = ADMIN_DEPARTMENTS.map((d) => {
      const group = learners.filter((l) => l.team === d && (state === 'all' || l.state === state))
      const recent = group.filter((l) => l.lastActiveDays <= 7).length
      const older = group.filter((l) => l.lastActiveDays > 7 && l.lastActiveDays <= 14).length
      return {
        name: d,
        states: [...new Set(group.map((l) => l.state))].join(', ') || '—',
        completion: avg(group.map((l) => (l.stage === 'licensed' ? 100 : (l.contentPct ?? 0)))),
        quiz: avg(group.filter((l) => l.score !== null).map((l) => l.score!)),
        velocity: avg(group.map((l) => Math.min(100, Math.round(((l.contentPct ?? 0) / Math.max(1, l.enrolledDaysAgo)) * 30)))),
        engagement: engagementOf(group, period),
        active: group.filter((l) => l.lastActiveDays <= period).length,
        total: group.length,
        trend: recent > older ? 'up' : recent < older ? 'down' : 'flat',
      }
    }).filter((r) => r.total > 0)
    return rows.sort((a, b) => b.completion - a.completion)
  }, [learners, state, period])

  /** Twelve weeks of active learners, oldest first, from last-active days. */
  const weeks = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const weeksAgo = 11 - i
      const d = new Date(today)
      d.setDate(d.getDate() - weeksAgo * 7)
      const activeThen = scoped.filter((l) => l.enrolledDaysAgo >= weeksAgo * 7 && l.lastActiveDays <= weeksAgo * 7 + 21).length
      return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: activeThen }
    })
  }, [scoped])

  /** Completion velocity: where the scope's average content stood at each
   *  of the first twelve weeks after enrolment, taking each learner's
   *  progress as steady over the time they have been enrolled. */
  const velocity = useMemo(
    () =>
      Array.from({ length: 12 }, (_, w) => {
        const days = (w + 1) * 7
        const actual = avg(scoped.map((l) => Math.min(l.contentPct ?? 0, Math.round(((l.contentPct ?? 0) * days) / Math.max(7, l.enrolledDaysAgo)))))
        return { label: `W${w + 1}`, actual, expected: Math.round(((w + 1) / 12) * 100) }
      }),
    [scoped],
  )

  const exportCsv = () => {
    const head = ['Rank', 'Department', 'States', 'Completion', 'Avg quiz', 'Velocity', 'Engagement', 'Active', 'Total', 'Trend']
    const body = benchmark.map((r, i) => [i + 1, r.name, r.states, `${r.completion}%`, `${r.quiz}%`, r.velocity, r.engagement, r.active, r.total, r.trend])
    const csv = [head, ...body].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'engagement.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const scopeLabel = team === 'all' ? 'all departments' : team
  const summaryText = [
    `Engagement summary — ${scopeLabel}, ${PERIODS.find((p) => p.days === period)!.label.toLowerCase()}`,
    '',
    `• ${activePct}% active (${active.length} of ${scoped.length} learners).`,
    `• Average course completion ${completion}% against an expected ${expected}% — ${pace >= 0 ? `${pace} points ahead` : `${-pace} points behind`}.`,
    `• Average quiz score ${quiz}%; engagement score ${score}.`,
    ...pipeline.map((p) => {
      const n = p.counts['at-risk'] + p.counts.behind
      return `• ${p.name}: ${p.counts.ready} ready and ${n} ${n === 1 ? 'needs' : 'need'} attention, of ${p.total}.`
    }),
    benchmark[0] ? `• Leading department: ${benchmark[0].name} (${benchmark[0].completion}% completion).` : '',
  ].join('\n')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section style={{ ...CARD, borderRadius: 14, padding: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: HEADING, fontSize: 20, fontWeight: 700, color: 'var(--admin-ink)' }}>Engagement Analytics</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-text)' }}>Platform adoption, engagement trends, and department performance</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select aria-label="Period" value={period} onChange={(e) => setPeriod(Number(e.target.value) as Period)} style={SELECT}>
            {PERIODS.map((p) => (
              <option key={p.days} value={p.days}>
                {p.label}
              </option>
            ))}
          </select>
          <select aria-label="Department" value={team} onChange={(e) => setTeam(e.target.value)} style={{ ...SELECT, width: 200 }}>
            <option value="all">All departments</option>
            {ADMIN_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button type="button" onClick={exportCsv} style={BUTTON_OUTLINE}>
            <Download size={13} aria-hidden /> Export CSV
          </button>
          <button type="button" onClick={() => setSummary(true)} style={BUTTON_BRAND}>
            Executive Summary
          </button>
        </div>
      </section>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <section style={{ ...CARD, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Donut pct={activePct} />
          <span style={{ marginTop: 6, fontSize: 11, color: 'var(--admin-muted)' }}>
            {active.length} of {scoped.length} users
          </span>
        </section>
        <Kpi value={`${completion}%`} label="Avg completion" color="var(--admin-success-ink)" />
        <Kpi value={`${quiz}%`} label="Avg quiz score" color="var(--admin-chart-blue)" />
        <Kpi value={score} label="Engagement score" color="var(--admin-chart-violet)" />
        <Kpi value={pace >= 0 ? 'On pace' : 'Behind pace'} label={`${Math.abs(pace)} pts ${pace >= 0 ? 'ahead' : 'behind'}`} color={pace >= 0 ? 'var(--admin-chart-blue)' : 'var(--admin-brand)'} />
      </div>

      <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span aria-hidden style={ICON_TILE}>
              <Sparkles size={14} />
            </span>
            <div>
              <strong style={{ fontSize: 14, color: 'var(--admin-ink)' }}>Rubi AI tutor (team)</strong>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--admin-muted)' }}>Aggregates only — no learner’s conversation is shown (demo figures)</p>
            </div>
          </div>
          <select aria-label="Roll-up" value={rollup} onChange={(e) => setRollup(e.target.value as typeof rollup)} style={{ ...SELECT, width: 'auto', padding: '4px 8px', fontSize: 12 }}>
            {(['Daily', 'Weekly', 'Monthly'] as const).map((r) => (
              <option key={r} value={r}>
                {r} roll-up
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginTop: 12 }}>
          {[
            ['Conversations', { Daily: 1, Weekly: 2, Monthly: 3 }[rollup], null],
            ['Total messages', { Daily: 2, Weekly: 5, Monthly: 8 }[rollup], null],
            ['Rubi adoption', '100%', '3 / 3 learners'],
            ['Avg msgs / convo', { Daily: '2.0', Weekly: '2.5', Monthly: '2.7' }[rollup], null],
          ].map(([k, v, sub]) => (
            <div key={k as string} style={{ borderRadius: 10, padding: 12, background: 'var(--admin-fill-soft)' }}>
              <p style={{ ...EYEBROW, fontSize: 10 }}>{k}</p>
              <strong style={{ display: 'block', marginTop: 4, fontFamily: HEADING, fontSize: 20, color: 'var(--admin-ink)' }}>{v}</strong>
              {sub ? <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{sub}</span> : null}
            </div>
          ))}
        </div>
        <p style={{ ...EYEBROW, fontSize: 10, marginTop: 14 }}>Top topics (from learner prompts)</p>
        <ol style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: 'var(--admin-ink)' }}>
          <li>Annuity suitability (2)</li>
          <li>Policy riders &amp; provisions (1)</li>
          <li>Florida insurance law (1)</li>
        </ol>
      </section>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
        <Panel title="Completion velocity" aside="Expected vs actual">
          <LineChart points={velocity} />
          <Legend items={[['Actual completion', 'var(--admin-success)'], ['Expected', 'var(--admin-rule-strong)']]} />
        </Panel>
        <Panel title="Exam readiness pipeline" aside="By state exam">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pipeline.map((p) => (
              <div key={p.code}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--admin-ink)' }}>
                  <span>{p.name}</span>
                  <span style={{ color: 'var(--admin-muted)' }}>{p.total} learners</span>
                </div>
                <div style={{ display: 'flex', height: 6, marginTop: 6, borderRadius: 9999, overflow: 'hidden', background: 'var(--admin-fill)' }}>
                  {(Object.keys(READY_COLORS) as (keyof typeof READY_COLORS)[]).map((k) => (
                    <span key={k} title={`${READY_LABEL[k]}: ${p.counts[k]}`} style={{ width: `${(100 * p.counts[k]) / p.total}%`, background: READY_COLORS[k] }} />
                  ))}
                </div>
                <Legend small items={(Object.keys(READY_COLORS) as (keyof typeof READY_COLORS)[]).map((k) => [`${READY_LABEL[k]}: ${p.counts[k]}`, READY_COLORS[k]])} />
              </div>
            ))}
            {pipeline.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-muted)' }}>No learners in this scope.</p> : null}
          </div>
        </Panel>
      </div>

      <Panel title="Engagement trends" aside="Last 12 weeks">
        <BarChart bars={weeks} />
        <Legend items={[['Active learners', 'var(--admin-brand)']]} />
      </Panel>

      <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
          <h2 style={H2}>Department benchmarking</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--admin-text)' }}>
            State:
            <select value={state} onChange={(e) => setState(e.target.value)} style={{ ...SELECT, width: 'auto', padding: '4px 8px', fontSize: 12 }}>
              <option value="all">All states</option>
              {STATES.map(([c, n]) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--admin-fill-soft)' }}>
              <tr>
                {['Rank', 'Department', 'Completion', 'Avg quiz', 'Velocity', 'Engagement', 'Active', 'Trend'].map((h, i) => (
                  <th key={h} style={{ ...TH, textAlign: i < 2 ? 'left' : 'center' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {benchmark.map((r, i) => (
                <tr key={r.name} style={{ borderTop: '1px solid var(--admin-rule)' }}>
                  <td style={TD}>
                    <span style={{ ...RANK, ...(i < 3 ? { background: 'var(--admin-amber-tint)', color: 'var(--admin-amber)' } : null) }}>{i + 1}</span>
                  </td>
                  <td style={TD}>
                    <strong style={{ display: 'block', fontWeight: 600, color: 'var(--admin-ink)' }}>{r.name}</strong>
                    <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{r.states}</span>
                  </td>
                  <td style={{ ...TDC, fontWeight: 700, color: r.completion >= 50 ? 'var(--admin-success-ink)' : 'var(--admin-amber)' }}>{r.completion}%</td>
                  <td style={TDC}>{r.quiz}%</td>
                  <td style={TDC}>{r.velocity}</td>
                  <td style={TDC}>
                    <span style={{ ...PILL, padding: '4px 8px', background: r.engagement >= 50 ? 'var(--admin-success-tint)' : 'var(--admin-amber-tint)', color: r.engagement >= 50 ? 'var(--admin-success-ink)' : 'var(--admin-amber)' }}>{r.engagement}</span>
                  </td>
                  <td style={TDC}>
                    {r.active}/{r.total}
                  </td>
                  <td style={{ ...TDC, fontSize: 15, color: r.trend === 'up' ? 'var(--admin-success-ink)' : r.trend === 'down' ? 'var(--admin-brand)' : 'var(--admin-text)' }} aria-label={r.trend}>
                    {r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {summary ? (
        <AdminDialog
          title="Executive summary"
          subtitle="Plain text, ready to paste into an email."
          width={560}
          onClose={() => setSummary(false)}
          footer={
            <>
              <button type="button" onClick={() => setSummary(false)} style={BUTTON_OUTLINE}>
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(summaryText).catch(() => undefined)
                  showToast('Summary copied')
                }}
                style={BUTTON_BRAND}
              >
                Copy summary
              </button>
            </>
          }
        >
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6, color: 'var(--admin-ink)' }}>{summaryText}</pre>
        </AdminDialog>
      ) : null}
    </div>
  )
}

function Donut({ pct }: { pct: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg width={88} height={88} viewBox="0 0 88 88" role="img" aria-label={`${pct}% active`}>
      <circle cx={44} cy={44} r={r} fill="none" stroke="var(--admin-fill)" strokeWidth={8} />
      <circle cx={44} cy={44} r={r} fill="none" stroke="var(--admin-success)" strokeWidth={8} strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} transform="rotate(-90 44 44)" />
      <text x={44} y={44} textAnchor="middle" style={{ fontFamily: HEADING, fontSize: 16, fontWeight: 700, fill: 'var(--admin-ink)' }}>
        {pct}%
      </text>
      <text x={44} y={58} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--admin-muted)' }}>
        Active
      </text>
    </svg>
  )
}

function Kpi({ value, label, color }: { value: ReactNode; label: string; color: string }) {
  return (
    <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
      <strong style={{ display: 'block', fontFamily: HEADING, fontSize: 22, color }}>{value}</strong>
      <span style={{ fontSize: 12, color: 'var(--admin-text)' }}>{label}</span>
    </section>
  )
}

function Panel({ title, aside, children }: { title: string; aside: string; children: ReactNode }) {
  return (
    <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 style={H2}>{title}</h2>
        <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{aside}</span>
      </div>
      {children}
    </section>
  )
}

function Legend({ items, small }: { items: [string, string][]; small?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: small ? 10 : 16, justifyContent: small ? 'flex-start' : 'center', marginTop: small ? 4 : 10, fontSize: small ? 10 : 11, color: 'var(--admin-text)' }}>
      {items.map(([label, color]) => (
        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: 9999, background: color }} />
          {label}
        </span>
      ))}
    </div>
  )
}

const W = 520
const H = 180
const PAD = { l: 28, r: 8, t: 8, b: 22 }

function LineChart({ points }: { points: { label: string; actual: number; expected: number }[] }) {
  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / (points.length - 1)
  const y = (v: number) => PAD.t + ((100 - v) * (H - PAD.t - PAD.b)) / 100
  const path = (key: 'actual' | 'expected') => points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p[key])}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Completion velocity, expected against actual">
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--admin-rule)" />
          <text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" style={AXIS}>
            {v}
          </text>
        </g>
      ))}
      <path d={path('expected')} fill="none" stroke="var(--admin-rule-strong)" strokeWidth={2} strokeDasharray="4 4" />
      <path d={path('actual')} fill="none" stroke="var(--admin-success)" strokeWidth={2.5} />
      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.actual)} r={3} fill="var(--admin-success)">
            <title>{`${p.label}: ${p.actual}% actual, ${p.expected}% expected`}</title>
          </circle>
          <text x={x(i)} y={H - 6} textAnchor="middle" style={AXIS}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function BarChart({ bars }: { bars: { label: string; value: number }[] }) {
  const W = 1040
  const max = Math.max(1, ...bars.map((b) => b.value))
  const slot = (W - PAD.l - PAD.r) / bars.length
  const y = (v: number) => PAD.t + ((max - v) * (H - PAD.t - PAD.b)) / max
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Active learners by week, last 12 weeks">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(max * f)} y2={y(max * f)} stroke="var(--admin-rule)" />
          <text x={PAD.l - 6} y={y(max * f) + 3} textAnchor="end" style={AXIS}>
            {Math.round(max * f)}
          </text>
        </g>
      ))}
      {bars.map((b, i) => (
        <g key={b.label}>
          <rect x={PAD.l + i * slot + slot * 0.2} y={y(b.value)} width={slot * 0.6} height={H - PAD.b - y(b.value)} rx={3} fill="var(--admin-brand)">
            <title>{`Week of ${b.label}: ${b.value} active`}</title>
          </rect>
          <text x={PAD.l + i * slot + slot / 2} y={H - 6} textAnchor="middle" style={AXIS}>
            {b.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

const AXIS: CSSProperties = { fontSize: 9, fill: 'var(--admin-muted)' }
const H2: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 15, fontWeight: 700, color: 'var(--admin-ink)' }
const SELECT: CSSProperties = { ...INPUT, width: 'auto', padding: '7px 10px', fontSize: 13, borderRadius: 10 }
const ICON_TILE: CSSProperties = { display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--admin-fill)', color: 'var(--admin-chart-violet)' }
const TH: CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', whiteSpace: 'nowrap' }
const TD: CSSProperties = { padding: '10px 16px' }
const TDC: CSSProperties = { ...TD, textAlign: 'center', color: 'var(--admin-ink)' }
const RANK: CSSProperties = { display: 'inline-grid', placeItems: 'center', width: 22, height: 22, borderRadius: 9999, background: 'var(--admin-fill)', fontSize: 11, fontWeight: 700, color: 'var(--admin-text)' }
