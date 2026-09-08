import { useCallback, useState, type ComponentType, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Award,
  AwardSolid,
  Bolt,
  CalendarDay,
  ChalkboardUser,
  Check,
  CircleCheck,
  ClipboardList,
  Crown,
  GemSolid,
  MessageCircle,
  Monitor,
  PenToSquare,
  RubiMark,
  RubiWordmark,
} from '@/icons'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { Button } from '@/components/ui/Button'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import {
  useAccount,
  memberTiersFor,
  multiMembershipsFor,
  type Brand,
  type MembershipTier,
  type MembershipRecord,
} from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { Modal } from '@/components/ui/Modal'
import { membershipCompareFor, type MembershipComparePlan } from '@/data/membership/membershipUpgradeFixtures'
import { ComparePlanCard, compareGridStyle, MembershipUpgradeModal } from './MembershipUpgradeModal'
import { WhatsNewUpsellBand } from './WhatsNewUpsellBand'
import { MembershipSectionsLayout } from './MembershipSections'
import {
  multiMembershipRowsFor,
  membershipPlanFor,
  planRenewalFactsFor,
  resolveMembershipCount,
} from '@/data/membership/membershipScorecardFixtures'
import { ManageMembershipPanel } from './ManageMembershipPanel'
import { CancelMembershipFlow } from './CancelMembershipFlow'
import {
  benefitsAreActive,
  renewalFallbackFor,
  renewalFromPlanFacts,
  renewalStateFor,
  RENEWAL_DATE_LABEL,
} from './membershipRenewalState'
import { AllMembershipsPanel } from './AllMembershipsPanel'
import { HUB_SAVINGS, hubSavingsSinceFor, hubScorecardFor, hubStatsFor } from './hubHeroStats'
import { MembershipHubDetails } from './MembershipHubDetails'
import { tierCardBg, tierCardGlyph } from './tierCardStyle'
import { MembershipBenefitShelves } from './MembershipBenefitShelves'
import { MembershipCommunityBand } from './MembershipCommunityBand'
import { BenefitSections } from './v4/BenefitSections'
import { Link } from 'react-router-dom'
import { libraryConfigFor, TYPE_LABELS } from '@/data/membership/libraryFixtures'
import { LIBRARY_TYPE_ICON } from './libraryTypeIcon'

/** The Membership-page versions that render the benefit spotlight sections as
 *  lo-fi wireframe blocks: the dedicated **Lo-fi** version, plus **Two sections**
 *  (`scorecard`) and **Multiple memberships** (`multi`), which inherit the lo-fi
 *  benefits treatment. Only the hero / membership-summary treatment differs
 *  between them — the benefit sections below read identically as wireframes. */
function benefitsAreLoFi(variant: string | undefined): boolean {
  return (
    variant === 'lofi' ||
    variant === 'scorecard' ||
    variant === 'multi' ||
    variant === 'hub'
  )
}

/**
 * Of the versions that use the stacked benefit blocks, which get the FINISHED
 * treatment — a real photo, a "Learn More" CTA, and no white card around the
 * spot — instead of the dashed "IMAGE" placeholder.
 *
 * Everything except `lofi`: that version is deliberately a wireframe (it's the
 * Lo-Fi version), so dropping marketing photos into it would defeat its point.
 * `scorecard` and `multi` only inherited the placeholder by reusing these
 * blocks — they're finished versions, so they get the finished spots.
 */
function benefitsShowPhotos(variant: string | undefined): boolean {
  return benefitsAreLoFi(variant) && variant !== 'lofi'
}

/**
 * Membership page — a faithful port of the standalone Explore Membership
 * prototype (`explore-membership-standalone.html`) into the Dashboard
 * Discoverability shell as its own **"Membership"** rail section.
 *
 * ADDITIVE ONLY: this does NOT replace the existing "What's New"
 * (`m-whats-new`) section, and it is wired to render only in the
 * Design-&-Development sandbox (`/dashboard-rebrand`) — the rail item is
 * hidden and the section is guarded off in the pure Demo (`?demo=1`), so the
 * demo experience is untouched (see PlatformShell / PlatformSideNav).
 *
 * Member vs. non-member is driven by `isMember` (from `useAccount()` upstream):
 *   - Member    → navy hero (eyebrow + title + search + the "Your Membership"
 *                 KPI scorecard, Figma 256:179) → Passport upsell band →
 *                 Resource Library / Exam & Cert Prep / CE Podcasts + AI Career
 *                 Tools product sections.
 *   - Non-member→ benefits-forward hero (chips + "Become a member" CTA) →
 *                 member-success stats → "Compare your Membership Options"
 *                 grid → closing CTA.
 *
 * All styling is scoped under `.mx-root` and references the app's Elite CSS
 * variables (no hardcoded palette), so it inherits the active brand tokens and
 * cannot collide with or leak into the rest of the app.
 */

const noop = (e: MouseEvent) => e.preventDefault()

/** Smooth-scroll to the "Learn More about Member Benefits" section. */
const scrollToBenefits = (e: MouseEvent) => {
  e.preventDefault()
  document.getElementById('non-member-benefits')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Smooth-scroll to the CRE "Learn More about Member Benefits" section. */
const scrollToReBenefits = (e: MouseEvent) => {
  e.preventDefault()
  document.getElementById('re-benefits')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** The brand's lowest non-member plan price ("$99" for CRE, "$48" for Elite). */
function lowestPlanPrice(brand: Brand): string {
  const plans = membershipCompareFor(brand, false).plans
  let best = plans[0]?.price ?? '$0'
  let bestN = Infinity
  for (const p of plans) {
    const n = parseFloat(p.price.replace(/[^0-9.]/g, ''))
    if (Number.isFinite(n) && n < bestN) {
      bestN = n
      best = p.price
    }
  }
  return best
}

/** Closing upsell band at the bottom of the non-member page — "Compare Plans"
 *  scrolls back up to the plan comparison at the top of the page. */
function MembershipBottomCta({ brand }: { brand: Brand }) {
  return (
    <WhatsNewUpsellBand
      variant="card"
      price={lowestPlanPrice(brand)}
      ctaLabel="Compare Plans"
      onCta={() =>
        document.getElementById('non-member-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    />
  )
}

/* ─── Simple-version bottom band ──────────────────────────────────────────
   The Simple Membership page ends with this band (in place of the
   WhatsNewUpsellBand / MembershipBottomCta). Styled like the CE Podcasts band
   (`.lm-podband`) — a full-bleed photo on the left, membership benefits listed
   on the right — with ONE CTA, "Learn More About Membership", which will point
   to the external WordPress marketing site (unlinked for now). */
const SIMPLE_BAND_BENEFITS: Record<'realEstate' | 'healthcare', string[]> = {
  realEstate: [
    'All state-required CE — every package included',
    'Business-building masterclasses',
    'Professional certification prep',
    'Real Estate AI tools',
  ],
  healthcare: [
    'State-required CE — all state packages included',
    'ANCC-accredited CE course library',
    'Exclusive CE podcasts',
    'Exam & certification prep + AI career tools',
  ],
}

function SimpleMembershipBand({ brand, member }: { brand: Brand; member: boolean }) {
  const realEstate = REAL_ESTATE_BRANDS.includes(brand)
  const image = realEstate ? '/brand/laptop-woman.png' : '/brand/member-spotlight.png'
  const benefits = SIMPLE_BAND_BENEFITS[realEstate ? 'realEstate' : 'healthcare']
  return (
    <section className="lm-podband">
      <div
        className="lm-podband-media"
        aria-hidden="true"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="lm-copy lm-podband-copy">
        <span className="lm-eyebrow">Membership</span>
        <h3 className="lm-title">
          {member ? 'Everything your membership unlocks' : 'Everything a membership unlocks'}
        </h3>
        <ul className="lm-bullets">
          {benefits.map((t) => (
            <li className="lm-bullet" key={t}>
              <span className="lm-check" aria-hidden="true">✓</span>
              <span className="lm-btext">{t}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          style={simpleBandCtaStyle}
          // TODO(link): point at the external WordPress membership marketing
          // page. Unlinked for now.
          onClick={() => console.info('membership:learn-more (external WordPress — TODO link)')}
        >
          Learn More About Membership
        </button>
      </div>
    </section>
  )
}

const simpleBandCtaStyle: CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 6,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 24px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 800,
  cursor: 'pointer',
}

// Real-estate brands render the CRE non-member experience (3-tier Plus/Pro/Premier
// card comparison); Elite/Fitzgerald/STC keep the original nursing page.
const REAL_ESTATE_BRANDS: Brand[] = ['cre', 'mckissock']

export function MembershipStandalonePage({
  isMember,
}: {
  isMember: boolean
  /** Retained for the shell's call signature; the member body now renders the
   *  tile-shelf layout (no in-shell resource viewer to thread through). */
  onOpenResource?: (resourceId: string) => void
}) {
  const { brand, tierLabel } = useAccount()
  const realEstate = REAL_ESTATE_BRANDS.includes(brand)
  // "Membership Version" picker (Full ⇄ Simple), stored in the
  // `membership-page-version` flag. Simple keeps only the hero + comparison grid
  // (when the tier has an upgrade path) + the upgrade banner, dropping the
  // "Included…" shelves, benefit spotlights, and success-stats band.
  const pageVersion = useFeatureFlag('membership-page-version').variant
  const simple = pageVersion === 'simple'
  // "Membership Hub" (default): the redesigned at-a-glance hero (Figma 633:132)
  // in place of the standard hero, with the Lo-fi benefits treatment below.
  // Member-only hero; a non-member falls back to the normal NonMemberHero + non-member body.
  // The hero LAYOUT (base / + card / split / savings-on-top) is a separate flag
  // (`membership-hub-hero`), since those were hero-only tweaks rather than page
  // versions. The base card (Figma 633:3385) adds a Current Membership passport
  // card to the LEFT of the savings block.
  const hub = pageVersion === 'hub'
  const hubHeroFlag = useFeatureFlag('membership-hub-hero').variant
  const hubVariant: 'plain' | 'split' = hubHeroFlag === 'split' ? 'split' : 'plain'
  // "Two sections" version (Concept C): the hero's hardcoded five-stat "Your
  // Membership" band is replaced by the Current Membership card + Membership
  // Scorecard rendered directly beneath the hero. Everything below is unchanged,
  // so this reads as Full with a different membership summary.
  // "Multiple memberships" version: a roll-up scorecard over full-width
  // membership rows. Needs a brand with 2+ authored memberships — Elite and
  // Fitzgerald today. Any other brand (or a non-member, who holds none) falls back
  // to the single-membership "Two sections" treatment rather than rendering an
  // empty list.
  const multiRows = multiMembershipRowsFor(brand)
  // RETIRED 2026-08-25 (decision #4 on the feature gateway): the `multi` page
  // version — a roll-up scorecard over a card list with Profession / State pill
  // filters beneath — was the OTHER whole multi-membership page, competing with
  // the hub hero's tier-coloured deck + "View All" → Your Memberships sheet.
  // Two alternative pages, not layers: `multi` swapped the hub hero out
  // entirely. Hub won. `multi` now falls through to the two-sections treatment
  // the flag already used when a brand had too few memberships, so an old
  // ?ff=membership-page-version:multi link degrades instead of 404-ing.
  // MembershipMultiSections is unreferenced but kept — see ARCHIVED_ITEMS
  // (`membership-multi-page`) for how to re-wire it.
  //
  // Both versions replace the hero's hardcoded five-stat "Your Membership" band,
  // so they're member-only — a non-member has no membership summary to reframe.
  // For a non-member these versions fall back to the normal NonMemberHero + NonMemberBody
  // (no Current Membership card / scorecard block beneath the hero).
  const twoSections = isMember && (pageVersion === 'scorecard' || pageVersion === 'multi')
  const replacesHeroBand = twoSections

  // ── Sheet logic for the two-sections / multi blocks ─────────────────────
  // Every membership card's footer CTA now carries its own renewal-state verb
  // ("Renew now" / "Update payment method" / "Turn auto-renewal on" / …), and
  // all of them land HERE — the Manage Membership sheet, scoped to the record
  // that was clicked. Before this, `onManage` was never threaded down, so every
  // card's CTA was a `console.info` stub.
  //
  // Deliberately ONE destination for every verb: the sheet holds auto-renewal,
  // payment method, next charge and cancel, which is the full set any of those
  // verbs needs. Two states arguably want to skip it — payment-failed should
  // open the payment form directly, and expired/grace should open the renewal
  // purchase — but neither of those flows exists in the prototype yet, so
  // routing them to the sheet is honest rather than dead-ending them.
  // TODO(flow): split payment-failed → payment form and expired/grace → renewal
  // checkout once those exist. Logged on the handoff.
  //
  // `?sheet=manage` opens it on load and `?membership=<id>` scopes it to one
  // record — both read ONCE as initial state (not controlled), matching the
  // convention `MemberHubHero` already uses, so closing the sheet doesn't fight
  // the URL.
  const [sheetParams] = useSearchParams()
  const [sectionManageOpen, setSectionManageOpen] = useState(
    sheetParams.get('sheet') === 'manage',
  )
  const [sectionManageId, setSectionManageId] = useState<string | null>(
    sheetParams.get('membership'),
  )
  const openSectionManage = (id: string | null) => {
    setSectionManageId(id)
    setSectionManageOpen(true)
  }
  const sectionManageRecord = sectionManageId
    ? multiRows.find((r) => r.id === sectionManageId)
    : undefined

  // ── The `page` arm of `membership-cancel-flow` ───────────────────────────
  // The sheet has nowhere to put three side-by-side retention offers, so this
  // arm takes over the whole page instead: the sheet closes and the flow renders
  // in place of the hero + sections + body, with a back link. That IS the
  // handoff — the flow keeps the platform chrome around it rather than opening a
  // walled-off funnel, which is the shape of a retention trap even when the
  // content is honest.
  //
  // `?cancel=1` deep-links it, read once as initial state like `?sheet=` above,
  // so the handoff gateway can preview this arm as its own variant.
  const [cancelOpen, setCancelOpen] = useState(sheetParams.get('cancel') === '1')
  const cancelRecord = sectionManageRecord
  const cancelTier = cancelRecord?.tierLabel ?? tierLabel
  // Same wider fallback the sheet's flow uses: with no scoped record, read the
  // renewal facts out of the account-level plan fixture rather than handing the
  // flow nothing. Without this a deep link to `?cancel=1` opened on the review
  // step with no offers, which is not the arm being demoed.
  const cancelRenewal = cancelRecord
    ? (cancelRecord.renewal ?? renewalFallbackFor(cancelRecord))
    : renewalFromPlanFacts(planRenewalFactsFor(brand))
  const cancelPlanTitle = `${
    cancelRecord?.profession ?? membershipPlanFor(brand, tierLabel).planLine.split(' · ')[0]
  } CE Membership`.trim()

  // Which container the handed-off flow gets. `modal` (the default) overlays
  // the page; `page` replaces it. Same steps and copy either way — the arms
  // differ only in the container, which is the whole point of the comparison.
  const cancelContainer = useFeatureFlag('membership-cancel-flow').variant
  const cancelFlowProps = {
    planTitle: cancelPlanTitle,
    renewal: cancelRenewal,
    tierLabel: cancelTier,
    membershipId: cancelRecord?.id,
  }

  if (cancelOpen && cancelContainer === 'page') {
    return (
      <div className="mx-root">
        <style>{MX_CSS}</style>
        <CancelMembershipFlow
          layout="page"
          {...cancelFlowProps}
          onExit={() => setCancelOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="mx-root">
      <style>{MX_CSS}</style>
      {/* `hero--runway` was the extra band of blue the retired `multi` page
          version needed for its roll-up scorecard to overlap into. Nothing
          overlaps the hero now. */}
      <div className="hero">
        {isMember ? (
          hub ? (
            <MemberHubHero
              variant={hubVariant}
              onCancelHandoff={(id) => {
                setSectionManageId(id)
                setCancelOpen(true)
              }}
            />
          ) : (
            <MemberHero realEstate={realEstate} hideScorecard={replacesHeroBand} />
          )
        ) : (
          <NonMemberHero realEstate={realEstate} />
        )}
      </div>
      {replacesHeroBand && (
        <div className="mx-two-sections">
          {/* The single-membership layout's card has no id to pass (it reads
              the account's active tier), so it opens the sheet unscoped —
              exactly the account-level "Manage" case the sheet degrades to. */}
          <MembershipSectionsLayout onManage={() => openSectionManage(null)} />
        </div>
      )}
      {replacesHeroBand && (
        <ManageMembershipPanel
          open={sectionManageOpen}
          onClose={() => setSectionManageOpen(false)}
          membership={sectionManageRecord}
          onCancelHandoff={() => {
            setSectionManageOpen(false)
            setCancelOpen(true)
          }}
        />
      )}
      {isMember ? (
        <MemberBody brand={brand} realEstate={realEstate} simple={simple} />
      ) : (
        <NonMemberBody brand={brand} realEstate={realEstate} simple={simple} />
      )}
      {/* The `modal` arm. Backdrop-close is disabled deliberately: the last
          step carries the UNDO for a cancellation that already happened, and
          losing that to a stray click outside the dialog is the one misclick
          here with a real cost. Esc and the X still close it. */}
      <Modal
        open={cancelOpen && cancelContainer !== 'page'}
        onClose={() => setCancelOpen(false)}
        title="Cancel membership"
        width={880}
        disableBackdropClose
        // The flow's own intro line is the first thing in the body, so a rule
        // between them would separate a title from the sentence explaining it.
        hideHeaderDivider
      >
        <CancelMembershipFlow
          layout="modal"
          {...cancelFlowProps}
          onExit={() => setCancelOpen(false)}
        />
      </Modal>
    </div>
  )
}

/* ─── Member hero ─────────────────────────────────────────────────────── */
function MemberHero({
  realEstate,
  hideScorecard = false,
}: {
  realEstate: boolean
  /** The "Two sections" page version renders the Current Membership card +
   *  Membership Scorecard beneath the hero instead, so the inline five-stat
   *  band is suppressed to avoid two competing membership summaries. */
  hideScorecard?: boolean
}) {
  // Tier badge follows the actual member tier: "Passport Lite" for Elite,
  // "Plus Member" / "Pro Member" / "Premier Member" for CRE / McKissock.
  const { brand, tierLabel, tierTone } = useAccount()
  return (
    <>
      <span className="eye">Included with your membership</span>
      <div className="hero-top">
        <div className="hero-copy">
          <h1>Explore Membership</h1>
          <p>
            {realEstate
              ? "Everything your Colibri Real Estate membership unlocks, in one place — CE courses, professional certification prep, business-building masterclasses, and Real Estate AI tools. Start here to see what's included."
              : "Everything your Elite Passport unlocks, in one place — new courses, podcasts, exam prep, and AI career tools, added between renewals. Start here to see what's included."}
          </p>
        </div>
      </div>
      {/* "Your Membership" scorecard (Figma 256:179) — suppressed by the
          "Two sections" version, which replaces it beneath the hero. */}
      {hideScorecard ? null : (
      <div className="scorecard">
        <div className="sc-head">
          <div className="sc-head-left">
            <span className="sc-title">Your Membership</span>
            {/* Same shared MembershipBadge as the left-nav summary (tone-driven
                colors + tier glyph) so the two read identically. */}
            <MembershipBadge
              label={tierLabel ?? 'Member'}
              tone={tierTone}
              icon={tierBadgeIcon(tierTone)}
            />
            <span className="sc-expires">Expires on 11/03/2026</span>
          </div>
          <a className="sc-manage" href="#" onClick={noop}>
            Manage Membership <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="sc-divider" />
        <div className="sc-stats">
          {hubScorecardFor(brand).map((s) => (
            <div className="sc-stat" key={s.k}>
              <span className="k">{s.k}</span>
              <span className="v">{s.v}</span>
              <span className="s">{s.s}</span>
            </div>
          ))}
        </div>
      </div>
      )}
    </>
  )
}


/* ─── Membership Hub hero (Figma 633:132) ─────────────────────────────────
   The default version's hero: a personalized "at a glance" heading over a stat
   band led by a Lifetime Member Savings cell, then Days · Credit hours ·
   Certificates · Hours. Same underlying figures as hubScorecardFor, re-laid-out (no
   tier badge / Manage / Expires row). Member-only. */

/** Per-layer step of the membership deck. Deliberately lateral-heavy: the
 *  sideways step is what opens a readable band of each backing membership's
 *  tier colour, while the vertical step keeps the stack from reading as one
 *  wide card. No rotation — a fan escapes its box unpredictably (the corner
 *  swing scales with the card's height), and at 375px that overflowed the hero
 *  and gave the page a horizontal scrollbar. */
const DECK_STEP_X = 11
const DECK_STEP_Y = 6

/**
 * The Membership Hub's full-colour passport card — one tier-gradient plane
 * carrying the badge, plan name, licence state and expiry.
 *
 * Exported so the dev-handoff previews render THIS component instead of a
 * restyled copy. That is the lesson `MembershipHubDetails` learned on
 * 2026-08-25: its styles lived only inside this page's `.mx-root` block, and a
 * preview that reproduced them by hand drifted from the real card.
 *
 * The styles deliberately STAY `.mx-root .hub-mcard*` in `MX_CSS` rather than
 * moving to tokens.css, because the card's width and type scale are tuned to
 * the hero band's column. A caller outside this page must therefore wrap it in
 * `.mx-root` and inject `MX_CSS` — `HubHeroSlice` in the handoff page already
 * reproduces exactly that chain.
 *
 * Note this is a DIFFERENT card from `MembershipRowCard`, which is the archived
 * Membership + Scorecard treatment (a tier header over a white data body) and
 * is not reachable in the app today. This is the hero a learner actually sees.
 */
export function HubMembershipCard({
  tierLabel,
  tone,
  Glyph,
  planName,
  state,
  expiresOn,
  dateLabel = 'Expires',
  ctaLabel,
  onCta,
}: {
  tierLabel: string
  tone: string
  /** Passed in rather than derived: the hero picks `tierCardGlyph(record.tone)`
   *  for a specific membership but `tierBadgeIcon(tierTone)` for the account's
   *  own tier, and collapsing the two changes the single-membership card. */
  Glyph: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  planName: string
  state?: string
  expiresOn?: string
  /** Renewal-state wording placed before the date — "Auto-renews on", "Expired".
   *  From RENEWAL_DATE_LABEL; defaults to the neutral "Expires" so a caller with
   *  no resolvable renewal still reads correctly rather than asserting a state. */
  dateLabel?: string
  ctaLabel: string
  onCta: () => void
}) {
  return (
    <div className="hub-mcard" style={{ background: tierCardBg(tone) }}>
      <span className="hub-mcard-wm" aria-hidden>
        <Glyph size={118} />
      </span>
      <MembershipBadge label={tierLabel} tone={tone as never} icon={Glyph} />
      <h3 className="hub-mcard-name">{planName}</h3>
      {state && <span className="hub-mcard-line">{state}</span>}
      {expiresOn && (
        <span className="hub-mcard-line">
          {dateLabel} {expiresOn}
        </span>
      )}
      <button type="button" className="hub-mcard-manage" onClick={onCta}>
        {ctaLabel} <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

export function MemberHubHero({
  variant = 'plain',
  onCancelHandoff,
}: {
  variant?: 'plain' | 'split'
  /** Hands the `page` arm of `membership-cancel-flow` up to the page, which owns
   *  the full-width flow. Passing the record id (null ⇒ the account tier) lets
   *  the page scope the flow the same way the sheet was scoped.
   *
   *  Optional on purpose: without it ManageMembershipPanel keeps the flow
   *  in-panel whatever the flag says, which is the right degrade for callers
   *  that have nowhere to put a full-width page — the handoff preview renders
   *  this hero on its own, with no page around it. */
  onCancelHandoff?: (membershipId: string | null) => void
}) {
  const { user, brand, tierLabel, tierTone, activeMembershipId, setActiveMembershipId } =
    useAccount()
  // Manage Membership sheet — `manageRec` scopes it to a specific membership
  // (from the "Your Memberships" sheet); null ⇒ the account's active tier.
  const [manageRec, setManageRec] = useState<MembershipRecord | null>(null)
  // `?sheet=manage|all` opens one on load, so a handoff gateway can preview a
  // sheet as its own variant instead of telling the reviewer which button to
  // press. Same shape as the study calendar's `?calState=`. Read ONCE as the
  // initial state, not as a controlled value: closing the sheet must stick, and
  // it would not if the param kept reopening it on every render.
  const [params, setParams] = useSearchParams()
  const openSheet = params.get('sheet')
  // `?membership=<id>` scopes the Manage sheet to one record. Read here as well
  // as on the page, because retiring the `multi` page version (decision #4,
  // 2026-08-25) moved every one of those deep links onto the hub hero — and
  // without this the link would open the sheet on the ACCOUNT tier instead of
  // the record it names, silently showing the wrong renewal state. Read ONCE as
  // initial state, matching `sheet` above: a controlled param would reopen the
  // sheet on every render and the close button would look broken.
  const deepLinkMembershipId = params.get('membership')
  // `?sheet=` DERIVES the open state rather than only seeding it, because the
  // left rail's "View All → Manage membership" writes these params while this
  // component is already mounted (the learner is on the Membership section). A
  // once-only seed meant that click updated the URL and opened nothing.
  //
  // The original reason for seeding once is preserved by clearing the param on
  // close: closing still STICKS, because there is no longer a param to reopen
  // from. Do not drop `clearSheetParam` from a close handler — without it the
  // sheet reopens on the next render and the close button looks broken.
  const [manageOpenLocal, setManageOpenLocal] = useState(openSheet === 'manage')
  const clearSheetParam = useCallback(() => {
    if (openSheet !== 'manage' && openSheet !== 'all') return
    const next = new URLSearchParams(params)
    next.delete('sheet')
    // `membership` scopes the Manage sheet, so it goes with it — leaving it
    // behind would scope the NEXT deep link to a record nobody asked for.
    next.delete('membership')
    setParams(next, { replace: true })
  }, [openSheet, params, setParams])
  // Kept as `setManageOpen` / `setAllOpen` so every existing call site is
  // unchanged — the only difference is that closing also drops the param.
  const manageOpen = manageOpenLocal || openSheet === 'manage'
  const setManageOpen = useCallback(
    (v: boolean) => {
      setManageOpenLocal(v)
      if (!v) clearSheetParam()
    },
    [clearSheetParam],
  )
  // Whether Manage was drilled into FROM the "Your Memberships" list, rather
  // than opened as a destination in its own right (the single-membership card,
  // or a `?sheet=manage` deep link). Only that path gets a back link — a Back
  // on a sheet nobody navigated into has nowhere to go.
  const [fromAllSheet, setFromAllSheet] = useState(false)
  // "Your Memberships" sheet (multi only) — the "View All" destination.
  const [allOpenLocal, setAllOpenLocal] = useState(openSheet === 'all')
  const allOpen = allOpenLocal || openSheet === 'all'
  const setAllOpen = useCallback(
    (v: boolean) => {
      setAllOpenLocal(v)
      if (!v) clearSheetParam()
    },
    [clearSheetParam],
  )
  // Multiple memberships (Figma 640:3979): when the `membership-count` flag is on
  // and the learner holds 2+ memberships, the Active Membership card becomes a
  // stacked deck, the eyebrow counts them, and the link reads "View All".
  const countFlag = useFeatureFlag('membership-count')
  const membershipCount = resolveMembershipCount(countFlag.enabled, countFlag.variant)
  const memberships = multiMembershipsFor(brand)
  // The subset in play, capped to the count variant (2 / 5).
  const shownMemberships = memberships.slice(0, membershipCount)
  const isMulti = countFlag.enabled && shownMemberships.length > 1
  // How many of those memberships the learner can actually USE today. The
  // eyebrow used to call all of them "Active", which the fixtures themselves
  // contradict — the set deliberately includes an expired membership and one in
  // its grace period. A record whose renewal won't resolve counts as active: it
  // is a membership they hold, and guessing "lapsed" from missing data would be
  // the worse error of the two.
  const activeCount = shownMemberships.filter((m) => {
    const r = m.renewal ?? renewalFallbackFor(m)
    return r ? benefitsAreActive(renewalStateFor(r)) : true
  }).length
  // "split" renders the membership card as its own standalone card beside the
  // Lifetime Member Details card (Figma 640:3469, built inline below).
  const twoCard = variant === 'split'
  const plan = membershipPlanFor(brand, tierLabel)
  const discipline = plan.planLine.split(' · ')[0] || ''
  const primaryRec = shownMemberships[0]
  // The record named by `?membership=`, if it is one this learner holds.
  const deepLinkRec = deepLinkMembershipId
    ? shownMemberships.find((m) => m.id === deepLinkMembershipId) ?? null
    : null
  // In MULTI mode the hero front card reflects the SELECTED membership (default
  // the first) — its tier, profession, state, and expiry — so picking a card in
  // the "Your Memberships" sheet loads it here. In SINGLE mode it reflects the
  // account's active tier (the Quick View / tier switch).
  const activeRec = isMulti
    ? shownMemberships.find((m) => m.id === activeMembershipId) ?? primaryRec
    : undefined
  const cardTierLabel = activeRec?.tierLabel ?? tierLabel ?? 'Member'
  const cardTone = activeRec?.tone ?? tierTone
  const CardGlyph = activeRec ? tierCardGlyph(activeRec.tone) : tierBadgeIcon(tierTone)
  // The card's date line carries the renewal state — the hero has no pill and no
  // lead sentence, so this is the only place that state reaches it. Scoped the
  // same way the rest of the card is: the selected record in multi mode, the
  // account's own plan facts in single mode.
  const cardRenewal = activeRec
    ? (activeRec.renewal ?? renewalFallbackFor(activeRec))
    : renewalFromPlanFacts(planRenewalFactsFor(brand))
  const cardDateLabel = cardRenewal
    ? RENEWAL_DATE_LABEL[renewalStateFor(cardRenewal).id]
    : undefined
  const cardDiscipline = activeRec?.profession ?? primaryRec?.profession ?? discipline
  const cardExpires = activeRec?.expiresOn ?? user.planExpiresOn
  const state = activeRec?.state ?? primaryRec?.state
  const planName = `${cardDiscipline} CE ${cardTierLabel} Membership`.trim()
  // The cards BEHIND the front one are the learner's OTHER memberships, each
  // painted in its own tier colour. Two same-coloured copies of the front card
  // at 50% / 30% opacity — what this was — read as a drop shadow, not a stack:
  // nothing in it said "you hold others", and nothing said what they are.
  // Capped at two: a third visible edge stops reading as depth and starts
  // reading as clutter, and the count is already stated in the eyebrow.
  const deckLayers = shownMemberships
    .filter((m) => m.id !== (activeRec?.id ?? primaryRec?.id))
    .slice(0, 2)
  const openManageAccount = () => {
    setManageRec(null)
    setFromAllSheet(false)
    setManageOpen(true)
  }

  const card = twoCard ? (
    <HubMembershipCard
      tierLabel={cardTierLabel}
      tone={cardTone}
      Glyph={CardGlyph}
      planName={planName}
      state={state}
      expiresOn={cardExpires}
      dateLabel={cardDateLabel}
      ctaLabel={isMulti ? 'View All' : 'Manage'}
      onCta={() => (isMulti ? setAllOpen(true) : openManageAccount())}
    />
  ) : null

  const metrics = (
    <>
      <div className="hub-savings">
        <span className="k">Lifetime Member Savings</span>
        {/* Was a second hardcoded copy of the savings figure and the join date,
            beside the constants that exist so "the handoff preview and the page
            cannot show different numbers". Now both read the one source. */}
        <p className="v">
          <span className="cur">$</span>
          <span className="amt">{HUB_SAVINGS}</span>
        </p>
        <span className="s">{`saved ${hubSavingsSinceFor(brand)}`}</span>
      </div>
      <div className="hub-stats">
        {hubStatsFor(brand).map((s) => (
          <div className="hub-stat" key={s.k}>
            <span className="n">{s.n}</span>
            <span className="lbl">
              <span className="k">{s.k}</span>
              <span className="s">{s.s}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <>
      <span className="eye">Your membership, at a glance</span>
      <div className="hero-top">
        <div className="hero-copy">
          <h1>Get more from your membership, {user.firstName}!</h1>
          <p>
            Explore your benefits, discover what&rsquo;s included in your plan, and easily access the
            courses, resources, and tools available to you.
          </p>
        </div>
      </div>
      {twoCard ? (
        // "Split cards" (Figma 640:3469): two labeled cards 30px apart — an
        // "Active Membership" passport card, then a "Lifetime Member Details"
        // card = a dark Total Saved bar over the four stats.
        <div className="hub-band hub-band--split hub-band--split2">
          <div className="hub-col hub-col--card">
            <span className="hub-coleye">
              {isMulti ? multiEyebrow(shownMemberships.length, activeCount) : 'Active Membership'}
            </span>
            {isMulti ? (
              <div
                className="hub-deck"
                style={
                  {
                    // The stack is CONTAINED, not bled: the deck box keeps its
                    // 288px, the front card is inset from the bottom-right by
                    // exactly the stack's depth, and the deepest layer lands on
                    // the deck's own edge. Nothing escapes at any width — an
                    // earlier version translated the layers outward and, at
                    // 375px, pushed 32px past the hero and gave the page a
                    // horizontal scrollbar.
                    '--deck-x': `${deckLayers.length * DECK_STEP_X}px`,
                    '--deck-y': `${deckLayers.length * DECK_STEP_Y}px`,
                  } as CSSProperties
                }
              >
                {deckLayers.map((m, i) => (
                  <span
                    key={m.id}
                    className="hub-deck-layer"
                    aria-hidden
                    style={{
                      background: tierCardBg(m.tone),
                      transform: `translate(${(i + 1) * DECK_STEP_X}px, ${(i + 1) * DECK_STEP_Y}px)`,
                      zIndex: 1 - i,
                      // Near-opaque on purpose: a shadow is dark and
                      // see-through, a card is not. The depth cue is the step
                      // and the per-layer shadow — NOT fading the colour out,
                      // which is what made the old same-colour layers read as
                      // one soft shadow.
                      opacity: 1 - i * 0.14,
                    }}
                  />
                ))}
                {card}
              </div>
            ) : (
              card
            )}
          </div>
          <div className="hub-col hub-col--metrics">
            <span className="hub-coleye">Lifetime Member Details</span>
            <MembershipHubDetails
              savings={HUB_SAVINGS}
              since={hubSavingsSinceFor(brand)}
              stats={hubStatsFor(brand)}
            />
          </div>
        </div>
      ) : (
        <div className="hub-band">{metrics}</div>
      )}
      <ManageMembershipPanel
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        membership={manageRec ?? deepLinkRec ?? undefined}
        // Drilled in from the list ⇒ the way out is back to the list, not out
        // of the stack: the learner opened Manage to check ONE of several
        // memberships and almost certainly wants the others next. Undefined on
        // every other entry, so those keep Close.
        onBack={
          fromAllSheet
            ? () => {
                setManageOpen(false)
                setAllOpen(true)
              }
            : undefined
        }
        backLabel="Back to Your Memberships"
        onCancelHandoff={
          onCancelHandoff
            ? () => {
                setManageOpen(false)
                onCancelHandoff((manageRec ?? deepLinkRec)?.id ?? null)
              }
            : undefined
        }
      />
      {isMulti && (
        <AllMembershipsPanel
          open={allOpen}
          onClose={() => setAllOpen(false)}
          memberships={shownMemberships}
          activeId={activeRec?.id ?? primaryRec?.id ?? ''}
          onSelect={(id) => {
            setActiveMembershipId(id)
            setAllOpen(false)
          }}
          onManage={(rec) => {
            setManageRec(rec)
            setFromAllSheet(true)
            setAllOpen(false)
            setManageOpen(true)
          }}
        />
      )}
    </>
  )
}

/**
 * The multi-membership eyebrow. Says "Active" only when every membership IS
 * active; otherwise it names both numbers, because the deck below shows all of
 * them and a count that quietly excluded the lapsed ones would not match what
 * the learner can see.
 */
function multiEyebrow(total: number, active: number): string {
  if (active === total) return `You have ${total} Active Memberships`
  if (active === 0) return `You have ${total} Memberships · None Active`
  return `You have ${total} Memberships · ${active} Active`
}

/* ─── Non-member hero ─────────────────────────────────────────────────── */
export function NonMemberHero({ realEstate }: { realEstate: boolean }) {
  // Real-estate brands scroll to their "Learn More about Member Benefits"
  // section; Elite scrolls to its benefit spotlight.
  const scrollTarget = realEstate ? scrollToReBenefits : scrollToBenefits
  return (
    <>
      <span className="eye">
        {realEstate ? 'Colibri Real Estate Membership · Join today' : 'Elite Membership · Join today'}
      </span>
      <h1>
        {realEstate
          ? 'Everything your real estate career needs — in one membership.'
          : 'Everything your nursing career needs — in one membership.'}
      </h1>
      <p>
        {realEstate
          ? 'Every required CE package, professional certification prep, business-building masterclasses, and Real Estate AI tools — everything you need to renew, grow, and stand out. Join today and unlock it all.'
          : 'Unlimited accredited CE, certification exam prep, exclusive CE podcasts, and AI career tools — built by nurses, for nurses. Join today and unlock it all.'}
      </p>
      <div className="heroactions">
        <a className="herocta" href={realEstate ? '#re-benefits' : '#non-member-benefits'} onClick={scrollTarget}>
          Explore Benefits
        </a>
      </div>
    </>
  )
}

/* ─── Member body — the real What's New product experience ────────────────
   Uses the SAME shared panel the What's New section renders
   (`MembershipBenefitsPanel embedded`): the tier-aware Passport upsell band +
   the sticky quick-filter + the real product sections (CE Podcasts, Exam &
   Cert Prep, Transitions, AI Career Tools, image-header Resource Library).
   The custom hero + "Your Membership" scorecard above stay. */
function MemberBody({
  brand,
  realEstate,
  simple,
}: {
  brand: Brand
  realEstate: boolean
  simple: boolean
}) {
  // Real-estate brands don't have the Elite product sections (CE Podcasts,
  // Cert Prep, etc.) yet, so the shared panel would render an empty shell with
  // dead quick-filter chips. Until CRE benefit/product content lands, show the
  // member their plan + upgrade path (current Plus → Premier) from the shared
  // comparison fixture. TODO(content): swap in real-estate benefit sections.
  if (realEstate) return <MemberBodyRealEstate brand={brand} simple={simple} />
  return <MemberBodyGeneric brand={brand} simple={simple} />
}

/* ─── Member body (Elite / Fitzgerald / STC) ─────────────────────────────────
 * The same CRE-style structure — upgrade comparison TABLE (hidden at the top
 * tier), included benefits as category shelves, then a full-width upsell-band
 * divider + an "Explore Additional…" section for what an upgrade unlocks — but
 * driven by each brand's own benefit rows + tier split. STC has a single tier,
 * so it shows only the included shelves (no upgrade table / section). */
function MemberBodyGeneric({ brand, simple }: { brand: Brand; simple: boolean }) {
  const { tier } = useAccount()
  const tiers = memberTiersFor(brand)
  const isTopTier = tier === tiers[tiers.length - 1].key
  const canUpgrade = !isTopTier
  const currentShort = tiers.find((t) => t.key === tier)?.shortLabel
  const { included, upgrade } = memberBenefitSplit(brand, tier)
  const hasUpgradeZone = upgrade.length > 0

  // The upgrade comparison — Table (the feature matrix, current tier marked) or
  // Cards (the ComparePlanCard grid with the current tier marked), driven by the
  // shared `membership-compare-view` flag so it matches the non-member view. When
  // there IS an upgrade zone it moves BELOW the upsell band; with no upgrade zone
  // it leads the page.
  const view = usePlanCompareView()
  const currentIndex = tiers.findIndex((t) => t.key === tier)
  const memberPlans: MembershipComparePlan[] = membershipCompareFor(brand, false)
    .plans.map((p, i) =>
      i === currentIndex
        ? { ...p, current: true, ctaLabel: 'Current Membership', recommended: false }
        : { ...p, current: false },
    )
    // Hide tiers BELOW the current one — a lower tier is a downgrade, not an
    // upgrade. Show the current tier + any higher tiers only.
    .filter((_, i) => i >= currentIndex)
  const comparison = canUpgrade ? (
    <section className="plansintro" id="member-plans">
      {view === 'cards' ? (
        <ComparePlanCardGrid plans={memberPlans} brand={brand} title="Your Membership & Upgrade Options" />
      ) : (
        <EliteComparisonTable title="Your Membership & Upgrade Options" currentShort={currentShort} />
      )}
    </section>
  ) : null

  // Simple version — hero (above) + comparison grid (when the tier can upgrade)
  // + the "Learn More About Membership" band. Drops the "Included…" shelves +
  // upgrade spotlights.
  if (simple) {
    return (
      <div className="body">
        {comparison}
        <SimpleMembershipBand brand={brand} member />
      </div>
    )
  }

  return (
    <div className="body">
      {!hasUpgradeZone && comparison}

      <section className="body-shelves">
        <h2 className="section-title">Included with Your Membership</h2>
        <MembershipBenefitShelves rows={included} />
      </section>

      {/* The brand's members-only community. Sits AFTER the included benefits
          and BEFORE the upgrade zone: it is something this member already has,
          so it belongs on the "what you have" side of the upsell divider.
          Self-hides for brands with no community (every brand but McKissock
          today). */}
      <MembershipCommunityBand />

      {hasUpgradeZone && (
        <>
          <WhatsNewUpsellBand variant="bleed" />
          {comparison}
          {/* Not-included benefits use the rich marketing SPOTLIGHTS (the same
              treatment as the non-member view), not the compact tile shelves —
              they're the upgrade pitch. */}
          <MemberBenefitsSpotlight
            id="re-benefits"
            heading="Explore Additional Member Benefits Available with an Upgrade"
            only={upgrade.map((rowId) => UPGRADE_SPOTLIGHT_TAB[rowId]).filter(Boolean)}
          />
        </>
      )}
    </div>
  )
}

/** Maps an upgrade benefit-row id to the marketing-spotlight tab that sells it
 *  (`MemberBenefitsSpotlight` keys off `Benefit.tab`). */
const UPGRADE_SPOTLIGHT_TAB: Record<string, string> = {
  'exam-specialties': 'Exam & Cert Prep',
  'career-tools': 'AI Career Tools',
}

/** Per-brand, per-tier split of benefit-row ids into what the member's tier
 *  INCLUDES (rendered as shelves) vs. what an UPGRADE unlocks (rendered under
 *  the "Explore Additional…" divider). Elite/Fitzgerald split at Passport Lite
 *  vs Passport; STC is a single tier, so everything is included. */
function memberBenefitSplit(
  brand: Brand,
  tier: MembershipTier,
): { included: string[]; upgrade: string[] } {
  if (brand === 'stc') {
    return { included: ['stc-exam-prep', 'stc-practice', 'stc-regulatory'], upgrade: [] }
  }
  // Elite / Fitzgerald — the five What's New sections, split by Passport tier.
  const liteIncluded = ['podcasts', 'learning-library', 'transitions']
  const passportOnly = ['exam-specialties', 'career-tools']
  return tier === 'high'
    ? { included: [...liteIncluded, ...passportOnly], upgrade: [] }
    : { included: liteIncluded, upgrade: passportOnly }
}

/* ─── Member body (real estate) — upgrade table + benefit shelves ────────── */
function MemberBodyRealEstate({ brand, simple }: { brand: Brand; simple: boolean }) {
  const { tier } = useAccount()
  // Highest tier (Premier) has nothing to upgrade to → hide the whole
  // "Your Membership & Upgrade Options" section; the benefit shelves below still
  // render. Lower tiers see the full Plus/Pro/Premier comparison TABLE with
  // their current tier marked (an upgrade prompt), replacing the old plan cards.
  const canUpgrade = tier !== 'high'
  // Map the member's tier to the table's fixed Plus(0)/Pro(1)/Premier(2) column
  // order so the right column reads "Current Membership".
  const currentIndex = tier === 'mid' ? 1 : tier === 'high' ? 2 : 0
  const upgradePlans: MembershipComparePlan[] = membershipCompareFor(brand, false)
    .plans.map((p, i) =>
      i === currentIndex
        ? { ...p, current: true, ctaLabel: 'Current Membership', recommended: false }
        : { ...p, current: false },
    )
    // Hide tiers BELOW the current one — a lower tier is a downgrade, not an
    // upgrade. Middle tier (Pro) shows Pro + Premier; Plus shows all three.
    .filter((_, i) => i >= currentIndex)

  // Per-tier benefit inclusion (from the RE_INCLUDED_ROWS feature matrix):
  //  • Learning Snacks — included at every tier.
  //  • AI MasterTracks + Professional Certifications — Pro/Premier only.
  // Included benefits render as the scannable shelves ("what you have"); the
  // rest render as the rich upgrade marketing bands ("what an upgrade unlocks").
  const hasAiMt = tier === 'mid' || tier === 'high'
  const hasCerts = tier === 'mid' || tier === 'high'
  const includedShelves = [
    // Recommended CE + Learning Snacks are included at every tier.
    'recommended-ce' as const,
    ...(hasAiMt ? (['ai-mastertracks'] as const) : []),
    'learning-snacks' as const,
    ...(hasCerts ? (['re-certifications'] as const) : []),
  ]
  const upgradeBands = [
    ...(!hasAiMt ? (['ai-mastertracks'] as const) : []),
    ...(!hasCerts ? (['re-certifications'] as const) : []),
  ]
  const hasUpgradeZone = upgradeBands.length > 0

  // The upgrade comparison table. When there IS an upgrade zone it moves BELOW
  // the upsell band (the banner divides "what's included" from the upgrade
  // decision); with no upgrade zone (Premier) it leads the page.
  // Table (the What's-Included matrix) or Cards (ComparePlanCard grid), driven
  // by the shared `membership-compare-view` flag — matches the non-member view.
  const view = usePlanCompareView()
  const comparison = canUpgrade ? (
    <section className="plansintro" id="member-plans">
      {view === 'cards' ? (
        <ComparePlanCardGrid plans={upgradePlans} brand={brand} title="Your Membership & Upgrade Options" />
      ) : (
        <RealEstateWhatsIncludedTable title="Your Membership & Upgrade Options" plans={upgradePlans} />
      )}
    </section>
  ) : null

  // Simple version — hero + comparison grid (when the tier can upgrade) + the
  // "Learn More About Membership" band. Drops the "Included…" shelves + upgrade
  // benefit bands.
  if (simple) {
    return (
      <div className="body">
        {comparison}
        <SimpleMembershipBand brand={brand} member />
      </div>
    )
  }

  return (
    <div className="body">
      {!hasUpgradeZone && comparison}

      {/* Included benefits → the scannable category shelves (matches the Elite
          What's New shelf layout). */}
      <section className="body-shelves">
        <h2 className="section-title">Included with Your Membership</h2>
        <MembershipBenefitShelves rows={[...includedShelves]} />
      </section>

      {/* The brand's members-only community (McKissock's Facebook Appraisal
          Community today). Sits AFTER the included benefits and BEFORE the
          upgrade zone — it is something this member already has, so it belongs
          on the "what you have" side of the upsell divider. It is also the
          reason the community is no longer on the Free Content page: that page
          is free by definition, and this is not. Self-hides for brands with no
          community. */}
      <MembershipCommunityBand />

      {/* Not-included benefits → the rich marketing bands (reused from the non-member
          view) under an upgrade-framed heading, to entice the upgrade. Hidden
          once every benefit is included (Pro/Premier). A full-width upsell band
          leads the section as a divider between what's included (shelves above)
          and what an upgrade unlocks (grid + bands below). */}
      {hasUpgradeZone && (
        <>
          <WhatsNewUpsellBand variant="bleed" />
          {comparison}
          <RealEstateBenefits
            showStats={false}
            heading="Explore Additional Member Benefits Available with an Upgrade"
            only={[...upgradeBands]}
          />
        </>
      )}
    </div>
  )
}

/* ─── Non-member body ─────────────────────────────────────────────────── */
function NonMemberBody({
  brand,
  realEstate,
  simple,
}: {
  brand: Brand
  realEstate: boolean
  simple: boolean
}) {
  // Real-estate brands (CRE / McKissock) render the 3-tier Plus/Pro/Premier
  // card comparison — the same cards as the Membership Upgrade modal, from the
  // shared `membershipCompareFor` fixture. The nursing stats band + benefit
  // spotlight below are Elite-only for now (TODO(content): real-estate
  // versions pending copy).
  if (realEstate) return <NonMemberBodyRealEstate brand={brand} simple={simple} />

  // Simple version — hero (above) + comparison grid + the "Learn More About
  // Membership" band. Drops the success-stats band + benefit spotlight.
  if (simple) {
    return (
      <div className="body">
        <PlanComparison brand={brand} realEstate={false} />
        <SimpleMembershipBand brand={brand} member={false} />
      </div>
    )
  }

  return (
    <div className="body">
      <PlanComparison brand={brand} realEstate={false} />

      {/* Member-success stats — thin full-bleed hero band, below the comparison. */}
      <div className="statband">
        <div className="statgrid">
          {STATS.map((s) => (
            <div className="stat" key={s.l}>
              <div className="v">{s.v}</div>
              <div className="l">{s.l}</div>
              <div className="d">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Learn More about Member Benefits — one highlighted benefit at a time. */}
      <MemberBenefitsSpotlight />

      <MembershipBottomCta brand={brand} />
    </div>
  )
}

/* ─── Non-member body (real estate) ───────────────────────────────────────
   The CRE / McKissock non-member experience: the 3-tier Plus / Pro / Premier plan
   comparison, rendered with the SAME `ComparePlanCard`s the Membership Upgrade
   modal uses (shared `membershipCompareFor` fixture), so the standalone page
   and the modal never drift. TODO(content): a real-estate stats band + benefit
   spotlight (pending copy) will follow the comparison, mirroring the Elite
   layout above. */
function NonMemberBodyRealEstate({ brand, simple }: { brand: Brand; simple: boolean }) {
  // Simple version — comparison grid + the "Learn More About Membership" band;
  // drops the benefit marketing bands + the plain bottom CTA.
  if (simple) {
    return (
      <div className="body">
        <PlanComparison brand={brand} realEstate />
        <SimpleMembershipBand brand={brand} member={false} />
      </div>
    )
  }
  return (
    <div className="body">
      <PlanComparison brand={brand} realEstate />
      <RealEstateBenefits />
      <MembershipBottomCta brand={brand} />
    </div>
  )
}

/* ─── Plan comparison — Table ⇄ Cards, driven by a feature flag ────────────
   Shared by the CRE + Elite non-member bodies. The `membership-compare-view` flag
   (variant-only, default `table`) picks the view — reviewers switch it from the
   Feature Flag panel, not a user-facing control. Table view: the brand's
   feature matrix (CRE → the "What's Included" Plus/Pro/Premier table; Elite →
   the Passport Lite/Passport table). Cards view: the shared `ComparePlanCard`
   grid from `membershipCompareFor`. */
function PlanComparison({ brand, realEstate }: { brand: Brand; realEstate: boolean }) {
  const view = usePlanCompareView()
  const comparison = membershipCompareFor(brand, false)
  const title = 'Compare your Membership Options'
  return (
    <section className="plansintro" id="non-member-plans">
      {view === 'cards' ? (
        <ComparePlanCardGrid plans={comparison.plans} brand={brand} title={title} />
      ) : realEstate ? (
        <RealEstateWhatsIncludedTable title={title} plans={comparison.plans} />
      ) : (
        <EliteComparisonTable title={title} />
      )}
    </section>
  )
}

/** The `membership-compare-view` flag → 'cards' | 'table' (default table). Read
 *  by every comparison surface — non-member AND member — so the Feature Flag panel's
 *  "Plan comparison view" toggle applies to all Quick Views, not just non-members. */
function usePlanCompareView(): 'cards' | 'table' {
  return useFeatureFlag('membership-compare-view').variant === 'cards' ? 'cards' : 'table'
}

/** The shared Cards view — the `ComparePlanCard` grid. Used by the non-member
 *  comparison and (with the member's current tier marked) the member upgrade
 *  comparison, so the two never drift. */
function ComparePlanCardGrid({
  plans,
  brand,
  title,
}: {
  plans: MembershipComparePlan[]
  brand: Brand
  title: string
}) {
  return (
    <div className="re-cmp-wrap">
      <h2 className="cmp2-header">{title}</h2>
      <div
        style={{
          ...compareGridStyle,
          // Cap each card ~1/3 of the row so cards are sized for 3-up and never
          // span the full width; the group centers and wraps on narrow screens.
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 340px))',
          justifyContent: 'center',
        }}
      >
        {plans.map((plan) => (
          <ComparePlanCard key={plan.name} plan={plan} brand={brand} />
        ))}
      </div>
    </div>
  )
}

/* CRE "What's Included" feature matrix — Plus / Pro / Premier. */
type ReCellValue = 'yes' | 'no' | string
type ReRow = { label: ReactNode; values: [ReCellValue, ReCellValue, ReCellValue] }
// Each plan column carries a distinct brand color — used for its solid tier
// icon in the header and its check dots down the column.
const RE_INCLUDED_PLANS = [
  { name: 'Plus', Icon: Bolt, color: 'var(--color-primary-600)' },
  { name: 'Pro', Icon: GemSolid, color: 'var(--color-cta-600)' },
  { name: 'Premier', Icon: Crown, color: 'var(--color-secondary-600)' },
]
const RE_INCLUDED_ROWS: ReRow[] = [
  { label: 'All CE courses in your state', values: ['yes', 'yes', 'yes'] },
  { label: 'Access to Learning Snacks', values: ['yes', 'yes', 'yes'] },
  { label: 'AI MasterTracks', values: ['no', 'yes', 'yes'] },
  {
    label: (
      <>
        <strong>FREE</strong> Professional Certification Programs (<strong>$300 Value</strong>)
      </>
    ),
    values: ['no', '1 Program', '2 Programs'],
  },
  { label: 'Professional Certification Program Discount', values: ['15% OFF', '30% OFF', '35% OFF'] },
  {
    label: 'Institute for Luxury Home Marketing Training Discount',
    values: ['$50 OFF', '$100 OFF', '$100 OFF'],
  },
]

function ReCell({ value, color }: { value: ReCellValue; color: string }) {
  if (value === 'yes')
    return (
      <span className="ri-checkdot" style={{ background: color }} aria-label="Included">
        <Check size={13} aria-hidden />
      </span>
    )
  if (value === 'no') return <span className="ri-dash" aria-label="Not included">–</span>
  const off = /^(\S+)\s+OFF$/.exec(value)
  if (off)
    return (
      <span className="ri-val">
        <strong>{off[1]}</strong> OFF
      </span>
    )
  return <span className="ri-val">{value}</span>
}

function RealEstateWhatsIncludedTable({
  title,
  plans,
}: {
  title: string
  plans: MembershipComparePlan[]
}) {
  return (
    <div className="ri-wrap">
      <h2 className="cmp2-header ri-title">{title}</h2>
      {/* Plan price cards up top (matches the Elite comparison UI). */}
      <div className="cmp2-plans tri">
        {plans.map((p, i) => {
          const [whole, cents] = p.price.split('.')
          const color = RE_INCLUDED_PLANS[i]?.color
          return (
            <div
              className={`cmp2-plan ${p.recommended ? 'feat' : 'lite'}${p.current ? ' current' : ''}`}
              key={p.name}
            >
              {p.recommended && <span className="best">Recommended</span>}
              <span className="pname" style={{ color }}>{p.name.replace(/ Membership$/, '')}</span>
              <span className="pprice">
                {whole}
                {cents && <sup>.{cents}</sup>}
                <span className="per">/ {p.period === 'year' ? 'yr' : p.period}</span>
              </span>
              {p.current ? (
                <span className="ri-current">{p.ctaLabel}</span>
              ) : (
                <button className="addcart" type="button">{p.ctaLabel}</button>
              )}
            </div>
          )
        })}
      </div>
      <table className="ri-table">
        <caption style={srOnly}>Compare Plus, Pro, and Premier membership features</caption>
        <colgroup>
          <col />
          <col />
          {/* Pro column carries the highlight tint. */}
          <col className="ri-lane--pro" />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="ri-collabel" aria-label="Feature" />
            {RE_INCLUDED_PLANS.map((p) => (
              <th scope="col" key={p.name} className="ri-planhead">
                <span className="ri-plan">
                  <span className="ri-ic" aria-hidden style={{ color: p.color }}>
                    <p.Icon size={19} />
                  </span>
                  <span className="ri-name" style={{ color: p.color }}>{p.name}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RE_INCLUDED_ROWS.map((row, i) => (
            <tr className="ri-row" key={i}>
              <th scope="row" className="ri-feat">{row.label}</th>
              {row.values.map((v, j) => (
                <td key={j}><ReCell value={v} color={RE_INCLUDED_PLANS[j].color} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* Elite Passport Lite / Passport feature matrix (the original table). */
function EliteComparisonTable({
  title,
  currentShort,
}: {
  title: string
  /** Short label of the member's current tier ("Lite" / "Passport"). Marks that
   *  plan card as "Current Membership" (light-gray + pill) instead of Add To
   *  Cart. Omit for the non-member view (every card selectable). */
  currentShort?: string
}) {
  const cta = (short: string) =>
    currentShort === short ? (
      <span className="ri-current">Current Membership</span>
    ) : (
      <button className="addcart" type="button">Add To Cart</button>
    )
  return (
    <div className="cmp2-wrap">
      <h2 className="cmp2-header">{title}</h2>
      <div className="cmp2-plans">
        <div className={`cmp2-plan lite${currentShort === 'Lite' ? ' current' : ''}`}>
          <span className="pname">Passport Lite</span>
          <span className="pprice">$48<span className="per">/ yr</span></span>
          {cta('Lite')}
        </div>
        <div className={`cmp2-plan feat${currentShort === 'Passport' ? ' current' : ''}`}>
          <span className="best">Best Value</span>
          <span className="pname">Passport</span>
          <span className="pprice">$99<sup>.99</sup><span className="per">/ yr</span></span>
          {cta('Passport')}
        </div>
      </div>

      <table className="cmp2-table">
        <caption style={srOnly}>Compare Passport Lite and Passport features</caption>
        <colgroup>
          <col />
          <col className="c-val" />
          <col className="c-val" />
        </colgroup>
        <thead>
          <tr className="colhead">
            <th scope="col" />
            <th scope="col" className="lite-h">Passport Lite</th>
            <th scope="col" className="pass-h pass">Passport</th>
          </tr>
        </thead>
        <tbody>
          <tr className="grouphead"><th colSpan={2}>Core CE</th><th className="pass" /></tr>
          <FeatureRow name="State-required CE — all state packages included" lite="chk" />
          <FeatureRow name="ANCC-accredited CE courses" lite="70+" pass="300+" alt />
          <FeatureRow name="Exclusive CE podcasts" sub="biweekly episodes" lite="chk" />
          <FeatureRow name="Enhanced CE deadline tracking & certificates" lite="chk" alt />
          <FeatureRow name="Automatic reporting, including CE Broker" lite="chk" />

          <tr className="grouphead"><th colSpan={2}>Expanded Libraries</th><th className="pass" /></tr>
          <FeatureRow name="Premium Specialty Collections" sub="10+ specialties" lite="no" alt />
          <FeatureRow name="Pharmacology library & DEA MATE Act training" lite="no" />
          <FeatureRow name="Clinical skills refresher video library" lite="no" alt />

          <tr className="grouphead"><th colSpan={2}><span className="newpill2">New</span></th><th className="pass" /></tr>
          <FeatureRow name="Certification exam prep + question banks" sub="CCRN, MEDSURG-BC/CMSRN, CEN" lite="no" />
          <FeatureRow name="Specialty & role transition CE" sub="Med-Surg, ICU, Emergency" lite="no" alt />
          <FeatureRow name="Nursing interview practice simulation" sub="Real-time practice & feedback" lite="no" />
        </tbody>
      </table>
    </div>
  )
}

/* ─── Professional Certifications — open, on-background section (Concept A) ──
   No band/container: an agent photo + intro on the left, the four value props
   as a hairline-divided list on the right, sitting directly on the page.
   Shown on both CRE non-member + member views (above AI MasterTracks). Photo:
   public/brand/laptop-woman.png. */
const CERT_FEATURES = [
  { Icon: CircleCheck, text: 'Equip agents with relevant skills, proof of mastery, and a mindset of continuous growth.' },
  { Icon: CircleCheck, text: 'Each certification gives you actionable training and a tangible credential.' },
  { Icon: CircleCheck, text: 'New certification courses launching every quarter.' },
  { Icon: CircleCheck, text: 'Members receive exclusive discounts.' },
]

// The six certification options — acronym, name, non-member price, description,
// and each badge's color (cert-specific badge colors, no token equivalent).
const CERT_OPTIONS = [
  { acr: 'CNE', name: 'Certified Negotiation Expert', price: '$300', color: '#d9743f', desc: 'Negotiate like a pro in real estate with this course from the Real Estate Negotiation Institute.' },
  { acr: 'CBAE', name: 'Certified Buyer Agent Expert', price: '$150', color: '#3a9d5d', desc: 'Adapt to the changing buyer landscape with an Unbeatable Value Proposition that highlights your strengths.' },
  { acr: 'CPDC', name: 'Certified Property Data Collector', price: '$249', color: '#d15b7f', desc: 'This course provides easy access to reliable property data, creating a lucrative and flexible side business for real estate agents.' },
  { acr: 'RPAE', name: 'Residential Property Appraisal Expert', price: '$259', color: '#6a6fb0', desc: 'Deep knowledge of the Uniform Residential Appraisal Report (URAR) will enable you to get fair market prices for your customers.' },
  { acr: 'PVE', name: 'Property Valuation Expert', price: '$229', color: '#3fb0c6', desc: 'This course equips you with the knowledge and skills to tackle the discrepancies, and pricing strategies of property valuation.' },
  { acr: 'REAIS', name: 'Real Estate AI Specialist (REAIS)', price: '$179', color: '#8a94a3', desc: 'Most agents don’t know how to use AI. You will. This certification helps you automate smarter, serve faster, and stand out with real credibility. Learn exactly how to integrate AI into your business without the tech overwhelm — while staying compliant and earning client trust along the way.' },
]

function CertificationsSection() {
  return (
    <section className="cert-section" id="professional-certifications">
      <div className="cert">
        <div className="cert-right">
          <span className="cert-eyebrow">Professional Certifications</span>
          <h2 className="cert-title">Elevate your expertise with Professional Certifications</h2>
          <div className="cert-list">
            {CERT_FEATURES.map((f) => (
              <div className="cert-item" key={f.text}>
                <span className="cert-ic" aria-hidden>
                  <f.Icon size={24} />
                </span>
                <p className="cert-text">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="cert-left">
          <div
            className="cert-photo"
            role="img"
            aria-label="Real estate agent shaking hands with happy clients in a modern home"
          />
        </div>
      </div>

      {/* The certification options (Option C — medallion-forward cards). */}
      <div className="cert-options">
        {CERT_OPTIONS.map((c) => (
          <div className="co-card" key={c.acr} style={{ ['--bc' as string]: c.color }}>
            <span className="co-badge" aria-hidden>
              <i />
              <i />
              <b>{c.acr}</b>
            </span>
            <h3 className="co-name">{c.name}</h3>
            <p className="co-desc">{c.desc}</p>
            <span className="co-price">
              <span className="co-price-lbl">Non-member</span>
              <b>{c.price}</b>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── Real Estate AI MasterTracks — benefit spotlight ─────────────────────
   Intro (copy + training-session photo) over two teal MasterTrack price cards.
   Shown on both the CRE non-member + member views. Image:
   `public/brand/ai-mastertracks.png`. */
// Each tile carries a distinct brand color — used for its tinted background,
// top rule, icon, and label (light variant). Teal · blue · cyan · amber.
const AIMT_FEATURES = [
  {
    Icon: ChalkboardUser,
    label: 'Live Sessions',
    lead: 'See AI applied in real time',
    color: 'var(--color-primary-600)',
    body: 'Interactive, expert-led sessions where you learn how AI is applied across real estate workflows—from prospecting to closing. See how agents are using AI in real time and walk away knowing what to apply next.',
  },
  {
    Icon: MessageCircle,
    label: 'AI Expert Office Hours',
    lead: 'Live, one-on-one guidance',
    color: 'var(--color-cta-600)',
    body: 'Get hands-on help applying AI to your business. Bring your questions, ideas, and AI projects to live office hours, and get expert guidance as you implement what you’re learning.',
  },
  {
    Icon: Monitor,
    label: 'Online Sessions',
    lead: 'Learn on your schedule',
    color: 'var(--color-tertiary-600)',
    body: 'Self-paced training you can access anytime to build skills across your daily workflows. Learn on your schedule with focused sessions designed for quick application.',
  },
  {
    Icon: Bolt,
    label: 'Real-World Implementation',
    lead: 'Put AI to work, measurably',
    color: 'var(--color-secondary-600)',
    body: 'Turn AI into action with practical systems and workflows that streamline operations, strengthen client engagement, improve consistency, and drive measurable growth.',
  },
]

function AiMasterTracksSection() {
  const light = useFeatureFlag('aimt-band-style').variant === 'light'
  return (
    <section className={`aimt ${light ? 'aimt--light' : 'aimt--dark'}`} id="ai-mastertracks">
      <div className="aimt-top">
        <div className="aimt-copy">
          <span className="aimt-eyebrow">AI MasterTracks</span>
          <h2 className="aimt-title">
            Real Estate AI MasterTracks: Stop Learning AI. Start Using It to Grow Your Business.
          </h2>
          <p className="aimt-desc">
            A collection of AI training sessions that help real estate professionals apply AI across
            their day-to-day operations and workflows — to grow their business more efficiently and
            effectively.
          </p>
        </div>
        <div className="aimt-media">
          <div
            className="aimt-screen"
            role="img"
            aria-label="Real estate agents in an AI MasterTracks training session"
          />
        </div>
      </div>
      <div className="aimt-feats">
        {AIMT_FEATURES.map((f) => (
          <div className="aimt-feat" key={f.label} style={{ ['--feat' as string]: f.color }}>
            <span className="aimt-feat-ic" aria-hidden>
              <f.Icon size={22} />
            </span>
            <h3 className="aimt-feat-label">{f.label}</h3>
            <p className="aimt-feat-lead">{f.lead}</p>
            <p className="aimt-feat-body">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── Learning Snacks — solid-teal hero benefit section ───────────────────
   A full brand-teal band (Option C): centered title, an agent photo + the
   "one small bite at a time" tagline card on the left, and the four benefit
   points as a hairline-divided icon list on the right. Shown on both CRE
   non-member + member views. TODO(asset): drop the photo at
   `public/brand/learning-snacks.png` (a soft gradient shows until then). */
const SNACK_FEATURES = [
  { Icon: ClipboardList, text: 'Practical tools, articles, templates, checklists, and white papers.' },
  { Icon: PenToSquare, text: 'Sharpen your skills or gain new insights.' },
  { Icon: CalendarDay, text: 'Access to new snacks every quarter.' },
  { Icon: Award, text: 'Real estate agents master specific topics quickly and effectively.' },
]

function LearningSnacksSection() {
  return (
    <section className="snacks" id="learning-snacks">
      <div
        className="snacks-photo"
        role="img"
        aria-label="Real estate agent learning at a laptop"
      />
      <div className="snacks-body">
        <h2 className="snacks-title">Sharpen your real estate skills with bite-sized Learning Snacks</h2>
        <div className="snacks-list">
          {SNACK_FEATURES.map((f) => (
            <div className="snacks-item" key={f.text}>
              <span className="snacks-ic" aria-hidden>
                <f.Icon size={22} />
              </span>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Real Estate member benefits — stats band + "Learn More" spotlight ───
   Mirrors the Elite non-member layout: a full-bleed stats band, then a
   "Learn More about Member Benefits" header (with the accent underline) over
   the AI MasterTracks section + real-estate benefit spotlights (copy + bullets
   on the left, a product-visual card on the right, alternating). Shown on both
   CRE non-member + member views. TODO(content): stats + benefit copy are demo
   placeholders — refresh with real real-estate marketing copy. */
const RE_STATS = [
  { v: '250,000+', l: 'Real estate pros trust Colibri', d: 'Agents renewing, certifying, and growing with us.' },
  { v: 'All 50', l: 'States covered for renewal', d: 'Every required CE package, always up to date.' },
  { v: '700+', l: 'Courses across every line', d: 'From required renewal to designation prep.' },
]

function RealEstateBenefits({
  showStats = true,
  heading = 'Learn More about Member Benefits',
  only,
}: {
  showStats?: boolean
  /** Section heading. Members who can upgrade reframe it as
   *  "Explore Additional Member Benefits Available with an Upgrade". */
  heading?: string
  /** Limit which benefit bands render (by logical id). Absent ⇒ all three.
   *  The member view passes only the benefits NOT included at their tier, so
   *  the bands read as an upgrade pitch. */
  only?: ('ai-mastertracks' | 'learning-snacks' | 're-certifications')[]
} = {}) {
  const show = (id: string) => !only || (only as string[]).includes(id)
  // Lo-fi benefits — the benefit spotlight bands become wireframe blocks (the
  // stats band stays). Shared by the Lo-fi, Two-sections, and Multiple-
  // memberships versions.
  const version = useFeatureFlag('membership-page-version').variant
  const lofi = benefitsAreLoFi(version)
  const statBand = showStats ? (
    <div className="statband">
      <div className="statgrid">
        {RE_STATS.map((s) => (
          <div className="stat" key={s.l}>
            <div className="v">{s.v}</div>
            <div className="l">{s.l}</div>
            <div className="d">{s.d}</div>
          </div>
        ))}
      </div>
    </div>
  ) : null
  if (lofi) {
    return (
      <>
        {statBand}
        <LoFiBenefitSections
          heading={heading}
          id="re-benefits"
          withImage={benefitsShowPhotos(version)}
          items={RE_LOFI_BENEFITS.filter((b) => show(b.id))}
        />
      </>
    )
  }
  return (
    <>
      {/* Stats band — thin full-bleed brand band (reuses the Elite `.statband`).
          Non-member only: it's a marketing/social-proof band, so members (already
          signed up) don't see it. */}
      {statBand}

      {/* Benefit spotlight bands — header + accent line, then the selected
          AI MasterTracks / Learning Snacks / Certifications sections. */}
      <section className="learnmore" id="re-benefits">
        <h2>{heading}</h2>
        <div className="lm-spots">
          {show('ai-mastertracks') && <AiMasterTracksSection />}
          {show('learning-snacks') && <LearningSnacksSection />}
          {show('re-certifications') && <CertificationsSection />}
        </div>
      </section>
    </>
  )
}

/* ─── "Learn More about Member Benefits" — benefit spotlight ──────────────
   Highlights one What's-New benefit at a time (Exam & Cert Prep · Podcasts ·
   AI Career Tools · Resource Library) — a tab selector over a two-column
   spotlight (copy + check bullets on the left, a product visual with a NEW
   badge on the right). Modeled on the Figma benefit-spotlight layout. */
type Bullet = { text: string; specialties?: string[] }
type Benefit = {
  tab: string
  /**
   * Kicker above the title on the benefit spots. Names the OUTCOME or category
   * the benefit serves, so it complements the title instead of restating it —
   * the tab label can't do that job ("Resource Library" over "Resource Library"
   * reads as a duplicate, not a kicker). Used by both the marketing spots and
   * their lo-fi twins so the versions can't say different things.
   */
  eyebrow: string
  title: string
  poweredBy?: string
  bullets: Bullet[]
  visual: { headline: string; sub: string; icon: string; cardTitle: string; cardSub: string; cardBtn: string; cardMeta: string }
}

const BENEFITS: Benefit[] = [
  {
    tab: 'Exam & Cert Prep',
    eyebrow: 'Get Certified',
    title: 'Exam & Certification Prep',
    bullets: [
      { text: 'Practice tests and full study plans for CCRN, PCCN, CMSRN, and CEN certification exams.' },
      { text: 'Track your readiness with scored practice questions across 8 nursing specialties.' },
      { text: 'Review content and answer rationales built by certified nurse educators.' },
    ],
    visual: {
      headline: 'Exam-ready in weeks',
      sub: 'Build a study plan and watch your readiness score climb.',
      icon: '🏅',
      cardTitle: 'CCRN practice test',
      cardSub: '150 scored questions with rationales and a readiness score.',
      cardBtn: 'Start practice test',
      cardMeta: 'Attempt 2 · 82% ready',
    },
  },
  {
    tab: 'Podcasts',
    eyebrow: 'Earn CE On the Go',
    title: 'CE Podcasts',
    bullets: [
      { text: 'Earn CE credit on the go with bite-size, accredited audio episodes.' },
      { text: 'New biweekly episodes across clinical topics and specialties.' },
      { text: 'Listen anywhere — commute, break room, or between shifts.' },
    ],
    visual: {
      headline: 'Earn CE on the go',
      sub: 'Turn your commute into accredited CE.',
      icon: '🎧',
      cardTitle: 'Medical Mysteries',
      cardSub: 'Ep. 42 · 1 hr · Earns 1.0 CE on completion.',
      cardBtn: 'Play episode',
      cardMeta: '▶ New series · 6 episodes',
    },
  },
  {
    tab: 'AI Career Tools',
    eyebrow: 'Advance Your Career',
    title: 'Nursing Job Interview Preparation',
    poweredBy: 'Rubi',
    bullets: [
      { text: 'Practice for nursing job interviews in real-time with our proprietary Rubi™ Coach customized interview simulation experience.' },
      {
        text: 'Includes detailed interview questions for roles in various care settings across 8 nursing specialties.',
        specialties: [
          'Med-Surg',
          'Pediatrics/NICU',
          'Critical Care',
          'Oncology',
          'Emergency',
          'Psych/Behavioral Health',
          'OR/Perioperative',
          'Home Health/Community',
        ],
      },
      { text: 'Interact with your choice of speech or text and receive real-time feedback, scoring, and improvement suggestions to ace your interview.' },
    ],
    visual: {
      headline: 'Unlimited attempts',
      sub: "Practice as many times as you need — until you're interview-ready.",
      icon: '∞',
      cardTitle: 'Run it back, anytime',
      cardSub: 'Retake the full interview as many times as you need — every attempt is a fresh set of questions.',
      cardBtn: 'Give it another try',
      cardMeta: '∞ Attempt 3 · Unlimited',
    },
  },
  {
    tab: 'Resource Library',
    eyebrow: 'Answers On Demand',
    title: 'Resource Library',
    bullets: [
      { text: 'On-demand video skills refreshers and technique demonstrations.' },
      { text: 'Pharmacology library, dosing references, and clinical safety guides.' },
      { text: 'In-depth specialty bundles and downloadable resources.' },
    ],
    visual: {
      headline: '1,000+ resources',
      sub: 'Videos, guides, and references at your fingertips.',
      icon: '📚',
      cardTitle: 'IV Therapy & Vascular Access',
      cardSub: '1.5 CE hrs · Med-Surg · On-demand video skills refresher.',
      cardBtn: 'Open resource',
      cardMeta: '★ 4.8 · 12 min watch',
    },
  },
]

/* ─── Lo-fi benefit sections (the "Lo-fi benefits" Membership Version) ──────
   The `membership-page-version = lofi` variant keeps the whole Full page but
   swaps every Membership Benefits hero section for a wireframe block: a
   "Benefit N" label, a title, a one-line description, 3–5 bullets, and a
   placeholder image that alternates left/right down the column. Both the Elite
   (`MemberBenefitsSpotlight`) and real-estate (`RealEstateBenefits`) benefit
   sections render through this when the flag is on. */
type LoFiBenefitItem = {
  id?: string
  /** Small kicker above the title. Names the CATEGORY the benefit belongs to,
   *  so it complements the title rather than repeating it ("Microlearning" over
   *  "Learning Snacks"). The non-lo-fi spots use the benefit's rail/tab name for
   *  the same job; these mirror that. */
  eyebrow: string
  title: string
  desc: string
  bullets: string[]
  image?: string
}

// Fallback photo pool for benefit spots with no authored `image`. HEALTHCARE
// shots — fine for Elite, wrong for any other brand, which is why the Real
// Estate benefits author their own `image` per benefit instead of falling
// through to these. TODO(asset): per-benefit images for the Elite set too, so
// this index-cycling pool can go away.
const HUB_BENEFIT_IMAGES = [
  // Landscape healthcare photos (~1.5 ratio) that fill the wide benefit-spot
  // photo box without the awkward crop the portrait covers produced.
  '/brand/whats-new-bg.jpg',
  '/brand/whats-new-bg-2.jpg',
  '/brand/laptop-woman.png',
  '/brand/handshake.png',
]

function LoFiBenefitSections({
  heading,
  items,
  id = 'non-member-benefits',
  withImage = false,
}: {
  heading: string
  items: LoFiBenefitItem[]
  id?: string
  /** Membership Hub: swap the lo-fi placeholder for a real photo + Learn More. */
  withImage?: boolean
}) {
  return (
    <section className="learnmore" id={id}>
      <h2>{heading}</h2>
      <div className="lm-spots">
        {items.map((it, i) => (
          <div
            className={`lm-spot${i % 2 === 1 ? ' lm-spot--rev' : ''}${withImage ? ' lm-spot--bare' : ''}`}
            key={it.title}
          >
            <div className="lm-copy">
              <span className="lm-eyebrow">{it.eyebrow}</span>
              <h3 className="lm-title">{it.title}</h3>
              <p style={lofiDescStyle}>{it.desc}</p>
              <ul className="lm-bullets">
                {it.bullets.slice(0, 5).map((t) => (
                  <li className="lm-bullet" key={t}>
                    <span className="lm-check" aria-hidden="true">✓</span>
                    <span className="lm-btext">{t}</span>
                  </li>
                ))}
              </ul>
              {withImage && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => console.info('membership-hub:learn-more', it.id ?? it.title)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Learn More
                </Button>
              )}
            </div>
            {withImage ? (
              <div className="lm-photowrap">
                <div
                  className="lm-photo"
                  style={{
                    backgroundImage: `url(${it.image ?? HUB_BENEFIT_IMAGES[i % HUB_BENEFIT_IMAGES.length]})`,
                  }}
                  aria-hidden="true"
                />
              </div>
            ) : (
              <div style={lofiImgStyle} aria-hidden="true">
                Image
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

const lofiDescStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
}

const lofiImgStyle: CSSProperties = {
  minHeight: 220,
  borderRadius: 'var(--radius-lg)',
  border: '2px dashed var(--color-border-subtle)',
  background: 'var(--color-neutral-75)',
  display: 'grid',
  placeItems: 'center',
  color: 'var(--color-text-tertiary)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

/** RE lo-fi benefit copy (concise placeholders), keyed by the `RealEstateBenefits`
 *  `only` ids so the member upgrade filter still applies. */
const RE_LOFI_BENEFITS: (LoFiBenefitItem & { id: NonNullable<LoFiBenefitItem['id']> })[] = [
  {
    id: 'ai-mastertracks',
    eyebrow: 'Business Growth',
    title: 'AI MasterTracks',
    // The product's own screen — already used by the AI MasterTracks band.
    image: '/brand/ai-mastertracks.png',
    desc: 'Business-building masterclasses, powered by Real Estate AI tools.',
    bullets: [
      'Guided tracks for lead gen, listings, and negotiation.',
      'AI tools that draft descriptions, emails, and social posts.',
      'Work at your own pace with on-demand video lessons.',
    ],
  },
  {
    id: 'learning-snacks',
    eyebrow: 'Microlearning',
    title: 'Learning Snacks',
    image: '/brand/laptop-woman.png',
    desc: 'Sharpen your real estate skills with bite-sized, on-demand lessons.',
    bullets: [
      'Five-minute lessons you can finish between showings.',
      'Fresh topics added every week.',
      'Track what you’ve completed across your library.',
    ],
  },
  {
    id: 're-certifications',
    eyebrow: 'Credentials',
    title: 'Professional Certifications',
    // The client-handshake shot the RE certifications photo already uses.
    image: '/brand/handshake.png',
    desc: 'Elevate your expertise with nationally recognized designations.',
    bullets: [
      'Prep and coursework for the top real estate designations.',
      'Stand out to clients with credentials that build trust.',
      'Included with your Pro / Premier membership.',
    ],
  },
]

function MemberBenefitsSpotlight({
  heading = 'Learn More about Member Benefits',
  only,
  id = 'non-member-benefits',
}: {
  /** Section heading — members who can upgrade reframe it as
   *  "Explore Additional Member Benefits Available with an Upgrade". */
  heading?: string
  /** Limit to specific benefit tabs (by `Benefit.tab`). Absent ⇒ all. The
   *  member upgrade section passes only the not-included benefits. */
  only?: string[]
  id?: string
} = {}) {
  // Every benefit stacks as its own scrollable section (no tabs) so the reviewer
  // can read straight down instead of clicking between them. Alternating rows
  // flip the copy/visual columns for rhythm (desktop only; mobile stays copy-
  // first via the single-column media query).
  const benefits = only ? BENEFITS.filter((b) => only.includes(b.tab)) : BENEFITS
  const { brand } = useAccount()
  // Lo-fi benefits — swap the marketing heroes for wireframe blocks. Shared by
  // the Lo-fi, Two-sections, and Multiple-memberships versions.
  const version = useFeatureFlag('membership-page-version').variant
  const lofi = benefitsAreLoFi(version)
  if (lofi) {
    return (
      <LoFiBenefitSections
        heading={heading}
        id={id}
        withImage={benefitsShowPhotos(version)}
        items={benefits.map((b) => ({
          // Same authored eyebrow the marketing spot prints, so switching
          // versions never changes what the kicker says.
          eyebrow: b.eyebrow,
          title: b.title,
          desc: b.visual.sub,
          bullets: b.bullets.map((bl) => bl.text),
        }))}
      />
    )
  }
  return (
    <section className="learnmore" id={id}>
      <h2>{heading}</h2>
      <div className="lm-spots">
        {benefits.map((b, i) => {
          // CE Podcasts is pinned to the very bottom of the section (rendered
          // after the map — see below); skip it here but keep its slot so the
          // other spots' index parity (lm-spot--rev alternation) is unchanged.
          // AI Career Tools renders as a full-bleed Rubi hero with the real
          // launch cards overlapping its bottom edge (see RubiUpgradeHero);
          // the rest keep the two-column spot.
          if (b.tab === 'Podcasts') return null
          if (b.tab === 'AI Career Tools') return <RubiUpgradeHero key={b.tab} />
          return (
          <div
            className={`lm-spot${i % 2 === 1 ? ' lm-spot--rev' : ''}${b.tab === 'Exam & Cert Prep' ? ' lm-spot--bare' : ''}`}
            key={b.tab}
          >
            <div className="lm-copy">
              <span className="lm-eyebrow">{b.eyebrow}</span>
              <h3 className="lm-title">{b.title}</h3>
              <ul className="lm-bullets">
                {b.bullets.map((bl) => (
                  <li className="lm-bullet" key={bl.text}>
                    <span className="lm-check" aria-hidden="true">✓</span>
                    <span className="lm-btext">
                      {bl.text}
                      {bl.specialties && (
                        <span className="lm-specialties">
                          {bl.specialties.map((s) => (
                            <span key={s}>{s}</span>
                          ))}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {b.poweredBy && (
                <div className="lm-powered">
                  Powered by <b>{b.poweredBy}™</b>
                </div>
              )}
            </div>
            {b.tab === 'Exam & Cert Prep' ? (
              <ExamPrepFan />
            ) : b.tab === 'Resource Library' ? (
              // Real Resource Library tiles (cover + format + title + rating),
              // the same content the member "Included" shelf + the Library page
              // render — instead of the lo-fi single-card mock.
              <LibraryTileGrid brand={brand} />
            ) : (
              <div className="lm-visual">
                <span className="lm-new" aria-hidden="true">NEW</span>
                <div className="lm-visual-head">{b.visual.headline}</div>
                <div className="lm-visual-sub">{b.visual.sub}</div>
                <div className="lm-card">
                  <span className="lm-card-ic">{b.visual.icon}</span>
                  <span className="lm-card-title">{b.visual.cardTitle}</span>
                  <span className="lm-card-sub">{b.visual.cardSub}</span>
                  <button className="lm-card-btn" type="button">{b.visual.cardBtn}</button>
                  <span className="lm-card-meta">{b.visual.cardMeta}</span>
                </div>
              </div>
            )}
          </div>
          )
        })}
        {/* CE Podcasts — pinned to the very bottom of the section (only when it's
            in the visible set; the member upgrade section's `only` omits it). */}
        {benefits.some((b) => b.tab === 'Podcasts') && (
          <PodcastBand b={benefits.find((b) => b.tab === 'Podcasts')!} />
        )}
      </div>
    </section>
  )
}

/* ─── Resource Library — real library tile grid (2×2) ─────────────────────
   The right column of the Resource Library spotlight: a 2×2 grid of the REAL
   library resources (cover image or designed hero + format label + title +
   rating), reusing the Learning Library's own card content instead of a lo-fi
   mock. Each tile opens the resource viewer (same as the member "Included"
   shelf + the standalone Library page). */
function LibraryTileGrid({ brand }: { brand: Brand }) {
  const resources = libraryConfigFor(brand).resources.slice(0, 4)
  if (resources.length === 0) return null
  return (
    <div className="rl-grid">
      {resources.map((r) => {
        const Icon = LIBRARY_TYPE_ICON[r.type]
        return (
          <Link key={r.id} to={`/resources/${r.id}`} className="rl-tile">
            <span
              className="rl-cover"
              aria-hidden="true"
              style={r.imageUrl ? { backgroundImage: `url(${r.imageUrl})` } : { background: r.heroBackground }}
            >
              {!r.imageUrl && <span className="rl-cover-label">{r.heroLabel}</span>}
            </span>
            <span className="rl-body">
              <span className="rl-type">
                <Icon size={12} />
                {TYPE_LABELS[r.type]}
              </span>
              <span className="rl-title">{r.title}</span>
              <span className="rl-rating" aria-label={`Rated ${r.rating.toFixed(1)} out of 5`}>
                <span aria-hidden="true">★</span> {r.rating.toFixed(1)}
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}

/* ─── AI Career Tools — full-bleed Rubi upgrade hero (overlap) ────────────
   The redesigned AI Career Tools upgrade pitch: a full-bleed navy `primary-800`
   hero strip carrying the Rubi lockup + headline + upgrade CTA (with a faded
   Rubi mark watermark), and the THREE real Rubi launch cards
   (`BenefitSections cardStyle="launch"`) lifting off its bottom edge. Reuses
   the exact card component from the What's New / career-tools page so the two
   surfaces can't drift. */
function RubiUpgradeHero() {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  return (
    <section className="rubi-up" aria-label="AI Career Tools">
      <div className="rubi-up-hero">
        <RubiMark aria-hidden className="rubi-up-watermark" width={220} style={RUBI_WHITE} />
        <div className="rubi-up-hero-inner">
          <span className="rubi-up-lockup" aria-hidden="true">
            <RubiMark width={20} style={RUBI_WHITE} />
            <RubiWordmark width={58} style={RUBI_WHITE} />
          </span>
          <div className="rubi-up-headrow">
            <div className="rubi-up-copy">
              <span className="rubi-up-eyebrow">AI Career Tools</span>
              <h3 className="rubi-up-title">Career tools, powered by Rubi™</h3>
              <p className="rubi-up-sub">
                Practice interviews, sharpen your resume, and map your next move — unlimited,
                on demand.
              </p>
            </div>
            <button type="button" className="rubi-up-cta" onClick={() => setUpgradeOpen(true)}>
              Upgrade to unlock
            </button>
          </div>
        </div>
      </div>
      <div className="rubi-up-cards">
        <BenefitSections only={['career-tools']} cardStyle="launch" access="full" headerMode="never" hideHeading />
      </div>
      <MembershipUpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </section>
  )
}

/* Force the Rubi brand SVGs to render white on the navy hero band (their
   default multicolor fill keys off `--fill-0`). */
const RUBI_WHITE = { ['--fill-0' as string]: 'var(--color-text-inverse)' } as CSSProperties

/* ─── CE Podcasts — full-width lifestyle photo band ──────────────────────
   Breaks out of the content gutter to run edge-to-edge. A cover photo of a
   member listening on the go, with a navy gradient scrim fading in from the
   right so the copy (eyebrow + heading + check bullets, all reversed to light)
   stays legible over the image. Marketing surface — no CTA. */
function PodcastBand({ b }: { b: Benefit }) {
  return (
    <section className="lm-podband">
      <div className="lm-podband-media" aria-hidden="true" />
      <div className="lm-copy lm-podband-copy">
        <span className="lm-eyebrow">{b.eyebrow}</span>
        <h3 className="lm-title">{b.title}</h3>
        <ul className="lm-bullets">
          {b.bullets.map((bl) => (
            <li className="lm-bullet" key={bl.text}>
              <span className="lm-check" aria-hidden="true">✓</span>
              <span className="lm-btext">{bl.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ─── Exam & Cert Prep — fanned specialty cards + readiness ring ──────────
   The Exam & Cert Prep benefit's right column is a promotional stack: three
   specialty exam cards fanned back-to-front, the front one led by a readiness
   ring. Marketing surface — no CTA button (the page owns any call to action).
   The ring value is illustrative/static (a representative score), not wired to
   a learner's live readiness. Back cards are decorative (aria-hidden) — they
   only signal breadth; AT reads the front card once. */
type FanCard = { specialty: string; title: string; meta: string }

function ExamPrepFan({
  readiness = 82,
  front = {
    specialty: 'CCRN',
    title: 'CCRN practice test',
    sub: '150 scored questions with rationales and a readiness score.',
  },
  back = [
    { specialty: 'PCCN', title: 'PCCN practice test', meta: '150 questions' },
    { specialty: 'CEN', title: 'CEN practice test', meta: '150 questions' },
  ],
}: {
  readiness?: number
  front?: { specialty: string; title: string; sub: string }
  back?: [FanCard, FanCard]
}) {
  return (
    <div className="lm-visual lm-fanwrap">
      <div className="lm-fan">
        {/* Back cards — decorative breadth signal only. */}
        <div className="lm-fan-card lm-fan-back2" aria-hidden="true">
          <span className="lm-card-ic"><AwardSolid size={18} aria-hidden /></span>
          <span className="lm-card-title">{back[1].title}</span>
          <span className="lm-card-meta">{back[1].meta}</span>
        </div>
        <div className="lm-fan-card lm-fan-back1" aria-hidden="true">
          <span className="lm-card-ic"><AwardSolid size={18} aria-hidden /></span>
          <span className="lm-card-title">{back[0].title}</span>
          <span className="lm-card-meta">{back[0].meta}</span>
        </div>
        {/* Front card — the one AT reads. */}
        <div className="lm-fan-card lm-fan-front">
          <span className="lm-new" aria-hidden="true">NEW</span>
          <ReadinessRing pct={readiness} />
          <span className="lm-card-title">{front.title}</span>
          <span className="lm-card-sub">{front.sub}</span>
        </div>
      </div>
    </div>
  )
}

/** SVG donut readiness ring. r=56 → circumference ≈ 352; the fill arc is
 *  `352 × (1 − pct/100)` offset, rounded caps, rotated −90° to start at top.
 *  The visible "{pct}% Exam Ready" text is the accessible equivalent, so the
 *  SVG carries an `aria-label` and the center text is `aria-hidden`. */
function ReadinessRing({ pct }: { pct: number }) {
  const C = 352
  const offset = Math.round(C * (1 - Math.max(0, Math.min(100, pct)) / 100))
  return (
    <div className="lm-ring">
      <svg viewBox="0 0 132 132" width="132" height="132" role="img" aria-label={`${pct}% exam ready`}>
        <circle className="lm-ring-track" cx="66" cy="66" r="56" />
        <circle
          className="lm-ring-fill"
          cx="66"
          cy="66"
          r="56"
          style={{ strokeDasharray: C, strokeDashoffset: offset }}
        />
      </svg>
      <div className="lm-ring-center" aria-hidden="true">
        <span className="lm-ring-pct">{pct}%</span>
        <span className="lm-ring-label">Exam Ready</span>
      </div>
    </div>
  )
}

const STATS = [
  { v: '$1,180', l: 'Average member saves annually', d: 'Versus buying CE, exam prep and podcasts separately.' },
  { v: '48,200', l: 'Memberships active today', d: 'Nurses renewing, studying and certifying alongside you.' },
  { v: '2.4M', l: 'Credit hours completed last year', d: 'Estimated, across all member accounts.' },
]

/** A feature row: `lite` is `'chk'` (included), `'no'` (dash) or a value
 *  string; Passport is always included (a check) unless a `pass` value is
 *  given (e.g. "300+"). */
function FeatureRow({
  name,
  lite,
  pass,
  alt = false,
}: {
  name: string
  sub?: string
  lite: string
  pass?: string
  alt?: boolean
}) {
  const cell = (spec: string, side: 'lite' | 'pass') => {
    if (spec === 'chk') return <span className={`chk ${side}`}>✓</span>
    if (spec === 'no') return <span className="no">—</span>
    return <span className={`val2 ${side}`}>{spec}</span>
  }
  return (
    <tr className={`feature${alt ? ' alt' : ''}`}>
      <td className="fname">
        <b>{name}</b>
      </td>
      <td className="cell">{cell(lite, 'lite')}</td>
      <td className="cell pass">{cell(pass ?? 'chk', 'pass')}</td>
    </tr>
  )
}

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
}

/* ─── Scoped styles (ported from explore-membership-standalone.html) ─────
   Every selector is prefixed with `.mx-root` so the generic class names
   (`.hero`, `.stat`, `.chip`, …) can neither collide with nor leak into the
   rest of the app. Colors reference the app's Elite CSS variables. */
export const MX_CSS = `
.mx-root{font-family:var(--font-body);color:var(--color-text-primary);line-height:1.5}
.mx-root *{box-sizing:border-box}
.mx-root h1,.mx-root h2,.mx-root h3{font-family:var(--font-heading);margin:0}
.mx-root a{color:inherit;text-decoration:none}
.mx-root button{font-family:inherit}

.mx-root .hero{background:linear-gradient(120deg,var(--color-primary-600),var(--color-primary-700));color:#fff;padding:34px 40px 30px}
.mx-root .hero .eye{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--color-secondary-300);margin-bottom:10px}
.mx-root .hero h1{font-size:34px;font-weight:700;letter-spacing:.01em;color:#fff}
.mx-root .hero p{margin:10px 0 0;max-width:88ch;font-size:15px;color:rgba(255,255,255,.82)}
.mx-root .hero .hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap}
.mx-root .hero .hero-copy{flex:1;min-width:0}
.mx-root .hero .heroactions{margin-top:22px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.mx-root .hero .herocta{display:inline-flex;align-items:center;gap:8px;background:var(--color-cta-500);color:#fff;font-family:var(--font-heading);font-weight:700;font-size:15px;letter-spacing:.02em;padding:0 26px;min-height:48px;border-radius:var(--radius-md);box-shadow:0 6px 18px rgba(64,28,59,.35);transition:background .15s,transform .15s}
.mx-root .hero .herocta:hover{background:var(--color-cta-600);transform:translateY(-1px)}

.mx-root .scorecard{margin-top:22px;background:var(--color-primary-800);border-radius:var(--radius-lg);overflow:hidden}
.mx-root .sc-head{background:var(--color-primary-900);display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 24px;min-height:52px;flex-wrap:wrap}
.mx-root .sc-head-left{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.mx-root .sc-title{font-family:var(--font-heading);font-weight:700;font-size:15px;color:#fff}
.mx-root .sc-badge{display:inline-flex;align-items:center;gap:6px;background:var(--color-primary-100);color:var(--color-primary-700);font-weight:600;font-size:14px;padding:0 10px;height:28px;border-radius:var(--radius-md)}
.mx-root .sc-expires{font-size:13px;color:rgba(255,255,255,.7)}
.mx-root .sc-manage{display:inline-flex;align-items:center;gap:6px;color:#fff;font-family:var(--font-body);font-weight:600;font-size:14px;text-decoration:underline;text-underline-offset:2px;cursor:pointer;white-space:nowrap}
.mx-root .sc-divider{height:1px;background:rgba(255,255,255,.22)}
.mx-root .sc-stats{display:flex;align-items:stretch;padding:20px 24px}
.mx-root .sc-stat{display:flex;flex-direction:column;gap:2px;padding:2px 22px;flex:1;min-width:0}
.mx-root .sc-stat:first-child{padding-left:0}
.mx-root .sc-stat + .sc-stat{border-left:1px solid rgba(255,255,255,.22)}
.mx-root .sc-stat .k{font-family:var(--font-body);font-weight:700;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.mx-root .sc-stat .v{font-family:var(--font-heading);font-weight:700;font-size:22px;line-height:1.15;color:#fff}
.mx-root .sc-stat .s{font-family:var(--font-body);font-size:12px;color:rgba(255,255,255,.7)}

/* Membership Hub hero stat band (Figma 633:132) — a translucent navy panel with
   a solid primary-800 "Lifetime Member Savings" cell leading a row of stats. */
.mx-root .hub-band{margin-top:22px;display:flex;align-items:stretch;flex-wrap:wrap;background:color-mix(in srgb, var(--color-primary-800) 50%, transparent);border-radius:var(--radius-lg);overflow:hidden}
.mx-root .hub-savings{background:var(--color-primary-800);display:flex;flex-direction:column;justify-content:center;gap:10px;padding:18px 22px;width:240px;min-width:200px}
.mx-root .hub-savings .k{font-family:var(--font-body);font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.85)}
.mx-root .hub-savings .v{margin:0;display:flex;align-items:flex-start;gap:4px;font-family:var(--font-heading);font-weight:600;line-height:1;color:#fff}
.mx-root .hub-savings .v .cur{font-size:31px;opacity:.5}
.mx-root .hub-savings .v .amt{font-size:48px}
.mx-root .hub-savings .s{font-family:var(--font-body);font-size:12px;line-height:1.5;color:rgba(255,255,255,.72)}
.mx-root .hub-stats{flex:1;min-width:280px;display:flex;align-items:center;flex-wrap:wrap}
.mx-root .hub-stat{flex:1;min-width:120px;display:flex;flex-direction:column;gap:12px;padding:20px 24px}
.mx-root .hub-stat + .hub-stat{border-left:1px solid rgba(255,255,255,.22)}
.mx-root .hub-stat .n{font-family:var(--font-heading);font-size:36px;line-height:1;color:rgba(255,255,255,.8)}
.mx-root .hub-stat .lbl{display:flex;flex-direction:column;gap:2px}
.mx-root .hub-stat .lbl .k{font-family:var(--font-body);font-weight:700;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#fff}
.mx-root .hub-stat .lbl .s{font-family:var(--font-body);font-size:12px;color:rgba(255,255,255,.7)}
/* Current Membership passport card (Figma 633:3385) — used by the split hero. */
.mx-root .hub-mcard{position:relative;overflow:hidden;width:288px;min-width:252px;display:flex;flex-direction:column;align-items:flex-start;padding:16px 20px 14px;background:linear-gradient(162deg,var(--color-primary-700),var(--color-primary-900))}
.mx-root .hub-mcard > *:not(.hub-mcard-wm){position:relative;z-index:1}
.mx-root .hub-mcard-wm{position:absolute;z-index:0;right:-14px;top:-8px;line-height:0;color:rgba(255,255,255,.08);pointer-events:none}
.mx-root .hub-mcard-name{margin:12px 0 6px;font-family:var(--font-heading);font-weight:500;font-size:18px;line-height:1.25;color:#fff;max-width:232px}
.mx-root .hub-mcard-line{font-family:var(--font-body);font-size:13px;line-height:1.55;color:rgba(255,255,255,.72)}
.mx-root .hub-mcard-manage{margin-top:auto;padding-top:4px;align-self:flex-end;display:inline-flex;align-items:center;gap:6px;font-family:var(--font-body);font-weight:600;font-size:14px;color:#fff;text-decoration:none}
.mx-root .hub-mcard-manage:hover{text-decoration:underline}
/* "hub-split" variant — the membership card and the savings/stats band become
   two standalone cards, each with its own radius, ≥30px apart. */
.mx-root .hub-band--split{background:transparent;overflow:visible;gap:30px;align-items:stretch}
.mx-root .hub-band--split .hub-mcard{flex:0 0 auto;border-radius:var(--radius-lg)}
/* "Split cards" refined layout (Figma 640:3469) — two labeled columns: an
   "Active Membership" passport card and a "Lifetime Member Details" card whose
   dark Total Saved bar sits over the four stats. */
/* Top-align the two columns so the Lifetime Member Details card takes its own
   card kept internally compact, and widen the gap between the two columns. Both
   columns stretch to equal height so the Active Membership card and the Lifetime
   Member Details card always line up, whichever has more content. */
.mx-root .hub-band--split2{align-items:stretch;gap:40px}
.mx-root .hub-col{display:flex;flex-direction:column;align-items:stretch;min-width:0}
.mx-root .hub-col--card{flex:0 0 auto}
.mx-root .hub-col--metrics{flex:1;min-width:420px}
.mx-root .hub-coleye{font-family:var(--font-body);font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.85);margin-bottom:8px}
.mx-root .hub-col--card .hub-mcard{width:100%;flex:1}
/* Multiple memberships (Figma 640:3979): the Active Membership card becomes a
   stacked deck — the front card over two faded gradient cards fanning to the
   bottom-right. */
.mx-root .hub-col--card .hub-deck{position:relative;display:flex;flex:1;width:288px}
.mx-root .hub-deck > .hub-mcard{position:relative;z-index:2;flex:1;box-shadow:0 6px 12px rgba(0,0,0,.28)}
/* One layer per OTHER membership, coloured by ITS tier — the offset + the
   per-layer shadow give the depth, the inset hairline keeps each card's own
   edge legible where two tiers of similar value meet, and the colour is what
   stops the stack reading as a drop shadow. Positioned inline (background,
   transform, z-index, opacity) since each layer's values come from its own
   record. */
.mx-root .hub-deck-layer{position:absolute;top:0;left:0;width:calc(100% - var(--deck-x,0px));height:calc(100% - var(--deck-y,0px));border-radius:var(--radius-lg);pointer-events:none;box-shadow:0 6px 14px rgba(0,0,0,.32),inset 0 0 0 1px rgba(255,255,255,.18)}
/* The front card gives up exactly the stack's depth so the deepest layer lands
   on the deck's own edge — the whole stack stays inside the 288px box. */
.mx-root .hub-deck > .hub-mcard{margin:0 var(--deck-x,0px) var(--deck-y,0px) 0}
/* hub-details / savebar / dstats moved to tokens.css as .cre-hub-* — see
   MembershipHubDetails.tsx. They were unreachable from the handoff preview
   while scoped to .mx-root here, which is how that preview drifted. */

.mx-root .body{padding:28px 40px 64px;display:flex;flex-direction:column;gap:56px}
/* "Two sections" page version — the Current Membership card + Membership
   Scorecard sitting directly under the hero, on the page surface, at the same
   40px gutter as the body. Negative bottom margin trims the body's own top
   padding so the two blocks read as one run rather than a 56px gap. */
.mx-root .mx-two-sections{padding:24px 40px 0;margin-bottom:-4px}
/* Multi-membership overlap: the roll-up scorecard floats up over the hero's
   bottom edge, straddling the blue band and the page surface below it. The hero
   gains a bottom "runway" of blue for the card to overlap into, and the block is
   pulled up and layered above the hero. Scoped to the multi view — the single
   Two-sections layout keeps its navy card on the page surface. */
.mx-root .hero--runway{padding-bottom:100px}
.mx-root .mx-two-sections--overlap{margin-top:-80px;padding:0 40px 0;position:relative;z-index:2}

/* KPI strip — a thin, full-bleed navy hero band below the comparison chart. */
.mx-root .statband{background:linear-gradient(135deg,var(--color-primary-700),var(--color-primary-600));margin:0 -40px;padding:40px 40px;border:0;border-radius:0}
.mx-root .statgrid{display:grid;grid-template-columns:repeat(3,1fr)}
@media(max-width:820px){.mx-root .statgrid{grid-template-columns:1fr}}
.mx-root .stat{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:2px 28px}
.mx-root .stat + .stat{border-left:1px solid rgba(255,255,255,.22)}
@media(max-width:820px){.mx-root .stat{padding:14px 0}.mx-root .stat + .stat{border-left:0;border-top:1px solid rgba(255,255,255,.22)}.mx-root .stat:first-child{padding-top:0}}
.mx-root .stat .v{font-family:var(--font-heading);font-weight:800;font-size:30px;line-height:1.05;color:#fff}
.mx-root .stat .l{font-size:14px;font-weight:700;color:#fff}
.mx-root .stat .d{font-size:13px;line-height:1.45;color:rgba(255,255,255,.72)}

.mx-root .plansintro{scroll-margin-top:96px}
/* Real-estate 3-tier card comparison wrapper — wider than the Elite feature
   table so the three ComparePlanCards sit side by side (matches the modal). */
.mx-root .re-cmp-wrap{max-width:1120px;margin:0 auto}
.mx-root .re-cmp-wrap .cmp2-header{padding-top:0;margin-bottom:24px}

/* CRE "What's Included" table title sits inside the teal container. */
.mx-root .ri-wrap .ri-title{padding:0;margin:0 0 20px}
/* CRE plan price cards (3-up) above the matrix — reuse the Elite cmp2-plan
   chrome; all plan names teal so they match the matrix headers. */
.mx-root .cmp2-plans.tri{grid-template-columns:repeat(3,1fr)}
.mx-root .ri-wrap .cmp2-plans{margin-bottom:24px}
.mx-root .ri-wrap .cmp2-plan .pname{color:var(--color-primary-700)}
@media(max-width:640px){.mx-root .cmp2-plans.tri{grid-template-columns:1fr}}

/* CRE "What's Included" feature matrix — no container fill; the Pro column
   carries the highlight tint (matching its recommended price card). */
.mx-root .ri-wrap{max-width:880px;margin:0 auto;overflow-x:auto;background:var(--color-surface-card);border:1px solid var(--color-border-subtle);border-radius:var(--radius-xl);box-shadow:var(--shadow-card);padding:30px 32px}
.mx-root .ri-table{width:100%;border-collapse:collapse;min-width:520px}
.mx-root .ri-table col.ri-lane--pro{background:color-mix(in srgb,var(--color-primary-100) 38%,var(--color-surface-card))}
.mx-root .ri-table th,.mx-root .ri-table td{padding:14px 14px;text-align:center;vertical-align:middle}
.mx-root .ri-collabel{text-align:right;font-family:var(--font-body);font-size:13px;font-weight:700;color:var(--color-text-secondary);white-space:nowrap}
/* No solid header underline — the line under the tiers is the first body row's
   dashed top border, which spans every column all the way across. */
.mx-root .ri-plan{display:inline-flex;flex-direction:column;align-items:center;gap:5px}
.mx-root .ri-plan .ri-name{font-family:var(--font-heading);font-weight:800;font-size:18px;color:var(--color-primary-700)}
.mx-root .ri-row td,.mx-root .ri-row th{border-top:1px dashed var(--color-primary-200)}
.mx-root .ri-table th.ri-feat{text-align:left;font-family:var(--font-body);font-size:14px;font-weight:400;color:var(--color-text-primary);line-height:1.35}
.mx-root .ri-feat strong{font-weight:700}
.mx-root .ri-checkdot{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;color:#fff}
.mx-root .ri-dash{color:var(--color-neutral-400);font-size:18px}
.mx-root .ri-val{font-family:var(--font-body);font-size:14px;color:var(--color-text-primary)}
.mx-root .ri-val strong{font-family:var(--font-heading);font-weight:800}
@media(max-width:560px){.mx-root .ri-table th,.mx-root .ri-table td{padding:11px 8px}}

/* Professional Certifications — Concept A: open on the page background (no
   band). Image + intro left, a hairline-divided value-prop list right. */
.mx-root .cert-section{max-width:1120px;margin:0 auto;scroll-margin-top:96px}
.mx-root .cert{display:grid;grid-template-columns:1.08fr .92fr;gap:48px;align-items:center;padding:8px 0}
@media(max-width:820px){.mx-root .cert{grid-template-columns:1fr;gap:28px}}
/* Certification options (Option C) — medallion-forward cards below the intro. */
.mx-root .cert-options{display:grid;grid-template-columns:repeat(3,1fr);gap:36px 20px;margin-top:52px}
@media(max-width:900px){.mx-root .cert-options{grid-template-columns:1fr 1fr}}
@media(max-width:620px){.mx-root .cert-options{grid-template-columns:1fr}}
.mx-root .co-card{position:relative;background:var(--color-surface-card);border:1px solid var(--color-border-subtle);border-top:4px solid var(--bc,var(--color-primary-500));border-radius:4px 4px var(--radius-lg) var(--radius-lg);box-shadow:var(--shadow-card);padding:36px 22px 22px;margin-top:26px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px}
.mx-root .co-name{margin:0;font-family:var(--font-heading);font-weight:800;font-size:16px;letter-spacing:-.01em;line-height:1.25;color:var(--color-primary-700)}
.mx-root .co-desc{margin:0;flex:1;font-family:var(--font-body);font-size:13px;line-height:1.5;color:var(--color-text-secondary)}
.mx-root .co-price{font-family:var(--font-body);font-size:13px;color:var(--color-text-secondary);margin-top:2px}
.mx-root .co-price-lbl{display:block;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--color-text-tertiary);margin-bottom:2px}
.mx-root .co-price b{color:var(--color-text-primary);font-weight:800;font-size:16px}
/* Ribbon medallion badge floating over the card top. */
.mx-root .co-badge{position:absolute;top:-28px;left:50%;transform:translateX(-50%);width:54px;height:60px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18))}
.mx-root .co-badge i{position:absolute;bottom:0;width:13px;height:22px;background:var(--bc)}
.mx-root .co-badge i:first-child{left:13px;clip-path:polygon(0 0,100% 0,100% 100%,50% 74%,0 100%);transform:rotate(-9deg)}
.mx-root .co-badge i:last-child{right:13px;clip-path:polygon(0 0,100% 0,100% 100%,50% 74%,0 100%);transform:rotate(9deg)}
.mx-root .co-badge b{position:absolute;top:0;left:50%;transform:translateX(-50%);width:48px;height:48px;border-radius:50%;background:radial-gradient(circle at 50% 34%,color-mix(in srgb,var(--bc) 72%,#fff),var(--bc));box-shadow:inset 0 0 0 3px rgba(255,255,255,.35),inset 0 0 0 5px color-mix(in srgb,var(--bc) 55%,#000);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px;text-shadow:0 1px 1px rgba(0,0,0,.25)}
.mx-root .cert-left{display:flex;flex-direction:column;gap:18px}
.mx-root .cert-photo{min-height:280px;border-radius:16px;background:url(/brand/handshake.png) center/cover no-repeat,linear-gradient(150deg,#e6d3c4,#c99f84 55%,#9c7057);box-shadow:0 20px 40px rgba(20,40,36,.14)}
.mx-root .cert-intro{margin:0;font-family:var(--font-body);font-size:15px;line-height:1.6;color:var(--color-text-secondary)}
.mx-root .cert-intro strong{color:var(--color-primary-700);font-weight:700}
.mx-root .cert-eyebrow{font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--color-primary-600)}
.mx-root .cert .cert-title{font-family:var(--font-heading);font-size:26px;font-weight:800;line-height:1.15;color:var(--color-text-primary);text-align:left;margin:8px 0 18px}
.mx-root .cert .cert-title::after{display:none}
.mx-root .cert-list{display:flex;flex-direction:column;gap:20px}
.mx-root .cert-item{display:grid;grid-template-columns:40px 1fr;gap:16px;align-items:center}
.mx-root .cert-ic{display:inline-flex;align-items:center;justify-content:center;color:var(--color-primary-600)}
.mx-root .cert-text{margin:0;font-family:var(--font-body);font-size:14px;line-height:1.5;color:var(--color-text-secondary)}

/* Real Estate AI MasterTracks — "spotlight" section (Option A): copy + video up
   top, four feature cards below. Two treatments via the aimt-band-style flag:
   dark (deep-teal band, white text, glass cards) and light (white card, dark
   text, teal-accent cards). Base rules below are shared layout; the color
   treatment lives on the aimt--dark / aimt--light modifiers. */
.mx-root .aimt{max-width:1120px;margin:0 auto;width:100%;border-radius:var(--radius-xl);padding:36px 40px;scroll-margin-top:96px}
.mx-root .aimt-top{display:grid;grid-template-columns:1.05fr .95fr;gap:34px;align-items:center;margin-bottom:28px}
@media(max-width:820px){.mx-root .aimt{padding:28px 24px}.mx-root .aimt-top{grid-template-columns:1fr;gap:24px}}
.mx-root .aimt-copy{display:flex;flex-direction:column}
.mx-root .aimt-eyebrow{font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}
/* The band sits inside the learnmore section, whose h2 rule would center the
   title + add an underline — scope a stronger override to left / no rule. */
.mx-root .aimt .aimt-title{font-family:var(--font-heading);font-size:26px;font-weight:800;line-height:1.2;text-align:left}
.mx-root .aimt .aimt-title::after{display:none}
.mx-root .aimt-desc{margin:12px 0 0;font-family:var(--font-body);font-size:15px;line-height:1.6;max-width:48ch}
/* Monitor frame — dark bezel (heavier chin), rounded, shadow; the image fills
   the screen (background-size crops the source's light-blue padding). */
.mx-root .aimt-media{min-height:250px;border-radius:14px;background:var(--color-neutral-900);padding:10px 10px 16px;box-shadow:0 16px 42px rgba(0,0,0,.24);display:flex}
.mx-root .aimt-screen{flex:1;min-height:0;border-radius:7px;background:#000 center/cover no-repeat;background-image:url(/brand/ai-mastertracks.png)}
.mx-root .aimt-feats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
@media(max-width:820px){.mx-root .aimt-feats{grid-template-columns:1fr 1fr}}
@media(max-width:520px){.mx-root .aimt-feats{grid-template-columns:1fr}}
.mx-root .aimt-feat{border-radius:13px;padding:18px 16px;display:flex;flex-direction:column;gap:9px}
.mx-root .aimt-feat-ic{display:inline-flex}
.mx-root .aimt-feat-label{margin:0;font-family:var(--font-body);font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
.mx-root .aimt-feat-lead{margin:0;font-family:var(--font-heading);font-size:15px;font-weight:800;letter-spacing:-.01em;line-height:1.25}
.mx-root .aimt-feat-body{margin:0;font-family:var(--font-body);font-size:13px;line-height:1.5}
/* Dark treatment — deep-teal band, white text, amber accents, glass cards. */
.mx-root .aimt--dark{background:linear-gradient(160deg,var(--color-primary-800),var(--color-primary-900));color:#fff}
.mx-root .aimt--dark .aimt-eyebrow,.mx-root .aimt--dark .aimt-feat-ic,.mx-root .aimt--dark .aimt-feat-label{color:var(--color-secondary-300)}
.mx-root .aimt--dark .aimt-title,.mx-root .aimt--dark .aimt-feat-lead{color:#fff}
.mx-root .aimt--dark .aimt-desc{color:rgb(255 255 255 / 0.76)}
.mx-root .aimt--dark .aimt-feat-body{color:rgb(255 255 255 / 0.66)}
.mx-root .aimt--dark .aimt-feat{background:rgb(255 255 255 / 0.06);border:1px solid rgb(255 255 255 / 0.14)}
/* Light treatment — white card, dark text; each tile picks up its own brand
   color (var(--feat)) for a soft tinted background, top rule, icon, and label. */
.mx-root .aimt--light{background:var(--color-surface-card);border:1px solid var(--color-border-subtle);box-shadow:var(--shadow-card)}
.mx-root .aimt--light .aimt-eyebrow{color:var(--color-primary-700)}
.mx-root .aimt--light .aimt-title,.mx-root .aimt--light .aimt-feat-lead{color:var(--color-text-primary)}
.mx-root .aimt--light .aimt-desc,.mx-root .aimt--light .aimt-feat-body{color:var(--color-text-secondary)}
.mx-root .aimt--light .aimt-feat{background:color-mix(in srgb,var(--feat,var(--color-primary-600)) 8%,var(--color-surface-card));border:1px solid color-mix(in srgb,var(--feat,var(--color-primary-600)) 22%,var(--color-border-subtle));border-top:3px solid var(--feat,var(--color-primary-500));border-radius:4px 4px var(--radius-md) var(--radius-md)}
.mx-root .aimt--light .aimt-feat-ic,.mx-root .aimt--light .aimt-feat-label{color:var(--feat,var(--color-primary-700))}
/* Learning Snacks — solid brand-teal hero (Option C: photo + tagline left,
   hairline-divided icon list of benefits right). Orange dot columns echo the
   source art via the brand secondary. */
.mx-root .snacks{position:relative;overflow:hidden;border-radius:0;margin-left:-40px;margin-right:-40px;min-height:460px;display:grid;grid-template-columns:0.92fr 1.08fr;background:var(--color-primary-800);color:#fff}
.mx-root .snacks::after{content:"";position:absolute;top:32px;bottom:32px;right:14px;width:26px;background-image:radial-gradient(circle,var(--color-secondary-500) 1.6px,transparent 1.7px);background-size:15px 15px;opacity:.5;pointer-events:none;z-index:1}
.mx-root .snacks .snacks-title{margin:0 0 12px;font-family:var(--font-heading);font-size:26px;font-weight:800;letter-spacing:-.01em;line-height:1.16;text-align:left;color:#fff}
.mx-root .snacks .snacks-title::after{background:var(--color-secondary-500);margin-left:0}
.mx-root .snacks-body{grid-column:2;align-self:center;position:relative;z-index:1;padding:44px 56px 44px 28px}
@media(max-width:820px){.mx-root .snacks{grid-template-columns:1fr;min-height:0}.mx-root .snacks::after{display:none}.mx-root .snacks-photo{min-height:240px}.mx-root .snacks-photo::after{top:auto;left:0;right:0;bottom:0;width:auto;height:45%;background:linear-gradient(180deg,transparent,var(--color-primary-800))}.mx-root .snacks-body{grid-column:1;align-self:auto;padding:28px 24px 34px}}
/* The real photo goes at /brand/learning-snacks.png; podcast-listener.jpg is a
   temporary stand-in layered beneath it, so dropping the real file auto-swaps
   it. The gradient is the final fallback. */
/* Learning Snacks photo — the Elite "CE Podcasts" band treatment: the image
   fills the row's full height, bleeds to the band's left edge (cancels the
   48px band padding), drops the rounded card/shadow, and fades its inner edge
   into the navy band via an after-gradient (mirrors the lm-podband-media). */
.mx-root .snacks-photo{position:relative;grid-column:1;align-self:stretch;min-height:100%;border-radius:0;overflow:hidden;background:url(/brand/learning-snacks.png) center/cover no-repeat,url(/brand/podcast-listener.jpg) center 20%/cover no-repeat,linear-gradient(135deg,#dfeae7,#9db8b2)}
.mx-root .snacks-photo::after{content:"";position:absolute;top:0;bottom:0;right:0;width:72%;background:linear-gradient(90deg,transparent 0%,color-mix(in srgb,var(--color-primary-800) 45%,transparent) 45%,color-mix(in srgb,var(--color-primary-800) 85%,transparent) 75%,var(--color-primary-800) 100%);pointer-events:none}
.mx-root .snacks-list{display:flex;flex-direction:column}
.mx-root .snacks-item{display:grid;grid-template-columns:46px 1fr;gap:16px;align-items:center;padding:15px 0;border-top:1px solid rgba(255,255,255,.16)}
.mx-root .snacks-item:first-child{border-top:0}
.mx-root .snacks-ic{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.14);color:#fff;flex-shrink:0}
.mx-root .snacks-item p{margin:0;font-family:var(--font-body);font-size:15px;font-weight:600;line-height:1.4;color:rgba(255,255,255,.94)}
.mx-root .cmp2-wrap{margin:22px auto 0;max-width:740px;background:var(--color-surface-card);border:1px solid var(--color-border-subtle);border-radius:var(--radius-xl);box-shadow:var(--shadow-card);padding:0 24px 24px;overflow:hidden}
.mx-root .cmp2-header{margin:0 0 20px;padding:22px 24px 0;background:none;color:var(--color-text-primary);font-family:var(--font-heading);font-size:22px;font-weight:700;letter-spacing:.01em;text-align:center}
.mx-root .cmp2-plans{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.mx-root .cmp2-plan{position:relative;border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);padding:18px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;background:var(--color-surface-card)}
.mx-root .cmp2-plan.feat{background:color-mix(in srgb,var(--color-primary-100) 38%,#fff);border-color:var(--color-primary-200)}
.mx-root .cmp2-plan .best{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--color-primary-500);color:#fff;font-family:var(--font-heading);font-weight:800;font-size:10px;letter-spacing:.09em;text-transform:uppercase;padding:4px 12px;border-radius:var(--radius-pill)}
.mx-root .cmp2-plan .pname{font-family:var(--font-heading);font-weight:800;font-size:16px;letter-spacing:.05em;text-transform:uppercase}
.mx-root .cmp2-plan.lite .pname{color:var(--color-primary-600)}
.mx-root .cmp2-plan.feat .pname{color:var(--color-cta-600)}
.mx-root .cmp2-plan .pprice{font-family:var(--font-heading);font-weight:800;font-size:30px;line-height:1;color:var(--color-text-primary)}
.mx-root .cmp2-plan .pprice sup{font-size:15px;top:-.65em}
.mx-root .cmp2-plan .pprice .per{font-family:var(--font-body);font-size:13px;font-weight:600;color:var(--color-text-tertiary);margin-left:4px}
.mx-root .cmp2-plan .addcart{width:100%;min-height:44px;border-radius:var(--radius-md);font-family:var(--font-heading);font-weight:700;font-size:14px;cursor:pointer;border:0;transition:background .15s}
.mx-root .cmp2-plan.lite .addcart{background:#fff;border:1.5px solid var(--color-primary-500);color:var(--color-primary-600)}
.mx-root .cmp2-plan.lite .addcart:hover{background:var(--color-primary-100)}
.mx-root .cmp2-plan.feat .addcart{background:var(--color-cta-500);color:#fff}
.mx-root .cmp2-plan.feat .addcart:hover{background:var(--color-cta-600)}
/* Current-plan affordance in the member upgrade table — a non-actionable
   outline pill (the member owns this tier), mirroring the plan-card chip. */
.mx-root .cmp2-plan .ri-current{display:inline-flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:44px;border-radius:var(--radius-pill);border:1.5px solid var(--color-primary-500);color:var(--color-primary-600);background:var(--color-primary-100);font-family:var(--font-heading);font-weight:700;font-size:14px}
/* The current plan's header card gets the modal's muted light-gray fill so the
   "you own this tier" column reads distinct from the selectable upgrade cards. */
.mx-root .cmp2-plan.current{background:var(--color-neutral-75)}
.mx-root .cmp2-table{width:100%;border-collapse:collapse;margin-top:22px}
.mx-root .cmp2-table col.c-val{width:96px}
.mx-root .cmp2-table th,.mx-root .cmp2-table td{padding:8px 14px}
.mx-root .cmp2-table .colhead th{font-family:var(--font-heading);font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-align:center;padding-bottom:8px;vertical-align:bottom}
.mx-root .cmp2-table .colhead .lite-h{color:var(--color-primary-600)}
.mx-root .cmp2-table .colhead .pass-h{color:var(--color-cta-600)}
.mx-root .cmp2-table .grouphead th{padding:18px 14px 6px;font-family:var(--font-heading);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--color-text-tertiary);text-align:left}
.mx-root .newpill2{display:inline-flex;align-items:center;background:var(--color-cta-100);color:var(--color-cta-700);font-family:var(--font-heading);font-weight:800;font-size:10px;letter-spacing:.06em;padding:3px 9px;border-radius:var(--radius-pill)}
.mx-root .cmp2-table tr.feature td{border-top:1px solid var(--color-border-subtle)}
.mx-root .cmp2-table tr.feature.alt td{background:color-mix(in srgb,var(--color-neutral-75) 55%,#fff)}
.mx-root .cmp2-table td.fname b{font-family:var(--font-body);font-weight:600;font-size:14px;color:var(--color-text-primary);display:block;line-height:1.3}
.mx-root .cmp2-table td.fname small{display:block;margin-top:2px;font-size:12px;color:var(--color-text-tertiary)}
.mx-root .cmp2-table td.cell{text-align:center;vertical-align:middle}
.mx-root .cmp2-table td.pass,.mx-root .cmp2-table th.pass{background:color-mix(in srgb,var(--color-primary-100) 30%,#fff)}
.mx-root .cmp2-table tr.feature.alt td.pass{background:color-mix(in srgb,var(--color-primary-100) 42%,#fff)}
.mx-root .chk{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:var(--radius-pill);font-size:12px;line-height:1}
.mx-root .chk.pass{background:var(--color-cta-500);color:#fff}
.mx-root .chk.lite{background:var(--color-primary-500);color:#fff}
.mx-root .no{color:var(--color-neutral-400);font-size:16px}
.mx-root .val2{font-family:var(--font-heading);font-weight:800;font-size:14px}
.mx-root .val2.lite{color:var(--color-primary-600)}
.mx-root .val2.pass{color:var(--color-cta-600)}
@media(max-width:560px){.mx-root .cmp2-table col.c-val{width:64px}.mx-root .cmp2-table th,.mx-root .cmp2-table td{padding:10px 8px}}

.mx-root .learnmore{display:flex;flex-direction:column;gap:16px;scroll-margin-top:96px}
.mx-root .learnmore h2,.mx-root .section-title{font-family:var(--font-heading);font-size:22px;font-weight:700;color:var(--color-text-primary);text-align:center}
.mx-root .learnmore h2::after,.mx-root .section-title::after{content:"";display:block;width:48px;height:3px;margin:12px auto 0;border-radius:999px;background:var(--color-cta-500)}
/* Included-benefits section — same centered, underlined title as the upgrade section. */
.mx-root .body-shelves{display:flex;flex-direction:column;gap:16px}
.mx-root .lm-spots{display:flex;flex-direction:column;gap:72px}
.mx-root .lm-spot{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;background:var(--color-surface-card);border:1px solid var(--color-border-subtle);border-radius:var(--radius-xl);box-shadow:var(--shadow-card);padding:32px}
/* Alternating rows flip the columns (visual left, copy right) for scroll rhythm. */
.mx-root .lm-spot--rev .lm-copy{order:2}
@media(max-width:900px){.mx-root .lm-spot,.mx-root .lm-spot--rev{grid-template-columns:1fr;gap:24px}.mx-root .lm-spot--rev .lm-copy{order:0}}
.mx-root .lm-copy{display:flex;flex-direction:column;gap:18px}
/* Membership Hub benefit spot: real photo + a secondary "Learn More" CTA below. */
.mx-root .lm-photowrap{display:flex;flex-direction:column;align-self:stretch}
.mx-root .lm-photowrap .lm-photo{flex:1}
.mx-root .lm-photo{width:100%;min-height:220px;border-radius:var(--radius-lg);background:var(--color-neutral-75) center/cover no-repeat;box-shadow:var(--shadow-card)}
.mx-root .lm-eyebrow{font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--color-cta-600)}
.mx-root .lm-title{font-family:var(--font-heading);font-size:30px;font-weight:800;line-height:1.1;color:var(--color-primary-600)}
.mx-root .lm-bullets{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:18px}
.mx-root .lm-bullet{display:flex;gap:14px;align-items:flex-start}
.mx-root .lm-check{flex-shrink:0;width:26px;height:26px;border-radius:var(--radius-pill);border:1.5px solid var(--color-primary-400);color:var(--color-primary-500);display:inline-flex;align-items:center;justify-content:center;font-size:13px;margin-top:1px}
.mx-root .lm-btext{font-family:var(--font-body);font-size:15px;line-height:1.5;color:var(--color-text-secondary)}
.mx-root .lm-specialties{display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;margin-top:10px;font-size:13px;color:var(--color-text-tertiary)}
.mx-root .lm-powered{display:flex;align-items:center;gap:6px;font-family:var(--font-body);font-size:13px;color:var(--color-text-secondary);margin-top:2px}
.mx-root .lm-powered b{color:var(--rubi-500);font-weight:800}
.mx-root .lm-visual{position:relative;background:var(--color-neutral-75);border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);padding:28px 24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;overflow:hidden;min-height:320px}
.mx-root .lm-new{position:absolute;top:16px;right:16px;width:46px;height:46px;border-radius:var(--radius-pill);background:var(--color-primary-700);color:#fff;font-family:var(--font-heading);font-weight:800;font-size:11px;letter-spacing:.04em;display:grid;place-items:center;box-shadow:0 0 0 4px color-mix(in srgb,var(--color-primary-700) 18%,transparent)}
.mx-root .lm-visual-head{font-family:var(--font-heading);font-size:20px;font-weight:700;color:var(--color-primary-700)}
.mx-root .lm-visual-sub{font-family:var(--font-body);font-size:13px;line-height:1.45;color:var(--color-text-secondary);max-width:38ch}
.mx-root .lm-card{margin-top:14px;width:100%;max-width:320px;background:var(--color-surface-card);border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);box-shadow:var(--shadow-card);padding:20px;display:flex;flex-direction:column;align-items:center;gap:8px}
.mx-root .lm-card-ic{width:40px;height:40px;border-radius:var(--radius-pill);background:var(--color-cta-100);color:var(--color-cta-600);display:grid;place-items:center;font-size:18px;font-weight:800}
.mx-root .lm-card-title{font-family:var(--font-heading);font-size:16px;font-weight:700;color:var(--color-text-primary)}
.mx-root .lm-card-sub{font-family:var(--font-body);font-size:13px;line-height:1.45;color:var(--color-text-secondary)}
.mx-root .lm-card-btn{margin-top:4px;background:var(--color-cta-500);color:#fff;border:0;border-radius:var(--radius-md);font-family:var(--font-heading);font-weight:700;font-size:13px;padding:9px 18px;cursor:pointer}
.mx-root .lm-card-meta{font-family:var(--font-body);font-size:12px;color:var(--color-text-tertiary)}
/* Exam & Cert Prep — bare section (no outer card) + fanned specialty cards. */
.mx-root .lm-spot--bare{background:transparent;border:0;box-shadow:none;border-radius:0;padding:12px 0}
.mx-root .lm-fanwrap{overflow:visible;background:transparent;border:0;padding:0;min-height:0}
.mx-root .lm-fan{position:relative;width:280px;height:340px;margin:0 auto}
.mx-root .lm-fan-card{position:absolute;left:50%;top:50%;width:236px;background:var(--color-surface-card);border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);box-shadow:var(--shadow-card);padding:22px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;transition:transform .15s}
.mx-root .lm-fan-back2{transform:translate(-50%,-50%) translate(40px,-16px) rotate(7deg);opacity:.5;filter:saturate(.85);z-index:1}
.mx-root .lm-fan-back1{transform:translate(-50%,-50%) translate(20px,10px) rotate(4deg);opacity:.8;z-index:2}
.mx-root .lm-fan-front{transform:translate(-50%,-50%) translate(-16px,2px) rotate(-3deg);z-index:3;box-shadow:0 12px 34px rgba(16,24,40,.12)}
.mx-root .lm-fan-front .lm-new{top:-14px;right:-14px}
.mx-root .lm-ring{position:relative;width:132px;height:132px;margin-bottom:2px}
.mx-root .lm-ring svg{transform:rotate(-90deg)}
.mx-root .lm-ring-track{fill:none;stroke:var(--color-neutral-200);stroke-width:11}
.mx-root .lm-ring-fill{fill:none;stroke:var(--color-cta-500);stroke-width:11;stroke-linecap:round;transition:stroke-dashoffset .15s}
.mx-root .lm-ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.mx-root .lm-ring-pct{font-family:var(--font-heading);font-size:32px;font-weight:800;line-height:1;color:var(--color-primary-700)}
.mx-root .lm-ring-label{font-family:var(--font-body);font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--color-text-tertiary)}
@media(prefers-reduced-motion:reduce){.mx-root .lm-fan-card,.mx-root .lm-ring-fill{transition:none}}
/* CE Podcasts — full-width lifestyle photo band. */
.mx-root .lm-podband{position:relative;margin:0 -40px;min-height:440px;display:grid;grid-template-columns:1fr 1fr;overflow:hidden;background:var(--color-primary-800)}
.mx-root .lm-podband-media{position:relative;grid-column:1;align-self:stretch;background:50% 20%/cover no-repeat url(/brand/podcast-listener.jpg)}
.mx-root .lm-podband-media::after{content:"";position:absolute;top:0;bottom:0;right:0;width:48%;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--color-primary-800) 55%,transparent) 55%,var(--color-primary-800))}
.mx-root .lm-podband-copy{grid-column:2;align-self:center;padding:44px 40px;color:#fff}
.mx-root .lm-podband .lm-eyebrow{color:var(--color-secondary-300)}
.mx-root .lm-podband .lm-title{color:#fff}
.mx-root .lm-podband .lm-btext{color:rgb(255 255 255 / 0.92)}
.mx-root .lm-podband .lm-check{border-color:rgb(255 255 255 / 0.55);color:#fff}
@media(max-width:900px){.mx-root .lm-podband{grid-template-columns:1fr}.mx-root .lm-podband-media{grid-column:1;min-height:260px}.mx-root .lm-podband-media::after{top:auto;left:0;right:0;bottom:0;width:auto;height:42%;background:linear-gradient(180deg,transparent,var(--color-primary-800))}.mx-root .lm-podband-copy{grid-column:1;padding:28px 24px 36px}}
/* AI Career Tools — full-bleed Rubi upgrade hero with the launch cards overlapping its bottom edge. */
.mx-root .rubi-up{position:relative}
.mx-root .rubi-up-hero{position:relative;margin:0 -40px;background:var(--color-primary-800);padding:28px 40px 46px;overflow:hidden;color:#fff}
.mx-root .rubi-up-watermark{position:absolute;top:-34px;right:-28px;opacity:.16;pointer-events:none}
.mx-root .rubi-up-hero-inner{position:relative;z-index:1}
.mx-root .rubi-up-lockup{display:inline-flex;align-items:center;gap:7px;margin-bottom:14px}
.mx-root .rubi-up-headrow{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.mx-root .rubi-up-copy{max-width:60ch}
.mx-root .rubi-up-eyebrow{font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--color-secondary-300)}
.mx-root .rubi-up-title{font-family:var(--font-heading);font-size:24px;font-weight:700;line-height:1.15;color:#fff;margin:4px 0 6px}
.mx-root .rubi-up-sub{font-family:var(--font-body);font-size:14px;line-height:1.5;color:rgb(255 255 255 / 0.72);margin:0;max-width:52ch}
.mx-root .rubi-up-cta{flex-shrink:0;border:0;cursor:pointer;background:var(--color-cta-500);color:#fff;font-family:var(--font-body);font-size:14px;font-weight:800;padding:11px 22px;border-radius:var(--radius-md);white-space:nowrap}
.mx-root .rubi-up-cta:hover{background:var(--color-cta-600)}
.mx-root .rubi-up-cards{position:relative;z-index:1;margin-top:-28px}
@media(max-width:640px){.mx-root .rubi-up-hero{padding:24px 24px 44px}.mx-root .rubi-up-cta{width:100%}}
/* Resource Library — real library tile grid (2×2) replacing the lo-fi visual. */
.mx-root .rl-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mx-root .rl-tile{display:flex;flex-direction:column;background:var(--color-surface-card);border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);overflow:hidden;text-decoration:none;color:inherit;box-shadow:var(--shadow-card);transition:border-color .12s,box-shadow .12s,transform .12s}
.mx-root .rl-tile:hover{border-color:var(--color-primary-300);box-shadow:var(--shadow-card-hover,var(--shadow-md));transform:translateY(-2px)}
.mx-root .rl-cover{position:relative;height:88px;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;padding:8px}
.mx-root .rl-cover-label{font-family:var(--font-heading);font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#fff;text-align:center;text-shadow:0 1px 6px rgb(0 0 0 / 0.35)}
.mx-root .rl-body{display:flex;flex-direction:column;gap:4px;padding:10px 12px 12px}
.mx-root .rl-type{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-body);font-size:11px;font-weight:600;color:var(--color-text-secondary)}
.mx-root .rl-title{font-family:var(--font-body);font-size:13px;font-weight:700;line-height:1.25;color:var(--color-text-primary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mx-root .rl-rating{font-family:var(--font-body);font-size:11px;font-weight:600;color:var(--color-text-secondary)}
.mx-root .rl-rating span[aria-hidden]{color:var(--color-warning-500)}
@media(max-width:520px){.mx-root .rl-grid{grid-template-columns:1fr 1fr}}
`
