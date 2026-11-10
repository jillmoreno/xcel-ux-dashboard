# Prompt for Afsana — a second UI version of the affidavit modal, switchable on the Design bar

**Afsana:** open Claude with the `xcel-ux-dashboard` folder connected and paste everything under the rule. Every step is a sentence to Claude — no terminal needed. Jill's standalone exploration of the same modal is at `/prototypes/xcel-affidavit-modal.html` on the Hub once her branch lands; this builds the product-side version of it, on your own branch, with a switch so the team can flip between versions and compare.

---

Make a new branch called `feat/affidavit-modal-v2` from `origin/feat/affidavit-modal-house-style` and switch to it. (That branch carries `afsana` in `DesignerId` and the affidavit exploration; once Jill has released it, "from main" is the same thing.)

I'm building a second UI version of the End-to-End Demo's affidavit modal so we can compare it against the current one in the product, switching between them from the **Design controls bar**. Read `CLAUDE.md` first — especially "If you are a designer, this is the whole job" and "The two bars, and which one is yours" — then these files before writing anything:

- `src/components/e2e/AffidavitModal.tsx` — the current modal. **Do not edit it.** This is the "fork to a sibling" case: it stays as V1, untouched, and my version lives beside it.
- `src/components/compass/AtlasHomeEricE2E.tsx` and `src/components/compass/AtlasHomeJillMain.tsx` — the two places that render it (search `<AffidavitModal`). The `?affidavit=pre|post` query is how the demo opens it.
- `src/context/FeatureFlagContext.tsx` — the flag catalog: `FeatureFlagDefinition`, `variants`, `surface: 'design'`, `owner`, `versions`. Read the long comment on `surface` and the `compass-workspace` flag as a worked example of a Design-bar control.
- `src/components/account/FeatureFlagPanel.tsx` — `REBRAND_FLAGS`, where my flag key gets listed so it's reachable.
- `public/prototypes/xcel-affidavit-modal.html` if it exists on main yet (Jill's HTML exploration of this same modal — the house-style spec I'm starting from). If it isn't there, the spec is written out below in full; nothing depends on the file.
- `src/styles/tokens.css`, the `[data-brand='xcel']` block, before you write a colour.

## 1. The component — `src/components/e2e/AffidavitModalV2.tsx`

Same public API as `AffidavitModal` — `kind: 'pre' | 'post'`, `onClose`, `initialAgreed` — so the call sites swap it in with no other change. Same construction: portalled to `<body>`, fixed scrim, `role="dialog" aria-modal aria-labelledby`, Escape closes, focus moves in on open. Fork the layout, import the data: reuse the `AFFIDAVIT` titles/`when` copy by exporting them from the original if they aren't already (that one-line export is the only touch the original gets — ask me first if it needs more than that).

Styles as `CSSProperties` constants like the original, every colour a `var(--color-…)` token from the XCEL block. One value isn't a token yet — see I Agree below.

### What's in it, top to bottom

1. **Header row** — the title and the ✕ on one horizontal line, vertically centred. Title: `var(--font-heading-serif)` 20px, Charcoal (`--color-text-primary`). No subtitle. ✕ is a 36px round hit area, Gray icon (`--color-text-secondary`), `--color-neutral-100` hover, visible focus ring.
2. **Warning banner** — `--color-warning-100` fill, 1px `--color-warning-300` border, `--color-warning-700` text, triangle icon at left, 8px radius. Two lines:
   - Eyebrow: 11px, 700, letter-spacing 0.08em, uppercase — the one place uppercase is allowed, because it names who must act. `STUDENT ACTION REQUIRED` by default; `PROCTOR ACTION REQUIRED` when the modal is told the actor is the proctor (an `actor?: 'student' | 'proctor'` prop, default `student`). When a proctor is required in the flow this banner appears on both the student steps and the proctor steps, so both labels must exist.
   - Body, 13px, 600: `You must complete and sign this affidavit yourself. Someone else cannot sign it on your behalf.`
3. **Intro**, 14px Charcoal: `Read the affidavit, confirm you've read it, then sign below with your name.`
4. **Document group** — one 1px `--color-e2e-form-outline` border, 8px radius, containing:
   - The PDF row: `--color-neutral-100` fill, file icon in Gray, the affidavit's title as a link in San Juan (`--color-primary-500`), underline on hover only, external-link icon at the right. No "opens in a new tab" meta text. (In the demo the link goes nowhere — `preventDefault`.)
   - A hairline, then the attestation: a real `<input type="checkbox">` kept for keyboard and screen readers, drawn as an 18px square with a 1.5px San Juan border that fills San Juan when checked (the original's hidden-checkbox pattern, same icons from `@/icons`). Label: `I confirm that I have read the affidavit and that all statements contained in it are true and accurate.` with a Brick asterisk.
5. **Name fields** — `First name` *, `Middle name`, `Last name` * in one three-up row (stack on narrow). 40px inputs, 1px `--color-neutral-300` border, 8px radius, Charcoal text, placeholder `--color-text-tertiary`; focus = San Juan border + 2px San Juan ring. Autocomplete attributes on each.
6. **Signature** * — placeholder `Type your full name`; hint under it in `--color-text-tertiary`, 12px: `Typing your name here counts as your signature.`
7. **Date exam was completed** * — a real `<input type="date">`, `max` = today, max-width 240.
8. **Footer** — a hairline above, then the **I Agree** button alone, right-aligned. No status line, no Cancel.
   - Fill `#3d5a73` — **this is a decision of Jill's and is not a token value yet.** Add it to the XCEL block in `tokens.css` as `--color-xcel-affidavit-cta: #3d5a73; /* Jill, 2026-11-10 — the affidavit modal's primary CTA; not yet in the brand ramp */` and reference the token, so the page keeps the every-colour-is-a-token rule and the value is in one place. Hover: `--color-primary-500`. White text, 700, 15px, 8px radius, 14px/24px padding.
   - Disabled: `--color-text-secondary` fill, `cursor: not-allowed`, no opacity trick.

### Behaviour

- Required markers are Brick asterisks plus `aria-required`.
- I Agree enables only when: checkbox ticked · first and last non-empty · signature equals trimmed `First Last` (case-insensitive, whitespace-collapsed) · date set and not after today.
- Validate on blur, and on input once a field has been touched. Error = Brick border + a 12px Brick helper line under the field; the checkbox's square turns Brick. Copy: "Enter your first name." / "Enter your last name." / "Your signature must match your first and last name exactly." / "Enter the date you completed the exam. It can't be in the future." / "Confirm you've read the affidavit to continue."
- A valid I Agree calls `onClose` — no success panel. Escape and ✕ close too. Focus lands on the checkbox on open and is trapped inside.
- `initialAgreed` ticks the box on open, as on the original (the handoff gallery uses it).

## 2. The flag — in `src/context/FeatureFlagContext.tsx`

Add one variant flag to the catalog:

```ts
{
  key: 'affidavit-modal-version',
  label: 'Affidavit modal',
  description: 'Which build of the arrival affidavit the End-to-End Demo opens: the current modal, or Afsana’s house-style rebuild (2026-11-10).',
  page: /* the page the two call sites belong to — read the catalog and pick the id the other e2e/Atlas Home flags use */,
  defaultEnabled: true,
  variants: [
    { value: 'current', label: 'Current', description: 'AffidavitModal.tsx — the Figma 428:3054 build.' },
    { value: 'v2', label: 'V2 — house style', description: 'AffidavitModalV2.tsx — Charcoal title row, warning eyebrow, grouped PDF + attestation, name + typed signature, #3d5a73 CTA.' },
  ],
  defaultVariant: 'v2',   // ON on my branch, so the branch build shows my work. Jill decides at release.
  surface: 'design',
  owner: 'afsana',        // mine — `afsana` is in DesignerId / FLAG_DESIGNERS since 2026-11-10
  versions: ['eric-atlas-e2e'],  // the Design bar is version-scoped; this is the version that opens the modal
  group: 'Widgets',
}
```

- Read the catalog's own comments on `versions` and `surfaces` and set them so the control shows on the Design bar when the End-to-End Demo is open. If the bar scopes by a surface id and Atlas Home has one in `src/context/designSurface.ts`, add it; if Atlas Home has none, say so and leave `surfaces` off rather than inventing an id.
- `owner: 'afsana'` is a label, not what puts the control on the bar — `versions: ['eric-atlas-e2e']` does that, because the Design bar is scoped to the dashboard version on screen and I own no version. Read the `designControlsFor` comment; don't drop `versions`.
- Add `'affidavit-modal-version'` to `REBRAND_FLAGS` in `FeatureFlagPanel.tsx`.
- Add a second, on/off flag `affidavit-modal-proctor` (label "Proctor actor", description "Show the warning's PROCTOR ACTION REQUIRED eyebrow instead of the student one.", `defaultEnabled: false`, same `surface`/`owner`/`versions`) so the eyebrow can be flipped on the Design bar too. V2 reads it for its `actor` prop.

## 3. The call sites

In both `AtlasHomeEricE2E.tsx` and `AtlasHomeJillMain.tsx`, where `<AffidavitModal …/>` renders: read `useFeatureFlag('affidavit-modal-version').variant` and render `AffidavitModalV2` when it is `'v2'`, the original otherwise, passing the same props (plus `actor` from the proctor flag). That is the only change to those files — a one-line switch at the call site, exactly as `CourseContentV2.tsx` is chosen.

## 4. The handoff gallery

`src/components/prototype/AtlasHandoffPreviews.tsx` renders `AffidavitModal` for the Atlas Home handoff's state gallery. Leave it rendering the original — that handoff documents what shipped. Don't add V2 there.

## 5. Check and share

Run the type check, the tests and lint. Open the branch build at `/dashboard-rebrand?demo=1&affidavit=pre`, open the robot's dropdown to show the Design bar, and confirm the "Affidavit modal" control is there and flips the modal live, and the "Proctor actor" switch changes the eyebrow. Then say `/share-branch` — Refinement row tagged Atlas, Added by Afsana, with a note that the Design bar carries the switch.

## Not in scope

No edit to `AffidavitModal.tsx` beyond exporting its copy table. No change to the demo controls bar, `DesignControlsBar.tsx`, or anything else on the protected list. No success/"signed" state — Jill dropped it. No new standalone HTML; Jill's exploration page stays hers.
