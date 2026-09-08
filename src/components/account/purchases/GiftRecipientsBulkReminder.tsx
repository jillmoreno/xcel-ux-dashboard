import { useMemo, useState, type CSSProperties } from 'react'
import { Check, Envelope } from '@/icons'
import { Button } from '@/components/ui/Button'
import type { GiftRecipientRecord } from '@/data/giftRecipientsFixtures'

/**
 * ARCHIVED (2026-08-21) — the Gift Recipients **bulk reminder** flow.
 *
 * UNREFERENCED on purpose: nothing imports this file. It's kept intact so
 * restoring the flow is a re-wire rather than a rebuild — see the
 * `gift-recipients-bulk-reminder` row in `src/data/archivedItems.ts`.
 *
 * What it was: on the roster arm (Option B), selection was a MODE, not
 * always-on. At rest the table had no checkbox column; the panel's top-right
 * "Send Reminder" CTA started the flow — it flipped the status filter to
 * Unclaimed (so the manager saw the cohort before choosing), revealed a checkbox
 * on every unclaimed row, and showed the prompt bar below. Picking WAS the
 * confirm step, which is why there was no separate confirm dialog. Sending
 * stamped every selected row, cleared the selection and exited the mode; Cancel
 * backed out.
 *
 * Why it went: reminders are back to one-at-a-time (the row's "Send Reminder"
 * link and the detail sheet's), matching the user story's "just a history +
 * reminder" scope. The two questions the flow couldn't answer are still open and
 * would need settling before it returns:
 *   • a reminder COOLDOWN — with none, select-all re-emails people chased
 *     minutes ago, and select-all would need to skip (and visibly explain
 *     skipping) rows inside the window;
 *   • whether a bulk send also wants an explicit "Send to N recipients?" dialog
 *     on top of the pick-then-send step.
 *
 * To restore: give `GiftRecipientsTable` back its `selectMode` /
 * `onExitSelectMode` props, hold `selectMode` in `GiftRecipientsPanel` again
 * with a top-right CTA calling `startReminderFlow()` (set `?status=unclaimed`,
 * then `setSelectMode(true)`), and render `<BulkReminderBar>` above the table
 * plus a `<SelectBox>` cell per unclaimed row (a 48px leading `<col>` in the
 * table's colgroup, and the first data column drops its 24px paddingLeft while
 * the mode is on). `useBulkSelection` holds the state; the send path is the
 * panel's existing `sendReminders(records[])`, so single and bulk sends stay on
 * one handler.
 */

/* eslint-disable react-refresh/only-export-components -- ARCHIVED module: the
   selection hook and its two components belong together as one restorable unit,
   and nothing imports this file, so Fast Refresh has nothing to preserve. */

/** Selection state for the archived flow. Only UNCLAIMED rows are selectable —
 *  a claimed recipient has nothing to chase — and select-all covers the
 *  unclaimed rows VISIBLE under the current filters, never a blanket "all". */
export function useBulkSelection(rows: GiftRecipientRecord[]) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const selectableIds = useMemo(
    () => rows.filter((r) => r.status === 'unclaimed').map((r) => r.id),
    [rows],
  )
  const selectedRecords = rows.filter((r) => selected[r.id])
  const allSelected = selectableIds.length > 0 && selectedRecords.length === selectableIds.length

  return {
    selected,
    selectedRecords,
    selectedCount: selectedRecords.length,
    selectableIds,
    allSelected,
    toggle: (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] })),
    toggleAll: () =>
      setSelected(allSelected ? {} : Object.fromEntries(selectableIds.map((id) => [id, true]))),
    clear: () => setSelected({}),
  }
}

/**
 * The prompt bar. Present for the whole MODE (not just once something is
 * ticked) so the step always explains itself and always has an exit; the send
 * button stays disabled until a row is picked.
 */
export function BulkReminderBar({
  selectedCount,
  onSend,
  onCancel,
}: {
  selectedCount: number
  onSend: () => void
  onCancel: () => void
}) {
  return (
    <div style={bulkBarStyle} role="group" aria-label="Send reminders to selected recipients">
      <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {selectedCount > 0 ? `${selectedCount} selected` : 'Select the recipients to remind'}
      </span>
      <Button variant="primary" size="sm" onClick={onSend} disabled={selectedCount === 0}>
        <Envelope size={14} aria-hidden />
        {selectedCount > 0 ? `Send reminder to ${selectedCount} selected` : 'Send reminder'}
      </Button>
      <button type="button" onClick={onCancel} style={clearSelectionStyle}>
        Cancel
      </button>
    </div>
  )
}

/**
 * Table-cell checkbox. A real `<input type="checkbox">` (visually hidden) with a
 * styled box — the shared `Checkbox` primitive always renders a visible text
 * label beside it, which a table cell can't use, so this reuses its treatment
 * with the label moved to `aria-label`.
 */
export function SelectBox({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <label style={{ display: 'inline-flex', cursor: disabled ? 'default' : 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
        className="cre-visually-hidden"
      />
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: 'var(--radius-sm)',
          background: checked ? 'var(--color-action)' : 'var(--color-surface-card)',
          border: `1.5px solid ${
            checked
              ? 'var(--color-action)'
              : disabled
                ? 'var(--color-neutral-light)'
                : 'var(--color-neutral-disabled)'
          }`,
          flexShrink: 0,
        }}
      >
        {checked && (
          <Check size={12} strokeWidth={3} aria-hidden style={{ color: 'var(--color-text-inverse)' }} />
        )}
      </span>
    </label>
  )
}

const bulkBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 16,
  marginBottom: 12,
  padding: '12px 16px',
  background: 'var(--color-primary-100)',
  border: '1px solid var(--color-primary-200)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
}

const clearSelectionStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-action)',
  textDecoration: 'underline',
  cursor: 'pointer',
}
