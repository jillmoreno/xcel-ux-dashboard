import { useCallback, useState, type CSSProperties, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { SheetHeader, SHEET_BODY } from '@/components/ui/SheetHeader'
import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { RubiLogo } from '@/icons'

/**
 * ASK RUBI — the chat entry point at the far right of the Compass header
 * (2026-09-18, the direct ask: "Far right should have an Ask Rubi Chat
 * section").
 *
 * ── Why it is a pill here and a panel there ───────────────────────────────
 *
 * A tutor you consult in the middle of a lesson must not replace the lesson.
 * So the header carries the COMPOSER only — one line, the width of a search
 * field — and submitting opens a right-hand `Sheet` over the course rather
 * than navigating anywhere. The pane you were reading is still behind it, and
 * closing the sheet returns you to it with nothing lost.
 *
 * That is also why this does NOT reuse `RubiTutorWidget`, which is the same
 * product in a different shape: a full card with a medallion, a headline and
 * three suggested prompts, built for the classic dashboard's right rail. What
 * IS shared is the treatment its own doc names — a pill-shaped "Ask Rubi…"
 * input with a circular send button — and the two are deliberately the same
 * control at two sizes rather than two designs. It also routes to
 * `/account/tutoring`, a classic route outside this shell, which is precisely
 * the navigation this surface must not do.
 *
 * ── NO ANSWER IS INVENTED, and that is the whole design ───────────────────
 *
 * There is no Rubi behind this, and authoring a reply would be the move this
 * version has refused throughout — a fabricated tutor answer about New York
 * insurance law is worse than most invented copy, because a learner would act
 * on it. So the sheet shows two things: the learner's OWN question, which is
 * the one piece of real state here, and a lo-fi block where the answer will
 * live. Same honesty as the Compass placeholder it sits over.
 *
 * The question is echoed rather than dropped because a composer that clears
 * itself and shows nothing reads as a failed send.
 */
export function AskRubiChat() {
  const [value, setValue] = useState('')
  const [asked, setAsked] = useState<string | null>(null)

  /* `useCallback`, and it is load-bearing — `Sheet`'s focus effect is keyed on
     `[open, onClose]` and calls `dialogRef.focus()` when it runs, so a fresh
     closure each render pulls focus off whatever is being typed into. That is the
     trap the Links composer hit: it took exactly one character per field and
     dropped the rest, with a clean tsc and a modal that rendered perfectly. */
  const close = useCallback(() => setAsked(null), [])

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    setAsked(q)
    setValue('')
  }

  return (
    <>
      {/* `role="search"` rather than a bare form: this is the "find something
          out" control of the surface, which is what that role is for, and it
          gives the region a name assistive tech can jump to. */}
      <form onSubmit={onSubmit} role="search" aria-label="Ask Rubi" style={formStyle}>
        <span aria-hidden style={markStyle}>
          <RubiLogo size={15} />
        </span>
        {/* `.cre-ask-rubi-input` EXISTS FOR THE PLACEHOLDER, which measuring
            showed is not cosmetic here. The browser default renders it at
            **2.75:1** on this fill — and unlike the Links panel's known 4.34:1
            placeholders, which sit under visible labels, this field has no
            visible label at all: the placeholder IS what identifies the
            control, so it is carrying meaning on its own. `::placeholder`
            cannot be expressed inline, hence the class. */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask Rubi…"
          aria-label="Ask Rubi a question"
          className="cre-ask-rubi-input"
          style={inputStyle}
        />
        {/* DISABLED WITH TEXT, not hidden, and disabled while empty so the
            control says what it needs. An enabled send on an empty field is a
            button that does nothing on click. */}
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Send question to Rubi"
          className="cre-ask-rubi-send"
          style={sendStyle}
        >
          <SendArrow />
        </button>
      </form>

      <Sheet open={asked != null} onClose={close} title="Ask Rubi" width={440}>
        <SheetHeader title="Ask Rubi" onClose={close} />
        <div style={SHEET_BODY}>
          {/* The learner's own words, labelled as theirs. Nothing here claims
              to be Rubi. */}
          <p style={askedLabelStyle}>You asked</p>
          <blockquote style={askedStyle}>{asked}</blockquote>
          <div style={placeholderStyle}>
            <LoFiWidgetBody rows={4} ariaLabel="Rubi’s answer — placeholder" />
            <p style={placeholderTextStyle}>This is where Rubi’s answer will live.</p>
          </div>
        </div>
      </Sheet>
    </>
  )
}

/** The send glyph. `arrow-up`/`paper-plane` are not vendored and the rule is to
 *  vendor the file rather than hand-author a path — so this is the same
 *  three-segment arrow `RubiTutorWidget` already draws inline for this exact
 *  button, kept identical rather than becoming a second drawing of one mark. */
function SendArrow({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden style={{ display: 'block' }}>
      <path
        d="M8 12.5 V3.5 M8 3.5 L3.5 8 M8 3.5 L12.5 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ─── styles ──────────────────────────────────────────────────────────── */

/* 300px, and it FLEXES DOWN to 200 rather than wrapping the header: this is the
   secondary thing in that bar, so it gives width up before the back link and
   the section name do. */
const formStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: '0 1 300px',
  minWidth: 200,
  height: 38,
  padding: '0 4px 0 12px',
  borderRadius: 999,
  /* `--color-neutral-300`, NOT `--color-border-subtle`, and the QE page's own
     `cRule` / `cLine` distinction is why: subtle is a boundary on a CARD and
     measures 1.29:1 on this page grey, while this pill's white fill is 1.09:1
     against the same ground — so with the subtle border the field had no
     visible edge at all. `-300` is what this surface already uses for a line
     that is doing work (the progress-bar grooves, the KPI rules): 1.55:1
     against the page, 1.41:1 against the pill's own fill. */
  border: '1px solid var(--color-neutral-300)',
  background: 'var(--color-surface-card)',
}

const markStyle: CSSProperties = {
  display: 'inline-flex',
  flexShrink: 0,
  color: 'var(--color-primary-500)',
}

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
  outline: 'none',
}

/* THE FILL AND THE INK ARE BOTH THE CLASS'S, and that split is not tidiness —
   it is the defect measuring caught here. This style carried
   `color: var(--color-text-inverse)` while `.cre-ask-rubi-send:disabled` set
   the ink to tertiary, and an INLINE colour beats a stylesheet rule: the
   disabled glyph stayed white on the grey disc at **1.69:1**, with the rule
   matching, computing and doing nothing. The same trap as `.cre-uxlinks-title`
   and the Get Licensed PSI link, for the third time in this repo.
   
   So neither `color` nor `background` appears here. What is left is geometry.
   Navy fill and the 7.64:1 white ink live in `tokens.css`, beside the hover and
   disabled states neither of which an inline style can express. */
const sendStyle: CSSProperties = {
  flexShrink: 0,
  width: 30,
  height: 30,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: 'none',
}

const askedLabelStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const askedStyle: CSSProperties = {
  margin: '6px 0 18px',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
  overflowWrap: 'anywhere',
}

/* The launcher's own placeholder treatment, not a second one — the sheet opens
   over that block and a different empty surface inches away would read as two
   kinds of "not built". */
const placeholderStyle: CSSProperties = {
  minHeight: 220,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 20,
  padding: 28,
  borderRadius: 'var(--radius-lg)',
  background: 'color-mix(in srgb, var(--color-primary-500) 5%, var(--color-neutral-100))',
}

const placeholderTextStyle: CSSProperties = {
  margin: 0,
  maxWidth: 300,
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}
