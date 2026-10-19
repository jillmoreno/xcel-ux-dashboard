import { useCallback, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { ADMIN_LEARNERS, type Learner } from '@/data/xcelAdmin/learners'
import { ADMIN_INVITES, type Invite } from '@/data/xcelAdmin/invites'
import { AdminStoreContext, type AdminStore, type AdminTouch, type ProgressReportSettings } from './adminStore'
import { XcelAdminComingSoon, XcelAdminLayout } from './XcelAdminLayout'
import { XcelAdminStudentsPage } from './XcelAdminStudentsPage'
import { XcelAdminRecruitPage } from './XcelAdminRecruitPage'
import { XcelAdminInvitesPage } from './XcelAdminInvitesPage'
import { XcelAdminReportsPage } from './XcelAdminReportsPage'
import { XcelAdminNotificationsPage } from './XcelAdminNotificationsPage'

/**
 * XCEL ADMIN — the app (2026-10-19, feat/XCEL-admin). The admin surface
 * rebuilt in React from colibri-b2b.vercel.app, mounted at `/xcel-admin/*`
 * behind the `xcel-admin` flag (on by default on Eric's branch; the Admin
 * row on Prototypes is Cody's scope, so whether it becomes that row is his
 * call). One store for the session, one shell, and the pages under it —
 * built in the reference's sidebar order, Students first.
 */
export function XcelAdminApp() {
  const enabled = useFeatureFlag('xcel-admin').enabled
  const [learners, setLearners] = useState<Learner[]>(() => [...ADMIN_LEARNERS])
  const [touches, setTouches] = useState<AdminTouch[]>([])
  const [invites, setInvites] = useState<Invite[]>(() => [...ADMIN_INVITES])
  const [progressReport, setPR] = useState<ProgressReportSettings>({
    active: true,
    day: 'Mondays',
    time: '7am',
    people: ['coleen.acker@example.com', 'adam.neal@example.com'],
  })
  const setProgressReport = useCallback((patch: Partial<ProgressReportSettings>) => setPR((p) => ({ ...p, ...patch })), [])
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])
  const addInvites = useCallback<AdminStore['addInvites']>((list) => {
    const now = Date.now()
    setInvites((prev) => [
      ...list.map<Invite>((inv, i) => ({
        id: `inv-new-${now}-${i}`,
        name: inv.name,
        email: inv.email,
        status: 'sent',
        sentHoursAgo: 0,
        lastStepHoursAgo: 0,
        method: inv.via === 'qr' ? 'QR code' : inv.via === 'link' ? 'Link' : 'Email',
        department: inv.department,
        learnerId: null,
      })),
      ...prev,
    ])
  }, [])
  const resendInvite = useCallback((id: string) => {
    setInvites((prev) => {
      const hit = prev.find((i) => i.id === id)
      if (!hit) return prev
      return [{ ...hit, sentHoursAgo: 0, lastStepHoursAgo: 0, status: 'sent' }, ...prev.filter((i) => i.id !== id)]
    })
  }, [])
  const updateLearner = useCallback<AdminStore['updateLearner']>((id, patch) => {
    setLearners((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [])
  const addTouch = useCallback<AdminStore['addTouch']>((t) => {
    const at = new Date().toISOString()
    setTouches((prev) => [{ ...t, id: `${at}-${prev.length}`, at }, ...prev])
  }, [])
  const store = useMemo<AdminStore>(
    () => ({ learners, updateLearner, touches, addTouch, invites, addInvites, resendInvite, progressReport, setProgressReport, toast, showToast }),
    [learners, updateLearner, touches, addTouch, invites, addInvites, resendInvite, progressReport, setProgressReport, toast, showToast],
  )

  if (!enabled) {
    return (
      <div style={{ padding: 48, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
        XCEL Admin is off. Turn on the “XCEL Admin” flag to see it.
      </div>
    )
  }

  return (
    <AdminStoreContext.Provider value={store}>
      <Routes>
        <Route element={<XcelAdminLayout />}>
          <Route index element={<Navigate to={`students${window.location.search}`} replace />} />
          <Route path="students" element={<XcelAdminStudentsPage />} />
          <Route path="students/recruit/:recruitId" element={<XcelAdminRecruitPage />} />
          <Route path="invites" element={<XcelAdminInvitesPage />} />
          <Route path="reports" element={<XcelAdminReportsPage />} />
          <Route path="notifications/*" element={<XcelAdminNotificationsPage />} />
          <Route path="resources" element={<XcelAdminComingSoon />} />
          <Route path="settings" element={<XcelAdminComingSoon />} />
          <Route path="*" element={<XcelAdminComingSoon>Not built yet.</XcelAdminComingSoon>} />
        </Route>
      </Routes>
    </AdminStoreContext.Provider>
  )
}
