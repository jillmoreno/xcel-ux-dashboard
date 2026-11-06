/**
 * THE COMPASS WORKSPACE'S STATE AND SELECTORS — the browser-free half of
 * `CompassWorkspace.tsx` (2026-11-04).
 *
 * Ported from the `WS` object and its helpers in
 * `public/prototypes/xcel-compass-workspace-v4.html`. A module of types and
 * pure functions with no component in it, so fast refresh keeps working — the
 * same split `compassPlanStore.ts` sits on beside `CompassStudyPlanner.tsx`.
 *
 * ── HER SIX AXES, AND THE ONE THING THIS PORT CHANGES ───────────────────────
 *
 * The prototype carries six demo controls over this surface: the LAYOUT (six),
 * the HOME view (five), the STORY fill level (five), the SESSIONS arrangement
 * (three), the RUBI reply shape (five) and the device VIEW (three). All six
 * are ported, and every option in them is hers.
 *
 * ⚠ THREE OF THE SIX ARE SWITCHED OFF IN HER FILE, and this port turns them
 * back on. `xcel-compass-workspace-v4.html` builds the Workspace, Home and
 * Story control groups on the demo bar (lines 1071–1096) and then removes all
 * three on a `setTimeout(…, 0)` scheduled a few lines earlier (line 1047), so
 * what actually loads carries only Sessions, Rubi replies and View. The code
 * behind the other three is complete and reachable — only the choosers are
 * gone, which reads as a surface she had parked rather than one she had
 * settled.
 *
 * Jillienne's instruction on 2026-11-04 was to port her work "as she sent
 * them with the demo tools in place so that the different variations can be
 * shown in stage", and a hidden layout chooser makes the layouts unshowable —
 * the purpose clause decides it. So all six are controls here. If Anjani
 * removed them because she HAD settled on Notebook + Pick up, the fix is to
 * drop the two flags, not to re-hide them: her defaults are already the
 * committed ones, so Stage opens exactly where her file opens.
 */

import {
  COMPASS_WORKSPACE_MARKS,
  WORKSPACE_GROUP_ORDER,
  WORKSPACE_KIND,
  type WorkspaceMark,
  type WorkspaceMarkType,
} from '@/data/compassWorkspaceFixtures'

/* ── the six axes ─────────────────────────────────────────────────────────── */

/**
 * THE LAYOUTS, keyed as she keys them. The letters are not an ordering — `F`
 * is her default and reads first in the control, exactly as it does on her
 * bar, because the list was built by adding arrangements to the end rather
 * than by ranking them.
 *
 * ⚠ FOUR OF THE SIX ARE SKETCHES IN THE SOURCE, and they are ported as
 * sketches. `layoutF` is 113 lines and `layoutE` 89; `A`, `B`, `C` and `D` are
 * about twenty lines each — arrangements of the same three panes rather than
 * designs in their own right. Filling them in would have made them mine, so
 * they stay as thin as she drew them and the flag description says which four
 * they are.
 */
export const WORKSPACE_LAYOUTS = [
  { value: 'F', label: 'Notebook', note: 'Her default — the fullest of the six' },
  { value: 'A', label: 'Three pane', note: 'Sketch' },
  { value: 'B', label: 'Review first', note: 'Sketch' },
  { value: 'C', label: 'Index', note: 'Sketch' },
  { value: 'D', label: 'Stage board', note: 'Sketch' },
  { value: 'E', label: 'Course notebook', note: 'Second most developed' },
] as const

export type WorkspaceLayout = (typeof WORKSPACE_LAYOUTS)[number]['value']

/** The home views — what the workspace opens on before a mark is chosen. */
export const WORKSPACE_HOMES = [
  { value: 'A', label: 'Pick up', note: 'Her default — carry on where you stopped' },
  { value: 'B', label: 'Shelf', note: 'Everything you have made, as objects' },
  { value: 'C', label: 'By chapter', note: 'Grouped the way the course is' },
  { value: 'D', label: 'Today', note: 'What this session is for' },
  { value: 'E', label: 'Map', note: 'The course as a shape, marks on it' },
] as const

export type WorkspaceHome = (typeof WORKSPACE_HOMES)[number]['value']

/**
 * THE STORY — how full the workspace is, which is the axis that decides
 * whether a reviewer is looking at an empty state or a mid-journey one.
 *
 * Her `saved()` reads it: 1 keeps nothing, 2 keeps `i2` alone, 3 and 4 keep
 * the first four marks, 5 keeps all eleven. ⚠ IT ONLY BITES ON THE NOTEBOOK
 * LAYOUT — `saved()` pins the level to 5 for every other layout, which is
 * hers and deliberate: the sketches have no empty states to show.
 */
export const WORKSPACE_STORIES = [
  { value: '5', label: 'Mid-journey', note: 'Her default — all eleven marks' },
  { value: '1', label: 'Empty', note: 'Nothing marked yet' },
  { value: '2', label: 'First mark', note: 'One note' },
  { value: '3', label: 'A few marks', note: 'Four' },
  { value: '4', label: 'Made something', note: 'Four, plus a deck' },
] as const

export type WorkspaceStory = (typeof WORKSPACE_STORIES)[number]['value']

/** How the saved Rubi sessions are arranged. */
export const WORKSPACE_SESSION_VIEWS = [
  { value: 'list', label: 'List', note: 'Her default' },
  { value: 'time', label: 'By time', note: 'Newest first, stamped' },
  { value: 'cards', label: 'Cards', note: 'One tile each' },
] as const

export type WorkspaceSessionView = (typeof WORKSPACE_SESSION_VIEWS)[number]['value']

/** What a Rubi reply looks like when it lands. */
export const WORKSPACE_RUBI_SHAPES = [
  { value: 'M', label: 'Chat + Card', note: 'Her default' },
  { value: 'A', label: 'Note', note: 'Folded into the mark' },
  { value: 'B', label: 'Chat', note: 'Conversation only' },
  { value: 'C', label: 'Card', note: 'A standalone answer card' },
  { value: 'D', label: 'Avatar', note: 'Rubi speaks, with a face' },
] as const

export type WorkspaceRubiShape = (typeof WORKSPACE_RUBI_SHAPES)[number]['value']

/** The device frame. Hers, and kept as a control rather than folded into the
 *  responsive preview: she uses it to argue the workspace is a phone surface
 *  as much as a desktop one, and that argument is easier to see side by side
 *  than by resizing a window. */
export const WORKSPACE_DEVICE_VIEWS = [
  { value: 'web', label: 'Web', note: 'Her default' },
  { value: 'ios', label: 'iPhone', note: '' },
  { value: 'android', label: 'Android', note: '' },
] as const

export type WorkspaceDeviceView = (typeof WORKSPACE_DEVICE_VIEWS)[number]['value']

/* ── the state ────────────────────────────────────────────────────────────── */

export type WorkspaceState = {
  /** 'home' until a mark is focused, then 'work'. Her `WS.view`. */
  view: 'home' | 'work'
  /** "Where in my learning" — `all`, or a chapter name. */
  scope: string
  /** The type chip: `all`, or one mark type. */
  filter: string
  /** The search box over `text` + `note`. */
  q: string
  /** Which marks are pinned, by id. */
  sel: Readonly<Record<string, boolean>>
  /** The mark open in the centre pane, if any. */
  focus: string | null
  /** Which groups are open in the left rail; absent means open. */
  openGroup: Readonly<Record<string, boolean>>
  /** The saved session being read, if any. */
  session: string | null
  /** Left / right pane collapse. */
  colL: boolean
  colR: boolean
}

export const EMPTY_WORKSPACE_STATE: WorkspaceState = {
  view: 'home',
  scope: 'all',
  filter: 'all',
  q: '',
  sel: {},
  focus: null,
  openGroup: {},
  session: null,
  colL: false,
  colR: false,
}

/* ── her selectors, ported ────────────────────────────────────────────────── */

/**
 * The marks the current STORY level has produced — her `saved()`.
 *
 * ⚠ THE LEVEL ONLY APPLIES TO THE NOTEBOOK LAYOUT. Hers reads
 * `WS.layout==='F' ? (WS.stage||5) : 5`, so every other layout always sees all
 * eleven marks. Kept exactly: the sketches were never drawn against a partial
 * workspace, and showing them one would be inventing an empty state for them.
 */
export function savedMarks(layout: WorkspaceLayout, story: WorkspaceStory): readonly WorkspaceMark[] {
  const level = layout === 'F' ? Number(story) || 5 : 5
  if (level >= 5) return COMPASS_WORKSPACE_MARKS
  // Her exact keep-lists: nothing, one note, then the first four.
  const keep = level === 1 ? [] : level === 2 ? ['i2'] : ['i1', 'i2', 'i3', 'i4']
  return COMPASS_WORKSPACE_MARKS.filter((m) => keep.includes(m.id))
}

/**
 * A filter chip names a GROUP, not a raw type.
 *
 * ⚠ THE DIFFERENCE IS SIX VERSUS ONE. Six mark types collapse into four
 * groups — `bookmark` and `object` both file under Flag — so her "Flags"
 * chip reads 6 while there is exactly ONE mark whose type is literally
 * `flag`. The port compared `m.type === filter` and showed 1, which made the
 * chip disagree with the group heading directly beneath it.
 */
function inFilterGroup(mark: WorkspaceMark, filter: string): boolean {
  return WORKSPACE_KIND[mark.type] === WORKSPACE_KIND[filter as WorkspaceMarkType]
}

/** Scope → group → search, in her order. Search reads the passage AND the
 *  learner's own note, which is the whole reason it is useful. */
export function scopedMarks(all: readonly WorkspaceMark[], state: WorkspaceState): readonly WorkspaceMark[] {
  let base = state.scope === 'all' ? all : all.filter((m) => m.ch === state.scope)
  if (state.filter !== 'all') base = base.filter((m) => inFilterGroup(m, state.filter))
  if (state.q) {
    const q = state.q.toLowerCase()
    base = base.filter((m) => `${m.text} ${m.note ?? ''}`.toLowerCase().includes(q))
  }
  return base
}

/** The chapters present in the current story level, in first-seen order —
 *  her `chapters()`. Not sorted: the course's own order is the useful one. */
export function markChapters(all: readonly WorkspaceMark[]): string[] {
  const out: string[] = []
  for (const m of all) if (!out.includes(m.ch)) out.push(m.ch)
  return out
}

export function pinnedIds(state: WorkspaceState): string[] {
  return Object.keys(state.sel).filter((k) => state.sel[k])
}

export function markById(id: string | null): WorkspaceMark | undefined {
  return id ? COMPASS_WORKSPACE_MARKS.find((m) => m.id === id) : undefined
}

/**
 * The left rail's groups, in her order, built from the marks given.
 *
 * Six types collapse into four groups — see `WORKSPACE_KIND`. A group with no
 * marks is absent rather than empty, which is what lets the left rail say
 * "Nothing matches" as one message instead of four empty headings.
 */
export function groupMarks(marks: readonly WorkspaceMark[]): { key: string; marks: WorkspaceMark[] }[] {
  const groups: Record<string, WorkspaceMark[]> = {}
  for (const m of marks) {
    const k = WORKSPACE_KIND[m.type] ?? 'Flag'
    ;(groups[k] ??= []).push(m)
  }
  return WORKSPACE_GROUP_ORDER.filter((k) => groups[k]).map((k) => ({ key: k, marks: groups[k] }))
}

/** How many of a type the current scope holds — the number on a filter chip.
 *  Counts against the SCOPE, not the filter, so the chips do not all read 0
 *  the moment one of them is chosen. */
export function countOfType(all: readonly WorkspaceMark[], scope: string, type: string): number {
  const base = scope === 'all' ? all : all.filter((m) => m.ch === scope)
  // By GROUP, so a chip and the heading under it never disagree — see above.
  return type === 'all' ? base.length : base.filter((m) => inFilterGroup(m, type)).length
}

/** "Saved", "Note", "Flag", "Pointer" — or her Rubi treatment, which the
 *  component draws differently and so asks for by name. */
export function kindLabel(type: WorkspaceMarkType): string {
  return type === 'rubi' ? 'Rubi answer' : (WORKSPACE_KIND[type] ?? 'Saved')
}
