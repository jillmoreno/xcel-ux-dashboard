import { useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CompassSidebar, CompassPageBody, type CompassPage } from './CompassCoursePlayer'
import { HYBRID_COMPASS_PAGES, HYBRID_COMPASS_PAGES_WITH_WORKSPACE } from './compassPages'
import { useDeclareDesignSurface, type DesignSurfaceId } from '@/context/designSurface'
import { CompassRail } from './CompassRail'
import { CompassLearningOverview, OverviewHeader } from './CompassLearningOverview'
import { CompassCourseLanding } from './CompassCourseLanding'
import { CompassReadinessOverview } from './CompassReadinessOverview'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { CompassWorkspace } from './CompassWorkspace'
import type {
  WorkspaceDeviceView,
  WorkspaceHome,
  WorkspaceLayout,
  WorkspaceRubiShape,
  WorkspaceSessionView,
  WorkspaceStory,
} from './compassWorkspaceModel'
import { useNavPlacement } from '@/components/layout/navPlacement'
import { CompassStudyPlanner } from './CompassStudyPlanner'
import { CompassPlanProvider } from './CompassPlanContext'
import { CompassJeffMvpShell } from './CompassJeffMvpShell'
import { CompassRefinedShell } from './CompassRefinedShell'
import { JEFF_MVP_PAGES, JEFF_MVP_SUBPAGES, type JeffMvpPage } from '@/data/compassJeffMvpFixtures'
import type { RefinedHeroStyle } from './CompassReadinessRefined'
import type { FocusLayout } from './CompassRefinedFocus'

/**
 * COMPASS LEARNING — the top nav's second destination (Figma 765:3471).
 *
 * The frame is the Compass course chrome reached from the HEADER rather than
 * by launching a course: the 220px sidebar on the left, and on the right a
 * page header (eyebrow, title, the exam-date strip) over the populated
 * Overview body.
 *
 * ⚠ IT REUSES `CompassSidebar` RATHER THAN DRAWING ONE. The sidebar already
 * carries exactly the eight rows the design draws — Overview, Course,
 * Flashcards, Exam Simulator, Progress, Resources, Readiness, Rubi Insights —
 * plus the breadcrumb, course title and progress bar above them. Rebuilding it
 * here would have produced a second sidebar to keep in step with the first.
 *
 * ⚠ IT OPENS ON OVERVIEW, where the launcher opens on Course. That is the
 * difference between the two entrances: launching a course means "take me into
 * the courseware", and choosing Compass Learning from the nav means "show me
 * where I am". The other seven pages are the player's own bare grounds,
 * unchanged.
 *
 * ⚠ THE BREADCRUMB IS THE PLAYER'S, NOT THE MOCK'S. The Figma draws "Home /
 * My Learning / Course"; `CompassSidebar` renders "Home → Overview → …", which
 * is a recorded direct correction from 2026-09-23 with its reasoning written
 * beside it. Reversing a decision that deliberate on the strength of a
 * screenshot is not a call this page should make on its own.
 */
export function CompassLearningPage({
  courseTitle,
  percentComplete,
  completedLessons,
  totalLessons,
  timeRemaining,
  onLeave,
  onStartSession,
}: {
  courseTitle: string
  percentComplete: number
  completedLessons: number
  totalLessons: number
  /** "17 days" — the subtext under the title. */
  timeRemaining?: string
  /** Home — the one crumb that leaves. */
  onLeave: () => void
  /** Open the session (the Tonight card's Start session). */
  onStartSession?: (from?: 'overview' | 'course') => void
}) {
  const [seedParams] = useSearchParams()
  /* THE PAGE IS SEEDED FROM THE URL ONCE, then lives in state (2026-10-16).
     It is a seed and not a binding on purpose: clicking the rail must not
     push history, which is what the comment below is about — but LEAVING A
     LESSON has to be able to say where to land, and before this it could not.
     The X in the session bar sets `compassPage=course` so a reviewer comes
     back to Learn, the page the lesson belongs to, instead of being bounced
     to Overview as if they had just arrived. An unknown value falls through
     to Overview rather than rendering nothing. */
  const [page, setPage] = useState<CompassPage>(() => {
    const asked = seedParams.get('compassPage')
    /* ⚠ VALIDATED AGAINST THE FULL LIST, workspace included, even though the
       flag may be off. The seed runs once at mount and the flag is read below
       it; gating the seed on the flag would make `?compassPage=workspace`
       depend on hook order rather than on the flag. A workspace page with the
       flag off simply renders nothing special — the guard is on the render,
       which is where it can see the flag. */
    return HYBRID_COMPASS_PAGES_WITH_WORKSPACE.some((p) => p.id === asked)
      ? (asked as CompassPage)
      : 'overview'
  })
  /* Tell the Design bar which Compass page is open, so it can carry Anjani's
     controls for THIS page rather than all seven on every one of them. The
     page lives in state here and (apart from the seed above) never reaches the
     URL, so publishing it is the only way the bar can know. */
  /* JEFF'S COMPASS MVP — 2026-11-09. Read before the surface is declared
     because it CHANGES the surface: his MVP is one surface for all thirteen of
     his pages, so the Compass version dropdown stays on the Design bar
     wherever in his rail a reviewer has got to. Declaring `compass:readiness`
     from his Readiness page would take the control off the bar and strand
     them there. */
  const mvpVersion = useFeatureFlag('compass-mvp-version').variant
  /* THE THIRD VERSION — 2026-11-09. `refined` is Jeff's shell with the
     Readiness page rebuilt against the research; it shares his rail and his
     other pages, so it goes through the same branch with one prop set. */
  const refined = mvpVersion === 'refined'
  const jeffMvp = mvpVersion === 'jeff' || refined
  /* ⚠ OVERVIEW, AS HIS EXPORT OPENS — changed 2026-11-09 when the Overview
     was ported. It was 'readiness' for one page's worth of work, because
     landing a reviewer on a "not ported yet" panel is worse than landing them
     on the wrong page. Now that his first rail row exists, the default is his
     again.

     ⚠ EXCEPT ON THE REFINED ARM, which opens on READINESS: it is the one page
     of that version that differs, and a reviewer who picked "Refined" and
     landed on Jeff's Overview would have no way to tell the switch had
     happened. Seeded once, like the page above — picking a rail row after
     that is the reviewer's, not the flag's. */
  /* ⚠ AND IT IS SEEDABLE FROM THE URL, like Anjani's page above — 2026-11-11.
     `compassPage` named only HER page, so there was no way to open his MVP or
     Refined anywhere but their landing page. That is fine for a reviewer who
     will click the rail; it is not fine for a /review link, which iframes the
     same route three times to compare ONE card and got three copies of the
     Readiness page instead. A deep link that cannot reach the page being
     reviewed makes the review page useless for this whole version.
     ⚠ ONE PARAM FOR BOTH ARMS, and the value decides which list it belongs
     to — an id his rail does not know falls through to the seed below rather
     than rendering the not-ported panel. */
  const [jeffPage, setJeffPage] = useState<JeffMvpPage>(() => {
    const asked = seedParams.get('compassPage')
    const known =
      JEFF_MVP_PAGES.some((p) => p.page === asked) || JEFF_MVP_SUBPAGES.some((p) => p.page === asked)
    if (asked && known) return asked as JeffMvpPage
    return refined ? 'readiness' : 'overview'
  })
  /* The Refined page's Readiness to Pass section — single ring (default) or
     the tested three rings with a matching key. Read here with the other
     Compass controls; the page is a plain function of its props. */
  const refinedHero = useFeatureFlag('compass-refined-readiness-hero').variant as RefinedHeroStyle
  /* ⚠ THE OVERVIEW'S MERGED PROGRESS + NEXT CARD — 2026-11-11, three
     arrangements while the shape is being decided. Read here with the other
     Compass controls so every component below stays a plain function of its
     props. */
  const overviewFocus = useFeatureFlag('compass-overview-focus').variant as FocusLayout
  useDeclareDesignSurface(
    refined ? 'compass:refined' : jeffMvp ? 'compass:jeff-mvp' : (`compass:${page}` as DesignSurfaceId),
  )
  /* ⚠ ANJANI'S COMPASS IS A FLAG, NOT A VERSION — 2026-10-15. From 2026-10-08
     her rail and course landing were gated on `isHybridVersion`, which was
     right while Hybrid was the default: the Compass Prototypes row opens the
     default version, so it showed hers. On 2026-10-14 Eric's End-to-End Demo
     became the default and the same gate would have put HIS eight-row sidebar
     on the row that is hers. `compass-surface` is what `promote-to-prototype`
     can surface under the Compass group — a version check is invisible to
     it — and its `anjani` arm is what this branch's default says. The `atlas`
     arm keeps the shared sidebar for anyone who needs the old page. */
  const anjani = useFeatureFlag('compass-surface').variant === 'anjani'
  /* Resume lesson → the session's first beat. Behind a flag so the button can
     go back to being inert, which is what it was until 2026-10-16 and what
     the landing page's own note explains. */
  const resumeOpensSession = useFeatureFlag('compass-resume-opens-session').enabled

  /* ANJANI'S WORKSPACE AND ITS SIX AXES — 2026-11-04, from her v4. Read here
     rather than inside the component so the component stays a plain function
     of its props: a test can render all six layouts without a flag provider,
     and the Variants deck can put two of them side by side. */
  /* HIS READINESS PROTOTYPE — 2026-11-05. Read here with the other Compass
     controls so the body stays a plain function of its props. */
  const overviewV2 = useFeatureFlag('compass-overview-version').variant === 'v2'
  const readinessStage = useFeatureFlag('compass-readiness-stage').variant ?? 'p2'
  const workspaceOn = useFeatureFlag('compass-workspace').enabled
  const workspaceLayout = useFeatureFlag('compass-workspace-layout').variant as WorkspaceLayout
  const workspaceHome = useFeatureFlag('compass-workspace-home').variant as WorkspaceHome
  const workspaceStory = useFeatureFlag('compass-workspace-story').variant as WorkspaceStory
  const workspaceSessions = useFeatureFlag('compass-workspace-sessions').variant as WorkspaceSessionView
  const workspaceRubi = useFeatureFlag('compass-workspace-rubi').variant as WorkspaceRubiShape
  const workspaceView = useFeatureFlag('compass-workspace-view').variant as WorkspaceDeviceView
  /* The rail gains a row only when the Workspace is on. Two lists rather than
     a filter, so the rail never has to know the flag — see `compassPages.ts`. */
  const railPages = workspaceOn ? HYBRID_COMPASS_PAGES_WITH_WORKSPACE : HYBRID_COMPASS_PAGES
  const resumeToVideo = resumeOpensSession && onStartSession ? () => onStartSession('course') : undefined
  const hybrid = anjani
  /* ⚠ ONLY A SESSION TAKES OVER, not the Workspace page — 2026-11-04,
     Jillienne: "workspace page should have a left nav option, its just the
     new workspace that is a full-screen takeover". Measured on her build:
     the Workspace HOME keeps her Compass rail at 220px and draws no
     workspace bar; opening a session collapses the rail to 0 and the bar
     appears. An earlier pass made the whole page a takeover, which lost the
     rail on the one screen that still needs it. The Workspace reports its
     own mode up, because the page owns the rail. */
  const [workspaceInSession, setWorkspaceInSession] = useState(false)
  const workspaceOpen = hybrid && workspaceOn && page === 'workspace'
  const workspaceTakeover = workspaceOpen && workspaceInSession
  /* Option 3 only — the header and the rail both carry a Home there, so the
     sidebar's trail would be the third. See the prop. */
  const hideCrumb = useNavPlacement() === 'hybrid'
  return (
    /* ⚠ THE PLAN WRAPS THE WHOLE PAGE — 2026-10-15 — because the Overview's
       Tonight card and the Study planner read one plan, and switching rows
       must not reset it. See `CompassPlanContext`. */
    <CompassPlanProvider>
    {/* ⚠ HIS MVP REPLACES THE RAIL AS WELL AS THE BODY, and that is the whole
        reason it is a surface rather than a page arm. His rail is three
        learning rows, an EXAM PREP rule and five exam-prep rows below it —
        Anjani's locks those five behind a gate dialog. Rendering his pages
        inside her rail would show his design making her argument. */}
    {/* ⚠ TWO SHELLS SINCE 2026-11-10, not one with a prop. Refined was
        `CompassJeffMvpShell` with `readiness='refined'` — his rail, his
        twelve other pages, one swap — so there was no file a Refined page
        could be edited in without editing HIS. `CompassRefinedShell` is that
        seam; every slot in it still points at his component, so nothing moved
        on screen the day it landed. See `compassRefinedPages.ts`. */}
    {jeffMvp ? (
      <div style={pageStyle}>
        {refined ? (
          <CompassRefinedShell
            page={jeffPage}
            onSelectPage={setJeffPage}
            readinessHero={refinedHero}
            stage={readinessStage}
            focus={overviewFocus}
          />
        ) : (
          <CompassJeffMvpShell page={jeffPage} onSelectPage={setJeffPage} />
        )}
      </div>
    ) : (
    <div style={pageStyle}>
      {/* ⚠ HER RAIL IS A DIFFERENT OBJECT, not the shared one relabelled — see
          `CompassRail`. The first pass swapped only the row list inside
          `CompassSidebar` and was rejected: hers has the XCEL lockup where that
          one has a crumb and a progress bar, no row icons, and a footer of
          course hours / exam date / the learner. */}
      {/* ⚠ THE WORKSPACE IS A TAKEOVER — 2026-11-04, Jillienne: "the new
          workspace is supposed to be in a full screen takeover like the learn
          page". Measured on her build: entering it collapses the Compass rail
          to width 0 and the workspace shell starts at x=0, spanning the whole
          viewport under the XCEL header alone. So the rail is not rendered
          here at all while the Workspace is open — the workspace's own bar,
          with its Close, is the only chrome. Three passes drew it inside the
          Compass page with the rail still at 220px. */}
      {workspaceTakeover ? null : hybrid ? (
        <CompassRail page={page} onSelectPage={setPage} pages={railPages} />
      ) : (
      <CompassSidebar
        courseTitle={courseTitle}
        percentComplete={percentComplete}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        onLeave={onLeave}
        page={page}
        onSelectPage={setPage}
        hideCrumb={hideCrumb}
        timeRemaining={timeRemaining}
      />
      )}
      {workspaceOpen ? (
        /* HER WORKSPACE. It stands where the Study planner does — outside the
           scroll column — for the same reason: it is its own multi-column
           layout, and nesting it inside the column would collapse the three
           panes her Notebook layout is about. */
        <CompassWorkspace
          layout={workspaceLayout}
          home={workspaceHome}
          story={workspaceStory}
          sessionView={workspaceSessions}
          rubiShape={workspaceRubi}
          deviceView={workspaceView}
          onModeChange={setWorkspaceInSession}
          onClose={() => setPage('course')}
        />
      ) : hybrid && page === 'study-planner' ? (
        /* Her Study planner — the screen the rail's third row opened on an
           empty ground from 2026-10-08 until the OCT2 master drew it. It is
           its own two-column layout (the plan and calendar, Rubi's panel), so
           it stands where the scroll column would be rather than inside it. */
        <CompassStudyPlanner />
      ) : (
      <div style={hybrid ? mainAnjaniStyle : mainStyle}>
        {page === 'overview' ? (
          <>
            {/* ⚠ TWO HEADERS. Hers — "Welcome back, Jordan / Your learning
                journey" — on her surface (2026-10-15, "the overview page does
                not match anjanis link"); the Figma frame's "Let's get started /
                Compass Learning" with the exam strip stays on the atlas arm. */}
            {/* ⚠ THE V2 OVERVIEW BRINGS ITS OWN HEADER — "Your exam prep",
                with the licence, the exam date and the Readiness phase on one
                line. Leaving hers above it stacked two headers and two
                different claims about what the page is, which is the
                two-logos mistake in another costume. */}
            {overviewV2 ? null : hybrid ? (
              <OverviewHeader />
            ) : (
              <header style={headerStyle}>
                <div style={{ minWidth: 0 }}>
                  <p style={eyebrowStyle}>Let’s get started</p>
                  <h1 style={titleStyle}>Compass Learning</h1>
                </div>
                <ExamDateStrip />
              </header>
            )}
            {/* ⚠ THE READINESS PROTOTYPE IS AN ARM OF THE OVERVIEW, not a
                new page — 2026-11-05. His V2 rebuilds this same screen around
                Readiness, so it replaces the body rather than sitting beside
                it, and `compass-overview-version` is what chooses. Anjani's
                is the default because it is what ships. */}
            {overviewV2 ? (
              <CompassReadinessOverview stage={readinessStage} />
            ) : (
              <CompassLearningOverview
                onStartSession={onStartSession ? () => onStartSession('overview') : undefined}
                onViewPlan={() => setPage('study-planner')}
              />
            )}
          </>
        ) : hybrid && page === 'course' ? (
          /* Resume lesson opens the session at its first beat, the video
             (2026-10-16). `onStartSession` is the same handler the Tonight
             card uses, so there is one way into the player rather than two
             that could drift. Undefined when the page has no session to open,
             and the button then draws exactly as before. */
          <CompassCourseLanding onResume={resumeToVideo} />
        ) : (
          /* Every other page is the player's own, so it stays the player's —
             including the deliberate blank grounds. */
          <CompassPageBody page={page} />
        )}
      </div>
      )}
    </div>
    )}
    </CompassPlanProvider>
  )
}

/**
 * The exam-date strip the design puts top-right.
 *
 * ⚠ "TO BE SCHEDULED" IS HARDCODED, and it matches the mock rather than the
 * app: the real date lives in `examDateStore` and the Home page's Exam Date
 * card is what writes it. Reading it here would make the two disagree the
 * moment a reviewer enters a date on Home, because Edit below does nothing
 * yet — a strip that states a date it cannot change is worse than one that
 * states the demo's state. Wire both halves together, or neither.
 */
function ExamDateStrip() {
  return (
    <div style={examStripStyle}>
      <span style={examLabelStyle}>State License Exam Date: To be Scheduled</span>
      <button type="button" style={examEditStyle}>
        Edit
      </button>
    </div>
  )
}

/* FLEX WITH `minHeight: 0`, NOT A GRID WITH A `100vh` FLOOR — the shape
   `CompassCoursePlayer` uses, and this page is its sibling: both are returned
   ABOVE the shell grid and both draw their own sidebar, so both should size
   against their parent rather than against the viewport. A `100vh` floor
   inside the demo frame's own chrome is a second, competing height for the
   same box. */
const pageStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  flex: 1,
  minHeight: 0,
  background: 'var(--color-surface-page)',
}
/* The scroll container. The sidebar stays put and this column moves, which is
   what the frame draws and what the player does. */
/* Her `#screen-dashboard .main`: 36/44 padding, 1120 wide, the long bottom
   pad that keeps the last band clear of the docked Ask Rubi bar in her file. */
const mainAnjaniStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: 'auto',
  padding: '36px 44px 140px',
}
const mainStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: 'auto',
  padding: '28px 40px 96px',
}
const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 24,
  marginBottom: 28,
}
const eyebrowStyle: CSSProperties = {
  margin: '0 0 4px',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-700)',
}
const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1.15,
  color: 'var(--color-text-primary)',
}
const examStripStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  justifyContent: 'space-between',
  background: 'var(--color-neutral-100)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 6,
  padding: '10px 16px',
  minWidth: 462,
  flex: 'none',
}
const examLabelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}
const examEditStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--color-primary-600)',
}
