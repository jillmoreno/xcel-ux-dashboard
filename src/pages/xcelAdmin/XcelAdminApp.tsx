import { useCallback, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { AdminStoreContext, type AdminInvite, type AdminStore } from './adminStore'
import { XcelAdminComingSoon, XcelAdminLayout } from './XcelAdminLayout'
import { XcelAdminStudentsPage } from './XcelAdminStudentsPage'

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
  const [invites, setInvites] = useState<AdminInvite[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])
  const addInvites = useCallback<AdminStore['addInvites']>((list) => {
    const now = new Date().toISOString()
    setInvites((prev) => [...list.map((inv, i) => ({ ...inv, id: `${now}-${i}-${inv.email}`, sentAt: now })), ...prev])
  }, [])
  const store = useMemo<AdminStore>(() => ({ invites, addInvites, toast, showToast }), [invites, addInvites, toast, showToast])

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
          <Route path="students/recruit/:recruitId" element={<XcelAdminComingSoon>The learner’s record is next in the rebuild.</XcelAdminComingSoon>} />
          <Route path="invites" element={<XcelAdminComingSoon />} />
          <Route path="reports" element={<XcelAdminComingSoon />} />
          <Route path="notifications" element={<XcelAdminComingSoon />} />
          <Route path="resources" element={<XcelAdminComingSoon />} />
          <Route path="settings" element={<XcelAdminComingSoon />} />
          <Route path="*" element={<XcelAdminComingSoon>Not built yet.</XcelAdminComingSoon>} />
        </Route>
      </Routes>
    </AdminStoreContext.Provider>
  )
}
