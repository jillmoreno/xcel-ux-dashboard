import type { CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircleUser } from '@/icons'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { MailClient } from '@/components/e2e/MailClient'
import { EMAIL_VALIDATED_PARAM } from '@/data/inviteFlows'
import {
  E2E_LEARNER_EMAIL,
  E2E_LEARNER_FIRST,
  E2E_LEARNER_NAME,
  useEndToEndDemoParams,
  useEndToEndPageChrome,
} from './endToEndDemo'
import './inviteFlow.css'

/**
 * THE ACTIVATION EMAIL — 2026-10-22: "lets mock up what that email looks
 * like".
 *
 * ⚠ IT IS A STEP OF THE WALK, NOT AN ILLUSTRATION. The split confirmation used
 * to flip itself with a "Demo: I've clicked the link" shortcut, which told a
 * reviewer the email existed without ever showing it — and the email is the
 * load-bearing part of that arm: it is the thing standing between the purchase
 * and the account. So Open my email comes HERE, and Activate my account below
 * is what returns them validated.
 *
 * ⚠ THE SAME INBOX AS THE INVITATION. `MailClient` is the chrome extracted
 * from `InviteEmailPageV2` the same day; two mail mocks drawing two hand-copied
 * clients is how a walk ends up with two subtly different inboxes, which is the
 * one thing a mock of someone's own mail cannot afford.
 *
 * ⚠ THE INBOX HAS TWO XCEL MESSAGES ON THE GUEST WALK, and that is correct
 * rather than untidy: a guest who bought from the public site got an order
 * confirmation AND this activation mail. Showing one would make the list
 * disagree with the receipt the learner just read.
 */
export function XcelActivationEmailPage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Inbox')
  const navigate = useNavigate()
  const [params] = useSearchParams()

  /* ⚠ THE LINK IN THE EMAIL IS THE VALIDATION. It returns to the confirmation
     with the flag set, which is exactly what the real link does — the learner
     lands back on the page they left, now able to sign in. `replace`, so Back
     does not walk them into an inbox they have finished with. */
  const activate = () => {
    const next = new URLSearchParams(params)
    next.set(EMAIL_VALIDATED_PARAM, '1')
    navigate(
      { pathname: '/end-to-end-demo/order-confirmation', search: next.toString() },
      { replace: true },
    )
  }

  return (
    <div style={PAGE}>
      <StandaloneBrowserChrome />
      <MailClient
        readerLabel="Activate your XCEL account"
        messages={[
          {
            from: 'XCEL Solutions',
            when: 'Today',
            subject: 'Activate your XCEL account',
            preview: 'One more step — confirm your email address to finish setting up…',
            open: true,
          },
          {
            from: 'XCEL Solutions',
            when: 'Today',
            subject: 'Your order confirmation XL00186764',
            preview: 'Thank you for your order! Here are the details of your purchase…',
          },
        ]}
      >
        <p style={READER_EYEBROW}>Inbox</p>
        <h1 style={SUBJECT}>Activate your XCEL account</h1>
        <div style={FROM_ROW}>
          <CircleUser size={40} aria-hidden style={{ color: 'var(--color-neutral-300)', flex: 'none' }} />
          <div style={{ minWidth: 0, flex: '1 1 0' }}>
            <p style={FROM_ADDRESS}>support@xcelsolutions.com</p>
            <p style={FROM_TO}>
              <span style={{ fontWeight: 600 }}>To:</span> {E2E_LEARNER_NAME}
            </p>
          </div>
          <p style={SENT_AT}>Today, 10:32 AM EDT</p>
        </div>

        <article style={EMAIL}>
          <header style={EMAIL_HEAD}>
            <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={EMAIL_LOGO} />
          </header>
          <div style={EMAIL_BODY}>
            <p style={EMAIL_EYEBROW}>Account activation</p>
            <p style={EMAIL_GREETING}>Hi {E2E_LEARNER_FIRST},</p>
            <p style={EMAIL_COPY}>
              Thanks for your order. One more step: confirm that{' '}
              <strong style={{ fontWeight: 700 }}>{E2E_LEARNER_EMAIL}</strong> is yours, and we’ll finish
              setting up your account so you can start your course.
            </p>
            <button type="button" onClick={activate} className="cre-email-cta" style={EMAIL_CTA}>
              Activate my account
            </button>
            {/* ⚠ WHAT THE LINK IS FOR, in the mail itself. A bare button in an
                email asks the reader to trust it; saying what pressing it does
                — and that their course is waiting behind it — is what makes it
                pressable. */}
            <p style={EMAIL_CTA_NOTE}>
              Takes you back to sign in. Your purchased training is already on your account.
            </p>
            <p style={EMAIL_FINE}>
              This link expires in 24 hours. If you didn’t place this order, you can ignore this email —
              no account will be created.
            </p>
          </div>
          <footer style={EMAIL_FOOT}>
            <p style={EMAIL_FOOT_NAME}>XCEL Solutions</p>
            <p style={EMAIL_FOOT_FINE}>
              This is an example of what a learner receives. It is not real mail.
            </p>
          </footer>
        </article>
      </MailClient>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const PAGE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
}

const READER_EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const SUBJECT: CSSProperties = {
  margin: '6px 0 18px',
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 30,
  lineHeight: '38px',
  color: 'var(--color-text-primary)',
}

const FROM_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  paddingBottom: 18,
}

const FROM_ADDRESS: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 15,
  color: 'var(--color-text-primary)',
}

const FROM_TO: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const SENT_AT: CSSProperties = {
  margin: 0,
  flex: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

/* The message body is XCEL's — its own card inside the client's chrome, which
   is the one part of these pages that may carry the brand. */
const EMAIL: CSSProperties = {
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
}

const EMAIL_HEAD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: '14px 24px',
  background: 'var(--color-secondary-200)',
}

const EMAIL_LOGO: CSSProperties = { display: 'block', width: 120, height: 38, objectFit: 'contain' }

const EMAIL_BODY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 14,
  padding: '26px 28px 30px',
}

const EMAIL_EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-xcel-brick-600)',
}

const EMAIL_GREETING: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 22,
  lineHeight: '30px',
  color: 'var(--color-text-primary)',
}

const EMAIL_COPY: CSSProperties = {
  margin: 0,
  maxWidth: 520,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  lineHeight: '23px',
  color: 'var(--color-text-primary)',
}

const EMAIL_CTA: CSSProperties = {
  marginTop: 4,
  padding: '13px 24px',
  borderRadius: 4,
  border: 'none',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  cursor: 'pointer',
}

const EMAIL_CTA_NOTE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}

const EMAIL_FINE: CSSProperties = {
  margin: '6px 0 0',
  maxWidth: 520,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-tertiary)',
}

const EMAIL_FOOT: CSSProperties = {
  padding: '16px 28px 20px',
  borderTop: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-e2e-summary)',
}

const EMAIL_FOOT_NAME: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  color: 'var(--color-text-primary)',
}

const EMAIL_FOOT_FINE: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
