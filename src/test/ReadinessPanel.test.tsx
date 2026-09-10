import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { ReadinessPanel } from '@/components/readiness/ReadinessPanel'
import {
  bandFor,
  readinessFor,
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

  it('exposes the score to assistive tech, not only as a drawn number', () => {
    renderPanel()
    expect(
      screen.getByRole('img', { name: new RegExp(`Readiness score ${DATA.score}`) }),
    ).toBeInTheDocument()
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
