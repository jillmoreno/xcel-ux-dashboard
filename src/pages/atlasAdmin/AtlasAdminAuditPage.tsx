import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { PRODUCERS } from '@/data/atlasAdmin/enterprise'
import { toIso } from '@/data/atlasAdmin/assignments'
import { Award, CircleCheck, ClockRegular, Download, FileCertificateLight, FileLinesRegular, ShieldCheck } from '@/icons'
import { useAdminStore } from './adminStore'
import { BUTTON_BRAND, CARD, EYEBROW, HEADING, PILL } from './adminStyles'
import { downloadCsv } from './csv'
import { EnterpriseHeader } from './enterpriseUi'

/**
 * ATLAS ADMIN — PROOF & AUDIT (2026-10-20). The reference's
 * /enterprise/audit, its "trust builder": data freshness against an SLA,
 * the completion logic, the sources and their freshness, the lineage from
 * activity to CE credit, and the recent audit records — with an export.
 *
 * The records are real rows: the roster's licensed learners (state exam
 * passed) and the CE producers' last completions, newest first, each with a
 * transcript id. Verified unless still under the state's review (Pending)
 * or finished implausibly fast (Flagged — the time-on-task rule).
 */

type Record_ = { id: string; name: string; who: string; type: string; activity: string; completed: string; transcript: string; credits: number; status: 'Verified' | 'Pending' | 'Flagged' }

const DAY = 86_400_000

export function AtlasAdminAuditPage() {
  const { learners, showToast } = useAdminStore()
  const [now] = useState(() => Date.now())
  const [shown, setShown] = useState(10)
  const lastSync = new Date(now - 8 * 60_000)

  const records = useMemo<Record_[]>(() => {
    const exams = learners
      .filter((l) => l.stage === 'licensed')
      .map((l) => {
        const days = l.lastActiveDays
        return { name: l.name, who: l.id.toUpperCase().slice(0, 8), type: 'State exam passed', days, credits: 0, status: 'Verified' as const }
      })
    const ce = PRODUCERS.filter((p) => p.hoursDone > 0)
      .slice(0, 60)
      .map((p) => ({
        name: p.name,
        who: p.id,
        type: p.hoursDone >= p.hoursRequired ? 'CE requirement met' : 'CE course completion',
        days: p.lastCompletionDays,
        credits: p.hoursDone >= p.hoursRequired ? p.hoursRequired : Math.min(8, p.hoursDone),
        status: (p.status === 'review' ? 'Pending' : p.lastCompletionDays % 23 === 0 ? 'Flagged' : 'Verified') as Record_['status'],
      }))
    return [...exams, ...ce]
      .sort((a, b) => a.days - b.days)
      .map((r, i) => {
        const date = toIso(new Date(now - r.days * DAY))
        return { id: `${r.who}-${i}`, name: r.name, who: r.who, type: r.type, activity: date, completed: date, transcript: `TR-${date.slice(0, 4)}-${String(i + 1).padStart(4, '0')}`, credits: r.credits, status: r.status }
      })
  }, [learners, now])

  const exportCsv = () => {
    downloadCsv('audit-report.csv', [['Learner', 'ID', 'Activity type', 'Activity date', 'Completion date', 'Transcript ID', 'CE credits', 'Status'], ...records.map((r) => [r.name, r.who, r.type, r.activity, r.completed, r.transcript, r.credits, r.status])])
    showToast(`Audit report exported — ${records.length} records`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EnterpriseHeader
        title="Proof & Audit"
        sub="Trust builder — insurance agency view"
        info="Everything an examiner asks for: how fresh the data is, how completion is decided, where each record came from, and the record itself."
        actions={
          <button type="button" onClick={exportCsv} style={BUTTON_BRAND}>
            <Download size={12} aria-hidden /> Export audit report
          </button>
        }
      />

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Panel icon={<ClockRegular size={13} />} tint="var(--admin-success-tint)" ink="var(--admin-success-ink)" title="Data freshness">
          <Badge text="SLA status" pill="MET" tone="ok" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Mini label="Target" value="< 15 minutes" />
            <Mini label="Actual" value="8 minutes" ink="var(--admin-success-ink)" />
          </div>
          <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Last sync: {lastSync.toLocaleString('en-US')}</span>
        </Panel>
        <Panel icon={<ShieldCheck size={13} />} tint="var(--admin-fill)" ink="var(--admin-chart-blue)" title="Completion logic">
          <Badge text="Deterministic" pill="VERIFIED" tone="info" />
          <div style={{ padding: 10, borderRadius: 8, background: 'var(--admin-fill-soft)', fontSize: 12, color: 'var(--admin-text)' }}>
            Completion criteria:
            <ul style={{ margin: '4px 0 0', paddingLeft: 16, lineHeight: 1.6 }}>
              <li>All required modules completed</li>
              <li>Final exam passed (≥ 70%)</li>
              <li>Time-on-task threshold met</li>
              <li>No integrity flags</li>
            </ul>
          </div>
        </Panel>
        <Panel icon={<FileLinesRegular size={13} />} tint="var(--admin-fill)" ink="var(--admin-chart-violet)" title="Data sources">
          {[
            ['LMS activity data', true],
            ['Exam results (state vendor)', true],
            ['CE credit registry', true],
            ['HR system (employee data)', false],
          ].map(([name, fresh]) => (
            <div key={name as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: fresh ? 'var(--admin-success-tint)' : 'var(--admin-warn-tint)', fontSize: 12, color: fresh ? 'var(--admin-ink)' : 'var(--admin-warn-ink)' }}>
              {name}
              <span style={{ color: fresh ? 'var(--admin-success-ink)' : 'var(--admin-amber)' }}>{fresh ? '✓ Fresh' : '⚠ Stale'}</span>
            </div>
          ))}
        </Panel>
      </div>

      <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={H2}>Data lineage</h2>
          <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Activity → Completion → Transcript / CE</span>
        </div>
        <ol style={{ listStyle: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, margin: '20px 0 8px', padding: 0, flexWrap: 'wrap' }}>
          {(
            [
              [<FileLinesRegular key="i" size={16} />, 'Activity', 'LMS events', 'var(--admin-chart-blue)'],
              [<CircleCheck key="i" size={16} />, 'Completion', 'Deterministic logic', 'var(--admin-success-ink)'],
              [<FileCertificateLight key="i" size={16} />, 'Transcript', 'Official record', 'var(--admin-chart-violet)'],
              [<Award key="i" size={16} />, 'CE credit', 'Regulatory filing', 'var(--admin-amber)'],
            ] as const
          ).map(([icon, title, sub, ink], i) => (
            <li key={title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {i ? <span aria-hidden style={{ width: 20, height: 2, background: 'var(--admin-rule)' }} /> : null}
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 90 }}>
                <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 10, background: 'var(--admin-fill)', color: ink }}>
                  {icon}
                </span>
                <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>{title}</strong>
                <span style={{ fontSize: 10, color: 'var(--admin-muted)' }}>{sub}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px' }}>
          <h2 style={H2}>Recent audit records</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>Traceability from activity to certified outcome</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--admin-fill-soft)' }}>
              <tr>
                {['Learner', 'Activity type', 'Activity date', 'Completion date', 'Transcript ID', 'CE credits', 'Status'].map((h) => (
                  <th key={h} style={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.slice(0, shown).map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--admin-rule)' }}>
                  <td style={TD}>
                    <span style={{ display: 'block', color: 'var(--admin-ink)' }}>{r.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--admin-muted)' }}>{r.who}</span>
                  </td>
                  <td style={{ ...TD, color: 'var(--admin-text)' }}>{r.type}</td>
                  <td style={{ ...TD, color: 'var(--admin-text)' }}>{r.activity}</td>
                  <td style={{ ...TD, color: 'var(--admin-text)' }}>{r.completed}</td>
                  <td style={TD}>
                    <code style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--admin-fill)', fontSize: 11, color: 'var(--admin-ink)' }}>{r.transcript}</code>
                  </td>
                  <td style={TD}>{r.credits || '—'}</td>
                  <td style={TD}>
                    <span
                      style={{
                        ...PILL,
                        fontSize: 11,
                        ...(r.status === 'Verified' ? { background: 'var(--admin-success-tint)', color: 'var(--admin-success-ink)' } : r.status === 'Pending' ? { background: 'var(--admin-amber-tint)', color: 'var(--admin-amber)' } : { background: 'var(--admin-brand-tint)', color: 'var(--admin-brand)' }),
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length > shown ? (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--admin-rule)', fontSize: 12, color: 'var(--admin-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Showing {shown} of {records.length}
            <button type="button" onClick={() => setShown((n) => n + 20)} style={{ padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--admin-brand)', cursor: 'pointer' }}>
              Show more
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function Panel({ icon, tint, ink, title, children }: { icon: ReactNode; tint: string; ink: string; title: string; children: ReactNode }) {
  return (
    <section style={{ ...CARD, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ ...H2, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8, background: tint, color: ink }}>
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Badge({ text, pill, tone }: { text: string; pill: string; tone: 'ok' | 'info' }) {
  const [bg, ink] = tone === 'ok' ? ['var(--admin-success-tint)', 'var(--admin-success-ink)'] : ['var(--admin-fill)', 'var(--admin-chart-blue)']
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: bg, fontSize: 13, color: ink }}>
      {text}
      <span style={{ ...EYEBROW, fontSize: 9, color: ink }}>{pill}</span>
    </div>
  )
}

function Mini({ label, value, ink = 'var(--admin-ink)' }: { label: string; value: string; ink?: string }) {
  return (
    <div style={{ padding: 8, borderRadius: 8, background: 'var(--admin-fill-soft)' }}>
      <span style={{ display: 'block', fontSize: 10, color: 'var(--admin-muted)' }}>{label}</span>
      <strong style={{ fontSize: 12, color: ink }}>{value}</strong>
    </div>
  )
}

const H2: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 15, fontWeight: 700, color: 'var(--admin-ink)' }
const TH: CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', textAlign: 'left', whiteSpace: 'nowrap' }
const TD: CSSProperties = { padding: '10px 16px', verticalAlign: 'middle' }
