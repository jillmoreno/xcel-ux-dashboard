/**
 * What a branch NAME says about the work on it (2026-11-16, the Design
 * section).
 *
 * The Design section is derived from branches, so the only thing a designer
 * authors is the branch name — and this file is the whole contract for it:
 *
 *     feat/<scope>-<feature words>[--<variant>]
 *
 *     feat/compass-study-planner          → Compass · "Study planner"
 *     feat/compass-study-planner--dense   → the same feature, a variant
 *     feat/atlas-home-course-card         → Atlas Learning · "Home course card"
 *     feat/invite-checkout-summary        → Invite & purchase · "Checkout summary"
 *
 * The scope is the first word and names a Prototypes surface — which is also
 * who owns it. Everything after it, up to `--`, is the FEATURE, and rows with
 * the same feature stem sit in one group: "push it to a feature that exists"
 * is reusing the stem, "a new feature" is a new one. `--` marks a variant of
 * the same feature, so two treatments of one thing group together without
 * either pretending to be the other.
 *
 * FORGIVING ON PURPOSE. A branch that does not follow the shape still lists —
 * under "Other branches", with its name as its title — because a row that is
 * merely unlabelled is useful and a row that is missing is a mystery. The
 * prefix (`feat/`, `docs/`, `fix/`, a name) is dropped, never required.
 */
import { PROTOTYPE_FEATURES, PROTOTYPE_SCOPES, type PrototypeScope } from '@/data/prototypeFeatures'

export type ParsedBranch = {
  branch: string
  /** A Prototypes scope, when the first word names one. */
  scope: PrototypeScope | null
  /** The grouping key — scope plus feature words, lowercase, no variant. */
  featureKey: string
  /** The feature as a title: "Study planner". */
  feature: string
  /** The variant after `--`, as a title, or ''. */
  variant: string
}

/** The words a designer might lead with for each scope. Lowercase; the first
 *  word of the branch (after its prefix) is matched against these. */
const SCOPE_ALIASES: ReadonlyArray<[PrototypeScope, readonly string[]]> = [
  ['compass', ['compass']],
  ['atlas', ['atlas', 'home']],
  ['invite', ['invite', 'checkout', 'purchase', 'commerce']],
  ['admin', ['admin']],
  ['end-to-end', ['e2e', 'end-to-end', 'endtoend']],
]

function scopeOf(word: string): PrototypeScope | null {
  for (const [scope, aliases] of SCOPE_ALIASES) {
    if (aliases.includes(word)) return scope
  }
  return null
}

function titleCase(words: string): string {
  const s = words.replace(/[-_]+/g, ' ').trim()
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

export function parseBranch(branch: string): ParsedBranch {
  // `feat/x`, `eric/x`, `claude/x-1234` — the part before the last `/` is a
  // prefix, whatever it is.
  const body = branch.includes('/') ? branch.slice(branch.lastIndexOf('/') + 1) : branch
  const [stemRaw, ...variantParts] = body.split('--')
  const stem = stemRaw.toLowerCase()
  const variant = variantParts.join('--')

  /* THE SCOPE WORD IS LOOKED FOR ANYWHERE IN THE STEM, not only first
     (2026-11-18). It used to be the first word alone, and on the real branch
     list that put two thirds of the rows under "Other branches" — silently,
     because a name that does not match is not an error, it is just filed
     somewhere else. The two that showed it plainest:

       erics-atlas-primary                 → Other, though it says atlas
       session-2026-11-13-compass-course   → Other, though it says compass

     The word was right there in both. Scanning every word costs nothing and
     the first match wins, so a name that already followed the convention
     parses exactly as it did — the scope is word 0, and `rest` is everything
     after it, which is what the old code computed.

     THE FEATURE IS WHAT FOLLOWS THE SCOPE, which is also why the titles come
     out better: `session-2026-11-13-compass-course` is "Course", not "Session
     2026 11 13 compass course". Words BEFORE the scope are discarded — they
     are a prefix the author used for their own reasons (a date, their name),
     never the feature.

     ⚠ A false positive is possible and is the right trade: `feat/fix-home-
     page-typo` files under Atlas because `home` is one of its aliases. Filing
     a small Atlas fix under Atlas is not a wrong answer; filing Eric's Atlas
     branch under "Other" is. */
  const words = stem.split('-').filter(Boolean)
  let scope: PrototypeScope | null = null
  let scopeAt = -1
  for (let i = 0; i < words.length; i++) {
    const hit = scopeOf(words[i])
    if (hit) {
      scope = hit
      scopeAt = i
      break
    }
  }
  const rest = scope ? words.slice(scopeAt + 1).join('-') : stem

  return {
    branch,
    scope,
    featureKey: scope ? `${scope}:${rest}` : `other:${stem}`,
    // A branch that is only its scope — `feat/compass` — is the scope's own
    // work with no feature name; the scope label stands in.
    feature: titleCase(rest) || (scope ? scopeLabel(scope) : titleCase(stem)) || branch,
    variant: titleCase(variant),
  }
}

export function scopeLabel(scope: PrototypeScope): string {
  return PROTOTYPE_SCOPES.find((s) => s.id === scope)?.label ?? scope
}

export function scopeOwner(scope: PrototypeScope): string {
  return PROTOTYPE_SCOPES.find((s) => s.id === scope)?.owner ?? ''
}

/* ── WHERE A BRANCH IS REVIEWED (2026-11-18) ────────────────────────────────
 *
 * Every Design row used to open `REVIEW_PATH` — the single constant
 * `/dashboard-rebrand?demo=1` in `netlify/lib/branchDeploys.ts`. That is the
 * Atlas home, so a Compass branch opened the Atlas dashboard, an Invite
 * branch opened the Atlas dashboard, and the reviewer had to know to navigate
 * to the work themselves. Three of the five surfaces landed in the wrong
 * place, and nothing said so.
 *
 * The constant predates this section. It was written for the Refinement
 * strip, where the address landed in an editable form field and the designer
 * corrected it before saving; the Design section removed the form, and with
 * it the correction step — so the guess became the answer.
 *
 * ⚠ THE PATH IS THE SCOPE'S PROTOTYPES ROW, not a second table. "Where does
 * Compass live" already has an answer — the `to` on the Compass row in
 * `prototypeFeatures.ts` — and writing it again here is the duplication that
 * keeps biting this project. A Design row opens the same path on the BRANCH
 * build that the Prototypes row opens on main's.
 *
 * ⚠ `linkRetired` IS DELIBERATELY IGNORED. That flag turns off the Hub's
 * links to the main and stage BUILDS (2026-11-17); it says nothing about a
 * designer's own branch build, which is the only thing a Design row opens.
 * Reading `to` and not `status`/`linkRetired` is what keeps the two apart.
 *
 * A branch with no scope keeps the old constant: nothing is known about where
 * its work is, and the dashboard is the least surprising door.
 */

/** What a scopeless branch opens — the historic `REVIEW_PATH`. */
export const DEFAULT_REVIEW_PATH = '/dashboard-rebrand?demo=1'

/** The path a branch of this scope should be reviewed at. */
export function reviewPathFor(scope: PrototypeScope | null | undefined): string {
  if (!scope) return DEFAULT_REVIEW_PATH
  const row = PROTOTYPE_FEATURES.find((f) => f.category === 'prototype' && f.prototypeScope === scope)
  // The Admin row is a placeholder with no `to` — there is no admin surface to
  // land on yet, so its branches get the default like any scopeless one.
  return row?.to || DEFAULT_REVIEW_PATH
}

/** A branch build's address for a reviewer: the branch alias root, plus the
 *  path its scope lives at. `branchUrl` is `BranchDeploy.url`. */
export function reviewHref(branchUrl: string, scope: PrototypeScope | null | undefined): string {
  const path = reviewPathFor(scope)
  return branchUrl.replace(/\/+$/, '') + (path.startsWith('/') ? path : `/${path}`)
}
