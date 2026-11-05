import { useState } from 'react'
import { Plus, XmarkRegular } from '@/icons'
import {
  JEFF_CTX_MAX,
  JEFF_LESSONS,
  JEFF_LINES,
  JEFF_PLUS_CONTEXT,
  JEFF_PLUS_UPLOAD,
  JEFF_SAMPLES,
  JEFF_SAMPLE_LINK,
  JEFF_STATES,
  type JeffLesson,
} from '@/data/compassJeffFixtures'

export type JeffCtxItem = { key: string; kind: string; label: string }

/**
 * HIS "+" — ADD CONTEXT, UPLOAD.
 *
 * ⚠ THE POINT IS WHAT RUBI IS HOLDING, not how many ways there are to attach
 * something. Every route here ends in the same place: a chip above the prompt,
 * capped at five, each one removable. His own announcement is the clearest
 * statement of the idea — "Added <x> as context. Rubi can use up to 5 items."
 *
 * ⚠ EIGHT ENTRIES, SIX PICKERS, ONE TRAY. Course (lessons and their sections),
 * markers (notes, flags, conversations), library (what the Studio made), exam
 * details (state, line, date), and three upload routes. "This lesson" skips
 * the picker and attaches straight away, because it is the thing a learner
 * reaching for + most often means.
 */
export function CompassJeffAddContext({
  lesson,
  markers,
  library,
  ctx,
  onAdd,
  onRemove,
}: {
  lesson: JeffLesson
  markers: { id: string; kind: string; label: string; lesson: string; num: string }[]
  library: { kind: string; title: string; meta: string }[]
  ctx: JeffCtxItem[]
  onAdd: (items: JeffCtxItem[]) => void
  onRemove: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState<string | null>(null)
  const [picked, setPicked] = useState<Record<string, true>>({})
  const [link, setLink] = useState('')
  const [exam, setExam] = useState({ state: JEFF_STATES[0], line: JEFF_LINES[0], date: '2026-11-18' })

  const close = () => {
    setPick(null)
    setPicked({})
  }
  const rows = pickRows(pick, markers, library)
  const addPicked = () => {
    const items = rows
      .filter((r) => r.key && picked[r.key])
      .map((r) => ({ key: r.key!, kind: r.kind!, label: r.chip ?? short(r.label) }))
    if (items.length) onAdd(items)
    close()
  }

  return (
    <>
      {/* ⚠ THE TRAY SITS ABOVE THE PROMPT, not inside it: what Rubi is holding
          has to be legible before you type, not after. */}
      {ctx.length > 0 && (
        <div className="cre-jc-ctx" aria-label="Context for Rubi">
          {ctx.map((c) => (
            <span className={`cre-jc-ctx-chip is-${c.kind}`} key={c.key}>
              {c.label}
              <button type="button" aria-label={`Remove ${c.label}`} onClick={() => onRemove(c.key)}>
                <XmarkRegular size={12} aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        id="jc-plus-btn"
        className="cre-jc-plus"
        aria-label="Add context or upload"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Plus size={16} aria-hidden />
      </button>

      {open && (
        <div className="cre-jc-plus-menu" role="menu" aria-label="Add to Rubi">
          <p className="eyebrow">Add context</p>
          {JEFF_PLUS_CONTEXT.map((m) => (
            <button
              type="button"
              role="menuitem"
              key={m.key}
              className="cre-jc-plus-item"
              onClick={() => {
                setOpen(false)
                if (m.key === 'lesson') {
                  onAdd([{ key: `les:${lesson.id}`, kind: 'course', label: short(`${lesson.id} · ${lesson.title}`) }])
                  return
                }
                setPick(m.key)
              }}
            >
              <strong>{m.label}</strong>
              <span>{m.key === 'lesson' ? `${lesson.id} · ${lesson.title}` : m.sub}</span>
            </button>
          ))}
          <p className="eyebrow">Upload</p>
          {JEFF_PLUS_UPLOAD.map((m) => (
            <button
              type="button"
              role="menuitem"
              key={m.key}
              className="cre-jc-plus-item"
              onClick={() => {
                setOpen(false)
                setPick(m.key)
              }}
            >
              <strong>{m.label}</strong>
              <span>{m.sub}</span>
            </button>
          ))}
        </div>
      )}

      {pick && (
        <div className="cre-jc-scrim" onClick={(e) => e.target === e.currentTarget && close()}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={PICK_TITLE[pick] ?? 'Add context'}
            className="cre-jc-pick"
            onKeyDown={(e) => e.key === 'Escape' && close()}
          >
            <div className="cre-jc-pick-head">
              <h2>{PICK_TITLE[pick] ?? 'Add context'}</h2>
              <button type="button" aria-label="Close" onClick={close}>
                <XmarkRegular size={16} aria-hidden />
              </button>
            </div>

            {pick === 'exam' ? (
              <div className="cre-jc-pick-form">
                <label htmlFor="jc-exam-state">State</label>
                <select
                  id="jc-exam-state"
                  value={exam.state}
                  onChange={(e) => setExam((x) => ({ ...x, state: e.target.value }))}
                >
                  {JEFF_STATES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
                <label htmlFor="jc-exam-line">License line</label>
                <select
                  id="jc-exam-line"
                  value={exam.line}
                  onChange={(e) => setExam((x) => ({ ...x, line: e.target.value }))}
                >
                  {JEFF_LINES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
                <label htmlFor="jc-exam-date">Exam date</label>
                <input
                  id="jc-exam-date"
                  type="date"
                  value={exam.date}
                  onChange={(e) => setExam((x) => ({ ...x, date: e.target.value }))}
                />
                <button
                  type="button"
                  className="cre-jc-continue"
                  onClick={() => {
                    onAdd([{ key: 'exam', kind: 'exam', label: `${exam.state} · ${exam.line}` }])
                    close()
                  }}
                >
                  Add exam details
                </button>
              </div>
            ) : pick === 'link' ? (
              <div className="cre-jc-pick-form">
                <label htmlFor="jc-link">Link</label>
                <input
                  id="jc-link"
                  value={link}
                  placeholder="https://"
                  onChange={(e) => setLink(e.target.value)}
                />
                <button type="button" className="cre-jcd-ghost" onClick={() => setLink(JEFF_SAMPLE_LINK)}>
                  Use a sample link
                </button>
                <button
                  type="button"
                  className="cre-jc-continue"
                  disabled={!link.trim()}
                  onClick={() => {
                    onAdd([{ key: `link:${link}`, kind: 'link', label: short(link.replace(/^https?:\/\//, '')) }])
                    setLink('')
                    close()
                  }}
                >
                  Add link
                </button>
              </div>
            ) : (
              <>
                <ul className="cre-jc-pick-rows">
                  {rows.map((r, i) =>
                    r.head ? (
                      <li className="cre-jc-pick-head-row" key={`h${i}`}>
                        {r.head}
                      </li>
                    ) : (
                      <li key={r.key}>
                        <label>
                          <input
                            type="checkbox"
                            checked={!!picked[r.key!]}
                            onChange={() =>
                              setPicked((p) => {
                                const next = { ...p }
                                if (next[r.key!]) delete next[r.key!]
                                else next[r.key!] = true
                                return next
                              })
                            }
                          />
                          <span>
                            <span className="cre-jc-pick-label">{r.label}</span>
                            {r.sub && <span className="cre-jc-pick-sub">{r.sub}</span>}
                          </span>
                        </label>
                      </li>
                    ),
                  )}
                  {rows.length === 0 && <li className="cre-jc-pick-sub">Nothing here yet.</li>}
                </ul>
                <div className="cre-jc-pick-foot">
                  <span className="cre-jc-pick-sub">
                    Rubi can use up to {JEFF_CTX_MAX} items. {ctx.length} added.
                  </span>
                  <button type="button" className="cre-jc-continue" onClick={addPicked}>
                    Add
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const PICK_TITLE: Record<string, string> = {
  course: 'Choose from course',
  markers: 'My markers',
  library: 'My Library',
  exam: 'My exam details',
  file: 'Upload a file',
  photo: 'Take a photo',
  link: 'Paste a link',
}

type Row = {
  key?: string
  kind?: string
  /** What the picker row reads. */
  label: string
  /** ⚠ WHAT THE CHIP READS, which is not the same string. His `shortLabel`
      caps a chip at 30 characters and prefixes it with its kind — "Note ·
      Domestic = home state…" — because the tray has to stay scannable when
      five things are in it. The row can be as long as it likes. */
  chip?: string
  sub?: string
  head?: string
}

/** His `shortLabel`: truncate to n with an ellipsis, or leave it alone. */
const short = (t: string, n = 30) => (t.length > n ? `${t.slice(0, n - 1)}…` : t)

/** His `pickRows` — what each picker offers, and the keys that stop a double add. */
function pickRows(
  kind: string | null,
  markers: { id: string; kind: string; label: string; lesson: string; num: string }[],
  library: { kind: string; title: string; meta: string }[],
): Row[] {
  if (kind === 'course') {
    /* ⚠ LESSONS AND THEIR SECTIONS, not just lessons — attaching one section
       is the finer grain his design is making available. */
    return JEFF_LESSONS.flatMap((l) => [
      {
        key: `les:${l.id}`,
        kind: 'course',
        label: `${l.id} · ${l.title}`,
        chip: short(`${l.id} · ${l.title}`),
        sub: `Whole lesson · ${l.secs.length} sections`,
      },
      ...l.secs.map((c) => ({
        key: `sec:${l.id}:${c.num}`,
        kind: 'course',
        label: `${c.num} · ${c.title}`,
        chip: short(`§${c.num} ${c.title}`),
      })),
    ])
  }
  if (kind === 'markers') {
    const of = (k: string) => markers.filter((m) => m.kind === k)
    return [
      { head: 'Notes', label: '' },
      ...of('Note').map((m) => ({ key: `note:${m.id}`, kind: 'marker', label: m.label, chip: short(`Note · ${m.label}`), sub: `${m.lesson} · Section ${m.num}` })),
      { head: 'Flags', label: '' },
      ...of('Flag').map((m) => ({ key: `flag:${m.id}`, kind: 'marker', label: m.label, chip: short(`Flag · ${m.label}`), sub: `${m.lesson} · Section ${m.num}` })),
      { head: 'Rubi conversations', label: '' },
      ...of('Rubi conversation').map((m) => ({ key: `chat:${m.id}`, kind: 'marker', label: m.label, chip: short(`Chat · ${m.label}`), sub: `${m.lesson} · Section ${m.num}` })),
    ]
  }
  if (kind === 'library') {
    return library.map((b) => ({ key: `lib:${b.title}`, kind: 'lib', label: b.title, chip: short(b.title), sub: b.meta }))
  }
  if (kind === 'file' || kind === 'photo') {
    const list = kind === 'file' ? JEFF_SAMPLES.file : JEFF_SAMPLES.photo
    return list.map((f) => ({ key: `${kind}:${f.label}`, kind, label: f.label, chip: short(f.label), sub: f.sub }))
  }
  return []
}
