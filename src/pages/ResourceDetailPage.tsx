import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  findLibraryResourceById,
  type LibraryResource,
} from '@/data/membership/libraryFixtures'
import { ResourceDetailShell } from '@/components/resources/ResourceDetailShell'
import {
  ArticleBody,
  EbookBody,
  InfographicBody,
  PdfBody,
  TemplateBody,
  VideoBody,
} from '@/components/resources/ResourceVariantBodies'

/**
 * Detail page for a single Resource Library resource — replaces the
 * earlier mobile-only build. Reads `:id` from the URL, resolves the
 * matching `LibraryResource` across every brand, and renders the
 * `<ResourceDetailShell>` (back link + title + meta + description)
 * with a type-specific body underneath.
 *
 *   Article          → `<ArticleBody>` — dark frame + cover-fit hero
 *   Video            → `<VideoBody>` — dark frame + video controls
 *   Webinar Rec.     → `<VideoBody>` — same player, longer runtime
 *   Infographic      → `<InfographicBody>` — PDF-viewer mock
 *   E-book           → `<EbookBody>` — magazine viewer with page nav
 *   Template         → `<TemplateBody>` — "Preview Unavailable" + CTA
 *
 * Source-of-truth Figma: `YHxxKYdMoUXSc3JZcYt4tV` → node `20:3889`
 * (Learning Resources Viewer).
 *
 * Unknown / removed IDs render a small empty-state card with a
 * "Back to library" link instead of crashing.
 */
export function ResourceDetailPage({
  resourceId,
  embedded = false,
  onBack,
}: {
  /** When set (embedded in the Dashboard Rebrand shell), resolve this resource
   *  instead of reading `:id` from the route. */
  resourceId?: string
  /** Drop the standalone page background + outer cap so the viewer sits inside
   *  the shell content column. */
  embedded?: boolean
  /** In-shell back handler — turns the shell's "Back to Resource Library" link
   *  into a launcher-close button. */
  onBack?: () => void
} = {}) {
  const params = useParams<{ id: string }>()
  const id = resourceId ?? params.id
  const match = id ? findLibraryResourceById(id) : null

  if (!match) {
    return <NotFoundState id={id} />
  }

  const { resource } = match

  return (
    <ResourceDetailShell resource={resource} embedded={embedded} onBack={onBack}>
      {renderBody(resource)}
    </ResourceDetailShell>
  )
}

/** Resolves the resource to the right body component. A real
 *  `pdfUrl` short-circuits the type switch (any variant can ship a
 *  PDF and get the embedded reader). Otherwise the switch on
 *  `resource.type` is exhaustive — adding a new
 *  `LibraryResourceType` value will cause TypeScript to flag this
 *  fn until a case is added. */
function renderBody(resource: LibraryResource) {
  if (resource.pdfUrl) {
    return <PdfBody pdfUrl={resource.pdfUrl} resourceTitle={resource.title} />
  }
  switch (resource.type) {
    case 'article':
      return <ArticleBody resource={resource} />
    case 'video':
      return <VideoBody resource={resource} />
    case 'webinar-recording':
      // Webinars are visually identical to Video in the Figma —
      // they just tend to run longer, so we pass a longer runtime
      // stamp into the player.
      return <VideoBody resource={resource} runtime="0:00 / 13:42" />
    case 'infographic':
      return <InfographicBody resource={resource} />
    case 'e-book':
      return <EbookBody resource={resource} />
    case 'template':
      return <TemplateBody downloadUrl={resource.downloadUrl} />
  }
}

/* ─── not-found state ──────────────────────────────────────────────── */

function NotFoundState({ id }: { id: string | undefined }) {
  return (
    <div style={notFoundStyle}>
      <h1 style={notFoundTitleStyle}>Resource not found</h1>
      <p style={notFoundBodyStyle}>
        {id
          ? `We couldn't find a resource with id "${id}".`
          : "We couldn't find that resource."}
      </p>
      <Link to="/membership?tab=library" style={notFoundLinkStyle}>
        Back to the Resource Library
      </Link>
    </div>
  )
}

const notFoundStyle: CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '64px 24px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
}

const notFoundTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 24,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const notFoundBodyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-secondary)',
  maxWidth: 360,
}

const notFoundLinkStyle: CSSProperties = {
  marginTop: 8,
  color: 'var(--color-cta-500)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
}
