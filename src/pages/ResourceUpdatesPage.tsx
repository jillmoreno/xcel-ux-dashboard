import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Star, StarSolid, LockSolid } from '@/icons'
import { useAccount, type Brand, type Membership } from '@/context/AccountContext'
import { ResourceRail } from '@/components/resources/ResourceRail'
import {
  ArticleBody,
  EbookBody,
  InfographicBody,
  TemplateBody,
  VideoBody,
} from '@/components/resources/ResourceVariantBodies'
import {
  findLibraryResourceById,
  CATEGORY_LABELS,
  TYPE_LABELS,
  type LibraryResource,
} from '@/data/membership/libraryFixtures'
import {
  RESOURCE_UPDATES_DEMO,
  RESOURCE_VIEWER_LIBRARY_IDS,
  RESOURCE_VIEWER_ORDER,
  attachmentScenarioFromParam,
  resourceViewerTypeFromParam,
  type ResourceViewerType,
} from '@/data/resourceUpdatesFixtures'

/**
 * Standalone demo page for the "Learning Resources Updates" prototype
 * tile. Renders one Elite (Healthcare) resource with the new combined
 * right rail (Attachments + Suggested Similar Topics).
 *
 * NOT wired into the Dashboard Rebrand shell — this is a focused,
 * self-contained page (like `/onboarding-flow`) so reviewers can click
 * straight into the feature.
 *
 *   ?scenario=none | one | multi   → attachment count (default multi)
 *   ?membership=member | non-member → member view vs the gated upsell
 *   ?brand=elite                    → (demo is Elite-only today)
 *
 * Non-member = the WHOLE resource is gated (Member Exclusive upsell);
 * the rail's new features only render for members.
 */
export function ResourceUpdatesPage() {
  const { brand, membership, setAccount } = useAccount()
  const [params, setParams] = useSearchParams()
  const seeded = useRef(false)

  // One-shot seed from URL params (drives the tile's per-page brand /
  // membership links + the live-preview iframe). Defaults to Elite member.
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    // `?brand=` is no longer read. It selected among six brands; with one in
    // the union it can only resolve to XCEL, and casting the raw param into
    // `Brand` would let a stale link (Elite was the LMS's seed here) assert a
    // value that indexes every fixture as undefined. Restore the param — with
    // a validating lookup, not a cast — if a second brand returns.
    const nextBrand: Brand = 'xcel'
    const nextMembership = (params.get('membership') as Membership | null) ?? 'member'
    if (brand !== nextBrand || membership !== nextMembership) {
      setAccount(nextBrand, nextMembership)
    }
  }, [params, brand, membership, setAccount])

  const scenario = attachmentScenarioFromParam(params.get('scenario'))
  const viewerType = resourceViewerTypeFromParam(params.get('type'))
  const demo = RESOURCE_UPDATES_DEMO
  const attachments = demo.attachmentSets[scenario]
  const isMember = membership === 'member'

  // The "original item" resolves to a real Elite Library record per viewer
  // type, so each modality shows real content + its actual cover.
  const resource = findLibraryResourceById(RESOURCE_VIEWER_LIBRARY_IDS[viewerType])?.resource

  const setViewerType = (type: ResourceViewerType) => {
    const next = new URLSearchParams(params)
    if (type === 'infographic') next.delete('type')
    else next.set('type', type)
    setParams(next, { replace: true })
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <Link to="/prototype/learning-resources-updates" style={backLinkStyle}>
          <ArrowLeft size={16} aria-hidden />
          Back to Learning Resources Updates
        </Link>

        {isMember ? (
          <MemberView
            resource={resource}
            viewerType={viewerType}
            onViewerType={setViewerType}
            attachments={attachments}
          />
        ) : (
          <GatedView title={resource?.title ?? demo.title} />
        )}
      </div>
    </div>
  )
}

/* ─── member view — resource + combined rail ───────────────────────── */

function MemberView({
  resource,
  viewerType,
  onViewerType,
  attachments,
}: {
  resource: LibraryResource | undefined
  viewerType: ResourceViewerType
  onViewerType: (t: ResourceViewerType) => void
  attachments: typeof RESOURCE_UPDATES_DEMO.attachmentSets.multi
}) {
  return (
    <>
      <ViewerTypeSwitcher active={viewerType} onSelect={onViewerType} />
      <div className="cre-ru-split">
        <main style={{ minWidth: 0 }}>
          {resource ? (
            <>
              <div style={titleRowStyle}>
                <h1 style={titleStyle}>{resource.title}</h1>
                <div style={titleActionsStyle}>
                  <button type="button" style={textLinkStyle}>
                    <Download size={16} aria-hidden />
                    Download
                  </button>
                  <button type="button" style={textLinkStyle}>
                    <Star size={16} aria-hidden />
                    Feedback
                  </button>
                </div>
              </div>

              <div style={metaRowStyle}>
                <span style={typeBadgeStyle}>{TYPE_LABELS[resource.type]}</span>
                <span aria-hidden style={dividerStyle} />
                <span
                  style={ratingStyle}
                  aria-label={`Rating ${resource.rating.toFixed(1)} out of 5`}
                >
                  <StarSolid size={14} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
                  {resource.rating.toFixed(1)}
                </span>
                <span aria-hidden style={dividerStyle} />
                <span style={topicStyle}>Topic: {CATEGORY_LABELS[resource.category]}</span>
              </div>

              <p style={descriptionStyle}>{resource.description}</p>

              <div style={viewerBoundsStyle}>{renderViewerBody(resource)}</div>
            </>
          ) : (
            <p style={descriptionStyle}>Resource unavailable.</p>
          )}
        </main>

        <ResourceRail
          attachments={attachments}
          suggested={RESOURCE_UPDATES_DEMO.suggested}
          seeAllLabel="View More"
        />
      </div>
    </>
  )
}

/**
 * Renders the matching `ResourceVariantBody` per content type — the five Figma
 * designs (Video 19:487 · Webinar 19:3545 · Article 19:3640 · E-book 19:3452 ·
 * Template 19:584) plus Infographic. Unlike the production `/resources/:id`
 * page, this switches purely on `resource.type` (it does NOT short-circuit on
 * `pdfUrl`) so the DESIGNED body always shows, not the embedded PDF reader.
 */
function renderViewerBody(resource: LibraryResource): ReactNode {
  switch (resource.type) {
    case 'video':
      return <VideoBody resource={resource} />
    case 'webinar-recording':
      return <VideoBody resource={resource} runtime="0:00 / 1:34:12" />
    case 'article':
      return <ArticleBody resource={resource} />
    case 'infographic':
      return <InfographicBody resource={resource} />
    case 'e-book':
      return <EbookBody resource={resource} />
    case 'template':
      return <TemplateBody downloadUrl={resource.downloadUrl} />
  }
}

/** "View as" segmented control — flips the main viewer between the six content
 *  types (drives ?type=). */
function ViewerTypeSwitcher({
  active,
  onSelect,
}: {
  active: ResourceViewerType
  onSelect: (t: ResourceViewerType) => void
}) {
  return (
    <div style={switcherRowStyle}>
      <span style={switcherLabelStyle}>View as</span>
      <div role="radiogroup" aria-label="Resource content type" style={switcherPillsStyle}>
        {RESOURCE_VIEWER_ORDER.map((o) => {
          const on = o.type === active
          return (
            <button
              key={o.type}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onSelect(o.type)}
              style={{
                ...switcherPillStyle,
                background: on ? 'var(--color-primary-500)' : 'var(--color-surface-card)',
                color: on ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                borderColor: on ? 'var(--color-primary-500)' : 'var(--color-border-subtle)',
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── non-member — whole resource gated ────────────────────────────── */

function GatedView({ title }: { title: string }) {
  return (
    <div style={gateStyle}>
      <span style={gateIconStyle}>
        <LockSolid size={26} aria-hidden style={{ color: 'var(--color-cta-600)' }} />
      </span>
      <p style={gateKickStyle}>Member Exclusive</p>
      <h1 style={gateTitleStyle}>{title}</h1>
      <p style={gateBodyStyle}>
        The Learning Library is a member benefit. Become a member to view this
        resource, download its attachments, and explore suggested topics.
      </p>
      <Link to="/membership/plans" style={gateCtaStyle}>
        See membership plans
      </Link>
    </div>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const pageStyle: CSSProperties = {
  background: 'var(--color-surface-page)',
  minHeight: 'calc(100vh - 80px)',
  paddingBottom: 64,
}

const containerStyle: CSSProperties = {
  maxWidth: 1233,
  margin: '0 auto',
  padding: '24px 24px 0',
}

const backLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  color: 'var(--color-cta-500)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  textDecoration: 'none',
  marginBottom: 24,
}

const titleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 24,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 20,
  fontWeight: 600,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
  flex: 1,
  minWidth: 0,
}

const titleActionsStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 24,
  flexShrink: 0,
}

const textLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'var(--color-cta-500)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
}

const metaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 16,
  margin: '12px 0 10px',
}

const typeBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 32,
  padding: '0 12px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-neutral-800)',
  color: 'var(--color-neutral-800)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const dividerStyle: CSSProperties = {
  width: 1,
  height: 22,
  background: 'var(--color-border-subtle)',
  display: 'inline-block',
}

const ratingStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const topicStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const descriptionStyle: CSSProperties = {
  margin: '0 0 16px',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

// Bounds the (fixed-height) variant bodies so the tall Infographic viewer
// scrolls within a tidy area instead of stretching the page.
const viewerBoundsStyle: CSSProperties = {
  maxHeight: 760,
  overflowY: 'auto',
}

const switcherRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 20,
}

const switcherLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const switcherPillsStyle: CSSProperties = {
  display: 'inline-flex',
  gap: 8,
  flexWrap: 'wrap',
}

const switcherPillStyle: CSSProperties = {
  padding: '7px 14px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border-subtle)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const gateStyle: CSSProperties = {
  maxWidth: 520,
  margin: '32px auto 0',
  padding: '48px 32px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 1px 2px rgb(9 35 72 / 0.06), 0 4px 14px rgb(9 35 72 / 0.06)',
}

const gateIconStyle: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--color-cta-100)',
}

const gateKickStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-cta-600)',
}

const gateTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 24,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const gateBodyStyle: CSSProperties = {
  margin: 0,
  maxWidth: 400,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.55,
  color: 'var(--color-text-secondary)',
}

const gateCtaStyle: CSSProperties = {
  marginTop: 8,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  padding: '0 22px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
}
