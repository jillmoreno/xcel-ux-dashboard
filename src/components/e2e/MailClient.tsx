import type { CSSProperties, ReactNode } from 'react'
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { E2E_LEARNER_NAME } from '@/pages/endToEndDemo'

/**
 * THE WEBMAIL CLIENT AROUND THE FLOW'S EMAILS — extracted from
 * `InviteEmailPageV2` on 2026-10-22, when the activation email became a second
 * page that has to sit in the same inbox.
 *
 * ⚠ EXTRACTED, NOT REBUILT. Two mail mocks drawing two hand-copied clients is
 * how a walk ends up with two subtly different inboxes — and the whole point of
 * these pages is that the learner never appears to leave their mail.
 *
 * ⚠ THE CLIENT'S OWN PALETTE — `--color-mail-*`, fixed across every brand skin
 * (see tokens.css). This is not an XCEL screen and must not inherit one: a
 * webmail client that turns maroon on XCEL and navy on CRE says the opposite of
 * the one thing these pages exist to say. Only the message BODY is XCEL's, and
 * each page brings its own.
 *
 * ⚠ EVERY CONTROL IN HERE IS INERT, and they are `<button type="button">`
 * rather than divs so they are still reachable and announced — a demo whose
 * chrome cannot be tabbed through reads as broken to anyone using a keyboard,
 * even when nothing happens on press.
 */

export type MailMessage = {
  from: string
  when: string
  subject: string
  preview: string
  /** The message the reader pane is showing. */
  open?: boolean
}

/** The whole client: chrome, rail, list, and the reader pane's toolbar. The
 *  page supplies the list's messages and the message body. */
export function MailClient({
  messages,
  readerLabel,
  children,
}: {
  messages: MailMessage[]
  /** Names the reader pane for assistive tech — the open message's subject. */
  readerLabel: string
  children: ReactNode
}) {
  const position = Math.max(
    1,
    messages.findIndex((m) => m.open) + 1,
  )
  return (
    <div style={MAIL_SHELL}>
      <MailTopBar />
      <div style={PAGE}>
        <MailRail />
        <MailList messages={messages} />
        <section aria-label={readerLabel} style={READER}>
          <ReaderToolbar position={position} total={messages.length} />
          <div style={READER_BODY}>{children}</div>
        </section>
      </div>
    </div>
  )
}

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

function MailList({ messages }: { messages: MailMessage[] }) {
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
        {messages.map((m) => (
          <MessageRow key={m.subject} {...m} />
        ))}
      </ul>
    </div>
  )
}

function MessageRow({ from, when, subject, preview, open = false }: MailMessage) {
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

function ReaderToolbar({ position, total }: { position: number; total: number }) {
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
      <p style={TOOLBAR_COUNT}>
        {position} of {total}
      </p>
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

/* The client's own ground. Not exported — `MailClient` draws it, so a page
   cannot forget it or describe it differently. */
const MAIL_SHELL: CSSProperties = {
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

const READER_BODY: CSSProperties = { padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }

const TOOLBAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '12px 20px',
  borderBottom: '1px solid var(--color-mail-rule)',
}

const TOOLBAR_BTN: CSSProperties = { ...LIST_ICON_BTN, width: 34, height: 34 }

const TOOLBAR_COUNT: CSSProperties = { margin: '0 8px 0 0', fontSize: 14, color: 'var(--color-text-secondary)' }
