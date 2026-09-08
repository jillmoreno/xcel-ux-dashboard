import type { ComponentType, CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { ArrowRight, ArrowsRotate, CreditCard } from '@/icons'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import type { MembershipRecord } from '@/context/AccountContext'
import { tierCardBg, tierCardGlyph } from './tierCardStyle'
import { paymentMethodOnFile } from '@/data/membership/membershipScorecardFixtures'
import {
  renewalFallbackFor,
  renewalStateFor,
  type MembershipRenewalState,
} from './membershipRenewalState'
import { RenewalStateIcon } from './renewalStatePresentation'
import {
  renewalPillStyle,
  renewalIconColor,
  renewalLeadTone,
} from './renewalStateStyles'

/** Tier tone → badge/watermark glyph, resolved ONCE at module scope. */
const TIER_GLYPH: Record<string, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  primary: tierCardGlyph('primary'),
  secondary: tierCardGlyph('secondary'),
  tertiary: tierCardGlyph('tertiary'),
  warning: tierCardGlyph('warning'),
}

/**
 * Membership card — the two-plane renewal card from the copy review at
 * `explorations/membership-card-ui/renewal-states-copy-review.html` (Figma
 * 633:1614 / 633:3283 / 633:3340).
 *
 * A tier-gradient identity header (tier badge · status pill · product name ·
 * license line · tier glyph watermark bleeding off the right edge) over a white
 * body that answers ONE question — what happens next with this membership — and
 * a single action in the footer.
 *
 * The state machine, the copy, and the consistency rules live in
 * `membershipRenewalState.ts`; this file is just the chassis. Notes worth
 * keeping in view while editing:
 *   • The header says the tier ONCE. The badge names the tier, the title names
 *     the product ("Nursing CE Membership", not "Nursing CE Passport Lite
 *     Membership") — which also keeps the title on one line.
 *   • Every state carries a status pill, and the pill always says the access
 *     state in words, so it never depends on color alone.
 *   • The footer verb matches the body's verb (body "renew" → button "Renew
 *     now"), and names its object.
 *
 * `variant` picks which surface it is rendering on:
 *   • `list` (default) — a row in the "Your Memberships" sheet, sized to sit in
 *     a stack of peers, with the footer CTA that opens the Manage sheet.
 *   • `detail` — the SAME card leading the Manage sheet it just opened, in the
 *     FULL-BLEED form the sheet's old tinted band had: no radius, no shadow,
 *     edge to edge, sitting straight under the sheet's divider. It is the
 *     sheet's header, not a card floating inside it, so it drops the card
 *     chrome and takes the sheet's own 24px gutter. The footer goes too (you
 *     are already where it pointed) and the lead + notes step up to the sheet's
 *     type scale (15/700 over 13), because here the card is the one thing you
 *     opened rather than one of several you are scanning. Everything else —
 *     header, state, colours — is shared, which is the point: the object
 *     survives the transition instead of being restated.
 */
export function MembershipRenewalCard({
  record,
  selected = false,
  variant = 'list',
  detailLead,
  detailSlot,
  onSelect,
  onAction,
}: {
  record: MembershipRecord
  /** Marks this as the membership currently loaded elsewhere in the page. */
  selected?: boolean
  /** `list` (default) = a row in the Your Memberships sheet. `detail` = the
   *  same card leading the Manage sheet: no footer CTA, sheet-scale type. */
  variant?: 'list' | 'detail'
  /** Replaces the state's lead line in `detail` mode. Lets the Manage sheet
   *  render the card for a membership the state machine can say nothing about
   *  — a plan with no renewal date at all (STC) — instead of falling back to a
   *  different-looking header. */
  detailLead?: ReactNode
  /**
   * Renders only one half of the `detail` card, so the Manage sheet can PIN the
   * identity plane above its scroll area while the renewal detail scrolls under
   * it. Omitted ⇒ the whole card, which is what every other caller wants.
   *
   * It is two renders of ONE component rather than a separate pinned header,
   * because a separate header is the thing that drifts — the whole point of
   * carrying this card through was that the list and the sheet cannot disagree.
   *
   * `position: sticky` was tried first and cannot do this: a sticky element is
   * confined to its own parent, so once the ~150px card scrolled past, its
   * header went with it. The header has to genuinely live outside the scroller.
   */
  detailSlot?: 'header' | 'body'
  /** Card body → make this the active membership. Omit for a static card. */
  onSelect?: () => void
  /** The footer action. Receives the resolved state so the caller can branch on
   *  what was actually asked for (renew vs. update card vs. open the sheet). */
  onAction?: (state: MembershipRenewalState) => void
}) {
  // A record authored before the renewal fields existed degrades to a plain
  // expiry reading of `expiresOn` — never to a claimed auto-renewal.
  const renewal = record.renewal ?? renewalFallbackFor(record)
  const state = renewal ? renewalStateFor(renewal) : null
  // Resolved from a module-level map so the component identity is stable across
  // renders (calling tierCardGlyph() inline reads as creating a component during
  // render — the same reason MembershipRowCard keeps a TIER_GLYPH map).
  const Glyph = TIER_GLYPH[record.tone] ?? TIER_GLYPH.primary
  const interactive = onSelect != null
  const detail = variant === 'detail'
  // What the white body says. `detail` callers may supply their own lead/notes
  // for a membership the state machine can't describe; otherwise it is the
  // resolved state's. `list` always uses the state's, plus its charge
  // disclosure — that surface has no other place to put it.
  const lead = (detail ? detailLead : null) ?? state?.lead ?? null
  // The charge statement, named down to the card it lands on. Composed HERE
  // rather than passed in, so the Your Memberships list and the Manage sheet
  // cannot end up telling a learner two different things about one charge.
  //
  // Scoped to `auto-renews` deliberately: every other state either has no
  // charge coming (auto-renewal off, can't auto-renew) or has one that just
  // FAILED, and "$99 will be charged" is wrong in each.
  const chargeAmount = renewal && renewal.price > 0 ? `$${renewal.price}` : null
  const card = paymentMethodOnFile()
  const chargeLine =
    state?.id === 'auto-renews' && chargeAmount && card ? (
      <span style={chargeLineStyle}>
        {`${chargeAmount} will be charged to`}
        <CreditCard size={detail ? 15 : 13} aria-hidden />
        {card}
      </span>
    ) : null
  // With no card on file the state's own `chargeNote` carries the disclosure —
  // see `paymentMethodOnFile`. `list` keeps it; `detail` drops it, because that
  // sheet's lead already names the renewal date.
  const notes = state ? (detail ? state.notes : [...state.notes, state.chargeNote]) : null

  return (
    <div
      className="cre-mrc"
      {...(interactive
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-pressed': selected,
            'aria-label': `${record.profession} CE ${record.tierLabel} Membership${selected ? ' (currently selected)' : ''}`,
            onClick: onSelect,
            onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.()
              }
            },
          }
        : null)}
      style={{
        ...cardStyle,
        cursor: interactive ? 'pointer' : 'default',
        // `detail` IS the sheet's header, so it sheds the card chrome that
        // would make it read as a card floating inside one.
        ...(detail ? detailChromeStyle : null),
        // Selection is the brand primary — never the tier accent, which the
        // header gradient + badge already spend.
        ...(selected ? { boxShadow: '0 0 0 2px var(--color-primary-500)' } : null),
      }}
    >
      {detailSlot !== 'body' && (
      <div
        style={{
          ...(detail ? headerDetailStyle : headerStyle),
          background: tierCardBg(record.tone),
        }}
      >
        {/* Decorative tier glyph, bleeding off the right edge. The badge names
            the tier in text, so this is aria-hidden. */}
        <span aria-hidden style={watermarkStyle}>
          <Glyph size={98} aria-hidden />
        </span>
        <div style={headerTopStyle}>
          <MembershipBadge tone={record.tone} label={record.tierLabel} icon={Glyph} />
          {state && <span style={renewalPillStyle(state.pillTone)}>{state.pill}</span>}
        </div>
        {/* Tier said once: the badge has it, so the title carries the product. */}
        <h3 style={titleStyle}>{record.profession} CE Membership</h3>
        {/* Omitted rather than printed bare: the account-level header record has
            no license state for brands with no membership fixtures, and
            " license" on its own line reads as a bug. */}
        {record.state && <p style={licenseStyle}>{record.state} license</p>}
      </div>
      )}

      {detailSlot === 'header' ? null : lead != null || notes != null ? (
        <>
          <div style={detail ? bodyDetailStyle : bodyStyle}>
            <span
              aria-hidden
              style={{
                ...(detail ? iconDetailStyle : iconStyle),
                // No state ⇒ no severity to signal, so the glyph takes the
                // neutral action colour rather than an alarm one.
                color: state ? renewalIconColor(state) : 'var(--color-cta-500)',
              }}
            >
              {state ? (
                <RenewalStateIcon icon={state.icon} size={detail ? 18 : 16} />
              ) : (
                <ArrowsRotate size={detail ? 18 : 16} aria-hidden />
              )}
            </span>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  ...(detail ? leadDetailStyle : leadStyle),
                  ...(state ? renewalLeadTone(state) : null),
                }}
              >
                {lead}
              </p>
              {/* `detail` omits the state's own charge disclosure: the Manage
                  sheet composes its own (naming the card) via `detailNote`, and
                  states the date in its Next charge row. The disclosure stays on
                  `list`, where the card is the ONLY place the learner is told an
                  automatic charge is coming. */}
              {chargeLine ? (
                <p style={detail ? noteDetailStyle : noteStyle}>{chargeLine}</p>
              ) : (
                (notes ?? []).map(
                  (n) =>
                    n && (
                      <p key={n} style={detail ? noteDetailStyle : noteStyle}>
                        {n}
                      </p>
                    ),
                )
              )}
            </div>
          </div>
          {/* No footer on `detail`: its CTA opens the Manage sheet, and on that
              surface the card IS the Manage sheet's header. */}
          {!detail && state && (
            <div style={footStyle}>
              <button
                type="button"
                className="cre-mrc-cta"
                onClick={(e) => {
                  // Never let the action also select the card.
                  e.stopPropagation()
                  onAction?.(state)
                }}
                style={ctaStyle}
              >
                {state.cta} <ArrowRight size={15} aria-hidden />
              </button>
            </div>
          )}
        </>
      ) : (
        // No renewal data and an unparseable expiry — show the card's identity
        // rather than inventing a renewal story.
        <div style={bodyStyle}>
          <p style={noteStyle}>Renewal details unavailable.</p>
        </div>
      )}
    </div>
  )
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  // The sheet body is a scrolling flex COLUMN, whose children shrink by default
  // once the content overflows — without this the cards squashed into each other
  // and clipped their own body copy.
  flexShrink: 0,
  borderRadius: 'var(--radius-xl)',
  background: 'var(--color-surface-card)',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-card)',
  textAlign: 'left',
}

const headerStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  padding: '12px 20px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const watermarkStyle: CSSProperties = {
  position: 'absolute',
  right: -14,
  top: 24,
  color: 'rgb(255 255 255 / 0.10)',
  pointerEvents: 'none',
  lineHeight: 0,
}

const headerTopStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  flexWrap: 'wrap',
}

const titleStyle: CSSProperties = {
  position: 'relative',
  margin: '8px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '23px',
  color: 'var(--color-text-inverse)',
}

const licenseStyle: CSSProperties = {
  position: 'relative',
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  // 0.72 (not the Figma card's 0.62, which is only 4.44:1 on the gold ramp).
  color: 'rgb(255 255 255 / 0.72)',
}

const bodyStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 7,
  padding: '12px 20px 4px',
  flex: 1,
}

const iconStyle: CSSProperties = {
  flex: 'none',
  width: 16,
  height: 22,
  display: 'grid',
  placeItems: 'center',
}

const leadStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '18px',
  color: 'var(--color-neutral-darkest)',
}

const noteStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-neutral-800)',
}

/* ── `detail` overrides ──────────────────────────────────────────────────
   The list card's body is sized to be scanned in a stack and leans on the
   footer for its bottom padding; with the footer gone `detail` has to supply
   its own. Type steps up to the Manage sheet's own scale (its renewal lead was
   15/700 over 13) so the card reads as that sheet's opening statement rather
   than a row that wandered in. Colour moves to `text-primary` for the same
   reason the sheet used it: it is the adaptive token, and `neutral-darkest`
   inverts to near-white in the rebrand's dark theme. */

/** The charge statement. `inline-flex` so the glyph sits on the text's row, and
 *  wrapping is allowed so a long card label drops cleanly rather than
 *  overflowing the 480px panel. */
const chargeLineStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 6,
}

/** Full-bleed: square corners, no shadow. The sheet's divider above and the
 *  body's own padding below are what separate it — the same way the flat band
 *  it replaces was separated.
 */
const detailChromeStyle: CSSProperties = {
  borderRadius: 0,
  boxShadow: 'none',
}

/** Both planes take the SHEET's 24px gutter rather than the card's 20px, so the
 *  badge, the title and the lead all line up with the sheet title above and the
 *  Plan details box below. At 20px they sat 4px proud of everything else. */
const headerDetailStyle: CSSProperties = {
  ...headerStyle,
  padding: '12px 24px 14px',
}

const bodyDetailStyle: CSSProperties = {
  ...bodyStyle,
  gap: 10,
  padding: '14px 24px 16px',
}

const iconDetailStyle: CSSProperties = {
  ...iconStyle,
  width: 18,
}

const leadDetailStyle: CSSProperties = {
  ...leadStyle,
  fontSize: 15,
  fontWeight: 700,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const noteDetailStyle: CSSProperties = {
  ...noteStyle,
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}

const footStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '0 16px 10px',
}

const ctaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 32,
  padding: '0 2px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 600,
  lineHeight: '24px',
  color: 'var(--color-cta-500)',
}
