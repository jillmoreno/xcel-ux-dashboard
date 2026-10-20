import { useFeatureFlag } from '@/context/FeatureFlagContext'

/**
 * WHERE THE TWO-ROW ATLAS HEADER REPLACES THE SLIM ONE (2026-10-13) — the
 * `atlas-header-v2` flag, on Eric's Atlas versions only. The flag's own
 * `versions` only decides where the Design bar SHOWS the control; this list
 * is what stops a default-on flag from also changing the Atlas/Compass
 * Global Navigation version, which is not Eric's.
 *
 * Read by `Header` (which header to draw) and `PlatformShell` (how tall it is,
 * so the rails pin under it). Both must ask the same question.
 */
/* ⚠ `jill-atlas-main` RIDES WITH `eric-atlas-e2e` (2026-10-20). It is the
   demo's duplicate and differs only in its Home file, so it wears the demo's
   header — a copy drawing the SLIM header under the same Home would be a
   comparison about chrome, which is not what it was taken for. */
export const ATLAS_HEADER_V2_VERSIONS: readonly string[] = ['eric-atlas-v2', 'eric-atlas-v3', 'eric-atlas-white', 'eric-atlas-e2e', 'jill-atlas-main']

/** The two-row header's height: the 24px eyebrow + the 72px main row. */
export const ATLAS_HEADER_V2_HEIGHT = 96

/** Hook — reads the flag unconditionally; desktop is the caller's to add. */
export function useAtlasHeaderV2(versionId: string | null | undefined): boolean {
  const on = useFeatureFlag('atlas-header-v2').enabled
  return on && !!versionId && ATLAS_HEADER_V2_VERSIONS.includes(versionId)
}
