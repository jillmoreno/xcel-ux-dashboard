import { useMemo, useState, type ReactNode } from 'react'

import {
  COMPASS_WORKSPACE_SESSIONS,
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

/** What the four Make buttons produce. Her labels and her sub-lines. */
const MAKE_ACTIONS = [
  { id: 'flashcards', label: 'Make flashcards', kind: 'Practice' },
  { id: 'practice', label: 'Build a practice set', kind: 'Questions' },
  { id: 'summary', label: 'Write a summary', kind: 'One page' },
  { id: 'podcast', label: 'Make an audio recap', kind: '3 minutes' },
] as const

/** A generated artefact — what a Make button leaves behind. Empty until
 *  something is made, exactly as `WS.assets` starts empty. */
type WorkspaceAsset = { id: string; kind: string; title: string; from: number }

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

  const all = useMemo(() => savedMarks(layout, story), [layout, story])
  const list = useMemo(() => scopedMarks(all, state), [all, state])
  const chapters = useMemo(() => markChapters(all), [all])
  const pinned = pinnedIds(state)
  const focused = markById(state.focus)

  const patch = (next: Partial<WorkspaceState>) => setState((s) => ({ ...s, ...next }))
  const togglePin = (id: string) => setState((s) => ({ ...s, sel: { ...s.sel, [id]: !s.sel[id] } }))
  const clearPins = () => patch({ sel: {} })
  const say = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(''), 2000)
  }
  const make = (kind: string, label: string) => {
    if (!pinned.length) return
    setAssets((a) => [{ id: `a${a.length + 1}`, kind, title: label, from: pinned.length }, ...a])
    say(`${label} — from ${pinned.length} ${pinned.length === 1 ? 'mark' : 'marks'}`)
  }

  /* ── shared pieces ─────────────────────────────────────────────────────── */

  /** The type dot in front of a mark. Her `ico()` — a filled round in the
   *  type's own colour, which is what makes a list of mixed marks scannable
   *  without reading any of them. */
  const Dot = ({ type }: { type: WorkspaceMark['type'] }) => (
    <i className="cre-ws-ico" style={{ background: WORKSPACE_TYPE_COLOR[type] }} aria-hidden />
  )

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
        {MAKE_ACTIONS.map((a) => (
          <button key={a.id} className="cre-ws-act ghost" onClick={() => make(a.id, a.label)}>
            {a.id === 'flashcards'
              ? 'Flashcards'
              : a.id === 'practice'
                ? 'Practice set'
                : a.id === 'summary'
                  ? 'Summary'
                  : 'Audio recap'}
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
          <p className="cre-ws-quote">{mark.text}</p>
          {mark.note && <p className="cre-ws-note">{mark.note}</p>}
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
        {MAKE_ACTIONS.map((a) => (
          <button key={a.id} disabled={!n} onClick={() => make(a.id, a.label)}>
            {a.label}
            <small>
              {a.kind}
              {sfx}
            </small>
          </button>
        ))}
      </div>
    )
  }

  const AssetCard = ({ asset }: { asset: WorkspaceAsset }) => (
    <div className="cre-ws-asset">
      <b>{asset.title}</b>
      <span className="from">
        From {asset.from} {asset.from === 1 ? 'mark' : 'marks'}
      </span>
      <div className="cre-ws-acts">
        <button onClick={() => say(`Opening ${asset.title.toLowerCase()}`)}>Open →</button>
      </div>
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

  /** The right rail: what you can make, and what you already made. */
  const MakeRail = () => (
    <div className="cre-ws-col cre-wsf-cr">
      <section className="cre-ws-pane cre-wsf-right" aria-label="Make">
        <div className="cre-wsnb-head">
          <h4>Make something</h4>
          <span />
          <button
            className="cre-wsf-coll"
            aria-expanded={!state.colR}
            aria-label={state.colR ? 'Show make' : 'Hide make'}
            onClick={() => patch({ colR: !state.colR })}
          >
            ▤
          </button>
        </div>
        <MakeBlock />
        {assets.length > 0 && (
          <div className="cre-ws-group">
            <div className="cre-ws-stage">Made</div>
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        )}
        <SessionList />
      </section>
    </div>
  )

  /** Her saved Rubi conversations, in whichever of her three arrangements. */
  const SessionList = () => (
    <div className={`cre-wsf-sessions view-${sessionView}`}>
      <div className="cre-ws-stage">Saved conversations</div>
      {COMPASS_WORKSPACE_SESSIONS.map((s) => (
        <button
          key={s.id}
          className={`cre-wsf-sess${state.session === s.id ? ' on' : ''}${s.pinned ? ' pin' : ''}`}
          onClick={() => patch({ session: state.session === s.id ? null : s.id })}
        >
          <b>{s.title}</b>
          {sessionView !== 'list' && <span className="when">{s.when}</span>}
          <span className="marks">
            {s.sel.length} {s.sel.length === 1 ? 'mark' : 'marks'} pinned
          </span>
          {state.session === s.id && (
            <span className="cre-wsf-sessbody">
              {s.msgs.map((m, i) => (
                <span key={i} className="cre-wsf-turn">
                  <span className="cre-wsf-q">{m.q}</span>
                  <span className="cre-wsf-a">{m.a}</span>
                </span>
              ))}
            </span>
          )}
        </button>
      ))}
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
      <button className="cre-ws-act ghost cre-ws-new" onClick={() => say('New workspace')}>
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
    /* 'A' — Pick up, her default. ⚠ IT IS BUILT ROUND THE LAST SESSION, not
       round recent marks: her `homeA2()` opens on the conversation you were
       last having ("Pick up where you left off"), with the rest listed under
       it. A port that showed the three newest marks instead would be a
       different screen wearing her name — the whole argument of this home is
       that a workspace remembers a THREAD, not a pile. */
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
        <section className="cre-ws-hero" aria-labelledby="hLast">
          <div>
            <h2 id="hLast" className="cre-ws-stage">
              Pick up where you left off
            </h2>
            <div className="cre-ws-kicker">
              {last.ch} · {last.when}
            </div>
            <div className="big">{last.title}</div>
            <p>{last.msgs[0]?.a}</p>
            <div className="cre-ws-meta">
              {last.sel.length} {last.sel.length === 1 ? 'mark' : 'marks'} pinned
            </div>
          </div>
          <div className="sp" />
          <button className="cre-ws-act" onClick={() => patch({ session: last.id })}>
            Carry on
          </button>
        </section>
        {rest.length > 0 && (
          <div className="cre-ws-group">
            <div className="cre-ws-stage">Earlier</div>
            {rest.map((sn) => (
              <button
                key={sn.id}
                className="cre-wsf-sess"
                onClick={() => patch({ session: sn.id })}
              >
                <b>{sn.title}</b>
                <span className="when">
                  {sn.ch} · {sn.when}
                </span>
                <span className="marks">
                  {sn.sel.length} {sn.sel.length === 1 ? 'mark' : 'marks'} pinned
                </span>
              </button>
            ))}
          </div>
        )}
        <MakeBlock />
      </div>
    )
  }

  /* ── the six layouts ───────────────────────────────────────────────────── */

  const shellClass = (() => {
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
    if (state.view === 'home' && !focused) {
      return (
        <>
          {!state.colL && <CaptureRail />}
          <div className="cre-ws-col cre-wsf-cm">
            <HomeView />
          </div>
          {!state.colR && <MakeRail />}
        </>
      )
    }
    return (
      <>
        {!state.colL && <CaptureRail />}
        <CoachPane />
        {!state.colR && <MakeRail />}
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

