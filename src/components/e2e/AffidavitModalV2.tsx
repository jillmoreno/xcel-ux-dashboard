import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { acquireBodyScrollLock } from '@/utils/bodyScrollLock'
import { ArrowUpRightFromSquare, Check, FileText, X } from '@/icons'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  DOCS,
  MOMENTS,
  STATES,
  STATUS,
  type AffBlock,
  type AffEntry,
  type AffField,
  type AffForm,
  type AffidavitMoment,
} from '@/data/affidavitForms'
import type { AffidavitKind } from './AffidavitModal'
import { resolveAffidavit, withoutMiddle } from './affidavitModalV2Util'
import './affidavitModalV2.css'

/**
 * THE AFFIDAVIT MODAL, V2 — 2026-11-03, Afsana. A fork of `AffidavitModal`
 * (untouched, still what main shows), chosen at the call site by the
 * `atlas-affidavit-v2` flag.
 *
 * ⚠ IT IS HER AFFIDAVIT EXPLORER, IN THE PRODUCT. Every form, state and
 * moment comes from `affidavitForms.ts`, ported from the explorer verbatim;
 * this file is the explorer's `buildScreen` rebuilt in React, desktop only.
 * The explorer's filters are on the Design bar instead of on the page —
 * Moment (`affidavit-v2-moment`), State (`affidavit-v2-state`), Pattern
 * (`affidavit-v2-pattern`), Line of authority (`affidavit-v2-loa`) and
 * Language (`affidavit-v2-language`), the last two for the states that sign
 * a form per line or per language. Left behind on purpose: the Full scroll pattern, the View
 * (device) control, the Question bank and the Notes.
 *
 * ⚠ THREE MOMENTS, NOT TWO. The explorer's are Before course begins, Before
 * course exam and After course exam, and V2 follows them. V1 and the Study
 * Journey still say "Pre-course" and "Study-manual Notice" (after the
 * coursework) — which is where the explorer has Florida's Study-manual notice
 * BEFORE the course. Afsana's call, 2026-11-03: V2 follows the explorer; the
 * journey's row names are not changed here. So the `kind` the call sites pass
 * (from Eric's Affidavit control or `?affidavit=1`) only OPENS the modal —
 * which affidavit it shows is the Moment control's.
 *
 * THE TWO PATTERNS, as the explorer gates them:
 *   · Pagination — one page at a time under progress segments. Next unlocks
 *     when the page has been scrolled to its end and its required fields are
 *     filled; the last page carries the form's own button (I Agree, Attest,
 *     Acepto…). Proctor / exam-monitor pages never block, so a reviewer can
 *     walk through without playing the proctor.
 *   · Link out — the document as a link (opening it shows it over the
 *     modal), an "I have read … and swear" checkbox, and the fields. Not
 *     offered after the course exam, or on a form marked `noLink`: those
 *     fall back to Pagination, as the explorer falls back to Full scroll.
 * Agreeing closes the modal onto Home, as V1's Continue does.
 *
 * ⚠ THE REVIEW CHROME STAYS UNCOVERED (V2's first change). The scrim starts
 * below the lowest `.cre-prototype-bar` / `.cre-demo-controls` and sits at
 * z-index 55 — above the product shell (≤ 51), under the bars' menus (60) —
 * so every bar control still answers while the modal is open.
 */
export type { AffidavitKind }

export type AffidavitPattern = 'page' | 'link'

/** Every bar that sits above the product — the dark review bar, then the demo
 *  and design controls. */
const CHROME_SELECTOR = '.cre-prototype-bar, .cre-demo-controls'

/** The window y where the review chrome ends, 0 when none is on screen. */
function useChromeBottom(): number {
  const [bottom, setBottom] = useState(0)
  useLayoutEffect(() => {
    const measure = () => {
      let max = 0
      document.querySelectorAll(CHROME_SELECTOR).forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.height > 0) max = Math.max(max, r.bottom)
      })
      setBottom(Math.max(0, Math.round(max)))
    }
    measure()
    const observer = new MutationObserver(measure)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [])
  return bottom
}

/* ── Picking the form (the explorer's `current` / `resolve`) ────────────── */

const MOMENT_IDS = MOMENTS.map((m) => m.id)
const asMoment = (v: string | undefined): AffidavitMoment =>
  MOMENT_IDS.includes(v as AffidavitMoment) ? (v as AffidavitMoment) : 'pre'

const docLabel = (id?: string) => DOCS.find((d) => d.id === id)?.label ?? 'Affidavit'
const formLabel = (e: AffEntry) =>
  e.m === 'pre' ? docLabel(e.doc) : e.m === 'exam' ? 'Pre-exam attestation' : 'Post-exam attestation'

/* ── Fields (the explorer's `flatList` / `prefillVals` / `filled`) ──────── */

type Vals = Record<string, string>

const flatList = (l: AffField[] | undefined): AffField[] =>
  (l ?? []).flatMap((x) =>
    x.flagGroup
      ? flatList(x.flagGroup)
      : x.depGroup
        ? flatList(x.items).map((y) => ({ ...y, _dep: x.depGroup }))
        : x.block
          ? []
          : x.row
            ? x.row
            : [x],
  )
const flatFields = (f: AffForm) => flatList(f.pages.flatMap((p) => p.fields ?? []).concat(f.fields))

const isoToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SAMPLE_ADDR: Record<string, [string, string]> = {
  KY: ['Frankfort', '40601'], NV: ['Las Vegas', '89104'], OR: ['Portland', '97205'], OH: ['Columbus', '43215'],
  CA: ['Sacramento', '95814'], IL: ['Springfield', '62701'], MN: ['Saint Paul', '55102'], FL: ['Tallahassee', '32301'],
}

/** The learner's profile pre-populates the form, as in the explorer: Jordan
 *  Navarro, the invite flow's learner. Today's date is filled and locked. */
function prefillVals(f: AffForm, st: string): { vals: Vals; readOnly: string[] } {
  const today = isoToday()
  const [city, zip] = SAMPLE_ADDR[st] ?? ['Springfield', '62701']
  const P: Vals = {
    first: 'Jordan', middle: 'Lee', last: 'Navarro', addr1: '1420 Maple Avenue', addr2: 'Apt 3B', city, state: st, zip,
    phone: '(555) 214-7788', email: 'jordan.navarro@example.com', date: today, s_date: today, sigdate: today,
    examdate: today, examdt: `${today}T10:30`, examtime: '10:30', course: `${STATES[st] ?? ''} Life & Health Prelicensing`,
    // The name-only forms that keep one Full Name line (2026-11-04). On every
    // form with a signature the name is First / Middle / Last, pre-filled, and
    // the Student Signature box is left empty for the learner (2026-11-06).
    fullname: 'Jordan Lee Navarro',
  }
  const vals: Vals = {}
  const skip = f.noPrefill ?? []
  flatFields(f).forEach((x) => {
    if (!x.id || skip.includes(x.id)) return
    const fromProfile = x.sameAs ? P[x.sameAs] : P[x.id]
    if (fromProfile != null && (!x.options || x.options.includes(fromProfile))) vals[x.id] = fromProfile
  })
  const readOnly = ['date', 's_date', 'sigdate', ...(f.lock ?? [])].filter((k) => k in vals)
  return { vals, readOnly }
}

type FlatField = AffField & { _dep?: string }

function isFilled(list: FlatField[], vals: Vals): boolean {
  return list
    .filter((x) => x.required && !(x._dep && vals[x._dep] === 'y'))
    .every((x) => {
      const v = (vals[x.id ?? ''] ?? '').trim()
      if (v === '') return false
      if (x.type === 'email' && v.indexOf('@') <= 0) return false
      if (x.digits && !new RegExp(`^\\d{${x.digits}}$`).test(v.replace(/[\s-]/g, ''))) return false
      return true
    })
}

/* ── Rendering blocks and fields ────────────────────────────────────────── */

/** `p`, `ulh` and `olh` are HTML in the explorer's data (bold, links, line
 *  breaks) — authored copy in this repo, not user input. */
const html = (s: string) => ({ __html: s })

function Blocks({ blocks, whole = false }: { blocks: AffBlock[]; whole?: boolean }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (whole && b.pageOnly) return null
        if (b.h) return <h3 key={i} className={b.u ? 'is-u' : undefined}>{b.h}</h3>
        if (b.h4) return <h4 key={i}>{b.h4}</h4>
        if (b.olh) return <ol key={i}>{b.olh.map((t, k) => <li key={k} dangerouslySetInnerHTML={html(t)} />)}</ol>
        if (b.ol) return <ol key={i}>{b.ol.map((t, k) => <li key={k}>{t}</li>)}</ol>
        if (b.closing) return <p key={i} className="aff2-closing">{b.closing}</p>
        if (b.p) return <p key={i} className={b.fine ? 'aff2-fine' : undefined} dangerouslySetInnerHTML={html(b.p)} />
        if (b.table)
          return (
            <table key={i} className="aff2-tbl">
              <thead>
                <tr><th colSpan={b.table.head.length}>{b.table.title}</th></tr>
                <tr>{b.table.head.map((c, k) => <th key={k}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {b.table.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
              </tbody>
            </table>
          )
        if (b.ulh)
          return (
            <ul key={i} className={b.plain ? 'is-plain' : undefined}>
              {b.ulh.map((t, k) => <li key={k} dangerouslySetInnerHTML={html(t)} />)}
            </ul>
          )
        if (b.ul)
          return (
            <ul key={i}>
              {b.ul.map((t, k) =>
                typeof t === 'string' ? (
                  <li key={k}>{t}</li>
                ) : (
                  <li key={k}>{t.t}<ul>{t.sub.map((s, j) => <li key={j}>{s}</li>)}</ul></li>
                ),
              )}
            </ul>
          )
        return null
      })}
    </>
  )
}

type FieldCtx = {
  uid: string
  form: AffForm
  vals: Vals
  readOnly: string[]
  set: (id: string, value: string) => void
}

function Field({ x, ctx }: { x: AffField; ctx: FieldCtx }) {
  const id = `${ctx.uid}-${x.id}`
  const label = `${x.label ?? ''}${x.required ? ' *' : ''}`
  const v = ctx.vals[x.id ?? ''] ?? ''
  const set = (value: string) => x.id && ctx.set(x.id, value)

  if (x.type === 'staticsig')
    return (
      <div className="aff2-sig">
        <span>{x.label}</span>
        <img src={x.img} alt="Signature of the XCEL Solutions Compliance Manager" width={290} height={95} />
      </div>
    )
  if (x.readonly)
    return (
      <div>
        <label htmlFor={id}>{x.label}</label>
        <input id={id} type="text" readOnly value={x.value ?? ''} className="is-ro" />
      </div>
    )
  if (x.type === 'radio')
    return (
      <fieldset className="aff2-radio">
        <legend>{label}</legend>
        {(x.options ?? []).map((o, i) => (
          <label key={o} htmlFor={`${id}-${i}`}>
            <input type="radio" id={`${id}-${i}`} name={id} value={o} checked={o === v} onChange={() => set(o)} />
            <span>{o}</span>
          </label>
        ))}
      </fieldset>
    )
  if (x.type === 'checkbox')
    return (
      <label className="aff2-chk" htmlFor={id}>
        <input id={id} type="checkbox" checked={v === 'y'} onChange={(e) => set(e.target.checked ? 'y' : '')} />
        <span>{label}</span>
      </label>
    )
  if (x.type === 'select')
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <select id={id} value={v} autoComplete={x.ac} onChange={(e) => set(e.target.value)}>
          <option value="">{x.placeholder}</option>
          {(x.options ?? []).map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
    )
  const ro = !!x.id && ctx.readOnly.includes(x.id)
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={x.type ?? 'text'}
        value={v}
        readOnly={ro}
        aria-readonly={ro || undefined}
        className={ro ? 'is-ro' : undefined}
        autoComplete={x.ac}
        inputMode={x.inputmode as HTMLAttributes<HTMLInputElement>['inputMode']}
        maxLength={x.maxlength}
        placeholder={x.placeholder}
        onChange={(e) => set(e.target.value)}
      />
      {x.help ? <span className="aff2-hint">({x.help})</span> : null}
    </div>
  )
}

function FieldItem({ x, ctx }: { x: AffField; ctx: FieldCtx }): ReactNode {
  if (x.depGroup)
    return (
      <div className="aff2-dep" hidden={ctx.vals[x.depGroup] === 'y'}>
        {(x.items ?? []).map((y, i) => <FieldItem key={y.id ?? i} x={y} ctx={ctx} />)}
      </div>
    )
  if (x.flagGroup)
    return (
      <div className="aff2-flag aff2-flag-grp">
        {x.flagGroup.map((y, i) => <FieldItem key={y.id ?? i} x={y} ctx={ctx} />)}
      </div>
    )
  /* ⚠ `flagFields` IS NOT DRAWN (2026-11-04, Afsana: "remove the red
     highlite for the checkbox"). In the explorer it boxes one field in red,
     and on every form that uses it the field is the same one — "I confirm
     that the above information is accurate". That box is there because the
     form is pre-populated, in full or in part, from the learner's profile,
     and the learner has to vouch for what was filled in for them; it stays
     required, it just no longer looks like an error. Dropped here rather
     than in `affidavitForms.ts`, which stays verbatim with the explorer.
     The red `flagGroup` sections (names, SSN) are a different setting and
     are untouched. */
  if (x.block) return <div className="aff2-fblock"><Blocks blocks={[x.block]} /></div>
  if (x.row) return <div className="aff2-row">{x.row.map((y, i) => <Field key={y.id ?? i} x={y} ctx={ctx} />)}</div>
  return <Field x={x} ctx={ctx} />
}

function Fields({ list, ctx }: { list: AffField[] | undefined; ctx: FieldCtx }) {
  if (!list || list.length === 0) return null
  return <div className="aff2-fld">{list.map((x, i) => <FieldItem key={x.id ?? i} x={x} ctx={ctx} />)}</div>
}

/* `signs`: the fields under this banner include the student's Signature box —
   the whole form for a form-level banner, the page for a student page, so a
   certification page with nothing to sign does not say "signed" (2026-11-10). */
function WhoBanner({ who, form, signs }: { who?: 'student' | 'proctor'; form: AffForm; signs?: AffField[] }) {
  if (!who) return null
  if (who === 'student') {
    /* Only where the student signs, and in cyan (2026-11-11, Afsana). "Must be
       completed by the student" is gone: the student is the only one using
       the modal, so a page they fill without signing needs no banner. */
    if (!flatList(signs).some((x) => x.id === 'sig')) return null
    return <div className="aff2-banner is-student" role="note">Must be completed and signed by the student</div>
  }
  // The document's word for them — "exam monitor" on CO, CT and WI, "the proctor" on WV and MN —
  // and "signed" when they sign there (2026-11-10, Afsana). Stays amber.
  const text = `Must be completed${flatList(signs).some((x) => x.id === 'p_sig') ? ' and signed' : ''} by ${form.proctorWord ?? 'the proctor'}`
  return <div className="aff2-banner" role="note">{text}</div>
}

/* ── The modal ──────────────────────────────────────────────────────────── */

export function AffidavitModalV2({
  onClose,
  moment: momentProp,
  state: stateProp,
  language: languageProp,
  lineOfAuthority: loaProp,
}: {
  /** Accepted for parity with V1's call sites; V2's Moment control decides
   *  which affidavit shows (see the header). */
  kind?: AffidavitKind
  onClose: () => void
  /** Overrides for the Design bar's controls — tests and the handoff. */
  moment?: AffidavitMoment
  state?: string
  language?: string
  lineOfAuthority?: string
  initialAgreed?: boolean
}) {
  const momentFlag = useFeatureFlag('affidavit-v2-moment').variant
  const stateFlag = useFeatureFlag('affidavit-v2-state').variant
  const languageFlag = useFeatureFlag('affidavit-v2-language').variant
  const loaFlag = useFeatureFlag('affidavit-v2-loa').variant
  const middleFlag = useFeatureFlag('affidavit-v2-middle').variant
  const moment = asMoment(momentProp ?? momentFlag)
  const state = stateProp ?? stateFlag ?? 'FL'
  const language = languageProp ?? languageFlag ?? 'English'
  const lineOfAuthority = loaProp ?? loaFlag ?? 'Life & Health'
  const chromeBottom = useChromeBottom()

  /* Home stays put while the modal is up (2026-11-10, Afsana): only the
     modal scrolls, and the learner leaves by agreeing or by its X. The same
     refcounted lock the shared Modal and Sheet use, so <html> is locked too. */
  useEffect(() => acquireBodyScrollLock(), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const resolved = resolveAffidavit(moment, state, language, lineOfAuthority)
  const { entry, loa } = resolved
  const form = resolved.form && middleFlag === 'hide' ? withoutMiddle(resolved.form) : resolved.form
  /* LINK OUT IS THE PATTERN (2026-11-10, Afsana): the Design bar's Pagination
     choice is gone. Pagination is not a choice but part of the forms that
     need it — where the student and the exam monitor each have a page (CO,
     CT, MN, WV, WI after the exam), and any `noLink` form — which show in
     full. Every other form links out, after the exam too (CA, IL, OH, NY). */
  const pattern: AffidavitPattern = form?.noLink || form?.pages.some((p) => p.who === 'proctor') ? 'page' : 'link'
  const title = form
    ? form.title
    : entry
      ? `${STATES[entry.st]}: ${formLabel(entry)}${loa ? ` (${loa})` : ''}`
      : `${STATES[state] ?? state}: no affidavit`

  return createPortal(
    <div style={{ ...SCRIM, top: chromeBottom }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="affidavit-v2-title"
        lang={form?.lang}
        className="aff2-modal"
      >
        <div className="aff2-head">
          <h2 id="affidavit-v2-title">{title}</h2>
          <button type="button" className="aff2-close" aria-label="Close" onClick={onClose}>
            <X size={15} aria-hidden />
          </button>
        </div>
        {form ? (
          /* Keyed so a new form, state or pattern starts from page one with
             fresh answers — the explorer's Reset preview, done by the bar. */
          <AffidavitBody
            key={`${moment}|${state}|${lineOfAuthority}|${language}|${pattern}|${middleFlag}`}
            form={form}
            state={state}
            pattern={pattern}
            onAgree={onClose}
          />
        ) : (
          <>
            <div className="aff2-empty">
              <b>{entry ? STATUS[entry.status] : 'No affidavit here'}</b>
              {entry && entry.status === 'received'
                ? `The ${formLabel(entry).toLowerCase()} for ${STATES[entry.st]} hasn’t been added yet.`
                : entry
                  ? 'There’s no document to show for this state yet.'
                  : `${
                      // `GEN` is not a state, so it does not read as one.
                      state === 'GEN' ? 'There’s no non-state specific affidavit' : `${STATES[state] ?? state} has no affidavit`
                    } ${MOMENTS.find((m) => m.id === moment)?.label.toLowerCase()}. Pick another state or moment on the Design bar.`}
            </div>
            <div className="aff2-foot">
              <button type="button" className="aff2-btn" disabled>I Agree</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** The linked document, drawn over the affidavit with a "Back to the
 *  affidavit" button. ⚑ UNWIRED 2026-11-10, Afsana: clicking the link in
 *  Link out now only marks the document opened ("Document opened." stays),
 *  and nothing shows what the document looks like. Kept so bringing it back
 *  is a re-wire: in AffidavitBody's Link out branch, add a `docOpen` state,
 *  set it in the link's onClick beside `setOpened(true)`, and render
 *  `{docOpen ? <LinkedDocument form={form} onBack={() => setDocOpen(false)} /> : null}`
 *  after `.aff2-foot`. The `.aff2-doc` styles were never removed. The tests
 *  still render it directly, to pin each document's text. */
export function LinkedDocument({ form, onBack }: { form: AffForm; onBack: () => void }) {
  return (
    <div className="aff2-doc" role="document" aria-label={form.title}>
      <div className="aff2-tab"><b>{form.title}</b></div>
      <div className="aff2-docbody" tabIndex={0}>
        {form.docHeader ? <p className="aff2-dt">{form.docHeader}</p> : null}
        {form.pages.map((p, i) => <Blocks key={i} blocks={p.blocks ?? []} whole />)}
      </div>
      <div className="aff2-docfoot">
        <button type="button" className="aff2-btn" onClick={onBack}>
          Back to the affidavit
        </button>
      </div>
    </div>
  )
}

function AffidavitBody({
  form,
  state,
  pattern,
  onAgree,
}: {
  form: AffForm
  state: string
  pattern: AffidavitPattern
  onAgree: () => void
}) {
  const uid = 'aff2'
  const [{ vals, readOnly }, setForm] = useState(() => prefillVals(form, state))
  const [page, setPage] = useState(0)
  const [reached, setReached] = useState<Record<number, boolean>>({})
  const [opened, setOpened] = useState(false)
  const terms = useRef<HTMLDivElement>(null)
  const last = form.pages.length - 1

  const set = useCallback((id: string, value: string) => {
    setForm((prev) => ({ ...prev, vals: { ...prev.vals, [id]: value } }))
  }, [])
  const ctx: FieldCtx = { uid, form, vals, readOnly, set }

  /* Scrolled to the end of this page? A page shorter than the box is read on
     arrival. Pagination only — Link out has no scroll gate. */
  const check = useCallback(() => {
    const el = terms.current
    if (!el || pattern !== 'page') return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReached((r) => (r[page] ? r : { ...r, [page]: true }))
  }, [page, pattern])
  useEffect(() => {
    terms.current?.scrollTo?.({ top: 0 })
    const id = requestAnimationFrame(check)
    return () => cancelAnimationFrame(id)
  }, [page, check])

  /* Proctor / exam-monitor pages don't block Pagination (the explorer's
     `skipProc`), so a walkthrough can move on without filling them. */
  const procPages = form.pages.filter((p) => p.who === 'proctor')
  const required = (list?: AffField[]): FlatField[] => {
    if (pattern !== 'page') return list ? flatList(list) : flatFields(form)
    if (list) return procPages.some((p) => p.fields === list) ? [] : flatList(list)
    return flatList(form.pages.filter((p) => p.who !== 'proctor').flatMap((p) => p.fields ?? []).concat(form.fields))
  }
  const filled = (list?: AffField[]) => isFilled(required(list), vals)
  const agreeLabel = form.agreeLabel ?? 'I Agree'

  if (pattern === 'link') {
    const hasFields = flatFields(form).length > 0
    const canAgree = opened && vals.linkread === 'y' && filled()
    return (
      <>
        <div ref={terms} className="aff2-terms" tabIndex={0} aria-label="Affidavit text">
          <WhoBanner who={form.who} form={form} signs={flatFields(form)} />
          <p>
            Before you begin, you must review the attached {form.title}
            {hasFields ? ' and complete the form below:' : '.'}
          </p>
          <button
            type="button"
            className="aff2-link"
            onClick={() => setOpened(true)}
          >
            <FileText size={26} aria-hidden />
            <span>{form.title}</span>
            <ArrowUpRightFromSquare size={20} aria-hidden className="aff2-ext" />
          </button>
          {opened ? (
            <div className="aff2-status" role="status">
              <Check size={18} aria-hidden />
              Document opened.
            </div>
          ) : null}
          <Fields
            ctx={ctx}
            list={[
              {
                id: 'linkread',
                type: 'checkbox',
                required: true,
                label: `I have read ${form.title} and swear the statements above are true`,
              },
            ]}
          />
          {hasFields ? (
            <>
              <hr className="aff2-rule" />
              {form.linkKeep != null ? <Blocks blocks={form.pages[form.linkKeep]?.blocks ?? []} /> : null}
              {form.pages.map((p, i) =>
                p.fields ? (
                  <div key={i}>
                    <WhoBanner who={p.who} form={form} signs={p.fields} />
                    <Fields list={p.fields} ctx={ctx} />
                  </div>
                ) : null,
              )}
              <Fields list={form.fields} ctx={ctx} />
              <Blocks blocks={form.after ?? []} />
            </>
          ) : null}
        </div>
        <div className="aff2-foot">
          <button type="button" className="aff2-btn" disabled={!canAgree} onClick={onAgree}>
            {agreeLabel}
          </button>
        </div>
      </>
    )
  }

  const current = form.pages[page]
  const pageFields = current?.fields
  const nextOk = !!reached[page] && (!pageFields || filled(pageFields))
  return (
    <>
      <div className="aff2-prog" style={{ gridTemplateColumns: `repeat(${form.pages.length}, minmax(0, 1fr))` }}>
        {form.pages.map((_, k) => <i key={k} className={k <= page ? 'is-on' : undefined} />)}
      </div>
      <div ref={terms} className="aff2-terms" tabIndex={0} aria-label="Affidavit text" onScroll={check}>
        {/* A form that is the student's alone carries its banner at the top of the first page (2026-11-09). */}
        {current?.who ? (
          <WhoBanner who={current.who} form={form} signs={current.fields} />
        ) : (
          <WhoBanner who={page === 0 ? form.who : undefined} form={form} signs={flatFields(form)} />
        )}
        <Blocks blocks={current?.blocks ?? []} />
        <Fields list={pageFields} ctx={ctx} />
        {page === last ? (
          <>
            <Fields list={form.fields} ctx={ctx} />
            <Blocks blocks={form.after ?? []} />
          </>
        ) : null}
      </div>
      <div className="aff2-foot">
        {page > 0 ? (
          <button type="button" className="aff2-btn is-sec" onClick={() => setPage(page - 1)}>Back</button>
        ) : null}
        {page < last ? (
          <button
            type="button"
            className="aff2-btn"
            disabled={!nextOk}
            title={nextOk ? undefined : reached[page] ? 'Fill the required fields on this page to continue' : 'Scroll to the end of this page to continue'}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        ) : (
          <button type="button" className="aff2-btn" disabled={!(reached[page] && filled())} onClick={onAgree}>
            {agreeLabel}
          </button>
        )}
      </div>
    </>
  )
}

/* The page dimmed below the review chrome, the modal centred on what is left
   of it — Home, not the whole window (2026-11-04, Afsana: "the modal needs to
   be at the center of the learner home screen"; the explorer pinned it 36
   down). `top` is set at render, so the centre moves with the bars. */
const SCRIM: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 55,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  boxSizing: 'border-box',
  background: 'var(--color-aff-scrim)',
}
