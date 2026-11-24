import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AngleRightSolid, ArrowRight, EllipsisVerticalSolid, LocationDotRegular } from '@/icons'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { STATE_ABBR } from '@/data/catalogFixtures'
import { formatMilestoneDate, usableDaysLeft } from '@/data/courseExpiry'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import { AtlasStatusPill, statusStrongFill, type AtlasCourseStatus } from './AtlasStatusPill'
import type { AtlasCourseCardData } from './AtlasCourseCard'
import { AtlasCourseDetailsSheet } from './AtlasCourseDetailsSheet'

/**
 * THE ATLAS COURSE CARD, TO THE MY COURSES PRD — 2026-11-23, Jillienne. Section 3 of the My Courses PRD (Chi Wang,
 * 2026-11-16), on a COPY of `AtlasCourseCardFigma` as Eric left it on 2026-11-18. The original is never edited; the flag
 * `atlas-courses-card-prd-fields` chooses between the two in `MyCoursesSection`, so nobody collides with his card.
 *
 * WHAT THIS CARD ADDS, every one of them a field the PRD confirms:
 *   · the description under the title — "Description coming soon" when the course has none, never an empty row;
 *   · State · Category · Line of authority BACK ON THE CARD (the sheet still has them, with the package paragraph);
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
 * ⚠ THE CE PACKAGE CARD (`demo-ny-pclh-refresher-ce`) is out of scope for the Jan 12 release: its data is untouched, so
 * this card draws it with whatever it has — no description (the fallback), no score, its authored date.
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
  /* THE LINE UNDER THE DATE (PRD section 3): a failed course shows her score, an expired one her last progress. Nothing on
     the other three — the completed score is on the date line itself. */
  const detail = failed && data.score != null ? `Score: ${data.score}%` : expired ? `Last progress: ${progress}%` : null
  /* HOW THE THREE LABELS ARE DRAWN — the design bar's `atlas-courses-card-meta` (2026-11-23, Jillienne: "lets explore some ui
     variations"). See the flag for the three arms. */
  const metaLayout = useFeatureFlag('atlas-courses-card-meta').variant ?? 'ruled-row'
  // The description, shown or hidden — the design bar's `atlas-course-description` (2026-11-23); Home follows the same control.
  const descriptionShown = useFeatureFlag('atlas-course-description').variant !== 'hidden'
  /* NO BUTTON, NO LINKS (2026-11-23, Jillienne) — the design bar's `atlas-courses-card-actions`: the card is the one action
     and Home has the buttons. The hover lift and focus ring (`.cre-atlas-card-v2`) are what is left to say so. */
  const actionsShown = useFeatureFlag('atlas-courses-card-actions').variant !== 'hidden'
  /* THE DUE SOON PILL COUNTS DOWN (2026-11-23, Jillienne, with the pill selected: "Access Ends <##> days") — the same
     `usableDaysLeft` the date line prints, so the two never disagree. A card with no date keeps "Due Soon". */
  const pillStatus = statusFor(data, progress)
  const daysLeft = pillStatus === 'due-soon' ? usableDaysLeft(data.expiresAt, FIXTURE_TODAY) : null
  // …and the Completed and Failed pills carry the score — "Completed - Score: 92%", "Failed - Score: 62%" (2026-11-24,
  // Jillienne). No score, no suffix: the platform does not always know one on a failed course.
  const pillLabel =
    daysLeft != null
      ? `Access Ends ${Math.max(0, daysLeft)} ${daysLeft === 1 ? 'day' : 'days'}`
      : (pillStatus === 'completed' || pillStatus === 'failed') && data.score != null
        ? `${pillStatus === 'completed' ? 'Completed' : 'Failed'} - Score: ${data.score}%`
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
          <div style={TITLE_BOX} data-testid="atlas-card-title-box">
            <h3 style={TITLE}>{data.title}</h3>
          </div>
          {/* The description RIGHT UNDER THE TITLE (2026-11-23, Jillienne: "should be right up against the title") — inside the
              title's block, so the slack a short title leaves in the shared row falls below the description, not between.
              Or its fallback; or nothing, under the design bar's Course description control. */}
          {descriptionShown ? <p style={DESCRIPTION}>{data.description || 'Description coming soon'}</p> : null}
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
      {metaLayout === 'stacked' ? (
        /* STACKED, ICON-LED — the shared compact card's shape: "Online" with its delivery icon over "Mandatory | 6 Hours".
           Here the state leads with the location-dot (the 706:2416 design's own icon for it), then category | line of
           authority on a hairline. */
        <div style={FACTS_STACKED} data-testid="atlas-card-facts" data-meta="stacked">
          {data.state ? (
            <span style={FACT_LINE}>
              <LocationDotRegular size={14} aria-hidden style={{ flex: 'none' }} />
              <span>{data.state}</span>
            </span>
          ) : null}
          {data.category || data.lineOfAuthority ? (
            <span style={{ ...FACT_LINE, flexWrap: 'wrap' }}>
              {data.category ? <span>{data.category}</span> : null}
              {data.category && data.lineOfAuthority ? <span aria-hidden style={FACT_RULE} /> : null}
              {data.lineOfAuthority ? <span>{data.lineOfAuthority}</span> : null}
            </span>
          ) : null}
        </div>
      ) : metaLayout === 'labelled' ? (
        /* LABELLED LINES — the 2026-11-12 card's three lines, label in the secondary ink and the value bold. */
        <div style={FACTS_LABELLED} data-testid="atlas-card-facts" data-meta="labelled">
          {data.state ? <Fact label="State:" value={data.state} /> : null}
          {data.category ? <Fact label="Category:" value={data.category} /> : null}
          {data.lineOfAuthority ? <Fact label="Line of authority:" value={data.lineOfAuthority} /> : null}
        </div>
      ) : (
        /* RULED ROW (default) — the three values on one line with the shared card's hairlines between. */
        <div style={FACTS} data-testid="atlas-card-facts" data-meta="ruled-row">
          {facts.map((v, i) => (
            <span key={v} style={{ display: 'contents' }}>
              {i > 0 ? <span aria-hidden style={FACT_RULE} /> : null}
              <span>{v}</span>
            </span>
          ))}
        </div>
      )}
      {/* THE DATE LINE — one per status, computed in `atlasCourseCards.ts` (`dateLine`); the card only draws what it is
          given. An empty `availableDate` draws nothing, which keeps the subgrid row rather than the sentence. */}
      <div style={DATES}>
        {data.availableDate ? (
          <p style={DATE_LINE} data-testid="atlas-card-date">
            {data.dateLabel ? `${data.dateLabel} ` : null}
            <strong style={{ fontWeight: 700 }}>{data.availableDate}</strong>
            {data.availableTime ? ` ${data.availableTime}` : null}
          </p>
        ) : null}
        {detail ? <p style={DATE_LINE}>{detail}</p> : null}
      </div>
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
        {data.completed ? (
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
            {data.actionLabel}
          </button>
        )}
      </div>
      </div>
      ) : null}
      {/* THE PROGRESS, AT THE FOOT OF THE CARD (2026-11-23, Jillienne: "move the progress bar to the bottom of the card") — the
          status row over the bar, pushed to the card's bottom edge, so across a row the bars sit level again whatever the
          titles above them do. It sat between the labels and the date line before. */}
      <div style={PROGRESS}>
        <div style={PROGRESS_ROW}>
          {/* No gauge before it (2026-11-12, Eric). */}
          <span style={{ flex: 1, minWidth: 0 }}>{status}</span>
          <strong style={{ fontWeight: 700 }}>{progress}%</strong>
        </div>
        <div
          role="progressbar"
          aria-label={`${data.title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          style={BAR_TRACK}
        >
          {/* The fill in the 400 of the card's status colour (2026-11-12, Eric; Primary 500, then the pill's own fill). */}
          {/* …but on an expired or failed card — "Progress Made" — NO FILL: a 2-wide charcoal MARKER where the progress
              reached, on the empty grey track (2026-11-24, Jillienne: "add a marker line where the 62% would be in the line,
              do not fill it with color"). Primary 200 fill before (2026-11-12, Eric). */}
          {expired || failed ? (
            <span data-testid="atlas-card-progress-marker" style={{ ...BAR_MARKER, left: `${progress}%` }} />
          ) : (
            <span style={{ ...BAR_FILL, width: `${progress}%`, background: statusStrongFill(statusFor(data, progress)) }} />
          )}
        </div>
      </div>
      {/* "Details →" AT THE BOTTOM RIGHT, on every card whatever the actions control says (2026-11-24, Jillienne: "bring back
          the Details link in the bottom right of the card, with a arrow icon pointing right") — the Course Details sheet
          (2026-11-18, Eric), the three labels and the package paragraph. It sat under the button, centred, the day before. */}
      <div style={DETAILS_FOOT}>
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
    <AtlasCourseDetailsSheet data={data} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
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
// No padding under the title block (2026-11-24, Jillienne: "remove bottom padding"; 18 the day before, for 30 to the labels).
// The column's 8 and the labels' own 4 are what remain between the description and the labels.
const TITLE_BLOCK: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, paddingTop: 4, paddingBottom: 0 }
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
/* The title's fixed box: three lines of 22, the title at its TOP (2026-11-24, Jillienne — centred for a few minutes: "they
   should not be centered - they should align to the top"). */
const TITLE_BOX: CSSProperties = { alignSelf: 'stretch', height: 66, display: 'flex', alignItems: 'flex-start' }
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  // 18 / 22 (2026-11-23, Jillienne, with the title selected: "reduce font size") — the Figma card's own 18, on a line
  // height that lets the serif breathe. The 2026-11-18 card keeps My Certificates' 22 / 24.
  fontSize: 18,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
  // Three lines at most, then an ellipsis (2026-11-23, the scan; the fixed box the day after). The full title is the
  // article's accessible name either way.
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}
/* The description: the facts' face at 12, three lines at most so a long blurb cannot push the row's buttons apart. */
const DESCRIPTION: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
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
  fontSize: 12,
  fontWeight: 500,
  lineHeight: '16px',
}
/* `MetaRule`, verbatim: a 1 × 12 hairline in the subtle border colour. */
const FACT_RULE: CSSProperties = { width: 1, height: 12, background: 'var(--color-border-subtle)', flex: 'none' }
/* The date line and the detail under it, in the facts' face; 12 under them before the button. */
const DATES: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 12 }
const DATE_LINE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12, // the description's and the labels' 12 (2026-11-23, the scan: the most decision-bearing line was the smallest)
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
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
  // A 24-tall hit area on a 16-tall link (WCAG 2.2 target size, the scan's finding): 4 of padding above and below,
  // pulled back out with the margin so the layout does not move.
  padding: '4px 0',
  marginTop: -4,
  marginBottom: -4,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '16px',
  color: 'var(--color-primary-500)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
/* ⚠ NO `alignSelf: 'end'` HERE any more (2026-11-23): the row sits inside ACTIONS_BLOCK, a flex COLUMN, where align-self is
   HORIZONTAL — it shrank the full-width button to its label and pushed it right. The block carries the grid-row alignment. */
const ACTIONS: CSSProperties = { display: 'flex', gap: 6, alignItems: 'flex-end' }
/** The card's foot row: "Details →" at the right (2026-11-24). */
const DETAILS_FOOT: CSSProperties = { display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }
/* The three label layouts (2026-11-23). STACKED: two lines, 2 apart, the shared compact card's `CourseMeta` block at the
   card's 12. LABELLED: the 2026-11-12 card's lines. */
const FACTS_STACKED: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 4,
  paddingTop: 4,
  paddingBottom: 12,
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 500,
  lineHeight: '16px',
}
const FACT_LINE: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8 }
const FACTS_LABELLED: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  paddingTop: 4,
  paddingBottom: 12,
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
}
const FACT: CSSProperties = { display: 'block', fontSize: 11, lineHeight: '18px' }
const FACT_VALUE: CSSProperties = { fontWeight: 700, fontSize: 10 }
/* One run of text, so a long value wraps under its label inside the card rather than widening it (the 2026-11-12 card's). */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span style={FACT}>
      {label} <strong style={FACT_VALUE}>{value}</strong>
    </span>
  )
}
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
