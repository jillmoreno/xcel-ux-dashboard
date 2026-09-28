import { describe, expect, it } from 'vitest'
import { ARCHIVED_ITEMS } from '@/data/archivedItems'

/**
 * THE ARCHIVE CONVENTION, ENFORCED — 2026-09-28.
 *
 * CLAUDE.md has said for weeks that `restoreNote` is "the field most often
 * written too thinly", and nothing checked. A thin note is not a small problem:
 * the whole convention trades "delete it" for "keep it and write down how to
 * bring it back", and a row that says "re-enable the flag" has taken the cost
 * of keeping the code without buying the thing the cost was for.
 *
 * ⚠ THESE ARE STRUCTURAL CHECKS, NOT A WORD COUNT. A long note is not
 * automatically a good one, so nothing here rewards padding — the assertions are
 * about naming a place, naming a date, and not colliding.
 */
/** A file path, a backticked identifier, or an explicit "nothing to re-wire". */
function namesAPlace(text: string): boolean {
  return (
    /[\w/-]+\.(tsx?|mjs|css|json|html)\b/.test(text) ||
    /`[A-Za-z_?][\w./?=-]*`/.test(text) ||
    /no code change|nothing to re-?wire|data-only|fully intact/i.test(text)
  )
}

describe('the archive convention', () => {
  it('has rows to check', () => {
    expect(ARCHIVED_ITEMS.length).toBeGreaterThan(0)
  })

  it('gives every row the fields the Archive sheet renders', () => {
    /* The table and its detail sheet read these directly; an empty one renders
       a blank cell rather than an error. */
    for (const r of ARCHIVED_ITEMS) {
      for (const f of ['id', 'name', 'what', 'location', 'dateRemoved', 'reason', 'restoreNote'] as const) {
        expect(String(r[f] ?? '').trim(), `${r.id || '(no id)'} → ${f}`).not.toBe('')
      }
    }
  })

  it('keeps ids unique', () => {
    /* Ids key the detail sheet; a duplicate makes one row unreachable. */
    const ids = ARCHIVED_ITEMS.map((r) => r.id)
    expect(ids.length - new Set(ids).size, `duplicate ids: ${ids.join(', ')}`).toBe(0)
  })

  it('dates every removal in ISO, and not in the future', () => {
    for (const r of ARCHIVED_ITEMS) {
      expect(r.dateRemoved, `${r.id}`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(r.dateRemoved <= new Date().toISOString().slice(0, 10), `${r.id} is dated ahead`).toBe(
        true,
      )
    }
  })

  it('makes every restoreNote name a place to go', () => {
    /*
     * ⚠ THE ONE THAT ACTUALLY BITES, and the reason this suite exists. A note
     * saying "turn the flag back on" is the thin note CLAUDE.md warns about: it
     * describes the intent and not the work, so restoring starts with a search.
     *
     * The bar is deliberately low and concrete: it must name a PLACE — a file
     * path, a backticked identifier (`LearnerFocusedBand`, `DEMO_PERSONAS`), or
     * an explicit statement that nothing needs re-wiring. Not a length, because
     * padding a bad note is easier than fixing it, and a test that rewards
     * padding gets exactly that.
     *
     * ⚠ THE FIRST VERSION OF THIS DEMANDED A FILE EXTENSION and failed two of
     * the best rows in the file — notes that name their targets as backticked
     * identifiers, which is this repo's own convention throughout and carries
     * more than a path does. The rows were right and the test was wrong.
     */
    for (const r of ARCHIVED_ITEMS) {
      const names = namesAPlace(r.restoreNote)
      expect(
        names,
        `${r.id}: restoreNote names no file and does not say none is needed — ` +
          `whoever restores this starts with a grep. See the archive-a-feature skill.`,
      ).toBe(true)
    }
  })

  it('points somewhere real with `location`', () => {
    /* The row's promise is "the code is still here". If `location` names no
       file, the row cannot keep it. */
    for (const r of ARCHIVED_ITEMS) {
      expect(namesAPlace(r.location), `${r.id}: location names nowhere to go`).toBe(true)
    }
  })
})
