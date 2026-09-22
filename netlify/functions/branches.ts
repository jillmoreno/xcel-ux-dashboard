/**
 * `/api/branches` — the automatic branch list behind the Refinement strip
 * (2026-09-21).
 *
 * Read-only. It answers one question: which branches currently have a Netlify
 * build a reviewer could open, and at what address. Everything that makes a
 * branch a REVIEW — the note saying where to look, who is asking, the public
 * flag — stays on a record a person wrote, on `/api/demos`. This endpoint
 * writes nothing and owns nothing.
 *
 * ── THE TWO CONTROLS, AND WHY THERE ARE TWO ─────────────────────────────────
 * Branch names are internal. `feat/drop-the-renewal-band` on a stakeholder's
 * screen is a roadmap they were never shown, so this must not reach the PUBLIC
 * build. Two independent things stop it, and neither is relied on alone:
 *
 *   1. The public project sets no API token, so there is nothing to call with.
 *   2. `VITE_GATEWAY_MODE=public` refuses the request outright, below.
 *
 * One control would be enough right up until someone sets the Blobs vars on
 * the public project to share a store — which is a reasonable thing to do and
 * would silently switch control 1 off. Control 2 does not care.
 *
 * NOTE the guard reads the exact string `public`, matching `gatewayMode.ts`'s
 * rule that anything else is the full app. That rule exists so a typo fails
 * towards showing the maintainer everything; here the same typo would fail
 * towards SERVING branch names, which is why it is the second control and not
 * the only one.
 *
 * ── CONFIG ──────────────────────────────────────────────────────────────────
 *   NETLIFY_API_TOKEN  a Netlify personal access token (User settings →
 *                      Applications → Personal access tokens)
 *   NETLIFY_SITE_ID    the project whose BRANCH DEPLOYS these are — the PUBLIC
 *                      site, because that is where a branch build is reviewed
 *                      (no password in front of it; see CLAUDE.md, "Why a
 *                      branch is reviewable at all")
 *   BRANCH_SITE_HOST   optional. Only used if Netlify's own branch alias is
 *                      missing from a deploy; `ux-demo-xceldashboard.netlify.app`
 *                      by default.
 *   PRODUCTION_BRANCH  optional, `main`.
 *
 * IT FALLS BACK TO `BLOBS_TOKEN` / `BLOBS_SITE_ID`, and that is deliberate
 * rather than lazy. Those two are already set on the FULL project and already
 * point at the public site — the same token, the same site, for the same
 * reason. Falling back means this feature needs NO new configuration on a site
 * that is already set up, which is the difference between it working and it
 * sitting behind a step nobody did. The dedicated names win when both are set,
 * so the day the two need to diverge is one env var away.
 *
 * Unconfigured is NOT an error. It answers 200 with `configured: false`, so the
 * strip can say plainly that the list is off rather than render an empty
 * section that looks like "no branches" — the distinction the Links panel
 * draws between `loading` and `available`, which is the same distinction.
 */
import { selectBranchDeploys } from '../lib/branchDeploys'

export const config = {
  path: '/api/branches',
}

const DEFAULT_SITE_HOST = 'ux-demo-xceldashboard.netlify.app'

/** How many deploys to look back through. The feed is a history and a busy
 *  week is a lot of builds, so this is a window rather than everything: 100 is
 *  Netlify's page maximum and reaches well past any branch still worth
 *  reviewing. A branch whose newest build has fallen off the end is a branch
 *  nobody has pushed in a long time. */
const PER_PAGE = 100

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    // `no-store`, matching the board endpoints. A short cache would reduce API
    // calls, and it would also mean a designer who has just pushed refreshes
    // and does not see their branch — which is the one moment this list is
    // being looked at.
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return json({ errors: ['Method not allowed'] }, 405)

  // Control 2. See the file comment.
  if ((process.env.VITE_GATEWAY_MODE || '').trim().toLowerCase() === 'public') {
    return json({ configured: false, branches: [], reason: 'not-available-here' }, 404)
  }

  const token = (process.env.NETLIFY_API_TOKEN || process.env.BLOBS_TOKEN || '').trim()
  const siteId = (process.env.NETLIFY_SITE_ID || process.env.BLOBS_SITE_ID || '').trim()

  if (!token || !siteId) {
    return json({
      configured: false,
      branches: [],
      reason: 'no-credentials',
    })
  }

  const siteHost = (process.env.BRANCH_SITE_HOST || DEFAULT_SITE_HOST).trim()
  const productionBranch = (process.env.PRODUCTION_BRANCH || 'main').trim()

  let res: Response
  try {
    res = await fetch(
      `https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteId)}/deploys?per_page=${PER_PAGE}`,
      { headers: { authorization: `Bearer ${token}` } },
    )
  } catch {
    // The network, not the config. Reported as reachable-but-failing so the
    // strip says "could not reach Netlify" rather than "not set up" — two
    // different things to do about it.
    return json({ configured: true, branches: [], reason: 'unreachable' }, 502)
  }

  if (!res.ok) {
    // The token is wrong, expired, or has no access to this site. Never echo
    // the body: it is Netlify's, and on an auth failure it can name the
    // account.
    return json({ configured: true, branches: [], reason: `netlify-${res.status}` }, 502)
  }

  let deploys: unknown
  try {
    deploys = await res.json()
  } catch {
    return json({ configured: true, branches: [], reason: 'bad-response' }, 502)
  }

  return json({
    configured: true,
    branches: selectBranchDeploys(deploys, { siteHost, productionBranch }),
  })
}
