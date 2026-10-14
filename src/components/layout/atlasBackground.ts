import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFeatureFlag, useFeatureFlags } from '@/context/FeatureFlagContext'

/**
 * THE DESIGN BAR'S "BACKGROUND" CONTROL (2026-10-14, Eric's request) — on
 * Eric/Atlas WIP and Eric/Atlas White, which show the same Home: Toned is WIP
 * (its warm page, the card shadowed), White is White (the white page, the
 * card flat).
 *
 * The control is a design flag (`atlas-background`), but THE VERSION IS THE
 * TRUTH: picking an option switches `?version=`, and arriving on either
 * version sets the option to match. So the control never disagrees with the
 * page, whichever way the version changed (this control, the version picker,
 * a link).
 */
export const ATLAS_BACKGROUND_VERSIONS = { toned: 'eric-atlas-v3', white: 'eric-atlas-white' } as const

/** Hook — keeps `atlas-background` and `?version=` in step. Unconditional. */
export function useAtlasBackgroundSwitch(): void {
  const [params, setParams] = useSearchParams()
  const { setVariant } = useFeatureFlags()
  const picked = useFeatureFlag('atlas-background').variant
  const version = params.get('version')
  // What the last run saw, so a run can tell WHICH side moved.
  const lastVersion = useRef<string | null | undefined>(undefined)
  const lastPicked = useRef<string | undefined>(undefined)
  // A sync this hook has asked for and not yet seen land. Until it lands, a
  // change of the control is not a pick — on a fresh `?demo=1` load the flag
  // provider resets its values AFTER this mounts, which is also why the sync
  // waits a tick (it would otherwise be overwritten).
  const expected = useRef<string | null>(null)

  useEffect(() => {
    const onToned = version === ATLAS_BACKGROUND_VERSIONS.toned
    const onWhite = version === ATLAS_BACKGROUND_VERSIONS.white
    const current = onWhite ? 'white' : 'toned'
    if (lastVersion.current !== version) {
      // The VERSION moved (or first load): the control follows the page.
      lastVersion.current = version
      lastPicked.current = picked
      expected.current = null
      if ((onToned || onWhite) && picked !== current) {
        expected.current = current
        window.setTimeout(() => setVariant('atlas-background', current), 0)
      }
      return
    }
    if (expected.current) {
      if (picked === expected.current) {
        expected.current = null
        lastPicked.current = picked
      }
      return
    }
    if (picked !== lastPicked.current) {
      // The CONTROL moved: the page follows it.
      lastPicked.current = picked
      if (!onToned && !onWhite) return
      const target = ATLAS_BACKGROUND_VERSIONS[picked as keyof typeof ATLAS_BACKGROUND_VERSIONS]
      if (!target || target === version) return
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('version', target)
        return next
      })
    }
  }, [picked, version, setVariant, setParams])
}
