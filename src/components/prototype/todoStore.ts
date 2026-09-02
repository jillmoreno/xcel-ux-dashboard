/**
 * To Do — the store.
 *
 * Non-component module on purpose: `TodoPanel.tsx` exports a component and this
 * file exports hooks and helpers, and a module that exports both breaks fast
 * refresh (same reason `giftRecipientsUtil.ts` and `demoControlsUtil.ts` sit
 * beside their components rather than inside them).
 *
 * Persistence is `localStorage`, per browser. That is the honest limit of a
 * client-only page: it cannot write into the repo, so this list is private to
 * whichever browser you type it in and a cleared cache loses it. `toMarkdown`
 * is the mitigation — one click to get the list somewhere durable.
 *
 * The write path fires a `cgp.todo` window event so the nav count in
 * `UxDashboardPage` re-reads without the page having to own the state. A plain
 * `storage` event would not do it: that only fires for OTHER tabs.
 */

import { useCallback, useEffect, useState } from 'react'

export const TODO_STORAGE_KEY = 'cgp.todo'
const TODO_EVENT = 'cgp.todo'

/** The in-flight sections of the nav, reused as stages so a to-do reads as a
 *  project in waiting rather than a stray note. Demo and Research are not
 *  stages of new work, and Done is the `done` flag rather than a stage — an
 *  item can sit in Development without being finished, so the two have to be
 *  separate or they contradict each other. */
export const TODO_STAGES = [
  { id: 'design', label: 'Design', hue: 'teal' },
  { id: 'exploration', label: 'Exploration', hue: 'blue' },
  { id: 'sandbox', label: 'Sandbox', hue: 'gold' },
  { id: 'development', label: 'Development', hue: 'neutral' },
] as const

export type TodoStage = (typeof TODO_STAGES)[number]['id'] | ''

export type TodoItem = {
  id: string
  text: string
  stage: TodoStage
  done: boolean
}

export function stageLabel(stage: TodoStage): string {
  return TODO_STAGES.find((s) => s.id === stage)?.label ?? ''
}

export function stageHue(stage: TodoStage): string {
  return TODO_STAGES.find((s) => s.id === stage)?.hue ?? 'neutral'
}

/* ── read / write ─────────────────────────────────────────────────────────── */

function isItem(v: unknown): v is TodoItem {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.text === 'string'
}

export function readTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(TODO_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Normalise rather than trust: a hand-edited or older value should degrade
    // to a usable list instead of throwing the whole page.
    return parsed.filter(isItem).map((it) => ({
      id: it.id,
      text: it.text,
      stage: (TODO_STAGES.some((s) => s.id === it.stage) ? it.stage : '') as TodoStage,
      done: Boolean(it.done),
    }))
  } catch {
    return []
  }
}

export function writeTodos(items: TodoItem[]): void {
  try {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* private browsing, quota — the list still works for this session */
  }
  window.dispatchEvent(new Event(TODO_EVENT))
}

/* ── bulk paste ───────────────────────────────────────────────────────────── */

/** Strips the markers a pasted list arrives with — `-`, `*`, `•`, `1.`, `1)`,
 *  `[ ]`, `[x]`, and leading `#` — so pasting from a doc, a ticket or another
 *  checklist does not leave punctuation in every row. */
const MARKER = /^\s*(?:[-*•·–—]|\d+[.)]|\[\s*[xX]?\s*\]|#{1,6})\s*/

export function parseBulk(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(MARKER, '').trim())
    .filter((line) => line.length > 0)
}

export function makeItem(text: string, stage: TodoStage = ''): TodoItem {
  return {
    id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    text,
    stage,
    done: false,
  }
}

/* ── export ───────────────────────────────────────────────────────────────── */

export function toMarkdown(items: TodoItem[]): string {
  if (!items.length) return '# To do\n\n_Nothing on the list._\n'
  const line = (it: TodoItem) =>
    `- [${it.done ? 'x' : ' '}] ${it.text}${it.stage ? ` _(${stageLabel(it.stage)})_` : ''}`
  const open = items.filter((it) => !it.done)
  const done = items.filter((it) => it.done)
  let out = `# To do\n\n_${open.length} open · exported ${new Date().toISOString().slice(0, 10)}_\n\n`
  out += open.map(line).join('\n') || '_Nothing open._'
  if (done.length) out += `\n\n## Done\n\n${done.map(line).join('\n')}`
  return `${out}\n`
}

/* ── hooks ────────────────────────────────────────────────────────────────── */

/** Subscribes to same-tab writes (the custom event) AND other-tab writes (the
 *  native `storage` event), so two windows on the dashboard stay in step. */
function useTodoSubscription(onChange: () => void): void {
  useEffect(() => {
    const handle = () => onChange()
    const handleStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === TODO_STORAGE_KEY) onChange()
    }
    window.addEventListener(TODO_EVENT, handle)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(TODO_EVENT, handle)
      window.removeEventListener('storage', handleStorage)
    }
  }, [onChange])
}

export function useTodos() {
  const [items, setItems] = useState<TodoItem[]>(() => readTodos())
  const refresh = useCallback(() => setItems(readTodos()), [])
  useTodoSubscription(refresh)

  const commit = useCallback((next: TodoItem[]) => {
    setItems(next)
    writeTodos(next)
  }, [])

  return { items, commit }
}

/** Just the number, for the nav badge — so the page does not have to own the
 *  list to display its count. */
export function useTodoOpenCount(): number {
  const [count, setCount] = useState(() => readTodos().filter((it) => !it.done).length)
  const refresh = useCallback(() => setCount(readTodos().filter((it) => !it.done).length), [])
  useTodoSubscription(refresh)
  return count
}
