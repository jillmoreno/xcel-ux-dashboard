import { useAccount } from '@/context/AccountContext'
import {
  pageHeaderEyebrowStyle,
  pageHeaderTitleStyle,
  pageHeaderWrapStyle,
} from './pageHeaderStyles'

/**
 * Home's page header — Figma 765:3801: a greeting eyebrow over the page title.
 *
 * ⚠ EVERY ARM OF THE EXPLORATION, not just the hybrid — see `PlatformShell`,
 * which decides and carries the note.
 *
 * ⚠ THE NAME IS THE ACCOUNT'S, not the frame's literal "Jordan". The fixture
 * says Jordan today, so the two agree — but reading the profile means a brand
 * switch or a renamed persona moves the greeting with it, where a hardcoded
 * name would quietly start greeting the wrong learner.
 *
 * ⚠ THE STYLES ARE SHARED WITH `SectionPageHeader` (`pageHeaderStyles.ts`).
 * Courses and Certificates draw the same box with a breadcrumb in place of the
 * greeting, and the ask was that their titles match this one exactly.
 */
export function HomePageHeader({ align }: { align?: { inset: number; maxWidth: number } }) {
  const { user } = useAccount()
  const content = (
    <>
      <p style={pageHeaderEyebrowStyle}>
        Welcome to your Learning Experience, {user.firstName}
      </p>
      {/* The page's own H1. The shell's sections are titled by `SectionShell`;
          Home has no such title, which is the gap this fills. */}
      <h1 style={pageHeaderTitleStyle}>Home</h1>
    </>
  )
  /* ⚠ `align` MATCHES THE HEADER TO THE CONTENT BELOW IT — added 2026-10-06 for
     Hybrid V1, and it takes TWO numbers because one is not enough.

     The first try passed only an inset and the title still sat 25px left of the
     card: that section pads by 56 AND caps its content at 1200 centred, so past
     1200 + 112 the card stops moving with the padding and starts moving with
     the centring. A gutter alone can never line up with a centred column.

     ⚠ OPT-IN. Every other arm keeps the shared `pageHeaderWrapStyle` it shares
     with `SectionPageHeader`, and passing nothing is the unchanged behaviour.
     The caller knows its own layout; this component does not and should not. */
  if (!align) return <header style={pageHeaderWrapStyle}>{content}</header>
  return (
    <header style={{ ...pageHeaderWrapStyle, paddingInline: align.inset }}>
      <div style={{ maxWidth: align.maxWidth, margin: '0 auto' }}>{content}</div>
    </header>
  )
}
