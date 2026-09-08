import { Fragment, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { CalendarDay, ChevronRight, CircleCheck, Clock } from '@/icons'
import { CompletedCelebration, type CompletedStat } from './CompletedCelebration'
import { useAccount } from '@/context/AccountContext'
import { useCourseLauncher } from '@/components/layout/CourseLauncherContext'
import { useDeviceFrame } from '@/components/layout/DeviceFrameContext'
import type { CourseCardData } from '@/components/courses/CourseCard'
import type { LearningPathSummary } from '@/data/learningFixtures'
import { statusTreatment, timeRemaining, type HomeStatus } from '@/components/learning/learningPathsHomeUtil'
import { CAT_MANDATORY_COLOR, CAT_ELECTIVE_COLOR } from '@/components/learning/progressGauge'
import { resolvePathCategories } from '@/components/learning/progressGaugeUtil'
import { LICENSE_TRACKER } from '@/data/dashboardFixtures'
import { myCoursesFor } from '@/data/myCoursesFixtures'
import { getCourseImage } from '@/utils/courseImage'
import { DiscoveryEmpty } from './JumpBackInDiscoveryEmpty'

/**
 * ClpJumpBackInBand — the full-width "Current Learning Path + Jump Back In"
 * band shown when the What's New carousel isn't occupying the top of the
 * dashboard (explorations/current-learning-path-fullwidth). One connected
 * card, no gap between halves:
 *   - LEFT (navy `primary-700`): a white eyebrow over a WHITE inner card
 *     (title + On Track pill, meta, big % + credit hours, a two-segment
 *     Mandatory/Elective bar, a legend, and a Details link), then two stat
 *     tiles (License Expires / Time Remaining).
 *   - RIGHT (white): Jump Back In — cover, resume course title/meta/progress,
 *     and the magenta "Resume course" CTA.
 *
 * Two variants (the approved D/E explorations) differ ONLY in the stat-tile
 * treatment on the navy:
 *   - `d` — solid white stat cards (dark text).
 *   - `e` — translucent "glass" tiles on the navy (icon + white text).
 *
 * Every color resolves to a brand token so the band relights per
 * `<html data-brand>`. Companion to LearnerFocusedBand / MarketingFocusedBand;
 * swapped into MembershipOverview's `topBand` by the `dashboard-clp-fullwidth`
 * flag.
 */
type Props = {
  path: LearningPathSummary
  /** Which stat-tile treatment: `d` white cards, `e` glass tiles on navy. */
  variant?: 'd' | 'e'
  /** HOME layout exploration (only meaningful with `hideHeader`). `current` is
   *  today's navy band. `v1` drops the dark background — one white surface with a
   *  divider before Jump Back In. `v2` moves the status pill up beside the name,
   *  hides the status-message strip, and tightens the Jump Back In column. `v3`
   *  adds a Completed Hours stat tile. Variant-only; driven by the
   *  `dashboard-clp-layout` flag. */
  layout?: 'current' | 'v1' | 'v2' | 'v3'
  /** Drops the navy Current Learning Path side entirely — renders a single
   *  full-width Jump Back In band (cover left, content right). When set, the
   *  `variant` (D/E) is ignored since there are no navy stat tiles. */
  jumpBackInOnly?: boolean
  /** Course to resume (Jump Back In); falls back to the brand's first
   *  in-progress course. */
  course?: CourseCardData
  /** Total learning-path count — drives "View All (N)". */
  pathsCount?: number
  showViewAll?: boolean
  onViewAll?: () => void
  /** Suppress the navy card's internal "Current Learning Path" eyebrow + View
   *  All row — the HOME tile renders that header OUTSIDE the band (above it, as
   *  a section lead matching "Featured"), so the band drops its own. */
  hideHeader?: boolean
  /** Opens the Learning Path detail panel from the "Details" link. */
  onViewDetails?: () => void
  /** Opens the full Learning Path page for this path (in-shell section switch),
   *  from the V1 card's clickable title. Falls back to `onViewDetails` when
   *  unset. */
  onOpenLearningPath?: (pathId: string) => void
  /** Full-bleed hero treatment (`dashboard-hero-bleed`). */
  bleed?: boolean
  /** Explicit status (from the `dashboard-progress-state` persona). */
  statusOverride?: HomeStatus
  /** Demo renewal override (persona): the Deadline + Time Remaining cells. */
  renewal?: { deadline: string; weeksLeft: number }
  /** Renewal-ready treatment (100% complete): a "View certificate" CTA. */
  renewalReady?: boolean
  /** Interest / modality chips shown after the setup wizard completes. */
  interestChips?: string[]
  /** Jump Back In slot mode (from the progress-state persona). When omitted it
   *  auto-derives from the resume course: an in-progress course → `resume`, a
   *  not-started course → `up-next`. `discovery` renders the "nothing to resume
   *  or launch" empty state with a Browse Catalog CTA. */
  jumpBackInMode?: 'resume' | 'up-next' | 'discovery'
  /** Copy tone for the `discovery` empty state — `completed` (all caught up) vs
   *  `new` (get started). Defaults to `new`. */
  discoveryTone?: 'completed' | 'new'
  /** Opens the Course Catalog (in-shell rail section) from the discovery empty
   *  state's Browse Catalog CTA. */
  onBrowseCatalog?: () => void
  /** Opens the Certificates page (in-shell rail section) from the completed
   *  state's secondary "View Certificate" button. */
  onViewCertificate?: () => void
}

// Full-bleed hero — cancel the shell's 24px top + 40px left gutters and cross
// the empty right filler beyond the 1440px content cap (matches the sibling
// bands' bleed math).
const HERO_BLEED: CSSProperties = {
  marginTop: -24,
  marginLeft: -40,
  marginRight: 'calc(-40px - max(0px, (100vw - 1440px)))',
  borderRadius: 0,
  boxShadow: 'none',
}

const ON_DARK = 'rgb(255 255 255 / 1)'
const ON_DARK_MUTED = 'rgb(255 255 255 / 0.72)'
const ON_DARK_LINE = 'rgb(255 255 255 / 0.14)'

const DELIVERY_LABEL: Record<string, string> = {
  online: 'Online',
  'in-person': 'In Person',
  classroom: 'Classroom',
  video: 'Video',
  podcast: 'Podcast',
}

const eyebrowBase: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

// V1 License-Expires display: MM/DD/YYYY → "Aug. 28, 2027" (abbreviated month +
// period, per Figma 441:56). Any other shape passes through unchanged.
const MONTHS_ABBR = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
function formatDeadlineV1(value: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim())
  const month = m ? MONTHS_ABBR[Number(m[1]) - 1] : undefined
  return m && month ? `${month} ${Number(m[2])}, ${m[3]}` : value
}


export function ClpJumpBackInBand({
  path,
  variant = 'd',
  layout = 'current',
  jumpBackInOnly = false,
  course,
  pathsCount,
  showViewAll = false,
  onViewAll,
  hideHeader = false,
  onViewDetails,
  onOpenLearningPath,
  bleed = false,
  statusOverride,
  renewal,
  renewalReady = false,
  interestChips,
  jumpBackInMode,
  discoveryTone = 'new',
  onBrowseCatalog,
  onViewCertificate,
}: Props) {
  const { brand, user } = useAccount()
  const launcher = useCourseLauncher()
  const device = useDeviceFrame().device
  const mobile = device === 'mobile'
  const stack = mobile || device === 'tablet'

  const resume = course ?? myCoursesFor(brand).find((c) => c.myStatus === 'in-progress')

  // Jump Back In slot mode. Explicit persona mode wins; otherwise auto-derive
  // from the resume course (a not-started course is "Up Next", a partial one is
  // "Resume"). `discovery` is persona-driven only — non-persona callers with no
  // resume course keep the plain "nothing in progress" line below.
  const mode: 'resume' | 'up-next' | 'discovery' =
    jumpBackInMode === 'discovery'
      ? 'discovery'
      : jumpBackInMode === 'up-next'
        ? 'up-next'
        : jumpBackInMode === 'resume'
          ? 'resume'
          : resume && (resume.status === 'not-started' || !resume.progress)
            ? 'up-next'
            : 'resume'
  const isUpNext = mode === 'up-next'
  const jbiEyebrow = isUpNext ? 'Up Next' : 'Jump Back In'
  const jbiCta = renewalReady ? 'View certificate' : isUpNext ? 'Launch course' : 'Resume course'

  // The learner has finished the plan — celebrate. Either `renewalReady` (100%
  // via the progress persona) or the "all caught up" discovery/completed tone
  // lands here and gets the green success treatment (Option 5): a green
  // celebration left half + the white all-caught-up action panel on the right.
  const completed = renewalReady || (mode === 'discovery' && discoveryTone === 'completed')

  const mandatory = path.mandatory ?? { completed: 0, required: 0 }
  const elective = path.elective ?? { completed: 0, required: 0 }
  // Education-type-aware labels (CE defaults when the path omits them).
  const mandatoryLabel = path.mandatoryLabel ?? 'Mandatory'
  const electiveLabel = path.electiveLabel ?? 'Elective'
  const deadlineLabel = path.deadlineLabel ?? 'License Expires'
  // QE / exam-prep paths use a non-"License Expires" deadline label (e.g.
  // "Target Date"). For those we drop the "N of M hours complete" caption under
  // the bar — it just repeats the "N / M credit hours" already shown by the %.
  const isQe = deadlineLabel !== 'License Expires'
  // Resolve to the generalized category list (explicit categories or the
  // Mandatory/Elective pair); totals come from it so >2-category paths compute
  // the correct overall %.
  const cats = resolvePathCategories(path)
  const totalRequired = cats.reduce((s, c) => s + c.required, 0)
  const totalCompleted = cats.reduce((s, c) => s + c.completed, 0)
  const percent = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : path.progressPct
  // Dashboard breakdown rule: the segmented bar + legend render ONLY for exactly
  // two categories; more than two show the overall-% bar here (the full list
  // lives in the detail panel).
  const hasBreakdown = cats.length === 2 && cats.every((c) => c.required > 0)
  const mPct = totalRequired > 0 ? (mandatory.completed / totalRequired) * 100 : 0
  const ePct = totalRequired > 0 ? (elective.completed / totalRequired) * 100 : 0

  const { expires } = LICENSE_TRACKER
  const weeksLeft = renewal?.weeksLeft ?? LICENSE_TRACKER.weeksLeft
  const expiresMonth = expires.month.charAt(0) + expires.month.slice(1, 3).toLowerCase()
  const deadline = renewal?.deadline ?? `${expiresMonth} ${expires.day}, ${expires.year}`
  // Shared with the Learning Path detail sheet's "Time Remaining" — under 30
  // days it drops to a day countdown ("21 days"), so the band + sheet agree.
  const timeRemain = timeRemaining(weeksLeft)
  const timeLeft = timeRemain.expired ? (
    <>Expired</>
  ) : (
    <>
      {timeRemain.segments.map((seg, i) => (
        <Fragment key={seg.unit}>
          {i > 0 ? ', ' : ''}
          <b>{seg.value}</b> {seg.unit}
        </Fragment>
      ))}
    </>
  )

  const derivedStatus: HomeStatus = percent >= 50 || weeksLeft > 16 ? 'on-track' : weeksLeft >= 6 ? 'at-risk' : 'off-track'
  const homeStatus: HomeStatus = statusOverride ?? derivedStatus
  // Shared treatment (the same source the badge + Details panel use) so all six
  // states render correctly — previously not-started/expired fell back to green.
  const status = statusTreatment(homeStatus)

  const meta = [path.category, ...(path.state ? [path.state] : []), `${path.hours} Hours`]
  const resumePct = typeof resume?.progress === 'number' ? resume.progress : 0
  const glass = variant === 'e'

  // HOME layout exploration (only applied in the `hideHeader` Home band; the
  // consumer only passes a non-`current` layout there). v1 flattens the navy
  // frame to one white surface with a divider before Jump Back In; v2 tightens
  // the Jump Back In column; v3 adds a Completed Hours stat tile.
  const lpV1 = layout === 'v1'
  const lpV2 = layout === 'v2'
  const lpV3 = layout === 'v3'
  // The status pill always renders beside the path title on the Home band. The
  // supporting status message + the Time Remaining urgency tint live only in the
  // Learning Path Details sheet — the Home band stays a clean summary.
  const showCardPill = true

  // Shared card chrome (bleed / mobile / radius) reused by both layouts.
  const cardChrome: CSSProperties = mobile
    ? { marginLeft: -16, marginRight: -16, borderRadius: 0 }
    : bleed
      ? HERO_BLEED
      : {
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 18px 40px -18px color-mix(in srgb, var(--color-primary-900) 55%, transparent)',
        }

  // ── Jump Back In only ── the Current Learning Path side is dropped; a single
  // full-width band with the course cover on the left and the resume content
  // (title / meta / progress / CTA) on the right. Stacks on tablet + mobile.
  if (jumpBackInOnly) {
    return (
      <section
        aria-label="Jump back in"
        className="cre-clp-jbi-band"
        style={{
          display: 'grid',
          gridTemplateColumns: stack ? 'minmax(0, 1fr)' : 'minmax(0, 440fr) minmax(0, 560fr)',
          background: 'var(--color-surface-card)',
          overflow: 'hidden',
          ...cardChrome,
        }}
      >
        {mode === 'discovery' ? (
          <div style={{ gridColumn: stack ? 'auto' : '1 / -1' }}>
            <DiscoveryEmpty
              tone={discoveryTone}
              onBrowseCatalog={onBrowseCatalog}
              padding={stack ? '22px 24px 28px' : '40px 34px'}
              firstName={hideHeader ? user.firstName : undefined}
            />
          </div>
        ) : resume ? (
          <>
            {/* cover */}
            <div
              aria-hidden
              style={{
                minHeight: stack ? 180 : 260,
                borderRight: stack ? 'none' : '1px solid var(--color-border-subtle)',
                borderBottom: stack ? '1px solid var(--color-border-subtle)' : 'none',
                background: `center / cover no-repeat url(${resume.imageUrl ?? getCourseImage(resume.id)})`,
              }}
            />
            {/* content */}
            <div
              style={{
                padding: stack ? '22px 24px 24px' : '30px 34px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <p style={{ ...eyebrowBase, color: 'var(--color-text-secondary)' }}>{jbiEyebrow}</p>
              <h3
                style={{
                  margin: '12px 0 0',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 24,
                  lineHeight: 1.16,
                  color: 'var(--color-text-primary)',
                }}
              >
                {resume.title}
              </h3>
              <p
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {DELIVERY_LABEL[resume.delivery]} · {resume.badge === 'mandatory' ? 'Mandatory' : 'Elective'}
                {resume.state ? ` · ${resume.state}` : ''}
                {!isUpNext && typeof resume.progress === 'number' ? ` · ${resume.progress}% complete` : ''}
              </p>
              {!isUpNext && (
                <div
                  style={{
                    height: 8,
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-neutral-100)',
                    overflow: 'hidden',
                    margin: '16px 0 20px',
                    maxWidth: 520,
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${resumePct}%`,
                      background: 'var(--color-progress-fill)',
                    }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => (renewalReady ? console.info('cta:view-certificate') : launcher.open(resume.id))}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: isUpNext ? 20 : 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 48,
                  padding: '0 26px',
                  borderRadius: 'var(--radius-md)',
                  border: 0,
                  cursor: 'pointer',
                  background: 'var(--color-cta-500)',
                  color: 'rgb(255 255 255 / 1)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {jbiCta}
              </button>
            </div>
          </>
        ) : (
          <p
            style={{
              padding: stack ? '22px 24px' : '30px 34px',
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--color-text-secondary)',
            }}
          >
            You don't have anything in progress.
          </p>
        )}
      </section>
    )
  }

  // ── Completed celebration (Option 5) ── the plan is finished: the shared green
  // success left half (medallion + heading + requirement stats + a secondary
  // "View Certificate" under the details) joined to the white "all caught up"
  // panel (Browse Catalog) on the right.
  if (completed) {
    const completedStats: CompletedStat[] = [
      ...(hasBreakdown
        ? [
            { label: mandatoryLabel, value: `${mandatory.completed} / ${mandatory.required}` },
            { label: electiveLabel, value: `${elective.completed} / ${elective.required}` },
          ]
        : []),
      { label: deadlineLabel, value: deadline },
      { label: 'Time Remaining', value: timeLeft },
    ]
    return (
      <section
        aria-label="Learning path complete"
        className="cre-clp-jbi-band"
        style={{
          display: 'grid',
          gridTemplateColumns: stack ? 'minmax(0, 1fr)' : 'minmax(0, 560fr) minmax(0, 420fr)',
          ...cardChrome,
          overflow: 'hidden',
        }}
      >
        <CompletedCelebration
          title={path.title}
          creditHoursTotal={totalRequired || path.hours}
          stats={completedStats}
          onViewDetails={onViewDetails}
          showViewAll={showViewAll}
          onViewAll={onViewAll}
          pathsCount={pathsCount}
          hideHeader={hideHeader}
        />

        {/* ── RIGHT · white · all caught up ── */}
        <div
          style={{
            background: 'var(--color-surface-card)',
            // Match the left half's bottom padding so the bottom-aligned Browse
            // Catalog CTA lines up with the View Certificate CTA over there.
            padding: '24px 26px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {/* `align="end"` bottom-packs the block; View Certificates sits to the
              LEFT of Browse Catalog (both on this white panel). */}
          <DiscoveryEmpty
            tone="completed"
            onBrowseCatalog={onBrowseCatalog}
            onViewCertificate={onViewCertificate}
            compact
            align="end"
            firstName={hideHeader ? user.firstName : undefined}
          />
        </div>
      </section>
    )
  }

  // ── V1 redesign (`layout="v1"`) — Figma 441:56. A flatter white
  //    card: brand-blue path title, the % lifted to the top-right above a
  //    full-width segmented bar, the credit line beside the Mandatory/Elective
  //    legend, compact left-aligned stat tiles with a "View Details ›" link, and
  //    a media-left Jump Back In (cover left · copy right) with a full-width CTA
  //    pinned to the base. Only the Not Started / On Track / At Risk states reach
  //    here (Completed → CompletedCelebration, Expired → ExpiredCycleBand).
  if (hideHeader && lpV1) {
    const v1Cta = isUpNext ? 'Launch Course' : 'Resume Course'
    return (
      <section
        aria-label="Your learning"
        className="cre-clp-jbi-band"
        style={{
          display: 'grid',
          gridTemplateColumns: stack ? 'minmax(0, 1fr)' : 'minmax(0, 560fr) minmax(0, 420fr)',
          ...(mobile
            ? { marginLeft: -16, marginRight: -16, borderRadius: 0 }
            : bleed
              ? HERO_BLEED
              : {
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: '0 1px 3px rgb(0 0 0 / 0.08)',
                  border: '1px solid var(--color-border-subtle)',
                }),
          overflow: 'hidden',
        }}
      >
        {/* ── LEFT · Current Learning Path ── */}
        <div style={{ background: 'var(--color-surface-card)', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* title + status pill */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0 }}>
                {onOpenLearningPath || onViewDetails ? (
                  <button
                    type="button"
                    // The title opens the full Learning Path page for this path;
                    // the "View Details ›" link keeps opening the quick detail
                    // panel. Falls back to the detail panel if the page opener
                    // isn't wired.
                    onClick={() =>
                      onOpenLearningPath ? onOpenLearningPath(path.id) : onViewDetails?.()
                    }
                    title={onOpenLearningPath ? 'Open learning path' : undefined}
                    className="cre-clp-title-link"
                    style={{ background: 'none', border: 'none', padding: 0, margin: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 21, lineHeight: 1.18 }}
                  >
                    {path.title}
                  </button>
                ) : (
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 21, lineHeight: 1.18, color: 'var(--color-primary-600)' }}>{path.title}</span>
                )}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {meta.map((m, i) => (
                  <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                    {i > 0 && <span aria-hidden style={{ width: 1, height: 11, background: 'var(--color-border-subtle)' }} />}
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <span
              style={{
                flex: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: status.text,
                background: status.outline ? 'transparent' : status.fill,
                boxShadow: status.outline ? `inset 0 0 0 1px ${status.border}` : undefined,
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              {status.icon && <status.icon size={12} aria-hidden />}
              {status.label}
            </span>
          </div>

          {/* % (top-right) → bar → legend + credit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 34, lineHeight: 1, color: 'var(--color-text-primary)' }}>{percent}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--color-neutral-100)', overflow: 'hidden', display: 'flex' }}>
              {hasBreakdown ? (
                <>
                  <span style={{ width: `${mPct}%`, background: CAT_MANDATORY_COLOR }} />
                  <span style={{ width: `${ePct}%`, background: CAT_ELECTIVE_COLOR }} />
                </>
              ) : (
                <span style={{ width: `${percent}%`, background: 'var(--color-progress-fill)' }} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              {hasBreakdown ? (
                <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-body)', fontSize: 13, flexWrap: 'wrap' }}>
                  <LegendItem color={CAT_MANDATORY_COLOR} label={mandatoryLabel} value={`${mandatory.completed}/${mandatory.required}`} />
                  <LegendItem color={CAT_ELECTIVE_COLOR} label={electiveLabel} value={`${elective.completed}/${elective.required}`} />
                </div>
              ) : (
                <span />
              )}
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                <b style={{ color: 'var(--color-text-primary)' }}>{totalCompleted}</b> / {totalRequired || path.hours} credit hours
              </span>
            </div>
          </div>

          {/* stat tiles (compact, left) + View Details (right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 'auto', paddingTop: 14 }}>
            <div style={{ display: 'flex', gap: 14, flex: '0 1 auto', minWidth: 0 }}>
              <StatTile glass={false} onLight caption={deadlineLabel} icon={<CalendarDay size={13} />}>{formatDeadlineV1(deadline)}</StatTile>
              <StatTile glass={false} onLight caption="Time Remaining" icon={<Clock size={13} />}>{timeLeft}</StatTile>
            </div>
            {onViewDetails && (
              <button
                type="button"
                onClick={onViewDetails}
                className="cre-link-action"
                // Bottom-aligned + lifted ~14px so it lines up with the vertical
                // center of the 48px Resume Course button opposite it.
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 14, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-cta-500)', whiteSpace: 'nowrap' }}
              >
                View Details <ChevronRight size={14} aria-hidden />
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT · Jump Back In / Up Next (media-left) ── */}
        <div style={{ position: 'relative', background: 'var(--color-surface-card)', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Inset "soft" divider — spans only the content (eyebrow → CTA base),
              not the full card height. */}
          <div aria-hidden style={{ position: 'absolute', left: 0, top: 22, bottom: 22, width: 1, background: 'var(--color-neutral-100)' }} />
          {mode !== 'discovery' && <p style={{ ...eyebrowBase, color: 'var(--color-text-secondary)' }}>{jbiEyebrow}</p>}
          {mode === 'discovery' ? (
            // `align="end"` bottom-pins Browse Catalog to the same baseline as the
            // resume-state CTA (marginTop:auto), so the left "View Details ›" link
            // lines up with it in the empty state too.
            <DiscoveryEmpty tone={discoveryTone} onBrowseCatalog={onBrowseCatalog} padding="4px 0 0" compact align="end" firstName={user.firstName} />
          ) : resume ? (
            <>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 120,
                    height: 110,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-subtle)',
                    background: `center / cover no-repeat url(${resume.imageUrl ?? getCourseImage(resume.id)})`,
                  }}
                />
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, lineHeight: 1.2, color: 'var(--color-text-primary)' }}>{resume.title}</h3>
                  <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {DELIVERY_LABEL[resume.delivery]} · {resume.badge === 'mandatory' ? 'Mandatory' : 'Elective'}
                    {resume.state ? ` · ${resume.state}` : ''}
                  </p>
                  <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {isUpNext ? '0%' : `${resumePct}% complete`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => launcher.open(resume.id)}
                style={{
                  marginTop: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  border: 0,
                  cursor: 'pointer',
                  background: 'var(--color-cta-500)',
                  color: 'rgb(255 255 255 / 1)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {v1Cta}
              </button>
            </>
          ) : (
            <p style={{ marginTop: 12, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>You don't have anything in progress.</p>
          )}
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Your learning"
      className="cre-clp-jbi-band"
      style={{
        display: 'grid',
        gridTemplateColumns: stack
          ? 'minmax(0, 1fr)'
          : lpV2
            ? 'minmax(0, 620fr) minmax(0, 360fr)'
            : 'minmax(0, 560fr) minmax(0, 420fr)',
        ...(mobile
          ? { marginLeft: -16, marginRight: -16, borderRadius: 0 }
          : bleed
            ? HERO_BLEED
            : {
                borderRadius: 'var(--radius-lg)',
                boxShadow: lpV1
                  ? '0 1px 3px rgb(0 0 0 / 0.08)'
                  : '0 18px 40px -18px color-mix(in srgb, var(--color-primary-900) 55%, transparent)',
                ...(lpV1 ? { border: '1px solid var(--color-border-subtle)' } : {}),
              }),
        overflow: 'hidden',
      }}
    >
      {/* ── LEFT · navy · Current Learning Path ── */}
      {/* HOME tile (`hideHeader`): tighter padding + gap so less of the navy
          frame shows around the white content. */}
      <div
        style={{
          // V1 flattens the navy frame to the white surface (with a section
          // border + a divider before Jump Back In supplying the definition).
          background: lpV1 ? 'var(--color-surface-card)' : 'var(--color-primary-700)',
          color: lpV1 ? 'var(--color-text-primary)' : ON_DARK,
          padding: hideHeader ? '14px' : '22px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: hideHeader ? 10 : 14,
        }}
      >
        {!hideHeader && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <p style={{ ...eyebrowBase, color: ON_DARK }}>Current Learning Path</p>
            {showViewAll && onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="cre-link-action"
                style={{ ...linkBtn(ON_DARK), whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {`View All (${pathsCount ?? ''})`}
              </button>
            )}
          </div>
        )}

        {/* white inner card — clickable (→ opens the detail panel) with the
            shared `.cre-clp-card` hover lift, matching the CLP card in the split
            (Marketing Focused) layout. The class owns the base + hover shadow (a
            CSS `:hover` can't override an inline box-shadow), so the inline
            shadow is only used for the non-interactive fallback. */}
        <div
          {...(onViewDetails
            ? {
                role: 'button' as const,
                tabIndex: 0,
                'aria-label': `Open ${path.title} details`,
                onClick: onViewDetails,
                onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onViewDetails()
                  }
                },
              }
            : {})}
          className={onViewDetails && !lpV1 ? 'cre-clp-card' : undefined}
          style={{
            // V1: the summary sits flat on the white surface (no nested card).
            background: lpV1 ? 'transparent' : 'var(--color-surface-card)',
            borderRadius: 'var(--radius-md)',
            ...(lpV1
              ? onViewDetails
                ? { cursor: 'pointer' }
                : {}
              : onViewDetails
                ? { cursor: 'pointer' }
                : { boxShadow: '0 1px 3px rgb(0 0 0 / 0.1)' }),
            padding: lpV1 ? 0 : '20px 22px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 21,
                  lineHeight: 1.18,
                  color: 'var(--color-text-primary)',
                }}
              >
                {path.title}
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 6,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {meta.map((m, i) => (
                  <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                    {i > 0 && (
                      <span aria-hidden style={{ width: 1, height: 11, background: 'var(--color-border-subtle)' }} />
                    )}
                    {m}
                  </span>
                ))}
              </div>
            </div>
            {/* HOME tile: the status badge is shown in the strip below the stat
                tiles instead, so drop the redundant pill from the summary card —
                EXCEPT v2, which lifts the pill up here beside the name. */}
            {showCardPill && (
              <span
                style={{
                  flex: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  color: status.text,
                  background: status.outline ? 'transparent' : status.fill,
                  boxShadow: status.outline ? `inset 0 0 0 1px ${status.border}` : undefined,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {status.icon && <status.icon size={12} aria-hidden />}
                {status.label}
              </span>
            )}
          </div>

          {/* % + credit hours */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', margin: '20px 0 10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 34,
                lineHeight: 1,
                color: 'var(--color-text-primary)',
              }}
            >
              {percent}%
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <b style={{ color: 'var(--color-text-primary)' }}>{totalCompleted}</b> / {totalRequired || path.hours} credit hours
            </span>
          </div>

          {/* two-segment bar */}
          <div
            style={{
              height: 10,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-neutral-100)',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            {hasBreakdown ? (
              <>
                <span style={{ width: `${mPct}%`, background: CAT_MANDATORY_COLOR }} />
                <span style={{ width: `${ePct}%`, background: CAT_ELECTIVE_COLOR }} />
              </>
            ) : (
              <span style={{ width: `${percent}%`, background: 'var(--color-progress-fill)' }} />
            )}
          </div>

          {/* legend + Details */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 12 }}>
            {hasBreakdown ? (
              <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-body)', fontSize: 13, flexWrap: 'wrap' }}>
                <LegendItem color={CAT_MANDATORY_COLOR} label={mandatoryLabel} value={`${mandatory.completed}/${mandatory.required}`} />
                <LegendItem color={CAT_ELECTIVE_COLOR} label={electiveLabel} value={`${elective.completed}/${elective.required}`} />
              </div>
            ) : isQe ? (
              // QE — no redundant "N of M hours complete" caption (kept a spacer
              // so the Details link stays right-aligned).
              <span />
            ) : (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {totalCompleted} of {totalRequired || path.hours} hours complete
              </span>
            )}
            {onViewDetails && (
              <button
                type="button"
                onClick={(e) => {
                  // The whole card already opens the panel; don't fire it twice.
                  e.stopPropagation()
                  onViewDetails()
                }}
                className="cre-link-action"
                style={{ ...linkBtn('var(--color-cta-600)'), whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Details →
              </button>
            )}
          </div>
        </div>

        {/* stat tiles — D white cards / E glass tiles. v3 adds a third
            (Completed Hours); v1 renders them as light-gray tiles on the white
            surface (`onLight`) since a white-on-white card would vanish. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${lpV3 ? 3 : 2}, minmax(0, 1fr))`,
            gap: 14,
          }}
        >
          <StatTile glass={glass} onLight={lpV1} caption={deadlineLabel} icon={<CalendarDay size={13} />}>
            {deadline}
          </StatTile>
          <StatTile glass={glass} onLight={lpV1} caption="Time Remaining" icon={<Clock size={13} />}>
            {timeLeft}
          </StatTile>
          {lpV3 && (
            <StatTile glass={glass} onLight={lpV1} caption="Completed Hours" icon={<CircleCheck size={13} />}>
              {totalCompleted} hrs
            </StatTile>
          )}
        </div>

        {interestChips && interestChips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {interestChips.slice(0, 4).map((c) => (
              <span
                key={c}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgb(255 255 255 / 0.14)',
                  color: ON_DARK,
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 9px',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT · white · Jump Back In ── */}
      <div
        style={{
          background: 'var(--color-surface-card)',
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          // V1 has no navy frame to separate the halves, so a divider line does.
          ...(lpV1 ? { borderLeft: '1px solid var(--color-border-subtle)' } : {}),
        }}
      >
        {mode !== 'discovery' && (
          <p style={{ ...eyebrowBase, color: 'var(--color-text-secondary)' }}>{jbiEyebrow}</p>
        )}
        {mode === 'discovery' ? (
          <DiscoveryEmpty tone={discoveryTone} onBrowseCatalog={onBrowseCatalog} padding="12px 0 0" compact firstName={hideHeader ? user.firstName : undefined} />
        ) : resume ? (
          <>
            <div
              aria-hidden
              style={{
                // Floor the cover low enough that the navy left column drives
                // the band height and the image flex-grows to fill the right
                // column to match — so the left side keeps equal navy padding
                // top and bottom instead of accumulating dead space at the base.
                flex: 1,
                minHeight: 80,
                borderRadius: 'var(--radius-md)',
                margin: '12px 0 16px',
                overflow: 'hidden',
                border: '1px solid var(--color-border-subtle)',
                background: `center / cover no-repeat url(${resume.imageUrl ?? getCourseImage(resume.id)})`,
              }}
            />
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 17,
                color: 'var(--color-text-primary)',
              }}
            >
              {resume.title}
            </h3>
            <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {DELIVERY_LABEL[resume.delivery]} · {resume.badge === 'mandatory' ? 'Mandatory' : 'Elective'}
              {resume.state ? ` · ${resume.state}` : ''}
              {!isUpNext && typeof resume.progress === 'number' ? ` · ${resume.progress}% complete` : ''}
            </p>
            {!isUpNext && (
              <div
                style={{
                  height: 8,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-neutral-100)',
                  overflow: 'hidden',
                  margin: '12px 0 16px',
                }}
              >
                <span style={{ display: 'block', height: '100%', width: `${resumePct}%`, background: 'var(--color-progress-fill)' }} />
              </div>
            )}
            <button
              type="button"
              onClick={() => (renewalReady ? console.info('cta:view-certificate') : launcher.open(resume.id))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 48,
                marginTop: isUpNext ? 16 : 0,
                borderRadius: 'var(--radius-md)',
                border: 0,
                cursor: 'pointer',
                background: 'var(--color-cta-500)',
                color: 'rgb(255 255 255 / 1)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {jbiCta}
            </button>
          </>
        ) : (
          <p style={{ marginTop: 12, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            You don't have anything in progress.
          </p>
        )}
      </div>
    </section>
  )
}

/* ─── pieces ─────────────────────────────────────────────────────────── */

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)' }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
      {label} <b style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{value}</b>
    </span>
  )
}

/** A stat tile — solid white card (`d`) or a translucent glass tile on the
 *  navy (`e`). */
function StatTile({
  glass,
  onLight = false,
  caption,
  icon,
  children,
}: {
  glass: boolean
  /** Light-gray tile on a white surface (V1) — a white card would disappear. */
  onLight?: boolean
  caption: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      style={{
        background: glass
          ? 'rgb(255 255 255 / 0.07)'
          : onLight
            ? 'var(--color-neutral-75)'
            : 'var(--color-surface-card)',
        border: glass ? `1px solid ${ON_DARK_LINE}` : 'none',
        boxShadow: glass || onLight ? 'none' : '0 1px 3px rgb(0 0 0 / 0.1)',
        borderRadius: 'var(--radius-md)',
        // Tighter side padding so the longest caption ("Completed Hours") fits
        // on one line even in the narrow v3 three-tile row.
        padding: '13px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          // Keep the caption on one line — the icon + label never wrap.
          whiteSpace: 'nowrap',
          color: glass ? ON_DARK_MUTED : 'var(--color-text-tertiary)',
        }}
      >
        {icon}
        {caption}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 17,
          fontWeight: 700,
          color: glass ? ON_DARK : 'var(--color-text-primary)',
        }}
      >
        {children}
      </span>
    </div>
  )
}

function linkBtn(color: string): CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 700,
    color,
  }
}
