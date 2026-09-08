import type { CSSProperties, ComponentType } from 'react'
import { Book, ClipboardList, Eye, FileText, Monitor, Video } from '@/icons'
import type { LibraryResourceType } from '@/data/membership/libraryFixtures'

/**
 * Content-type → icon map, shared by both Resource Library card styles:
 * the shelf `SimpleCard` (Dashboard Rebrand) and the default
 * `LibraryResourceCard` (`/membership?tab=library`). Kept in a plain `.ts`
 * module (no component export) so both cards import the same mapping without a
 * circular dependency between the two card files.
 */
export const LIBRARY_TYPE_ICON: Record<
  LibraryResourceType,
  ComponentType<{ size?: number; style?: CSSProperties }>
> = {
  article: FileText,
  'e-book': Book,
  infographic: Eye,
  template: ClipboardList,
  video: Video,
  'webinar-recording': Monitor,
}
