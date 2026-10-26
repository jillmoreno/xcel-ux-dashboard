import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { acceptedThisWeek, hoursAgoDate, isFresh, isReady, type Invite, type InviteStatus } from '@/data/atlasAdmin/invites'
import { AdminDialog } from './AdminDialog'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, PAGE_H1, PAGE_SUB, PILL, STATUS_CARD, STATUS_COUNT } from './adminStyles'
import { StatusNote, StatusPill } from './adminUi'
import { InviteLearnersDialog } from './InviteLearnersDialog'

/**
 * ATLAS ADMIN · INVITES — rebuilt from colibri-b2b.vercel.app/invites
 * (2026-10-19). Every invite and where it got to: four tiles (Ready to
 * resend, Opened not accepted, Sent under 24h, Accepted this week) that
 * filter, the status pills and search, and the table with Resend. Built from
 * the same roster as Students, and an invite sent from either page lands
 * here at the top as Sent. A name opens the learner's record once they have
 * one, and the invite itself before that.
 */

type Filter = 'all' | 'ready' | 'opened' | 'fresh' | 'enrolled' | 'purchased'

const TEST: Record<Filter, (i: Invite) => boolean> = {
  all: () => true,
  ready: isReady,
  opened: (i) => i.status === 'opened',
  fresh: isFresh,
  enrolled: (i) => i.status === 'enrolled',
  purchased: (i) => i.status === 'purchased',
}

const STATUS_LABEL: Record<InviteStatus, string> = { sent: 'Sent', opened: 'Opened', enrolled: 'Enrolled', purchased: 'Purchased' }
const STATUS_STYLE: Record<InviteStatus, CSSProperties> = {
  sent: { background: 'var(--admin-fill)', color: 'var(--admin-slate-700)', boxShadow: 'inset 0 0 0 1px var(--admin-rule)' },
  opened: { background: 'var(--admin-warn-tint)', color: 'var(--admin-amber)', boxShadow: 'inset 0 0 0 1px var(--admin-warn-edge)' },
  enrolled: { background: 'var(--admin-success-tint)', color: 'var(--admin-success-ink)', boxShadow: 'inset 0 0 0 1px var(--admin-success-edge)' },
  purchased: { background: 'var(--admin-success-tint)', color: 'var(--admin-success-ink)', boxShadow: 'inset 0 0 0 1px var(--admin-success-edge)' },
}

const PAGE = 25

function dateOnly(hours: number) {
  return hoursAgoDate(hours).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function dateTime(hours: number) {
  const d = hoursAgoDate(hours)
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

export function AtlasAdminInvitesPage() {
  const navigate = useNavigate()
  // As on Students: Lite sets the tiles on the page, stroked in primary 200.
  const lite = useFeatureFlag('atlas-admin-left-nav').variant === 'lite'
  const { invites, resendInvite, showToast } = useAdminStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [inviting, setInviting] = useState(false)
  const [open, setOpen] = useState<Invite | null>(null)

  const count = (f: Filter) => invites.filter(TEST[f]).length
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return invites.filter((i) => TEST[filter](i) && (!q || `${i.name ?? ''} ${i.email}`.toLowerCase().includes(q)))
  }, [invites, filter, search])
  const visible = rows.slice(0, shown)

  const pick = (f: Filter) => {
    setFilter((cur) => (cur === f && f !== 'all' ? 'all' : f))
    setShown(PAGE)
  }
  const resend = (inv: Invite) => {
    resendInvite(inv.id)
    showToast(`Invite resent to ${inv.name ?? inv.email}`)
  }
  const openName = (inv: Invite) => {
    if (inv.learnerId) navigate(`${ADMIN_BASE}/students/recruit/${encodeURIComponent(inv.learnerId)}${window.location.search}`)
    else setOpen(inv)
  }

  /* Each tile's pill colour, from the Atlas status colours Students uses: needs you (red), part-way (brown), just sent (slate), paid (navy), done (green). */
  const tiles: { id: Filter; label: string; note: string; color: string; n: number }[] = [
    { id: 'ready', label: 'Ready to resend', note: '48h+ unopened or stuck', color: 'var(--admin-atlas-status-off-track)', n: count('ready') },
    { id: 'opened', label: 'Opened, not accepted', note: 'setup help usually closes it', color: 'var(--admin-atlas-status-in-progress)', n: count('opened') },
    { id: 'fresh', label: 'Sent under 24h', note: 'wait until tomorrow', color: 'var(--admin-atlas-status-active)', n: count('fresh') },
    { id: 'purchased', label: 'Purchased', note: 'paid, course not opened yet', color: 'var(--admin-atlas-status-licensed)', n: count('purchased') },
    { id: 'all', label: 'Accepted this week', note: 'purchased, now in the pipeline', color: 'var(--admin-atlas-status-prepared)', n: invites.filter(acceptedThisWeek).length },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={PAGE_H1}>Invites</h2>
          <p style={PAGE_SUB}>{invites.length} sent · Resend when stuck at Sent or Opened for 48+ hours · funnel through purchase</p>
        </div>
        <button type="button" className="cre-admin-brand" onClick={() => setInviting(true)} style={BUTTON_BRAND}>
          Invite students
        </button>
      </header>

      {/* As on Students: with the Standard nav the blue runs on under the table card, no gap between; with Lite the tiles sit on the page. */}
      <section aria-label="Invite outcomes" style={lite ? undefined : { ...CARD, border: 'none', padding: `16px 16px ${20 + UNDERLAP}px`, marginBottom: -(24 + UNDERLAP), background: 'var(--admin-atlas-primary-100)' }}>
        {/* Students' status cards on Students' primary 100 panel (24px in, 18px corners): the selected card white and lifted, the rest on
            the search field's fill with no edge (primary 200 on hover), a status pill, the figure ruled above and below, an 11px note. */}
        <div style={{ width: 'fit-content', maxWidth: '100%', boxSizing: 'border-box', borderRadius: 18, background: 'var(--admin-atlas-primary-100)', padding: '16px 24px' }}>
          {/* Each tile as wide as its content, wrapping when the row runs out. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {tiles.map((t) => {
              // Accepted this week filters to Enrolled, so it reads selected there.
              const active = filter === (t.id === 'all' ? 'enrolled' : t.id)
              const rule = `1px solid ${active ? 'var(--admin-atlas-primary-100)' : 'color-mix(in srgb, var(--admin-atlas-primary-200), white 20%)'}`
              return (
                <button
                  key={t.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => (t.id === 'all' ? pick('enrolled') : pick(t.id))}
                  className="cre-admin-tile cre-admin-status-card"
                  style={{
                    ...STATUS_CARD,
                    flex: 'none',
                    padding: 16,
                    gap: 8,
                    alignItems: 'flex-start', // the pill keeps its own width; the ruled figure stretches itself
                    fontFamily: 'var(--font-body)',
                    borderColor: 'transparent',
                    background: active ? 'var(--admin-surface)' : 'var(--admin-fill)',
                    boxShadow: active ? 'var(--admin-shadow-tile-active)' : undefined,
                  }}
                >
                  <StatusPill color={t.color} active={active}>
                    {t.label}
                  </StatusPill>
                  {/* The note beside the count, 8px off it, centred on it, inside the ruled band. */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'stretch', marginTop: 6, marginBottom: 2, padding: '8px 0', borderTop: rule, borderBottom: rule }}>
                    <span style={STATUS_COUNT}>{t.n}</span>
                    <StatusNote twoLines>
                      {t.note}
                    </StatusNote>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* `clip`, not `hidden`: rounded the same, but not a scroll box, so the filter bar below can pin to the window. */}
      <section style={{ ...CARD, position: 'relative', overflow: 'clip' }}>
        {/* The filter bar pins where the Lite nav's card does — 24px under the global nav — as the table scrolls under it. */}
        <div
          style={{
            position: 'sticky',
            top: 'calc(var(--admin-header-h, 0px) + 24px)',
            zIndex: 5,
            background: 'var(--admin-surface)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 20px',
            borderBottom: '1px solid var(--admin-rule)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(
              [
                ['all', 'All'],
                ['ready', 'Ready'],
                ['opened', 'Opened'],
                ['fresh', 'Fresh'],
                ['enrolled', 'Enrolled'],
                ['purchased', 'Purchased'],
              ] as const
            ).map(([f, label]) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => {
                  setFilter(f)
                  setShown(PAGE)
                }}
                style={filter === f ? SEG_ON : SEG}
              >
                {label} {count(f)}
              </button>
            ))}
          </div>
          <input
            type="search"
            aria-label="Search invites"
            placeholder="name, email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setShown(PAGE)
            }}
            style={SEARCH}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead style={{ background: 'var(--admin-fill-soft)' }}>
              <tr>
                <th style={{ ...TH, paddingLeft: 20 }}>Name</th>
                <th style={TH}>Status</th>
                <th style={TH}>Last step</th>
                <th style={TH}>Sent date</th>
                <th style={TH}>Method</th>
                <th style={TH}>
                  <span className="cre-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((inv) => {
                const resendable = inv.status === 'sent' || inv.status === 'opened'
                return (
                  <tr key={inv.id} className="cre-admin-row" style={{ borderTop: '1px solid var(--admin-rule)' }}>
                    <td style={{ ...TD, paddingLeft: 20 }}>
                      <button type="button" className="cre-admin-name" onClick={() => openName(inv)} style={NAME}>
                        {inv.name ?? inv.email}
                      </button>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-muted)' }}>{inv.email}</p>
                    </td>
                    <td style={TD}>
                      <span style={{ ...PILL, ...STATUS_STYLE[inv.status] }}>{STATUS_LABEL[inv.status]}</span>
                      {isReady(inv) ? <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 600, color: 'var(--admin-brand)' }}>48h+</span> : null}
                    </td>
                    <td style={{ ...TD, whiteSpace: 'nowrap', fontSize: 13, color: 'var(--admin-muted)' }}>
                      {inv.lastStepHoursAgo === null ? '·' : dateTime(inv.lastStepHoursAgo)}
                    </td>
                    <td style={{ ...TD, whiteSpace: 'nowrap', color: 'var(--admin-text)' }}>{dateOnly(inv.sentHoursAgo)}</td>
                    <td style={{ ...TD, color: 'var(--admin-text)' }}>{inv.method}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <button
                        type="button"
                        disabled={!resendable}
                        onClick={() => resend(inv)}
                        className={resendable ? 'cre-admin-soft' : undefined}
                        style={{ ...RESEND, color: resendable ? 'var(--admin-brand)' : 'var(--admin-faint)', cursor: resendable ? 'pointer' : 'not-allowed' }}
                      >
                        Resend
                      </button>
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...TD, padding: 32, textAlign: 'center', color: 'var(--admin-muted)' }}>
                    No invites match.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--admin-rule)' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-muted)' }}>
            Showing {visible.length} of {rows.length} · newest first
          </p>
          {visible.length < rows.length ? (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} style={{ padding: 0, border: 'none', background: 'none', fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)', cursor: 'pointer' }}>
              Show more
            </button>
          ) : null}
        </footer>
      </section>

      {inviting ? <InviteLearnersDialog onClose={() => setInviting(false)} /> : null}
      {open ? (
        <AdminDialog
          title={open.name ?? open.email}
          subtitle={`${STATUS_LABEL[open.status]} · ${open.department} · via ${open.method}`}
          onClose={() => setOpen(null)}
          footer={
            <>
              <button type="button" onClick={() => setOpen(null)} style={BUTTON_OUTLINE}>
                Close
              </button>
              {open.status === 'sent' || open.status === 'opened' ? (
                <button
                  type="button"
                  onClick={() => {
                    resend(open)
                    setOpen(null)
                  }}
                  style={BUTTON_BRAND}
                >
                  Resend
                </button>
              ) : null}
            </>
          }
        >
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 14, color: 'var(--admin-ink)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>
              <strong>Sent</strong> <span style={{ color: 'var(--admin-muted)' }}>· {dateTime(open.sentHoursAgo)}</span>
            </li>
            <li style={{ color: open.status === 'sent' ? 'var(--admin-faint)' : undefined }}>
              <strong>Opened</strong> <span style={{ color: 'var(--admin-muted)' }}>· {open.status === 'sent' ? 'not yet' : 'yes'}</span>
            </li>
            <li style={{ color: open.status === 'purchased' ? undefined : 'var(--admin-faint)' }}>
              <strong>Purchased</strong> <span style={{ color: 'var(--admin-muted)' }}>· {open.status === 'purchased' ? 'paid, not yet in the course' : 'not yet'}</span>
            </li>
            <li style={{ color: 'var(--admin-faint)' }}>
              <strong>Enrolled</strong> <span>· not yet</span>
            </li>
          </ol>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-muted)' }}>
            {isReady(open)
              ? 'Stuck for 48+ hours. A resend, or a text with the link, usually moves it.'
              : open.status === 'purchased'
                ? 'Paid. The account is being set up; they land in Students when the course opens.'
                : 'One automatic resend after 48 hours if unopened, then reminders only.'}
          </p>
        </AdminDialog>
      ) : null}
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

/* How far the outcome container's blue runs on beneath the table card. */
const UNDERLAP = 24
const SEG: CSSProperties = {
  whiteSpace: 'nowrap',
  borderRadius: 9999,
  border: 'none',
  padding: '6px 12px',
  fontSize: 13,
  fontWeight: 600,
  background: 'var(--admin-surface)',
  color: 'var(--admin-text)',
  boxShadow: 'inset 0 0 0 1px var(--admin-rule)',
  cursor: 'pointer',
}
const SEG_ON: CSSProperties = { ...SEG, background: 'var(--admin-brand)', color: 'var(--admin-surface)', boxShadow: 'none' }
const SEARCH: CSSProperties = {
  width: 256,
  height: 36,
  boxSizing: 'border-box',
  borderRadius: 9999,
  border: 'none',
  background: 'var(--admin-fill)',
  padding: '0 16px',
  fontSize: 14,
  color: 'var(--admin-ink)',
  outline: 'none',
}
const TH: CSSProperties = { padding: 12, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', whiteSpace: 'nowrap' }
const TD: CSSProperties = { padding: 12 }
const NAME: CSSProperties = { padding: 0, border: 'none', background: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)', cursor: 'pointer' }
const RESEND: CSSProperties = { borderRadius: 9999, border: 'none', background: 'none', padding: '6px 12px', fontSize: 13, fontWeight: 600 }
