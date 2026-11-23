import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AngleRightSolid, EllipsisVerticalSolid } from '@/icons'
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
  const status = data.completed ? 'Completed' : expired || failed ? 'Progress Made' : progress > 0 ? 'In Progress' : 'Not Started'
  /* THE LINE UNDER THE DATE (PRD section 3): a failed course shows her score, an expired one her last progress. Nothing on
     the other three — the completed score is on the date line itself. */
  const detail = failed && data.score != null ? `Score: ${data.score}%` : expired ? `Last progress: ${progress}%` : null
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
      style={{ ...CARD, ...(steppedBack ? CARD_DONE : null), ...(onOpen ? { cursor: 'pointer' } : null) }}
    >
      <img src={data.imageUrl} alt="" aria-hidden style={IMAGE} />
      {/* The title, then its pill under it — 10 apart, 4 above and below (Figma 710:2526). */}
      <div style={TITLE_BLOCK}>
        {/* The title, then "Course Details ›" under it, then the rule (2026-11-18, Eric) — the link in Review Course's style,
            opening the facts the card used to carry in a sheet from the right. */}
        {/* The title alone — "Course Details ›" moved to the foot of the card, under the button (2026-11-23, Jillienne:
            "course details link should be under the primary cta at bottom of card"); it sat here on the card before. */}
        <div style={TITLE_HEAD}>
          <h3 style={TITLE}>{data.title}</h3>
        </div>
        {/* One status pill (Figma 710:2531–2551, 2026-11-12, Eric), the most pressing: the clock before the course's own state. */}
        {/* At the foot of the title row, whatever the title's length, so every card's pills line up — 16 over the State line,
            then 8 lower, then 4 back up: 12 over it (2026-11-12, Eric). Flex, so no stray line box under the pill. */}
        {/* …and "Review Course" across from it, at the card's right edge (2026-11-17, Eric: "a text link adjusted far right next
            to the status pills … with an angle right icon at the end of it"). It does what the card does — Home in this course. */}
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, alignSelf: 'stretch', marginTop: 'auto', paddingTop: 4, /* 4 more over the pills (2026-11-18, Eric) */ marginBottom: 0 /* and 4 more under them — the −4 went (same day) */ }}>
          {/* EXPIRED IN CHARCOAL (2026-11-23, Jillienne: "Expired badge should be a dark charcoal color") — Neutral 800 with
              Neutral 50 ink, both on the ramp so the pair inverts together in the dark theme. The other five pills keep
              the catalog's fills; the card before this one keeps Error 100 for Expired. */}
          <AtlasStatusPill
            status={statusFor(data, progress)}
            {...(statusFor(data, progress) === 'expired' ? { fill: 'var(--color-neutral-800)', ink: 'var(--color-neutral-50)' } : null)}
          />
          {/* Only on a finished card — completed, expired or failed. A course in progress or not started has none
              (2026-11-18, Eric). */}
          {steppedBack ? (
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
          ) : null}
        </span>
      </div>
      {/* The description (PRD section 3) — or its fallback. The sentence lives HERE, once, rather than on every record. */}
      <p style={DESCRIPTION}>{data.description || 'Description coming soon'}</p>
      {/* State | Category | Line of authority — the PRD's labels, back on the card (2026-11-23), in the SHARED card's meta
          row style (Jillienne, same day, with that card's "Elective | 4 Hours | TX" row selected: "use this style"): the
          values alone, 12 / 500, hairline rules between them — `CourseMeta`'s row and `MetaRule`, not the 2026-11-12
          card's "State: Florida" lines. A fact the course does not have draws no rule. The sheet keeps the labelled
          version with the package paragraph. */}
      <div style={FACTS} data-testid="atlas-card-facts">
        {[data.state, data.category, data.lineOfAuthority]
          .filter((v): v is string => Boolean(v))
          .map((v, i) => (
            <span key={v} style={{ display: 'contents' }}>
              {i > 0 ? <span aria-hidden style={FACT_RULE} /> : null}
              <span>{v}</span>
            </span>
          ))}
      </div>
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
          {/* …but Primary 200 on an expired or failed card (2026-11-12, Eric). */}
          <span style={{ ...BAR_FILL, width: `${progress}%`, background: expired || failed ? 'var(--color-primary-200)' : statusStrongFill(statusFor(data, progress)) }} />
        </div>
      </div>
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
            // On a completed card, the card's own Secondary 100 (2026-11-12, Eric).
            style={steppedBack ? { ...KEBAB, background: CARD_DONE.background } : KEBAB}
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
      {/* "Course Details ›" under the button, centred (2026-11-23, Jillienne) — the sheet with the three labels and the
          package paragraph. Under the title on the card before. */}
      <button
        type="button"
        className="cre-atlas-card-review"
        onClick={(e) => {
          e.stopPropagation()
          setDetailsOpen(true)
        }}
        style={DETAILS_LINK}
      >
        Course Details
        <AngleRightSolid size={11} aria-hidden style={{ width: 6 }} />
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

/* 24 in, 12 corners, Primary 100, no outline. A SUBGRID of SEVEN rows — image, title, description, facts, progress, dates,
   buttons (2026-11-23; four on the card before it) — on the row of cards, so every card's rows line up with its
   neighbours' (the parent grid is PlatformShell's). */
const CARD: CSSProperties = {
  display: 'grid',
  gridRow: 'span 7',
  gridTemplateRows: 'subgrid',
  rowGap: 8,
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: 'var(--atlas-card-radius, 12px)',
  background: 'var(--color-primary-100)',
  minWidth: 0,
}
/* A completed card steps back (2026-11-12, Eric): white, with a 1 Primary 100 rule drawn inside its edge so nothing moves. */
// Its fill Secondary 100 (same day, Eric; white, then half Primary 100).
const CARD_DONE: CSSProperties = { background: 'var(--color-secondary-100)', boxShadow: 'inset 0 0 0 1px var(--color-primary-100)' }
const IMAGE: CSSProperties = { display: 'block', width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }
const TITLE_BLOCK: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 /* 4 more over the pill (2026-11-12, Eric; the design's 10) */, paddingTop: 4, paddingBottom: 4 }
/* The title and its Course Details link (2026-11-18, Eric; a rule under them that day, then removed). The pair stretches to the foot of its share of the row, which is
   what holds the pills at one height across the row. */
const TITLE_HEAD: CSSProperties = {
  flexGrow: 1,
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 6,
  // The rule under it went the same day (2026-11-18, Eric) — and with it the 12 that held it off the title.
}
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 22, // My Certificates' card titles, 22 / 24 (2026-11-12, Eric; 20 / 21, the design's 18 / 19 before)
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}
/* The description: the facts' face at 12, three lines at most so a long blurb cannot push the row's buttons apart. */
const DESCRIPTION: CSSProperties = {
  margin: 0,
  paddingBottom: 8,
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
  fontSize: 11,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
/* The progress: its row, then the bar 10 under it, 16 under the bar. */
const PROGRESS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }
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
const BAR_TRACK: CSSProperties = {
  position: 'relative',
  height: 5,
  backgroundImage: 'linear-gradient(var(--color-primary-400), var(--color-primary-400))', // Primary 400 (same day, Eric; 200, then 300)
  backgroundSize: '100% 1px',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}
const BAR_FILL: CSSProperties = { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 2.5, background: 'var(--color-primary-500)' }
/* The ⋮ and the main button, 6 apart, 35 tall, 9 corners — at the foot of their subgrid row so the row's buttons line up. */
/** The ⋮ beside the main button — off since 2026-11-17 (Eric). */
const SHOW_CARD_MENU = false
/** "Review Course ›" — the Atlas text link (the exam-date step's "Not Yet ›"), at the facts' 11. */
const REVIEW_LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
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
/** "Course Details ›" in the text link's style, centred under the full-width button (2026-11-23). */
const DETAILS_LINK: CSSProperties = { ...REVIEW_LINK, alignSelf: 'center' }
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
