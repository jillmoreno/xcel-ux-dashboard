/**
 * `/links` — the route.
 *
 * Links lives INSIDE the UX Dashboard shell as a nav section, the same way To
 * Do, QA Notes and the Archive do: the shell's left rail is the navigation, it
 * owns the section `<h1>`, and it owns the appearance and palette controls. So
 * this route only redirects to the canonical URL rather than rendering a second,
 * differently-chromed copy of the panel — the same shape as `QaNotesPage` and
 * the account routes.
 *
 * One canonical URL per section is the point: `/links` is the address that is
 * short enough to say out loud, and it lands on the same page a reviewer would
 * have navigated to. A second rendering of the panel would be two doors onto one
 * surface, which is the fork this repo keeps paying for elsewhere.
 *
 * No gate to check on arrival, unlike the QA route — the Links section is
 * ungated, beside Demo.
 */

import { Navigate, useLocation } from 'react-router-dom'

export function LinksPage() {
  const { search } = useLocation()
  // Carry the incoming query through, so a link that pins anything else about
  // the view (an appearance, a palette) survives the hop.
  const params = new URLSearchParams(search)
  params.set('section', 'links')
  return <Navigate to={`/?${params.toString()}`} replace />
}
