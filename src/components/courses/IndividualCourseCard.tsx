import { useState } from 'react'
import { Monitor, Podcast, StarSolid, Users, Video } from '@/icons'
import { Card } from '@/components/ui/Card'
import type { IndividualCourse } from '@/data/catalog/types'
import {
  useAccount,
  defaultMemberTier,
  tierToneFor,
  tierLabelFor,
  type Membership as MembershipState,
  type MembershipTier,
  type MembershipTierTone,
} from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { resolveCommerceState } from '@/data/commerce/entitlement'
import { getCourseImage } from '@/utils/courseImage'
import { CourseSheetSwitch } from './CourseSheetSwitch'
import { ProductPriceSlot } from './ProductPriceSlot'
import { EnrolledBadge } from './EnrolledBadge'

const DELIVERY_ICON: Record<IndividualCourse['delivery'], typeof Monitor> = {
  online: Monitor,
  podcast: Podcast,
  'in-person': Users,
  webinar: Video,
}

const DELIVERY_LABEL: Record<IndividualCourse['delivery'], string> = {
  online: 'Online',
  podcast: 'Podcast',
  'in-person': 'In Person',
  webinar: 'Webinar',
}

const BADGE_LABEL: Record<IndividualCourse['badge'], string> = {
  mandatory: 'Mandatory',
  elective: 'Elective',
}

// Membership-tier tone → the accent-line color for included courses. The `-500`
// level reads as a clear but light accent (e.g. Elite low/Passport Lite →
// `--color-primary-500`). Brand-agnostic — resolves on each brand's ramp.
const TIER_LINE_COLOR: Record<MembershipTierTone, string> = {
  primary: 'var(--color-primary-500)',
  tertiary: 'var(--color-tertiary-500)',
  warning: 'var(--color-warning-500)',
  neutral: 'var(--color-neutral-400)',
}

type Props = {
  data: IndividualCourse
  /** Active membership state. When omitted, reads from AccountContext.
   *  'member' → "Included with Pro" badge in the footer.
   *  'non-member' → price in the footer.
   *  Either way, clicking the card opens a purchase sheet (see
   *  CourseSheetSwitch) which carries the actual Enroll / Add-to-Cart CTA. */
  membership?: MembershipState
  /** Per-brand state name → 2-letter abbreviation. */
  stateAbbr?: Record<string, string>
}

export function IndividualCourseCard({ data, membership, stateAbbr }: Props) {
  const account = useAccount()
  // Effective tier for the commerce resolver. Honor an explicit `membership`
  // override (legacy binary prop) while defaulting to the account's real tier;
  // a "member" override with a non-member account falls to the lowest tier.
  const effectiveTier: MembershipTier =
    membership == null
      ? account.tier
      : membership === 'non-member'
        ? 'non-member'
        : account.tier !== 'non-member'
          ? account.tier
          : defaultMemberTier(account.brand)
  const commerceState = resolveCommerceState(account.brand, effectiveTier, data)
  // Ownership is member-scoped: a non-member resolves to `priced`/`locked`, never
  // `included`, so they never read as "Enrolled".
  const isEnrolled = !!data.enrolled && commerceState.kind === 'included'
  // Included-in-membership accent (flag-gated): a slight cue that this product is
  // already covered by the member's current membership. `included` implies the
  // viewer is a member (the entitlement tier is at least the lowest member tier),
  // so `effectiveTier` is always a member tier here — its tone + label give the
  // membership-tier color (e.g. blue for Passport Lite) + a screen-reader phrase.
  const showIncludedAccent =
    useFeatureFlag('catalog-included-tier-line').enabled && commerceState.kind === 'included'
  const includedTierTone = tierToneFor(account.brand, effectiveTier)
  const includedTierLabel = tierLabelFor(account.brand, effectiveTier)
  const abbr = stateAbbr ?? {}
  const DeliveryIcon = DELIVERY_ICON[data.delivery]
  const [open, setOpen] = useState(false)
  return (
    <>
      <Card
        className="cre-course-card"
        style={{ minHeight: 320, cursor: 'pointer' }}
        // The whole card opens the details sheet — clicking ANYWHERE (title
        // included) opens it, so the card is the single button. A genuine
        // interactive control inside it (should one exist) still handles its
        // own click. Keyboard-activatable since the card carries no focusable
        // child anymore (the title is plain text, not a link).
        role="button"
        tabIndex={0}
        aria-label={data.title}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a, button')) return
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        <div
          style={{
            position: 'relative',
            height: 138,
            background: `center / cover no-repeat url(${data.imageUrl ?? getCourseImage(data.id)})`,
          }}
        >
          {isEnrolled && <EnrolledBadge placement="overlay" />}
          {showIncludedAccent && (
            <>
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 6,
                  background: TIER_LINE_COLOR[includedTierTone],
                }}
              />
              {/* Not color alone — a screen reader hears the entitlement. */}
              <span className="cre-visually-hidden">
                {`Included with your ${
                  includedTierLabel && includedTierLabel !== 'Member'
                    ? `${includedTierLabel} Membership`
                    : 'membership'
                }`}
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: 16, gap: 8, flex: 1 }}>
          {/* Plain text, NOT a link — the whole card opens the sheet, so the
              title must not be a competing navigation target (a <Link> would
              navigate on click before the card's handler could intervene). */}
          <span
            className="cre-course-card-title"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: '20px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: 40,
            }}
          >
            {data.title}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}>
              <DeliveryIcon size={16} aria-hidden />
              {DELIVERY_LABEL[data.delivery]}
            </span>
            {/* Badge | Hours | States — states sit inline with hours when
                there's room; the second span wraps together as a unit when
                there isn't (matches CourseSheet's metadata row pattern). */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '2px 6px',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <span>{BADGE_LABEL[data.badge]}</span>
                <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
                <span>
                  {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
                </span>
              </span>
              {data.states.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
                  <span>{data.states.map((s) => abbr[s] ?? s).join(' | ')}</span>
                </span>
              )}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}>
              <StarSolid size={12} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
              <span>{data.rating.toFixed(1)}</span>
            </span>
          </div>
          {data.schedule && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{data.schedule}</span>
              {data.delivery === 'in-person' && data.location && (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{data.location}</span>
              )}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            // Extra breathing room above the price so it clears the rating /
            // schedule line (was 4px).
            padding: '14px 16px 14px',
          }}
        >
          <ProductPriceSlot state={commerceState} fontSize={14} />
        </div>
      </Card>
      {/* Which purchase sheet opens is flag-driven — see CourseSheetSwitch
          (catalog-upsell-flow: Current vs. New upsell). */}
      <CourseSheetSwitch open={open} onClose={() => setOpen(false)} data={data} />
    </>
  )
}
