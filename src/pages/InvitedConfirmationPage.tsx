import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheckSolid } from '@/icons'
import { PartnerHeader } from '@/components/e2e/PartnerHeader'
import { END_TO_END_VERSION, useEndToEndDemoParams, useEndToEndPageChrome } from './endToEndDemo'

/**
 * CONFIRMATION & PASSWORD — `/end-to-end-demo/confirmation` (2026-10-15,
 * Eric's request), Figma "Atlas UX Design" 425:2597, under the partner header.
 * The End-to-End Demo's step after Checkout: Place your order opens it, and
 * Confirm opens the demo's Home.
 *
 * Left, the order confirmation on the guide's Secondary 200; right, the
 * Create password form. The password field takes typing and the eye shows or
 * hides it — nothing is stored or sent.
 *
 * DEMO DATA, kept consistent with the rest of the demo rather than the
 * frame's placeholders: the learner is Checkout's Jordan Navarro (an
 * example.com address, not the frame's jane.doe), and the total is the order's
 * $299.00 (the frame says $139.00). The confirmation number is the design's.
 */
export function InvitedConfirmationPage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Confirmation & Password')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)

  return (
    <div style={PAGE}>
      <PartnerHeader />
      <main style={BODY}>
        {/* THE ORDER CONFIRMATION */}
        <section aria-label="Order confirmation" style={CONFIRM_PANEL}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
            <CircleCheckSolid size={52} aria-hidden style={{ color: 'var(--color-xcel-brick-600)' }} />
            <h1 style={TITLE}>Thank you for your order!</h1>
          </div>
          <dl style={FACTS}>
            <span aria-hidden style={RULE} />
            <Fact term="Confirmation number" value="XL00186764" spaced />
            <span aria-hidden style={RULE} />
            <Fact term="Email confirmation sent to" value={DEMO_EMAIL} />
            <span aria-hidden style={RULE} />
            <Fact term="Order total" value="$299.00" />
          </dl>
        </section>

        {/* CREATE PASSWORD */}
        <section aria-labelledby="create-password" style={PASSWORD_COLUMN}>
          <h2 id="create-password" style={TITLE}>
            Create password
          </h2>
          <form
            style={FORM}
            onSubmit={(e) => {
              e.preventDefault()
              navigate(`/dashboard-rebrand?demo=1&version=${END_TO_END_VERSION}`)
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <label style={FIELD_GROUP}>
                <span style={FIELD_LABEL}>Email</span>
                <span style={{ ...FIELD, background: 'var(--color-e2e-form-locked)' }}>
                  <span style={{ flex: '1 0 0', minWidth: 1 }}>{DEMO_EMAIL}</span>
                  <img src="/brand/confirmation/lock.svg" alt="Locked" width={16} height={16} style={{ display: 'block' }} />
                </span>
              </label>
              <label style={FIELD_GROUP}>
                <span style={FIELD_LABEL}>Password</span>
                <span style={FIELD}>
                  <input
                    type={shown ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    autoComplete="new-password"
                    style={PASSWORD_INPUT}
                  />
                  <button
                    type="button"
                    onClick={() => setShown((v) => !v)}
                    aria-label={shown ? 'Hide password' : 'Show password'}
                    aria-pressed={shown}
                    style={EYE}
                  >
                    <img src="/brand/confirmation/eye.svg" alt="" width={18} height={18} style={{ display: 'block' }} />
                  </button>
                </span>
              </label>
            </div>
            <div style={{ paddingTop: 8 }}>
              <button type="submit" style={CONFIRM}>
                Confirm
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

const DEMO_EMAIL = 'jordan.navarro@example.com'

function Fact({ term, value, spaced = false }: { term: string; value: string; spaced?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 2 }}>
      <dt style={FACT_TERM}>{term}</dt>
      <dd style={spaced ? { ...FACT_VALUE, letterSpacing: 2 } : FACT_VALUE}>{value}</dd>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const PAGE: CSSProperties = { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-neutral-75)' }

/* The body fills the window under the header: the confirmation panel, then
   the password column. */
const BODY: CSSProperties = { flex: '1 0 auto', display: 'flex', alignItems: 'stretch' }

/* Secondary 200, a Secondary 300 rule on its right; 64 down, 88 in. */
const CONFIRM_PANEL: CSSProperties = {
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 32,
  padding: '64px 88px',
  background: 'var(--color-secondary-200)',
  borderRight: '1px solid var(--color-secondary-300)',
}

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 24,
  lineHeight: '38px',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const FACTS: CSSProperties = { margin: 0, width: 297, display: 'flex', flexDirection: 'column', gap: 20 }

const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-secondary-400)' }

const FACT_TERM: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 12,
  lineHeight: 'normal',
  letterSpacing: 1.08,
  textTransform: 'uppercase',
  color: 'var(--color-neutral-700)',
}

const FACT_VALUE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 15,
  lineHeight: 'normal',
  color: 'var(--color-neutral-900)',
}

/* 88 in, 134 down; a 440 column, its title 24 above the form. */
const PASSWORD_COLUMN: CSSProperties = {
  flex: '1 0 0',
  minWidth: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  width: 440,
  maxWidth: 440,
  boxSizing: 'content-box',
  padding: '134px 0 64px 88px',
}

/* White, a #E5E7EB outline, 16 corners, a soft shadow; 40 in. */
const FORM: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 40,
  borderRadius: 16,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-fixed-light)',
  filter: 'drop-shadow(0 4px 6px var(--color-e2e-form-shadow))',
}

const FIELD_GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

const FIELD_LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 13,
  lineHeight: 'normal',
  textTransform: 'uppercase',
  color: 'var(--color-neutral-950)',
}

const FIELD: CSSProperties = {
  height: 44,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 16px',
  borderRadius: 8,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-e2e-form-text)',
}

const PASSWORD_INPUT: CSSProperties = {
  flex: '1 0 0',
  minWidth: 1,
  height: '100%',
  padding: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  font: 'inherit',
  color: 'var(--color-e2e-form-placeholder)',
}

const EYE: CSSProperties = {
  flex: 'none',
  display: 'flex',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
}

const CONFIRM: CSSProperties = {
  width: '100%',
  padding: '14px 0',
  border: 'none',
  borderRadius: 8,
  background: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: 'normal',
  color: 'var(--color-fixed-light)',
  cursor: 'pointer',
}
