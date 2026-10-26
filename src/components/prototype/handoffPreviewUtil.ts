import { atlasHandoffThumbRender } from './atlasHandoffPreviewsRegistry'
import { componentPreviewUrl } from '@/data/prototypeFeatures'

/**
 * Whether `ComponentLivePreview` (PrototypeHandoffDetailPage) has anything to
 * draw for this id — a live registry entry or a resolvable preview URL. The
 * gateway gates its "see it rendered" link on this, so it never offers a
 * picture that resolves to the fallback. Its own module because the detail
 * page exports components and fast refresh wants it kept that way.
 * (Carried from the Common LMS hub 2026-10-26.)
 */
export function hasComponentLivePreview(componentId: string): boolean {
  return Boolean(atlasHandoffThumbRender(componentId)) || componentPreviewUrl(componentId) !== null
}
