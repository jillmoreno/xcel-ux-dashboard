import { readFileSync } from 'node:fs'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompassCourseRail } from '@/components/compass/CompassCourseRail'
import type { CompassCourseRailConfig } from '@/components/compass/CompassCourseRail.types'
import { COMPASS_SAMPLE_TOC_FROM_DESIGN } from '@/data/compassCourseFixtures'

/**
 * The Compass LMS Course Left Rail Navigation is CONFIG-DRIVEN — it is meant
 * for every future Compass course page — so these tests build their own
 * configs rather than leaning on the one page that uses it today.
 */
function config(overrides: Partial<CompassCourseRailConfig> = {}): CompassCourseRailConfig {
  return {
    breadcrumb: [{ label: 'Home', onSelect: () => {} }, { label: 'Overview', onSelect: () => {} }, { label: 'Course' }],
    courseTitle: 'A Course',
    progressPct: 40,
    toc: COMPASS_SAMPLE_TOC_FROM_DESIGN,
    resources: [{ id: 'help', label: 'Get Help', onSelect: () => {} }],
    ...overrides,
  }
}

describe('Compass LMS Course Left Rail Navigation', () => {
  it('draws the breadcrumb: home icon first, links between, the current page last', () => {
    const home = vi.fn()
    const overview = vi.fn()
    render(
      <CompassCourseRail
        {...config({
          breadcrumb: [
            { label: 'Home', onSelect: home },
            { label: 'Overview', onSelect: overview },
            { label: 'Course', onSelect: () => {} },
          ],
        })}
      />,
    )
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    fireEvent.click(within(crumbs).getByRole('button', { name: 'Home' }))
    fireEvent.click(within(crumbs).getByRole('button', { name: 'Overview' }))
    expect(home).toHaveBeenCalledOnce()
    expect(overview).toHaveBeenCalledOnce()
    // The last crumb is where you are — text, even when handed an onSelect.
    expect(within(crumbs).queryByRole('button', { name: 'Course' })).toBeNull()
    expect(within(crumbs).getByText('Course')).toHaveAttribute('aria-current', 'page')
  })

  it('prints the progress it is GIVEN, rounded and clamped', () => {
    const { rerender } = render(<CompassCourseRail {...config({ progressPct: 62.4 })} />)
    expect(screen.getByText('62% Complete')).toBeTruthy()
    rerender(<CompassCourseRail {...config({ progressPct: 140 })} />)
    expect(screen.getByText('100% Complete')).toBeTruthy()
  })

  it('DERIVES "Done" and "Up next" from status — nothing authors them', () => {
    render(<CompassCourseRail {...config()} />)
    expect(screen.getAllByText('Done')).toHaveLength(1)
    expect(screen.getAllByText('Up next')).toHaveLength(1)
  })

  it('"Up next" follows the current section when it moves', () => {
    render(
      <CompassCourseRail
        {...config({
          toc: [
            { id: 'a', label: 'A', status: 'done' },
            { id: 'b', label: 'B', status: 'done' },
            { id: 'c', label: 'C', status: 'current' },
            { id: 'd', label: 'D', status: 'not-started' },
            { id: 'e', label: 'E', status: 'not-started' },
          ],
        })}
      />,
    )
    expect(screen.getAllByText('Done')).toHaveLength(2)
    const upNext = screen.getByText('Up next')
    // Directly after D, the first not-started section — not after E.
    expect(upNext.closest('li')!.previousElementSibling!.textContent).toMatch(/^D/)
  })

  it('expands ONLY the current section, and marks its current lesson — without "Now"', () => {
    render(<CompassCourseRail {...config()} />)
    const lessons = screen.getByRole('list', { name: 'Chapter 1: Basic Principles of Life and Health Insurance lessons' })
    expect(within(lessons).getAllByRole('listitem')).toHaveLength(7)
    const now = lessons.querySelector<HTMLElement>('li[aria-current="step"]')!
    expect(now).toHaveAttribute('aria-current', 'step')
    expect(now.textContent).toMatch(/Nature of Insurance/)
    // The design's "Now" marker was removed (2026-09-24).
    expect(screen.queryByText('Now')).toBeNull()
  })

  it('never carries status on colour alone — every entry says it in words', () => {
    render(<CompassCourseRail {...config()} />)
    expect(screen.getByText('Course Introduction - Life and Health Pre-licensing').parentElement!.textContent).toMatch(/completed/)
    expect(screen.getByText('Exam: Nature of Insurance').parentElement!.textContent).toMatch(/not started/)
  })

  it('renders an entry with no onSelect as TEXT — no control that opens nothing', () => {
    render(<CompassCourseRail {...config()} />)
    const toc = screen.getByRole('navigation', { name: 'Table of Contents' })
    expect(within(toc).queryAllByRole('button')).toHaveLength(0)
  })

  it('turns an entry with onSelect into a button', () => {
    const open = vi.fn()
    render(
      <CompassCourseRail
        {...config({
          toc: [
            {
              id: 's',
              label: 'Section',
              status: 'current',
              children: [{ id: 'l', label: 'Lesson', status: 'current', onSelect: open }],
            },
          ],
        })}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Lesson/ }))
    expect(open).toHaveBeenCalledOnce()
  })

  it('lists its resources under RESOURCES', () => {
    const help = vi.fn()
    render(<CompassCourseRail {...config({ resources: [{ id: 'h', label: 'Get Help', onSelect: help }] })} />)
    const list = screen.getByRole('list', { name: 'Resources' })
    fireEvent.click(within(list).getByRole('button', { name: 'Get Help' }))
    expect(help).toHaveBeenCalledOnce()
  })

  it('the spine carries progress — ink beside done and current, beige after', () => {
    render(<CompassCourseRail {...config()} />)
    const lessons = screen.getByRole('list', { name: 'Chapter 1: Basic Principles of Life and Health Insurance lessons' })
    const spineOf = (label: string) =>
      (within(lessons).getByText(label).closest('li')!.firstElementChild as HTMLElement).style
        .background
    expect(spineOf('Exam: Basic Principles of Life and Health Insurance')).toBe('var(--color-compass-rail-ink)')
    expect(spineOf('Nature of Insurance')).toBe('var(--color-compass-rail-ink)')
    // Not started: the beige is the CLASS's, so hover can change it.
    expect(spineOf('Exam: Nature of Insurance')).toBe('')
    expect(
      within(lessons).getByText('Exam: Nature of Insurance').closest('li')!.firstElementChild!.className,
    ).toBe('cre-compass-toc-spine')
  })

  it('mutes what is not reached yet, lessons and sections alike', () => {
    render(<CompassCourseRail {...config()} />)
    // A not-started lesson's colour is its class's, never inline.
    const upcoming = screen.getByText('Exam: Nature of Insurance')
    expect(upcoming.className).toBe('cre-compass-toc-label')
    expect(upcoming.style.color).toBe('')
    expect(upcoming.closest('li')!.className).toBe('cre-compass-toc-child is-upcoming')
    expect(screen.getByText('Exam: Basic Principles of Life and Health Insurance').style.color).toBe('var(--color-compass-rail-text)')
    expect(screen.getByText('Policy provisions & Riders').style.color).toBe(
      'var(--color-compass-rail-upcoming-section-text)',
    )
  })

  it('sets the TOC labels in Medium (500), the current section SemiBold, the current lesson Bold', () => {
    render(<CompassCourseRail {...config()} />)
    expect(screen.getByText('Course Introduction - Life and Health Pre-licensing').style.fontWeight).toBe('500')
    expect(screen.getByText('Exam: Basic Principles of Life and Health Insurance').style.fontWeight).toBe('500')
    expect(screen.getByText('Done').style.fontWeight).toBe('500')
    // The current LESSON is a step heavier still — Bold.
    expect(screen.getByText('Nature of Insurance').style.fontWeight).toBe('700')
  })

  it('draws the section rows to Figma 13:22 — the active one taller, wrapping, on its own ink', () => {
    render(<CompassCourseRail {...config()} />)
    const active = screen.getByText('Chapter 1: Basic Principles of Life and Health Insurance')
    expect(active.closest('li')!.style.minHeight).toBe('36px')
    expect(active.style.whiteSpace).toBe('normal')
    expect(active.style.color).toBe('var(--color-compass-rail-section-ink)')
    expect(screen.getByText('Course Introduction - Life and Health Pre-licensing').closest('li')!.style.minHeight).toBe('30px')
    // The line through the active dot is what joins "Done" to the spine…
    expect(active.closest('li')!.querySelector('span[style*="position: absolute"]')).toBeTruthy()
    // …and it crosses the row's 5px padding so it leaves no gap.
    const activeLine = active.closest('li')!.querySelector<HTMLElement>('span[style*="position: absolute"]')!
    expect(activeLine.style.top).toBe('-5px')
    expect(activeLine.style.bottom).toBe('-5px')
    // …and its title sets on the same 20px line spacing as the done one.
    expect(active.style.lineHeight).toBe('20px')
  })

  it("a done section's line starts right below its check and runs to the row's foot", () => {
    render(<CompassCourseRail {...config()} />)
    const row = screen.getByText('Course Introduction - Life and Health Pre-licensing').closest('li')!
    const line = row.querySelector<HTMLElement>('span[style*="position: absolute"]')!
    // The check is 15px, 2.5px down its first line — its bottom edge is 17.5px.
    expect(line.style.top).toBe('17.5px')
    expect(line.style.bottom).toBe('-5px')
    // Upcoming sections carry no line.
    const upcoming = screen.getByText('Policy provisions & Riders').closest('li')!
    expect(upcoming.querySelector('span[style*="position: absolute"]')).toBeNull()
  })

  it('lets a long lesson title wrap, the row and its spine growing with it', () => {
    render(<CompassCourseRail {...config()} />)
    const label = screen.getByText('Exam: Basic Principles of Life and Health Insurance')
    expect(label.style.whiteSpace).toBe('normal')
    // 16px leading, and 8px between the icon and the title.
    expect(label.style.lineHeight).toBe('16px')
    expect(label.style.fontSize).toBe('12px')
    expect((label.parentElement as HTMLElement).style.gap).toBe('8px')
    const row = label.closest('li')!
    expect(row.style.minHeight).toBe('32px')
    expect(row.style.height).toBe('')
    // The spine stretches to the row, whatever its height.
    expect((row.firstElementChild as HTMLElement).style.alignSelf).toBe('stretch')
  })

  it('gives the active section dot its 5px ring (Figma 13:23), and only that dot', () => {
    render(<CompassCourseRail {...config()} />)
    const ringed = [...document.querySelectorAll<HTMLElement>('span[aria-hidden]')].filter((el) =>
      el.style.boxShadow.includes('5px'),
    )
    expect(ringed).toHaveLength(1)
    expect(ringed[0].style.boxShadow).toBe('0 0 0 5px var(--color-compass-rail-active-halo)')
    expect(ringed[0].closest('li')!.textContent).toMatch(/Basic Principles of Life and Health Insurance/)
  })

  it('gives Icon Default items the Icon Hover state (Figma 13:38)', () => {
    // jsdom has no :hover, so the rule is pinned at SOURCE: all three parts
    // of a not-started lesson change, and to the completed treatment.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    const hover = (part: string) =>
      css.match(
        new RegExp(`\\.cre-compass-toc-child\\.is-upcoming:hover \\.${part}\\s*\\{([^}]*)\\}`),
      )?.[1] ?? ''
    expect(hover('cre-compass-toc-spine')).toMatch(/--color-compass-rail-ink\)/)
    expect(hover('cre-compass-toc-ring')).toMatch(/--color-compass-rail-lesson-ink/)
    expect(hover('cre-compass-toc-label')).toMatch(/--color-compass-rail-text/)
    // …and only not-started rows carry the hook.
    render(<CompassCourseRail {...config()} />)
    expect(screen.getByText('Exam: Basic Principles of Life and Health Insurance').closest('li')!.className).toBe('')
  })

  it('marks the current lesson with a clock, not a ring', () => {
    render(<CompassCourseRail {...config()} />)
    const now = document.querySelector<HTMLElement>('li[aria-current="step"]')!
    expect(now.querySelector('svg')).toBeTruthy()
    expect(now.querySelector('.cre-compass-toc-ring')).toBeNull()
  })

  it('draws every mark with Font Awesome — no CSS-only shapes, no text slash', () => {
    const { container } = render(<CompassCourseRail {...config()} />)
    // Each TOC row's icon slot holds an SVG, in every status.
    const toc = screen.getByRole('navigation', { name: 'Table of Contents' })
    const labelled = ['Course Introduction - Life and Health Pre-licensing', 'Chapter 1: Basic Principles of Life and Health Insurance', 'Policy provisions & Riders',
      'Exam: Basic Principles of Life and Health Insurance', 'Nature of Insurance', 'Exam: Nature of Insurance']
    for (const label of labelled) {
      expect(within(toc).getByText(label).closest('li')!.querySelector('svg')).toBeTruthy()
    }
    // The breadcrumb separators are the FA slash, not a "/" character.
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(crumbs.textContent).not.toContain('/')
    expect(crumbs.querySelectorAll('svg')).toHaveLength(3) // house + two slashes
    // …and every one carries FA's own path, fetched not drawn.
    for (const svg of container.querySelectorAll('svg')) {
      expect(svg.querySelector('path')).toBeTruthy()
    }
  })

  it('keeps every colour in tokens — no inline hex', () => {
    const { container } = render(<CompassCourseRail {...config()} />)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i)
  })
})
