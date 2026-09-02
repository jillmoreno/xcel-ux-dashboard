import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Bolt, CircleCheck, ClipboardList, Lightbulb, LockSolid, MessageCircle, Share2, X } from '@/icons'
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { ComponentLivePreview } from './PrototypeHandoffDetailPage'
import { PrototypeBar } from '@/components/layout/PrototypeBar'
import { setPrototypeWalkthrough } from '@/components/layout/prototypeWalkthrough'
import { useAccount, professionFor, type Membership } from '@/context/AccountContext'
import {
  prototypeFeatureById,
  type DevHandoffComponent,
  type DevHandoffNotes,
  type FeaturePageLink,
  type PrototypeFeature,
} from '@/data/prototypeFeatures'
import {
  handoffSubheadingStyle,
  pointerLocationStyle,
} from '@/components/prototype/devHandoffStyles'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Toast } from '@/components/ui/Toast'
import { PROTOTYPE_SHARE_ORIGIN, copyToClipboard } from '@/components/prototype/shareLink'
import {
  type DevStatus,
  DEV_STATUS_STROKE,
  DEV_STATUS_LABEL,
  readDevStatusMap,
  writeDevStatus,
} from '@/components/prototype/devHandoffStatusUtil'
import {
  DevHandoffNotesBody,
  DevHandoffUiUxLogicBody,
  DevHandoffDesignSpecBody,
  DevHandoffAcceptanceBody,
  DevHandoffStatesMatrixBody,
} from '@/components/prototype/DevHandoffNotesBody'
import { getUserJiraTickets } from '@/components/prototype/jiraTicketsUtil'
import { FeaturePreviewThumb } from '@/components/prototype/FeaturePreviewThumb'
import { buildEmbedSrc, primaryPreviewSrc } from '@/components/prototype/featurePreviewSrc'
import { RelatedJiraTickets } from '@/components/prototype/RelatedJiraTickets'

/**
 * Per-feature gateway (`/prototype/:featureId`). Lists ONLY the specific pages
 * that make up a single feature — the curated set defined in
 * `src/data/prototypeFeatures.ts`. Sits outside AppLayout so it matches the
 * landing surface; the page links open into the live platform.
 */
/** Member ⇄ Non-member segmented filter for the gateway's walkthrough list. */
const MEMBERSHIP_FILTER_TABS: PillTabItem<Membership>[] = [
  { id: 'member', label: 'Member' },
  { id: 'non-member', label: 'Non-member' },
]

/** Props exist only for the EMBEDDED case — the UX dashboard renders this page
 *  inside its own left-nav frame so a reviewer working the board doesn't lose
 *  the nav every time they open a feature. The standalone `/prototype/:id`
 *  route passes nothing and behaves exactly as before. */
/** The home-page section a feature lands in, as a URL. Kept in step with
 *  `sectionOf` in UxDashboardPage — same order of precedence, same fallbacks. */
function backSectionHref(feature: PrototypeFeature): string {
  const st = feature.devStatus
  if (st) {
    return st === 'ready-for-dev' || st === 'in-development' || st === 'blocked'
      ? '/?section=development'
      : '/?section=design'
  }
  if (feature.category === 'demo' || feature.category === 'dashboard') return '/?section=demo'
  if (feature.category === 'testing') return '/?section=development'
  if (feature.category === 'exploration') return '/?section=exploration'
  return '/?section=design'
}

export function PrototypeFeaturePage({
  featureId: featureIdProp,
  embedded = false,
}: {
  /** Overrides the route param. Required when embedded (there is no param). */
  featureId?: string
  /** Drops the page chrome — the prototype bar, the full-height page
   *  background, and the outer padding — so the host owns them. */
  embedded?: boolean
} = {}) {
  const params = useParams()
  const featureId = featureIdProp ?? params.featureId
  const feature = featureId ? prototypeFeatureById(featureId) : undefined
  const { brand, membership, setAccount } = useAccount()
  // Which gateway tab is showing (declared before any early return so the hook
  // order stays stable). Defaults to Design & Product Decisions — the tab that
  // carries the important information.
  const [activeTab, setActiveTab] = useState<GatewayTab>('handoff')

  // If a feature pins a brand / membership (e.g. STC for the study calendar),
  // switch the demo account on ENTRY so its pages render in the right context.
  // Keyed to the feature id (not brand/membership) so it pins once per feature
  // and doesn't fight the user switching brands via the Demo-brands filter below.
  const wantBrand = feature?.account?.brand
  const wantMembership = feature?.account?.membership
  useEffect(() => {
    if (wantBrand && wantMembership) setAccount(wantBrand, wantMembership)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureId, wantBrand, wantMembership])

  useEffect(() => {
    document.title = feature ? `${feature.title} — UX Prototype` : 'UX Prototype'
  }, [feature])

  if (!feature) {
    return (
      <GatewayShell embedded={embedded}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 'var(--text-heading-3xl)',
            color: 'var(--color-text-primary)',
          }}
        >
          Feature not found
        </h1>
        <p style={{ marginTop: 12, color: 'var(--color-text-secondary)' }}>
          We couldn&rsquo;t find a prototype feature with that id.
        </p>
      </GatewayShell>
    )
  }

  const pages = feature.pages ?? []
  const hasLivePreview = pages.length > 0 || Boolean(feature.livePreviewUrl)

  // Tickets attached on any of this feature's handoff pages (config + the ones
  // reviewers pasted there, per browser) surface here too — read-only, tagged
  // with the component they came from. Managed on their own handoff page.
  const inheritedJiraTickets = (feature.devHandoff?.components ?? []).flatMap((c) =>
    [...(c.jiraTickets ?? []), ...getUserJiraTickets(`${feature.id}::${c.id}`)].map((url) => ({
      url,
      from: c.name,
    })),
  )

  // Every feature gateway carries the SAME three tabs, in this order, whether or
  // not each one's data is authored yet — the tab set used to be built from
  // whatever data happened to exist, so a feature missing its decisions log or
  // component breakdown silently showed two tabs (or one), and a reviewer
  // couldn't tell "not documented" from "this feature doesn't work that way".
  // A tab with no data renders an empty state naming exactly what to add.
  const tabItems: TabItem<GatewayTab>[] = GATEWAY_TABS
  // Resolve the effective tab (the set is fixed now, so this only guards against
  // a stale selection).
  const effectiveTab: GatewayTab = tabItems.find((t) => t.id === activeTab)?.id ?? tabItems[0].id

  // One consistent width across the whole feature walkthrough — the page never
  // reflows when switching between the decisions log and Live Preview. Sized to
  // the Live Preview embed's full column (the widest need).
  const shellMaxWidth = 1280

  // The header CTA's target — same resolver the Live Preview tab uses.
  const headerPreviewSrc = hasLivePreview ? primaryPreviewSrc(feature, brand) : null

  return (
    <GatewayShell
      // "← Back" returns to the home SECTION this feature lives in. Mirrors
      // `sectionOf` on the home page rather than restating it: an authored
      // `devStatus` decides Design vs Development, and category is the fallback.
      // A mismatch would land the reviewer on a list their feature is not in.
      // Embedded, the host's own back control is right above this and the
      // prototype bar isn't rendered at all, so there is nowhere to put it.
      back={embedded ? undefined : { to: backSectionHref(feature), label: 'Back', title: 'Back to the UX dashboard' }}
      maxWidth={shellMaxWidth}
      embedded={embedded}
    >
      <header style={{ marginBottom: 32 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-cta-600)',
          }}
        >
          Feature walkthrough
        </p>
        <h1
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            // 3xl, not 6xl: at 48px a title like "Gift Recipients (Buy for
            // Others) — Table Component" ran to two lines and dwarfed the
            // walkthrough it introduces.
            fontSize: 'var(--text-heading-3xl)',
            lineHeight: 'var(--text-heading-3xl--line-height)',
            color: 'var(--color-text-primary)',
          }}
        >
          {feature.title}
        </h1>
        <p
          style={{
            margin: '14px 0 0',
            fontSize: 14,
            lineHeight: '22px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {feature.blurb}
        </p>
        <RelatedJiraTickets
          scopeKey={feature.id}
          configTickets={feature.jiraTickets}
          inherited={inheritedJiraTickets}
        />
        {feature.brands && feature.brands.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 16,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
              Demo brands:
            </span>
            {feature.brands.map((b) => {
              const active = b === brand
              return (
                <button
                  key={b}
                  type="button"
                  // Scope this pill to brand `b` so the `--color-primary-*`
                  // tokens resolve to THAT brand's palette (the overrides are
                  // plain [data-brand=…] attribute selectors), letting each pill
                  // show its own brand color regardless of the active brand.
                  data-brand={b}
                  aria-pressed={active}
                  title={`Preview in ${professionFor(b).brandFullName}`}
                  onClick={() => setAccount(b, membership)}
                  style={{
                    padding: '3px 11px',
                    borderRadius: 'var(--radius-pill)',
                    border: `1px solid var(--color-primary-${active ? '600' : '200'})`,
                    background: active ? 'var(--color-primary-600)' : 'var(--color-primary-100)',
                    color: active ? 'var(--color-text-inverse)' : 'var(--color-primary-700)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    fontWeight: active ? 700 : 600,
                    cursor: 'pointer',
                  }}
                >
                  {professionFor(b).brandFullName}
                </button>
              )
            })}
          </div>
        )}
        {/* Primary CTA — directly under Demo brands, so the live prototype is
            one click from the top of the gateway on every tab (it used to be a
            text link inside the Live Preview tab's caption). Follows the
            Demo-brands pick, so it opens the brand on screen. */}
        {/* The picture sits directly above the control that opens it, so the
            two read as one offer rather than as decoration parked elsewhere. */}
        <FeaturePreviewThumb
          feature={feature}
          src={headerPreviewSrc}
          width={360}
          height={244}
          style={{
            marginTop: 20,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        />
        {headerPreviewSrc && (
          <div style={{ marginTop: 16 }}>
            <OpenLivePreviewButton href={headerPreviewSrc} featureId={feature.id} />
          </div>
        )}
      </header>

      {/* Tab bar — the same three tabs on every feature. */}
      <div style={{ marginBottom: 24 }}>
        <Tabs items={tabItems} active={effectiveTab} onChange={setActiveTab} />
      </div>

      {/* Panels. Each falls back to an empty state naming the field to author,
          so an undocumented tab reads as "not written yet" rather than looking
          like the feature has nothing of that kind. */}
      {effectiveTab === 'handoff' &&
        (feature.devHandoff ? (
          <DevHandoffSection notes={feature.devHandoff} featureId={feature.id} embedded />
        ) : (
          <TabEmptyState featureId={feature.id} field="devHandoff">
            No design &amp; product decisions documented yet.
          </TabEmptyState>
        ))}

      {effectiveTab === 'components' &&
        (feature.devHandoff?.uiComponents?.length ? (
          <UiComponentsSection components={feature.devHandoff.uiComponents} featureId={feature.id} />
        ) : (
          <TabEmptyState featureId={feature.id} field="devHandoff.uiComponents">
            No per-component breakdown yet — this feature&rsquo;s UI components and the UX logic
            behind them haven&rsquo;t been split out.
          </TabEmptyState>
        ))}

      {effectiveTab === 'live' &&
        (hasLivePreview ? (
          <LivePreviewTab feature={feature} pages={pages} />
        ) : (
          <TabEmptyState featureId={feature.id} field="pages (or livePreviewUrl)">
            No preview available yet — there are no walkthrough routes to embed.
          </TabEmptyState>
        ))}
    </GatewayShell>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 *  GATEWAY TABS
 * ───────────────────────────────────────────────────────────────────────── */

/** Placeholder body for a tab whose data hasn't been authored for this feature.
 *  Says which field fills it, so the gap is actionable rather than a dead end —
 *  same dashed-card treatment the gateway used for its old "nothing to show"
 *  state. */
function TabEmptyState({
  featureId,
  field,
  children,
}: {
  featureId: string
  /** The `PrototypeFeature` field that populates this tab. */
  field: string
  /** What's missing, in one sentence. */
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: 24,
        background: 'var(--color-surface-card)',
        border: '1px dashed var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-text-secondary)',
        fontSize: 14,
        lineHeight: '22px',
      }}
    >
      {children}{' '}
      Add <code>{field}</code> for <code>{featureId}</code> in{' '}
      <code>src/data/prototypeFeatures.ts</code>.
    </div>
  )
}

/** The gateway's underline tabs. Add an id here + a panel in
 *  `PrototypeFeaturePage` to introduce a new tab. */
type GatewayTab = 'handoff' | 'components' | 'live'

/** The fixed three-tab set every feature gateway shows, in order. Labels match
 *  each panel's own heading. The ids are deliberately unchanged from when the
 *  tabs were named "Dev Handoff Notes" / "UI Components and UX Rules" — they're
 *  internal, and renaming them would churn nothing but risk. */
const GATEWAY_TABS: TabItem<GatewayTab>[] = [
  { id: 'handoff', label: 'Design & Product Decisions' },
  { id: 'components', label: 'UI Components & UX Logic' },
  { id: 'live', label: 'Live Preview' },
]

/* ─────────────────────────────────────────────────────────────────────────
 *  LIVE PREVIEW TAB — embeds the feature's real route fullscreen, with the
 *  walkthrough route switcher + Member/Non-member filter folded in above the
 *  embed. Renders the actual pages in an iframe (same origin), so it can't
 *  drift from the build. Brand / membership are passed to the embed as query
 *  params so the preview renders in the right context WITHOUT touching the
 *  global demo account (which would fight the gateway's account-pinning
 *  effect).
 * ───────────────────────────────────────────────────────────────────────── */

function LivePreviewTab({ feature, pages }: { feature: PrototypeFeature; pages: FeaturePageLink[] }) {
  // Follow the globally-selected brand (the Demo-brands filter in the header) so
  // the embed re-renders in whichever brand the reviewer picked; falls back to
  // the feature's pinned brand before any pick.
  const { brand: liveBrand } = useAccount()
  const defaultMembership: Membership = feature.account?.membership ?? 'member'

  const effMembership = (p: FeaturePageLink): Membership => p.membership ?? defaultMembership
  const hasMember = pages.some((p) => effMembership(p) === 'member')
  const hasNonMember = pages.some((p) => effMembership(p) === 'non-member')
  const showMembershipFilter = hasMember && hasNonMember

  const [pageView, setPageView] = useState<Membership>(hasMember ? 'member' : 'non-member')
  const visiblePages = showMembershipFilter
    ? pages.filter((p) => effMembership(p) === pageView)
    : pages

  // Which walkthrough route is embedded. Keyed by index within visiblePages;
  // resets to the first whenever the visible set changes (e.g. membership flip).
  const [selectedIndex, setSelectedIndex] = useState(0)
  const activeIndex = selectedIndex < visiblePages.length ? selectedIndex : 0
  const activePage = visiblePages[activeIndex]

  // An absolute (http) livePreviewUrl embeds a hosted build and WINS over the
  // walkthrough pages, so the preview shows the real prototype while the page
  // list + handoff notes stay. A relative livePreviewUrl keeps its old role as
  // a no-pages fallback (after the pages).
  const externalPreview =
    feature.livePreviewUrl && /^https?:\/\//i.test(feature.livePreviewUrl)
      ? feature.livePreviewUrl
      : null
  const activeTo = externalPreview ?? activePage?.to ?? feature.livePreviewUrl ?? feature.to ?? null
  // Live brand (Demo-brands filter) wins over the page's pinned brand.
  const activeBrand = liveBrand ?? activePage?.brand ?? feature.account?.brand
  const activeMembership = activePage ? effMembership(activePage) : defaultMembership
  const embedSrc = activeTo ? buildEmbedSrc(activeTo, activeBrand, activeMembership) : null

  const openFullScreen = () => setPrototypeWalkthrough(feature.id)

  // Grow the embed to its content height so the preview scrolls with the page —
  // no "scroll within a scroll". The embed is same-origin, so we can read the
  // rendered document height on load and keep it in sync as the content changes
  // (switching variants remounts the iframe; in-page interactions like "Show all
  // states" are caught by the ResizeObserver). Falls back to the fixed height
  // until measured (or if access is ever blocked).
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [frameHeight, setFrameHeight] = useState<number | null>(null)

  // Reset the measured height whenever the embedded route changes so a taller
  // previous variant can't leave a gap under a shorter new one before it loads.
  useEffect(() => setFrameHeight(null), [embedSrc])

  const handleFrameLoad = () => {
    const frame = frameRef.current
    if (!frame) return
    try {
      const doc = frame.contentDocument
      const body = doc?.body
      if (!doc || !body) return
      // Neutralize the embedded shell's `min-height: 100vh` floor INSIDE the
      // preview only (this style tag lives in the iframe's document, so the real
      // app + full-screen tab are untouched). Without it the floor always
      // inflates to fill the frame, leaving the chrome above it as a residual
      // ~40px inner scroll no matter how tall we size the frame.
      if (!doc.getElementById('cre-embed-fit-style')) {
        const style = doc.createElement('style')
        style.id = 'cre-embed-fit-style'
        style.textContent = '.cre-platform-shell-grid{min-height:0!important}'
        doc.head.appendChild(style)
      }
      const measure = () => {
        // While a slide-over Sheet / Modal is open inside the embed, it's a
        // `position: fixed` overlay — sized to the iframe's viewport, i.e. the
        // content-fitted frame height (which can be 1600px+). That stretches the
        // sheet and pushes its pinned footer far below the fold ("scrolls
        // forever"). Pin the frame to a normal desktop height while an overlay
        // is open so it reads like a real viewport (footer at the bottom),
        // mirroring the `min(78vh, 900px)` CSS fallback.
        if (doc.querySelector('.cre-sheet-overlay, .cre-modal-backdrop')) {
          const h = Math.min(900, Math.round(window.innerHeight * 0.78))
          frame.style.height = `${h}px`
          setFrameHeight((prev) => (prev != null && Math.abs(prev - h) <= 1 ? prev : h))
          return
        }
        // Collapse the frame to 0 first so the embedded shell's `min-height:
        // 100vh` floor can't echo the frame's OWN height back into the measured
        // content height (which would feed an ever-growing loop). Reading
        // scrollHeight forces a synchronous reflow, so we read the true natural
        // content height, then size the frame to it. Setting the height inline
        // (not just via state) keeps the intermediate 0 from ever painting.
        frame.style.height = '0px'
        const h = Math.max(doc.documentElement.scrollHeight, body.scrollHeight)
        frame.style.height = `${h}px`
        setFrameHeight((prev) => (prev != null && Math.abs(prev - h) <= 1 ? prev : h))
      }
      measure()
      const observer = new ResizeObserver(measure)
      observer.observe(body)
      // Opening/closing an overlay adds/removes a portal child on <body> without
      // changing body's own box, so a ResizeObserver misses it — watch the
      // childList too, so the frame re-pins (open) / re-grows (close) in step.
      const portalObserver = new MutationObserver(measure)
      portalObserver.observe(body, { childList: true })
      // Detach when the iframe navigates/unloads so we don't touch a stale doc.
      frame.contentWindow?.addEventListener(
        'pagehide',
        () => {
          observer.disconnect()
          portalObserver.disconnect()
        },
        { once: true },
      )
    } catch {
      // Cross-origin or torn down — keep the fixed fallback height.
    }
  }

  const frameStyle: React.CSSProperties = frameHeight
    ? { ...liveFrameStyle, height: frameHeight }
    : liveFrameStyle

  return (
    <section>
      {/* Toolbar — membership filter + route switcher (each only when it adds
          a real choice). */}
      {(showMembershipFilter || visiblePages.length > 1) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {showMembershipFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                Viewing as:
              </span>
              <PillTabs
                label="Preview membership"
                items={MEMBERSHIP_FILTER_TABS}
                active={pageView}
                onChange={(m) => {
                  setPageView(m)
                  setSelectedIndex(0)
                }}
              />
            </div>
          )}
          {visiblePages.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                Variants:
              </span>
              {visiblePages.map((page, i) => {
                const on = i === activeIndex
                return (
                  <button
                    key={page.to + i}
                    type="button"
                    aria-pressed={on}
                    title={page.note}
                    onClick={() => setSelectedIndex(i)}
                    style={{
                      padding: '6px 13px',
                      borderRadius: 'var(--radius-pill)',
                      border: `1px solid ${on ? 'var(--color-action)' : 'var(--color-border-subtle)'}`,
                      background: on ? 'var(--color-primary-100)' : 'var(--color-surface-card)',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      fontWeight: on ? 700 : 600,
                      cursor: 'pointer',
                    }}
                  >
                    {page.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {embedSrc && activeTo ? (
        <>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {activePage?.note ? `${activePage.note} ` : ''}Live embed of{' '}
            <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{activeTo}</code>.
            {/* The header's "Open live preview" button now covers the primary
                route, so this caption link only appears when the reviewer has
                switched to a DIFFERENT variant — which the header CTA (fixed to
                the first route) can't reach. Same URL ⇒ no duplicate link. */}
            {embedSrc !== primaryPreviewSrc(feature, liveBrand) && (
              <>
                {' '}
                <a
                  href={embedSrc}
                  target="_blank"
                  rel="noreferrer"
                  onClick={openFullScreen}
                  style={{ color: 'var(--color-action)', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  Open this variant in a new tab
                  <Share2 size={13} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 4 }} />
                </a>
              </>
            )}
          </p>
          <iframe
            key={embedSrc}
            ref={frameRef}
            onLoad={handleFrameLoad}
            title={`Live preview — ${activePage?.label ?? feature.title}`}
            src={embedSrc}
            style={frameStyle}
          />
        </>
      ) : (
        <div
          style={{
            padding: 24,
            background: 'var(--color-surface-card)',
            border: '1px dashed var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text-secondary)',
            fontSize: 14,
          }}
        >
          No live preview available. Add walkthrough <code>pages</code> or a{' '}
          <code>livePreviewUrl</code> for <code>{feature.id}</code> in{' '}
          <code>src/data/prototypeFeatures.ts</code>.
        </div>
      )}
    </section>
  )
}

/**
 * "Open live preview" — the header CTA, styled as a primary `Button` but
 * rendered as a real `<a target="_blank">` so it stays middle-clickable and
 * copyable (the Button primitive only renders a <button>, and routing this
 * through window.open would lose both).
 *
 * It sits directly under the Demo brands row, so the live prototype is one
 * click from the top of the gateway on ANY tab — it used to be reachable only
 * as a text link buried in the Live Preview tab's caption.
 */
function OpenLivePreviewButton({ href, featureId }: { href: string; featureId: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      // Seeds the walkthrough context so the opened tab's prototype bar carries
      // a "Back" link to this gateway (same as the old caption link did).
      onClick={() => setPrototypeWalkthrough(featureId)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 40,
        padding: '0 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-action)',
        color: 'var(--color-text-inverse)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--color-action)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1,
        textDecoration: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-action-hover)'
        e.currentTarget.style.borderColor = 'var(--color-action-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--color-action)'
        e.currentTarget.style.borderColor = 'var(--color-action)'
      }}
    >
      Open live preview
      <Share2 size={14} aria-hidden />
    </a>
  )
}

const liveFrameStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 'min(78vh, 900px)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-surface-card)',
  boxShadow: 'var(--shadow-card)',
}

/** The "UI Components & UX Logic" tab — the feature broken down into
 *  per-component handoffs (Header, Card Styles, Carousel, …). The decisions log
 *  stays on the Design & Product Decisions tab.
 *
 *  ONE component renders its notes INLINE; two or more render as tiles that open
 *  a detail screen. With a single component a tile is pure indirection — there's
 *  nothing to choose between, so the click buys the reader nothing and hides the
 *  UX logic one level down. With several, the tiles are real navigation. */
function UiComponentsSection({
  components,
  featureId,
}: {
  components: DevHandoffComponent[]
  featureId: string
}) {
  const ordered = [...components]
    .map((c, i) => ({ c, i }))
    .sort((a, b) => (a.c.order ?? a.i + 1000) - (b.c.order ?? b.i + 1000))
    .map(({ c }) => c)

  const [activeId, setActiveId] = useState(ordered[0]?.id ?? '')
  const active = ordered.find((c) => c.id === activeId) ?? ordered[0]

  if (ordered.length === 0) return null
  if (ordered.length === 1) {
    return <UiComponentInline component={ordered[0]} featureId={featureId} showPreview />
  }

  const items: PillTabItem<string>[] = ordered.map((c) => ({
    id: c.id,
    // The authored short form when there is one — the full `name` is often a
    // sentence ("Sheets — Manage Membership + Your Memberships") that would
    // blow the strip's width.
    label: c.tabLabel ?? c.name,
  }))

  return (
    <section>
      <p
        style={{
          margin: '0 0 16px',
          fontSize: 14,
          lineHeight: '22px',
          color: 'var(--color-text-secondary)',
          maxWidth: '72ch',
        }}
      >
        Each surface from the Live Preview, broken down into its own handoff — the component, where
        it lives, its variants, and the UX rules that drive it. Pick one to read its spec beside a
        live render of the real thing.
      </p>
      {/* Pills, not underline tabs: this strip sits directly under the
        * gateway's own underline tab bar, and the same control twice reads as
        * one filter set nested in another rather than a level below it. Pills
        * are also what the app uses everywhere else for a segmented picker. */}
      <PillTabs
        size="compact"
        label="Component"
        items={items}
        active={active.id}
        onChange={setActiveId}
      />
      {/* Keyed so switching components remounts the preview — several previews
       *  hold their own local state (a selected tier, an open sheet), and a
       *  stale one would carry into the next component's render. */}
      <UiComponentInline key={active.id} component={active} featureId={featureId} showPreview />
    </section>
  )
}

function UiComponentInline({
  component,
  featureId,
  showPreview = false,
}: {
  component: DevHandoffComponent
  featureId: string
  /** Render the component's own live preview above the spec. Every walkthrough
   *  sets it: a page that names a component should show it. (It was
   *  multi-component-only while the preview sat in a bounded 560px box, where
   *  a single component's render was worse than the Live Preview tab's. With
   *  the box gone the render is full-width, so there is nothing left to trade
   *  and the split was arbitrary.) */
  showPreview?: boolean
}) {
  const block = (title: string, note: string, body: React.ReactNode) => (
    <div style={{ marginTop: 28 }}>
      <h3 style={handoffSubheadingStyle}>{title}</h3>
      <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: '19px', color: 'var(--color-text-secondary)' }}>
        {note}
      </p>
      <div style={{ ...inlineHandoffFrameStyle, marginTop: 12 }}>{body}</div>
    </div>
  )

  return (
    <section>
      {showPreview ? (
        /* The tab strip carries the short label; this restates the full name,
         * which is often the part that says what the surface actually is. */
        <h3 style={{ ...handoffSubheadingStyle, margin: '20px 0 0' }}>
          {component.name}
          {component.badge && <span style={{ ...handoffBadgeStyle, marginLeft: 8 }}>{component.badge}</span>}
        </h3>
      ) : (
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 14,
            lineHeight: '22px',
            color: 'var(--color-text-secondary)',
            maxWidth: '72ch',
          }}
        >
          The component behind this feature — the real thing running below, then where it lives,
          its variants, the UX rules that drive it, and the spec to build against.
        </p>
      )}
      <p style={{ ...pointerLocationStyle, margin: '8px 0 0' }}>{component.location}</p>

      {showPreview && (
        /* The component renders straight onto the page — no frame, no height
         * cap. It briefly sat in a bounded 560px scroll box to keep the tall
         * previews (some stack every variant and run past 2,900px) from
         * pushing the spec down the page; a box inside a tab inside a page
         * read as one container too many, and a nested scroll area is its own
         * cost. The spec below is now genuinely below a full-length render. */
        <div style={{ marginTop: 20 }}>
          <ComponentLivePreview
            componentId={component.id}
            fallback={
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                No live preview registered for <code>{component.id}</code> yet — add one to{' '}
                <code>ComponentLivePreview</code> in{' '}
                <code>src/pages/PrototypeHandoffDetailPage.tsx</code>.
              </p>
            }
          />
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 12,
              lineHeight: '18px',
              color: 'var(--color-text-secondary)',
            }}
          >
            Rendered from the real component code, so it can&rsquo;t drift the way a screenshot
            would.{' '}
            <Link
              to={`/prototype/${featureId}/handoff/${component.id}`}
              style={{ color: 'var(--color-action)', fontWeight: 600 }}
            >
              Open the full handoff &rarr;
            </Link>
          </p>
        </div>
      )}

      {component.uiUxLogic &&
        block(
          'UI/UX logic',
          'The reasoning and rules worked through while designing this component.',
          <DevHandoffUiUxLogicBody logic={component.uiUxLogic} />,
        )}
      {component.designSpec &&
        block(
          'Design spec',
          'Named tokens, states, and responsive notes — values live in tokens.css and Figma, so nothing here restates raw hex / px and can’t drift.',
          <DevHandoffDesignSpecBody spec={component.designSpec} />,
        )}
      {component.acceptanceCriteria && component.acceptanceCriteria.length > 0 &&
        block(
          'Acceptance criteria',
          'Build against these and QA verifies them — the Definition of Done for this component.',
          <DevHandoffAcceptanceBody items={component.acceptanceCriteria} />,
        )}
      {component.statesMatrix && component.statesMatrix.length > 0 &&
        block(
          'States matrix',
          'Every state the build must handle — including loading, empty, error, and overflow paths the happy-path variants don’t show.',
          <DevHandoffStatesMatrixBody rows={component.statesMatrix} />,
        )}
      {block(
        'Notes',
        'The full written handoff — variants, UX logic, data, stubs, and a11y.',
        <DevHandoffNotesBody component={component} />,
      )}
    </section>
  )
}

/** Frame around each inline handoff block — mirrors the detail screen's
 *  `previewFrameStyle` so the two surfaces read identically. */
/** The amber "UPDATED" / "NEW" chip on a handoff component — shared by the
 *  tile grid and the tab strip's inline heading so the two can't drift. */
const handoffBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#8a5a00',
  background: '#fef3e2',
  border: '1px solid #f0d9a8',
  borderRadius: 'var(--radius-pill)',
  padding: '2px 8px',
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
}

const inlineHandoffFrameStyle: React.CSSProperties = {
  padding: 24,
  background: 'var(--color-surface-page)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
}

/* ─────────────────────────────────────────────────────────────────────────
 *  DEV HANDOFF NOTES — replaces the old "Feature flags" callout. Documents
 *  the feature's key components in depth so a developer can take the next
 *  step from the prototype.
 * ───────────────────────────────────────────────────────────────────────── */

function DevHandoffSection({
  notes,
  featureId,
  embedded = false,
}: {
  notes: DevHandoffNotes
  featureId: string
  /** When true, the section sits inside the "Design & Product Decisions" tab — the tab
   *  label already names it, so the standalone heading + top margin are dropped
   *  and the intro leads straight into the tiles. */
  embedded?: boolean
}) {
  return (
    <section style={{ marginTop: embedded ? 0 : 44 }}>
      {!embedded && (
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 'var(--text-heading-2xl)',
            lineHeight: 'var(--text-heading-2xl--line-height)',
            color: 'var(--color-text-primary)',
          }}
        >
          <ClipboardList size={20} aria-hidden />
          Dev handoff notes
        </h2>
      )}
      {/* Compact cards — each opens a detail screen with the full notes
          + a live preview of the real component. Omitted when a feature keeps
          no per-component breakdown (its Live Preview covers the examples). */}
      {notes.components.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {/* Ordered by the optional `order` field (lower = earlier); un-ordered
              components keep their array position (stable sort). The 1-based
              position drives the numbered tile badge. */}
          {[...notes.components]
            .map((c, i) => ({ c, i }))
            .sort((a, b) => (a.c.order ?? a.i + 1000) - (b.c.order ?? b.i + 1000))
            .map(({ c }, i) => (
              <HandoffComponentTile key={c.id} featureId={featureId} component={c} index={i} />
            ))}
        </div>
      )}

      {notes.decisions && notes.decisions.items.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={handoffSubheadingStyle}>Design &amp; product decisions</h3>
          {notes.decisions.intro && (
            <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: '19px', color: 'var(--color-text-secondary)' }}>
              {notes.decisions.intro}
            </p>
          )}
          <ol style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, counterReset: 'decision' }}>
            {notes.decisions.items.map((d, i) => (
              <li
                key={d.question}
                style={{
                  padding: '12px 16px',
                  background: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {i + 1}. {d.question}
                  </span>
                  <DecisionStatusPill status={d.status} />
                </div>
                <span style={{ display: 'block', marginTop: 4, fontSize: 13, lineHeight: '19px', color: 'var(--color-text-secondary)' }}>
                  {d.decision}
                </span>
                {d.owner && (
                  <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    Owner / needs: {d.owner}
                  </span>
                )}
              </li>
            ))}
          </ol>
          {notes.decisions.openItems && notes.decisions.openItems.length > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: '12px 16px',
                background: 'color-mix(in srgb, var(--color-warning-500) 12%, transparent)',
                border: '1px solid var(--color-warning-500)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-warning-700)' }}>Open items</span>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {notes.decisions.openItems.map((item) => (
                  <li key={item} style={{ fontSize: 13, lineHeight: '19px', color: 'var(--color-text-secondary)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {notes.alsoConsider && notes.alsoConsider.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={handoffSubheadingStyle}>Also worth documenting</h3>
          <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notes.alsoConsider.map((p) => (
              <li
                key={p.name}
                style={{
                  padding: '12px 16px',
                  background: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {p.name}
                </span>
                <code style={pointerLocationStyle}>{p.location}</code>
                <span style={{ display: 'block', marginTop: 4, fontSize: 13, lineHeight: '19px', color: 'var(--color-text-secondary)' }}>
                  {p.note}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {notes.flagsNote && (
        <p
          style={{
            margin: '20px 0 0',
            padding: '12px 16px',
            background: 'var(--color-primary-100)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            lineHeight: '19px',
            color: 'var(--color-primary-700)',
          }}
        >
          {notes.flagsNote}
        </p>
      )}
    </section>
  )
}

/** Status pill for a design/product decision — Decided (green) / Needs weigh-in
 *  (amber) / Blocked (red). Pairs color with the label (never color alone). */
function DecisionStatusPill({ status }: { status: 'Decided' | 'Needs weigh-in' | 'Blocked' }) {
  const tone =
    status === 'Decided'
      ? { bg: 'var(--color-success-100)', fg: 'var(--color-success-700)', border: 'var(--color-success-500)' }
      : status === 'Needs weigh-in'
        ? { bg: 'var(--color-warning-100)', fg: 'var(--color-warning-700)', border: 'var(--color-warning-500)' }
        : { bg: 'var(--color-error-100)', fg: 'var(--color-error-600)', border: 'var(--color-error-500)' }
  return (
    <span
      style={{
        flexShrink: 0,
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.border}`,
      }}
    >
      {status}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
 *  DEV-CYCLE STATUS — a reviewer can mark each handoff card with where it is
 *  in the development cycle from its kebab. The selected status shows as a
 *  10px colored stroke across the top of the card (green = Ready for Dev,
 *  amber = In Development). Persisted per card in localStorage.
 * ───────────────────────────────────────────────────────────────────────── */

// Dev-cycle status type, colors, labels, and storage helpers live in the shared
// devHandoffStatusUtil module (imported above) so the landing-board tiles can
// roll a status down to every card and reflect the cards' combined state.

/** Compact card for one handoff component. Opens the per-component
 *  detail screen, which carries the full notes + a live preview. */
function HandoffComponentTile({
  featureId,
  component,
  index,
}: {
  featureId: string
  component: DevHandoffComponent
  /** 0-based position in the (ordered) list — rendered as a 1-based number
   *  badge in place of an icon. */
  index: number
}) {
  const [copied, setCopied] = useState(false)
  const statusKey = `${featureId}:${component.id}`
  // Hydrate the saved status from localStorage once at mount via a lazy
  // initializer (client-only SPA — no SSR), so the tile renders once with the
  // right value instead of empty-then-filled. Falls back to the feature's
  // AUTHORED `devStatus` so a committed status shows for every reviewer (and so
  // this card can't disagree with the landing board's tile banner, which reads
  // the same default). Resolved by id rather than threaded through two layers.
  const featureDevStatus = prototypeFeatureById(featureId)?.devStatus ?? null
  const [devStatus, setDevStatus] = useState<DevStatus | null>(
    () => readDevStatusMap()[statusKey] ?? featureDevStatus,
  )

  const setStatus = (status: DevStatus | null) => {
    setDevStatus(writeDevStatus(statusKey, status))
  }

  const shareUrl = `${PROTOTYPE_SHARE_ORIGIN}/prototype/${featureId}/handoff/${component.id}`

  const handleShare = () => {
    copyToClipboard(shareUrl)
      .then(() => setCopied(true))
      .catch(() => {
        // Last-ditch fallback: surface the link so the reviewer can copy
        // it manually rather than silently failing.
        window.prompt('Copy this link:', shareUrl)
      })
  }

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    // Clip the top status stroke to the card's rounded corners.
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    height: '100%',
    // Extra right padding so the title never slides under the kebab; extra
    // top padding when the status banner is present so content clears it.
    padding: `${devStatus ? 38 : 16}px 44px 16px 18px`,
    background: 'var(--color-surface-card)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-card)',
    color: 'inherit',
    textDecoration: 'none',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
  }
  return (
    <div style={{ position: 'relative', height: '100%' }}>
    <Link
      to={`/prototype/${featureId}/handoff/${component.id}`}
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-action)'
        e.currentTarget.style.boxShadow = 'var(--shadow-popover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
    >
      {/* Dev-cycle status banner — a colored bar across the top of the card
          carrying the status label as small white eyebrow text (blue = In
          Design, green = Ready for Dev, amber = In Development). */}
      {devStatus && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '5px 14px',
            background: DEV_STATUS_STROKE[devStatus],
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1.4,
          }}
        >
          {DEV_STATUS_LABEL[devStatus]}
        </span>
      )}
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary-100)',
          color: 'var(--color-primary-700)',
          fontFamily: 'var(--font-heading)',
          fontSize: 18,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {index + 1}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {component.name}
        </span>
        {component.badge && <span style={handoffBadgeStyle}>{component.badge}</span>}
      </span>
      <span
        style={{
          fontSize: 13,
          lineHeight: '19px',
          color: 'var(--color-text-secondary)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {component.summary}
      </span>
      <span
        style={{
          marginTop: 'auto',
          paddingTop: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-action)',
        }}
      >
        Details
        <ArrowRight size={13} aria-hidden />
      </span>
    </Link>

      {/* Kebab actions — a sibling of the Link (not nested inside the
          anchor) so it never triggers navigation and stays valid markup.
          "Share Link" copies an absolute deep link to this card's detail
          page. */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        <ActionMenu
          label={`Actions for ${component.name}`}
          items={[
            {
              id: 'in-design',
              label: devStatus === 'in-design' ? 'In Design ✓' : 'In Design',
              icon: <Lightbulb size={15} aria-hidden style={{ color: 'var(--color-info-700)' }} />,
              onSelect: () => setStatus('in-design'),
            },
            {
              id: 'needs-discussion',
              label: devStatus === 'needs-discussion' ? 'Needs Discussion ✓' : 'Needs Discussion',
              icon: <MessageCircle size={15} aria-hidden style={{ color: 'var(--color-error-600)' }} />,
              onSelect: () => setStatus('needs-discussion'),
            },
            {
              id: 'blocked',
              label: devStatus === 'blocked' ? 'Blocked ✓' : 'Blocked',
              icon: <LockSolid size={15} aria-hidden style={{ color: 'var(--color-neutral-900)' }} />,
              onSelect: () => setStatus('blocked'),
            },
            {
              id: 'ready-for-dev',
              label: devStatus === 'ready-for-dev' ? 'Ready for Dev ✓' : 'Ready for Dev',
              icon: <CircleCheck size={15} aria-hidden style={{ color: 'var(--color-success-500)' }} />,
              onSelect: () => setStatus('ready-for-dev'),
            },
            {
              id: 'in-development',
              label: devStatus === 'in-development' ? 'In Development ✓' : 'In Development',
              icon: <Bolt size={15} aria-hidden style={{ color: 'var(--color-warning-500)' }} />,
              onSelect: () => setStatus('in-development'),
            },
            ...(devStatus
              ? [
                  {
                    id: 'clear-status',
                    label: 'Clear status',
                    icon: <X size={15} aria-hidden />,
                    onSelect: () => setStatus(null),
                  },
                ]
              : []),
            {
              id: 'share',
              label: 'Share Link',
              icon: <Share2 size={15} aria-hidden />,
              onSelect: handleShare,
            },
          ]}
        />
      </div>

      <Toast open={copied} onClose={() => setCopied(false)} title="Link copied" tone="success">
        The handoff link is on your clipboard.
      </Toast>
    </div>
  )
}

/** Shared chrome for the gateway: prototype banner + back link + centered column. */
export function GatewayShell({
  children,
  back,
  maxWidth = 760,
  embedded = false,
}: {
  children: React.ReactNode
  /** Optional "← Back" pill shown in the top prototype bar (e.g. the
   *  dev-handoff detail page links back to its feature gateway). */
  back?: { to: string; label?: string; title?: string }
  /** Content max width. Defaults to 760 (the gateway list pages); the
   *  dev-handoff detail page widens this so its preview ↔ UI/UX-logic
   *  two-column block has room to sit side-by-side instead of wrapping. */
  maxWidth?: number
  /** Rendered inside another surface (the UX dashboard's content column): no
   *  prototype bar, no full-height page background, no outer padding — the host
   *  already provides all three, and a second one nests a page inside a page. */
  embedded?: boolean
}) {
  if (embedded) {
    return (
      <div className="cre-prototype-stc-accent" style={{ color: 'var(--color-text-primary)' }}>
        <div style={{ maxWidth, margin: '0 auto' }}>{children}</div>
      </div>
    )
  }

  return (
    <div
      // Same STC teal accent as the Common Dashboard landing — keeps all the
      // prototype-navigation chrome (gateway + dev-handoff detail) off the
      // active brand's purple/pink CTA ramp. See tokens.css.
      className="cre-prototype-stc-accent"
      style={{
        minHeight: '100vh',
        background: 'var(--color-surface-page)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <PrototypeBar back={back} />

      <div style={{ maxWidth, margin: '0 auto', padding: '32px 24px 80px' }}>
        {children}
      </div>
    </div>
  )
}
