import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AffidavitModal } from '@/components/e2e/AffidavitModal'
import { AffidavitModalV2 } from '@/components/e2e/AffidavitModalV2'
import { resolveAffidavit } from '@/components/e2e/affidavitModalV2Util'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import { ENTRIES, FORMS, STATES, type AffField } from '@/data/affidavitForms'

/**
 * AFFIDAVIT V2 — 2026-11-03, Afsana. The first change V2 makes: the modal
 * does not cover the review chrome. jsdom has no layout, so each case stands
 * the bars up as elements with a faked `getBoundingClientRect`, which is the
 * one thing `useChromeBottom` reads.
 */

/** A stand-in bar: an element with the bar's class whose box ends at `bottom`. */
function bar(className: string, bottom: number, height = 40): HTMLElement {
  const el = document.createElement('div')
  el.className = className
  el.getBoundingClientRect = () =>
    ({ top: bottom - height, bottom, height, left: 0, right: 0, width: 0, x: 0, y: 0 }) as DOMRect
  document.body.appendChild(el)
  return el
}

function scrimOf(): HTMLElement {
  return screen.getByRole('dialog').parentElement as HTMLElement
}

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

describe('AffidavitModalV2', () => {
  it('dims the page from below the lowest bar, not from the top of the window', () => {
    bar('cre-prototype-bar', 44)
    bar('cre-demo-controls', 96)
    bar('cre-demo-controls', 140) // the design bar is a DemoBar too
    render(<AffidavitModalV2 onClose={() => {}} />)
    expect(scrimOf().style.top).toBe('140px')
  })

  it('follows the design bar when it is opened while the modal is up', async () => {
    bar('cre-prototype-bar', 44)
    render(<AffidavitModalV2 onClose={() => {}} />)
    expect(scrimOf().style.top).toBe('44px')
    await act(async () => {
      bar('cre-demo-controls', 120)
      await Promise.resolve() // MutationObserver callbacks are microtasks
    })
    expect(scrimOf().style.top).toBe('120px')
  })

  it('ignores a bar that is mounted but closed (zero height)', () => {
    bar('cre-prototype-bar', 44)
    bar('cre-demo-controls', 300, 0)
    render(<AffidavitModalV2 onClose={() => {}} />)
    expect(scrimOf().style.top).toBe('44px')
  })

  it('centres the modal on Home — the area below the bars — both ways', () => {
    bar('cre-prototype-bar', 44)
    render(<AffidavitModalV2 onClose={() => {}} />)
    expect(scrimOf().style.alignItems).toBe('center')
    expect(scrimOf().style.justifyContent).toBe('center')
  })

  it('covers the whole window when no bar is on screen (?chrome=off)', () => {
    render(<AffidavitModalV2 onClose={() => {}} />)
    expect(scrimOf().style.top).toBe('0px')
  })

  it('sits under the bars’ dropdown menus (60) and over the product shell (51)', () => {
    render(<AffidavitModalV2 onClose={() => {}} />)
    const z = Number(scrimOf().style.zIndex)
    expect(z).toBeGreaterThan(51)
    expect(z).toBeLessThan(60)
  })

  it('leaves V1 as it was: the whole window, at 1000', () => {
    bar('cre-prototype-bar', 44)
    render(<AffidavitModal onClose={() => {}} />)
    expect(scrimOf().style.top).toBe('')
    expect(scrimOf().style.zIndex).toBe('1000')
  })

  it('is on by default on this branch, on the Design bar of both Homes that open it', () => {
    for (const key of ['atlas-affidavit-v2', 'affidavit-v2-moment', 'affidavit-v2-state', 'affidavit-v2-pattern', 'affidavit-v2-language', 'affidavit-v2-loa']) {
      const flag = FEATURE_FLAGS.find((f) => f.key === key)
      expect(flag?.defaultEnabled, key).toBe(true)
      expect(flag?.surface, key).toBe('design')
      // jill-atlas-main is where the invite flow lands (END_TO_END_VERSION).
      expect(flag?.versions, key).toEqual(['jill-atlas-main', 'eric-atlas-e2e'])
    }
  })
})

/* The Affidavit Explorer's forms and patterns (2026-11-03). jsdom has no
   layout, so every page reads as scrolled to its end on arrival — the scroll
   gate itself is a browser check; what is pinned here is the rest. */
describe('AffidavitModalV2 — the explorer’s forms', () => {
  const ready = () => act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))) })

  it('lists every explorer state on the State control, then Non-state specific, and defaults to Florida before the course begins', () => {
    const states = Object.keys(STATES).filter((k) => k !== 'GEN')
    expect(FEATURE_FLAGS.find((f) => f.key === 'affidavit-v2-state')?.variants?.map((v) => v.value)).toEqual([
      ...states.sort((a, b) => STATES[a]!.localeCompare(STATES[b]!)),
      'GEN',
    ])
    render(<AffidavitModalV2 onClose={() => {}} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(FORMS.FL_LH_EN!.title)
  })

  it('reads the Florida notice in Spanish when the course language is Spanish', () => {
    render(<AffidavitModalV2 onClose={() => {}} language="Spanish" />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(FORMS.FL_LH_ES!.title)
    expect(screen.getByRole('dialog').getAttribute('lang')).toBe('es')
  })

  it('picks Florida’s before-course notice by line of authority and language — all four', () => {
    const cases: [string, string, string][] = [
      ['Life & Health', 'English', 'FL_LH_EN'],
      ['Life & Health', 'Spanish', 'FL_LH_ES'],
      ['Property & Casualty', 'English', 'FL_PC_EN'],
      ['Property & Casualty', 'Spanish', 'FL_PC_ES'],
    ]
    for (const [loa, language, key] of cases) {
      render(<AffidavitModalV2 onClose={() => {}} moment="pre" state="FL" lineOfAuthority={loa} language={language} />)
      expect(screen.getByRole('heading', { level: 2 }).textContent, key).toBe(FORMS[key]!.title)
      cleanup()
    }
  })

  it('shows a state’s own line when it has no form for the chosen one', () => {
    // Ohio signs one after-exam form, for Property; asking for Life & Health still shows it.
    expect(resolveAffidavit('post', 'OH', 'English', 'Life & Health').form).toBe(FORMS.OH_POST_P)
    // A state with one form for every line ignores the control.
    expect(resolveAffidavit('pre', 'IL', 'English', 'Property & Casualty').form).toBe(FORMS.IL_PRE)
  })

  it('offers every line of authority the explorer’s forms name', () => {
    const lines = [...new Set(ENTRIES.flatMap((e) => Object.keys(e.variants ?? {})))].sort()
    expect(FEATURE_FLAGS.find((f) => f.key === 'affidavit-v2-loa')?.variants?.map((v) => v.value).sort()).toEqual(lines)
  })

  it('says so when a state has no affidavit at that moment', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="FL" />)
    expect(screen.getByText(/Florida has no affidavit after course exam/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'I Agree' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('pages through the form under one progress segment per page, ending on the form’s own button', async () => {
    const form = FORMS.IL_PRE!
    const onClose = vi.fn()
    const { container } = render(<AffidavitModalV2 onClose={onClose} moment="pre" state="IL" pattern="page" />)
    expect(container.ownerDocument.querySelectorAll('.aff2-prog i')).toHaveLength(form.pages.length)
    for (let i = 0; i < form.pages.length - 1; i++) {
      await ready()
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    }
    await ready()
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy()
    const agree = screen.getByRole('button', { name: form.agreeLabel ?? 'I Agree' }) as HTMLButtonElement
    expect(agree.disabled).toBe(true) // the signature is still empty
    fireEvent.change(screen.getByLabelText(/Student Signature/), { target: { value: 'Jordan Navarro' } })
    expect(agree.disabled).toBe(false)
    fireEvent.click(agree)
    expect(onClose).toHaveBeenCalled()
  })

  it('links out: the button waits for the document to be opened and the box to be ticked', () => {
    const form = FORMS.IL_PRE!
    render(<AffidavitModalV2 onClose={() => {}} moment="pre" state="IL" pattern="link" />)
    fireEvent.change(screen.getByLabelText(/Student Signature/), { target: { value: 'Jordan Navarro' } })
    const agree = screen.getByRole('button', { name: form.agreeLabel ?? 'I Agree' }) as HTMLButtonElement
    fireEvent.click(screen.getByLabelText(/I have read .* and swear/))
    expect(agree.disabled).toBe(true) // not opened yet
    fireEvent.click(screen.getByRole('button', { name: new RegExp(form.title) }))
    expect(screen.getByRole('status').textContent).toMatch(/Document opened/)
    fireEvent.click(screen.getByRole('button', { name: 'Back to the affidavit' }))
    expect(agree.disabled).toBe(false)
  })

  it('has no Link out after the course exam — it shows as Pagination', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="IL" pattern="link" />)
    expect(screen.queryByText(/I have read .* and swear/)).toBeNull()
    expect(document.querySelectorAll('.aff2-prog i').length).toBe(FORMS.IL_POST!.pages.length)
  })

  it('pre-fills the learner and locks today’s date', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="pre" state="KY" pattern="link" />)
    const dates = screen.getAllByLabelText(/Today.s Date/) as HTMLInputElement[]
    expect(dates[0]!.readOnly).toBe(true)
    expect(dates[0]!.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect((screen.getByLabelText(/^City/) as HTMLInputElement).value).toBe('Frankfort')
  })

  it('asks the learner to confirm pre-filled details without boxing the checkbox in red', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="pre" state="KY" pattern="link" />)
    const confirm = screen.getByLabelText(/I confirm that the above information is accurate/) as HTMLInputElement
    expect(confirm.closest('.aff2-flag')).toBeNull()
    expect(confirm.checked).toBe(false) // never pre-ticked: the learner vouches for it
  })

  it('puts back the bullets and numbers Tailwind’s reset takes off every list', () => {
    // jsdom applies no stylesheet, so the rule itself is what is pinned.
    const css = readFileSync(resolve(__dirname, '../components/e2e/affidavitModalV2.css'), 'utf8')
    expect(css).toMatch(/\.aff2-terms ul,\s*\.aff2-docbody ul \{ list-style: disc; \}/)
    expect(css).toMatch(/\.aff2-terms ol,\s*\.aff2-docbody ol \{ list-style: decimal; \}/)
    // Kentucky's "I received… / I understand… / My signature…" are a bulleted list, not a plain one.
    const statements = FORMS.KY_PRE!.pages
      .flatMap((p) => p.blocks ?? [])
      .find((b) => b.ulh?.some((t) => t.startsWith('I received a copy of the catalog')))
    expect(statements?.ulh).toHaveLength(3)
    expect(statements?.plain).toBeUndefined()
  })

  it('Illinois after the exam: no roster heading and no red box, the SSN field kept', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="IL" pattern="page" />)
    const last = FORMS.IL_POST!.pages.length - 1
    for (let i = 0; i < last; i++) fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByText('Course Completion Roster upload form')).toBeNull()
    const ssn = screen.getByLabelText(/Full SSN/)
    expect(ssn.closest('.aff2-flag')).toBeNull()
    expect(screen.getByText(/Education providers are required to collect/)).toBeTruthy()
  })

  it('California after the exam: no roster heading, everything else kept', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="CA" pattern="page" />)
    const last = FORMS.CA_POST_LH!.pages.length - 1
    for (let i = 0; i < last; i++) fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByText('Course Completion Roster upload form')).toBeNull()
    expect(screen.getByText(/Education providers are required to collect/)).toBeTruthy()
    expect(screen.getByLabelText(/Last four of SSN/)).toBeTruthy()
    // The Student Legal Name keeps its red box — only the heading went.
    expect(screen.getByText('Student Legal Name (first and last name)').closest('.aff2-flag')).not.toBeNull()
  })

  /* THE SIX STATE-SPECIFIC FINAL AFFIDAVITS match their documents field for
     field (2026-11-04, Afsana's "State Specific Affidavit" folder) — the
     documents' own labels, in the documents' order. The one addition is the
     product's "I confirm that the above information is accurate", kept on
     purpose and left out of these lists. */
  const STATE_DOCUMENT_FIELDS: Record<string, string[]> = {
    NY_POST: ['Full Name', 'Today’s Date'],
    CO_POST: ['Course Name', 'Date of Pre-licensing Final Exam', 'Student Full Name', 'Date', 'Relationship to Examinee', 'Proctor Address', 'Proctor Name (print)', 'Proctor Signature'],
    CT_POST: ['Course Name', 'Date of Prelicensing Final Exam', 'Student Full Name', 'Date', 'Relationship to Examinee', 'Proctor Address', 'Proctor Name (print)', 'Proctor Signature'],
    MN_POST: [
      'Name of Exam', 'Date & Time of Exam Completion', 'Company & Address where exam was completed', 'City', 'State', 'Zip Code',
      'Name', 'License #', 'Date of Birth',
      'Business Address', 'City', 'State', 'Zip Code',
      'Mailing Address (if different than above)', 'City', 'State', 'Zip Code',
      'Daytime Phone', 'E-mail', 'Student Signature', 'Date',
      'Proctor’s Full Legal Name', 'Note your type of relationship to the student.', 'Proctor Signature', 'Date', 'Employer & Job Title',
      'Business Address', 'City', 'State', 'Zip Code', 'Business/Daytime Phone', 'E-mail',
    ],
    WI_POST: ['Student Full Name', 'Today’s Date', 'Proctor Full Address', 'Proctor Phone Number', 'Proctor Full Name', 'Relationship to Examinee', 'Today’s Date'],
    WV_POST: ['Student Full Name', 'Relationship to Examinee', 'Proctor Full Name', 'Today’s Date'],
  }
  const formFields = (key: string) => {
    const flat = (l: AffField[] = []): AffField[] =>
      l.flatMap((x) => (x.flagGroup ? flat(x.flagGroup) : x.depGroup ? flat(x.items) : x.block ? [] : x.row ? x.row : [x]))
    const f = FORMS[key]!
    return flat(f.pages.flatMap((p) => p.fields ?? []).concat(f.fields)).filter((x) => x.id !== 'agree')
  }

  it.each(Object.keys(STATE_DOCUMENT_FIELDS))('%s asks for exactly the fields on its state document', (key) => {
    // The data writes Today's Date with a straight apostrophe; compare the words.
    const norm = (s?: string) => (s ?? '').replace(/[’']/g, '’')
    expect(formFields(key).map((x) => norm(x.label))).toEqual(STATE_DOCUMENT_FIELDS[key])
  })

  it('never splits a name on the state-specific forms, and leaves e-signature names empty', () => {
    for (const key of Object.keys(STATE_DOCUMENT_FIELDS)) {
      const ids = formFields(key).map((x) => x.id)
      for (const split of ['first', 'middle', 'last', 'suffix']) expect(ids, `${key} ${split}`).not.toContain(split)
    }
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="NY" pattern="page" />)
    expect((screen.getByLabelText(/^Full Name/) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/Today.s Date/) as HTMLInputElement).readOnly).toBe(true)
  })

  it('Minnesota: where the exam was completed is not boxed in red', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="MN" pattern="page" />)
    const company = screen.getByLabelText(/Company & Address where exam was completed/)
    expect(company.closest('.aff2-flag')).toBeNull()
    expect(document.querySelectorAll('.aff2-flag')).toHaveLength(0)
  })

  it('Minnesota: the mailing address is optional, with no "same as" checkbox', () => {
    const fields = formFields('MN_POST')
    expect(fields.find((x) => x.id === 'mail_same')).toBeUndefined()
    expect(fields.filter((x) => x.id?.startsWith('mail_')).every((x) => !x.required)).toBe(true)
  })

  /* NON-STATE SPECIFIC (2026-11-04) — XCEL's own forms, from Afsana's
     "Non-State Specific" folder. */
  it('Non-state specific, before the course begins: the generic Terms and Conditions, English then Spanish', async () => {
    const onClose = vi.fn()
    render(<AffidavitModalV2 onClose={onClose} moment="pre" state="GEN" pattern="page" />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('XCEL Generic Terms and Conditions')
    expect(screen.getByText('Acknowledgement of Terms and Conditions of Pre-licensing Course Completion')).toBeTruthy()
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await ready()
    expect(screen.getByText(/Reconocimiento de los Términos y Condiciones/)).toBeTruthy()
    const name = screen.getByLabelText(/Student Full Name/) as HTMLInputElement
    expect(name.value).toBe('') // typed, not pre-filled: it is the signature
    expect(screen.queryByLabelText(/I confirm that the above information is accurate/)).toBeNull()
    const agree = screen.getByRole('button', { name: 'I Agree' }) as HTMLButtonElement
    expect(agree.disabled).toBe(true)
    fireEvent.change(name, { target: { value: 'Jordan Navarro' } })
    fireEvent.click(agree)
    expect(onClose).toHaveBeenCalled()
  })

  it('Non-state specific, before the course exam: the general attestation, signed with Attest', async () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="exam" state="GEN" pattern="page" />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'Prelicensing Education Insurance - Proctor acknowledgement and Student attestation',
    )
    expect(screen.getByText('THIS EXAM MUST BE MONITORED BY A DISINTERESTED THIRD PARTY PROCTOR')).toBeTruthy()
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await ready()
    expect(screen.getByText('Student Attestation:')).toBeTruthy()
    expect(screen.getByText('Student E-Signature:')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Attest' })).toBeTruthy()
  })

  it('Non-state specific, after the course exam: none, and the modal says so in words that fit', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="GEN" />)
    expect(screen.getByText(/There’s no non-state specific affidavit after course exam/)).toBeTruthy()
  })

  it('resolves every ready entry in the explorer to a form', () => {
    for (const e of ENTRIES) {
      const r = resolveAffidavit(e.m, e.st, 'English')
      if (e.status === 'ready' || e.variants) expect(r.form, `${e.m} ${e.st}`).not.toBeNull()
      else expect(r.form, `${e.m} ${e.st}`).toBeNull()
    }
  })
})
