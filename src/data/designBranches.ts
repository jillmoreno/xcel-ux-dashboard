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

export type DesignRow = { deploy: BranchDeploy; parsed: ParsedBranch; stage: DesignStage }
export type DesignGroup = { key: string; feature: string; scope: PrototypeScope | null; rows: DesignRow[]; newest: string }

export function groupByFeature(branches: readonly BranchDeploy[]): DesignGroup[] {
  const groups = new Map<string, DesignGroup>()
  for (const deploy of branches) {
    const parsed = parseBranch(deploy.branch)
    const row: DesignRow = { deploy, parsed, stage: stageOf(deploy) }
    const held = groups.get(parsed.featureKey)
    if (held) {
      held.rows.push(row)
      if (deploy.updated > held.newest) held.newest = deploy.updated
    } else {
      groups.set(parsed.featureKey, {
        key: parsed.featureKey,
        feature: parsed.feature,
        scope: parsed.scope,
        rows: [row],
        newest: deploy.updated,
      })
    }
  }
  // Newest activity first, so the top of the page is this week. The endpoint
  // already orders branches newest-first, so rows inside a group are too.
  return [...groups.values()].sort((a, b) => (a.newest === b.newest ? a.feature.localeCompare(b.feature) : a.newest < b.newest ? 1 : -1))
}

