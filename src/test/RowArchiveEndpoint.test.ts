import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * The row archive's handler, run for real against an in-memory Blobs store —
 * the same harness `TodoBoardEndpoint.test.ts` uses, for the same reason: the
 * one rule here that matters (the first stamp stands) is the server's, and a
 * regex over the source cannot prove it holds.
 */

type Json = Record<string, unknown>

const blobs = new Map<string, Json>()

vi.mock('@netlify/blobs', () => ({
  getStore: () => ({
    list: async () => ({ blobs: [...blobs.keys()].map((key) => ({ key })) }),
    get: async (key: string) => blobs.get(key) ?? null,
    setJSON: async (key: string, value: Json) => void blobs.set(key, value),
    delete: async (key: string) => void blobs.delete(key),
  }),
}))

const { default: handler } = await import('../../netlify/functions/row-archive')

const call = async (method: string, path: string, body?: unknown) => {
  const res = await handler(
    new Request(`https://hub.test${path}`, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
    }),
  )
  return { status: res.status, body: (await res.json()) as Json }
}

beforeEach(() => blobs.clear())

describe('/api/row-archive', () => {
  it('starts empty, and lists what has been archived, newest first', async () => {
    expect((await call('GET', '/api/row-archive')).body).toEqual({ rows: [] })
    await call('PUT', '/api/row-archive/xcel-walkthrough', { archived: true, archivedBy: 'Jill' })
    await new Promise((r) => setTimeout(r, 2))
    await call('PUT', '/api/row-archive/xcel-overlap', { archived: true, archivedBy: 'Eric' })
    const rows = (await call('GET', '/api/row-archive')).body.rows as Json[]
    expect(rows.map((r) => r.id)).toEqual(['xcel-overlap', 'xcel-walkthrough'])
    expect(rows[1]).toMatchObject({ archivedBy: 'Jill' })
    expect(String(rows[1].archivedAt)).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('⚠ keeps the FIRST stamp when a row is archived twice', async () => {
    const first = await call('PUT', '/api/row-archive/xcel-walkthrough', { archived: true, archivedBy: 'Jill' })
    expect(first.status).toBe(201)
    const again = await call('PUT', '/api/row-archive/xcel-walkthrough', { archived: true, archivedBy: 'Eric' })
    expect(again.status).toBe(200)
    expect(again.body.row).toEqual(first.body.row)
  })

  it('unarchiving deletes the record, so "not archived" has one shape', async () => {
    await call('PUT', '/api/row-archive/xcel-walkthrough', { archived: true, archivedBy: 'Jill' })
    expect((await call('PUT', '/api/row-archive/xcel-walkthrough', { archived: false })).body).toEqual({
      id: 'xcel-walkthrough',
      archived: false,
    })
    expect((await call('GET', '/api/row-archive')).body).toEqual({ rows: [] })
    expect((await call('GET', '/api/row-archive/xcel-walkthrough')).status).toBe(404)
  })

  it('refuses what is not a row id, a non-JSON body, and a missing flag', async () => {
    expect((await call('PUT', '/api/row-archive/Not%20A%20Row', { archived: true })).status).toBe(400)
    expect((await call('PUT', '/api/row-archive/xcel-walkthrough', { archivedBy: 'Jill' })).status).toBe(422)
    const res = await handler(
      new Request('https://hub.test/api/row-archive/xcel-walkthrough', { method: 'PUT', body: 'nope' }),
    )
    expect(res.status).toBe(400)
    expect((await call('DELETE', '/api/row-archive/xcel-walkthrough')).status).toBe(405)
    expect((await call('POST', '/api/row-archive')).status).toBe(405)
  })

  it('is routed like the other boards — both redirects, the id one first', () => {
    const toml = readFileSync(resolve(process.cwd(), 'netlify.toml'), 'utf8')
    expect(toml).toContain('from = "/api/row-archive/*"')
    expect(toml).toContain('from = "/api/row-archive"')
    expect(toml.indexOf('from = "/api/row-archive/*"')).toBeLessThan(toml.indexOf('from = "/api/row-archive"\n'))
  })
})
