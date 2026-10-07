/**
 * `/research-rationale` — the route.
 *
 * Since 2026-10-07 Research is a board authored on the page, living INSIDE the
 * UX Dashboard shell as a nav section exactly like Resources — so this route
 * only redirects to the canonical URL rather than rendering a second,
 * differently-chromed copy of the panel. Same shape and same reasoning as
 * `LinksPage`: one door per section.
 *
 * Before that it iframed `public/research-rationale/index.html`, the Learner
 * Platform decisions log carried over from the LMS dashboard. That file is
 * still in the repo, unreferenced, at `public/archive/research-rationale-
 * index.html` — MOVED, because a folder with an index page under `public/` is
 * served by vite and by Netlify before the SPA fallback, so left where it was
 * it answered `/research-rationale` itself and this redirect never ran. See
 * the `research-rationale-iframe` row in `src/data/archivedItems.ts`.
 *
 * The path is kept because links already point at it (`PrototypeLandingPage`'s
 * share CTA, the Contributing guide) and because it is short enough to say.
 */

import { Navigate, useLocation } from 'react-router-dom'

export function ResearchRationalePage() {
  const { search } = useLocation()
  // Carry the incoming query through, so a link that pins anything else about
  // the view (an appearance, a palette) survives the hop.
  const params = new URLSearchParams(search)
  params.set('section', 'research')
  return <Navigate to={`/?${params.toString()}`} replace />
}
