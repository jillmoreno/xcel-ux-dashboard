import type { Brand, Membership } from '@/context/AccountContext'
import type { PrototypeFeature } from '@/data/prototypeFeatures'

/**
 * The picture of a feature: what its Live Preview actually shows.
 *
 * Shared by the gateway header and the UX dashboard's project rows so the two
 * cannot drift — the list and the walkthrough should not disagree about what a
 * feature looks like.
 */

/** Embed URL for a route. External absolute URLs embed verbatim; internal ones
 *  get the BASE_URL prefix and the demo brand/membership params. */
export function buildEmbedSrc(to: string, brand?: Brand, membership?: Membership): string {
  if (/^https?:\/\//i.test(to)) return to
  const [path, query = ''] = to.replace(/^\//, '').split('?')
  const params = new URLSearchParams(query)
  if (brand && !params.has('brand')) params.set('brand', brand)
  if (membership && !params.has('membership')) params.set('membership', membership)
  const qs = params.toString()
  return `${import.meta.env.BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

/** The feature's canonical preview: an absolute `livePreviewUrl`, else the FIRST
 *  `pages` entry (so order `pages` with the canonical view first), else the
 *  tile's own route. */
export function primaryPreviewSrc(feature: PrototypeFeature, brand?: Brand): string | null {
  const external =
    feature.livePreviewUrl && /^https?:\/\//i.test(feature.livePreviewUrl)
      ? feature.livePreviewUrl
      : null
  const first = feature.pages?.[0]
  const to = external ?? first?.to ?? feature.livePreviewUrl ?? feature.to ?? null
  if (!to) return null
  const membership = first?.membership ?? feature.account?.membership
  return buildEmbedSrc(to, brand ?? first?.brand ?? feature.account?.brand, membership)
}

/** The frame is rendered at this width and scaled down — loading the app at
 *  thumbnail width would give its MOBILE layout, which is a picture of a
 *  different design. */
export const PREVIEW_FRAME_W = 1440

