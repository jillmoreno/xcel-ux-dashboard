/**
 * The Release section's facts, as pure functions (2026-11-16) — what is on
 * stage that main does not have, by surface, and whether each branch's
 * defaults are decided. Split from `ReleasePanel.tsx` so the panel exports
 * only a component and the rules are testable without rendering.
 */
import type { BranchDeploy, BranchIndex } from '@/data/branchStore'
import { parseBranch } from '@/data/branchName'
import type { PrototypeScope } from '@/data/prototypeFeatures'

export type ReleaseRow = {
  deploy: BranchDeploy
  feature: string
  scope: PrototypeScope | null
  /** The marker for THIS branch's scope exists and vouches for a commit main
   *  does not have. A branch with no scope word cannot be decided — there is
   *  no surface to decide for — and says so. */
  decided: boolean
}

export type ReleaseGroup = {
  scope: PrototypeScope | null
  rows: ReleaseRow[]
  /** Every row decided — the group `/release` will accept. */
  ready: boolean
}

export function isWaiting(b: BranchDeploy): boolean {
  return b.onStage === true && b.released !== true
}

/** The rows, by surface, owners' surfaces first in `PROTOTYPE_SCOPES` order
 *  and the unscoped last — the order a release reads them in. */
export function groupForRelease(branches: readonly BranchDeploy[]): ReleaseGroup[] {
  const groups = new Map<string, ReleaseGroup>()
  for (const deploy of branches) {
    if (!isWaiting(deploy)) continue
    const parsed = parseBranch(deploy.branch)
    const row: ReleaseRow = {
      deploy,
      feature: parsed.variant ? `${parsed.feature} — ${parsed.variant}` : parsed.feature,
      scope: parsed.scope,
      decided: parsed.scope !== null && deploy.decided.some((m) => m.scope === parsed.scope),
    }
    const key = parsed.scope ?? ''
    const held = groups.get(key)
    if (held) held.rows.push(row)
    else groups.set(key, { scope: parsed.scope, rows: [row], ready: true })
  }
  const out = [...groups.values()]
  for (const g of out) g.ready = g.rows.every((r) => r.decided)
  return out.sort((a, b) => (a.scope === null ? 1 : b.scope === null ? -1 : 0))
}

/** The nav count: branches waiting, whatever their decided state. */
export function waitingCount(index: BranchIndex): number {
  return index.branches.filter(isWaiting).length
}

