import { useEffect, type CSSProperties } from 'react'
import { ArrowLeft, FileText } from '@/icons'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useDeclareDesignSurface } from '@/context/designSurface'
import { setCourseChrome } from './courseTakeover'
import { CompassJeffCourse } from './CompassJeffCourse'
import { CompassSessionPage } from './CompassSessionPage'

/**
 * WHICH VERSION OF THE COURSE CONTENT IS ON SCREEN — 2026-11-05, the direct
 * ask: "a design tool dropdown to show Anjanis Version (current), Jeffs
 * Version (what I will upload), and then a Refined Version (to come later)".
 *
 * ⚠ `CompassLessonVersion`, NOT `CompassCourseContent`, WHICH IS TAKEN —
 * `src/components/compass/CompassCourseContent.tsx` is the course player's
 * bordered lesson stage (Figma 49:3338) and has been since 2026-09-24. Two
 * components with one name in one app is a merge waiting to happen.
 *
 * ⚠ A DISPATCHER, NOT A CONDITIONAL INSIDE THE SESSION. The project's own
 * rule for changing something that already exists: copy it to a sibling and
 * let the flag choose at the call site (`CourseContentV2` is the worked
 * example). `CompassSessionPage` is untouched by this file, so whoever is
 * editing the seven beats cannot collide with whoever ports Jeff's version.
 *
 * ⚠ IT IS THE ONLY MOUNT SITE. `PlatformShell` renders THIS where it used to
 * render the session directly (`?section=compass&session=1`), which is what
 * makes the dropdown bite on every way in — the Tonight card, Resume lesson,
 * Begin Course from Atlas Home, and a deep link.
 *
 * ⚠ PORTING JEFF'S FILE IS REPLACING ONE LINE HERE. Build his page as its own
 * component beside `CompassSessionPage` and return it from the `jeff` arm.
 * Read his RUNNING BUILD when you do — `/port-prototype`, and the four passes
 * the Workspace took are what that skill is made of.
 */
export function CompassLessonVersion({ onExit }: { onExit: () => void }) {
  /* ⚠ READ AS A VARIANT WITH A FALLBACK, the shape `compass-session-chrome`
     uses: an unset or stale stored value lands on what ships rather than on a
     placeholder nobody chose. */
  const version = useFeatureFlag('compass-content-version').variant ?? 'anjani'
  /* HIS COURSE PLAYER — ported 2026-11-05 from `compass-prototype-b-v3.html`.
     The arm it fills was a placeholder for one morning; the placeholder stays
     for `refined`, which does not exist yet. */
  if (version === 'jeff') return <CompassJeffCourse onExit={onExit} />
  if (version === 'refined') return <CompassContentPending version="refined" onExit={onExit} />
  return <CompassSessionPage onExit={onExit} />
}

/** What each empty arm is waiting for, in the words the dropdown uses. */
const PENDING: Record<'refined', { title: string; lead: string; note: string }> = {
  refined: {
    title: 'Refined version',
    lead: 'This is the version that follows the review. It does not exist yet.',
    note: 'The arm is drawn now so the three-way comparison has its third seat from the start.',
  },
}

/**
 * AN ARM WITH NOTHING IN IT, SAYING SO.
 *
 * ⚠ IT DOES NOT FALL BACK TO ANJANI'S, and that is the decision this panel
 * exists to make visible. A silent fallback renders HER lesson under HIS name:
 * the reviewer sees a working seven-beat session, believes it is Jeff's, and
 * nothing on screen corrects them. An empty arm that names what is missing is
 * the honest state of the work.
 *
 * ⚠ IT KEEPS THE APP HEADER (`setCourseChrome('none')`). The session stands
 * the header down because it draws its own bar; this draws no bar, so standing
 * the header down would leave a reviewer on a bare page with no product
 * navigation at all. The Back button below is the second way out, not the only
 * one.
 *
 * ⚠ IT DECLARES `compass:session` TOO. The Design bar scopes controls by the
 * surface on screen, so an arm that failed to declare it would take its own
 * dropdown off the bar the moment it rendered — picking Jeff would strand the
 * reviewer with no control to pick Anjani back.
 */
export function CompassContentPending({
  version,
  onExit,
}: {
  version: 'refined'
  onExit: () => void
}) {
  useDeclareDesignSurface('compass:session')
  useEffect(() => {
    setCourseChrome('none')
    return () => setCourseChrome('none')
  }, [])
  const copy = PENDING[version]
  return (
    <div style={groundStyle} role="region" aria-label={`${copy.title} — not in the prototype yet`}>
      <div style={panelStyle}>
        <span style={markStyle} aria-hidden>
          <FileText size={18} />
        </span>
        <p style={eyebrowStyle}>Course content</p>
        <h1 style={titleStyle}>{copy.title}</h1>
        <p style={leadStyle}>{copy.lead}</p>
        <p style={noteStyle}>{copy.note}</p>
        <p style={howStyle}>
          To go back to the lesson that is in the product, open the Design controls and set{' '}
          <strong style={strongStyle}>Course content version</strong> to{' '}
          <strong style={strongStyle}>Anjani’s version</strong>.
        </p>
        <button type="button" style={backStyle} onClick={onExit}>
          <ArrowLeft size={13} aria-hidden />
          Back to Learn
        </button>
      </div>
    </div>
  )
}

const groundStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  background: 'var(--color-surface-page)',
  padding: '72px 24px',
}
const panelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 560,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 10,
  padding: '28px 32px 24px',
}
const markStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 8,
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-tertiary)',
  marginBottom: 16,
}
const eyebrowStyle: CSSProperties = {
  margin: '0 0 4px',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-700)',
}
const titleStyle: CSSProperties = {
  margin: '0 0 12px',
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 24,
  fontWeight: 700,
  lineHeight: 1.2,
  color: 'var(--color-text-primary)',
}
const leadStyle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: 15,
  lineHeight: 1.55,
  color: 'var(--color-text-primary)',
}
const noteStyle: CSSProperties = {
  margin: '0 0 18px',
  fontSize: 14,
  lineHeight: 1.55,
  color: 'var(--color-text-secondary)',
}
const howStyle: CSSProperties = {
  margin: '0 0 22px',
  paddingTop: 16,
  borderTop: '1px solid var(--color-border-subtle)',
  fontSize: 13,
  lineHeight: 1.55,
  color: 'var(--color-text-tertiary)',
}
const strongStyle: CSSProperties = { color: 'var(--color-text-secondary)', fontWeight: 600 }
const backStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 6,
  padding: '8px 14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}
