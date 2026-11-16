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
import { useCallback, useEffect, useMemo, useState } from 'react'
import { parseBranch } from '@/data/branchName'

export type BranchDeploy = {
  branch: string
  slug: string
  url: string
  reviewUrl: string
  updated: string
  commit: string
  author: string
  /** The newest deploy's state — see `branchDeploys.ts`. Only `ready` has an
   *  address worth offering. */
  build: 'ready' | 'building' | 'failed'
  /** The git facts (2026-11-16): every commit of this branch is on `stage` /
   *  on `main`. `null` when the endpoint has no GitHub token, or GitHub could
   *  not answer for this branch — "unknown", which the row says, rather than
   *  "no", which it would otherwise look like. */
  onStage: boolean | null
  released: boolean | null
  /** The surfaces this branch has decided defaults for — the markers
   *  `share-to-stage` writes under `.hub/decided/`, counted only while they
   *  vouch for a commit main does not have (`branchGit.ts`). Sent only for a
   *  branch on stage and not released; empty otherwise. */
  decided: DecidedMarker[]
}

export type DecidedMarker = { scope: string; decidedAt: string; by: string; commit: string }

export type BranchIndex = {
  /** The endpoint answered AND is configured to talk to Netlify. */
  available: boolean
  /** True until the first fetch settles. */
  loading: boolean
  /** Why the list is empty, when it is empty for a reason worth saying out
   *  loud. '' when everything is fine. */
  reason: string
  /** Whether the git facts are on. `off` = no GITHUB_TOKEN on the project;
   *  `down` = configured and GitHub did not answer; `on` otherwise. */
  git: 'on' | 'off' | 'down'
  /** Stage against main — the Release page's one number. `null` while the
   *  git facts are off or GitHub did not answer. */
  stageAheadOfMain: number | null
  branches: BranchDeploy[]
}

export const EMPTY_BRANCH_INDEX: BranchIndex = {
  available: false,
  loading: true,
  reason: '',
  git: 'off',
  stageAheadOfMain: null,
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
  const build = r.build
  const bool = (v: unknown) => (typeof v === 'boolean' ? v : null)
  return {
    branch,
    slug: s(r.slug),
    url,
    reviewUrl: safeBranchHref(s(r.reviewUrl)) ? s(r.reviewUrl) : url,
    updated: s(r.updated),
    commit: s(r.commit),
    author: s(r.author),
    // An endpoint from before 2026-11-16 sends no `build`; everything it
    // listed was ready, so that is the default.
    build: build === 'building' || build === 'failed' ? build : 'ready',
    onStage: bool(r.onStage),
    released: bool(r.released),
    decided: Array.isArray(r.decided)
      ? r.decided
          .map((m): DecidedMarker | null => {
            if (typeof m !== 'object' || m === null) return null
            const d = m as Record<string, unknown>
            const scope = s(d.scope)
            return scope ? { scope, decidedAt: s(d.decidedAt), by: s(d.by), commit: s(d.commit) } : null
          })
          .filter((m): m is DecidedMarker => m !== null)
      : [],
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
    return { available: false, loading: false, reason: 'no-endpoint', git: 'off', stageAheadOfMain: null, branches: [] }
  }

  // An HTML answer counts as no endpoint. Under plain `npm run dev` vite serves
  // no /api/* at all and the SPA fallback returns index.html with a 200, so
  // without this the parse throws and reads as a broken page rather than as
  // "this needs `netlify dev`". Same guard `LinkIndex` carries.
  const ctype = res.headers.get('content-type') || ''
  if (!ctype.includes('application/json')) {
    return { available: false, loading: false, reason: 'no-endpoint', git: 'off', stageAheadOfMain: null, branches: [] }
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    return { available: false, loading: false, reason: 'bad-response', git: 'off', stageAheadOfMain: null, branches: [] }
  }

  const b = (body ?? {}) as Record<string, unknown>
  // `configured` is how we know OUR endpoint answered. Valid JSON without it
  // is something else on this path — the SPA fallback, a proxy, a stub in a
  // test — and that is "no endpoint here", not "Netlify is down". Getting this
  // wrong puts a red herring above a board that is working fine.
  if (typeof b.configured !== 'boolean') {
    return { available: false, loading: false, reason: 'no-endpoint', git: 'off', stageAheadOfMain: null, branches: [] }
  }
  const configured = b.configured === true
  const reason = typeof b.reason === 'string' ? b.reason : ''
  const branches = Array.isArray(b.branches)
    ? b.branches.map(normalise).filter((x): x is BranchDeploy => x !== null)
    : []

  // The git facts' own status rides beside the list — see `branchGit.ts`.
  const g = (b.git ?? {}) as Record<string, unknown>
  const git: BranchIndex['git'] =
    g.configured === true ? (typeof g.reason === 'string' && g.reason ? 'down' : 'on') : 'off'

  const st = (b.stage ?? {}) as Record<string, unknown>
  const stageAheadOfMain = typeof st.aheadOfMain === 'number' ? st.aheadOfMain : null

  return { available: configured && res.ok, loading: false, reason, git, stageAheadOfMain, branches }
}

/**
 * The strip's data. Re-reads on demand rather than holding an optimistic copy,
 * for the reason every write on the board does: this describes something that
 * changes without us — a designer pushes, Netlify builds — so a cached list is
 * a second copy of state we do not own.
 */
export function useBranches(enabled = true): { index: BranchIndex; refresh: () => Promise<void> } {
  const [index, setIndex] = useState<BranchIndex>(EMPTY_BRANCH_INDEX)

  const refresh = useCallback(async () => {
    const next = await listBranches()
    setIndex(next)
  }, [])

  useEffect(() => {
    // `enabled` false = a panel that was handed the page's index and must not
    // fetch a second copy (each GitHub-backed answer costs seconds).
    if (!enabled) return
    let alive = true
    void listBranches().then((next) => {
      if (alive) setIndex(next)
    })
    return () => {
      alive = false
    }
  }, [enabled])

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

/* ── what is on stage, by surface (2026-11-16) ────────────────────────────── */

/** The three things the Prototypes row's Staged tag draws — the same three
 *  the On Stage card used to carry (`todoBoardStore.useStagedScopes`), so the
 *  row reads either without caring which. */
export type StagedFact = {
  /** `yyyy-mm-dd` — the branch's newest build, which is the staged work. */
  addedDate: string
  owner: string
  title: string
}

/**
 * Which surfaces have a branch ON STAGE and not yet released, read from the
 * branch list's git facts rather than from a card somebody filed.
 *
 * The scope is the first word of the branch name (`branchName.ts`), which is
 * also what the Design section groups by — so the Prototypes row and the
 * Design row agree about what is staged because they read one fact. Where
 * two branches for one scope are on stage, the newest build wins the tag:
 * the question the row answers is "since when has this surface been
 * waiting", and the latest share is the honest answer.
 *
 * Empty when the git facts are off (no GITHUB_TOKEN) — the page falls back to
 * the On Stage cards for the rows filed before today.
 */
export function stagedScopesFromBranches(branches: readonly BranchDeploy[]): Record<string, StagedFact> {
  const out: Record<string, StagedFact> = {}
  for (const b of branches) {
    if (!b.onStage || b.released) continue
    const parsed = parseBranch(b.branch)
    if (!parsed.scope) continue
    const held = out[parsed.scope]
    if (held && held.addedDate >= b.updated) continue
    out[parsed.scope] = {
      addedDate: b.updated,
      owner: b.author,
      title: parsed.variant ? `${parsed.feature} — ${parsed.variant}` : parsed.feature,
    }
  }
  return out
}

export function useStagedScopesFromBranches(): Readonly<Record<string, StagedFact>> {
  const { index } = useBranches()
  return useMemo(() => stagedScopesFromBranches(index.branches), [index.branches])
}
