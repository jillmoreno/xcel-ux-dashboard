/**
 * `/prds` — the route.
 *
 * PRDs lives INSIDE the UX Dashboard shell as a nav section, like Resources
 * and Research, so this route only redirects to the canonical URL rather than
 * rendering a second, differently-chromed copy of the panel — the same shape
 * and the same reasoning as `LinksPage`: one door per section, and an address
 * short enough to say out loud.
 */

import { Navigate, useLocation } from 'react-router-dom'

export function PrdsPage() {
  const { search } = useLocation()
  // Carry the incoming query through, so a link that pins anything else about
  // the view (an appearance, a palette) survives the hop.
  const params = new URLSearchParams(search)
  params.set('section', 'prds')
  return <Navigate to={`/?${params.toString()}`} replace />
}
