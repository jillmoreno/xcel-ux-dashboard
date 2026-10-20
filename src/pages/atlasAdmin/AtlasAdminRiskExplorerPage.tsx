import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_DEPARTMENTS, relativeDays } from '@/data/atlasAdmin/learners'
import { RISK_LABEL, cohortOf, riskOf, type Risk, type RiskType } from '@/data/atlasAdmin/enterprise'
import { Download } from '@/icons'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_OUTLINE, CARD, INPUT, PILL } from './adminStyles'
import { downloadCsv } from './csv'
import { EnterpriseHeader } from './enterpriseUi'

/**
 * ATLAS ADMIN — RISK EXPLORER (2026-10-20). The reference's
 * /enterprise/risk-explorer: every learner a risk rule flags, filtered by
 * risk type, program, cohort and manager. The rules are `riskOf` in
 * data/atlasAdmin/enterprise.ts — deterministic, not a model — run over the
 * store's roster, so a nudge here lands on the same record Students opens.
 *
 * ⚠ DEPARTURE: the reference lists eight invented CE learners. These are
 * pre-licensing learners, the program is their course, the cohort their
 * enrolment month and the manager their department lead.
 */

const RISK_TONE: Record<RiskType, [string, string]> = {
  stalled: ['var(--admin-amber-tint)', 'var(--admin-amber)'],
  'low-velocity': ['var(--admin-fill)', 'var(--admin-chart-blue)'],
  'repeated-failure': ['var(--admin-brand-tint)', 'var(--admin-brand)'],
  'time-anomaly': ['var(--admin-fill)', 'var(--admin-chart-violet)'],
  'due-soon': ['var(--admin-warn-tint)', 'var(--admin-warn-ink)'],
  overdue: ['var(--admin-brand-tint)', 'var(--admin-brand)'],
}

export function AtlasAdminRiskExplorerPage() {
  const { learners, addTouch, showToast } = useAdminStore()
  const [now] = useState(() => Date.now())
  const [type, setType] = useState<RiskType | 'all'>('all')
  const [cohort, setCohort] = useState('all')
  const [manager, setManager] = useState('all')
  const [nudged, setNudged] = useState<Set<string>>(new Set())

  const risks = useMemo(
    () =>
      learners
        .map((l) => riskOf(l, now))
        .filter((r): r is Risk => r !== null)
        .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1)),
    [learners, now],
  )
  const cohorts = useMemo(() => [...new Set(risks.map((r) => cohortOf(r.learner, now)))], [risks, now])
  const counts = (Object.keys(RISK_LABEL) as RiskType[]).map((t) => [t, risks.filter((r) => r.type === t).length] as const)
  const shown = risks.filter((r) => (type === 'all' || r.type === type) && (cohort === 'all' || cohortOf(r.learner, now) === cohort) && (manager === 'all' || r.learner.team === manager))

  const nudge = (r: Risk) => {
    addTouch({ learnerId: r.learner.id, kind: 'nudge', note: `Risk explorer: ${RISK_LABEL[r.type]}` })
    setNudged((s) => new Set(s).add(r.learner.id))
    showToast(`Nudge sent to ${r.learner.name}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EnterpriseHeader
        title="Risk Explorer"
        sub="“Help me understand risk without digging” — pre-licensing pipeline"
        info="Each learner is flagged by the first rule they meet: exam date passed with no licence, exam within 14 days and not prepared, practice exams failing after 60% prep, no activity for 14+ days, under 2 points of content a week, or the course finished in under 5 days."
        actions={
          <button
            type="button"
            onClick={() => downloadCsv('at-risk-learners.csv', [['Learner', 'Email', 'Risk', 'Reason', 'Course', 'Cohort', 'Content %', 'Department', 'Last active'], ...shown.map((r) => [r.learner.name, r.learner.email, RISK_LABEL[r.type], r.reason, r.learner.course, cohortOf(r.learner, now), r.learner.contentPct ?? 0, r.learner.team, relativeDays(r.learner.lastActiveDays)])])}
            style={BUTTON_OUTLINE}
          >
            <Download size={13} aria-hidden /> Export
          </button>
        }
      />

      <section style={{ ...CARD, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div role="radiogroup" aria-label="Risk type" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', marginRight: 4 }}>Risk types</span>
          <Seg on={type === 'all'} onClick={() => setType('all')} label={`All (${risks.length})`} />
          {counts.map(([t, n]) => (
            <Seg key={t} on={type === t} onClick={() => setType(t)} label={`${RISK_LABEL[t]} (${n})`} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--admin-text)' }}>Filters:</span>
          <select aria-label="Cohort" value={cohort} onChange={(e) => setCohort(e.target.value)} style={SELECT}>
            <option value="all">All cohorts</option>
            {cohorts.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select aria-label="Department lead" value={manager} onChange={(e) => setManager(e.target.value)} style={SELECT}>
            <option value="all">All managers</option>
            {ADMIN_DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
      </section>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-muted)' }}>Showing {shown.length} at-risk learners</p>
      <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--admin-fill-soft)' }}>
              <tr>
                {['Learner', 'Risk type', 'Reason', 'Program', 'Progress', 'Manager', 'Last activity', ''].map((h) => (
                  <th key={h} style={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.learner.id} style={{ borderTop: '1px solid var(--admin-rule)' }}>
                  <td style={TD}>
                    <Link to={`${ADMIN_BASE}/students/recruit/${encodeURIComponent(r.learner.id)}${window.location.search}`} style={{ display: 'block', fontWeight: 600, color: 'var(--admin-ink)', textDecoration: 'none' }}>
                      {r.learner.name}
                    </Link>
                    <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{r.learner.email}</span>
                  </td>
                  <td style={TD}>
                    <span style={{ ...PILL, fontSize: 11, background: RISK_TONE[r.type][0], color: RISK_TONE[r.type][1] }}>{RISK_LABEL[r.type]}</span>
                  </td>
                  <td style={{ ...TD, color: 'var(--admin-text)' }}>{r.reason}</td>
                  <td style={TD}>
                    <span style={{ display: 'block', color: 'var(--admin-ink)' }}>{r.learner.course}</span>
                    <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{cohortOf(r.learner, now)}</span>
                  </td>
                  <td style={TD}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 60, height: 5, borderRadius: 9999, background: 'var(--admin-fill)', overflow: 'hidden' }}>
                        <span style={{ display: 'block', height: '100%', width: `${r.learner.contentPct ?? 0}%`, background: 'var(--admin-chart-blue)' }} />
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--admin-ink)' }}>{r.learner.contentPct ?? 0}%</span>
                    </span>
                  </td>
                  <td style={{ ...TD, color: 'var(--admin-text)' }}>{r.learner.team}</td>
                  <td style={{ ...TD, color: 'var(--admin-text)', whiteSpace: 'nowrap' }}>{relativeDays(r.learner.lastActiveDays)}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <button type="button" disabled={nudged.has(r.learner.id)} onClick={() => nudge(r)} style={{ ...BUTTON_OUTLINE, padding: '4px 10px', fontSize: 12, opacity: nudged.has(r.learner.id) ? 0.5 : 1 }}>
                      {nudged.has(r.learner.id) ? 'Nudged' : 'Nudge'}
                    </button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...TD, padding: 24, textAlign: 'center', color: 'var(--admin-muted)' }}>
                    No one matches these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Seg({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick} style={{ borderRadius: 9999, borderWidth: 1, borderStyle: 'solid', borderColor: on ? 'var(--admin-ink)' : 'var(--admin-rule)', background: on ? 'var(--admin-ink)' : 'var(--admin-surface)', padding: '4px 10px', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: on ? 'var(--admin-surface)' : 'var(--admin-text)', cursor: 'pointer' }}>
      {label}
    </button>
  )
}

const SELECT: CSSProperties = { ...INPUT, width: 'auto', padding: '6px 10px', fontSize: 12, borderRadius: 8 }
const TH: CSSProperties = { padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', textAlign: 'left', whiteSpace: 'nowrap' }
const TD: CSSProperties = { padding: '10px 14px', verticalAlign: 'middle' }
