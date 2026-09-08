import type { CSSProperties } from 'react'
import { ArrowRight } from '@/icons'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import { useAccount, type MembershipTierTone } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import type { MembershipRow } from '@/data/membership/membershipScorecardFixtures'
import {
  renewalFallbackFor,
  renewalStateFor,
  type MembershipRenewalState,
  type MembershipRenewalStateId,
} from './membershipRenewalState'
import { RenewalStateIcon } from './renewalStatePresentation'
import {
  renewalIconColor,
  renewalLeadTone,
  renewalPillStyle,
} from './renewalStateStyles'

/** The card takes its color from the learner's *selected* membership tier
 *  (`useAccount().tierTone`), so a Passport Lite reads navy (primary), a
 *  Passport reads gold (warning), a mid tier reads teal (tertiary) — matching
 *  the tier badge on the card. */
const TONE_GRADIENT: Record<MembershipTierTone, string> = {
  primary: 'linear-gradient(145deg, var(--color-primary-700), var(--color-primary-900))',
  tertiary: 'linear-gradient(145deg, var(--color-tertiary-700), var(--color-tertiary-900))',
  warning: 'linear-gradient(145deg, var(--color-warning-700), var(--color-warning-900))',
  neutral: 'linear-gradient(145deg, var(--color-neutral-700), var(--color-neutral-900))',
}

/** Renewal urgency, driving the days-left chip's tone. Expired reads error,
 *  under 60 days reads warning, everything else is neutral-positive. */
function urgencyOf(days: number): 'expired' | 'soon' | 'ok' {
  if (days <= 0) return 'expired'
  if (days <= 60) return 'soon'
  return 'ok'
}

const URGENCY_TONE: Record<'expired' | 'soon' | 'ok', { bg: string; fg: string }> = {
  expired: { bg: 'var(--color-error-100)', fg: 'var(--color-error-700)' },
  soon: { bg: 'var(--color-warning-200)', fg: 'var(--color-warning-800)' },
  ok: { bg: 'rgb(255 255 255 / 0.16)', fg: 'rgb(255 255 255 / 0.92)' },
}

/**
 * One membership as a passport card — the multi-membership treatment, matching
 * the "Current Membership" card style used on the Two-sections version
 * (`MembershipPassportCard`): a navy gradient card with a tier badge, the
 * profession as the headline, a member-since line, an Auto-Renews / Saved grid,
 * and a white "Manage" link pinned bottom-right.
 *
 * Sized to fill its container (a grid cell or a `ShelfScroller` cell), with the
 * footer pushed to the bottom (`margin-top: auto`) so cards line up in a row.
 */
/**
 * Renewal label. An EXPIRED membership must never claim it auto-renews — the
 * date has passed and nothing renewed, so "Auto-Renews" beside an "Expired"
 * chip is a straight contradiction. Past the date the label becomes "Expired
 * on"; before it, "Auto-Renews" only when auto-renew is confirmed (undefined
 * ⇒ unknown, not false), otherwise the neutral "Renews".
 */
function renewalLabel(row: MembershipRow, urgency: 'expired' | 'soon' | 'ok'): string {
  if (urgency === 'expired') return 'Expired on'
  return row.autoRenew === true ? 'Auto-Renews' : 'Renews'
}

export function MembershipRowCard({
  row,
  onManage,
  layout = 'tile',
}: {
  row: MembershipRow
  onManage?: (id: string) => void
  /** `tile` (default) — the portrait passport card used in the 3-up grid.
   *  `band` — the full-width landscape treatment used at 1–2 memberships,
   *  where a stretched tile would be mostly empty space. */
  layout?: 'tile' | 'band'
}) {
  // Color + badge follow the learner's currently-selected tier, so the card
  // reads as that tier (Passport Lite → navy, Passport → gold) rather than a
  // fixed navy with a possibly-mismatched per-row badge.
  const { tierTone, tierLabel } = useAccount()
  // Tier-header treatment (default ON). Read here rather than threaded as a
  // prop so BOTH call sites in `MembershipMultiSections` — the tile grid and the
  // band stack — pick it up without either having to know about the flag.
  const tierHeader = useFeatureFlag('membership-card-tier-header').enabled
  if (tierHeader) {
    return <TierHeaderCard row={row} onManage={onManage} layout={layout} />
  }
  const cardBg = TONE_GRADIENT[tierTone]
  const urgency = urgencyOf(row.daysRemaining)
  const tone = URGENCY_TONE[urgency]
  const band = layout === 'band'

  const tier = (
    <MembershipBadge label={tierLabel ?? row.tierLabel} tone={tierTone} icon={tierBadgeIcon(tierTone)} />
  )
  const daysChip = (
    <span style={{ ...daysChipStyle, background: tone.bg, color: tone.fg }}>
      {urgency === 'expired' ? 'Expired' : `${row.daysRemaining} days left`}
    </span>
  )
  const manage = (
    <button
      type="button"
      onClick={() => (onManage ? onManage(row.id) : console.info('cta:manage-membership', row.id))}
      style={manageLinkStyle}
      // The visible label is just "Manage", which repeats across cards — name
      // the membership for assistive tech so each button is distinguishable.
      aria-label={`Manage ${row.profession} membership in ${row.state}`}
    >
      Manage
      <ArrowRight size={14} aria-hidden />
    </button>
  )

  if (band) {
    return (
      <article style={{ ...bandStyle, background: cardBg }}>
        <span aria-hidden style={cardGlowStyle} />
        <div style={bandIdStyle}>
          <div style={bandIdTopStyle}>
            <h3 style={bandNameStyle}>{row.profession}</h3>
            {tier}
          </div>
          <p style={cardLineStyle}>
            {row.state} · Member since {row.memberSinceYear}
          </p>
        </div>
        <div style={bandCellStyle}>
          <p style={cardRowKeyStyle}>{renewalLabel(row, urgency)}</p>
          <p style={cardRowValStyle}>{row.renewsOn}</p>
          {daysChip}
        </div>
        <div style={bandCellStyle}>
          <p style={cardRowKeyStyle}>Saved</p>
          <p style={savingsStyle}>{`$${row.savings.toLocaleString('en-US')}`}</p>
        </div>
        <div style={bandActionStyle}>{manage}</div>
      </article>
    )
  }

  return (
    <article style={{ ...cardStyle, background: cardBg }}>
      <span aria-hidden style={cardGlowStyle} />

      <div style={cardTopStyle}>
        <span style={cardBrandStyle}>Member since {row.memberSinceYear}</span>
        {tier}
      </div>

      <h3 style={cardNameStyle}>{row.profession}</h3>
      <p style={cardLineStyle}>{row.state}</p>

      <div style={cardRowsStyle}>
        <div>
          <p style={cardRowKeyStyle}>{renewalLabel(row, urgency)}</p>
          <p style={cardRowValStyle}>{row.renewsOn}</p>
          {daysChip}
        </div>
        <div>
          <p style={cardRowKeyStyle}>Saved</p>
          <p style={savingsStyle}>{`$${row.savings.toLocaleString('en-US')}`}</p>
        </div>
      </div>

      <div style={cardFootStyle}>{manage}</div>
    </article>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   Tier-header treatment — the default (`membership-card-tier-header` ON).

   Design: explorations/membership-card-ui/membership-card-A-refined.html (A1).
   Splits the card into two planes — a tier-tinted IDENTITY header (profession +
   state + tier pill, with the tier glyph as a large watermark) over a WHITE DATA
   body. Three deliberate differences from the legacy card above:

     1. Renewal is driven by the SHARED six-state model in
        `membershipRenewalState.ts` — see below.
     2. `Saved` is dropped. The roll-up scorecard sitting directly above the
        list already totals lifetime savings, so repeating a slice of it per card
        was double-counting the same claim. `Member Tenure` (days) takes the
        cell — from the existing `row.tenureDays`, no new data.
     3. No divider above Manage.

   RENEWAL STATES (updated 2026-08-25). This card used to carry its own
   three-state derivation (`auto` / `expires` / `expired`, read off the boolean
   `row.autoRenew`). It now calls the same `renewalStateFor()` the "Your
   Memberships" sheet cards use, so the hero card and the sheet can't tell a
   learner two different stories about one membership. What that buys:

     • Six states instead of three — payment-failed, grace period, and the
       split between an informational far-out expiry and one inside the renewal
       window all have their own copy. Full rationale + the visual set:
       `explorations/membership-card-ui/renewal-states-copy-review.html` and
       `renewal-states-gallery.html`.
     • The discriminator is CAPABILITY, not history: `renewal.autoRenew` is
       `'on' | 'off'` since 2026-08-31, so a plan not auto-renewing never
       mentions auto-renewal (and its Manage sheet drops that row entirely).
       The old boolean couldn't express "unavailable" vs "off" — both read
       `Expires`, which is why the sheet offered an auto-renewal toggle on plans
       that can't have one.
     • The FOOTER CTA is now the state's own verb ("Renew now" / "Update payment
       method" / "Turn auto-renewal on" / "Restore membership"), not a fixed
       "Manage" on every card. `onManage` still receives the row id — the caller
       decides where each verb lands (see MembershipStandalonePage).
     • A STATUS PILL now sits in the header on every card, naming the access
       state in words. Requested in the copy review: the header row should
       always answer "do I have access right now?".

   The old day-count chip is kept, still tone-coded, but its tone now comes from
   the resolved state's `pillTone` rather than a local <60-day rule — one source
   for "must the learner act".
   ══════════════════════════════════════════════════════════════════════════ */

/** Resolve the row's renewal state. `MembershipRow` is
 *  `MembershipRecord & {…}`, so it already carries `renewal` — no data change
 *  was needed here. Records authored before those fields existed fall back to a
 *  plain, capability-unknown expiry (never a claimed auto-renewal); if even
 *  `expiresOn` is unparseable the card renders without a renewal story rather
 *  than inventing one. */
function rowRenewalState(row: MembershipRow): MembershipRenewalState | null {
  const renewal = row.renewal ?? renewalFallbackFor(row)
  return renewal ? renewalStateFor(renewal) : null
}

/** Day-count chip tone, keyed off the resolved state's pill tone so the chip and
 *  the pill can never disagree. `warning-800`-on-`-200` and `error-700`-on-`-100`
 *  are the AA-clearing steps (the -700/-200 pairing the tier spec suggested only
 *  reached 3.7:1). */
const CHIP_BY_TONE: Record<'active' | 'attn' | 'expired', { bg: string; fg: string }> = {
  active: { bg: 'var(--color-success-100)', fg: 'var(--color-success-600)' },
  attn: { bg: 'var(--color-warning-200)', fg: 'var(--color-warning-800)' },
  expired: { bg: 'var(--color-error-100)', fg: 'var(--color-error-700)' },
}

/**
 * Short cell label per state. The state's own `lead` is a full sentence
 * ("Renews automatically on December 5, 2026") authored for the sheet card's
 * full-width body; this cell is one half of a two-column grid inside a ~320px
 * tile, where that sentence wraps to four lines and buries the date under it.
 *
 * So the row card prints the state as a LABEL over the date — the same
 * information at this density — and leaves the full copy to the sheet. The
 * labels still obey the review's rules: sentence case, and a plan that can't
 * auto-renew never sees the word "auto-renewal".
 *
 * NOT the same map as `RENEWAL_DATE_LABEL` in membershipRenewalState.ts, and
 * merging the two is a mistake that has already been made once. This card
 * prints the label ABOVE the date as a small-caps field, next to siblings like
 * "MEMBER TENURE" — so it reads as a field name ("Auto-renews"). The hub hero
 * card prints its label INLINE with the date as a sentence, so it needs the
 * preposition ("Auto-renews on 11/03/2026"). Same states, same dates, different
 * grammar because of where the label sits.
 */
const ROW_LABEL: Record<MembershipRenewalStateId, string> = {
  'auto-renews': 'Auto-renews',
  'expires-outside-window': 'Membership year ends',
  'expires-in-window': 'Expires',
  'payment-failed': 'Payment failed',
  grace: 'Expired · restore by',
  expired: 'Expired on',
}

/** Tone → tier glyph, resolved ONCE at module scope.
 *
 *  `tierBadgeIcon()` stays the single source of truth for the mapping (Plus →
 *  Bolt · Pro → Gem · Premier → Crown), but calling it inside render returns a
 *  component created during render — which trips `react-hooks/static-components`
 *  and, more to the point, hands React a fresh component identity on every pass.
 *  Resolving all four tones up front makes the identities stable, so the glyph is
 *  a plain lookup at render time. */
const TIER_GLYPH: Record<MembershipTierTone, ReturnType<typeof tierBadgeIcon>> = {
  neutral: tierBadgeIcon('neutral'),
  primary: tierBadgeIcon('primary'),
  tertiary: tierBadgeIcon('tertiary'),
  warning: tierBadgeIcon('warning'),
}

function TierHeaderCard({
  row,
  onManage,
  layout,
}: {
  row: MembershipRow
  onManage?: (id: string) => void
  layout: 'tile' | 'band'
}) {
  const { tierTone, tierLabel } = useAccount()
  const state = rowRenewalState(row)
  // No resolvable renewal ⇒ treat the chip as neutral-positive rather than
  // implying urgency the data doesn't support.
  const chip = CHIP_BY_TONE[state?.pillTone ?? 'active']
  const TierGlyph = TIER_GLYPH[tierTone]
  const band = layout === 'band'

  const identity = (
    <>
      {/* Decorative reinforcement only — the badge beside it names the tier in
          text, so the glyph never has to carry meaning on its own. */}
      <span aria-hidden style={band ? thBandWatermarkStyle : thWatermarkStyle}>
        <TierGlyph size={band ? 96 : 116} />
      </span>
      <div style={thHeaderTopStyle}>
        <MembershipBadge
          label={tierLabel ?? row.tierLabel}
          tone={tierTone}
          icon={TierGlyph}
        />
        {/* Status pill — always present, always naming the access state in
            words, so the header answers "do I have access right now?" without
            relying on color. */}
        {state && <span style={renewalPillStyle(state.pillTone)}>{state.pill}</span>}
      </div>
      <h3 style={thNameStyle}>{row.profession}</h3>
      <p style={thStateStyle}>{row.state}</p>
    </>
  )

  // State label (with its severity glyph) over the date, then the day-count
  // chip. The state's `notes` are deliberately NOT rendered here — this cell is
  // half of a two-column grid, and the sheet is where the full copy lives.
  const renewalCell = (
    <div>
      <p style={{ ...thKeyStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
        {state && (
          <span aria-hidden style={{ color: renewalIconColor(state), lineHeight: 0, flex: 'none' }}>
            <RenewalStateIcon icon={state.icon} size={12} />
          </span>
        )}
        {state ? ROW_LABEL[state.id] : 'Renews'}
      </p>
      <p style={{ ...thValStyle, ...(state ? renewalLeadTone(state) : null) }}>{row.renewsOn}</p>
      {/* No countdown once expired — there's nothing left to count. */}
      {state?.id !== 'expired' && (
        <span style={{ ...thChipStyle, background: chip.bg, color: chip.fg }}>
          {`${row.daysRemaining} days left`}
        </span>
      )}
    </div>
  )

  const tenureCell = (
    <div>
      <p style={thKeyStyle}>Member Tenure</p>
      {/* `tenureDays` is authored per membership, not derived from a start date
          (see MEMBERSHIP_VALUES) — so it won't tick up on its own yet. */}
      <p style={thValStyle}>{row.tenureDays.toLocaleString('en-US')} days</p>
    </div>
  )

  // The CTA is the state's own verb ("Renew now" / "Update payment method" /
  // "Turn auto-renewal on" / "Restore membership" / "Manage membership"), so the
  // button and the line above it never ask for different things. Falls back to
  // "Manage" when there's no resolvable renewal state.
  const ctaLabel = state?.cta ?? 'Manage'
  const manage = (
    <button
      type="button"
      onClick={() => (onManage ? onManage(row.id) : console.info('cta:manage-membership', row.id))}
      style={thManageStyle}
      // The label repeats across every card — name the membership so assistive
      // tech can tell the buttons apart.
      aria-label={`${ctaLabel} — ${row.profession} membership in ${row.state}`}
    >
      {ctaLabel}
      <ArrowRight size={14} aria-hidden />
    </button>
  )

  if (band) {
    return (
      <article style={thBandStyle}>
        <div style={{ ...thBandIdentityStyle, background: TONE_GRADIENT[tierTone] }}>{identity}</div>
        <div style={thBandBodyStyle}>
          <div style={thBandCellStyle}>{renewalCell}</div>
          <div style={thBandCellStyle}>{tenureCell}</div>
          <div style={thBandActionStyle}>{manage}</div>
        </div>
      </article>
    )
  }

  return (
    <article style={thCardStyle}>
      <div style={{ ...thHeaderStyle, background: TONE_GRADIENT[tierTone] }}>{identity}</div>
      <div style={thBodyStyle}>
        {renewalCell}
        {tenureCell}
      </div>
      <div style={thFootStyle}>{manage}</div>
    </article>
  )
}

/* ─── tier-header styles ──────────────────────────────────────────────────── */

const thCardStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-xl)',
}

const thHeaderStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  padding: '18px 20px 20px',
  color: 'var(--color-text-inverse)',
}

const thHeaderTopStyle: CSSProperties = {
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  minHeight: 28,
}

const thNameStyle: CSSProperties = {
  position: 'relative',
  zIndex: 2,
  margin: '14px 0 2px',
  fontFamily: 'var(--font-heading)',
  fontSize: 20,
  fontWeight: 800,
  lineHeight: 1.15,
  // Explicit — a global `h3` color rule would otherwise print near-black on the
  // tinted header.
  color: 'var(--color-text-inverse)',
}

// 0.72, not the legacy card's 0.62 — 0.62 is only 4.44:1 on the gold ramp, just
// under AA. 0.72 clears AA on all three tier ramps (5.35 gold / 5.90 sky /
// 7.42 teal).
const thStateStyle: CSSProperties = {
  position: 'relative',
  zIndex: 2,
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'rgb(255 255 255 / 0.72)',
}

// Bleeds off the header's right edge. Decorative, so it's exempt from contrast
// minimums — kept at 0.17 so it never competes with the profession title.
const thWatermarkStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 1,
  right: -14,
  top: '50%',
  transform: 'translateY(-50%)',
  lineHeight: 0,
  color: 'rgb(255 255 255 / 0.17)',
  pointerEvents: 'none',
}

const thBodyStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  padding: '16px 20px 0',
}

const thKeyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const thValStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const thChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 20,
  padding: '0 8px',
  marginTop: 6,
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
}

// `margin-top: auto` keeps Manage on the floor so tiles of unequal content
// still bottom-align. No border-top — the divider was removed by design.
const thFootStyle: CSSProperties = {
  marginTop: 'auto',
  padding: '14px 20px 16px',
  display: 'flex',
  justifyContent: 'flex-end',
}

const thManageStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-accent-link)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

/* ── band (1–2 memberships) — the same two planes, laid on their side: the
      tinted identity block becomes a left column and the white body holds the
      cells + Manage in a row. */

// Flex rather than a 2-column grid so it degrades without a media query (inline
// styles can't carry one): below ~640px the white body wraps under the tinted
// identity block, which stacks the same two planes as the tile.
const thBandStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'stretch',
  flexWrap: 'wrap',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-xl)',
}

const thBandIdentityStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  flex: '1 1 260px',
  minWidth: 0,
  padding: '18px 20px',
  color: 'var(--color-text-inverse)',
}

const thBandWatermarkStyle: CSSProperties = {
  ...thWatermarkStyle,
  right: -20,
}

const thBandBodyStyle: CSSProperties = {
  flex: '1 1 380px',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 28,
  flexWrap: 'wrap',
  padding: '18px 20px',
}

const thBandCellStyle: CSSProperties = { flex: 'none', minWidth: 140 }

// Pins Manage to the right edge at every width; it drops below the cells only
// once the row wraps.
const thBandActionStyle: CSSProperties = { flex: 'none', marginLeft: 'auto' }

/* ─── styles (mirrors MembershipPassportCard's passport treatment) ────────── */

/* ── `band` layout — Variation 1. The tile lies down: identity left, renewal
      and value as fixed columns, Manage pinned right. ~90px instead of ~300px,
      so 1–2 memberships read as compact records rather than stretched tiles. */

const bandStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  gap: 28,
  flexWrap: 'wrap',
  padding: '20px 24px',
  background: 'linear-gradient(145deg, var(--color-primary-700), var(--color-primary-900))',
  borderRadius: 'var(--radius-xl)',
  color: 'var(--color-text-inverse)',
}

const bandIdStyle: CSSProperties = { position: 'relative', flex: '1 1 240px', minWidth: 0 }

const bandIdTopStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const bandNameStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 21,
  fontWeight: 800,
  lineHeight: 1.15,
  // Same explicit inverse as the tile — a global `h3` rule would otherwise
  // print near-black on the navy band.
  color: 'var(--color-text-inverse)',
}

const bandCellStyle: CSSProperties = { position: 'relative', flex: 'none', minWidth: 140 }

// `margin-left: auto` pins Manage to the right edge at every width; it drops
// below the cells only once the row wraps.
const bandActionStyle: CSSProperties = { position: 'relative', flex: 'none', marginLeft: 'auto' }

const cardStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(145deg, var(--color-primary-700), var(--color-primary-900))',
  borderRadius: 'var(--radius-xl)',
  padding: 22,
  color: 'var(--color-text-inverse)',
}

const cardGlowStyle: CSSProperties = {
  position: 'absolute',
  right: -46,
  top: -46,
  width: 180,
  height: 180,
  borderRadius: '50%',
  background: 'color-mix(in srgb, var(--color-secondary-500) 16%, transparent)',
  pointerEvents: 'none',
}

const cardTopStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
}

const cardBrandStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.62)',
}

const cardNameStyle: CSSProperties = {
  position: 'relative',
  margin: '16px 0 2px',
  fontFamily: 'var(--font-heading)',
  fontSize: 21,
  fontWeight: 800,
  lineHeight: 1.15,
  // Explicit — a global `h3` color rule would otherwise override the white
  // inherited from the card, printing near-black text on the navy card.
  color: 'var(--color-text-inverse)',
}

const cardLineStyle: CSSProperties = {
  position: 'relative',
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'rgb(255 255 255 / 0.62)',
}

const cardRowsStyle: CSSProperties = {
  position: 'relative',
  marginTop: 20,
  paddingTop: 16,
  borderTop: '1px solid rgb(255 255 255 / 0.22)',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
  gap: 12,
}

const cardRowKeyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.45)',
}

const cardRowValStyle: CSSProperties = {
  margin: '3px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.4,
}

const savingsStyle: CSSProperties = {
  margin: '3px 0 0',
  fontFamily: 'var(--font-heading)',
  fontSize: 20,
  fontWeight: 800,
  lineHeight: 1.1,
}

const daysChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 20,
  padding: '0 8px',
  marginTop: 6,
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
}

const cardFootStyle: CSSProperties = {
  position: 'relative',
  marginTop: 'auto',
  paddingTop: 18,
  display: 'flex',
  justifyContent: 'flex-end',
}

const manageLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
