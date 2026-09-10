import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  defaultNotificationPrefs,
  notificationsFor,
  unreadCount,
  visibleNotifications,
  type Notification,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationPrefs,
  type NotificationState,
} from '@/data/notificationsFixtures'

/**
 * Read state for the notification centre, lifted so its TWO surfaces cannot
 * disagree:
 *
 *   1. [`NotificationsMenu`](../components/notifications/NotificationsMenu.tsx)
 *      — the header bell's panel.
 *   2. [`NotificationsPanel`](../components/notifications/NotificationsPanel.tsx)
 *      — the full list at `?section=notifications`.
 *
 * It started as `useState` inside the bell, which was fine while the bell was
 * the only surface. The moment "View all" opened a second one, that state
 * became a fork: clear a notification in the bell, open the page, and it is
 * unread again — with the badge already down, so the two actively contradict
 * each other. Same class of drift `useCeStudyPlanEnabled` exists to prevent
 * between the Jump Back In card and the Study Plan page.
 *
 * **Deliberately not persisted.** A demo that remembers you cleared the badge
 * shows an empty bell to the next reviewer, with nothing in the repo to
 * explain it — the same trap `cgp.featureFlags.customDefaults` sets for the
 * demo rail. Read state resets on reload, and on a change of demo state, so
 * the control actually re-demos.
 */
type NotificationsValue = {
  /** The feed AS FILTERED by the in-app preferences — what both surfaces show. */
  items: Notification[]
  unread: number
  markRead: (id: string) => void
  markAllRead: () => void
  prefs: NotificationPrefs
  setPref: (
    category: NotificationCategory,
    channel: NotificationChannel,
    on: boolean,
  ) => void
  /** How many categories are muted in-app — the sheet's entry point shows it,
   *  so a learner can tell the list is filtered without opening the sheet. A
   *  filtered list that looks identical to an unfiltered one is how "where did
   *  my notification go" happens. */
  mutedCount: number
}

const Ctx = createContext<NotificationsValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { brand } = useAccount()
  const state = (useFeatureFlag('notification-state').variant ??
    'unread') as NotificationState
  const seed = useMemo(() => notificationsFor(brand, state), [brand, state])

  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  useEffect(() => setReadIds(new Set()), [state])

  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs)
  // Read through a ref in `markAllRead` so that callback keeps a stable
  // identity — it is passed to two surfaces, and a new function on every
  // preference change would re-render both for nothing.
  const prefsRef = useRef(prefs)
  useEffect(() => {
    prefsRef.current = prefs
  }, [prefs])

  const setPref = useCallback(
    (category: NotificationCategory, channel: NotificationChannel, on: boolean) => {
      setPrefs((prev) => ({ ...prev, [category]: { ...prev[category], [channel]: on } }))
    },
    [],
  )

  // Read state is applied BEFORE the preference filter, so muting a category
  // cannot silently mark its notifications read — unmuting brings them back
  // exactly as they were. The unread count then follows the visible list,
  // because a badge counting things the learner has chosen not to see is a
  // badge that cannot be cleared.
  const items = useMemo(() => {
    const withRead = seed.map((n) => (readIds.has(n.id) ? { ...n, read: true } : n))
    return visibleNotifications(withRead, prefs)
  }, [seed, readIds, prefs])

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  // Clears only what is on screen. "Mark all read" beside a filtered list
  // that silently also cleared the hidden ones would make unmuting a category
  // reveal notifications already marked read — read by a click the learner
  // could not have known applied to them.
  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev)
      for (const n of visibleNotifications(seed, prefsRef.current)) next.add(n.id)
      return next
    })
  }, [seed])

  const mutedCount = useMemo(
    () => Object.values(prefs).filter((c) => !c['in-app']).length,
    [prefs],
  )

  const value = useMemo(
    () => ({
      items,
      unread: unreadCount(items),
      markRead,
      markAllRead,
      prefs,
      setPref,
      mutedCount,
    }),
    [items, markRead, markAllRead, prefs, setPref, mutedCount],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useNotifications(): NotificationsValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useNotifications must be used within a NotificationsProvider')
  return v
}
