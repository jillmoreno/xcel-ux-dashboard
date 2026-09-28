import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CourseEntryCard } from '@/components/learning/CourseEntryCard'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'

/**
 * THE COMBINED COURSE ENTRY CARD — `course-entry-style: combined`, 2026-09-28.
 *
 * One card doing the job the COURSE PROGRESS header and the Jump Back In card
 * do as two blocks. It is a SIBLING of both — neither is touched — so what
 * these pin is that the combined arm is a LAYOUT change and not a quiet
 * redesign of the content.
 */

const STATS = [
  { value: '17 days', caption: 'To complete course' },
  { value: '26 of 42 lessons', caption: 'Completed' },
]

function card(over: Partial<Parameters<typeof CourseEntryCard>[0]> = {}) {
  return render(
    <CourseEntryCard
      courseTitle="New York Life and Health Pre-licensing"
      percent={62}
      stats={STATS}
      lessonsCompleted={26}
      {...over}
    />,
  )
}

describe('the combined course entry card', () => {
  it('carries both halves in one region', () => {
    card()
    const region = screen.getByRole('region', { name: /current course/i })
    // the header half
    expect(region.textContent).toContain('New York Life and Health Pre-licensing')
    expect(region.textContent).toContain('17 days')
    expect(region.textContent).toContain('26 of 42 lessons')
    // …and the lesson half, in the same region rather than a sibling card
    expect(region.textContent).toContain('Lesson 27')
    expect(screen.getByRole('button', { name: /resume/i })).toBeTruthy()
  })

  it('keeps the progress figure and the Details link', () => {
    /* Both were explicitly asked for, and neither is in the reference design
       this card came from — so they are the parts most likely to be "tidied"
       away by someone working from the picture. */
    card()
    expect(screen.getByText('62')).toBeTruthy()
    expect(screen.getByRole('button', { name: /details/i })).toBeTruthy()
  })

  it('drops the figure at 0%, as the split header does', () => {
    /* ⚠ ABSENT, not rendered as "0%". The figure takes its dividing rule with
       it, so the stats start at the row's edge. */
    card({ percent: 0, lessonsCompleted: 0 })
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.queryByText('%')).toBeNull()
  })

  it('leaves out the two things the ask removed', () => {
    /* ⚠ THE TARGET EXAM DATE was removed from this header on 2026-09-21 and the
       reference design still shows it; COURSE OVERVIEW was asked to be dropped.
       Both are easy to "restore" from the picture by someone who does not know
       either was a decision. */
    card()
    expect(screen.queryByText(/target exam date/i)).toBeNull()
    expect(screen.queryByText(/course overview/i)).toBeNull()
  })

  it('says the right thing in each of the three states', () => {
    /* The reference says "Begin Course" for everything, which tells someone 62%
       in to begin. All three shapes survive; that was the ask. */
    const notStarted = card({ percent: 0, lessonsCompleted: 0 })
    expect(screen.getByRole('button', { name: /start course/i })).toBeTruthy()
    notStarted.unmount()

    const started = card()
    expect(screen.getByRole('button', { name: /resume/i })).toBeTruthy()
    started.unmount()

    card({ complete: true, percent: 100 })
    expect(screen.getByRole('button', { name: /review course/i })).toBeTruthy()
    // …and at 100% the lesson line, title and estimate all go.
    expect(screen.getByText('All coursework complete')).toBeTruthy()
    expect(screen.queryByText(/Lesson 27/)).toBeNull()
    expect(screen.queryByText(/minutes/)).toBeNull()
  })

  it('renders the stats it is given, rather than deriving its own', () => {
    /* The whole claim of this A/B is that only the LAYOUT differs. If the card
       recomputed "17 days" it would eventually disagree with the split arm and
       the comparison would be measuring the wrong thing. */
    card({ stats: [{ value: '3 days', caption: 'To complete course' }] })
    expect(screen.getByText('3 days')).toBeTruthy()
    expect(screen.queryByText('17 days')).toBeNull()
  })
})

describe('the course-entry-style flag', () => {
  const flag = FEATURE_FLAGS.find((f) => f.key === 'course-entry-style')

  it('defaults to the shipped split layout', () => {
    /* ⚠ A new arm must not become the default by landing. `split` is what
       ships; `combined` is the thing under review. */
    expect(flag?.defaultVariant).toBe('split')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['split', 'combined'])
  })

  it('is born work-in-progress, so stakeholders cannot meet it yet', () => {
    /* The standing rule for a new flag — see `Maturity`. Absent would also mean
       wip, but this one says so, because it is a layout A/B someone will want
       to promote deliberately. */
    expect(flag?.maturity).toBe('wip')
  })
})
