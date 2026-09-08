import { describe, expect, it } from 'vitest'
import type { QaNote } from '@/data/qaNotes'
import { exportAsDataFile, type MergedNote } from '@/data/qaNoteStore'

/**
 * The export exists so findings authored on the live page can be snapshotted
 * back into `qaNotes.ts` — the Blobs store is not in git and not backed up. If
 * what it emits does not parse, that escape hatch is closed and nobody finds out
 * until they need it.
 *
 * Fixtures rather than the real `QA_NOTES`, which is deliberately EMPTY now that
 * findings are authored on the page. A test that read it would assert nothing —
 * and before it was emptied it asserted things about specific seeded findings,
 * which is a test of the data rather than of the exporter.
 */

const QUOTED: QaNote = {
  id: 'QA-001',
  title: 'Unspecified second action "Go to My Courses"',
  severity: 'Blocker',
  status: 'Open',
  loggedDate: '2026-08-26',
  bullets: ['Not in the approved reference', '  Wraps at the current width'],
  screens: [
    { label: 'Expected', src: '/qa/qa-001-expected.png' },
    { label: 'Actual', src: null },
  ],
}

const MINIMAL: QaNote = {
  id: 'QA-002',
  title: 'Legend clipped',
  severity: 'Low',
  status: "Won't fix",
  loggedDate: '2026-08-26',
  bullets: [],
  screens: [],
}

const NOTES: MergedNote[] = [
  { ...QUOTED, origin: 'authored' },
  { ...MINIMAL, origin: 'committed' },
]

/** Strip the TS annotation and evaluate the array literal. A syntax error — an
 *  unescaped quote, a stray comma — throws here. */
function parse(text: string): QaNote[] {
  const literal = text.replace(/^export const QA_NOTES: QaNote\[\] = /, '').trim()
  return new Function(`return ${literal}`)() as QaNote[]
}

describe('exportAsDataFile', () => {
  it('emits an empty array for an empty store', () => {
    expect(parse(exportAsDataFile([]))).toEqual([])
  })

  it('round-trips every field, including quotes in the title', () => {
    const parsed = parse(exportAsDataFile(NOTES))
    expect(parsed).toHaveLength(2)
    // `origin` is where the record was READ from; it means nothing in a file
    // where everything is committed, so it must not be emitted.
    expect(parsed[0]).not.toHaveProperty('origin')
    expect(parsed[0]).toEqual(QUOTED)
    expect(parsed[1]).toEqual(MINIMAL)
  })

  it('preserves the two-space nesting prefix on bullets', () => {
    const parsed = parse(exportAsDataFile(NOTES))
    expect(parsed[0].bullets[1]).toBe('  Wraps at the current width')
  })

  it('keeps a screen whose src is null', () => {
    const parsed = parse(exportAsDataFile(NOTES))
    expect(parsed[0].screens[1]).toEqual({ label: 'Actual', src: null })
  })
})
