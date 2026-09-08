import type { Brand } from '@/context/AccountContext'
import type { AchievementUserState } from './types'
import { ACHIEVEMENT_CATALOG } from './catalog'

/**
 * Per-brand demo user states for the achievement catalog.
 *
 * TODO(data): these are hand-authored fixtures driving the prototype demo.
 *   In production, the engagement service will own this — see CLAUDE.md
 *   "Engagement service" section. The client will fetch one user-state
 *   map from `GET /api/achievements/me` and join against the static
 *   `ACHIEVEMENT_CATALOG` on id.
 *
 *   To stop using fixtures:
 *     1. Wire `achievementsFor(brand)` in `index.ts` to call the API
 *        instead of reading from `userStateMapFor`.
 *     2. Delete the four `Partial<>` maps in this file.
 *     3. Keep the `index.ts` selector — its join logic against the
 *        static catalog stays unchanged.
 *
 * Authoring conventions — the `ready` vs `progress` distinction matters:
 *   - `ready`     → one deliberate action away (single-action badges).
 *                   No `progress` object — the rail subtitle is the
 *                   badge's `readyPrompt`.
 *   - `progress`  → user is partway through a quantitative count. Always
 *                   carries a `progress: { current, target, unit }` object.
 *                   The rail renders both a cyan {N}% chip and a cyan
 *                   ring around the stamp.
 *   - Any id NOT present in the map defaults to `locked` via the
 *     `withDefaultLocked` helper in `index.ts`.
 *
 * Older stamps (>30 days) get the `faded` treatment automatically in the
 * widget's stamps strip — driven by `earnedOn` vs the demo's anchored
 * today (2026-05-20).
 */

/* ─── CRE — matches the existing MILESTONES narrative ────────────────
   6 earned items inherited from learnerOverviewFixtures.MILESTONES,
   plus 2 `ready` rail candidates (Perfect Quiz + First Review — both
   single-action) and 2 `progress` items (100-day streak + Premium 1y —
   both quantitative). Rail priorities ensure the order matches the
   canonical mockup exactly. */
const _CRE: Partial<Record<string, AchievementUserState>> = {
  // Earned — the 6 original MILESTONES items
  'streak-7': {
    status: 'earned',
    earnedOn: '2026-04-15',
    rarityPct: 62,
  },
  'streak-30': {
    status: 'earned',
    earnedOn: '2026-05-08',
    rarityPct: 22,
  },
  'first-cert': {
    status: 'earned',
    earnedOn: '2026-03-02',
    rarityPct: 71,
  },
  'five-courses': {
    status: 'earned',
    earnedOn: '2026-04-28',
    rarityPct: 54,
  },
  renewed: {
    status: 'earned',
    earnedOn: '2026-02-10',
    rarityPct: 36,
  },
  'path-done': {
    status: 'earned',
    earnedOn: '2025-12-19',
    rarityPct: 18,
  },
  // Plus auto-earned lifecycle stamps so the demo has a believable account history
  'first-course': { status: 'earned', earnedOn: '2026-03-15', rarityPct: 92 },
  welcome: { status: 'earned', earnedOn: '2024-02-08', rarityPct: 95 },
  'first-login': { status: 'earned', earnedOn: '2024-02-08', rarityPct: 99 },

  // READY — two single-action unlocks
  'perfect-quiz': {
    status: 'ready',
    rarityPct: 44,
    railPriority: 1,
  },
  'first-review': {
    status: 'ready',
    rarityPct: 38,
    railPriority: 2,
  },

  // IN PROGRESS — two quantitative milestones
  'streak-100': {
    status: 'progress',
    progress: { current: 41, target: 100, unit: 'days' },
    personalBest: { value: 41, unit: 'days' },
    rarityPct: 4,
    railPriority: 3,
  },
  'premium-1y': {
    status: 'progress',
    progress: { current: 322, target: 365, unit: 'days' },
    rarityPct: 31,
    railPriority: 4,
  },
}

/* ─── McKissock — the 14/14 streak narrative ─────────────────────────
   Mid-engagement member: just tied their 14-day PB. Next quantitative
   unlock is 30-day streak (14/30). Plus Perfect Quiz as a ready

/* ─── Elite — the 22-day streak / new-PB narrative ───────────────────
   Already past their PB. Quantitative milestone is 30-day streak (22/30,
   almost there). Single-action is first-try-pass — they just sat a board
   exam. */
const _ELITE: Partial<Record<string, AchievementUserState>> = {
  welcome: { status: 'earned', earnedOn: '2025-04-22', rarityPct: 95 },
  'first-login': { status: 'earned', earnedOn: '2025-04-22', rarityPct: 99 },
  'first-course': { status: 'earned', earnedOn: '2025-05-30', rarityPct: 92 },
  'streak-3': { status: 'earned', earnedOn: '2026-05-01', rarityPct: 78 },
  'streak-7': { status: 'earned', earnedOn: '2026-05-05', rarityPct: 62 },
  'streak-14': { status: 'earned', earnedOn: '2026-05-12', rarityPct: 38 },
  'first-cert': { status: 'earned', earnedOn: '2025-12-08', rarityPct: 71 },
  'five-courses': { status: 'earned', earnedOn: '2026-02-14', rarityPct: 54 },
  'ten-courses': { status: 'earned', earnedOn: '2026-04-30', rarityPct: 28 },
  'path-done': { status: 'earned', earnedOn: '2026-05-17', rarityPct: 18 },
  // READY
  'first-try-pass': {
    status: 'ready',
    rarityPct: 8,
    railPriority: 1,
  },
  // IN PROGRESS
  'streak-30': {
    status: 'progress',
    progress: { current: 22, target: 30, unit: 'days' },
    personalBest: { value: 22, unit: 'days' },
    rarityPct: 22,
    railPriority: 2,
  },
  'twenty-five-courses': {
    status: 'progress',
    progress: { current: 11, target: 25, unit: 'courses' },
    rarityPct: 12,
    railPriority: 3,
  },
}

/* ─── STC — the 0/35 lapsed narrative ─────────────────────────────────
   Lapsed long-time member. The rail is a comeback nudge:
   - READY: streak-3 — the smallest possible re-engagement step
   - IN PROGRESS: only the slow-burn renewal counts apply (3 renewals at
     1/3). No active streaks. */
const _STC: Partial<Record<string, AchievementUserState>> = {
  welcome: { status: 'earned', earnedOn: '2022-07-12', rarityPct: 95 },
  'first-login': { status: 'earned', earnedOn: '2022-07-12', rarityPct: 99 },
  'verified-pro': { status: 'earned', earnedOn: '2022-08-04', rarityPct: 82 },
  'first-course': { status: 'earned', earnedOn: '2022-08-20', rarityPct: 92 },
  'first-cert': { status: 'earned', earnedOn: '2022-11-03', rarityPct: 71 },
  renewed: { status: 'earned', earnedOn: '2025-06-15', rarityPct: 36 },
  // READY — comeback nudge as a single-action prompt
  'streak-3': {
    status: 'ready',
    personalBest: { value: 35, unit: 'days' },
    rarityPct: 78,
    railPriority: 1,
  },
  // IN PROGRESS — only slow-burn counts
  'three-renewals': {
    status: 'progress',
    progress: { current: 1, target: 3, unit: 'renewals' },
    rarityPct: 14,
    railPriority: 2,
  },
}

/** Resolve the user-state map. XCEL had no case of its own and fell to the
 *  `default` arm, so it keeps the same map it always read. */
export function userStateMapFor(
  _brand: Brand,
): Partial<Record<string, AchievementUserState>> {
  return _CRE
}

/** Best-effort sanity check during prototype: ids in a user-state map
 *  must exist in the catalog. Logs a dev warning rather than throwing
 *  so a stray legacy id doesn't break the build. */
if (import.meta.env.DEV) {
  const knownIds = new Set(ACHIEVEMENT_CATALOG.map((d) => d.id))
  for (const [brand, map] of [['xcel', _CRE]] as const) {
    for (const id of Object.keys(map)) {
      if (!knownIds.has(id)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[achievements] brand "${brand}" references unknown id "${id}".`,
        )
      }
    }
  }
}
