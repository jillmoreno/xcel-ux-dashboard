/**
 * Types for the framework-protection hook, so `FrameworkProtection.test.ts` can
 * import it under `tsc -b`.
 *
 * ⚠ THE HOOK ITSELF MUST STAY PLAIN `.mjs`. Claude Code runs it with bare
 * `node`, with no build step and no loader — a `.ts` file there would not run
 * at all. So the types live beside it rather than in it.
 *
 * ⚠ AND THIS FILE IS NOT OPTIONAL. Without it the import is an implicit `any`,
 * which `tsc -b` rejects — and `npm run build` IS `tsc -b && vite build`, so the
 * Netlify deploy fails on both sites. That is exactly what happened on
 * 2026-09-24 (commit 681599d): the test was written, `vitest` and `eslint` were
 * run, `tsc` was not, and both site builds errored.
 */
export declare const PROTECTED: readonly string[]
/** Is `path` (repo-relative) one of the protected files? */
export declare function isProtected(path: string): boolean
/** Is whoever is running this the dashboard's owner? */
export declare function isOwner(): boolean
