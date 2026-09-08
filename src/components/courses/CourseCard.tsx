import {
  AwardSolid,
  HourglassClock,
  Lock,
  Monitor,
  MoreVertical,
  PersonRunning,
  Podcast,
  Star,
  Video,
} from '@/icons'
import { useContext, useState } from 'react'
import type { ComponentType, CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { LoFiCardBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import { getCourseImage } from '@/utils/courseImage'
import {
  courseExpiryState,
  daysUntilIso,
  formatMilestoneDate,
  type CourseExpiryState,
} from '@/data/courseExpiry'
import { CourseStatusBadge } from './CourseStatusBadge'
import {
  certificateForCourse,
  certificatePdfUrl,
  certificateStateOf,
  type Certificate,
} from '@/data/certificateFixtures'
import { CertificateActionPanel } from '@/components/certificates/CertificateActionPanel'
import { AccountContext } from '@/context/AccountContext'
import { resolveStatusBadge } from './courseStatusBadgeUtil'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'

/**
 * Axis C — the lifecycle.
 *
 * ⚠ `'complete'` was RENAMED to `'completed'` (decision 32), not aliased. The
 * table, the filter tabs, the Learning Paths home and the reference card all say
 * "Completed"; this union was the lone outlier, and keeping both spellings alive
 * is how the split survived in the first place.
 *
 * `'failed'` is new here. The badge already existed in error tone on the live
 * card — the union was simply missing the value.
 */
export type CourseStatus = 'not-started' | 'in-progress' | 'completed' | 'failed'
export type CourseDelivery = 'online' | 'classroom' | 'video' | 'in-person' | 'podcast'

export type CourseCardData = {
  id: string
  title: string
  hours: number
  state: string
  delivery: CourseDelivery
  /** `non-credit` renders on the live card today; the union was missing it. */
  badge: 'mandatory' | 'elective' | 'non-credit'
  /** 0-100. Required when status === 'in-progress' */
  progress?: number
  status?: CourseStatus
  /**
   * Axis D — the time axis. These four sit on `CourseCardData` rather than only
   * on `MyCourseRecord` because the card renders from THIS type: My Courses
   * passes the full record, but the card only ever sees the card shape, so
   * without them the badge and the milestone dates are unreachable. All
   * optional — most courses have no clock and never completed or failed.
   */
  /** ISO yyyy-mm-dd. Absent ⇒ no expiry badge, ever. */
  expiresAt?: string
  /** ISO yyyy-mm-dd. Only used to clamp the warning window — see
   *  `warnWindowFor` in `courseExpiry.ts`. */
  enrolledAt?: string
  /** This course's own countdown in days; 60 when unset. Per course, not global. */
  warnDays?: number
  /** ISO yyyy-mm-dd. Required in practice when `status === 'completed'` — the
   *  status row reads `Completed: mm/dd/yyyy`. */
  completedOn?: string
  /** Final score %, when the platform knows it. The Failed badge renders
   *  without it; the status row just omits the number. */
  score?: number
  gated?: boolean
  /** Optional Purchase chip, e.g. for paid-but-not-purchased gated courses */
  purchaseChip?: boolean
  /** Background image url for the card image header */
  imageUrl?: string
  /** Optional star rating (e.g. 4.6) */
  rating?: number
  /** Optional price in dollars (e.g. 39) */
  price?: number
  /** Route to the issued certificate for a completed course. Drives the
   *  "View Certificate" link in the Learning Path detail panel — rendered only
   *  when the course is `complete` AND this is set. Stub target for the
   *  prototype (e.g. `/my-learning/certificates`). */
  certificateHref?: string
}

type Props = {
  data: CourseCardData
  /**
   * Catalog-style compact card. Used on My Courses where price is suppressed
   * (already purchased) and the price slot is replaced by a status + progress
   * bar. Title / metadata fonts shrink to match the catalog grid.
   */
  compact?: boolean
  /**
   * Denser take on the compact card — same anatomy (image header + title +
   * meta + progress) but a shorter image and collapsed padding/gaps. Used by
   * the Jump Back In "Medium" card-size variant. Implies `compact`.
   */
  dense?: boolean
  /**
   * Tighter take on `dense` — a shorter image and slimmer progress padding so
   * the card sits even shorter (used by the Dashboard Rebrand "Your Learning"
   * Jump Back In tile, sized to align with the Current Learning Path tracker
   * beside it). No effect without `dense`; scoped here so the classic
   * dashboard's dense JBI card is unaffected.
   */
  condensed?: boolean
  /**
   * "Jump Back In" selection marker — flags the course the learner left off
   * on (in-progress, or the next not-started) inside a Learning Path's
   * Mandatory carousel. Renders identically to a normal compact card but
   * carries a solid primary border and a "Jump Back In" badge beside the
   * kebab. Selection is the border; hover still zooms like every other card.
   * Implies `compact`.
   */
  jumpBackIn?: boolean
  /**
   * Media-left variant — a square cover image with the title beside it (title
   * wraps as needed), and the delivery / meta / progress data points stacked
   * full-width beneath. Used by the stacked Dashboard layout's Jump Back In
   * tile. Renders via `CompactCourseCard`; standalone of `dense`/`condensed`.
   */
  mediaLeft?: boolean
  /**
   * Fluid width — drop the compact card's fixed 265px `min-width` so it fills
   * its grid cell instead. Lets a responsive `minmax(…, 1fr)` grid pack more
   * (narrower) cards per row, e.g. the embedded My Courses grid (≥3 per row in
   * the rebrand shell's narrower content column).
   */
  fluid?: boolean
  /**
   * Color tone for the `mediaLeft` variant. `dark` drops the inner card's own
   * surface (so a themed parent shows through) and switches the text to light —
   * used when Jump Back In is on a primary/secondary band. Default `light`.
   */
  tone?: 'light' | 'dark'
  /**
   * Makes the whole card a clickable surface (opens the in-shell Learning
   * Launcher for the Dashboard Rebrand "Jump Back In" tile). When set, the card
   * root handles the click/keyboard activation and the title renders as plain
   * text (no `/courses/:id` link, since the card owns navigation). Only the
   * `mediaLeft` / `dense` JBI variants honor it.
   */
  onActivate?: () => void
  /**
   * Opens the course-details panel from the card's kebab. When set, the
   * `mediaLeft` / `dense` JBI variants render a kebab in the bottom-right; the
   * kebab stops propagation so it never triggers `onActivate`.
   */
  onKebab?: () => void
}

const DELIVERY_ICON: Record<CourseDelivery, typeof Monitor> = {
  online: Monitor,
  'in-person': Monitor,
  classroom: Monitor,
  video: Video,
  podcast: Podcast,
}

const DELIVERY_LABEL: Record<CourseDelivery, string> = {
  online: 'Online',
  'in-person': 'In Person',
  classroom: 'Classroom',
  video: 'Video',
  podcast: 'Podcast',
}

const BADGE_LABEL: Record<CourseCardData['badge'], string> = {
  mandatory: 'Mandatory',
  elective: 'Elective',
  'non-credit': 'Non-Credit',
}

const STATUS_LABEL: Record<CourseStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
}

/**
 * The status row's left-hand label. Milestone states carry their date in ONE
 * shared format — `{Label}: mm/dd/yyyy`, space after the colon, zero-padded,
 * four-digit year (decision 32). `Failed` carries a score instead of a date when
 * the platform has one, and just reads `Failed` when it doesn't.
 *
 * `expiryState` wins over `status` for the label ONLY when expired: an expired
 * course is still nominally not-started or in-progress, but the date it missed
 * is the thing worth saying.
 */
function statusRowLabel(
  status: CourseStatus,
  data: CourseCardData,
  expiryState: CourseExpiryState,
): string {
  if (expiryState === 'expired' && data.expiresAt) {
    return `Expired: ${formatMilestoneDate(data.expiresAt)}`
  }
  if (status === 'failed') {
    return typeof data.score === 'number' ? `Failed: ${Math.round(data.score)}%` : 'Failed'
  }
  if (status === 'completed' && data.completedOn) {
    return `Completed: ${formatMilestoneDate(data.completedOn)}`
  }
  return STATUS_LABEL[status]
}

/**
 * Cover filter. `gated` desaturates a Learning Path course the learner hasn't
 * unlocked; `expired` desaturates a little harder, because the whole card is
 * telling you access has ended. They can't co-occur in practice (gating is a
 * Learning Path concept, expiry a My Courses one) but expired wins if they ever
 * do — it is the state with a CTA attached.
 */
function coverFilter(gated: boolean | undefined, expiry: CourseExpiryState): string | undefined {
  if (expiry === 'expired') return 'grayscale(0.75) brightness(0.92)'
  return gated ? 'grayscale(0.6) brightness(0.95)' : undefined
}

/**
 * The status row — label left, percentage right, progress track beneath.
 * Shared by every shape so the three copies can't diverge — and EXPORTED,
 * because the post-purchase Course Details sheet has to say the same words in
 * the same order as the card that opened it. Two renderings of one status is
 * how the card ends up reading "Expired" beside a sheet showing a 45% bar.
 *
 * TWO THINGS HERE LOOK LIKE MISTAKES AND ARE NOT:
 *
 * 1. The bar's colour IS the status now — see `PROGRESS_FILL`. This used to say
 *    the opposite (decision 30: only Expiring Soon may colour it), and that
 *    rule was retired on 2026-09-08 when Completed went green, Failed went red
 *    and Expired went charcoal. The concern behind it was one-off exceptions
 *    diluting a single meaningful colour; a complete, deliberate mapping is a
 *    different thing. It only stays coherent while every state is in the map.
 *
 * 2. `expired` KEEPS its bar and its percentage, drawn in a dead charcoal
 *    (`--color-progress-fill-expired`). REVERSED 2026-09-08 — decision 27 used
 *    to hide both, on the reasoning that the LMS's re-enrolment behaviour is
 *    unknown and a frozen 45% would read as a promise the work comes back.
 *
 *    The call now is that the number is a RECORD of what the learner did, not
 *    an offer to resume it, and hiding it erased their effort to avoid a
 *    misreading. The charcoal is what carries that: it is the one fill that is
 *    not a brand colour, so the bar reads as inert rather than live. If this
 *    ever needs to be unambiguous in words as well, the sheet's expired notice
 *    is the place — not a second colour here.
 *
 *    ⚠ THE PRECONDITION IS STRUCTURAL, NOT CHECKED HERE. The rule is "expired
 *    AND not completed AND no certificate", and the last two are free:
 *    `courseExpiryState` returns `'none'` for a completed course before it ever
 *    looks at `expiresAt`, and the card only resolves a certificate when the
 *    status is `completed`. So an expired course can be neither. Pinned by
 *    `ExpiredProgress.test.ts` so that stays true if the resolver is reordered.
 *
 * `failed` showing 100% is also correct and not a bug: you finished the course,
 * you just didn't pass. Progress and score are different numbers, and the row
 * holds both — the score rides in the label (`Failed: 62%`).
 */
export function StatusRow({
  data,
  status,
  expiryState,
  fontSize,
  color,
  style,
}: {
  data: CourseCardData
  status: CourseStatus
  expiryState: CourseExpiryState
  fontSize: number
  /** Label colour override — the `mediaLeft` dark tone passes light text. */
  color?: string
  style?: CSSProperties
}) {
  const expired = expiryState === 'expired'
  // Completed and failed are both "you reached the end", so both read 100.
  const percent =
    status === 'completed' || status === 'failed' ? 100 : Math.round(data.progress ?? 0)
  /**
   * ⚠ SAME ORDER AS `resolveStatusBadge` — failed → expired → expiring-soon →
   * completed — on purpose, so the bar and the cover badge can never disagree
   * about which state a card is in. Two states genuinely can co-occur: a failed
   * course whose expiry has passed, or is near. Failed wins both, because the
   * clock stopped mattering the moment you didn't pass.
   *
   * `completed` sits last for the reason it does in the badge resolver: by the
   * time it is reached the expiry arms are already impossible, since
   * `courseExpiryState` returns `'none'` for a completed course.
   */
  const tone: ProgressTone =
    status === 'failed'
      ? 'failed'
      : expired
        ? 'expired'
        : expiryState === 'expiring-soon'
          ? 'warning'
          : status === 'completed'
            ? 'complete'
            : 'default'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          fontFamily: 'var(--font-body)',
          fontSize,
          fontWeight: 600,
          color,
        }}
      >
        <span>{statusRowLabel(status, data, expiryState)}</span>
        <span>{percent}%</span>
      </div>
      <ProgressBar value={percent} tone={tone} />
    </div>
  )
}

export function CourseCard({
  data,
  compact,
  dense,
  condensed,
  jumpBackIn,
  mediaLeft,
  fluid,
  tone,
  onActivate,
  onKebab,
}: Props) {
  const { loFi } = useLoFi()
  // Lo-Fi: keep the outer Card shell (so the grid layout and card
  // hover treatment stay intact) but replace the body with the
  // shared LoFiCardBody — grey image header + bars + footer rule.
  if (loFi) {
    return (
      <Card
        className="cre-course-card"
        style={{ minWidth: 265, minHeight: 384 }}
      >
        <LoFiCardBody ariaLabel="Lo-fi course card" />
      </Card>
    )
  }
  if (compact || dense || jumpBackIn || mediaLeft)
    return (
      <CompactCourseCard
        data={data}
        dense={dense}
        condensed={condensed}
        jumpBackIn={jumpBackIn}
        mediaLeft={mediaLeft}
        fluid={fluid}
        tone={tone}
        onActivate={onActivate}
        onKebab={onKebab}
      />
    )
  const DeliveryIcon = DELIVERY_ICON[data.delivery]
  const expiry = courseExpiryState(data, FIXTURE_TODAY)
  const badgeState = resolveStatusBadge(data.status, expiry)
  const daysLeft = daysUntilIso(data.expiresAt, FIXTURE_TODAY) ?? undefined
  return (
    <Card className="cre-course-card" style={{ minWidth: 265, minHeight: 384 }}>
      <div
        style={{
          position: 'relative',
          height: 138,
          background: `center / cover no-repeat url(${data.imageUrl ?? getCourseImage(data.id)})`,
          filter: coverFilter(data.gated, expiry),
        }}
      >
        {badgeState && <CourseStatusBadge state={badgeState} daysLeft={daysLeft} />}
        {data.purchaseChip && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-secondary-200)',
              color: 'var(--color-secondary-800)',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            PURCHASE
          </span>
        )}
        {data.gated && (
          <span
            aria-label="Gated course"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface-card)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Lock size={14} aria-hidden />
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: 16, gap: 8, flex: 1 }}>
        <Link
          to={`/courses/${data.id}`}
          className="cre-course-card-title"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '22px',
            textDecoration: 'none',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 44,
          }}
        >
          {data.title}
        </Link>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <span>{BADGE_LABEL[data.badge]}</span>
          <span aria-hidden style={{ width: 1, height: 14, background: 'var(--color-border-subtle)' }} />
          <span>
            {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
          </span>
        </div>
        {typeof data.rating === 'number' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Star size={14} aria-hidden style={{ color: 'var(--color-secondary-500)', fill: 'var(--color-secondary-500)' }} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{data.rating.toFixed(1)}</span>
          </span>
        )}
        {typeof data.price === 'number' && (
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 18,
              color: 'var(--color-text-primary)',
            }}
          >
            ${data.price.toFixed(2)}
          </span>
        )}
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>{data.state}</span>
        {data.status && (
          <StatusRow
            data={data}
            status={data.status}
            expiryState={expiry}
            fontSize={13}
            style={{ marginTop: 'auto' }}
          />
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '12px 16px',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <DeliveryIcon size={16} aria-hidden />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500 }}>
            {DELIVERY_LABEL[data.delivery]}
          </span>
        </span>
        <button
          type="button"
          aria-label={`More actions for ${data.title}`}
          className="cre-card-kebab"
        >
          <MoreVertical size={16} aria-hidden />
        </button>
      </div>
    </Card>
  )
}

/**
 * Compact / catalog-style variant used on the My Courses page.
 *
 * Visual parity with `IndividualCourseCard`: same image header, smaller title
 * (14/20), inline metadata column with delivery + badge | hours | state.
 * The footer slot that holds price on the catalog card is replaced by a
 * status + progress bar — these courses have already been purchased.
 */
function CompactCourseCard({
  data,
  dense = false,
  condensed = false,
  jumpBackIn = false,
  mediaLeft = false,
  fluid = false,
  tone = 'light',
  onActivate,
  onKebab,
}: {
  data: CourseCardData
  dense?: boolean
  condensed?: boolean
  jumpBackIn?: boolean
  mediaLeft?: boolean
  fluid?: boolean
  tone?: 'light' | 'dark'
  onActivate?: () => void
  onKebab?: () => void
}) {
  /**
   * The Certificate Details sheet, opened by the pending marker.
   *
   * Owned HERE rather than lifted to each page because the card already
   * resolves the certificate record, and the alternative is threading a
   * callback through every one of `CourseCard`'s call sites for a sheet that
   * only ever concerns this one card. `Sheet` portals and returns null when
   * closed, so an unopened one on every card costs nothing.
   *
   * It is the SAME panel the Course Details sheet opens (`CertificateActionPanel`,
   * titled "Certificate Details"), so the five pending reasons keep one
   * implementation no matter which surface you reach them from.
   */
  const [certPanel, setCertPanel] = useState<Certificate | null>(null)
  // Read the context DIRECTLY rather than through `useAccount()`, which throws
  // outside a provider. A card is a leaf rendered in many contexts — including
  // isolated test mounts — so it falls back to CRE the same way `Logo` does.
  // App code always has the provider.
  const brand = useContext(AccountContext)?.brand ?? 'xcel'
  const DeliveryIcon = DELIVERY_ICON[data.delivery]
  const status = data.status ?? 'not-started'
  const expiry = courseExpiryState(data, FIXTURE_TODAY)
  const badgeState = resolveStatusBadge(data.status, expiry)
  const daysLeft = daysUntilIso(data.expiresAt, FIXTURE_TODAY) ?? undefined
  /**
   * The status badge + the expired treatment render on the `compact` shape
   * only — the shapes with a cover big enough to hold a pill and a footer to
   * hold a CTA. `dense` / `condensed` / `mediaLeft` exist to hit specific
   * alignments (the Jump Back In tiles bottom-align with the Current Learning
   * Path tracker beside them), so an overlay or an extra footer row would break
   * the thing they were built for. `condensed` has no effect without `dense`,
   * so `!dense` covers it.
   */
  const coverShape = !dense && !mediaLeft
  const expired = expiry === 'expired'
  // When the card opens the in-shell launcher, the root surface handles
  // click + keyboard activation (Enter/Space). The title then renders as plain
  // text (see `renderTitle`) so there's no competing `/courses/:id` link.
  const activateProps = onActivate
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: onActivate,
        onKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onActivate()
          }
        },
      }
    : null
  // Title: a plain span when the card owns the click (`onActivate`), else the
  // standalone-course link. Shares the per-variant inline style.
  const renderTitle = (style: CSSProperties) =>
    onActivate ? (
      <span className="cre-course-card-title" style={style}>
        {data.title}
      </span>
    ) : (
      <Link to={`/courses/${data.id}`} className="cre-course-card-title" style={style}>
        {data.title}
      </Link>
    )
  // Kebab → course-details panel. Stops propagation so it never also fires the
  // card-level `onActivate`.
  const kebab = onKebab ? (
    <button
      type="button"
      aria-label={`More actions for ${data.title}`}
      className="cre-card-kebab"
      onClick={(e) => {
        e.stopPropagation()
        onKebab()
      }}
    >
      <MoreVertical size={16} aria-hidden />
    </button>
  ) : null

  // Media-left variant: a large square cover image with the title + delivery
  // and meta data points stacked beside it, and the progress bar full-width
  // beneath. Reuses the same data + ProgressBar as the stock card.
  if (mediaLeft) {
    // `dark` tone: drop the card's own surface so a themed parent shows through,
    // and switch text + dividers to light.
    const dark = tone === 'dark'
    const titleColor = dark ? 'var(--color-text-inverse)' : undefined
    const metaColor = dark ? 'rgb(255 255 255 / 0.85)' : undefined
    const dividerColor = dark ? 'rgb(255 255 255 / 0.3)' : 'var(--color-border-subtle)'
    return (
      <Card
        className="cre-course-card"
        {...activateProps}
        style={{
          ...(dark ? { background: 'transparent', border: 'none', boxShadow: 'none' } : null),
          ...(onActivate ? { cursor: 'pointer' } : null),
        }}
      >
        {/* Large square image + (title above the meta) beside it. */}
        <div style={{ display: 'flex', gap: 12, padding: '12px 14px 0', alignItems: 'flex-start' }}>
          <div
            aria-hidden
            style={{
              width: 96,
              height: 96,
              flexShrink: 0,
              borderRadius: 'var(--radius-md)',
              background: `center / cover no-repeat url(${data.imageUrl ?? getCourseImage(data.id)})`,
              filter: data.gated ? 'grayscale(0.6) brightness(0.95)' : undefined,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            {renderTitle({
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: '20px',
              textDecoration: 'none',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              color: titleColor,
            })}
            {/* Delivery + meta, stacked directly below the title. The meta row
                wraps as whole tokens (`whiteSpace: nowrap` per item) since the
                column is narrow beside the larger image. */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, color: metaColor }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                <DeliveryIcon size={16} aria-hidden />
                {DELIVERY_LABEL[data.delivery]}
              </span>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <span style={{ whiteSpace: 'nowrap' }}>{BADGE_LABEL[data.badge]}</span>
                <span aria-hidden style={{ width: 1, height: 12, background: dividerColor }} />
                <span style={{ whiteSpace: 'nowrap' }}>
                  {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
                </span>
                {data.state && (
                  <>
                    <span aria-hidden style={{ width: 1, height: 12, background: dividerColor }} />
                    <span style={{ whiteSpace: 'nowrap' }}>{data.state}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Status + progress bar. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            // Tighten the bottom padding when a kebab footer follows.
            padding: kebab ? '12px 14px 6px' : '12px 14px 14px',
          }}
        >
          <StatusRow
            data={data}
            status={status}
            expiryState={expiry}
            fontSize={12}
            color={titleColor}
          />
        </div>
        {/* Kebab → course-details panel, bottom-right (mirrors the LP cards). */}
        {kebab && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 8px 8px' }}>{kebab}</div>
        )}
      </Card>
    )
  }
  // Dense ("Medium" JBI card-size) collapses the image + paddings so the
  // card stays close to the full compact card but takes less height.
  // `condensed` tightens it further (shorter image, slimmer progress band)
  // so the Rebrand JBI tile aligns with the Current Learning Path tracker.
  const imageHeight = dense ? (condensed ? 60 : 96) : 138
  const bodyPadding = dense ? '10px 14px 0' : 16
  const bodyGap = dense ? 4 : 8
  // Dense card has no footer actions row, so give the progress section
  // extra vertical padding (above + below the bar) to keep the tile from
  // feeling cramped and to better fill the Jump Back In widget. The
  // condensed variant trims that padding back down to shrink overall height.
  const progressPadding = dense
    ? condensed
      ? '10px 14px 12px'
      : '16px 14px 24px'
    : '4px 16px 8px'
  // Jump Back In selection marker: a CTA-toned stroke that rests at the
  // 300 level and deepens to 500 (1.5px) on hover. Driven by the
  // `cre-course-card--jbi` class (see tokens.css) rather than inline so
  // the `:hover` rule can take over; the shared hover scale/shadow still
  // apply on top.
  const cardStyle = dense ? undefined : { minWidth: fluid ? 0 : 265, minHeight: 384 }
  /**
   * Corner marker chip beside the kebab. Exactly one, resolved in this order
   * (decision 5): Jump Back In → Certificate Pending → Certificate Issued →
   * nothing.
   *
   * 1 and 2 CAN NEVER COLLIDE, and that is what makes the order safe: the Jump
   * Back In course is by definition the one the learner left off on, so it is
   * in-progress or not-started — never complete — and the certificate arms only
   * fire on a completed course.
   *
   * ⚠ THE CERTIFICATE ARMS ARE DERIVED FROM THE CERTIFICATE RECORD, not from
   * the course being finished. Until 2026-09-05 this read a caller-supplied
   * `certificateIssued` boolean that `LearningPathPage` passed as
   * `course.status === 'complete'` — so the card asserted a certificate existed
   * purely because the course had ended, on the one surface that opted in, and
   * said nothing at all in My Courses. Both halves of that are now gone: the
   * marker is real, and it turns on wherever a completed course renders.
   *
   * NO CERTIFICATE ⇒ NO MARKER. Not "Issued". We do not know, and guessing is
   * the over-claim this replaced.
   */
  const cert = status === 'completed' ? certificateForCourse(brand, data.id) : null
  const certState = certificateStateOf(cert)
  /**
   * ⚠ `jumpBackIn` (the PROP) and "in progress" now render the SAME thing, and
   * that is deliberate. The prop marks the course the learner left off on
   * inside a Learning Path carousel — including, sometimes, the next
   * NOT-STARTED one, which is why it cannot simply be replaced by the status
   * check. The status check is the general case: any course you are part-way
   * through offers to resume.
   *
   * Consequence worth knowing: the carousel's selected card no longer has a
   * footer marker its neighbours lack, so SELECTION now rests entirely on the
   * `--jbi` border. That was already the primary signal ("Selection is the
   * border"), and one label meaning two different things — a marker on one
   * surface, an action on another — was the worse option.
   *
   * Expired is excluded structurally rather than here: an expired course is
   * still `status: 'in-progress'` in the data, but the footer renders
   * `enrolAgain` INSTEAD of `footerTag`, so it can never reach this. Access has
   * ended; offering to resume would be the promise the whole expired treatment
   * refuses to make.
   */
  const canResume = jumpBackIn || status === 'in-progress'
  const footerTag = canResume
    ? {
        Icon: PersonRunning,
        label: 'Jump Back In',
        tone: 'cta' as const,
        href: undefined,
        onClick: undefined,
        // Same destination as the card title. Two routes to one place is fine —
        // the title names the course, this one names the action.
        to: `/courses/${data.id}`,
      }
    : certState === 'pending'
      ? // The marker carries NO reason (decision 3). Never "Certificate Pending
        // — Survey Required": the five reasons live on the certificate page and
        // in the Course Details sheet. They also physically do not fit — the
        // footer slot has ~207px of usable width and the chip is `nowrap`,
        // while "Certificate Pending — Proctored Exam Required" measures ~327px,
        // so it would clip rather than wrap.
        //
        // No `href` either: a pending certificate does not exist yet, so there
        // is nothing to open. Only the issued arm is a link.
        {
          // An hourglass, not a warning triangle: nothing has gone WRONG — the
          // certificate is waiting on a step. The triangle read as an error on a
          // card that is otherwise reporting a completed course.
          //
          // `HourglassClock` is the only hourglass in `@/icons`; FA's plain
          // `hourglass` is not vendored here, and inventing path data is worse
          // than a slightly busier glyph at 12px.
          Icon: HourglassClock,
          label: 'Certificate Pending',
          tone: 'warning' as const,
          href: undefined,
          to: undefined,
          // Opens in place. The marker still carries NO reason (decision 3);
          // the sheet is where the five of them live.
          onClick: () => setCertPanel(cert),
        }
      : certState === 'issued'
        ? {
            Icon: AwardSolid,
            label: 'Certificate Issued',
            tone: 'primary' as const,
            // The one marker that names something the learner can open, so the
            // one that looks openable. Opens in a new tab — a certificate is a
            // document, not a place in the app.
            href: certificatePdfUrl(cert) ?? undefined,
            onClick: undefined,
            to: undefined,
          }
        : null
  /**
   * Expired takes the footer's left slot with an `Enrol again →` link.
   *
   * WORDING IS DELIBERATE AND NEUTRAL. Not "Restore access" — that implies the
   * work comes back. This is now the ONLY thing refusing that claim: the bar
   * beside it shows the learner's frozen 30% as of 2026-09-08, so the sentence
   * is carrying the whole distinction between "here is what you did" and "here
   * is what you get back". Do not soften it. A text link rather than a button
   * because it is a utility beside the content, not the card's primary action;
   * same treatment as every other link-style CTA in the app, with hover/focus
   * underline so it never reads as interactive by colour alone.
   *
   * It wins the slot over `footerTag`: an expired course can't be the Jump Back
   * In selection or hold a certificate, so in practice they never compete — but
   * if a fixture ever set both, the recovery path is the more useful thing.
   */
  const enrolAgain = coverShape && expired
  return (
    <>
    <Card
      className={
        jumpBackIn ? 'cre-course-card cre-course-card--jbi' : 'cre-course-card'
      }
      {...activateProps}
      style={{ ...cardStyle, ...(onActivate ? { cursor: 'pointer' } : null) }}
    >
      <div
        style={{
          position: 'relative',
          height: imageHeight,
          background: `center / cover no-repeat url(${data.imageUrl ?? getCourseImage(data.id)})`,
          filter: coverFilter(data.gated, coverShape ? expiry : 'none'),
        }}
      >
        {coverShape && badgeState && <CourseStatusBadge state={badgeState} daysLeft={daysLeft} />}
        {data.purchaseChip && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-secondary-200)',
              color: 'var(--color-secondary-800)',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            PURCHASE
          </span>
        )}
        {data.gated && (
          <span
            aria-label="Gated course"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-surface-card)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Lock size={14} aria-hidden />
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: bodyPadding, gap: bodyGap, flex: 1 }}>
        {renderTitle({
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: '20px',
          textDecoration: 'none',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: dense ? undefined : 40,
        })}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <DeliveryIcon size={16} aria-hidden />
            {DELIVERY_LABEL[data.delivery]}
          </span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <span>{BADGE_LABEL[data.badge]}</span>
            <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
            <span>
              {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
            </span>
            {data.state && (
              <>
                <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
                <span>{data.state}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Status + progress bar replaces the price slot (catalog footer position). */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: progressPadding }}>
        <StatusRow data={data} status={status} expiryState={expiry} fontSize={12} />
      </div>
      {/* Footer actions row (corner marker + kebab). Normally hidden on the
          dense (medium JBI) card to keep it minimal — but shown when the card
          provides a wired kebab (`onKebab`) so the Jump Back In tile gets its
          bottom-right ellipsis. */}
      {(!dense || kebab) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: enrolAgain || footerTag ? 'space-between' : 'flex-end',
            gap: 8,
            padding: '0 8px 8px',
          }}
        >
          {enrolAgain ? (
            <button
              type="button"
              className="cre-gift-cta"
              onClick={(e) => {
                e.stopPropagation()
                // TODO(flow): no re-enrolment path exists yet.
                console.info('course:enrol-again', data.id)
              }}
              style={{
                background: 'none',
                border: 'none',
                // 8, not 6 — the footer row's gutter is 8px short of the card
                // body's (see the certificate link above), so this owes the
                // same 8px back. At 6 it sat 2px left of the progress bar.
                padding: '0 8px',
                cursor: 'pointer',
                // Colour comes from `.cre-gift-cta` (tokens.css) — inline would
                // beat the theme blocks. See a11y C6.
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Enrol again →
            </button>
          ) : (
            footerTag && (
              <CardMarkerTag
                Icon={footerTag.Icon}
                label={footerTag.label}
                tone={footerTag.tone}
                href={footerTag.href}
                onClick={footerTag.onClick}
                to={footerTag.to}
              />
            )
          )}
          {kebab ?? (
            <button
              type="button"
              aria-label={`More actions for ${data.title}`}
              className="cre-card-kebab"
            >
              <MoreVertical size={16} aria-hidden />
            </button>
          )}
        </div>
      )}
    </Card>
    {/* Outside the Card, not inside it: `Sheet` portals to the body anyway, and
        nesting a dialog inside a card that can itself be `role="button"` is a
        nesting-interactives problem waiting to happen. */}
    <CertificateActionPanel
      open={certPanel !== null}
      onClose={() => setCertPanel(null)}
      data={certPanel}
    />
    </>
  )
}

/** Marker tone → its class (the rest + hover fills live in tokens.css, so the
 *  `.cre-course-card:hover` rule can take over) and its text/glyph colour.
 *  `warning` sits at a heavier fill percentage than the other two — see the
 *  note beside the hover rules in tokens.css. */
/**
 * Chip tone → its wash class. PARTIAL on purpose: `warning` has no entry
 * because "Certificate Pending" is a link now and links carry no fill, so the
 * chip path can never receive that tone. `.cre-tag-cert-pending` was deleted
 * with it — leaving the key would name a class that no longer exists.
 */
const MARKER_CLASS: Partial<Record<'primary' | 'cta' | 'warning', string>> = {
  primary: 'cre-tag-jbi',
  cta: 'cre-tag-cta',
}

/**
 * Colour for the INTERACTIVE (link / button) marker variants.
 *
 * ⚠ BOTH ARE THEME-AWARE TOKENS, and both had to be. The chip variant below
 * sits on its own tinted fill, so it could use a fixed dark stop; a link sits
 * directly on the card, which is white in light and navy in dark, so a fixed
 * stop fails one of them. `warning-800` — what the pending chip used — measures
 * 8.61:1 on the light card and **1.30–2.12:1 on the dark card across all six
 * brands** (a11y S27). `--color-status-warning-text` resolves warning-700 /
 * warning-300 and clears AA in both: 4.73 light, 7.80–12.74 dark.
 */
const LINK_COLOR: Record<'primary' | 'cta' | 'warning', string> = {
  primary: 'var(--color-accent-link)',
  cta: 'var(--color-accent-link)',
  warning: 'var(--color-status-warning-text)',
}

const MARKER_COLOR: Record<'primary' | 'cta' | 'warning', string> = {
  primary: 'var(--color-primary-700)',
  cta: 'var(--color-cta-700)',
  // -800, not -700: the warning ramp runs light, and this sits on a 100 fill.
  warning: 'var(--color-warning-800)',
}

/** Corner marker rendered beside a compact course card's kebab.
 *
 *  Two shapes, chosen by whether `href` is set:
 *
 *  • NO href — a chip. Mirrors the catalog's `.cre-tag-pro` "Included with
 *    Membership" pill (22px, 12/600) with a tinted wash that deepens on card
 *    hover. Used by "Jump Back In" and "Certificate Pending", neither of which
 *    goes anywhere: one is a selection marker, the other is a state you resolve
 *    on the certificates page, not here.
 *
 *  • WITH href — a text LINK in the brand CTA colour, no wash, underlining on
 *    hover and focus. "Certificate Issued" is the only marker that names a
 *    thing the learner can open, so it is the only one that looks openable.
 *
 *  ⚠ THE LINK COLOUR IS `--color-accent-link`, NOT `cta-500`. It is the same
 *  brand CTA ramp, at the stop that is actually legible: `cta-500` measures
 *  2.13:1 on McKissock's page background in the DEFAULT light theme and fails
 *  on five of six brands in dark (a11y C6, fixed 2026-09-08). `accent-link`
 *  resolves to `cta-700` light / `cta-200` dark, so one token covers both.
 *  Guarded by `LinkCtaContrast.test.ts` — do not "restore the brand colour".
 */
function CardMarkerTag({
  Icon,
  label,
  tone = 'primary',
  href,
  onClick,
  to,
}: {
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  label: string
  tone?: 'primary' | 'cta' | 'warning'
  /** Makes the marker a link, opened in a new tab. */
  href?: string
  /** Makes the marker a button that acts in place (opens a sheet). Wins over
   *  `href` if both are somehow passed — an in-page action is the more specific
   *  intent, and the two are never set together. */
  onClick?: () => void
  /** Makes the marker an in-app router link. Distinct from `href`, which is for
   *  leaving the app (the certificate document, in a new tab). */
  to?: string
}) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 22,
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '20px',
    whiteSpace: 'nowrap',
  }

  // Shared by both interactive variants, so the anchor and the button are
  // pixel-identical — the difference is only what activating them does.
  const linkStyle: CSSProperties = {
    ...base,
    // ⚠ KEEP THE 8px — it is alignment, not decoration, and dropping it
    // was reported. The footer row sits on an 8px gutter while the card
    // body sits on 16px, because the kebab is a 32px touch target whose
    // GLYPH has to land on 16: the box overhangs by 8 on each side. So
    // everything else in this row owes 8px back, which the chip variant
    // paid with its own padding. Without it this link started at 9px
    // against the progress bar's 17px and read as shifted left.
    padding: '0 8px',
    //
    // ⚠ NO `textDecoration` HERE. An anchor underlines by default, so the
    // resting `none` has to come from `.cre-tag-cert-link` in tokens.css —
    // inline it would BEAT the `:hover` rule on specificity and the
    // underline would never appear. That is the same trap that made the
    // `cta-500` link colours unfixable in CSS (a11y C6), one component
    // over, and it was reported here too.
    color: LINK_COLOR[tone],
  }

  if (to) {
    /**
     * A router `Link`, not a plain anchor — resuming a course is navigation
     * INSIDE the app, so a full page load would be wrong. Contrast the issued
     * marker, which leaves for a document and therefore is a real `<a>` with
     * `target="_blank"`.
     */
    return (
      <Link
        to={to}
        className="cre-tag-cert-link"
        // The card can itself be an activation surface (`onActivate`), and its
        // title already links to the same place. Without this, one click would
        // fire both.
        onClick={(e) => e.stopPropagation()}
        style={linkStyle}
      >
        <Icon size={12} aria-hidden />
        {label}
      </Link>
    )
  }

  if (onClick) {
    /**
     * A BUTTON, not an anchor — this opens a sheet in place, it does not go to
     * a URL. Styled identically to the issued link so the two markers read as
     * one family, but `<a href>` here would promise a destination, break
     * middle-click, and lie to assistive tech about what happens next.
     */
    return (
      <button
        type="button"
        className="cre-tag-cert-link"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <Icon size={12} aria-hidden />
        {label}
      </button>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        // A certificate is a document, not a place in the app — it opens
        // alongside the course list rather than navigating away from it.
        target="_blank"
        rel="noopener noreferrer"
        className="cre-tag-cert-link"
        // The card itself can be an activation surface (the Jump Back In tile
        // passes `onActivate`). Without this, opening your certificate would
        // also launch the course behind it.
        onClick={(e) => e.stopPropagation()}
        style={linkStyle}
      >
        <Icon size={12} aria-hidden />
        {label}
        {/* The new tab is announced, not just implied by the icon. */}
        <span className="cre-visually-hidden">(opens in a new tab)</span>
      </a>
    )
  }

  return (
    <span
      className={MARKER_CLASS[tone]}
      style={{
        ...base,
        padding: '0 8px',
        borderRadius: 'var(--radius-sm)',
        color: MARKER_COLOR[tone],
      }}
    >
      <Icon size={12} aria-hidden />
      {label}
    </span>
  )
}

type ProgressTone = 'default' | 'warning' | 'expired' | 'complete' | 'failed'

/**
 * What each fill means.
 *
 * ⚠ SUPERSEDES DECISION 30, which said Expiring Soon was the ONLY state allowed
 * to colour this bar — on the reasoning that once two states colour it, the
 * colour stops meaning "there is a clock on this" and starts meaning nothing.
 * That held while exactly one state was coloured. It is no longer the design:
 * Expired took charcoal on 2026-09-08, and Completed and Failed took green and
 * red the same day. The bar is now a status language, applied consistently —
 * which is a different thing from the one-off exception decision 30 was
 * guarding against, and only stays coherent if every state maps deliberately.
 *
 * So: add a state here, decide its colour here. Do not colour a bar at a call
 * site.
 */
const PROGRESS_FILL: Record<ProgressTone, string> = {
  // The bar as a pure quantity — how far through you are, in the brand colour.
  default: 'var(--color-progress-fill)',
  // A live clock. The only state where the colour is urging something.
  warning: 'var(--color-warning-500)',
  // The clock having run out: the same quantity, drawn dead. Deliberately the
  // one fill that is not a colour at all, so it reads as a record.
  expired: 'var(--color-progress-fill-expired)',
  complete: 'var(--color-progress-fill-complete)',
  failed: 'var(--color-progress-fill-failed)',
}

function ProgressBar({
  value,
  tone = 'default',
}: {
  value: number
  /** See `PROGRESS_FILL` for what each tone means and why they all exist. */
  tone?: ProgressTone
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        position: 'relative',
        height: 4,
        background: 'var(--color-neutral-100)',
        borderRadius: 'var(--radius-pill)',
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: PROGRESS_FILL[tone],
          borderRadius: 'var(--radius-pill)',
        }}
      />
    </div>
  )
}
