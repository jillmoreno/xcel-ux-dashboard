import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight, ClipboardList, Download, Share2 } from '@/icons'
import { ComponentLivePreview } from './PrototypeHandoffDetailPage'
import { ComponentPreviewThumb } from '@/components/prototype/ComponentPreviewThumb'
import { PrototypeBar, PROTOTYPE_BAR_HEIGHT } from '@/components/layout/PrototypeBar'
import { setPrototypeWalkthrough } from '@/components/layout/prototypeWalkthrough'
import { useAccount, professionFor } from '@/context/AccountContext'
import {
  prototypeFeatureById,
  type DevHandoffComponent,
  type DevHandoffDecisions,
  type PrototypeFeature,
} from '@/data/prototypeFeatures'
import {
  handoffProseStyle,
  handoffSubheadingStyle,
} from '@/components/prototype/devHandoffStyles'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Toast } from '@/components/ui/Toast'
import { PROTOTYPE_SHARE_ORIGIN, copyToClipboard } from '@/components/prototype/shareLink'
import {
  DevHandoffDesignSpecBody,
  DevHandoffAcceptanceBody,
  DevHandoffStatesMatrixBody,
  DevHandoffVariantsBody,
  DevHandoffOptionsBody,
  DevHandoffCtasBody,
  BulletList,
} from '@/components/prototype/DevHandoffNotesBody'
import { getUserJiraTickets } from '@/components/prototype/jiraTicketsUtil'
import { primaryPreviewSrc } from '@/components/prototype/featurePreviewSrc'
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

/** The home-page section a feature lands in, as a URL. Kept in step with
 *  `sectionOf` in UxDashboardPage — same order of precedence, same fallbacks. */
function backSectionHref(feature: PrototypeFeature): string {
  // Any authored status is a position on the Development board (Design is
  // retired, 2026-10-15); everything else without a product category is a
  // document, which is Explorations.
  if (feature.devStatus) return '/?section=development'
  if (feature.category === 'prototype' || feature.category === 'demo' || feature.category === 'dashboard')
    return '/?section=prototypes'
  if (feature.category === 'testing') return '/?section=development'
  return '/?section=exploration'
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
      {/* ⚠ THUMB LEFT, CTAs TOP RIGHT (2026-10-21, Jillienne: "move the preview
          image to be to the left of the title section and the same size as shown
          on the preview page (thumbnail), make the Open live preview and actions
          be the main CTA buttons in the top right of the page").

          It was text-left / thumb-right, with the two buttons tucked under the
          thumb — so the page's primary actions sat two-thirds of the way down a
          244px picture, in the one place a reader does not look for them. Now
          the picture identifies the page at its left edge, the title reads
          beside it, and the actions are where actions go.

          The thumb is the LANDING PAGE's size (160x110, `THUMB_W`/`THUMB_H`)
          rather than its own 360x244 — it is an identifier here, not an offer,
          because the offer is now a button with words on it.

          `flexWrap` with a `1 1 320px` text column means this degrades by
          stacking rather than by crushing any of the three. */}
      <header
        style={{
          marginBottom: 32,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 24,
          rowGap: 20,
          flexWrap: 'wrap',
        }}
      >
        {/* The same picture the project row on the landing page shows, larger
            — see `ComponentPreviewThumb`. 300x210 so it reaches the bottom of
            the paragraph beside it. */}
        <ComponentPreviewThumb
          feature={feature}
          src={headerPreviewSrc}
          width={300}
          height={210}
          style={{ boxShadow: 'var(--shadow-card)' }}
        />

        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
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
        {/* ⚠ THIS IS THE SUMMARY (2026-10-21, Jillienne: "this is the summary.
            Adjust the font size to match the body font size of the rest of the
            application. And then lets REMOVE the summary section. It's just
            repeating itself."). The component detail used to open with its own
            Summary section saying the same thing one scroll further down. */}
        <p style={{ ...handoffProseStyle, margin: '14px 0 0' }}>{feature.blurb}</p>
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
        </div>

        {/* The page's primary actions. `marginLeft: auto` pins them right while
            still letting the row wrap them under the text on a narrow column. */}
        <div
          style={{
            flex: 'none',
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {headerPreviewSrc && (
            <OpenLivePreviewButton href={headerPreviewSrc} featureId={feature.id} />
          )}
          <GatewayActionsMenu feature={feature} />
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
      {/* ⚠ ONE PAGE PER HANDOFF (2026-10-21, Jillienne: "I want to take this tab
          detail, and put it in the same page we are looking at. ONE PAGE per
          handoff. Quick filters to navigate to that section.")

          The three tabs — UI Components & UX Logic, Design & Product Decisions,
          Live Preview — are gone. They split one document across three places a
          reader had to know to look in, and the component detail already had a
          chip strip that scrolls to a section rather than swapping a panel. The
          decisions log and the live preview are now two more sections in that
          same scroll, reachable from the same chips. */}
      {feature.devHandoff?.uiComponents?.length ? (
        <UiComponentsSection
          components={feature.devHandoff.uiComponents}
          embedded={embedded}
          decisions={feature.devHandoff.decisions}
        />
      ) : (
        <TabEmptyState featureId={feature.id} field="devHandoff.uiComponents">
          No per-component breakdown yet — this feature&rsquo;s UI components and the UX logic
          behind them haven&rsquo;t been split out.
        </TabEmptyState>
      )}
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


/* ─────────────────────────────────────────────────────────────────────────
 *  LIVE PREVIEW TAB — embeds the feature's real route fullscreen, with the
 *  walkthrough route switcher + Member/Non-member filter folded in above the
 *  embed. Renders the actual pages in an iframe (same origin), so it can't
 *  drift from the build. Brand / membership are passed to the embed as query
 *  params so the preview renders in the right context WITHOUT touching the
 *  global demo account (which would fight the gateway's account-pinning
 *  effect).
 * ───────────────────────────────────────────────────────────────────────── */

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
  // The Summary leads: what this thing IS, before the developer meets a single
  // token or acceptance criterion.
  //
  // ⚠ THE USER STORY IS GONE (2026-10-21, Jillienne: "remove user story from
  // all of the dev handoff notes. Anything that needs to be said is in the
  // summary or the attached jira ticket"). It was never authored on a single
  // component — ten of them, ten "Not authored yet" boxes — because the thing
  // it asked for was already being said twice over: who it is for and why it
  // matters is the Summary's job, and the roadmap case belongs to the ticket.
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
  // "Summary" since 2026-10-21 — it was "Quick Summary from Jill", which
  // attributed the words because the field was hers to dictate and Claude's
  // never to draft. That rule is gone (see the dev-handoff-notes skill), so
  // the heading stops naming an author. The ID is unchanged: `#<component>--
  // quick-summary` deep links are in circulation and a label is not a route.
  // VARIANTS (2026-10-20) — the one section that had no home on this page.
  // The live, all-variants renders existed but were reachable only from
  // `/prototype/:featureId/handoff/:componentId`, whose only link is the tile
  // grid over `devHandoff.components` — and every feature here keeps its
  // components in `uiComponents`, so that grid is empty and the route could
  // only be reached by typing it. The renders now sit with their prose, on the
  // page the rows actually open.
  // STATES · OPTIONS · FLOWS (2026-10-20, Jillienne: "imagine this is like a
  // Figma file handoff ... this is what the default look should be, this is
  // what expired should look like, what are all the logic flows"). One list
  // used to hold four different kinds of thing — a state (Expired), a display
  // toggle (Left-aligned column), a prototype branch (White / E2E chrome) and
  // a part of the component (Figure rows) — so a reader could not tell which
  // of them they had to choose between. They are three questions, and they get
  // three sections.
  /* ⚠ ORDER SET 2026-10-21: "States · CTAs · Questions · Edge Cases · Design
     Spec · Acceptance". It reads as what the thing is, what you can do with it,
     what nobody has decided, what else it has to survive — and only then the
     numbers. Spec and the Definition of Done are what a developer opens last,
     so they sit last; before this they split the questions off from the states
     they are about.

     ⚠ THIS ARRAY'S ORDER MUST MATCH THE RENDER ORDER BELOW. The scroll-spy
     walks it and takes the last heading past the line, so a mismatch
     highlights the wrong chip — `UxDashboard.smoke.test.tsx` pins the two
     together. */
  { id: 'variants', label: 'States' },
  { id: 'options', label: 'Options' },
  { id: 'ctas', label: 'CTAs' },
  /* Feature-level, folded in when the tabs went (2026-10-21).
     ⚠ "QUESTIONS", not "Decisions": almost every row in it is a question
     nobody has answered, so the old heading promised a record of settled calls
     and delivered an open list. The id stays `decisions` — deep links are in
     circulation, and the data field is still `devHandoff.decisions`.
     ⚠ AND THERE IS NO LIVE PREVIEW SECTION. It was here for a few minutes and
     came straight back out: the header already carries an "Open live preview"
     button, and a second copy of the whole route embedded in the document was
     the same page twice on one screen. */
  { id: 'decisions', label: 'Questions' },
  { id: 'edge-states', label: 'Edge cases' },
  { id: 'spec', label: 'Design Spec' },
  { id: 'acceptance', label: 'Acceptance' },
] as const

type ComponentSectionId = (typeof COMPONENT_SECTIONS)[number]['id']

/** Which sections a component actually has — drives the row's chips, so the list
 *  says what is documented before you spend a click finding out. */
function authoredSections(c: DevHandoffComponent): string[] {
  const out: string[] = []
  if (c.variants.length) out.push(`${c.variants.length} variant${c.variants.length === 1 ? '' : 's'}`)
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
  decisions,
}: {
  components: DevHandoffComponent[]
  /** Forwarded so the section nav can pin below the gateway tab bar, whose own
   *  sticky offset depends on whether the prototype bar is on screen. */
  embedded?: boolean
  /** The feature's decisions log, rendered as the last section of the component
   *  detail's single scroll — see the one-page note on the page body. Feature-level, so only one component's detail shows them
   *  at a time, which is all a reader can see anyway. */
  decisions?: DevHandoffDecisions
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
    return (
      <UiComponentDetail
        component={ordered[0]}
        embedded={embedded}
        decisions={decisions}
      />
    )
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
        decisions={decisions}
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
      {/* The list has no chip strip of its own, so these render plainly beneath
          it — a reader on the list still gets the whole handoff on one page. */}
      {decisions && decisions.items.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h4 style={handoffSubheadingStyle}>Questions</h4>
          <div style={{ ...inlineHandoffFrameStyle, marginTop: 12 }}>
            <DecisionsBody decisions={decisions} />
          </div>
        </div>
      )}
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
  decisions,
  onBack,
}: {
  component: DevHandoffComponent
  embedded?: boolean
  /** See `UiComponentsSection` — the last section of the one-page scroll. */
  decisions?: DevHandoffDecisions
  /** Omitted when the feature has a single component — there is no list to
   *  return to. */
  onBack?: () => void
}) {
  const [activeSection, setActiveSection] = useState<ComponentSectionId>('variants')
  const anchorFor = (id: ComponentSectionId) => `${component.id}--${id}`

  // Options and Flows are the only two sections that can be absent (see the
  // note at their render below), so they are the only two that can leave a
  // DEAD CHIP — one that highlights nothing and jumps nowhere, because
  // `jump` finds no element and returns. Filtering here rather than at the
  // nav keeps the scroll-spy walking the same list the strip draws; the two
  // reading different lists is how the wrong chip gets highlighted.
  const sections = COMPONENT_SECTIONS.filter((sec) => {
    if (sec.id === 'options') return Boolean(component.options?.length)
    if (sec.id === 'ctas') return Boolean(component.ctas?.length)
    if (sec.id === 'decisions') return Boolean(decisions?.items.length)
    return true
  })

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
      let current: ComponentSectionId = sections[0].id
      for (const sec of sections) {
        const el = document.getElementById(`${component.id}--${sec.id}`)
        if (el && el.getBoundingClientRect().top <= navTop + 72) current = sec.id
      }
      setActiveSection(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component.id, navTop, sections.length])

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
      {/* ⚠ NO FILE PATH HERE (2026-10-21, Jillienne: "remove this useless
          info"). A monospace line of repo path sat under the component's name
          as the second thing on the page — ahead of the Summary — and it is not
          what anyone opens a handoff to read. The Design Spec's "Sources of
          truth" already lists the files, which is where a reader goes looking
          for them. `location` stays in the data as the pointer it is; it just
          stops being a headline. */}

      {/* Jump nav. Looks like the pill strip it replaced on purpose — the shape
          was never the problem, the hiding was. `aria-current` rather than
          `role="tab"`: these navigate within a document now, and announcing them
          as tabs would promise a panel swap that no longer happens. */}
      <nav
        aria-label="Sections"
        /* ⚠ IT NEEDS ITS OWN SURFACE (2026-10-21, Jillienne: "add a light
           background color to this component to see better as we are scrolling
           down"). It was the page's own colour, which is invisible against the
           page — so while scrolling, content passed UNDER a strip you could not
           see, and the chips read as floating words. A fill plus a hairline
           under it makes it a bar; the negative margins and matching padding
           let that fill reach the full width of the column while the chips stay
           on the text's left edge. */
        style={{
          position: 'sticky',
          top: navTop,
          zIndex: 4,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          margin: '16px -16px 0',
          padding: '10px 16px',
          background: 'var(--color-surface-card)',
          borderBottom: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        }}
      >
        {sections.map((sec) => {
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
        'variants',
        'States',
        'What the learner sees, and when. Each one beside the real component in that state — not a screenshot, so a row cannot drift from the build.',
        component.variants.length > 0 ? (
          <DevHandoffVariantsBody componentId={component.id} variants={component.variants} />
        ) : null,
        'variants',
        // Unframed: each row carries its own render surface and its own rule,
        // so the shared frame would be a box around a column of boxes.
        true,
      )}

      {/* Options and Flows are the two sections that DO disappear when
          unauthored, unlike every other one here. The always-render rule
          exists so a reader can tell "nobody documented this" from "this
          feature does not work that way" — and for a display toggle those are
          the same thing. Most components have no options at all, so an
          always-present empty section would be noise on the majority of pages
          to make a distinction that carries nothing. */}
      {component.options && component.options.length > 0 &&
        section(
          'options',
          'Options',
          'Display toggles. These compose with the states above rather than replacing them — any state can be shown with any option.',
          <DevHandoffOptionsBody options={component.options} />,
        )}


      {component.ctas &&
        component.ctas.length > 0 &&
        section(
          'ctas',
          'CTAs',
          'Every control on the component, and what it does.',
          <DevHandoffCtasBody ctas={component.ctas} />,
        )}

      {decisions && decisions.items.length > 0 &&
        section(
          'decisions',
          'Questions',
          'The product and design questions this component raised, and where each one stands.',
          <DecisionsBody decisions={decisions} />,
        )}

      {/* ONE edge-case list, not two (2026-10-21). The matrix rows and the
          prose cases used to render in different sections under the same
          word — `statesMatrix` here, `uiUxLogic.edgeCases` up inside UX Logic
          — so neither list was the complete answer to "what else do I have to
          handle". */}
      {section(
        'edge-states',
        'Edge cases',
        'The paths the states above don’t show — loading, empty, error, overflow, and the conditions worth knowing before you build.',
        (component.statesMatrix && component.statesMatrix.length > 0) ||
          (component.edgeCases && component.edgeCases.length > 0) ? (
          <>
            {component.statesMatrix && component.statesMatrix.length > 0 && (
              <DevHandoffStatesMatrixBody rows={component.statesMatrix} />
            )}
            {component.edgeCases && component.edgeCases.length > 0 && (
              <div style={{ marginTop: component.statesMatrix?.length ? 16 : 0 }}>
                <BulletList items={component.edgeCases} />
              </div>
            )}
          </>
        ) : null,
        'statesMatrix',
      )}

      {section(
        'spec',
        'Design Spec',
        'Every token with its resolved value, read live from tokens.css in the Atlas context the component is drawn in — so the spec cannot disagree with the render above it.',
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

    </section>
  )
}

/**
 * The design & product decisions log — its own component since 2026-10-21, when
 * the tab that used to hold it became a section of the one-page handoff.
 */
function DecisionsBody({ decisions }: { decisions: DevHandoffDecisions }) {
  return (
    <>
          {decisions.intro && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                lineHeight: '19px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {decisions.intro}
            </p>
          )}
          <ol style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, counterReset: 'decision' }}>
            {decisions.items.map((d, i) => (
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
          {decisions.openItems && decisions.openItems.length > 0 && (
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
                {decisions.openItems.map((item) => (
                  <li
                    key={item}
                    style={{
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
    </>
  )
}

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
/**
 * ⚠ NO LONGER USED ON THE HANDOFF (2026-10-21, Jillienne: "why is text capped
 * at this width. Use the space. Spread it out.").
 *
 * A 76ch measure is the right default for a page of prose, and this is not one:
 * it is a reference document read in a 1230px column beside pictures of the
 * thing it describes. Capping the text at two-thirds of that left a ragged
 * right edge against full-width renders and made every section look like it had
 * been squeezed. Kept exported because other surfaces still import it.
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
