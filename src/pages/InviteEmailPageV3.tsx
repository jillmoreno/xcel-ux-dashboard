/* INVITE FLOW V3 — the invitation email (/end-to-end-demo/email).
 *
 * Afsana's concept. A VERBATIM FORK of `InviteEmailPageV2` taken 2026-10-29
 * (`inviteFlowVersions.ts`). It renders when `invite-flow-version` resolves
 * to `v3`; `InviteEmailPageV2` keeps rendering V2 and `InviteEmailPage` keeps rendering V1, and
 * NEITHER is touched by work in here — which is the whole point of the fork,
 * and the repo's standing rule for changing something that already exists.
 *
 * ⚠ IDENTICAL TO V2 UNTIL IT IS CHANGED. While that is still true, a
 * difference you see between the two versions is a bug in the switch
 * (`InviteFlowRoutes.tsx`), not a difference in the design.
 *
 * ⚠ FORK THE LAYOUT, IMPORT THE DATA. Everything below reads the demo's course,
 * prices, learner and partner from `./endToEndDemo` — keep it that way. Two
 * copies of the content means the V2/V3 comparison stops being about the
 * design.
 */
import type { CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CircleUser,
} from '@/icons'
import {
  E2E_EMAIL_ADMIN,
  E2E_EMAIL_OFFICE,
  E2E_LEARNER_NAME,
  E2E_PARTNER_NAME,
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
export function InviteEmailPageV3() {
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
            subject: 'You’re Invited to Get Licensed',
            preview: `${E2E_PARTNER_NAME} has invited you to begin your licensing journey…`,
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
          <h1 style={SUBJECT}>You’re Invited to Get Licensed</h1>
          <div style={FROM_ROW}>
            <CircleUser size={40} aria-hidden style={{ color: 'var(--color-neutral-300)', flex: 'none' }} />
            <div style={{ minWidth: 0, flex: '1 1 0' }}>
              {/* From the recruiter, not XCEL support (2026-11-03, Afsana). */}
              <p style={FROM_ADDRESS}>CodyMcClintock@tampa.com</p>
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
              <p style={EMAIL_PARTNER}>{E2E_PARTNER_NAME}</p>
              <span aria-hidden style={EMAIL_HEAD_RULE} />
              <p style={EMAIL_OFFICIAL}>Official partner of</p>
              <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={EMAIL_LOGO} />
            </header>
            {/* ⚠ V3'S LETTER — 2026-11-03, Afsana: no eyebrow, no name, no
                prices, no note under the button. It says who invited them
                and why to open it; the course and the discount are the
                invitation's to show. */}
            <div style={EMAIL_BODY}>
              <p style={EMAIL_GREETING}>Hi there,</p>
              <p style={EMAIL_COPY}>
                <strong style={{ fontWeight: 700 }}>{E2E_PARTNER_NAME}</strong> has invited you to begin your licensing
                journey. Open your invitation to access your discount!
              </p>
              {/* The red of the ending's Start Course (`.cre-e2e-cta`), not V2's
                  navy pill (2026-11-03, Afsana). */}
              <button type="button" onClick={openInvitation} className="cre-e2e-cta" style={EMAIL_CTA}>
                View invitation
              </button>
            </div>
            {/* The sign-off — who to reply to. V3 drops V2's "Sent for…"
                line and its demo disclaimer (2026-11-03, Afsana). */}
            <footer style={EMAIL_FOOT}>
              <p style={EMAIL_FOOT_NAME}>XCEL Solutions</p>
              <p style={EMAIL_FOOT_FINE}>
                Reply to this email to reach {E2E_EMAIL_ADMIN} at {E2E_EMAIL_OFFICE}.
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
/* WHITE ON V3 (2026-11-03, Afsana), the partner's name and "Official
   partner of" in black — V2 keeps its warm band. The rule under it is what
   separates the lockup from the letter now. */
const EMAIL_HEAD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: '16px 24px',
  background: 'var(--color-fixed-light)',
  borderBottom: '1px solid var(--color-mail-rule)',
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
  color: 'var(--color-text-primary)',
}
const EMAIL_HEAD_RULE: CSSProperties = { width: 1, height: 22, flex: 'none', background: 'var(--color-mail-rule)' }
const EMAIL_LOGO: CSSProperties = { height: 20, width: 'auto', display: 'block' }
const EMAIL_BODY: CSSProperties = { padding: '30px 34px 34px', display: 'flex', flexDirection: 'column', gap: 16 }
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
/* ⚠ THE ENDING'S START COURSE, NOT V2'S NAVY PILL (2026-11-03, Afsana):
   `.cre-e2e-cta` owns the brick fill and its hover; this is that button's
   shape (`CTA_ON` in `InvitedConfirmationPageV3`), centred. */
const EMAIL_CTA: CSSProperties = {
  alignSelf: 'center',
  marginTop: 6,
  padding: '12px 20px',
  borderRadius: 4,
  border: 'none',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
}
const EMAIL_FOOT: CSSProperties = {
  padding: '18px 34px 24px',
  borderTop: '1px solid var(--color-mail-rule)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}
const EMAIL_FOOT_NAME: CSSProperties = { margin: 0, fontSize: 13, fontWeight: 700 }
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
