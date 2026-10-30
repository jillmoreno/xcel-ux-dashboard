import { describe, expect, it } from 'vitest'
import { FEATURE_FLAGS, designControlsFor } from '@/context/FeatureFlagContext'
import {
  DEFAULT_INVITE_FLOW_V3,
  DEFAULT_INVITE_MODEL,
  INVITE_FLOWS_V3,
  INVITE_MODELS,
  INVITE_V3_FLOW_FLAGS,
  INVITE_V3_MODEL_FLAG,
  inviteV3Surface,
  resolveInviteFlowV3,
  resolveInviteModel,
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
      expect(def?.surfaces).toEqual([inviteV3Surface(model)])
    })
  }

  it('shows one model’s flows at a time, and never V1/V2’s flow control', () => {
    for (const model of INVITE_MODELS.map((m) => m.id)) {
      const keys = designControlsFor('eric-atlas-e2e', 'eric', inviteV3Surface(model)).map((d) => d.key)
      expect(keys).toContain(INVITE_V3_MODEL_FLAG)
      expect(keys).toContain(INVITE_V3_FLOW_FLAGS[model])
      expect(keys).not.toContain(INVITE_V3_FLOW_FLAGS[model === 'b2b' ? 'b2c' : 'b2b'])
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

  it('carries the eight flows from Afsana’s file, four per model', () => {
    expect(INVITE_FLOWS_V3).toHaveLength(8)
    expect(INVITE_FLOWS_V3.filter((f) => f.model === 'b2b')).toHaveLength(4)
    expect(INVITE_FLOWS_V3.find((f) => f.id === 'qr-net-new')?.label).toBe('QR: Net New: No OCD, No Atlas')
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
    expect(flag(INVITE_V3_MODEL_FLAG)?.variants?.map((v) => v.label)).toEqual(['B2B invite', 'B2C guest'])
  })

  it('offers no invitation controls on the B2C side', () => {
    const keys = designControlsFor('eric-atlas-e2e', 'eric', inviteV3Surface('b2c')).map((d) => d.key)
    expect(keys).not.toContain('invite-missing-details')
  })
})
