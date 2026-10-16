import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpenRegular, HouseRegular } from '@/icons'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { isEricAtlasWhiteLike, isHybridVersion } from '@/data/dashboardVersions'
import { AtlasTopNavCoursesDropdown } from './AtlasTopNavCoursesDropdown'
import { ATLAS_HOME_REFRESH } from './atlasHomeRefresh'
import './atlasHeader.css'

/**
 * ATLAS TOP NAV (Figma "Atlas-Compass-Global-Navigation" 160:616, 2026-09-30)
 * — the Nav Version control's "Top Nav": two global buttons in the header.
 *
 *   - HOME is current on the Home page (the shell with no `?section=`).
 *   - COMPASS LEARNING is current on the course's pages (`?section=course` —
 *     its Overview and Course pages). Anywhere else neither is current.
 *
 * The current button is filled, with a small pointer under it; the other is a
 * tint. Placement is the header's job (`Header`): 40px right of the logo,
 * centred in the header's height.
 *
 * EXPANDING TOP NAV (Figma 168:916, 2026-10-01) is the same two buttons with
 * `expanding`: see `AtlasTopNav`'s prop, below. Home is current there on its
 * own sections as well (Study Plan, Certificates, Resources).
 *
 * Clicks change only the section params, so the demo's own (`?demo`, `?skin`,
 * `?fonts`, `?nav`, `?ff`…) survive. Colours are `--color-atlas-topnav-*`
 * (tokens.css): Figma's own on the Global skin, each brand's nav colours on
 * the others.
 */
/* EXPANDING TOP NAV's slide-out links (Figma 168:916, 2026-10-01). Home's are
   the design's; Compass Learning's are the designer's own list. Each is a
   shell address: Home's leave the course for a section, Compass Learning's
   are pages of the course. */
type TopNavLink = { label: string; section: string; coursePage?: string }
const HOME_LINKS: readonly TopNavLink[] = [
  // Course (the course's own Course page) and Study Plan in place of Courses
  // (2026-10-01, the designer's request). Course is a page OF the course, so
  // following it makes Compass Learning current; Study Plan is Home's own.
  { label: 'Course', section: 'course', coursePage: 'course' },
  { label: 'Study Plan', section: 'study-plan' },
  { label: 'Certificates', section: 'certificates' },
  { label: 'Resources', section: 'resources' },
]
const COMPASS_LINKS: readonly TopNavLink[] = [
  // Flashcards and Exam Simulator replaced Study Plan and Resources
  // (2026-10-01, the designer's request).
  // Overview first (2026-10-01, the designer's request) — the page the
  // Compass Learning button itself opens.
  { label: 'Overview', section: 'course', coursePage: 'overview' },
  { label: 'Course', section: 'course', coursePage: 'course' },
  { label: 'Flashcards', section: 'course', coursePage: 'flashcards' },
  { label: 'Exam Simulator', section: 'course', coursePage: 'exam-simulator' },
]

/** `expanding` — the Nav Version control's "Expanding Top Nav": the current
 *  button slides its links out to its right, easing in and out, and the button
 *  after it is pushed over in the same motion (it is in the same row, so the
 *  layout carries it). Switching buttons closes one tray as the other opens. */
export function AtlasTopNav({
  expanding = false,
  versionId,
}: {
  expanding?: boolean
  /** The RESOLVED dashboard version — `Header` passes its `rebrandVersion`.
   *  Added 2026-10-14 when End-to-End Demo became the default: the raw
   *  `?version=` is null on a bare `?demo=1`, and the version questions below
   *  must answer for the default too. Absent (a standalone render), the raw
   *  param is read, as before. */
  versionId?: string | null
}) {
  const [params, setParams] = useSearchParams()
  const version = versionId ?? params.get('version')
  // Jill's Hybrids take the Atlas chrome and keep the pill's old label.
  const hybridNav = isHybridVersion(version)
  const section = params.get('section')
  const coursePage = params.get('coursePage')
  /* ⚠ HYBRID'S SECOND PILL IS A DIFFERENT CONTROL — 2026-10-08, two direct
     asks. It goes to COMPASS LEARNING rather than to the Atlas course
     overview, and it is labelled "Course Overview" there too (see the label
     below — the 2026-10-14 merge note that said the Hybrids keep "My
     Learning" predates this branch's ask). `hybridNav` above is the resolved
     check, so a bare `?demo=1` on a Hybrid default answers the same way. */
  // On the COURSE page (the player) the Top Nav's Course Overview button sits
  // in its default state, not current (2026-10-08, Eric's request) — it names
  // the Overview, which is not where you are. The Expanding Top Nav keeps it
  // current there, because its tray marks the Course link inside it.
  // Home's own sections (Study Plan, Certificates, Resources) keep Home
  // current, so its tray stays open on them. Not its Course link: that is a
  // page of the course, which is Compass Learning's.
  const current: 'home' | 'compass' | null =
    !section ||
    section === 'dashboard' ||
    HOME_LINKS.some((l) => !l.coursePage && l.section === section)
      ? 'home'
      : (section === 'course' && !(coursePage === 'course' && !expanding)) ||
          section === 'compass'
      ? 'compass'
      : null

  const navigate = (section: string | null, coursePage: string | null) => {
    const next = new URLSearchParams(params)
    next.delete('section')
    next.delete('coursePage')
    /* ⚠ `session` GOES TOO (2026-10-16). It is the Compass LESSON's param, and
       leaving it on the address meant Home looked right while quietly arming
       the next move: picking Compass — from the Start control or the nav —
       re-entered the lesson instead of opening Anjani's dashboard, because a
       stale `session=1` was still there from the last visit. It only became
       reachable when Begin Course started putting people in sessions, which
       is why it has not bitten before. */
    next.delete('session')
    if (section) next.set('section', section)
    if (coursePage) next.set('coursePage', coursePage)
    setParams(next)
  }
  const isCurrentLink = (l: TopNavLink) =>
    l.section === section && (l.coursePage ? l.coursePage === (coursePage ?? 'overview') : true)
  // ERIC/ATLAS WHITE's Top Nav = Dropdown (2026-10-12, Eric's request): the
  // second button is the "My Courses" dropdown instead of Course Overview.
  // Plain Top Nav only; Home keeps no dropdown.
  const topNavPick = useFeatureFlag('atlas-white-top-nav').variant
  // …and Eric/Atlas WIP's too, since 2026-10-13 (Eric's request: WIP's nav
  // should be White's). On WIP a course pick changes `?whiteCourse=`, which
  // only White's Home reads.
  const whiteNav =
    !expanding && (isEricAtlasWhiteLike(version) || version === 'eric-atlas-v3')
  const coursesDropdown = whiteNav && topNavPick === 'dropdown'
  // …and Home Only (2026-10-12): the Course Overview button is not drawn.
  const homeOnly = whiteNav && topNavPick === 'home-only'

  return (
    /* WIP's and White's buttons are THE TWO-ROW HEADER'S PILLS (2026-10-13,
       Eric's request: "style the buttons as in the new nav but retain the
       dropdown style from this nav") — `cre-atlas-hdr` brings that header's
       variables and pill class (atlasHeader.css), 8 apart as there. The My
       Courses dropdown keeps its own open frame. */
    <nav
      aria-label="Global"
      className={whiteNav ? 'cre-atlas-hdr' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: whiteNav ? 8 : 11 }}
    >
      <TopNavItem
        label="Home"
        // 1px up, the house's optical centre (2026-10-01, the designer's request).
        icon={<HouseRegular size={12} aria-hidden style={{ position: 'relative', top: -1 }} />}
        current={current === 'home'}
        // …and the Home cards start over (2026-10-12, Eric's request): WIP's
        // and White's Homes listen for this and reset Progress, Readiness and
        // the State Exam card.
        onClick={() => {
          navigate(null, null)
          window.dispatchEvent(new Event(ATLAS_HOME_REFRESH))
        }}
        links={expanding ? HOME_LINKS : null}
        pill={whiteNav}
        isCurrentLink={isCurrentLink}
        onLink={(l) => navigate(l.section, l.coursePage ?? null)}
      />
      {homeOnly ? null : coursesDropdown ? (
        <AtlasTopNavCoursesDropdown selected={section === 'courses'} />
      ) : (
      <TopNavItem
        // "My Learning" with FA's `book-open` (Regular, the weight of Home's
        // house) — 2026-10-01, the designer's request; it was "Compass
        // Learning" with `circle-location-arrow`.
        /* ⚠ THE ID STAYS `nav.compass` WHATEVER THE PILL READS.
           `TESTABLE_CTAS` forbids renaming an id once a session has used it —
           a link already handed out would silently revive the control. The
           catalog's LABEL is what moved to match the screen. */
        ctaId="nav.compass"
        // Reads "Course Overview" since 2026-10-07 (Eric's request; it was
        // "My Learning") — on his versions it opens the course's Overview
        // page. ⚠ THE HYBRIDS SAY IT TOO, SINCE 2026-10-08 (this branch): the
        // 2026-10-14 merge had them keep "My Learning", but Jillienne's ask on
        // the 8th was that BOTH "Course Overview" controls — this pill and the
        // rail's — land on Anjani's dashboard, so the word is the same and the
        // destination differs (below).
        label="Course Overview"
        // 13px — 2026-10-01, the designer's request; it was 14.
        icon={<BookOpenRegular size={13} aria-hidden />}
        current={current === 'compass'}
        /* ⚠ HYBRID GOES TO COMPASS LEARNING, not the Atlas course overview —
           2026-10-08, the direct ask that both "Course Overview" controls land
           on Anjani's dashboard. That screen IS Compass Learning: her
           `screen-dashboard` and `CompassLearningOverview` render the same four
           bands from the same transcribed content (see
           `compassLearningFixtures`). Pointing at an existing route rather than
           forking a third overview is what keeps one dashboard, one source. */
        onClick={() => (hybridNav ? navigate('compass', null) : navigate('course', 'overview'))}
        links={expanding ? COMPASS_LINKS : null}
        pill={whiteNav}
        isCurrentLink={isCurrentLink}
        onLink={(l) => navigate(l.section, l.coursePage ?? null)}
      />
      )}
    </nav>
  )
}

function TopNavItem({
  label,
  icon,
  current,
  onClick,
  ctaId,
  links,
  isCurrentLink,
  onLink,
  pill = false,
}: {
  label: string
  icon: ReactNode
  current: boolean
  onClick: () => void
  /** A `TESTABLE_CTAS` id, when this pill is one a user test may kill.
   *
   *  ⚠ ON THE BUTTON, NOT THE TRAY. `CtaTestContext` intercepts on the closest
   *  `[data-cta-id]` ancestor of the click, so putting it on the wrapper would
   *  also swallow the Expanding arm's TRAY LINKS — different destinations,
   *  different questions, and killing them by accident would read as the pill
   *  being broken rather than as the run's own rigging. */
  ctaId?: string
  /** Present on the Expanding Top Nav: the tray's links. */
  links: readonly TopNavLink[] | null
  isCurrentLink: (l: TopNavLink) => boolean
  onLink: (l: TopNavLink) => void
  /** WIP and White: the two-row header's pill — no icon (2026-10-13). */
  pill?: boolean
}) {
  // Open once mounted, a frame late, so a page that LOADS on this version
  // slides its tray out too rather than drawing it already open.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const open = Boolean(links) && current && ready

  const button = (
    <button
      type="button"
      aria-current={current ? 'page' : undefined}
      className={pill ? 'cre-atlas-hdr-pill' : current ? 'cre-atlas-topnav-btn is-current' : 'cre-atlas-topnav-btn'}
      onClick={onClick}
      data-cta-id={ctaId}
      style={pill ? undefined : BUTTON}
    >
      {pill ? null : icon}
      {label}
      {/* The pointer under the current button is GONE from the plain Top Nav
          (2026-10-02, the designer's request; `POINTER` is kept for a
          restore). The Expanding Top Nav keeps its pointer, which points AT
          the open tray and is part of how that reads. */}
      {current && links ? <span aria-hidden style={POINTER_RIGHT} /> : null}
    </button>
  )
  if (!links) return button

  return (
    <div className={open ? 'cre-atlas-topnav-tray is-open' : 'cre-atlas-topnav-tray'} style={TRAY}>
      {button}
      {/* The slide: a one-column grid whose track eases 0fr ↔ 1fr, so the
          links' natural width is what opens — no measured or hard-coded
          widths. Closed, the links are hidden from tab order and readers. */}
      <div className="cre-atlas-topnav-slide" style={{ ...SLIDE, gridTemplateColumns: open ? '1fr' : '0fr' }}>
        <div style={{ minWidth: 0, overflow: 'hidden' }} inert={!open || undefined}>
          <ul style={LINKS}>
            {links.map((l, i) => (
              <li key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {i > 0 ? <span aria-hidden style={RULE} /> : null}
                <button
                  type="button"
                  className="cre-atlas-topnav-link"
                  // Only in the open tray: Home's Course link and Compass Learning's
                  // name the same page, and only one of them is showing.
                  aria-current={current && isCurrentLink(l) ? 'page' : undefined}
                  onClick={() => onLink(l)}
                  style={LINK}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* Figma: 8px across (12 here, below), 28 tall — both buttons (2026-09-30, the designer's
   request; Figma draws the idle one 2px shorter), 8px
   radius, a 4px gap (8 here, below), Open Sans 13/15 SemiBold (10pt here, below); the icon 12px. Colours live on `.cre-atlas-topnav-btn` (tokens.css) so
   hover needs no !important. */
const BUTTON: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  // 8 between icon and label — Figma's 4 plus 4 (2026-10-01, the designer's
  // request).
  gap: 8,
  boxSizing: 'border-box',
  // 12 across — Figma's 8 plus 4 a side (2026-10-01, the designer's request).
  padding: '0 12px',
  height: 28,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  // SemiBold on both, current or not (2026-10-01, the designer's request;
  // Figma sets the idle one Regular).
  fontWeight: 600,
  // 10pt (13.33px): the 12px (9pt) it was, up 1pt — 2026-10-01, the
  // designer's request. Figma's is 13px. (All caps briefly, same day.)
  fontSize: '10pt',
  lineHeight: '15px',
  whiteSpace: 'nowrap',
}
/* The pointer under the current button (Figma 160:618): a downward triangle
   in the button's fill. 18 wide (50% wider than the design's ~12, 2026-09-30,
   the designer's request) and 9 deep, its bottom point rounded to a 2px
   radius (3px briefly, same day): the sides meet at 90°, so the arc starts
   2px up each side (7.59, 7.59 / 10.41, 7.59) and bottoms out at 8.17. Set
   7px below the button rather than 6, so the rounded tip reaches about as far
   as the sharp one did. */
const POINTER: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: -7,
  width: 18,
  height: 9,
  transform: 'translateX(-50%)',
  background: 'inherit',
  clipPath: "path('M0 0 H18 L10.41 7.59 A2 2 0 0 1 7.59 7.59 Z')",
}
// Unused while the plain Top Nav draws no pointer (2026-10-02); kept for a restore.
void POINTER
/* EXPANDING TOP NAV — the pointer turns to face the tray (Figma 168:894, the
   design's pointer rotated 90°): the same rounded triangle, 9 deep and 18 tall,
   set 7px off the button's right edge. */
const POINTER_RIGHT: CSSProperties = {
  position: 'absolute',
  top: '50%',
  right: -7,
  width: 9,
  height: 18,
  transform: 'translateY(-50%)',
  background: 'inherit',
  clipPath: "path('M0 0 L7.59 7.59 A2 2 0 0 1 7.59 10.41 L0 18 Z')",
}
/* The tray: the current button and its links on one tinted pill (Figma's
   #ECEEF0, 8px radius). Its fill fades in with the slide; colours and the
   easing are on `.cre-atlas-topnav-tray` / `-slide` in tokens.css. */
const TRAY: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  borderRadius: 8,
}
const SLIDE: CSSProperties = { display: 'grid' }
/* Figma: 11 from the button to the group, which pads 3 in and 8 out, inside a
   tray that pads 8 more on the right — so 14 before the first link and 16
   after the last. Links 7 apart either side of a 1px rule. */
const LINKS: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  margin: 0,
  padding: '0 16px 0 14px',
  listStyle: 'none',
  whiteSpace: 'nowrap',
}
/* Figma: Open Sans Regular 13/15 — set 10pt here to match the buttons. */
const LINK: CSSProperties = {
  padding: '4px 0',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: '10pt',
  lineHeight: '15px',
  fontWeight: 400,
}
/* 1px × 14 (Figma's 26 tall less 6 above and below), rounded. */
const RULE: CSSProperties = {
  width: 1,
  height: 14,
  borderRadius: 1,
  background: 'var(--color-atlas-topnav-rule, #8194a4)',
  flex: 'none',
}
