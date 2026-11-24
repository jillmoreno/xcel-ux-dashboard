import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AngleRightSolid, ArrowRight, Award, CalendarExclamation, CircleCheckRegular, EllipsisVerticalSolid, HourglassClock, TriangleExclamation } from '@/icons'
import { accessCountLabel } from './atlasCourseAccess'
import { atlasRungFor, isLessonRowTitle, journeyTitleFor } from './atlasProgressLadder'
import { journeyStopsFor, whiteJourneyTitles } from '@/components/learning/studyJourneyUtil'
import { activePathIdFor, learningPathsFor } from '@/data/learningFixtures'
import { useLearningPathSummariesForBrand } from '@/data/learningPathsCountVariant'
import { useLearningPathsPanel } from '@/components/learning/LearningPathsPanelContext'
import { useAccount } from '@/context/AccountContext'
import { nearestRung } from '@/data/atlasCourseCards'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { STATE_ABBR } from '@/data/catalogFixtures'
import { EXPIRY_SOON_DAYS, courseExpiryTier, formatMilestoneDate, usableDaysLeft } from '@/data/courseExpiry'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import { AtlasStatusPill, statusStrongFill, type AtlasCourseStatus } from './AtlasStatusPill'
import type { AtlasCourseCardData } from './AtlasCourseCard'
import { AtlasCourseDetailsSheetV2 } from './AtlasCourseDetailsSheetV2'

/**
 * THE ATLAS COURSE CARD, TO THE MY COURSES PRD — 2026-11-23, Jillienne. Section 3 of the My Courses PRD (Chi Wang,
 * 2026-11-16), on a COPY of `AtlasCourseCardFigma` as Eric left it on 2026-11-18. The original is never edited; the flag
 * `atlas-courses-card-prd-fields` chooses between the two in `MyCoursesSection`, so nobody collides with his card.
 *
 * WHAT THIS CARD ADDS, every one of them a field the PRD confirms:
 *   · FL | Category | Line of authority BACK ON THE CARD as one ruled row (the sheet still has them, with the package paragraph);
 *   · the status as text beside the 0–100 figure (it already was — nothing here is said by colour alone);
 *   · ONE DATE LINE per status, computed in `atlasCourseCards.ts` and only DRAWN here — "Access ends [date] · N days
 *     left", "Expired: [date]", "Completed: [date] · Score N%" — with a failed course's score and an expired course's
 *     last progress on a line under it;
 *   · a WORKING button on the completed card: "View Certificate", a link to `data.certificateHref` (the course's
 *     certificate, or the certificates page when none is issued — the PRD's "No dead ends"). The card before it drew a
 *     disabled "Completed" with `pointerEvents: 'none'` so the click fell through to the card's own open; a live link
 *     must not do that, so it stops propagation and the REST of the card still opens Home;
 *   · the Expired pill in dark charcoal — Neutral 800, Neutral 50 ink (2026-11-23, Jillienne) — where the catalog's pill
 *     is Error 100. Only this card; the pill itself is unchanged for every other caller.
 *
 * ⚠ TWO THINGS DELIBERATELY NOT CHANGED, both raised with Jillienne rather than decided here (2026-11-23):
 *   1. The status text still reads "Progress Made" for an expired or failed course (Eric, 2026-11-12); the PRD wants the
 *      status itself — Failed, Expired.
 *   2. Purchase Extension still borrows the `secondary` outline; `actionStyle: 'expired'` (BUTTON_EXPIRED) stays unused.
 *
 * ⚠ THE CE PACKAGE CARD (`demo-ny-pclh-refresher-ce`) was out of scope for the Jan 12 release and is off the page since
 * 2026-11-24 (Jillienne: "remove this version") — `ATLAS_CE_PACKAGE_CARD` in atlasCourseCards.ts, read by nothing.
 *
 * The 2026-11-12 card's own notes follow.
 *
 * THE ATLAS COURSE CARD, FIGMA 706:2416 — 2026-11-12, Eric: "rework the course cards to match the following Figma file".
 *
 * A sibling of `AtlasCourseCard` (213:3619), which is kept as it was. Same data, same subgrid idea, a different card:
 * the Primary 100 fill with no outline · a 120-tall image · the title in the heading serif, Bold 18 / 19, with the
 * Due Soon pill UNDER it (not on the image) · three facts — State, Category, Line of authority — each an icon, a label
 * and a Bold value · a progress row (gauge · status · %) over a thin bar · a ⋮ button beside a full-width primary
 * button. The design's "tertiary" is the Atlas palette's primary ramp (#2D5872 · #EAEEF1 · #CBD5DC).
 *
 * The ⋮ opens a menu (2026-11-12, Eric): Download Certificate (not wired) and Go to Course Home (the card's own
 * `onOpen` — Home in this course and its progress).
 */
export function AtlasCourseCardFigmaV2({
  data,
  onAction,
  onOpen,
  certificateTo,
}: {
  data: AtlasCourseCardData
  onAction?: () => void
  /** The card clicked anywhere but its buttons — Home in this card's course and progress. */
  onOpen?: () => void
  /** WHERE VIEW CERTIFICATE GOES, when the host knows better than `data.certificateHref` — the learning shell passes its
   *  own certificates page (`?section=certificates`), because `AppLayout` blocks `/my-learning/*` from inside the rebrand
   *  with a toast, and a blocked link is a dead end. Absent → `data.certificateHref`, the product route. */
  certificateTo?: string
}) {
  const progress = data.progress ?? (data.completed ? 100 : 0)
  // An EXPIRED card steps back like a completed one — the same Secondary 100 fill and Primary 100 rule (2026-11-12, Eric).
  // …and a FAILED one (same day, Eric).
  const steppedBack = data.completed || data.badge === 'Expired' || data.actionLabel === 'Retake Course'
  const expired = data.badge === 'Expired' && !data.completed
  // An expired course reads "Progress Made" — it is not in progress any more (2026-11-12, Eric; "Progress" first).
  const failed = data.actionLabel === 'Retake Course'
  // A failed course reads "Progress Made" too — finished, not passed, not "in progress" (2026-11-12).
  // A finished course's status row carries its date — "Completed - 03/18/2026" (2026-11-24, Jillienne), in the milestone
  // format `formatMilestoneDate` gives every Completed: / Expired: line. A record with no `completedOn` says "Completed" alone.
  const status = data.completed
    ? data.completedOn
      ? `Completed - ${formatMilestoneDate(data.completedOn)}`
      : 'Completed'
    : expired || failed
      ? 'Progress Made'
      : progress > 0
        ? 'In Progress'
        : 'Not Started'
  /* NO DATE BLOCK ON A FINISHED CARD (2026-11-24, Jillienne, with the expired and completed lines selected: "dont need
     this, showing elsewhere on card"): the end date is on the Expired pill, the completion date on the status row, the score
     on the pill, the last progress on the bar's marker. The failed card's "Score: 62%" line went with them for the same
     reason — its pill carries the score. What is left is the access line on a live course, which nothing else says. */
  const showDates = !expired // the completed card keeps its access line too (2026-11-24: "also add this to the completed cards")
  /* NO BUTTON, NO LINKS (2026-11-23, Jillienne) — the design bar's `atlas-courses-card-actions`: the card is the one action
     and Home has the buttons. The hover lift and focus ring (`.cre-atlas-card-v2`) are what is left to say so. */
  const actionsShown = useFeatureFlag('atlas-courses-card-actions').variant !== 'hidden'
  // The sheet's deadline box — the design bar's `atlas-courses-sheet-extension-box` (2026-11-24).
  const extensionBox = useFeatureFlag('atlas-courses-sheet-extension-box').enabled
  // A short title at the top of its box, or centred — the design bar's `atlas-courses-card-title-align` (2026-11-24), to decide.
  const titleCentred = useFeatureFlag('atlas-courses-card-title-align').variant === 'center'
  /* THE DUE SOON PILL COUNTS DOWN (2026-11-23, Jillienne, with the pill selected: "Access Ends <##> days") — the same
     `usableDaysLeft` the date line prints, so the two never disagree. A card with no date keeps "Due Soon". */
  /* THE COUNTDOWN PILL IS THE LAST WEEK'S (2026-11-24, Jillienne: "Access ends indicator should only be showing if the
     course is ending in 7 days or less") — `EXPIRY_SOON_DAYS`, Home's own amber tier, counted in usable days. The record's
     "Due Soon" badge fires at the catalogue's sixty, which is right for a grid of thirteen and too early for this pill, so a
     course outside the week wears the plain In Progress here. */
  const usable = usableDaysLeft(data.expiresAt, FIXTURE_TODAY)
  const rawStatus = statusFor(data, progress)
  const pillStatus = rawStatus === 'due-soon' && (usable == null || usable > EXPIRY_SOON_DAYS) ? 'in-progress' : rawStatus
  const daysLeft = pillStatus === 'due-soon' ? usable : null
  // …and the Completed and Failed pills carry the score — "Completed - Score: 92%", "Failed - Score: 62%" (2026-11-24,
  // Jillienne). No score, no suffix: the platform does not always know one on a failed course.
  // …and the Expired pill carries the date it ended — "Expired - 04/20/2026" (2026-11-24, Jillienne). No date, "Expired".
  const pillLabel =
    daysLeft != null
      ? `Access Ends ${Math.max(0, daysLeft)} ${daysLeft === 1 ? 'day' : 'days'}`
      : (pillStatus === 'completed' || pillStatus === 'failed') && data.score != null
        ? `${pillStatus === 'completed' ? 'Completed' : 'Failed'} - Score: ${data.score}%`
        : pillStatus === 'expired' && data.expiresAt
          ? `Expired - ${formatMilestoneDate(data.expiresAt)}`
          : undefined
  /* THE RULED ROW ABBREVIATES THE STATE — "FL", not "Florida" (2026-11-23, Jillienne: "use the ruled row, have the state be
     abbreviated to help with wrapping issues"). `STATE_ABBR` is the catalog's map; a name it does not know, or a record
     that already carries the code (the library's `state: 'FL'`), passes through. The sheet keeps the full name. */
  const facts = [data.state ? (STATE_ABBR[data.state] ?? data.state) : undefined, data.category, data.lineOfAuthority].filter(
    (v): v is string => Boolean(v),
  )
  /* The ⋮ menu: open on click, shut on a click anywhere else, on Escape, or on picking a row. */
  const [menuOpen, setMenuOpen] = useState(false)
  /* Course Details — the facts' sheet (2026-11-18, Eric). */
  const [detailsOpen, setDetailsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [menuOpen])
  return (
    <>
    <article
      aria-label={data.title}
      onClick={onOpen}
      onKeyDown={
        onOpen
          ? (e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onOpen()
              }
            }
          : undefined
      }
      tabIndex={onOpen ? 0 : undefined}
      data-cta-id={onOpen ? 'my-courses.card-open-home' : undefined}
      // The whole card opens Home in this course; a hover lift and a focus ring say so (the scan's finding — the card was
      // clickable with nothing but a cursor to show it). `.cre-atlas-card-v2` in tokens.css.
      className={onOpen ? 'cre-atlas-card-v2' : undefined}
      // ONE FILL FOR EVERY CARD (2026-11-23, Jillienne, with the completed card selected: "all cards will have this background
      // color, slightly lighter") — the finished card no longer steps back; `steppedBack` still picks the links and the bar.
      style={{ ...CARD, ...(onOpen ? { cursor: 'pointer' } : null) }}
    >
      {/* The image, with the status pill over its top-left corner (2026-11-23, Jillienne — the shared card's badges sit the
          same way). One pill, the most pressing: the clock before the course's own state. Expired is charcoal here. */}
      <div style={IMAGE_WRAP} data-testid="atlas-card-image">
        <img src={data.imageUrl} alt="" aria-hidden style={IMAGE} />
        <span style={PILL_ON_IMAGE}>
          <AtlasStatusPill
            status={pillStatus}
            label={pillLabel}
            iconNudge={0}
            fontSize={11}
            {...(pillStatus === 'expired' ? { fill: 'var(--color-neutral-800)', ink: 'var(--color-neutral-50)' } : null)}
          />
        </span>
      </div>
      {/* The title, then its pill under it — 10 apart, 4 above and below (Figma 710:2526). */}
      <div style={TITLE_BLOCK}>
        {/* The title, then "Course Details ›" under it, then the rule (2026-11-18, Eric) — the link in Review Course's style,
            opening the facts the card used to carry in a sheet from the right. */}
        {/* The title alone — "Course Details ›" moved to the foot of the card, under the button (2026-11-23, Jillienne:
            "course details link should be under the primary cta at bottom of card"); it sat here on the card before. */}
        <div style={TITLE_HEAD}>
          {/* ONE HEIGHT FOR EVERY TITLE (2026-11-24, Jillienne, with a three-line title selected: "every title section should
              be this height … add an ellipsis"): a 66-tall box — three lines of 22 — the title clamped to three lines
              with an ellipsis, a shorter title at the top of the box. */}
          <div style={{ ...TITLE_BOX, ...(titleCentred ? { alignItems: 'center' } : null) }} data-testid="atlas-card-title-box">
            <h3 className="cre-atlas-card-v2-title" style={TITLE}>{data.title}</h3>
          </div>
          {/* NO DESCRIPTION (2026-11-24, Jillienne: "keep description hidden, and remove this flag"). It sat here under the title
              for a day, with "Description coming soon" as its fallback, behind `atlas-course-description` — decided hidden
              and the flag retired (commit a3990f69 is the last with it). The record keeps its `description`; the PRD's
              section 3 asked for one on every card, and that is logged as a deviation on the handoff. */}
        </div>
        {/* One status pill (Figma 710:2531–2551, 2026-11-12, Eric), the most pressing: the clock before the course's own state. */}
        {/* At the foot of the title row, whatever the title's length, so every card's pills line up — 16 over the State line,
            then 8 lower, then 4 back up: 12 over it (2026-11-12, Eric). Flex, so no stray line box under the pill. */}
        {/* …and "Review Course" across from it, at the card's right edge (2026-11-17, Eric: "a text link adjusted far right next
            to the status pills … with an angle right icon at the end of it"). It does what the card does — Home in this course. */}
        {/* THE STATUS PILL IS ON THE IMAGE NOW (2026-11-23, Jillienne: "have the status badge be in the top left of the image
            area" — the shared card's badges). What is left of this row is "Review Course ›", on a finished card only, at the
            card's right edge (2026-11-17, Eric). */}
        {steppedBack && actionsShown ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, alignSelf: 'stretch', marginTop: 'auto', paddingTop: 4 }}>
            <button
              type="button"
              className="cre-atlas-card-review"
              onClick={(e) => {
                e.stopPropagation()
                onOpen?.()
              }}
              style={REVIEW_LINK}
            >
              Review Course
              <AngleRightSolid size={11} aria-hidden style={{ width: 6 }} />
            </button>
          </span>
        ) : null}
      </div>
      {/* State | Category | Line of authority — the PRD's labels, back on the card (2026-11-23), in the SHARED card's meta
          row style (Jillienne, same day, with that card's "Elective | 4 Hours | TX" row selected: "use this style"): the
          values alone, 12 / 500, hairline rules between them — `CourseMeta`'s row and `MetaRule`, not the 2026-11-12
          card's "State: Florida" lines. A fact the course does not have draws no rule. The sheet keeps the labelled
          version with the package paragraph. */}
      {/* THE RULED ROW — the three values on one line with the shared card's hairlines between. The one layout since
          2026-11-24 (Jillienne: "set this one as default, remove the other options and this flag"); a stacked icon-led
          block and one "State: Florida" line per fact were on the design bar beside it for a day (`atlas-courses-card-meta`,
          commit a3990f69 the last with them — an Archive row says how to bring them back). */}
      <div style={FACTS} data-testid="atlas-card-facts">
        {facts.map((v, i) => (
          <span key={v} style={{ display: 'contents' }}>
            {i > 0 ? <span aria-hidden style={FACT_RULE} /> : null}
            <span>{v}</span>
          </span>
        ))}
      </div>
      {/* THE DATE LINE — one per status, computed in `atlasCourseCards.ts` (`dateLine`); the card only draws what it is
          given. In the Home course head's meta-row style since 2026-11-24 (Jillienne, with "Course Access Ends: 06/10/2026,
          29 days to complete" selected: "Update Access Ends to match this style. mm/dd/yyyy") — 11 / 14, the label at 500 in
          Neutral 700, the date and the day count at 600 in the primary ink, "to complete" back at 500. (Its Primary 200 rules
          moved up under the title block the same hour.) Only on a LIVE course since the same day — see `showDates`. */}
      {showDates && data.availableDate ? (
        <div style={DATES}>
          <p style={DATE_ROW} data-testid="atlas-card-date">
            {data.dateLabel ? <span style={DATE_LABEL}>{data.dateLabel}</span> : null}
            <span style={DATE_VALUE}>
              {data.availableDate}
              {data.availableTime ? <span style={DATE_LABEL}>,</span> : null}
            </span>
            {data.availableTime ? <DateTrail text={data.availableTime} /> : null}
          </p>
        </div>
      ) : null}
      {actionsShown ? (
      <div style={ACTIONS_BLOCK}>
      <div style={ACTIONS}>
        {/* The ⋮ and its menu, OFF for now (2026-11-17, Eric: "turn off the kebab menu for now") — built and kept; set
            SHOW_CARD_MENU true to bring it back. The main button takes the row. */}
        {SHOW_CARD_MENU ? (
        <div ref={menuRef} style={{ position: 'relative', display: 'flex' }}>
          <button
            type="button"
            aria-label={`More for ${data.title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="cre-atlas-card-kebab"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((o) => !o)
            }}
            style={KEBAB}
          >
            <EllipsisVerticalSolid aria-hidden style={{ width: 4, height: 13.5 }} />
          </button>
          {menuOpen ? (
            <div role="menu" aria-label={`${data.title} options`} style={MENU} onClick={(e) => e.stopPropagation()}>
              {/* Go to Course Home first (2026-11-12, Eric). */}
              <button
                type="button"
                role="menuitem"
                className="cre-atlas-card-menu-item"
                style={MENU_ITEM}
                onClick={() => {
                  setMenuOpen(false)
                  onOpen?.()
                }}
              >
                Go to Course Home
              </button>
              {/* Not wired — the demo has no certificate file behind it. Disabled and greyed until the course is completed
                  (2026-11-12, Eric). */}
              <button
                type="button"
                role="menuitem"
                className="cre-atlas-card-menu-item"
                disabled={!data.completed}
                aria-disabled={!data.completed}
                style={data.completed ? MENU_ITEM : { ...MENU_ITEM, color: 'var(--color-text-disabled, var(--color-neutral-400))', cursor: 'default' }}
                onClick={() => setMenuOpen(false)}
              >
                Download Certificate
              </button>
            </div>
          ) : null}
        </div>
        ) : null}
        {data.completed && !data.certificatePending ? (
          /* VIEW CERTIFICATE (PRD section 3) — a live link in the button's clothes, NOT the disabled "Completed" the card
             before it drew. It goes to the course's certificate; a course with no issued certificate goes to the
             certificates page, because a dead button is the one thing the PRD forbids. `stopPropagation` so the click does
             not also bubble to the article's `onOpen` — the rest of the card still opens Home. */
          <Link
            to={certificateTo ?? data.certificateHref ?? '/my-learning/certificates'}
            className="cre-atlas-card-primary"
            onClick={(e) => e.stopPropagation()}
            style={{ ...BUTTON, ...BUTTON_LINK }}
          >
            View Certificate
          </Link>
        ) : (
          <button
            type="button"
            // Begin Course in the outline style (2026-11-12, Eric); the rest solid.
            className={
              data.actionStyle === 'secondary' ? 'cre-atlas-card-outline' : data.actionStyle === 'expired' ? 'cre-atlas-card-expired' : 'cre-atlas-card-primary'
            }
            onClick={(e) => {
              e.stopPropagation()
              onAction?.()
            }}
            disabled={!onAction}
            style={{
              ...BUTTON,
              ...(data.actionStyle === 'secondary' ? BUTTON_OUTLINE : data.actionStyle === 'expired' ? BUTTON_EXPIRED : null),
              ...(!onAction && onOpen ? { pointerEvents: 'none' as const } : null),
            }}
          >
            {/* A finished course whose certificate is pending has nothing to view — Review Course, as the sheet says (2026-11-24). */}
            {data.completed ? 'Review Course' : data.actionLabel}
          </button>
        )}
      </div>
      </div>
      ) : null}
      {/* THE PROGRESS, AT THE FOOT OF THE CARD (2026-11-23, Jillienne: "move the progress bar to the bottom of the card") — the
          status row over the bar, pushed to the card's bottom edge, so across a row the bars sit level again whatever the
          titles above them do. The same block opens the sheet since 2026-11-24 (`ProgressBlock`). */}
      <div style={PROGRESS}>
        <ProgressBlock title={data.title} status={status} progress={progress} pillStatus={pillStatus} finished={expired || failed} />
      </div>
      {/* "Details →" AT THE BOTTOM RIGHT, on every card whatever the actions control says (2026-11-24, Jillienne: "bring back
          the Details link in the bottom right of the card, with a arrow icon pointing right") — the Course Details sheet
          (2026-11-18, Eric), the three labels and the package paragraph. It sat under the button, centred, the day before. */}
      <div style={DETAILS_FOOT}>
        {/* On a FINISHED course, "Certificate" at the left of the foot — the award glyph and the text link's style — to the
            same place View Certificate goes (2026-11-24, Jillienne: "when completed, add another link style cta, on the left
            of this line. it will be Award icon + Certificate"). Stops propagation, like every control on the card. */}
        {data.completed && data.certificatePending ? (
          /* NOT YET ISSUED (2026-11-24, Jillienne): an hourglass and "Certificate Pending", not a link — in the status row's
              own text style, so it reads as a state like "Completed - 03/18/2026" above it rather than as an action. */
          <span style={PENDING} data-testid="card-certificate-pending">
            <HourglassClock size={12} aria-hidden />
            Certificate Pending
          </span>
        ) : data.completed ? (
          <Link
            to={certificateTo ?? data.certificateHref ?? '/my-learning/certificates'}
            className="cre-atlas-card-review"
            onClick={(e) => e.stopPropagation()}
            style={{ ...REVIEW_LINK, textDecoration: 'none' }}
            data-testid="card-certificate-link"
          >
            <Award size={12} aria-hidden />
            Certificate
          </Link>
        ) : (
          <span aria-hidden />
        )}
        <button
          type="button"
          className="cre-atlas-card-review"
          onClick={(e) => {
            e.stopPropagation()
            setDetailsOpen(true)
          }}
          style={REVIEW_LINK}
        >
          Details
          <ArrowRight size={11} aria-hidden />
        </button>
      </div>
    </article>
    {/* Outside the article, so a click inside the sheet does not bubble (through the portal) to the card's open. */}
    {/* The PRD card's own sheet (2026-11-24) — the facts on one line each, a Description sub-header, and under the title
        THE SAME BUTTONS HOME'S COURSE HEAD OFFERS when this course is active (Jillienne, the same day): Purchase Extension
        inside the warning window or once access has gone (drawn, not wired — Home's own rule), Course Overview and
        Begin / Resume / Retake / Review Course on a live course (both `onAction`, the course page), View Certificate on a
        finished one (`certificateTo`), and Purchase Extension ALONE once access has ended, as Home reshapes it. */}
    <AtlasCourseDetailsSheetV2
      data={data}
      open={detailsOpen}
      onClose={() => setDetailsOpen(false)}
      progress={<ProgressBlock title={data.title} status={status} progress={progress} pillStatus={pillStatus} finished={expired || failed} />}
      outline={<SheetOutline progress={progress} />}
      notice={extensionBox ? <SheetExtensionBox data={data} expired={expired} /> : null}
      actions={<SheetActions data={data} expired={expired} onAction={onAction} certificateTo={certificateTo} inBox={extensionBox} />}
    />
    </>
  )
}

/* Which pill: Expired, then Due Soon, then Failed, Completed, In Progress, Not Started. A completed course never wears the
   clock — `atlasCourseCardFor` gives it no badge. */
function statusFor(data: AtlasCourseCardData, progress: number): AtlasCourseStatus {
  if (data.badge === 'Expired') return 'expired'
  if (data.badge === 'Due Soon' && !data.completed) return 'due-soon'
  if (data.actionLabel === 'Retake Course') return 'failed'
  if (data.completed) return 'completed'
  if (progress > 0 || data.actionLabel === 'Resume Course') return 'in-progress'
  return 'not-started'
}

/* 24 in, 12 corners. A FLEX COLUMN, 8 between blocks — NOT the subgrid the card before it uses (2026-11-23, Jillienne, with
   a title selected: "reduce bottom padding to 30px"). On the subgrid every card's title row took the TALLEST title in the
   grid row, so the space under one card's description was 8, its neighbour's 52, and no padding could make it 30. Off the
   subgrid each card owns its spacing: the description's 30 is 30 on every card. The cost is that progress bars and date
   lines no longer sit at one height across a row — accepted, now that the actions at the foot are hidden by default and
   nothing there needs to line up. */
const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: 'var(--atlas-card-radius, 12px)',
  /* THE FILL, EVERY CARD (2026-11-23, Jillienne): the finished card's Secondary 100, "slightly lighter" — mixed half with
     Neutral 50, which is white here and inverts with the ramp in the dark theme, so the mix stays a tint of the card's own
     ground rather than a fixed white. The 1 Primary 100 rule inside the edge comes with it. Primary 100 on the unfinished
     cards and Secondary 100 on the finished ones was the 2026-11-12 card's split; that card keeps it. */
  background: 'color-mix(in srgb, var(--color-secondary-100) 50%, var(--color-neutral-50))',
  boxShadow: 'inset 0 0 0 1px var(--color-primary-100)',
  minWidth: 0,
}
const IMAGE: CSSProperties = { display: 'block', width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }
/* The image's frame, so the pill can straddle its top-left corner (2026-11-23, Jillienne: "overlap the top corner a bit so
   its 50/50 on background and image") — half the pill's 21 above the image's top edge, and 10 past its left edge, so it
   sits on the card's ground and the photo at once. It was 8 in from the corner for an hour that day. */
const IMAGE_WRAP: CSSProperties = { position: 'relative' }
const PILL_ON_IMAGE: CSSProperties = { position: 'absolute', top: -10.5, left: -10, display: 'inline-flex', boxShadow: '0 1px 2px rgb(0 0 0 / 0.12)', borderRadius: 14 }
// A Primary 200 rule UNDER THE TITLE BLOCK, 8 below the title's box (2026-11-24, Jillienne: "have this divider line be under
// the course title section, remove them from the access ends section" — the rules the date line wore for an hour). No
// other padding under it ("remove bottom padding", the same day); the column's 8 and the labels' 4 follow the rule.
const TITLE_BLOCK: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
  paddingTop: 4,
  paddingBottom: 8,
  // Primary 100, the card's own edge (2026-11-24, Jillienne: "reduce the weight of the divider line"; Primary 200 for an hour).
  borderBottom: '1px solid var(--color-primary-100)',
}
/* The title and its Course Details link (2026-11-18, Eric; a rule under them that day, then removed). The pair stretches to the foot of its share of the row, which is
   what holds the pills at one height across the row. */
const TITLE_HEAD: CSSProperties = {
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 6,
  // The rule under it went the same day (2026-11-18, Eric) — and with it the 12 that held it off the title.
}
/* The title's fixed box: three lines of 20, the title at its TOP (2026-11-24, Jillienne — centred for a few minutes: "they
   should not be centered - they should align to the top"; 66 for three lines of 22 until the lines tightened later that day). */
const TITLE_BOX: CSSProperties = { alignSelf: 'stretch', height: 60, display: 'flex', alignItems: 'flex-start' }
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  // 18 / 20 (2026-11-23, Jillienne, with the title selected: "reduce font size" — the Figma card's own 18; then 2026-11-24,
  // "reduce the spacing between these 3 lines", 22 → 20). The 2026-11-18 card keeps My Certificates' 22 / 24.
  fontSize: 18,
  lineHeight: '20px',
  // Charcoal at rest, black when the card is hovered (2026-11-24, Jillienne: "reduce the black font weight to more of a
  // charcoal gray, will show black on hover") — Neutral 800; `.cre-atlas-card-v2:hover .cre-atlas-card-v2-title` in
  // tokens.css lifts it to the primary ink with the card's lift.
  color: 'var(--color-neutral-800)',
  // Three lines at most, then an ellipsis (2026-11-23, the scan; the fixed box the day after). The full title is the
  // article's accessible name either way.
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}
/* The facts as ONE ROW, the shared card's `CourseMeta` row verbatim — inline-flex, 8 apart, 12 / 500 — wrapping when a long
   line of authority needs it, in the card's secondary ink. */
const FACTS: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  rowGap: 4,
  paddingTop: 4,
  paddingBottom: 12,
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  // The body's one size and line (2026-11-24, the type audit: "do all") — 11 / 18 at 400, like the date line and the status
  // row. It was the shared card's 12 / 16 at 500, the only 12 on the card.
  fontSize: 11,
  fontWeight: 400,
  lineHeight: '18px',
}
/* `MetaRule`, verbatim: a 1 × 12 hairline in the subtle border colour. */
const FACT_RULE: CSSProperties = { width: 1, height: 12, background: 'var(--color-border-subtle)', flex: 'none' }
/**
 * THE OUTLINE — Step 1's rows as Home draws them (2026-11-24, Jillienne: "add an Outline section with whatever is showing in
 * this section on the home page"). Built from the same helpers as `AtlasHomeJillMain`'s journey: the demo path's stops
 * (`journeyStopsFor`), the White home's six titles in the course's own order (`whiteJourneyTitles`, xcelFlow), the lesson
 * row's count from the card's percent (`journeyTitleFor`), and the ticks from the ladder rung nearest that percent — so
 * the sheet and Home check off the same rows for the same figure. The affidavit row is the course's own "Affidavit"; the
 * pre-course one is the demo's default, off.
 */
function SheetOutline({ progress }: { progress: number }) {
  /* THE PATH IS HOME'S, resolved the way `MembershipOverview` resolves it for the course head: the Learning Paths panel's
     active path among the count-variant summaries (which the demo bar's Course control shapes), else the brand's default.
     The first fixed path gave "42 of 42" beside a Home saying "14 of 36" — same rows, different course. */
  const { brand } = useAccount()
  const { activePathId } = useLearningPathsPanel()
  const summaries = useLearningPathSummariesForBrand()
  const path = summaries.find((s) => s.id === (activePathId ?? activePathIdFor(brand))) ?? learningPathsFor(brand)[0]
  const stops = journeyStopsFor(path).filter((s) => s.id !== 'attestation-and-affidavit')
  const titles = whiteJourneyTitles(stops[0], { stateExamSimulators: true, preCourseAffidavit: false, xcelFlow: true }).map((t) =>
    journeyTitleFor(t, progress),
  )
  const rung = atlasRungFor(nearestRung(progress))
  const lessonRowIdx = Math.max(0, titles.findIndex((t) => isLessonRowTitle(t)))
  const doneRows = progress > 0 ? lessonRowIdx + rung.stepsDone : 0
  const currentRowIdx = doneRows < titles.length ? doneRows : -1
  return (
    <ol style={OUTLINE} data-testid="sheet-outline">
      {titles.map((t, i) => {
        const done = i < doneRows
        const current = i === currentRowIdx
        return (
          <li key={t} style={OUTLINE_ROW} data-state={done ? 'done' : current ? 'current' : 'later'}>
            <span aria-hidden style={{ ...OUTLINE_MARK, ...(done ? OUTLINE_DONE : current ? OUTLINE_CURRENT : OUTLINE_LATER) }}>
              {done ? <CircleCheckRegular size={14} aria-hidden /> : null}
            </span>
            <span style={{ ...OUTLINE_LABEL, ...(current ? { fontWeight: 600, color: 'var(--color-text-primary)' } : null) }}>{t}</span>
          </li>
        )
      })}
    </ol>
  )
}
/* Home's journey rows, trimmed to the sheet: a 14 mark, the label at 13 / 18; done in the Success ramp's check, the current
   one a ring in the stop colour and bold, the rest a hairline ring in the secondary ink. */
const OUTLINE: CSSProperties = { listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }
const OUTLINE_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 }
const OUTLINE_MARK: CSSProperties = { width: 14, height: 14, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', boxSizing: 'border-box' }
const OUTLINE_DONE: CSSProperties = { color: 'var(--color-success-400)' }
const OUTLINE_CURRENT: CSSProperties = { border: '2px solid var(--color-atlas-home-current-stop, var(--color-compass-page-button))' }
const OUTLINE_LATER: CSSProperties = { width: 12, height: 12, border: '1.5px solid var(--color-border-subtle)' }
const OUTLINE_LABEL: CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }

/**
 * THE STATUS ROW AND THE BAR — the card's foot, and the sheet's head above the buttons (2026-11-24, Jillienne: "add the
 * progress bar in the sheet view, above the CTAs"). One block, so the two cannot disagree about a course's figure.
 */
function ProgressBlock({
  title,
  status,
  progress,
  pillStatus,
  finished,
}: {
  title: string
  status: string
  progress: number
  pillStatus: AtlasCourseStatus
  /** Expired or failed — "Progress Made": no fill, a marker where the progress reached. */
  finished: boolean
}) {
  return (
    <>
      <div style={PROGRESS_ROW}>
        {/* No gauge before it (2026-11-12, Eric). */}
        <span style={{ flex: 1, minWidth: 0 }}>{status}</span>
        <strong style={{ fontWeight: 700 }}>{progress}%</strong>
      </div>
      <div role="progressbar" aria-label={`${title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} style={BAR_TRACK}>
        {/* The fill in the 400 of the card's status colour (2026-11-12, Eric; Primary 500, then the pill's own fill). */}
        {/* …but on an expired or failed card — "Progress Made" — NO FILL: a 2-wide charcoal MARKER where the progress
            reached, on the empty grey track (2026-11-24, Jillienne: "add a marker line where the 62% would be in the line,
            do not fill it with color"). Primary 200 fill before (2026-11-12, Eric). */}
        {finished ? (
          <span data-testid="atlas-card-progress-marker" style={{ ...BAR_MARKER, left: `${progress}%` }} />
        ) : (
          <span
            style={{
              ...BAR_FILL,
              width: `${progress}%`,
              // The live course's bar in the PRIMARY blue — the Resume button's (2026-11-24, Jillienne: "should be the same
              // blue color as the primary cta"; the Info ramp's 400 before). The last week keeps its amber, the rest their own.
              background: pillStatus === 'in-progress' ? 'var(--color-primary-500)' : statusStrongFill(pillStatus),
            }}
          />
        )}
      </div>
    </>
  )
}

/**
 * THE DEADLINE AND THE EXTENSION IN THEIR OWN BOX (2026-11-24, Jillienne), above the sheet's buttons. Home's tiers, exactly
 * (`courseExpiryTier` — the Home course head's own span): amber inside seven usable days with the triangle, red inside two
 * with the calendar mark, neutral once access has gone. The quiet copy — the deadline alone, no persuasion — until product
 * writes the line. Purchase Extension lives here and nowhere else in the sheet, and GOES TO THE STORE (`STORE_URL`, a new
 * tab) — the one Purchase Extension in the product that goes anywhere; Home's and the card's stay drawn, not wired. Nothing on a course outside its last week, or a finished one.
 */
function SheetExtensionBox({ data, expired }: { data: AtlasCourseCardData; expired: boolean }) {
  const tier = courseExpiryTier({ status: data.completed ? 'completed' : 'in-progress', expiresAt: data.expiresAt }, FIXTURE_TODAY)
  if (data.completed || tier === 'normal' || !data.expiresAt) return null
  const days = Math.max(0, usableDaysLeft(data.expiresAt, FIXTURE_TODAY) ?? 0)
  const lastDay = tier === 'urgent' && days === 0
  const date = formatMilestoneDate(data.expiresAt)
  const tone = expired ? BOX_ENDED : tier === 'urgent' ? BOX_URGENT : BOX_SOON
  const Icon = tier === 'soon' ? TriangleExclamation : CalendarExclamation
  return (
    <div style={{ ...BOX, ...tone.box }} data-testid="sheet-extension-box" data-tier={expired ? 'expired' : tier}>
      <p style={{ ...BOX_HEAD, color: tone.ink }}>
        <Icon size={15} aria-hidden style={{ flex: 'none' }} />
        {expired ? `Access ended ${date}` : lastDay ? 'Today is the last day' : `Access ends in ${accessCountLabel(days)}`}
      </p>
      <p style={BOX_LINE}>{expired ? 'Your access to this course has ended.' : `Your access to this course ends ${date}.`}</p>
      {/* TO THE STORE (2026-11-24, Jillienne: "Button does nothing, it goes to ecomm site") — the XCEL storefront, in a
          new tab, since an extension is bought there and not in the LMS. The storefront's root for now: which page sells
          an extension is the xcel-purchase-extension handoff's open question. Primary once access has gone — nothing else
          is left to do; the tone's outline while it lasts. */}
      <a
        href={STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={expired ? 'cre-atlas-card-primary' : undefined}
        style={expired ? { ...SHEET_BUTTON, ...BUTTON_LINK } : { ...SHEET_BUTTON, ...BUTTON_LINK, background: 'transparent', borderColor: tone.ink, color: tone.ink }}
        data-testid="sheet-extension"
      >
        Purchase Extension
      </a>
    </div>
  )
}
/** Where Purchase Extension goes: the XCEL storefront (2026-11-24). The root, not a product page — see the note above. */
export const STORE_URL = 'https://www.xcelsolutions.com/'
const BOX: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '14px 16px', borderRadius: 9, borderStyle: 'solid', borderWidth: 1 }
const BOX_HEAD: CSSProperties = { margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: '20px', fontWeight: 700 }
const BOX_LINE: CSSProperties = { margin: '0 0 6px', fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: '20px', color: 'var(--color-text-primary)' }
/* Home's three tones (WhiteCourseMeta): Warning 700, Error 600, Neutral 800 — on the ramp's 100 with its 300 edge. */
const BOX_SOON = { ink: 'var(--color-warning-700)', box: { background: 'var(--color-warning-100)', borderColor: 'var(--color-warning-300)' } }
const BOX_URGENT = { ink: 'var(--color-error-600)', box: { background: 'var(--color-error-100)', borderColor: 'var(--color-error-200)' } }
const BOX_ENDED = { ink: 'var(--color-neutral-800)', box: { background: 'var(--color-neutral-100)', borderColor: 'var(--color-neutral-200)' } }

/**
 * HOME'S BUTTONS FOR THIS COURSE, in the sheet (2026-11-24). The rule is `AtlasHomeJillMain`'s course head: Course Overview
 * and the course's own verb while it is live, View Certificate at 100% (unless pending). Purchase Extension is the box's
 * (`inBox`) — with the box off, it is here instead: outlined from the warning tier on and alone once expired, as the sheet
 * drew it before the box. Drawn and not wired either way.
 */
function SheetActions({
  data,
  expired,
  onAction,
  certificateTo,
  inBox,
}: {
  data: AtlasCourseCardData
  expired: boolean
  onAction?: () => void
  certificateTo?: string
  /** The deadline box carries Purchase Extension; this row does not. */
  inBox: boolean
}) {
  const tier = courseExpiryTier({ status: data.completed ? 'completed' : 'in-progress', expiresAt: data.expiresAt }, FIXTURE_TODAY)
  const extension = !inBox && !data.completed && tier !== 'normal'
  const verb = data.completed ? 'Review Course' : data.actionLabel
  if (expired) {
    // Once access has gone there is nothing else to do: the box's button is the whole sheet's action (or the row's, box off).
    return inBox ? null : (
      <a href={STORE_URL} target="_blank" rel="noopener noreferrer" className="cre-atlas-card-primary" style={{ ...SHEET_BUTTON, ...BUTTON_LINK }} data-testid="sheet-action">
        Purchase Extension
      </a>
    )
  }
  /* THE PRIMARY FIRST, ALWAYS (2026-11-24, Jillienne: "primary cta should always be at the top") — the course's verb leads,
     then Course Overview, then the outlined extras. */
  return (
    <>
      <button type="button" className="cre-atlas-card-primary" style={SHEET_BUTTON} onClick={onAction} disabled={!onAction} data-testid="sheet-action">
        {verb}
      </button>
      <button
        type="button"
        className="cre-atlas-card-outline"
        style={{ ...SHEET_BUTTON, ...SHEET_BUTTON_OUTLINE }}
        onClick={onAction}
        disabled={!onAction}
        data-testid="sheet-action"
      >
        Course Overview
      </button>
      {data.completed && !data.certificatePending ? (
        <Link
          to={certificateTo ?? data.certificateHref ?? '/my-learning/certificates'}
          className="cre-atlas-card-outline"
          style={{ ...SHEET_BUTTON, ...SHEET_BUTTON_OUTLINE, ...BUTTON_LINK }}
          data-testid="sheet-action"
        >
          View Certificate
        </Link>
      ) : null}
      {extension ? (
        <a href={STORE_URL} target="_blank" rel="noopener noreferrer" className="cre-atlas-card-outline" style={{ ...SHEET_BUTTON, ...SHEET_BUTTON_OUTLINE, ...BUTTON_LINK }} data-testid="sheet-action">
          Purchase Extension
        </a>
      ) : null}
    </>
  )
}
/* The sheet's buttons: the card's own button at its natural width (35 tall, 9 corners, 13.5 Bold). */
const SHEET_BUTTON: CSSProperties = {
  height: 35,
  paddingLeft: 14,
  paddingRight: 14,
  boxSizing: 'border-box',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'transparent',
  borderRadius: 9,
  background: 'var(--color-primary-500)',
  color: 'var(--color-fixed-light, #fff)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13.5,
  lineHeight: '20.25px',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
const SHEET_BUTTON_OUTLINE: CSSProperties = {
  background: 'var(--color-fixed-light, #fff)',
  borderColor: 'var(--color-primary-500)',
  color: 'var(--color-primary-500)',
}

/** The trailing part of the date line — "(5 days)", drawn at the date's weight. */
function DateTrail({ text }: { text: string }) {
  // "(293 days)" since 2026-11-24 — one run in the value's weight. ("293 days" + "to complete" in two weights before.)
  return <span style={DATE_VALUE}>{text}</span>
}
/* The date line and the detail under it; 12 under them before the button. */
const DATES: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 12 }
/* THE DATE LINE IN THE STATUS ROW'S CLOTHES (2026-11-24, Jillienne, after the card's type audit: "update that please") —
   11 / 18 in the secondary ink, the label at 400 and the date and count at 700, exactly as "In Progress" and "45%" sit over
   the bar. It wore Home's meta row for an afternoon: Neutral 700 at 500 and the primary ink at 600, the only line on the
   card with two inks and the only 600. Home's row is unchanged. */
const DATE_ROW: CSSProperties = {
  margin: 0,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
const DATE_LABEL: CSSProperties = { fontWeight: 400 }
const DATE_VALUE: CSSProperties = { fontWeight: 700 }
/* The progress: its row, then the bar 10 under it — at the card's foot (2026-11-23), `marginTop: auto` pinning it low, 8 clear
   of whatever is above; "Details →" sits under it since 2026-11-24. The 16 under it went: the card's 24 is the space below. */
const PROGRESS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto', paddingTop: 8 }
const PROGRESS_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
/* A 1-tall Primary 400 rule, the 5-tall Primary 500 fill centred on it (2026-11-12, Eric). The box is the fill's height; the
   rule is drawn through its middle. */
/* A 5-tall LIGHT GREY TRACK with the fill over it (2026-11-23, Jillienne: "the unfinished on the right is a light gray") —
   Neutral 200, 2.5 corners. The 2026-11-12 card drew a 1px Primary 400 rule through the middle instead; that stays on it. */
const BAR_TRACK: CSSProperties = {
  position: 'relative',
  height: 5,
  borderRadius: 2.5,
  background: 'var(--color-neutral-200)',
  overflow: 'hidden',
}
const BAR_FILL: CSSProperties = { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 2.5, background: 'var(--color-primary-500)' }
/* The Progress Made marker (2026-11-24): a 2-wide Neutral 800 tick the track's full height, centred on the progress point —
   so 100% sits inside the right edge rather than past it. */
const BAR_MARKER: CSSProperties = { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, background: 'var(--color-neutral-800)' }
/* The ⋮ and the main button, 6 apart, 35 tall, 9 corners — at the foot of their subgrid row so the row's buttons line up. */
/** The ⋮ beside the main button — off since 2026-11-17 (Eric). */
const SHOW_CARD_MENU = false
/** "Review Course ›" — the Atlas text link (the exam-date step's "Not Yet ›"), at the facts' 11. */
const REVIEW_LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  // A 24-tall hit area on an 18-tall link (WCAG 2.2 target size, the scan's finding): 3 of padding above and below,
  // pulled back out with the margin so the layout does not move.
  padding: '3px 0',
  marginTop: -3,
  marginBottom: -3,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-body)',
  // 600, not the 700 that made the two links the loudest text on the card; on the body's 18 line (2026-11-24, the audit).
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '18px',
  color: 'var(--color-primary-500)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
/* ⚠ NO `alignSelf: 'end'` HERE any more (2026-11-23): the row sits inside ACTIONS_BLOCK, a flex COLUMN, where align-self is
   HORIZONTAL — it shrank the full-width button to its label and pushed it right. The block carries the grid-row alignment. */
const ACTIONS: CSSProperties = { display: 'flex', gap: 6, alignItems: 'flex-end' }
/** The card's foot row: "Details →" at the right (2026-11-24). */
/* "Certificate Pending": the status row's text — 11, the secondary ink, no weight — with the hourglass before it. */
const PENDING: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}
/* "Details →" at the right; on a finished course "Certificate" at the left (2026-11-24) — `space-between`, with an empty
   span holding the left slot otherwise so Details stays put. */
const DETAILS_FOOT: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }
/* The button row and "Course Details ›" under it, 8 apart, at the foot of the subgrid row (2026-11-23). */
const ACTIONS_BLOCK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'end' }

const KEBAB: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
  height: 35,
  paddingLeft: 9,
  paddingRight: 9,
  boxSizing: 'border-box',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'var(--color-primary-200)',
  borderRadius: 9,
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-500)',
  cursor: 'pointer',
}
/* The ⋮ menu: white, a 1 Primary 200 edge, 8 corners, a soft shadow, opening up from the ⋮ (the card's foot is the bottom of
   the page's row, so a menu below it would fall out of the card). */
const MENU: CSSProperties = {
  position: 'absolute',
  left: 0,
  bottom: 'calc(100% + 4px)',
  zIndex: 5,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 200,
  paddingTop: 4,
  paddingBottom: 4,
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'var(--color-primary-200)',
  borderRadius: 8,
  background: 'var(--color-fixed-light, #fff)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
}
const MENU_ITEM: CSSProperties = {
  display: 'block',
  width: '100%',
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 12,
  paddingRight: 12,
  border: 'none',
  background: 'none',
  textAlign: 'left',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
const BUTTON: CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 35,
  paddingLeft: 8,
  paddingRight: 8,
  boxSizing: 'border-box',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'transparent',
  borderRadius: 9,
  background: 'var(--color-primary-500)',
  color: 'var(--color-fixed-light, #fff)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13.5,
  lineHeight: '20.25px',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
/* The outline button — white, a 1 Primary 500 edge and label (2026-11-12, Eric, for Begin Course). */
const BUTTON_OUTLINE: CSSProperties = {
  background: 'var(--color-fixed-light, #fff)',
  borderColor: 'var(--color-primary-500)',
  color: 'var(--color-primary-500)',
}
/* Purchase Extension (2026-11-12, Eric): outlined, on the Expired pill's Error 100, with dark text — the edge Error 400. */
const BUTTON_EXPIRED: CSSProperties = {
  background: 'var(--color-error-100)',
  borderColor: 'var(--color-error-400)',
  color: 'var(--color-text-primary)',
}
/* View Certificate: the primary button's clothes on a link — centred, no underline (2026-11-23). */
const BUTTON_LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
}
