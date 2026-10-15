import { AtlasHeader } from '@/components/layout/AtlasHeader'
import { WHITE_COURSES } from '@/data/atlasWhiteCourses'

/**
 * `/atlas-header-preview` (2026-10-13) — the Atlas header on its own, outside
 * the app shell, so it can be reviewed without being wired in anywhere.
 *
 * DEMO DATA: the learner is the reference build's; the courses are
 * Eric/Atlas White's active list (`atlasWhiteCourses.ts`), read, not changed.
 */
export function AtlasHeaderPreviewPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-neutral-75)' }}>
      <AtlasHeader
        current="home"
        user={{ name: 'Alicia Navarro', email: 'alicia.navarro@gmail.com' }}
        notificationCount={3}
        courses={WHITE_COURSES.map((c) => ({ id: c.id, title: c.title }))}
      />
    </div>
  )
}
