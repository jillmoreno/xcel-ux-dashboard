import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { PaperPlaneTopSolid, RubiLogo, XmarkRegular } from '@/icons'

/**
 * COMPASS RUBI RIGHT RAIL — "Chat with Rubi", Figma
 * "Atlas-Compass-Global-Navigation", node 49:3053, 2026-09-23.
 *
 * The AI study partner beside a Compass course player: right of the course
 * content, below the player controls bar, 380px wide and pinned for the height
 * of the viewport. Three parts:
 *
 *   1. **Header** — the Rubi mark, "Rubi / here to help", and close.
 *   2. **Thread** — Rubi's opening line, then whatever the learner sends. It
 *      scrolls on its own; the header and composer stay put.
 *   3. **Composer** — three suggestion chips and an "Ask Rubi" input with send.
 *
 * **THERE IS NO MODEL BEHIND IT, and the rail says so rather than pretending.**
 * A chip fills the input (it does not send on its own — the learner stays in
 * charge of what goes out); sending appends the learner's message and a plain
 * line that Rubi is not connected in this prototype. Inventing Rubi's answers
 * would put study advice on screen that nobody wrote — the rule the rest of
 * this version holds to. Wire `onAsk` to a real endpoint and drop the note.
 *
 * Departures, on purpose:
 * - **The mark is the product's `RubiLogo`** in the design's red, not the
 *   design's hexagon-and-star stand-in; close is FA Regular `xmark` where the
 *   design types a "×"; send is FA Solid `paper-plane-top`, the glyph drawn.
 * - **Open Sans / the Georgia serif** for the design's Inter / Source Serif 4.
 *
 * **IT SLIDES IN AND OUT FROM THE RIGHT** (2026-09-23). It stays MOUNTED and
 * `open` drives two transitions on one ease-in-out curve: the column's width
 * (380 ↔ 0), so the course content widens and narrows with it rather than
 * jumping, and the panel's `translateX` (0 ↔ 100%), so it travels in from the
 * right edge rather than being cropped in place. Staying mounted also keeps
 * the conversation when the learner closes and reopens it.
 *
 * Closed, it is `inert` and `aria-hidden`, and `visibility` flips to hidden
 * only AFTER the slide-out (a delayed `visibility` transition) — so nothing in
 * it can take focus or be read while it is off screen, and it does not blink
 * out before it has finished moving. `prefers-reduced-motion` turns the
 * movement off (`.cre-compass-rubi-slot` in `tokens.css`).
 *
 * Colours are `--color-compass-rubi-*` in `tokens.css`.
 */
/** Slide duration and curve — ease-in-out cubic, so it starts and settles softly. */
const SLIDE_MS = 320
const SLIDE_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
export type CompassRubiMessage = { id: number; from: 'rubi' | 'learner' | 'note'; text: string }

export function CompassRubiRail({
  open,
  stickyTop,
  bottomInset = 0,
  greeting,
  suggestions,
  onClose,
}: {
  /** Slides in when true, out when false — the rail stays mounted. */
  open: boolean
  /** Pinned at this offset — the bottom edge of the player controls bar. */
  stickyTop: number
  /** Space to leave under the rail — the Demo stage's padding below the
   *  window, so a full-height rail is not shoved up at the end of the scroll. */
  bottomInset?: number
  greeting: string
  suggestions: readonly string[]
  onClose: () => void
}) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<CompassRubiMessage[]>([
    { id: 0, from: 'rubi', text: greeting },
  ])
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)

  /* THE ASK BOX IS PINNED TO THE BROWSER'S BOTTOM — 2026-09-24, the direct ask.
     A height fixed at `100vh - stickyTop` is only right once the rail is
     PINNED; before that (the Demo controls still above the window) the rail
     starts lower and ran past the viewport, taking the ask box with it. So the
     slot is measured: from its own top to the viewport's bottom, or its row's
     bottom if that comes first (the end of the page). The thread between the
     header and the ask box scrolls (`THREAD`'s `overflowY`). */
  const [fitHeight, setFitHeight] = useState<number | null>(null)
  useLayoutEffect(() => {
    const el = slotRef.current
    if (!el || typeof window === 'undefined') return
    let frame = 0
    const measure = () => {
      frame = 0
      const row = el.parentElement?.getBoundingClientRect()
      // No layout (jsdom measures everything as 0) → keep the calc fallback.
      if (!row || row.height === 0) return
      const top = el.getBoundingClientRect().top
      const rowBottom = row.bottom
      setFitHeight(Math.max(0, Math.min(window.innerHeight, rowBottom) - top))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setMessages((m) => [
      ...m,
      { id: m.length, from: 'learner', text },
      {
        id: m.length + 1,
        from: 'note',
        text: "Rubi isn't connected in this prototype yet, so there's no answer to show.",
      },
    ])
    setDraft('')
  }

  return (
    /* The SLOT is the flex column that animates its width and pins; the
       panel inside it slides. `overflow: hidden` crops the panel as it moves. */
    <div
      ref={slotRef}
      className="cre-compass-rubi-slot"
      aria-hidden={!open}
      inert={!open || undefined}
      style={{
        ...SLOT,
        top: stickyTop,
        // Measured (see `fitHeight`); the calc is the first paint and the
        // no-layout fallback (jsdom).
        height: fitHeight ?? `calc(100vh - ${stickyTop + bottomInset}px)`,
        width: open ? RAIL_WIDTH : 0,
        visibility: open ? 'visible' : 'hidden',
        transition: `width ${SLIDE_MS}ms ${SLIDE_EASE}, visibility 0s linear ${open ? 0 : SLIDE_MS}ms`,
      }}
    >
    <aside
      aria-label="Chat with Rubi"
      className="cre-compass-rubi"
      style={{
        ...RAIL,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: `transform ${SLIDE_MS}ms ${SLIDE_EASE}`,
      }}
    >
      <header style={HEADER}>
        <span aria-hidden style={MARK}>
          <RubiLogo size={26} aria-hidden />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={TITLE}>Rubi</span>
          <span style={SUBTITLE}>here to help</span>
        </span>
        <button
          type="button"
          className="cre-compass-rubi-close"
          onClick={onClose}
          aria-label="Close Rubi"
          style={CLOSE}
        >
          <XmarkRegular size={14} aria-hidden />
        </button>
      </header>

      <div
        ref={threadRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation with Rubi"
        style={THREAD}
      >
        {messages.map((m) =>
          m.from === 'rubi' ? (
            <div key={m.id}>
              <p style={SPEAKER}>Rubi</p>
              <p style={MESSAGE}>{m.text}</p>
            </div>
          ) : m.from === 'learner' ? (
            <div key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
              <p style={{ ...SPEAKER, color: 'var(--color-compass-rubi-muted)', textAlign: 'right' }}>You</p>
              <p style={LEARNER_BUBBLE}>{m.text}</p>
            </div>
          ) : (
            <p key={m.id} style={NOTE}>
              {m.text}
            </p>
          ),
        )}
      </div>

      <form onSubmit={send} style={COMPOSER}>
        <div role="group" aria-label="Suggestions" style={CHIPS}>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="cre-compass-rubi-chip"
              onClick={() => {
                setDraft(s)
                inputRef.current?.focus()
              }}
              style={CHIP}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="cre-compass-rubi-field" style={FIELD}>
          <label htmlFor={inputId} className="cre-visually-hidden">
            Ask Rubi
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask Rubi about this…"
            autoComplete="off"
            style={INPUT}
          />
          <button
            type="submit"
            className="cre-compass-rubi-send"
            aria-label="Send"
            disabled={!draft.trim()}
            style={SEND}
          >
            <PaperPlaneTopSolid size={14} aria-hidden />
          </button>
        </div>
      </form>
    </aside>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const BODY = 'var(--font-body)'

const RAIL_WIDTH = 380
/* The pinned, width-animating column. The panel inside keeps its full width
   the whole time, so its text never reflows mid-slide. */
const SLOT: CSSProperties = {
  position: 'sticky',
  flex: 'none',
  alignSelf: 'flex-start',
  overflow: 'hidden',
}
const RAIL: CSSProperties = {
  width: RAIL_WIDTH,
  height: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-compass-rubi-surface)',
  // The course TOC rail's own rule (`--color-compass-rail-rule`), so the two
  // rails framing the lesson draw the same edge — 2026-09-24, the direct ask.
  // `--color-compass-rubi-edge` stays on Rubi's chips and field.
  borderLeft: '1px solid var(--color-compass-rail-rule)',
}
/* 78.25px, the design's, with the mark 16 in and close 16 from the right. */
const HEADER: CSSProperties = {
  flex: 'none',
  height: 78.25,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 16px',
  borderBottom: '1px solid var(--color-compass-rubi-rule)',
}
const MARK: CSSProperties = { display: 'inline-flex', color: 'var(--color-compass-rubi-brand)' }
const TITLE: CSSProperties = {
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: '22.5px',
  letterSpacing: '0.04em',
  color: 'var(--color-compass-rubi-brand)',
}
const SUBTITLE: CSSProperties = {
  fontFamily: BODY,
  fontSize: 10.5,
  lineHeight: '15.75px',
  color: 'var(--color-compass-rubi-muted)',
}
/* Colours in `.cre-compass-rubi-close`. */
const CLOSE: CSSProperties = {
  flex: 'none',
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  borderRadius: 9,
  borderWidth: 1,
  borderStyle: 'solid',
  cursor: 'pointer',
}
const THREAD: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '14px 16px',
}
const SPEAKER: CSSProperties = {
  margin: 0,
  fontFamily: BODY,
  fontWeight: 700,
  fontSize: 10,
  lineHeight: '15px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-rubi-brand)',
}
const MESSAGE: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: BODY,
  fontSize: 13,
  lineHeight: '19.5px',
  color: 'var(--color-compass-rubi-text)',
}
const LEARNER_BUBBLE: CSSProperties = {
  ...MESSAGE,
  padding: '8px 12px',
  borderRadius: 11,
  background: 'var(--color-compass-rubi-bubble)',
}
const NOTE: CSSProperties = {
  margin: 0,
  fontFamily: BODY,
  fontSize: 12,
  lineHeight: '18px',
  fontStyle: 'italic',
  color: 'var(--color-compass-rubi-muted)',
}
const COMPOSER: CSSProperties = {
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
  padding: '12px 13px 11px',
  borderTop: '1px solid var(--color-compass-rubi-rule)',
}
const CHIPS: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6 }
/* Colours in `.cre-compass-rubi-chip`. */
const CHIP: CSSProperties = {
  height: 22.5,
  padding: '0 11px',
  borderRadius: 99,
  borderWidth: 1,
  borderStyle: 'solid',
  cursor: 'pointer',
  fontFamily: BODY,
  fontWeight: 500,
  fontSize: 10.5,
}
const FIELD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 46,
  boxSizing: 'border-box',
  padding: '0 9px 0 12px',
  borderRadius: 11,
  border: '1px solid var(--color-compass-rubi-edge)',
  background: 'var(--color-compass-rubi-surface)',
}
const INPUT: CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: BODY,
  fontSize: 13,
  color: 'var(--color-compass-rubi-text)',
}
/* Colours in `.cre-compass-rubi-send`. */
const SEND: CSSProperties = {
  flex: 'none',
  width: 28,
  height: 28,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}
