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
import { PROTOTYPE_SCOPES, type PrototypeScope } from '@/data/prototypeFeatures'

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

  const firstDash = stem.indexOf('-')
  const first = firstDash === -1 ? stem : stem.slice(0, firstDash)
  const scope = scopeOf(first)
  const rest = scope ? (firstDash === -1 ? '' : stem.slice(firstDash + 1)) : stem

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
