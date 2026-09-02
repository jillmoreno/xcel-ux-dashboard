/**
 * `/qa-notes` — the route.
 *
 * QA Notes lives INSIDE the UX Dashboard shell as a nav section, the same way
 * To Do and the Archive do: the shell's left rail is the navigation, it owns the
 * section `<h1>`, and it carries the Design & Development password gate. So this
 * route only redirects to the canonical URL rather than rendering a second,
 * differently-chromed copy of the panel — the same shape as the account routes,
 * which redirect into the rebrand shell for exactly this reason. One canonical
 * URL per section means a shared link can't open a page that looks unlike the
 * one the reviewer navigated to.
 *
 * Not flag-gated. It briefly was, defaulting off, which turned out to be a
 * second lock on a door the password already locks — and the Feature Flag panel
 * only mounts inside `AppLayout`, which the gateway sits outside, so there was
 * no way to switch it on from the page the section lives on. The password gate
 * is the access control, as it is for To Do and Archive.
 *
 * That gate still applies on arrival: `?section=qa-notes` while locked lands the
 * reviewer on Demo with the modal raised, which is the shell's existing
 * behaviour for every restricted section and is why this does not check it here.
 */

import { Navigate, useLocation } from 'react-router-dom'

export function QaNotesPage() {
  const { search } = useLocation()
  // Carry the incoming query through, so a link that pins anything else about
  // the view (a flag override, an appearance) survives the hop.
  const params = new URLSearchParams(search)
  params.set('section', 'qa-notes')
  return <Navigate to={`/?${params.toString()}`} replace />
}
