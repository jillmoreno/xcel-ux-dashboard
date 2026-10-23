import type { CSSProperties, ReactNode } from 'react'
import { CircleCheckSolid, CircleRegular } from '@/icons'
import {
  INVITE_PASSWORD_HEADING,
  INVITE_PASSWORD_RULES,
  type InvitePasswordRule,
} from '@/data/invitePasswordRules'

/**
 * THE PASSWORD REQUIREMENTS, TICKING AS THEY ARE MET — 2026-10-22, Jillienne:
 * "as user types in, those requirements should show a validation and then the
 * confirm button will be active".
 *
 * ⚠ ONE COMPONENT FOR THE TWO PLACES THE FLOW SETS A PASSWORD. Confirmation &
 * Password sets one on the invited arms, the split confirmation sets one on
 * the guest arm, and `invitePasswordRules.ts` has kept their COPY in step
 * since the day it was extracted. Once the list grew nested rows, live ticks
 * and a gate, copy alone stopped being enough to keep them the same thing:
 * two hand-written checklists drift in behaviour, not just in wording, and a
 * learner who met three classes on one arm and two on the other would have
 * found a product that disagrees with itself about its own password policy.
 *
 * ⚠ IT TAKES ITS TYPOGRAPHY FROM THE PAGE, which is the one thing the two
 * genuinely do differ on: the invited arm is the design's Open Sans 13/18, the
 * guest arm a quieter 11px block in the form's own register. The STRUCTURE and
 * the RULES are shared; the voice stays local.
 *
 * ⚠ THREE ROW STATES, NOT TWO (2026-10-22: "then the 4th of the 3 of 4
 * requirements can show disabled in the list"). Met, still needed, and NO
 * LONGER NEEDED — the fourth character class once three are in, which is a
 * rule the learner has not satisfied and no longer has to. Drawn as an
 * outstanding task it would read as something still owed on a form that is
 * ready to submit, which is the moment a checklist starts contradicting its
 * own button.
 *
 * ⚠ IT READS, NEVER WRITES. The password is a prop and nothing here stores,
 * hashes or logs it — the same property the rules module has.
 */
export function InvitePasswordChecklist({
  password,
  style,
  headingStyle,
  listStyle,
  sublistStyle,
  glyph = 11,
}: {
  password: string
  /** The block's own typography — font, size, colour. */
  style?: CSSProperties
  headingStyle?: CSSProperties
  listStyle?: CSSProperties
  sublistStyle?: CSSProperties
  /** Tick size; the hollow mark is drawn a little smaller to match its weight. */
  glyph?: number
}) {
  return (
    <div style={{ ...BLOCK, ...style }}>
      <p style={{ margin: 0, ...headingStyle }}>{INVITE_PASSWORD_HEADING}</p>
      <ul style={{ ...LIST, ...listStyle }}>
        {INVITE_PASSWORD_RULES.map((rule) => (
          <RuleRow key={rule.id} rule={rule} password={password} glyph={glyph}>
            {rule.sub ? (
              <ul style={{ ...LIST, ...SUBLIST, ...sublistStyle }}>
                {rule.sub.map((c) => (
                  <RuleRow
                    key={c.id}
                    rule={c}
                    password={password}
                    glyph={glyph}
                    /* ⚠ THE PARENT DECIDES, not the row. A class row cannot
                       know on its own that it has stopped mattering — only the
                       rule counting the classes knows whether its quota is
                       filled. */
                    moot={rule.test(password)}
                  />
                ))}
              </ul>
            ) : null}
          </RuleRow>
        ))}
      </ul>
    </div>
  )
}

/**
 * ONE REQUIREMENT, AND WHETHER IT IS MET YET.
 *
 * ⚠ THREE SIGNALS, NOT ONE. The icon, the colour AND a spelled-out state for
 * assistive tech — the same trio the dashboard's Update Password checklist
 * uses, and for the same reason: colour alone fails anyone who cannot separate
 * the two tones, and an icon alone is silent to a screen reader. That holds
 * for the dimmed state too: "not needed" is a word, not just a lighter grey.
 */
function RuleRow({
  rule,
  password,
  glyph,
  moot = false,
  children,
}: {
  rule: InvitePasswordRule
  password: string
  glyph: number
  /** Unmet, but the rule above it is satisfied without this one. */
  moot?: boolean
  children?: ReactNode
}) {
  const met = rule.test(password)
  const spare = !met && moot
  return (
    <li style={{ ...ROW, color: met ? MET : spare ? SPARE : PENDING }}>
      <span style={LINE}>
        <span aria-hidden style={{ ...GLYPH, width: glyph }}>
          {/* ⚠ THE SAME CIRCLE, FILLED IN — 2026-10-22: "when passwords are
              validated - use the circle checkmark icon", then "solid circle
              checkmark icons". A bare tick beside a hollow ring was two
              different marks; a ring that gains a check is one mark
              completing, which is what the row is actually saying — and solid
              is what carries that at 11px, where an outlined check inside an
              outlined circle is three hairlines fighting for the same pixel. */}
          {met ? (
            <CircleCheckSolid size={glyph} />
          ) : (
            <CircleRegular size={Math.round(glyph * 0.72)} />
          )}
        </span>
        <span>
          {rule.label}
          <span className="cre-sr-only">
            {met ? ' — met' : spare ? ' — not needed' : ' — not yet met'}
          </span>
        </span>
      </span>
      {children}
    </li>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const MET = 'var(--color-success-700)'
const PENDING = 'var(--color-text-secondary)'

/* ⚠ QUIETER THAN PENDING, NOT GREEN. The row is neither done nor owed, so it
   takes neither colour — it steps back far enough to read as switched off,
   while staying legible for anyone who wants to see what they skipped.

   ⚠ NOT `--color-text-tertiary`. That is #737373 against pending's #666666 —
   a step small enough to read as the same grey at 11px, which would have made
   the state invisible to the only people it is for. */
const SPARE = 'var(--color-neutral-500)'

const BLOCK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

/* ⚠ NO MARKERS — THE TICK IS THE MARKER. A disc beside a tick is two bullets
   on one row, and the one that moves is the one worth looking at. */
const LIST: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

/* ⚠ INDENTED TO THE PARENT'S LABEL, not to its tick. The four classes hang off
   the rule that counts them, and lining them up under its words is what shows
   that. */
const SUBLIST: CSSProperties = { marginTop: 3, paddingLeft: 17 }

const ROW: CSSProperties = { display: 'flex', flexDirection: 'column' }

const LINE: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 6 }

/* Fixed width in both states, so a row ticking does not shove its label. */
const GLYPH: CSSProperties = {
  flex: 'none',
  display: 'inline-flex',
  justifyContent: 'center',
  paddingTop: 4,
}
