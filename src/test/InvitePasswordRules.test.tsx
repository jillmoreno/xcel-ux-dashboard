import { describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach } from 'vitest'
import { InvitePasswordChecklist } from '@/components/e2e/InvitePasswordChecklist'
import {
  INVITE_PASSWORD_CLASSES_REQUIRED,
  INVITE_PASSWORD_CLASS_RULES,
  INVITE_PASSWORD_RULES,
  invitePasswordClassesMet,
  meetsInvitePasswordRules,
} from '@/data/invitePasswordRules'

/**
 * THE INVITE FLOW'S PASSWORD POLICY — 2026-10-22, when the rules stopped being
 * guidance and started gating the button.
 *
 * ⚠ THE RULES ARE TESTED HERE, NOT THROUGH A PAGE. That is the whole reason
 * `test` functions live in a pure module: a rule can be checked without
 * mounting a confirmation page, typing into a masked field and reading a
 * colour back off an icon. The render block below pins the three things a
 * pure test cannot see — that the component asks the rules rather than
 * carrying its own copy, that state reaches assistive tech in words, and that
 * the structure nests.
 */

afterEach(cleanup)

describe('invite password rules', () => {
  it('states the policy the screen states: 9–30, three of four classes', () => {
    expect(INVITE_PASSWORD_RULES.map((r) => r.id)).toEqual(['length', 'classes'])
    expect(INVITE_PASSWORD_CLASSES_REQUIRED).toBe(3)
    expect(INVITE_PASSWORD_CLASS_RULES.map((r) => r.id)).toEqual([
      'upper',
      'lower',
      'number',
      'special',
    ])
    /* The count is in the label, so the words and the gate cannot drift. */
    expect(INVITE_PASSWORD_RULES[1].label).toContain(String(INVITE_PASSWORD_CLASSES_REQUIRED))
  })

  const length = INVITE_PASSWORD_RULES[0]

  it('length: 9 and 30 are INSIDE the range, 8 and 31 are not', () => {
    expect(length.test('a'.repeat(8))).toBe(false)
    expect(length.test('a'.repeat(9))).toBe(true)
    expect(length.test('a'.repeat(30))).toBe(true)
    expect(length.test('a'.repeat(31))).toBe(false)
  })

  it('every rule reads unmet on an empty field — nothing is satisfied by default', () => {
    for (const rule of [...INVITE_PASSWORD_RULES, ...INVITE_PASSWORD_CLASS_RULES]) {
      expect(rule.test(''), rule.id).toBe(false)
    }
    expect(meetsInvitePasswordRules('')).toBe(false)
  })

  it('counts the four classes independently', () => {
    expect(invitePasswordClassesMet('aaaaaaaaa')).toBe(1)
    expect(invitePasswordClassesMet('Aaaaaaaaa')).toBe(2)
    expect(invitePasswordClassesMet('Aaaaaaaa1')).toBe(3)
    expect(invitePasswordClassesMet('Aaaaaaa1!')).toBe(4)
  })

  it('"special" is anything that is not a letter, a digit or a space — the words on screen, exactly', () => {
    const special = INVITE_PASSWORD_CLASS_RULES[3]
    /* The set the copy used to enumerate, plus symbols it never listed: a test
       stricter than the words on screen is the failure this rule is shaped to
       avoid — the learner types a symbol, the row stays grey, and nothing on
       the page says why. */
    for (const c of '!@#$%^&*_+=`|(){}[]:">,.?~\\/;\'€£§') {
      expect(special.test(`Abcdefgh1${c}`), c).toBe(true)
    }
    /* A space is not a special character — but nothing forbids one either,
       because the rules on screen do not forbid one. */
    expect(special.test('Abcdefgh 1')).toBe(false)
    expect(meetsInvitePasswordRules('Abcdefgh 1')).toBe(true)
  })

  it('gates on BOTH rules — a long weak password and a short strong one both fail', () => {
    expect(meetsInvitePasswordRules('aaaaaaaaaaaaaaaaaaa')).toBe(false) // long, one class
    expect(meetsInvitePasswordRules('Ab1!')).toBe(false) // four classes, too short
    expect(meetsInvitePasswordRules('Navarro#2026')).toBe(true) // the demo's own
  })

  it('three of four is enough — the fourth is not required', () => {
    expect(invitePasswordClassesMet('Hunter2026')).toBe(3)
    expect(meetsInvitePasswordRules('Hunter2026')).toBe(true)
  })
})

describe('invite password checklist', () => {
  /** A row's state in the words a screen reader hears — ' — met' and ' — not
      yet met' both end in "met", so the suffix is read whole or not at all. */
  function state(label: string): string {
    return screen.getByText(label, { exact: false }).textContent?.replace(label, '') ?? ''
  }

  it('says each state in words, not in colour alone', () => {
    render(<InvitePasswordChecklist password="hunterhunter" />)

    /* ⚠ THE STATE IS READABLE WITHOUT THE ICON. Colour and a check are both
       invisible to a screen reader, so each row spells its state out. */
    expect(state('9–30 characters')).toBe(' — met')
    expect(state('Lowercase letters')).toBe(' — met')
    expect(state('Uppercase letters')).toBe(' — not yet met')
    expect(state('At least 3 of the following:')).toContain(' — not yet met')
  })

  it('the fourth class goes NOT NEEDED once three are in, not still-owed', () => {
    /* ⚠ 2026-10-22: "then the 4th of the 3 of 4 requirements can show disabled
       in the list". Left as an outstanding task it reads as something still
       owed on a form that is ready to submit — the moment a checklist starts
       contradicting its own button. */
    render(<InvitePasswordChecklist password="Hunter2026" />)
    expect(state('Uppercase letters')).toBe(' — met')
    expect(state('Numbers')).toBe(' — met')
    expect(state('Special characters')).toBe(' — not needed')
  })

  it('…and is still OWED while only two are in', () => {
    render(<InvitePasswordChecklist password="Hunterhunter" />)
    expect(state('Numbers')).toBe(' — not yet met')
    expect(state('Special characters')).toBe(' — not yet met')
  })

  it('nests the four classes inside the rule that counts them', () => {
    const { container } = render(<InvitePasswordChecklist password="" />)
    const top = container.querySelectorAll(':scope > div > ul > li')
    expect(top).toHaveLength(2)
    expect(top[0].querySelector('ul')).toBeNull()
    expect(top[1].querySelectorAll('ul > li')).toHaveLength(4)
  })
})
