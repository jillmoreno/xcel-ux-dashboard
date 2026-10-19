import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { InvitedConfirmationPage } from '@/pages/InvitedConfirmationPage'
import {
  CHARACTER_TYPES,
  INVITE_PASSWORD_REQUIREMENTS,
  MAX_LENGTH,
  MIN_LENGTH,
  countCharacterTypes,
  isPasswordValid,
} from '@/components/e2e/invitePasswordRequirements'

/**
 * LIVE PASSWORD VALIDATION on Create Password (2026-10-19) —
 * `/end-to-end-demo/confirmation`, Figma "Atlas UX Design" 425:2597.
 *
 * Two halves, and they are deliberately separate: the RULES are a pure module
 * and are tested by handing them strings, and the PAGE is tested for whether
 * it shows those verdicts and gates Confirm on them. A rule change should
 * break one file in one place, not eight renders.
 *
 * Where the flow GOES after Confirm is `InviteEndsAtPassword.test.tsx`'s
 * subject, not this one's. This file is about whether Confirm turns on at all.
 */

const CONFIRMATION = '/end-to-end-demo/confirmation'

/** The page's own test password — a click on the empty field inserts it. */
const TEST_PASSWORD = 'Navarro#2026'

function renderPage() {
  window.history.replaceState({}, '', CONFIRMATION)
  return render(
    <MemoryRouter initialEntries={[CONFIRMATION]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Routes>
            <Route path={CONFIRMATION} element={<InvitedConfirmationPage />} />
            <Route path="/dashboard-rebrand" element={<p>Home</p>} />
          </Routes>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const field = () => screen.getByPlaceholderText('Enter password...') as HTMLInputElement
const confirm = () => screen.getByRole('button', { name: 'Confirm' })

/** Types a value without going through the click-to-fill shortcut. */
function type(value: string) {
  fireEvent.change(field(), { target: { value } })
}

/** The checklist row whose label starts with `text`, met-suffix included. */
function row(text: string): HTMLElement {
  const items = screen.getAllByRole('listitem')
  const found = items.find((li) => li.textContent?.startsWith(text))
  if (!found) throw new Error(`no checklist row starting "${text}"`)
  return found
}

afterEach(cleanup)

/* ── The rules, with no page around them ─────────────────────────────────── */

describe('invitePasswordRequirements', () => {
  it('takes 9 to 30 characters', () => {
    expect(isPasswordValid('Ab1!' + 'x'.repeat(MIN_LENGTH - 5))).toBe(false) // one short
    expect(isPasswordValid('Ab1!' + 'x'.repeat(MIN_LENGTH - 4))).toBe(true) // exactly 9
    expect(isPasswordValid('Ab1!' + 'x'.repeat(MAX_LENGTH - 4))).toBe(true) // exactly 30
    expect(isPasswordValid('Ab1!' + 'x'.repeat(MAX_LENGTH - 3))).toBe(false) // one over
  })

  it('refuses whitespace however long the password is', () => {
    expect(isPasswordValid('Navarro# 2026')).toBe(false)
    expect(isPasswordValid('Navarro#\t2026')).toBe(false)
    expect(isPasswordValid('Navarro#2026')).toBe(true)
  })

  /* THE RULE THIS FLOW DOES NOT SHARE WITH THE PROFILE FORM. Profile wants all
     four types; this one wants any three, so a password with no special
     character at all is fine here and is not fine there. */
  it('takes any three of the four types, and rejects two', () => {
    expect(countCharacterTypes('Navarro2026')).toBe(3) // upper, lower, number
    expect(isPasswordValid('Navarro2026')).toBe(true)
    expect(countCharacterTypes('navarro#2026')).toBe(3) // lower, number, special
    expect(isPasswordValid('navarro#2026')).toBe(true)
    expect(countCharacterTypes('navarronavarro')).toBe(1)
    expect(isPasswordValid('navarronavarro')).toBe(false)
    expect(countCharacterTypes('Navarronavarro')).toBe(2)
    expect(isPasswordValid('Navarronavarro')).toBe(false)
  })

  it('counts the specials the page lists, and nothing else', () => {
    const special = CHARACTER_TYPES.find((t) => t.id === 'special')!
    for (const ch of '!@#$%^&*_+=`|(){}[]:">,.?') {
      expect(special.test(`abc${ch}`), `${ch} should count`).toBe(true)
    }
    // A space is in the PRINTED list as reading room, not as a special.
    expect(special.test('abc def')).toBe(false)
  })

  /* OUT-OF-SET CHARACTERS ARE NOT BLOCKED AND NOT COUNTED. An emoji, a curly
     quote or an accented letter adds length and nothing else — it cannot help
     satisfy three-of-four. Nothing on the page claims input is restricted. */
  it('lets unlisted characters add length without counting as a type', () => {
    for (const odd of ['é', '“', '\u{1F600}']) {
      expect(countCharacterTypes(odd)).toBe(0)
      expect(countCharacterTypes(`abc${odd}`)).toBe(1) // still just the lowercase
    }
    // Length alone is not enough: two types, so still invalid.
    expect(isPasswordValid('Navarroééé')).toBe(false)
  })

  it('the page’s test password passes everything', () => {
    expect(countCharacterTypes(TEST_PASSWORD)).toBe(4)
    expect(isPasswordValid(TEST_PASSWORD)).toBe(true)
    for (const rule of INVITE_PASSWORD_REQUIREMENTS) expect(rule.test(TEST_PASSWORD)).toBe(true)
  })

  it('nothing is valid before anything is typed', () => {
    expect(isPasswordValid('')).toBe(false)
    // …and no rule reads MET on an empty field, so the checklist cannot open
    // with a tick already on it.
    for (const rule of INVITE_PASSWORD_REQUIREMENTS) expect(rule.test('')).toBe(false)
    for (const type_ of CHARACTER_TYPES) expect(type_.test('')).toBe(false)
  })
})

/* ── The page ────────────────────────────────────────────────────────────── */

describe('Create password — the gate', () => {
  it('starts disabled, with no checklist and nothing to correct', () => {
    renderPage()
    expect(confirm()).toBeDisabled()
    expect(screen.queryByText(/Passwords must be/)).toBeNull()
    expect(screen.queryByText(/not yet met/)).toBeNull()
  })

  it('stays disabled while the password is only part-way there', () => {
    renderPage()
    type('navarronavarro') // long enough, but one type only
    expect(confirm()).toBeDisabled()
    type('Ab1!') // four types, far too short
    expect(confirm()).toBeDisabled()
    type('Navarro# 2026') // everything but the space
    expect(confirm()).toBeDisabled()
  })

  it('turns on when the password passes — and off again when it stops', () => {
    renderPage()
    type('Navarro2026')
    expect(confirm()).not.toBeDisabled()
    // Typing ON past a valid password back into an invalid one re-disables it.
    type('Navarro2026' + 'x'.repeat(MAX_LENGTH))
    expect(confirm()).toBeDisabled()
    type('Navarro2026')
    expect(confirm()).not.toBeDisabled()
    // …and deleting back to empty closes the checklist again.
    type('')
    expect(confirm()).toBeDisabled()
    expect(screen.queryByText(/Passwords must be/)).toBeNull()
  })

  /* The `disabled` attribute stops a mouse click; Enter inside a form does not
     always respect it, so the submit handler carries the real guard. */
  it('Enter on an invalid password does not leave the page', () => {
    renderPage()
    type('navarro')
    fireEvent.submit(field().closest('form')!)
    expect(screen.getByRole('heading', { name: 'Create password' })).toBeInTheDocument()
    expect(screen.queryByText('Home')).toBeNull()
  })

  it('hard-stops the field at 30 characters rather than letting it overflow', () => {
    renderPage()
    expect(field().maxLength).toBe(MAX_LENGTH)
  })

  it('clicking the empty field fills the test password and reads fully met', () => {
    renderPage()
    fireEvent.click(field())
    expect(field().value).toBe(TEST_PASSWORD)
    expect(confirm()).not.toBeDisabled()
    // Every row, top level and the four types: met, immediately.
    expect(screen.queryByText(/not yet met/)).toBeNull()
    expect(screen.getAllByRole('listitem').length).toBe(
      INVITE_PASSWORD_REQUIREMENTS.length + CHARACTER_TYPES.length,
    )
  })
})

describe('Create password — the checklist', () => {
  it('says met and not-yet-met in words, per row, as the value changes', () => {
    renderPage()
    type('navarronavarro') // 14 lowercase letters: length met, types not
    expect(row('Between')).toHaveTextContent('— met')
    expect(row('At least 3')).toHaveTextContent('— not yet met')
    expect(row('English lowercase')).toHaveTextContent('— met')
    expect(row('English uppercase')).toHaveTextContent('— not yet met')
    expect(row('Numbers')).toHaveTextContent('— not yet met')
    expect(row('Special characters')).toHaveTextContent('— not yet met')

    type('Navarro2026') // upper, lower, number — three of four
    expect(row('At least 3')).toHaveTextContent('— met')
    expect(row('English uppercase')).toHaveTextContent('— met')
    expect(row('Numbers')).toHaveTextContent('— met')
    // The fourth type stays unmet, and that is correct: the verdict is the
    // parent row, not "three of these four are green".
    expect(row('Special characters')).toHaveTextContent('— not yet met')
    expect(confirm()).not.toBeDisabled()
  })

  it('carries each state by icon as well as by colour', () => {
    renderPage()
    type('navarronavarro')
    const glyph = (label: string) => row(label).querySelector('svg')
    const met = glyph('Between')
    const unmet = glyph('At least 3')
    expect(met).not.toBeNull()
    expect(unmet).not.toBeNull()
    // Different glyphs, not the same one recoloured — colour is never alone.
    expect(met!.innerHTML).not.toBe(unmet!.innerHTML)
    // …and the colour does change as well, on the row itself.
    expect(row('Between').style.color).toBe('var(--color-success-700)')
    expect(row('At least 3').style.color).toBe('')
  })

  /* NO RED RING WHILE TYPING. The checklist is this form's error state; a
     border that reddens on every keystroke toward an unfinished password
     duplicates it and reads as the field punishing normal typing. */
  it('does not redden the field mid-typing', () => {
    renderPage()
    type('nav')
    const border = field().closest('span')!.style.border
    type(TEST_PASSWORD)
    expect(field().closest('span')!.style.border).toBe(border)
  })
})

/*
 * THE EYE (2026-10-19) — fixed here, not added. Before this the button
 * rendered the SAME static image in both states, so the input's `type` flipped
 * while the icon said nothing had happened. Both halves are asserted, because
 * the bug was precisely that the two disagreed.
 */
describe('Create password — the show/hide toggle', () => {
  it('flips the input’s type, the accessible name AND the icon together', () => {
    renderPage()
    type(TEST_PASSWORD)
    const show = screen.getByRole('button', { name: 'Show password' })
    expect(field().type).toBe('password')
    expect(show).toHaveAttribute('aria-pressed', 'false')
    const hidden = show.innerHTML

    fireEvent.click(show)

    const hide = screen.getByRole('button', { name: 'Hide password' })
    expect(field().type).toBe('text')
    expect(hide).toHaveAttribute('aria-pressed', 'true')
    expect(hide.innerHTML, 'the icon must change too — this was the bug').not.toBe(hidden)
    expect(screen.queryByRole('button', { name: 'Show password' })).toBeNull()

    fireEvent.click(hide)
    expect(field().type).toBe('password')
    expect(screen.getByRole('button', { name: 'Show password' }).innerHTML).toBe(hidden)
  })

  it('no longer reaches for the one-off public asset', () => {
    renderPage()
    type(TEST_PASSWORD)
    const button = screen.getByRole('button', { name: 'Show password' })
    expect(button.querySelector('img')).toBeNull()
    // The locked Email field's lock is unrelated and stays.
    expect(document.querySelector('img[src="/brand/confirmation/lock.svg"]')).not.toBeNull()
  })
})
