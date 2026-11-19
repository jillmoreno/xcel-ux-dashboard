import fs from 'node:fs'
import path from 'node:path'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AccountPanelsReviewPage } from '@/pages/AccountPanelsReviewPage'

/* `/account-panels` — the dev team's isolated link to the three Account
   Details panels (2026-11-19). Pins the gallery against the committed
   manifest, every picture it names, and the capture mode the script drives. */

const DIR = path.resolve(__dirname, '../../public/account-panels-screens')
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'))

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AccountPanelsReviewPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('/account-panels', () => {
  it('the manifest lists the three panels, and every picture exists', () => {
    expect(manifest.components.map((c: { title: string }) => c.title)).toEqual([
      'Edit Account Details',
      'Update Password',
      'Update Email Address',
    ])
    for (const c of manifest.components)
      for (const s of c.states) expect(fs.existsSync(path.join(DIR, s.file)), s.file).toBe(true)
  })

  it('shows each panel and its states as pictures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => manifest })))
    renderAt('/account-panels')
    expect(await screen.findByRole('article', { name: 'Edit Account Details' })).toBeTruthy()
    expect(screen.getByRole('article', { name: 'Update Password' })).toBeTruthy()
    expect(screen.getByRole('article', { name: 'Update Email Address' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Update Password — Passwords do not match' })).toBeTruthy()
    /* Pictures, not live panels. */
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText(/Images as of \d+\/\d+\. Design changes made since then/)).toBeTruthy()
  })

  it('capture mode draws the real panel open on its step', () => {
    renderAt('/account-panels?capture=password')
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save Password' })).toBeTruthy()
    cleanup()
    renderAt('/account-panels?capture=email')
    expect(screen.getByRole('button', { name: 'Save Email' })).toBeTruthy()
    cleanup()
    renderAt('/account-panels?capture=choose')
    expect(screen.getByText('What would you like to do?')).toBeTruthy()
  })
})
