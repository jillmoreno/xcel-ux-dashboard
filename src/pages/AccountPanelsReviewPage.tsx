import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AccountDetailsEditPanel, type AccountDetailsStep } from '@/components/account/profile/AccountDetailsEditPanel'
import { AccountPanelsScreensGallery } from './AccountPanelsScreensGallery'

/**
 * THE ACCOUNT PANELS, ON THEIR OWN — `/account-panels`, 2026-11-19 (Afsana:
 * "a standalone link like /invite-v3 where we isolate the screenshot for
 * (1) the Edit Account Details panel (2) Update Password panel (3) Update
 * Email Address panel … for dev team to review").
 *
 * The link a ticket carries: the XCEL mark, a title and the pictures — no Hub
 * bar, no demo or design controls, no link out (2026-11-19, Afsana). The
 * pictures are `AccountPanelsScreensGallery`'s.
 *
 * ⚠ `?capture=` IS THE CAPTURE SCRIPT'S, not a reviewer's. With
 * `?capture=choose|password|email` the page draws
 * only the product's `AccountDetailsEditPanel`, open on that step, for
 * `scripts/capture-account-panels.mjs` to photograph — the real panel, so the
 * pictures are of what the product draws. It sits outside AppLayout, so flags
 * read their catalog defaults: Keycloak's Change Password is on.
 */
const STEPS: AccountDetailsStep[] = ['choose', 'password', 'email']

export function AccountPanelsReviewPage() {
  const [params] = useSearchParams()
  const capture = params.get('capture') as AccountDetailsStep | null
  if (capture && STEPS.includes(capture)) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-neutral-75)' }}>
        <AccountDetailsEditPanel
          open
          onClose={() => {}}
          currentEmail="jordan.navarro@gmail.com"
          onEmailSaved={() => {}}
          initialStep={capture}
        />
      </div>
    )
  }

  return (
    <div style={PAGE}>
      <main style={COLUMN}>
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
        <header style={{ display: 'grid', gap: 8 }}>
          <h1 style={TITLE}>Account settings panels</h1>
          <p style={LEAD}>
            Edit Account Details, Update Password and Update Email Address — each panel and its states, once. Click
            one to see it full size.
          </p>
        </header>
        <AccountPanelsScreensGallery />
      </main>
    </div>
  )
}

/* ── Styles — `/invite-v3`'s (`InviteV3StartPage`) ───────────────────── */

const PAGE: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-e2e-field)',
  fontFamily: 'var(--font-e2e-avenir)',
  color: 'var(--color-text-primary)',
  padding: '48px 16px',
  boxSizing: 'border-box',
}

const COLUMN: CSSProperties = { maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 32 }

const LOGO: CSSProperties = { display: 'block', width: 132, height: 42, objectFit: 'contain' }

const TITLE: CSSProperties = { margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 800 }

const LEAD: CSSProperties = { margin: 0, fontSize: 15, lineHeight: '22px', color: 'var(--color-text-secondary)' }
