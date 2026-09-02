/**
 * QA capture store — the upload endpoint.
 *
 * The first server-side code in this repo. It exists because QA Notes captures
 * have to be visible to whoever opens the link, not just to the reviewer who
 * dropped them: the page's whole job is handing findings to engineering, and a
 * screenshot living in one browser's IndexedDB does not do that.
 *
 * Backed by Netlify Blobs on a SITE-WIDE store (`getStore`, not
 * `getDeployStore`) so captures survive every deploy. A deploy-scoped store
 * would silently empty the page on the next push, which is the one failure mode
 * that would make this worse than committing the files.
 *
 *   GET    /api/qa-captures          → { captures: [{ key, contentType, size, uploadedAt, etag }] }
 *   GET    /api/qa-captures/:key     → the image bytes
 *   PUT    /api/qa-captures/:key     → replace that slot (raw body, image/*)
 *   DELETE /api/qa-captures/:key     → clear that slot
 *
 * ── On authentication, plainly ────────────────────────────────────────────────
 * There is none worth the name, and there cannot be without a server-side secret
 * the browser does not hold. Anything shipped to the client — a `VITE_*` value,
 * the prototype password — is readable in the bundle by anyone who opens
 * devtools, so it authenticates nobody.
 *
 * What this does instead is bound the blast radius, which for an internal
 * prototype is the proportionate answer:
 *
 *   - `KEY_PATTERN` allows only `qa-NNN-expected`, `qa-NNN-actual` and
 *     `qa-NNN-context-1..6`. There is no caller-supplied filename and no path
 *     separator, so this cannot become a general file host and cannot be walked
 *     out of its own store. The context slots are CAPPED and INDEXED for exactly
 *     that reason — a free-form gallery would need unbounded keys, which is the
 *     one property standing between this endpoint and an open upload bucket.
 *   - `ALLOWED_TYPES` allows only raster images.
 *   - `MAX_BYTES` caps a single slot.
 *
 * So the worst an anonymous caller can do is put a different picture in one of
 * the QA screenshot slots on this prototype. `WRITE_TOKEN` below adds a shared
 * header as a speed bump against drive-by scanners — call it obfuscation, not
 * security. If writes genuinely need locking down, the answer is a platform
 * control that also covers this function (Netlify site password protection or
 * Identity), not a secret in the bundle.
 */

import { getStore } from '@netlify/blobs'

export const config = {
  path: ['/api/qa-captures', '/api/qa-captures/:key'],
}

/**
 * The slots a finding can have, and only for a `qa-NNN` id: the Expected/Actual
 * pair, plus up to six numbered context images. Bounds the whole store to eight
 * keys per finding — a few thousand in total, all of them image slots on one page.
 *
 * The cap is load-bearing, not tidiness. See the authentication note above: a
 * bounded key namespace is what this endpoint has instead of auth.
 */
const KEY_PATTERN = /^qa-\d{3}-(expected|actual|context-[1-6])$/

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

/** Netlify caps a synchronous function's request body around 6MB. The client
 *  downscales before it gets here, so anything this large is a mistake worth an
 *  explicit error rather than a truncated blob. */
const MAX_BYTES = 4_500_000

const STORE_NAME = 'qa-captures'

type CaptureMetadata = {
  contentType: string
  size: number
  /** ISO 8601. Used by the client purely as a cache-busting version. */
  uploadedAt: string
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

/** Optional shared-secret speed bump. Absent env var ⇒ writes are open, which is
 *  the default and is a deliberate choice for an internal prototype. */
function writeTokenOk(req: Request): boolean {
  const expected = process.env.QA_CAPTURES_WRITE_TOKEN
  if (!expected) return true
  return req.headers.get('x-qa-token') === expected
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  // `config.path` gives the param, but read it off the pathname so the function
  // behaves the same when invoked directly at /.netlify/functions/qa-captures.
  const tail = url.pathname.replace(/^.*\/qa-captures\/?/, '')
  const key = tail ? decodeURIComponent(tail) : null

  const store = getStore({ name: STORE_NAME, consistency: 'strong' })

  // ── collection ────────────────────────────────────────────────────────────
  if (!key) {
    if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
    const { blobs } = await store.list()
    // Metadata is fetched per key rather than kept in a side index: `list()` is
    // then the single source of truth about what exists, so the listing can
    // never advertise a capture that is not there. At two slots per finding this
    // is a few dozen parallel reads.
    const captures = await Promise.all(
      blobs.map(async (b) => {
        const meta = await store.getMetadata(b.key)
        const m = (meta?.metadata ?? {}) as Partial<CaptureMetadata>
        return {
          key: b.key,
          etag: meta?.etag ?? b.etag,
          contentType: m.contentType ?? 'image/png',
          size: m.size ?? 0,
          uploadedAt: m.uploadedAt ?? '',
        }
      }),
    )
    return json({ captures })
  }

  if (!KEY_PATTERN.test(key)) {
    return json({ error: `Not a capture slot: ${key}` }, 400)
  }

  // ── one slot ──────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const found = await store.getWithMetadata(key, { type: 'arrayBuffer' })
    if (!found?.data) return json({ error: 'Not found' }, 404)
    const m = (found.metadata ?? {}) as Partial<CaptureMetadata>
    const headers = new Headers({ 'content-type': m.contentType ?? 'image/png' })
    // Only when non-empty. `getWithMetadata` does not always surface an etag
    // (it comes back blank against the local Blobs server), and an empty ETag
    // header is worse than no header — a client may treat it as a real
    // validator and revalidate against nothing.
    if (found.etag) headers.set('etag', found.etag)
    // Cached hard ONLY for a versioned request. The app always asks for
    // `?v=<uploadedAt>`, so those bytes genuinely never change. A bare URL —
    // what someone gets by pasting the path into a tab to debug — must not be
    // frozen for a year on the strength of that.
    headers.set(
      'cache-control',
      url.searchParams.has('v')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate',
    )
    return new Response(found.data, { headers })
  }

  if (req.method === 'PUT') {
    if (!writeTokenOk(req)) return json({ error: 'Unauthorized' }, 401)
    const contentType = (req.headers.get('content-type') ?? '').split(';')[0].trim()
    if (!ALLOWED_TYPES.has(contentType)) {
      return json({ error: `Unsupported type: ${contentType || 'none'}` }, 415)
    }
    const bytes = await req.arrayBuffer()
    if (bytes.byteLength === 0) return json({ error: 'Empty body' }, 400)
    if (bytes.byteLength > MAX_BYTES) {
      return json(
        { error: `Too large: ${bytes.byteLength} bytes (max ${MAX_BYTES})` },
        413,
      )
    }
    const metadata: CaptureMetadata = {
      contentType,
      size: bytes.byteLength,
      uploadedAt: new Date().toISOString(),
    }
    await store.set(key, bytes, { metadata })
    // `uploadedAt` is the version the client caches against, not the etag —
    // it is written here so it is always present, where the etag depends on what
    // the Blobs backend chooses to surface.
    return json({ key, ...metadata }, 201)
  }

  if (req.method === 'DELETE') {
    if (!writeTokenOk(req)) return json({ error: 'Unauthorized' }, 401)
    await store.delete(key)
    return json({ key, deleted: true })
  }

  return json({ error: 'Method not allowed' }, 405)
}
