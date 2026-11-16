/**
 * The git facts behind the Design section (2026-11-16): is this branch's
 * work already on `stage`, and is it already on `main`?
 *
 * WHY THESE ARE DERIVED AND NOT AUTHORED. Until today "on stage" was a card
 * on the To Do Board that `share-to-stage` asked the designer to file, and
 * "released" was that card being archived by hand. Two hand-written copies of
 * a fact git already holds — and the hand-off to write them was a prefilled
 * URL clicked through a site password, which is where the flow kept breaking.
 * Git answers both questions in one call each and cannot be out of date.
 *
 * THE QUESTION IS "IS EVERY COMMIT OF THIS BRANCH IN THAT BRANCH". GitHub's
 * compare endpoint, asked as `base...head` with the branch as head, reports
 * `ahead_by`: how many commits the branch has that the base does not. Zero
 * means merged (a fast-forward, a merge commit, or `stage` having moved past
 * it — all the same answer). It is a question about COMMITS, not files, so a
 * branch rebased after staging reads as not-on-stage again, which is right:
 * what is on stage is no longer what the branch is.
 *
 * ── CONFIG ──────────────────────────────────────────────────────────────────
 *   GITHUB_TOKEN   a fine-grained token with Contents: read on the repo.
 *   GITHUB_REPO    `owner/name`; defaults to this repo.
 *   STAGE_BRANCH   `stage` by default. PRODUCTION_BRANCH is shared with the
 *                  deploy list.
 *
 * Unconfigured is NOT an error, the same rule `/api/branches` already holds:
 * the deploy list still answers and every row says "git facts are off" in one
 * place rather than each row quietly reading as not-staged.
 */

export type DecidedMarker = {
  scope: string
  decidedAt: string
  by: string
  /** The promotion commit the marker vouches for. A marker only COUNTS when
   *  this commit is among the branch's commits that main does not have — see
   *  `decidedOn`. */
  commit: string
}

export type GitFacts = {
  onStage: boolean
  released: boolean
  /** The surfaces whose flag defaults this branch has decided — the
   *  `.hub/decided/<scope>.json` markers `share-to-stage` writes, filtered to
   *  the ones that vouch for a commit still ahead of main. Only asked for a
   *  branch that is on stage and not released (the Release page's rows). */
  decided: DecidedMarker[]
}

export type GitStatus =
  | { configured: false; reason: 'no-credentials' }
  | { configured: true; reason: '' | 'unreachable' | `github-${number}` }

/** Stage against main, for the Release page's one number. `null` when GitHub
 *  could not answer. */
export type StageFacts = { aheadOfMain: number | null; behindMain: number | null }

export const DEFAULT_REPO = 'jillmoreno/xcel-ux-dashboard'

/** Where `share-to-stage` leaves its markers. One file per scope, so two
 *  owners staging two surfaces in one week never touch the same file. */
export const DECIDED_DIR = '.hub/decided'

type Compare = { aheadBy: number; behindBy: number; shas: string[] }

/** `ahead_by === 0` is the whole rule; everything else is defensive parsing
 *  of a body we do not control. */
export function isMergedInto(compareBody: unknown): boolean {
  const c = parseCompare(compareBody)
  return c !== null && c.aheadBy === 0
}

export function parseCompare(body: unknown): Compare | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  if (typeof b.ahead_by !== 'number' || typeof b.behind_by !== 'number') return null
  const shas = Array.isArray(b.commits)
    ? b.commits
        .map((c) => (typeof c === 'object' && c !== null ? (c as Record<string, unknown>).sha : ''))
        .filter((x): x is string => typeof x === 'string' && x.length > 0)
    : []
  return { aheadBy: b.ahead_by, behindBy: b.behind_by, shas }
}

/**
 * A marker vouches for ONE promotion commit. It counts only while that commit
 * is among the branch's commits main does not have: a marker left on main by
 * the last release, and so carried by every branch cut after it, vouches for
 * a commit main already has and is ignored. That is what lets the markers
 * stay in the tree with nothing to clean up.
 */
export function decidedOn(markers: readonly DecidedMarker[], aheadShas: readonly string[]): DecidedMarker[] {
  return markers.filter((m) => m.commit && aheadShas.some((sha) => sha.startsWith(m.commit) || m.commit.startsWith(sha)))
}

export function parseMarker(body: unknown, scopeFromName: string): DecidedMarker | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const commit = s(b.commit)
  if (!commit) return null
  return { scope: s(b.scope) || scopeFromName, decidedAt: s(b.decidedAt), by: s(b.by), commit }
}

function headers(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'xcel-ux-dashboard',
  }
}

async function getJson(url: string, token: string): Promise<unknown | null> {
  let res: Response
  try {
    res = await fetch(url, { headers: headers(token) })
  } catch {
    return null
  }
  if (!res.ok) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * One compare call. Returns `null` on any failure so a single branch that
 * GitHub cannot answer (deleted since Netlify built it, say) does not take the
 * whole list down with it — the row just carries no git facts.
 */
async function compare(repo: string, token: string, base: string, head: string): Promise<Compare | null> {
  return parseCompare(
    await getJson(
      `https://api.github.com/repos/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
      token,
    ),
  )
}

/** The markers on a branch: list the directory, then read each file. Two
 *  round trips for a branch with any, one for a branch with none. */
async function markersOn(repo: string, token: string, branch: string): Promise<DecidedMarker[]> {
  const dir = await getJson(
    `https://api.github.com/repos/${repo}/contents/${DECIDED_DIR}?ref=${encodeURIComponent(branch)}`,
    token,
  )
  if (!Array.isArray(dir)) return []
  const files = dir
    .map((e) => (typeof e === 'object' && e !== null ? (e as Record<string, unknown>) : null))
    .filter((e): e is Record<string, unknown> => !!e && e.type === 'file' && typeof e.name === 'string' && (e.name as string).endsWith('.json'))
  const out = await Promise.all(
    files.map(async (f) => {
      const body = await getJson(
        `https://api.github.com/repos/${repo}/contents/${DECIDED_DIR}/${encodeURIComponent(f.name as string)}?ref=${encodeURIComponent(branch)}`,
        token,
      )
      const content =
        typeof body === 'object' && body !== null ? (body as Record<string, unknown>).content : undefined
      if (typeof content !== 'string') return null
      try {
        const decoded = Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf8')
        return parseMarker(JSON.parse(decoded), (f.name as string).replace(/\.json$/, ''))
      } catch {
        return null
      }
    }),
  )
  return out.filter((m): m is DecidedMarker => m !== null)
}

/**
 * The facts for a set of branches, keyed by branch name. Two calls per branch,
 * all in flight at once, plus the marker reads for the few that are on stage;
 * the caller caps the set (the deploy window already does — a branch nobody
 * has pushed in weeks is not in it).
 */
export async function gitFactsFor(
  branches: readonly string[],
  env: Record<string, string | undefined>,
): Promise<{ status: GitStatus; facts: Record<string, GitFacts>; stage: StageFacts }> {
  const none: StageFacts = { aheadOfMain: null, behindMain: null }
  const token = (env.GITHUB_TOKEN || '').trim()
  if (!token) return { status: { configured: false, reason: 'no-credentials' }, facts: {}, stage: none }

  const repo = (env.GITHUB_REPO || DEFAULT_REPO).trim()
  const stage = (env.STAGE_BRANCH || 'stage').trim()
  const main = (env.PRODUCTION_BRANCH || 'main').trim()

  const facts: Record<string, GitFacts> = {}
  let failed = 0
  const [stageVsMain] = await Promise.all([
    compare(repo, token, main, stage),
    ...branches.map(async (branch) => {
      const [vsStage, vsMain] = await Promise.all([
        compare(repo, token, stage, branch),
        compare(repo, token, main, branch),
      ])
      if (vsStage === null && vsMain === null) {
        failed += 1
        return
      }
      const onStage = vsStage !== null && vsStage.aheadBy === 0
      const released = vsMain !== null && vsMain.aheadBy === 0
      const decided =
        onStage && !released && vsMain ? decidedOn(await markersOn(repo, token, branch), vsMain.shas) : []
      facts[branch] = { onStage, released, decided }
    }),
  ])

  // Every branch failing is the token or the network, and worth saying out
  // loud; one branch failing is that branch, and says nothing about the rest.
  const status: GitStatus =
    branches.length > 0 && failed === branches.length
      ? { configured: true, reason: 'unreachable' }
      : { configured: true, reason: '' }
  const stageFacts: StageFacts = stageVsMain
    ? { aheadOfMain: stageVsMain.aheadBy, behindMain: stageVsMain.behindBy }
    : none
  return { status, facts, stage: stageFacts }
}
