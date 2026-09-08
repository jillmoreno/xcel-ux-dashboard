import { useState, type CSSProperties, type ReactNode } from 'react'

/**
 * Shared drag-and-drop wrapper used by every dashboard version (V1 / V2 /
 * V3) to make top-level widgets reorderable when the
 * `dashboard-drag-and-drop` feature flag is on.
 *
 * Plain passthrough when `draggable` is false — zero overhead in the
 * default off state. Native HTML5 drag-and-drop (no library dependency)
 * since this is a UI/UX demo, not a production reorder.
 */
export function DraggableSlot({
  id,
  draggable,
  onReorder,
  style,
  children,
}: {
  id: string
  draggable: boolean
  onReorder: (draggedId: string, targetId: string) => void
  /** Extra style for the slot wrapper — e.g. a `gridColumn` span so the
   *  slot can sit in a multi-column grid. Ignored in the non-draggable
   *  passthrough (no wrapper element is rendered then). */
  style?: CSSProperties
  children: ReactNode
}) {
  const [dragOver, setDragOver] = useState(false)
  if (!draggable) return <>{children}</>
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', id)
        e.dataTransfer.effectAllowed = 'move'
        // Slight delay so the browser captures the un-dimmed snapshot
        // for the drag image; the dim shows immediately after.
        const target = e.currentTarget
        requestAnimationFrame(() => {
          target.style.opacity = '0.4'
        })
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1'
        setDragOver(false)
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('text/plain')) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          if (!dragOver) setDragOver(true)
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        const draggedId = e.dataTransfer.getData('text/plain')
        setDragOver(false)
        if (draggedId && draggedId !== id) onReorder(draggedId, id)
      }}
      style={{
        cursor: 'grab',
        // Snap-to-grid indicator: dashed outline on the drop target as
        // the dragged widget hovers over it. Outline (not border) so the
        // child's layout doesn't shift by 2px.
        outline: dragOver ? '2px dashed var(--color-action)' : undefined,
        outlineOffset: 4,
        borderRadius: 'var(--radius-md)',
        transition: 'outline-color 120ms ease',
        // Stretch the wrapper so a grid-cell child fills its slot height
        // and any `gridColumn` span passed in takes effect.
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Reorder helper — pull `draggedId` out of the array and insert it at
 * the position of `targetId`. Returns the same array reference when
 * either id is missing or already in the target slot (no-op safe).
 */
export function moveItem(
  arr: string[],
  draggedId: string,
  targetId: string,
): string[] {
  if (draggedId === targetId) return arr
  const fromIdx = arr.indexOf(draggedId)
  const toIdx = arr.indexOf(targetId)
  if (fromIdx === -1 || toIdx === -1) return arr
  const next = [...arr]
  next.splice(fromIdx, 1)
  next.splice(toIdx, 0, draggedId)
  return next
}

/**
 * Cross-column reorder helper. Given two arrays and the dragged + target
 * ids, figure out which array each lives in and:
 *   - same array → reorder via {@link moveItem}.
 *   - different arrays → remove `draggedId` from its source array, insert
 *     it at the position of `targetId` in the target array.
 * Returns the next state of both arrays (`[a, b]`). Either or both may be
 * referentially equal to the inputs if no change applies.
 */
export function moveBetween(
  a: string[],
  b: string[],
  draggedId: string,
  targetId: string,
): [string[], string[]] {
  if (draggedId === targetId) return [a, b]
  const aHasDragged = a.includes(draggedId)
  const aHasTarget = a.includes(targetId)
  const bHasDragged = b.includes(draggedId)
  const bHasTarget = b.includes(targetId)
  if (aHasDragged && aHasTarget) return [moveItem(a, draggedId, targetId), b]
  if (bHasDragged && bHasTarget) return [a, moveItem(b, draggedId, targetId)]
  if (aHasDragged && bHasTarget) {
    const nextA = a.filter((id) => id !== draggedId)
    const targetIdx = b.indexOf(targetId)
    const nextB = [...b]
    nextB.splice(targetIdx, 0, draggedId)
    return [nextA, nextB]
  }
  if (bHasDragged && aHasTarget) {
    const nextB = b.filter((id) => id !== draggedId)
    const targetIdx = a.indexOf(targetId)
    const nextA = [...a]
    nextA.splice(targetIdx, 0, draggedId)
    return [nextA, nextB]
  }
  return [a, b]
}
