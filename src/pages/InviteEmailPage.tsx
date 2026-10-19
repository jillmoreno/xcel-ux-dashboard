import type { CSSProperties, ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRightFromSquare,
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
  E2E_LEARNER_FIRST,
  E2E_LEARNER_NAME,
  E2E_PARTNER_NAME,
  useEndToEndDemoParams,
  useEndToEndPageChrome,
} from './endToEndDemo'

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
      <MailTopBar />
      <div style={PAGE}>
        <MailRail />
      <MailList />
      <section aria-label="You’re Invited" style={READER}>
        <ReaderToolbar />
        <div style={READER_BODY}>
          <h1 style={SUBJECT}>You’re Invited: {E2E_COURSE_TITLE_SHORT} Package</h1>
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
          {/* THE EMAIL ITSELF — the only XCEL surface on this page. Its head
              is the invite flow's partner lockup, drawn here rather than
              imported: `PartnerHeader` is a STICKY 64-tall page header with
              the flow's own outline, and this is a band inside a message. */}
          <article style={EMAIL}>
            <header style={EMAIL_HEAD}>
              <p style={EMAIL_PARTNER}>{E2E_PARTNER_NAME}</p>
              <span aria-hidden style={EMAIL_HEAD_RULE} />
              <p style={EMAIL_OFFICIAL}>Official Partner of</p>
              <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={EMAIL_LOGO} />
            </header>
            <div style={EMAIL_BODY}>
              <p style={EMAIL_GREETING}>Hi {E2E_LEARNER_FIRST},</p>
              <p style={EMAIL_COPY}>
                <strong style={{ fontWeight: 700 }}>{E2E_PARTNER_NAME}</strong> has invited you to enroll in the{' '}
                <strong style={{ fontWeight: 700 }}>{E2E_COURSE_TITLE_SHORT} package</strong> with their exclusive
                discount. Click below to redeem the discount and start learning today!
              </p>
              <button type="button" onClick={openInvitation} style={EMAIL_CTA}>
                View Invitation
                <ArrowUpRightFromSquare size={16} aria-hidden />
              </button>
            </div>
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
      <button type="button" aria-label="Notifications" style={TOPBAR_BTN}>
        <Bell size={19} aria-hidden />
      </button>
      <button type="button" aria-label="Settings" style={TOPBAR_BTN}>
        <GearRegular size={19} aria-hidden />
      </button>
      <button type="button" aria-label={`Account for ${E2E_LEARNER_NAME}`} style={TOPBAR_BTN}>
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
      <button type="button" style={COMPOSE}>
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
      <button type="button" aria-current={current ? 'page' : undefined} style={current ? RAIL_ROW_ON : RAIL_ROW}>
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
        <button type="button" aria-label="Filter" style={LIST_ICON_BTN}>
          <Sliders size={17} aria-hidden />
        </button>
        <button type="button" aria-label="Sort" style={LIST_ICON_BTN}>
          <ChevronDown size={17} aria-hidden />
        </button>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        <MessageRow
          from="XCEL Solutions"
          when="10:30 AM"
          subject={`You’re Invited: ${E2E_COURSE_TITLE_SHORT}…`}
          preview={`${E2E_PARTNER_NAME} has invited you to enroll in the ${E2E_COURSE_TITLE_SHORT} Course Pac…`}
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
      <button type="button" aria-current={open ? 'true' : undefined} style={open ? ROW_ON : ROW}>
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
      <button type="button" aria-label="Back" style={TOOLBAR_BTN}>
        <ArrowLeft size={18} aria-hidden />
      </button>
      <button type="button" aria-label="Delete" style={TOOLBAR_BTN}>
        <Trash size={18} aria-hidden />
      </button>
      <button type="button" aria-label="Star" style={TOOLBAR_BTN}>
        <Star size={18} aria-hidden />
      </button>
      <span style={{ flex: '1 1 0' }} />
      <p style={TOOLBAR_COUNT}>1 of 2</p>
      <button type="button" aria-label="Previous message" style={TOOLBAR_BTN}>
        <ChevronLeft size={16} aria-hidden />
      </button>
      <button type="button" aria-label="Next message" style={TOOLBAR_BTN}>
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
  background: 'none',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const RAIL: CSSProperties = {
  width: 240,
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
  background: 'var(--color-mail-accent)',
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
  background: 'none',
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
  background: 'none',
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
  background: 'none',
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
const SUBJECT: CSSProperties = { margin: 0, fontSize: 25, lineHeight: '32px', fontWeight: 700 }
const FROM_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 }
const FROM_ADDRESS: CSSProperties = { margin: 0, fontSize: 15, fontWeight: 600 }
const FROM_TO: CSSProperties = { margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }
const SENT_AT: CSSProperties = { margin: 0, flex: 'none', fontSize: 13, color: 'var(--color-text-secondary)' }

/* The message. Its own card, because an email IS a document inside a client
   — the border is what says "this is the thing that was sent you". */
const EMAIL: CSSProperties = {
  border: '1px solid var(--color-mail-rule)',
  borderRadius: 4,
  overflow: 'hidden',
  background: 'var(--color-mail-ground)',
}
const EMAIL_HEAD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: '18px 24px',
  background: 'var(--color-fixed-light)',
  borderBottom: '1px solid var(--color-mail-rule)',
}
const EMAIL_PARTNER: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  color: 'var(--color-text-primary)',
}
const EMAIL_OFFICIAL: CSSProperties = { ...EMAIL_PARTNER, color: 'var(--color-text-secondary)' }
const EMAIL_HEAD_RULE: CSSProperties = { width: 1, alignSelf: 'stretch', background: 'var(--color-border-subtle)' }
const EMAIL_LOGO: CSSProperties = { height: 34, width: 'auto', display: 'block' }
const EMAIL_BODY: CSSProperties = { padding: '36px 40px 44px', display: 'flex', flexDirection: 'column', gap: 20 }
const EMAIL_GREETING: CSSProperties = { margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700 }
const EMAIL_COPY: CSSProperties = { margin: 0, fontSize: 16, lineHeight: '26px' }
/* ⚠ THE BRICK, NOT THE CTA TOKEN. `--color-xcel-brick` is what the invite
   flow's own buttons use — the Atlas skins turn the CTA colour navy, and an
   email that arrived before the learner has any skin should look the way
   XCEL sends it. Same reasoning as `InvitedProductDetailPage`'s rule. */
const EMAIL_CTA: CSSProperties = {
  alignSelf: 'center',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '16px 28px',
  border: 'none',
  borderRadius: 6,
  background: 'var(--color-xcel-brick)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
}
