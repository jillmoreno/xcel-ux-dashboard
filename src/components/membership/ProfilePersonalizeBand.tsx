import { useState } from 'react'
import { CircleUser } from '@/icons'
import { useMotivation } from '@/context/MotivationContext'
import { ProfilePersonalizePanel } from '@/components/account/ProfilePersonalizePanel'

/**
 * "Personalize your profile" nudge — a slim navy band matching the learning-
 * setup resume band's collapsed style. Prompts the learner to add a profile
 * photo + a motivational statement; clicking "Personalize" opens the
 * `ProfilePersonalizePanel`. Self-dismisses once a motivational statement is set
 * (the concrete, persisted personalization signal).
 *
 * REMOVED FROM THE DASHBOARD 2026-09-01. It is no longer mounted anywhere in the
 * product — its only consumer was `MembershipOverview`, and it now lives as its
 * own walkthrough (`personalize-profile`) plus the standalone
 * `public/prototypes/personalize-profile.html`. See ARCHIVED_ITEMS.
 *
 * The `dashboard-personalize-profile` flag gate went with it. That was NOT
 * tidying: the flag existed to place this band on the dashboard, there is no
 * dashboard placement now, and leaving a `useFeatureFlag` read against a deleted
 * catalog entry would resolve `false` forever — the component would be
 * unrenderable even in its own preview. The self-dismiss gate below stays,
 * because it is the component's own behaviour rather than a placement switch.
 */
export function ProfilePersonalizeBand() {
  const { statement } = useMotivation()
  const [open, setOpen] = useState(false)
  // Hide the nudge once the learner has personalized (a statement is set).
  const personalized = statement.trim().length > 0
  if (personalized) return null
  return (
    <>
      <section
        aria-label="Personalize your profile"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '18px 22px',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          // WCAG AA fix (2026-09-01). Was `primary-800 -> primary-600`, which put
          // the copy over a background that lightens as the band narrows: the
          // text block is left-anchored at a fixed ~79px with a fixed ~372px
          // measure, so the narrower the band, the further along the gradient
          // its right edge sits. Measured on the 12px sub-line at 0.75 alpha,
          // that failed 4.5:1 for McKissock below ~800px and CRE below ~560px —
          // i.e. in the tablet and mobile device frames, not at the desktop
          // width it was reviewed at, which is why nobody caught it.
          //
          // `primary-900 -> primary-700` keeps the gradient and clears AA at
          // EVERY width on all four brands (worst case 5.01:1 sub-line, 7.67:1
          // title, McKissock at 358px). Raising the sub-line alpha instead was
          // tried on paper first and is NOT sufficient — at 0.88 McKissock still
          // fails below ~520px. Guarded by ProfilePersonalizeContrast.test.ts.
          background: 'linear-gradient(135deg, var(--color-primary-900), var(--color-primary-700))',
          color: 'var(--color-text-inverse)',
          boxShadow: '0 18px 40px -18px color-mix(in srgb, var(--color-primary-900) 55%, transparent)',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgb(255 255 255 / 0.14)',
            color: 'var(--color-secondary-300)',
          }}
        >
          <CircleUser size={22} />
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15 }}>
            Personalize your profile
          </p>
          <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgb(255 255 255 / 0.75)' }}>
            Add a profile photo and a motivational statement to make it yours.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cre-setup-focusable"
          style={{
            marginLeft: 'auto',
            flex: 'none',
            background: 'linear-gradient(135deg, var(--color-cta-500), var(--color-cta-600))',
            color: 'var(--color-text-inverse)',
            border: 0,
            borderRadius: 'var(--radius-md)',
            padding: '11px 20px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Personalize →
        </button>
      </section>
      {/* Kept mounted (toggling `open`) so the success toast survives the close. */}
      <ProfilePersonalizePanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
