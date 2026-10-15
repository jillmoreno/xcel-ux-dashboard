/**
 * "Oct 14, 8:47 PM" from an ISO timestamp, in the viewer's own zone — the
 * stamp is UTC, and a reviewer reads a clock, not an offset. Shared by the
 * gateway's Prototypes rows (`lastUpdated`) and the Refinement board
 * (`updatedAt`), so the two never drift into different spellings of the same
 * moment. An unparseable value comes back as given rather than as "Invalid
 * Date".
 */
export function formatUpdated(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}
