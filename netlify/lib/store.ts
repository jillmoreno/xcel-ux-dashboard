/**
 * One place the three endpoints open their Netlify Blobs store.
 *
 * Netlify Blobs are PER SITE. This repo deploys to TWO Netlify projects as of
 * 2026-09-18 (see `src/data/gatewayMode.ts`): the PUBLIC one stakeholders get,
 * and the FULL one that shows everything. Left to the default, each would get
 * its own empty `links`, `qa-notes` and `qa-captures` stores — a link added on
 * one site invisible on the other, and every QA finding stranded on whichever
 * site it was typed into.
 *
 * So a project may point at ANOTHER site's store with two env vars:
 *
 *   BLOBS_SITE_ID  — the Site ID of the project that OWNS the store (the
 *                    original site; Project configuration → General → Project
 *                    information → Project ID)
 *   BLOBS_TOKEN    — a Netlify personal access token with access to that team
 *                    (User settings → Applications → Personal access tokens)
 *
 * Set on the FULL project only. The owning site sets neither and falls through
 * to the ambient context Netlify injects, exactly as before — so the site that
 * already holds the data changes nothing. Both vars must be set together; one
 * without the other is a misconfiguration and throws at first use rather than
 * silently opening a private store (which is the failure this file exists to
 * prevent, and the one that would be invisible until someone compared the two
 * sites).
 *
 * Lives OUTSIDE `netlify/functions/` on purpose: every file in that directory
 * is deployed as an endpoint, and a helper published at `/.netlify/functions/
 * store` would be a function that 500s.
 */
import { getStore } from '@netlify/blobs'

export type Store = ReturnType<typeof getStore>

export function openStore(name: string): Store {
  const siteID = process.env.BLOBS_SITE_ID?.trim()
  const token = process.env.BLOBS_TOKEN?.trim()
  if (Boolean(siteID) !== Boolean(token)) {
    throw new Error(
      'BLOBS_SITE_ID and BLOBS_TOKEN must be set together (or neither) — refusing to open a store that may not be the shared one',
    )
  }
  return siteID && token
    ? getStore({ name, consistency: 'strong', siteID, token })
    : getStore({ name, consistency: 'strong' })
}
