import { describe, expect, it } from 'vitest'
import {
  HOME_ADDRESS_STATES,
  STATE_CERTIFICATE_RULES,
  certificateValidUntil,
  isRegulatedState,
  stateCertificateRule,
} from '@/data/stateCertificateRules'
import { certificateStatus, type TranscriptRecord } from '@/data/transcriptFixtures'

/**
 * THE STATES' CERTIFICATE RULES (PRD §3a, Chi Wang) — the three edge cases the
 * build prompt asked to pin (2026-11-25): Ohio's 180 days are days, not six
 * months; the three no-expiry states never expire; and a certificate flips to
 * Expired the day AFTER its valid-until day, not on it.
 */
const row = (state: string, completedDate: string, extra: Partial<TranscriptRecord> = {}): TranscriptRecord => ({
  id: `t-test-${state}`,
  title: 'Test Pre-License Course',
  profession: 'Insurance Pre-Licensing',
  state,
  hours: 20,
  enrolledDate: completedDate,
  completedDate,
  ...extra,
})

describe('the table', () => {
  it('holds the PRD’s nineteen regulated states, each once', () => {
    expect(STATE_CERTIFICATE_RULES.length).toBe(19)
    expect(new Set(STATE_CERTIFICATE_RULES.map((r) => r.state)).size).toBe(19)
    expect(new Set(STATE_CERTIFICATE_RULES.map((r) => r.code)).size).toBe(19)
  })

  it('answers by name or code, and calls anything else unregulated', () => {
    expect(stateCertificateRule('Florida')?.code).toBe('FL')
    expect(stateCertificateRule('fl')?.state).toBe('Florida')
    expect(isRegulatedState('Texas')).toBe(false)
    expect(isRegulatedState('TX')).toBe(false)
    expect(stateCertificateRule('Texas')).toBeNull()
  })

  it('names the five home-address states (PRD §3b)', () => {
    expect([...HOME_ADDRESS_STATES].sort()).toEqual(['Arkansas', 'Colorado', 'Connecticut', 'Florida', 'Georgia'])
    for (const s of HOME_ADDRESS_STATES) expect(isRegulatedState(s)).toBe(true)
  })
})

describe('the valid-until day', () => {
  it('counts Ohio in days — 180, not six months', () => {
    expect(stateCertificateRule('Ohio')?.term).toEqual({ unit: 'days', n: 180 })
    // 2025-10-20 + 180 days = 2026-04-18; six months would be 2026-04-20.
    expect(certificateValidUntil('Ohio', '2025-10-20')).toBe('2026-04-18')
    expect(certificateValidUntil('Ohio', '2026-01-15')).toBe('2026-07-14')
  })

  it('counts years and months on the same day of the later month, clamped', () => {
    expect(certificateValidUntil('Florida', '2024-10-04')).toBe('2028-10-04') // 4y
    expect(certificateValidUntil('Georgia', '2026-03-02')).toBe('2027-03-02') // 1y
    expect(certificateValidUntil('Indiana', '2025-08-31')).toBe('2026-02-28') // 6mo, 31 Aug → 28 Feb
    expect(certificateValidUntil('West Virginia', '2025-12-31')).toBe('2026-06-30') // 6mo, 31 Dec → 30 Jun
  })

  it('is null for the states with no expiry, and for an unregulated one', () => {
    for (const s of ['Minnesota', 'New Jersey', 'New York']) {
      expect(stateCertificateRule(s)?.term).toBeNull()
      expect(certificateValidUntil(s, '2020-01-01')).toBeNull()
    }
    expect(certificateValidUntil('Texas', '2020-01-01')).toBeNull()
  })
})

describe('the status over time', () => {
  it('flips to Expired the day after valid-until, not on it', () => {
    const r = row('Ohio', '2026-01-15') // valid till 2026-07-14
    expect(certificateStatus(r, new Date(2026, 6, 13))).toBe('ready')
    expect(certificateStatus(r, new Date(2026, 6, 14))).toBe('ready') // on the day: still valid
    expect(certificateStatus(r, new Date(2026, 6, 15))).toBe('expired') // the day after
  })

  it('never expires a no-expiry state, however late', () => {
    expect(certificateStatus(row('New York', '2015-01-01'), new Date(2040, 0, 1))).toBe('ready')
  })

  it('reads an unregulated state as Not required, whatever the dates', () => {
    expect(certificateStatus(row('Texas', '2015-01-01'), new Date(2040, 0, 1))).toBe('not-required')
  })

  it('asks for the address only in the five states, and only with none on file', () => {
    expect(certificateStatus(row('Georgia', '2026-03-02', { homeAddressOnFile: false }), new Date(2026, 4, 11))).toBe('address-required')
    expect(certificateStatus(row('Georgia', '2026-03-02', { homeAddressOnFile: true }), new Date(2026, 4, 11))).toBe('ready')
    expect(certificateStatus(row('Georgia', '2026-03-02'), new Date(2026, 4, 11))).toBe('ready') // absent counts as on file
    expect(certificateStatus(row('Ohio', '2026-01-15', { homeAddressOnFile: false }), new Date(2026, 4, 11))).toBe('ready')
  })

  it('puts Voided first, whatever else is true', () => {
    expect(certificateStatus(row('Texas', '2015-01-01', { voided: true }), new Date(2040, 0, 1))).toBe('voided')
  })
})
