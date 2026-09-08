import { describe, expect, it } from 'vitest'
import type { Brand } from '@/context/AccountContext'
import {
  CERT_ACTION_META,
  certificatesFor,
  type CertActionType,
  type CertificateStatus,
} from '@/data/certificateFixtures'

const BRANDS: Brand[] = ['cre', 'mckissock', 'elite', 'fitzgerald', 'stc', 'xcel']

/** Certificates whose reporting / action copy interpolates a state need a real
 *  one — 'National' / 'Federal' would render "National requires a signed
 *  affidavit". */
const NON_STATES = ['National', 'Federal']

/**
 * `certificatesFor(brand)` took a `brand` and ignored it, so every brand —
 * nursing, insurance, securities — rendered McKissock's Georgia appraiser CE.
 * These assertions pin the fix: the lists are genuinely per brand, each still
 * covers every status tab / reporting variant / action type so the page stays
 * demoable everywhere, and no brand borrows another's content.
 */
describe('certificatesFor — per-brand keying', () => {
  it('gives every brand its own list (Fitzgerald mirrors Elite by design)', () => {
    const byBrand = new Map(BRANDS.map((b) => [b, certificatesFor(b)]))
    for (const brand of BRANDS) expect(byBrand.get(brand)!.length).toBeGreaterThan(0)

    // Fitzgerald deliberately shares Elite's learner library.
    expect(certificatesFor('fitzgerald')).toBe(certificatesFor('elite'))

    // Every other pair must differ — the bug was one shared array.
    const distinct: Brand[] = ['cre', 'mckissock', 'elite', 'stc', 'xcel']
    for (const a of distinct) {
      for (const b of distinct) {
        if (a === b) continue
        const idsA = byBrand.get(a)!.map((c) => c.id)
        const idsB = new Set(byBrand.get(b)!.map((c) => c.id))
        expect(idsA.some((id) => idsB.has(id))).toBe(false)
      }
    }
  })

  it('keeps the appraisal set on McKissock only', () => {
    // The reported symptom: an insurance or nursing learner shown "Laws and
    // Regulations for GA Appraisers".
    for (const brand of BRANDS) {
      const titles = certificatesFor(brand).map((c) => c.title)
      const appraisal = titles.filter((t) => /appraiser|appraisal/i.test(t))
      if (brand === 'mckissock') expect(appraisal.length).toBeGreaterThan(0)
      else expect(appraisal).toEqual([])
    }
  })

  it('covers all three status tabs on every brand', () => {
    const statuses: CertificateStatus[] = ['completed', 'external', 'action-required']
    for (const brand of BRANDS) {
      const present = new Set(certificatesFor(brand).map((c) => c.status))
      for (const status of statuses) expect(present, `${brand} / ${status}`).toContain(status)
    }
  })

  it('covers all three CertReporting variants and all five action types', () => {
    const actions = Object.keys(CERT_ACTION_META) as CertActionType[]
    for (const brand of BRANDS) {
      const certs = certificatesFor(brand)
      const reporting = new Set(certs.map((c) => c.reporting?.status).filter(Boolean))
      for (const variant of ['reported', 'pending-roster', 'non-reporting']) {
        expect(reporting, `${brand} / ${variant}`).toContain(variant)
      }
      const seen = new Set(certs.map((c) => c.action).filter(Boolean))
      for (const action of actions) expect(seen, `${brand} / ${action}`).toContain(action)
    }
  })

  it('puts state-interpolating rows on a real state, and unique ids per brand', () => {
    for (const brand of BRANDS) {
      const certs = certificatesFor(brand)
      expect(new Set(certs.map((c) => c.id)).size, `${brand} ids`).toBe(certs.length)

      for (const cert of certs) {
        // `affidavit` copy reads "{state} requires a signed affidavit".
        if (cert.action === 'affidavit') {
          expect(NON_STATES, `${brand} / ${cert.id}`).not.toContain(cert.state)
        }
        // The non-reporting line reads "{stateAbbr} is a Non-Reporting State".
        if (cert.reporting?.status === 'non-reporting') {
          expect(cert.reporting.stateAbbr).toMatch(/^[A-Z]{2}$/)
          expect(NON_STATES, `${brand} / ${cert.id}`).not.toContain(cert.state)
        }
        // External certificates name their issuing provider on the card.
        if (cert.status === 'external') expect(cert.externalProvider).toBeTruthy()
        // Action-required certificates drive CERT_ACTION_META.
        if (cert.status === 'action-required') expect(cert.action).toBeTruthy()
      }
    }
  })
})
