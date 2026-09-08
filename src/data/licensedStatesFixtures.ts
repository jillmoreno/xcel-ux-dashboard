import type { Brand } from '@/context/AccountContext'

/**
 * The learner's professional licenses, per brand — each profession the learner
 * holds, and the states they're licensed in for THAT profession.
 *
 * This is the source of truth for the Recommended for You page's "Profession" +
 * "State Licensed In" filter rows. A license is a (profession, state) pair, so
 * the two rows are DEPENDENT: the State Licensed In row shows only the states
 * the learner holds for the selected profession — never a free cross-product.
 *
 * State names are FULL (e.g. "New York", not "NY"); the recommendation content
 * stores a mix of full names + abbreviations, so the panel normalizes at match
 * time (`normalizeState`) while these fixtures + the pills stay full-name.
 *
 * TODO(data): replace with the real licensing / subscription service. Populated
 * for Elite (the rebrand's seeded brand), Fitzgerald (FHEA) and XCEL; brands
 * without multi-license holdings return `[]`, so the filter rows don't render
 * for them.
 * The demo states are chosen to overlap `buildRecommendedShelves` content so a
 * (profession, state) selection always resolves to real recommendations.
 */
export type ProfessionLicense = {
  /** Profession the learner is licensed in, e.g. "Nursing". */
  profession: string
  /** States (FULL names) the learner holds a license in for this profession. */
  states: string[]
}

const LICENSED_STATES_BY_BRAND: Partial<Record<Brand, ProfessionLicense[]>> = {
  // Elite (Healthcare). California is held across all three professions (the
  // "state stays selected when switching profession" case); Pennsylvania is
  // Nursing-only and Illinois is PT-only (the "state resets to the first
  // available" case). Profession order = the default-selection order (Nursing
  // first).
  elite: [
    { profession: 'Nursing', states: ['California', 'Florida', 'New York', 'Pennsylvania', 'Texas'] },
    { profession: 'Occupational Therapy', states: ['California', 'Florida', 'New York'] },
    { profession: 'Physical Therapy', states: ['California', 'Florida', 'Illinois', 'Texas'] },
  ],
  // Fitzgerald (FHEA) — NP certification specialties.
  fitzgerald: [
    { profession: 'Family NP', states: ['California', 'Florida', 'Texas'] },
    { profession: 'Psychiatric-Mental Health NP', states: ['Florida', 'New York'] },
    { profession: 'Adult-Gerontology NP', states: ['California', 'Texas'] },
  ],
  // XCEL (insurance) — the lines of authority ARE the profession axis, and an
  // insurance producer genuinely holds a separate licence per state per line.
  //
  // This file matters more for XCEL than for the two above. On every other
  // brand the profession axis ALSO has a second source — the membership records
  // in `multiMembershipsFor` — but XCEL has no membership, so licences are the
  // only place its professions exist. Order is the default-selection order.
  //
  // Florida is held across all three (the "state stays selected when switching
  // profession" case); Georgia is L&H-only and Ohio is Personal-Lines-only (the
  // "state resets to the first available" case). Only the three lines the
  // catalog actually carries content for are listed — Life and Health are sold
  // separately too, but a learner holding the combined L&H licence is the
  // demo case.
  xcel: [
    { profession: 'Life & Health', states: ['Florida', 'Georgia', 'Texas'] },
    { profession: 'Property & Casualty', states: ['Florida', 'Texas'] },
    { profession: 'Personal Lines', states: ['Florida', 'Ohio'] },
  ],
}

/** All 50 US states (full names, alphabetical). Preview-only: the Recommended
 *  for You "50 states" Live-Preview variant swaps the license set for this so
 *  the State Licensed In row demonstrates the wrap + "Show all (N)" collapse
 *  (real license data tops out well under the 6-state cutoff). */
export const ALL_US_STATES: string[] = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
]

/** The learner's licenses for a brand (empty when none authored). */
export function licensedStatesFor(brand: Brand): ProfessionLicense[] {
  return LICENSED_STATES_BY_BRAND[brand] ?? []
}

/** The professions the learner is licensed in, in the authored order (the first
 *  is the default selection). */
export function licensedProfessionsFor(brand: Brand): string[] {
  return licensedStatesFor(brand).map((l) => l.profession)
}

/** The states (FULL names) the learner is licensed in for `profession`, sorted
 *  alphabetically (the first is the default / fallback selection). Empty when
 *  the profession isn't held. */
export function licensedStatesForProfession(brand: Brand, profession: string): string[] {
  const record = licensedStatesFor(brand).find((l) => l.profession === profession)
  return [...(record?.states ?? [])].sort((a, b) => a.localeCompare(b))
}
