/**
 * The Update Password checklist — the rules, and nothing else.
 *
 * A PURE MODULE on purpose. The panel renders these and the Save button gates
 * on them, so the two cannot disagree about what "valid" means; and a rule can
 * be tested without mounting a Sheet, typing into three inputs and reading a
 * colour back off an icon. Add a rule here and both the checklist and the gate
 * pick it up.
 *
 * ⚠ NOTHING HERE EVER SEES A STORED VALUE. `test` is handed the live field
 * contents and returns a boolean; no rule keeps, hashes or logs what it read.
 * That is the whole reason the password panel can `console.info` its save stub
 * without a value in it.
 */

/** The characters rule 5 accepts and rule 6 restricts the field to. */
export const ALLOWED_SPECIALS = '!@#$%^&*.-_'

/* Escaped for use inside a character class: `-` is last so it is a literal
   rather than a range, and `^` is not first for the same reason. */
const SPECIALS_CLASS = '!@#$%^&*._\\-'

export type PasswordRequirement = {
  id: string
  label: string
  /** `currentPassword` is passed for the one rule that needs it (rule 1). */
  test: (newPassword: string, currentPassword: string) => boolean
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'not-current',
    label: 'not your current password',
    /* Both sides must be non-empty: with both blank the strings are equal and
       the rule would read as FAILING before anything is typed, which is the
       one rule whose default state is genuinely "unknown" rather than "unmet".
       Requiring a non-empty new password makes it read unmet-until-typed like
       every other row. */
    test: (next, current) => next.length > 0 && next !== current,
  },
  {
    id: 'length',
    label: '9 to 15 characters and no spaces',
    test: (next) => next.length >= 9 && next.length <= 15 && !/\s/.test(next),
  },
  {
    id: 'case',
    label: 'at least one lowercase and one uppercase letter',
    test: (next) => /[a-z]/.test(next) && /[A-Z]/.test(next),
  },
  {
    id: 'number',
    label: 'at least one number',
    test: (next) => /[0-9]/.test(next),
  },
  {
    id: 'special',
    label: 'at least one special character',
    test: (next) => new RegExp(`[${SPECIALS_CLASS}]`).test(next),
  },
  {
    id: 'allowed-specials',
    label: `only the following special characters are allowed: ${ALLOWED_SPECIALS}`,
    /*
     * ⚠ SATISFIED BY DEFAULT, AND THAT IS THE DESIGN. This asks "is there
     * anything DISALLOWED in here", so an empty field passes and the row reads
     * met from the moment the sheet opens. It is the only rule that works that
     * way, and it is deliberate: the rule is a restriction, not a target, and
     * rendering it unmet would tell the reader to go and DO something about a
     * list of characters they may not want to use at all. It flips to unmet the
     * instant a character outside the set is typed, which is the only moment it
     * has anything to say.
     */
    test: (next) => !new RegExp(`[^A-Za-z0-9${SPECIALS_CLASS}]`).test(next),
  },
]

/**
 * The four rules the inline field error summarises — length, case, number,
 * special. Deliberately NOT all six.
 *
 * Rule 1 (`not-current`) is about a value the message cannot restate without
 * describing the learner's own current password, and rule 6 is the
 * satisfied-by-default restriction above — putting either in a red summary
 * under the field would make the message fire on a password that is fine.
 */
const SUMMARISED_IDS = ['length', 'case', 'number', 'special']

export const PASSWORD_SUMMARY_MESSAGE =
  'Must contain lowercase and uppercase letters, at least one number, at least one special character and 9 to 15 characters.'

/** Do the four summarised rules all pass? Drives the inline error + border. */
export function meetsSummarisedRules(newPassword: string): boolean {
  return PASSWORD_REQUIREMENTS.filter((r) => SUMMARISED_IDS.includes(r.id)).every((r) =>
    r.test(newPassword, ''),
  )
}

/** Do ALL six pass? One half of the Save gate (the other is confirm-matches). */
export function meetsAllRequirements(newPassword: string, currentPassword: string): boolean {
  return PASSWORD_REQUIREMENTS.every((r) => r.test(newPassword, currentPassword))
}
