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

const dateLines = () =>
  screen.getAllByTestId('atlas-card-date').map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())

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
    expect(lines.some((l) => /^Access ends \w+ \d+, \d{4} · \d+ days? left$/.test(l))).toBe(true)
    expect(lines.some((l) => /^Expired: \w+ \d+, \d{4}$/.test(l))).toBe(true)
    expect(lines.some((l) => /^Completed: \w+ \d+, \d{4} · Score \d+%$/.test(l))).toBe(true)
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
        expect(card.availableTime).toMatch(/^· Score \d+%$/)
      } else if (card.badge === 'Expired') {
        expect(card.dateLabel).toBe('Expired:')
        expect(card.availableTime).toBeUndefined()
      } else {
        expect(card.dateLabel).toBe('Access ends')
        expect(card.availableTime).toMatch(/^· \d+ days? left$/)
      }
      seen.add(card.dateLabel!)
    }
    expect([...seen].sort()).toEqual(['Access ends', 'Completed:', 'Expired:'])
  })

  it('shows the failed card’s score and the expired card’s last progress under the line', () => {
    renderShell(DESIGN_CARDS)
    expect(screen.getByText('Score: 62%')).toBeTruthy()
    expect(screen.getByText('Last progress: 62%')).toBeTruthy()
  })
})

describe('the description', () => {
  it('says "Description coming soon" when the course has none', () => {
    renderShell(LIBRARY)
    const without = myCoursesFor('xcel').filter((c) => !c.archived && !c.description)
    expect(without.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Description coming soon')).toHaveLength(without.length)
  })

  it('draws the course’s own when it has one', () => {
    renderShell(LIBRARY)
    const withOne = myCoursesFor('xcel').find((c) => !c.archived && c.description)!
    expect(screen.getByText(withOne.description!)).toBeTruthy()
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

  it('draws the description inside the title block, right under the heading', () => {
    renderShell(DESIGN_CARDS)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    const heading = within(card).getByRole('heading')
    const description = within(card).getByText(ATLAS_MY_COURSES[0].description!)
    // The heading sits in its fixed box; the description follows the box.
    expect(heading.parentElement!.nextElementSibling).toBe(description)
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

describe('the three label layouts — the design bar’s atlas-courses-card-meta', () => {
  it('is a design-bar control on the Widgets group', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-courses-card-meta')!
    expect(flag.surface).toBe('design')
    expect(flag.defaultVariant).toBe('ruled-row')
    expect(flag.variants!.map((v) => v.value)).toEqual(['ruled-row', 'stacked', 'labelled'])
  })

  it('ruled row: a library record that already carries the code stays "FL"', () => {
    renderShell(LIBRARY)
    const row = screen.getAllByTestId('atlas-card-facts')[0]
    expect([...row.querySelectorAll('span:not([aria-hidden])')].filter((s) => s.children.length === 0)[0].textContent).toBe('FL')
  })

  it('stacked: the state leads with its icon, category | line of authority under it', () => {
    renderShell(`${DESIGN_CARDS},atlas-courses-card-meta:stacked`)
    const row = screen.getAllByTestId('atlas-card-facts')[0]
    expect(row.getAttribute('data-meta')).toBe('stacked')
    expect(row.querySelector('svg')).toBeTruthy()
    const lines = [...row.children].map((c) => c.textContent)
    expect(lines[0]).toBe('Florida')
    expect(lines[1]).toBe('LicensingLife and Health')
    expect(row.querySelectorAll('span[aria-hidden]')).toHaveLength(1)
  })

  it('labelled: one "State: Florida" line per fact', () => {
    renderShell(`${DESIGN_CARDS},atlas-courses-card-meta:labelled`)
    const row = screen.getAllByTestId('atlas-card-facts')[0]
    expect(row.getAttribute('data-meta')).toBe('labelled')
    expect(within(row).getByText(/^State:/)).toBeTruthy()
    expect(within(row).getByText(/^Line of authority:/)).toBeTruthy()
  })
})

describe('the description toggle — atlas-course-description', () => {
  /* 2026-11-23, Jillienne: "add a toggle to hide/show the description. Also add this description to the Home page for the
     course, under the title, and Add/Hide toggle should be there too." One control, two places. */
  it('is a design-bar control, shown by default', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-course-description')!
    expect(flag.surface).toBe('design')
    expect(flag.defaultVariant).toBe('shown')
  })

  it('hides every card’s description when hidden', () => {
    renderShell(`${DESIGN_CARDS},atlas-course-description:hidden`)
    expect(screen.queryByText(ATLAS_MY_COURSES[0].description!)).toBeNull()
    expect(screen.queryByText('Description coming soon')).toBeNull()
    expect(screen.getAllByRole('progressbar')).toHaveLength(ATLAS_MY_COURSES.length)
  })

  it('draws the course’s description under the title on Home, and hides it with the same control', () => {
    renderShell(`section=dashboard&version=${BASELINE}`)
    const heading = screen.getByRole('heading', { level: 2, name: /Life and Health Pre-licensing/ })
    const description = screen.getByText(ATLAS_MY_COURSES[0].description!)
    expect(heading.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    cleanup()
    renderShell(`section=dashboard&version=${BASELINE}&ff=atlas-course-description:hidden`)
    expect(screen.queryByText(ATLAS_MY_COURSES[0].description!)).toBeNull()
  })
})

describe('the actions toggle — atlas-courses-card-actions', () => {
  /* 2026-11-23, Jillienne: "a toggle variant where all of the ctas and links are hidden. user clicks on card, it loads
     course as the active course on atlas home, all the available ctas are right there." */
  it('is a design-bar control, HIDDEN by default (2026-11-23: "set this current view as the default")', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-courses-card-actions')!
    expect(flag.surface).toBe('design')
    expect(flag.defaultVariant).toBe('hidden')
  })

  it('draws no button and no link with nothing pinned — the committed default', () => {
    // Every pin but the actions one, so this reads the flag's own default.
    window.history.replaceState({}, '', `/dashboard-rebrand?demo=1&section=courses&version=${BASELINE}&ff=atlas-pages-quick-links:hidden,atlas-courses-card-style:atlas,atlas-courses-card-prd-fields:on,atlas-courses-from-library:off`)
    render(
      <MemoryRouter initialEntries={[window.location.pathname + window.location.search]}>
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
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(ATLAS_MY_COURSES.length)
    for (const card of cards) {
      expect(within(card).queryAllByRole('button')).toHaveLength(0)
      expect(within(card).queryAllByRole('link')).toHaveLength(0)
    }
  })

  it('hidden: no button, no link on any card — the card itself still opens Home', () => {
    renderShell(`${DESIGN_CARDS},atlas-courses-card-actions:hidden`)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(ATLAS_MY_COURSES.length)
    for (const card of cards) {
      expect(within(card).queryAllByRole('button')).toHaveLength(0)
      expect(within(card).queryAllByRole('link')).toHaveLength(0)
      expect(card.tabIndex).toBe(0)
      expect(card.className).toContain('cre-atlas-card-v2')
    }
    // The click goes through the router, not window.location: Home renders with this card's course in its head.
    fireEvent.click(cards[0])
    expect(screen.getByRole('heading', { level: 2, name: 'Florida Life and Health Pre-licensing' })).toBeTruthy()
    expect(screen.queryByTestId('atlas-card-facts')).toBeNull()
  })
})

describe('the card fill', () => {
  /* 2026-11-23, Jillienne, with the completed card selected: "all cards will have this background color, slightly lighter".
     One fill for every status — the finished card no longer steps back from the rest. */
  it('is the same lightened Secondary 100 on an unfinished card and a finished one', () => {
    renderShell(DESIGN_CARDS)
    const inProgress = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    const done = screen.getByRole('article', { name: 'FL Preferred Business Practices for the Insurance Producer' })
    expect(inProgress.style.background).toContain('--color-secondary-100')
    expect(inProgress.style.background).toContain('color-mix')
    expect(done.style.background).toBe(inProgress.style.background)
    expect(inProgress.style.boxShadow).toContain('--color-primary-100')
  })
})

describe('the status pill on the image', () => {
  /* 2026-11-23, Jillienne: "have the status badge be in the top left of the image area" — the shared card's badges. */
  it('sits inside the image frame, before the title', () => {
    renderShell(DESIGN_CARDS)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    const frame = within(card).getByTestId('atlas-card-image')
    expect(frame.querySelector('img')).toBeTruthy()
    // The Due Soon pill counts down (2026-11-23): "Access Ends 13 days" — the date line's own figure.
    expect(within(frame).getByText('Access Ends 13 days')).toBeTruthy()
    // …and the Completed pill carries the score (2026-11-24).
    const done = screen.getByRole('article', { name: 'FL Preferred Business Practices for the Insurance Producer' })
    expect(within(within(done).getByTestId('atlas-card-image')).getByText('Completed - Score: 92%')).toBeTruthy()
    expect(within(card).getByTestId('atlas-card-date').textContent).toContain('13 days left')
    expect(frame.compareDocumentPosition(within(card).getByRole('heading')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('puts the progress at the foot of the card, after the date line (2026-11-23)', () => {
    renderShell(DESIGN_CARDS)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    const bar = within(card).getByRole('progressbar')
    const date = within(card).getByTestId('atlas-card-date')
    expect(date.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(card.lastElementChild!.contains(bar)).toBe(true)
  })

  it('lays the card out as its own column — off the shared subgrid rows (2026-11-23)', () => {
    renderShell(DESIGN_CARDS)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    expect(card.style.display).toBe('flex')
    expect(card.style.gridTemplateRows).toBe('')
  })

  it('draws a light grey track under the fill', () => {
    renderShell(DESIGN_CARDS)
    const bar = screen.getAllByRole('progressbar')[0]
    expect(bar.style.background).toContain('--color-neutral-200')
    expect(bar.style.backgroundImage).toBe('')
  })
})

describe('the Expired pill', () => {
  /* 2026-11-23, Jillienne: "Expired badge should be a dark charcoal color". Charcoal on THIS card only — the shared pill's
     catalog is unchanged, so the 2026-11-18 card keeps Error 100 (pinned under "the flag off"). */
  it('is charcoal — Neutral 800 with light ink — on the PRD card', () => {
    renderShell(DESIGN_CARDS)
    const pill = screen.getByText('Expired', { selector: 'span' })
    expect(pill.style.background).toContain('--color-neutral-800')
    expect(pill.style.color).toContain('--color-neutral-50')
  })

  it('leaves the other five pills on the catalog’s fills', () => {
    renderShell(DESIGN_CARDS)
    expect(screen.getByText(/^Access Ends \d+ days?$/, { selector: 'span' }).style.background).toContain('--color-warning-300')
    expect(screen.getAllByText('Failed', { selector: 'span' })[0].style.background).toContain('--color-error-100')
  })
})

describe('Course Details', () => {
  /* 2026-11-23, Jillienne: "course details link should be under the primary cta at bottom of card". Under the title on
     the card before — pinned under "the flag off". */
  it('sits under the button, not under the title, on the PRD card', () => {
    renderShell(DESIGN_CARDS)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    const button = within(card).getByRole('button', { name: 'Resume Course' })
    const details = within(card).getByRole('button', { name: 'Course Details' })
    // DOM order IS visual order here — the link follows the button, and both come after the title.
    expect(button.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(card).getByRole('heading').compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('the flag off', () => {
  it('draws the 2026-11-18 card untouched — the disabled Completed button and no date line', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off,atlas-courses-card-prd-fields:off`)
    expect(screen.getByRole('button', { name: 'Completed' }).hasAttribute('disabled')).toBe(true)
    expect(screen.queryByRole('link', { name: 'View Certificate' })).toBeNull()
    expect(screen.queryByTestId('atlas-card-date')).toBeNull()
    expect(screen.queryByText('Description coming soon')).toBeNull()
  })

  it('is also reached by the bar’s Old card arm, not only by :off', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off,atlas-courses-card-prd-fields:old`)
    expect(screen.getByRole('button', { name: 'Completed' }).hasAttribute('disabled')).toBe(true)
    expect(screen.queryByTestId('atlas-card-date')).toBeNull()
  })

  it('keeps Course Details under the title', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off,atlas-courses-card-prd-fields:off`)
    const card = screen.getByRole('article', { name: 'Florida Life and Health Pre-licensing' })
    const button = within(card).getByRole('button', { name: 'Resume Course' })
    const details = within(card).getByRole('button', { name: 'Course Details' })
    expect(details.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps the Expired pill on Error 100 — the pill catalog is untouched', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-from-library:off,atlas-courses-card-prd-fields:off`)
    const pill = screen.getByText('Expired', { selector: 'span' })
    expect(pill.style.background).toContain('--color-error-100')
  })
})
