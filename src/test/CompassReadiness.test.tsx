import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassReadinessOverview } from '@/components/learning/CompassReadinessOverview'
import { READINESS_STAGES } from '@/data/compassReadinessFixtures'
import parity from './fixtures/compassReadinessParity.json'

/**
 * THE READINESS PROTOTYPE — parity with his build, 2026-11-05.
 *
 * `fixtures/compassReadinessParity.json` is every string his export renders,
 * captured per stage off his DOM. This suite asserts the React renders them.
 *
 * ⚠ SIXTEEN STAGES, AND THE SUITE WALKS ALL OF THEM. The states are the
 * design: Readiness appearing at q8, the two layouts, the empty one that says
 * why it is empty. A port verified at one stage is a port that looks right in
 * the screenshot someone chose.
 *
 * ⚠ HIS CHROME IS SKIPPED, not his page. `SKIPPED` holds the strings his
 * standalone export draws that this product draws for itself — the header,
 * the rail, his own stage picker — each with its reason. Nothing of the PAGE
 * is in there.
 */

/** Drawn by the product, not by this component. */
const SKIPPED = new Set([
  'Insurance Training by Colibri',
  'Jordan Navarro',
  'Home',
  'Help',
  'Overview',
  'Learn',
  'Study planner',
  'Ask Rubi',
  'Progress',
  'EXAM PREP',
  'Practice',
  'Flashcards',
  'Exam Simulator',
  'XCEL',
  'English',
  /* His own prototype chrome. */
  'Click any topic in the table to open its lessons or sub-topics.',
  'Try the Readiness and Course progress tabs, then click any topic to open it.',
  'Prev',
  'Next ›',
  '‹ Prev',
])

const renderStage = (stage: string) => {
  window.history.replaceState({}, '', '/dashboard-rebrand')
  return render(
    <MemoryRouter initialEntries={['/dashboard-rebrand']}>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassReadinessOverview stage={stage} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/**
 * ⚠ CASE AND PUNCTUATION ARE NORMALISED AWAY, and that is a deliberate loss.
 * The capture came from his `innerText`, which reports text as CSS renders it
 * — so an eyebrow styled `text-transform: uppercase` arrives as "READINESS TO
 * PASS", while jsdom's `textContent` has the "Readiness to pass" the markup
 * actually holds. The same goes for spacing: `innerText` glues inline spans
 * together ("COVERSRiders · Nonforfeiture options").
 *
 * So this compares letters and digits only. What it still catches is the
 * thing worth catching — a string his page says that this one does not. What
 * it can no longer catch is a difference of CASE or PUNCTUATION, which is a
 * real gap: "Ready (85%)" and "ready 85" would both pass. Those belong to the
 * screenshot pass, not to this one.
 */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

const present = (s: string) => {
  const want = norm(s)
  if (!want) return true
  const haystacks = [
    norm(document.body.textContent ?? ''),
    ...[...document.querySelectorAll('[title],[aria-label]')].map((e) =>
      norm(`${e.getAttribute('title') ?? ''} ${e.getAttribute('aria-label') ?? ''}`),
    ),
  ]
  return haystacks.some((h) => h.includes(want))
}

/** What his stage says that this port does not. */
const missingFor = (stage: string) =>
  (parity as Record<string, string[]>)[stage].filter((s) => !SKIPPED.has(s)).filter((s) => !present(s))

describe('the Readiness prototype — parity with his build', () => {
  for (const { key, label } of READINESS_STAGES) {
    it(`${key.toUpperCase()} · ${label}`, () => {
      const { unmount } = renderStage(key)
      /* ⚠ A TAB HIDES HALF A STAGE. u3–u5 put the lessons table behind the
         second tab, so what the first tab cannot show is counted separately
         rather than silently excused — the strings are asserted on the stage
         that shows them. */
      const missing = missingFor(key)
      unmount()
      expect(missing, `${key}: ${missing.slice(0, 6).join(' | ')}`).toEqual([])
    })
  }

  it('⚠ Readiness does not exist before the certificate', () => {
    /* HIS FIRST ARGUMENT. q1–q7 have no Readiness at all — not a 0% ring, not
       an empty state: the measure is absent, because nothing has been
       practised. q8 is the moment it appears. A port that drew a zeroed ring
       through the course would be making a claim he deliberately does not. */
    const { unmount } = renderStage('q2')
    /* ⚠ NO READINESS COLUMN AT ALL — his `colReady` is false on every QE
       stage, so the lessons table is three columns wide. An empty Readiness
       column saying "Not enough data yet" on every row (which this port drew
       at first) contradicts the claim with a blank. */
    expect(screen.queryByRole('columnheader', { name: /Readiness/ })).toBeNull()
    expect(screen.getByRole('columnheader', { name: /Lessons · Course/ })).toBeTruthy()
    expect(screen.queryByLabelText(/Readiness to pass/)).toBeNull()
    unmount()
    renderStage('q8')
    expect(screen.getByText(/Exam Prep · unlocked|EXAM PREP · UNLOCKED/i)).toBeTruthy()
  })

  it('⚠ the two signals stay separate, and the page says so', () => {
    /* The sentence the whole unified design exists to make true. */
    renderStage('u3')
    expect(
      screen.getByText(/Two separate signals: lessons build Progress, Exam Prep practice builds Readiness/),
    ).toBeTruthy()
    expect(screen.getByText('from Exam Prep practice only')).toBeTruthy()
    expect(screen.getByText('from your course lessons')).toBeTruthy()
  })
})
