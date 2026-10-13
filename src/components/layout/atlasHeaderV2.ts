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
export const ATLAS_HEADER_V2_VERSIONS: readonly string[] = ['eric-atlas-v2', 'eric-atlas-v3', 'eric-atlas-white']

/** The two-row header's height: the 24px eyebrow + the 72px main row. */
export const ATLAS_HEADER_V2_HEIGHT = 96

/** Hook — reads the flag unconditionally; desktop is the caller's to add. */
export function useAtlasHeaderV2(versionId: string | null | undefined): boolean {
  const on = useFeatureFlag('atlas-header-v2').enabled
  return on && !!versionId && ATLAS_HEADER_V2_VERSIONS.includes(versionId)
}
