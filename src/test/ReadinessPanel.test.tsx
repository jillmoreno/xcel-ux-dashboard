import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { ReadinessPanel } from '@/components/readiness/ReadinessPanel'
import {
  bandFor,
  readinessFor,
  PASS_MARK,
  READINESS_FREQUENCY_NOTE,
  REVIEW_THRESHOLD,
  STRONG_THRESHOLD,
} from '@/data/readinessFixtures'

/**
 * Exam Readiness — the Figma "Exam Summary" port.
 *
 * The three Figma URLs were ONE screen in three states of its Chapter & Topic
 * filter, so the filter is the thing the design actually specifies three times
 * and the thing most worth pinning here.
 */

const DATA = readinessFor('xcel')

function renderPanel() {
  return render(
    <AccountProvider>
      <ReadinessPanel />
    </AccountProvider>,
  )
}

function pill(name: string) {
  return screen.getByRole('tab', { name })
}

/** The breakdown moved to its own tab on 2026-09-09, so the filter tests open
 *  it first. Kept as a helper rather than repeated: if the tab is renamed
 *  again, one line moves. */
function openInsights() {
  fireEvent.click(screen.getByRole('tab', { name: 'Insights' }))
}

function counts() {
  const m = document.body.textContent?.match(/(\d+) chapters · (\d+) topics/)
  return { chapters: Number(m?.[1]), topics: Number(m?.[2]) }
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('the Chapter & Topic filter', () => {
  it('partitions the set — nothing is filtered out of existence', () => {
    // The invariant the three Figma states are really about: "I Should Review"
    // and "I Know This" must sum to "Show All". A per-view assertion passes
    // happily while a chapter falls into neither group, which is the bug that
    // matters — a weak chapter silently disappearing from a review worklist.
    renderPanel()
    openInsights()
    fireEvent.click(pill('I Should Review'))
    const review = counts()
    fireEvent.click(pill('I Know This'))
    const know = counts()
    fireEvent.click(pill('Show All'))
    const all = counts()

    expect(all.chapters).toBe(DATA.chapters.length)
    expect(all.topics).toBe(DATA.topics.length)
    expect(review.chapters + know.chapters).toBe(all.chapters)
    expect(review.topics + know.topics).toBe(all.topics)
    // Both halves are non-empty in the fixture, so neither view is vacuously
    // passing the sum above.
    expect(review.chapters).toBeGreaterThan(0)
    expect(know.chapters).toBeGreaterThan(0)
  })

  it('puts a chapter on exactly the side `bandFor` says', () => {
    // The filter and the coloured dot read the SAME rule. If they ever fork, a
    // chapter can sit in "I Know This" wearing a red dot, which is worse than
    // either view being wrong on its own.
    //
    // Scoped to the Chapters column: several chapter and topic names are the
    // same words ("Annuities", "Long-Term Care", "Disability Income"), so an
    // unscoped text query answers about the wrong column — and would have
    // passed here for the wrong reason.
    renderPanel()
    openInsights()
    fireEvent.click(pill('I Should Review'))
    const column = screen.getByRole('group', { name: 'Chapters' })
    for (const c of DATA.chapters) {
      const present = within(column).queryByText(c.title) !== null
      expect(present, `${c.title} at ${c.pct}%`).toBe(bandFor(c.pct) === 'review')
    }
  })

  it('does the same for topics, which have their own scores', () => {
    // Topics are not derived from chapters — a learner can be strong on the
    // Annuities CHAPTER and weak on the Annuities TOPIC, which is exactly why
    // the design shows both columns.
    renderPanel()
    openInsights()
    fireEvent.click(pill('I Should Review'))
    const column = screen.getByRole('group', { name: 'Topics' })
    for (const t of DATA.topics) {
      const present = within(column).queryByText(t.title) !== null
      expect(present, `${t.title} at ${t.pct}%`).toBe(bandFor(t.pct) === 'review')
    }
  })

  it('sorts the worklist worst-first, and Show All by chapter number', () => {
    // "I Should Review" is a worklist, so the weakest chapter leads. Show All
    // is a reference, so it keeps the syllabus order the design shows.
    renderPanel()
    openInsights()
    fireEvent.click(pill('I Should Review'))
    const firstReview = DATA.chapters
      .filter((c) => bandFor(c.pct) === 'review')
      .sort((a, b) => a.pct - b.pct)[0]
    const col = () => screen.getByRole('group', { name: 'Chapters' })
    expect(within(col()).getAllByText(/^Chapter \d+:$/)[0].parentElement?.textContent).toContain(
      firstReview.title,
    )

    fireEvent.click(pill('Show All'))
    expect(within(col()).getAllByText(/^Chapter \d+:$/)[0].textContent).toBe(
      `Chapter ${DATA.chapters[0].number}:`,
    )
  })
})

describe('the readiness score', () => {
  it('states the frequency, which the design does not', () => {
    // The Figma explains the score's INPUTS and stops. The XCEL walk-through
    // had already decided a readiness number must state a frequency rather
    // than imply a probability — that decision is older than this screen and
    // is the difference between an estimate and a promise.
    renderPanel()
    expect(screen.getByText(READINESS_FREQUENCY_NOTE)).toBeInTheDocument()
  })

  it('names the path it is scoring', () => {
    // A learner with two paths must not have to guess which one this is about.
    renderPanel()
    expect(screen.getByText(DATA.pathTitle)).toBeInTheDocument()
  })

  it('exposes the score AND the pass mark as a meter, not an image', () => {
    // The arc's whole meaning is the distance to the mark, carried by colour
    // and a tick — neither of which reaches a screen reader. `role="meter"`
    // with a valuetext says both numbers and the band; the SVG itself is
    // aria-hidden, so this is the ONLY route to that information.
    renderPanel()
    const meter = screen.getByRole('meter', { name: /readiness score/i })
    expect(meter).toHaveAttribute('aria-valuenow', String(DATA.score))
    expect(meter.getAttribute('aria-valuetext')).toMatch(
      new RegExp(`${DATA.score} out of 100. ${PASS_MARK} required to pass`),
    )
  })

  it('states the pass mark the same in the gauge and in What to Expect', () => {
    // Two surfaces, one tab apart, so nobody sees both at once — exactly where
    // a second literal would rot unnoticed. Both read PASS_MARK.
    renderPanel()
    expect(screen.getByText(`${PASS_MARK} to pass`)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'What to Expect' }))
    expect(screen.getByText(`${PASS_MARK}%`)).toBeInTheDocument()
  })
})

describe('the band thresholds', () => {
  it('are one rule, applied at the edges', () => {
    expect(bandFor(REVIEW_THRESHOLD - 1)).toBe('review')
    expect(bandFor(REVIEW_THRESHOLD)).toBe('shaky')
    expect(bandFor(STRONG_THRESHOLD - 1)).toBe('shaky')
    expect(bandFor(STRONG_THRESHOLD)).toBe('strong')
  })
})

describe('the Practice Exams tab', () => {
  it('keeps practice and licensing attempts as separate lists', () => {
    // Not a labelling nicety: practice attempts are ours and we score them,
    // licensing attempts are sat at PSI and only their outcome reaches us —
    // the same split the exam task-type spec found between `exam` and
    // `licensing-exam`. Merging them into "attempts" is the regression.
    renderPanel()
    fireEvent.click(screen.getByRole('tab', { name: 'Practice Exams' }))
    expect(screen.getByRole('heading', { name: 'Practice exams' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Licensing exam' })).toBeInTheDocument()
    for (const a of [...DATA.practiceExams, ...DATA.licensingExams]) {
      expect(screen.getByText(a.label)).toBeInTheDocument()
    }
  })

  it('leaves an unscored attempt BLANK rather than showing a dash', () => {
    // The admin-tool convention: a placeholder in an inapplicable cell reads as
    // a value we failed to fetch. Asserted against a built attempt so it does
    // not depend on the fixture happening to contain one.
    renderPanel()
    fireEvent.click(screen.getByRole('tab', { name: 'Practice Exams' }))
    const rows = screen.getAllByRole('listitem')
    for (const row of rows) {
      expect(within(row).queryByText(/^(n\/a|—|-)$/i)).toBeNull()
    }
  })
})

describe('the tab set', () => {
  it('puts Insights SECOND, right after the score', () => {
    // Order is the decision, not just membership. The breakdown is the answer
    // to the question the score raises, so anywhere after "What to Expect"
    // buries it behind exam-day logistics. Asserted as a sequence, because a
    // presence check passes just as happily with the tabs in any order.
    renderPanel()
    expect(
      screen
        .getAllByRole('tab')
        .map((t) => t.textContent?.trim())
        .slice(0, 4),
    ).toEqual(['Exam Readiness', 'Insights', 'What to Expect', 'Practice Exams'])
  })

  it('hands off from the score to Insights', () => {
    // The score's own copy says "aim for the green". Splitting the breakdown
    // into its own tab moved the answer a click away, so the link is what keeps
    // that sentence actionable — on the design's single long page the
    // breakdown was simply the next thing down.
    renderPanel()
    expect(screen.queryByRole('group', { name: 'Chapters' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /see what to review/i }))
    expect(screen.getByRole('group', { name: 'Chapters' })).toBeInTheDocument()
  })
})
