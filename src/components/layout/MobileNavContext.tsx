import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Shared open/close state for the mobile nav menu (the hamburger drawer).
 *
 * The hamburger button lives in the top `Header` (rendered by `AppLayout`)
 * while the drawer itself is rendered by the `PlatformMobileShell` (which owns
 * the rail's `active` / `onSelect` state). This tiny context is the bridge —
 * mounted above both in `AppLayout` — so the header can open the menu and the
 * shell can render + close it.
 *
 * `useMobileNav` returns a safe no-op default outside the provider (mirroring
 * `useDeviceFrame` / `useTheme`), so components never crash when unit-mounted.
 */
type MobileNavState = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DEFAULT_STATE: MobileNavState = { open: false, setOpen: () => {} }

const MobileNavContext = createContext<MobileNavState | null>(null)

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const value = useMemo<MobileNavState>(() => ({ open, setOpen }), [open])
  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>
}

export function useMobileNav(): MobileNavState {
  return useContext(MobileNavContext) ?? DEFAULT_STATE
}
