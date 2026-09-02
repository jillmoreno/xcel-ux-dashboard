/**
 * To Do — the panel.
 *
 * A plain list, plus the three things asked for: bulk paste that splits on
 * newlines, a stage tag drawn from the nav's own in-flight sections, and drag
 * to reorder.
 *
 * Drag has a keyboard twin. Dragging is the natural way to rank a list and the
 * only way it can be done with a mouse, but it is unreachable without one, so
 * every row also carries move up / move down buttons. That is not belt and
 * braces — it is the difference between the feature existing for everyone and
 * existing for pointer users.
 *
 * Colours come from the page's own `--ux-*` palette rather than the brand
 * tokens, so the panel re-skins with the four schemes and four appearances like
 * the rest of the dashboard.
 */

import { useRef, useState, type CSSProperties, type DragEvent } from 'react'
import { ChevronDown, ChevronUp, ClipboardList, Plus, Trash } from '@/icons'
import {
  TODO_STAGES,
  makeItem,
  parseBulk,
  stageLabel,
  toMarkdown,
  useTodos,
  type TodoItem,
  type TodoStage,
} from './todoStore'

/* ── styles ───────────────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = { maxWidth: 820 }

const composerStyle: CSSProperties = {
  background: 'var(--ux-card)',
  border: '1px solid var(--ux-border)',
  borderRadius: 12,
  padding: 14,
  marginBottom: 18,
}

const taStyle: CSSProperties = {
  width: '100%',
  minHeight: 74,
  font: 'inherit',
  fontSize: 14,
  lineHeight: 1.6,
  padding: '9px 11px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-bg)',
  color: 'var(--ux-text)',
  resize: 'vertical',
}

const rowActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 10,
  flexWrap: 'wrap',
}

const btnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-2)',
  cursor: 'pointer',
}

const primaryBtnStyle: CSSProperties = {
  ...btnStyle,
  background: 'var(--ux-accent)',
  borderColor: 'var(--ux-accent)',
  color: 'var(--ux-on-accent)',
}

const hintStyle: CSSProperties = {
  fontSize: 12.5,
  color: 'var(--ux-text-3)',
  margin: '8px 0 0',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  border: '1px solid var(--ux-border)',
  borderRadius: 12,
  overflow: 'hidden',
  background: 'var(--ux-card)',
}

const itemStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0,1fr) auto auto',
  gap: 10,
  alignItems: 'center',
  padding: '10px 12px',
  borderBottom: '1px solid var(--ux-border)',
}

const gripStyle: CSSProperties = {
  cursor: 'grab',
  color: 'var(--ux-text-3)',
  fontSize: 15,
  lineHeight: 1,
  userSelect: 'none',
  padding: '2px 3px',
}

const textStyle: CSSProperties = {
  font: 'inherit',
  fontSize: 14.5,
  border: '1px solid transparent',
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--ux-text)',
  padding: '4px 6px',
  width: '100%',
}

const selectStyle: CSSProperties = {
  font: 'inherit',
  fontSize: 12,
  padding: '4px 7px',
  borderRadius: 7,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-2)',
}

const iconBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 24,
  borderRadius: 6,
  border: '1px solid transparent',
  background: 'transparent',
  color: 'var(--ux-text-3)',
  cursor: 'pointer',
  padding: 0,
}

const emptyStyle: CSSProperties = {
  border: '1px dashed var(--ux-border)',
  borderRadius: 12,
  padding: '30px 22px',
  textAlign: 'center',
  color: 'var(--ux-text-3)',
  fontSize: 13.5,
}

const groupCapStyle: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: 'var(--ux-text-3)',
  margin: '24px 0 7px',
}

function stagePill(stage: TodoStage): CSSProperties {
  const hue = TODO_STAGES.find((s) => s.id === stage)?.hue ?? 'neutral'
  return {
    fontSize: 10.5,
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: 5,
    whiteSpace: 'nowrap',
    background: `var(--ux-hue-${hue})`,
    color: `var(--ux-hue-${hue}-fg)`,
  }
}

/* ── panel ────────────────────────────────────────────────────────────────── */

export function TodoPanel() {
  const { items, commit } = useTodos()
  const [draft, setDraft] = useState('')
  const [stage, setStage] = useState<TodoStage>('')
  const [copied, setCopied] = useState(false)
  const dragFrom = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const parsed = parseBulk(draft)

  const add = () => {
    if (!parsed.length) return
    commit([...items, ...parsed.map((t) => makeItem(t, stage))])
    setDraft('')
  }

  const patch = (id: string, next: Partial<TodoItem>) =>
    commit(items.map((it) => (it.id === id ? { ...it, ...next } : it)))

  const remove = (id: string) => commit(items.filter((it) => it.id !== id))

  /** Reorder by absolute index in `items`. Both drag and the keyboard buttons
   *  funnel through this, so the two can never diverge. */
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return
    const next = items.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commit(next)
  }

  const onDrop = (e: DragEvent, to: number) => {
    e.preventDefault()
    const from = dragFrom.current
    dragFrom.current = null
    setDragOver(null)
    if (from !== null) move(from, to)
  }

  const copy = async () => {
    const md = toMarkdown(items)
    try {
      await navigator.clipboard.writeText(md)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the list is unchanged, nothing to recover */
    }
  }

  const open = items.filter((it) => !it.done)
  const done = items.filter((it) => it.done)

  const renderRow = (it: TodoItem) => {
    const i = items.indexOf(it)
    return (
      <li
        key={it.id}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(i)
        }}
        onDragLeave={() => setDragOver((d) => (d === i ? null : d))}
        onDrop={(e) => onDrop(e, i)}
        onDragEnd={() => {
          dragFrom.current = null
          setDragOver(null)
        }}
        style={{
          ...itemStyle,
          opacity: it.done ? 0.55 : 1,
          background: dragOver === i ? 'var(--ux-card-hover)' : 'transparent',
          boxShadow: dragOver === i ? 'inset 0 2px 0 0 var(--ux-accent)' : 'none',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {/* Drag starts HERE, not on the row: a draggable <li> wrapping a text
              input means every attempt to select text starts a row drag
              instead. The arrows beside each row are the keyboard equivalent. */}
          <span
            draggable
            onDragStart={(e) => {
              dragFrom.current = i
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragEnd={() => {
              dragFrom.current = null
              setDragOver(null)
            }}
            style={gripStyle}
            aria-hidden
            title="Drag to reorder"
          >
            ⠿
          </span>
          <input
            type="checkbox"
            checked={it.done}
            onChange={(e) => patch(it.id, { done: e.target.checked })}
            aria-label={`Mark "${it.text}" ${it.done ? 'not done' : 'done'}`}
          />
        </span>

        <input
          value={it.text}
          onChange={(e) => patch(it.id, { text: e.target.value })}
          aria-label="Item"
          style={{
            ...textStyle,
            textDecoration: it.done ? 'line-through' : 'none',
            color: it.done ? 'var(--ux-text-3)' : 'var(--ux-text)',
          }}
        />

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {it.stage && <span style={stagePill(it.stage)}>{stageLabel(it.stage)}</span>}
          <select
            value={it.stage}
            onChange={(e) => patch(it.id, { stage: e.target.value as TodoStage })}
            aria-label={`Stage for "${it.text}"`}
            style={selectStyle}
          >
            <option value="">No stage</option>
            {TODO_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </span>

        <span style={{ display: 'inline-flex', gap: 2 }}>
          <button
            type="button"
            onClick={() => move(i, i - 1)}
            disabled={i === 0}
            aria-label={`Move "${it.text}" up`}
            style={{ ...iconBtnStyle, opacity: i === 0 ? 0.35 : 1 }}
          >
            <ChevronUp size={13} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => move(i, i + 1)}
            disabled={i === items.length - 1}
            aria-label={`Move "${it.text}" down`}
            style={{ ...iconBtnStyle, opacity: i === items.length - 1 ? 0.35 : 1 }}
          >
            <ChevronDown size={13} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => remove(it.id)}
            aria-label={`Delete "${it.text}"`}
            style={iconBtnStyle}
          >
            <Trash size={13} aria-hidden />
          </button>
        </span>
      </li>
    )
  }

  return (
    <div style={wrapStyle}>
      <div style={composerStyle}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={'Paste or type your projects — one per line.\nBullets and numbering get stripped.'}
          aria-label="New items"
          style={taStyle}
        />
        <div style={rowActionsStyle}>
          <label style={{ fontSize: 12, color: 'var(--ux-text-3)' }}>
            Stage{' '}
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as TodoStage)}
              aria-label="Stage for new items"
              style={selectStyle}
            >
              <option value="">No stage</option>
              {TODO_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={add} disabled={!parsed.length} style={{
            ...primaryBtnStyle,
            opacity: parsed.length ? 1 : 0.45,
            cursor: parsed.length ? 'pointer' : 'default',
          }}>
            <Plus size={13} aria-hidden />
            {parsed.length > 1 ? `Add ${parsed.length} items` : 'Add item'}
          </button>
          <span style={{ marginLeft: 'auto' }} />
          <button type="button" onClick={copy} style={btnStyle}>
            <ClipboardList size={13} aria-hidden />
            {copied ? 'Copied' : 'Copy as markdown'}
          </button>
        </div>
        <p style={hintStyle}>
          Cmd/Ctrl + Enter adds. Saved in this browser only — copy the list out if it matters.
        </p>
      </div>

      {!items.length ? (
        <div style={emptyStyle}>
          Nothing on the list. Paste a block of projects above — each line becomes its own item.
        </div>
      ) : (
        <>
          <ul style={listStyle}>
            {open.length ? (
              open.map(renderRow)
            ) : (
              <li style={{ ...itemStyle, gridTemplateColumns: '1fr', color: 'var(--ux-text-3)' }}>
                Everything is done.
              </li>
            )}
          </ul>
          {done.length > 0 && (
            <>
              <p style={groupCapStyle}>
                Done · {done.length}
              </p>
              <ul style={listStyle}>{done.map(renderRow)}</ul>
            </>
          )}
        </>
      )}
    </div>
  )
}
