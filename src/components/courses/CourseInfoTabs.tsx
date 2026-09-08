import { useId, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { IndividualCourse } from '@/data/catalogFixtures'
import { DESCRIPTION_PARAGRAPHS, INSTRUCTOR, WEBINAR_INFO } from './courseSheetFixtures'

/**
 * Description / Instructor / Schedule — the course's reference content.
 *
 * Extracted from `CourseSheet` so the pre-purchase sheet and the post-purchase
 * `CourseDetailsPanel` render ONE implementation. They are the same three
 * panels about the same course; the only thing that differs is which sheet you
 * reached them from, and two copies of that is how they drift.
 *
 * The extraction was deliberately behaviour-neutral — `CourseSheet`'s rendered
 * output is unchanged — apart from the schedule rule widening (below).
 */
export function CourseInfoTabs({ data }: { data: IndividualCourse }) {
  const [tab, setTab] = useState<TabKey>('description')
  // Ids have to be unique per instance: `CourseSheet` and `CourseDetailsPanel`
  // can both be mounted at once, and duplicate ids would point every tab's
  // `aria-controls` at whichever panel the document happened to hold first.
  const uid = useId()
  const tabId = (k: TabKey) => `${uid}-tab-${k}`
  const panelId = (k: TabKey) => `${uid}-panel-${k}`

  /**
   * ⚠ WIDER THAN `isLive`. A live course obviously has a schedule, but so does
   * a multi-session one whatever its delivery — a self-paced course split over
   * scheduled cohorts still needs its dates somewhere. The `> 1` matters: a
   * single-session online course has nothing to schedule, and an empty tab is
   * worse than no tab.
   */
  const isLive = data.delivery === 'webinar' || data.delivery === 'in-person'
  const showSchedule = isLive || (data.sessions?.length ?? 0) > 1

  // A deep link or a state change could leave `schedule` selected on a course
  // that no longer shows it; fall back rather than render a blank panel.
  const active = tab === 'schedule' && !showSchedule ? 'description' : tab

  const keys: TabKey[] = showSchedule
    ? ['description', 'instructor', 'schedule']
    : ['description', 'instructor']

  /**
   * Arrow-key roving, per the APG tabs pattern. Paired with the roving
   * `tabIndex` below: only the selected tab is in the tab order, so Tab moves
   * PAST the strip to the panel rather than through every tab in it, and the
   * arrows move between tabs. Home / End jump to the ends.
   */
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = keys.indexOf(active)
    let next: number | null = null
    if (e.key === 'ArrowRight') next = (i + 1) % keys.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + keys.length) % keys.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = keys.length - 1
    if (next === null) return
    e.preventDefault()
    const key = keys[next]
    setTab(key)
    // Selection follows focus, so move focus with it or the next arrow press
    // reads the wrong starting point.
    document.getElementById(tabId(key))?.focus()
  }

  return (
    <>
      <div
        role="tablist"
        aria-label="Course details"
        onKeyDown={onKeyDown}
        style={{ display: 'flex', padding: '8px 24px 0', borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        {keys.map((k) => (
          <TabButton
            key={k}
            id={tabId(k)}
            controls={panelId(k)}
            active={active === k}
            onClick={() => setTab(k)}
          >
            {TAB_LABEL[k]}
          </TabButton>
        ))}
      </div>

      {/*
        `tabIndex={0}` on the panel is deliberate and required here: these
        panels hold no focusable content of their own, so without it a keyboard
        user can reach the tabs and never reach the text they select.
      */}
      <div
        role="tabpanel"
        id={panelId(active)}
        aria-labelledby={tabId(active)}
        tabIndex={0}
        style={{ padding: '20px 24px 32px' }}
      >
        {active === 'description' && <DescriptionTab />}
        {active === 'instructor' && <InstructorTab />}
        {active === 'schedule' && showSchedule && <ScheduleTab />}
      </div>
    </>
  )
}

type TabKey = 'description' | 'instructor' | 'schedule'

const TAB_LABEL: Record<TabKey, string> = {
  description: 'Description',
  instructor: 'Instructor',
  schedule: 'Schedule',
}

/**
 * ⚠ `data-active` is a STYLING hook and nothing more — assistive tech does not
 * read it. `aria-selected` is what announces the selection, and the underline
 * below is `aria-hidden`, so dropping the ARIA leaves a screen-reader user with
 * three buttons and no way to tell which one is on. That is exactly what
 * happened when these tabs were extracted from `CoursePurchaseSheet`.
 */
function TabButton({
  id,
  controls,
  active,
  onClick,
  children,
}: {
  id: string
  controls: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      // Roving tabindex — see `onKeyDown` on the tablist.
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className="cre-membership-tab"
      data-active={active ? 'true' : 'false'}
      style={{
        flex: 1,
        position: 'relative',
        background: 'transparent',
        border: 'none',
        padding: '6px 8px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontWeight: 600,
        lineHeight: '28px',
        cursor: 'pointer',
      }}
    >
      <span style={{ padding: '0 8px' }}>{children}</span>
      <span
        aria-hidden
        style={{
          width: '100%',
          height: 4,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          background: active ? 'var(--color-tab-active)' : 'transparent',
        }}
      />
    </button>
  )
}

function DescriptionTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Introduction</h3>
      {DESCRIPTION_PARAGRAPHS.map((p, i) => (
        <p key={i} style={{ margin: 0 }}>
          {p}
        </p>
      ))}
    </div>
  )
}

function InstructorTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          aria-hidden
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-pill)',
            background: `center / cover no-repeat url(${INSTRUCTOR.avatarUrl})`,
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontWeight: 700 }}>{INSTRUCTOR.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{INSTRUCTOR.title}</div>
        </div>
      </div>
      <p style={{ margin: 0 }}>{INSTRUCTOR.bio}</p>
    </div>
  )
}

function ScheduleTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', fontSize: 14 }}>
      {WEBINAR_INFO.sessions.map((s, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr auto',
            gap: 12,
            alignItems: 'center',
            padding: '14px 4px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <span>{s.day}</span>
          <span>{s.date}</span>
          <span>{s.time}</span>
        </div>
      ))}
    </div>
  )
}
