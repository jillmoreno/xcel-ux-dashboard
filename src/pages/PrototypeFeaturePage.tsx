import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Bolt, CircleCheck, ClipboardList, Download, Lightbulb, LockSolid, MessageCircle, Share2, X } from '@/icons'
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { ComponentLivePreview } from './PrototypeHandoffDetailPage'
import { PrototypeBar, PROTOTYPE_BAR_HEIGHT } from '@/components/layout/PrototypeBar'
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
  DevHandoffUserStoryBody,
} from '@/components/prototype/DevHandoffNotesBody'
import { getUserJiraTickets } from '@/components/prototype/jiraTicketsUtil'
import { FeaturePreviewThumb } from '@/components/prototype/FeaturePreviewThumb'
import { buildEmbedSrc, primaryPreviewSrc } from '@/components/prototype/featurePreviewSrc'
import { RelatedJiraTickets } from '@/components/prototype/RelatedJiraTickets'
import {
  featureHandoffMarkdown,
  handoffMarkdownFilename,
} from '@/components/prototype/handoffMarkdown'

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
  if (feature.category === 'prototype' || feature.category === 'demo' || feature.category === 'dashboard')
    return '/?section=prototypes'
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
  // order stays stable). Defaults to UI Components & UX Logic, which leads the
  // set as of 2026-08-31: the components ARE the feature, and the decisions log
  // is the record of how they got that way.
  // No hash check needed here any more: a `#<componentId>--acceptance` deep link
  // wants the components tab, and that is now the default. `componentIdFromHash`
  // is still what opens the right COMPONENT inside it — see UiComponentsSection.
  const [activeTab, setActiveTab] = useState<GatewayTab>('components')

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
      {/* TWO COLUMNS (2026-08-31). Everything used to stack in one column, which
          put the thumb's 244px and the CTA's 40px between the blurb and the tab
          bar — 41% of a 598px header spent on a picture, with the page's actual
          navigation pushed to 709px, 71% down a 1000px viewport.
          The picture and the control that opens it stay together as one offer;
          they just move beside the text instead of under it.

          `flexWrap` with a `1 1 420px` text column means this degrades by
          STACKING (thumb below text) rather than by crushing either side — the
          gateway renders at ~1016px embedded and 1280 standalone, and the rail
          is a fixed 360 because that is the thumb's real width. */}
      <header
        style={{
          marginBottom: 32,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 32,
          rowGap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
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
            maxWidth: GATEWAY_PROSE_MEASURE,
            fontSize: 14,
            lineHeight: '22px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {feature.blurb}
        </p>
        {/* ONE metadata row, not two. Brands and Jira were stacked rows of the
            same label+chips shape, which read as a single noisy zone — and the
            Jira half spent a whole row rendering "None linked yet". They share a
            line now, with a hairline between them so the two groups still read
            as separate facts, and the row wraps when it runs out of width. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            rowGap: 10,
            marginTop: 16,
          }}
        >
          {feature.brands && feature.brands.length > 0 && (
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
              Demo brands:
            </span>
          )}
          {(feature.brands ?? []).map((b) => {
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
          {/* Spacing, not a rule, separates the two groups. A hairline divider
              sat here and dangled at the end of the line whenever the row
              wrapped — which it does at the embedded gateway's 624px text
              column — leaving a stray mark above an orphaned "+ Add ticket".
              Extra left margin degrades harmlessly: wrapped, it is just leading
              space. The groups still read apart because the brand pills are
              filled and colour-coded and the ticket affordance is not. */}
          <span style={{ marginLeft: feature.brands?.length ? 10 : 0 }}>
            <RelatedJiraTickets
              compact
              scopeKey={feature.id}
              configTickets={feature.jiraTickets}
              inherited={inheritedJiraTickets}
            />
          </span>
        </div>
        {/* Primary CTA — directly under Demo brands, so the live prototype is
            one click from the top of the gateway on every tab (it used to be a
            text link inside the Live Preview tab's caption). Follows the
            Demo-brands pick, so it opens the brand on screen. */}
        {/* The picture sits directly above the control that opens it, so the
            two read as one offer rather than as decoration parked elsewhere. */}
        </div>

        {/* Media rail. `flex: none` at the thumb's own 360 so it never stretches
            or shrinks — scaling it would change how the 1440px iframe inside
            crops, and the whole point of the thumb is that it is a true 1/4
            render rather than a resized one. */}
        <div style={{ width: 360, flex: 'none' }}>
          <FeaturePreviewThumb
            feature={feature}
            src={headerPreviewSrc}
            width={360}
            height={244}
            style={{
              display: 'block',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-card)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            {headerPreviewSrc && (
              <OpenLivePreviewButton href={headerPreviewSrc} featureId={feature.id} />
            )}
            <GatewayActionsMenu feature={feature} />
          </div>
        </div>
      </header>

      {/* Tab bar — the same three tabs on every feature, and STICKY: this page
          runs to ~3,700px on a documented feature, and each tab's body is long
          enough that a reviewer wants to switch from the bottom of it. Static
          tabs meant scrolling all the way back up to change view.

          The background has to be opaque or the content scrolls through it.
          `--ux-bg` is defined only when the gateway is embedded in the UX
          dashboard's content column (it inherits from that shell's palette
          root), so the fallback covers the standalone /prototype/:id route —
          one declaration, correct in both, and it tracks each surface's own
          light/dark values instead of pinning a colour. */}
      <div
        style={{
          position: 'sticky',
          // Offset by the prototype bar ONLY when it is on screen. That bar is
          // itself sticky at z-index 60, so pinning to 0 on the standalone route
          // put the tabs underneath it — visible to a scroll listener, invisible
          // to a reader. Embedded in the UX dashboard there is no bar, so 0.
          top: embedded ? 0 : PROTOTYPE_BAR_HEIGHT,
          zIndex: 5,
          marginBottom: 24,
          background: 'var(--ux-bg, var(--color-surface-page))',
        }}
      >
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
          <UiComponentsSection components={feature.devHandoff.uiComponents} embedded={embedded} />
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

/**
 * The component id inside a section deep link, or null.
 *
 * Anchors are `<componentId>--<sectionId>`, so a link a developer shares points
 * at a section of one component. Without this the hash only worked if you were
 * ALREADY on that component — which makes it a bookmark, not a link. Both the
 * gateway's tab and the component list seed from it so a pasted URL opens the
 * right place from cold. */
function componentIdFromHash(): string | null {
  const hash = typeof window === 'undefined' ? '' : window.location.hash.slice(1)
  const i = hash.indexOf('--')
  return i > 0 ? hash.slice(0, i) : null
}

/** The fixed three-tab set every feature gateway shows, in order. Labels match
 *  each panel's own heading. The ids are deliberately unchanged from when the
 *  tabs were named "Dev Handoff Notes" / "UI Components and UX Rules" — they're
 *  internal, and renaming them would churn nothing but risk. */
const GATEWAY_TABS: TabItem<GatewayTab>[] = [
  { id: 'components', label: 'UI Components & UX Logic' },
  { id: 'handoff', label: 'Design & Product Decisions' },
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
/**
 * The gateway's secondary actions, beside "Open live preview".
 *
 * A menu rather than three more buttons: none of these is the thing a reviewer
 * came to do, and three peers beside the primary CTA would flatten the one
 * action that matters into a row of four.
 *
 * Share Link copies the DEPLOYED url, not the current one — the whole point of
 * sharing is that it works for someone who is not running the dev server.
 */
function GatewayActionsMenu({ feature }: { feature: PrototypeFeature }) {
  const [toast, setToast] = useState<string | null>(null)

  const markdown = () => featureHandoffMarkdown(feature, PROTOTYPE_SHARE_ORIGIN)

  const download = () => {
    const blob = new Blob([markdown()], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = handoffMarkdownFilename(feature)
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Released on the next tick, not immediately: revoking synchronously can
    // beat the download starting in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 0)
    setToast('Handoff downloaded')
  }

  return (
    <>
      <ActionMenu
        label="More actions"
        triggerLabel="Actions"
        items={[
          {
            id: 'share',
            label: 'Share Link',
            icon: <Share2 size={15} aria-hidden />,
            onSelect: () => {
              void copyToClipboard(`${PROTOTYPE_SHARE_ORIGIN}/prototype/${feature.id}`).then(() =>
                setToast('Link copied'),
              )
            },
          },
          {
            id: 'download-md',
            label: 'Download .md',
            icon: <Download size={15} aria-hidden />,
            onSelect: download,
          },
          {
            id: 'copy-md',
            label: 'Copy .md',
            icon: <ClipboardList size={15} aria-hidden />,
            onSelect: () => {
              void copyToClipboard(markdown()).then(() => setToast('Handoff copied as Markdown'))
            },
          },
        ]}
      />
      <Toast open={toast != null} onClose={() => setToast(null)} title={toast ?? ''} tone="success">
        {toast === 'Link copied'
          ? 'The walkthrough link is on your clipboard.'
          : 'Paste it into a ticket or PR description.'}
      </Toast>
    </>
  )
}

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
/**
 * The sections of one component's handoff, in reading order.
 *
 * These were SUB-TABS for a few hours on 2026-08-31 and that was wrong — see
 * `UiComponentDetail` for why. They are now jump links over one continuous
 * scroll, which is why this is `id` + `label` rather than a tab-item type.
 */
const COMPONENT_SECTIONS = [
  // Quick Summary leads (2026-09-09, Jillienne): the designer says what this
  // thing IS, in their own plain words, before the developer meets a single
  // token or acceptance criterion. The User Story follows — the PO's framing,
  // read against the designer's.
  //
  // It REPLACED the live component render, which used to lead. That render is
  // still what the row thumbnails draw (`ComponentThumb`), so `ComponentLivePreview`
  // is still wired; it just no longer opens the detail. The reasoning: a picture
  // of the component answers "am I on the right one", which the row list already
  // answered by the time you are here — and it answered nothing about intent,
  // which is the thing a handoff exists to carry.
  //
  // This array's order MUST match the render order below: the scroll-spy walks
  // it and takes the last heading past the line, so a mismatch highlights the
  // wrong chip.
  // Named, not generic: the heading attributes the words. It is the only
  // section on the page written by a person rather than derived from the code,
  // and saying whose it is does the job the removed explainer line was doing.
  { id: 'quick-summary', label: 'Quick Summary from Jill' },
  { id: 'story', label: 'User Story' },
  { id: 'logic', label: 'UX Logic' },
  { id: 'spec', label: 'Design Spec' },
  { id: 'acceptance', label: 'Acceptance' },
  { id: 'states', label: 'States' },
  { id: 'notes', label: 'Notes' },
] as const

type ComponentSectionId = (typeof COMPONENT_SECTIONS)[number]['id']

/** Which sections a component actually has — drives the row's chips, so the list
 *  says what is documented before you spend a click finding out. */
function authoredSections(c: DevHandoffComponent): string[] {
  const out: string[] = []
  if (c.quickSummary) out.push('Quick Summary')
  if (c.userStory) out.push('User Story')
  if (c.variants.length) out.push(`${c.variants.length} variant${c.variants.length === 1 ? '' : 's'}`)
  if (c.uiUxLogic) out.push('UX Logic')
  if (c.designSpec) out.push('Design Spec')
  if (c.acceptanceCriteria?.length) out.push('Acceptance')
  if (c.statesMatrix?.length) out.push('States')
  return out
}

/**
 * "UPDATED · 8/31/26" from an ISO `badgeDate`.
 *
 * Parsed by hand rather than through `new Date(iso)` — that is UTC, and in a
 * western timezone it renders the previous day. This repo has already been
 * bitten by exactly that (see the three `daysUntil` copies), so no Date object
 * is constructed here at all: it is pure string math and cannot shift.
 */
function formatBadgeDate(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  return `${Number(m[2])}/${Number(m[3])}/${m[1].slice(2)}`
}

/** The status badge, with its date when one is authored. One component so the
 *  row and the detail header always render it the same way. */
function HandoffBadge({
  label,
  date,
  style,
}: {
  label: string
  date?: string
  style?: React.CSSProperties
}) {
  const when = date ? formatBadgeDate(date) : null
  return (
    <span style={{ ...handoffBadgeStyle, ...style }}>
      {label}
      {when && (
        // WEIGHT, never opacity, is what marks the date as the qualifier.
        // This badge's palette has limited headroom (7.62:1), so a dimmed
        // headroom, so dimming it fails AA at this 10px size — measured
        // 3.00:1 at 70%, and still 4.42:1 at 90%, against a 4.5 threshold.
        // The middot already does the separating work.
        <span style={{ fontWeight: 600 }}> &middot; {when}</span>
      )}
    </span>
  )
}

const handoffBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  // Warning ramp, not literals. It does NOT invert under [data-theme='dark'],
  // which matters because the UX dashboard sets that attribute — so these hold
  // in every appearance. 800 on 100 measures 7.62:1, up from the 5.40:1 the
  // hand-picked #8a5a00 on #fef3e2 gave.
  color: 'var(--color-warning-800)',
  background: 'var(--color-warning-100)',
  border: '1px solid var(--color-warning-200)',
  borderRadius: 'var(--radius-pill)',
  padding: '2px 8px',
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
}

/** The bordered frame each handoff section's body sits in. */
const inlineHandoffFrameStyle: React.CSSProperties = {
  padding: 24,
  background: 'var(--color-surface-page)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
}

function UiComponentsSection({
  components,
  embedded = false,
}: {
  components: DevHandoffComponent[]
  /** Forwarded so the section nav can pin below the gateway tab bar, whose own
   *  sticky offset depends on whether the prototype bar is on screen. */
  embedded?: boolean
}) {
  const ordered = [...components]
    .map((c, i) => ({ c, i }))
    .sort((a, b) => (a.c.order ?? a.i + 1000) - (b.c.order ?? b.i + 1000))
    .map(({ c }) => c)

  // `null` = the list. A component id = its detail. Master/detail rather than a
  // persistent side rail because several previews run to ~1232px wide (the
  // renewal-states trio is three real surfaces side by side) — a rail would
  // squeeze the one thing the page exists to show.
  const [openId, setOpenId] = useState<string | null>(() => {
    const fromHash = componentIdFromHash()
    return fromHash && components.some((c) => c.id === fromHash) ? fromHash : null
  })

  if (ordered.length === 0) return null

  // One component: no list to choose from, so go straight to the detail and
  // drop the back link. A list of one is pure indirection — the same reason the
  // tile grid was removed in the first place.
  if (ordered.length === 1) {
    return <UiComponentDetail component={ordered[0]} embedded={embedded} />
  }

  const open = openId ? ordered.find((c) => c.id === openId) : null

  if (open) {
    return (
      <UiComponentDetail
        // Keyed so switching components remounts the panel — several previews
        // hold local state (a selected tier, an open sheet) and a stale one
        // would carry into the next component's render.
        key={open.id}
        component={open}
        embedded={embedded}
        onBack={() => setOpenId(null)}
      />
    )
  }

  return (
    <section>
      <p
        style={{
          margin: '0 0 16px',
          fontSize: 14,
          lineHeight: '22px',
          color: 'var(--color-text-secondary)',
          maxWidth: GATEWAY_PROSE_MEASURE,
        }}
      >
        Each surface from the Live Preview, broken down into its own handoff. Open one for the
        designer&rsquo;s summary of what it is for, then the spec.
      </p>
      {/* Rows, not a pill strip. A pill gives a truncated label and nothing
        * else; at six components with names like "Sheets — Manage Membership +
        * Your Memberships" the strip was a row of abbreviations. A row carries
        * the full name, the summary, and chips naming what is actually
        * documented — so the list answers "is there a spec on this one?"
        * without spending a click. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ordered.map((c, i) => (
          <UiComponentRow key={c.id} component={c} index={i + 1} onOpen={() => setOpenId(c.id)} />
        ))}
      </div>
    </section>
  )
}

/**
 * An inert miniature of a component's own live preview, for the row list.
 *
 * Same idea as `FeaturePreviewThumb` — a live render rather than a capture,
 * because there is no build step here to re-shoot captures and a static one
 * starts drifting the moment the component changes. Different mechanism: these
 * previews are inline React, not an iframe, so the miniature is a CSS scale of
 * the real thing rather than a shrunken document.
 *
 * COST is the whole design problem. Six previews is not six cheap components —
 * the renewal-states trio alone renders six states across three surfaces. So
 * this mounts NOTHING until the row is near the viewport, and once mounted it
 * disconnects: a list that never scrolls pays for the rows you can see.
 *
 * Inert by construction (`aria-hidden`, `pointer-events: none`, and it renders
 * inside a button) — it is a picture of the component, not a second copy to
 * click. The scale shows the top-left, which is where every one of these
 * previews puts its most identifying content.
 */
function ComponentThumb({ component }: { component: DevHandoffComponent }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const componentId = component.id

  useEffect(() => {
    const el = ref.current
    // An authored image needs no observer and no mount — the whole point of it
    // is that nothing boots.
    if (!el || mounted || component.thumbnail) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setMounted(true)
        io.disconnect()
      },
      // Ahead of the fold, so a scroll finds the picture already there rather
      // than watching it pop in.
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mounted, component.thumbnail])

  const scale = THUMB_W / THUMB_RENDER_W
  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        flex: 'none',
        width: THUMB_W,
        height: THUMB_H,
        overflow: 'hidden',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border-subtle)',
        background: 'var(--color-surface-card)',
        pointerEvents: 'none',
      }}
    >
      {component.thumbnail ? (
        <img
          src={component.thumbnail}
          alt=""
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top left',
            display: 'block',
          }}
        />
      ) : (
        mounted && (
        <div
          style={{
            width: THUMB_RENDER_W,
            height: THUMB_H / scale,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* No fallback text: at this size a sentence is illegible, so an
              unregistered preview shows the empty plate instead. */}
          <ComponentLivePreview componentId={componentId} fallback={null} />
        </div>
        )
      )}
    </div>
  )
}

/** Thumb box, and the width the preview is rendered at before scaling. 1280 is
 *  the gateway's own content width, so the miniature is a picture of the layout
 *  the component actually gets rather than of its narrow reflow. */
const THUMB_W = 104
const THUMB_H = 68
const THUMB_RENDER_W = 1280

function UiComponentRow({
  component,
  index,
  onOpen,
}: {
  component: DevHandoffComponent
  index: number
  onOpen: () => void
}) {
  const [hover, setHover] = useState(false)
  const chips = authoredSections(component)
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)',
        background: hover ? 'var(--color-surface-hover)' : 'var(--color-surface-card)',
        cursor: 'pointer',
        font: 'inherit',
      }}
    >
      <span
        aria-hidden
        style={{
          flex: 'none',
          width: 24,
          height: 24,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-primary-100)',
          color: 'var(--color-primary-700)',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {index}
      </span>
      <ComponentThumb component={component} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {component.name}
        </span>
        <span
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginTop: 4,
            maxWidth: GATEWAY_PROSE_MEASURE,
            fontSize: 13,
            lineHeight: '19px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {component.summary}
        </span>
        {chips.length > 0 && (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {chips.map((label) => (
              <span
                key={label}
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-neutral-75)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {label}
              </span>
            ))}
          </span>
        )}
      </span>
      {/* Right-aligned, in its own column rather than trailing the name. On the
          name line the badge sat at a different x on every row (names vary in
          length), so the statuses could not be compared down the list; pinned
          right they line up. `marginTop` matches the name's cap height so it
          reads as belonging to the title row it left. */}
      {component.badge && (
        <HandoffBadge
          label={component.badge}
          date={component.badgeDate}
          style={{ flex: 'none', marginTop: 2 }}
        />
      )}
      <ArrowRight
        size={14}
        aria-hidden
        style={{ flex: 'none', marginTop: 4, color: 'var(--color-text-tertiary)' }}
      />
    </button>
  )
}

/**
 * The default state of a Quick Summary: an empty box waiting for the designer.
 *
 * Deliberately NOT the quiet "add `quickSummary`" line every other un-authored
 * section shows. Those tell a developer that a spec field is missing, and cost
 * almost no height on purpose. This one is addressed to JILLIENNE, and it is the
 * one field on the page nobody else can fill — so it takes real space and reads
 * as a slot, not a footnote.
 *
 * The dashed rule is what says "empty on purpose": a solid frame at this size
 * reads as a card whose content failed to load. Text is `--color-text-secondary`
 * (7.51:1 on the page surface), not the `--color-text-tertiary` the quiet lines
 * use — that is 3.57:1 here, and a prompt nobody can read is not a prompt.
 *
 * It carries the SAME left stroke and fill as the filled state, so the two read
 * as one section in two conditions rather than as two different boxes; only the
 * dashed remainder separates waiting from written.
 */
function QuickSummaryPlaceholder() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: 88,
        padding: '18px 20px',
        border: '1px dashed var(--color-border-subtle)',
        borderLeft: '4px solid var(--color-primary-500)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface-page)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 14.5,
          lineHeight: '23px',
          color: 'var(--color-text-secondary)',
        }}
      >
        Jill add your notes here
      </p>
    </div>
  )
}

/**
 * The designer's own words about a component.
 *
 * Deliberately the plainest render on the page: no chrome, no frame, no
 * labelled fields — prose at the reading measure, one step up in size from the
 * spec around it so it reads as someone talking rather than as another
 * documentation block.
 *
 * The formatting vocabulary is TWO things and must stay small — the moment this
 * grows fields it becomes a form, and a form is what a designer writing in
 * their own words is being spared:
 *
 *   1. Blank lines split blocks.
 *   2. A block whose every line starts `* ` or `- ` is a list.
 *
 * Single newlines inside a paragraph are PRESERVED (`pre-line`) rather than
 * collapsed. That is not a nicety: notes get pasted in from somewhere else with
 * their own line structure, and silently reflowing them edits the designer's
 * words. The first Quick Summary written for this field was a lead-in, three
 * bullets and a closing line — reflowed, it would have run together into one
 * paragraph containing literal asterisks.
 */
function QuickSummaryBody({ text }: { text: string }) {
  const proseStyle: React.CSSProperties = {
    margin: 0,
    maxWidth: GATEWAY_PROSE_MEASURE,
    fontSize: 14.5,
    lineHeight: '23px',
    color: 'var(--color-text-primary)',
  }
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)

  return (
    // The shared section frame verbatim — same fill as every other section — with
    // one embellishment: a 4px brand stroke down the left edge. The fill was
    // white for a few minutes and that was the louder, worse version; a stroke
    // marks the section without making it a different KIND of box.
    //
    // It replaces the frame's 1px left border rather than sitting inside it, so
    // there is no doubled edge; the 3px that adds to the left inset is invisible
    // against a 24px padding and keeps the stroke reading as part of the frame.
    //
    // `--color-primary-500` here is NOT the product brand's blue — the gateway
    // wraps itself in `.cre-prototype-stc-accent` (tokens.css L1153), which
    // re-points the primary ramp at the page's own teal. So the stroke lands on
    // the same #358087 as the active tab underline above it and reads as part of
    // THIS page's system rather than as a brand colour leaking into a doc page.
    // Measured 4.2:1 on the page surface — decorative, but it clears the 3:1
    // non-text bar rather than relying on it being noticed.
    <div
      style={{
        ...inlineHandoffFrameStyle,
        borderLeft: '4px solid var(--color-primary-500)',
        display: 'grid',
        gap: 12,
      }}
    >
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        const isList = lines.length > 0 && lines.every((l) => /^[*-]\s+/.test(l))
        if (isList) {
          return (
            // `listStyle` is set explicitly: the app's reset zeroes it globally,
            // so an unstyled <ul> renders as indented lines with no markers —
            // which reads as a paragraph someone tabbed, not a list.
            <ul
              key={i}
              style={{ ...proseStyle, margin: 0, paddingLeft: 22, listStyle: 'disc', display: 'grid', gap: 6 }}
            >
              {lines.map((line, j) => (
                <li key={j}>{line.replace(/^[*-]\s+/, '')}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} style={{ ...proseStyle, whiteSpace: 'pre-line' }}>
            {lines.join('\n')}
          </p>
        )
      })}
    </div>
  )
}

/**
 * One component's handoff: every section on ONE continuous scroll, with a sticky
 * jump nav over it.
 *
 * This was SUB-TABS for a few hours on 2026-08-31 and a developer reported it
 * was harder to work with. They were right, and the reason is concrete: the
 * inactive panels were conditionally rendered, so their content was not in the
 * DOM at all. That breaks four things a developer does constantly and a reviewer
 * never does — find-in-page across the handoff, select-all-and-paste into a
 * ticket, print/PDF, and any deep link to a section.
 *
 * The complaint that produced the tabs was real (stacked sections ran past
 * 3,000px and buried the acceptance criteria), but that is a NAVIGATION problem
 * and hiding content is the wrong lever for it. Jump links fix the navigation
 * and cost the developer nothing.
 *
 * So: keep everything mounted, give each section a real `id`, and let the nav
 * scroll rather than swap. If this ever looks like it wants to be tabs again,
 * re-read the four things above first.
 */
function UiComponentDetail({
  component,
  embedded = false,
  onBack,
}: {
  component: DevHandoffComponent
  embedded?: boolean
  /** Omitted when the feature has a single component — there is no list to
   *  return to. */
  onBack?: () => void
}) {
  const [activeSection, setActiveSection] = useState<ComponentSectionId>('quick-summary')
  const anchorFor = (id: ComponentSectionId) => `${component.id}--${id}`

  // The nav pins directly below the gateway's own sticky tab bar, so the two
  // stack rather than overlap.
  const navTop = (embedded ? 0 : PROTOTYPE_BAR_HEIGHT) + GATEWAY_TAB_BAR_HEIGHT
  // Headings clear BOTH sticky bars plus this nav, or a jump lands the heading
  // underneath them — the classic anchor-under-a-sticky-header bug.
  const headingScrollMargin = navTop + 56

  // Scroll-spy: the active section is the last one whose heading has passed
  // under the nav. A plain scroll listener rather than IntersectionObserver
  // because "last one past the line" is exactly what this expresses, and it
  // stays correct for a short final section that never fills the viewport
  // (an observer would leave that one unhighlighted).
  useEffect(() => {
    const onScroll = () => {
      let current: ComponentSectionId = COMPONENT_SECTIONS[0].id
      for (const sec of COMPONENT_SECTIONS) {
        const el = document.getElementById(`${component.id}--${sec.id}`)
        if (el && el.getBoundingClientRect().top <= navTop + 72) current = sec.id
      }
      setActiveSection(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [component.id, navTop])

  // Land on the right section when someone opens a shared link.
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash.startsWith(`${component.id}--`)) return
    const el = document.getElementById(hash)
    if (el) el.scrollIntoView({ block: 'start' })
  }, [component.id])

  const jump = (id: ComponentSectionId) => {
    const el = document.getElementById(anchorFor(id))
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // `replaceState`, not `location.hash = …`: the hash is a deep link a
    // developer can send, but assigning it would push a router navigation and
    // fight the smooth scroll.
    window.history.replaceState(null, '', `#${anchorFor(id)}`)
  }

  /** One section. `body` is null when the field isn't authored, which renders a
   *  single quiet line instead of a boxed empty state — an un-authored section
   *  should cost almost no height on a page you scroll through. */
  const section = (
    id: ComponentSectionId,
    label: string,
    /** The one-line explainer under the heading. Pass `null` to omit it — Quick
     *  Summary does, because a line telling the reader they are about to read
     *  the designer's own words sits between the heading and those words and
     *  says nothing the heading has not. */
    note: string | null,
    body: React.ReactNode | null,
    missingField?: string,
    /** Skip the shared bordered frame. The Preview section passes it because
     *  each variant inside now carries its own container — framing them again
     *  puts a box in a box and makes the set read as one long thing. */
    unframed = false,
  ) => (
    <div style={{ marginTop: 32 }}>
      <h4 id={anchorFor(id)} style={{ ...handoffSubheadingStyle, margin: 0, scrollMarginTop: headingScrollMargin }}>
        {label}
      </h4>
      {note && (
        <p
          style={{
            margin: '6px 0 0',
            maxWidth: GATEWAY_PROSE_MEASURE,
            fontSize: 13,
            lineHeight: '19px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {note}
        </p>
      )}
      {body ? (
        <div style={unframed ? { marginTop: 12 } : { ...inlineHandoffFrameStyle, marginTop: 12 }}>
          {body}
        </div>
      ) : (
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-tertiary)' }}>
          Not authored yet — add <code>{missingField}</code> in{' '}
          <code>src/data/prototypeFeatures.ts</code>.
        </p>
      )}
    </div>
  )

  return (
    <section>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
            padding: 0,
            border: 'none',
            background: 'none',
            color: 'var(--color-action)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span aria-hidden>&larr;</span> All components
        </button>
      )}

      <h3 style={{ ...handoffSubheadingStyle, margin: 0 }}>
        {component.name}
        {component.badge && (
          <HandoffBadge
            label={component.badge}
            date={component.badgeDate}
            style={{ marginLeft: 8 }}
          />
        )}
      </h3>
      <p style={{ ...pointerLocationStyle, margin: '8px 0 0' }}>{component.location}</p>

      {/* Jump nav. Looks like the pill strip it replaced on purpose — the shape
          was never the problem, the hiding was. `aria-current` rather than
          `role="tab"`: these navigate within a document now, and announcing them
          as tabs would promise a panel swap that no longer happens. */}
      <nav
        aria-label="Sections"
        style={{
          position: 'sticky',
          top: navTop,
          zIndex: 4,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          margin: '16px 0 0',
          padding: '10px 0',
          background: 'var(--ux-bg, var(--color-surface-page))',
        }}
      >
        {COMPONENT_SECTIONS.map((sec) => {
          const on = sec.id === activeSection
          return (
            <button
              key={sec.id}
              type="button"
              aria-current={on ? 'true' : undefined}
              onClick={() => jump(sec.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-xl)',
                border: 'none',
                background: on ? 'var(--color-tab-active)' : 'transparent',
                color: on ? 'var(--color-text-inverse)' : 'var(--color-neutral-dark)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: on ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {sec.label}
            </button>
          )
        })}
      </nav>

      {section(
        'quick-summary',
        'Quick Summary from Jill',
        null,
        // Never null: the un-authored state is its own designed box, not the
        // shared "add this field" line — see `QuickSummaryPlaceholder`.
        component.quickSummary ? (
          <QuickSummaryBody text={component.quickSummary} />
        ) : (
          <QuickSummaryPlaceholder />
        ),
        undefined,
        // Unframed: the spec frame exists to bound token tables and variant
        // grids. Plain prose in a box reads as one more spec artefact, which is
        // the opposite of what this section is.
        true,
      )}

      {section(
        'story',
        'User Story',
        'The Product Owner’s framing — who this is for, what they want, and why it earns a place on the roadmap.',
        component.userStory ? <DevHandoffUserStoryBody story={component.userStory} /> : null,
        'userStory',
      )}

      {section(
        'logic',
        'UX Logic',
        'The reasoning and rules worked through while designing this component.',
        component.uiUxLogic ? <DevHandoffUiUxLogicBody logic={component.uiUxLogic} /> : null,
        'uiUxLogic',
      )}

      {section(
        'spec',
        'Design Spec',
        'Named tokens, states, and responsive notes — values live in tokens.css and Figma, so nothing here restates raw hex / px and can’t drift.',
        component.designSpec ? <DevHandoffDesignSpecBody spec={component.designSpec} /> : null,
        'designSpec',
      )}

      {section(
        'acceptance',
        'Acceptance',
        'Build against these and QA verifies them — the Definition of Done for this component.',
        component.acceptanceCriteria && component.acceptanceCriteria.length > 0 ? (
          <DevHandoffAcceptanceBody items={component.acceptanceCriteria} />
        ) : null,
        'acceptanceCriteria',
      )}

      {section(
        'states',
        'States',
        'Every state the build must handle — including loading, empty, error, and overflow paths the happy-path variants don’t show.',
        component.statesMatrix && component.statesMatrix.length > 0 ? (
          <DevHandoffStatesMatrixBody rows={component.statesMatrix} />
        ) : null,
        'statesMatrix',
      )}

      {section(
        'notes',
        'Notes',
        'The full written handoff — variants, UX logic, data, stubs, and a11y.',
        <DevHandoffNotesBody component={component} />,
      )}
    </section>
  )
}

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
            <p
              style={{
                margin: '8px 0 0',
                maxWidth: GATEWAY_PROSE_MEASURE,
                fontSize: 13,
                lineHeight: '19px',
                color: 'var(--color-text-secondary)',
              }}
            >
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
                <span
                  style={{
                    display: 'block',
                    marginTop: 4,
                    maxWidth: GATEWAY_PROSE_MEASURE,
                    fontSize: 13,
                    lineHeight: '19px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
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
                  <li
                    key={item}
                    style={{
                      maxWidth: GATEWAY_PROSE_MEASURE,
                      fontSize: 13,
                      lineHeight: '19px',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
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
            color: 'var(--color-text-inverse)',
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
/**
 * Reading measure for prose on the gateway.
 *
 * The content column is 760–1440px wide depending on the page, and every long
 * paragraph inherited that full width — measured at **145 characters per line**
 * on the embedded gateway, roughly double the comfortable 45–75. That is what
 * made the page feel chaotic: at 145ch the eye cannot reliably find the start of
 * the next line, so well-written prose still reads as a wall.
 *
 * `ch` rather than px so it tracks the font size, and the same idiom the
 * BenefitSections headers already use (52ch / 80ch). 76ch is at the roomy end of
 * the range on purpose — this is technical prose full of `code` spans, which
 * read worse when broken too often.
 *
 * Applies to PROSE only. Tables, card grids and the decision rows keep the full
 * column: they are scanned, not read line by line.
 */
export const GATEWAY_PROSE_MEASURE = '76ch'

/** Height of the gateway's own sticky tab bar. The component section nav pins
 *  directly BELOW it, so the two stack instead of overlapping — measured, and
 *  they have to move together if the tab bar's padding ever changes. */
export const GATEWAY_TAB_BAR_HEIGHT = 49

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
