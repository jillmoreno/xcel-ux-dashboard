import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAccount } from '@/context/AccountContext'
import { useNotifications } from '@/context/NotificationsContext'
import { useProfileAvatar } from '@/context/ProfileAvatarContext'
import { WHITE_COURSES, WHITE_COURSE_PARAM, WHITE_FIRST_COURSE_ID } from '@/data/atlasWhiteCourses'
import { AtlasHeader } from './AtlasHeader'
import { ATLAS_HOME_REFRESH } from './atlasHomeRefresh'

/**
 * `AtlasHeader` IN THE REBRAND SHELL (2026-10-13) — the standalone header fed
 * the shell's own data, for `Header` to draw when `atlas-header-v2` is on.
 *
 *   learner        `useAccount().user` + the profile-avatar override, as
 *                  `AccountMenu` reads them. The email is `AccountMenu`'s
 *                  authored default — the model has no email field.
 *   bell count     `useNotifications().unread`. The bell opens nothing: the
 *                  notifications panel is not designed for this header yet.
 *   My Courses     Eric/Atlas White's active courses. A pick makes it the
 *                  course Home shows (`?whiteCourse=`) and goes Home, as the
 *                  Top Nav's own dropdown does; View all courses opens
 *                  `section=courses`.
 *   Home / Help    the shell's Home and `section=support`, keeping the demo's
 *                  own params (`?version`, `?ff`, `?demo`…).
 *   profile rows   the shell's account sections, directly. NOT the
 *                  `/account/*` routes `AccountMenu` uses: those redirect into
 *                  the shell WITHOUT `?version=`, dropping the reviewer out of
 *                  the version they were on.
 *   Logout         nowhere, as in `AccountMenu`.
 */
export function AtlasHeaderConnected() {
  const { user } = useAccount()
  const { avatarOverride } = useProfileAvatar()
  const { unread } = useNotifications()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const section = params.get('section')
  const current =
    !section || section === 'dashboard' || section === 'study-plan' || section === 'certificates' || section === 'resources'
      ? 'home'
      : section === 'courses' || section === 'course'
        ? 'courses'
        : null

  // A shell address: the demo's params, with the section swapped.
  const shell = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    next.delete('section')
    next.delete('coursePage')
    mutate(next)
    const qs = next.toString()
    return `/dashboard-rebrand${qs ? `?${qs}` : ''}`
  }

  const home = shell(() => {})
  return (
    <AtlasHeader
      current={current}
      user={{
        name: `${user.firstName} ${user.lastName}`,
        email: 'alicia.navarro@gmail.com',
        photoUrl: avatarOverride ?? user.avatarUrl,
      }}
      notificationCount={unread}
      courses={WHITE_COURSES.map((c) => ({
        id: c.id,
        title: c.title,
        onSelect: () =>
          navigate(
            shell((n) => {
              if (c.id === WHITE_FIRST_COURSE_ID) n.delete(WHITE_COURSE_PARAM)
              else n.set(WHITE_COURSE_PARAM, c.id)
            }),
          ),
      }))}
      links={{
        home,
        help: shell((n) => n.set('section', 'support')),
        allCourses: shell((n) => n.set('section', 'courses')),
        profile: shell((n) => n.set('section', 'profile')),
        notifications: shell((n) => n.set('section', 'notifications')),
        transcripts: shell((n) => n.set('section', 'transcripts')),
        purchases: shell((n) => n.set('section', 'purchases')),
      }}
      onNavigate={(href) => {
        navigate(href)
        // HOME ALSO STARTS THE DEMO CARDS OVER (2026-10-13, Eric's request),
        // as the slim header's Home does: WIP's and White's Homes reset
        // Progress, Readiness and the State Exam card on this event. The
        // logo links Home too, so it resets them as well.
        if (href === home) window.dispatchEvent(new Event(ATLAS_HOME_REFRESH))
      }}
      // No My Courses in the shell (2026-10-13, Eric's request): the course
      // card's tabs pick the course. The standalone preview keeps it.
      showCourses={false}
    />
  )
}
