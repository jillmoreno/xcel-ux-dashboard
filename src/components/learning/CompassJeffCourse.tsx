import { Fragment, useEffect, useState } from 'react'
import {
  AngleLeftRegular,
  AngleRightRegular,
  ArrowLeft,
  Check,
  Podcast,
  XmarkRegular,
  ArrowRight,
  BookOpenRegular,
  ChevronDown,
  Circle,
  CircleCheck,
  CircleHalf,
  Clock,
  Lightbulb,
  PaperPlaneTopSolid,
  RubiLogo,
} from '@/icons'
import { useDeclareDesignSurface } from '@/context/designSurface'
import { CompassJeffAddContext, type JeffCtxItem } from './CompassJeffAddContext'
import { CompassJeffDeck } from './CompassJeffDeck'
import { CompassJeffResize } from './CompassJeffResize'
import { CompassJeffWorkspace } from './CompassJeffWorkspace'
import { setCourseChrome } from './courseTakeover'
import {
  JEFF_CTX_MAX,
  JEFF_FINISH,
  JEFF_LESSONS,
  JEFF_LESSON_CHIPS,
  JEFF_MIC_SAMPLES,
  JEFF_NUDGES,
  JEFF_QUIZ,
  JEFF_MARKER_FILTERS,
  JEFF_SCENARIO,
  JEFF_SCENARIO_ANSWER,
  JEFF_TOC,
  type JeffCard,
  type JeffLesson,
  type JeffMadeFlag,
  type JeffMadeNote,
  type JeffSection,
} from '@/data/compassJeffFixtures'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  chapterPercent,
  doneCount,
  firstSeen,
  formatMinutes,
  freshProgress,
  jeffReply,
  lessonById,
  lessonPercent,
  lessonState,
  marksFor,
  minutesLeft,
  secDone,
  marksInSection,
  secWaiting,
  seededFlags,
  seededNotes,
  seededThreads,
  sectionDomId,
  segmentWeight,
  spokenMinutes,
  type JeffDemoMode,
  type JeffProgress,
  type JeffReply,
} from './compassJeffModel'
import './compassJeffCourse.css'

/**
 * JEFF'S COURSE PLAYER — ported 2026-11-05 from `compass-prototype-b-v3.html`,
 * behind `compass-content-version`'s `jeff` arm.
 *
 * ⚠ IT IS A COURSE, NOT A LESSON SCREEN. Seven lessons, 36 sections of real
 * Florida Life & Health curriculum, nine section shapes, a scenario check that
 * GATES progress, a six-chapter contents rail, and Rubi in a rail of her own.
 * The content is `compassJeffFixtures.ts`, generated from his file rather than
 * retyped — see that file's header for why that matters here more than usual.
 *
 * ⚠ HIS HEADER IS THIS PRODUCT'S HEADER, so it is not drawn twice. His export
 * is standalone and opens with an XCEL lockup, Home, notifications and the
 * account menu — which is the Atlas header, already above this component. So
 * this calls `setCourseChrome('course')` (the header STAYS, with the thicker
 * bottom stroke) and draws only his SECOND bar, the course bar. The
 * alternative, `takeover` plus his own lockup, is the two-logos case
 * `CourseContentV2` documented in 2026-09-23.
 *
 * ⚠ WHAT IS NOT HERE YET, and is deliberately visible rather than faked: the
 * Compass full view (his Sources · Notebook · Studio), the flashcard deck, the
 * practice quiz, the selection toolbar that makes a marker out of highlighted
 * text, and his Demo settings dialog. They are the next slices. Controls that
 * would open them are NOT drawn — a control that looks pressable and does
 * nothing is what gets reported as broken, which is this repo's own rule from
 * the first Compass player.
 */
export function CompassJeffCourse({ onExit }: { onExit: () => void }) {
  /* His opening state is `demoMode: 'story'` in the class and `'fresh'` after
     `componentDidMount` runs — New learner is what the prototype actually
     opens on, and his Demo settings dialog says so ("Best for testing with
     learners"). The story arm arrives with the demo-settings slice. */
  /* The bar's controls are scoped by surface, and this IS the session — so it
     declares the same surface `CompassSessionPage` does, which is what keeps
     the Course content version dropdown on the bar while his arm renders. */
  useDeclareDesignSurface('compass:session')
  /* ⚠ `course`, NOT `takeover` — see the note above: his lockup is this
     product's header, already on screen. */
  useEffect(() => {
    setCourseChrome('course')
    return () => setCourseChrome('none')
  }, [])
  /* HIS DEMO SETTINGS, AS DESIGN CONTROLS — the dialog's first question
     ("Start the course as") and its exam-tips checkbox. `/port-prototype`
     step 3: a prototype's own control bar becomes flags on the Design bar, so
     a reviewer picks the start the same way they pick every other variation on
     this Hub, and `?demo=1` holds the committed default. ⚠ New learner is the
     default because it is what HIS prototype opens on. */
  const mode = (useFeatureFlag('compass-jeff-start').variant ?? 'fresh') as JeffDemoMode
  const examTips = useFeatureFlag('compass-jeff-exam-tips').enabled
  const pointersOn = useFeatureFlag('compass-jeff-pointers').enabled
  const [progress, setProgress] = useState<JeffProgress>(() => freshProgress(mode))
  const [lessonId, setLessonId] = useState(mode === 'fresh' ? 'L1' : 'L3')
  /* Re-seed when the control moves — React's adjust-state-during-render, the
     same shape `CompassSessionPage` uses for its Panel control. Picking a
     start is his "Restart course", so it clears what the session added. */
  const [seededFor, setSeededFor] = useState(mode)
  const [status, setStatus] = useState('')
  if (mode !== seededFor) {
    setSeededFor(mode)
    setProgress(freshProgress(mode))
    setLessonId(mode === 'fresh' ? 'L1' : 'L3')
    /* His own words on a restart, and they matter: picking a start throws
       away whatever the session added, so it says so rather than leaving a
       reviewer wondering where their notes went. */
    setStatus(`Course restarted as ${mode === 'fresh' ? 'a new learner' : 'the demo story'}`)
  }
  /* ⚠ HIS POINTER MACHINERY, and every piece of it is a rule about when NOT
     to interrupt: `fired` (each kind fires once), `suppressed` (dismissed for
     good), `snoozed` (an hour off, all of them). A pointer that reappeared
     after a dismissal would be the thing everybody hates about nudges. */
  const [fired, setFired] = useState<Record<string, true>>({})
  const [queue, setQueue] = useState<string[]>([])
  const [suppressed, setSuppressed] = useState<Record<string, true>>({})
  /* ⚠ FIRED AND OPENED ARE DIFFERENT NUMBERS, and the finish screen reports
     both: how many pointers Rubi raised, and how many the learner took up.
     Counting a raised pointer as a conversation would flatter the session. */
  const [opened, setOpened] = useState(0)
  const [snoozed, setSnoozed] = useState(false)
  const [quizLog, setQuizLog] = useState<boolean[]>([])
  const [finish, setFinish] = useState(false)
  /* When this session began — the finish screen's "N min this session". */
  const [startedAt] = useState(() => Date.now())
  const [finishMinutes, setFinishMinutes] = useState(1)
  /* His `queueNudge`, guards and all. ⚠ The pointers control is the gate:
     off, nothing is queued at all — not queued-and-hidden, which would have
     them all arrive at once when a reviewer turned it on. */
  const queueNudge = (kind: string) => {
    if (!pointersOn) return
    setFired((f) => {
      if (f[kind] || suppressed[kind]) return f
      setQueue((q) => (q.includes(kind) ? q : [...q, kind]))
      return { ...f, [kind]: true }
    })
  }
  /* ⚠ THE THREE TRIGGERS ARE HIS, and each is a different kind of noticing:
     `revisit` arrives 2.5s into a scripted session (the learner has been here
     before), `miss` the moment the scenario check is answered wrongly, and
     `tip` when section 3.4 comes into view. */
  useEffect(() => {
    if (mode !== 'story') return
    const t = window.setTimeout(() => queueNudge('revisit'), 2500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    if (!status) return
    const t = window.setTimeout(() => setStatus(''), 4000)
    return () => window.clearTimeout(t)
  }, [status])
  const [trackOpen, setTrackOpen] = useState(false)
  const [allChapters, setAllChapters] = useState(false)
  const [draft, setDraft] = useState('')
  /* What Rubi is holding — his context tray, capped at five. */
  const [ctx, setCtx] = useState<JeffCtxItem[]>([])
  /* ⚠ THE MIC IS THE DEMO PATH ONLY. His file tries the browser's
     SpeechRecognition first and falls back to typing a sample phrase out
     character by character; the port takes the fallback and nothing else. A
     port that switched on a real microphone would be claiming a capability
     the prototype is only illustrating — and asking a reviewer for a
     permission prompt they did not expect. */
  const [listening, setListening] = useState(false)
  const [micAt, setMicAt] = useState(-1)
  /* ⚠ A VIEW, NOT A ROUTE — his `state.view`. Compass replaces the course in
     place and the ✕ comes back to exactly the lesson and scroll position the
     learner left, which a route change would not. */
  const [fullView, setFullView] = useState(false)
  /* ⚠ WHAT THE LEARNER MAKES IN THIS SESSION, kept beside the seeded ones
     rather than merged into them: the fixtures are an imported module, and
     his `selNote` pushes onto a state array for exactly this reason. */
  const [made, setMade] = useState<{ notes: JeffMadeNote[]; flags: JeffMadeFlag[] }>({ notes: [], flags: [] })
  /* The highlighted passage, and where to float the toolbar. Null when there
     is no selection — his `state.sel`. */
  const [sel, setSel] = useState<{ text: string; num: string; x: number; y: number } | null>(null)
  /* His two folds and his marker-type filter. `all` is the opening state of
     the filter, and both rails open. */
  const [filter, setFilter] = useState('all')
  const [typesOpen, setTypesOpen] = useState(false)
  const [tocOpen, setTocOpen] = useState(true)
  const [railWidth, setRailWidth] = useState(400)
  const [railOpen, setRailOpen] = useState(true)
  const [thread, setThread] = useState<
    { who: 'learner' | 'rubi'; text: string; src?: string; quiz?: number; answered?: boolean }[]
  >([])

  const lesson = lessonById(lessonId)
  const index = JEFF_LESSONS.findIndex((l) => l.id === lessonId)
  const done = doneCount(lesson, progress)
  const chapterPct = chapterPercent(progress)
  const chapterMarks = JEFF_LESSONS.reduce((a, l) => a + marksFor(l.id, mode), 0)
  const lessonMarks = marksFor(lesson.id, mode)

  /* ⚠ SEEN IS SCROLL, NOT CLICK — his `checkSeen`, against the VIEWPORT.
     His version measures each section against the bottom of his own scroll
     box; this page has no scroll box (see the stylesheet's note), so the
     viewport is the honest equivalent: a section counts once its bottom has
     passed the bottom of the window. The rule that survives unchanged is the
     one that matters — before the learner scrolls, ONLY THE FIRST section
     counts, which is what makes a freshly opened lesson read "1 of 4
     sections" rather than "0 of 4" or, as the first pass had it, "4 of 4". */
  useEffect(() => {
    /* ⚠ jsdom HAS NO IntersectionObserver, and the parity suite renders this
       component. Without the guard the whole surface throws on mount under
       test while working perfectly in a browser — a failure mode that reads
       as "the port is broken" rather than "the test environment lacks an
       API". The opening section is seeded in state (`firstSeen`), so the
       suite sees the same opening state a learner does. */
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        const add: Record<string, true> = {}
        entries.forEach((e) => {
          const bottom = e.rootBounds?.bottom ?? window.innerHeight
          if (e.boundingClientRect.bottom <= bottom + 2) {
            const num = (e.target as HTMLElement).dataset.sec
            if (num) add[`${lesson.id}:${num}`] = true
          }
        })
        if (Object.keys(add).length) setProgress((p) => ({ ...p, seen: { ...p.seen, ...add } }))
        if (lesson.id === 'L3' && add['L3:3.4']) queueNudge('tip')
      },
      { threshold: [0, 0.5, 1] },
    )
    lesson.secs.forEach((c) => {
      const el = document.getElementById(sectionDomId(c))
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [lesson])

  const goLesson = (id: string) => {
    setLessonId(id)
    setThread([])
    setProgress((p) => ({
      ...p,
      inProgress: p.completed[id] ? p.inProgress : id,
      /* The new lesson's first section counts straight away, as above. */
      seen: { ...p.seen, ...firstSeen(id) },
    }))
    document.getElementById('jc-scroller')?.scrollIntoView({ block: 'start' })
  }

  /* Continue walks to the next section that is not done, and off the end of
     the lesson to the next one — his `go`. The gate is what stops it. */
  /* ⚠ HIS CONDITION IS THE LESSON, NOT THE SCROLL — `l3Locked: s.lesson ===
     'L3' && !s.quiz`. The note shows as soon as a lesson carrying a scenario
     check is open and unanswered, so the learner knows before scrolling that
     something will be asked. Deriving it from `secWaiting` instead (the first
     pass) hid the note until they had read far enough to be stopped by it,
     which is the opposite of what it is for. */
  const waitingAt = lesson.secs.findIndex((c) => c.quiz)
  const blocked = waitingAt >= 0 && !progress.quiz
  const onContinue = () => {
    if (blocked) {
      document.getElementById(sectionDomId(lesson.secs[waitingAt]))?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      return
    }
    const next = lesson.secs.find((c) => !secDone(lesson, c, progress))
    if (next) {
      document.getElementById(sectionDomId(next))?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      return
    }
    setProgress((p) => ({ ...p, completed: { ...p.completed, [lesson.id]: true } }))
    const after = JEFF_LESSONS[index + 1]
    if (after) {
      goLesson(after.id)
      return
    }
    /* ⚠ THE END OF THE CHAPTER IS AN EVENT, not a dead Continue button. His
       finish dialog is where the session adds up — and it is the only screen
       that tells the learner what the marking was FOR. */
    setFinishMinutes(Math.max(1, Math.round((Date.now() - startedAt) / 60000)))
    setFinish(true)
    setStatus('Chapter 2 complete')
  }

  const ask = (text: string, chip: string | null) => {
    const q = text.trim()
    if (!q) return
    const reply: JeffReply = jeffReply(q, chip, lesson.topic)
    /* ⚠ "QUIZ ME" IS NOT A SENTENCE SHE ANSWERS, it is a question she ASKS —
       his `mockReply` returns `{quiz: true}` and the caller pulls the next
       item from the bank. The first pass printed a placeholder sentence here
       and the chip looked broken. */
    if (reply.quiz) {
      const at = quizLog.length % JEFF_QUIZ.length
      setThread((t) => [
        ...t,
        { who: 'learner', text: q },
        { who: 'rubi', text: JEFF_QUIZ[at].q, src: JEFF_QUIZ[at].src, quiz: at },
      ])
      setDraft('')
      return
    }
    setThread((t) => [
      ...t,
      { who: 'learner', text: q },
      { who: 'rubi', text: reply.text ?? '', src: reply.src },
    ])
    setDraft('')
  }

  /* ⚠ IN COURSE ORDER, which is the rail's own promise ("In course order") —
     lesson then section, not the order they were made. */
  /* ⚠ ONLY IN LESSON 3, and only when it is not snoozed — his own condition.
     The pointers are about passages in that lesson. */
  const pointer =
    !snoozed && lesson.id === 'L3' ? JEFF_NUDGES.find((n) => n.kind === queue[0]) : undefined

  const openPointer = () => {
    if (!pointer) return
    setThread((t) => [
      ...t,
      { who: 'rubi', text: pointer.thread.text, src: pointer.thread.src, quiz: pointer.thread.quiz ? 0 : undefined },
    ])
    setQueue((q) => q.slice(1))
    setOpened((n) => n + 1)
  }

  /* ⚠ HIS THREE ACTIONS, and each one ends somewhere different: Ask Rubi puts
     the passage in the PROMPT and waits (she answers only when it is sent),
     Save note files it with an empty body for the learner to fill in, and
     Flag for review titles itself from the passage. */
  const askAbout = (s: { text: string; num: string }) => {
    setDraft(`“${s.text}” `)
    setSel(null)
    window.setTimeout(() => document.getElementById('jc-rubi-input')?.focus(), 0)
  }
  const saveNote = (s: { text: string; num: string }) => {
    setMade((m) => ({
      ...m,
      notes: [...m.notes, { id: `n${Date.now()}`, lesson: lesson.id, num: s.num, quote: s.text, text: '', date: 'Today' }],
    }))
    setSel(null)
    setStatus('Note added. Open Compass to add your own words.')
  }
  /* ⚠ THE DECK'S CARDS BECOME FLAGS, which is what ties the practice back
     into Compass: the cards you did not know are what you review before the
     exam. His title format, verbatim: "Flashcard: <term>". */
  const flagCards = (cards: JeffCard[], num: string) => {
    setMade((m) => ({
      ...m,
      flags: [
        ...m.flags,
        ...cards.map((c, i) => ({
          id: `f${Date.now()}${i}`,
          lesson: lesson.id,
          num,
          title: `Flashcard: ${c.front}`,
          date: 'Today',
        })),
      ],
    }))
    setStatus(`${cards.length} flashcards flagged for review in Compass`)
  }

  const flagIt = (s: { text: string; num: string }) => {
    setMade((m) => ({
      ...m,
      flags: [
        ...m.flags,
        {
          id: `f${Date.now()}`,
          lesson: lesson.id,
          num: s.num,
          /* His truncation, to the character: 68 then an ellipsis. */
          title: `Review: “${s.text.length > 70 ? `${s.text.slice(0, 68)}…` : s.text}”`,
          date: 'Today',
        },
      ],
    }))
    setSel(null)
    setStatus('Flagged for review')
  }

  /* ⚠ A QUIZ IN THE RAIL IS ANSWERED, NOT JUST READ — his `qz:` branch. The
     verdict names the right answer in his own words ("Not quite. The answer
     is alien.") and carries the rationale, and the result is logged, because
     the chapter-finish screen counts knowledge checks. */
  const answerQuiz = (at: number, pick: number) => {
    const item = JEFF_QUIZ[at]
    const right = pick === item.ans
    setQuizLog((l) => [...l, right])
    setThread((t) => [
      ...t.map((m, i) => (i === t.length - 1 && m.quiz != null ? { ...m, answered: true } : m)),
      { who: 'learner', text: item.opts[pick] },
      {
        who: 'rubi',
        text: `${right ? 'Correct. ' : `Not quite. The answer is ${item.opts[item.ans].toLowerCase()}. `}${item.why}`,
        src: item.src,
      },
    ])
  }
  const anotherQuestion = () => {
    const next = (quizLog.length) % JEFF_QUIZ.length
    setThread((t) => [
      ...t,
      { who: 'rubi', text: JEFF_QUIZ[next].q, src: JEFF_QUIZ[next].src, quiz: next },
    ])
  }

  /* ⚠ SIX STATS, AND THEY ARE THE ARGUMENT. Not "you finished" but what the
     session actually produced — time, sections, checks, conversations, marks
     and pointers. `prior` is his mocked 94 minutes of earlier sessions, and
     only in the scripted story: a new learner's chapter time is this session's
     alone, which is the honest number for a learner test. */
  /* ⚠ READ WHEN THE DIALOG OPENS, NOT DURING RENDER. `Date.now()` in a render
     body is impure — the same render would produce a different number on a
     replay — and the lint rule that catches it is right: the minute count
     belongs to the moment the chapter was finished, which is exactly when it
     is captured. */
  const minutes = finishMinutes
  const priorMinutes = mode === 'fresh' ? 0 : 94
  const totalMinutes = priorMinutes + minutes
  const sectionsSeen = JEFF_LESSONS.reduce((a, l) => a + doneCount(l, progress), 0)
  const totalSections = JEFF_LESSONS.reduce((a, l) => a + l.secs.length, 0)
  const checks = [...quizLog, ...(progress.quiz ? [progress.quiz === JEFF_SCENARIO_ANSWER] : [])]
  const rightChecks = checks.filter(Boolean).length
  const conversations = seededThreads(mode).length + opened
  const questionsAsked = thread.filter((m) => m.who === 'learner').length
  const noteCount = seededNotes(mode).length + made.notes.length
  const flagCount = seededFlags(mode).length + made.flags.length
  const finishStats = [
    {
      label: 'Time in this chapter',
      value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      note: `${minutes} min this session`,
    },
    {
      label: 'Sections completed',
      value: `${sectionsSeen} of ${totalSections}`,
      note: `${JEFF_LESSONS.filter((l) => lessonState(l, progress) === 'done').length} of 7 lessons`,
    },
    {
      label: 'Knowledge checks',
      value: checks.length ? `${rightChecks} of ${checks.length} correct` : 'None yet',
      note: checks.length ? 'Scenario check and Rubi quizzes' : '',
    },
    {
      label: 'Rubi conversations',
      value: String(conversations),
      note: `${questionsAsked} questions asked`,
    },
    {
      label: 'Notes and flags',
      value: String(noteCount + flagCount),
      note: `${noteCount} notes, ${flagCount} flags`,
    },
    { label: 'Rubi pointers', value: String(Object.keys(fired).length), note: `${opened} opened` },
  ]

  const markers = [
    ...seededThreads(mode).map((t) => ({ kind: 'Rubi conversation' as const, id: t.id, lesson: t.lesson, num: t.anchor, date: `${t.date} · ${t.msgs.length} messages`, title: t.title, quote: null, text: null })),
    ...[...seededNotes(mode), ...made.notes].map((n) => ({ kind: 'Note' as const, id: n.id, lesson: n.lesson, num: n.num, date: n.date, title: null, quote: n.quote, text: n.text })),
    ...[...seededFlags(mode), ...made.flags].map((f) => ({ kind: 'Flag' as const, id: f.id, lesson: f.lesson, num: f.num, date: f.date, title: f.title, quote: null, text: null })),
  ].sort((a, b) => (a.lesson + a.num).localeCompare(b.lesson + b.num))
  const shown = markers.filter((m) => {
    const f = JEFF_MARKER_FILTERS.find((x) => x.key === filter)
    return !f || f.key === 'all' || m.kind === f.kind
  })

  if (fullView) {
    return (
      <CompassJeffWorkspace
        mode={mode}
        lessonId={lessonId}
        chapterPct={chapterPct}
        onClose={() => setFullView(false)}
      />
    )
  }

  return (
    <div className="cre-jc" role="region" aria-label="Course content">
      {/* ---- the course bar ---- */}
      <div className="cre-jc-bar" role="region" aria-label="Course">
        <p>
          <span className="cre-jc-course">
            <BookOpenRegular size={20} aria-hidden />
            <span>
              Florida Life and Health: <em>Chapter 2 Insurers and Insurance Markets</em>
            </span>
          </span>
        </p>
        <button type="button" className="cre-jc-exit" onClick={onExit}>
          Exit course
          <ArrowRight size={16} aria-hidden />
        </button>
      </div>

      {/* ⚠ `role="status"`, so the restart is ANNOUNCED and not only drawn. */}
      {status && (
        <p className="cre-jc-status" role="status">
          {status}
        </p>
      )}

      {finish && (
        <div className="cre-jc-scrim">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="jc-finish-title"
            aria-describedby="jc-finish-msg"
            className="cre-jc-finish"
            onKeyDown={(e) => e.key === 'Escape' && setFinish(false)}
          >
            <div className="cre-jc-finish-head">
              <span className="cre-jc-finish-mark" aria-hidden>
                <Check size={26} />
              </span>
              <div>
                <div className="eyebrow cre-jc-finish-eyebrow">{JEFF_FINISH.eyebrow}</div>
                <h2 id="jc-finish-title" className="serif cre-jc-finish-title" tabIndex={-1}>
                  {JEFF_FINISH.title}
                </h2>
              </div>
            </div>
            <p id="jc-finish-msg" className="cre-jc-finish-msg">
              {JEFF_FINISH.msg}
            </p>
            <dl className="cre-jc-finish-stats">
              {finishStats.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                  {f.note && <div className="cre-jc-finish-note">{f.note}</div>}
                </div>
              ))}
            </dl>
            <p className="cre-jc-finish-next">
              <strong>Next up:</strong> {JEFF_FINISH.next}
            </p>
            <div className="cre-jc-finish-foot">
              <div>
                <div className="eyebrow cre-jc-finish-eyebrow">Up next</div>
                <div className="cre-jc-finish-chapter">{JEFF_FINISH.upNext}</div>
                <div className="cre-jc-finish-note">{JEFF_FINISH.upNextMeta}</div>
              </div>
              <div className="cre-jc-finish-actions">
                <button
                  type="button"
                  className="cre-jc-prev"
                  onClick={() => {
                    setFinish(false)
                    setFullView(true)
                  }}
                >
                  {JEFF_FINISH.review}
                </button>
                <button type="button" className="cre-jc-continue" onClick={() => setFinish(false)}>
                  Start Chapter 3
                  <ArrowRight size={14} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="cre-jc-cols">
        {/* ---- contents ---- */}
        {tocOpen ? (
        <aside className="cre-jc-toc" aria-label="Table of contents">
          <div className="cre-jc-toc-head">
            <span className="eyebrow">Contents</span>
            <button
              type="button"
              className="cre-jc-sq"
              aria-label="Collapse contents"
              aria-expanded
              onClick={() => setTocOpen(false)}
            >
              <AngleLeftRegular size={16} aria-hidden />
            </button>
          </div>
          <button
            type="button"
            className="cre-jc-chapter-pick"
            aria-expanded={allChapters}
            aria-controls="jc-toc-chapters"
            onClick={() => setAllChapters((v) => !v)}
          >
            <span>{allChapters ? 'All 6 chapters' : 'Chapter 2 of 6'}</span>
            <span>
              {allChapters ? 'Show less' : 'Show all'}
              <ChevronDown size={14} aria-hidden />
            </span>
          </button>

          <div id="jc-toc-chapters">
            <div className="cre-jc-chapter">
              <BookOpenRegular size={20} aria-hidden />
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div className="cre-jc-chapter-name">Chapter 2 · Insurers and Insurance Markets</div>
                <div className="cre-jc-chapter-pct">
                  <strong>{chapterPct}%</strong> chapter complete
                </div>
                <div
                  className="cre-jc-meter"
                  role="progressbar"
                  aria-label="Chapter 2 completion"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={chapterPct}
                >
                  <div style={{ width: `${chapterPct}%` }} />
                </div>
                {chapterMarks > 0 && (
                  <div className="cre-jc-chapter-marks">
                    <span className="cre-jc-marks">{chapterMarks}</span> markers in this chapter
                  </div>
                )}
                <div className="cre-jc-chapter-meta">
                  <span>
                    {JEFF_LESSONS.filter((l) => lessonState(l, progress) === 'done').length} of{' '}
                    {JEFF_LESSONS.length} lessons
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} aria-hidden />
                    {formatMinutes(
                      JEFF_LESSONS.reduce(
                        (a, l, i) => a + minutesLeft(l, progress, JEFF_TOC[1].lessons[i]?.min ?? 10),
                        0,
                      ),
                    )}{' '}
                    left
                  </span>
                </div>
              </div>
            </div>

            <ol className="cre-jc-lessons" aria-label="Chapter 2 lessons">
              {JEFF_LESSONS.map((l, i) => {
                const state = lessonState(l, progress)
                const marks = marksFor(l.id, mode)
                const mins = JEFF_TOC[1].lessons[i]?.min ?? 10
                const left = minutesLeft(l, progress, mins)
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      className="cre-jc-lesson"
                      aria-current={l.id === lessonId ? 'page' : false}
                      onClick={() => goLesson(l.id)}
                    >
                      <span className="cre-jc-lesson-row">
                        {/* ⚠ HIS THREE STATES ARE IN THE ICON, not in a badge
                            beside it — a filled check for done, a half circle
                            for the lesson in progress, an empty one for the
                            rest. The first pass added "In progress" and
                            "Complete" pills; his rail has neither, and the
                            string the capture holds belongs to the CHAPTER
                            rows under Show all. */}
                        {/* ⚠ AND THE ICON IS LABELLED, which is where his
                            "In progress" lives — `aria-label` on the glyph
                            itself, so the state is spoken without a pill
                            being drawn. It is the detail that makes a rail of
                            identical-looking rows usable without sight. */}
                        <span
                          role="img"
                          aria-label={state === 'done' ? 'Complete' : state === 'current' ? 'In progress' : 'Not started'}
                          style={{ display: 'inline-flex', flex: '0 0 auto' }}
                        >
                          {state === 'done' ? (
                            <CircleCheck size={16} aria-hidden />
                          ) : state === 'current' ? (
                            <CircleHalf size={16} aria-hidden />
                          ) : (
                            <Circle size={16} aria-hidden />
                          )}
                        </span>
                        <span className="cre-jc-lesson-title">
                          {l.id} · {l.title}
                        </span>
                        {marks > 0 && <span className="cre-jc-marks">{marks}</span>}
                      </span>
                      {/* ⚠ HIS THREE PHRASINGS, and the footnote under the
                          rail explains them: a done lesson states the time it
                          LOGGED, the current one how much is LEFT, and an
                          untouched one carries the ~ that marks an estimate. */}
                      <span className="cre-jc-lesson-meta">
                        <Clock size={12} aria-hidden />
                        {state === 'done'
                          ? `${mins} min`
                          : state === 'current'
                            ? `${left} min left`
                            : `~${mins} min`}
                        <span className="cre-jc-sr">
                          {l.secs.length} {l.secs.length === 1 ? 'section' : 'sections'}.{' '}
                          {state === 'done'
                            ? `${spokenMinutes(mins)} logged.`
                            : state === 'current'
                              ? `About ${spokenMinutes(left)} left.`
                              : `About ${spokenMinutes(mins)}.`}
                          {marks > 0 && ` ${marks} ${marks === 1 ? 'marker' : 'markers'}.`}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>

            {/* ⚠ THE NEXT CHAPTER IS ALWAYS DRAWN, under the lesson list —
                his rail shows "Chapter 3 · Agents and General Law · Up next"
                whether or not Show all is open, because it is the answer to
                "what comes after this?". Show all adds the other four. The
                first pass hid it behind Show all and the parity capture
                caught it. */}
            {(allChapters ? JEFF_TOC.filter((c) => c.n !== 2) : JEFF_TOC.filter((c) => c.n === 3)).map((c) => (
              <button type="button" className="cre-jc-next-chapter" key={c.n} disabled>
                <span className="cre-jc-lesson-title">
                  Chapter {c.n} · {c.title}
                </span>
                {/* His four chapter states: a finished chapter states the
                    time it logged, the open one says In progress, the next one
                    Up next, and the rest name the chapter that unlocks them. */}
                <span className="cre-jc-badge">
                  {c.n === 1
                    ? `${formatMinutes(c.lessons.reduce((a, l) => a + l.min, 0))} logged`
                    : c.n === 3
                      ? 'Up next'
                      : `Opens after Chapter ${c.n - 1}`}
                </span>
                <span className="cre-jc-lesson-meta">
                  {c.lessons.length} lessons · ~
                  {formatMinutes(c.lessons.reduce((a, l) => a + l.min, 0))} estimated
                </span>
              </button>
            ))}
          </div>

          <p className="cre-jc-footnote">
            ~ marks an estimate at average pace. Times without ~ are your logged study time.
          </p>
          {/* ⚠ HIS DIALOG IS A DESIGN CONTROL HERE, so the button that opened
              it is not drawn — a control that looks pressable and does nothing
              is what gets reported as broken. His CAPTION stays, because it
              answers the question the dialog existed to answer: which start
              am I looking at? */}
          <p className="cre-jc-demo-caption">
            Demo only · Starts as: <strong>{mode === 'fresh' ? 'New learner' : 'Demo story'}</strong>
          </p>
        </aside>
        ) : (
          <button
            type="button"
            className="cre-jcw-folded"
            aria-label="Expand contents"
            onClick={() => setTocOpen(true)}
          >
            Contents
          </button>
        )}

        {/* ---- the lesson ---- */}
        <main className="cre-jc-main">
          <div className="cre-jc-scroll" id="jc-scroller">
            <section className="cre-jc-track" aria-label="Lesson progress">
              <button
                type="button"
                className="cre-jc-track-head"
                aria-expanded={trackOpen}
                aria-controls="jc-lesson-track"
                onClick={() => setTrackOpen((v) => !v)}
              >
                <span className="cre-jc-track-line">
                  <span className="eyebrow">
                    Lesson {index + 1} of {JEFF_LESSONS.length} · {Math.max(1, done)} of{' '}
                    {lesson.secs.length} sections
                  </span>
                  <span className="cre-jc-track-lesson">{lesson.title}</span>
                  {lessonMarks > 0 && (
                    <span className="cre-jc-track-marks">
                      <span className="cre-jc-marks">{lessonMarks}</span> markers in this lesson
                    </span>
                  )}
                  <span className="cre-jc-track-right">
                    {lessonPercent(lesson, progress)}%
                    <b>{trackOpen ? 'Hide activity' : 'Show activity'}</b>
                    <ChevronDown size={14} aria-hidden />
                  </span>
                </span>
              </button>
              <div className="cre-jc-segs">
                {lesson.secs.map((c) => (
                  <button
                    type="button"
                    key={c.num}
                    className={`cre-jc-seg${secDone(lesson, c, progress) ? ' is-done' : ''}${
                      secWaiting(lesson, c, progress) ? ' is-waiting' : ''
                    }`}
                    style={{ flex: `${segmentWeight(c)} 1 0` }}
                    title={`${c.num} · ${c.title} · ${
                      secWaiting(lesson, c, progress)
                        ? 'Waiting for your answer'
                        : secDone(lesson, c, progress)
                          ? 'Complete'
                          : 'Not started'
                    }`}
                    onClick={() =>
                      document
                        .getElementById(sectionDomId(c))
                        ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
                    }
                  >
                    <span />
                  </button>
                ))}
              </div>
              {trackOpen && (
                <ol id="jc-lesson-track" className="cre-jc-lessons" aria-label="Sections">
                  {lesson.secs.map((c) => (
                    <li key={c.num}>
                      <button
                        type="button"
                        className="cre-jc-lesson"
                        onClick={() =>
                          document
                            .getElementById(sectionDomId(c))
                            ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
                        }
                      >
                        <span className="cre-jc-lesson-title">
                          Section {c.num} · {c.title}
                        </span>
                        <span className="cre-jc-lesson-meta">
                          {c.type} · {secDone(lesson, c, progress) ? 'Complete' : 'Not complete'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <article
              className="cre-jc-article"
              /* ⚠ ON MOUSE UP, NOT ON A BUTTON. Marking in his design starts
                 with reading — you highlight a passage and the actions come to
                 it. A "add a note" button somewhere in the chrome would be a
                 different interaction with the same name. */
              onMouseUp={(e) => {
                const s = window.getSelection()
                const text = (s?.toString() ?? '').trim()
                if (!text || text.length < 2) {
                  setSel(null)
                  return
                }
                const host = (s?.anchorNode as HTMLElement | null)?.parentElement?.closest?.('[data-sec]')
                const num = (host as HTMLElement | null)?.dataset?.sec
                if (!num) return
                const box = e.currentTarget.getBoundingClientRect()
                setSel({ text, num, x: e.clientX - box.left, y: e.clientY - box.top })
              }}
            >
              <div className="cre-jc-lede">
                <h1 className="serif">{lesson.title}</h1>
                <p>{lesson.intro}</p>
              </div>
              {sel && (
                <div
                  role="toolbar"
                  aria-label="Selected text actions"
                  className="cre-jc-seltool"
                  style={{ left: sel.x, top: sel.y }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <button type="button" onClick={() => askAbout(sel)}>
                    Ask Rubi
                  </button>
                  <span aria-hidden className="cre-jc-seltool-rule" />
                  <button type="button" onClick={() => saveNote(sel)}>
                    Save note
                  </button>
                  <span aria-hidden className="cre-jc-seltool-rule" />
                  <button type="button" onClick={() => flagIt(sel)}>
                    Flag for review
                  </button>
                </div>
              )}
              {lesson.secs.map((c) => (
                <SectionBody
                  key={c.num}
                  sec={c}
                  lesson={lesson}
                  mode={mode}
                  onOpenCompass={() => setFullView(true)}
                  answer={progress.quiz}
                  examTips={examTips}
                  onFlagCards={flagCards}
                  onAnswer={(key) => {
                    setProgress((p) => (p.quiz ? p : { ...p, quiz: key }))
                    if (key !== JEFF_SCENARIO_ANSWER) queueNudge('miss')
                  }}
                />
              ))}
            </article>

            {pointer && (
              <aside aria-label="Rubi pointer" className="cre-jc-pointer">
                <span className="cre-jc-pointer-mark" aria-hidden>
                  <RubiLogo size={20} />
                </span>
                <p>
                  <span className="cre-jc-pointer-eyebrow">{pointer.eyebrow}</span>
                  {pointer.msg}
                </p>
                <button
                  type="button"
                  className="cre-jc-pointer-open"
                  aria-label={`Open Rubi explanation: ${pointer.topic}`}
                  onClick={openPointer}
                >
                  Open
                </button>
                <button
                  type="button"
                  className="cre-jc-pointer-icon"
                  aria-label="Snooze Rubi pointers for 1 hour"
                  title="Snooze for 1 hour"
                  onClick={() => {
                    setSnoozed(true)
                    setStatus('Rubi pointers snoozed for 1 hour')
                  }}
                >
                  <Clock size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  className="cre-jc-pointer-icon"
                  aria-label="Dismiss Rubi pointer"
                  onClick={() => {
                    const kind = queue[0]
                    setSuppressed((x) => ({ ...x, [kind]: true }))
                    setQueue((q) => q.slice(1))
                    setStatus('Pointer dismissed')
                  }}
                >
                  <XmarkRegular size={15} aria-hidden />
                </button>
              </aside>
            )}

            <div className="cre-jc-foot">
              <button
                type="button"
                className="cre-jc-prev"
                disabled={index === 0}
                onClick={() => goLesson(JEFF_LESSONS[index - 1].id)}
              >
                <ArrowLeft size={14} aria-hidden />
                Previous lesson
              </button>
              {blocked && <span className="cre-jc-gate">Answer the scenario check to continue</span>}
              <button type="button" className="cre-jc-continue" onClick={onContinue}>
                Continue
                <ArrowRight size={14} aria-hidden />
              </button>
            </div>
          </div>
        </main>

        {/* ---- Compass ---- */}
        {railOpen ? (
        <>
        <CompassJeffResize
          label="Resize Compass"
          width={railWidth}
          min={320}
          max={560}
          reset={400}
          onResize={setRailWidth}
        />
        <aside className="cre-jc-rail" aria-label="Compass" style={{ flexBasis: railWidth }}>
          <div className="cre-jc-rail-head">
            <div className="cre-jc-rail-top">
              {/* ⚠ THE PILL IS THE DOOR. It looks like a label and it opens
                  the whole second half of his design — the Sources · Notebook
                  · Studio view. `/port-prototype` step 2b's rule: press the
                  thing you think is decorative. */}
              <button
                type="button"
                className="cre-jc-pill"
                aria-label={`Open Compass in full view, ${markers.length} items`}
                onClick={() => setFullView(true)}
              >
                <RubiLogo size={16} aria-hidden />
                Compass
                <span className="cre-jc-pill-count">{markers.length}</span>
              </button>
              <button
                type="button"
                className="cre-jc-sq"
                aria-label="Collapse Compass"
                aria-expanded
                onClick={() => setRailOpen(false)}
              >
                <AngleRightRegular size={16} aria-hidden />
              </button>
            </div>
            <button
              type="button"
              className="cre-jc-filter"
              aria-label={`Showing ${JEFF_MARKER_FILTERS.find((f) => f.key === filter)?.label}, ${shown.length}. Choose marker type`}
              aria-expanded={typesOpen}
              aria-controls="jc-ws-types"
              onClick={() => setTypesOpen((v) => !v)}
            >
              <span>{JEFF_MARKER_FILTERS.find((f) => f.key === filter)?.label}</span>
              <span>{shown.length}</span>
            </button>
            {typesOpen && (
              <div className="cre-jc-types" id="jc-ws-types" role="group" aria-label="Marker type">
                {JEFF_MARKER_FILTERS.map((f) => (
                  <button
                    type="button"
                    key={f.key}
                    className="chip"
                    aria-pressed={filter === f.key}
                    onClick={() => {
                      setFilter(f.key)
                      setTypesOpen(false)
                    }}
                  >
                    {f.label} {markers.filter((m) => f.key === 'all' || m.kind === f.kind).length}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="cre-jc-rail-list">
            {thread.length > 0 ? (
              thread.map((m, i) => (
                <div key={i}>
                  <div className={`cre-jc-msg ${m.who === 'learner' ? 'is-learner' : 'is-rubi'}`}>
                    {m.text}
                    {m.src && <span className="cre-jc-msg-src">{m.src}</span>}
                  </div>
                  {m.quiz != null && !m.answered && (
                    <div className="cre-jc-quiz-opts">
                      {JEFF_QUIZ[m.quiz].opts.map((o, oi) => (
                        <button
                          type="button"
                          className="chip"
                          key={o}
                          onClick={() => answerQuiz(m.quiz as number, oi)}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                  {m.quiz != null && m.answered && i === thread.length - 3 && (
                    <div className="cre-jc-quiz-opts">
                      <button type="button" className="chip" onClick={anotherQuestion}>
                        Another question
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <>
                <p className="cre-jc-order">In course order</p>
                {/* ⚠ THE LIST IS ALWAYS THERE, empty or not — his
                    `<ol aria-label="All markers in course order">` is what a
                    screen reader lands on either way, and rendering it only
                    when full takes the landmark away from the one state that
                    most needs explaining. */}
                {shown.length === 0 && (
                  <p className="cre-jc-empty">
                    No markers yet. Ask Rubi, add a note or flag a section and it will appear here
                    in course order.
                  </p>
                )}
                <ol className="cre-jc-mark-list" aria-label="All markers in course order">
                    {markers.map((m) => (
                    <li className="cre-jc-mark" key={m.id} data-at={`${m.lesson}:${m.num}`}>
                      <div className="cre-jc-mark-kind">{m.kind}</div>
                      {/* ⚠ THE QUOTE IS THE PASSAGE, not the learner's words —
                          a red-ruled blockquote, with the learner's own note
                          under it in a field they can still edit. Collapsing
                          the two into one line loses the distinction the
                          whole marker is built on. */}
                      {m.quote && <blockquote className="cre-jc-mark-quote">{m.quote}</blockquote>}
                      {m.title && <p className="cre-jc-mark-title">{m.title}</p>}
                      {m.kind === 'Note' && (
                        <>
                          <label className="cre-jc-sr" htmlFor={`jc-note-${m.id}`}>
                            Your note
                          </label>
                          <textarea
                            id={`jc-note-${m.id}`}
                            className="cre-jc-note-field"
                            rows={2}
                            placeholder="Add your own words…"
                            defaultValue={m.text ?? ''}
                          />
                        </>
                      )}
                      <div className="cre-jc-mark-meta">
                        <span>
                          {m.lesson} · Section {m.num}
                        </span>
                        <span>{m.date}</span>
                        <button
                          type="button"
                          className="mini-btn"
                          aria-label={`Go to ${m.lesson} · Section ${m.num}`}
                          onClick={() => {
                            goLesson(m.lesson)
                            window.setTimeout(
                              () =>
                                document
                                  .getElementById(`s-${m.num.replace('.', '-')}`)
                                  ?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
                              80,
                            )
                          }}
                        >
                          Go to marker
                        </button>
                        {m.kind === 'Note' && (
                          <button type="button" className="mini-btn" aria-label="Save note">
                            Save
                          </button>
                        )}
                        {m.kind === 'Rubi conversation' && (
                          <button type="button" className="mini-btn" disabled>
                            Open
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>

          <div className="cre-jc-composer">
            <div className="cre-jc-chips" aria-label="Suggested prompts">
              {JEFF_LESSON_CHIPS.map(([label, key]) => (
                <button type="button" className="chip" key={label} onClick={() => ask(label, key)}>
                  {label}
                </button>
              ))}
            </div>
            <CompassJeffAddContext
              lesson={lesson}
              markers={markers.map((m) => ({
                id: m.id,
                kind: m.kind,
                /* The picker lists a marker by its own words — a note's
                   quote, a flag's or a conversation's title. */
                label: m.quote ?? m.title ?? '',
                lesson: m.lesson,
                num: m.num,
              }))}
              library={[]}
              ctx={ctx}
              onAdd={(items) =>
                /* ⚠ HIS CEILING, ENFORCED HERE: five items, duplicates
                   ignored by key. The announcement says so when it bites. */
                setCtx((c) => {
                  const next = [...c]
                  let skipped = false
                  items.forEach((it) => {
                    if (next.length >= JEFF_CTX_MAX || next.some((x) => x.key === it.key)) {
                      skipped = true
                      return
                    }
                    next.push(it)
                  })
                  setStatus(
                    `Added ${items.map((i) => i.label).join(', ')} as context${
                      skipped ? `. Rubi can use up to ${JEFF_CTX_MAX} items.` : '.'
                    }`,
                  )
                  return next
                })
              }
              onRemove={(key) => setCtx((c) => c.filter((x) => x.key !== key))}
            />
            <div className="cre-jc-prompt">
              <textarea
                id="jc-rubi-input"
                aria-label="Ask Rubi"
                placeholder={listening ? 'Listening… speak your question' : 'Ask Rubi about this lesson'}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    ask(draft, null)
                  }
                }}
              />
              <button
                type="button"
                className={`cre-jc-mic${listening ? ' is-on' : ''}`}
                aria-label={listening ? 'Stop listening' : 'Ask Rubi with your voice'}
                aria-pressed={listening}
                onClick={() => {
                  if (listening) {
                    setListening(false)
                    setStatus('Stopped listening')
                    return
                  }
                  const next = (micAt + 1) % JEFF_MIC_SAMPLES.length
                  setMicAt(next)
                  setListening(true)
                  setStatus('Listening')
                  const phrase = JEFF_MIC_SAMPLES[next]
                  let i = 0
                  const tick = window.setInterval(() => {
                    i += 3
                    setDraft(phrase.slice(0, i))
                    if (i >= phrase.length) {
                      window.clearInterval(tick)
                      setListening(false)
                      setStatus('Voice captured. Press Enter or Send to ask Rubi.')
                    }
                  }, 70)
                }}
              >
                {/* ⚠ `Podcast` STANDS IN FOR A MICROPHONE — the registry
                    ships no mic glyph, and adding an SVG is a registry
                    decision rather than a porting one. Nearest match, said
                    out loud, per the `port-prototype` rule. */}
                <Podcast size={16} aria-hidden />
              </button>
              <button
                type="button"
                className="cre-jc-send"
                aria-label="Send to Rubi"
                onClick={() => ask(draft, null)}
              >
                <PaperPlaneTopSolid size={16} aria-hidden />
              </button>
            </div>
            <p className="cre-jc-disclaimer">
              Rubi is here to help with the course. Please keep personal details like your address,
              license number or payment information out of the chat.
            </p>
          </div>
        </aside>
        </>
        ) : (
          <button
            type="button"
            className="cre-jcw-folded"
            aria-label="Expand Compass"
            onClick={() => setRailOpen(true)}
          >
            Compass
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * ONE SECTION. Nine shapes across the seven lessons, and the TYPE is what
 * decides which parts render — paragraphs, bullets, a definition grid, the
 * infographic table, the exam tip, and the scenario check that gates Continue.
 */
function SectionBody({
  sec,
  lesson,
  mode,
  answer,
  examTips,
  onAnswer,
  onFlagCards,
  onOpenCompass,
}: {
  sec: JeffSection
  lesson: JeffLesson
  mode: JeffDemoMode
  answer: string | null
  /** ⚠ OFF BY DEFAULT, which is his: "Exam tip callouts … Off by default." */
  examTips: boolean
  onAnswer: (key: string) => void
  /** The deck's "Flag N for review in Compass" — the cards become flags. */
  onFlagCards: (cards: JeffCard[], num: string) => void
  /** ⚠ THE GUTTER IS A CONTROL, and his label says where it goes — "Open in
      Compass". Drawing it as a button and wiring nothing is what this repo's
      first Compass player recorded as the thing that gets reported broken. */
  onOpenCompass: () => void
}) {
  const hid = `h-${sec.num.replace('.', '-')}`
  const right = answer === JEFF_SCENARIO_ANSWER
  /* ⚠ THE GUTTER STATES ITS CONTENTS IN WORDS — his `.mkh` affordance beside
     the eyebrow: "3 markers here: 1 Rubi conversation, 2 notes. Open in
     Compass." Not a dot with a tooltip; the count, the kinds and the way in. */
  const here = marksInSection(lesson.id, sec.num, mode)
  return (
    <section id={sectionDomId(sec)} data-sec={sec.num} className="sec" aria-labelledby={hid}>
      <div className="cre-jc-sec-eyebrow">
        {here.total > 0 && (
          <button
            type="button"
            className="cre-jc-gutter"
            title={`${here.total} ${here.total === 1 ? 'marker' : 'markers'} in this section · ${here.parts.join(', ')} · Click to open in Compass`}
            aria-label={`${here.total} markers here: ${here.parts.join(', ')}. Open in Compass.`}
            onClick={onOpenCompass}
          >
            {here.total}
          </button>
        )}
        <span className="eyebrow">
          Section {sec.num} · {sec.type}
        </span>
      </div>
      <h2 id={hid} className="serif">
        {sec.title}
      </h2>
      {sec.paras?.map((t, i) => <p key={i}>{t}</p>)}
      {sec.defs && (
        <dl>
          {sec.defs.map((d) => (
            <div key={d.term}>
              <dt>{d.term}</dt>
              <dd>{d.def}</dd>
            </div>
          ))}
        </dl>
      )}
      {sec.rows && (
        <table className="cre-jc-table">
          <thead>
            <tr>
              <th>Insurer</th>
              <th>Incorporated in</th>
              <th>Doing business in</th>
              <th>Classification</th>
            </tr>
          </thead>
          <tbody>
            {sec.rows.map((r, i) => (
              <tr key={i}>
                <td>{r.a}</td>
                <td>{r.b}</td>
                <td>{r.c}</td>
                <td>{r.d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {sec.bullets && (
        <ul>
          {sec.bullets.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
      {sec.quiz && (
        <>
          <p className="eyebrow">Choose one answer</p>
          <div className="cre-jc-options">
            {JEFF_SCENARIO.map((o) => {
              const picked = answer === o.key
              const isRight = o.key === JEFF_SCENARIO_ANSWER
              const show = !!answer
              return (
                <button
                  type="button"
                  key={o.key}
                  className={`option${show && isRight ? ' is-right' : ''}${
                    picked && !isRight ? ' is-picked' : ''
                  }${show ? ' is-answered' : ''}`}
                  aria-pressed={picked}
                  aria-disabled={show}
                  onClick={() => !show && onAnswer(o.key)}
                >
                  <span className="cre-jc-key">{o.key.toUpperCase()}</span>
                  {o.text}
                  {show && isRight && <span className="cre-jc-tag">Correct</span>}
                  {picked && !isRight && <span className="cre-jc-tag">Your answer</span>}
                </button>
              )
            })}
          </div>
          {answer && (
            <div className={`cre-jc-feedback ${right ? 'is-right' : 'is-wrong'}`}>
              {right
                ? 'Correct. Lakeshore Mutual is incorporated in Ohio, so from Texas’s point of view it is a foreign insurer.'
                : 'Not quite. Lakeshore Mutual is incorporated in Ohio and doing business in Texas, which makes it foreign there.'}
            </div>
          )}
        </>
      )}
      {sec.tip && examTips && (
        <div className="cre-jc-tip">
          <Lightbulb size={16} aria-hidden />
          <span>
            <b>Rubi tip</b> — {sec.tip}
          </span>
        </div>
      )}
      {sec.cards && <CompassJeffDeck sec={sec} onFlag={onFlagCards} />}
      <Fragment key={lesson.id} />
    </section>
  )
}
