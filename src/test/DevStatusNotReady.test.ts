import { describe, expect, it } from 'vitest'
import {
  DEV_STATUS_LABEL,
  DEV_STATUS_SEQUENCE,
  devStatusStrokeFor,
  featureStatusChipFor,
  isDevelopmentStatus,
  type DevStatus,
} from '@/components/prototype/devHandoffStatusUtil'

/**
 * "NOT READY" — 2026-09-24, the direct ask: a Development status that tells
 * developers not to start yet.
 *
 * ⚠ THE ONE PROPERTY WORTH PINNING is that it stays on the DEVELOPMENT board.
 * It reads like a Design status, so the plausible-looking mistake is to route
 * it to Design — and that mistake is silent: the row simply stops appearing
 * where developers look, which is the only place the flag means anything.
 */
describe('the Not Ready status', () => {
  it('keeps the row in Development', () => {
    expect(isDevelopmentStatus('not-ready')).toBe(true)
  })

  it('is not mistaken for Ready for Dev anywhere a human reads it', () => {
    /* The pair this status exists to separate. Same board, opposite meaning, so
       label and colour both have to distinguish them — a chip that differed
       only by colour would fail the repo's own "never colour alone" rule. */
    expect(DEV_STATUS_LABEL['not-ready']).toBe('Not Ready')
    expect(DEV_STATUS_LABEL['not-ready']).not.toBe(DEV_STATUS_LABEL['ready-for-dev'])
    expect(devStatusStrokeFor('not-ready')).not.toBe(devStatusStrokeFor('ready-for-dev'))
    expect(devStatusStrokeFor('not-ready', true)).not.toBe(
      devStatusStrokeFor('ready-for-dev', true),
    )
  })

  it('does not collide with the "Ready" chip a statusless row gets', () => {
    /* ⚠ THE TRAP A GREY WOULD HAVE WALKED INTO. A row with no status renders the
       word "Ready" in `--color-text-secondary` (#666666). The obvious pick for
       "parked" is a neutral, and a grey "Not Ready" would then sit beside a grey
       "Ready" — the one pairing on this board that must not be ambiguous. */
    const none = featureStatusChipFor('none')
    const notReady = featureStatusChipFor('not-ready')
    expect(notReady.label).toBe('Not Ready')
    expect(notReady.color).not.toBe(none.color)
  })

  it('sits next to Ready for Dev in the menu', () => {
    /* They are each other's opposite, and the choice between them is the one
       being made at that point in the kebab. Adjacency is the affordance. */
    const i = DEV_STATUS_SEQUENCE.indexOf('not-ready')
    expect(i).toBeGreaterThan(-1)
    expect(DEV_STATUS_SEQUENCE[i + 1]).toBe('ready-for-dev')
  })

  it('leaves every other status where it was', () => {
    /* Adding a status must not quietly re-route the existing ones. */
    const expected: Record<DevStatus, boolean> = {
      'in-design': false,
      'needs-discussion': false,
      'blocked': true,
      'not-ready': true,
      'ready-for-dev': true,
      'in-development': true,
    }
    for (const [status, inDev] of Object.entries(expected)) {
      expect(isDevelopmentStatus(status as DevStatus), status).toBe(inDev)
    }
    // …and the menu offers all of them, so a new status can't be added to the
    // type and silently never render.
    expect([...DEV_STATUS_SEQUENCE].sort()).toEqual(Object.keys(expected).sort())
  })
})
