#!/usr/bin/env node
/**
 * Pre-build asset-size guard. Walks `public/` and refuses to build
 * if any single file exceeds the Netlify per-file deploy threshold
 * we're targeting (25 MB). Netlify silently fails the deploy when
 * an asset is too large — the build looks healthy locally, the
 * push lands on `main`, and then production stays on the old
 * bundle. This guard surfaces the failure at `npm run build` time
 * instead.
 *
 * Trigger: `node scripts/check-asset-sizes.mjs` (wired as a
 * `prebuild` npm script).
 *
 * To raise the threshold, change `MAX_FILE_BYTES`. If you genuinely
 * need a >25MB asset, host it on a CDN and reference it via an
 * absolute URL in the relevant fixture instead of shipping it in
 * `public/`.
 */
import { readdir, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../public', import.meta.url))
const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB

// Recursive async-generator walk — `readdir({ recursive: true })`
// exists on newer Node, but rolling it by hand keeps the script
// portable across Netlify's Node versions.
async function* walkGen(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walkGen(full)
    } else if (entry.isFile()) {
      yield full
    }
  }
}

let oversized = []
try {
  for await (const file of walkGen(ROOT)) {
    const { size } = await stat(file)
    if (size > MAX_FILE_BYTES) {
      oversized.push({ file: relative(process.cwd(), file), size })
    }
  }
} catch (err) {
  // `public/` missing is fine — nothing to deploy.
  if (err.code !== 'ENOENT') throw err
}

if (oversized.length === 0) {
  console.log(`[asset-size] ok — no files >${MAX_FILE_BYTES / 1024 / 1024} MB in public/`)
  process.exit(0)
}

console.error('')
console.error(`[asset-size] ${oversized.length} file(s) over the ${MAX_FILE_BYTES / 1024 / 1024} MB threshold:`)
for (const { file, size } of oversized) {
  console.error(`  - ${file}  (${(size / 1024 / 1024).toFixed(1)} MB)`)
}
console.error('')
console.error('  Netlify will silently fail the deploy when a single file')
console.error('  is too large. Host these on an external CDN and reference')
console.error('  them via absolute URL instead of shipping them in public/.')
console.error('')
process.exit(1)
