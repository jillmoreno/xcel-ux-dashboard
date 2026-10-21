import { atlasSkinFor } from '@/components/layout/atlasBrandSkin'
import { ATLAS_FONT_DEFAULT } from '@/components/layout/atlasFontSets'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'

/**
 * The four attributes the product shell writes onto `<html>` to make the Atlas
 * tokens resolve — `data-brand`, `data-atlas-palette`, `data-atlas-brand` and
 * `data-atlas-font`.
 *
 * ⚠ ALL FOUR, ON ONE ELEMENT. The token rules are COMPOUND selectors
 * (`[data-brand='xcel'][data-atlas-palette][data-atlas-brand='global']`), so
 * every attribute has to sit together or the whole block is skipped. Splitting
 * them across the document and a wrapper is what made the course head's panel
 * come out the wrong colour while every individual attribute looked right.
 *
 * Its own module so `AtlasSurface` (which renders components) and the design
 * spec (which resolves token VALUES against the same context) share one
 * definition — and because `AtlasHandoffPreviews.tsx` may export components
 * only, per `react-refresh/only-export-components`.
 */
export function atlasSurfaceAttrs(brand: string) {
  return {
    'data-brand': brand,
    'data-atlas-palette': 'xcel',
    'data-atlas-brand': ATLAS_HANDOFF_SKIN,
    'data-atlas-font': ATLAS_FONT_DEFAULT,
  }
}

/**
 * The brand skin main's Atlas pages wear, resolved the way the shell resolves
 * it — the `atlas-brand-skin-v3` flag's committed default, through the same
 * validator.
 *
 * ⚠ NOT `ATLAS_SKIN_DEFAULT`, which is the skin a `?skin=` link falls back to
 * and is a different thing. The flag defaults to `global`, and the two produce
 * visibly different pages: `--color-primary-100` is #eceef0 under global and a
 * blue-grey under xcel.
 */
export const ATLAS_HANDOFF_SKIN = atlasSkinFor(
  FEATURE_FLAGS.find((f) => f.key === 'atlas-brand-skin-v3')?.defaultVariant ?? null,
)

/**
 * The two tokens the PAGE re-points for its children, as opposed to the palette
 * the attributes above select.
 *
 * ⚠ WITHOUT THESE THE SPEC DISAGREES WITH THE RENDER (2026-10-21). `WHITE_PAGE`
 * puts every eyebrow on the Atlas home and the progress figures' labels in
 * Neutral 800; a component lifted out of that page draws them in the palette's
 * own default instead. With the attributes alone, the design spec resolved
 * `--color-compass-page-eyebrow` to #5b5560 while the component six inches
 * above it drew #404040 — the spec and the picture, disagreeing on the same
 * page, which is the exact failure this whole section was rebuilt to stop.
 */
export const ATLAS_SURFACE_VARS = {
  ['--color-compass-page-eyebrow' as string]: 'var(--color-neutral-800)',
  ['--atlas-progress-label' as string]: 'var(--color-neutral-800)',
} as const
