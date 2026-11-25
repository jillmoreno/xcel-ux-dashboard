/**
 * HOW LONG A PRE-LICENSING CERTIFICATE IS GOOD FOR, BY STATE — 2026-11-25.
 *
 * Verbatim from the Certificates and Transcripts PRD (Chi Wang, Atlas Platform
 * Space), §3a's table: the nineteen regulated states, each with the term its
 * certificate runs for, counted from completion (the PRD allows "completion or
 * issue"; for us the two are the same date). A state not in this table is one
 * of the thirty-three unregulated ones — no certificate is required there, and
 * the row on the transcript is the learner's record.
 *
 * ⚠ THIS REPLACES TWO INVENTED RULES in the 2026-11-19 transcripts table: a
 * flat five months for every certificate (`CERT_VALID_MONTHS`) and three
 * hard-coded ids that never expired (`NO_EXPIRY`). Both stay in the unforked
 * `TranscriptsPanel.tsx`; nothing here reaches it.
 *
 * ⚠ OHIO IS 180 DAYS, NOT SIX MONTHS. They differ by up to four days, and a
 * regulator counting days will not round. The unit is kept on the rule so the
 * arithmetic cannot quietly become months — `StateCertificateRules.test.ts`
 * pins it.
 */
export type CertificateTerm =
  | { unit: 'years'; n: number }
  | { unit: 'months'; n: number }
  | { unit: 'days'; n: number }

export type StateCertificateRule = {
  /** The full state name, as `TranscriptRecord.state` carries it. */
  state: string
  code: string
  /** `null`: the certificate never expires (Minnesota, New Jersey, New York). */
  term: CertificateTerm | null
  /** Where the term counts from. The PRD gives both; they are one date here. */
  from: 'completion' | 'issue'
}

const y = (n: number): CertificateTerm => ({ unit: 'years', n })
const mo = (n: number): CertificateTerm => ({ unit: 'months', n })
const d = (n: number): CertificateTerm => ({ unit: 'days', n })

/** The PRD's nineteen, in its order. */
export const STATE_CERTIFICATE_RULES: readonly StateCertificateRule[] = [
  { state: 'Arkansas', code: 'AR', term: y(2), from: 'completion' },
  { state: 'California', code: 'CA', term: y(3), from: 'completion' },
  { state: 'Colorado', code: 'CO', term: y(1), from: 'completion' },
  { state: 'Connecticut', code: 'CT', term: y(1), from: 'completion' },
  { state: 'Florida', code: 'FL', term: y(4), from: 'completion' },
  { state: 'Georgia', code: 'GA', term: y(1), from: 'completion' },
  { state: 'Illinois', code: 'IL', term: y(1), from: 'completion' },
  { state: 'Indiana', code: 'IN', term: mo(6), from: 'completion' },
  { state: 'Kentucky', code: 'KY', term: y(1), from: 'completion' },
  { state: 'Michigan', code: 'MI', term: y(1), from: 'completion' },
  { state: 'Minnesota', code: 'MN', term: null, from: 'completion' },
  { state: 'Mississippi', code: 'MS', term: y(1), from: 'completion' },
  { state: 'Nevada', code: 'NV', term: y(2), from: 'completion' },
  { state: 'New Jersey', code: 'NJ', term: null, from: 'completion' },
  { state: 'New York', code: 'NY', term: null, from: 'completion' },
  { state: 'Ohio', code: 'OH', term: d(180), from: 'completion' },
  { state: 'Oregon', code: 'OR', term: y(1), from: 'completion' },
  { state: 'West Virginia', code: 'WV', term: mo(6), from: 'completion' },
  { state: 'Wisconsin', code: 'WI', term: y(1), from: 'completion' },
]

/**
 * THE FIVE STATES THAT ASK FOR A HOME ADDRESS before the certificate is
 * released (PRD §3b) — collected in the affidavit flow after the exam. A
 * completion in one of these with no address on file is "Address required".
 */
export const HOME_ADDRESS_STATES: ReadonlySet<string> = new Set(['Arkansas', 'Colorado', 'Connecticut', 'Florida', 'Georgia'])

/** The rule for a state, by full name or two-letter code; `null` for an unregulated state. */
export function stateCertificateRule(state: string): StateCertificateRule | null {
  const key = state.trim().toLowerCase()
  return STATE_CERTIFICATE_RULES.find((r) => r.state.toLowerCase() === key || r.code.toLowerCase() === key) ?? null
}

/** Whether the state is one of the PRD's nineteen. */
export function isRegulatedState(state: string): boolean {
  return stateCertificateRule(state) !== null
}

/**
 * The day a certificate is valid until, as ISO `yyyy-mm-dd` — the completion
 * date plus the state's term. Months and years land on the same day of the
 * later month, clamped to that month's last day (31 Aug + 6 months is 28 Feb);
 * days are counted exactly. `null` when the state's certificate never expires
 * or the state is unregulated.
 *
 * Calendar arithmetic only — no clock, no zone. The PRD's "Pacific Time" is
 * the day boundary the expiry flips on, and a date with no time cannot be
 * misread across it.
 */
export function certificateValidUntil(state: string, completedIso: string): string | null {
  const rule = stateCertificateRule(state)
  if (!rule || !rule.term) return null
  const [y0, m0, d0] = completedIso.split('-').map(Number)
  if (!y0 || !m0 || !d0) return null
  if (rule.term.unit === 'days') {
    const t = new Date(Date.UTC(y0, m0 - 1, d0 + rule.term.n))
    return isoOf(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())
  }
  const months = rule.term.unit === 'years' ? rule.term.n * 12 : rule.term.n
  const first = new Date(Date.UTC(y0, m0 - 1 + months, 1))
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  return isoOf(first.getUTCFullYear(), first.getUTCMonth() + 1, Math.min(d0, lastDay))
}

/** `yyyy-mm-dd` of a local calendar date, so a `Date` can be compared to the ISO strings above. */
export function isoDateOf(date: Date): string {
  return isoOf(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

function isoOf(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
