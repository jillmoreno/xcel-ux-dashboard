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
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Users } from '@/icons'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/ActionMenu'
import {
  AUTO_ASSIGN_OWNER,
  TODO_COLUMNS,
  TodoBoardWriteError,
  UNASSIGNED,
  UNASSIGNED_HUE,
  UNASSIGNED_LABEL,
  autoAssigns,
  cardsInColumn,
  createCard,
  deleteCard,
  hueFor,
  matchesOwner,
  moveCard,
  ownerLabel,
  positionForDrop,
  removePerson,
  saveCard,
  setPersonHue,
  useTodoBoard,
  addPerson,
  type TodoCard,
  type TodoCardDraft,
  type TodoCardPrefill,
  type TodoColumn,
  type TodoPerson,
} from '@/data/todoBoardStore'
import { TodoBoardAvatar } from './TodoBoardAvatar'
import { UX_TOKEN_BRIDGE } from './uxPaletteBridge'
import { CardSheet, ManagePeopleSheet } from './TodoBoardSheets'
import { linkifyNote } from './linkifyNote'
import {
  addCardStyle,
  boardStyle,
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
  filterActionsStyle,
  filterAvatarStyle,
  filterGroupStyle,
  filterRowStyle,
  gripStyle,
  iconBtnStyle,
  kebabTriggerHover,
  kebabTriggerStyle,
  noticeStyle,
  ownerLabelStyle,
  primaryBtnStyle,
} from './todoBoardStyles'

/** Which sheet is open, and what it was opened with. One piece of state
 *  rather than two booleans, so the two sheets cannot both be open. `seed` is
 *  only ever set by the prefill — a button opens an empty form. */
type OpenSheet =
  | { kind: 'card'; column: TodoColumn; card?: TodoCard; seed?: TodoCardPrefill }
  | { kind: 'people' }
  | null

/** A drag in flight: the card being moved, and where it would land. The
 *  target is kept separately from the card because it changes on every
 *  `dragover` while the card does not. */
type DragState = { id: string; column: TodoColumn } | null
type DropTarget = { column: TodoColumn; beforeId: string | null } | null

export function TodoBoardPanel({
  prefill,
  onPrefillConsumed,
}: {
  /**
   * A card to open the New card sheet WITH, once, as soon as the board can
   * author. This is the second half of `promote-to-refinement`: the skill
   * adds the Refinement row and then files the card that says somebody has to
   * look at it. See `TodoCardPrefill` for why the skill cannot just POST it.
   *
   * Ignored while the endpoint has not answered — `canAuthor` is false for
   * the wrong reason before that, and a prefill opened against a board that
   * cannot save is a form that throws the designer's edits away.
   */
  prefill?: TodoCardPrefill | null
  /** Called once the prefill has been consumed, so the page can take the
   *  params off the address and a reload does not reopen the sheet. */
  onPrefillConsumed?: () => void
} = {}) {
  const { index, refresh } = useTodoBoard()
  const canAuthor = index.available

  /** `null` is All. `''` is the Unassigned filter, which is a real selection
   *  and not the absence of one — see `matchesOwner`. */
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null)
  const [sheet, setSheet] = useState<OpenSheet>(null)
  const [drag, setDrag] = useState<DragState>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget>(null)
  const [errors, setErrors] = useState<string[]>([])

  /**
   * The prefill, the way `LinkBoardPanel` takes its one: wait until the
   * endpoint has answered, fire once, and tell the page so the params come
   * off the address. Stripping them here would leave the router believing
   * they were still there and the next section change would write them back —
   * the page owns that state, which is why it owns the stripping too.
   */
  const [prefillConsumed, setPrefillConsumed] = useState(false)
  useEffect(() => {
    if (prefillConsumed || !prefill || !canAuthor) return
    // Seeding a form from an external fact that only arrives after the first
    // render — the `LinkBoardPanel` precedent, and the same exemption.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPrefillConsumed(true)
    setSheet({ kind: 'card', column: prefill.column ?? 'todo', seed: prefill })
    /* eslint-enable react-hooks/set-state-in-effect */
    onPrefillConsumed?.()
  }, [prefillConsumed, prefill, canAuthor, onPrefillConsumed])

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

  /* "Copy as markdown" stood on a toolbar above this row until 2026-10-15,
     when Jillienne took the toolbar off. `toMarkdown` in `todoBoardStore.ts`
     is UNWIRED, NOT GONE — it is still exported and still tested, so putting
     the control back is a button, not a feature. It was the board's way out
     of a store nothing backs up; nothing replaces it, and that is a real
     trade rather than an oversight. */

  /** The filter row: All, then the roster, then Unassigned. Unassigned goes
   *  last because it is the absence of the thing the row is about, and it is
   *  shown even at zero — a missing control reads as a bug, and the count it
   *  would show is the answer to "is anything unowned?". */
  const filters = useMemo(
    () => [
      { key: null as string | null, name: 'All', hue: UNASSIGNED_HUE },
      ...index.people.map((p) => ({ key: p.name as string | null, name: p.name, hue: p.hue })),
      { key: UNASSIGNED as string | null, name: UNASSIGNED_LABEL, hue: UNASSIGNED_HUE },
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

      {/* One row: who you are looking at, then what you can add. The group
          label covers the avatars only — the actions are not filters, so they
          sit outside the `role="group"` rather than inside it announcing
          themselves as one. */}
      <div style={filterRowStyle}>
        <div style={filterGroupStyle} role="group" aria-label="Filter by owner">
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

        <div style={filterActionsStyle}>
          <span style={countStyle}>
            {index.cards.length} {index.cards.length === 1 ? 'card' : 'cards'}
          </span>
          <button
            type="button"
            onClick={() => setSheet({ kind: 'people' })}
            disabled={!canAuthor}
            aria-label="Manage people"
            title="Manage people"
            style={iconBtnStyle}
          >
            <Users size={14} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setSheet({ kind: 'card', column: 'todo' })}
            disabled={!canAuthor}
            aria-label="New card"
            style={primaryBtnStyle}
          >
            <Plus size={12} aria-hidden />
            New
          </button>
        </div>
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

                {/* ADD IS ON "TO DO" ONLY (2026-10-15, Jillienne). It stood at
                    the foot of all four columns, from the concept — four
                    identical dashed buttons, three of them offering to start
                    work in a column that means "somebody is already doing
                    this", "this is ready for the team" or "this is ready to
                    hand off". New work starts in To Do; the sheet's Column
                    picker is still how a card is created anywhere else, which
                    is a decision rather than a shortcut. */}
                {col.id === 'todo' && (
                  <button
                    type="button"
                    onClick={() => setSheet({ kind: 'card', column: col.id })}
                    disabled={!canAuthor}
                    style={addCardStyle}
                  >
                    <Plus size={11} aria-hidden />
                    Add a card
                  </button>
                )}
              </section>
            )
          })}
      </div>

      <CardSheet
        open={sheet?.kind === 'card'}
        card={sheet?.kind === 'card' ? sheet.card : undefined}
        seed={sheet?.kind === 'card' ? sheet.seed : undefined}
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
        onRecolour={async (person: TodoPerson, hue) => {
          await setPersonHue(person.id, hue)
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
  onRemove: () => void
}) {

  /**
   * Two items (2026-10-15, Jillienne: "just have ellipsis have edit card, and
   * remove card"). It carried "Move to …" for each other column plus Move up
   * / Move down, as the keyboard's half of the drag — four extra rows on a
   * menu that is opened to do one of two things.
   *
   * ⚠ MOVING BY KEYBOARD STILL WORKS, through Edit card's Column picker,
   * which is why this is a tidy-up rather than a loss. What is NOT reachable
   * without a pointer any more is REORDERING INSIDE a column — `position` has
   * no control of its own, so the drag is the only way to set it. If that
   * matters, the place to put it back is the edit sheet, not this menu.
   */
  const items: ActionMenuItem[] = [
    { id: 'edit', label: 'Edit card', onSelect: onEdit },
    { id: 'remove', label: 'Remove card', danger: true, onSelect: onRemove },
  ]

  return (
    <article
      className="cre-todo-card"
      /* The owner's colour, as a 3px top stroke — same source as the avatar
         beside it, so the two cannot disagree. */
      data-hue={hueFor(card.owner, people)}
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

      {/* URLs in the note are links (2026-10-16) — `/share-branch` puts the
          branch build's address here, and it was select-and-paste before.
          `linkifyNote` builds nodes and allowlists http/https; a note is
          text somebody typed, never markup. */}
      {card.note && <p style={cardNoteStyle}>{linkifyNote(card.note)}</p>}

      <div style={cardMetaStyle}>
        <TodoBoardAvatar name={ownerLabel(card.owner)} hue={hueFor(card.owner, people)} />
        {/* THE OWNER IS A LABEL, NOT A CONTROL (2026-10-15, Jillienne: "don't
            allow user to change the owner directly on the card, make them
            click edit"). It was a `<select>` dressed as text — the concept's
            idea, and quick, but a board where every card carries a live
            control is a board where a mis-click reassigns somebody's work
            with no step in between and nothing to undo it. Reassigning is
            Edit card now: deliberate, and the same place every other change
            to a card is made. */}
        <span style={ownerLabelStyle}>{ownerLabel(card.owner)}</span>
      </div>
    </article>
  )
}
