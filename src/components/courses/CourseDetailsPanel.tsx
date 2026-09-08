import { useContext, useState, type ComponentType, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowsRotate,
  Award,
  BookOpen,
  ChevronRight,
  CircleCheck,
  PersonRunning,
  SignsPost,
  Trash,
  TriangleExclamation,
  X,
} from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { AccountContext } from '@/context/AccountContext'
import { useCourseLauncher } from '@/components/layout/CourseLauncherContext'
import { getCatalogFixtures } from '@/data/catalog'
import type { IndividualCourse } from '@/data/catalogFixtures'
import {
  CERT_ACTION_META,
  certificateForCourse,
  certificateStateOf,
  type Certificate,
} from '@/data/certificateFixtures'
import { CertificateActionPanel } from '@/components/certificates/CertificateActionPanel'
import { courseExpiryState, formatMilestoneDate } from '@/data/courseExpiry'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import { getCourseImage } from '@/utils/courseImage'
import { CourseInfoTabs } from './CourseInfoTabs'
import { StatusRow, type CourseCardData, type CourseStatus } from './CourseCard'

/**
 * The post-purchase Course Details sheet — opened from a course card's kebab on
 * My Courses and the Learning Path.
 *
 * ⚠ NOT the same sheet as `CourseSheet`, and the difference is the whole design.
 * `CourseSheet` is a PURCHASE surface: it is titled "Course Details" because it
 * sits inside a flow with a "Back to Purchase" link, where a generic title says
 * which step you are on, and its hero carries the rating because a rating is a
 * purchase-decision signal. This sheet is what you open about a course you
 * already own. So it is titled with the COURSE (decision 12) and its hero drops
 * the rating (decision 14) — you cannot act on it any more — along with the
 * name (now the title) and the instructor (now behind About the Course).
 *
 * Two views in one sheet (decision 10), swapped in place rather than stacked:
 *
 *   hub     — hero → status zone → actions.        Header control: ✕ Close
 *   details — the shared `CourseInfoTabs`.         Header control: ‹ Back
 *
 * The title stays the course name in both, so the sheet never stops saying what
 * it is about.
 */
export function CourseDetailsPanel({
  open,
  onClose,
  course,
}: {
  open: boolean
  onClose: () => void
  /** The course this sheet is about. `null` renders nothing — the caller keeps
   *  the panel mounted and toggles `open`. */
  course: CourseCardData | null
}) {
  const [view, setView] = useState<'hub' | 'details'>('hub')

  /**
   * Reopening the sheet always lands on the hub. Without this, closing from the
   * details view and reopening on a DIFFERENT course would show that course's
   * tabs, having skipped its status zone entirely.
   *
   * Adjusted during render rather than in an effect — React's documented pattern
   * for "reset some state when a prop changes". An effect would paint the stale
   * view for one frame first, and `react-hooks/set-state-in-effect` flags it.
   */
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (!open) setView('hub')
  }

  if (!course) return null

  /**
   * ⚠ ONE DISMISS PATH FOR EVERY GESTURE — the control, Escape and the backdrop.
   * A header that says "Back" while Escape ejects you out of the sheet is two
   * outcomes from one intent. Lifted from `ManageMembershipPanel`, which settled
   * this for the Manage ⇄ Your Memberships stack.
   *
   * This is why `view` lives HERE and not inside `CourseDetailsBody`: the
   * `Sheet` owns Escape and the backdrop, so it has to be able to see which view
   * is open to know whether dismissing means "back" or "out".
   */
  const dismiss = view === 'details' ? () => setView('hub') : onClose

  return (
    <Sheet open={open} onClose={dismiss} title={course.title}>
      <CourseDetailsBody course={course} view={view} onViewChange={setView} onClose={onClose} />
    </Sheet>
  )
}

/**
 * The sheet's contents, minus the `Sheet` chassis.
 *
 * Extracted so the dev-handoff page can render the REAL body inline — the same
 * split as `ManageMembershipBody` and `ProfilePersonalizeBody`, for the same
 * reason: `Sheet` is a **fixed, full-viewport overlay**, so a preview that
 * mounts the panel covers the very page documenting it. With a no-op `onClose`
 * — which a preview has, since there is nothing to close back to — the page is
 * then unreachable. That is not hypothetical; it shipped that way and had to be
 * reported.
 *
 * `view` is a prop rather than local state because the panel's Escape/backdrop
 * handling needs to read it (see `dismiss` above). An inline caller supplies its
 * own `useState` and gets the working Back control for free.
 *
 * `onClose` is OPTIONAL: without it the header shows no Close control, because
 * an inline render has nowhere to close to. Back still appears in the details
 * view, since that navigates within the body.
 */
export function CourseDetailsBody({
  course,
  view,
  onViewChange,
  onClose,
}: {
  course: CourseCardData
  view: 'hub' | 'details'
  onViewChange: (view: 'hub' | 'details') => void
  onClose?: () => void
}) {
  const [certPanel, setCertPanel] = useState<Certificate | null>(null)
  const navigate = useNavigate()
  const launcher = useCourseLauncher()
  // `useContext` rather than `useAccount()` — the latter throws outside a
  // provider, and cards render in unit tests without one. Same fallback as
  // `CourseCard` and `Logo`.
  const brand = useContext(AccountContext)?.brand ?? 'cre'
  const membership = useContext(AccountContext)?.membership ?? 'member'

  const inDetails = view === 'details'
  const dismiss = inDetails ? () => onViewChange('hub') : onClose

  return (
    <>
      <header style={headerStyle}>
        {dismiss && (
          <button
            type="button"
            aria-label={inDetails ? 'Back to course details' : 'Close course details panel'}
            onClick={dismiss}
            className="cre-sheet-close"
            style={closeStyle}
          >
            {inDetails ? <ArrowLeft size={14} aria-hidden /> : <X size={14} aria-hidden />}
            {inDetails ? 'Back' : 'Close'}
          </button>
        )}
        {/* Decision 12 — the course name IS the title. Decision 13 closed the
            divider that used to sit under this header, so the hero shifts up
            against it rather than floating below a rule that separated the
            name from… the name. */}
        <h2 style={titleStyle}>{course.title}</h2>
      </header>

      {inDetails ? (
        <div style={scrollStyle}>
          <CourseInfoTabs data={catalogCourseFor(brand, course)} />
        </div>
      ) : (
        <div style={scrollStyle}>
          <CourseHero course={course} />
          <StatusZone course={course} onOpenCertificate={setCertPanel} />
          <ActionList
            course={course}
            membership={membership}
            onAbout={() => onViewChange('details')}
            onGoToCourse={() => {
              if (launcher.open) launcher.open(course.id)
              else navigate(`/courses/${course.id}`)
            }}
            onViewCertificate={() => navigate('/my-learning/certificates')}
          />
        </div>
      )}

      {/* Decision 35 — the five pending reasons have ONE implementation, the
          certificates page's own action panel. This sheet surfaces it; it does
          not rebuild it. */}
      <CertificateActionPanel
        open={certPanel !== null}
        onClose={() => setCertPanel(null)}
        data={certPanel}
      />
    </>
  )
}

/* ─── Hero ─────────────────────────────────────────────────────────────────
   Three fields, and three is the FLOOR (decision 13). With the name promoted to
   the title, this meta is the only thing left signalling "this is a course"
   rather than some other record, and the states are what separate two otherwise
   identical CE courses in different jurisdictions. Do not trim further. */

function CourseHero({ course }: { course: CourseCardData }) {
  const imageUrl = course.imageUrl ?? getCourseImage(course.id)
  return (
    <div style={heroStyle}>
      <div
        aria-hidden
        style={{
          width: 80,
          height: 80,
          flex: 'none',
          borderRadius: 'var(--radius-sm)',
          background: `center / cover no-repeat url(${imageUrl})`,
        }}
      />
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={heroMetaStyle}>
          {DELIVERY_LABEL[course.delivery]} · {BADGE_LABEL[course.badge]} ·{' '}
          {course.hours} {course.hours === 1 ? 'Hour' : 'Hours'}
        </span>
        <span style={heroStatesStyle}>{course.state}</span>
      </div>
    </div>
  )
}

/* ─── Status zone ──────────────────────────────────────────────────────────
   Mirrors the card's own status row EXACTLY — because it literally is that
   component. `StatusRow` is exported from `CourseCard` so the two surfaces
   cannot end up saying different things about one course: the card reading
   "Expired" beside a sheet showing a 45% bar is the failure this prevents.

   Below it, at most one certificate line. */

function StatusZone({
  course,
  onOpenCertificate,
}: {
  course: CourseCardData
  onOpenCertificate: (cert: Certificate) => void
}) {
  const brand = useContext(AccountContext)?.brand ?? 'cre'
  const status = (course.status ?? 'not-started') as CourseStatus
  const expiry = courseExpiryState(course, FIXTURE_TODAY)
  const cert = status === 'completed' ? certificateForCourse(brand, course.id) : null
  const certState = certificateStateOf(cert)

  return (
    <section style={statusZoneStyle}>
      <StatusRow data={course} status={status} expiryState={expiry} fontSize={14} />

      {expiry === 'expired' && course.expiresAt && (
        <p style={{ ...certLineStyle, ...toneStyle('error') }}>
          <span style={{ fontWeight: 700 }}>Expired {formatMilestoneDate(course.expiresAt)}</span>
          <span>Enrol again to open this course.</span>
        </p>
      )}

      {expiry !== 'expired' && certState === 'issued' && cert && (
        <p style={{ ...certLineStyle, ...toneStyle('primary') }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <Award size={15} aria-hidden />
            Certificate issued {formatMilestoneDate(cert.completedDate)}
          </span>
        </p>
      )}

      {/*
        THE ONE PLACE THE REASON APPEARS. The card's tag deliberately withheld it
        (decision 3) — five reason strings do not fit a ~207px `nowrap` slot, and
        the tag's job is to say a certificate is blocked, not to litigate why.
        This is the payoff for that restraint, so it must keep naming the reason.

        ⚠ Keyed off `certState === 'pending'`, which comes from
        `status === 'action-required'` — NEVER off the word "pending".
        `reporting: 'pending-roster'` sits on an already-issued certificate and
        renders in the ISSUED branch above.
      */}
      {expiry !== 'expired' && certState === 'pending' && cert && (
        <button
          type="button"
          onClick={() => onOpenCertificate(cert)}
          className="cre-cert-pending-line"
          style={{ ...certLineStyle, ...toneStyle('warning'), ...certButtonStyle }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <TriangleExclamation size={15} aria-hidden />
            Certificate pending — {cert.action ? CERT_ACTION_META[cert.action].pendingLabel : 'Action required'}
          </span>
          <span>Complete this step to release your certificate.</span>
        </button>
      )}
    </section>
  )
}

/* ─── Action list ──────────────────────────────────────────────────────────
   Row chrome is inherited VERBATIM from `ManageMembershipPanel` — same padding,
   gap, glyph size, type scale, and the same rule that `danger` recolours the
   glyph, label and chevron and changes NOTHING else. A second signal in the
   shape would make Remove look like somewhere the design didn't want you to go.

   (The two files hold their own copies of these styles rather than sharing an
   `ActionRow` primitive. Extracting one is the obvious follow-up; it was left
   out of this slice because it means rewiring the membership sheet, which is a
   separate blast radius from building this one.) */

type Row = {
  key: string
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  label: string
  detail: string
  onClick: () => void
}

function ActionList({
  course,
  membership,
  onAbout,
  onGoToCourse,
  onViewCertificate,
}: {
  course: CourseCardData
  membership: 'member' | 'non-member'
  onAbout: () => void
  onGoToCourse: () => void
  onViewCertificate: () => void
}) {
  const brand = useContext(AccountContext)?.brand ?? 'cre'
  const status = (course.status ?? 'not-started') as CourseStatus
  const expiry = courseExpiryState(course, FIXTURE_TODAY)
  const expired = expiry === 'expired'
  const completed = status === 'completed' && !expired
  const cert = completed ? certificateForCourse(brand, course.id) : null
  const isMember = membership === 'member'
  const percent = Math.round(course.progress ?? 0)

  const rows: Row[] = []

  /**
   * ⚠ ON EXPIRED, `Go to Course` IS REPLACED — NOT DISABLED (decision 29).
   * Access has ended, so the row cannot do what it says, and a greyed row that
   * still reads "Go to Course" is the design insisting on an affordance it no
   * longer has. `Enrol again` takes the lead slot instead.
   *
   * Its sub-line still promises ACCESS and nothing else — "Get access to this
   * course again", never "pick up where you left off". That part did NOT change
   * when the frozen progress bar came back on 2026-09-08: showing what the
   * learner did is a record; promising they resume from it is a claim about
   * LMS behaviour nobody here can make, to someone who is about to pay.
   */
  if (expired) {
    rows.push({
      key: 'enrol-again',
      Icon: ArrowsRotate,
      label: 'Enrol again',
      detail: 'Get access to this course again.',
      onClick: () => console.info('course:enrol-again', course.id),
    })
  } else {
    if (completed && cert && cert.status === 'completed') {
      // A completed course leads with the thing you came for.
      rows.push({
        key: 'view-certificate',
        Icon: Award,
        label: 'View Certificate',
        detail: certificateDetail(cert),
        onClick: onViewCertificate,
      })
    }
    rows.push({
      key: 'go-to-course',
      Icon: PersonRunning,
      label: 'Go to Course',
      detail: goToCourseDetail(status, percent),
      onClick: onGoToCourse,
    })
  }

  // Labels stay stable across states; the SUB-LINE does the state work. Same
  // pattern as Manage Membership's auto-renewal row. This one never varies at
  // all — it names what is behind the door, which does not change.
  rows.push({
    key: 'about',
    Icon: BookOpen,
    label: 'About the Course',
    detail: 'Description, instructor and schedule.',
    onClick: onAbout,
  })

  // Nothing to report externally once this course is finished here.
  if (!completed) {
    rows.push({
      key: 'completed-externally',
      Icon: CircleCheck,
      label: 'Completed Externally',
      detail: 'Already took this elsewhere? Report it for credit.',
      onClick: () => console.info('course:completed-externally', course.id),
    })
  }

  // Swap is the one row whose sub-line flexes by MEMBERSHIP rather than by
  // progress: a member exchanges within their plan, an à-la-carte buyer within
  // what they paid. Gone once the course is finished or expired — there is
  // nothing left to exchange.
  if (!completed && !expired) {
    rows.push({
      key: 'swap',
      // A fork in the road, not `ArrowsRotate` — that glyph is "again", and it
      // is already carrying `Enrol again` on the state where both can appear.
      Icon: SignsPost,
      label: 'Swap Course',
      detail: withProgressWarning(
        isMember
          ? 'Exchange this for another course in your plan.'
          : 'Exchange for another date, or a course of equal value.',
        status,
        percent,
      ),
      onClick: () => console.info('course:swap', course.id),
    })
  }

  /**
   * The danger group is CONDITIONAL, and the container renders only when it
   * holds a row — an empty bordered box above a 20px gap is worse than no group.
   * Absent for non-members (they bought this course; removing it is a refund
   * question, not a list-management one) and on every completed course (removing
   * a completed course would take its record with it).
   */
  const removeRow: Row | null =
    isMember && !completed
      ? {
          key: 'remove',
          Icon: Trash,
          label: 'Remove Course',
          detail: withProgressWarning('Removes it from My Courses.', status, percent),
          onClick: () => console.info('course:remove', course.id),
        }
      : null

  return (
    <section>
      <h3 style={actionsHeadingStyle}>What would you like to do?</h3>
      <div style={rowListStyle}>
        {rows.map((r, i) => (
          <ActionRow
            key={r.key}
            Icon={r.Icon}
            label={r.label}
            detail={r.detail}
            onClick={r.onClick}
            last={i === rows.length - 1}
          />
        ))}
      </div>
      {removeRow && (
        // Keep the 20px gap. The rule that used to divide the groups was removed
        // on 2026-08-25; this spacing plus each group's own card boundary is now
        // the only thing separating them.
        <div style={{ ...rowListStyle, ...dangerZoneStyle }}>
          <ActionRow
            Icon={removeRow.Icon}
            label={removeRow.label}
            detail={removeRow.detail}
            onClick={removeRow.onClick}
            danger
            last
          />
        </div>
      )}
    </section>
  )
}

function ActionRow({
  Icon,
  label,
  detail,
  onClick,
  danger,
  last,
}: Omit<Row, 'key'> & { danger?: boolean; last?: boolean }) {
  const tone = danger ? 'var(--color-error-600)' : undefined
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cre-manage-row${danger ? ' cre-manage-row--danger' : ''}`}
      style={{ ...actionRowStyle, ...(last ? { borderBottom: 'none' } : null) }}
    >
      <span aria-hidden style={{ ...rowGlyphStyle, color: tone ?? 'var(--color-primary-600)' }}>
        <Icon size={19} />
      </span>
      <span style={rowTextStyle}>
        <b style={{ ...rowLabelStyle, ...(tone ? { color: tone } : null) }}>{label}</b>
        <span style={rowDetailStyle}>{detail}</span>
      </span>
      <span aria-hidden style={{ ...rowGlyphStyle, color: tone ?? 'var(--color-neutral-600)' }}>
        <ChevronRight size={16} />
      </span>
    </button>
  )
}

/* ─── copy + lookups ───────────────────────────────────────────────────── */

function goToCourseDetail(status: CourseStatus, percent: number): string {
  if (status === 'completed') return 'Review the course material.'
  if (status === 'in-progress') return `Pick up where you left off — ${percent}% complete`
  return 'Start the first section.'
}

/**
 * Swap and Remove append the ACTUAL percentage. Naming the real number is the
 * point — the same move the membership renewal copy makes by printing a real
 * date instead of "soon". "Your progress is not kept" is easy to skim past;
 * "Your 45% progress is not kept" is not.
 *
 * ⚠ EXPIRED USED TO BE SUPPRESSED HERE and no longer is (2026-09-08). That
 * suppression existed because the card hid progress on expired entirely, so a
 * percentage in this sub-line was the one place a number could leak out. Now
 * that the status zone shows the frozen bar and its percentage, withholding the
 * same number in the one row that DESTROYS it would be the odd choice: the
 * learner can see 30% on screen, and Remove is what discards it.
 */
function withProgressWarning(base: string, status: CourseStatus, percent: number): string {
  if (status !== 'in-progress' || percent <= 0) return base
  return `${base} Your ${percent}% progress is not kept.`
}

function certificateDetail(cert: Certificate): string {
  const issued = `Issued ${formatMilestoneDate(cert.completedDate)}`
  const r = cert.reporting
  if (r?.status === 'reported' && r.date) return `${issued} · Reported ${formatMilestoneDate(r.date)}`
  if (r?.status === 'pending-roster') return `${issued} · Pending roster submission`
  if (r?.status === 'non-reporting') return `${issued} · ${r.stateAbbr} is a non-reporting state`
  return issued
}

/**
 * The tabs take an `IndividualCourse`; a card carries a `CourseCardData`. This
 * resolves one from the brand catalog and falls back to a representative course
 * when the id isn't stocked there (the same known fixture gap the in-shell
 * Learning Launcher has).
 *
 * The fallback is tolerable HERE specifically because every tab's content is
 * course-independent fixture copy today — `DESCRIPTION_PARAGRAPHS`, `INSTRUCTOR`
 * and `WEBINAR_INFO` are module constants. So all the resolved course actually
 * decides is WHICH tabs show. When the tabs get real per-course content this has
 * to become a real lookup, or the sheet will confidently describe the wrong
 * course.
 */
function catalogCourseFor(
  brand: Parameters<typeof getCatalogFixtures>[0],
  course: CourseCardData,
): IndividualCourse {
  const catalog = getCatalogFixtures(brand).individualCourses
  return catalog.find((c) => c.id === course.id) ?? catalog[0]
}

const DELIVERY_LABEL: Record<CourseCardData['delivery'], string> = {
  online: 'Online',
  'in-person': 'In Person',
  classroom: 'Classroom',
  video: 'Video',
  podcast: 'Podcast',
}

const BADGE_LABEL: Record<CourseCardData['badge'], string> = {
  mandatory: 'Mandatory',
  elective: 'Elective',
  'non-credit': 'Non-Credit',
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

const headerStyle: CSSProperties = {
  padding: '20px 20px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const closeStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  cursor: 'pointer',
  padding: 0,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const scrollStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
}

const heroStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  padding: '0 20px 16px',
}

const heroMetaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const heroStatesStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const statusZoneStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '16px 20px',
  background: 'var(--color-surface-card)',
  borderTop: '1px solid var(--color-border-subtle)',
  borderBottom: '1px solid var(--color-border-subtle)',
  marginBottom: 20,
}

const certLineStyle: CSSProperties = {
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
}

/** The pending line is a real button (it opens `CertificateActionPanel`); these
 *  reset the UA button chrome so it renders identically to the two static
 *  lines beside it. */
const certButtonStyle: CSSProperties = {
  border: 'none',
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  alignItems: 'flex-start',
}

/** Tints for the three certificate lines. `-800` on the warning ramp because
 *  warning ramps run light and this sits on a `-100` fill — the same stop the
 *  card's expiring-soon badge uses. */
function toneStyle(tone: 'primary' | 'warning' | 'error'): CSSProperties {
  if (tone === 'warning') {
    return { background: 'var(--color-warning-100)', color: 'var(--color-warning-800)' }
  }
  if (tone === 'error') {
    return { background: 'var(--color-error-100)', color: 'var(--color-error-700)' }
  }
  return { background: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }
}

const actionsHeadingStyle: CSSProperties = {
  margin: '0 20px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-primary-700)',
}

const rowListStyle: CSSProperties = {
  margin: '0 20px',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--color-surface-card)',
}

/** NOTE: `background` is deliberately NOT set here — it lives on
 *  `.cre-manage-row` in tokens.css. An inline background would beat the
 *  stylesheet's `:hover` rule on specificity, so the rows would look
 *  interactive and then not respond. Copied with its reason from
 *  `ManageMembershipPanel`. */
const actionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  width: '100%',
  padding: '15px 18px',
  textAlign: 'left',
  border: 'none',
  borderBottom: '1px solid var(--color-border-subtle)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const rowGlyphStyle: CSSProperties = { flex: 'none', display: 'inline-flex' }
const rowTextStyle: CSSProperties = { flex: 1, minWidth: 0 }

const rowLabelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const rowDetailStyle: CSSProperties = {
  display: 'block',
  marginTop: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const dangerZoneStyle: CSSProperties = { marginTop: 20, marginBottom: 24 }
