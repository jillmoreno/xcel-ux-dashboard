/**
 * QA capture store — the browser side of the upload endpoint.
 *
 * Captures are dropped onto the live page and stored server-side (Netlify Blobs,
 * via `netlify/functions/qa-captures.ts`), so whoever opens the link sees them.
 * That is the point: the page exists to hand findings to engineering, and a
 * screenshot living in the reviewer's own browser storage would not travel.
 *
 * Two states this module is careful about:
 *
 * - **No backend.** Plain `vite dev` serves no functions, so every call here
 *   fails. That is a normal local state, not an error: `listCaptures` reports
 *   `available: false` and the UI falls back to the committed files in
 *   `public/qa/` with the drop affordances hidden. Run `netlify dev` to get the
 *   endpoint locally.
 * - **Committed vs dropped.** A slot can have a file committed at
 *   `screens[].src` AND an uploaded blob. The upload wins, and removing it falls
 *   back to the committed file rather than to nothing — so a drop is always
 *   reversible and can never destroy something that is in git.
 */

const BASE = '/api/qa-captures'

/** Longest edge kept when a capture has to be resized. A screenshot wider than
 *  this is a retina full-screen grab; the panel shows it at 240px and the
 *  lightbox at natural size, so past ~1600 nobody sees the extra pixels. */
const MAX_EDGE = 1600

/** Must stay under the function's own `MAX_BYTES`. Anything larger is resized
 *  before it is sent rather than rejected at the door. */
const MAX_UPLOAD_BYTES = 4_000_000

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

/** The named pair. These two drive the comparison on the list card, which is why
 *  they stay fixed slots rather than becoming tags on a general set of images. */
export type CaptureLabel = 'Expected' | 'Actual'

/**
 * How many context images a finding can carry.
 *
 * Capped and indexed rather than free-form because the bounded key namespace is
 * this endpoint's only real access control — see the note at the top of
 * `netlify/functions/qa-captures.ts`. Must match the `[1-6]` in its KEY_PATTERN.
 */
export const MAX_CONTEXT = 6

export type QaCapture = {
  key: string
  contentType: string
  size: number
  /** ISO 8601, written server-side. Doubles as the cache-busting version — the
   *  etag is not used for this because the Blobs backend does not always
   *  surface one. */
  uploadedAt: string
  etag?: string
}

export type CaptureIndex = {
  /** False when there is no endpoint to talk to (plain `vite dev`, or a deploy
   *  where the function is missing). The UI hides its drop targets rather than
   *  offering an action that cannot work. */
  available: boolean
  byKey: Map<string, QaCapture>
}

export const EMPTY_INDEX: CaptureIndex = { available: false, byKey: new Map() }

/**
 * The blob key for one slot: `qa-013-actual`.
 *
 * Mirrors the function's `KEY_PATTERN` exactly. That pattern is the feature's
 * main safety property — it is what stops an open endpoint from becoming a
 * general file host — so it must not drift from this. There is no
 * caller-supplied filename anywhere in the path.
 */
export function captureKey(noteId: string, label: CaptureLabel): string {
  return `${noteId.toLowerCase()}-${label.toLowerCase()}`
}

/**
 * `qa-013-context-2`. Context images are supporting material — unordered, and not
 * part of the Expected/Actual comparison — so they get their own numbered keys
 * rather than crowding the pair.
 */
export function contextKey(noteId: string, index: number): string {
  return `${noteId.toLowerCase()}-context-${index}`
}

/** A finding's context images, in index order. Holes are normal: deleting one
 *  leaves its index free rather than renaming the others, because renaming a blob
 *  means copy-then-delete and a half-failed rename loses an image. */
export function contextCapturesFor(
  index: CaptureIndex,
  noteId: string,
): { index: number; capture: QaCapture }[] {
  const out: { index: number; capture: QaCapture }[] = []
  for (let i = 1; i <= MAX_CONTEXT; i += 1) {
    const found = index.byKey.get(contextKey(noteId, i))
    if (found) out.push({ index: i, capture: found })
  }
  return out
}

/** The free context indices, lowest first — what a batch of new files is assigned
 *  to. Shorter than the batch when the finding is near the cap; the caller reports
 *  what did not fit rather than silently dropping it. */
export function freeContextIndices(index: CaptureIndex, noteId: string): number[] {
  const free: number[] = []
  for (let i = 1; i <= MAX_CONTEXT; i += 1) {
    if (!index.byKey.get(contextKey(noteId, i))) free.push(i)
  }
  return free
}

/** The URL to render, versioned so a replaced capture is never served stale. */
export function captureUrl(capture: QaCapture): string {
  const v = capture.uploadedAt || capture.etag || 'v0'
  return `${BASE}/${encodeURIComponent(capture.key)}?v=${encodeURIComponent(v)}`
}

export async function listCaptures(): Promise<CaptureIndex> {
  try {
    const res = await fetch(BASE, { headers: { accept: 'application/json' } })
    if (!res.ok) return EMPTY_INDEX
    // A misrouted request returns index.html with a 200, which would throw here
    // rather than reporting "no backend". Check the type before parsing.
    const type = res.headers.get('content-type') ?? ''
    if (!type.includes('application/json')) return EMPTY_INDEX
    const body = (await res.json()) as { captures?: QaCapture[] }
    const byKey = new Map<string, QaCapture>()
    for (const c of body.captures ?? []) byKey.set(c.key, c)
    return { available: true, byKey }
  } catch {
    return EMPTY_INDEX
  }
}

/** Thrown message is shown to the reviewer verbatim, so it has to read as an
 *  explanation rather than a status code. */
async function failure(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    return body.error ?? fallback
  } catch {
    return fallback
  }
}

/**
 * Resize only when the file is too big to send or too large to be worth sending,
 * and re-encode as PNG when we do.
 *
 * PNG rather than WebP deliberately: these captures are the evidence for
 * findings about 1px borders and exact colour values, and lossy re-encoding is
 * exactly the wrong thing to do to that. WebP is the fallback only when a
 * downscaled PNG still will not fit, where some softening beats no capture.
 *
 * A file that is already small enough and small enough on screen is uploaded
 * BYTE-FOR-BYTE — no canvas round trip — because canvas PNG output is
 * unoptimised and routinely comes out larger than the original.
 */
async function prepare(file: File): Promise<Blob> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`${file.type || 'That file'} is not an image we can store.`)
  }
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) {
    // Undecodable here but the right type — let the server judge it.
    if (file.size <= MAX_UPLOAD_BYTES) return file
    throw new Error('That image could not be read.')
  }
  const longest = Math.max(bitmap.width, bitmap.height)
  const needsResize = longest > MAX_EDGE || file.size > MAX_UPLOAD_BYTES
  if (!needsResize) {
    bitmap.close()
    return file
  }
  const scale = Math.min(1, MAX_EDGE / longest)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('This browser could not resize the image.')
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const asPng = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
  if (asPng && asPng.size <= MAX_UPLOAD_BYTES) return asPng
  const asWebp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.9))
  if (asWebp && asWebp.size <= MAX_UPLOAD_BYTES) return asWebp
  throw new Error('That image is too large to store, even resized.')
}

export async function uploadCapture(key: string, file: File): Promise<QaCapture> {
  const blob = await prepare(file)
  const res = await fetch(`${BASE}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: {
      'content-type': blob.type || 'image/png',
      // Present only when the site sets a matching env var. It is inlined into
      // the bundle, so it is a speed bump against scanners and not a secret —
      // see the note at the top of the function.
      ...(import.meta.env.VITE_QA_CAPTURES_TOKEN
        ? { 'x-qa-token': import.meta.env.VITE_QA_CAPTURES_TOKEN as string }
        : {}),
    },
    body: blob,
  })
  if (!res.ok) throw new Error(await failure(res, `Upload failed (${res.status}).`))
  return (await res.json()) as QaCapture
}

export async function deleteCapture(key: string): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: {
      ...(import.meta.env.VITE_QA_CAPTURES_TOKEN
        ? { 'x-qa-token': import.meta.env.VITE_QA_CAPTURES_TOKEN as string }
        : {}),
    },
  })
  if (!res.ok) throw new Error(await failure(res, `Could not remove (${res.status}).`))
}
