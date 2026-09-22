/**
 * The automatic branch list — turning Netlify's deploy feed into the rows the
 * Refinement strip shows (2026-09-21).
 *
 * WHY THIS IS A SEPARATE FILE. `branches.ts` does the two things that cannot
 * be tested without a network and a token: read the config and call the API.
 * Everything that decides WHICH branches a reviewer sees, and what their
 * address is, is here as pure functions — the same split `linkBoard.ts` makes
 * by exporting `validateRecord`. The selection rules below are the ones most
 * likely to be got wrong later, so they are the ones a test can reach.
 *
 * ── WHY DEPLOYS AND NOT BRANCHES ────────────────────────────────────────────
 * The obvious source is GitHub's branch list, and it is the wrong one. What a
 * reviewer needs is a URL that OPENS; a pushed branch that Netlify has not
 * built yet has no such URL, so listing it produces a link that 404s until
 * some later moment nobody is watching for. That is the defect the Resources
 * section shipped four of, and the rule it had to learn afterwards: confirm a
 * URL on the way IN, not later.
 *
 * A deploy in state `ready` IS the confirmation. So the deploy feed is the
 * source, and "has this branch got somewhere to look at" stops being a guess.
 */

/** One row of the strip. Deliberately small — this is a discovery surface, and
 *  everything a REVIEW needs (the note saying where to look, the public flag)
 *  belongs on a real Refinement record that a person wrote. */
export type BranchDeploy = {
  /** The git branch name, as pushed: `feat/thing`. */
  branch: string
  /** Netlify's alias for it: `feat-thing`. */
  slug: string
  /** The branch alias root — always the LATEST build of that branch. */
  url: string
  /** Where a reviewer should actually land. See `REVIEW_PATH`. */
  reviewUrl: string
  /** `yyyy-mm-dd` of the build, matching the board's own date format. */
  updated: string
  /** The commit subject, when Netlify has one. '' rather than absent, the
   *  same rule the board's optional fields follow. */
  commit: string
  /** Who pushed it, when Netlify has it. A LABEL, not an identity we verified
   *  — the same standing `addedBy` has on the board. */
  author: string
}

/**
 * What a product branch is reviewed at.
 *
 * Kept in step with `review_path` in `.claude/skills/promote-to-refinement`,
 * which derives the same address for the same branch by hand. `?demo=1` is
 * load-bearing rather than decorative: it swaps the reviewer's own persisted
 * flag toggles for the branch's COMMITTED baseline before first paint, so what
 * a reviewer sees is what the branch ships rather than what their browser
 * remembers.
 *
 * It is a guess for exactly one case — a branch whose work is an HTML document
 * in `public/demos/` rather than a product change. Nothing in the deploy feed
 * says which kind a branch is, and the strip does not pretend to know: the
 * address lands in the Add form as editable text, where the designer's own
 * click is the gate.
 */
export const REVIEW_PATH = '/dashboard-rebrand?demo=1'

/**
 * Netlify's own branch-alias rule: lowercase, every run of characters outside
 * `a-z0-9` collapses to one `-`, ends trimmed.
 *
 * Re-implemented here rather than read off the deploy, because a deploy is not
 * guaranteed to carry its branch alias and a strip row with no address is
 * worse than none. `deployBranchUrl` prefers Netlify's answer and falls back
 * to this — so the derivation is the safety net, not the primary.
 */
export function slugifyBranch(branch: string): string {
  return branch
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** `2026-09-21T10:11:12.000Z` → `2026-09-21`. A plain date string, not a
 *  timestamp, for the reason the board's `addedDate` is one: the client parses
 *  it by hand to avoid the UTC off-by-one `new Date('2026-09-21')` produces. */
export function isoDay(value: unknown): string {
  if (typeof value !== 'string') return ''
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value)
  return m ? m[1] : ''
}

type Json = Record<string, unknown>

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/**
 * The branch alias URL. Netlify's `links.branch` is the canonical answer and
 * is preferred whenever it is a usable http(s) address; `siteHost` only backs
 * it up.
 *
 * THE PROTOCOL CHECK IS THE SAME TRUST BOUNDARY the board has. This address is
 * rendered as an `<a href>` and can be handed to the Add form, so it travels
 * the same path a typed URL does — and `javascript:` in an href executes in
 * this origin. An allow-list of exactly two schemes, applied by inclusion, for
 * the reason `linkBoard.ts` spells out at length. A blocklist would pass a
 * naive "does it mention javascript" check while being one novel scheme from
 * wrong.
 */
export const ALLOWED_PROTOCOLS = ['http:', 'https:']

export function deployBranchUrl(deploy: Json, slug: string, siteHost: string): string {
  const links = deploy.links
  const fromApi = links && typeof links === 'object' ? str((links as Json).branch) : ''
  if (fromApi) {
    try {
      const parsed = new URL(fromApi)
      if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) return parsed.origin
    } catch {
      /* fall through to the derived form */
    }
  }
  if (!slug || !siteHost) return ''
  return `https://${slug}--${siteHost}`
}

/**
 * Pick the branches worth showing, newest build first.
 *
 * Four filters, and each one is a decision rather than hygiene:
 *
 *  - `context === 'branch-deploy'`. Drops production (that is `main`, which IS
 *    Prototypes — see CLAUDE.md, "Refinement is the review inbox; Prototypes
 *    is the product") and drops DEPLOY PREVIEWS. A preview is a pull request's
 *    own build at a `deploy-preview-N--` address that dies when the PR closes;
 *    the review link this board is about is the BRANCH alias, which survives
 *    and always points at the newest build.
 *  - `state === 'ready'`. A building or failed deploy has no address that
 *    opens. This is the whole reason the deploy feed is the source.
 *  - not the production branch, by name as well as by context, because a site
 *    can be configured to build `main` as a branch deploy too.
 *  - one row per branch, keeping the newest. The feed is a history, so a
 *    branch pushed five times is five deploys, and without this the strip
 *    would be five rows deep in one person's work.
 */
export function selectBranchDeploys(
  deploys: unknown,
  opts: { siteHost: string; productionBranch?: string },
): BranchDeploy[] {
  if (!Array.isArray(deploys)) return []
  const production = (opts.productionBranch || 'main').toLowerCase()
  const byBranch = new Map<string, BranchDeploy>()
  const seenAt = new Map<string, string>()

  for (const raw of deploys) {
    if (typeof raw !== 'object' || raw === null) continue
    const d = raw as Json
    if (str(d.context) !== 'branch-deploy') continue
    if (str(d.state) !== 'ready') continue

    const branch = str(d.branch)
    if (!branch || branch.toLowerCase() === production) continue

    const slug = slugifyBranch(branch)
    const url = deployBranchUrl(d, slug, opts.siteHost)
    if (!url) continue

    // `published_at` is when it went live; `created_at` is when the build
    // started. Prefer the first — an older build that was re-published is
    // newer news than a newer one that never shipped.
    const stamp = str(d.published_at) || str(d.created_at)
    const prev = seenAt.get(branch)
    if (prev && prev >= stamp) continue

    seenAt.set(branch, stamp)
    byBranch.set(branch, {
      branch,
      slug,
      url,
      reviewUrl: url + REVIEW_PATH,
      updated: isoDay(stamp),
      // Netlify puts the commit subject in `title` on a git-triggered deploy.
      commit: str(d.title),
      author: str(d.committer),
    })
  }

  // Newest first, then by name, so the order is stable when two branches were
  // built the same second — an arbitrary order here reads as the list
  // reshuffling itself on every refresh.
  return [...byBranch.values()].sort((a, b) => {
    const at = seenAt.get(a.branch) || ''
    const bt = seenAt.get(b.branch) || ''
    if (at !== bt) return at < bt ? 1 : -1
    return a.branch.localeCompare(b.branch)
  })
}
