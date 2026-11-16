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

export type GitFacts = {
  onStage: boolean
  released: boolean
}

export type GitStatus =
  | { configured: false; reason: 'no-credentials' }
  | { configured: true; reason: '' | 'unreachable' | `github-${number}` }

export const DEFAULT_REPO = 'jillmoreno/xcel-ux-dashboard'

/** `ahead_by === 0` is the whole rule; everything else is defensive parsing
 *  of a body we do not control. */
export function isMergedInto(compareBody: unknown): boolean {
  if (typeof compareBody !== 'object' || compareBody === null) return false
  const ahead = (compareBody as Record<string, unknown>).ahead_by
  return typeof ahead === 'number' && ahead === 0
}

/**
 * One compare call. Returns `null` on any failure so a single branch that
 * GitHub cannot answer (deleted since Netlify built it, say) does not take the
 * whole list down with it — the row just carries no git facts.
 */
async function compare(
  repo: string,
  token: string,
  base: string,
  head: string,
): Promise<boolean | null> {
  const url = `https://api.github.com/repos/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'xcel-ux-dashboard',
      },
    })
  } catch {
    return null
  }
  if (!res.ok) return null
  try {
    return isMergedInto(await res.json())
  } catch {
    return null
  }
}

/**
 * The facts for a set of branches, keyed by branch name. Two calls per branch,
 * all in flight at once; the caller caps the set (the deploy window already
 * does — a branch nobody has pushed in weeks is not in it).
 */
export async function gitFactsFor(
  branches: readonly string[],
  env: Record<string, string | undefined>,
): Promise<{ status: GitStatus; facts: Record<string, GitFacts> }> {
  const token = (env.GITHUB_TOKEN || '').trim()
  if (!token) return { status: { configured: false, reason: 'no-credentials' }, facts: {} }

  const repo = (env.GITHUB_REPO || DEFAULT_REPO).trim()
  const stage = (env.STAGE_BRANCH || 'stage').trim()
  const main = (env.PRODUCTION_BRANCH || 'main').trim()

  const facts: Record<string, GitFacts> = {}
  let failed = 0
  await Promise.all(
    branches.map(async (branch) => {
      const [onStage, released] = await Promise.all([
        compare(repo, token, stage, branch),
        compare(repo, token, main, branch),
      ])
      if (onStage === null && released === null) {
        failed += 1
        return
      }
      facts[branch] = { onStage: onStage === true, released: released === true }
    }),
  )

  // Every branch failing is the token or the network, and worth saying out
  // loud; one branch failing is that branch, and says nothing about the rest.
  const status: GitStatus =
    branches.length > 0 && failed === branches.length
      ? { configured: true, reason: 'unreachable' }
      : { configured: true, reason: '' }
  return { status, facts }
}
