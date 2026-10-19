import type { CSSProperties, ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleExclamation,
  CircleUser,
  Envelope,
  GearRegular,
  MagnifyingGlassRegular,
  PaperPlaneTopSolid,
  PenToSquare,
  Plus,
  Sliders,
  Star,
  Trash,
} from '@/icons'
import {
  E2E_COURSE_TITLE_SHORT,
  E2E_EMAIL_ADMIN,
  E2E_EMAIL_OFFICE,
  E2E_EMAIL_PARTNER,
  E2E_LEARNER_FIRST,
  E2E_LEARNER_NAME,
  E2E_ORIGINAL_PRICE,
  E2E_PARTNER_PRICE,
  useEndToEndDemoParams,
  useEndToEndPageChrome,
} from './endToEndDemo'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
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

export function InviteEmailPage() {
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
    <div style={SHELL}>
      {/* ⚠ THE BROWSER WINDOW CONTINUES HERE (2026-10-19, Jillienne: "can
          we also add this browser header to the email/invite flows so it
          feels like a seamless experience"). These pages render OUTSIDE the
          app shell, so the shell's own strip never reached them — the walk
          opened in a browser window, lost it for the invite flow, and got it
          back at the dashboard. Draws only in the Demo frame, as it does
          there. */}
      <StandaloneBrowserChrome />
      <MailTopBar />
      <div style={PAGE}>
        <MailRail />
      <MailList />
      <section aria-label="You’re Invited" style={READER}>
        <ReaderToolbar />
        <div style={READER_BODY}>
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

              ⚠ ITS PARTNER IS SUNRISE BANK, where the rest of the flow says
              Pristine Solutions — see `E2E_EMAIL_PARTNER` for why that is a
              discrepancy rather than a decision. */}
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
              <p style={EMAIL_PARTNER}>{E2E_EMAIL_PARTNER}</p>
              <span aria-hidden style={EMAIL_HEAD_RULE} />
              <p style={EMAIL_OFFICIAL}>Official partner of</p>
              <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={EMAIL_LOGO} />
            </header>
            <div style={EMAIL_BODY}>
              <p style={EMAIL_EYEBROW}>Invitation</p>
              <p style={EMAIL_GREETING}>Hi {E2E_LEARNER_FIRST},</p>
              <p style={EMAIL_COPY}>
                <strong style={{ fontWeight: 700 }}>{E2E_EMAIL_PARTNER}</strong> invited you to enroll in the{' '}
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
                  {E2E_EMAIL_PARTNER} saves you {emailSaving}
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
                Sent for {E2E_EMAIL_ADMIN} · {E2E_EMAIL_OFFICE} · {E2E_EMAIL_PARTNER}
              </p>
              <p style={EMAIL_FOOT_FINE}>
                Reply to this email to reach {E2E_EMAIL_ADMIN} at {E2E_EMAIL_OFFICE}. This is an example of what a
                recruit receives. It is not mail to the admin account.
              </p>
            </footer>
          </article>
        </div>
      </section>
      </div>
    </div>
  )
}

/** The client's top bar — search, and the three things every webmail puts at
 *  its right. Inert, like the rest of the chrome. */
function MailTopBar() {
  return (
    <div style={TOPBAR}>
      <div style={SEARCH}>
        <MagnifyingGlassRegular size={16} aria-hidden style={{ color: 'var(--color-text-secondary)', flex: 'none' }} />
        <span style={SEARCH_TEXT}>Search emails, senders, and files…</span>
      </div>
      <button type="button" aria-label="Notifications" className="cre-mail-btn" style={TOPBAR_BTN}>
        <Bell size={19} aria-hidden />
      </button>
      <button type="button" aria-label="Settings" className="cre-mail-btn" style={TOPBAR_BTN}>
        <GearRegular size={19} aria-hidden />
      </button>
      <button type="button" aria-label={`Account for ${E2E_LEARNER_NAME}`} className="cre-mail-btn" style={TOPBAR_BTN}>
        <CircleUser size={26} aria-hidden />
      </button>
    </div>
  )
}

/* ── the client's chrome, none of it wired ──────────────────────────────── */

/**
 * ⚠ EVERY CONTROL IN HERE IS INERT, and they are `<button type="button">`
 * rather than divs so they are still reachable and announced — a demo whose
 * chrome cannot be tabbed through reads as broken to anyone using a
 * keyboard, even when nothing happens on press.
 */
function MailRail() {
  return (
    <nav aria-label="Mailboxes" style={RAIL}>
      <button type="button" className="cre-mail-compose" style={COMPOSE}>
        <Plus size={16} aria-hidden />
        New Mail
      </button>
      <ul style={RAIL_LIST}>
        <RailRow icon={<Envelope size={17} aria-hidden />} label="Inbox" count={2} current />
        <RailRow icon={<Star size={17} aria-hidden />} label="Starred" />
        <RailRow icon={<PaperPlaneTopSolid size={17} aria-hidden />} label="Sent" />
        <RailRow icon={<PenToSquare size={17} aria-hidden />} label="Drafts" count={3} />
        <RailRow icon={<Trash size={17} aria-hidden />} label="Trash" />
        <RailRow icon={<CircleExclamation size={17} aria-hidden />} label="Spam" />
      </ul>
    </nav>
  )
}

function RailRow({
  icon,
  label,
  count,
  current = false,
}: {
  icon: ReactNode
  label: string
  count?: number
  current?: boolean
}) {
  return (
    <li>
      <button
        type="button"
        className={current ? undefined : 'cre-mail-btn'}
        aria-current={current ? 'page' : undefined}
        style={current ? RAIL_ROW_ON : RAIL_ROW}
      >
        <span aria-hidden style={{ display: 'inline-flex', flex: 'none' }}>
          {icon}
        </span>
        <span style={{ flex: '1 1 0', textAlign: 'left' }}>{label}</span>
        {count ? <span style={current ? RAIL_COUNT_ON : RAIL_COUNT}>{count}</span> : null}
      </button>
    </li>
  )
}

function MailList() {
  return (
    <div style={LIST}>
      <div style={LIST_HEAD}>
        <p style={LIST_TITLE}>Inbox</p>
        {/* ⚠ `Sliders` AND `ChevronDown` STAND IN for the design's funnel and
            its sort arrow. Neither glyph is in the icon registry, and
            CLAUDE.md's rule is the registry or nothing — these two read as
            "filter" and "sort" in the slot without anyone drawing a new
            path. Swap them the day those icons are added. */}
        <button type="button" aria-label="Filter" className="cre-mail-btn" style={LIST_ICON_BTN}>
          <Sliders size={17} aria-hidden />
        </button>
        <button type="button" aria-label="Sort" className="cre-mail-btn" style={LIST_ICON_BTN}>
          <ChevronDown size={17} aria-hidden />
        </button>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        <MessageRow
          from="XCEL Solutions"
          when="Today"
          subject={`You’re invited: ${E2E_COURSE_TITLE_SHORT}…`}
          preview={`${E2E_EMAIL_PARTNER} invited ${E2E_LEARNER_FIRST} to enroll at th…`}
          open
        />
        {/* A second message, so the inbox reads as an inbox. Nothing about it
            is XCEL's — it is the noise any invitation arrives beside. */}
        <MessageRow
          from="Alex Jean in Teams"
          when="Yesterday"
          subject="[EXTERNAL] Alex Jean sent a message"
          preview="You don’t often get an email from no-reply@teams.mail.microsoft. Learn why this is important…"
        />
      </ul>
    </div>
  )
}

function MessageRow({
  from,
  when,
  subject,
  preview,
  open = false,
}: {
  from: string
  when: string
  subject: string
  preview: string
  open?: boolean
}) {
  return (
    <li>
      {/* The OPEN row keeps its own fill and no hover class — it is already
          the darkest thing in the list, and re-tinting it under the cursor
          would read as a second selected state. */}
      <button
        type="button"
        className={open ? undefined : 'cre-mail-msg'}
        aria-current={open ? 'true' : undefined}
        style={open ? ROW_ON : ROW}
      >
        <span style={ROW_TOP}>
          <span aria-hidden style={UNREAD_DOT} />
          <span style={ROW_FROM}>{from}</span>
          <span style={open ? ROW_WHEN_ON : ROW_WHEN}>{when}</span>
        </span>
        <span style={ROW_SUBJECT}>{subject}</span>
        <span style={ROW_PREVIEW}>{preview}</span>
      </button>
    </li>
  )
}

function ReaderToolbar() {
  return (
    <div style={TOOLBAR}>
      {/* ⚠ NO FOLDER BUTTON. The design has one between Delete and Star and
          the registry has no folder glyph — an approximate icon on an inert
          control buys nothing, so the slot is simply not drawn. */}
      <button type="button" aria-label="Back" className="cre-mail-btn" style={TOOLBAR_BTN}>
        <ArrowLeft size={18} aria-hidden />
      </button>
      <button type="button" aria-label="Delete" className="cre-mail-btn" style={TOOLBAR_BTN}>
        <Trash size={18} aria-hidden />
      </button>
      <button type="button" aria-label="Star" className="cre-mail-btn" style={TOOLBAR_BTN}>
        <Star size={18} aria-hidden />
      </button>
      <span style={{ flex: '1 1 0' }} />
      <p style={TOOLBAR_COUNT}>1 of 2</p>
      <button type="button" aria-label="Previous message" className="cre-mail-btn" style={TOOLBAR_BTN}>
        <ChevronLeft size={16} aria-hidden />
      </button>
      <button type="button" aria-label="Next message" className="cre-mail-btn" style={TOOLBAR_BTN}>
        <ChevronRight size={16} aria-hidden />
      </button>
    </div>
  )
}

/* ── styles ─────────────────────────────────────────────────────────────── */

/* ⚠ THE CLIENT'S OWN PALETTE — `--color-mail-*`, fixed across every brand
   skin (see tokens.css). This is not an XCEL screen and must not inherit
   one: a webmail client that turns maroon on XCEL and navy on CRE says the
   opposite of the one thing this page exists to say. The first pass reached
   for `--color-info-*` and got the status ramp, which is TEAL here. Only the
   message body is XCEL's, and it brings its own colours. */
const SHELL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  fontFamily: 'var(--font-body)',
  background: 'var(--color-fixed-light)',
  color: 'var(--color-text-primary)',
}
const PAGE: CSSProperties = { display: 'flex', alignItems: 'stretch', flex: 1, minHeight: 0 }
const TOPBAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flex: 'none',
  padding: '12px 20px',
  borderBottom: '1px solid var(--color-mail-rule)',
}
/* A DIV, NOT AN `<input>`. Nothing on this page is wired, and a focusable
   text field that discards what you type is worse than a picture of one. */
const SEARCH: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flex: '0 1 660px',
  marginRight: 'auto',
  height: 38,
  padding: '0 16px',
  borderRadius: 8,
  background: 'var(--color-mail-field)',
}
const SEARCH_TEXT: CSSProperties = { fontSize: 14, color: 'var(--color-text-secondary)' }
const TOPBAR_BTN: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  padding: 0,
  border: 'none',
  borderRadius: 8,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const RAIL: CSSProperties = {
  /* 200, not 240 (2026-10-19) — the client's chrome is scenery, and every
     pixel it gives back goes to the letter, which is the only thing on this
     page anyone is meant to read. */
  width: 200,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: '16px 12px',
  borderRight: '1px solid var(--color-mail-rule)',
}
const COMPOSE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 44,
  border: 'none',
  borderRadius: 8,
  /* ⚠ NO `background` HERE — `.cre-mail-compose` owns it, or its hover
     could never win against an inline one. */
  color: 'var(--color-fixed-light)',
  fontFamily: 'inherit',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
}
const RAIL_LIST: CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }
const RAIL_ROW: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  height: 40,
  padding: '0 12px',
  border: 'none',
  borderRadius: 8,
  /* `.cre-mail-btn` owns the background — see the note on COMPOSE. */
  color: 'var(--color-text-secondary)',
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}
const RAIL_ROW_ON: CSSProperties = {
  ...RAIL_ROW,
  background: 'var(--color-mail-accent-wash)',
  color: 'var(--color-mail-accent-ink)',
  fontWeight: 700,
}
const RAIL_COUNT: CSSProperties = { flex: 'none', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }
const RAIL_COUNT_ON: CSSProperties = { ...RAIL_COUNT, color: 'var(--color-mail-accent-ink)' }

const LIST: CSSProperties = {
  width: 330,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid var(--color-mail-rule)',
  overflowY: 'auto',
}
const LIST_HEAD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '18px 16px',
  borderBottom: '1px solid var(--color-mail-rule)',
}
const LIST_TITLE: CSSProperties = { margin: 0, flex: '1 1 0', fontSize: 19, fontWeight: 600 }
const LIST_ICON_BTN: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  padding: 0,
  border: 'none',
  borderRadius: 6,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const ROW: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '14px 16px',
  border: 'none',
  borderLeft: '3px solid transparent',
  borderBottom: '1px solid var(--color-mail-rule)',
  /* `.cre-mail-msg` owns the background and the left edge's colour. */
  fontFamily: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
}
const ROW_ON: CSSProperties = {
  ...ROW,
  borderLeftColor: 'var(--color-mail-accent)',
  background: 'var(--color-mail-accent-wash)',
}
const ROW_TOP: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 }
const UNREAD_DOT: CSSProperties = {
  width: 7,
  height: 7,
  flex: 'none',
  borderRadius: '50%',
  background: 'var(--color-mail-accent)',
}
const ROW_FROM: CSSProperties = { flex: '1 1 0', minWidth: 0, fontSize: 14, fontWeight: 700 }
const ROW_WHEN: CSSProperties = { flex: 'none', fontSize: 13, color: 'var(--color-text-secondary)' }
const ROW_WHEN_ON: CSSProperties = { ...ROW_WHEN, color: 'var(--color-mail-accent-ink)' }
const ROW_SUBJECT: CSSProperties = { fontSize: 14, fontWeight: 600, lineHeight: '20px' }
const ROW_PREVIEW: CSSProperties = { fontSize: 13, lineHeight: '19px', color: 'var(--color-text-secondary)' }

const READER: CSSProperties = { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }
const TOOLBAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '12px 20px',
  borderBottom: '1px solid var(--color-mail-rule)',
}
const TOOLBAR_BTN: CSSProperties = { ...LIST_ICON_BTN, width: 34, height: 34 }
const TOOLBAR_COUNT: CSSProperties = { margin: '0 8px 0 0', fontSize: 14, color: 'var(--color-text-secondary)' }
const READER_BODY: CSSProperties = { padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }
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
