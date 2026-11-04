import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FEATURE_FLAGS, designControlsFor } from '@/context/FeatureFlagContext'
import {
  DEFAULT_INVITE_FLOW_V3,
  DEFAULT_INVITE_MODEL,
  INVITE_FLOWS_V3,
  INVITE_MODELS,
  INVITE_V3_FLOW_FLAGS,
  INVITE_V3_EMAIL_ACCOUNT_FLAG,
  INVITE_V3_MODEL_FLAG,
  directEmailFlowV3,
  emailCheckV3,
  inviteCheckoutFlowV3,
  inviteEndingV3,
  pcFirstFlowV3,
  entryPathV3,
  inviteV3Surface,
  resolveInviteFlowV3,
  resolveInviteModel,
  suppliesEmailV3,
  verifiesEmailFirst,
} from '@/data/inviteFlowsV3'

/**
 * INVITE FLOW V3'S MODEL TYPE AND FLOWS — 2026-10-30.
 *
 * The catalog (`inviteFlowsV3.ts`) and the three flags live in different
 * files, and nothing else notices them drifting: a flow with no variant is
 * unreachable, a variant with no flow resolves to the model's default.
 */
describe('Invite Flow V3 model types and flows', () => {
  const flag = (key: string) => FEATURE_FLAGS.find((f) => f.key === key)

  it('offers exactly the catalog’s models', () => {
    const variants = (flag(INVITE_V3_MODEL_FLAG)?.variants ?? []).map((v) => v.value).sort()
    expect(variants).toEqual(INVITE_MODELS.map((m) => m.id).sort())
    expect(flag(INVITE_V3_MODEL_FLAG)?.defaultVariant).toBe(DEFAULT_INVITE_MODEL)
  })

  for (const model of INVITE_MODELS.map((m) => m.id)) {
    it(`lists exactly the ${model} flows, and only on the ${model} surface`, () => {
      const def = flag(INVITE_V3_FLOW_FLAGS[model])
      const variants = (def?.variants ?? []).map((v) => v.value).sort()
      const rows = INVITE_FLOWS_V3.filter((f) => f.model === model).map((f) => f.id).sort()
      expect(variants).toEqual(rows)
      expect(def?.defaultVariant).toBe(DEFAULT_INVITE_FLOW_V3[model])
      /* B2C's list also shows on the signed-in flow's own surface. */
      expect(def?.surfaces).toEqual(
        model === 'b2b'
          ? [inviteV3Surface(model), inviteV3Surface(model, 'direct-email')]
          : model === 'b2c'
            ? [inviteV3Surface(model), inviteV3Surface(model, 'xcel-signed-in'), inviteV3Surface(model, 'pc-after-add')]
            : [inviteV3Surface(model)],
      )
    })
  }

  it('shows one model’s flows at a time, and never V1/V2’s flow control', () => {
    for (const model of INVITE_MODELS.map((m) => m.id)) {
      const keys = designControlsFor('eric-atlas-e2e', 'eric', inviteV3Surface(model)).map((d) => d.key)
      expect(keys).toContain(INVITE_V3_MODEL_FLAG)
      expect(keys).toContain(INVITE_V3_FLOW_FLAGS[model])
      for (const other of INVITE_MODELS.map((m) => m.id).filter((m) => m !== model)) {
        expect(keys).not.toContain(INVITE_V3_FLOW_FLAGS[other])
      }
      expect(keys).not.toContain('invite-flow-journey')
    }
  })

  it('leaves V1/V2’s invite surface as it was', () => {
    const keys = designControlsFor('eric-atlas-e2e', 'eric', 'invite').map((d) => d.key)
    expect(keys).toContain('invite-flow-journey')
    expect(keys).not.toContain(INVITE_V3_MODEL_FLAG)
    expect(keys).not.toContain(INVITE_V3_FLOW_FLAGS.b2b)
    expect(keys).not.toContain(INVITE_V3_FLOW_FLAGS.b2c)
  })

  it('carries the eight flows from Afsana’s file, plus Direct Email, the two OCD flows, the partner-code alternative and B2B → Invite → Checkout', () => {
    expect(INVITE_FLOWS_V3).toHaveLength(13)
    expect(INVITE_FLOWS_V3.filter((f) => f.model === 'b2b-checkout')).toHaveLength(1)
    expect(INVITE_FLOWS_V3.filter((f) => f.model === 'b2b')).toHaveLength(5)
    expect(INVITE_FLOWS_V3.filter((f) => f.model === 'b2c')).toHaveLength(7)
    expect(INVITE_FLOWS_V3.find((f) => f.id === 'qr-net-new')?.label).toBe('QR: Net New: No OCD, No Atlas')
  })

  it('opens B2B on Direct Email — V2’s B2B2C with email, first in the list', () => {
    const b2b = INVITE_FLOWS_V3.filter((f) => f.model === 'b2b')
    expect(b2b[0]).toMatchObject({
      id: 'direct-email',
      label: 'Direct Email',
      description: 'Partner invited them, address supplied. Locked at checkout.',
      base: 'b2b2c-email',
    })
    expect(DEFAULT_INVITE_FLOW_V3.b2b).toBe('direct-email')
    expect(FEATURE_FLAGS.find((f) => f.key === INVITE_V3_FLOW_FLAGS.b2b)?.variants?.[0].value).toBe('direct-email')
    expect(entryPathV3(b2b[0])).toBe('/end-to-end-demo/email')
  })

  it('walks B2B → Invite → Checkout: the mixed cart, the invitation, the product page, then the notice and a log-in or a code', () => {
    const flow = INVITE_FLOWS_V3.find((f) => f.id === 'invite-mixed-cart')!
    expect(flow.model).toBe('b2b-checkout')
    expect(DEFAULT_INVITE_FLOW_V3['b2b-checkout']).toBe('invite-mixed-cart')
    expect(entryPathV3(flow)).toBe('/end-to-end-demo/cart')
    expect(inviteEndingV3(flow)).toBe('create-password')
    const atlas = inviteCheckoutFlowV3(flow, 'atlas')
    const code = inviteCheckoutFlowV3(flow, 'no-atlas')
    expect(atlas.screens.slice(0, 4)).toEqual(['cart', 'email', 'pdp', 'drop-notice'])
    expect(code.screens).toEqual(flow.screens)
    expect(suppliesEmailV3(atlas)).toBe(true)
    expect(emailCheckV3(atlas)).toEqual({ second: 'login', signsIn: false, accountKnown: true })
    expect(emailCheckV3(code)).toEqual({ second: 'code', signsIn: false, accountKnown: false })
    expect(inviteEndingV3(atlas)).toBe('ready')
    const keys = designControlsFor('eric-atlas-e2e', 'eric', inviteV3Surface('b2b-checkout')).map((d) => d.key)
    expect(keys).toEqual(expect.arrayContaining([INVITE_V3_MODEL_FLAG, INVITE_V3_FLOW_FLAGS['b2b-checkout'], INVITE_V3_EMAIL_ACCOUNT_FLAG]))
    expect(keys).not.toContain(INVITE_V3_FLOW_FLAGS.b2b)
    expect(keys).not.toContain('invite-v3-cart')
  })

  it('checks Direct Email’s supplied address after Purchase — a log-in with Atlas, a code without', () => {
    const direct = INVITE_FLOWS_V3.find((f) => f.id === 'direct-email')!
    expect(suppliesEmailV3(direct)).toBe(true)
    expect(verifiesEmailFirst(directEmailFlowV3(direct, 'no-atlas'))).toBe(true)
    expect(emailCheckV3(directEmailFlowV3(direct, 'no-atlas'))).toEqual({ second: 'code', signsIn: false, accountKnown: false })
    expect(emailCheckV3(directEmailFlowV3(direct, 'atlas'))).toEqual({ second: 'login', signsIn: false, accountKnown: true })
    expect(inviteEndingV3(directEmailFlowV3(direct, 'no-atlas'))).toBe('create-password')
    expect(inviteEndingV3(directEmailFlowV3(direct, 'atlas'))).toBe('ready')
    /* The default row is the code's walk, Email belongs to's default. */
    expect(directEmailFlowV3(direct, 'no-atlas').screens).toEqual(direct.screens)
    expect(suppliesEmailV3(INVITE_FLOWS_V3.find((f) => f.id === 'qr-net-new')!)).toBe(false)
    const keys = designControlsFor('eric-atlas-e2e', 'eric', inviteV3Surface('b2b', 'direct-email')).map((d) => d.key)
    expect(keys).toContain(INVITE_V3_EMAIL_ACCOUNT_FLAG)
    expect(designControlsFor('eric-atlas-e2e', 'eric', inviteV3Surface('b2b', 'qr-net-new')).map((d) => d.key)).not.toContain(
      INVITE_V3_EMAIL_ACCOUNT_FLAG,
    )
  })

  it('starts the partner-code alternative at the packages page, and asks before the cart', () => {
    const alt = INVITE_FLOWS_V3.find((f) => f.id === 'pc-after-add')!
    expect(alt.label).toBe('Alternative: immediate check for partner code after clicking ‘go to cart’')
    expect(entryPathV3(alt)).toBe('/end-to-end-demo/packages')
    expect(alt.screens.slice(0, 4)).toEqual(['packages', 'added-to-cart', 'pc-modal', 'cart'])
    expect(emailCheckV3(pcFirstFlowV3(alt, 'no-atlas')).second).toBe('code')
    expect(emailCheckV3(pcFirstFlowV3(alt, 'atlas'))).toEqual({ second: 'login', signsIn: false, accountKnown: true })
    expect(inviteEndingV3(pcFirstFlowV3(alt, 'atlas'))).toBe('ready')
    expect(inviteEndingV3(pcFirstFlowV3(alt, 'no-atlas'))).toBe('create-password')
    /* Its Email belongs to control shows on its own surface. */
    const keys = designControlsFor('eric-atlas-e2e', 'eric', inviteV3Surface('b2c', 'pc-after-add')).map((d) => d.key)
    expect(keys).toContain('invite-v3-email-account')
    expect(keys).toContain(INVITE_V3_FLOW_FLAGS.b2c)
    expect(keys).not.toContain('invite-v3-cart')
  })

  it('keys each tinted row on a real flow’s label — orange and green', () => {
    /* `inviteFlow.css` finds each row by the start of its label; each colour
       is its own rule, so read them apart. */
    const css = readFileSync(resolve(__dirname, '../pages/inviteFlow.css'), 'utf8')
    const prefixesBefore = (token: string) => {
      const rule = css.slice(0, css.indexOf(token))
      const block = rule.slice(rule.lastIndexOf('}') + 1)
      return [...block.matchAll(/aria-label\^='([^']+)'/g)].map((m) => m[1])
    }
    const orange = prefixesBefore('var(--color-e2e-alt-flow)')
    const green = prefixesBefore('var(--color-e2e-ocd-flow)')
    const label = (id: string) => INVITE_FLOWS_V3.find((f) => f.id === id)!.label
    const tinted = (prefixes: string[], id: string) => prefixes.some((p) => label(id).startsWith(p))
    for (const id of ['pc-after-add', 'qr-atlas-auto', 'has-atlas']) expect(tinted(orange, id)).toBe(true)
    for (const id of ['xcel-signed-in', 'xcel-signed-out']) expect(tinted(green, id)).toBe(true)
    for (const id of ['net-new', 'has-atlas-login', 'qr-atlas-login', 'direct-email']) {
      expect(tinted(orange, id) || tinted(green, id)).toBe(false)
    }
    expect(tinted(orange, 'xcel-signed-in')).toBe(false)
  })

  it('never resolves a flow from the other model’s list', () => {
    expect(resolveInviteFlowV3('b2b', 'qr-ocd').id).toBe('qr-ocd')
    expect(resolveInviteFlowV3('b2c', 'qr-ocd').id).toBe(DEFAULT_INVITE_FLOW_V3.b2c)
    expect(resolveInviteFlowV3('b2b', undefined).id).toBe(DEFAULT_INVITE_FLOW_V3.b2b)
    expect(resolveInviteModel('b2x')).toBe(DEFAULT_INVITE_MODEL)
  })
})

describe('Invite Flow V3 — B2C is guest checkout, not an invite', () => {
  it('names the B2C side guest checkout on the Design bar', () => {
    const flag = (key: string) => FEATURE_FLAGS.find((f) => f.key === key)
    expect(flag(INVITE_V3_FLOW_FLAGS.b2c)?.label).toBe('Guest checkout')
    expect(flag(INVITE_V3_FLOW_FLAGS.b2b)?.label).toBe('Invite flow')
    expect(flag(INVITE_V3_MODEL_FLAG)?.variants?.map((v) => v.label)).toEqual([
      'B2B invite',
      'B2C guest',
      'B2B → Invite → Checkout',
    ])
  })

  it('offers no invitation controls on the B2C side', () => {
    const keys = designControlsFor('eric-atlas-e2e', 'eric', inviteV3Surface('b2c')).map((d) => d.key)
    expect(keys).not.toContain('invite-missing-details')
  })
})
