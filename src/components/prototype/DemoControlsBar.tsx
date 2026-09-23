import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { defaultDiscoverabilityVersionFor, isQualifyingEducationVersion } from '@/data/dashboardVersions'
import { UserSlash, Share2, BrowserWindow, Check, ChevronDown } from '@/icons'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Toast } from '@/components/ui/Toast'
import { DemoBar, DemoDropdown } from './DemoBar'
import { licensedProfessionsFor } from '@/data/licensedStatesFixtures'
import { readDemoDayOffset, setDemoDayOffset } from '@/data/demoDay'
import { useDemoMenus, DEMO_WHITE, DEMO_HOVER_FILL } from './demoBarUtil'
import {
  defaultMemberTier,
  membershipTierOptionsFor,
  supportsMembership,
  multiMembershipsFor,
  tierToneFor,
  useAccount,
  type Brand,
  type MembershipTier,
  type MembershipTierTone,
} from '@/context/AccountContext'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import {
  useFeatureFlag,
  useFeatureFlags,
  type FeatureFlagDefinition,
  type FeatureFlagState,
} from '@/context/FeatureFlagContext'
import {
  DASHBOARD_PROGRESS_PICKER,
  dashboardEducationSupported,
} from '@/data/dashboardProgressFixtures'
import { READINESS_PICKER } from '@/data/readinessFixtures'
import { railHidesSection } from '@/components/layout/dashboardRail'
import { educationTypesFor } from '@/data/onboarding/onboardingContent'
import { PROTOTYPE_SHARE_ORIGIN, copyToClipboard } from './shareLink'
import {
  DEFAULT_EDUCATION,
  DEFAULT_PROGRESS,
  personasForBrand,
  isDemoControlsEnabled,
  mergeDemoSearch,
  professionSlug,
  readDemoParams,
  resolvePersonaFlags,
  type DemoPersona,
} from './demoControlsUtil'

/**
 * Stakeholder Demo Controls bar — a friendly, always-visible front-end to the
 * SAME account/flag state the hidden UI/UX (robot) menu drives, so non-technical
 * reviewers can switch tier / professions / memberships and copy a shareable
 * deep-link without opening the robot menu.
 *
 * Laid out as a SINGLE banner row: a "Demo Controls" label + quick dropdowns
 * (Quick views · Membership · Professions · Memberships) + Reset / Copy — the
 * same click-to-open dropdown pattern the robot menu uses (white `surface-card`
 * panels of `.cre-menu-item` rows, outside-click / Escape to close).
 *
 * SCOPE GUARDRAIL — demo page only. Renders ONLY on `/dashboard-rebrand` (via
 * `isDemoControlsEnabled`) and is mounted in `AppLayout` above the shell — never
 * inside `PlatformShell` / `Header` / any production component. The hidden robot
 * menu is untouched; both coexist.
 *
 * Off (any non-`/dashboard-rebrand` route, or a locked-down production build):
 * the component returns null; no demo controls are rendered.
 *
 * State reuse (never a second source of truth):
 *   • Tier        → useAccount().tier + setTier (Elite: non-member / low = Passport
 *                   Lite / high = Passport), labels/tones from the brand tier table.
 *   • Professions → the `profession-count` flag (2+ selected ⇒ multiple, else single).
 *   • Memberships → the on/off `membership-count` flag (2+ selected ⇒ on, else off).
 *     The app has no per-membership subset selector, so the chips drive the
 *     single⇄multiple flag the rail already reads; the exact selection is the
 *     bar's own UI. TODO(demo): wire a subset override if the rail ever filters.
 */
/**
 * The Pacing control's rows.
 *
 * LABELS ARE THE CARD'S OWN, not the flag's variant values — a reviewer picks
 * "Focused & Quick" here and reads "Focused & Quick Study Pace" on the card.
 * They come from `paceBadgeLabel`'s vocabulary; if that renames again, this
 * renames with it or the bar starts describing a heading nobody sees.
 */
/** The Navigation A/B — which course-content body Resume opens. Labels are
 *  deliberately bare: a moderator reads them out and a participant must not be
 *  told which one is "the new one". */
const NAVIGATION_PICKER: { value: string; label: string }[] = [
  { value: 'option-1', label: 'Option 1' },
  { value: 'option-2', label: 'Option 2' },
]

const PACE_PRESET_PICKER: { value: string; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'focused', label: 'Focused & Quick' },
  { value: 'relaxed', label: 'Steady & Relaxed' },
]

export function DemoControlsBar({
  open = true,
  fullBleed = false,
  only,
}: {
  open?: boolean
  /** Full-bleed (Demo frame): span the whole screen width, skipping the 1440
   *  cap — used when the chrome sits outside the centered device window. */
  fullBleed?: boolean
  /**
   * SHOW ONLY THESE CONTROLS — 2026-09-23, for the moderated user-test link
   * (`?test=1`, see `PrototypeChrome`). Ids are the dropdowns' own
   * (`persona`, `progress`, `readiness`, `pacing`, `education`, `quick`,
   * `brand`) plus `actions` for the Reset + kebab block.
   *
   * ⚠ A WHITELIST, NOT A HIDE-LIST, deliberately. A participant must never see
   * a control the session did not intend, and a hide-list fails OPEN: the next
   * dropdown added to this bar would appear in every test link until someone
   * remembered to add it. This fails closed.
   *
   * Undefined ⇒ everything, which is every normal load.
   */
  only?: readonly string[]
}) {
  /** Is this control in the session's whitelist? See `only`. */
  const show = (id: string) => only == null || only.includes(id)
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { brand, membership, tier, setTier, setBrand } = useAccount()
  const { flags, definitions, setEnabled, setVariant, setSecondaryVariant, clearUrlOverrides } =
    useFeatureFlags()
  // Read current count flags so the bar can reflect reality on open (without
  // mutating anything until the reviewer interacts).
  const professionCount = useFeatureFlag('profession-count')
  // Progress / compliance state + QE·CE education type — both variant-only flags
  // the two new dropdowns drive directly (they persist via FeatureFlagContext).
  const progressState = useFeatureFlag('dashboard-progress-state')
  const paceState = useFeatureFlag('study-pace-preset')
  const navState = useFeatureFlag('dashboard-navigation')
  const educationTypeFlag = useFeatureFlag('dashboard-education-type')
  // Readiness state — the Exam Readiness section's own axis. Deliberately NOT
  // threaded into the share-link codec alongside prog/edu: those two are the
  // dashboard's headline demo axes and every shared link carries them, while
  // this one belongs to one section. Add it to `readDemoParams` if a shared
  // link ever needs to open on a specific readiness state.
  const readinessState = useFeatureFlag('readiness-state')
  // The What's New / Featured toggle was removed 2026-09-16 with its flag (see
  // the note in the Persona dropdown below). `whatsNewOn` is pinned off so the
  // persona resolver and the `?wn=` codec keep working unchanged.
  const whatsNewOn = false

  // Options come from the brand's membership fixture — never hardcoded.
  const professionOptions = useMemo(() => {
    const seen = new Set<string>()
    const out: { slug: string; label: string }[] = []
    // Professions come from the learner's MEMBERSHIP records on brands that
    // sell one. A brand with no membership still has professions — XCEL's five
    // lines of authority are the whole product — so fall back to its LICENCES,
    // which is where they live for it (`licensedStatesFixtures`, the same
    // source the Recommended for You Profession row reads). Without this the
    // dropdown is empty and every persona selects nothing.
    const source = multiMembershipsFor(brand).length
      ? multiMembershipsFor(brand).map((m) => m.profession)
      : licensedProfessionsFor(brand)
    for (const profession of source) {
      const slug = professionSlug(profession)
      if (!seen.has(slug)) {
        seen.add(slug)
        out.push({ slug, label: profession })
      }
    }
    return out
  }, [brand])

  const membershipOptions = useMemo(
    () =>
      multiMembershipsFor(brand).map((m) => ({
        id: m.id,
        label: `${m.profession} · ${m.state}`,
        profSlug: professionSlug(m.profession),
      })),
    [brand],
  )

  // Bar-local selections. Tier is global (useAccount); professions/memberships
  // drive the count flags, so their exact subset is the bar's own state.
  const [profs, setProfs] = useState<string[]>([])
  const [mems, setMems] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  // Which persona row (if any) has its nested count sub-list expanded. The
  // "Multiple learning paths" and "Multiple memberships" persona rows use this;
  // reset whenever the persona dropdown isn't the open one (see the effect below).
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null)
  const initRef = useRef(false)
  // Menu open-state + outside-click / Escape dismiss + the bar root ref, shared
  // with the Onboarding demo bar via the `useDemoMenus` primitive.
  const { openId, toggle, close, barRef } = useDemoMenus()

  // Collapse the persona count sub-list whenever the Persona dropdown closes, so
  // it re-opens flat next time.
  useEffect(() => {
    if (openId !== 'persona') setExpandedPersona(null)
  }, [openId])

  const onRebrand = isDemoControlsEnabled(pathname)

  // One-time init: restore a deep-linked view (`?tier=&prof=&mem=`), else seed
  // the selection from the current flags so the bar mirrors reality.
  useEffect(() => {
    if (!onRebrand || initRef.current) return
    initRef.current = true
    const parsed = readDemoParams(window.location.search)
    // Restore the progress + education selections independently of tier/prof/mem
    // so a `?prog=`/`?edu=`-only link doesn't disturb the profession/membership
    // flags.
    if (parsed.prog) setVariant('dashboard-progress-state', parsed.prog)
    if (parsed.edu) setVariant('dashboard-education-type', parsed.edu)
    const hasTPM = Boolean(parsed.tier || parsed.profs.length || parsed.mems.length)
    if (hasTPM) {
      if (parsed.tier) setTier(parsed.tier)
      setProfs(parsed.profs)
      setMems(parsed.mems)
      setEnabled('profession-count', true)
      setVariant('profession-count', parsed.profs.length >= 2 ? 'multiple' : 'single')
      // `membership-count` was removed from the catalog 2026-09-16 (the XCEL
      // flag audit — XCEL sells no membership, so `multiMembershipsFor` is
      // empty and this selector has nothing to select). `?mem=` is still parsed
      // and still round-trips through the bar's own state; it simply no longer
      // writes a flag.
    } else {
      // Reflect the live flags without changing them (multiple ⇒ pre-select all).
      if (professionCount.enabled && professionCount.variant === 'multiple') {
        setProfs(professionOptions.map((o) => o.slug))
      }
    }
    // Intentionally run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRebrand])

  // Push a full state to the real setters + merge the URL (replace, no history
  // spam). Never touches params other than tier/prof/mem.
  const apply = (nextTier: MembershipTier, nextProfs: string[], nextMems: string[]) => {
    setTier(nextTier)
    setProfs(nextProfs)
    setMems(nextMems)
    setEnabled('profession-count', true)
    setVariant('profession-count', nextProfs.length >= 2 ? 'multiple' : 'single')
    const next = new URLSearchParams(searchParams)
    next.set('tier', nextTier)
    if (nextProfs.length) next.set('prof', nextProfs.join(','))
    else next.delete('prof')
    if (nextMems.length) next.set('mem', nextMems.join(','))
    else next.delete('mem')
    setSearchParams(next, { replace: true })
  }

  // Write the progress + education selections into the URL (replace, preserving
  // every other param) so Share Link reproduces them. Each is written only when
  // it differs from its default, keeping a plain On-Track / CE view's URL clean.
  const writeProgEdu = (nextProg: string, nextEdu: string, nextTier?: MembershipTier) => {
    const next = new URLSearchParams(searchParams)
    if (nextProg && nextProg !== DEFAULT_PROGRESS) next.set('prog', nextProg)
    else next.delete('prog')
    if (nextEdu && nextEdu !== DEFAULT_EDUCATION) next.set('edu', nextEdu)
    else next.delete('edu')
    // When a member-only control (Progress / Education) promotes a non-member to
    // a member tier so the selection is visible, carry the tier in the URL too so
    // Share Link reproduces the member view.
    if (nextTier) next.set('tier', nextTier)
    setSearchParams(next, { replace: true })
  }

  // The compliance persona (Progress) + Education now drive the dashboard for
  // non-members too (`personaEnabled = showExtras` in MembershipOverview), so
  // picking one of these NO LONGER promotes a non-member to a member tier — a
  // reviewer can hold a non-member account and still preview an "at risk"
  // license (the upsell moment). Kept as a no-op hook so the two callsites +
  // their URL-tier threading stay unchanged.
  const ensureMemberForPersona = (): MembershipTier | undefined => undefined

  // What's New On/Off — the top-of-dropdown toggle. Since the Marketing Focused
  // band (CLP + What's New carousel) was archived (see src/data/archivedItems.ts),
  // the toggle no longer swaps the top band — the combined CLP + Jump Back In band
  // (`dashboard-clp-fullwidth`, the committed default) is always the top band now.
  // The toggle just shows/hides the standalone Featured hero (`dashboard-featured`):
  // On = hero hidden, Off = hero shown. `?wn=on` rides the URL for Share Link.

  // Progress / compliance dropdown — the 5 compliance states, current selection
  // on the trigger.
  const progressLabel =
    DASHBOARD_PROGRESS_PICKER.find((o) => o.variant === progressState.variant)?.label ?? 'Progress'

  const readinessLabel =
    READINESS_PICKER.find((o) => o.state === (readinessState.variant ?? 'on-track'))?.label ??
    'Readiness'
  /* IS THERE A READINESS SECTION TO DRIVE? — 2026-09-22. Both pacing versions
     drop the Readiness rail row (`TESTING_HIDDEN_RAIL_SECTIONS`), and Testing
     is now the brand default — so the bar's own default state was a pill
     reading "READINESS: On Track" over a dashboard with no Readiness on it and
     no way to reach one.

     ASKED OF THE RAIL, not re-listed here. `railHidesSection` derives from the
     same constant the rail and the phone drawer read, so the day the row comes
     back (or a Readiness component lands on the pacing versions) this control
     re-enables itself — no second edit, and no chance of the bar and the rail
     disagreeing about what the page has on it. It stays LIVE on QE Focused,
     Learner Focused and Marketing Focused, where the section is a rail click
     away and the dropdown does exactly what it says. */
  const readinessReachable = !railHidesSection(
    searchParams.get('version') ?? defaultDiscoverabilityVersionFor(brand),
    'readiness',
  )

  // Education (QE/CE) dropdown — only for brands with a QE dashboard persona
  // (CRE · McKissock · STC); brand-true labels ("Pre-Licensing" / "Qualifying
  // Ed" / "Exam Prep" vs "Continuing Ed").
  const showEducation = dashboardEducationSupported(brand)
  // QE Focused drops Continuing Ed from the list. That version resolves to a
  // QUALIFYING journey by definition (see `MembershipOverview`), so leaving the
  // CE row here would be a dropdown entry that changes nothing when clicked —
  // the defect the flag audit spent a pass removing. The two qualifying
  // journeys (Qualifying Ed / Exam Prep) still switch.
  // Shared with `MembershipOverview` via `isQualifyingEducationVersion` rather
  // than compared to an id here: this was a hardcoded
  // `=== 'discoverability-qe-focused'`, and the Testing version — which
  // inherits the page's QE resolution — silently fell out of it, leaving the
  // bar offering and displaying "Continuing Ed" over a pre-licensing path.
  const qeFocusedVersion = isQualifyingEducationVersion(
    searchParams.get('version') ?? defaultDiscoverabilityVersionFor(brand),
  )
  const educationOptions = educationTypesFor(brand).filter(
    (o) => !qeFocusedVersion || o.type !== 'ce',
  )
  // The label has to reflect what the PAGE resolved, not the raw flag: on QE
  // Focused a stored `ce` renders as Qualifying Ed, and a bar reading
  // "Continuing Ed" over a pre-licensing path is worse than no label.
  const effectiveEducation = qeFocusedVersion
    ? educationTypeFlag.variant === 'exam-prep'
      ? 'exam-prep'
      : 'qe'
    : (educationTypeFlag.variant ?? 'ce')
  const educationLabel =
    educationOptions.find((o) => o.type === effectiveEducation)?.label ?? 'Education'

  // Brand dropdown — switches the whole prototype brand live (relights tokens +
  // per-brand fixtures/personas). Not threaded into the share-link codec: the
  // Dashboard Rebrand page code-seeds Elite once on entry, so a `?brand=` link
  // would be overridden on load; the switch is an in-session demo control.
  const brandLabel = DEMO_BRANDS.find((b) => b.brand === brand)?.label ?? 'Brand'
  const pickBrand = (b: Brand) => {
    setBrand(b)
    // Keep the Education control coherent — not every brand supports QE, so reset
    // to CE (and drop ?edu=) on a brand switch.
    setVariant('dashboard-education-type', DEFAULT_EDUCATION)
    writeProgEdu(progressState.variant ?? DEFAULT_PROGRESS, DEFAULT_EDUCATION)
    close()
  }

  // Quick views = the ACTIVE BRAND's membership tiers (Non-Member + each member
  // tier), so CRE shows Non-Member / Plus / Pro / Premier, Elite shows
  // Non-Member / Passport Lite / Passport, STC shows Non-Member / Member, etc.
  // Picking one switches only the membership tier, preserving the current
  // professions/memberships (the Persona control owns the scenario shape).
  // A brand with no membership has no tiers to switch between — the whole
  // dropdown is dropped rather than shown with a single dead option. (The
  // Progress + Education dropdowns stay: they are learning state, not
  // membership state, and their `ensureMemberForPersona()` promotion is a
  // no-op here because such a brand is never a non-member.)
  const showTierSwitch = supportsMembership(brand)
  // Persona rows a brand can actually demonstrate — drops the
  // membership-count one for a brand with no membership.
  const brandPersonas = useMemo(() => personasForBrand(brand), [brand])
  const quickViews = useMemo(() => membershipTierOptionsFor(brand), [brand])
  const activeQuickView = quickViews.find((v) => v.tier === tier)
  const applyQuickView = (t: MembershipTier) => {
    apply(t, profs, mems)
    close()
  }

  // Persona = a Quick view (tier + professions/memberships) PLUS a set of
  // feature-flag overrides, applied in one click. `apply` seats the tier + count
  // flags + URL; the flag loop then applies the managed-flag baseline merged with
  // the persona's overrides (so the persona lands on a deterministic state).
  const applyPersona = (persona: DemoPersona, countVariant?: string, dayOffset?: number) => {
    // Resolve the persona's scope against THIS brand's options rather than a
    // hardcoded slug list — `primary` takes the first, `all` takes every one.
    const personaProfs =
      persona.profScope === 'all'
        ? professionOptions.map((o) => o.slug)
        : professionOptions.slice(0, 1).map((o) => o.slug)
    const memIds =
      persona.profScope === 'all'
        ? membershipOptions.map((o) => o.id)
        : membershipOptions.slice(0, 1).map((o) => o.id)
    // Apply state (preserve the CURRENT tier — a persona sets the learning/
    // dashboard shape, not membership). `apply` also writes tier/prof/mem to the
    // URL, but the consolidated write below wins so prog + version land with them.
    apply(tier, personaProfs, memIds)
    const resolved = resolvePersonaFlags(persona, whatsNewOn)
    for (const op of resolved) {
      // A persona with a nested count picker passes the chosen variant here — it
      // overrides the managed baseline for that persona's count flag: the
      // Multiple learning paths row drives `learning-paths-count`, the Multiple
      // memberships row drives `membership-count`, so the count comes from the
      // sub-menu selection.
      let variant = op.variant
      if (countVariant) {
        if (persona.pathCountOptions && op.key === 'learning-paths-count') variant = countVariant
      }
      if (op.enabled !== undefined) setEnabled(op.key, op.enabled)
      if (variant !== undefined) setVariant(op.key, variant)
      if (op.secondaryVariant !== undefined) setSecondaryVariant(op.key, op.secondaryVariant)
    }
    // One consolidated URL write — tier/prof/mem + prog/edu (+ version when the
    // persona forces one), preserving the shell's other params.
    const prog = resolved.find((o) => o.key === 'dashboard-progress-state')?.variant ?? DEFAULT_PROGRESS
    // Prefer a persona's own education-type override (e.g. the QE multi-category
    // persona) so the share-link URL reflects it.
    const edu =
      resolved.find((o) => o.key === 'dashboard-education-type')?.variant ??
      educationTypeFlag.variant ??
      DEFAULT_EDUCATION
    const next = new URLSearchParams(searchParams)
    next.set('tier', tier)
    if (personaProfs.length) next.set('prof', personaProfs.join(','))
    else next.delete('prof')
    if (memIds.length) next.set('mem', memIds.join(','))
    else next.delete('mem')
    if (prog && prog !== DEFAULT_PROGRESS) next.set('prog', prog)
    else next.delete('prog')
    if (edu && edu !== DEFAULT_EDUCATION) next.set('edu', edu)
    else next.delete('edu')
    // What's New toggle rides along in `?wn=` (On = Featured hero hidden; see
    // applyWhatsNew). It no longer pins a dashboard version — the Marketing
    // Focused carousel band it used to surface was archived, so the persona's
    // own `version` (if any) always wins.
    if (whatsNewOn) next.set('wn', 'on')
    else next.delete('wn')
    if (persona.version) next.set('version', persona.version)
    else next.delete('version')
    setSearchParams(next, { replace: true })
    close()
    /* THE CLOCK LAST, AND IT RELOADS — so it has to come after the URL write,
       which would otherwise never run.

       `FIXTURE_TODAY` is evaluated once at module load and read by ~30 call
       sites, several of them plain data modules with no React context to
       subscribe to. Reloading is what makes the header countdown, the study
       calendar and the pace card all agree it is Thursday, rather than the card
       moving alone — the cross-surface disagreement this repo treats as a
       defect. See `demoDay.ts`.

       A persona with NO `dayOffset` clears the shift rather than inheriting the
       last one: a clock that persisted across persona changes would be a hidden
       fifth variable on a bar that shows four. And it only reloads when the day
       actually changes, so picking a persona at the anchor stays instant. */
    const nextOffset = dayOffset ?? 0
    if (nextOffset !== readDemoDayOffset()) setDemoDayOffset(nextOffset)
  }

  // The full captured demo state as URL params. Brand + membership live in
  // localStorage (not the URL), so `mergeDemoSearch` alone would drop them and
  // the link would fall back to the rebrand's default Elite seed — capture them
  // explicitly here so a shared link reproduces the exact brand/tier for ANY
  // viewer. `?tier=` (+ the invisible/visible DemoControlsBar init) restores the
  // specific member tier on top of the seeded membership.
  const shareParams = () => {
    const p = new URLSearchParams(
      mergeDemoSearch(
        window.location.search,
        tier,
        profs,
        mems,
        progressState.variant ?? DEFAULT_PROGRESS,
        educationTypeFlag.variant ?? DEFAULT_EDUCATION,
        whatsNewOn,
      ),
    )
    p.set('brand', brand)
    p.set('membership', membership)
    // Bake EVERY non-default panel flag the reviewer set (card styles, band
    // backgrounds, layout variants, the upsell sheet…) into `?ff=` so a shared
    // link reproduces the exact widget configuration — not just the account
    // params. `?ff=` is read-only on the recipient, so it never mutates their
    // saved sandbox. Flags already carried by dedicated demo params
    // (prog/edu/prof/mem) are skipped to avoid double-encoding. Preserves any
    // `ff` tokens already on the URL + dedupes by key.
    for (const def of definitions) {
      if (FF_CAPTURE_EXCLUDE.has(def.key)) continue
      const token = encodeFlagToken(def, flags[def.key])
      if (token) putFfToken(p, def.key, token)
    }
    return p
  }

  const copyLink = () => {
    const url = `${PROTOTYPE_SHARE_ORIGIN}${window.location.pathname}?${shareParams().toString()}`
    copyToClipboard(url)
      .then(() => setCopied(true))
      .catch(() => window.prompt('Copy this link:', url))
    close()
  }

  // Share Demo — the same captured view + demo state as Share Link, plus
  // `?present=1`: the recipient opens straight into the Demo frame (app in a
  // browser window on the dark stage) with NO prototype bar and NO demo
  // controls — a clean, presentation-ready screen. (present drives the frame in
  // DeviceFrameContext + hides the chrome in PrototypeChrome, which still mounts
  // the DemoControlsBar invisibly so the captured state applies.)
  const copyDemoLink = () => {
    const params = shareParams()
    params.set('present', '1')
    const url = `${PROTOTYPE_SHARE_ORIGIN}${window.location.pathname}?${params.toString()}`
    copyToClipboard(url)
      .then(() => setCopied(true))
      .catch(() => window.prompt('Copy this link:', url))
    close()
  }

  // Off-state: render nothing on any other route, or when the PrototypeBar's
  // "Demo" toggle has hidden the banner (all hooks above have run).
  if (!onRebrand || !open) return null

  return (
    <>
      <DemoBar barRef={barRef} ariaLabel="Demo controls" align="left" fullBleed={fullBleed}>
        {/* Brand — switch the whole prototype brand live. Hidden while this repo
            ships a single brand; see BRAND_PICKER. */}
        {BRAND_PICKER && (
        <DemoDropdown
          id="brand"
          hidden={!show('brand')}
          label={brandLabel}
          eyebrow="Brand"
          openId={openId}
          onToggle={toggle}
          panelRole="radiogroup"
          panelLabel="Brand"
          panelMinWidth={220}
        >
          {DEMO_BRANDS.map((b) => {
            const active = b.brand === brand
            return (
              <button
                key={b.brand}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={`cre-menu-item cre-demo-controls-btn${active ? ' is-active' : ''}`}
                onClick={() => pickBrand(b.brand)}
              >
                <span style={{ flex: 1 }}>{b.label}</span>
                {active && <Check size={15} aria-hidden />}
              </button>
            )
          })}
        </DemoDropdown>
        )}

        {/* Quick views — the active brand's membership tiers (Non-Member + each
            member tier). The trigger shows the current tier so the closed pill
            reads e.g. "Quick view: Premier". Radiogroup: one tier is always
            in effect. */}
        {showTierSwitch && (
        <DemoDropdown
          id="quick"
          hidden={!show('quick')}
          label={activeQuickView ? activeQuickView.label : 'Quick views'}
          eyebrow={activeQuickView ? 'Quick view' : undefined}
          openId={openId}
          onToggle={toggle}
          panelRole="radiogroup"
          panelLabel="Membership tier"
          panelMinWidth={240}
        >
          {quickViews.map((opt) => {
            const active = opt.tier === tier
            return (
              <button
                key={opt.tier}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={`cre-menu-item cre-demo-controls-btn${active ? ' is-active' : ''}`}
                onClick={() => applyQuickView(opt.tier)}
              >
                <span style={{ flex: 1 }}>{opt.tier === 'non-member' ? 'Non-member' : opt.label}</span>
                <TierChip brand={brand} tier={opt.tier} />
                {active && <Check size={15} aria-hidden />}
              </button>
            )
          })}
        </DemoDropdown>
        )}

        {/* Persona — the learning/dashboard SCENARIO, layered on top of the
            membership tier set by Quick views (a persona does NOT change tier).
            Sits alongside Quick views; doesn't replace it. */}
        <DemoDropdown
          id="persona"
          hidden={!show('persona')}
          label="Persona"
          eyebrow="Persona"
          openId={openId}
          onToggle={toggle}
          panelLabel="User personas"
          panelMinWidth={420}
        >
          {/* The "Hide Featured Section" toggle was removed 2026-09-16 with the
              `dashboard-featured` flag it wrote (the XCEL flag audit).
              `whatsNewFeaturedFor('xcel')` is an empty fixture, so the Featured
              hero never renders here and the switch showed / hid nothing.
              `FeaturedHero` and `resolvePersonaFlags`' whatsNewOn arm are kept —
              author XCEL slides and re-add this row to bring it back. */}
          <div aria-hidden style={WN_DIVIDER} />
          {brandPersonas.map((persona, i) => {
            const countOptions = persona.pathCountOptions ?? persona.memCountOptions
            /* THREE KINDS OF EXPANDER NOW. `dayOptions` is the demo clock's —
               it carries an offset rather than a flag variant, which is why it
               is a third shape beside the two count lists rather than another
               entry in them. */
            const dayOptions = persona.dayOptions
            const isExpander = !!countOptions?.length || !!dayOptions?.length
            const expanded = expandedPersona === persona.id
            // No persona rows are disabled by the What's New toggle anymore. That
            // gate existed only because the (now-archived) Marketing Focused
            // carousel had no room in the full-takeover views; the toggle now just
            // shows/hides the Featured hero, which never conflicts with a persona.
            // (`persona.disabledWhenWhatsNewOn` is retained but inert.)
            /* …but a persona CAN be withheld because the state it applies has no
               agreed design yet (`unavailable`). Both doors to
               `dashboard-progress-state` — this list and the Progress dropdown —
               have to agree, or greying one just moves the click. */
            const disabled = persona.unavailable != null
            return (
              <div key={persona.id}>
                <button
                  type="button"
                  role="menuitem"
                  aria-haspopup={isExpander ? 'menu' : undefined}
                  aria-expanded={isExpander ? expanded : undefined}
                  aria-disabled={disabled || undefined}
                  disabled={disabled}
                  title={persona.unavailable}
                  className="cre-menu-item cre-demo-controls-btn"
                  onClick={() =>
                    disabled
                      ? undefined
                      : isExpander
                        ? setExpandedPersona(expanded ? null : persona.id)
                        : applyPersona(persona)
                  }
                  style={{ alignItems: 'flex-start', opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                >
                  <span aria-hidden style={NUM_BADGE}>{i + 1}</span>
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                    <span style={{ fontWeight: 700 }}>
                      {persona.label}
                      {disabled && (
                        <span style={{ fontWeight: 600, opacity: 0.8 }}> · not designed yet</span>
                      )}
                    </span>
                    {/* The REASON replaces the description on a withheld row.
                        The description sells a state the reviewer cannot open;
                        what they need instead is why not. */}
                    <span style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.3 }}>
                      {persona.unavailable ?? persona.description}
                    </span>
                  </span>
                  {isExpander && (
                    <ChevronDown
                      size={14}
                      aria-hidden
                      style={{ marginTop: 3, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
                    />
                  )}
                </button>
                {isExpander && expanded && (
                  <div
                    role="menu"
                    aria-label={
                      dayOptions
                        ? 'Day of the week'
                        : persona.memCountOptions
                          ? 'Number of memberships'
                          : 'Number of learning paths'
                    }
                    style={SUBMENU}
                  >
                    {dayOptions
                      ? dayOptions.map((opt) => (
                          <button
                            key={opt.dayOffset}
                            type="button"
                            role="menuitem"
                            className="cre-menu-item cre-demo-controls-btn"
                            onClick={() => applyPersona(persona, undefined, opt.dayOffset)}
                          >
                            <span style={{ flex: 1 }}>{opt.label}</span>
                          </button>
                        ))
                      : countOptions!.map((opt) => (
                          <button
                            key={opt.countVariant}
                            type="button"
                            role="menuitem"
                            className="cre-menu-item cre-demo-controls-btn"
                            onClick={() => applyPersona(persona, opt.countVariant)}
                          >
                            <span style={{ flex: 1 }}>{opt.label}</span>
                          </button>
                        ))}
                  </div>
                )}
              </div>
            )
          })}
        </DemoDropdown>

        {/* Professions + Memberships dropdowns were removed — the "Multiple
            learning paths" persona above sets `profession-count`, `state-count`,
            and `learning-paths-count` to multiple (via `apply` + its flag
            overrides), so the multi-license demo no longer needs the per-item
            multi-selects. */}

        {/* Progress / compliance state — single-select radiogroup */}
        <DemoDropdown
          id="progress"
          hidden={!show('progress')}
          label={progressLabel}
          eyebrow="Progress"
          openId={openId}
          onToggle={toggle}
          panelRole="radiogroup"
          panelLabel="Progress / compliance state"
          panelMinWidth={240}
        >
          {DASHBOARD_PROGRESS_PICKER.map((opt) => {
            const active = opt.variant === progressState.variant
            /* A STATE THE DESIGN HAS NOT ANSWERED YET — 2026-09-22, Expired.
               The flag and the fixtures both resolve it, so picking it renders
               SOMETHING; what it renders is just not a screen anyone has agreed
               on. Offering it unmarked invites a stakeholder to read an
               unreviewed page as the proposal. See `unavailable` on
               `ProgressPickerOption` for why the row is greyed rather than cut. */
            const unavailable = opt.unavailable
            return (
              <button
                key={opt.variant}
                type="button"
                role="radio"
                aria-checked={active}
                /* `aria-disabled`, NOT `disabled` — the same call the pace
                   sheet's unpickable row documents. A disabled button drops out
                   of the tab order and out of most screen-reader element lists,
                   so the one row that most needs to explain itself becomes the
                   one that cannot be reached to hear the explanation. The click
                   is refused in the handler instead. */
                aria-disabled={unavailable ? true : undefined}
                aria-describedby={unavailable ? `${opt.variant}-why` : undefined}
                tabIndex={active ? 0 : -1}
                title={unavailable}
                style={
                  unavailable
                    ? { opacity: 0.45, cursor: 'not-allowed', alignItems: 'flex-start' }
                    : undefined
                }
                className={`cre-menu-item cre-demo-controls-btn${active ? ' is-active' : ''}`}
                onClick={() => {
                  if (unavailable) return
                  setVariant('dashboard-progress-state', opt.variant)
                  const promotedTier = ensureMemberForPersona()
                  writeProgEdu(
                    opt.variant,
                    educationTypeFlag.variant ?? DEFAULT_EDUCATION,
                    promotedTier,
                  )
                  close()
                }}
              >
                <span style={{ flex: 1 }}>
                  {opt.label}
                  {unavailable && (
                    /* The reason IN THE ROW, not only on `title`: a tooltip is
                       mouse-only, and "why is this greyed out" is the whole
                       question the row has to answer. */
                    <span
                      id={`${opt.variant}-why`}
                      style={{ display: 'block', fontSize: 11, fontWeight: 500, opacity: 0.85 }}
                    >
                      Not designed yet
                    </span>
                  )}
                </span>
                {/* STILL CHECKED WHEN ACTIVE, withheld or not. The row is
                    unpickable, but the flag is still reachable by `?ff=` and the
                    Feature Flag panel — and a bar that hid the tick would be
                    misreporting the state the page is actually in. */}
                {active && <Check size={15} aria-hidden />}
              </button>
            )
          })}
        </DemoDropdown>

        {/* Readiness state — single-select radiogroup. Drives the Exam Readiness
            section only; it does not touch the dashboard's own progress axis,
            which is a different question (how far through the COURSE you are,
            not how ready for the exam). A learner can be 90% through and not
            ready, which is the whole reason the section exists. */}
        <DemoDropdown
          id="readiness"
          hidden={!show('readiness')}
          /* NOT the resolved state when there is no section: a greyed pill
             still reading "On Track" is the same false claim, just dimmer. */
          label={readinessReachable ? readinessLabel : 'Not on this version'}
          eyebrow="Readiness"
          openId={openId}
          onToggle={toggle}
          panelRole="radiogroup"
          panelLabel="Readiness state"
          panelMinWidth={240}
          disabledNote={
            readinessReachable
              ? undefined
              : 'This version hides the Readiness section, so there is nothing for this control to change. Switch to QE Focused, Learner Focused or Marketing Focused to use it.'
          }
        >
          {READINESS_PICKER.map((opt) => {
            const active = opt.state === (readinessState.variant ?? 'on-track')
            return (
              <button
                key={opt.state}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={`cre-menu-item cre-demo-controls-btn${active ? ' is-active' : ''}`}
                onClick={() => {
                  setVariant('readiness-state', opt.state)
                  close()
                }}
              >
                <span style={{ flex: 1 }}>{opt.label}</span>
                {active && <Check size={15} aria-hidden />}
              </button>
            )
          })}
        </DemoDropdown>

        {/* PACING — which of the model's three presets the Study Pace card opens
            on. 2026-09-23, the direct ask: a control that shows "the differences
            between the Recommended, Focused & Quick, and Steady & Relaxed".

            ITS OWN AXIS, beside Progress rather than inside it. Progress says
            how far through the course the learner is; this says which plan they
            are working to. The two combine — Focused & Quick at 3 days is still
            a plan that will not fit — and folding either into the other would
            lose half the grid a reviewer is here to walk. */}
        <DemoDropdown
          id="pacing"
          hidden={!show('pacing')}
          label={PACE_PRESET_PICKER.find((o) => o.value === (paceState.variant ?? 'recommended'))?.label ?? 'Recommended'}
          eyebrow="Pacing"
          openId={openId}
          onToggle={toggle}
          panelRole="radiogroup"
          panelLabel="Study pace preset"
          panelMinWidth={240}
        >
          {PACE_PRESET_PICKER.map((opt) => {
            const active = opt.value === (paceState.variant ?? 'recommended')
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={`cre-menu-item cre-demo-controls-btn${active ? ' is-active' : ''}`}
                onClick={() => {
                  setVariant('study-pace-preset', opt.value)
                  close()
                }}
              >
                <span style={{ flex: 1 }}>{opt.label}</span>
                {active && <Check size={15} aria-hidden />}
              </button>
            )
          })}
        </DemoDropdown>

        {/* NAVIGATION — which course-content page Resume opens. 2026-09-23.

            ⚠ IT IS AN A/B, NOT A TREATMENT PICKER, which is why it defaults to
            Option 1 on this branch rather than to the newer arm: the control
            condition has to be the default or the comparison has no baseline.
            A moderator normally assigns it per participant from the session
            link (`?ff=dashboard-navigation:option-2`) rather than switching it
            here mid-task.

            NOT IN `?test=1`'s whitelist, deliberately — a participant who spots
            a control labelled "Option 1 / Option 2" has been told there is a
            comparison, which is most of what the session is trying not to say.
            See `TEST_VIEW_CONTROLS` in `PrototypeChrome`. */}
        <DemoDropdown
          id="navigation"
          hidden={!show('navigation')}
          label={
            NAVIGATION_PICKER.find((o) => o.value === (navState.variant ?? 'option-1'))?.label ??
            'Option 1'
          }
          eyebrow="Navigation"
          openId={openId}
          onToggle={toggle}
          panelRole="radiogroup"
          panelLabel="Navigation version"
          panelMinWidth={240}
        >
          {NAVIGATION_PICKER.map((opt) => {
            const active = opt.value === (navState.variant ?? 'option-1')
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={`cre-menu-item cre-demo-controls-btn${active ? ' is-active' : ''}`}
                onClick={() => {
                  setVariant('dashboard-navigation', opt.value)
                  close()
                }}
              >
                <span style={{ flex: 1 }}>{opt.label}</span>
                {active && <Check size={15} aria-hidden />}
              </button>
            )
          })}
        </DemoDropdown>

        {/* Education type (QE / CE) — single-select radiogroup, brands with a QE
            dashboard persona only */}
        {showEducation && (
          <DemoDropdown
            id="education"
            hidden={!show('education')}
            label={educationLabel}
            eyebrow="Education"
            openId={openId}
            onToggle={toggle}
            panelRole="radiogroup"
            panelLabel="Education type"
            panelMinWidth={240}
          >
            {educationOptions.map((opt) => {
              const active = opt.type === effectiveEducation
              return (
                <button
                  key={opt.type}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  className={`cre-menu-item cre-demo-controls-btn${active ? ' is-active' : ''}`}
                  onClick={() => {
                    setVariant('dashboard-education-type', opt.type)
                    const promotedTier = ensureMemberForPersona()
                    writeProgEdu(progressState.variant ?? DEFAULT_PROGRESS, opt.type, promotedTier)
                    close()
                  }}
                >
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  {active && <Check size={15} aria-hidden />}
                </button>
              )
            })}
          </DemoDropdown>
        )}

        {/* Actions — Reset + the kebab. Gated like the dropdowns: a participant
            pressing Reset mid-session would silently re-baseline the demo. */}
        {show('actions') && (
        <div style={ACTIONS}>
          <button
            type="button"
            className="cre-demo-controls-btn"
            style={GHOST_BTN}
            onClick={() => {
              // Full reset in ONE URL write (avoids a second setSearchParams
              // clobbering the first from stale state): tier → the brand's default
              // member tier (the Demo's baseline — Elite · Passport Lite; NOT
              // non-member, which would strand the member-only Progress /
              // Education / persona controls in a silent no-op state — a non-member can
              // still be reached via the "New non-member" Quick view), clear
              // professions/memberships + prog/edu, restore the flag defaults.
              const resetTier = defaultMemberTier(brand)
              setTier(resetTier)
              setProfs([])
              setMems([])
              setEnabled('profession-count', true)
              setVariant('profession-count', 'single')
              setVariant('dashboard-progress-state', DEFAULT_PROGRESS)
              setVariant('dashboard-education-type', DEFAULT_EDUCATION)
              // (dashboard-clp-layout removed 2026-08-17 — V1 is baked in.)
              // What's New back to Off (the combined band restored).
              setEnabled('dashboard-clp-fullwidth', true)
              setVariant('dashboard-clp-fullwidth', 'variant-d')
              setSecondaryVariant('dashboard-clp-fullwidth', 'always')
              const next = new URLSearchParams(searchParams)
              next.set('tier', resetTier)
              next.delete('prof')
              next.delete('mem')
              next.delete('prog')
              next.delete('edu')
              next.delete('wn')
              next.delete('version')
              // Clear the read-only `?ff=` flag override too — otherwise a shared
              // link's pinned flags (e.g. membership-count:five) keep winning over
              // the flags Reset just restored, so Reset would appear to do nothing.
              // Both halves are needed: remove it from the URL AND drop the
              // already-seeded override in the flag store (it was read once at page
              // load, so a URL edit alone wouldn't take effect until a reload).
              next.delete('ff')
              clearUrlOverrides()
              setSearchParams(next, { replace: true })
              close()
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = DEMO_HOVER_FILL)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Reset
          </button>
          <ActionMenu
            label="Demo actions"
            items={[
              {
                id: 'share',
                label: 'Share Link',
                icon: <Share2 size={15} aria-hidden />,
                onSelect: copyLink,
              },
              {
                id: 'share-demo',
                label: 'Share Demo',
                icon: <BrowserWindow size={15} aria-hidden />,
                onSelect: copyDemoLink,
              },
            ]}
          />
        </div>
        )}
      </DemoBar>

      <Toast
        open={copied}
        onClose={() => setCopied(false)}
        tone="success"
        title="Link copied"
        duration={1900}
      >
        Send it to show this exact view.
      </Toast>
    </>
  )
}

/** Flags whose full state is already carried by a dedicated demo param, so the
 *  `?ff=` capture skips them to avoid double-encoding: progress → `?prog=`,
 *  education → `?edu=`, professions → `?prof=`, memberships → `?mem=`. */
const FF_CAPTURE_EXCLUDE = new Set<string>([
  'dashboard-progress-state',
  'dashboard-education-type',
  'profession-count',
])

/** Encode a flag's CURRENT state as an `?ff=` token, or null when it matches the
 *  catalog default (a default view keeps a clean URL). Grammar matches
 *  `readUrlFlagOverrides`: `key:off` (disabled), `key:on` (enabled from a
 *  default-off flag), `key:variant`, or `key:variant:secondaryVariant` (both
 *  axes — e.g. the Recommended band's background + card style). */
function encodeFlagToken(def: FeatureFlagDefinition, state?: FeatureFlagState): string | null {
  if (!state) return null
  // Disabled: only meaningful when the flag defaults ON (a toggled-off widget).
  if (!state.enabled) return def.defaultEnabled ? `${def.key}:off` : null
  const variantDiff = state.variant !== undefined && state.variant !== def.defaultVariant
  const secondaryDiff =
    state.secondaryVariant !== undefined && state.secondaryVariant !== def.defaultSecondaryVariant
  if (!variantDiff && !secondaryDiff) {
    // Enabled + both axes at default → only worth a token if the flag defaults
    // OFF (i.e. the reviewer turned it on).
    return def.defaultEnabled === false ? `${def.key}:on` : null
  }
  // Carry the current variant (anchoring the secondary segment when present).
  const v = state.variant ?? def.defaultVariant ?? 'on'
  return secondaryDiff ? `${def.key}:${v}:${state.secondaryVariant}` : `${def.key}:${v}`
}

/** Set/replace the `?ff=` token for a key on `p`, preserving every other token
 *  and deduping by key so a flag never appears twice. `token` includes the key
 *  prefix (e.g. `dashboard-whats-new-layout:grid-2x2:primary-800`). */
function putFfToken(p: URLSearchParams, key: string, token: string) {
  const tokens = (p.get('ff') ?? '').split(',').filter(Boolean).filter((t) => t.split(':')[0] !== key)
  tokens.push(token)
  p.set('ff', tokens.join(','))
}

/** The prototype brands for the Brand dropdown. One, now that this repo ships
 *  XCEL alone. Labels mirror the Onboarding demo bar. NOT type-checked against
 *  `Brand` being exhaustive — a new brand must be added here by hand. */
const DEMO_BRANDS: { brand: Brand; label: string }[] = [
  { brand: 'xcel', label: 'XCEL (Insurance)' },
]

/** Whether to render the Brand dropdown. Suppressed at one brand: a dropdown
 *  whose menu holds a single item invites the reviewer to open it looking for
 *  the others. Returns automatically if `Brand` ever widens. */
const BRAND_PICKER = DEMO_BRANDS.length > 1

/** Tier chip shown on a quick-view row — pairs the tier tone COLOR with a GLYPH
 *  + the BRAND-CORRECT tier LABEL (Plus / Pro / Premier · Passport Lite /
 *  Passport · Member · Non-member), never color alone. */
function TierChip({ brand, tier }: { brand: Brand; tier: MembershipTier }) {
  if (tier === 'non-member') {
    return (
      <span style={{ ...TIER_CHIP, background: 'var(--color-neutral-75)', color: 'var(--color-neutral-600)' }}>
        <UserSlash size={11} aria-hidden />
        Non-member
      </span>
    )
  }
  const tone: MembershipTierTone = tierToneFor(brand, tier)
  const Icon = tierBadgeIcon(tone)
  const { bg, fg } = TIER_CHIP_TONE[tone] ?? TIER_CHIP_TONE.primary
  const shortLabel = membershipTierOptionsFor(brand).find((o) => o.tier === tier)?.shortLabel ?? 'Member'
  return (
    <span style={{ ...TIER_CHIP, background: bg, color: fg }}>
      <Icon size={11} aria-hidden />
      {shortLabel}
    </span>
  )
}

/** Tier tone → chip fill/text. The glyph comes from `tierBadgeIcon` (Bolt / Gem
 *  / Crown), so the chip reads on-brand for any brand's tier set. */
const TIER_CHIP_TONE: Record<string, { bg: string; fg: string }> = {
  primary: { bg: 'var(--color-primary-100)', fg: 'var(--color-primary-700)' },
  tertiary: { bg: 'var(--color-tertiary-100)', fg: 'var(--color-tertiary-700)' },
  warning: { bg: 'var(--color-warning-200)', fg: 'var(--color-warning-700)' },
  secondary: { bg: 'var(--color-secondary-100)', fg: 'var(--color-secondary-700)' },
}

/* ─── styles — bar shell / dropdown / panel come from `demoBarUtil`; only the
   DemoControlsBar-specific chrome (tier chip + actions) lives here. ─────────── */

// Nested count sub-list under the "Multiple learning paths" persona row — inset
// + a faint left rule so it reads as a child of the row above it.
const SUBMENU: CSSProperties = {
  margin: '2px 0 4px 30px',
  paddingLeft: 8,
  borderLeft: '2px solid var(--color-secondary-100)',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

// The Persona dropdown's "Hide Featured Section" switch was removed 2026-09-16
// with the `dashboard-featured` flag (the XCEL flag audit) — its WN_TOGGLE_ROW /
// WN_SWITCH / WN_SWITCH_LABEL / WN_SWITCH_KNOB styles went with it, since an
// unused const does not compile here. WN_DIVIDER stays: it still separates the
// persona rows.
const WN_DIVIDER: CSSProperties = {
  height: 1,
  margin: '2px 8px 4px',
  background: 'var(--color-border-subtle)',
}




const NUM_BADGE: CSSProperties = {
  flexShrink: 0,
  width: 20,
  height: 20,
  marginTop: 1,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1,
  background: 'var(--color-secondary-100)',
  color: 'var(--color-secondary-700)',
}

const TIER_CHIP: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  padding: '1px 7px',
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  flexShrink: 0,
}

const ACTIONS: CSSProperties = {
  marginLeft: 'auto',
  display: 'flex',
  gap: 8,
}

const GHOST_BTN: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  background: 'transparent',
  border: '1px solid rgb(255 255 255 / 0.3)',
  color: DEMO_WHITE,
  transition: 'background .15s',
}
