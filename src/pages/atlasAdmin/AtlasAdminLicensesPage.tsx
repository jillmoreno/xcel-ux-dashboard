import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { STATES } from '@/data/atlasAdmin/assignments'
import { JOB_ROLES, LOCATIONS, jobRoleOf, officeOf } from '@/data/atlasAdmin/organization'
import { CalendarRegular, Download, PaperPlaneTopSolid, Plus } from '@/icons'
import { AdminDialog } from './AdminDialog'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, FIELD_LABEL, HEADING, INPUT, PILL } from './adminStyles'
import { STUDENT_FILTER_PARAM } from './AtlasAdminStudentsPage'

/**
 * ATLAS ADMIN — LICENSES & SEATS (2026-10-20). The reference's /licenses:
 * the seat donut, the seat list with role / audience / location filters,
 * utilization by audience and the exam-urgency note — with Add seats,
 * reminders to the unredeemed and an export.
 *
 * Seats are counted, not written in: a learner who has enrolled holds a
 * seat (active if seen in the last 30 days), an invite not yet accepted
 * holds one unredeemed, and the rest of what was bought is available. The
 * audiences are the four state Life & Health exams, not the reference's
 * Series 7 / SIE (a securities firm's).
 */

const DAY = 86_400_000

export function AtlasAdminLicensesPage() {
  const { learners, invites, seatsPurchased, addSeats, showToast } = useAdminStore()
  const navigate = useNavigate()
  const [role, setRole] = useState('all')
  const [audience, setAudience] = useState('all')
  const [office, setOffice] = useState('all')
  const [shown, setShown] = useState(20)
  const [buying, setBuying] = useState(false)

  const [now] = useState(() => Date.now())
  const holders = useMemo(() => learners.filter((l) => l.stage !== 'invite-open'), [learners])
  const active = holders.filter((l) => l.lastActiveDays <= 30)
  const unredeemed = invites.filter((i) => i.status === 'sent' || i.status === 'opened')
  const available = Math.max(0, seatsPurchased - holders.length - unredeemed.length)
  const examSoon = (iso: string | null) => {
    if (!iso) return false
    const days = (new Date(iso).getTime() - now) / DAY
    return days >= 0 && days <= 30
  }
  const urgent = holders.filter((l) => l.stage !== 'licensed' && examSoon(l.examDate))
  const newThisWeek = learners.filter((l) => l.enrolledDaysAgo <= 7)
  const missingRole = newThisWeek.filter((l) => jobRoleOf(l) === null)

  const seats = useMemo(
    () => holders.filter((l) => (role === 'all' || (jobRoleOf(l) ?? 'none') === role) && (audience === 'all' || l.state === audience) && (office === 'all' || officeOf(l)?.id === office)),
    [holders, role, audience, office],
  )

  const byAudience = STATES.map(([code, name]) => {
    const group = holders.filter((l) => l.state === code)
    const on = group.filter((l) => l.lastActiveDays <= 30).length
    return { code, name: `${name} Life & Health`, on, total: group.length, pct: group.length ? Math.round((100 * on) / group.length) : 0 }
  })

  const remind = () => {
    showToast(`Reminder sent to ${unredeemed.length} unredeemed invite${unredeemed.length === 1 ? '' : 's'}`)
  }

  const exportCsv = () => {
    const rows = [
      ['Seats purchased', seatsPurchased],
      ['Active', active.length],
      ['Inactive', holders.length - active.length],
      ['Unredeemed', unredeemed.length],
      ['Available', available],
      ...byAudience.map((a) => [`${a.name} active`, `${a.on}/${a.total}`]),
    ]
    const csv = [['Measure', 'Value'], ...rows].map((r) => r.map((v) => `"${String(v)}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'seat-summary.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const segments = [
    { label: 'Active', value: active.length, color: 'var(--admin-success)' },
    { label: 'Inactive', value: holders.length - active.length, color: 'var(--admin-amber)' },
    { label: 'Unredeemed', value: unredeemed.length, color: 'var(--admin-chart-violet)' },
    { label: 'Available', value: available, color: 'var(--admin-rule-strong)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {missingRole.length ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, border: '1px solid var(--admin-warn-edge)', background: 'var(--admin-warn-tint)', fontSize: 13, color: 'var(--admin-warn-ink)' }}>
          <span>
            <strong>{newThisWeek.length} new learners</strong> were added this week — <strong>{missingRole.length}</strong> are missing a job role
          </span>
          <Link to={`${ADMIN_BASE}/students?${STUDENT_FILTER_PARAM}=new30`} style={{ fontWeight: 700, color: 'var(--admin-warn-ink)', textDecoration: 'none' }}>
            Review learners →
          </Link>
        </div>
      ) : null}

      <section style={{ ...CARD, borderRadius: 14, padding: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={H1}>License &amp; Seat Management</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-text)' }}>Monitor seat utilization and manage your team’s access</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={exportCsv} style={BUTTON_OUTLINE}>
            <Download size={13} aria-hidden /> Export summary
          </button>
          <button type="button" onClick={() => setBuying(true)} style={BUTTON_BRAND}>
            <Plus size={12} aria-hidden /> Add seats
          </button>
        </div>
      </section>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(240px, 1fr) minmax(0, 2fr)', alignItems: 'start' }}>
        <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
          <h2 style={H2}>Seat overview</h2>
          <div style={{ display: 'grid', placeItems: 'center', margin: '12px 0' }}>
            <Ring segments={segments} total={seatsPurchased} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 14px', fontSize: 12, color: 'var(--admin-text)' }}>
            {segments.map((s) => (
              <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span aria-hidden style={{ width: 8, height: 8, borderRadius: 9999, background: s.color }} />
                <strong style={{ color: 'var(--admin-ink)' }}>{s.value}</strong> {s.label}
              </span>
            ))}
          </div>
          <button type="button" disabled={!unredeemed.length} onClick={remind} style={{ ...BUTTON_OUTLINE, width: '100%', marginTop: 16, background: 'var(--admin-fill-soft)', color: 'var(--admin-chart-violet)', borderColor: 'var(--admin-rule)' }}>
            <PaperPlaneTopSolid size={11} aria-hidden /> Send reminder to {unredeemed.length} unredeemed
          </button>
          <button type="button" onClick={() => setBuying(true)} style={{ ...BUTTON_OUTLINE, width: '100%', marginTop: 8 }}>
            <Plus size={11} aria-hidden /> Buy more seats
          </button>
        </section>

        <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select aria-label="Job role" value={role} onChange={(e) => (setRole(e.target.value), setShown(20))} style={SELECT}>
              <option value="all">All job roles</option>
              {JOB_ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
              <option value="none">No job role yet</option>
            </select>
            <select aria-label="Audience" value={audience} onChange={(e) => (setAudience(e.target.value), setShown(20))} style={SELECT}>
              <option value="all">All audiences</option>
              {STATES.map(([c, n]) => (
                <option key={c} value={c}>
                  {n} Life &amp; Health
                </option>
              ))}
            </select>
            <select aria-label="Location" value={office} onChange={(e) => (setOffice(e.target.value), setShown(20))} style={SELECT}>
              <option value="all">All locations</option>
              {LOCATIONS.filter((x) => x.parent && x.status === 'active').map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <p style={{ margin: '14px 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--admin-ink)' }}>
            Assigned seats <span style={{ fontWeight: 400, color: 'var(--admin-muted)' }}>({seats.length})</span>
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {seats.slice(0, shown).map((l) => {
              const on = l.lastActiveDays <= 30
              return (
                <li key={l.id}>
                  <button type="button" onClick={() => navigate(`${ADMIN_BASE}/students/recruit/${encodeURIComponent(l.id)}${window.location.search}`)} className="cre-admin-tile" style={SEAT}>
                    <span aria-hidden style={{ width: 7, height: 7, borderRadius: 9999, flex: 'none', background: on ? 'var(--admin-success)' : 'var(--admin-amber)' }} />
                    <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <strong style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>{l.name}</strong>
                      <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>
                        {l.email} • {jobRoleOf(l) ?? 'No job role yet'}
                      </span>
                    </span>
                    {l.stage !== 'licensed' && examSoon(l.examDate) ? (
                      <span style={{ ...PILL, gap: 4, fontSize: 10, background: 'var(--admin-amber-tint)', color: 'var(--admin-amber)' }}>
                        <CalendarRegular size={9} aria-hidden /> Exam soon
                      </span>
                    ) : null}
                    <span style={{ ...PILL, fontSize: 10, ...(on ? { background: 'var(--admin-success-tint)', color: 'var(--admin-success-ink)' } : { background: 'var(--admin-fill)', color: 'var(--admin-muted)' }) }}>{on ? 'Active' : 'Inactive'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {seats.length > shown ? (
            <button type="button" onClick={() => setShown((n) => n + 40)} style={{ marginTop: 10, padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--admin-brand)', cursor: 'pointer' }}>
              + {seats.length - shown} more seats
            </button>
          ) : null}
        </section>
      </div>

      <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
        <h2 style={H2}>Seat utilization by audience</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: 12 }}>
          {byAudience.map((a) => (
            <div key={a.code} style={{ padding: 12, borderRadius: 10, background: 'var(--admin-fill-soft)' }}>
              <span style={{ fontSize: 12, color: 'var(--admin-text)' }}>{a.name}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                <strong style={{ fontFamily: HEADING, fontSize: 18, color: 'var(--admin-ink)' }}>{a.pct}%</strong>
                <span style={{ fontSize: 10, color: 'var(--admin-muted)' }}>
                  {a.on}/{a.total} active
                </span>
              </div>
              <span style={{ display: 'block', height: 5, marginTop: 6, borderRadius: 9999, background: 'var(--admin-fill)' }}>
                <span style={{ display: 'block', height: '100%', width: `${a.pct}%`, borderRadius: 9999, background: 'var(--admin-success)' }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
        <h2 style={{ ...H2, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarRegular size={14} aria-hidden style={{ color: 'var(--admin-amber)' }} /> Exam urgency
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--admin-ink)' }}>
          <strong>{urgent.length} seats</strong> are assigned to learners with exams in the next 30 days. Consider prioritizing support for these learners.
        </p>
      </section>

      {buying ? (
        <BuySeatsDialog
          onClose={() => setBuying(false)}
          onBuy={(n) => {
            addSeats(n)
            setBuying(false)
            showToast(`${n} seats added — ${seatsPurchased + n} in total`)
          }}
        />
      ) : null}
    </div>
  )
}

function BuySeatsDialog({ onClose, onBuy }: { onClose: () => void; onBuy: (n: number) => void }) {
  const [n, setN] = useState(20)
  return (
    <AdminDialog
      title="Add seats"
      subtitle="Seats are added to your agreement at your partner rate. Your XCEL rep confirms the invoice."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" onClick={() => onBuy(n)} style={BUTTON_BRAND}>
            Add {n} seats
          </button>
        </>
      }
    >
      <label>
        <span style={FIELD_LABEL}>How many seats</span>
        <input type="number" min={1} max={500} value={n} onChange={(e) => setN(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} style={{ ...INPUT, maxWidth: 160 }} />
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        {[10, 20, 50, 100].map((v) => (
          <button key={v} type="button" onClick={() => setN(v)} style={{ ...PILL, border: '1px solid var(--admin-rule-strong)', background: n === v ? 'var(--admin-ink)' : 'var(--admin-surface)', color: n === v ? 'var(--admin-surface)' : 'var(--admin-text)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {v}
          </button>
        ))}
      </div>
    </AdminDialog>
  )
}

function Ring({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const r = 58
  const c = 2 * Math.PI * r
  const lengths = segments.map((s) => (total ? (c * s.value) / total : 0))
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0))
  return (
    <svg width={150} height={150} viewBox="0 0 150 150" role="img" aria-label={segments.map((s) => `${s.value} ${s.label}`).join(', ')}>
      {segments.map((s, i) => (
        <circle key={s.label} cx={75} cy={75} r={r} fill="none" stroke={s.color} strokeWidth={14} strokeDasharray={`${lengths[i]} ${c - lengths[i]}`} strokeDashoffset={-starts[i]} transform="rotate(-90 75 75)" />
      ))}
      <text x={75} y={75} textAnchor="middle" style={{ fontFamily: HEADING, fontSize: 26, fontWeight: 700, fill: 'var(--admin-ink)' }}>
        {total}
      </text>
      <text x={75} y={93} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--admin-muted)' }}>
        Total seats
      </text>
    </svg>
  )
}

const H1: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 20, fontWeight: 700, color: 'var(--admin-ink)' }
const H2: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 15, fontWeight: 700, color: 'var(--admin-ink)' }
const SELECT: CSSProperties = { ...INPUT, width: 'auto', padding: '6px 10px', fontSize: 13, borderRadius: 10 }
const SEAT: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid transparent', background: 'var(--admin-fill-soft)', fontFamily: 'inherit', cursor: 'pointer' }
