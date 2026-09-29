import type { CSSProperties } from 'react'
import { useAccount } from '@/context/AccountContext'

/**
 * Home's page header — Figma 765:3801: a greeting eyebrow over the page title.
 *
 * ⚠ OPTION 3 ONLY, by the ask. The frame it is drawn in is actually OPTION 1's
 * (top nav, no rail), so this may want to follow there too — but it was asked
 * for on the hybrid, and putting a page title on an arm nobody asked about is
 * how a comparison acquires a second variable.
 *
 * ⚠ THE NAME IS THE ACCOUNT'S, not the frame's literal "Jordan". The fixture
 * says Jordan today, so the two agree — but reading the profile means a brand
 * switch or a renamed persona moves the greeting with it, where a hardcoded
 * name would quietly start greeting the wrong learner.
 */
export function HomePageHeader() {
  const { user } = useAccount()
  return (
    <header style={wrapStyle}>
      <p style={eyebrowStyle}>Welcome to your Learning Experience, {user.firstName}</p>
      {/* The page's own H1. The shell's sections are titled by `SectionShell`;
          Home has no such title, which is the gap this fills. */}
      <h1 style={titleStyle}>Home</h1>
    </header>
  )
}

/* The header owns BOTH gutters now: 24 off the top, 16 down to the first card.
   `SectionShell` drops its own 24 while this is above it, so these are the only
   two numbers involved rather than four stacked. */
const wrapStyle: CSSProperties = { padding: '24px 40px 16px' }
const eyebrowStyle: CSSProperties = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-700)',
}
const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 28,
  fontWeight: 700,
  lineHeight: '32px',
  color: 'var(--color-text-primary)',
}
