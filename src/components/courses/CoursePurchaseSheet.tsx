import { useState } from 'react'
import { ArrowRight, ChevronRight, Lock, Monitor, StarSolid } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { AddToCartToast, type AddToCartItem } from './AddToCartToast'
import { MembershipUpgradeModal } from '@/components/membership/MembershipUpgradeModal'
import { STATE_ABBR, type IndividualCourse } from '@/data/catalogFixtures'
import { useAccount } from '@/context/AccountContext'
import { resolveCommerceState } from '@/data/commerce/entitlement'
import { upsellOfferFor } from '@/data/commerce/upsellOffer'
import { courseDetailCopy } from '@/data/catalog/courseDetailCopy'
import { getCourseImage } from '@/utils/courseImage'
import {
  BADGE_LABEL,
  DELIVERY_ICON,
  DELIVERY_LABEL,
  INSTRUCTOR,
  VENUE,
  WEBINAR_INFO,
} from './courseSheetFixtures'

/**
 * The NEW non-member upsell flow (Figma node 468:18359 / 468:19045).
 *
 * Replaces the current single-screen "Purchase Course" sheet (`CourseSheet`)
 * with a two-step decision:
 *
 *   1  CHOOSE HOW TO ENROLL — a one-time purchase of just this course vs. the
 *      brand's membership, which includes this course. The membership option is
 *      pre-selected and carries a BEST VALUE pill, the struck-through list
 *      price, and three benefit lines.
 *   2  COMPLETE PURCHASE — a line-item summary of whichever option is selected
 *      plus the matching cart CTA.
 *
 * The course Description / Instructor / Schedule tabs move OUT of the purchase
 * screen and behind a "View Course Details →" link, which swaps the sheet body
 * in place (same pattern as `ManageEnrollmentPanel` — one sheet, two views, a
 * "‹ Back to Purchase" return). Keeping it in one sheet means the shopper never
 * loses their enroll selection to read the syllabus.
 *
 * Scope: this sheet is the PURCHASE case only. A member whose tier already
 * covers the course resolves to `included` and never reaches here — see
 * `CourseSheetSwitch`, which routes those viewers to the existing sheet.
 */

type Props = {
  open: boolean
  onClose: () => void
  data: IndividualCourse | null
}

type View = 'purchase' | 'details'
type Tab = 'description' | 'instructor' | 'schedule'

/** One-time-purchase price — always shows cents ("$19.00", never "$19"). */
function money(n: number): string {
  return `$${n.toFixed(2)}`
}

/** Membership price — cents only when non-zero ("$48", "$99.99"). */
function tierMoney(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`
}

/** Capitalize the first letter — for the step-2 summary's title-role line
 *  ("billed yearly" → "Billed yearly", matching "One-time purchase"). */
function capFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Renders a formatted price string with the cents raised as a smaller
 * superscript — "$14.⁰⁰", "$99.⁹⁹". A whole-dollar string ("$48") has no
 * cents, so it renders plain. `size` is the dollar font size in px; the cents
 * scale to ~0.6em of it.
 */
function PriceValue({ text, size = 17 }: { text: string; size?: number }) {
  const dot = text.indexOf('.')
  if (dot === -1) {
    return <span style={{ fontWeight: 700, fontSize: size }}>{text}</span>
  }
  return (
    <span style={{ fontWeight: 700, fontSize: size }}>
      {text.slice(0, dot)}
      <sup style={{ fontSize: '0.6em', fontWeight: 700 }}>{text.slice(dot)}</sup>
    </span>
  )
}

export function CoursePurchaseSheet({ open, onClose, data }: Props) {
  const { brand, tier } = useAccount()
  const [view, setView] = useState<View>('purchase')
  const [tab, setTab] = useState<Tab>('description')
  // The selected enroll option: 'one-time' or a membership tier id. One-time is
  // the default — the shopper opts UP into a plan rather than out of one.
  const [choice, setChoice] = useState<string>('one-time')
  const [toastOpen, setToastOpen] = useState(false)
  const [cartItem, setCartItem] = useState<AddToCartItem | null>(null)
  // A tier's "View Details" opens the brand's "Compare your Membership Options"
  // modal straight to the comparison grid.
  const [plansOpen, setPlansOpen] = useState(false)

  if (!data) return null

  const state = resolveCommerceState(brand, tier, data)
  const offer = upsellOfferFor(brand)
  const tiers = offer.tiers
  // A member-exclusive product has no à-la-carte price, so there is nothing to
  // buy one-time — the step opens on the recommended (best-value) tier instead.
  const oneTimeAvailable = state.kind === 'priced'
  const fallbackTierId = tiers.find((t) => t.bestValue)?.id ?? tiers[0]?.id ?? ''
  const choiceValid =
    choice === 'one-time' ? oneTimeAvailable : tiers.some((t) => t.id === choice)
  const effectiveChoice = choiceValid ? choice : oneTimeAvailable ? 'one-time' : fallbackTierId
  const isOneTime = effectiveChoice === 'one-time'
  const selectedTier = tiers.find((t) => t.id === effectiveChoice) ?? null

  const isLive = data.delivery === 'webinar' || data.delivery === 'in-person'
  const copy = courseDetailCopy(data.id, data.title)

  const sheetTitle = view === 'purchase' ? 'Purchase Course' : 'Course Details'

  // Always reopen on the purchase step — the details view is a detour, not a
  // destination, so a reopened sheet shouldn't resume there.
  const handleClose = () => {
    setView('purchase')
    setTab('description')
    onClose()
  }

  const handleAddToCart = () => {
    const statesStr = data.states.map((s) => STATE_ABBR[s] ?? s).join(' | ')
    setCartItem(
      !isOneTime && selectedTier
        ? {
            title: selectedTier.name,
            price: `${tierMoney(selectedTier.price)}/yr`,
            meta: [`${offer.catalogSize} courses`, selectedTier.billingNote],
          }
        : {
            title: data.title,
            imageUrl: data.imageUrl ?? getCourseImage(data.id),
            DeliveryIcon: DELIVERY_ICON[data.delivery] ?? Monitor,
            meta: [
              DELIVERY_LABEL[data.delivery],
              `${data.hours} ${data.hours === 1 ? 'Hour' : 'Hours'}`,
              statesStr,
            ].filter(Boolean),
            price: money(state.kind === 'priced' ? state.price : data.price),
          },
    )
    handleClose()
    setToastOpen(true)
  }

  // Step-2 summary — two stacked lines, same layout for both options: a
  // purchase-type / billing-cadence descriptor on top, the specific product
  // beneath.
  //   One-time → "One-time purchase" / <course title>
  //   Plan     → "Billed yearly"     / <plan name>
  const summaryTitle =
    !isOneTime && selectedTier ? capFirst(selectedTier.billingNote) : 'One-time purchase'
  const summarySub = !isOneTime && selectedTier ? selectedTier.name : data.title
  const summaryAmountText =
    !isOneTime && selectedTier
      ? tierMoney(selectedTier.price)
      : money(state.kind === 'priced' ? state.price : data.price)
  const summaryPeriod = !isOneTime && selectedTier ? selectedTier.period : undefined
  const ctaLabel = !isOneTime ? 'Add Membership to Cart' : 'Add Course to Cart'

  return (
    <>
      <Sheet open={open} onClose={handleClose} title={sheetTitle} width={472}>
        {/* Header + course summary share one tinted band (Figma: the top 300px
            of the purchase view, 261px of the details view). */}
        <div
          style={{
            flexShrink: 0,
            background: 'var(--color-neutral-extra-light)',
          }}
        >
          <div style={{ padding: '20px 24px 14px' }}>
            {view === 'purchase' ? (
              <BackLink onClick={handleClose} kind="close" label="Close" />
            ) : (
              <BackLink onClick={() => setView('purchase')} kind="back" label="Back to Purchase" />
            )}
            <h2
              style={{
                margin: '6px 0 0',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 24,
                lineHeight: 1.2,
                color: 'var(--color-primary-700)',
              }}
            >
              {sheetTitle}
            </h2>
          </div>
          <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />
          <CourseSummary
            data={data}
            isLive={isLive}
            onViewDetails={view === 'purchase' ? () => setView('details') : undefined}
          />
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            scrollbarGutter: 'stable',
            // Purchase view: white body under the tinted header. Details view:
            // the whole panel stays tinted (Figma neutral/075).
            background:
              view === 'purchase'
                ? 'var(--color-surface-card)'
                : 'var(--color-neutral-extra-light)',
          }}
        >
          {view === 'purchase' ? (
            <>
              <StepHeader step={1} label="Choose how to enroll" />
              <div
                style={{
                  padding: '16px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {oneTimeAvailable && (
                  <EnrollOption
                    selected={isOneTime}
                    onSelect={() => setChoice('one-time')}
                    title="One-time purchase"
                    subtitle="Just this course. No membership."
                    priceMain={money(state.price)}
                  />
                )}
                {tiers.map((t) => (
                  <EnrollOption
                    key={t.id}
                    selected={effectiveChoice === t.id}
                    onSelect={() => setChoice(t.id)}
                    title={t.name}
                    subtitle={t.subtitle}
                    priceMain={tierMoney(t.price)}
                    pricePeriod={t.period}
                    bestValue={t.bestValue}
                    onViewDetails={() => setPlansOpen(true)}
                  />
                ))}
              </div>

              <StepHeader step={2} label="Complete purchase" />
              <div style={{ padding: '16px 24px 18px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {summaryTitle}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 12,
                        fontWeight: 400,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {summarySub}
                    </span>
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      flexShrink: 0,
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <PriceValue text={summaryAmountText} size={20} />
                    {summaryPeriod && (
                      <span style={{ fontWeight: 400, fontSize: 13 }}>{`/${summaryPeriod}`}</span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 15,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-action)',
                    color: 'var(--color-text-inverse, #fff)',
                    border: 'none',
                    fontFamily: 'var(--font-body)',
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {ctaLabel}
                </button>
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    margin: '10px 0 0',
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <Lock size={12} aria-hidden />
                  Secure checkout · cancel anytime
                </p>
              </div>
            </>
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Course details"
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                <DetailTab active={tab === 'description'} onClick={() => setTab('description')}>
                  Description
                </DetailTab>
                <DetailTab active={tab === 'instructor'} onClick={() => setTab('instructor')}>
                  Instructor
                </DetailTab>
                {isLive && (
                  <DetailTab active={tab === 'schedule'} onClick={() => setTab('schedule')}>
                    Schedule
                  </DetailTab>
                )}
              </div>
              <div style={{ padding: '16px 30px 32px' }}>
                {tab === 'description' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <SubHead>Introduction</SubHead>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {copy.introduction}
                    </p>
                    <SubHead>What you&rsquo;ll learn</SubHead>
                    {copy.outcomes.map((line) => (
                      <CheckLine key={line} size={13}>
                        {line}
                      </CheckLine>
                    ))}
                  </div>
                )}
                {tab === 'instructor' && <InstructorTab />}
                {tab === 'schedule' && isLive && <ScheduleTab />}
              </div>
            </>
          )}
        </div>
      </Sheet>
      <AddToCartToast open={toastOpen} onClose={() => setToastOpen(false)} item={cartItem} />
      <MembershipUpgradeModal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        initialView="compare"
      />
    </>
  )
}

/* ─── header link ──────────────────────────────────────────────────────── */

function BackLink({
  onClick,
  kind,
  label,
}: {
  onClick: () => void
  kind: 'close' | 'back'
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cre-sheet-close"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'transparent',
        border: 'none',
        padding: 0,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 700,
        lineHeight: '20px',
        color: 'var(--color-action)',
        cursor: 'pointer',
      }}
    >
      {kind === 'close' ? (
        <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>
          ✕
        </span>
      ) : (
        <ChevronRight size={12} aria-hidden style={{ transform: 'scaleX(-1)' }} />
      )}
      {label}
    </button>
  )
}

/* ─── course summary ───────────────────────────────────────────────────── */

function CourseSummary({
  data,
  isLive,
  onViewDetails,
}: {
  data: IndividualCourse
  isLive: boolean
  /** Present only on the purchase view — the details view is already there. */
  onViewDetails?: () => void
}) {
  const DeliveryIcon = DELIVERY_ICON[data.delivery] ?? Monitor
  const imageUrl = data.imageUrl ?? getCourseImage(data.id)
  const isInPerson = data.delivery === 'in-person'
  const scheduleLine = isLive
    ? `${WEBINAR_INFO.dateRangeShort} · ${WEBINAR_INFO.sessionCount} Sessions`
    : data.schedule
  return (
    <div style={{ display: 'flex', gap: 14, padding: '14px 24px 14px' }}>
      <div
        aria-hidden
        style={{
          width: 96,
          height: 96,
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          background: `center / cover no-repeat url(${imageUrl})`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 18,
            lineHeight: 1.22,
            color: 'var(--color-text-primary)',
          }}
        >
          {data.title}
        </h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            columnGap: 6,
            rowGap: 2,
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-primary)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            <DeliveryIcon size={12} aria-hidden />
            {DELIVERY_LABEL[data.delivery]}
          </span>
          <Pipe />
          <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {BADGE_LABEL[data.badge]}
          </span>
          <Pipe />
          <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
          </span>
        </div>
        {scheduleLine && <MetaLine>{scheduleLine}</MetaLine>}
        <MetaLine>
          {INSTRUCTOR.name}, {INSTRUCTOR.title.split(',')[0]}
        </MetaLine>
        {isInPerson && (
          <>
            <MetaLine>{VENUE.name}</MetaLine>
            <MetaLine>{VENUE.cityStateZip}</MetaLine>
          </>
        )}
        {data.states.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--color-text-primary)',
            }}
          >
            {data.states.map((s, i) => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <Pipe />}
                {STATE_ABBR[s] ?? s}
              </span>
            ))}
          </div>
        )}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-primary)',
          }}
        >
          <StarSolid size={10} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
          {data.rating.toFixed(1)}
        </span>
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            style={{
              alignSelf: 'flex-start',
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: '24px',
              color: 'var(--color-action)',
              cursor: 'pointer',
            }}
          >
            View Course Details
            <ArrowRight size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}

function Pipe() {
  return (
    <span
      aria-hidden
      style={{ width: 1, height: 12, background: 'var(--color-neutral-300)', flexShrink: 0 }}
    />
  )
}

function MetaLine({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        color: 'var(--color-text-secondary)',
      }}
    >
      {children}
    </span>
  )
}

/* ─── step headers ─────────────────────────────────────────────────────── */

function StepHeader({ step, label }: { step: number; label: string }) {
  return (
    <div
      style={{
        background: 'var(--color-primary-800)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.66px',
          color: 'var(--color-text-inverse, #fff)',
        }}
      >
        {step}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.66px',
          textTransform: 'uppercase',
          color: 'var(--color-text-inverse, #fff)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

/* ─── enroll options ───────────────────────────────────────────────────── */

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: 20,
        height: 20,
        flexShrink: 0,
        borderRadius: 'var(--radius-pill)',
        border: `2px solid ${selected ? 'var(--color-primary-500)' : 'var(--color-neutral-300)'}`,
        background: 'var(--color-surface-card)',
      }}
    >
      {selected && (
        <span
          style={{
            position: 'absolute',
            inset: 3,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-primary-500)',
          }}
        />
      )}
    </span>
  )
}

/**
 * One enroll option row — the one-time purchase or a membership tier. Compact
 * style (Figma): radio + title + one-line subtitle (+ optional "View Details"
 * link for plans) with the price right-aligned. The best-value tier gets a
 * BEST VALUE pill overlapping the top edge + a faint brand-tint fill; the
 * SELECTED option (whichever it is) gets the primary border + filled radio.
 */
function EnrollOption({
  selected,
  onSelect,
  title,
  subtitle,
  priceMain,
  pricePeriod,
  bestValue = false,
  onViewDetails,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  subtitle: string
  priceMain: string
  /** "/ year" suffix for membership tiers; omit for the one-time price. */
  pricePeriod?: string
  bestValue?: boolean
  /** Present on membership tiers — renders the "View Details" link. */
  onViewDetails?: () => void
}) {
  return (
    <div style={{ position: 'relative', marginTop: bestValue ? 16 : 0 }}>
      {bestValue && (
        <span
          style={{
            position: 'absolute',
            top: -18,
            left: 16,
            zIndex: 1,
            padding: '3px 9px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-primary-500)',
            color: 'var(--color-text-inverse, #fff)',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.42px',
            whiteSpace: 'nowrap',
          }}
        >
          BEST VALUE
        </span>
      )}
      <label
        style={{
          display: 'block',
          // The SELECTED option gets a faint brand wash (+ its primary border);
          // unselected options sit on the plain card surface. Best-value is
          // marked by its pill + border, not a permanent fill.
          background: selected
            ? 'color-mix(in srgb, var(--color-primary-500) 6%, var(--color-surface-card))'
            : 'var(--color-surface-card)',
          border: `1.5px solid ${selected ? 'var(--color-primary-500)' : 'var(--color-border-subtle)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <RadioDot selected={selected} />
          <input
            type="radio"
            name="cre-enroll-choice"
            checked={selected}
            onChange={onSelect}
            className="cre-visually-hidden"
          />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--color-text-primary)',
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--color-text-secondary)',
              }}
            >
              {subtitle}
            </span>
            {onViewDetails && (
              <button
                type="button"
                // Prevent the wrapping <label> from toggling the radio when the
                // link is clicked — View Details is its own action.
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onViewDetails()
                }}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 2,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-action)',
                  cursor: 'pointer',
                }}
              >
                View Details
              </button>
            )}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'baseline',
              flexShrink: 0,
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            <PriceValue text={priceMain} size={17} />
            {pricePeriod && (
              <span style={{ fontWeight: 400, fontSize: 12 }}>{` / ${pricePeriod}`}</span>
            )}
          </span>
        </div>
      </label>
    </div>
  )
}

/* ─── shared bits ──────────────────────────────────────────────────────── */

/** A ✓-prefixed line. The glyph sits in its own cell so a wrapped second line
 *  aligns under the text, not under the checkmark. */
function CheckLine({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <span
      style={{
        display: 'flex',
        gap: 8,
        fontFamily: 'var(--font-body)',
        fontSize: size,
        lineHeight: 1.5,
        color: 'var(--color-text-primary)',
      }}
    >
      <span aria-hidden style={{ flexShrink: 0 }}>
        ✓
      </span>
      <span>{children}</span>
    </span>
  )
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h4
      style={{
        margin: 0,
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: 14,
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </h4>
  )
}

function DetailTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        background: 'transparent',
        border: 'none',
        padding: '10px 8px 0',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: active ? 700 : 400,
        color: active ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
      }}
    >
      <span>{children}</span>
      <span
        aria-hidden
        style={{
          width: '100%',
          height: 4,
          background: active ? 'var(--color-primary-600)' : 'transparent',
        }}
      />
    </button>
  )
}

function InstructorTab() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        lineHeight: 1.6,
        color: 'var(--color-text-secondary)',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          aria-hidden
          style={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 'var(--radius-pill)',
            background: `center / cover no-repeat url(${INSTRUCTOR.avatarUrl})`,
          }}
        />
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--color-text-primary)',
            }}
          >
            {INSTRUCTOR.name}
          </div>
          <div style={{ fontSize: 12 }}>{INSTRUCTOR.title}</div>
        </div>
      </div>
      <p style={{ margin: 0 }}>{INSTRUCTOR.bio}</p>
    </div>
  )
}

function ScheduleTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', fontSize: 13 }}>
      <p style={{ margin: '0 0 8px', color: 'var(--color-text-secondary)' }}>
        {WEBINAR_INFO.meetingCadence}
      </p>
      {WEBINAR_INFO.sessions.map((s) => (
        <div
          key={`${s.day}-${s.date}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '96px 1fr auto',
            gap: 12,
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
          }}
        >
          <span>{s.day}</span>
          <span>{s.date}</span>
          <span>{s.time}</span>
        </div>
      ))}
    </div>
  )
}
