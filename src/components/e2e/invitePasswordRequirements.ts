/**
 * The Invite flow's Create Password checklist — the rules, and nothing else.
 *
 * A PURE MODULE on purpose, the same shape as the Profile panel's
 * `passwordRequirements.ts`: the page renders these and the Confirm button
 * gates on them, so the two cannot disagree about what "valid" means, and a
 * rule can be tested without mounting a page, typing into a field and reading
 * a colour back off an icon.
 *
 * ⚠ SEPARATE FROM `passwordRequirements.ts` ON PURPOSE, not by oversight. The
 * two forms enforce DIFFERENT policies and sharing a module would silently
 * change one of them:
 *
 *   | | Profile's Update Password | Invite's Create Password (here) |
 *   | length | 9–15 | 9–30 |
 *   | types  | all four required | at least three of the four |
 *   | specials | only !@#$%^&*.-_ | the wider set the page's copy lists |
 *   | extra | must differ from the current one | no current password exists |
 *
 * Wire validation TO THE WORDS ALREADY ON THE PAGE (Figma 425:3001) — the
 * labels below are the page's own copy, not a fresh rewrite of it.
 *
 * ⚠ NOTHING HERE EVER SEES A STORED VALUE. `test` is handed the live field
 * contents and returns a boolean; no rule keeps, hashes or logs what it read.
 * That is the whole reason this page can hand itself a TEST password without
 * anything anywhere holding one.
 */

/** The specials the page's copy enumerates. A SPACE IS NOT ONE OF THEM — the
 *  gaps in the printed list are reading room, and the length rule below
 *  excludes whitespace outright. */
export const ALLOWED_SPECIALS = '!@#$%^&*_+=`|(){}[]:">,.?'

/* Escaped for use inside a character class: `[` and `]` are escaped, `^` is
   not first so it cannot open a negation, and there is no `-` in the set at
   all so no range can form by accident. */
const SPECIALS_CLASS = '!@#$%^&*_+=`|(){}\\[\\]:">,.?'

export const MIN_LENGTH = 9
export const MAX_LENGTH = 30

/** How many of the four character types a password has to show. */
export const REQUIRED_TYPE_COUNT = 3

export type PasswordRule = {
  id: string
  label: string
  test: (password: string) => boolean
}

/**
 * The four character types, each its own independent boolean.
 *
 * Rendered as four rows that light up one at a time as that type appears —
 * NOT as "three of these go green and one stays dark", because once three are
 * met there is no correct answer to which one stays unmet. The overall verdict
 * is `meetsTypeRule` below, which the list shows on its own row.
 */
export const CHARACTER_TYPES: PasswordRule[] = [
  {
    id: 'uppercase',
    label: 'English uppercase letters (A through Z)',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'lowercase',
    label: 'English lowercase letters (a through z)',
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: 'number',
    label: 'Numbers (0 through 9)',
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: 'special',
    label: `Special characters (${ALLOWED_SPECIALS})`,
    /* Anything OUTSIDE this set — an emoji, a curly quote, an accented letter
       — simply does not count as a special. It is not rejected and the field
       does not block it: it still counts toward length, it just cannot help
       satisfy the three-of-four rule. Nothing in the page's copy claims input
       is restricted, only that certain characters count. */
    test: (p) => new RegExp(`[${SPECIALS_CLASS}]`).test(p),
  },
]

/** How many of the four types are present. */
export function countCharacterTypes(password: string): number {
  return CHARACTER_TYPES.filter((type) => type.test(password)).length
}

/**
 * Three of the four, DERIVED from the four booleans rather than written out as
 * a flat list of ORs over every 3-way combination. Change
 * `REQUIRED_TYPE_COUNT`, or add a fifth type, and this keeps working.
 */
export function meetsTypeRule(password: string): boolean {
  return countCharacterTypes(password) >= REQUIRED_TYPE_COUNT
}

/**
 * The two top-level rows of the checklist. The four types above hang under the
 * second one.
 */
export const INVITE_PASSWORD_REQUIREMENTS: PasswordRule[] = [
  {
    id: 'length',
    label: `Between ${MIN_LENGTH} and ${MAX_LENGTH} characters long, with no spaces`,
    /* Whitespace is folded in here rather than given a row of its own, exactly
       as the Profile module does it. There is no reason this flow should be
       laxer about spaces than that one. */
    test: (p) => p.length >= MIN_LENGTH && p.length <= MAX_LENGTH && !/\s/.test(p),
  },
  {
    id: 'types',
    label: `At least ${REQUIRED_TYPE_COUNT} of the following 4 types of characters`,
    test: meetsTypeRule,
  },
]

/** The Confirm gate. Both top-level rows, which is both rules there are. */
export function isPasswordValid(password: string): boolean {
  return INVITE_PASSWORD_REQUIREMENTS.every((rule) => rule.test(password))
}
