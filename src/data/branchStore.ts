/**
 * The automatic branch list — client side (2026-09-21).
 *
 * Reads `/api/branches` and nothing else. There is no write path here at all,
 * which is the point: this is a DISCOVERY surface over a fact Netlify already
 * knows, sitting above a board of records people wrote. A branch appearing in
 * the strip is not a request for review; a Refinement row is.
 *
 * That asymmetry is what keeps the review gate intact. `isPublic` lives on a
 * board record, so the sequence CLAUDE.md describes — "designer adds → team
 * sees → Jillienne flips → stakeholders see" — is unchanged: nothing in the
 * strip can publish anything, and the strip does not render on the public
 * build at all.
 *
 * Shaped like `LinkIndex` on purpose (`loading` carried separately from
 * `available`), because it has the same three states and a reader should not
 * have to learn a second vocabulary for them. For the tick before the first
 * fetch settles, "there is no endpoint" is not yet a fact.
 */
import { useCallback, useEffect, useState } from 'react'

export type BranchDeploy = {
  branch: string
  slug: string
  url: string
  reviewUrl: string
  updated: string
  commit: string
  author: string
}

export type BranchIndex = {
  /** The endpoint answered AND is configured to talk to Netlify. */
  available: boolean
  /** True until the first fetch settles. */
  loading: boolean
  /** Why the list is empty, when it is empty for a reason worth saying out
   *  loud. '' when everything is fine. */
  reason: string
  branches: BranchDeploy[]
}

export const EMPTY_BRANCH_INDEX: BranchIndex = {
  available: false,
  loading: true,
  reason: '',
  branches: [],
}

const ENDPOINT = '/api/branches'

/** The same allow-list the endpoint applies, applied AGAIN at render time.
 *  Not belt-and-braces: a record the server wrote under an older or laxer
 *  version must not become live code later, which is exactly the rule
 *  `safeHref` follows on the board. */
const ALLOWED_PROTOCOLS = ['http:', 'https:']

export function safeBranchHref(url: string): string | null {
  try {
    const parsed = new URL(url)
    return ALLOWED_PROTOCOLS.includes(parsed.protocol) ? parsed.toString() : null
  } catch {
    return null
  }
}

function normalise(raw: unknown): BranchDeploy | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const s = (v: unknown) => (typeof v === 'string' ? v : '')
  const branch = s(r.branch)
  const url = s(r.url)
  // A row with no branch or no address is not a row — there is nothing to
  // label it with and nowhere for it to go. Dropped rather than rendered
  // blank, which is the one case the board's "render it as text so it can be
  // fixed" rule does not apply to: nobody can fix this one, it is Netlify's.
  if (!branch || !safeBranchHref(url)) return null
  return {
    branch,
    slug: s(r.slug),
    url,
    reviewUrl: safeBranchHref(s(r.reviewUrl)) ? s(r.reviewUrl) : url,
    updated: s(r.updated),
    commit: s(r.commit),
    author: s(r.author),
  }
}

export async function listBranches(): Promise<BranchIndex> {
  let res: Response
  try {
    res = await fetch(ENDPOINT, { headers: { accept: 'application/json' } })
  } catch {
    // A throw in the BROWSER means there is no endpoint here. Deliberately the
    // same reason as an HTML answer: `unreachable` is reserved for the server
    // telling us IT could not reach Netlify, which is a different thing to do
    // about and the only one of the two worth saying out loud.
    return { available: false, loading: false, reason: 'no-endpoint', branches: [] }
  }

  // An HTML answer counts as no endpoint. Under plain `npm run dev` vite serves
  // no /api/* at all and the SPA fallback returns index.html with a 200, so
  // without this the parse throws and reads as a broken page rather than as
  // "this needs `netlify dev`". Same guard `LinkIndex` carries.
  const ctype = res.headers.get('content-type') || ''
  if (!ctype.includes('application/json')) {
    return { available: false, loading: false, reason: 'no-endpoint', branches: [] }
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    return { available: false, loading: false, reason: 'bad-response', branches: [] }
  }

  const b = (body ?? {}) as Record<string, unknown>
  // `configured` is how we know OUR endpoint answered. Valid JSON without it
  // is something else on this path — the SPA fallback, a proxy, a stub in a
  // test — and that is "no endpoint here", not "Netlify is down". Getting this
  // wrong puts a red herring above a board that is working fine.
  if (typeof b.configured !== 'boolean') {
    return { available: false, loading: false, reason: 'no-endpoint', branches: [] }
  }
  const configured = b.configured === true
  const reason = typeof b.reason === 'string' ? b.reason : ''
  const branches = Array.isArray(b.branches)
    ? b.branches.map(normalise).filter((x): x is BranchDeploy => x !== null)
    : []

  return { available: configured && res.ok, loading: false, reason, branches }
}

/**
 * The strip's data. Re-reads on demand rather than holding an optimistic copy,
 * for the reason every write on the board does: this describes something that
 * changes without us — a designer pushes, Netlify builds — so a cached list is
 * a second copy of state we do not own.
 */
export function useBranches(): { index: BranchIndex; refresh: () => Promise<void> } {
  const [index, setIndex] = useState<BranchIndex>(EMPTY_BRANCH_INDEX)

  const refresh = useCallback(async () => {
    const next = await listBranches()
    setIndex(next)
  }, [])

  useEffect(() => {
    let alive = true
    void listBranches().then((next) => {
      if (alive) setIndex(next)
    })
    return () => {
      alive = false
    }
  }, [])

  return { index, refresh }
}

/**
 * Is this branch already on the board?
 *
 * Matched on the branch ALIAS appearing in the row's host — `feat-x` against
 * `feat-x--ux-demo-xceldashboard.netlify.app` — rather than on the whole URL,
 * because the two are legitimately different strings for the same branch: the
 * strip offers `…/dashboard-rebrand?demo=1` and a designer may have added the
 * root, a deeper path, or a different query. What makes them the same review
 * is the branch, and the host is where the branch's name lives.
 *
 * The check is on the host SPECIFICALLY, not the href, so a row whose NOTE
 * happens to mention the branch name does not count as already-listed.
 */
export function isBranchOnBoard(slug: string, urls: readonly string[]): boolean {
  if (!slug) return false
  const prefix = `${slug}--`
  return urls.some((u) => {
    try {
      return new URL(u).host.startsWith(prefix)
    } catch {
      return false
    }
  })
}

/**
 * A first draft of the row's title, from the branch name.
 *
 * `feat/drop-the-renewal-band` → `Drop the renewal band`. The conventional-
 * commit prefix goes because it describes the CHANGE to a developer, and this
 * title is read by whoever is being asked to look at it.
 *
 * NOT the commit subject, which is the other obvious source and is worse: it
 * is written to a different audience on a different occasion, and a title like
 * "fix(launch): resolve npm via a shell wrapper" tells a reviewer nothing
 * about what to open. This is a DRAFT in an editable field either way — the
 * designer's own words are what should end up on the board, and the form is
 * where they put them.
 */
export function titleFromBranch(branch: string): string {
  const withoutPrefix = branch.replace(/^[a-z]+(\([^)]*\))?\//i, '')
  const words = withoutPrefix.replace(/[-_/]+/g, ' ').trim()
  if (!words) return branch
  return words.charAt(0).toUpperCase() + words.slice(1)
}
