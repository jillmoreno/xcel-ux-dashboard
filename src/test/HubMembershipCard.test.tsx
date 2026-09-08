import { describe, it, expect } from 'vitest'
import {
  RENEWAL_DATE_LABEL,
  renewalStateFor,
  type MembershipRenewalStateId,
} from '@/components/membership/membershipRenewalState'

/**
 * The hub hero card has no status pill and no lead sentence, so RENEWAL_DATE_LABEL
 * is the ONLY route by which the renewal state reaches it. These guard the two
 * rules stated on the map itself — both of which are a single careless edit away.
 */
describe('RENEWAL_DATE_LABEL — the hub card date line', () => {
  const ALL: MembershipRenewalStateId[] = [
    'auto-renews',
    'expires-outside-window',
    'expires-in-window',
    'payment-failed',
    'grace',
    'expired',
  ]

  it('reads "Auto-renews on {date}" for an auto-renewing membership', () => {
    // The ask that created this map: the hero used to say "Expires 11/03/2026"
    // on a membership that renews itself on that date.
    expect(`${RENEWAL_DATE_LABEL['auto-renews']} 11/03/2026`).toBe(
      'Auto-renews on 11/03/2026',
    )
  })

  it('never says "auto-renew" on any state that is not actively auto-renewing', () => {
    // The hero label is keyed by state id, so only `auto-renews` can say it.
    // This matters more than it looks: the expires-* NOTES do now prompt the
    // setting, but "Auto-renews on {date}" is a different claim — it asserts the
    // membership WILL renew — so it must stay exclusive to the state where that
    // is true.
    for (const id of ALL) {
      if (id === 'auto-renews') continue
      expect(RENEWAL_DATE_LABEL[id].toLowerCase()).not.toContain('auto-renew')
    }
  })

  it('uses past tense once the date has passed, and never promises a renewal', () => {
    expect(RENEWAL_DATE_LABEL.expired).toBe('Expired')
    expect(RENEWAL_DATE_LABEL.grace).toBe('Expired')
  })

  it('does not label the date with an event that date is not', () => {
    // Rule 2. Every label sits on the record's `expiresOn`, so `grace` must NOT
    // read "restore by" (that deadline is `graceEndsOn`, a date this card never
    // renders) and `payment-failed` must NOT read "Payment failed" (the charge
    // failed on neither of the dates shown).
    expect(RENEWAL_DATE_LABEL.grace).not.toMatch(/restore by/i)
    expect(RENEWAL_DATE_LABEL['payment-failed']).not.toMatch(/payment failed/i)
  })

  it('covers every state, so a new one cannot render a blank date line', () => {
    for (const id of ALL) expect(RENEWAL_DATE_LABEL[id]).toBeTruthy()
    expect(Object.keys(RENEWAL_DATE_LABEL).sort()).toEqual([...ALL].sort())
  })
})

/**
 * The `expires-*` copy, after the capability fork was added and then removed
 * again on 2026-08-31. What separates the two states now is DISTANCE, not what
 * the plan is capable of: far out the card nudges the auto-renewal setting,
 * inside the window it asks for the renewal by name and price.
 */
describe('expires-* — distance decides the ask, not capability', () => {
  const at = (autoRenew: 'off', today: Date) =>
    renewalStateFor({ autoRenew, endsOn: '2026-10-15', price: 99 }, today)

  const FAR = new Date(2026, 0, 1) // ~287 days out — outside the 120-day window
  const NEAR = new Date(2026, 8, 20) // ~25 days out — inside it, and inside 45

  it('far out: nudges the setting, names no price', () => {
    const s = at('off', FAR)
    expect(s.id).toBe('expires-outside-window')
    expect(s.notes).toEqual([
      'Set up auto-renewal now for uninterrupted access to your benefits.',
    ])
    expect(s.notes.join(' ')).not.toMatch(/\$/)
  })

  it('inside the window: asks for the renewal, named and priced', () => {
    const s = at('off', NEAR)
    expect(s.id).toBe('expires-in-window')
    expect(s.notes).toEqual([
      'Renew now for $99 for uninterrupted access to your member benefits.',
    ])
  })

  it('the two `expires-*` states are one code path — no capability branch left', () => {
    // `autoRenew: 'off'` was removed 2026-08-31 once nothing read it, so
    // there is no longer a second arm to compare against. What is worth pinning
    // is that neither state inspects `autoRenew` beyond "is it on" — the date is
    // the only thing that separates them.
    for (const today of [FAR, NEAR]) {
      const s = at('off', today)
      expect(s.pill).toBe('Active')
      expect(s.lead.startsWith('Expires on')).toBe(true)
    }
    expect(at('off', FAR).id).toBe('expires-outside-window')
    expect(at('off', NEAR).id).toBe('expires-in-window')
  })

  it('the countdown rides the lead, and only inside 45 days', () => {
    expect(at('off', NEAR).lead).toBe('Expires on October 15, 2026 · 25 days left')
    // 97 days out: in the window, past the countdown gate.
    expect(at('off', new Date(2026, 6, 10)).lead).toBe('Expires on October 15, 2026')
  })
})
