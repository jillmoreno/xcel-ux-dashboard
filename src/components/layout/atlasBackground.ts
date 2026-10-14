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
  // Until this time, a mismatch is put right, never read as a pick. A fresh
  // `?demo=1` load resets the flags AFTER this mounts — sometimes after its
  // first sync has already landed — and that reset (back to Toned) must not
  // send a White page to WIP. Picks happen later, by hand.
  const syncUntil = useRef(0)

  useEffect(() => {
    const onToned = version === ATLAS_BACKGROUND_VERSIONS.toned
    const onWhite = version === ATLAS_BACKGROUND_VERSIONS.white
    const current = onWhite ? 'white' : 'toned'
    if (lastVersion.current !== version) {
      // The VERSION moved (or first load): the control follows the page.
      lastVersion.current = version
      syncUntil.current = Date.now() + 1500
    }
    const pickedChanged = picked !== lastPicked.current
    lastPicked.current = picked
    if (!onToned && !onWhite || picked === current) return
    if (Date.now() < syncUntil.current) {
      // Settling: match the page (a tick later, past any reset in flight).
      window.setTimeout(() => setVariant('atlas-background', current), 0)
      return
    }
    if (!pickedChanged) return
    // The CONTROL moved, by hand: the page follows it.
    const target = ATLAS_BACKGROUND_VERSIONS[picked as keyof typeof ATLAS_BACKGROUND_VERSIONS]
    if (!target || target === version) return
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('version', target)
      return next
    })
  }, [picked, version, setVariant, setParams])
}
