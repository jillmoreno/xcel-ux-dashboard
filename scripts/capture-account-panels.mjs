#!/usr/bin/env node
/**
 * CAPTURE THE ACCOUNT PANELS — 2026-11-19, Afsana: "a standalone link like
 * /invite-v3 where we isolate the screenshot for (1) the Edit Account Details
 * panel (2) Update Password panel (3) Update Email Address panel".
 *
 * Opens each panel in a headless Chromium through `/account-panels?capture=`
 * (the page's capture mode: the real `AccountDetailsEditPanel`, open on one
 * step, on an empty page), drives each distinct state, and screenshots the
 * panel cropped to it. No toasts (2026-11-19, Afsana: the success toasts are not shown).
 *
 *   public/account-panels-screens/<panel>/NN-<state>.png
 *   public/account-panels-screens/manifest.json
 *
 * The manifest has `/invite-v3`'s shape (`InviteV3ScreensGallery`), kind
 * `panel`, so the two galleries read alike.
 *
 * Usage:  node scripts/capture-account-panels.mjs [baseUrl]
 *         (baseUrl defaults to http://localhost:5210 — a production build
 *         served with SPA fallback, e.g. `npx vite preview --port 5210`.)
 *
 * Playwright is not a repo dependency — this resolves `playwright-core` from
 * the npx cache, or from PLAYWRIGHT_CORE, the same way the invite script does.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

function loadPlaywright() {
  const candidates = []
  if (process.env.PLAYWRIGHT_CORE) candidates.push(process.env.PLAYWRIGHT_CORE)
  const npx = path.join(process.env.HOME ?? '', '.npm/_npx')
  if (fs.existsSync(npx)) {
    for (const d of fs.readdirSync(npx)) candidates.push(path.join(npx, d, 'node_modules/playwright-core'))
  }
  candidates.push('playwright-core', 'playwright')
  for (const c of candidates) {
    try {
      return require(c)
    } catch {
      /* next */
    }
  }
  console.error(
    'capture-account-panels: could not find playwright-core.\n' +
      'Install it once with `npx playwright@1.62 install chromium`, or set PLAYWRIGHT_CORE.',
  )
  process.exit(1)
}

const { chromium } = loadPlaywright()

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/account-panels-screens')
const BASE = (process.argv[2] ?? 'http://localhost:5210').replace(/\/$/, '')
const VIEWPORT = { width: 1440, height: 900 }

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

/* The panels, in the order the page lists them. */
const PANELS = [
  { id: 'edit-account-details', title: 'Edit Account Details' },
  { id: 'update-password', title: 'Update Password' },
  /* Forgot password? on Update Password opens these two modals in turn
     (2026-11-20, Afsana). Each picture is the modal alone, except the first,
     which shows it over the panel. */
  { id: 'reset-your-password', title: 'Reset your password' },
  { id: 'check-your-email', title: 'Check your email' },
  { id: 'update-email-address', title: 'Update Email Address' },
]
const SHOTS = Object.fromEntries(PANELS.map((p) => [p.id, []]))

async function open(browser, step) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
  const page = await context.newPage()
  await page.goto(`${BASE}/account-panels?capture=${step}`)
  await page.getByRole('dialog').waitFor()
  /* The sheet slides in; let it land. */
  await page.waitForTimeout(600)
  return { context, page }
}

async function shot(page, panel, state, target = page.getByRole('dialog')) {
  await page.waitForTimeout(250)
  SHOTS[panel].push({ state, buf: await target.screenshot({ animations: 'disabled' }) })
  console.log(`   ${panel}: ${state}`)
}

const type = (page, label, value) => page.getByLabel(label, { exact: true }).fill(value)

async function main() {
  try {
    const r = await fetch(`${BASE}/account-panels`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
  } catch (e) {
    console.error(`capture-account-panels: ${BASE} is not answering (${e.message}). Serve a build there first.`)
    process.exit(1)
  }
  const browser = await chromium.launch()

  /* 1 · Edit Account Details — the chooser. */
  {
    const { context, page } = await open(browser, 'choose')
    await shot(page, 'edit-account-details', 'Default')
    await context.close()
  }

  /* 2 · Update Password. */
  {
    const { context, page } = await open(browser, 'password')
    const P = 'update-password'
    await shot(page, P, 'Empty — Save Password disabled')
    await type(page, 'Current Password', 'OldPass1!')
    await type(page, 'New Password', 'weak')
    await shot(page, P, 'Weak new password — rules unmet')
    await type(page, 'New Password', 'OldPass1!')
    await shot(page, P, 'New password same as current')
    await type(page, 'New Password', 'NewPass12!')
    await type(page, 'Confirm New Password', 'NewPass12?')
    await shot(page, P, 'Passwords do not match')
    await type(page, 'Confirm New Password', 'NewPass12!')
    await shot(page, P, 'All rules met — Save Password enabled')
    await page.getByLabel('Show New Password').click()
    await shot(page, P, 'New password shown (eye toggled)')
    await context.close()
  }

  /* 2a · Forgot password? → Reset your password → Check your email. The
     clock is Playwright's, so Resend link's 30-second wait can be skipped. */
  {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
    const page = await context.newPage()
    await page.clock.install()
    await page.goto(`${BASE}/account-panels?capture=password`)
    await page.getByRole('dialog').waitFor()
    await page.clock.runFor(600)
    await page.getByRole('button', { name: 'Forgot password?' }).click()
    const R = 'reset-your-password'
    const reset = page.getByRole('dialog', { name: 'Reset your password' })
    await reset.waitFor()
    await shot(page, R, 'Over Update Password', page)
    await shot(page, R, 'Empty — Send reset link disabled', reset)
    await page.getByLabel(/^Email/).fill('jordan.navarro@')
    await shot(page, R, 'Invalid email address', reset)
    await page.getByLabel(/^Email/).fill('jordan.navarro@gmail.com')
    await shot(page, R, 'Valid — Send reset link enabled', reset)
    await page.getByRole('button', { name: 'Send reset link' }).click()
    const C = 'check-your-email'
    const check = page.getByRole('dialog', { name: 'Check your email' })
    await check.waitFor()
    await shot(page, C, 'Sent — Resend link waits, with the countdown', check)
    /* A second at a time: each tick's re-render sets the next timeout, so
       one long jump moves the countdown by only a second. */
    for (let i = 0; i < 31; i++) {
      await page.clock.runFor(1000)
      await page.waitForTimeout(20)
    }
    await shot(page, C, 'Resend link available', check)
    await context.close()
  }
  /* 3 · Update Email Address. */
  {
    const { context, page } = await open(browser, 'email')
    const E = 'update-email-address'
    await shot(page, E, 'Empty — Save Email disabled')
    await type(page, 'New Email Address', 'jordan.navarro@')
    await page.getByLabel('Confirm New Email Address', { exact: true }).focus()
    await shot(page, E, 'Invalid email address')
    await type(page, 'New Email Address', 'jordan.navarro@gmail.com')
    await page.getByLabel('Confirm New Email Address', { exact: true }).focus()
    await shot(page, E, 'Same as the current email')
    await type(page, 'New Email Address', 'jordan.n@outlook.com')
    await type(page, 'Confirm New Email Address', 'jordan.n@outlook.co')
    await shot(page, E, 'Emails do not match')
    await type(page, 'Confirm New Email Address', 'jordan.n@outlook.com')
    await shot(page, E, 'Valid — Save Email enabled')
    await context.close()
  }

  await browser.close()

  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true })
  const components = PANELS.map((p) => {
    fs.mkdirSync(path.join(OUT, p.id), { recursive: true })
    const states = SHOTS[p.id].map((st, n) => {
      const file = `${p.id}/${String(n + 1).padStart(2, '0')}-${slugify(st.state)}.png`
      fs.writeFileSync(path.join(OUT, file), st.buf)
      return { file, state: st.state, seenIn: [] }
    })
    return { id: p.id, title: p.title, kind: 'panel', flows: [], states }
  })
  const today = new Date().toISOString().slice(0, 10)
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ capturedAt: today, components }, null, 2) + '\n')
  const count = components.reduce((n, c) => n + c.states.length, 0)
  console.log(`\n${components.length} panels, ${count} states → public/account-panels-screens/manifest.json`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
