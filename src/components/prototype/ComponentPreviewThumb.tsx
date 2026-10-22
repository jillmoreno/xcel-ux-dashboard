import type { CSSProperties, ReactNode } from 'react'
import type { PrototypeFeature } from '@/data/prototypeFeatures'
import { atlasHandoffThumbRender, atlasHandoffThumbWidth } from './atlasHandoffPreviewsRegistry'
import { FeaturePreviewThumb } from './FeaturePreviewThumb'

/**
 * A ZOOMED PICTURE OF THE COMPONENT A FEATURE IS ABOUT, falling back to a
 * scaled picture of the whole page when there isn't one.
 *
 * ⚠ ONE COMPONENT FOR BOTH SURFACES (2026-10-21, Jillienne: "have these images
 * match"). The feature header had just been changed to show the real component
 * and the project rows on the landing page were still showing a 1440px page
 * scaled to 160px — the same feature illustrated two different ways depending
 * on which screen you were looking at. Whatever the row shows, the header it
 * links to now shows the same thing, larger.
 *
 * The render comes from the same registry the States section draws from, so the
 * picture cannot drift from the component: it IS the component.
 *
 * Falls back to `FeaturePreviewThumb` for features with no registered render —
 * the standalone HTML explorations, and any component whose states are page
 * chrome rather than props.
 */
export function ComponentPreviewThumb({
  feature,
  src,
  width,
  height,
  radius = 'var(--radius-lg)',
  style,
}: {
  feature: PrototypeFeature
  src: string | null
  width: number
  height: number
  radius?: string
  style?: CSSProperties
}): ReactNode {
  const first = feature.devHandoff?.uiComponents?.[0]
  const live = first ? atlasHandoffThumbRender(first.id) : undefined
  /* The width the component is drawn at before scaling — its own, when it has
     declared one. See `ATLAS_THUMB_WIDTH`. */
  const renderW = (first && atlasHandoffThumbWidth(first.id)) ?? RENDER_W

  if (!live) {
    return (
      <FeaturePreviewThumb
        feature={feature}
        src={src}
        width={width}
        height={height}
        style={{ display: 'block', borderRadius: radius, flex: 'none', ...style }}
      />
    )
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width,
        height,
        flex: 'none',
        overflow: 'hidden',
        borderRadius: radius,
        border: '1px solid var(--color-border-subtle)',
        background: 'var(--color-fixed-light)',
        ...style,
      }}
    >
      {/* ⚠ ABSOLUTE AND TRANSLATED, not a flex child. A scaled element keeps its
          PRE-transform height in layout, so an 880px-wide card scaled to a third
          still occupies its full height and `alignItems: center` has nothing
          useful to centre — the card ends up jammed into the top-left corner.
          Taking it out of flow and centring by transform is what works. */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: renderW,
          transform: `scale(${width / renderW}) translateY(-50%)`,
          transformOrigin: 'left top',
          pointerEvents: 'none',
        }}
      >
        {live}
      </div>
    </div>
  )
}

/* The DEFAULT width a component is rendered at before scaling — the course
   card's own 800 plus its panel, so every size is a true scaled render of the
   real thing rather than the component reflowed into a narrow box.
   ⚠ A narrow component overrides it: see `ATLAS_THUMB_WIDTH`. */
const RENDER_W = 880
