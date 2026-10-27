import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { readRowArchive, setRowArchived, useRowArchive, RowArchiveWriteError } from '@/data/rowArchiveStore'

/**
 * The row archive's client half — the read's three answers (unavailable,
 * available and empty, available with rows) and the write's two.
 */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('readRowArchive', () => {
  it('reports UNAVAILABLE when the endpoint is not there — including the SPA fallback', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html' } }))
    expect(await readRowArchive()).toEqual({ available: false, loading: false, rows: {} })
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    expect(await readRowArchive()).toEqual({ available: false, loading: false, rows: {} })
  })

  it('keys the rows by id and drops what is not a row', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ rows: [{ id: 'xcel-walkthrough', archivedAt: '2026-10-27T13:00:00Z', archivedBy: 'Jill' }, { nope: true }] }),
    )
    const index = await readRowArchive()
    expect(index.available).toBe(true)
    expect(Object.keys(index.rows)).toEqual(['xcel-walkthrough'])
    expect(index.rows['xcel-walkthrough'].archivedBy).toBe('Jill')
  })
})

describe('setRowArchived', () => {
  it('PUTs the flag and the label, and clears the label on unarchive', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ row: {} }))
    await setRowArchived('xcel-walkthrough', true, 'Jill')
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/row-archive/xcel-walkthrough',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ archived: true, archivedBy: 'Jill' }) }),
    )
    await setRowArchived('xcel-walkthrough', false, 'Jill')
    expect(JSON.parse(String((fetchMock.mock.lastCall![1] as RequestInit).body))).toEqual({ archived: false, archivedBy: '' })
  })

  it('throws what the server objected to', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ errors: ['Not a row id: Nope'] }, 400))
    await expect(setRowArchived('Nope', true, 'Jill')).rejects.toBeInstanceOf(RowArchiveWriteError)
  })
})

describe('useRowArchive', () => {
  function Probe() {
    const index = useRowArchive()
    return <div data-testid="probe">{index.loading ? 'loading' : `${index.available}:${Object.keys(index.rows).join(',')}`}</div>
  }

  it('loads once, then re-reads after a write', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ rows: [] }))
    render(<Probe />)
    expect(screen.getByTestId('probe')).toHaveTextContent('loading')
    await act(async () => {})
    expect(screen.getByTestId('probe')).toHaveTextContent('true:')

    fetchMock.mockResolvedValueOnce(jsonResponse({ row: {} }))
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ rows: [{ id: 'xcel-walkthrough', archivedAt: '2026-10-27T13:00:00Z', archivedBy: 'Jill' }] }),
    )
    await act(async () => {
      await setRowArchived('xcel-walkthrough', true, 'Jill')
    })
    expect(screen.getByTestId('probe')).toHaveTextContent('true:xcel-walkthrough')
  })
})
