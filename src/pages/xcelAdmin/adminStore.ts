import { createContext, useContext } from 'react'

/**
 * XCEL ADMIN — the session's shared state (2026-10-19). What one page does
 * that another page shows: an invite sent from Students lists on Invites;
 * a toast raised anywhere shows over the shell. In memory only — a reload
 * starts from the fixtures, which is what a demo wants.
 */

/** Where the admin app is mounted. */
export const ADMIN_BASE = '/xcel-admin'

export type AdminInvite = {
  id: string
  email: string
  name: string | null
  department: string
  lines: string[]
  tier: 'Standard' | 'Premier'
  note: string | null
  sentAt: string // ISO
  via: 'email' | 'link' | 'qr'
}

export type AdminStore = {
  invites: AdminInvite[]
  addInvites: (invites: Omit<AdminInvite, 'id' | 'sentAt'>[]) => void
  toast: string | null
  showToast: (message: string) => void
}

export const AdminStoreContext = createContext<AdminStore | null>(null)

export function useAdminStore(): AdminStore {
  const store = useContext(AdminStoreContext)
  if (!store) throw new Error('useAdminStore must be used inside XcelAdminApp')
  return store
}
