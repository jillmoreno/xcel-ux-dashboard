import { describe, expect, it } from 'vitest'
import {
  INVITE_PASSWORD_RULES_V3,
  meetsInvitePasswordRulesV3,
  passwordStrengthV3,
} from '@/data/invitePasswordRulesV3'

const EMAIL = 'jordan.navarro@example.com'
const rule = (id: string) => INVITE_PASSWORD_RULES_V3.find((r) => r.id === id)!

describe('Invite Flow V3 — password rules', () => {
  it('accepts the demo learner’s password', () => {
    expect(meetsInvitePasswordRulesV3('Navarro#2026', EMAIL)).toBe(true)
  })

  it('wants 9 to 15 characters', () => {
    expect(rule('length').test('Abcdef1!', EMAIL)).toBe(false)
    expect(rule('length').test('Abcdefg1!', EMAIL)).toBe(true)
    expect(rule('length').test('Abcdefghijklm1!', EMAIL)).toBe(true)
    expect(rule('length').test('Abcdefghijklmn1!', EMAIL)).toBe(false)
  })

  it('needs every class, and only the listed symbols', () => {
    expect(meetsInvitePasswordRulesV3('navarro#2026', EMAIL)).toBe(false)
    expect(meetsInvitePasswordRulesV3('NAVARRO#2026', EMAIL)).toBe(false)
    expect(meetsInvitePasswordRulesV3('Navarro#abcd', EMAIL)).toBe(false)
    expect(meetsInvitePasswordRulesV3('Navarro2026x', EMAIL)).toBe(false)
    expect(rule('allowed').test('Navarro+2026', EMAIL)).toBe(false)
    expect(rule('allowed').test('Na_va-rro.2026', EMAIL)).toBe(true)
  })

  it('refuses the username, in any case', () => {
    expect(rule('username').test('Jordan.Navarro@example.com', EMAIL)).toBe(false)
  })

  it('reads every rule unmet on an empty field', () => {
    expect(INVITE_PASSWORD_RULES_V3.some((r) => r.test('', EMAIL))).toBe(false)
  })

  it('moves the meter up as the password grows', () => {
    expect(passwordStrengthV3('').score).toBe(0)
    expect(passwordStrengthV3('a').label).toBe('Weak')
    expect(passwordStrengthV3('Navarro#2026').label).toBe('Strong')
  })
})
