/**
 * The To Do Board's two sheets — New card, and Manage people.
 *
 * Both are right-anchored slide-overs at the shared 480px, following the
 * convention `AddCustomEventPanel` set: Close top-LEFT, title, divider,
 * scrolling body, footer band with the primary action on the LEFT. Creating a
 * card is a sheet rather than an inline composer for the same reason the link
 * boards put their form behind a CTA — four fields of chrome permanently above
 * the thing you came to read is the wrong default when adding is the
 * occasional act and reading is the constant one.
 *
 * ⚠ THE BRIDGE IS LOAD-BEARING. `Sheet` portals to `document.body`, OUTSIDE
 * the gateway shell that carries the `--ux-*` palette, so every style in here
 * would resolve to nothing without it. `UxDashboardPage` mirrors the palette
 * onto the document root (`mirrorPaletteToRoot`) and each sheet wraps its
 * content in `UX_TOKEN_BRIDGE`, which is also what re-points the brand tokens
 * `Sheet` itself draws with. Skip either and you get a light panel over a dark
 * gateway — exactly how the QA detail sheet once shipped.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import {
  AUTO_ASSIGN_OWNER,
  TODO_COLUMNS,
  TODO_HUES,
  UNASSIGNED,
  UNASSIGNED_LABEL,
  autoAssigns,
  columnLabel,
  draftProblems,
  ownerOptions,
  type TodoCard,
  type TodoCardDraft,
  type TodoColumn,
  type TodoHue,
  type TodoPerson,
} from '@/data/todoBoardStore'
import { TodoBoardAvatar } from './TodoBoardAvatar'
import { UX_TOKEN_BRIDGE } from './uxPaletteBridge'
import {
  addPersonRowStyle,
  btnStyle,
  errorStyle,
  fieldStyle,
  fieldWrapStyle,
  formNoteStyle,
  labelStyle,
  linkBtnStyle,
  peopleMetaStyle,
  peopleNameStyle,
  peopleRowStyle,
  primaryBtnStyle,
  sheetBodyStyle,
  sheetCloseStyle,
  sheetDescStyle,
  sheetDividerStyle,
  sheetFooterStyle,
  sheetHeaderStyle,
  sheetTitleStyle,
  swatchRowStyle,
  swatchStyle,
  textareaStyle,
} from './todoBoardStyles'

/** The chrome every sheet here shares. `Sheet` deliberately renders none of
 *  its own — it supplies the overlay, the panel, the scroll lock and the
 *  hidden title for `aria-labelledby`, and hands back `{children}` with no
 *  padding — so this is the one place the header shape is decided. */
function SheetChrome({
  title,
  description,
  onClose,
  children,
}: {
  title: string
  description: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div style={{ ...UX_TOKEN_BRIDGE, display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, background: 'var(--ux-card)' }}>
      <header style={sheetHeaderStyle}>
        <button type="button" onClick={onClose} style={sheetCloseStyle} aria-label={`Close ${title}`}>
          <X size={13} aria-hidden />
          Close
        </button>
        <h2 style={sheetTitleStyle}>{title}</h2>
        <p style={sheetDescStyle}>{description}</p>
      </header>
      <div aria-hidden style={sheetDividerStyle} />
      {children}
    </div>
  )
}

/* ── New card · Edit card ─────────────────────────────────────────────────── */

/**
 * One sheet, two jobs (2026-10-15, Jillienne: "we need to add the ability to
 * edit").
 *
 * A second component for editing would be the same four fields with a
 * different verb, and the two would drift the first time a field was added —
 * so `card` is what distinguishes them: absent is a new card, present is that
 * card. Only the title, the footer's verb and where the save goes differ.
 */
export function CardSheet({
  open,
  card,
  people,
  defaultColumn,
  onClose,
  onSave,
}: {
  open: boolean
  /** The card being edited, or undefined when this is a new one. */
  card?: TodoCard
  people: TodoPerson[]
  /** Whichever button opened it — the page-level CTA defaults to To Do, and a
   *  column's own "Add a card" defaults to that column. Ignored when editing:
   *  the card's own column is the answer then. */
  defaultColumn: TodoColumn
  onClose: () => void
  onSave: (draft: TodoCardDraft) => Promise<void>
}) {
  const editing = Boolean(card)
  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit card' : 'New card'} width={480}>
      <SheetChrome
        title={editing ? 'Edit card' : 'New card'}
        description={
          editing
            ? 'Change what it says, who owns it, or which column it sits in.'
            : 'Name it and add a quick note on what it’s about.'
        }
        onClose={onClose}
      >
        {/* Mounted only while open — `Sheet` returns null when closed — so the
            form starts from the card (or empty) every time without a reset
            effect, and `key` makes that true when one edit follows another. */}
        <CardBody
          key={card?.id ?? 'new'}
          card={card}
          people={people}
          defaultColumn={card?.column ?? defaultColumn}
          onClose={onClose}
          onSave={onSave}
        />
      </SheetChrome>
    </Sheet>
  )
}

function CardBody({
  card,
  people,
  defaultColumn,
  onClose,
  onSave,
}: {
  card?: TodoCard
  people: TodoPerson[]
  defaultColumn: TodoColumn
  onClose: () => void
  onSave: (draft: TodoCardDraft) => Promise<void>
}) {
  const [title, setTitle] = useState(card?.title ?? '')
  const [note, setNote] = useState(card?.note ?? '')
  const [column, setColumn] = useState<TodoColumn>(defaultColumn)
  const [owner, setOwner] = useState<string>(card?.owner ?? UNASSIGNED)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const titleRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  /* The handoff column owns its cards, so the Owner picker has nothing to ask
     and says so instead. The rule is enforced on the server either way — this
     is the explanation, not the mechanism. */
  const assigned = autoAssigns(column)

  const submit = async () => {
    const draft: TodoCardDraft = {
      title,
      note,
      owner: assigned ? AUTO_ASSIGN_OWNER : owner,
      column,
      // An edit keeps its place in the column; the server puts a new card at
      // the end. Moving a card is the board's job, not this form's — which is
      // why there is no position control here.
      ...(card ? { position: card.position } : {}),
    }
    const problems = draftProblems(draft)
    if (problems.length) {
      setErrors(problems)
      titleRef.current?.focus()
      return
    }
    setBusy(true)
    setErrors([])
    try {
      await onSave(draft)
    } catch (err) {
      setErrors(
        err instanceof Error && 'errors' in err
          ? (err as { errors: string[] }).errors
          : ['Could not save the card.'],
      )
      setBusy(false)
    }
  }

  return (
    <>
      <div style={sheetBodyStyle}>
        {errors.length > 0 && (
          <div role="alert" style={errorStyle}>
            {errors.join(' ')}
          </div>
        )}

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="todo-card-title">
            Card name
          </label>
          <input
            id="todo-card-title"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Compass — review-recap empty state"
            style={fieldStyle}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="todo-card-note">
            Quick note
          </label>
          <textarea
            id="todo-card-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What is this about?"
            style={textareaStyle}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="todo-card-column">
            Column
          </label>
          <select
            id="todo-card-column"
            value={column}
            onChange={(e) => setColumn(e.target.value as TodoColumn)}
            style={fieldStyle}
          >
            {TODO_COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {assigned ? (
          <p style={formNoteStyle}>
            Cards in “{columnLabel(column)}” are assigned to {AUTO_ASSIGN_OWNER}.
          </p>
        ) : (
          <div style={fieldWrapStyle}>
            <label style={labelStyle} htmlFor="todo-card-owner">
              Owner
            </label>
            <select
              id="todo-card-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              style={fieldStyle}
            >
              {ownerOptions(people).map((o) => (
                <option key={o.value || 'unassigned'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <footer style={sheetFooterStyle}>
        <button type="button" onClick={submit} disabled={busy} style={primaryBtnStyle}>
          {card ? null : <Plus size={12} aria-hidden />}
          {busy ? 'Saving…' : card ? 'Save changes' : 'Add card'}
        </button>
        <button type="button" onClick={onClose} disabled={busy} style={btnStyle}>
          Cancel
        </button>
      </footer>
    </>
  )
}

/* ── Manage people ────────────────────────────────────────────────────────── */

export function ManagePeopleSheet({
  open,
  people,
  cards,
  onClose,
  onAdd,
  onRemove,
  onRecolour,
}: {
  open: boolean
  people: TodoPerson[]
  /** Only to count what a removal would reassign — the sheet never writes a
   *  card itself; the cascade is the server's. */
  cards: TodoCard[]
  onClose: () => void
  onAdd: (name: string) => Promise<void>
  onRemove: (person: TodoPerson) => Promise<void>
  onRecolour: (person: TodoPerson, hue: TodoHue) => Promise<void>
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Manage people" width={480}>
      <SheetChrome
        title="Manage people"
        description={`Add or remove who can be assigned a card. Removing someone moves their cards to ${UNASSIGNED_LABEL}.`}
        onClose={onClose}
      >
        <ManagePeopleBody
          people={people}
          cards={cards}
          onClose={onClose}
          onAdd={onAdd}
          onRemove={onRemove}
          onRecolour={onRecolour}
        />
      </SheetChrome>
    </Sheet>
  )
}

function ManagePeopleBody({
  people,
  cards,
  onClose,
  onAdd,
  onRemove,
  onRecolour,
}: {
  people: TodoPerson[]
  cards: TodoCard[]
  onClose: () => void
  onAdd: (name: string) => Promise<void>
  onRemove: (person: TodoPerson) => Promise<void>
  onRecolour: (person: TodoPerson, hue: TodoHue) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  /** The person this sheet is asking about. Removing somebody moves their
   *  cards to Unassigned, which is recoverable but not obvious, so the
   *  question names the count — the same in-sheet confirmation step
   *  `AddCustomEventPanel` uses for its delete, where the body swaps to the
   *  question rather than a second overlay opening on top of the first. */
  const [confirming, setConfirming] = useState<TodoPerson | null>(null)

  const problem = (err: unknown, fallback: string) =>
    setErrors(err instanceof Error && 'errors' in err ? (err as { errors: string[] }).errors : [fallback])

  const add = async () => {
    if (!name.trim()) {
      setErrors(['Enter a name.'])
      return
    }
    setBusy(true)
    setErrors([])
    try {
      await onAdd(name.trim())
      setName('')
    } catch (err) {
      problem(err, 'Could not add that person.')
    }
    setBusy(false)
  }

  const recolour = async (person: TodoPerson, hue: TodoHue) => {
    if (person.hue === hue) return
    setBusy(true)
    setErrors([])
    try {
      await onRecolour(person, hue)
    } catch (err) {
      problem(err, 'Could not change that colour.')
    }
    setBusy(false)
  }

  const remove = async (person: TodoPerson) => {
    setBusy(true)
    setErrors([])
    try {
      await onRemove(person)
      setConfirming(null)
    } catch (err) {
      problem(err, 'Could not remove that person.')
      setConfirming(null)
    }
    setBusy(false)
  }

  if (confirming) {
    const count = cards.filter((c) => c.owner === confirming.name).length
    return (
      <>
        <div style={sheetBodyStyle}>
          <p style={{ margin: '0 0 8px', fontSize: 15, lineHeight: 1.6, color: 'var(--ux-text)' }}>
            Remove <strong>{confirming.name}</strong> from the board?
          </p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--ux-text-2)' }}>
            {count === 0
              ? 'They have no cards, so nothing else changes.'
              : `Their ${count} ${count === 1 ? 'card stays' : 'cards stay'} on the board and ${
                  count === 1 ? 'moves' : 'move'
                } to ${UNASSIGNED_LABEL}.`}
          </p>
        </div>
        <footer style={sheetFooterStyle}>
          <button type="button" onClick={() => void remove(confirming)} disabled={busy} style={primaryBtnStyle}>
            {busy ? 'Removing…' : `Remove ${confirming.name}`}
          </button>
          <button type="button" onClick={() => setConfirming(null)} disabled={busy} style={btnStyle}>
            Keep them
          </button>
        </footer>
      </>
    )
  }

  return (
    <>
      <div style={sheetBodyStyle}>
        {errors.length > 0 && (
          <div role="alert" style={errorStyle}>
            {errors.join(' ')}
          </div>
        )}

        <p style={{ ...peopleMetaStyle, margin: '0 0 10px' }}>
          Click a colour to change it. It appears on their avatar and along the top of their cards.
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {people.map((person) => {
            const count = cards.filter((c) => c.owner === person.name).length
            const locked = person.name === AUTO_ASSIGN_OWNER
            return (
              <li key={person.id} style={{ ...peopleRowStyle, alignItems: 'flex-start' }}>
                <TodoBoardAvatar name={person.name} hue={person.hue} />
                <span style={peopleNameStyle}>
                  {person.name}
                  {/* The colour chooser (2026-10-15). It exists because the
                      colours already in the store could not be fixed any
                      other way — two people were handed the same one by the
                      old rotation, and the only remedy was removing somebody,
                      which would have sent their cards to Unassigned to fix a
                      palette problem. */}
                  <span style={{ ...swatchRowStyle, marginTop: 6 }}>
                    {TODO_HUES.map((hue) => (
                      <button
                        key={hue}
                        type="button"
                        className="cre-todo-avatar"
                        data-hue={hue}
                        aria-pressed={person.hue === hue}
                        aria-label={`${hue} for ${person.name}`}
                        disabled={busy}
                        onClick={() => void recolour(person, hue)}
                        style={swatchStyle(person.hue === hue)}
                      />
                    ))}
                  </span>
                </span>
                <span style={peopleMetaStyle}>
                  {count} {count === 1 ? 'card' : 'cards'}
                </span>
                {locked ? (
                  /* She is the handoff column's owner by rule, so removing her
                     would leave that column assigned to somebody the roster
                     says does not exist. The endpoint refuses it too — this
                     only explains why the button is not here. */
                  <span style={peopleMetaStyle} title={`${AUTO_ASSIGN_OWNER} owns the handoff column`}>
                    Owns handoff
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirming(person)} disabled={busy} style={linkBtnStyle}>
                    Remove
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        <div style={addPersonRowStyle}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle} htmlFor="todo-person-name">
              Add a person
            </label>
            <input
              id="todo-person-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void add()
                }
              }}
              placeholder="Full name"
              style={fieldStyle}
            />
          </div>
          <button type="button" onClick={() => void add()} disabled={busy} style={primaryBtnStyle}>
            Add
          </button>
        </div>
      </div>

      <footer style={sheetFooterStyle}>
        <button type="button" onClick={onClose} style={btnStyle}>
          Done
        </button>
      </footer>
    </>
  )
}
