import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GatewayShell } from './PrototypeFeaturePage'
import {
  DevHandoffAcceptanceBody,
  DevHandoffDesignSpecBody,
  DevHandoffNotesBody,
  DevHandoffStatesMatrixBody,
  DevHandoffUiUxLogicBody,
} from '@/components/prototype/DevHandoffNotesBody'
import { useAccount } from '@/context/AccountContext'
import {
  prototypeFeatureById,
  componentPreviewUrl,
  type DevHandoffUiUxLogic,
} from '@/data/prototypeFeatures'
import { RelatedJiraTickets } from '@/components/prototype/RelatedJiraTickets'


/**
 * Per-component detail screen for the Dev handoff notes
 * (`/prototype/:featureId/handoff/:componentId`). Opened from the compact
 * cards on the feature gateway. Carries the full written notes plus a
 * LIVE PREVIEW that renders the real component(s) — no static screenshots,
 * so the preview never drifts from the implementation.
 */
export function PrototypeHandoffDetailPage() {
  const { featureId, componentId } = useParams()
  const feature = featureId ? prototypeFeatureById(featureId) : undefined
  // Resolve the component from either the Design & Product Decisions
  // `components` or the "UI Components & UX Logic" tab's `uiComponents` (same
  // detail-page route).
  const component =
    feature?.devHandoff?.components.find((c) => c.id === componentId) ??
    feature?.devHandoff?.uiComponents?.find((c) => c.id === componentId)
  const { brand, membership, setAccount } = useAccount()

  // Pin the feature's demo context (e.g. STC) so the live previews resolve
  // the right brand tokens even on a direct load of this URL.
  const wantBrand = feature?.account?.brand
  const wantMembership = feature?.account?.membership
  useEffect(() => {
    if (wantBrand && wantMembership && (brand !== wantBrand || membership !== wantMembership)) {
      setAccount(wantBrand, wantMembership)
    }
  }, [wantBrand, wantMembership, brand, membership, setAccount])

  useEffect(() => {
    document.title = component
      ? `${component.name} — Dev handoff`
      : 'Dev handoff — UX Prototype'
  }, [component])

  if (!feature || !component) {
    return (
      <GatewayShell>
        <h1 style={notFoundTitleStyle}>Handoff note not found</h1>
        <p style={{ marginTop: 12, color: 'var(--color-text-secondary)' }}>
          We couldn&rsquo;t find that component&rsquo;s handoff notes.{' '}
          {feature && (
            <Link to={`/prototype/${feature.id}`} style={{ color: 'var(--color-action)', fontWeight: 600 }}>
              Back to {feature.title}
            </Link>
          )}
        </p>
      </GatewayShell>
    )
  }

  // PORTED NOTE — in the Common LMS original these two were long OR-chains of
  // specific component ids, because its previews were real React components at
  // wildly different sizes: a 380px rail could sit beside its UI/UX logic in two
  // columns, while a full-page composition needed the whole width with the logic
  // stacked below.
  //
  // Here every preview is an iframe of a standalone HTML prototype at the same
  // 860px frame, so the distinction has nothing left to switch on: all of them
  // are wide. Kept as named constants rather than inlined, so the two-column
  // pairing is one edit away if a narrow preview ever lands.
  const stackLogicBelow = true
  const fullscreenPreview = true

  return (
    <GatewayShell
      back={{ to: `/prototype/${feature.id}`, title: `Back to ${feature.title}` }}
      maxWidth={fullscreenPreview ? 1440 : 1120}
    >
      <header style={{ margin: '28px 0 28px' }}>
        <p style={eyebrowStyle}>Dev handoff · live preview</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={titleStyle}>{component.name}</h1>
          {component.badge && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#8a5a00',
                background: '#fef3e2',
                border: '1px solid #f0d9a8',
                borderRadius: 'var(--radius-pill)',
                padding: '3px 11px',
              }}
            >
              {component.badge}
            </span>
          )}
        </div>
        {/* Component-scoped tickets. Anything added here also surfaces (read-only)
            on the feature gateway's aggregated "Related Jira Tickets" row. */}
        <RelatedJiraTickets
          scopeKey={`${feature.id}::${component.id}`}
          configTickets={component.jiraTickets}
        />
      </header>

      {/* Live preview — the real component(s), rendered in place.
            - Calendar Actions is broken out into a section per CTA, so it
              keeps its own full-width layout (+ standalone UI/UX logic below).
            - Every other component pairs the preview with its UI/UX logic in
              a two-column block so the rule reads alongside the UI it governs
              (collapses to one column on narrow widths). */}
      {/* PORTED NOTE — the original had a third arm here for 'calendar-actions',
          whose preview was sectioned per CTA rather than shown as one component.
          Dropped with the rest of the LMS registry; nothing PartnerHub-side needs
          a bespoke arm, and an unreachable branch referencing a deleted component
          would not compile. */}
      {component.uiUxLogic && !stackLogicBelow ? (
        <PreviewLogicColumns componentId={component.id} logic={component.uiUxLogic} />
      ) : (
        <section style={{ marginBottom: 32 }}>
          <h2 style={sectionHeadingStyle}>Live preview</h2>
          <p style={previewNoteStyle}>
            Rendered from the real component code — interact with it directly. This stays
            in sync with the implementation, so it won&rsquo;t drift the way a screenshot would.
          </p>
          <div style={previewFrameStyle}>
            <ComponentLivePreview componentId={component.id} />
          </div>
        </section>
      )}

      {/* UI/UX logic — rendered standalone below the preview for the wide,
          full-width previews (Calendar Actions + the study-calendar entry
          points); every other component pairs it beside the preview above. */}
      {component.uiUxLogic && stackLogicBelow && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={sectionHeadingStyle}>UI/UX logic</h2>
          <p style={previewNoteStyle}>
            The reasoning and rules worked through while designing this component.
          </p>
          <div style={previewFrameStyle}>
            <DevHandoffUiUxLogicBody logic={component.uiUxLogic} />
          </div>
        </section>
      )}

      {/* Design spec — token-referencing (no raw values; tokens.css is
          the source of truth). */}
      {component.designSpec && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={sectionHeadingStyle}>Design spec</h2>
          <p style={previewNoteStyle}>
            Named tokens, states, and responsive notes — values live in{' '}
            <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>tokens.css</code>{' '}
            and Figma, so nothing here restates raw hex / px and can&rsquo;t drift.
          </p>
          <div style={previewFrameStyle}>
            <DevHandoffDesignSpecBody spec={component.designSpec} />
          </div>
        </section>
      )}

      {/* Acceptance criteria — testable Definition of Done. */}
      {component.acceptanceCriteria && component.acceptanceCriteria.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={sectionHeadingStyle}>Acceptance criteria</h2>
          <p style={previewNoteStyle}>
            Build against these and QA verifies them — the Definition of Done for this component.
          </p>
          <div style={previewFrameStyle}>
            <DevHandoffAcceptanceBody items={component.acceptanceCriteria} />
          </div>
        </section>
      )}

      {/* States matrix — the non-happy paths. */}
      {component.statesMatrix && component.statesMatrix.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={sectionHeadingStyle}>States matrix</h2>
          <p style={previewNoteStyle}>
            Every state the build must handle — including loading, empty, error, and overflow paths
            the happy-path variants don&rsquo;t show.
          </p>
          <div style={previewFrameStyle}>
            <DevHandoffStatesMatrixBody rows={component.statesMatrix} />
          </div>
        </section>
      )}

      {/* Full written notes — framed like the other sections. */}
      <section>
        <h2 style={sectionHeadingStyle}>Notes</h2>
        <div style={{ ...previewFrameStyle, marginTop: 12 }}>
          <DevHandoffNotesBody component={component} />
        </div>
      </section>
    </GatewayShell>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 *  LIVE PREVIEWS — one per handoff component id.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Two-column pairing of the live preview with its UI/UX logic, so each
 * rule reads alongside the UI it governs instead of sitting in a separate
 * block far below. The preview column is given more room (it holds the
 * real component[s]); both columns wrap to a single stacked column on
 * narrow widths via flex-basis + wrap. Used for every handoff component
 * except the sectioned Calendar Actions preview.
 */
function PreviewLogicColumns({
  componentId,
  logic,
}: {
  componentId: string
  logic: DevHandoffUiUxLogic
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={previewLogicRowStyle}>
        <div style={previewLogicPreviewColStyle}>
          <h2 style={sectionHeadingStyle}>Live preview</h2>
          <p style={previewNoteStyle}>
            Rendered from the real component code — interact with it directly. Stays in
            sync with the implementation, so it won&rsquo;t drift the way a screenshot would.
          </p>
          <div style={previewFrameStyle}>
            <ComponentLivePreview componentId={componentId} />
          </div>
        </div>
        <div style={previewLogicLogicColStyle}>
          <h2 style={sectionHeadingStyle}>UI/UX logic</h2>
          <p style={previewNoteStyle}>
            The reasoning and rules worked through while designing this component — paired
            with the UI it governs.
          </p>
          <div style={previewFrameStyle}>
            <DevHandoffUiUxLogicBody logic={logic} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Learning Resources Updates previews ──────────────────────────────
 *  All four handoff components share this one preview, wrapped once in a
 *  `FeatureFlagProvider` (this page sits outside AppLayout, so flags default
 *  to their catalog values — all ON here) + an Elite `AccountContext` +
 *  `data-brand="elite"` so the rail resolves Elite tokens. `focus` picks
 *  which slice to show. */

/* ── Live preview ─────────────────────────────────────────────────────
 *  PORTED NOTE — this is the one substantive divergence from the Common LMS
 *  original, and it is deliberate.
 *
 *  There, `ComponentLivePreview` was a registry of ~35 branches, each rendering
 *  a REAL in-repo React component (the study calendar, the membership bands,
 *  the rail). That is why the original file is 3,539 lines and why tracing its
 *  imports pulls in 81,000 lines of product code: the previews ARE the product.
 *
 *  PartnerHub has no such components. Its prototypes are standalone HTML files
 *  under `public/prototypes/`, so the honest preview is the served artifact in
 *  an iframe — which cannot drift either, for the same reason the LMS registry
 *  couldn't: it loads the real thing. The LMS original already used exactly this
 *  pattern for its own two HTML prototypes (`QuestionListPreview`,
 *  `NgatAdminPreview`), so this is that pattern generalised, not a downgrade.
 *
 *  Resolution order, all data-driven — no code change to add a preview:
 *    1. the component's own `previewUrl`
 *    2. the parent feature's first `pages` entry / `livePreviewUrl` / `to`
 *    3. the caller's `fallback`
 */
export function ComponentLivePreview({
  componentId,
  fallback,
}: {
  componentId: string
  fallback?: ReactNode
}) {
  const url = componentPreviewUrl(componentId)
  if (!url) {
    return (
      fallback ?? (
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          No preview available. Add <code>previewUrl</code> to the component, or a{' '}
          <code>pages</code> entry to its feature, in{' '}
          <code>src/data/prototypeFeatures.ts</code>.
        </p>
      )
    )
  }
  const src = /^https?:\/\//i.test(url)
    ? url
    : `${import.meta.env.BASE_URL}${url.replace(/^\//, '')}`
  return (
    <div>
      <iframe title={`${componentId} prototype`} src={src} style={previewIframeStyle} />
      <p style={previewSourceNoteStyle}>
        Embedded from <code style={previewCodeStyle}>{url}</code> — the served file, so it
        stays in step with the prototype.
      </p>
    </div>
  )
}

const previewIframeStyle: CSSProperties = {
  width: '100%',
  height: 860,
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 8,
  background: '#fff',
}

const previewSourceNoteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const previewCodeStyle: CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: 12,
}
const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-cta-600)',
}

const titleStyle: React.CSSProperties = {
  margin: '10px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 500,
  fontSize: 'var(--text-heading-6xl)',
  lineHeight: 'var(--text-heading-6xl--line-height)',
  color: 'var(--color-text-primary)',
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 500,
  fontSize: 'var(--text-heading-2xl)',
  lineHeight: 'var(--text-heading-2xl--line-height)',
  color: 'var(--color-text-primary)',
}

const previewNoteStyle: React.CSSProperties = {
  margin: '8px 0 16px',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-secondary)',
}

const previewFrameStyle: React.CSSProperties = {
  padding: 24,
  background: 'var(--color-surface-page)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
}


// Preview ↔ UI/UX logic two-column row. Both columns wrap to a single
// stacked column on narrow widths (flex-wrap + flex-basis); the preview
// column gets the larger share so multi-card galleries still breathe.
const previewLogicRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 24,
  alignItems: 'flex-start',
}

const previewLogicPreviewColStyle: React.CSSProperties = {
  flex: '2 1 520px',
  minWidth: 0,
}

const previewLogicLogicColStyle: React.CSSProperties = {
  flex: '1 1 320px',
  minWidth: 0,
}







const notFoundTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 500,
  fontSize: 'var(--text-heading-3xl)',
  color: 'var(--color-text-primary)',
}
