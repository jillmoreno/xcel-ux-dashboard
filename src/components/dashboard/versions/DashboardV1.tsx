import { useState, type ReactNode } from 'react'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { DraggableSlot, moveBetween } from '@/components/dashboard/DraggableSlot'
import { DashboardHeroBand } from '@/components/dashboard/DashboardHeroBand'
import { ContinueLearningTabs } from '@/components/dashboard/ContinueLearningTabs'
import { SidebarCard } from '@/components/dashboard/SidebarCard'
import { SIDEBAR_CARDS } from '@/data/dashboardFixtures'

export function DashboardV1() {
  const { membership } = useAccount()
  const sidebar = SIDEBAR_CARDS.filter((c) => !(c.hideForMember && membership === 'member'))
  const dragEnabled = useFeatureFlag('dashboard-drag-and-drop').enabled

  // Widget registries — id → JSX. Order arrays below drive what shows on
  // screen and in what slot. When the drag-and-drop flag is on, each slot
  // becomes draggable via `<DraggableSlot>` and the user can reorder
  // within a column.
  const mainWidgets: Record<string, ReactNode> = {
    'hero-band': <DashboardHeroBand />,
    'continue-learning': <ContinueLearningTabs />,
  }
  const sidebarWidgets: Record<string, ReactNode> = Object.fromEntries(
    sidebar.map((card) => [`sidebar-card:${card.id}`, <SidebarCard data={card} />]),
  )

  const [mainOrder, setMainOrder] = useState<string[]>(() =>
    Object.keys(mainWidgets),
  )
  const [sidebarOrder, setSidebarOrder] = useState<string[]>(() =>
    Object.keys(sidebarWidgets),
  )

  // Sync order arrays with the latest widget keys — append new entries
  // (e.g. fixture-driven sidebar additions) and drop stale ones without
  // disturbing the user's existing ordering.
  const mainKeys = Object.keys(mainWidgets)
  const sidebarKeys = Object.keys(sidebarWidgets)
  if (
    mainOrder.some((id) => !mainKeys.includes(id)) ||
    mainKeys.some((id) => !mainOrder.includes(id))
  ) {
    const next = [
      ...mainOrder.filter((id) => mainKeys.includes(id)),
      ...mainKeys.filter((id) => !mainOrder.includes(id)),
    ]
    if (next.length !== mainOrder.length || next.some((id, i) => id !== mainOrder[i])) {
      setMainOrder(next)
    }
  }
  if (
    sidebarOrder.some((id) => !sidebarKeys.includes(id)) ||
    sidebarKeys.some((id) => !sidebarOrder.includes(id))
  ) {
    const next = [
      ...sidebarOrder.filter((id) => sidebarKeys.includes(id)),
      ...sidebarKeys.filter((id) => !sidebarOrder.includes(id)),
    ]
    if (next.length !== sidebarOrder.length || next.some((id, i) => id !== sidebarOrder[i])) {
      setSidebarOrder(next)
    }
  }

  // Unified handler — supports both within-column reorders AND
  // cross-column moves (main ↔ sidebar).
  const handleReorder = (draggedId: string, targetId: string) => {
    const [nextMain, nextSidebar] = moveBetween(
      mainOrder,
      sidebarOrder,
      draggedId,
      targetId,
    )
    if (nextMain !== mainOrder) setMainOrder(nextMain)
    if (nextSidebar !== sidebarOrder) setSidebarOrder(nextSidebar)
  }
  const widgetFor = (id: string): ReactNode =>
    mainWidgets[id] ?? sidebarWidgets[id] ?? null

  return (
    <div
      className="mx-auto"
      style={{
        maxWidth: 1440,
        padding: '24px 24px 64px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 40,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          {mainOrder.map((id) => {
            const node = widgetFor(id)
            if (!node) return null
            return (
              <DraggableSlot
                key={id}
                id={id}
                draggable={dragEnabled}
                onReorder={handleReorder}
              >
                {node}
              </DraggableSlot>
            )
          })}
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 32, minWidth: 0 }}>
          {sidebarOrder.map((id) => {
            const node = widgetFor(id)
            if (!node) return null
            return (
              <DraggableSlot
                key={id}
                id={id}
                draggable={dragEnabled}
                onReorder={handleReorder}
              >
                {node}
              </DraggableSlot>
            )
          })}
        </aside>
      </div>
    </div>
  )
}
