import { render, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { StudyProgressPanel } from '@/components/learning/study-calendar/StudyProgressPanel'
import { act } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearExamDate,
  readExamDate,
  readExamTime,
  useExamCalendarOverlay,
  writeExamDate,
  writeExamDateTime,
} from '@/data/examDateStore'

/**
 * ONE EXAM DATE INSTEAD OF TWO — `exam-date-single-store`, 2026-10-20.
 *
 * What this pins is the seam, not the screens. Before this branch the product
 * carried two exam dates that never spoke: `cgp.examDate`, written by the
 * Schedule State Exam widget and read by the countdown, the Pacing tile and
 * the course header band; and `calendar.examDate`, a fixture seeded into
 * component state, edited by three separate calendar editors and read by
 * nothing outside the calendar. Editing in one moved nothing in the other.
 *
 * No fixture row is named here on purpose — `docs/testing.md`'s first fragile
 * rule. Each case builds the calendar shape it needs, so a fixture changing
 * its exam date cannot turn this file red.
 */

/** The narrow shape `useExamCalendarOverlay` actually constrains. */
const baseCalendar = { examDate: '2026-06-12', examTime: undefined as string | undefined, startDate: '2026-05-01' }

beforeEach(() => {
  window.localStorage.clear()
})

describe('the store carries a time beside the date', () => {
  it('keeps the date key a bare ISO string, so values already in a browser still read', () => {
    /* The reason `cgp.examTime` is a SECOND key rather than the date key
       reshaped into JSON: a reviewer's existing value has to keep working. */
    window.localStorage.setItem('cgp.examDate', '2026-07-04')
    expect(readExamDate()).toBe('2026-07-04')
    expect(readExamTime()).toBeNull()
  })

  it('writes date and time together', () => {
    writeExamDateTime('2026-07-04', '09:30')
    expect(readExamDate()).toBe('2026-07-04')
    expect(readExamTime()).toBe('09:30')
  })

  it('drops a stale time when a date is saved without one', () => {
    /* Otherwise yesterday's 9:30am slot stays attached to a date the learner
       just moved, and the card reads a time they never chose. */
    writeExamDateTime('2026-07-04', '09:30')
    writeExamDateTime('2026-08-01')
    expect(readExamDate()).toBe('2026-08-01')
    expect(readExamTime()).toBeNull()
  })

  it('rejects a malformed time but keeps the date', () => {
    writeExamDateTime('2026-07-04', '9am')
    expect(readExamDate()).toBe('2026-07-04')
    expect(readExamTime()).toBeNull()
  })

  it('clears both — a time without a date means nothing', () => {
    writeExamDateTime('2026-07-04', '09:30')
    clearExamDate()
    expect(readExamDate()).toBeNull()
    expect(readExamTime()).toBeNull()
  })
})

describe('useExamCalendarOverlay', () => {
  it('returns the calendar untouched when the flag is off', () => {
    writeExamDateTime('2026-09-09', '14:00')
    const { result } = renderHook(() => useExamCalendarOverlay(baseCalendar, false))
    expect(result.current.examDate).toBe('2026-06-12')
    expect(result.current.examTime).toBeUndefined()
  })

  it('overlays the stored date and time when the flag is on', () => {
    writeExamDateTime('2026-09-09', '14:00')
    const { result } = renderHook(() => useExamCalendarOverlay(baseCalendar, true))
    expect(result.current.examDate).toBe('2026-09-09')
    expect(result.current.examTime).toBe('14:00')
  })

  it('falls back to the calendar when the store is empty, rather than blanking the card', () => {
    const { result } = renderHook(() => useExamCalendarOverlay(baseCalendar, true))
    expect(result.current.examDate).toBe('2026-06-12')
  })

  it('leaves every other pacing field alone', () => {
    writeExamDateTime('2026-09-09')
    const { result } = renderHook(() => useExamCalendarOverlay(baseCalendar, true))
    expect(result.current.startDate).toBe('2026-05-01')
  })

  it('re-renders subscribers when another surface writes the date', () => {
    /* The whole point: a calendar editor's save has to reach the widget's
       readout without either knowing about the other. */
    const { result } = renderHook(() => useExamCalendarOverlay(baseCalendar, true))
    expect(result.current.examDate).toBe('2026-06-12')
    act(() => {
      writeExamDateTime('2026-10-31', '08:00')
    })
    expect(result.current.examDate).toBe('2026-10-31')
    expect(result.current.examTime).toBe('08:00')
  })

  it('notifies once per write, carrying date and time together', () => {
    /* Two writes would render the new date beside the OLD time first. */
    let renders = 0
    renderHook(() => {
      renders += 1
      return useExamCalendarOverlay(baseCalendar, true)
    })
    const before = renders
    act(() => {
      writeExamDateTime('2026-10-31', '08:00')
    })
    expect(renders - before).toBe(1)
  })

  it('still tracks a plain writeExamDate, which the Schedule State Exam widget uses', () => {
    const { result } = renderHook(() => useExamCalendarOverlay(baseCalendar, true))
    act(() => {
      writeExamDate('2026-11-11')
    })
    expect(result.current.examDate).toBe('2026-11-11')
  })
})

/* ------------------------------------------------------------------------ *
 * The wiring, not just the seam.
 *
 * The cases above pin the store and the hook in isolation, and they passed
 * while the panel below still showed the fixture date — a unit test cannot see
 * whether a call site actually hands the overlaid calendar to the card. These
 * render the real StudyProgressPanel and read what the Exam Date card prints.
 *
 * ⚠ The panel is imported STATICALLY at the top of this file, not with a
 * dynamic `import()` inside the helper. `docs/testing.md`'s second fragile
 * rule: a dynamic import makes the first case pay the one-off transform of
 * everything the panel pulls in, inside that case's own 5s budget — it timed
 * out at 5005ms while every later case took ~15ms. A static import pays the
 * same cost in the file's import phase, where it is not on a clock.
 * ------------------------------------------------------------------------ */

describe('StudyProgressPanel reads the stored date', () => {
  function renderPanel(flagOn: boolean) {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ 'exam-date-single-store': { enabled: flagOn } }),
    )
    return render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <StudyProgressPanel />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  /* The card prints the month in words with no separators — "MAY272026" — so
     assertions here match the month name and avoid word boundaries. The
     default panel's own fixture sits in MAY, which is what makes a JULY
     readout proof the store was read. */
  it('prints the stored date on the Exam Date card when the flag is on', () => {
    writeExamDateTime('2026-07-15', '09:30')
    const { container } = renderPanel(true)
    expect(container.textContent).toMatch(/JULY/i)
    expect(container.textContent).not.toMatch(/MAY/i)
  })

  it('keeps the calendar fixture date when the flag is off', () => {
    writeExamDateTime('2026-07-15', '09:30')
    const { container } = renderPanel(false)
    expect(container.textContent).toMatch(/MAY/i)
    expect(container.textContent).not.toMatch(/JULY/i)
  })

  it('falls back to the fixture when the store is empty', () => {
    const { container } = renderPanel(true)
    expect(container.textContent).toMatch(/MAY/i)
    expect(container.textContent).not.toMatch(/JULY/i)
  })
})
