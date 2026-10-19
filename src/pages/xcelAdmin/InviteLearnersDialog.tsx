import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { XmarkRegular } from '@/icons'
import { ADMIN_COMPANY, ADMIN_DEPARTMENTS, ADMIN_USER } from '@/data/xcelAdmin/learners'
import { useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, FIELD_LABEL, HEADING, INPUT } from './adminStyles'

/**
 * XCEL ADMIN · INVITE LEARNERS — the reference's invite dialog (2026-10-19).
 * Three ways in: EMAIL (addresses one per line, an optional name, lines of
 * authority, tier and a note — Send invite unlocks once there is an
 * address), a LINK to copy, and a QR CODE to print for a hiring event. A
 * send lands on the Invites page through the admin store.
 */

const LINES = ['Life', 'Health', 'Life & Health', 'P&C', 'Personal Lines'] as const
const DEPARTMENTS = [ADMIN_USER.department, ...ADMIN_DEPARTMENTS.map((d) => `${ADMIN_COMPANY} · ${d}`)]

type Tab = 'email' | 'link' | 'qr'

export function InviteLearnersDialog({ onClose, department: initial }: { onClose: () => void; department?: string }) {
  const { addInvites, showToast } = useAdminStore()
  const [tab, setTab] = useState<Tab>('email')
  const [department, setDepartment] = useState(initial ?? DEPARTMENTS[0])
  const [emails, setEmails] = useState('')
  const [name, setName] = useState('')
  const [lines, setLines] = useState<string[]>([...LINES])
  const [tier, setTier] = useState<'Standard' | 'Premier'>('Standard')
  const [note, setNote] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const addresses = useMemo(
    () =>
      emails
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)),
    [emails],
  )
  const deptName = department.replace(`${ADMIN_COMPANY} · `, '')
  const slug = deptName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const link = `https://xcelsolutions.com/invite/${ADMIN_COMPANY.toLowerCase()}/${slug}`

  const send = () => {
    addInvites(
      addresses.map((email) => ({
        email,
        name: addresses.length === 1 && name.trim() ? name.trim() : null,
        department: deptName,
        lines,
        tier,
        note: note.trim() || null,
        via: 'email' as const,
      })),
    )
    showToast(`Invite sent to ${addresses.length} ${addresses.length === 1 ? 'address' : 'addresses'}`)
    onClose()
  }

  return createPortal(
    <div style={SCRIM} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="invite-title" style={DIALOG}>
        <div style={{ padding: '20px 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h2 id="invite-title" style={TITLE}>
                Invite to {deptName}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--admin-muted)' }}>Agency pricing is already on the page they open.</p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} style={CLOSE}>
              <XmarkRegular size={14} aria-hidden />
            </button>
          </div>
          <div role="tablist" aria-label="Invite method" style={{ display: 'flex', gap: 20, marginTop: 16, borderBottom: '1px solid var(--admin-rule)' }}>
            {(
              [
                ['email', 'Email'],
                ['link', 'Link'],
                ['qr', 'QR code'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                style={{ ...TAB, color: tab === id ? 'var(--admin-ink)' : 'var(--admin-text)', boxShadow: tab === id ? 'inset 0 -2px 0 var(--admin-brand)' : undefined }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={BODY}>
          <div>
            <label style={FIELD_LABEL} htmlFor="invite-dept">
              Department
            </label>
            <select id="invite-dept" value={department} onChange={(e) => setDepartment(e.target.value)} style={INPUT}>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {tab === 'email' ? (
            <>
              <div>
                <label style={FIELD_LABEL} htmlFor="invite-emails">
                  Email addresses
                </label>
                <textarea
                  id="invite-emails"
                  rows={3}
                  placeholder="Type or paste, one per line"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  style={{ ...INPUT, resize: 'vertical' }}
                />
                <p style={HELP}>
                  {addresses.length
                    ? `${addresses.length} ${addresses.length === 1 ? 'address' : 'addresses'} ready to invite.`
                    : 'Email is required. Name and course are optional. Preview appears once you add an address.'}
                </p>
              </div>
              <div>
                <label style={FIELD_LABEL} htmlFor="invite-name">
                  Name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional</span>
                </label>
                <input id="invite-name" placeholder="Sam Rivera" value={name} onChange={(e) => setName(e.target.value)} style={INPUT} />
              </div>
              <div>
                <p style={FIELD_LABEL}>Lines of authority</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {LINES.map((l) => {
                    const on = lines.includes(l)
                    return (
                      <button
                        key={l}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setLines((xs) => (on ? xs.filter((x) => x !== l) : [...xs, l]))}
                        style={{ ...LINE, ...(on ? LINE_ON : null) }}
                      >
                        {l}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label style={FIELD_LABEL} htmlFor="invite-tier">
                  Tier
                </label>
                <select id="invite-tier" value={tier} onChange={(e) => setTier(e.target.value as 'Standard' | 'Premier')} style={INPUT}>
                  <option>Standard</option>
                  <option>Premier</option>
                </select>
                <p style={HELP}>Invitation constraints. They pick their state when they claim.</p>
              </div>
              <div>
                <label style={FIELD_LABEL} htmlFor="invite-note">
                  Your note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional</span>
                </label>
                <textarea
                  id="invite-note"
                  rows={2}
                  placeholder="Glad to have you starting with us. Get through this in two weeks and you will be selling by October."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ ...INPUT, resize: 'vertical' }}
                />
              </div>
              <div>
                <p style={FIELD_LABEL}>Hiring manager</p>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--admin-ink)', fontWeight: 600 }}>Eric</p>
                <p style={HELP}>Attributed to you. Super admins can assign someone else.</p>
              </div>
            </>
          ) : tab === 'link' ? (
            <div>
              <p style={FIELD_LABEL}>Invite link</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input readOnly value={link} aria-label="Invite link" style={{ ...INPUT, flex: 1 }} onFocus={(e) => e.target.select()} />
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(link)
                    showToast('Invite link copied')
                  }}
                  style={BUTTON_OUTLINE}
                >
                  Copy
                </button>
              </div>
              <p style={HELP}>Anyone with this link joins {deptName} at your agency rate. Paste it into an email, a text or a job post.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <FakeQr seed={link} />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--admin-ink)' }}>Print it for a hiring event</p>
                <p style={HELP}>Recruits scan it and land on the {deptName} page with your rate applied.</p>
                <button type="button" onClick={() => showToast('QR code downloaded')} style={{ ...BUTTON_OUTLINE, marginTop: 12 }}>
                  Download PNG
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={FOOT}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-muted)', flex: 1, minWidth: 180 }}>
            Replies come back to you. One resend after 48 hours if unopened, then auto reminders only.
          </p>
          <button type="button" onClick={() => showToast('Invite guide downloaded')} style={BUTTON_OUTLINE}>
            Download guide
          </button>
          <button type="button" onClick={onClose} style={{ ...BUTTON_OUTLINE, border: '1px solid transparent' }}>
            Cancel
          </button>
          {tab === 'email' ? (
            <button
              type="button"
              disabled={!addresses.length}
              onClick={send}
              style={{ ...BUTTON_BRAND, opacity: addresses.length ? 1 : 0.5, cursor: addresses.length ? 'pointer' : 'default' }}
            >
              Send invite
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** A QR-looking grid drawn from the link — a stand-in, not a scannable code. */
function FakeQr({ seed }: { seed: string }) {
  const n = 21
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0
  const cells: boolean[] = []
  for (let i = 0; i < n * n; i++) {
    h = (h * 1103515245 + 12345) | 0
    cells.push(((h >>> 16) & 1) === 1)
  }
  const finder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
  return (
    <svg width={140} height={140} viewBox={`0 0 ${n} ${n}`} role="img" aria-label="Invite QR code" style={{ flex: 'none', border: '1px solid var(--admin-rule)', borderRadius: 8, padding: 6, background: 'var(--admin-surface)' }}>
      {cells.map((on, i) => {
        const x = i % n
        const y = Math.floor(i / n)
        if (finder(x, y)) return null
        return on ? <rect key={i} x={x} y={y} width={1} height={1} fill="var(--admin-ink)" /> : null
      })}
      {[
        [0, 0],
        [n - 7, 0],
        [0, n - 7],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} fill="var(--admin-ink)" />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="var(--admin-surface)" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill="var(--admin-ink)" />
        </g>
      ))}
    </svg>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const SCRIM: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--admin-scrim)',
}
const DIALOG: CSSProperties = {
  width: '100%',
  // The reference's: up to 1080 wide, min(90vh, 880) tall, 24 corners.
  maxWidth: 1080,
  maxHeight: 'min(90vh, 880px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 24,
  border: '1px solid var(--admin-rule)',
  background: 'var(--admin-surface)',
  boxShadow: 'var(--admin-shadow-menu)',
  fontFamily: 'var(--font-body)',
}
const TITLE: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 22, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.025em', color: 'var(--admin-ink)' }
const CLOSE: CSSProperties = {
  flex: 'none',
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 9999,
  background: 'none',
  color: 'var(--admin-muted)',
  cursor: 'pointer',
}
const TAB: CSSProperties = {
  padding: '4px 2px 12px',
  border: 'none',
  background: 'none',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: -1,
}
const BODY: CSSProperties = { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 20 }
const HELP: CSSProperties = { margin: '6px 0 0', fontSize: 12, color: 'var(--admin-muted)' }
const LINE: CSSProperties = {
  borderRadius: 9999,
  border: '1px solid var(--admin-rule-strong)',
  background: 'var(--admin-surface)',
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--admin-text)',
  cursor: 'pointer',
}
const LINE_ON: CSSProperties = { border: '1px solid var(--admin-ink)', background: 'var(--admin-ink)', color: 'var(--admin-surface)' }
const FOOT: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  padding: '16px 32px',
  borderTop: '1px solid var(--admin-rule)',
}
