import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  notificationsFor,
  unreadCount,
  type Notification,
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
  items: Notification[]
  unread: number
  markRead: (id: string) => void
  markAllRead: () => void
}

const Ctx = createContext<NotificationsValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { brand } = useAccount()
  const state = (useFeatureFlag('notification-state').variant ??
    'unread') as NotificationState
  const seed = useMemo(() => notificationsFor(brand, state), [brand, state])

  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  useEffect(() => setReadIds(new Set()), [state])

  const items = useMemo(
    () => seed.map((n) => (readIds.has(n.id) ? { ...n, read: true } : n)),
    [seed, readIds],
  )

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  const markAllRead = useCallback(() => {
    setReadIds(new Set(seed.map((n) => n.id)))
  }, [seed])

  const value = useMemo(
    () => ({ items, unread: unreadCount(items), markRead, markAllRead }),
    [items, markRead, markAllRead],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useNotifications(): NotificationsValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useNotifications must be used within a NotificationsProvider')
  return v
}
