import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AffidavitModal } from '@/components/e2e/AffidavitModal'
import { AffidavitModalV2, LinkedDocument } from '@/components/e2e/AffidavitModalV2'
import { resolveAffidavit, withoutMiddle } from '@/components/e2e/affidavitModalV2Util'
import { MemoryRouter } from 'react-router-dom'
import { FEATURE_FLAGS, FeatureFlagProvider, designControlsFor, useFeatureFlags } from '@/context/FeatureFlagContext'
import { ENTRIES, FORMS, NAMED_FORMS, SIGNED_FORMS, COMPLETION_DATE_NOTE, PROCTOR_FORMS, SSN_REASON, STATE_SPECIFIC_FORMS, STATES, type AffField, type AffidavitMoment } from '@/data/affidavitForms'

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
  /* 2026-11-10, Afsana: Home does not scroll behind the modal, and every
     affidavit is the same size — Link out no longer shrinks to its content. */
  it('locks Home’s scrolling while it is open, and gives it back on close', () => {
    const { unmount } = render(<AffidavitModalV2 onClose={() => {}} moment="post" state="CA" />)
    expect([document.documentElement.style.overflow, document.body.style.overflow]).toEqual(['hidden', 'hidden'])
    unmount()
    expect([document.documentElement.style.overflow, document.body.style.overflow]).toEqual(['', ''])
  })

  it('is one size whatever the form or pattern: CA after the exam (Link out) as CT (pages)', () => {
    const cls = (state: string) => {
      const { unmount } = render(<AffidavitModalV2 onClose={() => {}} moment="post" state={state} />)
      const c = screen.getByRole('dialog').className
      unmount()
      return c
    }
    /* The Design bar's skin class rides along on the root (2026-11-10); what
       this pins is that the SIZE does not change with the form or pattern,
       so compare the two rather than spelling the class out. */
    expect(cls('CA')).toBe(cls('CT'))
    expect(cls('CA')).not.toMatch(/is-tall/)
    const css = readFileSync(resolve(__dirname, '../components/e2e/affidavitModalV2.css'), 'utf8')
    expect(css).toMatch(/\.aff2-modal \{[^}]*\bheight: 688px;/)
    expect(css).not.toMatch(/is-tall/)
  })

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
/* The banner is an eyebrow over the document's own sentence (Jill,
   2026-11-10), so `.textContent` runs the two together. These read the halves
   apart, which is what every assertion below actually means. */
const bannerBody = (el: HTMLElement) => el.querySelector('.aff2-banner__body')?.textContent
const bannerEyebrow = (el: HTMLElement) => el.querySelector('.aff2-banner__eyebrow')?.textContent

describe('AffidavitModalV2 — the explorer’s forms', () => {
  /* Link out is the only pattern (2026-11-10): the document's text is behind
     its link. Since the same day the link only marks it opened and the modal
     shows no document, so this clicks it, checks nothing opened, and renders
     the (unwired) LinkedDocument for that form on its own to read it. */
  const openDoc = (moment: AffidavitMoment, state: string, language = 'English') => {
    fireEvent.click(document.querySelector('.aff2-link') as HTMLElement)
    expect(screen.queryByRole('document')).toBeNull()
    const { container } = render(<LinkedDocument form={resolveAffidavit(moment, state, language).form!} onBack={() => {}} />)
    return within(container)
  }
  const readAndSwear = () => fireEvent.click(screen.getByLabelText(/I have read .* and swear/))
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

  /* 2026-11-10, Afsana: the Affidavit pattern is Link out and nothing else;
     Pagination is part of the forms that need it (after the course exam). */
  it('links out before the course exam, and offers no Pagination on the Design bar', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'affidavit-v2-pattern')!
    expect(flag.variants!.map((v) => v.value)).toEqual(['link'])
    expect(flag.defaultVariant).toBe('link')
    for (const [moment, state] of [['pre', 'IL'], ['pre', 'OH'], ['pre', 'KY'], ['exam', 'FL'], ['exam', 'GEN'], ['exam', 'CO']] as const) {
      const { unmount } = render(<AffidavitModalV2 onClose={() => {}} moment={moment} state={state} />)
      expect(screen.getByLabelText(/I have read .* and swear/), `${moment} ${state}`).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Next' }), `${moment} ${state}`).toBeNull()
      unmount()
    }
  })

  it('pages through a form that needs it — Colorado after the exam — and back', async () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="CO" />)
    expect(document.querySelectorAll('.aff2-prog i')).toHaveLength(FORMS.CO_POST!.pages.length)
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
    fireEvent.change(screen.getAllByLabelText(/^Signature/)[0]!, { target: { value: 'Jordan Navarro' } })
    fireEvent.click(screen.getByLabelText(/I confirm that the above information is accurate/))
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Must be completed and signed by exam monitor')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Must be completed and signed by the student')).toBeTruthy()
  })

  /* 2026-11-11, Afsana: the sentence says to click the link, and names the
     document an attestation or an affidavit by its title. */
  it('links out: tells the student to click the link to review the document, by what it is', () => {
    const FORM = ' and complete the form below:'
    // Colorado's attestation and Florida's notice have nothing to fill in, so the sentence ends there.
    // The documents that are neither affidavit nor attestation are called what they are.
    for (const [moment, state, end] of [
      ['pre', 'IL', 'affidavit' + FORM], ['exam', 'CO', 'attestation.'], ['exam', 'GEN', 'attestation' + FORM],
      ['pre', 'FL', 'notice.'], ['pre', 'KY', 'enrollment agreement' + FORM], ['pre', 'CA', 'terms and conditions' + FORM],
      ['pre', 'GEN', 'terms and conditions' + FORM], ['pre', 'OH', 'registration form' + FORM], ['post', 'NY', 'affidavit' + FORM],
    ] as const) {
      const { unmount } = render(<AffidavitModalV2 onClose={() => {}} moment={moment} state={state} />)
      expect(screen.getByText(/^Before you begin/).textContent, `${moment} ${state}`).toBe(
        `Before you begin, you must click the link below to review the ${end}`,
      )
      unmount()
    }
  })

  it('links out: the button waits for the document to be opened and the box to be ticked', () => {
    const form = FORMS.IL_PRE!
    render(<AffidavitModalV2 onClose={() => {}} moment="pre" state="IL" />)
    fireEvent.change(screen.getByLabelText(/^Signature/), { target: { value: 'Jordan Navarro' } })
    fireEvent.click(screen.getByLabelText(/I confirm that the above information is accurate/))
    const agree = screen.getByRole('button', { name: form.agreeLabel ?? 'I Agree' }) as HTMLButtonElement
    fireEvent.click(screen.getByLabelText(/I have read .* and swear/))
    expect(agree.disabled).toBe(true) // not opened yet
    fireEvent.click(screen.getByRole('button', { name: new RegExp(form.title) }))
    expect(screen.getByRole('status').textContent).toMatch(/Document opened/)
    // 2026-11-10, Afsana: the link shows no document — only the banner.
    expect(screen.queryByRole('document')).toBeNull()
    expect(screen.queryByText(/TERMS AND CONDITIONS|Acknowledgement/)).toBeNull()
    expect(agree.disabled).toBe(false)
  })

  /* 2026-11-10, Afsana: after the exam, only the forms with an exam monitor's
     page show in full; the rest link out like every other moment. */
  it('links out after the course exam too, unless the exam monitor has a page', () => {
    for (const state of ['CA', 'IL', 'OH', 'NY']) {
      const { unmount } = render(<AffidavitModalV2 onClose={() => {}} moment="post" state={state} />)
      expect(screen.getByLabelText(/I have read .* and swear/), state).toBeTruthy()
      expect(document.querySelector('.aff2-prog'), state).toBeNull()
      unmount()
    }
    for (const state of ['CO', 'CT', 'MN', 'WV', 'WI']) {
      const { unmount } = render(<AffidavitModalV2 onClose={() => {}} moment="post" state={state} />)
      expect(screen.queryByLabelText(/I have read .* and swear/), state).toBeNull()
      expect(document.querySelector('.aff2-prog'), state).not.toBeNull()
      unmount()
    }
  })

  it('pre-fills the learner and locks today’s date', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="pre" state="KY" />)
    const dates = screen.getAllByLabelText(/Today.s Date/) as HTMLInputElement[]
    expect(dates[0]!.readOnly).toBe(true)
    expect(dates[0]!.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect((screen.getByLabelText(/^City/) as HTMLInputElement).value).toBe('Frankfort')
  })

  it('asks the learner to confirm pre-filled details without boxing the checkbox in red', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="pre" state="KY" />)
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

  it('Illinois after the exam: no roster heading and no red box, the SSN field kept, with the sheet’s reason for it', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="IL" />)
    const last = FORMS.IL_POST!.pages.length - 1
    for (let i = 0; i < last; i++) fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByText('Course Completion Roster upload form')).toBeNull()
    const ssn = screen.getByLabelText(/Full SSN/)
    expect(ssn.closest('.aff2-flag')).toBeNull()
    expect(screen.queryByText(/Education providers are required to collect/)).toBeNull()
    expect(screen.getByText(SSN_REASON)).toBeTruthy()
  })

  it('California after the exam: no roster heading, the sheet’s SSN reason in place of the old sentence', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="CA" />)
    const last = FORMS.CA_POST_LH!.pages.length - 1
    for (let i = 0; i < last; i++) fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByText('Course Completion Roster upload form')).toBeNull()
    expect(screen.queryByText(/Education providers are required to collect/)).toBeNull()
    expect(screen.getByText(SSN_REASON)).toBeTruthy()
    expect(screen.getByLabelText(/Last four of SSN/)).toBeTruthy()
    // Since 2026-11-09: no red box round the name, and no "Student Legal Name" heading.
    expect(screen.queryByText('Student Legal Name (first and last name)')).toBeNull()
    expect(screen.getByLabelText(/^First Name/).closest('.aff2-flag')).toBeNull()
  })

  /* 2026-11-09, Afsana: Ohio's registration loses "TO BE COMPLETED BY
     STUDENT:" (the banner says it), Ohio's after-exam affidavit loses its red
     box, and "The date on this affidavit is the course completion date." is
     smaller print on every form that has it. */
  it('Ohio: no "to be completed by student" heading before the course, no red box after the exam', async () => {
    const { unmount } = render(<AffidavitModalV2 onClose={() => {}} moment="pre" state="OH" />)
    expect(screen.getByLabelText(/^First Name/)).toBeTruthy()
    expect(screen.queryByText(/TO BE COMPLETED BY STUDENT/i)).toBeNull()
    expect(openDoc('pre', 'OH').queryByText(/TO BE COMPLETED BY STUDENT/i)).toBeNull()
    unmount()
    const { container } = render(<AffidavitModalV2 onClose={() => {}} moment="post" state="OH" />)
    expect(container.ownerDocument.querySelector('.aff2-flag')).toBeNull()
    expect(screen.getByLabelText(/Last 4 of SSN/)).toBeTruthy()
  })

  it('Colorado and Connecticut after the exam: no signature or exam-monitor headings, no date hint', () => {
    for (const key of ['CO_POST', 'CT_POST']) {
      const text = JSON.stringify(FORMS[key])
      expect(text, key).not.toContain('Student Signature:')
      expect(text, key).not.toContain('To be completed and Signed by Exam Monitor')
      expect(text, key).not.toContain('street address, city, state, zip code')
      expect(text, key).not.toContain('mm/dd/yyyy')
    }
  })

  it('takes the proctor’s name, signature and address the way it takes the student’s — never pre-filled', async () => {
    expect(PROCTOR_FORMS.sort()).toEqual(['CO_POST', 'CT_POST', 'MN_POST', 'WI_POST', 'WV_POST'])
    for (const key of PROCTOR_FORMS) {
      const ids = FORMS[key]!.pages.filter((p) => p.who === 'proctor').flatMap((p) => flatAll(p.fields)).map((x) => x.id)
      for (const id of ['p_first', 'p_middle', 'p_last', 'p_sig']) expect(ids, `${key} ${id}`).toContain(id)
      expect(ids, key).not.toContain('p_name')
      expect(ids.indexOf('p_last'), key).toBeLessThan(ids.indexOf('p_sig'))
      const labels = FORMS[key]!.pages.flatMap((p) => flatAll(p.fields)).map((x) => x.label ?? '')
      expect(labels.filter((l) => /^Proctor/.test(l)), key).toEqual([])
      expect(JSON.stringify(FORMS[key]), key).not.toContain('Proctor E-Signature')
    }
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="WV" />)
    // The student's names are pre-filled; on the next page the proctor's are not.
    expect((screen.getByLabelText(/^First Name/) as HTMLInputElement).value).toBe('Jordan')
    fireEvent.change(screen.getByLabelText(/^Signature/), { target: { value: 'Jordan Navarro' } })
    fireEvent.click(screen.getByLabelText(/I confirm that the above information is accurate/))
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Must be completed and signed by the proctor')).toBeTruthy()
    expect((screen.getByLabelText(/^First Name/) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/^Signature/) as HTMLInputElement).value).toBe('')
  })

  it('Wisconsin after the exam: the exam monitor’s banner says "completed and signed"', async () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="WI" />)
    fireEvent.change(screen.getByLabelText(/^Signature/), { target: { value: 'Jordan Navarro' } })
    fireEvent.click(screen.getByLabelText(/I confirm that the above information is accurate/))
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    const monitorNote = screen.getByRole('note')
    expect(bannerBody(monitorNote)).toBe('Must be completed and signed by exam monitor')
    expect(bannerEyebrow(monitorNote)).toBe('Proctor action required')
    expect(screen.getByLabelText(/^Phone Number/)).toBeTruthy()
  })

  /* 2026-11-10, Afsana: in Link out the enrollment agreements' "By clicking on
     the confirmation button below…" is left to the linked document. */
  it('keeps none of a document’s text in the modal in Link out — Minnesota’s Student Attestation included', () => {
    expect(Object.entries(FORMS).filter(([, f]) => f!.linkKeep != null).map(([k]) => k)).toEqual([])
    render(<AffidavitModalV2 onClose={() => {}} moment="exam" state="MN" />)
    expect(screen.queryByText(/I declare that I will personally complete this exam/)).toBeNull()
    expect(screen.getByLabelText(/^First Name/)).toBeTruthy() // the fields stay
    expect(openDoc('exam', 'MN').getByText(/I declare that I will personally complete this exam/)).toBeTruthy()
  })

  it('Link out leaves the enrollment agreements’ last page — the sentence and its bullets — to the linked document', () => {
    const SENTENCE = /By clicking on the confirmation button below/
    for (const state of ['KY', 'NV', 'OR']) {
      render(<AffidavitModalV2 onClose={() => {}} moment="pre" state={state} />)
      expect(screen.queryByText(SENTENCE), state).toBeNull()
      expect(screen.queryByText(/I received a copy of the catalog/), state).toBeNull()
      expect(screen.getByLabelText(/^First Name/), state).toBeTruthy() // the fields stay
      const doc = openDoc('pre', state)
      expect(doc.getByText(SENTENCE), state).toBeTruthy()
      expect(doc.getByText(/I received a copy of the catalog/), state).toBeTruthy()
      cleanup() // the modal and the document rendered beside it
    }
  })

  /* 2026-11-10, Afsana: the proctor's banner names the document's word for
     them and, since every proctor page has a Signature, says "signed". */
  it('names the exam monitor on CO, CT and WI and the proctor on WV and MN', () => {
    const word = (k: string) => FORMS[k]!.proctorWord ?? 'the proctor'
    expect(['CO_POST', 'CT_POST', 'WI_POST'].map(word)).toEqual(['exam monitor', 'exam monitor', 'exam monitor'])
    expect(['WV_POST', 'MN_POST'].map(word)).toEqual(['the proctor', 'the proctor']) // "by the proctor" (2026-11-10)
    for (const key of PROCTOR_FORMS)
      expect(FORMS[key]!.pages.filter((p) => p.who === 'proctor').some((p) => flatAll(p.fields).some((x) => x.id === 'p_sig')), key).toBe(true)
  })

  it('titles Minnesota’s terms with the state’s name, as Illinois’s are not', () => {
    expect(FORMS.MN_PRE!.title).toBe('Minnesota Prelicensing Terms and Conditions Pre-Course Affidavit')
    expect(FORMS.IL_PRE!.title).toBe('Terms and Conditions Pre-Course Affidavit')
  })

  it('sets the course-completion-date sentence in smaller print wherever it appears', () => {
    const withIt = Object.entries(FORMS).filter(([, f]) => JSON.stringify(f).includes(COMPLETION_DATE_NOTE)).map(([k]) => k)
    expect(withIt.length).toBeGreaterThanOrEqual(4)
    for (const key of withIt) expect(JSON.stringify(FORMS[key]), key).not.toMatch(/"p":"The date on this affidavit is the course completion date\."(?!,"fine":true)/)
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="IL" />)
    expect(screen.getByText(COMPLETION_DATE_NOTE).className).toBe('aff2-fine')
  })

  /* THE SIX STATE-SPECIFIC FINAL AFFIDAVITS match their documents field for
     field (2026-11-04, Afsana's "State Specific Affidavit" folder) — the
     documents' own labels, in the documents' order — with one exception since
     2026-11-06: the student's name and signature are the standard block every
     signed form uses (First / Middle / Last Name, pre-filled, then an empty
     Signature), in the place of the document's own name and signature.
     The product's "I confirm that the above information is accurate" is kept
     on purpose and left out of these lists. */
  const SIGNER = ['First Name', 'Middle Name', 'Last Name', 'Signature']
  /* And the proctor's name, signature and address the same way (2026-11-09). */
  const ADDRESS = ['Address Line 1', 'Address Line 2 (Optional)', 'City', 'State', 'Zip']
  const MAILING = ADDRESS // MN's, all optional — the labels are the same
  const STATE_DOCUMENT_FIELDS: Record<string, string[]> = {
    NY_POST: [...SIGNER, 'Today’s Date'],
    CO_POST: ['Course Name', 'Date of Pre-licensing Final Exam', ...SIGNER, 'Date', 'Relationship to Examinee', ...ADDRESS, ...SIGNER],
    CT_POST: ['Course Name', 'Date of Prelicensing Final Exam', ...SIGNER, 'Date', 'Relationship to Examinee', ...ADDRESS, ...SIGNER],
    MN_POST: [
      'Name of Exam', 'Exam Completion Date', 'Time of Exam Completion', ...ADDRESS,
      'First Name', 'Middle Name', 'Last Name', 'License #', 'Date of Birth',
      ...ADDRESS, ...MAILING, 'Phone Number', 'Email Address', 'Signature', 'Today’s Date',
      'First Name', 'Middle Name', 'Last Name', 'Relationship to Examinee', 'Signature', 'Today’s Date',
      'Employer & Job Title', ...ADDRESS, 'Phone Number', 'Email Address',
    ],
    WI_POST: [...SIGNER, 'Today’s Date', ...ADDRESS, 'Phone Number', ...SIGNER, 'Relationship to Examinee', 'Today’s Date'],
    WV_POST: [...SIGNER, 'Relationship to Examinee', ...SIGNER, 'Today’s Date'],
  }
  const flatAll = (l: AffField[] = []): AffField[] =>
    l.flatMap((x) => (x.flagGroup ? flatAll(x.flagGroup) : x.depGroup ? flatAll(x.items) : x.block ? [] : x.row ? x.row : [x]))
  const formFields = (key: string) => {
    const flat = (l: AffField[] = []): AffField[] =>
      l.flatMap((x) => (x.flagGroup ? flat(x.flagGroup) : x.depGroup ? flat(x.items) : x.block ? [] : x.row ? x.row : [x]))
    const f = FORMS[key]!
    return flat(f.pages.flatMap((p) => p.fields ?? []).concat(f.fields)).filter((x) => x.id !== 'agree')
  }

  it.each(Object.keys(STATE_DOCUMENT_FIELDS))('%s asks for the fields on its state document, signed the standard way', (key) => {
    // The data writes Today's Date with a straight apostrophe; compare the words.
    const norm = (s?: string) => (s ?? '').replace(/[’']/g, '’')
    expect(formFields(key).map((x) => norm(x.label))).toEqual(STATE_DOCUMENT_FIELDS[key])
  })

  /* ONE WAY TO SIGN (2026-11-06, after the Nov 5 review): every form with a
     signature line or label shows the same block, whatever the document
     calls it. */
  it('signs every form that has a signature the same way: names pre-filled, the signature typed', () => {
    expect(SIGNED_FORMS).toHaveLength(15)
    for (const key of SIGNED_FORMS) {
      const ids = formFields(key).map((x) => x.id)
      for (const id of ['first', 'middle', 'last', 'sig']) expect(ids, `${key} ${id}`).toContain(id)
      for (const id of ['suffix', 'fullname', 'name']) expect(ids, `${key} ${id}`).not.toContain(id)
      expect(ids.filter((id) => id === 'sig'), key).toHaveLength(1)
      expect(ids.indexOf('last'), key).toBeLessThan(ids.indexOf('sig'))
      const f = FORMS[key]!
      const all = flatAll(f.fields.concat(...f.pages.map((p) => p.fields ?? [])))
      expect(all.some((x) => x.id === 'agree'), `${key} confirm box`).toBe(true)
    }
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="NY" />)
    expect((screen.getByLabelText(/^First Name/) as HTMLInputElement).value).toBe('Jordan')
    expect((screen.getByLabelText(/^Middle Name/) as HTMLInputElement).value).toBe('Lee')
    expect((screen.getByLabelText(/^Last Name/) as HTMLInputElement).value).toBe('Navarro')
    expect((screen.getByLabelText(/^Signature/) as HTMLInputElement).value).toBe('')
    expect(screen.queryByText('Student E-Signature:')).toBeNull() // dropped everywhere, 2026-11-09
    expect((screen.getByLabelText(/Today.s Date/) as HTMLInputElement).readOnly).toBe(true)
  })

  it('signs Illinois’s terms — a signature line and nothing else — with the names above it', () => {
    expect(formFields('IL_PRE').map((x) => x.id)).toEqual(['first', 'middle', 'last', 'sig'])
  })

  /* AND ONE WAY TO TAKE A NAME (2026-11-06): the forms that ask for a name
     with no signature take the same name block, and no signature box. */
  it('takes the name the same way on the forms with a name and no signature', () => {
    expect(NAMED_FORMS).toEqual(['CA_PRE', 'GEN_PRE_EN', 'GEN_PRE_ES', 'KY_PRE', 'NV_PRE', 'OR_PRE'])
    for (const key of NAMED_FORMS) {
      const ids = formFields(key).map((x) => x.id)
      for (const id of ['first', 'middle', 'last']) expect(ids, `${key} ${id}`).toContain(id)
      for (const id of ['suffix', 'fullname', 'name', 'sig']) expect(ids, `${key} ${id}`).not.toContain(id)
      const f = FORMS[key]!
      expect(flatAll(f.fields.concat(...f.pages.map((pg) => pg.fields ?? []))).some((x) => x.id === 'agree'), key).toBe(true)
    }
    expect(formFields('GEN_PRE_EN').map((x) => x.id)).toEqual(['first', 'middle', 'last'])
  })

  /* MIDDLE NAME IS UNDECIDED (2026-11-06): a Design bar control. */
  it('drops Middle Name when the Design bar’s Affidavit middle name is Off', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'affidavit-v2-middle')!
    expect(flag.surface).toBe('design')
    expect(flag.defaultVariant).toBe('show')
    for (const key of SIGNED_FORMS) {
      const f = withoutMiddle(FORMS[key]!)
      const ids = flatAll(f.fields.concat(...f.pages.map((p) => p.fields ?? []))).map((x) => x.id)
      expect(ids, key).not.toContain('middle')
      expect(ids, key).toContain('first')
    }
  })

  /* 2026-11-10, Afsana: Minnesota after the exam follows OCD and the
     standard fields rather than the PDF. */
  it('Minnesota: where the exam was completed is the standard address, not boxed in red', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="MN" />)
    expect(screen.getByText('Address where exam was completed')).toBeTruthy()
    expect(document.querySelectorAll('.aff2-flag')).toHaveLength(0)
    for (const h of ['Student / Licensee Name and Certification', 'Student’s Full Legal Name, License Number, & DOB', 'Must match exam'])
      expect(screen.queryByText(h), h).toBeNull()
  })

  /* Sarah, 2026-11-10: what is on the state form is collected, whatever OCD
     skips — License #, the Mailing Address, Employer & Job Title, the
     proctor's e-mail. */
  it('Minnesota: collects what the state form asks for — the mailing address optional', () => {
    const fields = formFields('MN_POST')
    const req = (id: string) => fields.find((x) => x.id === id)?.required
    expect(['license', 'p_job', 'p_email'].map(req)).toEqual([true, true, true])
    expect(['mail_addr1', 'mail_city', 'mail_state', 'mail_zip'].map(req)).toEqual([undefined, undefined, undefined, undefined])
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="MN" />)
    expect(screen.getByText('Mailing Address (if different than above)')).toBeTruthy()
  })

  it('Minnesota: exam date and time pre-filled and locked; the student’s address pre-filled', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="MN" />)
    const date = screen.getByLabelText(/^Exam Completion Date/) as HTMLInputElement
    const time = screen.getByLabelText(/^Time of Exam Completion/) as HTMLInputElement
    expect([date.readOnly, time.readOnly, time.value]).toEqual([true, true, '10:30'])
    expect(date.value).not.toBe('')
    expect((screen.getAllByLabelText(/^Address Line 1/)[1] as HTMLInputElement).value).toBe('1420 Maple Avenue')
    expect((screen.getAllByLabelText(/^Address Line 1/)[0] as HTMLInputElement).value).toBe('') // where the exam was
    const ids = formFields('MN_POST').map((x) => x.id)
    for (const id of ['examdt', 'bus_addr', 'p_bus_addr']) expect(ids, id).not.toContain(id)
    const rel = formFields('MN_POST').find((x) => x.id === 'p_rel')!
    expect([rel.type, rel.label, rel.options]).toEqual(['radio', 'Relationship to Examinee', ['Co-Worker (neither above or below the line of supervision)', 'Librarian', 'Neighbor']])
  })

  /* NON-STATE SPECIFIC (2026-11-04) — XCEL's own forms, from Afsana's
     "Non-State Specific" folder. */
  it('Non-state specific, before the course begins, in English: the English terms only', async () => {
    const onClose = vi.fn()
    render(<AffidavitModalV2 onClose={onClose} moment="pre" state="GEN" language="English" />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('XCEL Generic Terms and Conditions')
    // The standard name block since 2026-11-06: pre-filled, so confirmed.
    expect((screen.getByLabelText(/^First Name/) as HTMLInputElement).value).toBe('Jordan')
    expect(screen.queryByLabelText(/^Signature/)).toBeNull()
    const agree = screen.getByRole('button', { name: 'I Agree' }) as HTMLButtonElement
    fireEvent.click(screen.getByLabelText(/I confirm that the above information is accurate/))
    readAndSwear()
    expect(agree.disabled).toBe(true) // the document not opened yet
    const doc = openDoc('pre', 'GEN')
    expect(doc.getByText('Acknowledgement of Terms and Conditions of Pre-licensing Course Completion')).toBeTruthy()
    expect(doc.queryByText(/Reconocimiento de los Términos y Condiciones/)).toBeNull()
    expect(agree.disabled).toBe(false)
    fireEvent.click(agree)
    expect(onClose).toHaveBeenCalled()
  })

  it('Non-state specific, before the course begins, in Spanish: the Spanish terms only, as Florida’s are', async () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="pre" state="GEN" language="Spanish" />)
    expect(screen.getByRole('dialog').getAttribute('lang')).toBe('es')
    expect(screen.getByRole('button', { name: 'Acepto' })).toBeTruthy()
    const doc = openDoc('pre', 'GEN', 'Spanish')
    expect(doc.getByText(/Reconocimiento de los Términos y Condiciones/)).toBeTruthy()
    expect(doc.queryByText('Acknowledgement of Terms and Conditions of Pre-licensing Course Completion')).toBeNull()
  })

  it('Non-state specific, before the course exam: the general attestation, signed with Attest', async () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="exam" state="GEN" />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'Prelicensing Education Insurance - Proctor Acknowledgement and Student Attestation',
    )
    expect(screen.queryByText('Student E-Signature:')).toBeNull()
    expect(screen.getByRole('button', { name: 'Attest' })).toBeTruthy()
    const doc = openDoc('exam', 'GEN')
    expect(doc.getByText('THIS EXAM MUST BE MONITORED BY A DISINTERESTED THIRD PARTY PROCTOR')).toBeTruthy()
    expect(doc.getByText('Student Attestation:')).toBeTruthy()
  })

  it('Non-state specific, after the course exam: none, and the modal says so in words that fit', () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="GEN" />)
    expect(screen.getByText(/There’s no non-state specific affidavit after course exam/)).toBeTruthy()
  })

  /* BEFORE THE COURSE EXAM IN CO, CT, WV AND WI (2026-11-04) — one
     attestation. Its "I have read and understand the requirements above"
     box went on 2026-11-06; the button attests. */
  it.each([
    ['CO', 'Colorado'],
    ['CT', 'Connecticut'],
    ['WV', 'West Virginia'],
    ['WI', 'Wisconsin'],
  ])('%s before the course exam: the Pre-Exam Attestation, attested with its button alone', async (st, name) => {
    const onClose = vi.fn()
    render(<AffidavitModalV2 onClose={onClose} moment="exam" state={st} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(`${name} Pre-Exam Attestation`)
    expect(screen.queryByLabelText(/I have read and understand the requirements above/)).toBeNull()
    // Link out's own "I have read …" box is the only one (2026-11-10).
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    const doc = openDoc('exam', st)
    expect(doc.getByText(/I attest that I am the individual registered for this examination/)).toBeTruthy()
    expect(doc.getByText(/artificial intelligence tools/)).toBeTruthy()
    readAndSwear()
    const agree = screen.getByRole('button', { name: 'I Attest and Confirm' }) as HTMLButtonElement
    expect(agree.disabled).toBe(false)
    fireEvent.click(agree)
    expect(onClose).toHaveBeenCalled()
  })

  /* THE SSN WORDING (2026-11-06): the compliance sheet's "SSN Veribage",
     directly above the SSN field on CA, IL and both Ohio forms. */
  it('puts the sheet’s SSN wording above every SSN field — directly above it on both Ohio forms', () => {
    const forms = { CA_POST_LH: 'ssn4', IL_POST: 'ssn', OH_PRE: 'ssn4', OH_POST_P: 'ssn4' }
    for (const [key, id] of Object.entries(forms)) {
      const flat = (fs: AffField[]): AffField[] => fs.flatMap((f) => (f.flagGroup ? flat(f.flagGroup) : [f]))
      const fields = flat(FORMS[key]!.fields)
      const at = fields.findIndex((f) => f.id === id)
      expect(at, key).toBeGreaterThan(0)
      const reason = fields.findIndex((f) => f.block?.p === SSN_REASON)
      expect(reason, key).toBeGreaterThanOrEqual(0)
      expect(reason, key).toBeLessThan(at)
      // CA and IL: where the old "Education providers …" sentence was (CA's sits above Date of Birth).
      if (key.startsWith('OH')) expect(reason, key).toBe(at - 1)
    }
  })

  /* WHOSE FIELDS (2026-11-09, Afsana). The six state-specific affidavits keep
     their student / proctor pages; every other form, all three moments, is
     the student's alone and says so once at the top. Every signature box is
     plain "Signature", and no form keeps a "Student E-Signature:" heading. */
  it('every non-state-specific form the student signs says so once, at the top', () => {
    expect(STATE_SPECIFIC_FORMS).toEqual(['CO_POST', 'CT_POST', 'MN_POST', 'NY_POST', 'WI_POST', 'WV_POST'])
    const sigLabels = (key: string) => flatAll(formFields(key)).filter((x) => x.id === 'sig').map((x) => x.label)
    for (const [key, f] of Object.entries(FORMS)) {
      const stateSpecific = STATE_SPECIFIC_FORMS.includes(key)
      expect(f!.who, key).toBe(stateSpecific ? undefined : 'student')
      for (const l of sigLabels(key)) expect(l, key).toBe('Signature')
      // Headings live in page blocks and in field blocks, at any depth.
      expect(JSON.stringify([f!.pages, f!.fields, f!.after]), key).not.toMatch(/"h4?":"Student E-Signature/)
    }
    // Signed forms only since 2026-11-11 — an unsigned one has no banner.
    for (const [moment, state] of [['pre', 'OH'], ['post', 'IL']] as const) {
      const { unmount } = render(<AffidavitModalV2 onClose={() => {}} moment={moment} state={state} />)
      const banner = screen.getAllByRole('note')[0]!
      expect(bannerBody(banner)).toBe('Must be completed and signed by the student')
      expect(bannerEyebrow(banner)).toBe('Student action required')
      expect(banner.parentElement!.firstElementChild).toBe(banner)
      unmount()
    }
    render(<AffidavitModalV2 onClose={() => {}} moment="pre" state="IL" />)
    expect(screen.getAllByRole('note')).toHaveLength(1)
  })

  /* 2026-11-10, Afsana: a form the student signs says "completed and signed".
     2026-11-11: in cyan, and a form they don't sign has no banner at all. */
  it('says "completed and signed by the student", in cyan, on every form the student signs — and nothing on one they don’t', () => {
    for (const [moment, state] of [['pre', 'IL'], ['post', 'CA'], ['exam', 'GEN'], ['post', 'CO']] as const) {
      const { unmount } = render(<AffidavitModalV2 onClose={() => {}} moment={moment} state={state} />)
      const note = screen.getAllByRole('note')[0]!
      expect(bannerBody(note), `${moment} ${state}`).toBe('Must be completed and signed by the student')
      expect(bannerEyebrow(note), `${moment} ${state}`).toBe('Student action required')
      expect(note.classList.contains('is-student'), `${moment} ${state}`).toBe(true)
      unmount()
    }
    for (const state of ['KY', 'FL']) {
      const { unmount } = render(<AffidavitModalV2 onClose={() => {}} moment="pre" state={state} />)
      expect(screen.queryByRole('note'), state).toBeNull() // no signature, no banner
      expect(screen.queryByText(/Must be completed by the student/i), state).toBeNull()
      unmount()
    }
    const css = readFileSync(resolve(__dirname, '../components/e2e/affidavitModalV2.css'), 'utf8')
    expect(css).toMatch(/\.aff2-banner\.is-student \{[^}]*--color-aff-banner-student\)/)
  })

  it('puts the banner only on the student page that has the signature — not Colorado’s certification statement', async () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="post" state="CO" />)
    // Colorado has no Link out, so it pages; walk to the third page.
    expect(bannerBody(screen.getByRole('note'))).toBe('Must be completed and signed by the student')
    fireEvent.change(screen.getAllByLabelText(/^Signature/)[0]!, { target: { value: 'Jordan Navarro' } })
    fireEvent.click(screen.getByLabelText(/I confirm that the above information is accurate/))
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    for (const [id, v] of [['Address Line 1', '1 Main St'], ['City', 'Denver'], ['Zip', '80202'], ['First Name', 'Pat'], ['Last Name', 'Lee'], ['Signature', 'Pat Lee']])
      fireEvent.change(screen.getByLabelText(new RegExp(`^${id}`)), { target: { value: v } })
    fireEvent.change(screen.getByLabelText(/^State/), { target: { value: 'CO' } })
    fireEvent.click(screen.getByLabelText(/^Librarian/))
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Student Certification Statement:')).toBeTruthy()
    expect(screen.queryByRole('note')).toBeNull() // nothing to sign here, so no banner (2026-11-11)
  })

  /* PENNSYLVANIA (2026-11-06), from the compliance sheet. Not in the PRD —
     an open question; affidavitForms.ts has it. */
  it('Pennsylvania before the course exam: its affidavit, signed the standard way, with Attest', async () => {
    render(<AffidavitModalV2 onClose={() => {}} moment="exam" state="PA" />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Pennsylvania Pre-Licensing Affidavit')
    expect(screen.queryByText('Student E-Signature:')).toBeNull()
    expect(openDoc('exam', 'PA').getByText(/sanction by the Pennsylvania Department of Insurance/)).toBeTruthy()
    expect((screen.getByLabelText(/^First Name/) as HTMLInputElement).value).toBe('Jordan')
    expect((screen.getByLabelText(/^Signature/) as HTMLInputElement).value).toBe('')
    expect(screen.getByRole('button', { name: 'Attest' })).toBeTruthy()
    expect(STATES.PA).toBe('Pennsylvania')
    expect(FEATURE_FLAGS.find((f) => f.key === 'affidavit-v2-state')!.variants!.some((v) => v.value === 'PA')).toBe(true)
  })

  it('resolves every ready entry in the explorer to a form', () => {
    for (const e of ENTRIES) {
      const r = resolveAffidavit(e.m, e.st, 'English')
      if (e.status === 'ready' || e.variants) expect(r.form, `${e.m} ${e.st}`).not.toBeNull()
      else expect(r.form, `${e.m} ${e.st}`).toBeNull()
    }
  })
})

/* THE HOUSE STYLE IS A SWITCH, NOT A SECOND MODAL (2026-11-10, Jill). The
   Design bar's "Affidavit modal" puts one class on the root and a block of
   scoped CSS does the rest, so the two arms share their markup and cannot
   drift. These pin all three halves of that: the class follows the flag, the
   CSS that differs is scoped to it, and the parts the Current skin hides are
   still in the DOM. */
describe('the Design bar’s Affidavit modal skin', () => {
  function Skin() {
    const { setVariant } = useFeatureFlags()
    return (
      <>
        <button type="button" onClick={() => setVariant('affidavit-modal-house-style', 'current')}>Current</button>
        <button type="button" onClick={() => setVariant('affidavit-modal-house-style', 'house-style')}>House style</button>
        <AffidavitModalV2 onClose={() => {}} moment="pre" state="OH" />
      </>
    )
  }

  function renderSkin() {
    render(
      <MemoryRouter>
        <FeatureFlagProvider>
          <Skin />
        </FeatureFlagProvider>
      </MemoryRouter>,
    )
    return () => screen.getByRole('dialog').className
  }

  it('wears is-house by default, drops it on Current, and takes it back', () => {
    const cls = renderSkin()
    // Default House style — the branch rule: a flag's default is ON on the
    // branch that introduces it, so the branch build shows the work.
    expect(cls()).toContain('is-house')
    fireEvent.click(screen.getByRole('button', { name: 'Current' }))
    expect(cls()).toBe('aff2-modal')
    fireEvent.click(screen.getByRole('button', { name: 'House style' }))
    expect(cls()).toContain('is-house')
  })

  it('keeps one markup: the eyebrow and the icon are in the DOM on Current too', () => {
    renderSkin()
    const banner = () => screen.getAllByRole('note')[0]!
    expect(banner().querySelector('.aff2-banner__eyebrow')?.textContent).toBe('Student action required')
    fireEvent.click(screen.getByRole('button', { name: 'Current' }))
    // Hidden by CSS, not unrendered — jsdom has no stylesheet, so the node
    // being present IS the assertion. If this ever starts failing, someone has
    // made the banner conditional and the two arms can drift again.
    expect(banner().querySelector('.aff2-banner__eyebrow')?.textContent).toBe('Student action required')
    expect(banner().querySelector('.aff2-banner__body')?.textContent).toBe('Must be completed and signed by the student')
  })

  it('scopes every rule that differs, so Afsana’s skin is the file’s default', () => {
    const css = readFileSync(resolve(__dirname, '../components/e2e/affidavitModalV2.css'), 'utf8')
    // Her originals, unqualified.
    expect(css).toMatch(/\.aff2-head \{[^}]*background: var\(--color-aff-navy\)/)
    expect(css).toMatch(/\.aff2-foot \{[^}]*border-top: 1px solid var\(--color-aff-line\)/)
    expect(css).toMatch(/\.aff2-btn \{[^}]*background: var\(--color-aff-navy\)/)
    // The house style, every rule behind the class.
    for (const sel of ['.aff2-head', '.aff2-close', '.aff2-banner', '.aff2-foot', '.aff2-btn']) {
      expect(css, sel).toContain(`.aff2-modal.is-house ${sel}`)
    }
    // The CTA colour appears only inside the house-style block.
    const house = css.slice(css.indexOf('.aff2-modal.is-house'))
    expect(css.indexOf('--color-aff-cta')).toBeGreaterThan(css.indexOf('.aff2-modal.is-house'))
    expect(house).toContain('--color-aff-cta')
  })

  /* 2026-11-11, Afsana: "disabled until they can click". The house rule
     outranked `.aff2-btn:disabled`, so a disabled CTA looked live. */
  it('greys a disabled CTA under the house style too, not only under the original', () => {
    const css = readFileSync(resolve(__dirname, '../components/e2e/affidavitModalV2.css'), 'utf8')
    expect(css).toMatch(/\.aff2-btn:disabled \{[^}]*background: var\(--color-aff-disabled\)/)
    expect(css).toMatch(/\.aff2-modal\.is-house \.aff2-btn:disabled \{[^}]*background: var\(--color-aff-disabled\)/)
    // And it comes after the house button rule, so it wins on order as well as weight.
    expect(css.indexOf('.aff2-modal.is-house .aff2-btn:disabled')).toBeGreaterThan(css.indexOf('.aff2-modal.is-house .aff2-btn {'))
  })

  it('draws Back as an outlined grey secondary under the house style, not a navy primary', () => {
    const css = readFileSync(resolve(__dirname, '../components/e2e/affidavitModalV2.css'), 'utf8')
    const rule = css.match(/\.aff2-modal\.is-house \.aff2-btn\.is-sec \{([^}]*)\}/)?.[1] ?? ''
    expect(rule).toContain('border: 1px solid var(--color-aff-input-rule)')
    expect(rule).toContain('background: var(--color-fixed-light)')
    expect(rule).not.toContain('--color-aff-cta')
    expect(css.indexOf('.aff2-modal.is-house .aff2-btn.is-sec {')).toBeGreaterThan(css.indexOf('.aff2-modal.is-house .aff2-btn {'))
  })
})

/* LINE OF AUTHORITY LEAVES THE BAR FOR NON-STATE SPECIFIC (2026-11-04) —
   `hiddenWhen` on `affidavit-v2-loa`, read live by `designControlsFor`. */
describe('the Design bar’s affidavit controls', () => {
  function Probe() {
    const { setVariant } = useFeatureFlags()
    const keys = designControlsFor('jill-atlas-main', 'jill').map((f) => f.key)
    return (
      <>
        <output data-testid="controls">{keys.join(' ')}</output>
        <button type="button" onClick={() => setVariant('affidavit-v2-state', 'GEN')}>Non-state specific</button>
        <button type="button" onClick={() => setVariant('affidavit-v2-state', 'FL')}>Florida</button>
      </>
    )
  }

  it('drops Line of authority while State is Non-state specific, and brings it back after', () => {
    render(
      <MemoryRouter>
        <FeatureFlagProvider>
          <Probe />
        </FeatureFlagProvider>
      </MemoryRouter>,
    )
    const controls = () => screen.getByTestId('controls').textContent!.split(' ')
    expect(controls()).toContain('affidavit-v2-loa')
    fireEvent.click(screen.getByRole('button', { name: 'Non-state specific' }))
    expect(controls()).not.toContain('affidavit-v2-loa')
    expect(controls()).toContain('affidavit-v2-state') // only that one goes
    fireEvent.click(screen.getByRole('button', { name: 'Florida' }))
    expect(controls()).toContain('affidavit-v2-loa')
  })

  /* N/A STATES LEAVE THE LIST (2026-11-06): each moment lists the states that
     have a form at it. */
  it('lists, for each moment, only the states that have a form at it — worked out from the forms', () => {
    const rule = FEATURE_FLAGS.find((f) => f.key === 'affidavit-v2-state')!.variantsHiddenWhen!
    expect(rule.flag).toBe('affidavit-v2-moment')
    for (const m of ['pre', 'exam', 'post'] as const) {
      const none = Object.keys(STATES).filter((st) => !resolveAffidavit(m, st, 'English').form)
      expect([...rule.hide[m]!].sort(), m).toEqual(none.sort())
    }
  })

  it('narrows Affidavit state as Affidavit moment changes, keeping the state picked', () => {
    function States() {
      const { setVariant } = useFeatureFlags()
      const state = designControlsFor('jill-atlas-main', 'jill').find((f) => f.key === 'affidavit-v2-state')!
      return (
        <>
          <output data-testid="states">{state.variants!.map((v) => v.value).join(' ')}</output>
          {(['off', 'pre', 'exam', 'post'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setVariant('affidavit-v2-moment', m)}>{m}</button>
          ))}
        </>
      )
    }
    render(
      <MemoryRouter>
        <FeatureFlagProvider>
          <States />
        </FeatureFlagProvider>
      </MemoryRouter>,
    )
    const states = () => screen.getByTestId('states').textContent!.split(' ')
    expect(states()).toContain('NY') // Off: every state
    fireEvent.click(screen.getByRole('button', { name: 'pre' }))
    expect(states()).not.toContain('NY')
    expect(states()).toContain('FL')
    fireEvent.click(screen.getByRole('button', { name: 'post' }))
    expect(states()).toContain('FL') // no form after the exam, but it is the one picked
    expect(states()).not.toContain('KY')
    expect(states()).toContain('NY')
  })
})
