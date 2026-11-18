/**
 * The Design section's facts, as pure functions (2026-11-16) — split from
 * `DesignPanel.tsx` so the panel exports only a component (fast refresh)
 * and the rules a test wants to reach are reachable without rendering.
 */
import type { BranchDeploy } from '@/data/branchStore'
import { parseBranch, type ParsedBranch } from '@/data/branchName'
import type { PrototypeScope } from '@/data/prototypeFeatures'

export type DesignStage = 'building' | 'failed' | 'in-design' | 'on-stage' | 'released'

/** One word per row. Released beats staged beats built: a branch that is on
 *  `main` is also on `stage`, and the furthest-along answer is the one the
 *  designer is asking for. A build still running is reported ahead of the
 *  git facts, because the git facts describe the PREVIOUS push. */
export function stageOf(b: BranchDeploy): DesignStage {
  if (b.build === 'building') return 'building'
  if (b.build === 'failed') return 'failed'
  if (b.released) return 'released'
  if (b.onStage) return 'on-stage'
  return 'in-design'
}

/* ── SCOPES WHOSE WORK HAS LEFT THIS HUB (2026-11-18) ──────────────────────
 *
 * Compass moved to a hub of its own (Jillienne). Its branches are still in
 * this repo and still build — nothing was deleted — but they are no longer
 * this Hub's business, so the Design section stops listing them.
 *
 * ⚠ WHY A CODE EXCLUSION AND NOT DELETING ANYTHING. The section is DERIVED,
 * so there is no row to remove, and the two obvious levers both fail:
 *
 *   • Deleting the branch does NOT remove the row. Netlify's deploy record
 *     outlives the branch, and the row lives on the deploy feed.
 *     `session-2026-11-13-compass-course` proved it — already gone from
 *     origin on 2026-11-18, still listed.
 *   • Deleting the Netlify deploys would take the builds offline, and the
 *     next push to any of those branches puts the row straight back.
 *
 * So the exclusion is here, it is one line to undo, and it covers FUTURE
 * compass branches as well as today's four — which is the point: the work
 * has moved, not paused.
 *
 * ⚠ THIS IS THE DESIGN SECTION ONLY. `PROTOTYPE_SCOPES` still carries
 * `compass`, the Compass Prototypes row still exists, and `parseBranch` still
 * reads the scope off a name — removing any of those is a larger decision
 * about whether this Hub still describes Compass at all.
 */
export const SCOPES_ELSEWHERE: readonly PrototypeScope[] = ['compass']

/** Does this branch belong on the Design section? */
export function listsOnDesign(parsed: ParsedBranch): boolean {
  return !parsed.scope || !SCOPES_ELSEWHERE.includes(parsed.scope)
}

/** The one group every branch that names no surface collects in. */
export const UNNAMED_KEY = 'needs-a-name'
export const UNNAMED_FEATURE = 'Needs a surface name'

export type DesignRow = { deploy: BranchDeploy; parsed: ParsedBranch; stage: DesignStage }
export type DesignGroup = { key: string; feature: string; scope: PrototypeScope | null; rows: DesignRow[]; newest: string }

export function groupByFeature(branches: readonly BranchDeploy[]): DesignGroup[] {
  const groups = new Map<string, DesignGroup>()
  for (const deploy of branches) {
    const parsed = parseBranch(deploy.branch)
    // A scope that has moved to its own Hub lists nowhere here.
    if (!listsOnDesign(parsed)) continue
    const row: DesignRow = { deploy, parsed, stage: stageOf(deploy) }
    /* ONE GROUP FOR EVERYTHING UNNAMED (2026-11-18). A branch whose name says
       no surface used to get a section of its own, headed with whatever its
       name happened to read as — which is how the page came to be mostly
       sections of one row each about work nobody was reviewing. They collect
       in a single group instead, and the group's job is to ask for a rename:
       `UNNAMED_KEY` is what the panel looks for to draw that.

       ⚠ THEY ARE STILL SHOWN, on purpose and for now. The rule is that a row
       earns its place by naming its surface, and the honest way to introduce
       that is to let people SEE their branch asking to be renamed rather than
       have it vanish and wait for them to notice. Once the group is empty,
       dropping these rows entirely is deleting this branch of the if. */
    const key = parsed.scope ? parsed.featureKey : UNNAMED_KEY
    const held = groups.get(key)
    if (held) {
      held.rows.push(row)
      if (deploy.updated > held.newest) held.newest = deploy.updated
    } else {
      groups.set(key, {
        key,
        feature: parsed.scope ? parsed.feature : UNNAMED_FEATURE,
        scope: parsed.scope,
        rows: [row],
        newest: deploy.updated,
      })
    }
  }
  // Newest activity first, so the top of the page is this week. The endpoint
  // already orders branches newest-first, so rows inside a group are too.
  // The unnamed group sorts LAST whatever its dates: it is a to-do, not news.
  return [...groups.values()].sort((a, b) => {
    if (a.key === UNNAMED_KEY) return 1
    if (b.key === UNNAMED_KEY) return -1
    return a.newest === b.newest ? a.feature.localeCompare(b.feature) : a.newest < b.newest ? 1 : -1
  })
}

