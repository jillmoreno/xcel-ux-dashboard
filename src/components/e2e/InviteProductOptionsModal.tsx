import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import {
  INVITE_LINES_OF_AUTHORITY,
  matchingStates,
  type InviteLineOfAuthority,
  type InviteProductChoice,
  type InviteState,
} from '@/data/inviteMissingDetails'

/**
 * "WHAT ARE YOU LICENSING FOR?" — 2026-10-22, Jillienne's brief. The modal the
 * invite door opens when the recruiter left the state and line of authority
 * blank, so the page does not know which product to show.
 *
 * Built on `AffidavitModal`'s construction — portalled to `<body>`, a fixed
 * scrim, `role="dialog"` with `aria-modal`, Escape to close — so the flow has
 * one modal idiom rather than two.
 *
 * ⚠ NO ✕ AND NO CANCEL, which is the one place it deliberately differs from
 * the affidavit. That modal interrupts a page that is already complete, so
 * dismissing it leaves something sensible behind. This one is asked BECAUSE
 * the page behind it cannot be drawn: closing it without an answer would
 * return the learner to a product detail page with no product on it. Escape
 * still closes — never trap a keyboard user in a dialog — and the page behind
 * handles that by showing what it actually knows (see
 * `InvitedProductDetailPageV2`), with a way to reopen this.
 *
 * ⚠ THE TWO PICKS ARE INDEPENDENT AND BOTH REQUIRED. No cross-filtering: every
 * line of authority is offered in every state. That is true enough of the real
 * catalog to be safe for a prototype, and the alternative — a dependent pair
 * like the Recommended for You filters — would need a real availability matrix
 * to be anything other than invented.
 */
export function InviteProductOptionsModal({
  onChoose,
  onDismiss,
  reason,
}: {
  /** Both halves picked — the flow writes them to the address and carries on. */
  onChoose: (choice: InviteProductChoice) => void
  /** Escape. See the note above: the page behind takes over, it does not
   *  pretend a choice was made. */
  onDismiss: () => void
  /**
   * WHY the question is being asked — 2026-10-22, with the four invite flows.
   *
   * ⚠ THERE IS NOT ALWAYS AN INVITATION. The sentence was "Your invitation
   * didn't include these details", which is true when a recruiter left the
   * fields blank and false the moment a reviewer picks QR / social: a poster's
   * code had no invitation to leave anything out of. Naming a document the
   * learner never received is the same class of mistake as the welcome banner
   * claiming an invitation that was never sent.
   */
  reason: 'invitation-incomplete' | 'broadcast-link'
}) {
  const [state, setState] = useState<InviteState | null>(null)
  const [lineOfAuthority, setLineOfAuthority] = useState<InviteLineOfAuthority | null>(null)
  const ready = state != null && lineOfAuthority != null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return createPortal(
    <div style={SCRIM}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-options-title"
        aria-describedby="invite-options-why"
        style={MODAL}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 id="invite-options-title" style={TITLE}>
            What are you licensing for?
          </h2>
          {/* ⚠ IT SAYS WHY IT IS ASKING. The learner clicked a link in an
              invitation their employer sent and has landed on a question —
              without a reason, that reads as a form appearing for no cause.
              The blame is deliberately not laid on the recruiter: the learner
              cannot act on that, and it is the first thing they would see of
              their new employer. */}
          <p id="invite-options-why" style={TEXT}>
            {reason === 'invitation-incomplete'
              ? 'Your invitation didn’t include these details, so we can’t tell which course to show you yet.'
              : 'This link is shared with everyone, so we don’t know where you’re licensing or what for.'}{' '}
            Pick your state and line of authority and we’ll bring up the right one.
          </p>
        </div>

        <StateSearch value={state} onChange={setState} />

        <fieldset style={FIELDSET}>
          <legend style={LEGEND}>Line of authority</legend>
          <div style={OPTION_ROW}>
            {INVITE_LINES_OF_AUTHORITY.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={lineOfAuthority === option}
                onClick={() => setLineOfAuthority(option)}
                style={lineOfAuthority === option ? OPTION_ON : OPTION}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <div style={ACTIONS}>
          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              if (state && lineOfAuthority) onChoose({ state, lineOfAuthority })
            }}
            style={ready ? CONTINUE_ON : CONTINUE}
          >
            Show my course
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * THE STATE FIELD — 2026-10-22, Jillienne: "make the state a type ahead search
 * field that will narrow down the states, we dont want to have to show 50 pills
 * in a modal".
 *
 * It was five pills. Pills are right for three lines of authority and wrong for
 * fifty states, and the fix is not a shorter list — it is a control that makes
 * fifty cost no more to show than five. See `INVITE_STATES`.
 *
 * ⚠ THE ARIA 1.2 COMBOBOX PATTERN, not a text input with a div under it. The
 * input carries `role="combobox"`, `aria-expanded` and `aria-controls`; the
 * list is a `listbox` of `option`s; and the active row is pointed at by
 * `aria-activedescendant` rather than focused — focus stays in the input so
 * typing never stops working. Without that last part a screen-reader user hears
 * nothing as they arrow through, which is the failure that makes a home-made
 * typeahead unusable rather than merely imperfect.
 *
 * ⚠ THE LIST IS IN FLOW, NOT ABSOLUTELY POSITIONED. The modal scrolls
 * (`overflowY: auto`), and an absolutely-positioned dropdown inside a scrolling
 * box is clipped by it — the classic version of this bug, where the list looks
 * right until the viewport is short. In flow it pushes the rest of the modal
 * down and scrolls with everything else, at the cost of the content below
 * moving while you type. That trade is worth taking for a control that cannot
 * be silently broken by a window size.
 *
 * ⚠ ESCAPE CLOSES THE LIST BEFORE THE MODAL. Both listen for it, so the inner
 * one stops propagation while it is open — a learner pressing Escape to dismiss
 * an open list does not expect the whole dialog to go with it.
 */
function StateSearch({
  value,
  onChange,
}: {
  value: InviteState | null
  onChange: (state: InviteState | null) => void
}) {
  const id = useId()
  const listId = `${id}-states`
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const blurTimer = useRef<number | undefined>(undefined)

  const matches = useMemo(() => matchingStates(query), [query])
  /* Clamped on every render rather than only when the query changes: the list
     shrinks as you type, and an index left pointing past the end would make
     Enter select nothing. */
  const active = matches.length === 0 ? -1 : Math.min(activeIndex, matches.length - 1)

  const choose = (state: string) => {
    onChange(state)
    setQuery(state)
    setOpen(false)
  }

  useEffect(() => () => window.clearTimeout(blurTimer.current), [])

  return (
    <div style={FIELDSET}>
      <label htmlFor={id} style={LEGEND}>
        State
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder="Start typing your state…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(0)
            setOpen(true)
            /* ⚠ TYPING CLEARS THE PICK. The field would otherwise still hold
               "Texas" while reading "Tex" — and the CTA would stay enabled on a
               state the learner is in the middle of changing. */
            if (value != null) onChange(null)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            /* A click on an option blurs the input before the option's own
               handler runs, so closing is deferred by a tick. */
            blurTimer.current = window.setTimeout(() => setOpen(false), 120)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setActiveIndex((i) => (matches.length === 0 ? 0 : (Math.min(i, matches.length - 1) + 1) % matches.length))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setOpen(true)
              setActiveIndex((i) =>
                matches.length === 0 ? 0 : (Math.min(i, matches.length - 1) + matches.length - 1) % matches.length,
              )
            } else if (e.key === 'Enter') {
              if (open && active >= 0) {
                /* Not a submit — the modal's CTA is a separate button, and
                   Enter here means "take the highlighted state". */
                e.preventDefault()
                choose(matches[active])
              }
            } else if (e.key === 'Escape' && open) {
              /* See the note above: the list goes, the dialog stays. */
              e.stopPropagation()
              setOpen(false)
            }
          }}
          style={SEARCH_INPUT}
        />
      </div>
      {open ? (
        matches.length > 0 ? (
          <ul id={listId} role="listbox" aria-label="States" style={LISTBOX}>
            {matches.map((option, i) => (
              <li
                key={option}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={value === option}
                /* `onMouseDown` rather than `onClick`: mousedown runs before
                   the input's blur, so the pick lands even though the blur
                   handler is racing it. */
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(option)
                }}
                onMouseEnter={() => setActiveIndex(i)}
                style={i === active ? OPTION_ROW_ACTIVE : OPTION_ROW_ITEM}
              >
                {option}
              </li>
            ))}
          </ul>
        ) : (
          /* ⚠ `role="status"`, so a screen-reader user is told the list went
             empty. Silence here reads as the control having stopped working. */
          <p role="status" style={NO_MATCH}>
            No states match “{query.trim()}”.
          </p>
        )
      ) : null}
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const SCRIM: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--color-e2e-scrim)',
}

const MODAL: CSSProperties = {
  position: 'relative',
  width: 480,
  maxWidth: '100%',
  maxHeight: '100%',
  overflowY: 'auto',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: 40,
  borderRadius: 16,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-fixed-light)',
  filter: 'drop-shadow(0 4px 6px var(--color-e2e-form-shadow))',
}

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 24,
  lineHeight: '32px',
  color: 'var(--color-text-primary)',
}

const TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-neutral-950)',
}

const FIELDSET: CSSProperties = {
  margin: 0,
  padding: 0,
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const LEGEND: CSSProperties = {
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const OPTION_ROW: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }

const OPTION: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

/* Selected: the demo's brick, as the flow's other primary marks. */
const OPTION_ON: CSSProperties = {
  ...OPTION,
  border: '1px solid var(--color-xcel-brick-600)',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
}

/* ── The state search (2026-10-22) ── */

const SEARCH_INPUT: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  height: 40,
  padding: '0 12px',
  borderRadius: 6,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '38px',
  color: 'var(--color-text-primary)',
}

const LISTBOX: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 4,
  /* Eight-ish rows, then it scrolls — enough to browse without the modal
     becoming a page. */
  maxHeight: 220,
  overflowY: 'auto',
  borderRadius: 6,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-fixed-light)',
}

const OPTION_ROW_ITEM: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

/* The keyboard's position in the list. Deliberately NOT the same mark as a
   chosen line of authority — this one says "Enter would take this", not
   "this is picked". */
const OPTION_ROW_ACTIVE: CSSProperties = {
  ...OPTION_ROW_ITEM,
  background: 'var(--color-e2e-form-locked)',
  fontWeight: 700,
}

const NO_MATCH: CSSProperties = {
  margin: 0,
  padding: '8px 2px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const ACTIONS: CSSProperties = { display: 'flex', justifyContent: 'flex-end' }

const CONTINUE: CSSProperties = {
  padding: '11px 22px',
  borderRadius: 6,
  border: 'none',
  background: 'var(--color-e2e-form-locked)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: '13px',
  color: 'var(--color-text-secondary)',
  cursor: 'not-allowed',
}

const CONTINUE_ON: CSSProperties = {
  ...CONTINUE,
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  cursor: 'pointer',
}
