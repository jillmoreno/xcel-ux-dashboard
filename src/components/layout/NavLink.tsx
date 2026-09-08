import { NavLink as RouterNavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

export function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) => `cre-nav-pill${isActive ? ' is-active' : ''}`}
    >
      {children}
    </RouterNavLink>
  )
}
