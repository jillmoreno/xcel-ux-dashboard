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
import { ATLAS_MY_COURSES, atlasCoursesFor } from '@/data/atlasCourseCards'
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

/** The six design cards — one per status, the CE package card included. */
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
    // mm/dd/yyyy, in the Home course head's wording (2026-11-24).
    expect(lines.some((l) => /^Access Ends: \d{2}\/\d{2}\/\d{4}, \d+ days? to complete$/.test(l))).toBe(true)
    expect(lines.some((l) => /^Expired: \d{2}\/\d{2}\/\d{4}$/.test(l))).toBe(true)
    expect(lines.some((l) => /^Completed: \d{2}\/\d{2}\/\d{4}, Score \d+%$/.test(l))).toBe(true)
  })

  it('gives each library record the line its status calls for, and never an Enrolled line', () => {
    const records = new Map(myCoursesFor('xcel').map((c) => [c.id, c]))
    const cards = atlasCoursesFor('xcel')
    const seen = new Set<string>()
    for (const card of cards) {
      const record = records.get(card.id)!
      expect(card.availableDate).not.toBe('')
      if (record.myStatus === 'completed') {
        expect(card.dateLabel).toBe('Completed:')
        expect(card.availableTime).toMatch(/^Score \d+%$/)
      } else if (card.badge === 'Expired') {
        expect(card.dateLabel).toBe('Expired:')
        expect(card.availableTime).toBeUndefined()
      } else {
        expect(card.dateLabel).toBe('Access Ends:')
        expect(card.availableTime).toMatch(/^\d+ days? to complete$/)
      }
      seen.add(card.dateLabel!)
    }
    expect([...seen].sort()).toEqual(['Access Ends:', 'Completed:', 'Expired:'])
  })

  it('shows the failed card’s score and the expired card’s last progress under the line', () => {
    renderShell(DESIGN_CARDS)
    expect(screen.getByText('Score: 62%')).toBeTruthy()
    expect(screen.getByText('Last progress: 62%')).toBeTruthy()
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

  it('draws the hairline under the title block, not on the date line (2026-11-24)', () => {
    renderShell(DESIGN_CARDS)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    const titleBlock = within(card).getByTestId('atlas-card-title-box').parentElement!.parentElement!
    expect(titleBlock.style.borderBottom).toContain('--color-primary-200')
    const date = within(card).getByTestId('atlas-card-date')
    expect(date.style.borderTop).toBe('')
    expect(date.style.borderBottom).toBe('')
  })

  it('gives every title the same 66px box, the title clamped at three lines and at the top (2026-11-24)', () => {
    renderShell(DESIGN_CARDS)
    const boxes = screen.getAllByTestId('atlas-card-title-box')
    expect(boxes).toHaveLength(ATLAS_MY_COURSES.length)
    for (const box of boxes) {
      expect(box.style.height).toBe('66px')
      expect(box.style.alignItems).toBe('flex-start')
      const h = box.querySelector('h3')!
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

describe('the Expired pill', () => {
  /* 2026-11-23, Jillienne: "Expired badge should be a dark charcoal color". Charcoal on THIS card only — the shared pill's
     catalog is unchanged, so the 2026-11-18 card keeps Error 100 (pinned under "the flag off"). */
  it('is charcoal — Neutral 800 with light ink — on the PRD card', () => {
    renderShell(DESIGN_CARDS)
    // The label sits in an inner span since 2026-11-24; the pill is its parent.
    const pill = screen.getByText('Expired', { selector: 'span' }).parentElement!
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

  it('opens the Course Details sheet, and does not open Home', () => {
    renderShell(`${DESIGN_CARDS},atlas-courses-card-actions:hidden`)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    fireEvent.click(within(card).getByRole('button', { name: 'Details' }))
    expect(screen.getByRole('dialog', { name: 'Florida Life and Health Pre-licensing details' })).toBeTruthy()
    expect(screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })).toBeTruthy()
  })
})

describe('the flag off', () => {
  it('draws the 2026-11-18 card untouched — the disabled Completed button and no date line', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off,atlas-courses-card-prd-fields:off`)
    expect(screen.getByRole('button', { name: 'Completed' }).hasAttribute('disabled')).toBe(true)
    expect(screen.queryByRole('link', { name: 'View Certificate' })).toBeNull()
    expect(screen.queryByTestId('atlas-card-date')).toBeNull()
  })

  it('is also reached by the bar’s Old card arm, not only by :off', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off,atlas-courses-card-prd-fields:old`)
    expect(screen.getByRole('button', { name: 'Completed' }).hasAttribute('disabled')).toBe(true)
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
