/**
 * INVITE FLOW V3'S PASSWORD RULES — 2026-11-03, Afsana: "when a user has to
 * create their password, have it reflect the following requirements", from
 * the XCEL account form's own list, under "Password must:".
 *
 * ⚠ V3 ONLY. `invitePasswordRules.ts` is V1's and V2's (9–30 characters, three
 * of four classes) and is left as it is; V3 is the concept that tries the
 * stricter policy. Seven flat rules, every one required, no nesting.
 *
 * ⚠ THE TWO "NOTHING WRONG YET" RULES READ UNMET ON AN EMPTY FIELD. "Use only
 * the following special characters" and "be different from email" are
 * true of an empty string, and a list that starts with two green ticks before
 * anything is typed reads as half-done. They tick from the first character.
 *
 * ⚠ NOTHING HERE EVER SEES A STORED VALUE — the same property the V1/V2
 * module has. `test` is handed the live field contents and returns a boolean.
 */

export const INVITE_PASSWORD_HEADING_V3 = 'Password must:'

/** The symbols the form allows, as the list spells them out. */
export const INVITE_PASSWORD_SPECIALS_V3 = '!@#$%^&*._-'

export type InvitePasswordRuleV3 = {
  readonly id: string
  readonly label: string
  readonly test: (password: string, username: string) => boolean
}

const isSpecial = (c: string) => INVITE_PASSWORD_SPECIALS_V3.includes(c)
const isPlain = (c: string) => /[A-Za-z0-9]/.test(c)

export const INVITE_PASSWORD_RULES_V3: readonly InvitePasswordRuleV3[] = [
  { id: 'length', label: 'be 9-15 characters', test: (p) => p.length >= 9 && p.length <= 15 },
  { id: 'number', label: 'have at least one number', test: (p) => /[0-9]/.test(p) },
  { id: 'upper', label: 'have at least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'have at least one lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'special', label: 'have at least one special character', test: (p) => [...p].some(isSpecial) },
  {
    id: 'allowed',
    label: `use only the following special characters ${INVITE_PASSWORD_SPECIALS_V3}`,
    test: (p) => p.length > 0 && [...p].every((c) => isPlain(c) || isSpecial(c)),
  },
  {
    id: 'username',
    /* "email", not "username" — the email is the username here (2026-11-04, Afsana). */
    label: 'be different from email',
    test: (p, u) => p.length > 0 && p.toLowerCase() !== u.trim().toLowerCase(),
  },
]

export function meetsInvitePasswordRulesV3(password: string, username: string): boolean {
  return INVITE_PASSWORD_RULES_V3.every((rule) => rule.test(password, username))
}

export type PasswordStrengthV3 = { readonly score: 0 | 1 | 2 | 3 | 4; readonly label: string }

/**
 * THE METER ABOVE THE LIST. A demo heuristic, not an entropy estimate: how
 * many of the four character classes are in, plus a step for length. Nothing
 * gates on it — the rules do — so it only has to move in the right direction
 * as the learner types. Empty is score 0 with no label; the bar is drawn
 * empty and says nothing.
 */
export function passwordStrengthV3(password: string): PasswordStrengthV3 {
  if (!password) return { score: 0, label: '' }
  const classes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length
  const raw = classes + (password.length >= 9 ? 1 : 0) + (password.length >= 12 ? 1 : 0)
  if (raw <= 2) return { score: 1, label: 'Weak' }
  if (raw <= 3) return { score: 2, label: 'Fair' }
  if (raw <= 5) return { score: 3, label: 'Good' }
  return { score: 4, label: 'Strong' }
}
