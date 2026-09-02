import { useState } from 'react'
import type { PrototypeFeature } from '@/data/prototypeFeatures'
import { PREVIEW_FRAME_W } from './featurePreviewSrc'

/**
 * A live, inert miniature of the feature's preview.
 *
 * Prefers the feature's authored `thumbnail` (a flat image, nothing to boot)
 * and otherwise renders the same URL the Live Preview tab loads. A live frame
 * rather than a capture because there is no build step here to re-shoot
 * captures, so a static one starts drifting the moment the screen changes.
 *
 * `chrome=off` hides the dark prototype bar — at thumbnail scale its rotating
 * quote is a sixth of the picture spent on something that is not the feature.
 * The frame is inert (`pointer-events: none`, `tabIndex={-1}`, `aria-hidden`)
 * so it reads as a picture, not a second copy of the app to interact with.
 *
 * COST: each frame without a `thumbnail` boots the app. One is nothing; a list
 * of them is not — and in this project nine of ten rows point at the same 857KB
 * single-file prototype, so a section renders several copies of it.
 * `loading="lazy"` defers the ones below the fold, and authoring `thumbnail`
 * opts a row out entirely.
 *
 * A MISSING `thumbnail` FALLS BACK TO THE FRAME, and that is load-bearing.
 * Ported from the LMS, this rendered the `<img>` unconditionally: the docs said
 * a missing file "degrades quietly", but nothing implemented it, so authoring a
 * path before capturing the PNG gave a row a broken image. The `onError` swap
 * below makes the documented behaviour true, which is what lets `thumbnail` be
 * authored up front and the screenshots be dropped in afterwards — the order
 * this actually happens in. A deleted PNG likewise reverts to the live frame
 * rather than breaking the row, so removing one is a safe way to retire it.
 */
export function FeaturePreviewThumb({
  feature,
  src,
  width,
  height,
  style,
}: {
  feature: PrototypeFeature
  src: string | null
  width: number
  height: number
  style?: React.CSSProperties
}) {
  const [imgFailed, setImgFailed] = useState(false)
  if (!feature.thumbnail && !src) return null
  const scale = width / PREVIEW_FRAME_W
  const framed = src ? `${src}${src.includes('?') ? '&' : '?'}chrome=off` : null
  // The image wins only while it is actually loadable AND there is something to
  // fall back to; with no `src` a broken image is still better than nothing,
  // since returning null would collapse the row's layout.
  const useImage = feature.thumbnail && (!imgFailed || !framed)
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)',
        background: 'var(--color-surface-card)',
        ...style,
      }}
    >
      {useImage ? (
        <img
          src={feature.thumbnail}
          alt=""
          loading="lazy"
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top left',
            display: 'block',
          }}
        />
      ) : (
        <iframe
          src={framed ?? undefined}
          title=""
          tabIndex={-1}
          loading="lazy"
          style={{
            width: PREVIEW_FRAME_W,
            height: height / scale,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
