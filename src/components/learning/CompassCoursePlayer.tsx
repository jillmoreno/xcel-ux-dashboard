import type { CSSProperties } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDay,
  ChevronRight,
  Check,
  FileText,
  House,
  MagnifyingGlass,
  Sliders,
  X,
} from '@/icons'
import {
  NY_LH_COURSE_CHAPTERS,
  NY_LH_CURRENT_CHAPTER_INDEX,
  NY_LH_LESSON_MINUTES_INVENTED,
} from '@/data/nyProducerRequirements'
import { readExamDate } from '@/data/examDateStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatExamChip } from './compassPlayerUtil'

/**
 * COMPASS COURSE PLAYER — Figma `Atlas-Compass-Global-Navigation`, node 49:2903.
 *
 * What a learner lands in after "Start course" / "Resume" on the Jump Back In
 * card. It replaces the lo-fi placeholder that has stood in the launcher since
 * 2026-09-17 ("this is where Compass Course content will live"), and it is
 * behind `course-launcher-style` so the two can be compared — see that flag's
 * own note.
 *
 * A FULL-WINDOW TAKEOVER, which is the load-bearing structural decision and
 * the direct answer to a question asked before building. The design draws its
 * OWN 260px left sidebar — breadcrumb, course title, table of contents — in
 * the space the dashboard rail occupies, so the two cannot both be on screen.
 * `PlatformShell` therefore renders this INSTEAD of the rail + content column
 * rather than inside it, keeping only the global header above (which the design
 * also draws, unchanged: logo, cart, notifications, avatar).
 *
 * STATIC, deliberately and by instruction. Everything here renders its real
 * state and nothing is wired except Close — no chapter navigation, no working
 * Notes, search, settings or Rubi thread. The centre stays a "Course Content"
 * placeholder because that is what the Figma itself draws: the player's chrome
 * is the subject of this design, not the courseware inside it.
 *
 * EVERY FIGURE IS REAL, which is the other answer to a question asked first.
 * The mock says "Florida Life & Health", a Florida chapter list and
 * "August 14, 2026 · 8 Days Out". None of that is here. The title, the
 * percentage and the table of contents come from the NY fixtures the rest of
 * the product reads, and the date chip reads the exam date the learner entered
 * on Schedule State Exam — so the player agrees with the dashboard behind it
 * rather than stating a second, prettier set of facts.
 *
 * ONE HONEST GAP, recorded rather than filled. The design's contents tree has
 * TWO levels — sections ("Insurance Basics") containing chapters, a Knowledge
 * Check and a Recap. `NY_LH_COURSE_CHAPTERS` is ELEVEN FLAT CHAPTERS; nothing
 * in this repo knows which chapters group into which section, and the study
 * guide the list came from does not publish it. So the chapters render as the
 * tree's top level and the child level is absent — the states (done · now ·
 * up next) are all real, and no section names were invented to produce a
 * hierarchy the fixtures cannot support. When a real outline arrives, the
 * child row is `TocChildItem` below, already built and already styled.
 */
export function CompassCoursePlayer({
  courseTitle,
  percentComplete,
  onClose,
  closeLabel,
}: {
  courseTitle: string
  percentComplete: number
  onClose: () => void
  /** Names what Close returns to, for the screen-reader label only — the
   *  design gives the control no visible text. */
  closeLabel: string
}) {
  const currentChapter =
    NY_LH_COURSE_CHAPTERS[NY_LH_CURRENT_CHAPTER_INDEX] ?? NY_LH_COURSE_CHAPTERS[0]

  return (
    <div style={playerStyle}>
      <CompassSidebar
        courseTitle={courseTitle}
        percentComplete={percentComplete}
        onLeave={onClose}
      />
      <div style={rightOfSidebarStyle}>
        <CompassTopBar
          chapterTitle={currentChapter}
          onClose={onClose}
          closeLabel={closeLabel}
        />
        <div style={playerBodyStyle}>
          <div style={readingColumnStyle}>
            <main style={readingMainStyle}>
              {/* THE PLACEHOLDER IS THE DESIGN, not a stand-in for it. The
                  Figma draws this same empty card and caption — the courseware
                  is Compass's, served into this frame, and neither the mock nor
                  this repo has it. Drawing a fake lesson here would be the one
                  thing the surrounding chrome is honest about avoiding. */}
              <div style={contentCardStyle}>
                <p style={contentCaptionStyle}>Course Content</p>
                <div aria-hidden style={contentBlockStyle} />
              </div>
            </main>
            <footer style={readingFooterStyle}>
              {/* Disabled-looking at 40% opacity, as drawn: chapter one of the
                  current section has nothing before it. Not a `disabled`
                  button — nothing here is wired, and a real disabled state
                  would claim the rest is not. */}
              <span style={prevButtonStyle}>
                <ArrowLeft size={16} aria-hidden />
                Previous
              </span>
              {/* "Next", not the Figma's "Next: Reading" — 2026-09-22, the
                  direct ask. The mock's suffix names the TYPE of the next item
                  (a reading, a knowledge check, a recap), which this cannot
                  know: the contents tree is eleven flat chapters and the centre
                  is a placeholder, so there is nothing here that knows what
                  comes next is a reading. The bare verb is the honest half, and
                  the suffix comes back with the outline that would populate
                  it — same gap `TocChildItem` is waiting on. */}
              <span style={nextButtonStyle}>
                Next
                <ArrowRight size={16} aria-hidden />
              </span>
            </footer>
          </div>
          <RubiAside />
        </div>
      </div>
    </div>
  )
}

/* ─── the 260px sidebar ────────────────────────────────────────────────── */

function CompassSidebar({
  courseTitle,
  percentComplete,
  onLeave,
}: {
  courseTitle: string
  percentComplete: number
  /** Both crumbs are "up" from the player, and up is the dashboard. */
  onLeave: () => void
}) {
  return (
    <aside style={sidebarStyle} aria-label="Course contents">
      {/*
        BREADCRUMB — the two crumbs are REAL, as of 2026-09-22, and wear the
        house link-CTA (`cre-link-action cre-cta-ink`): the direct ask, pointed
        at "Customize Study Plan" on Home.

        THEY WERE STATIC, and the note here argued that rendering them as
        anchors "would offer two exits and honour one". The ask settles the
        other half of that trade: dressing them as the house CTA and leaving
        them inert is the worse end of it — a control that looks pressable and
        is not is what gets reported as broken, which is the rule the rest of
        this player's chrome follows by NOT looking pressable. So they got the
        style and the behaviour together.

        BOTH GO TO THE SAME PLACE, which is honest rather than sloppy: up from
        the course player is the dashboard, and there is no separate Overview
        surface in this product to send the second one to. If one ever exists,
        this is the call site.

        NO INLINE `color`. `.cre-cta-ink` carries it and re-points on the dark
        theme; an inline colour would beat the stylesheet, which is the trap
        that class's own note in `tokens.css` records.

        "Course" stays a plain span — it is the page you are on, and a
        breadcrumb's last crumb is not a link.
      */}
      <p style={breadcrumbStyle}>
        {/* "Home" BESIDE THE GLYPH, and the `aria-label` went with it. With a
            visible word the label has to match it (WCAG 2.5.3, Label in Name);
            "Back to the dashboard" beside the word "Home" is exactly the
            mismatch that rule exists for, so the visible text is the accessible
            name now. It also fixes the 13x13 hit area the UX scan flagged —
            the control is a word plus a glyph rather than a 13px icon. */}
        <button
          type="button"
          onClick={onLeave}
          className="cre-link-action cre-cta-ink"
          style={crumbButtonStyle}
        >
          <House size={13} aria-hidden />
          Home
        </button>
        <span aria-hidden style={crumbSlashStyle}>
          /
        </span>
        <button
          type="button"
          onClick={onLeave}
          className="cre-link-action cre-cta-ink"
          style={crumbButtonStyle}
        >
          Overview
        </button>
        <span aria-hidden style={crumbSlashStyle}>
          /
        </span>
        <span style={crumbHereStyle} aria-current="page">
          Course
        </span>
      </p>

      <div style={sidebarHeadStyle}>
        <h1 style={sidebarTitleStyle}>{courseTitle}</h1>
        {/*
          THE HOME PAGE'S TREATMENT — 2026-09-23, the direct ask: "change the
          progress in the nav to better match the style used in the Home page."

          It was a grey pill reading "62% Complete". Home states the same fact
          as the SHARED `ProgressBar` with the percentage printed beside it, and
          this is now the only progress readout in the player (the top bar's was
          removed in the same pass), so it is the one that has to be right.

          THE SHARED COMPONENT, NOT A LOOKALIKE, which is the rule that
          component was extracted for: Readiness once drew its own 3px bar in a
          different green and one learner's 32% became two different bars a rail
          item apart. The percentage is printed beside it because `ProgressBar`
          deliberately carries no label of its own.

          NO `track` OVERRIDE, unlike Home's call. The default
          `--color-neutral-100` measures 1.08:1 on the shell's page grey, which
          is why the band passes a darker groove — this sidebar is
          `--color-surface-card`, the white the default was designed for.
        */}
        <div style={progressRowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ProgressBar pct={percentComplete} height={8} fill="var(--color-primary-500)" />
          </div>
          <span style={progressPctStyle}>{percentComplete}%</span>
        </div>
      </div>

      <p style={sidebarEyebrowStyle}>Table of Contents</p>
      <ol style={tocListStyle}>
        {NY_LH_COURSE_CHAPTERS.map((chapter, i) => {
          const done = i < NY_LH_CURRENT_CHAPTER_INDEX
          const now = i === NY_LH_CURRENT_CHAPTER_INDEX
          return (
            <li key={chapter} style={tocItemStyle}>
              {/* THE DASHED THREAD joining one bullet to the next. Drawn per
                  item and omitted on the last, so the line ends at the final
                  bullet rather than trailing into the Resources heading. It
                  crosses the list's 6px gap (`bottom: -6`) — without that it
                  would break at every item boundary, which is the opposite of
                  connecting them. `aria-hidden`: the states are already in the
                  text and the icons, and a decorative rule is not a third. */}
              {i < NY_LH_COURSE_CHAPTERS.length - 1 ? (
                <span aria-hidden style={tocThreadLineStyle} />
              ) : null}
              <TocSectionTitle title={chapter} done={done} now={now} />
              {/*
                NO STATE LABELS AT ALL — 2026-09-22, two asks a few minutes
                apart: "Now" and "Up next" first, then "remove Done too".

                All three were the Figma's, and they earned their place there:
                the mock's bullets are all the same open circle, so the words
                were the only thing separating done from current from untouched.
                That stopped being true when the bullets became three distinct
                states earlier the same day — a filled navy tick, a navy ring, a
                grey ring — and the current chapter went bold navy in its text
                as well. Each label was a second telling of what its own bullet
                already said.

                The tree is now bullets and chapter names, and nothing else.
              */}
            </li>
          )
        })}
      </ol>

      {/* RESOURCES / GET HELP REMOVED — 2026-09-22, the direct ask pointed at
          "Get Help". The EYEBROW went with it rather than being left behind: it
          was the section's only item, and a heading with nothing under it reads
          as a failed render rather than as a deliberate empty state. Support is
          not lost — the dashboard rail this player covers still carries Get
          Help, and Close is two clicks from it. */}
    </aside>
  )
}

function TocSectionTitle({
  title,
  done,
  now,
}: {
  title: string
  done: boolean
  now: boolean
}) {
  return (
    <span style={tocSectionRowStyle}>
      {/*
        THREE STATES, THREE BULLETS — 2026-09-22, the direct ask. They were two
        (an outline check for done, one navy ring for everything else), which
        made the current chapter and the eight untouched ones identical.

          - DONE is a SOLID navy disc with a white check. There is no solid
            `circle-check` in `@/icons` — only the outline — so the disc is CSS
            and the tick is the registry's bare `Check` sitting in it. That is
            a composition of two things the repo already has rather than a new
            asset to keep in sync.
          - NOW is the navy OUTLINE ring, which the mock already had right.
          - NOT STARTED is the same ring in `--color-neutral-300`. Grey is the
            whole signal: a navy ring on a chapter nobody has opened reads as
            active, which is what it looked like before.

        Still CSS rings rather than a `circle` glyph: there is none in the
        registry, and `circle-dashed` is the nearest, which reads as "optional"
        — the wrong claim for a chapter simply not reached yet.
      */}
      {done ? (
        <span aria-hidden style={tocDoneDotStyle}>
          {/* 9 in a 14 disc — the ratio FA's own solid `circle-check` uses.
              STROKED as well as sized, and the stroke is the half that fixes
              it: the registry is Font Awesome Pro LIGHT, so `check` is a
              hairline path drawn for 16px and up. Scaled to 9 it renders
              sub-pixel and the disc reads as a plain dot, which is what "cant
              see the checkmark" was. Painting the same `currentColor` as a
              stroke thickens the glyph without a second asset or a heavier
              weight the registry does not have. 38 of a 448-unit viewBox is
              roughly a Regular-weight stem. */}
          <Check
            size={9}
            aria-hidden
            style={{
              color: 'var(--color-text-inverse)',
              stroke: 'currentColor',
              strokeWidth: 38,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
          />
        </span>
      ) : (
        <span aria-hidden style={now ? tocRingNowStyle : tocRingIdleStyle} />
      )}
      <span style={now ? tocSectionTextNowStyle : tocSectionTextStyle}>{title}</span>
    </span>
  )
}

/**
 * A CHILD ROW — built, styled to the design, and NOT RENDERED, which is
 * deliberate and is the component half of the "one honest gap" the file header
 * records. `NY_LH_COURSE_CHAPTERS` is flat, so there are no children to pass
 * it. It is kept rather than deleted because the moment a real outline lands
 * this is the row it renders into, and rebuilding it from the Figma a second
 * time is the work this saves.
 */
export function TocChildItem({
  label,
  done,
  now,
}: {
  label: string
  done: boolean
  now: boolean
}) {
  return (
    <span style={tocChildRowStyle}>
      <span aria-hidden style={tocThreadStyle} />
      <span style={now ? tocChildInnerNowStyle : tocChildInnerStyle}>
        {/* The same three states as a section title, one step smaller — a
            child row that marked done differently from its parent would read
            as a different kind of completion. */}
        {done ? (
          <span aria-hidden style={tocDoneDotSmallStyle}>
            <Check
              size={8}
              aria-hidden
              style={{
                color: 'var(--color-text-inverse)',
                stroke: 'currentColor',
                strokeWidth: 38,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }}
            />
          </span>
        ) : (
          <span aria-hidden style={now ? tocRingSmallStyle : tocRingSmallIdleStyle} />
        )}
        <span style={now ? tocChildTextNowStyle : tocChildTextStyle}>{label}</span>
      </span>
    </span>
  )
}

/* ─── the top bar ──────────────────────────────────────────────────────── */

function CompassTopBar({
  chapterTitle,
  onClose,
  closeLabel,
}: {
  chapterTitle: string
  onClose: () => void
  closeLabel: string
}) {
  /* THE DATE CHIP READS THE LEARNER'S OWN EXAM DATE. The mock hardcodes
     "August 14, 2026 · 8 Days Out"; this reads `cgp.examDate` — the date typed
     on Schedule State Exam — so the player and the dashboard behind it cannot
     state two different exam dates. With nothing entered the chip is OMITTED
     rather than defaulted: a countdown to a date nobody gave is the invented
     figure this repo refuses everywhere else. */
  const examDate = readExamDate()
  const examChip = examDate ? formatExamChip(examDate) : null

  return (
    <header style={topBarStyle}>
      <div style={topBarLeftStyle}>
        {examChip ? (
          <span style={pillStyle}>
            <CalendarDay size={13} aria-hidden style={mutedIconStyle} />
            <span style={pillStrongStyle}>{examChip.date}</span>
            <span aria-hidden style={pillDotStyle} />
            <span style={pillTextStyle}>{examChip.countdown}</span>
          </span>
        ) : null}
        {/*
          OUT OF THE PILL — 2026-09-23, the direct ask: "this should definitely
          include the Chapter Name, and lesson details here, maybe take it out
          of the pill".

          The pill was the problem, not the styling of it. A fixed-height
          rounded container with `white-space: nowrap` had one line to spend on
          a chapter name that runs to 48 characters, so it truncated to "Life
          Insurance Premiu…" — the one fact the bar exists to state, elided.
          Unwrapped, the name gets a line of its own and the lesson detail gets
          the one beneath it.

          ⚠ "SECTION:" IS GONE, AND THAT IS A CORRECTION, not a trim. The label
          said Section and the number beside it is the COURSE percentage — the
          same 62% the sidebar prints under the course title. Nothing here
          tracks per-chapter progress, so a "Section: …  62%" pill was quietly
          attributing the whole course's progress to one chapter. The figure now
          says what it is.
        */}
        <span style={nowPlayingStyle}>
          {/* NO EYEBROW — 2026-09-23, added and removed within the hour.
              "Current Lesson" sat here for one build, and its removal settles a
              tension it had introduced: the title below is a CHAPTER name from
              `NY_LH_COURSE_CHAPTERS`, and the course counts 42 lessons against
              11 chapters with nothing published mapping one onto the other. A
              label reading "Current Lesson" over a chapter asserted that
              equivalence. Without it the bar states the chapter and its
              estimate and claims nothing about the unit.

              The lesson NUMBER and PART, which the eyebrow had replaced, remain
              unrendered here — the Jump Back In card states both, and the
              number still reaches the launcher through `LaunchedCourseMeta`. */}
          <span style={nowPlayingChapterStyle}>{chapterTitle}</span>
          {/* THE ESTIMATE, as the Home card states it — 2026-09-23, the direct
              ask: "add the estimated time to complete line under the title like
              we have in the home card." Same words, same 12/16 in
              `--color-text-secondary`, same 4px above, so the two read as one
              sentence repeated rather than two facts that happen to agree.

              ⚠ THE FIGURE IS INVENTED and now says so on a SECOND surface.
              `NY_LH_LESSON_MINUTES_INVENTED` carries the warning in its name:
              nothing in the fixtures knows a lesson's length, and this version
              refused the reference mock's "· 14 minutes left" three times on
              exactly that ground before it was asked for directly. Reading the
              constant rather than retyping 18 is what keeps one edit enough
              when a real duration arrives. */}
          <span style={nowPlayingEstimateStyle}>
            Estimated Time to Complete: {NY_LH_LESSON_MINUTES_INVENTED} minutes
          </span>
        </span>
        {/* NO PROGRESS HERE — 2026-09-23, the direct ask: "this progress
            belongs in the nav. we do not need multiple progress, its
            confusing."

            The bar and "62% of course" stated the same figure the sidebar
            already prints under the course title, eight inches apart on one
            screen. Two readouts of one number is not twice the information; it
            is a reader checking whether they disagree. The nav keeps it,
            because that is where the course is identified — the number belongs
            next to the thing it measures.

            The top bar is now purely WHERE YOU ARE (chapter, lesson, part) and
            the controls. That split is also why this was the right one to drop
            rather than the chip: a bar in the toolbar reads as progress through
            the current chapter, which is not what the figure is. */}
      </div>

      <div style={topBarActionsStyle}>
        <span style={squarePillStyle}>
          <FileText size={13} aria-hidden style={mutedIconStyle} />
          <span style={pillStrongStyle}>Notes</span>
          <span style={notesCountStyle}>0</span>
        </span>
        {/* THE "DEMO" PILL IS GONE — 2026-09-22, the direct ask. It was drawn
            DASHED in the mock, which is how a Figma marks a control that is not
            real yet; rendered faithfully, that annotation became a live-looking
            button in a learner's course player, which is what the UX scan
            filed under "prototype scaffolding in a learner surface". A note in
            the design is not a control in the product. */}
        {/* "Ask Rubi", not "Rubi" — 2026-09-22, the direct ask. The pill is a
            way IN to the panel, and a bare product name labels the thing
            rather than the action; the aside's own header keeps "Rubi" because
            there it IS the name of what you are looking at. */}
        <span style={rubiPillStyle}>
          <RubiMark size={16} />
          <span style={pillStrongStyle}>Ask Rubi</span>
        </span>
      </div>

      <div style={topBarActionsStyle}>
        <span style={iconButtonStyle}>
          <MagnifyingGlass size={13} aria-hidden style={mutedIconStyle} />
        </span>
        <span style={iconButtonStyle}>
          <Sliders size={13} aria-hidden style={mutedIconStyle} />
        </span>
        {/* THE ONLY WIRED CONTROL ON THE SCREEN. */}
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close course player and return to ${closeLabel}`}
          style={{ ...iconButtonStyle, cursor: 'pointer' }}
        >
          <X size={13} aria-hidden style={mutedIconStyle} />
        </button>
      </div>
    </header>
  )
}

/* ─── the Rubi aside ───────────────────────────────────────────────────── */

function RubiAside() {
  return (
    <aside style={rubiAsideStyle} aria-label="Chat with Rubi">
      <div style={rubiHeaderStyle}>
        <RubiMark size={26} />
        <span style={{ minWidth: 0 }}>
          <span style={rubiNameStyle}>Rubi</span>
          <span style={rubiTaglineStyle}>here to help</span>
        </span>
        <span style={rubiCloseStyle} aria-hidden>
          ×
        </span>
      </div>

      <div style={rubiThreadStyle}>
        <p style={rubiSpeakerStyle}>Rubi</p>
        <p style={rubiMessageStyle}>
          Ask me anything about this chapter — I&rsquo;ll keep it grounded in what
          you&rsquo;re studying.
        </p>
      </div>

      <div style={rubiComposerStyle}>
        <div style={rubiChipRowStyle}>
          <span style={rubiChipStyle}>Give an example</span>
          <span style={rubiChipStyle}>Explain simpler</span>
          <span style={rubiChipStyle}>Quiz me</span>
        </div>
        <div style={rubiInputStyle}>
          <span style={rubiPlaceholderStyle}>Ask Rubi about this…</span>
          <span style={rubiSendStyle} aria-hidden>
            <ChevronRight size={15} style={{ color: 'var(--color-text-inverse)' }} />
          </span>
        </div>
      </div>
    </aside>
  )
}

/** The Rubi hexagon, from the registry's own `rubi-mark` — NOT redrawn and not
 *  the generic star. It is the same mark the rail's Rubi Insights row uses. */
function RubiMark({ size }: { size: number }) {
  return (
    <img
      src={new URL('../../icons/rubi-mark.svg', import.meta.url).href}
      alt=""
      aria-hidden
      width={size}
      height={size}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}

/* THE GLOBAL HEADER IS NOT BUILT HERE, and that is deliberate. The design
   draws one above the player — logo, cart, notifications, avatar — and the app
   ALREADY renders exactly that: `<Header />` in `AppLayout`, above
   `PlatformShell`. Because the takeover is returned from inside the shell, that
   header stays put with no work and no second copy to drift. An earlier pass
   built a `CompassGlobalHeader` before checking; it was deleted rather than
   left as a duplicate of a component that is already on screen. */

/* ─── helpers ──────────────────────────────────────────────────────────── */

/* ─── styles ───────────────────────────────────────────────────────────── */

const playerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  flex: 1,
  minHeight: 0,
  background: 'var(--color-surface-card)',
}

const rightOfSidebarStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
}

const playerBodyStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
}

/* sidebar */

const sidebarStyle: CSSProperties = {
  width: 260,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  /* 11 on top, not 12 — it is the top bar's own padding, and the breadcrumb
     row below depends on the two matching. See `breadcrumbStyle`. */
  padding: '11px 20px 24px',
  overflowY: 'auto',
  background: 'var(--color-surface-card)',
  borderRight: '1px solid var(--color-border-subtle)',
}

/*
 * 13/600, MEASURED OFF THE REFERENCE rather than eyeballed — Home's
 * "Customize Study Plan" computes to 13px / 600 / 19.5px, and the ask was for
 * the same link-style CTA.
 *
 * The first pass took "link style" to mean the CLASSES and kept the Figma's
 * 11px/500, so the crumbs had the right colour and hover and the wrong type —
 * which is what "the size still looks wrong" was pointing at. The house CTA is
 * a type ramp as much as a colour: matching half of it is not matching it.
 *
 * The separators and the House glyph scale with it; "Course" takes the size but
 * not the weight, because it is the page you are on rather than an action.
 */
const breadcrumbStyle: CSSProperties = {
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19.5px',
  /*
   * 38px TALL AND CENTRED so the crumbs sit on the same line as the top bar's
   * "Section:" pill — 2026-09-22, the direct ask.
   *
   * IT IS ARITHMETIC, not a nudge. The sidebar and the top bar are SIBLINGS
   * starting at the same y, so aligning their contents means matching the box
   * the text sits in: the bar is `11px padding + 38px pill + 11px`, putting the
   * pill's centre at 30px. The sidebar's own top padding is 11 to match, and
   * this row is the same 38 — so its centre lands at 30 too, and the two stay
   * aligned if either one's type changes.
   */
  minHeight: 38,
  flexShrink: 0,
}

const crumbSlashStyle: CSSProperties = {
  color: 'var(--color-neutral-400)',
  fontSize: 12,
}

/* The crumb controls carry NO colour — `.cre-cta-ink` does, and it swaps on the
   dark theme. Everything else here is the reset a <button> needs to sit in a
   line of text. */
const crumbButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  /* 600 — the reference CTA's weight. Inherited size, explicit weight: the
     <p> carries the ramp and this is the half that differs from the crumb you
     are on. */
  fontWeight: 600,
}

const crumbHereStyle: CSSProperties = { color: 'var(--color-text-tertiary)', fontWeight: 500 }
/* NB: `crumbHereStyle` sets no size — it inherits the 13 from `breadcrumbStyle`
   so the three crumbs sit on one baseline, and differs only in weight and ink. */

const sidebarHeadStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '4px 8px 8px 0',
}

/*
 * THE SERIF, IN BODY BLACK — 2026-09-23, the direct ask: "change this to black
 * and the source serif font used in the home screen". It was blue for a day,
 * from the ask before this one.
 *
 * MEASURED OFF HOME rather than guessed: that page's course title computes to
 * the Georgia stack in `rgb(58,58,58)`, which are `--font-heading-serif` and
 * `--color-text-primary`.
 *
 * `--font-heading-serif` DIRECTLY, not `--font-heading`. Home reaches the serif
 * because `dashboard-heading-font: serif` re-points the heading token for that
 * subtree; the player is a full-window takeover outside it, so referencing
 * `--font-heading` here would render Lato and silently not match. The ask was
 * for the serif, so the serif is what is named.
 *
 * THE SIZE DOES NOT FOLLOW. Home sets 28/700 in a full-width band; this column
 * is 220px and the name runs to 38 characters. Matching the face and the ink is
 * what makes the two read as one product — matching the display size would put
 * a four-line headline in a sidebar.
 */
const sidebarTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const progressRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginTop: 2,
}

/* 13/700, the size and weight Home prints beside its own bar — the point of
   matching is that one learner's one percentage looks like one thing. */
const progressPctStyle: CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const sidebarEyebrowStyle: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1.1px',
  textTransform: 'uppercase',
  lineHeight: '16.5px',
  /* `--color-text-primary`, not `--color-neutral-950`: it IS the body ink and
     it re-points on the dark theme, where a literal black would vanish. */
  color: 'var(--color-text-primary)',
}

const tocListStyle: CSSProperties = {
  listStyle: 'none',
  margin: '2px 0 0',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  /* 6px BETWEEN SECTIONS. With every title on one line the design needs none —
     the 30px rows space themselves. Wrapped titles have no such gap, and two
     three-line chapters with nothing between them read as one six-line block. */
  gap: 6,
}

/*
 * TOP-ALIGNED AND PADDED, NOT THE DESIGN'S 30px CENTRED ROW — 2026-09-22.
 *
 * The Figma's section titles are short single-line labels ("Insurance Basics"),
 * so a fixed 30px row with everything vertically centred is right there. The
 * REAL chapter names are up to 48 characters and wrap to two and three lines in
 * a 220px column, and at that point the design's values fail in two ways at
 * once: the bullet floats to the middle of a three-line block instead of
 * marking its first line, and consecutive wrapped titles run together because
 * a fixed height leaves no space between them.
 *
 * So the row grows with its content, the icon pins to the first line, and the
 * spacing moves from `minHeight` to padding + a gap on the list — which is the
 * same rhythm at one line and survives three.
 */
const tocSectionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 9,
  padding: '3px 8px 3px 0',
  borderRadius: 'var(--radius-md)',
}

/* The shared bullet box. Every state is 12x12 and nudged 2px down so it sits
   optically centred on the FIRST LINE of a wrapped title — (17px line - 12px
   bullet) / 2 — rather than on the cap-line, where it reads high. All three
   share it so a state change can never move the text. */
const tocBulletBase: CSSProperties = {
  /* 14, UP FROM 12 — 2026-09-22: "this icon looks weird, cant see the
     checkmark". The tick is Font Awesome PRO LIGHT, a hairline path, and at 7px
     inside a 12px disc there was not enough room for the stroke to register as
     a check rather than as a smudge. The disc is the constraint, so the disc
     grew; the design's own done glyph is 15px, so this moves TOWARDS the mock
     rather than away — the 12 came from the type-downsizing pass and took the
     tick with it. All three states share the box, so none of them can shift
     the text relative to the others. */
  width: 14,
  height: 14,
  flexShrink: 0,
  borderRadius: '50%',
  /* (17px line - 14px bullet) / 2 ≈ 1, so the first-line nudge shrinks with
     the disc growing — without re-deriving it the bullet would sit low. */
  marginTop: 1,
  /* ABOVE THE DASHED THREAD, which runs behind the column. Without this the
     line crosses the open rings and they read as struck through. */
  position: 'relative',
  zIndex: 1,
  background: 'var(--color-surface-card)',
}

const tocRingNowStyle: CSSProperties = {
  ...tocBulletBase,
  border: '1.5px solid var(--color-primary-500)',
}

const tocRingIdleStyle: CSSProperties = {
  ...tocBulletBase,
  border: '1.5px solid var(--color-neutral-300)',
}

const tocDoneDotStyle: CSSProperties = {
  ...tocBulletBase,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-primary-500)',
}

const tocRingSmallStyle: CSSProperties = { ...tocRingNowStyle, width: 12, height: 12 }
const tocRingSmallIdleStyle: CSSProperties = { ...tocRingIdleStyle, width: 12, height: 12 }
const tocDoneDotSmallStyle: CSSProperties = { ...tocDoneDotStyle, width: 12, height: 12 }

const tocItemStyle: CSSProperties = { position: 'relative' }

const tocThreadLineStyle: CSSProperties = {
  position: 'absolute',
  /* Centred under a 14px bullet at the row's left edge: 7 - half the 1px rule. */
  left: 6.5,
  /* Starts below the bullet (3px row padding + 1px nudge + 14px bullet + 2) and
     runs past the item's own bottom to cross the list gap. Re-derived when the
     bullet grew to 14 — left stale it would start inside the disc. */
  top: 20,
  bottom: -6,
  borderLeft: '1px dashed var(--color-neutral-300)',
}

/* 13/17, down from the design's 15/20. The mock's labels are short enough that
   15 reads as a comfortable nav size; on titles that wrap twice it reads as a
   heading and the column stops being scannable. 13 is the size the design
   already uses for its CHILD rows, so this is the tree's own smaller step
   rather than a new one, and 17 tightens the leading inside a wrapped title so
   the two lines group before the gap separates them from the next item. */
const tocSectionTextStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '17px',
  color: 'var(--color-neutral-800)',
}

const tocSectionTextNowStyle: CSSProperties = {
  ...tocSectionTextStyle,
  fontWeight: 600,
  color: 'var(--color-primary-500)',
}

/* NO LEFT BORDER any more. It was a 2px solid navy rule standing in for a
   thread when there was none; with the dashed connector running down the whole
   column it would be a SECOND vertical line in the same 6px, one solid and one
   dashed, two pixels apart. The indent alone places the label now. */


const tocChildRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 17,
  minHeight: 32,
  paddingLeft: 7,
}

const tocThreadStyle: CSSProperties = {
  width: 2,
  alignSelf: 'stretch',
  flexShrink: 0,
  background: 'var(--compass-thread)',
}

const tocChildInnerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flex: 1,
  minWidth: 0,
  paddingLeft: 10,
  paddingRight: 8,
  alignSelf: 'stretch',
  borderRadius: 'var(--radius-md)',
}

const tocChildInnerNowStyle: CSSProperties = {
  ...tocChildInnerStyle,
  background: 'var(--compass-current)',
}

const tocChildTextStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-neutral-800)',
}

const tocChildTextNowStyle: CSSProperties = {
  ...tocChildTextStyle,
  flex: 1,
  minWidth: 0,
  fontWeight: 600,
  color: 'var(--color-primary-500)',
}



/* top bar */

const topBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 32,
  padding: '11px 20px',
  background: 'var(--color-neutral-75)',
  borderBottom: '1px solid var(--color-border-subtle)',
  flexWrap: 'wrap',
}

const topBarLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  minWidth: 0,
  flexWrap: 'wrap',
}

const topBarActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
}

const mutedIconStyle: CSSProperties = { color: 'var(--color-neutral-600)' }

const pillBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  height: 38,
  padding: '9px 18px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-pill)',
}

const pillStyle: CSSProperties = { ...pillBase }

const nowPlayingStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  flex: '1 1 auto',
}

const nowPlayingChapterStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  /* WRAPS rather than truncating. The pill's `nowrap` is what elided the name
     in the first place; the bar can take two lines more cheaply than the
     reader can take an ellipsis. */
  minWidth: 0,
}

/* 12/16 in `--color-text-secondary`, 4px above — the Home card's own values,
   copied deliberately rather than approximated. */
const nowPlayingEstimateStyle: CSSProperties = {
  marginTop: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}




const pillTextStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-neutral-800)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const pillStrongStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '20px',
  color: 'var(--color-neutral-800)',
  whiteSpace: 'nowrap',
}

const pillDotStyle: CSSProperties = {
  width: 3,
  height: 3,
  borderRadius: '50%',
  background: 'var(--color-neutral-600)',
  flexShrink: 0,
}



const squarePillStyle: CSSProperties = {
  ...pillBase,
  padding: '9px 14px',
  borderRadius: 'var(--radius-md)',
}


const rubiPillStyle: CSSProperties = {
  ...squarePillStyle,
  background: 'var(--compass-current)',
  borderColor: 'var(--color-neutral-200)',
}

const notesCountStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 21,
  height: 21,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-500)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
}

const iconButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 38,
  height: 38,
  padding: 9,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
}

/* reading column */

const readingColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
  background: 'var(--compass-ground)',
}

const readingMainStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '100px 104px 56px',
  display: 'flex',
  justifyContent: 'center',
}

const contentCardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 832,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 24,
  paddingTop: 24,
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--compass-content)',
  overflow: 'hidden',
}

const contentCaptionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 34,
  fontWeight: 500,
  letterSpacing: '-0.34px',
  lineHeight: '39px',
  textAlign: 'center',
  color: 'var(--compass-rule)',
}

const contentBlockStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '830 / 467',
  background: 'var(--compass-content)',
}

const readingFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  height: 72,
  /* 40, down from the Figma's 80 — 2026-09-22, the direct ask. The mock is
     drawn at 1680 wide where 80 reads as a margin; at the widths this actually
     renders the two controls were pulled well inside the reading column they
     belong to. */
  padding: '0 40px',
  background: 'var(--color-surface-card)',
  borderTop: '1px solid var(--compass-rule)',
  flexShrink: 0,
}

const footerButtonBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 44,
  padding: '0 20px',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
}

const prevButtonStyle: CSSProperties = {
  ...footerButtonBase,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--compass-edge)',
  color: 'var(--color-text-primary)',
  opacity: 0.4,
}

const nextButtonStyle: CSSProperties = {
  ...footerButtonBase,
  background: 'var(--color-primary-500)',
  border: '1px solid var(--color-primary-700)',
  color: 'var(--color-text-inverse)',
}

/* Rubi aside */

const rubiAsideStyle: CSSProperties = {
  width: 380,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-surface-card)',
  borderLeft: '1px solid var(--compass-edge)',
}

const rubiHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '16px',
  borderBottom: '1px solid var(--compass-rule)',
  flexShrink: 0,
}

const rubiNameStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.6px',
  lineHeight: '22.5px',
  color: 'var(--rubi-red)',
}

const rubiTaglineStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 10.5,
  lineHeight: '15.75px',
  color: 'var(--color-text-tertiary)',
}

const rubiCloseStyle: CSSProperties = {
  marginLeft: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--compass-rule)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
  fontSize: 16,
  lineHeight: 1,
}

const rubiThreadStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '14px 16px',
}

const rubiSpeakerStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  lineHeight: '15px',
  color: 'var(--rubi-red)',
}

const rubiMessageStyle: CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19.5px',
  color: 'var(--color-text-primary)',
}

const rubiComposerStyle: CSSProperties = {
  flexShrink: 0,
  padding: '11px 13px',
  borderTop: '1px solid var(--compass-rule)',
}

const rubiChipRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const rubiChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 22.5,
  padding: '0 10px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--compass-edge)',
  background: 'var(--color-surface-card)',
  fontFamily: 'var(--font-body)',
  fontSize: 10.5,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
}

const rubiInputStyle: CSSProperties = {
  marginTop: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 46,
  padding: '0 9px 0 11px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--compass-edge)',
}

const rubiPlaceholderStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-neutral-600)',
}

const rubiSendStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  flexShrink: 0,
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-primary-500)',
}

