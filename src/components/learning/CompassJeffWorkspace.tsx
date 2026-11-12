import { useState } from 'react'
/* ⚠ THE NEAREST GLYPHS THE REGISTRY SHIPS, named here so the substitutions
   are on the record rather than discovered later: his pencil is `PenToSquare`,
   his upload tray is `Plus` (nothing in the registry is an upload arrow), and
   his ✕ is `XmarkRegular`. Adding SVGs is a registry decision, not a porting
   one — the `port-prototype` skill's rule. */
import {
  AngleLeftRegular,
  AngleRightRegular,
  MagnifyingGlass,
  PaperPlaneTopSolid,
  PenToSquare,
  Plus,
  RubiLogo,
  XmarkRegular,
} from '@/icons'
import {
  JEFF_EXAM_DAYS,
  JEFF_LIBRARY_SEED,
  JEFF_LIB_ACTION,
  JEFF_NOTEBOOK,
  JEFF_NOTEBOOK_CHIPS,
  JEFF_SCOPES,
  JEFF_STUDIO,
  JEFF_STUDIO_DISCLAIMER,
  JEFF_TOPIC_LABEL,
} from '@/data/compassJeffFixtures'
import { CompassJeffResize } from './CompassJeffResize'
import {
  JEFF_MARKER_GROUPS,
  allMarkers,
  inScope,
  maskDigits,
  notebookReply,
  topTopic,
  topicCounts,
  type JeffDemoMode,
  type JeffMarker,
} from './compassJeffModel'

/**
 * JEFF'S COMPASS FULL VIEW — Sources · Course notebook · Studio, 2026-11-05.
 *
 * What "Open Compass in full view" opens from his lesson player: the markers
 * the learner has made become SOURCES, the centre becomes a notebook that
 * answers from the ones they have selected, and the right rail makes things
 * out of them.
 *
 * ⚠ THIS IS THE SAME IDEA AS ANJANI'S WORKSPACE, ONE STAGE ON, and the two
 * are deliberately BOTH in the product rather than merged. Hers (2026-11-04,
 * `CompassWorkspace`) argues the concept against a sketched course; his
 * argues it against a real one, with sources, selection and citation. Merging
 * them would settle a design question that is the whole reason the Course
 * content version control exists — so hers stays on the Workspace page and
 * his lives here, and the two can be compared.
 *
 * ⚠ NO DECK PLAYER, NO QUIZ ENGINE. His Studio makes six kinds of thing, and
 * every made thing's button asks the NOTEBOOK a question (`JEFF_LIB_ACTION`).
 * The chat is where studying happens. Building a card player here would add a
 * surface he did not design.
 */
export function CompassJeffWorkspace({
  mode,
  lessonId,
  chapterPct,
  onClose,
}: {
  mode: JeffDemoMode
  /** Which lesson the learner came from — the title and the scope use it. */
  lessonId: string
  /** ⚠ THE COURSE'S PROGRESS, NOT THE SELECTION'S. The readiness block reports
      how much of the chapter is read; the first pass printed the share of
      markers ticked, which on a full selection reads a triumphant 100% and
      means nothing. */
  chapterPct: number
  onClose: () => void
}) {
  const markers = allMarkers(mode)
  const [scope, setScope] = useState('chapter')
  const [unselected, setUnselected] = useState<Record<string, true>>({})
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [srcOpen, setSrcOpen] = useState(true)
  const [srcWidth, setSrcWidth] = useState(400)
  const [studioWidth, setStudioWidth] = useState(400)
  const [studioOpen, setStudioOpen] = useState(true)
  const [draft, setDraft] = useState('')
  const [thread, setThread] = useState<{ who: 'user' | 'rubi'; text: string; src?: string }[]>([])
  const [quizAt, setQuizAt] = useState(-1)
  const [library, setLibrary] = useState(mode === 'fresh' ? [] : JEFF_LIBRARY_SEED)
  const [title, setTitle] = useState(`Chapter 2 · Lesson ${lessonId.replace(/\D/g, '')}`)
  const [renaming, setRenaming] = useState(false)

  const inView = markers
    .filter((m) => inScope(m, scope, lessonId))
    .filter((m) => !search || m.label.toLowerCase().includes(search.toLowerCase()))
  const selected = inView.filter((m) => !unselected[m.id])
  const topic = topTopic(selected)
  const chips = topicCounts(selected)
  const focusN = selected.filter((m) => m.topic === topic).length

  /* ⚠ EVERY PROMPT GOES THROUGH ONE DOOR — his `askNb`. The chips, the
     composer and every made thing's button all call this, which is what keeps
     one answer shape and one citation format across three different controls. */
  const ask = (q: string, key: string | null) => {
    const text = q.trim()
    if (!text) return
    const r = notebookReply(text, key, topic, selected.length, quizAt)
    setQuizAt(r.nextAt)
    setThread((t) => [...t, { who: 'user', text: maskDigits(text) }, { who: 'rubi', text: r.text, src: r.src }])
    setDraft('')
  }

  const make = (kind: string) => {
    setLibrary((lib) => [
      {
        kind,
        title: `${kind} · ${JEFF_TOPIC_LABEL[topic]}`,
        meta: `Made from ${selected.length} marks · just now`,
      },
      ...lib,
    ])
  }

  return (
    <div className="cre-jc cre-jcw" role="region" aria-label="Compass">
      <div className="cre-jcw-bar">
        <span className="cre-jcw-brand">
          <RubiLogo size={18} aria-hidden />
          Compass
        </span>
        <span className="cre-jcw-title">
          <span>Workspace:</span>
          {renaming ? (
            <input
              className="cre-jcw-title-input"
              aria-label="Workspace name"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setRenaming(false)}
              onKeyDown={(e) => e.key === 'Enter' && setRenaming(false)}
            />
          ) : (
            <strong>{title}</strong>
          )}
        </span>
        <button
          type="button"
          className="cre-jcw-icon"
          aria-label={`Rename workspace: ${title}`}
          onClick={() => setRenaming(true)}
        >
          <PenToSquare size={15} aria-hidden />
        </button>
        <button
          type="button"
          className="cre-jcw-icon cre-jcw-close"
          aria-label="Close Compass and return to the course"
          onClick={onClose}
        >
          <XmarkRegular size={16} aria-hidden />
        </button>
      </div>

      <div className="cre-jcw-cols">
        {/* ---- Sources ---- */}
        {srcOpen ? (
          <aside className="cre-jcw-sources" aria-label="Sources" style={{ flexBasis: srcWidth }}>
            <div className="cre-jcw-src-head">
              <div>
                <h2 className="cre-jcw-h">Sources</h2>
                <p className="cre-jcw-sub">
                  {selected.length} of {inView.length} selected
                </p>
              </div>
              <button type="button" className="cre-jcw-outline" aria-label="Upload content to Sources">
                <Plus size={14} aria-hidden />
                Upload
              </button>
              <button
                type="button"
                className="cre-jc-sq"
                aria-label="Collapse Sources"
                onClick={() => setSrcOpen(false)}
              >
                <AngleLeftRegular size={16} aria-hidden />
              </button>
            </div>

            <label className="cre-jcw-label" htmlFor="jcw-scope">
              Where in my learning
            </label>
            <select
              id="jcw-scope"
              className="cre-jcw-select"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              {JEFF_SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="cre-jc-filter"
              aria-label={`Showing All markers, ${inView.length}. Choose marker type`}
              aria-expanded={false}
            >
              <span>All markers</span>
              <span>{inView.length}</span>
            </button>

            <div className="cre-jcw-markers-head">
              <span className="eyebrow">Your markers</span>
              <button type="button" className="chip" aria-label="Search your markers" onClick={() => setSearchOpen((v) => !v)}>
                <MagnifyingGlass size={13} aria-hidden />
                Search
              </button>
              <label className="cre-jcw-selectall">
                Select all
                <input
                  type="checkbox"
                  checked={selected.length === inView.length && inView.length > 0}
                  onChange={(e) => setUnselected(e.target.checked ? {} : Object.fromEntries(inView.map((m) => [m.id, true as const])))}
                />
              </label>
            </div>
            {searchOpen && (
              <input
                className="cre-jcw-search"
                aria-label="Search markers"
                placeholder="Search your markers"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}

            {JEFF_MARKER_GROUPS.map((group) => {
              const rows = inView.filter((m) => m.kind === group)
              if (!rows.length) return null
              return (
                <section key={group} className="cre-jcw-group" aria-label={group}>
                  <h3 className="cre-jcw-group-head">
                    <RubiLogo size={14} aria-hidden />
                    {group}
                  </h3>
                  {rows.map((m) => (
                    <MarkerRow
                      key={m.id}
                      marker={m}
                      checked={!unselected[m.id]}
                      onToggle={() =>
                        setUnselected((u) => {
                          const next = { ...u }
                          if (next[m.id]) delete next[m.id]
                          else next[m.id] = true
                          return next
                        })
                      }
                    />
                  ))}
                </section>
              )
            })}
          </aside>
        ) : (
          <button type="button" className="cre-jcw-folded" aria-label="Expand Sources" onClick={() => setSrcOpen(true)}>
            Sources
          </button>
        )}
        {srcOpen && (
          <CompassJeffResize
            label="Resize Sources"
            width={srcWidth}
            min={320}
            max={620}
            reset={400}
            grow="right"
            onResize={setSrcWidth}
          />
        )}

        {/* ---- the notebook ---- */}
        <main className="cre-jcw-notebook" aria-label="Compass notebook">
          <div className="cre-jcw-nb-scroll">
            <span className="eyebrow">
              Course notebook · {selected.length} sources
            </span>
            <h2 className="serif cre-jcw-nb-title">{JEFF_NOTEBOOK.title}</h2>
            {selected.length > 0 ? (
              <>
                <p className="cre-jcw-nb-lede">{JEFF_NOTEBOOK.synthesis}</p>
                <div className="cre-jcw-readiness">
                  <span>{JEFF_NOTEBOOK.readinessLead}</span>
                  {chips.map((c) => (
                    <span className="cre-jcw-chip-read" key={c.topic}>
                      {c.label} · {c.n}
                    </span>
                  ))}
                </div>
                <div className="cre-jcw-prompts">
                  {JEFF_NOTEBOOK_CHIPS.map(([label, key]) => (
                    <button type="button" className="chip" key={label} onClick={() => ask(label, key)}>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* ⚠ HIS EMPTY STATE IS AN INSTRUCTION, not a blank panel. */
              <p className="cre-jcw-nb-lede">
                Select at least one marker on the left and Rubi will summarize it and suggest what to
                review.
              </p>
            )}

            {thread.map((m, i) => (
              <div key={i} className={`cre-jcw-msg ${m.who === 'user' ? 'is-user' : 'is-rubi'}`}>
                {m.text}
                {m.src && <span className="cre-jc-msg-src">Grounded in: {m.src}</span>}
              </div>
            ))}
          </div>

          <div className="cre-jcw-composer">
            <p className="cre-jcw-answering">Answering from {selected.length} selected sources</p>
            <div className="cre-jc-prompt">
              <input
                aria-label="Ask about your sources"
                placeholder={JEFF_NOTEBOOK.placeholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    ask(draft, null)
                  }
                }}
              />
              <button type="button" className="cre-jc-send" aria-label="Send" onClick={() => ask(draft, null)}>
                <PaperPlaneTopSolid size={16} aria-hidden />
              </button>
            </div>
            <p className="cre-jc-disclaimer">{JEFF_NOTEBOOK.disclaimer}</p>
          </div>
        </main>

        {/* ---- the Studio ---- */}
        {studioOpen && (
          <CompassJeffResize
            label="Resize Studio"
            width={studioWidth}
            min={320}
            max={620}
            reset={400}
            onResize={setStudioWidth}
          />
        )}
        {studioOpen ? (
          <aside className="cre-jcw-studio" aria-label="Studio" style={{ flexBasis: studioWidth }}>
            <div className="cre-jcw-studio-head">
              <span className="eyebrow">Studio</span>
              <button
                type="button"
                className="cre-jc-sq"
                aria-label="Collapse Studio"
                onClick={() => setStudioOpen(false)}
              >
                <AngleRightRegular size={16} aria-hidden />
              </button>
            </div>

            <div className="cre-jcw-readiness-card">
              <div className="cre-jcw-readiness-top">
                <span className="eyebrow">Readiness</span>
                <span className="eyebrow">Exam in {JEFF_EXAM_DAYS} days</span>
              </div>
              <div className="cre-jcw-readiness-row">
                <span>Chapter progress</span>
                <strong>{chapterPct}%</strong>
              </div>
              <p className="cre-jcw-focus">
                <strong>Focus next:</strong> {JEFF_TOPIC_LABEL[topic].toLowerCase()}.{' '}
                {focusN
                  ? `Marked ${focusN} ${focusN === 1 ? 'time' : 'times'} in your selected marks.`
                  : 'Select marks to see where to focus.'}
              </p>
              <button type="button" className="cre-jc-continue" onClick={() => ask('Quiz me', null)}>
                Take a quick check
              </button>
            </div>

            <p className="eyebrow cre-jcw-make-head">Make from all marks</p>
            <div className="cre-jcw-make">
              {JEFF_STUDIO.map((s) => (
                <button
                  type="button"
                  key={s.kind}
                  className={`cre-jcw-make-tile${s.soon ? ' is-soon' : ''}`}
                  disabled={s.soon}
                  onClick={() => make(s.kind)}
                >
                  <strong>{s.kind}</strong>
                  {s.soon && <span className="cre-jcw-soon">Coming soon</span>}
                  <span>{s.sub}</span>
                </button>
              ))}
            </div>

            <p className="eyebrow cre-jcw-make-head">Created by me</p>
            {library.length === 0 ? (
              <p className="cre-jc-empty">
                Nothing made yet. Pick a format above to turn your marks into study material.
              </p>
            ) : (
              library.map((b, i) => {
                const act = JEFF_LIB_ACTION[b.kind] ?? ['Open', 'Summarize my sources', 'summary']
                return (
                  <div className="cre-jcw-made" key={`${b.title}-${i}`}>
                    <strong>{b.title}</strong>
                    <span>{b.meta}</span>
                    {/* ⚠ EVERY MADE THING'S BUTTON ASKS THE NOTEBOOK — see
                        `JEFF_LIB_ACTION`. There is no player behind it. */}
                    <button type="button" className="cre-jcw-made-cta" onClick={() => ask(act[1], act[2])}>
                      {act[0]} →
                    </button>
                  </div>
                )
              })
            )}
            <p className="cre-jcw-studio-note">{JEFF_STUDIO_DISCLAIMER}</p>
          </aside>
        ) : (
          <button type="button" className="cre-jcw-folded" aria-label="Expand Studio" onClick={() => setStudioOpen(true)}>
            Studio
          </button>
        )}
      </div>
    </div>
  )
}

/** One selectable marker. ⚠ Its checkbox is what the notebook answers from. */
function MarkerRow({
  marker,
  checked,
  onToggle,
}: {
  marker: JeffMarker
  checked: boolean
  onToggle: () => void
}) {
  return (
    <label className="cre-jcw-marker">
      <span>
        <span className="cre-jcw-marker-label">{marker.label}</span>
        <span className="cre-jcw-marker-meta">
          {marker.lesson} · Section {marker.num}
          {marker.date ? ` · ${marker.date}` : ''}
        </span>
      </span>
      <input type="checkbox" checked={checked} onChange={onToggle} aria-label={marker.label} />
    </label>
  )
}
