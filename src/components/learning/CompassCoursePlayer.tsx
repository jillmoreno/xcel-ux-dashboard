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
  Plus,
  Sliders,
  X,
} from '@/icons'
import {
  NY_LH_COURSE_CHAPTERS,
  NY_LH_CURRENT_CHAPTER_INDEX,
} from '@/data/nyProducerRequirements'
import { readExamDate } from '@/data/examDateStore'
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
          sectionTitle={currentChapter}
          percentComplete={percentComplete}
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
        <p style={percentChipStyle}>{percentComplete}% Complete</p>
      </div>

      <p style={sidebarEyebrowStyle}>Table of Contents</p>
      <ol style={tocListStyle}>
        {NY_LH_COURSE_CHAPTERS.map((chapter, i) => {
          const done = i < NY_LH_CURRENT_CHAPTER_INDEX
          const now = i === NY_LH_CURRENT_CHAPTER_INDEX
          const upNext = i === NY_LH_CURRENT_CHAPTER_INDEX + 1
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
              {/* The one-word state line under a section, as drawn. Only the
                  finished section and the one after the current section carry
                  it; the rest are unlabelled, which is what makes the two that
                  are labelled read as positions rather than as decoration. */}
              {done && i === NY_LH_CURRENT_CHAPTER_INDEX - 1 ? (
                <p style={tocStateLineStyle}>Done</p>
              ) : null}
              {upNext ? <p style={tocUpNextStyle}>Up next</p> : null}
            </li>
          )
        })}
      </ol>

      <p style={sidebarEyebrowStyle}>Resources</p>
      <p style={sidebarItemStyle}>Get Help</p>
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
          <Check size={7} aria-hidden style={{ color: 'var(--color-text-inverse)' }} />
        </span>
      ) : (
        <span aria-hidden style={now ? tocRingNowStyle : tocRingIdleStyle} />
      )}
      <span style={now ? tocSectionTextNowStyle : tocSectionTextStyle}>{title}</span>
      {now ? <span style={tocNowBadgeStyle}>Now</span> : null}
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
            <Check size={6} aria-hidden style={{ color: 'var(--color-text-inverse)' }} />
          </span>
        ) : (
          <span aria-hidden style={now ? tocRingSmallStyle : tocRingSmallIdleStyle} />
        )}
        <span style={now ? tocChildTextNowStyle : tocChildTextStyle}>{label}</span>
        {now ? <span style={tocNowBadgeStyle}>Now</span> : null}
      </span>
    </span>
  )
}

/* ─── the top bar ──────────────────────────────────────────────────────── */

function CompassTopBar({
  sectionTitle,
  percentComplete,
  onClose,
  closeLabel,
}: {
  sectionTitle: string
  percentComplete: number
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
        <span style={progressPillStyle}>
          <span style={pillTextStyle}>
            <strong style={{ fontWeight: 700 }}>Section:</strong> {sectionTitle}
          </span>
          <span aria-hidden style={progressTrackStyle}>
            {/* The dot rides the percentage. The Figma pins it at the left
                because the mock is drawn at 0%; reading it as "always left"
                would make the pill state a number its own indicator disagrees
                with. Inset by half the dot so it cannot overhang either end. */}
            <span
              style={{
                ...progressDotStyle,
                left: `calc(${Math.min(100, Math.max(0, percentComplete))}% - 6.5px)`,
              }}
            />
          </span>
          <span style={pillStrongStyle}>{percentComplete}%</span>
        </span>
      </div>

      <div style={topBarActionsStyle}>
        <span style={squarePillStyle}>
          <FileText size={13} aria-hidden style={mutedIconStyle} />
          <span style={pillStrongStyle}>Notes</span>
          <span style={notesCountStyle}>0</span>
        </span>
        {/* DASHED, as drawn — the design marks this control as the one that is
            not real yet, and the dashed border is how it says so. Kept rather
            than tidied to a solid one: it is the mock's own annotation. */}
        <span style={demoPillStyle}>
          <Plus size={13} aria-hidden style={mutedIconStyle} />
          <span style={pillStrongStyle}>Demo</span>
        </span>
        <span style={rubiPillStyle}>
          <RubiMark size={16} />
          <span style={pillStrongStyle}>Rubi</span>
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

const sidebarTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '21px',
  color: 'var(--color-text-secondary)',
}

const percentChipStyle: CSSProperties = {
  margin: 0,
  alignSelf: 'flex-start',
  padding: '0 8px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-neutral-75)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-neutral-800)',
}

const sidebarEyebrowStyle: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1.1px',
  textTransform: 'uppercase',
  lineHeight: '16.5px',
  color: 'var(--color-primary-500)',
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
  width: 12,
  height: 12,
  flexShrink: 0,
  borderRadius: '50%',
  marginTop: 2,
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

const tocRingSmallStyle: CSSProperties = { ...tocRingNowStyle, width: 11, height: 11 }
const tocRingSmallIdleStyle: CSSProperties = { ...tocRingIdleStyle, width: 11, height: 11 }
const tocDoneDotSmallStyle: CSSProperties = { ...tocDoneDotStyle, width: 11, height: 11 }

const tocItemStyle: CSSProperties = { position: 'relative' }

const tocThreadLineStyle: CSSProperties = {
  position: 'absolute',
  /* Centred under a 12px bullet at the row's left edge: 6 - half the 1px rule. */
  left: 5.5,
  /* Starts below the bullet (3px row padding + 2px nudge + 12px bullet + 2) and
     runs past the item's own bottom to cross the list gap. */
  top: 19,
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
const tocStateLineStyle: CSSProperties = {
  margin: '2px 0 0',
  display: 'flex',
  alignItems: 'center',
  minHeight: 20,
  paddingLeft: 21,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-text-tertiary)',
}

const tocUpNextStyle: CSSProperties = {
  margin: '2px 0 0',
  display: 'flex',
  alignItems: 'center',
  minHeight: 18,
  paddingLeft: 21,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  /* Tertiary, like Done. These two are STATE LABELS on the row above them, not
     entries in the tree — at the same weight and colour as a chapter they read
     as a twelfth and thirteenth chapter called "Done" and "Up next". */
  color: 'var(--color-text-tertiary)',
}

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

const tocNowBadgeStyle: CSSProperties = {
  marginLeft: 'auto',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-primary-500)',
}

const sidebarItemStyle: CSSProperties = {
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  minHeight: 34,
  padding: '4px 8px 4px 16px',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '20px',
  color: 'var(--color-neutral-700)',
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

const progressPillStyle: CSSProperties = {
  ...pillBase,
  gap: 8,
  padding: '9px 16px',
  minWidth: 0,
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

const progressTrackStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  width: 260,
  maxWidth: '30vw',
  height: 4,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-300)',
  flexShrink: 0,
}

const progressDotStyle: CSSProperties = {
  position: 'absolute',
  width: 13,
  height: 13,
  borderRadius: '50%',
  background: 'var(--color-surface-card)',
  border: '2px solid var(--color-primary-500)',
}

const squarePillStyle: CSSProperties = {
  ...pillBase,
  padding: '9px 14px',
  borderRadius: 'var(--radius-md)',
}

const demoPillStyle: CSSProperties = {
  ...squarePillStyle,
  borderStyle: 'dashed',
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

