import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_USER } from '@/data/atlasAdmin/learners'
import { ArrowLeft, Download } from '@/icons'
import { ADMIN_BASE, ADMIN_EMAIL, useAdminStore } from './adminStore'
import { BUTTON_OUTLINE, CARD, EYEBROW, HEADING, INPUT, PILL } from './adminStyles'
import { downloadCsv } from './csv'

/**
 * ATLAS ADMIN — INTERNAL (2026-10-20). The reference's /internal/* pages,
 * which are XCEL's own tools rather than an agency admin's:
 *
 *   - PORTAL ANALYTICS lists product events. The reference reads them from
 *     Supabase and, unconfigured, shows an empty table and a setup note.
 *     Here the events are this session's — every page the admin opens and
 *     every nudge, call, email and exam date — so the table has something
 *     true to show. Nothing leaves the browser.
 *   - CATALOG and LEDGER sit behind internal flags in the reference
 *     ("Turn it on in Platform Settings") with no setting to turn them on
 *     and nothing behind the gate. They are kept as that gate, faithfully,
 *     until there is something to put behind it.
 */

const EVENT_LABEL: Record<string, string> = {
  page_view: 'Page view',
  nudge_sent: 'Nudge sent',
  call_sent: 'Call logged',
  email_sent: 'Email sent',
  exam_date_set: 'Exam date set',
}

export function AtlasAdminPortalAnalyticsPage() {
  const { events } = useAdminStore()
  const [kind, setKind] = useState('all')
  const kinds = useMemo(() => [...new Set(events.map((e) => e.event))], [events])
  const shown = events.filter((e) => kind === 'all' || e.event === kind)
  const pages = useMemo(() => {
    const counts = new Map<string, number>()
    events.filter((e) => e.event === 'page_view').forEach((e) => counts.set(e.path, (counts.get(e.path) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [events])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Back />
      <div>
        <p style={{ ...EYEBROW, fontSize: 10, color: 'var(--admin-brand)' }}>Internal</p>
        <h1 style={H1}>Portal analytics</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text)' }}>
          Product events from this session. Viewing as {ADMIN_USER.name} ({ADMIN_EMAIL}).
        </p>
      </div>
      <p style={{ margin: 0, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--admin-warn-edge)', background: 'var(--admin-warn-tint)', fontSize: 12, color: 'var(--admin-warn-ink)' }}>
        Demo: events are kept in this browser tab only and reset on reload. In production they would be stored server-side behind XCEL staff sign-in.
      </p>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <Stat label="Events" value={events.length} />
        <Stat label="Page views" value={events.filter((e) => e.event === 'page_view').length} />
        <Stat label="Learner actions" value={events.filter((e) => e.event !== 'page_view').length} />
        <Stat label="Pages visited" value={new Set(events.filter((e) => e.event === 'page_view').map((e) => e.path)).size} />
      </div>

      {pages.length ? (
        <section style={{ ...CARD, borderRadius: 12, padding: 16 }}>
          <h2 style={H2}>Most viewed</h2>
          <ol style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, lineHeight: 1.8, color: 'var(--admin-ink)' }}>
            {pages.map(([path, n]) => (
              <li key={path}>
                <code>{path.replace(ADMIN_BASE, '') || '/'}</code> <span style={{ color: 'var(--admin-muted)' }}>· {n}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section style={{ ...CARD, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
          <h2 style={H2}>Recent events</h2>
          <span style={{ display: 'flex', gap: 8 }}>
            <select aria-label="Event type" value={kind} onChange={(e) => setKind(e.target.value)} style={{ ...INPUT, width: 'auto', padding: '5px 8px', fontSize: 12 }}>
              <option value="all">All events</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {EVENT_LABEL[k] ?? k}
                </option>
              ))}
            </select>
            <button type="button" disabled={!shown.length} onClick={() => downloadCsv('portal-events.csv', [['When', 'Event', 'Path', 'User'], ...shown.map((e) => [e.at, e.event, e.path, ADMIN_EMAIL])])} style={{ ...BUTTON_OUTLINE, padding: '5px 10px', fontSize: 12 }}>
              <Download size={11} aria-hidden /> Export
            </button>
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ background: 'var(--admin-fill-soft)' }}>
            <tr>
              {['When', 'Event', 'Path', 'User'].map((h) => (
                <th key={h} style={TH}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, 100).map((e) => (
              <tr key={e.id} style={{ borderTop: '1px solid var(--admin-rule)' }}>
                <td style={{ ...TD, whiteSpace: 'nowrap', color: 'var(--admin-text)' }}>{new Date(e.at).toLocaleTimeString('en-US')}</td>
                <td style={TD}>
                  <span style={{ ...PILL, fontSize: 10, background: e.event === 'page_view' ? 'var(--admin-fill)' : 'var(--admin-brand-tint)', color: e.event === 'page_view' ? 'var(--admin-text)' : 'var(--admin-brand)' }}>{EVENT_LABEL[e.event] ?? e.event}</span>
                </td>
                <td style={TD}>
                  <code style={{ color: 'var(--admin-ink)' }}>{e.path.replace(ADMIN_BASE, '') || '/'}</code>
                </td>
                <td style={{ ...TD, color: 'var(--admin-text)' }}>{ADMIN_EMAIL}</td>
              </tr>
            ))}
            {shown.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...TD, padding: 24, textAlign: 'center', color: 'var(--admin-muted)' }}>
                  No events yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  )
}

/** Catalog and Ledger: the reference's gate, kept as it is. */
export function AtlasAdminInternalGate({ name, flag }: { name: string; flag: string }) {
  return (
    <section style={{ ...CARD, borderRadius: 12, padding: 24, maxWidth: 560 }}>
      <p style={{ ...EYEBROW, fontSize: 10, color: 'var(--admin-brand)' }}>Internal</p>
      <h1 style={{ ...H1, marginTop: 4 }}>{name}</h1>
      <p style={{ margin: '8px 0 16px', fontSize: 13, color: 'var(--admin-text)' }}>
        {name} is behind <code style={{ color: 'var(--admin-ink)' }}>{flag}</code>. It is an XCEL staff tool and is not switched on for agency admins.
      </p>
      <Back />
    </section>
  )
}

function Back() {
  return (
    <Link to={`${ADMIN_BASE}/students${window.location.search}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--admin-brand)', textDecoration: 'none' }}>
      <ArrowLeft size={11} aria-hidden /> Back to Students
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ ...CARD, borderRadius: 12, padding: 14 }}>
      <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{label}</span>
      <strong style={{ display: 'block', marginTop: 2, fontFamily: HEADING, fontSize: 22, color: 'var(--admin-ink)' }}>{value}</strong>
    </div>
  )
}

const H1: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 22, fontWeight: 700, color: 'var(--admin-ink)' }
const H2: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 14, fontWeight: 700, color: 'var(--admin-ink)' }
const TH: CSSProperties = { padding: '8px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', textAlign: 'left' }
const TD: CSSProperties = { padding: '8px 16px' }
