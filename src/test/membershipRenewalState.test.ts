import { describe, it, expect } from 'vitest'
import {
  daysUntil,
  formatRenewalDate,
  renewalStateFor,
  RENEWAL_WINDOW_DAYS,
} from '@/components/membership/membershipRenewalState'
import type { MembershipRenewal } from '@/context/AccountContext'

/**
 * The renewal-state machine behind the membership card, per
 * `explorations/membership-card-ui/renewal-states-copy-review.html`.
 *
 * `today` is injected everywhere so these don't rot as the real date moves —
 * the whole point of the "one source date, derive the countdown" rule is that
 * the copy is a function of (data, today).
 */
const TODAY = new Date(2026, 7, 21) // 2026-08-21, local

function renewal(over: Partial<MembershipRenewal> = {}): MembershipRenewal {
  return { autoRenew: 'on', endsOn: '2026-12-05', price: 48, ...over }
}

describe('renewalStateFor', () => {
  it('state 1 — auto-renews: neutral countdown, charge disclosed, Manage membership', () => {
    const s = renewalStateFor(renewal(), TODAY)
    expect(s.id).toBe('auto-renews')
    expect(s.pill).toBe('Active')
    expect(s.pillTone).toBe('active')
    expect(s.lead).toBe('Renews automatically on December 5, 2026')
    expect(s.notes[0]).toBe('106 days left.')
    // Split out of `notes` so the Manage sheet can omit it (its own "Next
    // charge" row says it) without dropping it from the card, where nothing
    // else discloses the automatic charge.
    expect(s.chargeNote).toBe('We’ll charge $48 to your card on file for another year.')
    expect(s.cta).toBe('Manage membership')
  })

  it('state 2 — expires inside the window: asks for the renewal, named and priced', () => {
    const s = renewalStateFor(renewal({ autoRenew: 'off' }), TODAY)
    expect(s.id).toBe('expires-in-window')
    // 106 days out: inside RENEWAL_WINDOW_DAYS but past COUNTDOWN_DAYS, so the
    // date reads flat with no countdown appended.
    expect(s.lead).toBe('Expires on December 5, 2026')
    // REWRITTEN 2026-08-31. This asserted the both-halves rule (benefits end,
    // certificates and progress stay). That rule was dropped from the model in
    // the same pass — see the RECORD_STAYS removal note in the source.
    expect(s.notes).toEqual([
      'Renew now for $48 for uninterrupted access to your member benefits.',
    ])
    expect(s.cta).toBe('Renew now')
  })

  it('state 7 — expires outside the window: informational, no ask, no price', () => {
    const far = new Date(2026, 0, 1) // ~338 days out
    const s = renewalStateFor(renewal({ autoRenew: 'off' }), far)
    expect(s.id).toBe('expires-outside-window')
    // Same lead form as state 2, minus the countdown (always > COUNTDOWN_DAYS).
    expect(s.lead).toBe('Expires on December 5, 2026')
    // Still no price out here — the ask is the SETTING, not the renewal.
    expect(s.notes).toEqual([
      'Set up auto-renewal now for uninterrupted access to your benefits.',
    ])
    expect(s.notes.join(' ')).not.toMatch(/\$/)
    expect(s.cta).toBe('Manage membership')
  })

  it('the DATE picks the state for anything not auto-renewing', () => {
    // History: `auto-renew-off` was its own state until 2026-08-27, when the
    // Manage sheet started offering the toggle on every membership and "you
    // switched it off" and "this plan can't" became one situation. That merge
    // left `autoRenew: 'off'` carrying no meaning, and it was removed
    // 2026-08-31 — so this no longer compares two values, it asserts the rule
    // that survived them: once auto-renewal is not on, the date decides.
    expect(renewalStateFor(renewal({ autoRenew: 'off' }), TODAY).id).toBe('expires-in-window')

    const far = new Date(2026, 0, 1) // ~338 days out
    expect(renewalStateFor(renewal({ autoRenew: 'off' }), far).id).toBe(
      'expires-outside-window',
    )
  })

  it('state 4 — payment failed outranks everything, and the deadline is the retry window', () => {
    const s = renewalStateFor(renewal({ retryUntil: '2026-09-02' }), TODAY)
    expect(s.id).toBe('payment-failed')
    expect(s.pill).toBe('Action needed')
    expect(s.lead).toBe('Your card on file was declined.')
    expect(s.leadTone).toBe('error')
    expect(s.notes).toEqual(['Update your payment method to process your $48 renewal.'])
    // CHANGED 2026-08-31: the retry deadline is no longer spoken. `retryUntil`
    // still SELECTS this state, and benefitsAreActive() still counts it active,
    // but the copy that used to say why ("Benefits stay active until …") is gone.
    // Asserted so its removal stays deliberate rather than drifting back.
    expect(s.notes.join(' ')).not.toMatch(/September 2/)
    expect(s.cta).toBe('Update payment method')
  })

  it('state 6 — grace period: expired but the membership year is recoverable', () => {
    const s = renewalStateFor(
      renewal({ endsOn: '2026-08-10', graceEndsOn: '2026-09-05' }),
      TODAY,
    )
    expect(s.id).toBe('grace')
    // CHANGED 2026-08-31: reads as a red "Expired", identical to state 3's pill.
    // The two are no longer separable by pill — the note is what distinguishes
    // them, by naming a restore-by date and what restoring recovers.
    expect(s.pill).toBe('Expired')
    expect(s.pillTone).toBe('expired')
    expect(s.leadTone).toBe('error')
    expect(s.lead).toBe('Expired August 10, 2026')
    expect(s.notes).toEqual([
      'Renew for $48 by September 5, and your membership year picks up where it left off.',
    ])
    expect(s.cta).toBe('Restore membership')
  })

  it('state 3 — expired: no countdown, and the record-stays half is stated', () => {
    const s = renewalStateFor(renewal({ endsOn: '2026-08-10' }), TODAY)
    expect(s.id).toBe('expired')
    expect(s.pill).toBe('Expired')
    expect(s.pillTone).toBe('expired')
    expect(s.lead).toBe('Expired on August 10, 2026')
    // Nothing left to count down to.
    expect(s.notes.join(' ')).not.toMatch(/days left/)
    // REWRITTEN 2026-08-31: this asserted the record-stays half ("still yours").
    // That sentence left the model with RECORD_STAYS; it now lives only in
    // CANCEL_RECORD_STAYS, which the cancellation flow renders.
    expect(s.notes).toEqual(['Restore your membership for $48'])
    expect(s.cta).toBe('Restore membership')
  })

  it('a lapsed grace period falls through to plain expired', () => {
    const s = renewalStateFor(
      renewal({ endsOn: '2026-06-01', graceEndsOn: '2026-06-15' }),
      TODAY,
    )
    expect(s.id).toBe('expired')
  })

  it('every not-auto-renewing plan IS prompted to set up auto-renewal', () => {
    // This test asserted the opposite until 2026-08-31, and the reversal was
    // Jillienne's explicit call, not a regression.
    //
    // The old rule: capability, not history — a plan that CANNOT auto-renew must
    // never see the word, because pointing someone at a setting they cannot
    // reach reads as a broken feature. It was dropped when `expires-outside-
    // window`'s two arms were collapsed to one note.
    //
    // What carries the difference now is DISTANCE, not capability: far out the
    // card nudges the setting, inside the window it asks for the renewal by name
    // and price. Kept as a live assertion so flipping back is a decision.
    const far = renewalStateFor(renewal({ autoRenew: 'off' }), new Date(2026, 0, 1))
    expect(far.notes.join(' ')).toContain('Set up auto-renewal now')

    // The states where auto-renewal genuinely has no place still never say it.
    const silent = [
      renewalStateFor(renewal({ retryUntil: '2026-09-02' }), TODAY),
      renewalStateFor(renewal({ endsOn: '2026-08-10', graceEndsOn: '2026-09-05' }), TODAY),
      renewalStateFor(renewal({ endsOn: '2026-08-10' }), TODAY),
      renewalStateFor(renewal({ autoRenew: 'off' }), TODAY), // in-window
    ]
    for (const s of silent) {
      const all = [s.lead, ...s.notes, s.chargeNote ?? '', s.cta].join(' ').toLowerCase()
      expect(all).not.toMatch(/auto-renew/)
    }
  })

  it('every state carries a pill whose label names the access state in words', () => {
    const cases: MembershipRenewal[] = [
      renewal(),
      renewal({ autoRenew: 'off' }),
      renewal({ autoRenew: 'off' }),
      renewal({ retryUntil: '2026-09-02' }),
      renewal({ endsOn: '2026-08-10', graceEndsOn: '2026-09-05' }),
      renewal({ endsOn: '2026-08-10' }),
    ]
    for (const c of cases) {
      const s = renewalStateFor(c, TODAY)
      expect(s.pill.length).toBeGreaterThan(0)
      expect(['Active', 'Action needed', 'Grace period', 'Expired']).toContain(s.pill)
    }
  })

  it('the window boundary decides between state 2 and state 7', () => {
    const inside = new Date(2026, 11, 5 - RENEWAL_WINDOW_DAYS + 1)
    const outside = new Date(2026, 11, 5 - RENEWAL_WINDOW_DAYS - 1)
    expect(renewalStateFor(renewal({ autoRenew: 'off' }), inside).id).toBe(
      'expires-in-window',
    )
    expect(renewalStateFor(renewal({ autoRenew: 'off' }), outside).id).toBe(
      'expires-outside-window',
    )
  })
})

describe('date helpers', () => {
  it('formats long-form dates, never mm/dd/yy', () => {
    expect(formatRenewalDate('2026-12-05')).toBe('December 5, 2026')
  })

  it('counts whole days without a timezone shift', () => {
    // Parsed by hand — `new Date('2026-12-05')` is UTC and would land a day
    // early for anyone west of Greenwich.
    expect(daysUntil('2026-08-22', TODAY)).toBe(1)
    expect(daysUntil('2026-08-21', TODAY)).toBe(0)
    expect(daysUntil('2026-08-20', TODAY)).toBe(-1)
  })
})
