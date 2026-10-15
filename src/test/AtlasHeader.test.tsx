import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AtlasHeader } from '@/components/layout/AtlasHeader'

/**
 * ATLAS HEADER (2026-10-13) — the standalone header at `/atlas-header-preview`.
 * Pins the dropdown contract from the handoff: click toggles, outside click
 * and Escape close, Escape returns focus, the triggers report their state,
 * and the identity block falls back to initials.
 */
afterEach(cleanup)

const renderHeader = (photoUrl?: string) =>
  render(
    <AtlasHeader
      user={{ name: 'Alicia Navarro', email: 'alicia.navarro@gmail.com', photoUrl }}
      notificationCount={3}
      courses={[
        { id: 'a', title: 'Course A' },
        { id: 'b', title: 'Course B' },
      ]}
    />,
  )

describe('AtlasHeader', () => {
  it('marks Home current and names the logo and bell', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'XCEL Insurance Training by Colibri — home' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Notifications, 3 unread' })).toBeTruthy()
  })

  it('opens My Courses on click, closes on a second click and on an outside click', () => {
    renderHeader()
    const trigger = screen.getByRole('button', { name: 'My Courses' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger, { detail: 1 })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('menuitem', { name: 'Course A' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'View all courses' })).toBeTruthy()
    fireEvent.click(trigger, { detail: 1 })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger, { detail: 1 })
    fireEvent.mouseDown(document.body)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('Escape closes the menu and returns focus to the trigger', () => {
    renderHeader()
    const trigger = screen.getByRole('button', { name: 'Account menu for Alicia Navarro' })
    fireEvent.click(trigger, { detail: 0 }) // keyboard activation
    const first = screen.getByRole('menuitem', { name: 'Profile' })
    expect(document.activeElement).toBe(first)
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Notifications' }))
    fireEvent.keyDown(document.activeElement as Element, { key: 'End' })
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Logout' }))
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })

  it('shows initials without a photo and the photo when there is one', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Account menu for Alicia Navarro' }), { detail: 1 })
    expect(screen.getByText('AN')).toBeTruthy()
    cleanup()
    const { container } = renderHeader('/photo.jpg')
    fireEvent.click(screen.getByRole('button', { name: 'Account menu for Alicia Navarro' }), { detail: 1 })
    expect(screen.queryByText('AN')).toBeNull()
    expect(container.querySelector('img[src="/photo.jpg"]')).toBeTruthy()
  })
})
