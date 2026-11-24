import type React from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { AtlasCourseCardFigmaV2 } from '@/components/compass/AtlasCourseCardFigmaV2'
import { ATLAS_MY_COURSES, atlasCoursesFor, atlasHomeStateFor } from '@/data/atlasCourseCards'
import { myCoursesFor } from '@/data/myCoursesFixtures'

/**
 * THE MY COURSES CARD, TO THE PRD — 2026-11-23, section 3 of the My Courses
 * PRD (Chi Wang, 2026-11-16), behind `atlas-courses-card-prd-fields`.
 *
 * Four things the PRD makes non-negotiable, pinned here: the Completed card's
 * button is a LINK to a certificate and is not disabled ("No dead ends"); every
 * status draws its own date line; a course with no description says so rather
 * than drawing nothing; and the progress bar exposes its number to assistive
 * tech, not only its width.
 */
afterEach(cleanup)

const BASELINE = 'jill-atlas-main'
/* The Atlas card, the PRD copy of it. Library on or off is each test's own. */
/* ⚠ `atlas-courses-card-actions:shown` IS PINNED HERE because the default became Hidden on 2026-11-23 ("set this current
   view as the default"), and most of this file describes the button, the links and the date line beside them. The default
   itself is pinned under "the actions toggle". */
const PINS = 'atlas-pages-quick-links:hidden,atlas-courses-card-style:atlas,atlas-courses-card-prd-fields:on,atlas-courses-card-actions:shown'

function renderShell(rawQuery: string) {
  const query = rawQuery.includes('ff=') ? rawQuery.replace('ff=', `ff=${PINS},`) : `${rawQuery}&ff=${PINS}`
  // On `window.location` too — `?ff=` overrides are read straight off it (see AtlasLearningPages.test.tsx).
  window.history.replaceState({}, '', `/dashboard-rebrand?demo=1&${query}`)
  return render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand?demo=1&${query}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <LearningPathsPanelProvider>
            <JumpBackInPanelProvider>
              <PlatformShell />
            </JumpBackInPanelProvider>
          </LearningPathsPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** The card on its own, actions SHOWN (the default is Hidden since 2026-11-23) — for the tests about its link and its click. */
function renderCard(ui: React.ReactElement) {
  window.history.replaceState({}, '', '/dashboard-rebrand?demo=1&ff=atlas-courses-card-actions:shown')
  return render(
    <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1&ff=atlas-courses-card-actions:shown']}>
      <AccountProvider>
        <FeatureFlagProvider>{ui}</FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** The six design cards — one per status, two in progress: inside the warning window and well outside it (2026-11-24). */
const DESIGN_CARDS = `section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off`
/** The learner's library — thirteen records, some with no description. */
const LIBRARY = `section=courses&version=${BASELINE}&ff=atlas-courses-from-library:on`

/* ⚠ ONE SPACE AT EVERY ELEMENT BOUNDARY — the row is spans on a flex `gap`, so `textContent` reads "Access Ends:05/25/2026,13
   daysto complete" (the same trap AtlasCourseExpiry.test.tsx's metaRow names). */
const dateLines = () =>
  screen.getAllByTestId('atlas-card-date').map((el) => {
    // Text NODES, not leaf elements: the date and its comma share one span, so a leaf-element walk would drop the date.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const parts: string[] = []
    while (walker.nextNode()) parts.push(walker.currentNode.textContent ?? '')
    return parts.join(' ').replace(/\s+/g, ' ').replace(/ ,/g, ',').trim()
  })

describe('the flag', () => {
  it('is in the catalog, on by default on this branch, and on the Widgets group of dashboard-rebrand', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-courses-card-prd-fields')!
    expect(flag).toBeTruthy()
    expect(flag.defaultEnabled).toBe(true)
    expect(flag.group).toBe('Widgets')
    expect(flag.page).toBe('dashboard-rebrand')
    expect(flag.description).toMatch(/2026-11-16/)
  })

  it('is on the design bar as Old card / New card (2026-11-23)', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-courses-card-prd-fields')!
    expect(flag.surface).toBe('design')
    expect(flag.defaultVariant).toBe('new')
    expect(flag.variants!.map((v) => v.label)).toEqual(['New card', 'Old card'])
  })
})

describe('the Completed card', () => {
  it('draws View Certificate as a live link, not a disabled Completed button', () => {
    renderShell(DESIGN_CARDS)
    // One issued certificate among the design cards; the other completed card's is pending and draws no link.
    const link = screen.getByRole('link', { name: 'View Certificate' })
    /* INSIDE THE SHELL the link is the shell's own certificates page, not /my-learning/certificates: AppLayout blocks that
       route from inside the rebrand with a toast, so the product route would be a dead end here. Found by clicking it. */
    expect(link.getAttribute('href')).toContain('section=certificates')
    expect(link.getAttribute('href')).not.toContain('/my-learning/')
    expect(link.hasAttribute('disabled')).toBe(false)
    expect(link.getAttribute('aria-disabled')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Completed' })).toBeNull()
  })

  it('links to the product route when nothing re-points it', () => {
    const done = ATLAS_MY_COURSES.find((c) => c.completed)!
    renderCard(<AtlasCourseCardFigmaV2 data={done} />)
    expect(screen.getByRole('link', { name: 'View Certificate' }).getAttribute('href')).toBe('/my-learning/certificates')
  })

  /* "No dead ends": every completed card has somewhere to go, and only a
     completed card has it — an unfinished course has no certificate to view. */
  it('resolves a certificate link for every completed course in the library, and for no other', () => {
    const cards = atlasCoursesFor('xcel')
    expect(cards.some((c) => c.completed)).toBe(true)
    for (const c of cards) {
      if (c.completed) expect(c.certificateHref).toMatch(/\/my-learning\/certificates/)
      else expect(c.certificateHref).toBeUndefined()
      // Pending only ever on a completed course (2026-11-24).
      if (c.certificatePending) expect(c.completed).toBe(true)
    }
  })

  /* The card before it set `pointerEvents: 'none'` on the disabled button so a
     click fell through to the article's `onOpen`. A live link must not — the
     button goes to the certificate, the rest of the card still goes Home. */
  it('does not open Home when the link is clicked, while the card around it still does', () => {
    const onOpen = vi.fn()
    const done = ATLAS_MY_COURSES.find((c) => c.completed)!
    renderCard(<AtlasCourseCardFigmaV2 data={done} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('link', { name: 'View Certificate' }))
    expect(onOpen).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('article', { name: done.title }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})

describe('the date line', () => {
  it('draws the PRD’s three shapes across the design cards — every status on screen at once', () => {
    renderShell(DESIGN_CARDS)
    const lines = dateLines()
    // mm/dd/yyyy, in the Home course head's wording (2026-11-24) — and ONLY on live courses: the expired and completed
    // cards say their dates on the pill and the status row instead ("showing elsewhere on card", the same day).
    // "(N days)" in parentheses, and on the completed card too (2026-11-24).
    expect(lines.every((l) => /^Access Ends: \d{2}\/\d{2}\/\d{4}, \(\d+ days?\)$/.test(l))).toBe(true)
    expect(lines).toHaveLength(ATLAS_MY_COURSES.filter((c) => c.badge !== 'Expired').length)
    expect(lines.some((l) => /^Expired:/.test(l))).toBe(false)
    expect(lines.some((l) => /^Completed:/.test(l))).toBe(false)
  })

  it('gives each library record the line its status calls for, and never an Enrolled line', () => {
    const cards = atlasCoursesFor('xcel')
    const seen = new Set<string>()
    for (const card of cards) {
      expect(card.availableDate).not.toBe('')
      if (card.badge === 'Expired') {
        expect(card.dateLabel).toBe('Expired:')
        expect(card.availableTime).toBeUndefined()
      } else {
        // Live and completed alike (2026-11-24): the access line, "(N days)" in parentheses.
        expect(card.dateLabel).toBe('Access Ends:')
        expect(card.availableTime).toMatch(/^\(\d+ days?\)$/)
      }
      seen.add(card.dateLabel!)
    }
    expect([...seen].sort()).toEqual(['Access Ends:', 'Expired:'])
  })

  it('draws no score or last-progress line under the date — the pill and the marker carry them (2026-11-24)', () => {
    renderShell(DESIGN_CARDS)
    expect(screen.queryByText('Score: 62%')).toBeNull()
    expect(screen.queryByText('Last progress: 62%')).toBeNull()
  })
})

describe('the description', () => {
  /* Hidden, and the flag retired (2026-11-24, Jillienne: "keep description hidden, and remove this flag"). The records keep
     their `description`; nothing on the card or on Home draws it. */
  it('is not drawn on the card, and there is no flag for it', () => {
    renderShell(LIBRARY)
    expect(screen.queryByText('Description coming soon')).toBeNull()
    const withOne = myCoursesFor('xcel').find((c) => !c.archived && c.description)!
    expect(screen.queryByText(withOne.description!)).toBeNull()
    expect(FEATURE_FLAGS.find((f) => f.key === 'atlas-course-description')).toBeUndefined()
  })

  it('is not drawn under the course title on Home either', () => {
    renderShell(`section=dashboard&version=${BASELINE}`)
    expect(screen.getByRole('heading', { level: 2, name: /Life and Health Pre-licensing/ })).toBeTruthy()
    expect(screen.queryByText(ATLAS_MY_COURSES[0].description!)).toBeNull()
  })
})

describe('the labels, the status and the progress', () => {
  /* The shared card's meta-row style (2026-11-23, Jillienne: "use this style for the State | Category | Line of
     Authority"): the values alone, hairlines between, no "State:" labels. */
  it('puts state, category and line of authority on every card as one ruled row, values only', () => {
    renderShell(DESIGN_CARDS)
    const rows = screen.getAllByTestId('atlas-card-facts')
    expect(rows).toHaveLength(ATLAS_MY_COURSES.length)
    for (const row of rows) {
      // The leaf spans only — each value sits inside a `display: contents` wrapper that carries the same text.
      const values = [...row.querySelectorAll('span:not([aria-hidden])')].filter((s) => s.children.length === 0).map((s) => s.textContent)
      expect(values).toHaveLength(3)
      // Abbreviated (2026-11-23, Jillienne: "to help with wrapping issues") — the design cards say "Florida"; the row says FL.
      expect(values[0]).toBe('FL')
      expect(row.querySelectorAll('[aria-hidden]')).toHaveLength(2)
    }
    expect(screen.queryByText(/^State:/)).toBeNull()
    expect(screen.queryByText('Florida', { selector: '[data-testid="atlas-card-facts"] span' })).toBeNull()
    expect(screen.getAllByText('Licensing').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Life and Health').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Property & Casualty').length).toBeGreaterThan(0) // the ampersand (2026-11-23)
  })

  /* 2026-11-24, Jillienne: "add a toggle that moves the title to the center of this section vertically so i can show someone
     and make a decision". Top is the default; the control is on the design bar. */
  it('centres a short title in its box when the title control says so', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-courses-card-title-align')!
    expect(flag.surface).toBe('design')
    expect(flag.defaultVariant).toBe('top')
    renderShell(`${DESIGN_CARDS},atlas-courses-card-title-align:center`)
    for (const box of screen.getAllByTestId('atlas-card-title-box')) expect(box.style.alignItems).toBe('center')
  })

  it('draws the hairline under the title block, not on the date line (2026-11-24)', () => {
    renderShell(DESIGN_CARDS)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    const titleBlock = within(card).getByTestId('atlas-card-title-box').parentElement!.parentElement!
    expect(titleBlock.style.borderBottom).toContain('--color-primary-100') // lighter (2026-11-24; 200 for an hour)
    const date = within(card).getByTestId('atlas-card-date')
    expect(date.style.borderTop).toBe('')
    expect(date.style.borderBottom).toBe('')
  })

  it('gives every title the same 60px box, the title clamped at three lines and at the top (2026-11-24)', () => {
    renderShell(DESIGN_CARDS)
    const boxes = screen.getAllByTestId('atlas-card-title-box')
    expect(boxes).toHaveLength(ATLAS_MY_COURSES.length)
    for (const box of boxes) {
      expect(box.style.height).toBe('60px') // three lines of 20 (2026-11-24; 22 earlier that day)
      const h = box.querySelector('h3')!
      expect(h.style.lineHeight).toBe('20px')
      // Charcoal at rest; tokens.css lifts it to the primary ink on the card's hover (2026-11-24).
      expect(h.style.color).toContain('--color-neutral-800')
      expect(h.className).toContain('cre-atlas-card-v2-title')
      expect(box.style.alignItems).toBe('flex-start')
      expect(h.style.webkitLineClamp).toBe('3')
      expect(h.style.overflow).toBe('hidden')
    }
  })



  it('exposes the progress as a number — aria-valuenow between 0 and 100 — beside the status as text', () => {
    renderShell(DESIGN_CARDS)
    const bars = screen.getAllByRole('progressbar')
    expect(bars).toHaveLength(ATLAS_MY_COURSES.length)
    for (const bar of bars) {
      expect(bar.getAttribute('aria-valuemin')).toBe('0')
      expect(bar.getAttribute('aria-valuemax')).toBe('100')
      const now = Number(bar.getAttribute('aria-valuenow'))
      expect(Number.isInteger(now)).toBe(true)
      expect(now).toBeGreaterThanOrEqual(0)
      expect(now).toBeLessThanOrEqual(100)
    }
    for (const word of ['In Progress', 'Not Started']) expect(screen.getAllByText(word).length).toBeGreaterThan(0)
    // The completed card's status row carries its date (2026-11-24): "Completed - 03/18/2026".
    expect(screen.getByText('Completed - 03/18/2026')).toBeTruthy()
  })
})

describe('the labels', () => {
  /* The ruled row alone since 2026-11-24 (Jillienne: "set this one as default, remove the other options and this flag");
     the stacked and labelled layouts are an Archive row. */
  it('has no layout control any more, and no stacked or labelled markup', () => {
    expect(FEATURE_FLAGS.find((f) => f.key === 'atlas-courses-card-meta')).toBeUndefined()
    renderShell(DESIGN_CARDS)
    expect(screen.queryByText(/^State:/)).toBeNull()
    for (const row of screen.getAllByTestId('atlas-card-facts')) expect(row.querySelector('svg')).toBeNull()
  })
})

describe('Home follows the card it was opened from', () => {
  /* 2026-11-24, Jillienne: "when clicking on a card from the my courses page, it needs to update accordingly on this atlas
     home page, the access ends should match logic, as well as the course progress should match logic". */
  it('shows the card’s own access date, day count and progress on Home', () => {
    renderShell(`${DESIGN_CARDS},atlas-courses-card-actions:hidden`)
    fireEvent.click(screen.getByRole('article', { name: 'Florida Health Insurance Pre-licensing' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Florida Health Insurance Pre-licensing' })).toBeTruthy()
    const access = screen.getByText(/Course Access Ends:/).closest('div')!.textContent!.replace(/\s+/g, ' ')
    expect(access).toContain('03/01/2027')
    // Ten months out, Home counts in weeks; what matters is that it is the card's window, not the bar's 30 days.
    expect(access).toMatch(/4\d weeks/)
    expect(access).not.toContain('06/10/2026')
    // The card is at 30%; the ring and the Step 1 titles read it, not the bar's Developing 36%.
    expect(screen.queryByText(/36%/)).toBeNull()
    expect(screen.getAllByText(/30%/).length).toBeGreaterThan(0)
  })

  it('sets the bar to the nearest presets on the way', () => {
    const card = ATLAS_MY_COURSES.find((c) => c.id === 'demo-fl-health-prelicensing')!
    expect(atlasHomeStateFor(card)).toEqual({ progress: 'developing', expiry: '400' })
    const dueSoon = ATLAS_MY_COURSES.find((c) => c.badge === 'Due Soon')!
    expect(atlasHomeStateFor(dueSoon)).toEqual({ progress: 'developing', expiry: '7' }) // six days until, five usable
    const expired = ATLAS_MY_COURSES.find((c) => c.badge === 'Expired')!
    expect(atlasHomeStateFor(expired).expiry).toBe('-3')
  })
})

describe('an in-progress course well outside the warning window', () => {
  /* 2026-11-24, Jillienne: "another example of a card that is in progress that is more than 30 days until access expires so
     that its the normal atlas blue progress and there is no badge". */
  it('wears the plain In Progress pill, the primary blue fill, and a long access line', () => {
    renderShell(DESIGN_CARDS)
    const card = screen.getByRole('article', { name: 'Florida Health Insurance Pre-licensing' })
    expect(within(within(card).getByTestId('atlas-card-image')).getByText('In Progress')).toBeTruthy()
    const fill = within(card).getByRole('progressbar').querySelector('span')!
    expect(fill.style.background).toContain('--color-primary-500') // the primary button's blue (2026-11-24; Info 400 before)
    expect(fill.style.width).toBe('30%')
    expect(within(card).getByTestId('atlas-card-date').textContent).toMatch(/Access Ends:03\/01\/2027,\(\d{3} days\)/)
  })
})

describe('the countdown pill', () => {
  /* 2026-11-24, Jillienne: "Access ends indicator should only be showing if the course is ending in 7 days or less". The
     library's NFIP course has 21 days left and the record's sixty-day Due Soon badge — on this card it is plain In Progress. */
  it('counts down only inside the last week; outside it the pill is In Progress', () => {
    renderShell(LIBRARY)
    const nfip = screen.getByRole('article', { name: 'Flood Insurance (NFIP) Training' })
    expect(within(within(nfip).getByTestId('atlas-card-image')).getByText('In Progress')).toBeTruthy()
    const suitability = screen.getByRole('article', { name: 'Annuity Suitability Update' }) // 14 days left
    expect(within(within(suitability).getByTestId('atlas-card-image')).getByText('In Progress')).toBeTruthy()
  })
})

describe('the Expired pill', () => {
  /* 2026-11-23, Jillienne: "Expired badge should be a dark charcoal color". Charcoal on THIS card only — the shared pill's
     catalog is unchanged, so the 2026-11-18 card keeps Error 100 (pinned under "the flag off"). */
  it('is charcoal — Neutral 800 with light ink — on the PRD card', () => {
    renderShell(DESIGN_CARDS)
    // The label sits in an inner span since 2026-11-24; the pill is its parent.
    const pill = screen.getByText('Expired - 04/20/2026', { selector: 'span' }).parentElement! // dated since 2026-11-24
    expect(pill.style.background).toContain('--color-neutral-800')
    expect(pill.style.color).toContain('--color-neutral-50')
  })

  it('leaves the other five pills on the catalog’s fills', () => {
    renderShell(DESIGN_CARDS)
    expect(screen.getByText(/^Access Ends \d+ days?$/, { selector: 'span' }).parentElement!.style.background).toContain('--color-warning-300')
    expect(screen.getAllByText(/^Failed/, { selector: 'span' })[0].parentElement!.style.background).toContain('--color-error-100')
  })
})

describe('Details →', () => {
  /* 2026-11-24, Jillienne: "bring back the Details link in the bottom right of the card, with a arrow icon pointing right,
     clicking it will trigger the sheet view". Under the title on the 2026-11-18 card, under the button for a day. */
  it('is the last thing on the card, after the progress bar, whatever the actions control says', () => {
    for (const q of [DESIGN_CARDS, `${DESIGN_CARDS},atlas-courses-card-actions:hidden`]) {
      cleanup()
      renderShell(q)
      const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
      const details = within(card).getByRole('button', { name: 'Details' })
      expect(details.querySelector('svg')).toBeTruthy()
      expect(within(card).getByRole('progressbar').compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(card.lastElementChild!.contains(details)).toBe(true)
    }
  })

  /* 2026-11-24, Jillienne: "when completed, add another link style cta, on the left of this line. it will be Award icon +
     Certificate". Only on a finished course; to the same place View Certificate goes. */
  it('puts an Award + Certificate link at the left of the foot on a completed card, and nowhere else', () => {
    renderShell(`${DESIGN_CARDS},atlas-courses-card-actions:hidden`)
    const done = screen.getByRole('article', { name: 'FL Preferred Business Practices for the Insurance Producer' })
    const cert = within(done).getByTestId('card-certificate-link')
    expect(cert.textContent).toBe('Certificate')
    expect(cert.querySelector('svg')).toBeTruthy()
    expect(cert.getAttribute('href')).toContain('section=certificates')
    const details = within(done).getByRole('button', { name: 'Details' })
    expect(cert.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const live = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    expect(within(live).queryByTestId('card-certificate-link')).toBeNull()
    // A finished course whose certificate is not yet issued: an hourglass and "Certificate Pending", not a link (2026-11-24).
    const pending = screen.getByRole('article', { name: 'Florida Ethics for Insurance Producers' })
    expect(within(pending).queryByTestId('card-certificate-link')).toBeNull()
    const note = within(pending).getByTestId('card-certificate-pending')
    expect(note.tagName).toBe('SPAN')
    expect(note.textContent).toBe('Certificate Pending')
    expect(note.querySelector('svg')).toBeTruthy()
  })

  it('opens the Course Details sheet, and does not open Home', () => {
    renderShell(`${DESIGN_CARDS},atlas-courses-card-actions:hidden`)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    fireEvent.click(within(card).getByRole('button', { name: 'Details' }))
    expect(screen.getByRole('dialog', { name: 'Florida Life and Health Pre-licensing details' })).toBeTruthy()
    expect(screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })).toBeTruthy()
  })

  /* 2026-11-24, Jillienne: "that sheet view should give the user the same ctas that are currently available as if this
     course was active in the atlas home" — Home's course head's buttons, per status. */
  it('offers Home’s buttons for the course, per status', () => {
    const expectActions = (title: string, labels: string[]) => {
      cleanup()
      renderShell(`${DESIGN_CARDS},atlas-courses-card-actions:hidden`)
      const card = screen.getByRole('article', { name: title })
      fireEvent.click(within(card).getByRole('button', { name: 'Details' }))
      const dialog = screen.getByRole('dialog', { name: `${title} details` })
      expect(within(dialog).getAllByTestId('sheet-action').map((b) => b.textContent)).toEqual(labels)
    }
    // Five usable days left — inside Home's amber week — so Purchase Extension joins the pair (2026-11-24).
    expectActions('Florida Life and Health Pre-licensing', ['Purchase Extension', 'Course Overview', 'Resume Course'])
    expectActions('Florida Health Insurance Pre-licensing', ['Course Overview', 'Resume Course'])
    expectActions('Florida Property & Casualty', ['Course Overview', 'Begin Course'])
    expectActions('Florida Property & Casualty Practice Exam', ['Course Overview', 'Retake Course'])
    expectActions('FL Preferred Business Practices for the Insurance Producer', ['View Certificate', 'Course Overview', 'Review Course'])
    // Not yet issued: nothing to view (2026-11-24).
    expectActions('Florida Ethics for Insurance Producers', ['Course Overview', 'Review Course'])
    // Expired: Purchase Extension ALONE, as Home reshapes the head once access has gone.
    expectActions('Florida Personal Lines Pre-licensing', ['Purchase Extension'])
  })

  it('wires the course verb to the card’s action, and View Certificate to the shell’s certificates page', () => {
    const onAction = vi.fn()
    const live = ATLAS_MY_COURSES.find((c) => c.actionLabel === 'Resume Course')!
    renderCard(<AtlasCourseCardFigmaV2 data={live} onAction={onAction} />)
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Resume Course' }))
    expect(onAction).toHaveBeenCalledTimes(1)
    cleanup()
    const done = ATLAS_MY_COURSES.find((c) => c.completed)!
    renderCard(<AtlasCourseCardFigmaV2 data={done} certificateTo="?section=certificates" />)
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(within(screen.getByRole('dialog')).getByRole('link', { name: 'View Certificate' }).getAttribute('href')).toContain('section=certificates')
  })

  it('draws the ruled labels row under the sheet title, before the buttons', () => {
    renderShell(`${DESIGN_CARDS},atlas-courses-card-actions:hidden`)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    fireEvent.click(within(card).getByRole('button', { name: 'Details' }))
    const dialog = screen.getByRole('dialog', { name: 'Florida Life and Health Pre-licensing details' })
    const labels = within(dialog).getByTestId('sheet-labels')
    expect([...labels.querySelectorAll('span:not([aria-hidden])')].filter((s) => !s.children.length).map((s) => s.textContent)).toEqual(['FL', 'Licensing', 'Life and Health'])
    const first = within(dialog).getAllByTestId('sheet-action')[0]
    expect(labels.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  /* 2026-11-24, Jillienne, in the sheet: "have the Topic on left, and the detail on the right so these display in one line"
     and "this needs a 'Description' sub-header". The PRD card's own copy of the sheet; the 2026-11-18 card's is untouched. */
  it('lays each fact out on one line, label left and value right, with a Description sub-header', () => {
    renderShell(`${DESIGN_CARDS},atlas-courses-card-actions:hidden`)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    fireEvent.click(within(card).getByRole('button', { name: 'Details' }))
    const dialog = screen.getByRole('dialog', { name: 'Florida Life and Health Pre-licensing details' })
    const state = within(dialog).getByText('State')
    const row = state.parentElement!
    expect(row.style.display).toBe('flex')
    expect(row.style.justifyContent).toBe('space-between')
    expect(within(row).getByText('Florida').style.textAlign).toBe('right')
    expect(within(dialog).getByRole('heading', { level: 3, name: 'Description' })).toBeTruthy()
  })
})

describe('the flag off', () => {
  it('draws the 2026-11-18 card untouched — the disabled Completed button and no date line', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off,atlas-courses-card-prd-fields:off`)
    for (const b of screen.getAllByRole('button', { name: 'Completed' })) expect(b.hasAttribute('disabled')).toBe(true) // two completed cards since 2026-11-24
    expect(screen.queryByRole('link', { name: 'View Certificate' })).toBeNull()
    expect(screen.queryByTestId('atlas-card-date')).toBeNull()
  })

  it('is also reached by the bar’s Old card arm, not only by :off', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off,atlas-courses-card-prd-fields:old`)
    for (const b of screen.getAllByRole('button', { name: 'Completed' })) expect(b.hasAttribute('disabled')).toBe(true)
    expect(screen.queryByTestId('atlas-card-date')).toBeNull()
  })

  it('keeps Course Details under the title (the 2026-11-18 card)', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off,atlas-courses-card-prd-fields:off`)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    const button = within(card).getByRole('button', { name: 'Resume Course' })
    const details = within(card).getByRole('button', { name: 'Course Details' })
    expect(details.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps the Expired pill on Error 100 — the pill catalog is untouched', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off,atlas-courses-card-prd-fields:off`)
    const pill = screen.getByText('Expired', { selector: 'span' }).parentElement!
    expect(pill.style.background).toContain('--color-error-100')
  })
})
