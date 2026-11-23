#!/usr/bin/env node
/**
 * CAPTURE INVITE FLOW V3 SCREENS — 2026-11-18.
 *
 * Walks the four Invite Flow V3 flows (Direct Email, QR Code, Not signed into
 * XCEL, Signed into XCEL) in a headless Chromium and screenshots every
 * screen, modal and distinct state at 1440×900.
 *
 * ⚠ GROUPED BY COMPONENT, NOT BY WALK — 2026-11-19, Afsana: "an isolation of
 * each component and their different states would be better instead of
 * screenshots of the entire flow end to end". The walks still run end to end
 * (that is the only way to reach most states), but each shot is filed under
 * its component and state, once, with the flows that reach it:
 *
 *   - a modal is cropped to the modal (`[role=dialog]`);
 *   - a card drawn on a page — the state picker, Finish setting up your
 *     account — is cropped to its card (`CARD_TITLES`);
 *   - everything else is a page, and stays the whole viewport.
 *
 *   public/invite-v3-screens/<modals|cards|pages>/<component>/NN-<state>.png
 *   public/invite-v3-screens/manifest.json
 *
 * Usage:  node scripts/capture-invite-v3-screens.mjs [baseUrl]
 *         (baseUrl defaults to http://localhost:5210 — a production build
 *         served with SPA fallback, e.g. `npx vite preview`.)
 *
 * A full run by default: a component's states come from several flows, so a
 * flow is not re-captured on its own. ⚠ THE ONE EXCEPTION is a flow whose
 * components no other flow reaches — Log In's OCD log-in card (2026-11-23,
 * Afsana: "we would just need the OCD log in card and its varied states").
 * `--only=xcel-log-in` walks that flow alone and MERGES: it replaces only
 * the components it captured, stamps them with their own `capturedAt`, and
 * leaves every other picture and the run's date as they were.
 *
 *         node scripts/capture-invite-v3-screens.mjs --only=xcel-log-in [baseUrl]
 *
 * Playwright is not a repo dependency. This resolves `playwright-core` from
 * the npx cache (the same copy `npx playwright` installs), or from
 * PLAYWRIGHT_CORE if set to a module path.
 *
 * The flows run in REAL TIME — the holds (Email verified, Signing you in,
 * Placing your order, Signing you out, Setting up your account) are timers in
 * the app, so a full run takes a few minutes.
 */
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

function loadPlaywright() {
  const candidates = []
  if (process.env.PLAYWRIGHT_CORE) candidates.push(process.env.PLAYWRIGHT_CORE)
  candidates.push(path.join(process.env.HOME ?? '', '.npm/_npx/705bc6b22212b352/node_modules/playwright-core'))
  /* Any other npx cache entry that holds playwright-core. */
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
    'capture-invite-v3-screens: could not find playwright-core.\n' +
      'Install it once with `npx playwright@1.62 install chromium` (which caches playwright-core under ~/.npm/_npx),\n' +
      'or set PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core.',
  )
  process.exit(1)
}

const { chromium } = loadPlaywright()

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/invite-v3-screens')
const ARGS = process.argv.slice(2)
const ONLY = ARGS.find((a) => a.startsWith('--only='))?.slice('--only='.length) ?? null
const BASE = (ARGS.find((a) => !a.startsWith('--')) ?? 'http://localhost:5210').replace(/\/$/, '')
/* 1440 wide, not 1280 (2026-11-18, Afsana: the product pages "appear to not
   capture the full original width"). Eric's product page footer runs to
   1417px, so at 1280 the full-page shots had a white strip down the right. */
const VIEWPORT = { width: 1440, height: 900 }

/* ---------- start URLs (mirrors InviteV3StartPage's startHref) ---------- */

const ENTRY = { 'direct-email': '/end-to-end-demo/email', qr: '/end-to-end-demo/qr', b2c: '/end-to-end-demo/cart' }

function startUrl(flowId, { account = null, cart = null, product = null, logIn = null } = {}) {
  const b2c = flowId.startsWith('xcel-')
  const model = b2c ? 'b2c' : 'b2b'
  const ff = [
    'invite-flow-version:v3',
    `invite-v3-model:${model}`,
    `invite-v3-flow-${model}:${flowId}`,
    ...(account ? [`invite-v3-email-account:${account}`] : []),
    ...(cart ? [`invite-v3-cart:${cart}`] : []),
    ...(product ? [`pdp-products:${product}`] : []),
    ...(logIn ? [`invite-v3-log-in-account:${logIn}`] : []),
  ]
  const params = new URLSearchParams({ demo: '1', chrome: 'off', standalone: '1', ff: ff.join(',') })
  if (b2c) {
    params.set('lstate', 'Arizona')
    params.set('loa', 'Health')
    params.set('pkg', 'premier')
  }
  return `${BASE}${b2c ? ENTRY.b2c : ENTRY[flowId]}?${params.toString()}`
}

/* ---------- a walk: one page, numbered shots, duplicate guard ---------- */

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

/* WHO A COMPONENT IS FOR, where it is not everyone — a tag on its card in the
   Screens tab (2026-11-23, Afsana: "tag the image appropriately so reviewers
   know that the reset your password modal applies when a user has keycloak
   account"). By title, so a merge tags the earlier run's components too. */
const KEYCLOAK_ONLY = 'Keycloak (Atlas) account only'
const TAGS = {
  'Reset your password — enter email': KEYCLOAK_ONLY,
  'Reset your password — Log In': KEYCLOAK_ONLY,
  'Check your email': KEYCLOAK_ONLY,
  'Reset your password (page)': KEYCLOAK_ONLY,
}
const tagged = (c) => (TAGS[c.title] ? { ...c, tag: TAGS[c.title] } : c)

/* Cards drawn on a page rather than in a dialog, cropped to the card. */
const CARD_TITLES = ['Select your state and line of authority', 'Finish setting up your account']

/* Every shot of the run, in walk order, before it is grouped. */
const ALL_SHOTS = []
/* Which flow and variant is walking — set by `main` before each run. */
let CURRENT = { flow: '', variant: '', model: '' }

class Walk {
  constructor(page) {
    this.page = page
    this.hashes = new Set()
  }

  /** One state: cropped to its modal or card, or the page's viewport (or the
   *  full page). Skipped when identical to an earlier shot in this walk. */
  async shot(title, state, { fullPage = false, settle = 350, card = null } = {}) {
    await this.page.waitForTimeout(settle)
    /* Demo-only aids (Check your email's "open the reset link" line) are
       for walking the prototype, not part of the design developers read
       here (2026-11-19, Afsana). */
    await this.page.addStyleTag({ content: '[data-demo-only]{display:none !important}' })
    const shotOpts = { animations: 'disabled', caret: 'hide' }
    let kind = 'page'
    let buf = null
    const dialog = this.page.locator('[role=dialog]:visible').last()
    /* A card named by selector — OCD's log-in card has no shadow or rounded
       corners for the heading search below to find (2026-11-23). */
    const named = card ? this.page.locator(card).first() : null
    if (named && (await named.count())) {
      kind = 'card'
      buf = await named.screenshot(shotOpts)
    } else if (!fullPage && (await dialog.count())) {
      kind = 'modal'
      buf = await dialog.screenshot(shotOpts)
    } else if (!fullPage && CARD_TITLES.includes(title)) {
      const card = await this.page.evaluateHandle((t) => {
        const h = [...document.querySelectorAll('h1,h2,h3')].find((e) => e.textContent.trim() === t)
        let el = h
        while (el && el !== document.body) {
          const cs = getComputedStyle(el)
          if (cs.boxShadow !== 'none' || parseFloat(cs.borderTopLeftRadius) >= 6) return el
          el = el.parentElement
        }
        return h
      }, title)
      const el = card.asElement()
      if (el) {
        kind = 'card'
        buf = await el.screenshot(shotOpts)
      }
    }
    if (!buf) buf = await this.page.screenshot({ ...shotOpts, fullPage })
    const hash = createHash('sha1').update(buf).digest('hex')
    if (this.hashes.has(hash)) {
      console.log(`   = skip duplicate: ${title} · ${state}`)
      return
    }
    this.hashes.add(hash)
    ALL_SHOTS.push({ buf, hash, title, state, kind, ...CURRENT })
    console.log(`   ${kind.padEnd(5)} ${title} · ${state}${fullPage ? ' (full page)' : ''}`)
  }

  btn(name, { exact = true, scope = null } = {}) {
    return (scope ?? this.page).getByRole('button', { name, exact }).first()
  }
  dialog(name) {
    return this.page.getByRole('dialog', { name })
  }
  async click(name, opts = {}) {
    const b = this.btn(name, opts)
    await b.scrollIntoViewIfNeeded()
    await b.click()
    await this.page.waitForTimeout(opts.wait ?? 500)
  }
  async waitDialog(name, timeout = 8000) {
    await this.dialog(name).waitFor({ state: 'visible', timeout })
  }
  async waitDialogGone(name, timeout = 10000) {
    await this.dialog(name).waitFor({ state: 'hidden', timeout })
  }
  async scrollTop() {
    await this.page.evaluate(() => window.scrollTo(0, 0))
    await this.page.waitForTimeout(200)
  }
  /** Scroll so `locator` is roughly in the middle of the viewport. */
  async center(locator) {
    await locator.first().evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await this.page.waitForTimeout(300)
  }
}

async function go(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
}

/* ---------- shared stretches of the walks ---------- */

/** The code check, from "Enter your email to continue" (already open). */
async function codeCheck(w, { email = null, emailStates = false, wrongCode = true } = {}) {
  const p = w.page
  const ask = w.dialog('Enter your email to continue')
  await w.waitDialog('Enter your email to continue')
  const field = ask.getByLabel(/^Email\s*\*?$/)
  if (emailStates) {
    await w.shot('Enter your email to continue', 'Empty, Continue disabled')
    await field.fill('sam@example')
    await w.shot('Enter your email to continue', 'Invalid email address')
    await field.fill(email ?? 'sam@example.com')
    await w.shot('Enter your email to continue', 'Filled')
  } else if ((await field.inputValue()) === '') {
    await field.fill(email ?? 'sam@example.com')
    await w.shot('Enter your email to continue', 'Filled')
  } else {
    await w.shot('Enter your email to continue', 'Pre-filled with the invited address')
  }
  await w.click('Continue', { scope: ask })
  await w.waitDialog('Verify your email')
  const verify = w.dialog('Verify your email')
  await w.shot('Verify your email', 'Empty code, countdown running')
  await verify.getByLabel('Digit 1 of 6').click()
  if (wrongCode) {
    await p.keyboard.type('000000')
    await w.click('Confirm', { scope: verify })
    await w.shot('Verify your email', 'Wrong code')
    await verify.getByLabel('Digit 1 of 6').click()
    await p.keyboard.type('999999')
    await w.click('Confirm', { scope: verify })
    await w.shot('Verify your email', 'Expired code')
    await verify.getByLabel('Digit 1 of 6').click()
  }
  await p.keyboard.type('111111')
  await w.shot('Verify your email', 'Code entered, Confirm enabled')
  await w.click('Confirm', { scope: verify, wait: 150 })
  await w.waitDialog('Email verified')
  await w.shot('Email verified', 'Hold — continuing', { settle: 100 })
}

/** The name step a new learner gets after the code. */
async function nameStep(w) {
  await w.waitDialog('Enter your name to continue', 8000)
  const d = w.dialog('Enter your name to continue')
  await w.shot('Enter your name to continue', 'Empty, Continue disabled')
  await d.getByLabel(/First name/).fill('Jordan')
  await d.getByLabel(/Last name/).fill('Navarro')
  await w.shot('Enter your name to continue', 'Filled')
  await w.click('Continue', { scope: d })
  await w.waitDialogGone('Enter your name to continue')
}

/** The log-in widget a learner with Atlas gets. `withEmailField`: the Direct Email log-in shows the address in a field. */
async function loginCheck(w, { fromEmailAsk = false, prefilled = false, email = 'jordan@example.com', forgot = true, brief = false, waitResend = false } = {}) {
  const p = w.page
  /* Direct Email with Atlas: the email step opens filled with the invited
     address, then Log in (2026-11-18). */
  if (prefilled) {
    const ask = w.dialog('Enter your email to continue')
    await w.waitDialog('Enter your email to continue')
    const field = ask.getByLabel(/^Email\s*\*?$/)
    await w.shot('Enter your email to continue', 'Pre-filled with the invited address')
    const was = await field.inputValue()
    await field.fill('jordan@')
    await w.shot('Enter your email to continue', 'Invalid email address')
    await field.fill(was)
    await w.click('Continue', { scope: ask })
  } else if (fromEmailAsk) {
    const ask = w.dialog('Enter your email to continue')
    await w.waitDialog('Enter your email to continue')
    const field = ask.getByLabel(/^Email\s*\*?$/)
    if (!brief) {
      await w.shot('Enter your email to continue', 'Empty, Continue disabled')
      await field.fill('jordan@')
      await w.shot('Enter your email to continue', 'Invalid email address')
    }
    await field.fill(email)
    await w.shot('Enter your email to continue', 'Filled')
    await w.click('Continue', { scope: ask })
  }
  await w.waitDialog('Log in to continue')
  const d = w.dialog('Log in to continue')
  await w.shot('Log in to continue', 'Empty password, Log in disabled')
  const emailField = d.getByLabel(/^Email\s*\*?$/)
  /* Direct Email's log-in field is locked since 2026-11-18 — nothing to type. */
  if ((await emailField.count()) && (await emailField.isEditable())) {
    const was = await emailField.inputValue()
    await emailField.fill('jordan@')
    await w.shot('Log in to continue', 'Invalid email address')
    await emailField.fill(was)
  }
  const pw = d.getByLabel(/^Password/)
  if (!brief) {
    await pw.fill('wrong')
    await w.click('Log in', { scope: d })
    await w.shot('Log in to continue', 'Wrong password')
  }
  if (forgot) {
    await w.click('Forgot password?', { scope: d })
    /* Forgot password? asks for the address first (2026-11-19, Afsana). Its
       heading is "Reset your password", the same as the new-password step's,
       so it is filed under its own name. */
    await w.waitDialog('Reset your password')
    const ask = w.dialog('Reset your password')
    await w.shot('Reset your password — enter email', 'Empty, Send reset link disabled')
    await ask.getByLabel(/^Email/).fill('jordan@example')
    await w.shot('Reset your password — enter email', 'Invalid email address')
    await ask.getByLabel(/^Email/).fill(email)
    await w.shot('Reset your password — enter email', 'Filled, Send reset link enabled')
    await w.click('Send reset link', { scope: ask })
    await w.waitDialog('Check your email')
    await w.shot('Check your email', 'Reset link sent, Resend link counting down')
    if (waitResend) {
      /* The 30-second wait is real time; once per run is enough. */
      await w.dialog('Check your email').getByRole('button', { name: 'Resend link' }).waitFor()
      await p.waitForFunction(
        () => ![...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Resend link')?.disabled,
        null,
        { timeout: 40000 },
      )
      await w.shot('Check your email', 'Resend link available')
    }
    /* The email's link opens Reset your password on a PAGE of its own, in a
       new tab (2026-11-19, Afsana) — this tab stays on Check your email.
       Captured whole, header and grey ground included. */
    const [tab] = await Promise.all([
      p.context().waitForEvent('page'),
      w.dialog('Check your email').getByText(/We sent a password reset link/).click(),
    ])
    await tab.waitForLoadState('networkidle')
    const rw = new Walk(tab)
    const r = tab.getByRole('region', { name: 'Reset your password' })
    await r.waitFor()
    await rw.shot('Reset your password (page)', 'Empty, Reset password disabled')
    await r.locator('#reset-password').fill('Navarro#2027')
    await r.getByLabel(/^Confirm New Password/).fill('Navarro#20')
    await rw.shot('Reset your password (page)', 'Passwords do not match')
    await r.getByLabel(/^Confirm New Password/).fill('Navarro#2027')
    await rw.shot('Reset your password (page)', 'Filled, Reset password enabled')
    await rw.click('Reset password', { scope: r })
    await rw.shot('Reset your password (page)', 'Password reset')
    await tab.close()
    await w.click('Back to sign in', { scope: w.dialog('Check your email') })
    await w.waitDialog('Log in to continue')
  }
  await w.dialog('Log in to continue').getByLabel(/^Password/).fill('Navarro#2027')
  await w.shot('Log in to continue', 'Password entered')
  await w.click('Log in', { scope: w.dialog('Log in to continue'), wait: 150 })
  await w.waitDialog('Signing you in')
  await w.shot('Signing you in', 'Hold', { settle: 100 })
  await w.waitDialogGone('Signing you in')
}

/** The checkout from wherever it stands to Place your order. */
async function checkout(w, { label = 'Secure Checkout', places = true, arrival = 'After the email check', brief = false } = {}) {
  const p = w.page
  await p.waitForTimeout(500)
  await w.scrollTop()
  await w.shot(label, arrival)
  const demo = w.btn(/demo learner’s details/i, { exact: false })
  const street = p.getByRole('textbox', { name: /^Street Address\*?$/ }).first()
  const empty = (await street.count()) ? (await street.inputValue()) === '' : false
  if (empty) {
    const save = w.btn('Save and continue')
    if ((await save.count()) && (await save.isEnabled())) {
      await save.click()
      await p.waitForTimeout(400)
      await w.center(save)
      if (!brief) await w.shot(label, 'Save and continue with required fields empty')
    }
    if ((await demo.count()) && (await demo.isVisible())) {
      await demo.click()
      await p.waitForTimeout(400)
      await w.scrollTop()
      if (!brief) await w.shot(label, 'Student information filled')
    }
  }
  const save = w.btn('Save and continue')
  if ((await save.count()) && (await save.isEnabled())) {
    await save.scrollIntoViewIfNeeded()
    await save.click()
    await p.waitForTimeout(500)
  }
  const fill = p.getByRole('button', { name: /click to fill/i })
  if (await fill.count()) {
    await w.center(fill)
    if (!brief) await w.shot(label, 'Payment — card form empty')
    const n = await fill.count()
    for (let i = 0; i < n; i++) {
      await fill.nth(i).click({ timeout: 1500 }).catch(() => {})
      await p.waitForTimeout(300)
    }
    /* No "card filled" shot: the demo fill leaves the fields looking the
       same, so it would be the empty form again with one button enabled. */
    await p.waitForTimeout(600)
    const confirm = w.btn('Confirm Payment Method')
    await confirm.scrollIntoViewIfNeeded()
    await confirm.click()
    await p.waitForTimeout(500)
  }
  await w.scrollTop()
  await w.shot(label, 'Ready to place the order')
  if (!brief) await w.shot(label, 'Ready to place the order — full page', { fullPage: true })
  const place = w.btn('Place your order')
  await place.scrollIntoViewIfNeeded()
  await place.click()
  await p.waitForTimeout(150)
  if (!places) {
    await p.waitForTimeout(800)
    await w.shot(label, 'Place your order clicked — stays on the checkout')
    return
  }
  await w.waitDialog('Placing your order')
  await w.shot('Placing your order', 'Hold', { settle: 100 })
  await p.waitForURL(/\/confirmation/, { timeout: 15000 })
  await p.waitForTimeout(800)
}

/** The ending: Create password (new learner) or Start learning (has Atlas). */
async function ending(w, { atlas, brief = false }) {
  const p = w.page
  await w.scrollTop()
  if (!atlas) {
    await w.shot('Finish setting up your account', 'Empty, Confirm disabled')
    await p.getByPlaceholder('Enter password...', { exact: true }).fill('Navarro#2026')
    await p.getByPlaceholder('Re-enter password...', { exact: true }).fill('Navarro#20')
    if (!brief) await w.shot('Finish setting up your account', 'Passwords do not match')
    await p.getByPlaceholder('Re-enter password...', { exact: true }).fill('Navarro#2026')
    await w.shot('Finish setting up your account', 'Filled, Confirm enabled')
    await w.click('Confirm', { wait: 300 })
  } else {
    await w.shot('Start learning', 'Ready to start the course')
    await w.click('Start Course', { wait: 300 })
  }
  await w.waitDialog('Setting up your account')
  await w.shot('Setting up your account', 'Hold', { settle: 100 })
}

/* ---------- the flows ---------- */

const PRODUCTS = [
  ['standard', 'Standard'],
  ['multi-2', 'Multi-product'],
  ['single', 'Premier'],
  ['california', 'California'],
  /* Multi-product (Old) is left out, as on /invite-v3's Products choice
     (2026-11-18, Afsana). */
]

/* The full page only in the Products variant — the walks show the fold. */
async function productPage(w, label, state, { full = false } = {}) {
  await w.scrollTop()
  await w.shot(label, state)
  if (full) await w.shot(label, `${state} — full page`, { fullPage: true })
}

/* Eric's product page's own heading, read off the page. */
async function pdpTitle(p) {
  return (await p.getByRole('heading', { level: 1 }).first().textContent().catch(() => null))?.trim() || 'Product page'
}

async function directEmail(page, account) {
  const atlas = account === 'atlas'
  const w = new Walk(page)
  await go(page, startUrl('direct-email', { account, product: 'standard' }))
  await w.shot('You’re Invited to Get Licensed', 'Invitation email open')
  await w.click('View invitation', { wait: 900 })
  await productPage(w, await pdpTitle(page), 'Products: Standard')
  await w.click(/^Purchase standard/i, { exact: false, wait: 900 })
  if (atlas) {
    await loginCheck(w, { prefilled: true, waitResend: true })
  } else {
    await codeCheck(w)
    await nameStep(w)
  }
  await checkout(w, { arrival: atlas ? 'After Log in — filled from the account' : 'After the code — empty' })
  await ending(w, { atlas })
  return w
}

async function directEmailProducts(page) {
  const w = new Walk(page)
  for (const [value, label] of PRODUCTS) {
    await go(page, startUrl('direct-email', { account: 'no-atlas', product: value }))
    await w.click('View invitation', { wait: 900 })
    await productPage(w, `${await pdpTitle(page)}`, `Products: ${label}`, { full: true })
  }
  /* The state/line-of-authority change, from the default page. */
  const change = page.getByRole('button', { name: /Change state/i })
  if (await change.count()) {
    await change.first().click()
    await page.waitForTimeout(600)
    const d = page.getByRole('dialog').first()
    if (await d.count()) {
      const name = (await d.getAttribute('aria-label')) || (await d.locator('h1,h2,h3').first().textContent()) || 'Change state'
      /* Since 2026-11-18 it is the QR step's card, opened on the current
         course (`CourseChoiceDialog`). */
      await w.shot(name.trim(), 'Opened on the current course')
      const field = d.getByRole('combobox').first()
      if (await field.count()) {
        await field.fill('Tex')
        await page.waitForTimeout(300)
        await w.shot(name.trim(), 'State list filtered while typing')
        await d.getByRole('option', { name: 'Texas', exact: true }).first().click({ timeout: 5000 })
        await d.getByRole('radio', { name: 'Life', exact: true }).first().click({ timeout: 5000 })
        await page.waitForTimeout(300)
        await w.shot(name.trim(), 'Changed, Continue enabled')
        await d.getByRole('button', { name: 'Continue' }).click()
        await page.waitForTimeout(600)
        await w.shot(`${await pdpTitle(page)}`, 'After Continue — Texas Life')
      }
    }
  }
  return w
}

async function qr(page, account) {
  const atlas = account === 'atlas'
  const w = new Walk(page)
  await go(page, startUrl('qr', { account, product: 'standard' }))
  await w.shot('QR code', 'Partner’s QR code')
  await page.getByRole('button', { name: /Scan the code|QR code for/ }).first().click()
  await page.waitForTimeout(900)
  const title = 'Select your state and line of authority'
  await page.getByRole('heading', { name: title }).waitFor()
  await w.shot(title, 'Empty, Continue disabled')
  const state = page.getByRole('combobox', { name: /State/ })
  await state.click()
  await page.waitForTimeout(300)
  await w.shot(title, 'State dropdown open')
  await state.fill('Flor')
  await page.waitForTimeout(300)
  await w.shot(title, 'State filtered while typing')
  await page.getByRole('listbox').getByRole('option', { name: 'Florida' }).click()
  await page.waitForTimeout(300)
  await w.shot(title, 'State chosen, line of authority not yet')
  await page.getByRole('radio', { name: 'Life and Health' }).click()
  await w.shot(title, 'Filled, Continue enabled')
  await w.click('Continue', { wait: 1000 })
  await productPage(w, await pdpTitle(page), 'Products: Standard')
  await w.click(/^Purchase standard/i, { exact: false, wait: 900 })
  if (atlas) {
    await loginCheck(w, { fromEmailAsk: true })
  } else {
    await codeCheck(w, { emailStates: true })
    await nameStep(w)
  }
  await checkout(w, { arrival: atlas ? 'After Log in — filled from the account' : 'After the code — empty' })
  await ending(w, { atlas })
  return w
}

/** A B2C walk from the cart. */
async function b2c(page, flowId, cart, account, slug) {
  const atlas = account === 'atlas'
  const signedIn = flowId === 'xcel-signed-in'
  const w = new Walk(page)
  await go(page, startUrl(flowId, { account, cart }))
  await w.shot('Your cart', `${{ targeted: 'Targeted course', mixed: 'Targeted course and an unsupported item', none: 'Nothing targeted' }[cart]}${signedIn ? ', signed in' : ', signed out'}`)
  /* Nothing targeted: Checkout goes nowhere — today's OCD checkout, not
     mocked (2026-11-18). The cart is the whole walk. */
  if (cart === 'none') return w
  await w.click('Checkout', { wait: 600 })
  await w.shot('Do you have a Partner Code?', 'Question over the cart')
  if (cart === 'targeted' && !atlas) {
    /* YES does nothing — shown once per flow, on the first walk. */
    await w.click('YES', { wait: 500 })
    await w.shot('Do you have a Partner Code?', 'After YES — nothing happens')
  }
  await w.click('NO', { wait: 600 })
  if (cart === 'mixed') {
    const notice = page.getByRole('dialog', { name: /not supported/ })
    await notice.waitFor()
    const name = ((await notice.getAttribute('aria-label')) || (await notice.locator('h1,h2,h3').first().textContent()) || '1 item in your cart is not supported').trim()
    await w.shot(name, 'Notice over the cart')
    await w.click('Proceed to checkout', { wait: 400 })
  }
  if (signedIn) {
    await w.waitDialog('Signing you out')
    await w.shot('Signing you out', 'Hold', { settle: 100 })
    await w.waitDialogGone('Signing you out')
  }
  await page.waitForURL(/\/checkout/, { timeout: 10000 })
  await page.waitForTimeout(800)
  if (atlas) {
    await loginCheck(w, { fromEmailAsk: true, forgot: cart === 'targeted', brief: cart === 'mixed' })
  } else {
    await codeCheck(w, { emailStates: cart === 'targeted', wrongCode: cart === 'targeted' })
    await nameStep(w)
  }
  /* A mixed cart walks the targeted cart's checkout once the item is dropped —
     its validation and card states are the targeted walk's, so skip them. */
  await checkout(w, { brief: cart === 'mixed', arrival: atlas ? 'After Log in — filled from the account' : 'After the code — empty' })
  await ending(w, { atlas, brief: cart === 'mixed' })
  return w
}

/** Keycloak's Log in, then its Reset your password — the Log In flow's own:
 *  on the card, ← Back, no Back to sign in (2026-11-20). Filed apart from the
 *  checkout modal's, and tagged Keycloak only (`TAGS`). */
async function keycloakReset(w) {
  const page = w.page
  await page.waitForURL(/\/log-in\/keycloak/, { timeout: 10000 })
  const KC = 'section[aria-labelledby="verify-email-title"]'
  await w.click('Forgot password?', { wait: 500 })
  const RESET = 'Reset your password — Log In'
  const field = page.getByLabel(/^Email/)
  await w.shot(RESET, 'Empty, Send reset link disabled, ← Back', { card: KC })
  await field.fill('jordan@example')
  await w.shot(RESET, 'Invalid email address', { card: KC })
  await field.fill('jordan@example.com')
  await w.shot(RESET, 'Filled, Send reset link enabled', { card: KC })
  return w
}

/** Log In (2026-11-20): the header's Log In, No to the Partner Code, Yes to
 *  the XCEL account, then OCD's log-in card, its states by where the account
 *  is. Atlas leaves the card at Continue for Keycloak's, where only its Reset
 *  your password is captured (`keycloakReset`). */
async function logIn(page, account) {
  const w = new Walk(page)
  await go(page, startUrl('xcel-log-in', { logIn: account }))
  await w.click('Log In', { wait: 600 })
  await w.click('NO', { wait: 600 })
  await w.click('YES', { wait: 600 })
  await page.waitForURL(/\/log-in\/sign-in/, { timeout: 10000 })
  const CARD = 'section[aria-label="Log in"]'
  const TITLE = 'OCD log in'
  const email = page.getByLabel('Email', { exact: true })
  await w.shot(TITLE, 'Email, empty — Continue disabled', { card: CARD })
  await page.getByRole('button', { name: 'About this field' }).hover()
  await w.shot(TITLE, 'Email, info tooltip on hover', { card: CARD })
  await page.mouse.move(0, 0)
  await email.fill('jordan@example.com')
  await w.shot(TITLE, 'Email, filled — Continue enabled', { card: CARD })
  await w.click('Continue', { wait: 500 })
  /* Keycloak knows the address: its own page, not OCD's password. */
  if (account === 'atlas') return keycloakReset(w)
  const pw = page.getByLabel('Password', { exact: true })
  await w.shot(TITLE, 'Password, empty — Log in disabled, ← Back', { card: CARD })
  await pw.fill(account === 'ocd' ? 'wrong' : 'Secret#2027')
  await w.shot(TITLE, 'Password, filled — Log in enabled', { card: CARD })
  await w.click('Log in', { wait: 500 })
  /* A wrong password and no account read the same (2026-11-20). */
  await w.shot(TITLE, 'Username or password incorrect', { card: CARD })
  if (account === 'ocd') {
    await pw.fill('Secret#2027')
    await w.click('Log in', { wait: 400 })
    /* Opened stand-alone, it holds here rather than going on into OCD. */
    await w.shot(TITLE, 'Signing you in', { card: 'section[aria-label="Signing you in"]', settle: 150 })
  }
  return w
}

/* ---------- the plan ---------- */

const PLAN = [
  {
    id: 'direct-email',
    label: 'Direct Email',
    model: 'b2b',
    variants: [
      { label: 'No Atlas account', slug: 'no-atlas', run: (p) => directEmail(p, 'no-atlas') },
      { label: 'Has Atlas account', slug: 'atlas', run: (p) => directEmail(p, 'atlas') },
      { label: 'Products', slug: 'products', run: (p) => directEmailProducts(p) },
    ],
  },
  {
    id: 'qr',
    label: 'QR Code',
    model: 'b2b',
    variants: [
      { label: 'No Atlas account', slug: 'no-atlas', run: (p) => qr(p, 'no-atlas') },
      { label: 'Has Atlas account', slug: 'atlas', run: (p) => qr(p, 'atlas') },
    ],
  },
  ...['xcel-signed-out', 'xcel-signed-in'].map((id) => ({
    id,
    label: id === 'xcel-signed-out' ? 'Not signed into XCEL (OCD)' : 'Signed into XCEL (OCD)',
    model: 'b2c',
    variants: [
      ['targeted', 'no-atlas', 'Targeted only · No Atlas account', 'targeted-no-atlas'],
      ['targeted', 'atlas', 'Targeted only · Has Atlas account', 'targeted-atlas'],
      ['mixed', 'no-atlas', 'Mixed · No Atlas account', 'mixed-no-atlas'],
      ['mixed', 'atlas', 'Mixed · Has Atlas account', 'mixed-atlas'],
      ['none', 'no-atlas', 'None targeted', 'none'],
    ].map(([cart, account, label, slug]) => ({ label, slug, run: (p) => b2c(p, id, cart, account, slug) })),
  })),
  {
    id: 'xcel-log-in',
    label: 'Log In',
    model: 'b2c',
    variants: [
      { label: 'Atlas account', slug: 'atlas', run: (p) => logIn(p, 'atlas') },
      { label: 'OCD account', slug: 'ocd', run: (p) => logIn(p, 'ocd') },
      { label: 'No account', slug: 'none', run: (p) => logIn(p, 'none') },
    ],
  },
]

/* ---------- run ---------- */

/** File every shot under its component and state, once — the first walk
 *  that reaches a state gives its picture, and every walk that reaches it
 *  is listed.
 *
 *  ⚠ A PAGE IS KEPT ONCE PER MODEL, not once per flow: the checkout and the
 *  ending carry each flow's name and price, so no two flows' pictures are
 *  byte-identical, and keying on the picture filed the checkout 27 times.
 *  B2B2C and B2C genuinely differ (partner price, the cart), so where a page
 *  state appears in both, each is named for its model. */
function group(shots) {
  const components = new Map()
  for (const s of shots) {
    const key = `${s.kind}:${s.title}`
    if (!components.has(key)) components.set(key, { kind: s.kind, title: s.title, flows: [], states: [] })
    const c = components.get(key)
    if (!c.flows.includes(s.flow)) c.flows.push(s.flow)
    const where = `${s.flow} · ${s.variant}`
    const model = s.kind === 'page' ? s.model : ''
    const same = c.states.find((st) => st.state === s.state && st.model === model)
    if (same) {
      if (!same.seenIn.includes(where)) same.seenIn.push(where)
      continue
    }
    c.states.push({ state: s.state, model, buf: s.buf, seenIn: [where] })
  }
  for (const c of components.values()) {
    /* Decide every name first, then rename — renaming as it goes left the
       second model's states unnamed. */
    const both = c.states.map((st) => Boolean(st.model) && c.states.some((o) => o !== st && o.state === st.state))
    c.states.forEach((st, n) => {
      if (both[n]) st.state = `${st.state} — ${st.model}`
    })
  }
  return [...components.values()]
}

async function main() {
  try {
    const r = await fetch(`${BASE}/invite-v3`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
  } catch (e) {
    console.error(`capture-invite-v3-screens: ${BASE} is not answering (${e.message}). Serve a build there first.`)
    process.exit(1)
  }
  const browser = await chromium.launch()
  const failures = []
  const plan = ONLY ? PLAN.filter((f) => f.id === ONLY) : PLAN
  if (!plan.length) {
    console.error(`capture-invite-v3-screens: no flow "${ONLY}".`)
    process.exit(1)
  }
  for (const flow of plan) {
    for (const v of flow.variants) {
      console.log(`\n${flow.id} / ${v.slug}`)
      CURRENT = { flow: flow.label, variant: v.label, model: flow.model === 'b2c' ? 'B2C' : 'B2B2C' }
      const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
      /* The pictures are of the flow, not of which flow it is — the stand-alone
         walk's light blue banner (`InviteFlowBanner`) is hidden on every page
         (2026-11-18, Afsana: "the pictures do not need to include the banner"). */
      await context.addInitScript(() => {
        const hide = () => {
          if (document.getElementById('capture-hide-banner')) return
          const style = document.createElement('style')
          style.id = 'capture-hide-banner'
          style.textContent = '[data-invite-flow-banner] { display: none !important; }'
          document.head.appendChild(style)
        }
        if (document.head) hide()
        else document.addEventListener('DOMContentLoaded', hide)
      })
      const page = await context.newPage()
      try {
        await v.run(page)
      } catch (e) {
        console.error(`   ! ${flow.id}/${v.slug} stopped: ${e.message.split('\n')[0]}`)
        failures.push(`${flow.id}/${v.slug}: ${e.message.split('\n')[0]}`)
      }
      await context.close()
    }
  }
  await browser.close()

  const folder = { modal: 'modals', card: 'cards', page: 'pages' }
  const manifestPath = path.join(OUT, 'manifest.json')
  const today = new Date().toISOString().slice(0, 10)
  /* A fresh folder each full run: old files would otherwise linger. `--only`
     keeps the folder and clears just the components it re-captures. */
  const previous = ONLY && fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null
  if (!ONLY && fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true })
  const captured = group(ALL_SHOTS).map((c) => {
    const id = slugify(c.title)
    const dir = path.join(OUT, folder[c.kind], id)
    if (ONLY && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
    fs.mkdirSync(dir, { recursive: true })
    const states = c.states.map((st, n) => {
      const file = `${folder[c.kind]}/${id}/${String(n + 1).padStart(2, '0')}-${slugify(st.state)}.png`
      fs.writeFileSync(path.join(OUT, file), st.buf)
      return { file, state: st.state, seenIn: st.seenIn }
    })
    return tagged({ id: `${c.kind}-${id}`, title: c.title, kind: c.kind, flows: c.flows, states, ...(ONLY ? { capturedAt: today } : {}) })
  })
  /* Merged: the earlier run's components, with these replacing any of the
     same id — the run's own date unchanged, since the rest are its. */
  const components = previous
    ? [...previous.components.filter((c) => !captured.some((n) => n.id === c.id)).map(tagged), ...captured]
    : captured
  const capturedAt = previous?.capturedAt ?? today
  fs.writeFileSync(manifestPath, JSON.stringify({ capturedAt, components }, null, 2) + '\n')
  const count = components.reduce((n, c) => n + c.states.length, 0)
  console.log(`\n${components.length} components, ${count} states → ${path.relative(ROOT, manifestPath)}`)
  if (failures.length) {
    console.error(`\n${failures.length} walk(s) stopped early:\n  ${failures.join('\n  ')}`)
    process.exitCode = 1
  }
}

await main()
