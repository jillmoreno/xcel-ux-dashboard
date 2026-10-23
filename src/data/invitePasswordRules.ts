/**
 * THE INVITE FLOW'S PASSWORD RULES — extracted 2026-10-22, when the split
 * confirmation grew a password step of its own.
 *
 * ⚠ NOT `passwordRequirements.ts`. That module is the DASHBOARD's Update
 * Password panel: a different rule set (9–15 characters, every class required,
 * and one rule that compares against the current password) attached to a
 * checklist that ticks live. These are the invite flow's, from its own design —
 * 9 to 30, three of four classes — and they are displayed as guidance rather
 * than tested. Two genuinely different policies; the mistake would be making
 * one serve both because the words look similar.
 *
 * ⚠ ONE COPY FOR THE TWO PLACES THE FLOW SETS A PASSWORD. Confirmation &
 * Password sets one on the invited arms; the split confirmation sets one on
 * the guest arm. The same product cannot tell a learner two different rules
 * depending on how they got in.
 *
 * ⚠ A LIST, NOT A PARAGRAPH (2026-10-22, Jillienne's rewrite). This was two
 * sentences of prose above a list of four long labels — "Passwords must be
 * between 9 and 30 characters long and include at least three of the four
 * following types of characters", then "English uppercase letters (A through
 * Z)". Every requirement is now a bullet, and each bullet is the requirement
 * with nothing else in it: the length rule and the three-of-four rule sit at
 * the same level because they are the two things being asked, and the classes
 * nest under the one that governs them. Rules a learner is meant to satisfy
 * while typing have to be scannable at a glance, and prose is the one shape
 * that cannot be scanned.
 *
 * ⚠ IT GATES NOW (2026-10-22, Jillienne: "as user types in, those
 * requirements should show a validation and then the confirm button will be
 * active"). It was deliberately guidance-only until this point — a checklist
 * that ticked would have been promising validation the demo did not do — and
 * the note here said that if it ever had to gate, the rules would get `test`
 * functions and both call sites would read them. That is exactly what
 * happened, so the module keeps its promise: `test` is the single definition
 * of each rule, the checklist renders it and the button gates on it, and the
 * two cannot disagree about what "valid" means.
 *
 * ⚠ NOTHING HERE EVER SEES A STORED VALUE. `test` is handed the live field
 * contents and returns a boolean; no rule keeps, hashes or logs what it read.
 * The same property `passwordRequirements.ts` has, and for the same reason.
 */

export const INVITE_PASSWORD_HEADING = 'Password requirements'

export type InvitePasswordRule = {
  readonly id: string
  readonly label: string
  readonly test: (password: string) => boolean
  /** The classes, which only exist under the rule that counts them. */
  readonly sub?: readonly InvitePasswordRule[]
}

/**
 * The four character classes. Each ticks on its own, which is the point of
 * showing them: a learner who has met three still wants to see WHICH three,
 * and one who has met two needs to see what is left to pick from.
 *
 * ⚠ "SPECIAL" IS ANYTHING THAT IS NOT A LETTER, A DIGIT OR A SPACE, rather
 * than a listed set. The displayed copy stopped enumerating the symbols on
 * 2026-10-22, and a test stricter than the words on screen is the worst of
 * both: the learner reads "special characters", types one, and the row stays
 * grey with nothing to tell them why. A space does not count as a special
 * character — but nothing forbids one either, because the rules on screen do
 * not forbid one.
 */
export const INVITE_PASSWORD_CLASS_RULES: readonly InvitePasswordRule[] = [
  { id: 'upper', label: 'Uppercase letters', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Lowercase letters', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'Numbers', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Special characters', test: (p) => /[^A-Za-z0-9 ]/.test(p) },
]

/** How many of the four. Named, because it appears in the label as well. */
export const INVITE_PASSWORD_CLASSES_REQUIRED = 3

export function invitePasswordClassesMet(password: string): number {
  return INVITE_PASSWORD_CLASS_RULES.filter((rule) => rule.test(password)).length
}

export const INVITE_PASSWORD_RULES: readonly InvitePasswordRule[] = [
  {
    id: 'length',
    /* ⚠ AN EN DASH, not a hyphen — it is a range. */
    label: '9–30 characters',
    test: (p) => p.length >= 9 && p.length <= 30,
  },
  {
    id: 'classes',
    label: `At least ${INVITE_PASSWORD_CLASSES_REQUIRED} of the following:`,
    /* ⚠ A COUNT, NOT AN `every`. This is the one rule that is satisfied by a
       SUBSET of its own children, which is why the parent carries a test of
       its own rather than being derived from whether the rows beneath it are
       all ticked. */
    test: (p) => invitePasswordClassesMet(p) >= INVITE_PASSWORD_CLASSES_REQUIRED,
    /* ⚠ THE SPECIAL-CHARACTER SET IS NO LONGER SPELT OUT. It used to run
       `(!@#$ %^&* _+=`|(){}[]:">,.?)` in 11px grey, which is a string nobody
       reads and which reads as noise beside three two-word labels. A learner
       deciding whether to add a symbol does not need the enumeration; one who
       hits a rejected symbol needs an error message, which is a different
       problem than this block. */
    sub: INVITE_PASSWORD_CLASS_RULES,
  },
]

/**
 * The gate. Both arms' submit buttons are disabled until this is true, and an
 * empty field fails it — every rule reads unmet before anything is typed,
 * which is how the checklist reads too.
 */
export function meetsInvitePasswordRules(password: string): boolean {
  return INVITE_PASSWORD_RULES.every((rule) => rule.test(password))
}
