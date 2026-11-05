import { useMemo, useState, type ReactNode } from 'react'

import { ClipboardListCheckRegular, FileLinesRegular, NotebookRegular, Star, StarSolid } from '@/icons'

import {
  COMPASS_WORKSPACE_SESSIONS,
  type WorkspaceMadeSpec,
  WORKSPACE_CREATED,
  WORKSPACE_MAKE,
  WORKSPACE_NUDGE,
  WORKSPACE_READINESS,
  WORKSPACE_COMPOSER,
  WORKSPACE_SESSION_OPENERS,
  WORKSPACE_SUGGESTED,
  WORKSPACE_DECK,
  WORKSPACE_DECK_UI,
  WORKSPACE_MAKE_RESULT,
  WORKSPACE_TALKING_ABOUT,
  WORKSPACE_UPLOAD,
  WORKSPACE_FILTERS,
  WORKSPACE_GROUP_PLURAL,
  WORKSPACE_GROUP_TYPE,
  WORKSPACE_TYPE_COLOR,
  type WorkspaceMark,
} from '@/data/compassWorkspaceFixtures'
import {
  EMPTY_WORKSPACE_STATE,
  countOfType,
  groupMarks,
  kindLabel,
  markById,
  markChapters,
  pinnedIds,
  savedMarks,
  scopedMarks,
  type WorkspaceDeviceView,
  type WorkspaceHome,
  type WorkspaceLayout,
  type WorkspaceRubiShape,
  type WorkspaceSessionView,
  type WorkspaceState,
  type WorkspaceStory,
} from './compassWorkspaceModel'
import './compassWorkspace.css'

/**
 * THE COMPASS WORKSPACE — the learner's private study surface (2026-11-04).
 *
 * "Everything you marked in your course, and what you can make from it. Only
 * you can see this." Her lede, and it is the whole argument: the course player
 * is where you read, and this is where what you kept goes.
 *
 * Ported from `public/prototypes/xcel-compass-workspace-v4.html`, the file
 * Anjani staged on 2026-11-04 — the one screen in that build with no React
 * equivalent. Everything else in v4 had already been ported on 2026-10-15/16.
 *
 * ── WHAT IS HERS AND WHAT IS MINE ──────────────────────────────────────────
 *
 * Hers: every string a learner reads, the six layouts and what each one
 * arranges, the five home views, the four "Make" actions, the mark types and
 * how six of them collapse into four groups, her eleven marks and three saved
 * sessions, and the SHAPE of her class names — `.ws-card` is `.cre-ws-card`,
 * `.f-bar` is `.cre-wsf-bar`, so her stylesheet ports as a stylesheet rather
 * than being re-derived.
 *
 * ⚠ PREFIXED, NOT COPIED VERBATIM, and that is not fussiness. This file's CSS
 * is imported globally like every other stylesheet here, and her names are
 * generic enough to collide across the whole app — `.f-a`, `.r-c`, `.n`,
 * `.big` would each have escaped this surface and landed on somebody else's.
 * `compassAnjani.css` and `compassStudyPlanner.css` made the same call
 * (`cre-rail`, `cre-planner`); her bare utility classes (`on`, `sel`, `big`,
 * `dot`) keep their names and are scoped under `.cre-ws` instead.
 *
 * Mine: React. The prototype renders by building HTML strings and re-running
 * `render()` on every change; this is components over state, which is the
 * same picture drawn by a different machine. Where a choice had to be made I
 * made the one that keeps her markup recognisable — a reviewer holding the two
 * side by side should see the same DOM.
 *
 * ⚠ FOUR OF THE SIX LAYOUTS ARE SKETCHES, and they are ported as sketches —
 * `A`, `B`, `C` and `D` are about twenty lines each in her file against
 * `F`'s 113. They are arrangements of the same panes, not finished designs,
 * and filling them in would have made them mine. The flag description says so,
 * so a reviewer reads a thin layout as her sketch rather than as a bug.
 *
 * ⚠ THREE OF HER SIX DEMO CONTROLS ARE HIDDEN IN HER FILE — see the long note
 * in `compassWorkspaceModel.ts`. This port exposes all six.
 *
 * ⚠ AND THE RAIL ROW IS HERS TOO. The first pass claimed her file had no rail
 * row for the Workspace and put one last "as the port's one invention". Her
 * `addNav()` inserts it directly after Learn; see `compassPages.ts`. There is
 * no invention in this port — only the icon, which is a stand-in.
 */

export type CompassWorkspaceProps = {
  /** Which arrangement — the `compass-workspace-layout` design control. */
  layout?: WorkspaceLayout
  /** Which home view — `compass-workspace-home`. */
  home?: WorkspaceHome
  /** How full the workspace is — `compass-workspace-story`. */
  story?: WorkspaceStory
  /** How saved sessions are arranged — `compass-workspace-sessions`. */
  sessionView?: WorkspaceSessionView
  /** What a Rubi reply looks like — `compass-workspace-rubi`. */
  rubiShape?: WorkspaceRubiShape
  /** The device frame — `compass-workspace-view`. */
  deviceView?: WorkspaceDeviceView
  /** Closing the workspace. The prototype's `data-fsback`; the route decides
   *  what "back" means, so it is a prop rather than a navigation call. */
  onClose?: () => void
}

/** The id a session carries before it is saved — her "New session". */
const NEW_SESSION = 'new'

/* ⚠ ONE LIST OF MAKE ACTIONS, hers (`WORKSPACE_MAKE`). There were two until
   the sweep — a four-item list invented in the first pass using the ids
   `summary` and `podcast`, beside her six using `guide` and `audio`. The ids
   did not match `WORKSPACE_MAKE_RESULT`, so two of the four buttons fired and
   produced nothing at all, silently. A second vocabulary for the same thing
   is how that happens. */

/** A generated artefact — what a Make button leaves behind. Empty until
 *  something is made, exactly as `WS.assets` starts empty. */
type WorkspaceAsset = { id: string; kind: string; from: number; spec: WorkspaceMadeSpec }

export function CompassWorkspace({
  layout = 'F',
  home = 'A',
  story = '5',
  sessionView = 'list',
  rubiShape = 'M',
  deviceView = 'web',
  onClose,
}: CompassWorkspaceProps) {
  const [state, setState] = useState<WorkspaceState>(EMPTY_WORKSPACE_STATE)
  const [assets, setAssets] = useState<WorkspaceAsset[]>([])
  const [toast, setToast] = useState('')
  const [nudgeGone, setNudgeGone] = useState(false)
  /** The suggested question that was pressed, and Rubi's reply to it. */
  const [asked, setAsked] = useState('')
  /** Her session star — a real toggle on each card, seeded from the session's
   *  own `pinned`. Per-session override, so starring one does not restate
   *  the fixture. */
  const [starred, setStarred] = useState<Record<string, boolean>>({})
  /** The open deck — her artefacts open INTO the centre rather than away. */
  const [deck, setDeck] = useState<{ open: boolean; title: string; i: number; flipped: boolean; conf: Record<number, string> }>(
    { open: false, title: '', i: 0, flipped: false, conf: {} },
  )

  const all = useMemo(() => savedMarks(layout, story), [layout, story])
  const list = useMemo(() => scopedMarks(all, state), [all, state])
  const chapters = useMemo(() => markChapters(all), [all])
  const pinned = pinnedIds(state)
  const openSessionName =
    state.session === NEW_SESSION
      ? WORKSPACE_COMPOSER.untitled
      : (COMPASS_WORKSPACE_SESSIONS.find((x) => x.id === state.session)?.title ?? WORKSPACE_COMPOSER.untitled)
  const focused = markById(state.focus)

  const patch = (next: Partial<WorkspaceState>) => setState((s) => ({ ...s, ...next }))
  const togglePin = (id: string) => setState((s) => ({ ...s, sel: { ...s.sel, [id]: !s.sel[id] } }))
  const clearPins = () => patch({ sel: {} })
  const say = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(''), 2000)
  }
  /* ⚠ A MAKE PRODUCES HER ARTEFACT, not a restatement of the button. Each of
     the four has its own NAME, and one of three payloads: a CTA that opens
     it, a body that IS it (a one-page summary previews itself), or an audio
     player. The first three passes stored the button's label and an "Open →",
     which made four different outcomes look like one. */
  const make = (kind: string) => {
    if (!pinned.length) return
    const spec = WORKSPACE_MAKE_RESULT[kind]
    if (!spec) return
    setAssets((a) => [{ id: `a${a.length + 1}`, kind, from: pinned.length, spec }, ...a])
    say(spec.toast)
  }

  /* ── shared pieces ─────────────────────────────────────────────────────── */

  /** The type dot in front of a mark. Her `ico()` — a filled round in the
   *  type's own colour, which is what makes a list of mixed marks scannable
   *  without reading any of them. */
  const Dot = ({ type }: { type: WorkspaceMark['type'] }) => (
    <i className="cre-ws-ico" style={{ background: WORKSPACE_TYPE_COLOR[type] }} aria-hidden />
  )

  /** What a session produced, as her glyph. Three artefacts, three icons from
   *  the registry — she draws her own SVGs, this repo has a registry and the
   *  convention is to use it. The NAME is the title and the screen-reader
   *  text, so nothing is lost by the icon being approximate. */
  const MadeIcon = ({ made }: { made: string }) => {
    if (/flashcard/i.test(made)) return <NotebookRegular size={16} aria-hidden />
    if (/practice|quiz/i.test(made)) return <ClipboardListCheckRegular size={16} aria-hidden />
    return <FileLinesRegular size={16} aria-hidden />
  }

  /** Her `filterBar()` — and it is two bars, not one. With marks pinned it
   *  becomes the action bar (what you can MAKE from them); with none it is
   *  the filter chips. One element, two jobs, because the thing you want
   *  after pinning is never the filter. */
  const FilterBar = () =>
    pinned.length ? (
      <div className="cre-ws-bar sel">
        <span className="cnt">
          {pinned.length} {pinned.length === 1 ? 'item selected' : 'items selected'}
        </span>
        <button className="cre-ws-act" onClick={() => say('Asking Rubi about these')}>
          Ask Rubi about these
        </button>
        {WORKSPACE_MAKE.filter((a) => !a.soon).map((a) => (
          <button key={a.id} className="cre-ws-act ghost" onClick={() => make(a.id)}>
            {a.label}
          </button>
        ))}
        <button className="cre-ws-act q" onClick={clearPins}>
          Clear
        </button>
      </div>
    ) : (
      <div className="cre-ws-bar">
        {WORKSPACE_FILTERS.map((f) => {
          const n = countOfType(all, state.scope, f.value)
          if (f.value !== 'all' && !n) return null
          return (
            <button
              key={f.value}
              className={`cre-ws-chip${state.filter === f.value ? ' on' : ''}`}
              aria-pressed={state.filter === f.value}
              onClick={() => patch({ filter: f.value })}
            >
              {f.value !== 'all' && <Dot type={f.value as WorkspaceMark['type']} />}
              {f.label} <span className="cre-wsf-n">{n}</span>
            </button>
          )
        })}
      </div>
    )

  /** One mark, as a card — her `card()`. The checkbox is a real checkbox role
   *  because pinning is the surface's main verb and it must be reachable from
   *  the keyboard. */
  const MarkCard = ({ mark, showChapter }: { mark: WorkspaceMark; showChapter?: boolean }) => {
    const on = Boolean(state.sel[mark.id])
    return (
      <div className={`cre-ws-card${on ? ' sel' : ''}${mark.type === 'rubi' ? ' rubi' : ''}`}>
        <div
          className={`cre-ws-check${on ? ' on' : ''}`}
          role="checkbox"
          aria-checked={on}
          aria-label={`Pin: ${mark.text}`}
          tabIndex={0}
          onClick={() => togglePin(mark.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              togglePin(mark.id)
            }
          }}
        />
        <div className="cre-ws-body">
          {/* ⚠ THE PASSAGE COMES FIRST, the provenance under it — hers, and the
              first port had them the other way round. What the learner marked
              is the thing; where it came from is the footnote. */}
          <p className="cre-ws-quote">{mark.text}</p>
          {mark.note && <p className="cre-ws-note">{mark.note}</p>}
          <div className="cre-ws-kind">
            {mark.type === 'rubi' ? <span className="rb">Rubi answer</span> : kindLabel(mark.type)}
            <span className="dot" />
            {mark.where}
            {showChapter && (
              <>
                <span className="dot" />
                {mark.ch}
              </>
            )}
            {mark.origin && (
              <>
                <span className="dot" />
                <span className="cre-ws-origin">{mark.origin}</span>
              </>
            )}
          </div>
          <div className="cre-ws-acts">
            <button onClick={() => patch({ focus: mark.id, view: 'work' })}>Ask Rubi about this</button>
            {mark.thread && <span className="cre-ws-thread-n">{mark.thread.length} asked</span>}
          </div>
        </div>
      </div>
    )
  }

  /** The compact one-line mark used by the index layouts — her `.ws-mini`. */
  const MiniMark = ({ mark }: { mark: WorkspaceMark }) => (
    <button
      className={`cre-ws-mini${mark.type === 'rubi' ? ' r' : ''}${state.sel[mark.id] ? ' on' : ''}`}
      onClick={() => togglePin(mark.id)}
      aria-pressed={Boolean(state.sel[mark.id])}
    >
      <Dot type={mark.type} />
      <span>{mark.text}</span>
    </button>
  )

  /** Her `makeBlock()` — the four things a pile of marks can become. Disabled
   *  with nothing pinned, and the sub-line says why rather than leaving a dead
   *  button to be puzzled over. */
  const MakeBlock = () => {
    const n = pinned.length
    const sfx = n ? ` from ${n} selected` : ' — select items first'
    return (
      <div className="cre-ws-make">
        {WORKSPACE_MAKE.map((a) => (
          <button key={a.id} disabled={!n || a.soon} onClick={() => make(a.id)}>
            {a.label}
            {a.soon && <em className="cre-ws-soon">Coming soon</em>}
            <small>
              {a.note}
              {a.soon ? '' : sfx}
            </small>
          </button>
        ))}
      </div>
    )
  }

  /** An artefact in Created by me. ⚠ THREE PAYLOAD SHAPES, hers: a CTA that
   *  opens the thing, a body that IS the thing, or an audio player. */
  const AssetCard = ({ asset }: { asset: WorkspaceAsset }) => (
    <div className="cre-ws-asset">
      <b>{asset.spec.title}</b>
      <span className="from">
        Made from {asset.from} saved {asset.from === 1 ? 'item' : 'items'}
        {asset.spec.also && ` · also in ${asset.spec.also}`}
      </span>
      {asset.spec.body && <p className="cre-ws-abody">{asset.spec.body}</p>}
      {asset.spec.audio && (
        <div className="cre-ws-audio">
          <button aria-label={`Play ${asset.spec.title}`} onClick={() => say('Playing')}>
            ▶
          </button>
          <span>
            {asset.spec.audio.at} / {asset.spec.audio.of}
          </span>
        </div>
      )}
      {asset.spec.cta && (
        <div className="cre-ws-acts">
          <button
            onClick={() =>
              asset.kind === 'flashcards'
                ? setDeck({ open: true, title: asset.spec.title, i: 0, flipped: false, conf: {} })
                : say(asset.spec.cta!)
            }
          >
            {asset.spec.cta}
          </button>
        </div>
      )}
    </div>
  )

  /** The left rail of the Notebook layout: scope, search, chips, then the
   *  marks grouped. Her broad-to-narrow order — where, then what, then which. */
  const CaptureRail = () => {
    const groups = groupMarks(list)
    return (
      <div className="cre-ws-col cre-wsf-cl">
        <section className="cre-ws-pane cre-wsf-left" aria-label="Your marks">
          <div className="cre-wsnb-head">
            <h4>Your marks</h4>
            <span />
            <button
              className="cre-wsf-coll"
              aria-expanded={!state.colL}
              aria-label={state.colL ? 'Show your marks' : 'Hide your marks'}
              onClick={() => patch({ colL: !state.colL })}
            >
              ▤
            </button>
          </div>
          <label className="cre-ws-sr" htmlFor="fScope">
            Where in my learning
          </label>
          <select
            className="cre-wsf-field"
            id="fScope"
            value={state.scope}
            onChange={(e) => patch({ scope: e.target.value })}
          >
            <option value="all">Whole course</option>
            {chapters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="cre-ws-sr" htmlFor="fSearch">
            Search your marks
          </label>
          <input
            className="cre-wsf-field"
            id="fSearch"
            type="search"
            placeholder="Search your marks"
            value={state.q}
            onChange={(e) => patch({ q: e.target.value })}
          />
          <FilterBar />
          {pinned.length > 0 && (
            <div className="cre-wsf-pinbar" aria-live="polite">
              <span>{pinned.length} pinned</span>
              <button className="cre-wsnb-clr" onClick={clearPins}>
                Clear
              </button>
            </div>
          )}
          {!groups.length && (
            <div className="cre-ws-empty">Nothing matches. Try a wider scope or clear the search.</div>
          )}
          {groups.map((g) => {
            const open = state.openGroup[g.key] !== false
            return (
              <div key={g.key}>
                <button
                  className={`cre-wsnb-chh${open ? '' : ' closed'}`}
                  aria-expanded={open}
                  onClick={() => patch({ openGroup: { ...state.openGroup, [g.key]: !open } })}
                >
                  <Dot type={WORKSPACE_GROUP_TYPE[g.key]} />
                  {WORKSPACE_GROUP_PLURAL[g.key] ?? g.key}
                  <span className="n">{g.marks.length}</span>
                </button>
                {open && g.marks.map((m) => <MarkCard key={m.id} mark={m} />)}
              </div>
            )
          })}
        </section>
      </div>
    )
  }

  /**
   * THE DECK PLAYER — what opening an artefact does (2026-11-04, the sweep).
   *
   * ⚠ A MODE, and the fourth pass of this port is the first to have it. Her
   * deck replaces the centre entirely: a back-bar, a position, the term, and
   * — before the flip — a question asking you to commit. That order is the
   * pedagogy and is the one thing not to rearrange: she asks how sure you are
   * BEFORE she shows you, because an answer you have already seen teaches
   * nothing.
   */
  const DeckPane = () => {
    const card = WORKSPACE_DECK[deck.i]
    return (
      <div className="cre-ws-col cre-wsf-cm">
        <section className="cre-ws-pane cre-wsnb-pane" aria-label="Flashcards">
          <div className="cre-wsf-deckbar">
            <button
              className="cre-wsf-iconbtn"
              aria-label={WORKSPACE_DECK_UI.back}
              title={WORKSPACE_DECK_UI.back}
              onClick={() => setDeck({ open: false, title: '', i: 0, flipped: false, conf: {} })}
            >
              ‹
            </button>
            <div>
              <div className="cre-ws-stage">{WORKSPACE_DECK_UI.eyebrow}</div>
              <div className="cre-wsf-decktitle">{deck.title}</div>
            </div>
            <span className="cre-wsf-deckpos">
              {deck.i + 1} of {WORKSPACE_DECK.length}
            </span>
          </div>

          <div className="cre-ws-fc" aria-live="polite">
            <div className="cre-ws-fcterm">{card.term}</div>
            <div className="cre-ws-fcq">{WORKSPACE_DECK_UI.question}</div>
            <div className="cre-ws-fcconf" role="group" aria-label={`Confidence for ${card.term}`}>
              {WORKSPACE_DECK_UI.confidence.map((c) => (
                <button
                  key={c.value}
                  aria-pressed={deck.conf[deck.i] === c.value}
                  onClick={() => setDeck((d) => ({ ...d, conf: { ...d.conf, [d.i]: c.value } }))}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {deck.flipped ? (
              <div className="cre-ws-fcback">
                <div className="cre-ws-fcdef">{card.def}</div>
                <div className="cre-ws-fcex">{card.ex}</div>
                <button className="cre-ws-act ghost" onClick={() => say(WORKSPACE_DECK_UI.practise)}>
                  {WORKSPACE_DECK_UI.practise}
                </button>
              </div>
            ) : (
              <button className="cre-ws-act cre-ws-flip" onClick={() => setDeck((d) => ({ ...d, flipped: true }))}>
                {WORKSPACE_DECK_UI.flip}
              </button>
            )}
          </div>

          <div className="cre-wsf-decknav">
            <button
              className="cre-wsf-iconbtn"
              aria-label="Previous card"
              disabled={deck.i === 0}
              onClick={() => setDeck((d) => ({ ...d, i: d.i - 1, flipped: false }))}
            >
              ‹
            </button>
            <button
              className="cre-wsf-iconbtn"
              aria-label="Next card"
              disabled={deck.i >= WORKSPACE_DECK.length - 1}
              onClick={() => setDeck((d) => ({ ...d, i: d.i + 1, flipped: false }))}
            >
              ›
            </button>
          </div>
        </section>
      </div>
    )
  }

  /**
   * A SESSION — the Notebook with Rubi, and what "+ New workspace" opens.
   *
   * ⚠ A MODE, NOT A DIALOG, and it is the thing two earlier passes missed
   * entirely because nothing renders until the button is pressed. Her centre
   * becomes a scoped conversation: what Rubi makes of what you have marked,
   * three questions worth asking, and a composer. The marks are the input;
   * this is what you do with them.
   */
  const SessionPane = () => {
    const open = COMPASS_WORKSPACE_SESSIONS.find((x) => x.id === state.session)
    /* The mark a scoped session is about — the first pinned one, which is
       what her "Ask Rubi about these" carries in. */
    const scopedTo = asked ? markById(pinned[0] ?? null) : undefined
    /* Her emphasis is data, not markup — the phrases she wants the eye to
       catch — so it is applied here rather than baked into the string. */
    const emphasise = (text: string, bold: string[]): ReactNode[] => {
      let parts: ReactNode[] = [text]
      for (const b of bold) {
        const next: ReactNode[] = []
        for (const part of parts) {
          if (typeof part !== 'string' || !part.includes(b)) {
            next.push(part)
            continue
          }
          part.split(b).forEach((chunk, i) => {
            if (i > 0) next.push(<b key={`${b}-${next.length}`}>{b}</b>)
            next.push(chunk)
          })
        }
        parts = next
      }
      return parts
    }
    return (
      <div className="cre-ws-col cre-wsf-cm">
        <section className="cre-ws-pane cre-wsnb-pane" aria-label="Notebook with Rubi">
          {/* ⚠ A SESSION SCOPED TO ONE MARK GROWS A CONTEXT HEADER — hers,
              "Talking about · Note" over the passage. Pressing a suggested
              question is what creates it, and it is the thing that keeps a
              conversation about a mark from drifting into the whole course. */}
          {scopedTo ? (
            <div className="cre-ws-about">
              <div className="cre-ws-stage">
                {WORKSPACE_TALKING_ABOUT} · {kindLabel(scopedTo.type)}
              </div>
              <p className="cre-ws-quote">{scopedTo.text}</p>
            </div>
          ) : (
            <h2 className="cre-wsnb-note">{open ? open.ch : 'Whole course'}</h2>
          )}
          {open
            ? open.msgs.map((m, i) => (
                <div key={i}>
                  <p className="cre-wsf-q">{m.q}</p>
                  <div className="cre-ws-rb">
                    <span className="cre-ws-rmk" aria-hidden />
                    <div className="tx">
                      <span className="cre-ws-sr">Rubi: </span>
                      {m.a}
                    </div>
                  </div>
                </div>
              ))
            : WORKSPACE_SESSION_OPENERS.map((r) => (
                <div className="cre-ws-rb" key={r.id}>
                  <span className="cre-ws-rmk" aria-hidden />
                  <div className="tx">
                    <span className="cre-ws-sr">Rubi: </span>
                    {emphasise(r.text, r.bold)}
                  </div>
                </div>
              ))}

          {asked && (
            <div className="cre-ws-asked">
              <p className="cre-wsf-q">{asked}</p>
              <div className="cre-ws-rb">
                <span className="cre-ws-rmk" aria-hidden />
                <div className="tx">
                  <span className="cre-ws-sr">Rubi: </span>
                  The fork between term and permanent, and what cash value does, come up most. Expect a trap
                  about whether the beneficiary receives the cash value as well as the death benefit — they do
                  not.
                </div>
              </div>
            </div>
          )}

          <div className="cre-ws-sugg">
            {WORKSPACE_SUGGESTED.map((q) => (
              <button key={q} onClick={() => setAsked(q)}>
                {q}
              </button>
            ))}
          </div>

          {/* Her composer. The caption under it is the scope promise — Rubi
              answers from THIS course and THESE marks, not the internet. */}
          <div className="cre-wsnb-comp">
            <button
              className="cre-ws-plus"
              aria-label={WORKSPACE_UPLOAD.label}
              title={WORKSPACE_UPLOAD.label}
              onClick={() => say(WORKSPACE_UPLOAD.toast)}
            >
              +
            </button>
            <input
              type="text"
              placeholder={WORKSPACE_COMPOSER.placeholder}
              aria-label={WORKSPACE_COMPOSER.placeholder}
            />
            <span className="cre-ws-scope">{WORKSPACE_COMPOSER.scope}</span>
            <button className="cre-ws-send" aria-label="Ask" onClick={() => say('Asking Rubi')}>
              ↑
            </button>
          </div>
          <p className="cre-ws-caption">{WORKSPACE_COMPOSER.caption}</p>
        </section>
      </div>
    )
  }

  /** The centre of the Notebook: one mark and its Rubi thread, or the pile. */
  const CoachPane = () => (
    <div className="cre-ws-col cre-wsf-cm">
      <section className="cre-ws-pane cre-wsf-mid" aria-label="Coach">
        {focused ? (
          <>
            <div className="cre-wsf-crumb">
              <button onClick={() => patch({ focus: null, view: 'home' })}>← Back to my marks</button>
            </div>
            <p className="cre-ws-quote big">{focused.text}</p>
            {focused.note && <p className="cre-ws-note">{focused.note}</p>}
            <RubiThread mark={focused} />
          </>
        ) : (
          <>
            <div className="cre-ws-gh">
              <h3>{state.scope === 'all' ? 'Whole course' : state.scope}</h3>
              <span>
                {list.length} {list.length === 1 ? 'mark' : 'marks'}
              </span>
            </div>
            {list.length ? (
              list.map((m) => <MarkCard key={m.id} mark={m} showChapter />)
            ) : (
              <div className="cre-ws-empty">Nothing here yet.</div>
            )}
          </>
        )}
      </section>
    </div>
  )

  /**
   * A mark's Rubi exchange, in whichever shape the Rubi control picks.
   *
   * Her five: `M` chat and card together (her default), `A` folded into the
   * mark as a note, `B` the conversation alone, `C` a standalone answer card,
   * `D` the same with Rubi's face on it. The content is identical in all five
   * — the axis is about how an answer ARRIVES, not what it says.
   */
  const RubiThread = ({ mark }: { mark: WorkspaceMark }) => {
    if (!mark.thread?.length) {
      return <div className="cre-ws-empty">Nothing asked about this one yet.</div>
    }
    return (
      <div className={`cre-wsf-rubi shape-${rubiShape.toLowerCase()}`}>
        {mark.thread.map((t, i) => (
          <div className="cre-wsf-turn" key={i}>
            {rubiShape !== 'C' && <p className="cre-wsf-q">{t.q}</p>}
            <div className="cre-wsf-a">
              {rubiShape === 'D' && (
                <span className="cre-wsf-avatar" aria-hidden>
                  R
                </span>
              )}
              <p>{t.a}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  /**
   * THE STUDIO — her right rail, and it is not a button list.
   *
   * ⚠ REBUILT ON THE SECOND PASS from her live build. The first port read her
   * source and produced "Make something" with four buttons under it. What she
   * actually renders is a Studio: a readiness block (what the exam is doing to
   * you), SIX make actions of which two are Coming soon, and the artefacts you
   * have already made. The order is the argument — where you stand, what you
   * could make, what you made.
   */
  const StudioRail = () => (
    <div className="cre-ws-col cre-wsf-cr">
      <section className="cre-ws-pane cre-wsf-right" aria-label="Studio">
        <div className="cre-wsnb-head">
          <h4>Studio</h4>
          <span />
          <button
            className="cre-wsf-coll"
            aria-expanded={!state.colR}
            aria-label={state.colR ? 'Show Studio' : 'Hide Studio'}
            onClick={() => patch({ colR: !state.colR })}
          >
            ▤
          </button>
        </div>

        <div className="cre-ws-readiness">
          <div className="cre-ws-stage">Readiness</div>
          <div className="cre-ws-rline">
            <b>{WORKSPACE_READINESS.examIn}</b>
          </div>
          <div className="cre-ws-rline">
            <span>{WORKSPACE_READINESS.progressLabel}</span>
            <b>{WORKSPACE_READINESS.progress}</b>
          </div>
          <p className="cre-ws-rfocus">{WORKSPACE_READINESS.focus}</p>
          <button className="cre-ws-act" onClick={() => say(WORKSPACE_READINESS.cta)}>
            {WORKSPACE_READINESS.cta}
          </button>
        </div>

        <div className="cre-ws-group">
          <div className="cre-ws-stage">Make from all marks</div>
          <div className="cre-ws-make">
            {WORKSPACE_MAKE.map((m) => (
              <button
                key={m.id}
                disabled={m.soon}
                onClick={() => (m.soon ? undefined : make(m.id))}
              >
                {m.label}
                {m.soon && <em className="cre-ws-soon">Coming soon</em>}
                <small>{m.note}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="cre-ws-group">
          <div className="cre-ws-stage">Created by me</div>
          {assets.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
          {WORKSPACE_CREATED.map((c) => (
            <div className="cre-ws-asset" key={c.id}>
              <b>{c.title}</b>
              <span className="from">
                {c.from}
                {c.also && ` · also in ${c.also}`}
              </span>
              {c.body && <p className="cre-ws-abody">{c.body}</p>}
              {c.cta && (
                <div className="cre-ws-acts">
                  <button
                    onClick={() =>
                      /^Study/.test(c.cta!)
                        ? setDeck({ open: true, title: c.title, i: 0, flipped: false, conf: {} })
                        : say(c.cta!)
                    }
                  >
                    {c.cta}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </section>
    </div>
  )

  /* ── the home views ────────────────────────────────────────────────────── */

  /** Her `homeHead()` — the title, the lede and New workspace. ⚠ IT BELONGS TO
   *  THE HOME VIEWS, not to the page: her file renders it inside `homeView()`,
   *  so a learner reading a mark does not get the surface explained to them
   *  again above it. Porting it as a page header put the lede on every screen
   *  and twice on Pick up. */
  const HomeHead = () => (
    <div className="cre-ws-head">
      <div className="cre-ws-head-t">
        <div className="cre-ws-title">Workspace</div>
        <div className="cre-ws-lede">
          Everything you marked in your course, and what you can make from it. Only you can see this.
        </div>
      </div>
      <button
        className="cre-ws-act ghost cre-ws-new"
        onClick={() => patch({ session: NEW_SESSION, view: 'work', focus: null })}
      >
        <span aria-hidden>+</span> New workspace
      </button>
    </div>
  )

  const HomeView = () => {
    if (home === 'B') {
      return (
        <div className="cre-ws-home shelf">
          <HomeHead />
          <div className="cre-ws-stage">Everything you have made</div>
          {assets.length ? (
            assets.map((a) => <AssetCard key={a.id} asset={a} />)
          ) : (
            <div className="cre-ws-empty">Nothing made yet. Pin a few marks and make something.</div>
          )}
          <div className="cre-ws-stage">Your marks</div>
          <div className="cre-ws-shelfgrid">
            {all.map((m) => (
              <MiniMark key={m.id} mark={m} />
            ))}
          </div>
        </div>
      )
    }
    if (home === 'C') {
      return (
        <div className="cre-ws-home chapters">
          <HomeHead />
          {chapters.map((ch) => {
            const marks = all.filter((m) => m.ch === ch)
            return (
              <div key={ch} className="cre-ws-group">
                <div className="cre-ws-gh">
                  <h3>{ch}</h3>
                  <span>{marks.length}</span>
                </div>
                {marks.map((m) => (
                  <MiniMark key={m.id} mark={m} />
                ))}
              </div>
            )
          })}
        </div>
      )
    }
    if (home === 'D') {
      const today = all.slice(0, 4)
      return (
        <div className="cre-ws-home today">
          <HomeHead />
          <div className="cre-ws-hero">
            <div>
              <div className="cre-ws-stage">Today</div>
              <div className="big">{today.length} to look at again</div>
              <p>
                What you marked most recently, and the one Rubi thinks you keep coming back to. Five minutes,
                from your own notes rather than the whole chapter.
              </p>
            </div>
            <div className="sp" />
            <button className="cre-ws-act" onClick={() => say('Starting today’s review')}>
              Start
            </button>
          </div>
          {today.map((m) => (
            <MarkCard key={m.id} mark={m} showChapter />
          ))}
        </div>
      )
    }
    if (home === 'E') {
      return (
        <div className="cre-ws-home map">
          <HomeHead />
          <div className="cre-ws-stage">Your course, and where you left marks</div>
          <div className="cre-ws-map">
            {chapters.map((ch) => {
              const marks = all.filter((m) => m.ch === ch)
              return (
                <div key={ch} className="cre-ws-mapch">
                  <div className="cre-ws-mapname">{ch}</div>
                  <div className="cre-ws-maprow">
                    {marks.map((m) => (
                      <span
                        key={m.id}
                        className="cre-ws-mapdot"
                        style={{ background: WORKSPACE_TYPE_COLOR[m.type] }}
                        title={m.text}
                      />
                    ))}
                  </div>
                  <span className="cre-ws-mapn">{marks.length}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    /* 'A' — Pick up, her default, REBUILT on the second pass from her live
       build. The first port had the shape right and the detail wrong: the
       button said "Carry on" where hers says Continue, the hero printed the
       raw Rubi answer where hers prefixes it "Rubi, last time:", the meta
       dropped what the session MADE, the Rubi strip was missing outright and
       the earlier sessions were a list where hers are cards. All of it below
       is read off her DOM. */
    const [last, ...rest] = COMPASS_WORKSPACE_SESSIONS
    if (!all.length) {
      return (
        <div className="cre-ws-home pickup">
          <HomeHead />
          <div className="cre-ws-empty">
            Nothing marked yet. Bookmark, note or flag something in your course and it lands here.
          </div>
        </div>
      )
    }
    return (
      <div className="cre-ws-home pickup">
        <HomeHead />
        <div className="cre-ws-stage">Pick up where you left off</div>
        <section className="cre-ws-hero" aria-labelledby="hLast">
          <div className="cre-ws-herot">
            <div className="cre-ws-kicker">
              {last.ch} · {last.when}
            </div>
            <h2 id="hLast" className="big">
              {last.title}
            </h2>
            {/* Hers names the speaker before the answer — the hero is a
                conversation you are rejoining, not a card you are reading. */}
            <p>
              <span className="cre-ws-said">Rubi, last time:</span>{' '}
              {last.msgs[last.msgs.length - 1]?.a}
            </p>
            <div className="cre-ws-meta">
              {last.sel.length} {last.sel.length === 1 ? 'mark' : 'marks'} pinned
              {last.made && ` · made ${last.made.toLowerCase()}`}
            </div>
          </div>
          <button className="cre-ws-act cre-ws-continue" onClick={() => patch({ session: last.id, view: 'work' })}>
            Continue
          </button>
        </section>

        {/* HER RUBI STRIP — the surface proposing its own next move. Dismissible,
            because a suggestion you cannot decline is an instruction. */}
        {!nudgeGone && (
          <div className="cre-ws-nudge" role="note">
            <span className="cre-ws-nudgek">{WORKSPACE_NUDGE.eyebrow}</span>
            <span className="cre-ws-nudget">{WORKSPACE_NUDGE.text}</span>
            <button className="cre-ws-nudgea" onClick={() => say(WORKSPACE_NUDGE.cta)}>
              {WORKSPACE_NUDGE.cta}
            </button>
            <button className="cre-ws-nudgex" aria-label="Dismiss" onClick={() => setNudgeGone(true)}>
              ×
            </button>
          </div>
        )}

        {rest.length > 0 && (
          <div className="cre-ws-group">
            <div className="cre-ws-gh">
              <h3>My sessions</h3>
              <span className="cre-ws-count">{rest.length}</span>
            </div>
            {/* ⚠ THE SESSIONS AXIS LIVES HERE, not in the Studio. Her rail is
                Readiness · Make from all marks · Created by me — no session
                list — and "My sessions" is part of the home. The first port
                put a list in the rail, which both duplicated these cards and
                gave the axis the wrong home. */}
            <div className={`cre-ws-sessgrid view-${sessionView}`}>
              {rest.map((sn) => (
                <div className="cre-ws-sesscard" key={sn.id}>
                  <button className="cre-ws-sessopen" onClick={() => patch({ session: sn.id, view: 'work' })}>
                    <span className="cre-ws-kicker">{sn.ch}</span>
                    <b>{sn.title}</b>
                    <span className="when">
                      {sn.when} · {sn.sel.length} {sn.sel.length === 1 ? 'mark' : 'marks'}
                    </span>
                    {sn.made && (
                      /* ⚠ AN ICON, NOT A TAG. Hers draws what the session made
                         as a glyph with the name in `title` and a screen-reader
                         span — the card is about the conversation, and what it
                         produced is a footnote you can see at a glance. The
                         first port used a text pill, which gave it the weight
                         of a heading. */
                      <span className="cre-ws-made" title={sn.made}>
                        <MadeIcon made={sn.made} />
                        <span className="cre-ws-sr">{sn.made}</span>
                      </span>
                    )}
                  </button>
                  <button
                    className={`cre-ws-star${starred[sn.id] ?? sn.pinned ? ' on' : ''}`}
                    aria-pressed={starred[sn.id] ?? sn.pinned}
                    aria-label={`${starred[sn.id] ?? sn.pinned ? 'Unstar' : 'Star'} ${sn.title}`}
                    onClick={() => setStarred((st) => ({ ...st, [sn.id]: !(st[sn.id] ?? sn.pinned) }))}
                  >
                    {(starred[sn.id] ?? sn.pinned) ? <StarSolid size={15} /> : <Star size={15} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ── the six layouts ───────────────────────────────────────────────────── */

  const onHome = state.view === 'home' && !markById(state.focus)
  const shellClass = (() => {
    // Her home is one column whatever the layout's working shape is.
    if (onHome && layout === 'F') return 'cre-ws-shell f is-home'
    if (layout === 'F') return 'cre-ws-shell f'
    if (layout === 'E') return 'cre-ws-shell note'
    if (layout === 'A') return 'cre-ws-shell three'
    if (layout === 'C') return 'cre-ws-shell idx'
    return 'cre-ws-shell one'
  })()

  const body: ReactNode = (() => {
    /* A — Three pane. An index of every mark by chapter, the pile in the
       middle, Generate on the right. Her sketch, twenty lines. */
    if (layout === 'A') {
      const show = pinned.length ? all.filter((m) => pinned.includes(m.id)) : list
      return (
        <>
          <div className="cre-ws-col">
            <div className="cre-ws-pane cre-ws-idx">
              <h4>Capture</h4>
              {chapters.map((ch) => (
                <div key={ch}>
                  <div className="cre-ws-minih">{ch}</div>
                  {all
                    .filter((m) => m.ch === ch)
                    .map((m) => (
                      <MiniMark key={m.id} mark={m} />
                    ))}
                </div>
              ))}
            </div>
          </div>
          <div className="cre-ws-col">
            <FilterBar />
            {show.length ? (
              show.map((m) => <MarkCard key={m.id} mark={m} showChapter />)
            ) : (
              <div className="cre-ws-empty">Nothing here yet.</div>
            )}
          </div>
          <div className="cre-ws-col">
            <div className="cre-ws-pane cre-ws-sticky">
              <h4>Generate</h4>
              <MakeBlock />
              {assets.map((a) => (
                <AssetCard key={a.id} asset={a} />
              ))}
            </div>
          </div>
        </>
      )
    }

    /* B — Review first. The workspace opens on what is ready to review, and
       capture comes second. Her sketch. */
    if (layout === 'B') {
      const due = all.slice(0, 5).length
      return (
        <div className="cre-ws-col">
          <div className="cre-ws-hero">
            <div>
              <div className="cre-ws-stage">Remember</div>
              <div className="big">{due} ready to review</div>
              <p>
                From what you marked this week. Five minutes, pulled from your own notes and bookmarks rather
                than the whole chapter.
              </p>
            </div>
            <div className="sp" />
            <button className="cre-ws-act" onClick={() => say('Starting your review')}>
              Start review
            </button>
            <button className="cre-ws-act ghost" onClick={() => say('Scheduled for tomorrow')}>
              Later
            </button>
          </div>
          {assets.length > 0 && (
            <div className="cre-ws-group">
              <div className="cre-ws-stage">Generate</div>
              {assets.map((a) => (
                <AssetCard key={a.id} asset={a} />
              ))}
            </div>
          )}
          <div className="cre-ws-group">
            <div className="cre-ws-stage">Capture</div>
            <FilterBar />
            {chapters.map((ch) => (
              <div key={ch}>
                <div className="cre-ws-minih">{ch}</div>
                {all
                  .filter((m) => m.ch === ch)
                  .map((m) => (
                    <MiniMark key={m.id} mark={m} />
                  ))}
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* C — Index. A left index by chapter AND by type, one group at a time in
       the middle. Her sketch. */
    if (layout === 'C') {
      const group = state.scope === 'all' ? chapters[0] : state.scope
      const shown = state.filter === 'all' ? all.filter((m) => m.ch === group) : list
      return (
        <>
          <div className="cre-ws-col">
            <div className="cre-ws-pane cre-ws-idx">
              <div className="cre-ws-idxh">Organize</div>
              {chapters.map((ch) => (
                <button
                  key={ch}
                  className={group === ch ? 'on' : ''}
                  onClick={() => patch({ scope: ch, filter: 'all' })}
                >
                  {ch}
                  <em>{all.filter((m) => m.ch === ch).length}</em>
                </button>
              ))}
              <div className="cre-ws-idxh">By type</div>
              {(['bookmark', 'note', 'rubi', 'flag', 'object'] as const).map((t) => {
                const n = all.filter((m) => m.type === t).length
                if (!n) return null
                return (
                  <button key={t} onClick={() => patch({ filter: t })}>
                    {kindLabel(t)}
                    <em>{n}</em>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="cre-ws-col">
            <FilterBar />
            <div className="cre-ws-gh">
              <h3>{state.filter === 'all' ? group : kindLabel(state.filter as WorkspaceMark['type'])}</h3>
              <span>{shown.length}</span>
            </div>
            {shown.map((m) => (
              <MarkCard key={m.id} mark={m} showChapter />
            ))}
          </div>
        </>
      )
    }

    /* D — Stage board. Capture, Generate and Coach as three boards side by
       side, each showing its most recent few. Her sketch. */
    if (layout === 'D') {
      return (
        <div className="cre-ws-col">
          <div className="cre-ws-board">
            <div className="cre-ws-pane wide">
              <h4>Capture</h4>
              <FilterBar />
              {all.slice(0, 3).map((m) => (
                <MarkCard key={m.id} mark={m} showChapter />
              ))}
              <div className="cre-ws-acts">
                <button onClick={() => patch({ filter: 'all', scope: 'all' })}>
                  See everything you saved →
                </button>
              </div>
            </div>
            <div className="cre-ws-pane">
              <h4>Generate</h4>
              <MakeBlock />
              {assets.map((a) => (
                <AssetCard key={a.id} asset={a} />
              ))}
            </div>
            <div className="cre-ws-pane">
              <h4>Coach</h4>
              <div className="cre-ws-asset">
                <b>Two of these say the same thing</b>
                <span className="from">Rubi noticed across your saves</span>
                <div className="cre-ws-acts">
                  <button onClick={() => say('Showing you both')}>Show me →</button>
                </div>
              </div>
              <div className="cre-ws-asset">
                <b>You flagged one you have not come back to</b>
                <span className="from">Rubi noticed across your saves</span>
                <div className="cre-ws-acts">
                  <button onClick={() => say('Opening the flagged mark')}>Open it →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    /* E — Course notebook. The chapter spine on the left, the chapter's marks
       as a written page in the middle. Her second-most-developed. */
    if (layout === 'E') {
      const group = state.scope === 'all' ? chapters[0] : state.scope
      const shown = all.filter((m) => m.ch === group)
      return (
        <>
          <div className="cre-ws-col">
            <div className="cre-ws-pane cre-ws-idx">
              <div className="cre-ws-idxh">Your course</div>
              {chapters.map((ch) => (
                <button key={ch} className={group === ch ? 'on' : ''} onClick={() => patch({ scope: ch })}>
                  {ch}
                  <em>{all.filter((m) => m.ch === ch).length}</em>
                </button>
              ))}
            </div>
          </div>
          <div className="cre-ws-col">
            <section className="cre-ws-pane cre-wsnb-scroll" aria-label={group}>
              <div className="cre-ws-gh">
                <h3>{group}</h3>
                <span>
                  {shown.length} {shown.length === 1 ? 'mark' : 'marks'}
                </span>
              </div>
              {shown.map((m) => (
                <div key={m.id} className="cre-ws-rc">
                  <div className="cre-ws-kind">
                    {m.type === 'rubi' ? <span className="rb">Rubi answer</span> : kindLabel(m.type)}
                    <span className="dot" />
                    {m.where}
                  </div>
                  <p className="cre-ws-quote">{m.text}</p>
                  {m.note && <p className="cre-ws-note">{m.note}</p>}
                  {m.thread?.map((t, i) => (
                    <div className="cre-wsf-turn" key={i}>
                      <p className="cre-wsf-q">{t.q}</p>
                      <p className="cre-wsf-a">{t.a}</p>
                    </div>
                  ))}
                </div>
              ))}
              {!shown.length && <div className="cre-ws-empty">No marks in this chapter yet.</div>}
            </section>
          </div>
          <div className="cre-ws-col">
            <div className="cre-ws-pane cre-ws-sticky">
              <h4>Make something</h4>
              <MakeBlock />
            </div>
          </div>
        </>
      )
    }

    /* F — Notebook, her default and the fullest of the six: capture on the
       left, coach in the middle, make on the right, and the home views in
       place of the centre until a mark is chosen. */
    /* A session takes the centre. Her "+ New workspace" and every Continue
       land here; the marks rail and the Studio stay, because a session is
       about what you marked. */
    if (deck.open) {
      return (
        <>
          {!state.colL && <CaptureRail />}
          <DeckPane />
          {!state.colR && <StudioRail />}
        </>
      )
    }
    if (state.session) {
      return (
        <>
          {!state.colL && <CaptureRail />}
          <SessionPane />
          {!state.colR && <StudioRail />}
        </>
      )
    }
    if (state.view === 'home' && !focused) {
      /* ⚠ THE HOME HIDES BOTH SIDE PANES, and that is hers — measured on her
         build, where `f-cl` and `f-cr` are `display:none` on the home and the
         shell collapses to one column. It is a real decision, not a layout
         accident: arriving at the workspace you are offered the thread you
         left and the sessions you kept, not a filter rail and a Studio you
         have not asked for yet. Both come back the moment a mark is open.
         The first port drew all three at once. */
      return (
        <div className="cre-ws-col cre-wsf-cm cre-ws-homecol">
          <HomeView />
        </div>
      )
    }
    return (
      <>
        {!state.colL && <CaptureRail />}
        <CoachPane />
        {!state.colR && <StudioRail />}
      </>
    )
  })()

  return (
    <div className={`cre-ws device-${deviceView}`} data-layout={layout} data-home={home}>
      <div className="cre-wsf-bar">
        <div className="cre-wsf-bar-t">
          <h1 className="cre-wsf-title">
            <button
              className="cre-wsf-homebtn"
              title="Workspace home"
              onClick={() => patch({ view: 'home', focus: null, session: null })}
            >
              Workspace
            </button>
          </h1>
          {/* Her `fBarSess` — the bar becomes a breadcrumb once a session is
              open, and the session can be renamed and starred from it. */}
          {state.session && (
            <span className="cre-wsf-barsess">
              <span className="cre-wsf-sep" aria-hidden>
                ·
              </span>
              <span className="cre-wsf-sess">{openSessionName}</span>
              <button className="cre-wsf-mini" aria-label="Rename this session" title="Rename" onClick={() => say('Rename')}>
                ✎
              </button>
              <button className="cre-wsf-mini" aria-label="Star this session" title="Star" onClick={() => say('Starred')}>
                ☆
              </button>
            </span>
          )}
        </div>
        <div className="cre-wsf-bar-a">
          <button className="cre-wsf-iconbtn" aria-label="Close workspace" title="Close workspace" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className={shellClass} id="wsShell">
        {body}
      </div>

      <div className="cre-ws-toast" role="status" aria-live="polite" data-show={toast ? 'on' : 'off'}>
        {toast}
      </div>
    </div>
  )
}

