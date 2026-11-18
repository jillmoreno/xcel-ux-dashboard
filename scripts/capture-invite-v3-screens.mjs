#!/usr/bin/env node
/**
 * CAPTURE INVITE FLOW V3 SCREENS — 2026-11-18.
 *
 * Walks the four Invite Flow V3 flows (Direct Email, QR Code, Not signed into
 * XCEL, Signed into XCEL) in a headless Chromium and screenshots every
 * screen, modal and distinct state at 1440×900, writing
 *
 *   public/invite-v3-screens/<flowId>/<variantSlug>/NN-<slug>.png
 *   public/invite-v3-screens/manifest.json
 *
 * Usage:  node scripts/capture-invite-v3-screens.mjs [baseUrl]
 *         (baseUrl defaults to http://localhost:5210 — a production build
 *         served with SPA fallback, e.g. `npx vite preview`.)
 *
 * Optional: a second arg filters to one flow id (e.g. `qr`) — the manifest is
 * then merged with the existing one rather than replaced.
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
const BASE = (process.argv[2] ?? 'http://localhost:5210').replace(/\/$/, '')
const ONLY = process.argv[3] ?? null
/* 1440 wide, not 1280 (2026-11-18, Afsana: the product pages "appear to not
   capture the full original width"). Eric's product page footer runs to
   1417px, so at 1280 the full-page shots had a white strip down the right. */
const VIEWPORT = { width: 1440, height: 900 }

/* ---------- start URLs (mirrors InviteV3StartPage's startHref) ---------- */

const ENTRY = { 'direct-email': '/end-to-end-demo/email', qr: '/end-to-end-demo/qr', b2c: '/end-to-end-demo/cart' }

function startUrl(flowId, { account = null, cart = null, product = null } = {}) {
  const b2c = flowId.startsWith('xcel-')
  const model = b2c ? 'b2c' : 'b2b'
  const ff = [
    'invite-flow-version:v3',
    `invite-v3-model:${model}`,
    `invite-v3-flow-${model}:${flowId}`,
    ...(account ? [`invite-v3-email-account:${account}`] : []),
    ...(cart ? [`invite-v3-cart:${cart}`] : []),
    ...(product ? [`pdp-products:${product}`] : []),
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

class Walk {
  constructor(page, flowId, variantSlug) {
    this.page = page
    this.dir = `${flowId}/${variantSlug}`
    this.shots = []
    this.n = 0
    this.hashes = new Set()
    fs.mkdirSync(path.join(OUT, this.dir), { recursive: true })
  }

  /** Screenshot the viewport (and optionally the full page) — skipped if identical to an earlier shot in this walk. */
  async shot(title, state, { fullPage = false, settle = 350 } = {}) {
    await this.page.waitForTimeout(settle)
    const buf = await this.page.screenshot({ fullPage, animations: 'disabled', caret: 'hide' })
    const hash = createHash('sha1').update(buf).digest('hex')
    if (this.hashes.has(hash)) {
      console.log(`   = skip duplicate: ${title} · ${state}`)
      return
    }
    this.hashes.add(hash)
    this.n += 1
    const file = `${this.dir}/${String(this.n).padStart(2, '0')}-${slugify(`${title} ${state}`)}.png`
    fs.writeFileSync(path.join(OUT, file), buf)
    this.shots.push({ file, title, state })
    console.log(`   ${String(this.n).padStart(2, '0')} ${title} · ${state}${fullPage ? ' (full page)' : ''}`)
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
  const field = ask.getByLabel(/Email address/)
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
async function loginCheck(w, { fromEmailAsk = false, email = 'jordan@example.com', forgot = true, brief = false, waitResend = false } = {}) {
  const p = w.page
  if (fromEmailAsk) {
    const ask = w.dialog('Enter your email to continue')
    await w.waitDialog('Enter your email to continue')
    const field = ask.getByLabel(/Email address/)
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
  const emailField = d.getByLabel(/Email address/)
  if (await emailField.count()) {
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
    await w.dialog('Check your email').getByText(/We sent a password reset link/).click()
    await w.waitDialog('Reset your password')
    const r = w.dialog('Reset your password')
    await w.shot('Reset your password', 'Empty, Reset password disabled')
    await r.locator('#reset-password').fill('Navarro#2027')
    await r.getByLabel(/^Confirm new password/).fill('Navarro#20')
    await w.shot('Reset your password', 'Passwords do not match')
    await r.getByLabel(/^Confirm new password/).fill('Navarro#2027')
    await w.shot('Reset your password', 'Filled, Reset password enabled')
    await w.click('Reset password', { scope: r })
    await w.waitDialog('Log in to continue')
    await w.shot('Log in to continue', 'Your password has been reset')
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
  ['multi', 'Multi-product (Old)'],
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
  const w = new Walk(page, 'direct-email', atlas ? 'atlas' : 'no-atlas')
  await go(page, startUrl('direct-email', { account, product: 'standard' }))
  await w.shot('You’re Invited to Get Licensed', 'Invitation email open')
  await w.click('View invitation', { wait: 900 })
  await productPage(w, await pdpTitle(page), 'Products: Standard')
  await w.click(/^Purchase standard/i, { exact: false, wait: 900 })
  if (atlas) {
    await loginCheck(w, { waitResend: true })
  } else {
    await codeCheck(w)
    await nameStep(w)
  }
  await checkout(w)
  await ending(w, { atlas })
  return w
}

async function directEmailProducts(page) {
  const w = new Walk(page, 'direct-email', 'products')
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
  const w = new Walk(page, 'qr', atlas ? 'atlas' : 'no-atlas')
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
  await checkout(w)
  await ending(w, { atlas })
  return w
}

/** A B2C walk from the cart. */
async function b2c(page, flowId, cart, account, slug) {
  const atlas = account === 'atlas'
  const signedIn = flowId === 'xcel-signed-in'
  const w = new Walk(page, flowId, slug)
  await go(page, startUrl(flowId, { account, cart }))
  await w.shot('Your cart', `${{ targeted: 'Targeted course', mixed: 'Targeted course and an unsupported item', none: 'Nothing targeted' }[cart]}${signedIn ? ', signed in' : ', signed out'}`)
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
  if (signedIn && cart !== 'none') {
    await w.waitDialog('Signing you out')
    await w.shot('Signing you out', 'Hold', { settle: 100 })
    await w.waitDialogGone('Signing you out')
  }
  await page.waitForURL(/\/checkout/, { timeout: 10000 })
  await page.waitForTimeout(800)
  if (cart === 'none') {
    await checkout(w, { label: 'Checkout', places: false, arrival: 'On arrival — no email check' })
    return w
  }
  if (atlas) {
    await loginCheck(w, { fromEmailAsk: true, forgot: cart === 'targeted', brief: cart === 'mixed' })
  } else {
    await codeCheck(w, { emailStates: cart === 'targeted', wrongCode: cart === 'targeted' })
    await nameStep(w)
  }
  /* A mixed cart walks the targeted cart's checkout once the item is dropped —
     its validation and card states are the targeted walk's, so skip them. */
  await checkout(w, { brief: cart === 'mixed' })
  await ending(w, { atlas, brief: cart === 'mixed' })
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
]

/* ---------- run ---------- */

async function main() {
  try {
    const r = await fetch(`${BASE}/invite-v3`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
  } catch (e) {
    console.error(`capture-invite-v3-screens: ${BASE} is not answering (${e.message}). Serve a build there first.`)
    process.exit(1)
  }
  const manifestPath = path.join(OUT, 'manifest.json')
  const previous = ONLY && fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null
  const browser = await chromium.launch()
  const flows = []
  const failures = []
  for (const flow of PLAN) {
    if (ONLY && flow.id !== ONLY) {
      const kept = previous?.flows.find((f) => f.id === flow.id)
      if (kept) flows.push(kept)
      continue
    }
    const variants = []
    for (const v of flow.variants) {
      console.log(`\n${flow.id} / ${v.slug}`)
      const dir = path.join(OUT, flow.id, v.slug)
      /* A fresh folder each run: old numbered files would otherwise linger. */
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
      const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
      const page = await context.newPage()
      let w = null
      try {
        w = await v.run(page)
      } catch (e) {
        console.error(`   ! ${flow.id}/${v.slug} stopped: ${e.message.split('\n')[0]}`)
        failures.push(`${flow.id}/${v.slug}: ${e.message.split('\n')[0]}`)
        await page.screenshot({ path: path.join(dir, 'zz-error.png') }).catch(() => {})
      }
      await context.close()
      variants.push({ label: v.label, slug: v.slug, shots: w?.shots ?? [] })
    }
    flows.push({ id: flow.id, label: flow.label, model: flow.model, variants })
  }
  await browser.close()
  const today = new Date().toISOString().slice(0, 10)
  fs.writeFileSync(manifestPath, JSON.stringify({ capturedAt: today, flows }, null, 2) + '\n')
  const count = flows.reduce((n, f) => n + f.variants.reduce((m, v) => m + v.shots.length, 0), 0)
  console.log(`\n${count} shots → ${path.relative(ROOT, manifestPath)}`)
  if (failures.length) {
    console.error(`\n${failures.length} walk(s) stopped early:\n  ${failures.join('\n  ')}`)
    process.exitCode = 1
  }
}

await main()
