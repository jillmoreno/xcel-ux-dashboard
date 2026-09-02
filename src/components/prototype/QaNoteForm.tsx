/**
 * QA Notes — the finding editor.
 *
 * Four fields. It was eleven until 2026-08-26, when surface, state, category,
 * blocked-on, the prose expected/actual pair, the two screenshot captions, the
 * feature flag and the ticket ref were all cut: filling it in was a chore, and
 * the chore was the reason findings did not get logged. The two captures are
 * already labelled Expected and Actual, so the prose pair was restating them.
 *
 * Three choices worth knowing about:
 *
 * - **Bullets are a textarea, one per line, not a repeater.** The data model is
 *   a flat list where a leading two-space prefix marks one level of nesting, and
 *   a plain textarea maps onto that exactly — indent a line and it is nested.
 *   A row-per-bullet UI with add/remove buttons would be more chrome for less
 *   expressiveness, and would need its own answer for indentation.
 * - **No id and no logged date.** The server owns both, so the form cannot
 *   renumber a finding — ids are referenced from tickets and from other
 *   findings' bullets — or backdate one.
 * - **Screenshots are picked here but uploaded AFTER the save.** A capture is
 *   filed under the finding's id, and a new finding has no id until the server
 *   assigns one — so the files are held in local state and sent the moment the
 *   note comes back. That ordering has a consequence worth knowing: if a capture
 *   upload fails, the FINDING still exists. It is reported by slot and by reason
 *   rather than rolled back, because throwing away a finding someone just wrote
 *   because a PNG did not land would be the worse failure.
 *
 *   The detail panel keeps its own drop zones. Not a duplicate: this is "write
 *   the finding with its evidence", that is "manage the evidence on a finding
 *   that exists" — which is also where replacing and removing a capture lives, so
 *   this form never has to stage a deletion.
 */

import { useState, type CSSProperties, type DragEvent, type ReactNode } from 'react'
import { Trash } from '@/icons'
import { Modal } from '@/components/ui/Modal'
import type { QaNote, QaSeverity, QaStatus } from '@/data/qaNotes'
import {
  NoteWriteError,
  createNote,
  saveNote,
  type MergedNote,
  type NoteDraft,
} from '@/data/qaNoteStore'
import {
  MAX_CONTEXT,
  captureKey,
  captureUrl,
  contextCapturesFor,
  contextKey,
  freeContextIndices,
  uploadCapture,
  type CaptureIndex,
  type CaptureLabel,
} from '@/data/qaCaptureStore'
import { QA_SEVERITIES, QA_STATUSES } from './qaNotesUtil'

const SLOT_LABELS: CaptureLabel[] = ['Expected', 'Actual']

/**
 * A file chosen but not yet sent, with a data URL previewing it.
 *
 * A data URL rather than `URL.createObjectURL`, deliberately. An object URL must
 * be revoked or it pins the whole image in memory for the life of the document,
 * and tracking that across replace / clear / unmount needs a ref that the
 * component would have to write during render. A data URL is garbage-collected
 * with the state that holds it. It costs about a third more memory for one or two
 * screenshots, which is nothing, and removes the entire lifecycle problem.
 *
 * The preview is the ONLY thing this is used for — the upload sends the original
 * `file`, so nothing here touches image quality.
 */
type Pending = { file: File; previewUrl: string }

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('That image could not be read.'))
    reader.readAsDataURL(file)
  })
}

type FormState = {
  title: string
  severity: QaSeverity
  status: QaStatus
  bulletsText: string
}

/** Bullets round-trip through a single string: one per line, leading two spaces
 *  preserved as the nesting marker. */
function bulletsToText(bullets: string[]): string {
  return bullets.join('\n')
}

function textToBullets(text: string): string[] {
  return text
    .split('\n')
    // Only trailing whitespace — the LEADING prefix is the nesting marker and
    // trimming it would silently flatten the list.
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim().length > 0)
}

function initialState(note: QaNote | null): FormState {
  return {
    title: note?.title ?? '',
    severity: note?.severity ?? 'Medium',
    status: note?.status ?? 'Open',
    bulletsText: bulletsToText(note?.bullets ?? []),
  }
}

/**
 * Build the record to send.
 *
 * `screens` carries the COMMITTED file paths through untouched. Editing a
 * finding that names one must not drop it — that would orphan a screenshot
 * committed in the repo, which the form has no way to put back.
 */
function toDraft(f: FormState, existing: QaNote | null): NoteDraft {
  return {
    title: f.title.trim(),
    severity: f.severity,
    status: f.status,
    bullets: textToBullets(f.bulletsText),
    screens: existing?.screens ?? [],
  }
}

/* ── styles ───────────────────────────────────────────────────────────────── */

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  marginBottom: 5,
}

const controlStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  lineHeight: 1.5,
  padding: '8px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
}

const hintStyle: CSSProperties = {
  margin: '5px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  lineHeight: 1.5,
  color: 'var(--color-text-tertiary)',
}

const pairStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
}

const bodyStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: '4px 20px 18px',
  maxHeight: '68vh',
  overflowY: 'auto',
}

const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 20px',
  borderTop: '1px solid var(--color-border-subtle)',
}

const btnStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  fontWeight: 600,
  padding: '9px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const primaryBtnStyle: CSSProperties = {
  ...btnStyle,
  border: '1px solid var(--ux-accent)',
  background: 'var(--ux-accent)',
  color: 'var(--ux-on-accent)',
}

const errorBoxStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  background: 'color-mix(in srgb, var(--color-error-500) 10%, transparent)',
  border: '1px solid var(--color-error-500)',
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  lineHeight: 1.55,
  color: 'var(--color-text-primary)',
}

const noteBoxStyle: CSSProperties = {
  ...errorBoxStyle,
  background: 'color-mix(in srgb, var(--color-warning-500) 12%, transparent)',
  borderColor: 'var(--color-warning-500)',
}

const contextRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  alignItems: 'center',
}

const contextThumbStyle: CSSProperties = {
  width: 68,
  height: 50,
  borderRadius: 4,
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-neutral-50)',
  objectFit: 'contain',
  display: 'block',
  flex: 'none',
}

const contextRemoveStyle: CSSProperties = {
  position: 'absolute',
  top: -5,
  right: -5,
  width: 18,
  height: 18,
  padding: 0,
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-error-600)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const contextAddStyle: CSSProperties = {
  ...contextThumbStyle,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderStyle: 'dashed',
  borderColor: 'var(--color-neutral-light)',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--ux-accent)',
  cursor: 'pointer',
}

const slotGridStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
}

const frameStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 92,
  padding: 6,
  borderRadius: 'var(--radius-md)',
  border: '1px dashed var(--color-neutral-light)',
  background: 'var(--color-neutral-50)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  textAlign: 'center',
  color: 'var(--color-text-tertiary)',
  cursor: 'pointer',
  overflow: 'hidden',
}

const slotFootStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 5,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const slotActionStyle: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  fontWeight: 600,
  letterSpacing: 0,
  textTransform: 'none',
  color: 'var(--ux-accent)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
}

const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
}

/**
 * One capture slot in the form.
 *
 * Shows, in order: the file just chosen, else the capture already stored for this
 * finding, else an empty target. The `<input type="file">` is not a convenience
 * beside the drop zone — it is the only way to pick a file without a pointer, so
 * the frame IS its label and the drop handler is the shortcut.
 */
function CapturePicker({
  label,
  pending,
  existingUrl,
  onPick,
  onClear,
}: {
  label: CaptureLabel
  pending: Pending | null
  existingUrl: string | null
  onPick: (file: File) => void
  onClear: () => void
}) {
  const [over, setOver] = useState(false)
  const inputId = `qa-slot-${label.toLowerCase()}`
  const shown = pending?.previewUrl ?? existingUrl

  return (
    <div
      onDragOver={(e: DragEvent) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault()
        setOver(false)
        const file = e.dataTransfer?.files?.[0]
        if (file) onPick(file)
      }}
    >
      <label
        htmlFor={inputId}
        style={{ ...frameStyle, ...(over ? { borderColor: 'var(--ux-accent)' } : null) }}
      >
        {shown ? (
          <img
            src={shown}
            alt=""
            style={{ maxWidth: '100%', maxHeight: 150, width: 'auto', display: 'block' }}
          />
        ) : over ? (
          'Drop to attach'
        ) : (
          'Drop a screenshot, or click'
        )}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        aria-label={`Choose the ${label} screenshot`}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          // Cleared so re-picking the SAME file fires `change` again — without
          // this a rejected file cannot be retried.
          e.target.value = ''
        }}
        style={visuallyHidden}
      />
      <span style={slotFootStyle}>
        {label}
        {pending && (
          <button type="button" onClick={onClear} style={slotActionStyle}>
            <Trash size={11} aria-hidden />
            Clear
          </button>
        )}
        {!pending && existingUrl && <span style={{ ...slotActionStyle, color: 'var(--color-text-tertiary)', cursor: 'default' }}>stored — drop to replace</span>}
      </span>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={labelStyle}>{label}</span>
      {children}
      {hint ? <p style={hintStyle}>{hint}</p> : null}
    </label>
  )
}

/* ── the editor ───────────────────────────────────────────────────────────── */

export function QaNoteForm({
  open,
  note,
  captures,
  onClose,
  onSaved,
}: {
  open: boolean
  /** The finding being edited, or `null` to add a new one. */
  note: MergedNote | null
  /** Captures already stored, so an edit shows what this finding has. */
  captures: CaptureIndex
  onClose: () => void
  /**
   * The saved record, plus anything that went wrong uploading its screenshots.
   *
   * Capture failures are reported rather than thrown, because by the time they
   * can happen the finding is already saved — see the note at the top of this
   * file.
   */
  onSaved: (saved: QaNote, captureErrors: string[]) => void
}) {
  const editing = note !== null
  const [form, setForm] = useState<FormState>(() => initialState(note))
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<Partial<Record<CaptureLabel, Pending>>>({})
  // Context files queued for upload. A flat list, not indexed: the indices are
  // assigned at save time from whatever is free THEN, which is the only moment
  // they can be known — another author may have added one meanwhile.
  const [pendingContext, setPendingContext] = useState<Pending[]>([])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function pick(label: CaptureLabel, file: File) {
    setErrors([])
    try {
      const previewUrl = await readAsDataUrl(file)
      setPending((prev) => ({ ...prev, [label]: { file, previewUrl } }))
    } catch (e) {
      setErrors([(e as Error).message])
    }
  }

  function clear(label: CaptureLabel) {
    setPending((prev) => {
      const next = { ...prev }
      delete next[label]
      return next
    })
  }

  const storedContext = note ? contextCapturesFor(captures, note.id) : []
  /** How many more will fit — the stored ones plus whatever is already queued. */
  const contextRoom = MAX_CONTEXT - storedContext.length - pendingContext.length

  async function addContext(files: File[]) {
    setErrors([])
    const room = contextRoom
    if (room <= 0) {
      setErrors([`A finding holds at most ${MAX_CONTEXT} context images.`])
      return
    }
    const taking = files.slice(0, room)
    const dropped = files.length - taking.length
    try {
      const read = await Promise.all(
        taking.map(async (file) => ({ file, previewUrl: await readAsDataUrl(file) })),
      )
      setPendingContext((prev) => [...prev, ...read])
      // Said rather than swallowed: picking eight when two fit should not quietly
      // attach two.
      if (dropped > 0) {
        setErrors([`Only ${taking.length} more fit — ${dropped} were not added.`])
      }
    } catch (e) {
      setErrors([(e as Error).message])
    }
  }

  function removeContext(at: number) {
    setPendingContext((prev) => prev.filter((_, i) => i !== at))
  }

  /** The capture already stored for a slot, if this finding has one. */
  function storedUrl(label: CaptureLabel): string | null {
    if (!note) return null
    const found = captures.byKey.get(captureKey(note.id, label))
    return found ? captureUrl(found) : null
  }

  async function submit() {
    setErrors([])
    setBusy(true)
    try {
      const draft = toDraft(form, note)
      const saved = editing ? await saveNote(note.id, draft) : await createNote(draft)
      // Only now is there an id to file captures under. Sent in parallel; each
      // failure is collected rather than aborting the rest, so one bad file does
      // not also lose the good one.
      // Context indices are resolved against the CURRENT store, not against what
      // the form last saw — a new finding has none, and an edited one may have
      // gained some since the form opened.
      const free = freeContextIndices(captures, saved.id)
      const uploads: { key: string; file: File; what: string }[] = [
        ...SLOT_LABELS.flatMap((label) => {
          const held = pending[label]
          return held ? [{ key: captureKey(saved.id, label), file: held.file, what: label }] : []
        }),
        ...pendingContext.slice(0, free.length).map((held, i) => ({
          key: contextKey(saved.id, free[i]),
          file: held.file,
          what: `Context ${free[i]}`,
        })),
      ]
      const results = await Promise.all(
        uploads.map(async ({ key, file, what }) => {
          try {
            await uploadCapture(key, file)
            return null
          } catch (e) {
            return `${what}: ${e instanceof Error ? e.message : 'upload failed.'}`
          }
        }),
      )
      onSaved(saved, results.filter((r): r is string => r !== null))
      onClose()
    } catch (e) {
      setErrors(e instanceof NoteWriteError ? e.errors : [(e as Error).message ?? 'Save failed.'])
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      // The bullet list is enough typing to be worth not losing to a stray click
      // outside the dialog.
      disableBackdropClose
      width={660}
      title={editing ? `Edit ${note.id}` : 'Add a QA finding'}
    >
      <div style={bodyStyle}>
        {errors.length > 0 && (
          <div style={errorBoxStyle} role="alert">
            {errors.length === 1 ? (
              errors[0]
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Editing a committed finding stores an override rather than changing
            the file, and the override then hides any later change to it in git.
            Said plainly, because it is not guessable from the UI. */}
        {note?.origin === 'committed' && (
          <div style={noteBoxStyle}>
            {note.id} is one of the findings committed in <code>src/data/qaNotes.ts</code>. Saving
            stores an override that wins over the file from now on — Delete reverts to it.
          </div>
        )}

        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="What is wrong, in one line"
            style={controlStyle}
          />
        </Field>

        <div style={pairStyle}>
          <Field label="Severity">
            <select
              value={form.severity}
              onChange={(e) => set('severity', e.target.value as QaSeverity)}
              style={controlStyle}
            >
              {QA_SEVERITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as QaStatus)}
              style={controlStyle}
            >
              {QA_STATUSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Detail"
          hint={
            <>
              One bullet per line. <strong>Indent a line by two spaces</strong> to nest it under the
              line above — it renders one level in with a hollow marker.
            </>
          }
        >
          <textarea
            value={form.bulletsText}
            onChange={(e) => set('bulletsText', e.target.value)}
            rows={7}
            placeholder={'The banner contradicts the tile below it\n  Same screen, two states resolved'}
            style={{ ...controlStyle, resize: 'vertical', fontVariantLigatures: 'none' }}
          />
        </Field>

        <div>
          <span style={labelStyle}>Screenshots</span>
          <div style={slotGridStyle}>
            {SLOT_LABELS.map((label) => (
              <CapturePicker
                key={label}
                label={label}
                pending={pending[label] ?? null}
                existingUrl={storedUrl(label)}
                onPick={(file) => void pick(label, file)}
                onClear={() => clear(label)}
              />
            ))}
          </div>
          <p style={hintStyle}>
            {captures.available
              ? 'Uploaded when you save. Replacing or removing a stored screenshot is done on the finding itself.'
              : 'The capture endpoint is not reachable from here, so screenshots cannot be attached.'}
          </p>
        </div>

        {captures.available && (
          <div>
            <span style={labelStyle}>Context images</span>
            <div style={contextRowStyle}>
              {/* Already on the finding. Shown so the count is honest, but managed
                  on the panel — the form never stages a deletion. */}
              {storedContext.map(({ index: i, capture }) => (
                <img key={i} src={captureUrl(capture)} alt="" style={contextThumbStyle} />
              ))}
              {pendingContext.map((held, i) => (
                <span key={held.previewUrl} style={{ position: 'relative', flex: 'none' }}>
                  <img src={held.previewUrl} alt="" style={contextThumbStyle} />
                  <button
                    type="button"
                    onClick={() => removeContext(i)}
                    aria-label={`Remove context image ${i + 1}`}
                    style={contextRemoveStyle}
                  >
                    <Trash size={10} aria-hidden />
                  </button>
                </span>
              ))}
              {contextRoom > 0 && (
                <label htmlFor="qa-context-add" style={contextAddStyle}>
                  + Add
                  <input
                    id="qa-context-add"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    aria-label="Add context images"
                    onChange={(e) => {
                      void addContext([...(e.target.files ?? [])])
                      e.target.value = ''
                    }}
                    style={visuallyHidden}
                  />
                </label>
              )}
            </div>
            <p style={hintStyle}>
              {contextRoom > 0
                ? `Anything supporting that is not the Expected/Actual comparison — a console, a zoom, a third state. ${contextRoom} of ${MAX_CONTEXT} slots free.`
                : `All ${MAX_CONTEXT} context slots are full. Remove one on the finding to free a slot.`}
            </p>
          </div>
        )}
      </div>

      <div style={footerStyle}>
        <button type="button" onClick={() => void submit()} disabled={busy} style={primaryBtnStyle}>
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Add finding'}
        </button>
        <button type="button" onClick={onClose} disabled={busy} style={btnStyle}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
