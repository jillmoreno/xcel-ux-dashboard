/**
 * Types for protect-main.mjs, so `MainProtection.test.ts` can import it under
 * `tsc -b`. Same reason protect-framework.d.mts exists: on 2026-09-24 a test
 * importing an untyped .mjs passed vitest and failed BOTH site builds.
 */
/** The reason a command is refused, or null when it is fine. `currentBranch`
 *  is where the shell stands — a bare `git push` only touches main from main. */
export function verdict(command: string, currentBranch: string): string | null
