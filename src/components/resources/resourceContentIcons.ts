import {
  FileText,
  Notebook,
  Eye,
  Video,
  Monitor,
  Podcast,
  Book,
  ClipboardList,
} from '@/icons'
import type { ResourceAttachmentKind } from '@/data/resourceUpdatesFixtures'

/**
 * Icon + tint per resource content type — the component-layer companion to the
 * data-layer `CONTENT_TYPE_META` (label / verb / viewer / isMedia). Kept in its
 * own module (not the component file) so exporting it doesn't break React fast
 * refresh. Glyphs align to the Library `LIBRARY_TYPE_ICON` language where the
 * types overlap (article→FileText-family, infographic→Eye, video→Video,
 * webinar→Monitor, e-book→Book, template→ClipboardList); pdf + podcast are the
 * viewer-specific additions. Each type gets a distinct tint (color is never the
 * sole signal — the icon + text label carry the type too).
 */
export const ATTACHMENT_ICON: Record<
  ResourceAttachmentKind,
  { Icon: typeof FileText; bg: string; fg: string }
> = {
  pdf: { Icon: FileText, bg: 'var(--color-error-100)', fg: 'var(--color-error-600)' },
  article: { Icon: Notebook, bg: 'var(--color-info-100)', fg: 'var(--color-info-700)' },
  infographic: { Icon: Eye, bg: 'var(--color-tertiary-100)', fg: 'var(--color-tertiary-700)' },
  video: { Icon: Video, bg: 'var(--color-secondary-100)', fg: 'var(--color-secondary-700)' },
  webinar: { Icon: Monitor, bg: 'var(--color-primary-100)', fg: 'var(--color-primary-700)' },
  podcast: { Icon: Podcast, bg: 'var(--color-cta-100)', fg: 'var(--color-cta-700)' },
  'e-book': { Icon: Book, bg: 'var(--color-warning-100)', fg: 'var(--color-warning-700)' },
  template: { Icon: ClipboardList, bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-700)' },
}
