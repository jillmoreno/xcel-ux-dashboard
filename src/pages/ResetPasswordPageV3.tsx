import { useEffect, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ResetPasswordCardV3 } from '@/components/e2e/VerifyEmailModalV3'
import { E2E_LEARNER_EMAIL } from '@/pages/endToEndDemo'

/**
 * RESET YOUR PASSWORD — THE PAGE THE EMAIL'S LINK OPENS. 2026-11-19, Afsana:
 * "the second reset your password modal would actually be shown to a user on
 * a different tab/webpage AFTER they click on the reset link … they cannot
 * actually reset their password via a modal within the secure checkout flow".
 *
 * A white header with the XCEL logo top-left, a light grey ground, and the
 * reset card centred on it. Check your email opens this in a new tab (the
 * demo's stand-in for the link), and the checkout tab stays where it was —
 * the learner goes back there and logs in with the new password.
 *
 * `?email=` carries the address the link was sent to; the demo learner's
 * otherwise.
 */
export function ResetPasswordPageV3() {
  const [params] = useSearchParams()
  const email = params.get('email')?.trim() || E2E_LEARNER_EMAIL

  useEffect(() => {
    document.title = 'Reset your password | XCEL'
  }, [])

  return (
    <div style={PAGE}>
      <header style={HEADER}>
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={HEADER_LOGO} />
      </header>
      <main style={MAIN}>
        <ResetPasswordCardV3 email={email} />
      </main>
    </div>
  )
}

const PAGE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: 'var(--color-e2e-reset-ground)',
}

/* The checkout's header, logo and all (`InvitedCheckoutPageV3`), with the
   logo alone on the left. */
const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 32px',
  background: 'var(--color-fixed-light)',
  boxShadow: 'inset 0 0 0 1px var(--color-e2e-partner-outline)',
}

const HEADER_LOGO: CSSProperties = { display: 'block', width: 115, height: 48, flex: 'none', objectFit: 'contain' }

const MAIN: CSSProperties = {
  flex: '1 0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 24px',
}
