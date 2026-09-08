/**
 * Demo fixtures for the "Learning Resources Updates" prototype tile
 * (`/resource-updates`). Self-contained so the demo never destabilizes
 * the shared Learning Library / `/resources/:id` fixtures.
 *
 * Drives two new resource-viewer features on a single Elite (Healthcare)
 * resource:
 *   1. Attachments — 0 / 1 / 2+ (count-driven treatment; see ResourceRail).
 *   2. Suggested Similar Topics — a YouTube-style related-resources pane.
 *
 * TODO(data): replace with the content service's per-resource
 * `attachments[]` + a `/api/resources/:id/related` recommendation feed.
 * The recommendation ranking (same-category → same-profession → popular)
 * lives server-side; the client just renders the ordered list + reason.
 */

/**
 * Canonical resource content-type set — the single source of truth for every
 * modality the resource viewer handles. It reconciles the prototype's
 * previously-separate taxonomies into ONE union:
 *   • Learning Library `LibraryResourceType` — article · e-book · infographic ·
 *     template · video · webinar-recording (here `webinar`).
 *   • PDF — an asset the Library treats as a `pdfUrl` overlay, promoted to a
 *     first-class type here (it's the most common attachment).
 *   • podcast — the course/media `delivery` audio type (Library has no audio).
 *
 * Course *delivery* values that are NOT resource content (online · in-person ·
 * classroom) are intentionally excluded — they describe how a course is taken,
 * not a file/asset you can attach or suggest. See CONTENT_TYPE_META for the
 * label / action verb / viewer body each type maps to.
 */
export type ResourceContentType =
  | 'pdf'
  | 'article'
  | 'infographic'
  | 'video'
  | 'webinar'
  | 'podcast'
  | 'e-book'
  | 'template'

/** Attachments can be ANY content type (previously limited to 4). */
export type ResourceAttachmentKind = ResourceContentType

export type ResourceContentMeta = {
  /** Display label (matches the Library `TYPE_LABELS` where they overlap). */
  label: string
  /** Primary action verb for an attachment / open action. */
  verb: string
  /** The `ResourceVariantBodies` viewer that renders this type in the resource
   *  viewer (or a note where none exists yet). */
  viewer: string
  /** Media types get a play/listen affordance + a duration stamp. */
  isMedia: boolean
}

/**
 * One map, every modality. Icons live in the component layer (ResourceRail's
 * `ATTACHMENT_ICON`, aligned to the Library `LIBRARY_TYPE_ICON` where the types
 * overlap) so this data module stays icon-free.
 */
export const CONTENT_TYPE_META: Record<ResourceContentType, ResourceContentMeta> = {
  pdf: { label: 'PDF', verb: 'View', viewer: 'PdfBody (embedded <object>)', isMedia: false },
  article: { label: 'Article', verb: 'Read', viewer: 'ArticleBody', isMedia: false },
  infographic: { label: 'Infographic', verb: 'View', viewer: 'InfographicBody (PDF-viewer mock)', isMedia: false },
  video: { label: 'Video', verb: 'Play', viewer: 'VideoBody', isMedia: true },
  webinar: { label: 'Webinar Recording', verb: 'Play', viewer: 'VideoBody (longer runtime)', isMedia: true },
  podcast: { label: 'Podcast', verb: 'Listen', viewer: 'audio player — NowPlayingBar / PodcastSheet (no ResourceVariantBody yet)', isMedia: true },
  'e-book': { label: 'E-book', verb: 'Open', viewer: 'EbookBody (magazine viewer)', isMedia: false },
  template: { label: 'Template', verb: 'Download', viewer: 'TemplateBody (download-only)', isMedia: false },
}

export type ResourceAttachment = {
  id: string
  title: string
  kind: ResourceAttachmentKind
  /** Divider-free meta line, e.g. "PDF · 7 pages · 1.2 MB". */
  meta: string
  /** Primary action verb. Optional — falls back to CONTENT_TYPE_META[kind].verb. */
  actionLabel?: string
}

/** Accent ramp key for a suggestion thumbnail (maps to a token gradient
 *  in ResourceRail — never a raw hex). */
export type SuggestionAccent = 'blue' | 'teal' | 'orange' | 'red' | 'info' | 'purple'

export type SuggestedResource = {
  id: string
  title: string
  /** Content-type label shown in the meta line + the still-image chip. */
  typeLabel: string
  category: string
  /** Trailing meta token, e.g. "7 min" or "Video". */
  meta: string
  rating: number
  /** "Why you're seeing this" tag — gated behind the reason-chips flag. */
  reason: string
  accent: SuggestionAccent
  /** Cover image for the thumbnail. Falls back to the accent gradient when unset. */
  image?: string
  /** Video/webinar cards get a play affordance + duration stamp. */
  isVideo?: boolean
  /** Duration stamp for video cards, e.g. "6:00". */
  duration?: string
}

export type ResourceUpdatesDemo = {
  id: string
  title: string
  typeLabel: string
  category: string
  rating: number
  description: string
  /** Big stylized wordmark rendered over the viewer hero (no licensed art). */
  heroLabel: string
  /** Attachment sets keyed by demo scenario. */
  attachmentSets: Record<AttachmentScenario, ResourceAttachment[]>
  suggested: SuggestedResource[]
}

export type AttachmentScenario = 'none' | 'one' | 'multi'

/* ─── Elite (Healthcare) demo resource ─────────────────────────────── */

// One attachment per content type — the `multi` set below spans the full
// modality range so the demo shows every type the viewer supports (not just
// the original four). `actionLabel` is optional; it falls back to
// CONTENT_TYPE_META[kind].verb.
const PDF: ResourceAttachment = {
  id: 'att-meds-pdf',
  title: '50 Must-Know Medications (PDF)',
  kind: 'pdf',
  meta: 'PDF · 7 pages · 1.2 MB',
}

const INFOGRAPHIC: ResourceAttachment = {
  id: 'att-meds-classes-infographic',
  title: 'Medication Classes at a Glance',
  kind: 'infographic',
  meta: 'Infographic · 1 page',
}

const ARTICLE: ResourceAttachment = {
  id: 'att-high-alert-meds',
  title: 'High-Alert Medications: A Primer',
  kind: 'article',
  meta: 'Article · 6 min read',
}

const VIDEO: ResourceAttachment = {
  id: 'att-meds-safety-video',
  title: 'Medication Safety Basics',
  kind: 'video',
  meta: 'Video · 6:18',
}

const WEBINAR: ResourceAttachment = {
  id: 'att-med-errors-webinar',
  title: 'Preventing Medication Errors (Webinar)',
  kind: 'webinar',
  meta: 'Webinar Recording · 42:10',
}

const PODCAST: ResourceAttachment = {
  id: 'att-pharm-quick-hits',
  title: 'Pharmacology Quick Hits',
  kind: 'podcast',
  meta: 'Podcast · 18:24',
}

const EBOOK: ResourceAttachment = {
  id: 'att-meds-reference-guide',
  title: 'Essential Reference Guide',
  kind: 'e-book',
  meta: 'E-book · 22 pages',
}

const WORKSHEET: ResourceAttachment = {
  id: 'att-meds-worksheet',
  title: 'Essential Meds Worksheet',
  kind: 'template',
  meta: 'Template · XLSX · 84 KB',
}

export const RESOURCE_UPDATES_DEMO: ResourceUpdatesDemo = {
  id: 'elite-must-know-meds',
  title: '50 Must-Know Medications for Nurses',
  typeLabel: 'Infographic',
  category: 'Medical Reference',
  rating: 5.0,
  description:
    'A handy printable cheat sheet reviewing 50 must-know medications for nurses.',
  heroLabel: 'Medications for Nurses',
  attachmentSets: {
    none: [],
    one: [PDF],
    // Spans all eight content types so the collapsed block demonstrates the
    // full modality range.
    multi: [PDF, INFOGRAPHIC, ARTICLE, VIDEO, WEBINAR, PODCAST, EBOOK, WORKSHEET],
  },
  suggested: [
    {
      id: 'elite-ekg-cheat-sheet',
      image: '/library/elite-ekg-cheat-sheet.png',
      title: 'EKG Cheat Sheet',
      typeLabel: 'Infographic',
      category: 'Medical Reference',
      meta: '7 min',
      rating: 4.8,
      reason: 'Same topic',
      accent: 'orange',
    },
    {
      id: 'elite-intradermal-injections',
      image: '/library/elite-intradermal-injections.png',
      title: 'Intradermal Injections',
      typeLabel: 'Video',
      category: 'Clinical Skills',
      meta: 'Video',
      rating: 4.6,
      reason: 'Related to medications',
      accent: 'info',
      isVideo: true,
      duration: '6:00',
    },
    {
      id: 'elite-pulmonary-embolism',
      image: '/library/elite-pulmonary-embolism.png',
      title: 'Pulmonary Embolism',
      typeLabel: 'Video',
      category: 'Diagnosis',
      meta: 'Video',
      rating: 4.8,
      reason: 'Popular with nurses',
      accent: 'red',
      isVideo: true,
      duration: '11:00',
    },
    {
      id: 'elite-apical-pulse',
      image: '/library/elite-apical-pulse.png',
      title: 'Apical Pulse Assessment',
      typeLabel: 'Video',
      category: 'Clinical Skills',
      meta: 'Video',
      rating: 4.9,
      reason: 'Assessment skills',
      accent: 'teal',
      isVideo: true,
      duration: '7:00',
    },
    {
      id: 'elite-iv-piggyback',
      image: '/library/elite-iv-piggyback.png',
      title: '"IV Piggyback" AKA Secondary IV Tubing',
      typeLabel: 'Video',
      category: 'Clinical Skills',
      meta: 'Video',
      rating: 4.4,
      reason: 'Medication delivery',
      accent: 'blue',
      isVideo: true,
      duration: '9:00',
    },
    {
      id: 'elite-ostomy-care',
      image: '/library/elite-ostomy-care.png',
      title: 'Ostomy Cheat Sheet',
      typeLabel: 'Infographic',
      category: 'Clinical Skills',
      meta: '6 min',
      rating: 3.7,
      reason: 'Quick reference',
      accent: 'orange',
    },
  ],
}

/** Validate + resolve a `?scenario=` param to an AttachmentScenario. */
export function attachmentScenarioFromParam(
  value: string | null | undefined,
): AttachmentScenario {
  return value === 'none' || value === 'one' || value === 'multi'
    ? value
    : 'multi'
}

/* ─── Viewer-body demo (the "original item" per content type) ───────── */

/**
 * The main resource viewer renders a `ResourceVariantBody` per content type
 * (the five Figma designs — Video 19:487 · Webinar 19:3545 · Article 19:3640 ·
 * E-book 19:3452 · Template 19:584 — plus Infographic). Each demo type resolves
 * to a REAL Elite Learning Library record (via findLibraryResourceById) so the
 * viewer shows real content + the record's actual cover art. These are exactly
 * the resources the Figma frames were designed from.
 *
 * Values are `LibraryResourceType`s (the viewer switch is on `resource.type`) —
 * note `webinar-recording` here maps to the canonical `webinar` content type.
 */
export type ResourceViewerType =
  | 'infographic'
  | 'video'
  | 'webinar-recording'
  | 'article'
  | 'e-book'
  | 'template'

export const RESOURCE_VIEWER_LIBRARY_IDS: Record<ResourceViewerType, string> = {
  infographic: 'elite-must-know-meds',
  video: 'elite-intradermal-injections',
  'webinar-recording': 'elite-new-grad-pitfalls',
  article: 'elite-9-ways-use-your-degree',
  'e-book': 'elite-nursing-career-compass-2024',
  template: 'elite-head-to-toe-assessment',
}

/** Switcher order + the Figma node each design came from (for the handoff). */
export const RESOURCE_VIEWER_ORDER: {
  type: ResourceViewerType
  label: string
  figmaNode: string
}[] = [
  { type: 'infographic', label: 'Infographic', figmaNode: '20:3889' },
  { type: 'video', label: 'Video', figmaNode: '19:487' },
  { type: 'webinar-recording', label: 'Webinar', figmaNode: '19:3545' },
  { type: 'article', label: 'Article', figmaNode: '19:3640' },
  { type: 'e-book', label: 'E-book', figmaNode: '19:3452' },
  { type: 'template', label: 'Template', figmaNode: '19:584' },
]

/** Validate + resolve a `?type=` param to a ResourceViewerType. */
export function resourceViewerTypeFromParam(
  value: string | null | undefined,
): ResourceViewerType {
  return value && value in RESOURCE_VIEWER_LIBRARY_IDS
    ? (value as ResourceViewerType)
    : 'infographic'
}
