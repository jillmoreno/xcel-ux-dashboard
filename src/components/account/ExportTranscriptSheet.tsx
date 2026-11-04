import { useState, type CSSProperties } from 'react'
import { ArrowLeft, FileText } from '@/icons'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Sheet } from '@/components/ui/Sheet'
import {
  formatTranscriptDate,
  groupLabel,
  type TranscriptGroup,
} from '@/data/transcriptFixtures'

/**
 * EXPORT TRANSCRIPT — the pick-list, 2026-11-02 (Jillienne: "if a user has
 * multiple professions or states, then they will need to select which
 * transcript to download").
 *
 * ⚠ IT ONLY EXISTS WHEN THERE IS A CHOICE. A learner with one profession in
 * one state has exactly one transcript, and asking them which of their one
 * transcript they meant is a dialog that can only ever be dismissed. The
 * Transcripts page checks the group count and opens the print view directly in
 * that case — see `TranscriptsPanel`. This component assumes more than one.
 *
 * ⚠ MULTI-SELECT, NOT SINGLE. The design draws the rows with circular controls,
 * which read as radios, but it also has "Select All" and a live "N Selected"
 * count — both meaningless against a radio group. So these are checkboxes: a
 * learner renewing two state licences at once wants both sheets, and the
 * control the design actually describes is the one that allows it.
 *
 * ⚠ AND NOTHING IS SELECTED ON OPEN, matching the design's "0 Selected". The
 * tempting default is everything, since the button that opened this says
 * Download — but a transcript is a compliance document, and a learner who
 * clicks straight through to Export should not accidentally send a board three
 * sheets covering professions it has no business seeing. Export stays disabled
 * until they choose.
 */
export function ExportTranscriptSheet({
  open,
  onClose,
  groups,
  onExport,
}: {
  open: boolean
  onClose: () => void
  /** More than one, always — see the warning above. */
  groups: readonly TranscriptGroup[]
  /** The chosen group keys, in the order the sheet lists them. */
  onExport: (keys: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>([])

  /*
   * REOPENING STARTS CLEAN. Without this, a learner who ticked Texas, thought
   * better of it and closed would find Texas still ticked next time — a stale
   * choice they did not make, on a document they are about to hand to someone.
   *
   * ⚠ ADJUSTED DURING RENDER, NOT IN AN EFFECT — React's documented pattern for
   * "reset some state when a prop changes", and the same shape
   * `CourseDetailsPanel` uses to send its sheet back to the hub view. An effect
   * would paint the stale selection for one frame first, and
   * `react-hooks/set-state-in-effect` rejects it.
   */
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (!open) setSelected([])
  }

  const allSelected = selected.length === groups.length
  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  return (
    <Sheet open={open} onClose={onClose} title="Export Transcript" width={480}>
      <div style={bodyStyle}>
        <button type="button" onClick={onClose} className="cre-link-action" style={backStyle}>
          <ArrowLeft size={16} aria-hidden />
          Back
        </button>
        <h2 style={headingStyle}>Download</h2>

        {/* The notice (the design's icon + two lines): how many there are, and
            that a choice is required. It states the count rather than the page
            doing so, because the count IS the reason this sheet opened. */}
        <div style={noticeStyle}>
          <span aria-hidden style={noticeIconStyle}>
            <FileText size={18} aria-hidden />
          </span>
          <div>
            <p style={noticeTitleStyle}>
              {groups.length} Transcript{groups.length === 1 ? '' : 's'} Available.
            </p>
            <p style={noticeBodyStyle}>Please select a transcript to download.</p>
          </div>
        </div>

        <div style={selectRowStyle}>
          <button
            type="button"
            className="cre-link-action"
            style={selectAllStyle}
            onClick={() => setSelected(allSelected ? [] : groups.map((g) => g.key))}
          >
            {/* The label says what pressing it DOES, so it does not read as a
                claim about the current state. */}
            {allSelected ? 'Clear All' : 'Select All'}
          </button>
          <span style={countStyle} aria-live="polite">
            {selected.length} Selected
          </span>
        </div>

        <ul style={listStyle}>
          {groups.map((group) => (
            <li key={group.key} style={selected.includes(group.key) ? { ...rowStyle, ...rowOnStyle } : rowStyle}>
              <Checkbox
                checked={selected.includes(group.key)}
                onChange={() => toggle(group.key)}
                value={group.key}
                label={
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={rowTitleStyle}>{groupLabel(group)}</span>
                    {/* What the design puts here is the licence's expiry and
                        progress; there are no licence records in this prototype
                        to read them from, so the row says what it can actually
                        stand behind. See `transcriptGroups`. */}
                    <span style={rowMetaStyle}>
                      {group.courses} course{group.courses === 1 ? '' : 's'} ·{' '}
                      {formatTranscriptDate(group.firstCompleted)} –{' '}
                      {formatTranscriptDate(group.lastCompleted)}
                    </span>
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      </div>

      {/* The footer pins to the bottom, as the design has it — the list above
          scrolls when a learner has more licences than fit. */}
      <div style={footerStyle}>
        <Button onClick={() => onExport(selected)} disabled={selected.length === 0}>
          Export
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Nevermind
        </Button>
      </div>
    </Sheet>
  )
}

const bodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '24px 28px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const backStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-action)',
}

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const noticeStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-neutral-75)',
}

const noticeIconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  flexShrink: 0,
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
}

const noticeTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const noticeBodyStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const selectRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  paddingBottom: 8,
  borderBottom: '1px solid var(--color-border-subtle)',
}

const selectAllStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-action)',
}

const countStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const rowStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
}

/* A selected row takes the action colour's own tint, so the choice is legible
   without relying on the checkbox alone. */
const rowOnStyle: CSSProperties = {
  borderColor: 'var(--color-primary-300)',
  background: 'var(--color-primary-100)',
}

const rowTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const rowMetaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}

const footerStyle: CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  gap: 12,
  padding: '16px 28px',
  borderTop: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
}
