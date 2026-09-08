import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Award, BookOpen, FileText, Lock, MoreVertical } from '@/icons'
import { useAccount, type Brand } from '@/context/AccountContext'
import { getCatalogFixtures } from '@/data/catalog'
import { findLearningCourseById } from '@/data/learningFixtures'

/** The fields the launcher header needs — resolved from the catalog OR the
 *  learning-path fixtures, so a course opened from the Learning Path detail
 *  panel shows its own title + states (not a fallback course). */
type LauncherCourse = { title: string; states: string[] }

/**
 * Course detail / launcher page.
 *
 * Layout sourced from Figma `Y6ooCQHBLhHGbK0cBY4O9O` (Learning Launcher),
 * node `3608:13551` — the McKissock olive palette is mapped to CRE primary
 * (teal) tokens; the orange CTA maps to `--color-action`. The shared Header
 * lives in `AppLayout` and is reused as-is.
 *
 * The page is currently driven by static launcher fixtures (chapters, cert
 * states). Replace with the real progress / TOC API when those endpoints are
 * available — see `TODO(detail-page):` callouts inline.
 */
// Pre-enrollment TOC: the course itself + the post-course survey. Chapter
// list expands once the learner enrolls — see TODO(detail-page).
type TocItemState = 'current' | 'locked' | 'unstarted'
type TocItem = { key: string; title: string; state: TocItemState }

// TODO(detail-page): pull stats from the learner-progress API. Static values
// below mirror the "Not Started" Figma frame.
const STATS = {
  status: 'Not Started',
  progressPercent: 0,
  enrolled: 'mm/dd/yyyy',
  expires: 'mm/dd/yyyy',
  daysToComplete: '1 Year, 25 Days',
  timeSpent: '0 Hours',
  timeRequirement: '20 Hours',
  timeStillRequired: '20 Hours',
}

type CertRow = { state: string; hours: number; type: 'Mandatory' | 'Elective' }

const REPORTING_STATES: CertRow[] = [
  { state: 'Alabama', hours: 7, type: 'Elective' },
  { state: 'Georgia', hours: 7, type: 'Mandatory' },
  { state: 'Louisiana', hours: 7, type: 'Elective' },
]

const NON_REPORTING_STATES: CertRow[] = [
  { state: 'Florida', hours: 7, type: 'Mandatory' },
]

type TabKey = 'certificates' | 'resources' | 'about' | 'instructor' | 'regulatory'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'certificates', label: 'Certificates' },
  { key: 'resources', label: 'Resources' },
  { key: 'about', label: 'About the Course' },
  { key: 'instructor', label: 'Instructor' },
  { key: 'regulatory', label: 'Regulatory Requirements' },
]

/** Resolve the launcher course by id: the active brand's catalog first, then any
 *  learning-path course (the Learning Path detail panel's course ids), then a
 *  representative catalog course as a last resort. */
function resolveLauncherCourse(brand: Brand, id: string | undefined): LauncherCourse {
  const catalog = getCatalogFixtures(brand).individualCourses
  if (id) {
    const hit = catalog.find((c) => c.id === id)
    if (hit) return { title: hit.title, states: hit.states }
    const learn = findLearningCourseById(id)
    if (learn) return learn
  }
  const first = catalog[0]
  return { title: first.title, states: first.states }
}

export function CourseDetailPage({
  courseId,
  embedded = false,
}: {
  /** When embedded in the Dashboard Rebrand shell there's no `:id` route param,
   *  so the launcher course is passed directly. Falls back to the route param. */
  courseId?: string
  /** Rendered inside the shell (left rail) rather than the standalone route —
   *  drops the wide standalone page padding since the shell owns the gutter. */
  embedded?: boolean
} = {}) {
  const { id: routeId } = useParams<{ id: string }>()
  const { brand } = useAccount()
  const id = courseId ?? routeId
  const course = resolveLauncherCourse(brand, id)
  const [tab, setTab] = useState<TabKey>('certificates')

  // Pre-enrollment TOC: the course itself is the active item, the post-course
  // survey is locked behind enrollment. Real chapter list comes from the
  // learner-progress API once enrolled.
  const tocItems: TocItem[] = [
    { key: 'course', title: course.title, state: 'current' },
    { key: 'survey', title: 'Survey', state: 'locked' },
  ]

  return (
    <div
      style={{
        width: '100%',
        // Embedded in the shell, the SectionShell wrapper already provides the
        // gutter — drop the wide standalone padding so it aligns with the rail.
        padding: embedded ? 0 : '32px 64px 64px',
        background: embedded ? 'transparent' : 'var(--color-surface-page)',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-neutral-darkest)',
      }}
    >
      <CourseTitleRow title={course.title} />
      <StatsRow />
      <LauncherCard course={course} tocItems={tocItems} />
      <TabStrip active={tab} onChange={setTab} />
      {tab === 'certificates' && <CertificatesTab course={course} />}
      {tab !== 'certificates' && <ComingSoon label={TABS.find((t) => t.key === tab)?.label ?? ''} />}
    </div>
  )
}

function CourseTitleRow({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 24,
          lineHeight: '32px',
          color: 'var(--color-neutral-darkest)',
        }}
      >
        {title}
      </h1>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <SecondaryAction icon={<BookOpen size={16} aria-hidden />} label="My Notes" />
        <SecondaryAction icon={<MoreVertical size={16} aria-hidden />} label="Course Options" />
      </div>
    </div>
  )
}

function SecondaryAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'transparent',
        border: 'none',
        padding: 0,
        color: 'var(--color-action)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 16,
        lineHeight: '22px',
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function StatsRow() {
  const cells: Array<{ label: string; value: React.ReactNode; flex?: number }> = [
    {
      label: 'Status',
      flex: 2,
      value: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 90, fontWeight: 600, fontSize: 14, lineHeight: '22px' }}>{STATS.status}</span>
          <ProgressBar percent={STATS.progressPercent} />
          <span style={{ width: 46, textAlign: 'center', fontWeight: 600, fontSize: 16, lineHeight: '28px' }}>
            {STATS.progressPercent}%
          </span>
        </div>
      ),
    },
    { label: 'Enrolled', value: STATS.enrolled },
    { label: 'Expires', value: STATS.expires },
    { label: 'Days to Complete', value: STATS.daysToComplete },
    { label: 'Time Spent in Course', value: STATS.timeSpent },
    { label: 'Time Requirement', value: STATS.timeRequirement },
    { label: 'Time Still Required', value: STATS.timeStillRequired },
  ]

  return (
    <div style={{ marginTop: 24, display: 'flex', alignItems: 'stretch', gap: 18 }}>
      {cells.map((cell, i) => (
        <div key={cell.label} style={{ display: 'flex', alignItems: 'stretch', gap: 18, flex: cell.flex }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 12, lineHeight: '18px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {cell.label}
            </span>
            <span style={{ fontSize: 14, lineHeight: '22px', fontWeight: 600 }}>{cell.value}</span>
          </div>
          {i < cells.length - 1 && (
            <span aria-hidden style={{ width: 1, alignSelf: 'stretch', background: 'var(--color-border-subtle)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        flex: 1,
        minWidth: 160,
        maxWidth: 329,
        height: 6,
        borderRadius: 6,
        background: 'var(--color-neutral-300)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          background: 'var(--color-primary-500)',
          transition: 'width 200ms ease',
        }}
      />
    </div>
  )
}

function LauncherCard({ course, tocItems }: { course: LauncherCourse; tocItems: TocItem[] }) {
  return (
    <div
      style={{
        marginTop: 24,
        background: 'var(--color-surface-card)',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '490px 1fr',
        minHeight: 500,
      }}
    >
      <TableOfContents items={tocItems} />
      <EnrollmentPanel course={course} />
    </div>
  )
}

function TableOfContents({ items }: { items: TocItem[] }) {
  return (
    <div style={{ background: 'var(--color-primary-500)', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: 'var(--color-primary-700)',
          padding: '8px 16px',
          margin: '15px 0 0 11px',
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          height: 44,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 16,
            lineHeight: '28px',
            color: 'var(--color-primary-100)',
            paddingLeft: 34,
          }}
        >
          Table of Contents
        </span>
      </div>
      <ol
        style={{
          margin: 0,
          padding: '20px 24px 24px 24px',
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          flex: 1,
        }}
      >
        {items.map((item) => (
          <TocItemRow key={item.key} item={item} />
        ))}
      </ol>
    </div>
  )
}

function TocItemRow({ item }: { item: TocItem }) {
  const tone =
    item.state === 'current'
      ? { bg: 'var(--color-primary-100)', icon: 'var(--color-neutral-darkest)', text: 'var(--color-neutral-darkest)' }
      : item.state === 'locked'
        ? { bg: 'var(--color-primary-500)', icon: 'var(--color-primary-300)', text: 'var(--color-primary-100)' }
        : { bg: 'transparent', icon: 'var(--color-primary-100)', text: 'var(--color-primary-100)' }

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 16,
        padding: '8px 16px',
        borderRadius: 16,
        background: tone.bg,
      }}
    >
      <span aria-hidden style={{ width: 20, color: tone.icon, display: 'inline-flex', justifyContent: 'center' }}>
        {item.state === 'locked' ? <Lock size={16} aria-hidden /> : <RingIcon color={tone.icon} />}
      </span>
      <span style={{ flex: 1, fontWeight: 600, fontSize: 16, lineHeight: '28px', color: tone.text }}>
        {item.title}
      </span>
    </li>
  )
}

function RingIcon({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: `1.5px solid ${color}`,
      }}
    />
  )
}

function EnrollmentPanel({ course }: { course: LauncherCourse }) {
  return (
    <div
      style={{
        padding: '40px 72px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 30,
          lineHeight: '40px',
          color: 'var(--color-neutral-darkest)',
          maxWidth: 590,
        }}
      >
        {course.title}
      </h2>
      <p style={{ margin: 0, fontWeight: 400, fontSize: 16, lineHeight: '28px', color: 'var(--color-neutral-darkest)' }}>
        You are set to receive certificates for this course in the following state(s).
      </p>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {course.states.map((state) => (
          <li
            key={state}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 600,
              fontSize: 16,
              lineHeight: '28px',
              color: 'var(--color-neutral-darkest)',
            }}
          >
            <Award size={18} aria-hidden style={{ color: 'var(--color-primary-700)' }} />
            {state}
          </li>
        ))}
      </ul>
      <button
        type="button"
        style={{
          alignSelf: 'flex-start',
          background: 'transparent',
          border: 'none',
          padding: 0,
          color: 'var(--color-action)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 16,
          lineHeight: '22px',
          cursor: 'pointer',
        }}
      >
        Add/Edit States
      </button>
      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 32px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-action)',
            color: '#fff',
            border: 'none',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 16,
            lineHeight: '28px',
            cursor: 'pointer',
          }}
        >
          Enroll
        </button>
      </div>
    </div>
  )
}

function TabStrip({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <div role="tablist" style={{ marginTop: 36, borderBottom: '1px solid var(--color-border-subtle)', display: 'flex' }}>
      {TABS.map((t) => (
        <button
          key={t.key}
          role="tab"
          type="button"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          style={{
            width: 200,
            height: 48,
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 16,
            lineHeight: '28px',
            color: active === t.key ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
          }}
        >
          <span style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>{t.label}</span>
          <span
            aria-hidden
            style={{
              width: '100%',
              height: 4,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              background: active === t.key ? 'var(--color-primary-700)' : 'transparent',
            }}
          />
        </button>
      ))}
    </div>
  )
}

function CertificatesTab({ course }: { course: LauncherCourse }) {
  void course
  return (
    <div style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 24,
            lineHeight: '32px',
            color: 'var(--color-primary-700)',
          }}
        >
          Certificates
        </h2>
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: 'var(--color-action)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 16,
            lineHeight: '22px',
            cursor: 'pointer',
          }}
        >
          <Award size={16} aria-hidden />
          Add States
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: 24, lineHeight: '32px' }}>No Certificates Available</h3>
        <p style={{ margin: '8px 0 0', fontWeight: 600, fontSize: 16, lineHeight: '28px' }}>
          When you complete the course, and a certificate is issued, you can find it here for the following states:
        </p>
      </div>

      <CertSection
        icon={<Award size={20} aria-hidden style={{ color: 'var(--color-primary-700)' }} />}
        title="Reporting States:"
        helper="This means that McKissock will report your course completion information to the state."
        rows={REPORTING_STATES}
      />
      <CertSection
        icon={<FileText size={20} aria-hidden style={{ color: 'var(--color-primary-700)' }} />}
        title="Non-Reporting States:"
        helper={
          <>
            This means that McKissock will <strong>not</strong> report your course completion information to the state.
            You will be responsible for submitting proof of course completion when renewing your license if needed.
          </>
        }
        rows={NON_REPORTING_STATES}
      />
    </div>
  )
}

function CertSection({
  icon,
  title,
  helper,
  rows,
}: {
  icon: React.ReactNode
  title: string
  helper: React.ReactNode
  rows: CertRow[]
}) {
  return (
    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon}
        <span style={{ fontWeight: 600, fontSize: 16, lineHeight: '28px' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: '22px',
            color: 'var(--color-text-secondary)',
            maxWidth: 660,
          }}
        >
          {helper}
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row) => (
            <CertStateRow key={row.state} row={row} />
          ))}
        </ul>
      </div>
    </div>
  )
}

function CertStateRow({ row }: { row: CertRow }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, lineHeight: '22px' }}>
      <Lock size={16} aria-hidden style={{ color: 'var(--color-primary-700)' }} />
      <span style={{ fontWeight: 600 }}>{row.state}</span>
      <Divider />
      <span>{row.hours} Hours</span>
      <Divider />
      <span>{row.type}</span>
    </li>
  )
}

function Divider() {
  return <span aria-hidden style={{ width: 1, height: 16, background: 'var(--color-border-subtle)' }} />
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ paddingTop: 48, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
      <p style={{ margin: 0, fontSize: 14 }}>
        <em>{label} content — TODO(detail-page).</em>
      </p>
    </div>
  )
}
