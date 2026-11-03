import type { CSSProperties } from 'react'
import { CircleCheckSolid, CircleRegular } from '@/icons'
import {
  INVITE_PASSWORD_HEADING_V3,
  INVITE_PASSWORD_RULES_V3,
  passwordStrengthV3,
} from '@/data/invitePasswordRulesV3'

/**
 * V3'S "PASSWORD MUST:" BLOCK — a strength meter, then the seven rules ticking
 * as they are met (2026-11-03, Afsana, from the XCEL account form).
 *
 * ⚠ A SIBLING OF `InvitePasswordChecklist`, NOT A PROP ON IT. That one is
 * V1's and V2's and nests its classes under a three-of-four rule; this list is
 * flat and every row is required, so there is no "not needed" state to draw.
 *
 * Icon, colour AND a spelled-out state for assistive tech, as the V1/V2 list:
 * neither signal is load-bearing alone. It reads the password, never keeps it.
 */
export function InvitePasswordChecklistV3({
  password,
  username,
  style,
}: {
  password: string
  /** The learner's email — what "be different from username" compares against. */
  username: string
  style?: CSSProperties
}) {
  const strength = passwordStrengthV3(password)
  const tone = TONES[strength.score]
  return (
    <div style={{ ...BLOCK, ...style }}>
      <div style={METER_ROW}>
        <div
          role="meter"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={strength.score}
          aria-valuetext={strength.label || 'No password yet'}
          style={TRACK}
        >
          <div style={{ ...FILL, width: `${strength.score * 25}%`, background: tone }} />
        </div>
        <span aria-hidden style={{ ...METER_LABEL, color: tone }}>
          {strength.label}
        </span>
      </div>
      <p style={HEADING}>{INVITE_PASSWORD_HEADING_V3}</p>
      <ul style={LIST}>
        {INVITE_PASSWORD_RULES_V3.map((rule) => {
          const met = rule.test(password, username)
          return (
            <li key={rule.id} style={{ ...ROW, color: met ? MET : PENDING }}>
              <span aria-hidden style={GLYPH}>
                {met ? <CircleCheckSolid size={14} /> : <CircleRegular size={13} />}
              </span>
              <span>
                {rule.label}
                <span className="cre-sr-only">{met ? ' — met' : ' — not yet met'}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const MET = 'var(--color-success-700)'
const PENDING = 'var(--color-text-secondary)'

/* Empty, Weak, Fair, Good, Strong. */
const TONES = [
  'var(--color-neutral-200)',
  'var(--color-error-600)',
  'var(--color-warning-600)',
  'var(--color-success-700)',
  'var(--color-success-700)',
] as const

const BLOCK: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '20px',
  color: PENDING,
}

const METER_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2 }

const TRACK: CSSProperties = {
  flex: '1 0 0',
  height: 6,
  borderRadius: 3,
  background: 'var(--color-neutral-200)',
  overflow: 'hidden',
}

const FILL: CSSProperties = { height: '100%', borderRadius: 3, transition: 'width 160ms ease' }

/* Fixed width, so the bar does not change length as the word does. */
const METER_LABEL: CSSProperties = { flex: 'none', width: 44, textAlign: 'right', fontSize: 13 }

const HEADING: CSSProperties = { margin: 0, color: 'var(--color-text-primary)' }

/* No markers — the circle is the marker. */
const LIST: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const ROW: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 8 }

/* Fixed width in both states, so a row ticking does not shove its label. */
const GLYPH: CSSProperties = {
  flex: 'none',
  width: 14,
  display: 'inline-flex',
  justifyContent: 'center',
  paddingTop: 3,
}
