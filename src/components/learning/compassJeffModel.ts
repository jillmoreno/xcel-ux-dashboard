import {
  JEFF_ANSWERS,
  JEFF_FLAGS,
  JEFF_KB,
  JEFF_LESSONS,
  JEFF_NOTES,
  JEFF_PII,
  JEFF_POINTERS,
  JEFF_QUIZ,
  JEFF_THREADS,
  JEFF_TOPIC_LABEL,
  type JeffLesson,
  type JeffSection,
} from '@/data/compassJeffFixtures'

/**
 * JEFF'S COURSE PLAYER — the derived values, lifted out of the component.
 *
 * ⚠ HIS RULES, NOT NEW ONES. Every function here is `renderVals()` from
 * `compass-prototype-b-v3.html` with the names kept: `secDone`, `secWaiting`,
 * `gateIdx`, the segment `weight`. They are separated from the component for
 * the reason `compassWorkspaceModel.ts` is: a test can assert the progress
 * arithmetic without rendering three columns, and the arithmetic is where a
 * port of a course player goes wrong quietly — a percentage that is 3 points
 * off looks fine and is a different design.
 */

/** 'done' | 'current' | 'todo' — what the contents rail draws for a lesson. */
export type JeffLessonState = 'done' | 'current' | 'todo'

/**
 * ⚠ HOW THE COURSE STARTS, and it is not a cosmetic — his Demo settings
 * dialog's first question. `fresh` (New learner) is what his prototype opens
 * on: nothing done, no markers, Lesson 1 current. `story` restores the
 * fixture's own statuses — Lessons 1 and 2 complete, Lesson 3 in progress,
 * with the seeded notes and flags — and is what a stakeholder walkthrough
 * wants. His `applyLessonMode()` does this by MUTATING the lesson array; here
 * it is derived, because the fixtures are an imported module and writing to
 * them would leak one render's demo state into the next.
 */
export type JeffDemoMode = 'fresh' | 'story'

export type JeffProgress = {
  /** Which start the course was opened with. */
  mode: JeffDemoMode
  /** Section keys (`L3:3.2`) the learner has scrolled past. */
  seen: Record<string, true>
  /** The lesson the rail marks as in progress. */
  inProgress: string
  /** Lessons finished this session, on top of the fixture's own `status`. */
  completed: Record<string, true>
  /** The scenario check's answer — `null` until picked. One per course, as his. */
  quiz: string | null
}

export const lessonById = (id: string): JeffLesson =>
  JEFF_LESSONS.find((l) => l.id === id) ?? JEFF_LESSONS[0]

export const sectionKey = (lesson: JeffLesson, sec: JeffSection) => `${lesson.id}:${sec.num}`
/** His DOM id, and the anchor the rail and the track both scroll to. */
export const sectionDomId = (sec: JeffSection) => `s-${sec.num.replace('.', '-')}`

export function lessonState(lesson: JeffLesson, p: JeffProgress): JeffLessonState {
  const base = p.mode === 'fresh' ? (JEFF_LESSONS[0].id === lesson.id ? 'current' : 'todo') : lesson.status
  if (p.completed[lesson.id] || base === 'done') return 'done'
  return lesson.id === p.inProgress ? 'current' : 'todo'
}

/** Where a fresh course starts — his `restartCourse('fresh')`. */
export const freshProgress = (mode: JeffDemoMode): JeffProgress => {
  /* Story opens ON Lesson 3, which is the one its script leaves in progress. */
  const opens = mode === 'fresh' ? 'L1' : 'L3'
  return {
    mode,
    /* ⚠ THE FIRST SECTION COUNTS BEFORE ANY SCROLL — his `atTop` rule, seeded
       here rather than set from an effect on mount. It is what makes a freshly
       opened lesson read "1 of 4 sections" instead of "0 of 4", and seeding it
       in state keeps the scroll observer a pure subscription. */
    seen: firstSeen(opens),
    inProgress: opens,
    completed: {},
    quiz: null,
  }
}

/** `{ 'L1:1.1': true }` — the opening section of a lesson, already counted. */
export const firstSeen = (lessonId: string): Record<string, true> => {
  const l = lessonById(lessonId)
  return l.secs[0] ? { [sectionKey(l, l.secs[0])]: true } : {}
}

/** The seeded markers — ⚠ a new learner has none, which is the point of the arm. */
export const seededNotes = (mode: JeffDemoMode) => (mode === 'fresh' ? [] : JEFF_NOTES)
export const seededFlags = (mode: JeffDemoMode) => (mode === 'fresh' ? [] : JEFF_FLAGS)
export const seededThreads = (mode: JeffDemoMode) => (mode === 'fresh' ? [] : JEFF_THREADS)

/**
 * WHAT SITS IN ONE SECTION'S GUTTER — his `.mkh` affordance, which states its
 * contents in words: "3 markers here: 1 Rubi conversation, 2 notes."
 */
export function marksInSection(lessonId: string, num: string, mode: JeffDemoMode) {
  const chats = seededThreads(mode).filter((t) => t.lesson === lessonId && t.anchor === num).length
  const notes = seededNotes(mode).filter((n) => n.lesson === lessonId && n.num === num).length
  const flags = seededFlags(mode).filter((f) => f.lesson === lessonId && f.num === num).length
  const parts: string[] = []
  if (chats) parts.push(`${chats} Rubi ${chats === 1 ? 'conversation' : 'conversations'}`)
  if (notes) parts.push(`${notes} ${notes === 1 ? 'note' : 'notes'}`)
  if (flags) parts.push(`${flags} ${flags === 1 ? 'flag' : 'flags'}`)
  return { total: chats + notes + flags, parts }
}

/**
 * ⚠ WHERE PROGRESS STOPS. The index of an unanswered scenario check, or -1.
 * Everything at or after it is not done however far the learner has scrolled —
 * which is the whole point of the gate, and the reason Continue reads
 * "Answer the scenario check to continue" rather than simply being disabled.
 */
export function gateIndex(lesson: JeffLesson, p: JeffProgress): number {
  if (lessonState(lesson, p) === 'done') return -1
  return lesson.secs.findIndex((c) => c.quiz && !p.quiz)
}

export function secDone(lesson: JeffLesson, sec: JeffSection, p: JeffProgress): boolean {
  if (lessonState(lesson, p) === 'done') return true
  const g = gateIndex(lesson, p)
  const i = lesson.secs.indexOf(sec)
  return !!p.seen[sectionKey(lesson, sec)] && (g < 0 || i < g)
}

/** The one section the lesson is waiting on — his amber segment. */
export function secWaiting(lesson: JeffLesson, sec: JeffSection, p: JeffProgress): boolean {
  const g = gateIndex(lesson, p)
  const i = lesson.secs.indexOf(sec)
  if (g < 0 || i !== g) return false
  return lesson.secs.slice(0, g).every((x) => secDone(lesson, x, p))
}

export const doneCount = (lesson: JeffLesson, p: JeffProgress) =>
  lesson.secs.filter((c) => secDone(lesson, c, p)).length

/** ⚠ ACROSS THE WHOLE CHAPTER, not the lesson — his "3% chapter complete". */
export function chapterPercent(p: JeffProgress): number {
  const total = JEFF_LESSONS.reduce((a, l) => a + l.secs.length, 0)
  const done = JEFF_LESSONS.reduce((a, l) => a + doneCount(l, p), 0)
  return Math.round((done / total) * 100)
}

export const lessonPercent = (lesson: JeffLesson, p: JeffProgress) =>
  Math.round((doneCount(lesson, p) / lesson.secs.length) * 100)

/**
 * How wide a section's segment is in the track.
 *
 * ⚠ WORD COUNT, WITH A FLOOR — his comment: "Segment width follows how much
 * content the section holds (word count, with a floor so short sections stay
 * clickable)." A scenario check adds 40 for the answering it asks for.
 */
export function segmentWeight(sec: JeffSection): number {
  const parts = [
    ...(sec.paras ?? []),
    ...(sec.bullets ?? []),
    ...(sec.defs ?? []).map((d) => `${d.term} ${d.def}`),
    ...(sec.rows ?? []).map((r) => [r.a, r.b, r.c, r.d].join(' ')),
    ...(sec.tip ? [sec.tip] : []),
    ...(sec.cards ?? []).map((c) => `${c.front} ${c.back}`),
  ]
  const words = parts.join(' ').split(/\s+/).filter(Boolean).length + (sec.quiz ? 40 : 0)
  return Math.max(20, words)
}

/** The seeded markers for a lesson — notes, flags and (later) Rubi threads. */
export const marksFor = (lessonId: string, mode: JeffDemoMode) =>
  seededNotes(mode).filter((n) => n.lesson === lessonId).length +
  seededFlags(mode).filter((f) => f.lesson === lessonId).length +
  seededThreads(mode).filter((t) => t.lesson === lessonId).length

/**
 * MINUTES LEFT IN ONE LESSON — his `tocLeftOf`.
 *
 * ⚠ A DONE LESSON HAS NONE, AND THE CURRENT ONE IS PRORATED by how far the
 * learner has read. Summing the raw estimates instead reads "1h 27m left" on
 * a course that says "1h 24m" — three minutes, and exactly the kind of quiet
 * arithmetic drift that makes a port feel like a copy of the design rather
 * than the design.
 */
export function minutesLeft(lesson: JeffLesson, p: JeffProgress, estimate: number): number {
  const state = lessonState(lesson, p)
  if (state === 'done') return 0
  if (state !== 'current') return estimate
  return estimate - Math.round(estimate * (doneCount(lesson, p) / lesson.secs.length))
}

/** "1h 24m" / "48 min" — his `tocFmt`. */
export function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h}h ${r < 10 ? '0' : ''}${r}m`
}

/** "about 1 hour 24 minutes" — his `tocSpoken`, for the screen reader. */
export function spokenMinutes(m: number): string {
  if (m < 60) return `${m} minutes`
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h}${h === 1 ? ' hour' : ' hours'}${r ? ` ${r} minutes` : ''}`
}

/* ── Rubi ──────────────────────────────────────────────────────────────── */

export type JeffReply = {
  text?: string
  /** "L3 · Section 3.2" — the citation under an answer. */
  src?: string
  follow?: string[]
  /** The ask was for a quiz, so the rail opens the practice question instead. */
  quiz?: true
}

/**
 * RUBI'S ANSWER — his `mockReply`, ported rule for rule.
 *
 * ⚠ THE ORDER OF THE RULES IS THE DESIGN. A chip answers from `JEFF_ANSWERS`
 * before anything else; the PII guard comes before the greeting, so "my
 * address is…" is refused rather than chatted with; the keyword score decides
 * between twenty-two knowledge-base entries; and the last line is a REFUSAL to
 * leave the course ("I'm here for this course, so I'll stay with Chapter 2"),
 * which is the thing most worth not losing — it is how the prototype argues
 * that a course assistant should behave.
 *
 * ⚠ NOTHING HERE CALLS A MODEL. It is a fixture that looks like an assistant,
 * and it is labelled as such on screen by his own disclaimer.
 */
export function jeffReply(text: string, chip: string | null, topic: string): JeffReply {
  const q = (text || '').toLowerCase().trim()
  const answers = JEFF_ANSWERS[topic]
  if (chip && answers && answers[chip]) return { text: answers[chip][0], src: answers[chip][1] }
  if (JEFF_PII.test(q))
    return {
      text: 'Thanks, but please keep personal details like your address, license number or payment information out of the chat. I don’t need them to help with the course. What would you like to know about this lesson?',
      follow: ['Summarize this lesson', 'Quiz me'],
    }
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q))
    return {
      text: 'Hi! I can explain anything in Chapter 2, give you an example or run a quick check. Where would you like to start?',
      follow: ['Summarize this lesson', 'Quiz me', 'Give me an example'],
    }
  if (/\b(thanks|thank you|got it|makes sense|ok(ay)?)\b/.test(q) && q.length < 40)
    return { text: 'Anytime. Want a quick check before you move on?', follow: ['Quiz me', 'Summarize this lesson'] }
  if (/\b(quiz|test me|check me|practice|question for me|another question)\b/.test(q)) return { quiz: true }
  const k =
    q.indexOf('simpl') > -1
      ? 'simpler'
      : q.indexOf('example') > -1
        ? 'example'
        : /\bexam\b|on the test|likely/.test(q)
          ? 'exam'
          : q.indexOf('summar') > -1 || q.indexOf('recap') > -1
            ? 'summary'
            : null
  let best: (typeof JEFF_KB)[number] | null = null
  let bestScore = 0
  JEFF_KB.forEach((e) => {
    let sc = 0
    e.k.forEach((w) => {
      if (q.indexOf(w) > -1) sc += 1 + w.length / 20
    })
    if (sc > bestScore) {
      bestScore = sc
      best = e
    }
  })
  const hit = best as (typeof JEFF_KB)[number] | null
  if (hit && k === 'example' && /real-world example/.test(q)) {
    const tp = KB_TOPIC[hit.id] || topic
    return { text: JEFF_ANSWERS[tp].example[0], src: JEFF_ANSWERS[tp].example[1], follow: ['Explain it simpler', 'Quiz me'] }
  }
  if (hit && k === 'exam' && /exam/.test(q))
    return {
      text: `${hit.a} On the exam, expect a short scenario that tests whether you can apply this, not just define it.`,
      src: hit.src,
      follow: ['Quiz me', 'Give me an example'],
    }
  if (hit && (!k || bestScore >= 2)) return { text: hit.a, src: hit.src, follow: hit.follow }
  if (k && answers) return { text: answers[k][0], src: answers[k][1] }
  return {
    text: 'I’m here for this course, so I’ll stay with Chapter 2. I couldn’t match that to the lessons. Try asking about domicile, admitted status, surplus lines or policy dividends.',
    follow: ['How is domicile different from admitted status?', 'How do surplus lines work?', 'Quiz me'],
  }
}

/** Which lesson topic each knowledge-base entry belongs to — his inline map. */
const KB_TOPIC: Record<string, string> = {
  domestic: 'domicile',
  foreign: 'domicile',
  alien: 'domicile',
  domicile: 'domicile',
  vs: 'domicile',
  admitted: 'authorization',
  nonadmitted: 'authorization',
  becomeadmitted: 'authorization',
  protect: 'authorization',
  surplus: 'markets',
  residual: 'markets',
  standard: 'markets',
  guaranty: 'markets',
  stock: 'ownership',
  mutual: 'ownership',
  mutualization: 'ownership',
  demutualization: 'ownership',
  mixed: 'ownership',
  participating: 'dividends',
  nonparticipating: 'dividends',
  assessable: 'dividends',
  divsource: 'dividends',
}

/* ── The Compass full view ─────────────────────────────────────────────── */

export type JeffMarkerKind = 'Rubi' | 'Pointers' | 'Notes' | 'Flags'

export type JeffMarker = {
  id: string
  kind: JeffMarkerKind
  /** What the row reads — his own label, prefix and all. */
  label: string
  lesson: string
  num: string
  date?: string
  /** The lesson's topic, which is what the readiness chips count. */
  topic: string
}

/**
 * EVERY MARKER, IN COURSE ORDER AND GROUPED BY KIND — the Sources rail.
 *
 * ⚠ TEN, NOT NINE. The lesson rail counts what the learner made (five notes,
 * two flags, two Rubi conversations); the full view adds the POINTER Rubi
 * raised. The two counts are both right and they are different numbers, which
 * is worth knowing before one of them looks like a bug.
 */
export function allMarkers(mode: JeffDemoMode): JeffMarker[] {
  const topicOf = (lessonId: string) => lessonById(lessonId).topic
  return [
    ...seededThreads(mode).map((t) => ({
      id: t.id,
      kind: 'Rubi' as const,
      label: `Rubi chat: ${t.title}`,
      lesson: t.lesson,
      num: t.anchor,
      topic: topicOf(t.lesson),
    })),
    ...(mode === 'fresh' ? [] : JEFF_POINTERS).map((p) => ({
      id: p.id,
      kind: 'Pointers' as const,
      label: p.text,
      lesson: p.lesson,
      num: p.num,
      topic: topicOf(p.lesson),
    })),
    ...seededNotes(mode).map((n) => ({
      id: n.id,
      kind: 'Notes' as const,
      label: `Note: ${n.quote}`,
      lesson: n.lesson,
      num: n.num,
      date: n.date,
      topic: topicOf(n.lesson),
    })),
    ...seededFlags(mode).map((f) => ({
      id: f.id,
      kind: 'Flags' as const,
      label: f.title,
      lesson: f.lesson,
      num: f.num,
      date: f.date,
      topic: topicOf(f.lesson),
    })),
  ]
}

/** His four group headings, in the order the rail draws them. */
export const JEFF_MARKER_GROUPS: JeffMarkerKind[] = ['Rubi', 'Pointers', 'Notes', 'Flags']

/** "Where in my learning" — chapter (all), this lesson only, or everything. */
export function inScope(m: JeffMarker, scope: string, lessonId: string): boolean {
  if (scope === 'lesson') return m.lesson === lessonId
  return true
}

/** The readiness chips: how many SELECTED marks each topic has. */
export function topicCounts(markers: JeffMarker[]): { topic: string; label: string; n: number }[] {
  const by: Record<string, number> = {}
  markers.forEach((m) => {
    by[m.topic] = (by[m.topic] ?? 0) + 1
  })
  return Object.entries(by).map(([topic, n]) => ({ topic, label: JEFF_TOPIC_LABEL[topic] ?? topic, n }))
}

/** The topic the Studio makes from, and the one "Focus next" names. */
export function topTopic(markers: JeffMarker[]): string {
  const counts = topicCounts(markers)
  return counts.sort((a, b) => b.n - a.n)[0]?.topic ?? 'domicile'
}

/**
 * THE NOTEBOOK'S ANSWER — his `askNb`.
 *
 * ⚠ IT CITES THE SELECTION, every time: "L3 · Section 3.2 · from 10 selected
 * sources". The count is what makes the chat feel answerable FROM the marks
 * rather than from the course at large, and dropping it would quietly undo
 * the argument the whole surface is making.
 *
 * ⚠ A QUIZ ASK CYCLES HIS BANK rather than answering in prose, and the
 * question is rendered with its options inline: "… (Domestic / Foreign /
 * Alien)". `at` is the position in the bank, so the caller advances it.
 */
export function notebookReply(
  q: string,
  key: string | null,
  topic: string,
  selectedCount: number,
  at: number,
): { text: string; src: string; nextAt: number } {
  const r = jeffReply(q, key, topic)
  if (r.quiz) {
    const i = (at + 1) % JEFF_QUIZ.length
    const item = JEFF_QUIZ[i]
    return {
      text: `${item.q} (${item.opts.join(' / ')})`,
      src: `${item.src} · from ${selectedCount} selected sources`,
      nextAt: i,
    }
  }
  return {
    text: r.text ?? '',
    src: `${r.src ? `${r.src} · ` : ''}from ${selectedCount} selected sources`,
    nextAt: at,
  }
}

/**
 * ⚠ WHAT THE LEARNER TYPED, WITH LONG NUMBERS MASKED — his own line:
 * `q.replace(/\d{4,}/g, d => d.replace(/\d/g, '•'))`. The PII guard refuses to
 * ANSWER; this makes sure the thing they typed is not left sitting in the
 * transcript either.
 */
export const maskDigits = (q: string) => q.replace(/\d{4,}/g, (d) => d.replace(/\d/g, '•'))
