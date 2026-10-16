/**
 * To Do Board — the panel.
 *
 * Who is working on what, as four columns a card moves across. Built from the
 * approved concept (`todo-board-concept.html`), rebuilt here on the real
 * components, the real palette and a real store.
 *
 * ── This is a NEW pattern, and worth saying so ──────────────────────────────
 * The Dashboard has no board: no column, no draggable card, no drop target.
 * The house-style skill's `reference/gaps.md` names drag-and-drop as a known
 * gap and it still is one. So the column, the card and the drag are built
 * from the gateway's own semantic tokens in `todoBoardStyles.ts` rather than
 * borrowed from a component that does not exist. Everything AROUND them is
 * existing furniture: `Sheet` for both slide-overs, `ActionMenu` for the card
 * kebab, the `--ux-*` palette for every colour.
 *
 * ── Dragging is not the only way ────────────────────────────────────────────
 * A pointer-only board is a board half the team cannot use, so every move the
 * drag can make, the card's kebab can make too — the same split `TodoPanel`
 * made when it put arrows beside its drag handle. The grip is what is
 * draggable rather than the whole card, because a draggable card wrapping a
 * `<select>` turns every attempt to reassign an owner into a drag.
 *
 * ── Every write re-reads ────────────────────────────────────────────────────
 * No optimistic patching, for the reason the link boards give: the server owns
 * the id, the dates and the handoff rule, and more than one person writes to
 * this store. The cost is a visible beat between dropping a card and seeing it
 * land; the alternative is a second copy of the board that quietly disagrees
 * with the one everybody else is looking at.
 */
import { useCallback, useMemo, useState } from 'react'
import { Plus, Users } from '@/icons'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/ActionMenu'
import {
  AUTO_ASSIGN_OWNER,
  TODO_COLUMNS,
  TodoBoardWriteError,
  UNASSIGNED,
  UNASSIGNED_LABEL,
  autoAssigns,
  cardsInColumn,
  createCard,
  deleteCard,
  hueFor,
  matchesOwner,
  moveCard,
  ownerLabel,
  ownerOptions,
  positionForDrop,
  removePerson,
  saveCard,
  setCardOwner,
  toMarkdown,
  useTodoBoard,
  addPerson,
  type TodoCard,
  type TodoCardDraft,
  type TodoColumn,
  type TodoPerson,
} from '@/data/todoBoardStore'
import { TodoBoardAvatar } from './TodoBoardAvatar'
import { UX_TOKEN_BRIDGE } from './uxPaletteBridge'
import { CardSheet, ManagePeopleSheet } from './TodoBoardSheets'
import {
  addCardStyle,
  boardStyle,
  btnStyle,
  cardMetaStyle,
  cardNoteStyle,
  cardStyle,
  cardTitleStyle,
  cardTopStyle,
  cardsStyle,
  columnCountStyle,
  columnHeaderStyle,
  columnNoteStyle,
  columnStyle,
  columnTitleStyle,
  countStyle,
  emptyColumnStyle,
  filterAvatarStyle,
  filterRowStyle,
  gripStyle,
  kebabTriggerHover,
  kebabTriggerStyle,
  noticeStyle,
  ownerSelectHoverStyle,
  ownerSelectStyle,
  primaryBtnStyle,
  toolbarStyle,
} from './todoBoardStyles'

/** Which sheet is open, and what it was opened with. One piece of state
 *  rather than two booleans, so the two sheets cannot both be open. */
type OpenSheet = { kind: 'card'; column: TodoColumn; card?: TodoCard } | { kind: 'people' } | null

/** A drag in flight: the card being moved, and where it would land. The
 *  target is kept separately from the card because it changes on every
 *  `dragover` while the card does not. */
type DragState = { id: string; column: TodoColumn } | null
type DropTarget = { column: TodoColumn; beforeId: string | null } | null

export function TodoBoardPanel() {
  const { index, refresh } = useTodoBoard()
  const canAuthor = index.available

  /** `null` is All. `''` is the Unassigned filter, which is a real selection
   *  and not the absence of one — see `matchesOwner`. */
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null)
  const [sheet, setSheet] = useState<OpenSheet>(null)
  const [drag, setDrag] = useState<DragState>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  /** Every write goes through here: it reports what the server objected to
   *  rather than failing silently, and it re-reads the board afterwards
   *  whether the write succeeded or not — a failed move should put the card
   *  back where the store says it is, not where the drag left it. */
  const run = useCallback(
    async (write: () => Promise<unknown>) => {
      setErrors([])
      try {
        await write()
      } catch (err) {
        setErrors(err instanceof TodoBoardWriteError ? err.errors : ['Something went wrong saving that.'])
      }
      await refresh()
    },
    [refresh],
  )

  const endDrag = () => {
    setDrag(null)
    setDropTarget(null)
  }

  const drop = async (column: TodoColumn) => {
    const active = drag
    const target = dropTarget
    endDrag()
    if (!active) return
    const card = index.cards.find((c) => c.id === active.id)
    if (!card) return
    const beforeId = target && target.column === column ? target.beforeId : null
    const position = positionForDrop(index.cards, column, beforeId, card.id)
    // A drop that changes nothing still writes, and deliberately: `updatedAt`
    // is what "last saved" means here, and a no-op that silently skipped the
    // request would be the one move that does not show up as one.
    await run(() => moveCard(card, column, position))
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(index.cards))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the board is unchanged, nothing to recover */
    }
  }

  /** The filter row: All, then the roster, then Unassigned. Unassigned goes
   *  last because it is the absence of the thing the row is about, and it is
   *  shown even at zero — a missing control reads as a bug, and the count it
   *  would show is the answer to "is anything unowned?". */
  const filters = useMemo(
    () => [
      { key: null as string | null, name: 'All', hue: 'neutral' as const },
      ...index.people.map((p) => ({ key: p.name as string | null, name: p.name, hue: p.hue })),
      { key: UNASSIGNED as string | null, name: UNASSIGNED_LABEL, hue: 'neutral' as const },
    ],
    [index.people],
  )

  const visible = useMemo(() => index.cards.filter((c) => matchesOwner(c, ownerFilter)), [index.cards, ownerFilter])

  return (
    /* The bridge, on the panel root: everything the board draws itself is on
       `--ux-*` already, but `ActionMenu` is a shared product component styled
       on the BRAND tokens, and its menu rendered as a white card with navy
       text inside whichever palette the page is wearing. Six mappings fix it
       without forking the component. */
    <div style={UX_TOKEN_BRIDGE}>
      <div style={toolbarStyle}>
        <button type="button" onClick={() => setSheet({ kind: 'people' })} disabled={!canAuthor} style={btnStyle}>
          <Users size={13} aria-hidden />
          Manage people
        </button>
        <button
          type="button"
          onClick={() => setSheet({ kind: 'card', column: 'todo' })}
          disabled={!canAuthor}
          style={primaryBtnStyle}
        >
          <Plus size={12} aria-hidden />
          New card
        </button>
        {/* The same mitigation every board here carries: Netlify Blobs is not
            backed up, so one click gets the list somewhere durable. */}
        <button type="button" onClick={() => void copy()} style={btnStyle}>
          {copied ? 'Copied' : 'Copy as markdown'}
        </button>
        <span style={countStyle}>
          {index.cards.length} {index.cards.length === 1 ? 'card' : 'cards'}
        </span>
      </div>

      {!index.loading && !canAuthor && (
        <p style={noticeStyle}>
          The authoring endpoint is not reachable from here — run `netlify dev`, or open the deployed site.
        </p>
      )}

      {errors.length > 0 && (
        <p role="alert" style={noticeStyle}>
          {errors.join(' ')}
        </p>
      )}

      <div style={filterRowStyle} role="group" aria-label="Filter by owner">
        {filters.map((f) => {
          const active = ownerFilter === f.key
          return (
            <button
              key={f.key ?? 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => setOwnerFilter(active && f.key !== null ? null : f.key)}
              style={filterAvatarStyle(active)}
            >
              <TodoBoardAvatar name={f.name} hue={f.hue} size={22} />
              {f.name}
            </button>
          )
        })}
      </div>

      <div style={boardStyle}>
          {TODO_COLUMNS.map((col) => {
            const all = cardsInColumn(index.cards, col.id)
            const shown = cardsInColumn(visible, col.id)
            const isTarget = dropTarget?.column === col.id
            return (
              <section
                key={col.id}
                aria-label={col.label}
                onDragOver={(e) => {
                  if (!drag) return
                  e.preventDefault()
                  setDropTarget({ column: col.id, beforeId: null })
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  void drop(col.id)
                }}
                style={columnStyle(Boolean(drag) && isTarget)}
              >
                <header style={columnHeaderStyle}>
                  <h3 style={columnTitleStyle}>{col.label}</h3>
                  {/* The count is of the COLUMN, not of what the owner filter
                      leaves showing — the same rule the project sections'
                      status pills follow: it says how many are there, not how
                      many survived the pick you already made. */}
                  <span style={columnCountStyle}>{all.length}</span>
                </header>

                {autoAssigns(col.id) && <p style={columnNoteStyle}>Auto-assigns to {AUTO_ASSIGN_OWNER}</p>}

                <div style={cardsStyle}>
                  {shown.map((card) => (
                    <BoardCard
                      key={card.id}
                      card={card}
                      people={index.people}
                      canAuthor={canAuthor}
                      dragging={drag?.id === card.id}
                      dropBefore={Boolean(drag) && isTarget && dropTarget?.beforeId === card.id}
                      onDragStart={() => setDrag({ id: card.id, column: card.column })}
                      onDragEnd={endDrag}
                      onDragOverCard={() => {
                        if (drag) setDropTarget({ column: col.id, beforeId: card.id })
                      }}
                      onEdit={() => setSheet({ kind: 'card', column: card.column, card })}
                    onReassign={(owner) => void run(() => setCardOwner(card, owner))}
                      onMoveToColumn={(column) =>
                        void run(() => moveCard(card, column, positionForDrop(index.cards, column, null, card.id)))
                      }
                      onNudge={(direction) => {
                        const list = cardsInColumn(index.cards, card.column)
                        const at = list.findIndex((c) => c.id === card.id)
                        // Up: land before the card above. Down: land before the
                        // card two below — "before the one below" is where it
                        // already is.
                        const beforeId =
                          direction === 'up'
                            ? (list[at - 1]?.id ?? null)
                            : (list[at + 2]?.id ?? null)
                        if (direction === 'up' && at <= 0) return
                        if (direction === 'down' && at >= list.length - 1) return
                        void run(() =>
                          moveCard(card, card.column, positionForDrop(index.cards, card.column, beforeId, card.id)),
                        )
                      }}
                      canMoveUp={cardsInColumn(index.cards, card.column).findIndex((c) => c.id === card.id) > 0}
                      canMoveDown={
                        cardsInColumn(index.cards, card.column).findIndex((c) => c.id === card.id) <
                        cardsInColumn(index.cards, card.column).length - 1
                      }
                      onRemove={() => void run(() => deleteCard(card.id))}
                    />
                  ))}

                  {shown.length === 0 && (
                    <p style={emptyColumnStyle}>
                      {all.length === 0
                        ? 'Nothing here yet.'
                        : `Nothing here for ${ownerFilter === UNASSIGNED ? UNASSIGNED_LABEL : ownerFilter}.`}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSheet({ kind: 'card', column: col.id })}
                  disabled={!canAuthor}
                  style={addCardStyle}
                >
                  <Plus size={11} aria-hidden />
                  Add a card
                </button>
              </section>
            )
          })}
      </div>

      <CardSheet
        open={sheet?.kind === 'card'}
        card={sheet?.kind === 'card' ? sheet.card : undefined}
        people={index.people}
        defaultColumn={sheet?.kind === 'card' ? sheet.column : 'todo'}
        onClose={() => setSheet(null)}
        onSave={async (draft: TodoCardDraft) => {
          const editing = sheet?.kind === 'card' ? sheet.card : undefined
          await (editing ? saveCard(editing.id, draft) : createCard(draft))
          setSheet(null)
          await refresh()
        }}
      />

      <ManagePeopleSheet
        open={sheet?.kind === 'people'}
        people={index.people}
        cards={index.cards}
        onClose={() => setSheet(null)}
        onAdd={async (name: string) => {
          await addPerson(name)
          await refresh()
        }}
        onRemove={async (person: TodoPerson) => {
          await removePerson(person.id)
          // A filter pointing at somebody who is no longer on the roster would
          // show an empty board with no way to tell why, so it falls back to
          // All — the same call the concept made.
          setOwnerFilter((f) => (f === person.name ? null : f))
          await refresh()
        }}
      />
    </div>
  )
}

/* ── one card ─────────────────────────────────────────────────────────────── */

function BoardCard({
  card,
  people,
  canAuthor,
  dragging,
  dropBefore,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onEdit,
  onReassign,
  onMoveToColumn,
  onNudge,
  canMoveUp,
  canMoveDown,
  onRemove,
}: {
  card: TodoCard
  people: TodoPerson[]
  canAuthor: boolean
  dragging: boolean
  dropBefore: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOverCard: () => void
  onEdit: () => void
  onReassign: (owner: string) => void
  onMoveToColumn: (column: TodoColumn) => void
  onNudge: (direction: 'up' | 'down') => void
  canMoveUp: boolean
  canMoveDown: boolean
  onRemove: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const assigned = autoAssigns(card.column)

  /** The kebab is the keyboard's half of the drag — every move a pointer can
   *  make is here as a menu item — plus the two things a pointer cannot do at
   *  all: edit the card, and remove it. */
  const items: ActionMenuItem[] = [
    { id: 'edit', label: 'Edit card', onSelect: onEdit },
    ...TODO_COLUMNS.filter((c) => c.id !== card.column).map((c) => ({
      id: `move-${c.id}`,
      label: `Move to ${c.label}`,
      onSelect: () => onMoveToColumn(c.id),
    })),
    ...(canMoveUp ? [{ id: 'up', label: 'Move up', onSelect: () => onNudge('up') }] : []),
    ...(canMoveDown ? [{ id: 'down', label: 'Move down', onSelect: () => onNudge('down') }] : []),
    { id: 'remove', label: 'Remove card', danger: true, onSelect: onRemove },
  ]

  return (
    <article
      onDragOver={(e) => {
        // Stops at the card, so the column's own handler does not immediately
        // overwrite "before this card" with "at the end".
        e.stopPropagation()
        e.preventDefault()
        onDragOverCard()
      }}
      style={cardStyle(dragging, dropBefore)}
    >
      <div style={cardTopStyle}>
        <span
          draggable={canAuthor}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            // Firefox starts no drag without data on the transfer.
            e.dataTransfer.setData('text/plain', card.id)
            onDragStart()
          }}
          onDragEnd={onDragEnd}
          style={gripStyle}
          aria-hidden
          title="Drag to move"
        >
          ⠿
        </span>
        <h4 style={cardTitleStyle}>{card.title}</h4>
        {canAuthor && (
          <ActionMenu
            label={`Actions for “${card.title}”`}
            items={items}
            triggerStyle={kebabTriggerStyle}
            triggerHover={kebabTriggerHover}
          />
        )}
      </div>

      {card.note && <p style={cardNoteStyle}>{card.note}</p>}

      <div style={cardMetaStyle}>
        <TodoBoardAvatar name={ownerLabel(card.owner)} hue={hueFor(card.owner, people)} />
        {assigned ? (
          /* No picker in the handoff column: the server would overwrite
             whatever it chose, and a control that cannot change anything is
             worse than a label. */
          <span style={{ ...ownerSelectStyle, cursor: 'default', padding: '2px 4px' }}>{ownerLabel(card.owner)}</span>
        ) : (
          <select
            value={card.owner}
            disabled={!canAuthor}
            onChange={(e) => onReassign(e.target.value)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={`Owner of “${card.title}”`}
            style={{ ...ownerSelectStyle, ...(hovered ? ownerSelectHoverStyle : null) }}
          >
            {ownerOptions(people).map((o) => (
              <option key={o.value || 'unassigned'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </article>
  )
}
