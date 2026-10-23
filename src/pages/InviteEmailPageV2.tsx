/* INVITE FLOW V2 — the invitation email (/end-to-end-demo/email).
 *
 * A VERBATIM FORK of `InviteEmailPage` taken 2026-10-22, the day the invite flow got
 * versions (`inviteFlowVersions.ts`). It renders when `invite-flow-version`
 * resolves to `v2`; `InviteEmailPage` keeps rendering V1 and is NOT
 * touched by work in here — which is the whole point of the fork, and the
 * repo's standing rule for changing something that already exists.
 *
 * ⚠ IDENTICAL TO V1 UNTIL IT IS CHANGED. While that is still true, a
 * difference you see between the two versions is a bug in the switch
 * (`InviteFlowRoutes.tsx`), not a difference in the design.
 *
 * ⚠ FORK THE LAYOUT, IMPORT THE DATA. Everything below reads the demo's course,
 * prices, learner and partner from `./endToEndDemo` — keep it that way. Two
 * copies of the content means the V1/V2 comparison stops being about the
 * design.
 */
import type { CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CircleUser,
} from '@/icons'
import {
  E2E_COURSE_TITLE_SHORT,
  E2E_EMAIL_ADMIN,
  E2E_EMAIL_OFFICE,
  E2E_LEARNER_FIRST,
  E2E_LEARNER_NAME,
  E2E_ORIGINAL_PRICE,
  E2E_PARTNER_NAME,
  E2E_PARTNER_PRICE,
  useEndToEndDemoParams,
  useEndToEndPageChrome,
} from './endToEndDemo'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { MailClient } from '@/components/e2e/MailClient'
import './inviteFlow.css'

/**
 * THE INVITE EMAIL — `/end-to-end-demo/email` (2026-10-19, Jillienne: "we
 * need to add a page to the first part of the Invite flow that shows the
 * email the user is starting from").
 *
 * The walk used to open on the Invited Product Detail page, which is the
 * page a learner lands on AFTER clicking something. What they clicked was
 * never shown, so the flow began one step after its own beginning — a
 * stakeholder had to be told "imagine you got an email".
 *
 * ⚠ IT IS A MOCK OF SOMEBODY ELSE'S PRODUCT, and that is the point: this is
 * a WEBMAIL CLIENT, not an XCEL screen. Nothing here uses the Atlas or
 * Compass chrome, because the one thing the page has to say is "you are not
 * in our product yet". The only XCEL surface on it is the email body, which
 * is the invitation itself.
 *
 * ⚠ THE MAIL CLIENT IS DELIBERATELY GENERIC — no product's name, no
 * product's logo, no copy of anyone's brand. It reads as "an inbox" rather
 * than as a particular company's, which keeps a demo screenshot from
 * implying a partnership nobody has agreed to.
 *
 * ⚠ ONLY ONE THING IS WIRED: View Invitation, which opens the Invited
 * Product Detail page carrying the address it arrived with — the same
 * hand-off every other page in this flow makes. Every other control draws
 * and does nothing, as the invite flow's unwired controls do.
 *
 * DEMO DATA: the partner name is the design's own, and the learner is the
 * demo's (`E2E_LEARNER_*`). The second message exists to make the inbox read
 * as an inbox rather than a page with one row on it.
 */
/** "$199.00" → "$199" — the email sets prices large and the cents are noise
 *  at that size. The flow's own pages keep them. */
function shortPrice(v: string): string {
  return v.replace(/\.00$/, '')
}

/** ⚠ DERIVED, NEVER TYPED. The design says "saves you $134"; that is
 *  199 − 65, and writing it by hand is a third number to keep in step with
 *  the two above it. */
const emailSaving = shortPrice(
  `$${(Number(E2E_ORIGINAL_PRICE.replace(/[^0-9.]/g, '')) - Number(E2E_PARTNER_PRICE.replace(/[^0-9.]/g, ''))).toFixed(2)}`,
)

export function InviteEmailPageV2() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Inbox')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  /* ⚠ THE ADDRESS IS CARRIED, NOT REBUILT — `?journey=full`, the version and
     every flag pin have to survive the step, or opening the invitation would
     quietly drop the reviewer out of the walk they are in. Same rule as the
     other hand-offs in this flow. */
  const openInvitation = () => navigate(`/end-to-end-demo?${params.toString()}`)
  return (
    <div style={PAGE_SHELL}>
      {/* ⚠ THE BROWSER WINDOW CONTINUES HERE (2026-10-19, Jillienne: "can
          we also add this browser header to the email/invite flows so it
          feels like a seamless experience"). These pages render OUTSIDE the
          app shell, so the shell's own strip never reached them — the walk
          opened in a browser window, lost it for the invite flow, and got it
          back at the dashboard. Draws only in the Demo frame, as it does
          there. */}
      <StandaloneBrowserChrome />
      {/* ⚠ THE CLIENT IS SHARED (2026-10-22). Its chrome moved to
          `MailClient` when the activation email became a second page in the
          same inbox — two mail mocks drawing two hand-copied clients is how a
          walk ends up with two subtly different inboxes, which is the one
          thing a mock of someone's own mail cannot afford. Only the message
          BODY below is this page's. */}
      <MailClient
        readerLabel="You’re Invited"
        messages={[
          {
            from: 'XCEL Solutions',
            when: 'Today',
            subject: `You’re invited: ${E2E_COURSE_TITLE_SHORT}…`,
            preview: `${E2E_PARTNER_NAME} invited ${E2E_LEARNER_FIRST} to enroll at th…`,
            open: true,
          },
          /* A second message, so the inbox reads as an inbox. Nothing about it
             is XCEL's — it is the noise any invitation arrives beside. */
          {
            from: 'Alex Jean in Teams',
            when: 'Yesterday',
            subject: '[EXTERNAL] Alex Jean sent a message',
            preview:
              'You don’t often get an email from no-reply@teams.mail.microsoft. Learn why this is important…',
          },
        ]}
      >
          {/* The client's own eyebrow over the subject — which mailbox you
              are reading in, as the design draws it. */}
          <p style={READER_EYEBROW}>Inbox</p>
          <h1 style={SUBJECT}>You’re invited: {E2E_COURSE_TITLE_SHORT}</h1>
          <div style={FROM_ROW}>
            <CircleUser size={40} aria-hidden style={{ color: 'var(--color-neutral-300)', flex: 'none' }} />
            <div style={{ minWidth: 0, flex: '1 1 0' }}>
              <p style={FROM_ADDRESS}>support@xcelsolutions.com</p>
              <p style={FROM_TO}>
                <span style={{ fontWeight: 600 }}>To:</span> {E2E_LEARNER_NAME}
              </p>
            </div>
            <p style={SENT_AT}>Today, 10:30 AM EDT</p>
          </div>
          {/* ⚠ THE EMAIL ITSELF — Jillienne's design, 2026-10-19. The only
              XCEL surface on this page, and the one thing here that is not a
              mock of somebody else's product.

              ⚠ ITS PARTNER IS THE FLOW'S, from `E2E_PARTNER_NAME`. For one
              commit the email said Sunrise Bank while the page it opens
              said Pristine Solutions; the whole flow is Sunrise Bank now. */}
          <article style={EMAIL}>
            <header style={EMAIL_HEAD}>
              <span aria-hidden style={PARTNER_MARK}>
                {/* A GENERIC SUNRISE, not a logo. Sunrise Bank is invented,
                    so there is no real mark to reproduce — a sun over a
                    horizon reads as the name without borrowing anyone's
                    identity. Replace it the day a real partner's artwork
                    arrives, the way the XCEL lockup beside it is real. */}
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
                  <circle cx="12" cy="13" r="5" fill="currentColor" />
                  <rect x="3" y="16" width="18" height="2" rx="1" fill="currentColor" />
                </svg>
              </span>
              <p style={EMAIL_PARTNER}>{E2E_PARTNER_NAME}</p>
              <span aria-hidden style={EMAIL_HEAD_RULE} />
              <p style={EMAIL_OFFICIAL}>Official partner of</p>
              <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={EMAIL_LOGO} />
            </header>
            <div style={EMAIL_BODY}>
              <p style={EMAIL_EYEBROW}>Invitation</p>
              <p style={EMAIL_GREETING}>Hi {E2E_LEARNER_FIRST},</p>
              <p style={EMAIL_COPY}>
                <strong style={{ fontWeight: 700 }}>{E2E_PARTNER_NAME}</strong> invited you to enroll in the{' '}
                <strong style={{ fontWeight: 700 }}>{E2E_COURSE_TITLE_SHORT}</strong> package for {E2E_EMAIL_OFFICE}.
                You pay your own way, at the office price. No partner code.
              </p>
              {/* ⚠ THE SAVING IS DERIVED, not a third typed number — see
                  `emailSaving`. Three prices written by hand is three
                  chances for them to stop adding up. */}
              <p style={EMAIL_PRICE_ROW}>
                <span style={EMAIL_PRICE}>{shortPrice(E2E_PARTNER_PRICE)}</span>
                <span style={EMAIL_PRICE_WAS}>{shortPrice(E2E_ORIGINAL_PRICE)}</span>
                <span style={EMAIL_SAVING}>
                  {E2E_PARTNER_NAME} saves you {emailSaving}
                </span>
              </p>
              <button type="button" onClick={openInvitation} className="cre-email-cta" style={EMAIL_CTA}>
                View invitation
              </button>
              <p style={EMAIL_CTA_NOTE}>
                Opens the {E2E_EMAIL_OFFICE} page with {E2E_COURSE_TITLE_SHORT.replace('Florida ', '')} already
                selected. The link stays live.
              </p>
            </div>
            {/* The sign-off: who it was sent on behalf of, and the one line
                that says this is a demo of what a RECRUIT receives rather
                than mail to the admin account. */}
            <footer style={EMAIL_FOOT}>
              <p style={EMAIL_FOOT_NAME}>XCEL Solutions</p>
              <p style={EMAIL_FOOT_LINE}>
                Sent for {E2E_EMAIL_ADMIN} · {E2E_EMAIL_OFFICE} · {E2E_PARTNER_NAME}
              </p>
              <p style={EMAIL_FOOT_FINE}>
                Reply to this email to reach {E2E_EMAIL_ADMIN} at {E2E_EMAIL_OFFICE}. This is an example of what a
                recruit receives. It is not mail to the admin account.
              </p>
            </footer>
          </article>
      </MailClient>
    </div>
  )
}


const READER_EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-email-accent)',
}
/* Serif, as the design draws it — the subject is the letter's own title. */
const SUBJECT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 27,
  lineHeight: '34px',
  fontWeight: 700,
}
const FROM_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 }
const FROM_ADDRESS: CSSProperties = { margin: 0, fontSize: 15, fontWeight: 600 }
const FROM_TO: CSSProperties = { margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }
const SENT_AT: CSSProperties = { margin: 0, flex: 'none', fontSize: 13, color: 'var(--color-text-secondary)' }

/* The message. Its own card, because an email IS a document inside a client
   — the border is what says "this is the thing that was sent you". */
/* The message. Its own card, because an email IS a document inside a client
   — the border is what says "this is the thing that was sent you". */
const EMAIL: CSSProperties = {
  border: '1px solid var(--color-mail-rule)',
  borderRadius: 6,
  overflow: 'hidden',
  background: 'var(--color-fixed-light)',
  maxWidth: 620,
  width: '100%',
  alignSelf: 'center',
}
/* ⚠ A WARM BAND, NOT A WHITE ONE (2026-10-19, the design). It is the one
   stripe of partner colour in the message and what separates the lockup from
   the letter under it; on white the two ran together. */
const EMAIL_HEAD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '16px 24px',
  background: 'var(--color-email-partner-band)',
  borderBottom: '1px solid var(--color-mail-rule)',
}
/* The partner's mark — a navy tile, the size of the wordmark beside it. */
const PARTNER_MARK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
  width: 30,
  height: 30,
  borderRadius: 6,
  background: 'var(--color-email-partner-mark)',
  color: 'var(--color-fixed-light)',
}
const EMAIL_PARTNER: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-text-primary)',
}
const EMAIL_OFFICIAL: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 400,
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}
const EMAIL_HEAD_RULE: CSSProperties = { width: 1, height: 22, flex: 'none', background: 'var(--color-mail-rule)' }
const EMAIL_LOGO: CSSProperties = { height: 20, width: 'auto', display: 'block' }
const EMAIL_BODY: CSSProperties = { padding: '30px 34px 34px', display: 'flex', flexDirection: 'column', gap: 16 }
/* The design's blue eyebrow over the greeting — the one word that says what
   kind of letter this is before you read it. */
const EMAIL_EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-email-accent)',
}
/* Serif, as the design draws it — the letter's own voice, not the client's. */
const EMAIL_GREETING: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 30,
  lineHeight: '36px',
  color: 'var(--color-text-primary)',
}
const EMAIL_COPY: CSSProperties = { margin: 0, fontSize: 15, lineHeight: '25px' }
/* The price, what it was, and what the partner takes off — one line, aligned
   on the baseline so the struck figure sits with the live one. */
const EMAIL_PRICE_ROW: CSSProperties = {
  margin: '4px 0 0',
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: 10,
}
const EMAIL_PRICE: CSSProperties = { fontSize: 27, fontWeight: 700, lineHeight: '32px' }
const EMAIL_PRICE_WAS: CSSProperties = {
  fontSize: 16,
  color: 'var(--color-text-tertiary, var(--color-text-secondary))',
  textDecoration: 'line-through',
}
/* A quiet green pill. It is the only colour in the letter after the eyebrow,
   which is the point — the saving is the thing the recruit is being told. */
const EMAIL_SAVING: CSSProperties = {
  alignSelf: 'center',
  padding: '5px 12px',
  borderRadius: 999,
  background: 'var(--color-email-saving-bg)',
  color: 'var(--color-email-saving-ink)',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}
/* ⚠ A PILL, LEFT-ALIGNED, AND NOT THE BRICK (2026-10-19, the design). The
   first pass centred a brick CTA because the invite flow's buttons are
   brick; this letter draws a navy pill at the text's left edge, in line with
   everything above it. `.cre-email-cta` owns the fill so the hover can
   outrank the element — see `inviteFlow.css`. */
const EMAIL_CTA: CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 6,
  display: 'inline-flex',
  alignItems: 'center',
  padding: '13px 26px',
  border: 'none',
  borderRadius: 999,
  fontFamily: 'inherit',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
}
const EMAIL_CTA_NOTE: CSSProperties = {
  margin: 0,
  fontSize: 12.5,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}
const EMAIL_FOOT: CSSProperties = {
  padding: '18px 34px 24px',
  borderTop: '1px solid var(--color-mail-rule)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}
const EMAIL_FOOT_NAME: CSSProperties = { margin: 0, fontSize: 13, fontWeight: 700 }
const EMAIL_FOOT_LINE: CSSProperties = { margin: 0, fontSize: 12.5, color: 'var(--color-text-secondary)' }
const EMAIL_FOOT_FINE: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 11.5,
  lineHeight: '17px',
  color: 'var(--color-text-tertiary, var(--color-text-secondary))',
}

/* The page's outer column. The CLIENT draws its own ground inside this — see
   `MailClient`, which is where the webmail chrome lives since 2026-10-22. */
const PAGE_SHELL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
}
