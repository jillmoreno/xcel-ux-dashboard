/**
 * Home "Recommended for you" card-style A/B — dedicated single-arm test builds
 * for the testing group (mirrors the upsell's opt1upsell / opt2upsell).
 *
 * The team creates a SEPARATE Netlify project per arm, all deploying THIS repo
 * from `main`. Each project sets a build-time env var to pin which arm it is, so
 * a bare visit to that project's root auto-lands on the arm's Home (see `App`) —
 * the clean single URL "just works", with no per-project code and no divergent
 * branch. A plain deploy with no env var (e.g. the main site) is unaffected.
 *
 *   VITE_REC_CARD_ARM         = compact | trending     (required to activate)
 *   VITE_REC_CARD_MEMBERSHIP  = member  | non-member   (optional; default non-member)
 *
 * Non-member is the default because the testing group reviews the non-member
 * experience. The redirect hides all prototype chrome (`chrome=off`).
 */
export type RecCardVariant = 'compact' | 'trending'
export type RecCardMembership = 'member' | 'non-member'
export type RecCardTarget = { variant: RecCardVariant; membership: RecCardMembership }

/** The arm + membership this deploy is pinned to via its build-time env vars, or
 *  `null` when unpinned (the normal full app — the main site). */
export function recCardEnvTarget(): RecCardTarget | null {
  const arm = import.meta.env.VITE_REC_CARD_ARM
  if (arm !== 'compact' && arm !== 'trending') return null
  const membership: RecCardMembership =
    import.meta.env.VITE_REC_CARD_MEMBERSHIP === 'member' ? 'member' : 'non-member'
  return { variant: arm, membership }
}

/** In-app path that pins an arm on the CRE Home with all prototype chrome hidden
 *  (`chrome=off` → no prototype bar / demo controls) so it reads as a real web
 *  session — but keeps the left nav + the normal app header. Shared by the
 *  env-pin redirect + the Testing-tab tile links so they can't drift. */
export function recCardTestPath(
  variant: RecCardVariant,
  membership: RecCardMembership = 'member',
): string {
  return `/dashboard-rebrand?brand=cre&membership=${membership}&ff=home-recommended-card-ab:${variant}&chrome=off`
}
