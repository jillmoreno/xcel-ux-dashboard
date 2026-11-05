/**
 * Types for the On Stage card plugin.
 *
 * ⚠ THE PLUGIN IS PLAIN JAVASCRIPT ON PURPOSE. Netlify loads a local build
 * plugin as-is — there is no compile step in front of it — so a `.ts` file
 * would be a plugin that throws on the first `import`. This declaration is
 * what lets `StageCard.test.ts` import it without `tsc -b` (the actual deploy
 * gate) failing on an untyped module.
 */
export type StageCardRecord = {
  id: string
  title: string
  note: string
  column: string
  owner: string
  position: number
  addedDate: string
  archived: boolean
  archivedAt: string
  archivedBy: string
  scope: string
  updatedAt: string
}

export function scopesFor(paths: string[]): string[]

export function cardRecord(input: {
  id: string
  scope: string
  title: string
  note: string
  position: number
  addedDate?: string
  owner?: string
}): StageCardRecord

export function existingCard<T extends { column?: unknown; scope?: unknown; archived?: unknown }>(
  cards: T[],
  scope: string,
): T | null

export function onSuccess(args: {
  utils: { status: { show: (o: { title?: string; summary?: string; text?: string }) => void } }
}): Promise<void>
