import type { CSSProperties } from 'react'
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
            list={listId}
            autoComplete="off"
            placeholder="Start typing your state…"
            value={state}
            onChange={(e) => onState(e.target.value)}
            style={INPUT}
          />
          <svg aria-hidden viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={SEARCH_ICON}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </div>
        <datalist id={listId}>
          {INVITE_STATES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <fieldset style={FIELD}>
        <legend style={{ ...LABEL, marginBottom: 6 }}>
          {loaLabel}
          <span aria-hidden>*</span>
          <span className="cre-e2e-loa-info" role="button" tabIndex={0} aria-label="What is a line of authority?" style={INFO}>
            <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span className="cre-e2e-loa-tip" role="tooltip">
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

const SEARCH_ICON: CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--color-neutral-400)',
  pointerEvents: 'none',
}

const INFO: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  color: 'var(--color-text-secondary)',
  cursor: 'help',
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
