import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ADMIN_DEPARTMENTS } from '@/data/atlasAdmin/learners'
import { SALES_REP, US_STATES, agencyPrice, listPrice } from '@/data/atlasAdmin/pricing'
import { ADMIN_BASE, useAdminStore } from './adminStore'

/**
 * ATLAS ADMIN — THE RECRUIT'S SIDE OF AN INVITE (2026-10-20). The
 * reference's public /invite/:company/:department[/:offer] and
 * /join/event/:departmentId pages: what a recruit sees after opening a
 * department's link or scanning a career-event QR code.
 *
 *   Invite — the product, a license state (final), the agency price for
 *   it, then "Almost there": a work email that the invitation binds to,
 *   and the hand-off to sign-in.
 *   Event — one work email; the recruit lands in the office with no hiring
 *   manager attached and no partner code to type.
 *
 * Finishing either adds the recruit to the store's invites, so Invites in
 * the portal lists them straight away. The sign-in hand-off itself (Keycloak
 * in the reference) is not here — nothing leaves the page.
 */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const departmentFrom = (id?: string) => ADMIN_DEPARTMENTS.find((d) => slug(d) === id) ?? null

export function AtlasAdminInvitePage() {
  const { department: deptId, offer } = useParams()
  const { companyLabel, addInvites } = useAdminStore()
  const department = departmentFrom(deptId)
  const tier = offer === 'premier' ? 'Premier' : 'Standard'
  const product = `Life & Health Pre-Licensing · ${tier}`
  const [state, setState] = useState('')
  const [step, setStep] = useState<'state' | 'email' | 'done'>('state')
  const [email, setEmail] = useState('')

  const finish = () => {
    addInvites([{ email: email.trim(), name: null, department: department ?? ADMIN_DEPARTMENTS[0], lines: ['Life & Health'], tier, note: `Claimed from the invite link · ${state}`, via: 'link' }])
    setStep('done')
  }

  return (
    <Shell>
      <p style={EYEBROW}>{companyLabel}</p>
      <h1 style={{ ...SERIF, margin: '6px 0 8px', fontSize: 26, lineHeight: 1.2 }}>{step === 'state' ? product : step === 'email' ? 'Almost there' : 'Check your email'}</h1>

      {step === 'state' ? (
        <>
          <p style={BODY}>
            {companyLabel} invited you through {department ?? 'your department'}. Pick your license state. That choice is final.
          </p>
          <div style={PAPER}>
            <p style={KICK}>Your product</p>
            <p style={{ margin: '4px 0 14px', fontSize: 13, color: 'var(--admin-public-ink)' }}>{product}</p>
            <label>
              <span style={KICK}>License state</span>
              <select value={state} onChange={(e) => setState(e.target.value)} style={{ ...INPUT, marginTop: 6 }}>
                <option value="">Choose your state</option>
                {US_STATES.map(([c, n]) => (
                  <option key={c} value={c}>
                    {c} · {n}
                  </option>
                ))}
              </select>
            </label>
            <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--admin-public-text)' }}>
              {state ? (
                <>
                  <s style={{ color: 'var(--admin-public-muted)' }}>${listPrice(state, 'lh')}</s> <strong style={{ color: 'var(--admin-public-ink)' }}>${agencyPrice(state, 'lh')}</strong> · your agency rate
                </>
              ) : (
                'List from $199 · your agency rate applies'
              )}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--admin-public-muted)' }}>
              Questions? {SALES_REP.name} · {SALES_REP.email}
            </p>
          </div>
          <button type="button" disabled={!state} onClick={() => setStep('email')} style={{ ...CTA, opacity: state ? 1 : 0.45, cursor: state ? 'pointer' : 'default' }}>
            Continue
          </button>
        </>
      ) : null}

      {step === 'email' ? (
        <>
          <p style={BODY}>Continue with your email. Sign-in happens on the next screen — there is no password form in this portal.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (/.+@.+\..+/.test(email)) finish()
            }}
            style={PAPER}
          >
            <label>
              <span style={KICK}>Work email</span>
              <input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...INPUT, marginTop: 6 }} />
            </label>
            <p style={{ margin: '8px 0 0', fontSize: 10, color: 'var(--admin-public-muted)' }}>
              {email ? `Bound to ${email}. ` : ''}This invitation can never bind to another person.
            </p>
            <button type="submit" disabled={!/.+@.+\..+/.test(email)} style={{ ...CTA, marginTop: 14, opacity: /.+@.+\..+/.test(email) ? 1 : 0.45 }}>
              Continue with your email
            </button>
          </form>
          <button type="button" onClick={() => setStep('state')} style={LINK}>
            ← {state} · change product details
          </button>
        </>
      ) : null}

      {step === 'done' ? (
        <div style={PAPER}>
          <p style={{ ...BODY, color: 'var(--admin-public-ink)' }}>
            We sent a sign-in link to <strong>{email}</strong>. Open it on this device to start {product} for {US_STATES.find(([c]) => c === state)?.[1]} at ${agencyPrice(state, 'lh')}.
          </p>
          <p style={{ ...BODY, fontSize: 11, marginTop: 10 }}>Demo: you now appear on the portal’s Invites page, sent by link.</p>
          <Link to={`${ADMIN_BASE}/invites${window.location.search}`} style={{ ...CTA, display: 'inline-block', marginTop: 14, textDecoration: 'none' }}>
            See it in the Admin portal
          </Link>
        </div>
      ) : null}
    </Shell>
  )
}

export function AtlasAdminJoinEventPage() {
  const { departmentId } = useParams()
  const { addInvites } = useAdminStore()
  const department = departmentFrom(departmentId)
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const ok = /.+@.+\..+/.test(email)

  return (
    <Shell>
      <p style={EYEBROW}>Career event</p>
      <h1 style={{ ...SERIF, margin: '6px 0 8px', fontSize: 26 }}>Start with {department ?? 'this office'}</h1>
      <p style={BODY}>This scan lands you in the office. No hiring manager is attached. You do not enter a partner code.</p>
      {saved ? (
        <div style={PAPER}>
          <p style={{ ...BODY, color: 'var(--admin-public-ink)' }}>
            Saved as <strong>{saved}</strong>. Check your email for the link to choose your state and start.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!ok) return
            addInvites([{ email: email.trim(), name: null, department: department ?? ADMIN_DEPARTMENTS[0], lines: ['Life & Health'], tier: 'Standard', note: 'Joined at a career event', via: 'qr' }])
            setSaved(email.trim())
          }}
          style={PAPER}
        >
          <label>
            <span style={KICK}>Work email</span>
            <input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...INPUT, marginTop: 6 }} />
          </label>
          <button type="submit" disabled={!ok} style={{ ...CTA, marginTop: 14, opacity: ok ? 1 : 0.45 }}>
            Join this office
          </button>
        </form>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--admin-public-bg)', fontFamily: 'var(--font-body)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px max(24px, calc((100% - 360px) / 2))', background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-public-rule)' }}>
        <img alt="XCEL" src="/brand/xcel-logo.webp" style={{ height: 18 }} />
        <Link to={`${ADMIN_BASE}/students${window.location.search}`} style={{ fontSize: 10, color: 'var(--admin-public-text)', textDecoration: 'none' }}>
          Admin portal
        </Link>
      </header>
      <main style={{ maxWidth: 360, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</main>
    </div>
  )
}

const EYEBROW: CSSProperties = { margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-brand)' }
const SERIF: CSSProperties = { fontFamily: 'var(--admin-font-serif)', fontWeight: 700, color: 'var(--admin-public-ink)' }
const BODY: CSSProperties = { margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--admin-public-text)' }
const KICK: CSSProperties = { margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-public-muted)' }
const PAPER: CSSProperties = { padding: 14, borderRadius: 12, background: 'var(--admin-surface)', border: '1px solid var(--admin-public-rule)' }
const INPUT: CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box', padding: '10px 11px', borderRadius: 8, border: '1px solid var(--admin-public-rule)', background: 'var(--admin-surface)', fontFamily: 'inherit', fontSize: 12, color: 'var(--admin-public-ink)' }
const CTA: CSSProperties = { width: '100%', border: 'none', borderRadius: 9999, background: 'var(--admin-brand)', padding: 11, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--admin-surface)', textAlign: 'center', cursor: 'pointer' }
const LINK: CSSProperties = { alignSelf: 'flex-start', padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 11, color: 'var(--admin-public-text)', cursor: 'pointer' }
