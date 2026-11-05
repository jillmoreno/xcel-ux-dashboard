/**
 * THE ON STAGE CARD'S PURE PARTS — kept out of `index.js` for a reason the
 * first deploy taught the hard way.
 *
 * ⚠ NETLIFY READS EVERY NAMED EXPORT OF A PLUGIN AS AN EVENT HANDLER. Exporting
 * `cardRecord` from the plugin module made the build fail with "Invalid event
 * 'cardRecord'" — the plugin never loaded, and a card-writing convenience took
 * the whole stage deploy down with it. So the plugin exports its handlers and
 * nothing else, and everything testable lives here.
 */

export const STORE_NAME = 'todo-board'
export const COLUMN = 'stage'
export const STAGE_URL = 'https://stage--ux-design-xceldashboard.netlify.app'
/** Mirrors `SEED_PEOPLE` in the function — an owner is a LABEL, not an identity. */
const ROSTER = ['Jill', 'Anjani', 'Eric', 'Afsana', 'Cody']

/**
 * Paths → Prototypes scope, the same rule `share-to-stage` and
 * `decide-defaults` use. ⚠ ORDER MATTERS: the specific surfaces are tested
 * before the catch-all, because a Compass file is also a file under the
 * product app.
 */
export function scopesFor(paths) {
  const scopes = new Set()
  for (const p of paths) {
    /* ⚠ THE CATCH-ALL IS ABOUT THE PRODUCT, so what is not product comes out
       first. Without this, a change to this plugin tags itself End-to-End —
       `src/test/StageCard.test.ts` matches `^src/` — and the board reports a
       surface as waiting when nothing about it moved. A card that is wrong is
       worse than no card, because the column is believed. */
    if (/^(netlify|docs|smoke|scripts|\.claude|\.github)\//.test(p)) continue
    if (/^src\/test\//.test(p)) continue
    if (/compass/i.test(p)) scopes.add('compass')
    else if (/(atlas|learning\/|pages\/Home)/i.test(p)) scopes.add('atlas')
    else if (/(invite|checkout|endToEnd|end-to-end)/i.test(p)) scopes.add('invite')
    else if (/admin/i.test(p)) scopes.add('admin')
    else if (/^(src|public)\//.test(p)) scopes.add('end-to-end')
  }
  return [...scopes]
}

/** The record `validateCard` would have produced for this card. */
export function cardRecord({ id, scope, title, note, position, addedDate, owner }) {
  return {
    id,
    title,
    note,
    column: COLUMN,
    owner: ROSTER.includes(owner) ? owner : '',
    position,
    addedDate: addedDate || new Date().toISOString().slice(0, 10),
    archived: false,
    archivedAt: '',
    archivedBy: '',
    scope,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * ⚠ ONE CARD PER SCOPE, UPDATED — not one per push. Three pushes of Compass
 * work in a day are one thing waiting, and three cards saying so is noise that
 * makes the column worth less than no column.
 *
 * An ARCHIVED card is not reused: archiving it is someone saying that record
 * is finished with, and quietly reopening it would undo their decision.
 */
export function existingCard(cards, scope) {
  return cards.find((c) => c.column === COLUMN && c.scope === scope && c.archived !== true) ?? null
}

/**
 * WHERE A SCOPE'S WORK ACTUALLY IS — the path the card should link to.
 *
 * ⚠ THE SURFACE IS THE DESTINATION, NOT THE SITE. The first card linked to
 * `/dashboard-rebrand?demo=1`, which lands on Atlas Home — and the Design
 * controls are scoped by SURFACE, so the control that switches the thing the
 * card is about was not on the bar when you got there. A card whose link does
 * not open the work is a card that wastes the one minute it was written to
 * save.
 */
export function pathFor(scope) {
  return (
    {
      /* Inside a LESSON: `compass:session` is where Anjani's and Jeff's
         versions are switched. `?section=compass` alone is the overview. */
      compass: '/dashboard-rebrand?demo=1&section=compass&session=1',
      atlas: '/dashboard-rebrand?demo=1&section=dashboard',
      invite: '/end-to-end-demo?demo=1',
      admin: '/dashboard-rebrand?demo=1',
      'end-to-end': '/dashboard-rebrand?demo=1',
    }[scope] ?? '/dashboard-rebrand?demo=1'
  )
}

/** The scope's name as the board should read it. */
export function titleFor(scope) {
  return (
    {
      compass: 'Compass',
      atlas: 'Atlas Learning',
      invite: 'Invite & Purchase',
      admin: 'Admin Tool',
      'end-to-end': 'End-to-End',
    }[scope] ?? scope
  )
}
