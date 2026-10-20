/**
 * ATLAS ADMIN — CONTRACT PRICING (2026-10-20, feat/atlas-admin). What
 * Product offering shows and what an invite charges: every US state, the
 * lines of business, an invented list price per state and line, and the
 * agency's 20% (the rate Settings shows). Jordan Lee is invented, as the
 * reference's rep is.
 */

export const US_STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
]

export const LINES: [string, string, number][] = [
  ['life', 'Life', 249],
  ['health', 'Health', 249],
  ['lh', 'Life & Health', 399],
  ['pc', 'Property & Casualty', 359],
  ['personal', 'Personal Lines', 299],
]

export const AGENCY_DISCOUNT = 20
export const SALES_REP = { name: 'Jordan Lee', email: 'jordan.lee@xcelsolutions.example.com', phone: '555-0142' }

export function listPrice(state: string, line: string) {
  const base = LINES.find(([k]) => k === line)![2]
  const i = US_STATES.findIndex(([c]) => c === state)
  return base + ((i * 7) % 6) * 10
}

/** The price a recruit pays at the agency rate. */
export function agencyPrice(state: string, line: string) {
  return Math.round(listPrice(state, line) * (1 - AGENCY_DISCOUNT / 100))
}
