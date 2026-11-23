import { useState, type CSSProperties } from 'react'
import { CircleInfo } from '@/icons'
import { FINDER_LINES_OF_AUTHORITY, type FinderLineOfAuthority } from '@/data/xcelCourseFinder'
import { INVITE_STATES } from '@/data/inviteMissingDetails'

/**
 * STATE AND LINE OF AUTHORITY, AS PLAIN FIELDS — Invite Flow V3, 2026-10-30,
 * from Afsana's `xcel-b2b2c-email-flow.html` (screen `variation-4`).
 *
 * The same two fields on two screens: the B2B flows' step 2, "Select your
 * state and line of authority", and the product page's "Change your course"
 * dialog. One component so the two cannot drift. The labels are the only
 * difference, and the caller passes them.
 *
 * ⚠ FIVE LINES OF AUTHORITY, NOT SIX. The file offers the public site's five
 * (`FINDER_LINES_OF_AUTHORITY`); the V1/V2 options modal also offers
 * Securities. Every one of the five is a valid `InviteLineOfAuthority`, so
 * `readInviteChoice` accepts the pick unchanged.
 *
 * ⚠ THE STATE LIST IS OURS, NOT A `<datalist>` — 2026-11-18, Afsana: the
 * dropdown "appears out of place". A datalist's popup is drawn by the
 * browser, which decides where it goes, and in the Hub's frame it opened
 * beside the field instead of under it. This list is drawn under the field,
 * as wide as it, filtered by what is typed; arrows, Enter and Escape work.
 */

export function CourseChoiceFields({
  idPrefix,
  stateLabel,
  loaLabel,
  state,
  onState,
  loa,
  onLoa,
}: {
  idPrefix: string
  stateLabel: string
  loaLabel: string
  state: string
  onState: (value: string) => void
  loa: FinderLineOfAuthority | null
  onLoa: (value: FinderLineOfAuthority) => void
}) {
  const stateId = `${idPrefix}-state`
  const listId = `${idPrefix}-states`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const typed = state.trim().toLowerCase()
  /* Everything until something is typed, and everything again once a whole
     state is — so picking a second time still shows the list. */
  const exact = INVITE_STATES.some((s) => s.toLowerCase() === typed)
  const options = typed && !exact ? INVITE_STATES.filter((s) => s.toLowerCase().includes(typed)) : INVITE_STATES
  const showing = open && options.length > 0
  const pick = (value: string) => {
    onState(value)
    setOpen(false)
    setActive(-1)
  }
  return (
    <>
      <div style={FIELD}>
        <label htmlFor={stateId} style={LABEL}>
          {stateLabel}
          <span aria-hidden>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id={stateId}
            type="text"
            role="combobox"
            aria-expanded={showing}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            placeholder="Select State"
            value={state}
            onChange={(e) => {
              onState(e.target.value)
              setOpen(true)
              setActive(-1)
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault()
                setOpen(true)
                const step = e.key === 'ArrowDown' ? 1 : -1
                setActive((i) => (i + step + options.length) % options.length)
              } else if (e.key === 'Enter' && showing && active >= 0) {
                e.preventDefault()
                pick(options[active])
              } else if (e.key === 'Escape' && showing) {
                /* Close the list, not the dialog it may sit in. */
                e.stopPropagation()
                setOpen(false)
              }
            }}
            className="cre-e2e-typeahead"
            style={INPUT}
          />
          <svg aria-hidden viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={SEARCH_ICON}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          {showing ? (
            <ul id={listId} role="listbox" aria-label={stateLabel} style={LIST}>
              {options.map((s, i) => (
                <li
                  key={s}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={s === state}
                  /* mousedown, not click: a click lands after the field's
                     blur has already closed the list. */
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(s)
                  }}
                  onMouseEnter={() => setActive(i)}
                  style={i === active ? OPTION_ACTIVE : s === state ? OPTION_PICKED : OPTION}
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <fieldset style={FIELD}>
        <legend style={{ ...LABEL, marginBottom: 6 }}>
          {loaLabel}
          <span aria-hidden>*</span>
          {/* The shared V3 tooltip (2026-11-23, Afsana) — see
              `.cre-xcel-help` in inviteFlow.css. */}
          <span
            className="cre-xcel-help cre-e2e-loa-info"
            role="button"
            tabIndex={0}
            aria-label="What is a line of authority?"
          >
            <CircleInfo size={16} aria-hidden />
            <span className="cre-xcel-tip cre-e2e-loa-tip" role="tooltip">
              Your line of authority is the type of insurance your license will let you sell.
            </span>
          </span>
        </legend>
        <div role="radiogroup" aria-label={loaLabel} style={PILLS}>
          {FINDER_LINES_OF_AUTHORITY.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={loa === option}
              onClick={() => onLoa(option)}
              style={loa === option ? PILL_ON : PILL}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  )
}

/* ── Styles — the file's, token for token ───────────────────────────────── */

const FIELD: CSSProperties = {
  margin: 0,
  padding: 0,
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
}

const LABEL: CSSProperties = {
  padding: 0,
  margin: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
}

const INPUT: CSSProperties = {
  boxSizing: 'border-box',
  display: 'block',
  width: '100%',
  height: 38,
  padding: '0 36px 0 10px',
  borderRadius: 4,
  background: 'var(--color-e2e-field)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-e2e-card-outline)',
}

const LIST: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  zIndex: 10,
  margin: 0,
  padding: '4px 0',
  listStyle: 'none',
  maxHeight: 240,
  overflowY: 'auto',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 4,
  boxShadow: 'var(--shadow-popover)',
}

const OPTION: CSSProperties = {
  padding: '8px 10px',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const OPTION_ACTIVE: CSSProperties = { ...OPTION, background: 'var(--color-neutral-100)' }

const OPTION_PICKED: CSSProperties = { ...OPTION, fontWeight: 800 }

const SEARCH_ICON: CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--color-neutral-400)',
  pointerEvents: 'none',
}

const PILLS: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }

const PILL: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 600,
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

/* `#00539a` is the file's own selected blue; no token carries it yet. */
const PILL_ON: CSSProperties = {
  ...PILL,
  border: '1px solid #00539a',
  background: '#00539a',
  color: 'var(--color-fixed-light)',
}
