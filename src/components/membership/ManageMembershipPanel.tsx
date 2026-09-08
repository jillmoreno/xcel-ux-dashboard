import { useState, type CSSProperties, type ComponentType } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { X, ArrowLeft, ArrowsRotate, ChevronRight, CreditCard, Grid, Receipt } from '@/icons'
import {
  useAccount,
  memberTiersFor,
  multiMembershipsFor,
  type MembershipRecord,
} from '@/context/AccountContext'
import { tierTintBg } from './tierCardStyle'
import { useSearchParams } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  membershipPlanFor,
  paymentMethodOnFile,
  planRenewalFactsFor,
} from '@/data/membership/membershipScorecardFixtures'
import { membershipChangePlanFor } from '@/data/membership/membershipUpgradeFixtures'
import { MembershipUpgradeModal } from './MembershipUpgradeModal'
import { CancelMembershipFlow } from './CancelMembershipFlow'
import { MembershipRenewalCard } from './MembershipRenewalCard'
import {
  formatRenewalDate,
  renewalFallbackFor,
  renewalFromPlanFacts,
  renewalStateFor,
  type MembershipRenewalState,
} from './membershipRenewalState'
import { renewalPillStyle } from './renewalStateStyles'

/**
 * "Manage Membership" — a right-anchored slide-over opened from every membership
 * card's footer CTA. Brand-token styled throughout, so it reads on-brand for
 * every brand (Elite teal here) rather than a hardcoded palette.
 *
 * ── SHEET LOGIC (rewritten 2026-08-25) ───────────────────────────────────────
 * The sheet is now driven by the SAME six-state model as the cards that open
 * it (`membershipRenewalState.ts`), so the card and the sheet can't tell a
 * learner two different stories about one membership. Spec + rationale:
 * `explorations/membership-card-ui/renewal-states-copy-review.html`
 * (its "State matrix" section) and `renewal-states-gallery.html`. Note those
 * are DATED design records — they still show the old "Manage renewal" CTA that
 * this state now calls "Manage membership", and should not be rewritten to
 * match: their value is what was decided at the time.
 *
 * What that settled, and what this file now enforces:
 *
 *  1. AUTO-RENEWAL IS A ROW ON EVERY MEMBERSHIP THAT HAS A RENEWAL — including
 *     one whose plan has it switched off. REVISED 2026-08-27 (Jillienne):
 *     this row used to disappear on `unavailable`, on the reasoning that the
 *     value is a CAPABILITY and offering a setting the plan can't support is
 *     worse than showing nothing. In practice that left the learner looking at
 *     a membership that plainly does not auto-renew with nowhere to ask for it
 *     and no explanation, which read as a missing feature rather than an absent
 *     one. The row is now offered and the label carries the verb when it is off
 *     ("Turn on auto-renewal").
 *
 *     What did NOT change: the state machine's copy. An `unavailable` plan
 *     still never mentions auto-renewal in its lead or notes — its card reads
 *     "Your membership year ends {date}", not "Auto-renewal is off" — and
 *     `membershipRenewalState.test.ts` still asserts that. A `null` renewal
 *     (no renewal data at all) still hides the row: unknown is not the same as
 *     off, and offering a setting we cannot read is a different mistake.
 *  2. AUTO-RENEWAL AND CANCEL ARE SEPARATE ROWS. Different intents, different
 *     outcomes — collapsing them is how someone cancels a membership when they
 *     meant to stop one charge.
 *  3. CANCEL NAMES WHAT SURVIVES. Same sentence as the Expired card: benefits
 *     end, certificates / progress / à-la-carte buying stay. The answer must not
 *     depend on which surface you happen to read.
 *  4. THE CHARGE IS STATED ONCE, ON THE CARD. The "Plan details" list that held
 *     Next charge / Payment method / Membership Tier was removed on 2026-08-27
 *     once the header card's charge line carried them ("$99 will be charged to
 *     {card}"). `TODO(product)`: whether a renewal price can RISE is still
 *     unanswered (logged on the handoff) — until it is, nothing here claims the
 *     next charge matches the last one.
 *  5. CANCEL IS A VISIBLE TEXT ACTION, not buried. Auto-renewal disclosures are
 *     generally expected to sit alongside cancellation info (FTC negative-option
 *     / California ARL-style rules) — one tap from the card satisfies that.
 *     NOT legal advice; flagged for a legal read on the handoff.
 *
 * The state's own lead + notes head the sheet, so whichever card opened it, the
 * first thing the learner reads is the same sentence they just clicked.
 *
 * All actions remain `console.info` stubs (prototype). Payment method is a
 * `TODO(data)` stub — the subscription/billing service will own the real card.
 */
/** When `membership` is passed (from a specific card), the panel shows THAT
 *  membership — its profession/tier/state/expiry/renewal — pulling tier-level
 *  price from the plan fixture for the record's tier. Omitted ⇒ the account's
 *  active tier (the single-membership hero "Manage" case). */
type Props = {
  open: boolean
  onClose: () => void
  membership?: MembershipRecord
  /** Where the `modal` and `page` arms of `membership-cancel-flow` send the
   *  learner — the caller owns the container, so it decides which. Supplied
   *  by the surface that owns a full-width region to hand over (the Membership
   *  page); omitted everywhere else, in which case the sheet keeps the flow
   *  in-panel regardless of the flag — a sheet with nowhere to navigate to must
   *  still have a working cancel path. */
  onCancelHandoff?: () => void
  /** Set when this sheet was opened FROM another sheet — today the "Your
   *  Memberships" list, whose Manage link drills into one record. The header
   *  control then reads as a BACK link rather than Close, and dismissing the
   *  sheet (the control, Escape, or the backdrop) returns to that list instead
   *  of throwing the learner out of the stack they were working in.
   *
   *  All three dismiss gestures are bound together on purpose: a header that
   *  says "Back" while Escape fully exits is two different outcomes from one
   *  intent. Omitted ⇒ the sheet is a top-level destination and shows Close. */
  onBack?: () => void
  /** Names the destination for `onBack`, since the panel doesn't own it —
   *  e.g. "Back to Your Memberships". Ignored without `onBack`. */
  backLabel?: string
}

export function ManageMembershipPanel({
  open,
  onClose,
  membership,
  onCancelHandoff,
  onBack,
  backLabel = 'Back',
}: Props) {
  // One dismiss path for every gesture — see `onBack` on Props.
  const dismiss = onBack ?? onClose
  return (
    <Sheet open={open} onClose={dismiss} title="Manage Membership">
      <header style={headerStyle}>
        <button
          type="button"
          aria-label={onBack ? backLabel : 'Close Manage Membership panel'}
          onClick={dismiss}
          className="cre-sheet-close"
          style={closeStyle}
        >
          {onBack ? <ArrowLeft size={14} aria-hidden /> : <X size={14} aria-hidden />}
          {onBack ? backLabel : 'Close'}
        </button>
        <h2 style={titleStyle}>Manage Membership</h2>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />
      <ManageMembershipBody membership={membership} onCancelHandoff={onCancelHandoff} />
    </Sheet>
  )
}

/**
 * The sheet's contents, minus the `Sheet` chassis and its header.
 *
 * Extracted so the dev-handoff page can render the REAL body inline instead of a
 * mock — same split as `MotivationalStatementFields`. A preview can't mount the
 * `Sheet` itself (portal + body scroll lock + a fixed overlay), and a hand-built
 * copy of these rows is exactly the kind of thing that drifts from the shipped
 * sheet within a sprint.
 */
export function ManageMembershipBody({
  membership,
  onCancelHandoff,
}: {
  membership?: MembershipRecord
  onCancelHandoff?: () => void
}) {
  const { brand, tierLabel, tierTone, tier: accountTier } = useAccount()
  // The sheet's tinted chrome follows the TIER the learner is looking at — the
  // scoped record's tone when one was passed, else the account's. It was pinned
  // to `secondary`, so a Premier/Passport member opened a gold card into a teal
  // sheet. Note this is the tier's colour only: the renewal icon's GLYPH still
  // takes the state's severity colour below, because "action needed" outranks
  // "which tier" on a plate that small.
  const tone = membership?.tone ?? tierTone
  // `membership-cancel-flow` picks the container for the cancellation flow.
  // `sheet` runs it here, in place; `page` hands off to a full-width region so
  // the retention offers can sit side by side. See CancelMembershipFlow's header
  // for why the container is the thing worth A/B-ing.
  const cancelFlow = useFeatureFlag('membership-cancel-flow')
  const [cancelling, setCancelling] = useState(false)
  const [changingPlan, setChangingPlan] = useState(false)
  // A specific membership record (multi) drives the tier lookup + title/state/
  // expiry; otherwise fall back to the account's active tier.
  const tierForPanel = membership?.tierLabel ?? tierLabel
  // Which TIER the panel is showing, not just its label. A scoped record carries
  // only `tierLabel` ("Passport"), so match it against the brand's ordered tier
  // table; unscoped falls back to the account's own tier. This is what ranks the
  // Change plan ladder.
  //
  // Match `label` FIRST: that is what both `tierLabelFor` and the membership
  // records use ("Passport Lite", "Premier Member"). `shortLabel` is the
  // abbreviated form ("Lite", "Premier") and matching on it alone silently
  // missed every record and fell through to the account tier — invisible while
  // the two agree, wrong the moment a learner opens a record whose tier differs
  // from their account's, which is the whole point of a multi-membership list.
  const panelTierEntry = memberTiersFor(brand).find(
    (t) => t.label === tierForPanel || t.shortLabel === tierForPanel,
  )
  const panelTier = panelTierEntry?.key ?? accountTier
  const plan = membershipPlanFor(brand, tierForPanel)
  const discipline = membership?.profession ?? plan.planLine.split(' · ')[0] ?? ''
  // Tier said once: the band names the product, the plan row names the tier.
  const planTitle = `${discipline} CE Membership`.trim()
  const renewsOn = membership?.expiresOn ?? plan.renewsOn

  // ── The renewal state. Resolved from the record when we have one, so the
  //    sheet's lead sentence is the same one the card showed. With no record
  //    (the account-level "Manage" case) there's no `renewal` to read, so the
  //    sheet degrades to the plan fixture's flat facts below.
  // Scoped ⇒ the record's own renewal. UNSCOPED ⇒ the brand's authored plan
  // facts — the same source the cancellation flow below has always read.
  //
  // This is the fix for "the old UI keeps coming back". The unscoped path is the
  // DEFAULT for a single-membership learner (the hub card's Manage passes no
  // record on purpose), so treating "no record object" as "no renewal state"
  // meant the redesigned header only ever appeared in the multi-membership
  // drill-down — the rarer case. The state was derivable the whole time.
  //
  // Deliberately NOT a blanket `?? planFacts` chain: a SCOPED record whose own
  // renewal won't parse must not silently borrow the account's dates, which
  // would show one membership's renewal under another's name.
  const renewal = membership
    ? (membership.renewal ?? renewalFallbackFor(membership))
    : renewalFromPlanFacts(planRenewalFactsFor(brand))
  const state: MembershipRenewalState | null = renewal ? renewalStateFor(renewal) : null
  // The cancellation flow gets a WIDER fallback than the rows above it. The
  // sheet's own display is unchanged — with no record it still degrades to the
  // plan fixture's flat facts and shows no status pill — but the flow needs a
  // renewal date and price to build any offer at all, and this sheet is usually
  // opened UNSCOPED (the single-membership layout has no record id to pass, so
  // it calls `openSectionManage(null)` on purpose). Reading the same authored
  // facts out of the plan fixture is what keeps the default arm from silently
  // showing a learner no alternatives.
  // NOTE the source: `planRenewalFactsFor(brand)`, not `plan`. `plan.renewsOn`
  // is display-formatted ("Nov 3, 2026") and parsing that is what broke this
  // the first time — silently, since a failed parse just yields no offers.
  const cancelRenewal = renewal ?? renewalFromPlanFacts(planRenewalFactsFor(brand))
  // Any membership with a renewal can manage auto-renewal — including one whose
  // plan has auto-renewal switched off. (The `'unavailable'` capability value
  // this once referred to was removed 2026-08-31.)
  //
  // This REVERSES rule 1 for the sheet's action row, on Jillienne's call
  // (2026-08-27). The rule still holds where it started: the state machine's own
  // copy never mentions auto-renewal on an `unavailable` plan, so the card reads
  // "Your membership year ends {date}" rather than "Auto-renewal is off". What
  // changed is that the sheet no longer stays SILENT about it — the learner was
  // shown a membership that plainly does not auto-renew and given nowhere to
  // ask for it, with nothing on screen explaining why.
  //
  // `null` renewal (no renewal data at all, e.g. STC) still hides the row: that
  // is genuinely unknown rather than off, and offering a setting we cannot read
  // is a different mistake from the one this fixes.
  const autoRenewAvailable = renewal != null
  const autoRenewOn = renewal?.autoRenew === 'on'
  const chargeDate = renewal ? formatRenewalDate(renewal.endsOn) : renewsOn

  // The Change plan ladder, ranked against the tier this panel is showing.
  // Declared HERE, below `chargeDate`, because it consumes it — the downgrade
  // note names the same renewal date the Next charge row does, so the two can
  // never disagree about the day.
  const changePlan = membershipChangePlanFor(brand, panelTier, {
    // `shortLabel`, not `label`: the note reads "your {x} content", and CRE's
    // label is "Premier Member" — "your Premier Member content" is the kind of
    // phrase that only survives because nobody read it aloud.
    currentTierLabel: panelTierEntry?.shortLabel ?? tierForPanel ?? undefined,
    renewalDate: chargeDate ?? undefined,
  })
  // Is there anything above them? Drives the row's sub-line: a top-tier member
  // is not being offered an upgrade, so the row must not imply one.
  const hasUpgrade = changePlan.plans.some((p) => p.recommended)

  // BOTH non-sheet arms hand the flow OUT of the panel — `modal` to a centred
  // dialog, `page` to a full-width region — and the HOST decides which, since it
  // is the thing that can render either. The handler only exists where a caller
  // gave us somewhere to go; with none, the flag would dead-end the cancel row,
  // which is a worse failure than ignoring it, so the sheet keeps the flow.
  const handsOff = cancelFlow.variant === 'modal' || cancelFlow.variant === 'page'
  // In the pure Demo (`?demo=1`) the cancellation flow is a STUBBED CTA: the row
  // still renders, so the sheet isn't missing an affordance a real one would
  // have, but pressing it goes nowhere.
  //
  // Why the row stays rather than being hidden: the Manage sheet is the one place
  // a learner can leave, and a sheet with no exit misrepresents the design being
  // demoed. Why the flow is withheld: it is a multi-step retention flow with a
  // live undo and several open product questions (the billing term-extension is
  // still BLOCKED), so it is not something to walk a stakeholder into yet.
  //
  // Demo-scoped ONLY — the plain `/dashboard-rebrand` sandbox and the feature's
  // own walkthrough keep the real flow, which is where it is reviewed. This is
  // deliberately not a feature flag: `membership-cancel-flow` picks the flow's
  // CONTAINER, and overloading it with an off state would conflate "where does
  // it run" with "does it run at all".
  //
  // Reads the URL param rather than `useDemoMode()`: two handoff previews call
  // `setDemoMode(true)` to render committed defaults, so the context flag is
  // also true inside the handoff — which is the one place the real flow MUST
  // stay clickable. `?demo=1` is only ever on the actual demo route. Same
  // reason PlatformShell reads it directly.
  const [demoParams] = useSearchParams()
  const demoMode = demoParams.get('demo') === '1'
  const onCancel = () => {
    if (demoMode) {
      console.info('demo:cancel-membership:stub', membership?.id ?? null)
      return
    }
    if (handsOff && onCancelHandoff) {
      onCancelHandoff()
      return
    }
    setCancelling(true)
  }

  // ── Which identity treatment heads the sheet ────────────────────────────
  // When the sheet is SCOPED to a record we can resolve a state for, the card
  // the learner just tapped in "Your Memberships" leads the sheet — the same
  // component, in its `detail` variant. Before this the sheet dropped that card
  // and restated the membership as a flat tinted strip, which kept the product
  // name but lost the tier badge, the license state, and the plane itself; for
  // someone holding several memberships those are most of the identity.
  //
  // It also removes a duplication rather than adding to one: the sheet was
  // already re-rendering this state's own `lead` + `notes` in its own chrome
  // just below the strip. Now they are stated once, in the card, and the
  // bordered box below carries only the facts the card never showed.
  //
  // The card renders FULL-BLEED in the band's own slot (see below), not inset
  // in the body — it is the sheet's header, not a card sitting inside one.
  // The account-level membership, shaped as a record so the unscoped sheet gets
  // the SAME header as a scoped one. Profession comes from the plan line; the
  // license state from the learner's first membership record when the brand has
  // one (Elite), and is simply absent otherwise — the card omits that line
  // rather than printing a bare " license".
  const primaryRec = multiMembershipsFor(brand)[0]
  const headerRecord: MembershipRecord = membership ?? {
    id: 'account',
    tierLabel: tierForPanel ?? 'Member',
    // `tierTone` widens to include 'neutral' (non-member), which a membership
    // card has no treatment for. A non-member never reaches this sheet, so this
    // is a type guard rather than a real case.
    tone: tierTone === 'neutral' ? 'primary' : tierTone,
    profession: discipline,
    state: primaryRec?.state ?? '',
    memberSinceYear: primaryRec?.memberSinceYear ?? '',
    // Inert: the card reads `renewal` for every date it shows, and only parses
    // `expiresOn` when `renewal` is absent — in which case it shows identity
    // plus the flat lead supplied via `detailLead`, never a parsed date.
    expiresOn: primaryRec?.expiresOn ?? '',
    ...(renewal ? { renewal } : null),
  }
  return (
    <>
      {/* Pinned above the scroll area. The card is SPLIT here: its identity
          plane is pinned, its renewal detail scrolls with the body below —
          `detailSlot` on `MembershipRenewalCard`, so both halves still come
          from the one component and cannot drift from the Your Memberships
          list. During the cancellation flow the slim flat band takes over
          instead, so the learner never loses track of WHICH membership they
          are ending while a multi-step flow owns the panel. */}
      {cancelling ? (
        <div style={{ ...planBandStyle, background: tierTintBg(tone, 18) }}>
          <span>{planTitle}</span>
          {state && <span style={renewalPillStyle(state.pillTone)}>{state.pill}</span>}
        </div>
      ) : (
        // PINNED: the identity plane only. WHICH membership you are managing is
        // the one fact that should never leave the screen, and at ~78px it is
        // cheap to keep — pinning the whole ~150px card cost a third of a short
        // viewport, which is why the renewal detail scrolls with the body below.
        <MembershipRenewalCard record={headerRecord} variant="detail" detailSlot="header" />
      )}

      {cancelling ? (
        <CancelMembershipFlow
          layout="sheet"
          planTitle={planTitle}
          renewal={cancelRenewal}
          tierLabel={tierForPanel}
          membershipId={membership?.id}
          onExit={() => setCancelling(false)}
        />
      ) : (
        <div style={bodyStyle}>
          {/* The card's renewal detail — the half that scrolls. It sits flush
              under the pinned identity plane above: `headerBleedStyle` cancels
              the body's padding on the top and both sides, so the two halves
              read as one full-bleed header rather than a card floating inside
              the sheet.

              Non-interactive by omission — no `onSelect`, so it takes no role,
              no tabIndex and no pointer cursor. A header that looked tappable
              would be promising a destination it hasn't got. */}
          <div style={headerBleedStyle}>
            <MembershipRenewalCard
              record={headerRecord}
              variant="detail"
              detailSlot="body"
              // Only when the state machine has nothing to say — a plan with no
              // renewal date at all (STC). Mirrors what the retired fallback
              // box printed, so no information was lost along with it.
              detailLead={
                state ? undefined : renewsOn ? `Renews on ${renewsOn}` : 'Renews monthly'
              }
            />
          </div>
          {/* The "Plan details" list was REMOVED (2026-08-27), and with it the
              bordered fallback box that used to sit here. Every fact they held
              is now stated closer to where it is used, and repeating them under
              a heading was the sheet saying the same four things twice:
                • Membership Tier  → the card header's tier badge.
                • Auto-renewal     → the "Manage auto-renewal" row's sub-line.
                • Next charge      → the card's charge line, over the lead's date.
                • Payment method   → that same charge line, and the "Edit payment
                                     method" row's sub-line.
              Do not re-add either without checking those four still hold — if
              the charge line is ever scoped narrower than `auto-renews`, the
              amount and the card lose their only home on this surface. */}

          {/* ── Actions ──────────────────────────────────────────────────────
            Was a 3-up grid of centred icon tiles with Cancel Membership as the
            third. Two problems with that, both the layout's fault rather than
            the copy's:

              • It gave an irreversible action the same visual weight as
                changing a credit card, and marked it with the SAME ✕ glyph as
                the panel's own Close button.
              • Centred icon tiles are a phone pattern. In a 480px panel the
                labels wrapped to two lines and scanned worse than a list.

            Now: a row list for the reversible chores, then a rule, then cancel
            as the SAME row component — so the sheet reads as one system and the
            SEPARATION, not a different-looking control, is what says "this one
            is different". Colour carries the severity. Cancel is still one tap
            from the card in plain words, which is what rule 5 (and the FTC /
            ARL-style expectations behind it) needs. */}
          <div>
            <p style={actionsHeadingStyle}>Manage your plan</p>
            <div style={rowListStyle}>
              {/* The label carries the VERB when it is off, so the option reads
                as something you can do rather than a settings screen you have
                to open to find out. "Turn on auto-renewal" is the same phrasing
                the retired `auto-renew-off` state used, so the phrasing the
                copy review settled on survives the state merging away.

                RULE 2 still holds: this stays a separate row from Cancel below
                — different intents, different outcomes, and collapsing them is
                how someone ends a membership when they meant to stop one
                charge. */}
              {autoRenewAvailable && (
                <ActionRow
                  Icon={ArrowsRotate}
                  label={autoRenewOn ? 'Manage auto-renewal' : 'Turn on auto-renewal'}
                  detail={
                    autoRenewOn
                      ? 'On — renews automatically each year'
                      : 'Off — renew manually to keep your benefits'
                  }
                  onClick={() =>
                    console.info('manage-membership:manage-auto-renew', membership?.id)
                  }
                />
              )}
              {/* Leads the group: it is the most direct answer to the heading
                above it. Opens the tier-ranked ladder straight at the compare
                step — the offer step behind it is the fixed Lite→full pitch,
                which is the wrong screen for a member who may be stepping
                DOWN. */}
              <ActionRow
                Icon={Grid}
                label="Change plan"
                detail={
                  hasUpgrade
                    ? `Currently ${tierForPanel ?? 'Member'} — see upgrade options`
                    : `Currently ${tierForPanel ?? 'Member'} — compare all plans`
                }
                onClick={() => setChangingPlan(true)}
              />
              <ActionRow
                Icon={CreditCard}
                label="Edit payment method"
                detail={paymentMethodOnFile() ?? 'No card on file'}
                onClick={() => console.info('manage-membership:edit-payment', membership?.id)}
              />
              <ActionRow
                Icon={Receipt}
                label="View all purchases"
                detail="Receipts and order history"
                last
                onClick={() => console.info('manage-membership:view-purchases', membership?.id)}
              />
            </div>

            <div style={cancelZoneStyle}>
              <div style={rowListStyle}>
                <ActionRow
                  danger
                  last
                  Icon={X}
                  label="Cancel membership"
                  // The row's second line names the date access actually runs to
                  // — the one fact a learner needs before they press this. It used
                  // to also promise alternatives and say they were skippable;
                  // that is the flow's own job to state, and saying it here made
                  // a three-line sub-line under a one-line label.
                  detail={`You’d keep full access until ${chargeDate ?? 'the end of your membership year'}.`}
                  onClick={onCancel}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Rendered outside the cancelling branch so it is a sibling of the body,
          not a child of it. It portals above the sheet (later in `body`), so the
          sheet stays visible behind it — the learner is comparing plans FOR the
          membership named in the header above. */}
      <MembershipUpgradeModal
        open={changingPlan}
        onClose={() => setChangingPlan(false)}
        initialView="compare"
        comparison={changePlan}
      />
    </>
  )
}

/* ─── Action row ───────────────────────────────────────────────────────────
   One row shape for every action on the sheet, chores and cancel alike.
   `danger` swaps the glyph, label, and chevron to the error ramp (error-600 is
   8.28:1 on white). It deliberately does NOT change the row's size, padding, or
   structure: the divider above is already saying "this is separate", and a
   second signal in the shape would make cancelling look like somewhere the
   design didn't want you to go. */

function ActionRow({
  Icon,
  label,
  detail,
  onClick,
  danger,
  last,
}: {
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  label: string
  detail: string
  onClick: () => void
  danger?: boolean
  last?: boolean
}) {
  const tone = danger ? 'var(--color-error-600)' : undefined
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cre-manage-row${danger ? ' cre-manage-row--danger' : ''}`}
      style={{ ...actionRowStyle, ...(last ? { borderBottom: 'none' } : null) }}
    >
      <span aria-hidden style={{ ...rowGlyphStyle, color: tone ?? 'var(--color-primary-600)' }}>
        <Icon size={19} />
      </span>
      <span style={rowTextStyle}>
        <b style={{ ...rowLabelStyle, ...(tone ? { color: tone } : null) }}>{label}</b>
        <span style={rowDetailStyle}>{detail}</span>
      </span>
      <span aria-hidden style={{ ...rowGlyphStyle, color: tone ?? 'var(--color-neutral-600)' }}>
        <ChevronRight size={16} />
      </span>
    </button>
  )
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

const headerStyle: CSSProperties = {
  padding: '20px 24px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const closeStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  cursor: 'pointer',
  padding: 0,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 24,
  lineHeight: '30px',
  color: 'var(--color-primary-700)',
}

/** Cancels the scrolling body's 24px padding on the top and both sides, so the
 *  header card sits flush under the sheet's divider and runs edge to edge —
 *  the full-bleed look it had when it was pinned, without the fixed height.
 *  The bottom is left alone: the body's `gap` spaces it off the rows below. */
const headerBleedStyle: CSSProperties = {
  margin: '-24px -24px 0',
}

const planBandStyle: CSSProperties = {
  padding: '14px 24px',
  // background is set per-tier at the usage site (tierTintBg).
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
}

const bodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
}

const actionsHeadingStyle: CSSProperties = {
  margin: '0 0 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-primary-700)',
}

/** The grouped row list. One container per group, so the rule between the chore
 *  group and the cancel group is the gap between two containers rather than a
 *  line drawn inside one. */
const rowListStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--color-surface-card)',
}

/** NOTE: `background` is deliberately NOT set here — it lives on
 *  `.cre-manage-row` in tokens.css. An inline background would beat the
 *  stylesheet's `:hover` rule on specificity, so the rows would look
 *  interactive (cursor, chevron) and then not respond, which is worse than
 *  having no hover at all. Same for `cursor`, kept here only because nothing
 *  overrides it. */
const actionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  width: '100%',
  padding: '15px 18px',
  textAlign: 'left',
  border: 'none',
  borderBottom: '1px solid var(--color-border-subtle)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const rowGlyphStyle: CSSProperties = { flex: 'none', display: 'inline-flex' }

const rowTextStyle: CSSProperties = { flex: 1, minWidth: 0 }

const rowLabelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const rowDetailStyle: CSSProperties = {
  display: 'block',
  marginTop: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

/** Cancel sits in its own group below the chores — findable in one glance and
 *  in plain words, but not competing with them. The rule that used to divide
 *  them was removed on 2026-08-25; the gap plus the row's own card boundary
 *  already separate the two groups, and the danger colour marks which is which.
 *  Keep the spacing: it is now the only thing doing that job. */
const cancelZoneStyle: CSSProperties = {
  marginTop: 20,
}
