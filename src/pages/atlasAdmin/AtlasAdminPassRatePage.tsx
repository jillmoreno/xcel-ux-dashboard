import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { PASS_COHORTS, RISK_LABEL, riskOf, type Risk } from '@/data/atlasAdmin/enterprise'
import { ChartSimple, CircleCheck, Clock, CircleXmarkThin, TriangleExclamation, Users } from '@/icons'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_OUTLINE, CARD, EYEBROW, HEADING, PILL } from './adminStyles'
import { EnterpriseHeader, StatTile } from './enterpriseUi'

/**
 * ATLAS ADMIN — PASS RATE & EARLY RISK (2026-10-20). The reference's
 * /enterprise/pass-rate: overall pass rate and its parts, then three views —
 * Charts (by program, attempts by cohort, time to completion), By cohort
 * (the table) and Intervention candidates (the risk rules, prioritized, with
 * a suggested action and a Contact button).
 *
 * The cohort figures are the agency's exam results (`PASS_COHORTS`): CE
 * finals and the NY and Florida state exams. Intervention candidates are
 * the store's roster run through `riskOf`, high priority first.
 */

type View = 'charts' | 'cohort' | 'intervention'

export function AtlasAdminPassRatePage() {
  const { learners, addTouch, showToast } = useAdminStore()
  const [now] = useState(() => Date.now())
  const [view, setView] = useState<View>('charts')
  const [contacted, setContacted] = useState<Record<string, string>>({})

  const passed = PASS_COHORTS.reduce((n, c) => n + c.passed, 0)
  const failed = PASS_COHORTS.reduce((n, c) => n + c.failed, 0)
  const pending = PASS_COHORTS.reduce((n, c) => n + c.pending, 0)
  const rate = (p: number, f: number) => (p + f ? Math.round((1000 * p) / (p + f)) / 10 : 0)
  const programs = [...new Set(PASS_COHORTS.map((c) => c.program))].map((program) => {
    const rows = PASS_COHORTS.filter((c) => c.program === program)
    return { program, rate: rate(rows.reduce((n, c) => n + c.passed, 0), rows.reduce((n, c) => n + c.failed, 0)) }
  })
  const maxAttempts = Math.max(...PASS_COHORTS.map((c) => c.attempts))

  const candidates = useMemo(
    () =>
      learners
        .map((l) => riskOf(l, now))
        .filter((r): r is Risk => r !== null)
        .sort((a, b) => (a.priority === b.priority ? b.learner.lastActiveDays - a.learner.lastActiveDays : a.priority === 'high' ? -1 : 1)),
    [learners, now],
  )

  const contact = (r: Risk) => {
    addTouch({ learnerId: r.learner.id, kind: 'email', note: `Intervention: ${r.action}` })
    setContacted((c) => ({ ...c, [r.learner.id]: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }))
    showToast(`${r.action} — logged for ${r.learner.name}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EnterpriseHeader title="Pass Rate & Early Risk" sub="“Pass-rate transparency with early risk indicators” — insurance agency view" info="Pass rate counts passed against failed; pending attempts are left out until they have a result." />

      <div role="tablist" aria-label="View" style={{ ...CARD, borderRadius: 12, padding: 6, display: 'flex', gap: 4 }}>
        {(
          [
            ['charts', 'Charts', <ChartSimple key="i" size={12} />],
            ['cohort', 'By cohort', <Users key="i" size={12} />],
            ['intervention', 'Intervention candidates', <TriangleExclamation key="i" size={12} />],
          ] as const
        ).map(([k, label, icon]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => setView(k)} style={view === k ? TAB_ON : TAB}>
            {icon} {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <StatTile label="Overall pass rate" value={`${rate(passed, failed)}%`} ink="var(--admin-success-ink)" tint="var(--admin-success-tint)" icon={<CircleCheck size={13} />} />
        <StatTile label="Total passed" value={passed.toLocaleString('en-US')} ink="var(--admin-success-ink)" tint="var(--admin-success-tint)" icon={<CircleCheck size={13} />} />
        <StatTile label="Total failed" value={failed} ink="var(--admin-brand)" tint="var(--admin-brand-tint)" icon={<CircleXmarkThin size={14} />} />
        <StatTile label="Pending" value={pending} ink="var(--admin-amber)" tint="var(--admin-amber-tint)" icon={<Clock size={13} />} />
      </div>

      {view === 'charts' ? (
        <>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <section style={PANEL}>
              <p style={{ ...EYEBROW, fontSize: 11 }}>Pass rate by program</p>
              {programs.map((p) => (
                <Bar key={p.program} label={p.program} value={`${p.rate}%`} pct={p.rate} color="var(--admin-success)" ink="var(--admin-success-ink)" />
              ))}
            </section>
            <section style={PANEL}>
              <p style={{ ...EYEBROW, fontSize: 11 }}>Average attempts by cohort</p>
              {PASS_COHORTS.map((c) => (
                <Bar key={c.cohort + c.program} label={`${c.cohort} · ${c.program}`} value={`${c.attempts} attempts`} pct={(c.attempts / (maxAttempts * 1.6)) * 100} color="var(--admin-chart-blue)" ink="var(--admin-chart-blue)" />
              ))}
            </section>
          </div>
          <section style={PANEL}>
            <p style={{ ...EYEBROW, fontSize: 11 }}>Time to completion summary</p>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {PASS_COHORTS.map((c) => (
                <div key={c.cohort + c.program} style={{ padding: 12, borderRadius: 10, background: 'var(--admin-fill-soft)' }}>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--admin-ink)' }}>{c.program}</span>
                  <span style={{ fontSize: 10, color: 'var(--admin-muted)' }}>{c.cohort}</span>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontFamily: HEADING, fontSize: 16, color: 'var(--admin-ink)' }}>
                    <Clock size={12} aria-hidden style={{ color: 'var(--admin-muted)' }} /> {c.weeks} weeks
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {view === 'cohort' ? (
        <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: 'var(--admin-fill-soft)' }}>
                <tr>
                  {['Cohort', 'Program', 'Total learners', 'Passed', 'Failed', 'Pending', 'Pass rate', 'Avg attempts', 'Avg time'].map((h) => (
                    <th key={h} style={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PASS_COHORTS.map((c) => (
                  <tr key={c.cohort + c.program} style={{ borderTop: '1px solid var(--admin-rule)' }}>
                    <td style={{ ...TD, fontWeight: 600, color: 'var(--admin-ink)' }}>{c.cohort}</td>
                    <td style={{ ...TD, color: 'var(--admin-text)' }}>{c.program}</td>
                    <td style={TD}>{c.total}</td>
                    <td style={{ ...TD, color: 'var(--admin-success-ink)' }}>{c.passed}</td>
                    <td style={{ ...TD, color: 'var(--admin-brand)' }}>{c.failed}</td>
                    <td style={{ ...TD, color: 'var(--admin-amber)' }}>{c.pending}</td>
                    <td style={{ ...TD, fontWeight: 700 }}>{rate(c.passed, c.failed)}%</td>
                    <td style={TD}>{c.attempts}</td>
                    <td style={TD}>{c.weeks} weeks</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {view === 'intervention' ? (
        <>
          <section style={{ ...PANEL, flexDirection: 'row', alignItems: 'flex-start', background: 'var(--admin-fill-soft)' }}>
            <span>
              <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>Deterministic rule-based detection</strong>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-text)' }}>These candidates are identified by fixed rules, not AI. Tags come from stalled activity, failing practice exams, low velocity and exam-date proximity.</p>
            </span>
          </section>
          <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: 'var(--admin-fill-soft)' }}>
                  <tr>
                    {['Priority', 'Learner', 'Program', 'Tags', 'Suggested action', 'Last contact', ''].map((h) => (
                      <th key={h} style={TH}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((r) => (
                    <tr key={r.learner.id} style={{ borderTop: '1px solid var(--admin-rule)' }}>
                      <td style={TD}>
                        <span style={{ ...PILL, fontSize: 10, letterSpacing: '0.06em', ...(r.priority === 'high' ? { background: 'var(--admin-brand-tint)', color: 'var(--admin-brand)' } : { background: 'var(--admin-amber-tint)', color: 'var(--admin-amber)' }) }}>{r.priority.toUpperCase()}</span>
                      </td>
                      <td style={TD}>
                        <Link to={`${ADMIN_BASE}/students/recruit/${encodeURIComponent(r.learner.id)}${window.location.search}`} style={{ display: 'block', fontWeight: 600, color: 'var(--admin-ink)', textDecoration: 'none' }}>
                          {r.learner.name}
                        </Link>
                        <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{r.learner.email}</span>
                      </td>
                      <td style={{ ...TD, color: 'var(--admin-text)' }}>{r.learner.course}</td>
                      <td style={TD}>
                        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }} title={RISK_LABEL[r.type]}>
                          {r.tags.map((t) => (
                            <span key={t} style={{ ...PILL, fontSize: 10, padding: '1px 7px', background: 'var(--admin-fill)', color: 'var(--admin-text)' }}>
                              {t}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td style={{ ...TD, color: 'var(--admin-ink)' }}>{r.action}</td>
                      <td style={{ ...TD, color: 'var(--admin-muted)', whiteSpace: 'nowrap' }}>{contacted[r.learner.id] ?? '—'}</td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <button type="button" disabled={!!contacted[r.learner.id]} onClick={() => contact(r)} style={{ ...BUTTON_OUTLINE, padding: '4px 10px', fontSize: 12, opacity: contacted[r.learner.id] ? 0.5 : 1 }}>
                          {contacted[r.learner.id] ? 'Contacted' : 'Contact'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

function Bar({ label, value, pct, color, ink }: { label: string; value: string; pct: number; color: string; ink: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
        <span style={{ color: 'var(--admin-ink)' }}>{label}</span>
        <span style={{ fontWeight: 600, color: ink, whiteSpace: 'nowrap' }}>{value}</span>
      </div>
      <span style={{ display: 'block', height: 6, marginTop: 4, borderRadius: 9999, background: 'var(--admin-fill)' }}>
        <span style={{ display: 'block', height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 9999, background: color }} />
      </span>
    </div>
  )
}

const PANEL: CSSProperties = { ...CARD, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }
const TAB: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', borderRadius: 8, background: 'none', padding: '6px 12px', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', cursor: 'pointer' }
const TAB_ON: CSSProperties = { ...TAB, background: 'var(--admin-brand)', color: 'var(--admin-surface)' }
const TH: CSSProperties = { padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', textAlign: 'left', whiteSpace: 'nowrap' }
const TD: CSSProperties = { padding: '10px 14px', verticalAlign: 'middle', color: 'var(--admin-ink)' }
