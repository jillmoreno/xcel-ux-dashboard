import { useMemo, useState, type CSSProperties } from 'react'
import { STATES } from '@/data/atlasAdmin/assignments'
import { ADMIN_DEPARTMENTS } from '@/data/atlasAdmin/learners'
import { CE_STATUS_LABEL, MANAGERS, PRODUCERS, type CeStatus, type Producer } from '@/data/atlasAdmin/enterprise'
import { ArrowsRotate, CircleCheckSolid, Download, Envelope, MagnifyingGlass } from '@/icons'
import { AdminDialog } from './AdminDialog'
import { useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, EYEBROW, FIELD_LABEL, HEADING, INPUT, PILL } from './adminStyles'
import { downloadCsv } from './csv'
import { EnterpriseHeader } from './enterpriseUi'

/**
 * ATLAS ADMIN — COMPLIANCE REPORT (2026-10-20). The reference's
 * /enterprise/compliance: CE status for every licensed producer — five
 * status tiles that filter, the report's purpose (collapsible), bulk
 * reminder and CSV, four filters, search, and the table with each row's
 * action: View (the producer's detail), Remind (overdue) or Extend
 * (expiring).
 *
 * The producers are `PRODUCERS` (data/atlasAdmin/enterprise.ts) — 420 of
 * them, not the reference's 2,500 — and the actions last the session:
 * a reminded producer is marked, an extension moves their deadline 30 days.
 */

type Filter = 'all' | CeStatus

const TILES: { id: Filter; label: string; ink: string }[] = [
  { id: 'all', label: 'All producers', ink: 'var(--admin-ink)' },
  { id: 'compliant', label: 'Compliant', ink: 'var(--admin-success-ink)' },
  { id: 'in-progress', label: 'In progress', ink: 'var(--admin-amber)' },
  { id: 'non-compliant', label: 'Non-compliant', ink: 'var(--admin-brand)' },
  { id: 'expiring', label: 'Expiring soon', ink: 'var(--admin-amber)' },
]

const STATUS_INK: Record<CeStatus, string> = {
  compliant: 'var(--admin-success-ink)',
  'in-progress': 'var(--admin-amber)',
  review: 'var(--admin-chart-blue)',
  expiring: 'var(--admin-amber)',
  'non-compliant': 'var(--admin-brand)',
}

const PAGE = 50

export function AtlasAdminCompliancePage() {
  const { showToast } = useAdminStore()
  const [producers, setProducers] = useState<Producer[]>(() => [...PRODUCERS])
  const [filter, setFilter] = useState<Filter>('all')
  const [line, setLine] = useState('all')
  const [dept, setDept] = useState('all')
  const [manager, setManager] = useState('all')
  const [state, setState] = useState('all')
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [why, setWhy] = useState(false)
  const [reminded, setReminded] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<Producer | null>(null)
  const [refreshedAt, setRefreshedAt] = useState(() => new Date())

  const count = (s: Filter) => (s === 'all' ? producers.length : producers.filter((p) => p.status === s).length)
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return producers.filter(
      (p) =>
        (filter === 'all' || p.status === filter) &&
        (line === 'all' || p.line === line) &&
        (dept === 'all' || p.department === dept) &&
        (manager === 'all' || p.manager === manager) &&
        (state === 'all' || p.state === state) &&
        (!q || `${p.name} ${p.license}`.toLowerCase().includes(q)),
    )
  }, [producers, filter, line, dept, manager, state, query])
  const owing = producers.filter((p) => p.status !== 'compliant' && p.status !== 'review')

  const remind = (ps: Producer[]) => {
    setReminded((s) => new Set([...s, ...ps.map((p) => p.id)]))
    showToast(ps.length === 1 ? `Reminder sent to ${ps[0].name}` : `Reminder sent to ${ps.length} producers who still owe hours`)
  }
  const extend = (p: Producer) => {
    setProducers((list) => list.map((x) => (x.id === p.id ? { ...x, deadlineDays: x.deadlineDays + 30, status: 'in-progress' } : x)))
    showToast(`${p.name}'s deadline extended 30 days`)
  }
  const deadline = (p: Producer) => (p.deadlineDays < 0 ? `${-p.deadlineDays}d overdue` : p.status === 'expiring' ? `${p.deadlineDays}d left` : `${p.deadlineDays}d`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EnterpriseHeader
        title="Compliance Report"
        sub="Continuing-education status for every licensed producer"
        actions={
          <>
            <span style={{ textAlign: 'right', fontSize: 11, color: 'var(--admin-muted)' }}>
              Data refresh cadence
              <br />
              Hourly · Last updated {refreshedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
            <button type="button" onClick={() => (setRefreshedAt(new Date()), showToast('Compliance data refreshed'))} style={{ ...BUTTON_OUTLINE, padding: '6px 12px', fontSize: 12 }}>
              <ArrowsRotate size={11} aria-hidden /> Refresh
            </button>
          </>
        }
      />

      <div role="radiogroup" aria-label="Status" style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        {TILES.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={filter === t.id} onClick={() => (setFilter(t.id), setShown(PAGE))} style={{ ...CARD, borderRadius: 12, padding: 14, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', boxShadow: filter === t.id ? '0 0 0 2px var(--admin-chart-blue)' : 'none' }}>
            <span style={{ display: 'block', fontSize: 12, color: t.ink }}>{t.label}</span>
            <strong style={{ display: 'block', marginTop: 4, fontFamily: HEADING, fontSize: 22, color: t.ink }}>{count(t.id)}</strong>
          </button>
        ))}
      </div>

      <section style={{ ...CARD, borderRadius: 12, padding: 14 }}>
        <button type="button" aria-expanded={why} onClick={() => setWhy((w) => !w)} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
          <span>
            <strong style={{ display: 'block', fontSize: 13, color: 'var(--admin-ink)' }}>Report outcomes &amp; requirements</strong>
            <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Why this report exists and what it must include</span>
          </span>
          <span aria-hidden style={{ color: 'var(--admin-muted)' }}>{why ? '⌃' : '⌄'}</span>
        </button>
        {why ? (
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 12 }}>
            <div style={WHY}>
              <p style={{ ...EYEBROW, fontSize: 10 }}>Outcome</p>
              <strong style={{ display: 'block', margin: '4px 0 6px', fontSize: 13, color: 'var(--admin-ink)' }}>Prove every producer’s CE status at a glance</strong>
              <ol style={OL}>
                <li>Identify who is compliant, in progress, and at risk</li>
                <li>Prioritize outreach before renewal deadlines slip</li>
                <li>Support audits with a single exportable view</li>
              </ol>
            </div>
            <div style={WHY}>
              <p style={{ ...EYEBROW, fontSize: 10 }}>Requirements</p>
              <ol style={{ ...OL, marginTop: 6 }}>
                <li>Current status and progress toward required hours</li>
                <li>Deadline / days remaining with overdue highlighting</li>
                <li>Filters by license line, department, manager, and state</li>
                <li>Bulk reminder workflow and CSV export</li>
              </ol>
            </div>
          </div>
        ) : null}
      </section>

      <section style={{ ...CARD, borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--admin-text)' }}>Quick actions:</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => remind(owing)} style={{ ...BUTTON_OUTLINE, padding: '6px 12px', fontSize: 12, background: 'var(--admin-brand-tint)', borderColor: 'var(--admin-brand-soft-edge)', color: 'var(--admin-brand)' }}>
            <Envelope size={11} aria-hidden /> Send bulk reminder <span style={{ ...PILL, padding: '0 7px', fontSize: 10, background: 'var(--admin-brand)', color: 'var(--admin-surface)' }}>{owing.length}</span>
          </button>
          <button
            type="button"
            onClick={() => downloadCsv('ce-compliance.csv', [['Status', 'Name', 'Title', 'License', 'Line', 'State', 'Department', 'Manager', 'Hours', 'Required', 'Deadline'], ...rows.map((p) => [CE_STATUS_LABEL[p.status], p.name, p.title, p.license, p.line, p.state, p.department, p.manager, p.hoursDone, p.hoursRequired, deadline(p)])])}
            style={{ ...BUTTON_OUTLINE, padding: '6px 12px', fontSize: 12 }}
          >
            <Download size={11} aria-hidden /> Export CSV
          </button>
        </span>
      </section>

      <section style={{ ...CARD, borderRadius: 12, padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--admin-text)' }}>Filters:</span>
        <Select label="License line" value={line} onChange={setLine} all="All license lines" options={['Life & Health', 'Property & Casualty']} />
        <Select label="Department" value={dept} onChange={setDept} all="All departments" options={[...ADMIN_DEPARTMENTS]} />
        <Select label="Manager" value={manager} onChange={setManager} all="All managers" options={[...MANAGERS]} />
        <Select label="State" value={state} onChange={setState} all="All states" options={STATES.map(([c]) => c)} labels={Object.fromEntries(STATES)} />
      </section>

      <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: 'var(--admin-ink)', color: 'var(--admin-surface)', fontFamily: HEADING, fontSize: 14, fontWeight: 700 }}>Compliance report</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
          <label style={{ position: 'relative', flex: '0 1 300px' }}>
            <MagnifyingGlass size={12} aria-hidden style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-faint)' }} />
            <input value={query} onChange={(e) => (setQuery(e.target.value), setShown(PAGE))} placeholder="Search by name or license number…" aria-label="Search producers" style={{ ...INPUT, padding: '7px 10px 7px 30px', fontSize: 12 }} />
          </label>
          <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{rows.length} producers</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Status', 'Name', 'License', 'Hours', 'Deadline', ''].map((h) => (
                  <th key={h} style={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, shown).map((p) => {
                const pct = Math.round((100 * p.hoursDone) / p.hoursRequired)
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--admin-rule)' }}>
                    <td style={{ ...TD, color: STATUS_INK[p.status], whiteSpace: 'nowrap' }}>● {CE_STATUS_LABEL[p.status]}</td>
                    <td style={TD}>
                      <span style={{ display: 'block', color: 'var(--admin-ink)' }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{p.title}</span>
                    </td>
                    <td style={TD}>
                      <span style={{ display: 'block', color: 'var(--admin-ink)' }}>{p.license}</span>
                      <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>
                        {p.line} · {p.state}
                      </span>
                    </td>
                    <td style={TD}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 48, height: 4, borderRadius: 9999, background: 'var(--admin-fill)', overflow: 'hidden' }}>
                          <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--admin-success)' : 'var(--admin-amber)' }} />
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--admin-text)' }}>
                          {p.hoursDone}/{p.hoursRequired}
                        </span>
                      </span>
                    </td>
                    <td style={{ ...TD, whiteSpace: 'nowrap', color: p.deadlineDays < 0 ? 'var(--admin-brand)' : p.status === 'expiring' ? 'var(--admin-amber)' : 'var(--admin-text)' }}>{deadline(p)}</td>
                    <td style={{ ...TD, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {p.status === 'compliant' ? (
                        <CircleCheckSolid size={14} aria-label="Compliant" style={{ color: 'var(--admin-success)' }} />
                      ) : p.status === 'non-compliant' ? (
                        <button type="button" disabled={reminded.has(p.id)} onClick={() => remind([p])} style={{ ...ROW_ACTION, color: 'var(--admin-brand)' }}>
                          {reminded.has(p.id) ? 'Reminded' : 'Remind'}
                        </button>
                      ) : p.status === 'expiring' ? (
                        <button type="button" onClick={() => extend(p)} style={{ ...ROW_ACTION, color: 'var(--admin-amber)' }}>
                          Extend
                        </button>
                      ) : (
                        <button type="button" onClick={() => setOpen(p)} style={ROW_ACTION}>
                          View →
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid var(--admin-rule)', fontSize: 12, color: 'var(--admin-muted)' }}>
          Showing {Math.min(shown, rows.length)} of {rows.length} producers
          {rows.length > shown ? (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} style={{ ...BUTTON_OUTLINE, padding: '5px 12px', fontSize: 12 }}>
              Show more
            </button>
          ) : null}
        </div>
      </section>

      {open ? (
        <AdminDialog
          title={open.name}
          subtitle={`${open.title} · ${open.department} · manager ${open.manager}`}
          onClose={() => setOpen(null)}
          footer={
            <>
              <button type="button" onClick={() => setOpen(null)} style={BUTTON_OUTLINE}>
                Close
              </button>
              <button type="button" disabled={reminded.has(open.id)} onClick={() => (remind([open]), setOpen(null))} style={BUTTON_BRAND}>
                {reminded.has(open.id) ? 'Reminded' : 'Send reminder'}
              </button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Status', CE_STATUS_LABEL[open.status]],
              ['License', `${open.license} · ${open.line}`],
              ['State', Object.fromEntries(STATES)[open.state]],
              ['CE hours', `${open.hoursDone} of ${open.hoursRequired}`],
              ['Renewal deadline', deadline(open)],
              ['Last CE completion', `${open.lastCompletionDays} days ago`],
            ].map(([k, v]) => (
              <div key={k}>
                <span style={FIELD_LABEL}>{k}</span>
                <span style={{ fontSize: 13, color: 'var(--admin-ink)' }}>{v}</span>
              </div>
            ))}
          </div>
          {open.status === 'review' ? <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text)' }}>Hours are complete; the state is confirming the filing. Nothing to do unless it is returned.</p> : null}
        </AdminDialog>
      ) : null}
    </div>
  )
}

function Select({ label, value, onChange, all, options, labels }: { label: string; value: string; onChange: (v: string) => void; all: string; options: string[]; labels?: Record<string, string> }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...INPUT, width: 'auto', padding: '6px 10px', fontSize: 12, borderRadius: 8 }}>
      <option value="all">{all}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  )
}

const WHY: CSSProperties = { padding: 12, borderRadius: 10, background: 'var(--admin-fill-soft)' }
const OL: CSSProperties = { margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6, color: 'var(--admin-text)' }
const TH: CSSProperties = { padding: '8px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', textAlign: 'left', whiteSpace: 'nowrap', background: 'var(--admin-fill-soft)' }
const TD: CSSProperties = { padding: '10px 16px', verticalAlign: 'middle' }
const ROW_ACTION: CSSProperties = { padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', cursor: 'pointer' }
