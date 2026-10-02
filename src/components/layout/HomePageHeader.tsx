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
export function HomePageHeader() {
  const { user } = useAccount()
  return (
    <header style={pageHeaderWrapStyle}>
      <p style={pageHeaderEyebrowStyle}>
        Welcome to your Learning Experience, {user.firstName}
      </p>
      {/* The page's own H1. The shell's sections are titled by `SectionShell`;
          Home has no such title, which is the gap this fills. */}
      <h1 style={pageHeaderTitleStyle}>Home</h1>
    </header>
  )
}
