# Prompt — Ohio Property Affidavit modal, rebuilt in the house style

Paste everything below the rule into Claude with the `xcel-ux-dashboard` folder connected.

---

Make a new branch called `feat/affidavit-modal-house-style` from main and switch to it.

I'm attaching a screenshot of the production XCEL LMS's **Ohio Property Pre-Licensing Insurance Affidavit** modal. Rebuild it as a **standalone HTML exploration** that looks, reads and behaves like part of the XCEL product in this repo — same content and same flow, re-skinned on our tokens. Do not change what the modal asks the learner to do; change how it looks and how clearly it does it.

## Where it lives

- One file: `public/prototypes/xcel-affidavit-modal.html`. Self-contained — inline CSS, no framework, no build step. Load Open Sans and DM Serif Display from Google Fonts with real fallbacks, matching `--font-body` and `--font-heading-serif` in `src/styles/tokens.css`.
- Render the modal **open over a dimmed stand-in of the Atlas Home page** (a flat, low-detail backdrop is fine — the modal is the subject). Centre it; scrim on `--color-e2e-scrim`'s value.
- Add a `PROTOTYPE_FEATURES` row in `src/data/prototypeFeatures.ts` next to the other `category: 'exploration'` rows: `id: 'xcel-affidavit-modal'`, `kind: 'explore'`, `kindLabel: 'Standalone HTML'`, `status: 'ready'`, `brands: ['xcel']`, `externalUrl` and `livePreviewUrl` both `${PROTOTYPE_BASE}/xcel-affidavit-modal.html`, icon `flag`, accent `blue`. Write a blurb and tileBlurb that say what this explores (the affidavit as a house-style form, pre-exam attestation). That file is protected for everyone but me — I'm running this, so edit it.
- Do **not** touch `src/components/e2e/AffidavitModal.tsx`. That is the End-to-End Demo's pre-course affidavit (Figma 428:3054) and a different document. Read it first, though — its title/ink/button treatment and its comments are the closest existing reference for how an affidavit surface sits in this product, and the new exploration should feel like its sibling, not a stranger.

## What's in the screenshot (keep all of it)

1. Header bar, title "Ohio Property Pre-Licensing Insurance Affidavit", close ✕.
2. A warning banner: "MUST BE COMPLETED AND SIGNED BY THE STUDENT".
3. Intro copy: "Before you begin, you must review the attached Ohio Property Pre-Licensing Insurance Affidavit and complete the form below:"
4. A document row — PDF icon, the affidavit's linked title, an external-link icon.
5. Attestation checkbox (required): "I have read Ohio Property Pre-Licensing Insurance Affidavit and swear the statements above are true"
6. Three name fields in one row: Legal First Name (required, "Jordan"), Legal Middle Name ("Lee"), Legal Last Name (required, "Navarro").
7. Signature (required), placeholder "Type your full name".
8. Date Exam was completed (required) — cut off in the screenshot; give it a proper date input.
9. Footer with a single **I Agree** button, disabled until the form is valid.

## House-style rules — read `src/styles/tokens.css` `[data-brand='xcel']` before you write a colour

- **Every colour is an XCEL token value, with the token name in a CSS comment beside it.** No colour appears that isn't in the file. Specifically:
  - Title: DM Serif Display 24/38 in Charcoal (`--color-text-primary`, #3a3a3a) on a white header — **not** the slate-blue bar in the screenshot. The product does not use a coloured modal header.
  - Body and labels: Open Sans, 13–15px, Charcoal; helper text in Gray (`--color-text-secondary`, #666666).
  - Primary action **I Agree**: Brick (`--color-xcel-brick`, #9a1b1e) fill, white text, 8px radius, 14px/24px padding, 700 weight — the same button `AffidavitModal.tsx` uses for Continue. Disabled state: `--color-text-secondary` fill, `cursor: not-allowed`, no opacity trick.
  - Warning banner: `--color-warning-100` fill, `--color-warning-700` text, 1px `--color-warning-300` border. Drop the all-caps letterspaced shouting; sentence case, 13px, 600 weight, a small triangle-exclamation icon at left. It stays, it just stops yelling.
  - Document row: `--color-neutral-100` fill, 8px radius, link text in San Juan (`--color-primary-500`, #2d5872) underlined on hover only.
  - Inputs: 1px `--color-neutral-300` border, 8px radius, 40px tall, Charcoal text; focus ring 2px San Juan. Required marked with a Brick asterisk and `aria-required`. Error state (empty required field after blur, or Signature not matching First + Last): Brick border + 12px Brick helper line under the field.
  - Checkbox: a real `<input type="checkbox">` kept for keyboard/AT, drawn as a 16px square/check in San Juan — the `AffidavitModal.tsx` pattern.
  - Radii from `--radius-md` (8) and `--radius-xl` (16) only. Modal: 16px radius, 1px `--color-e2e-form-outline` border, soft drop shadow, 40px padding, max-width 560.
  - Saffron (`--color-secondary-*`) is fill-only and never text, icon, border or focus ring — do not reach for it.
- Hierarchy: title → warning → intro → document → attestation → fields → signature → date → action, with the attestation visually grouped **with** the document it refers to and the name/signature block grouped as "the form". Use spacing and one hairline, not boxes inside boxes.
- Voice: plain, second person, sentence case. Rewrite the intro to one short sentence and the attestation to read naturally; keep the legal meaning identical and keep the document's full name in the attestation.

## Behaviour (vanilla JS, no deps)

- Escape, ✕ and clicking the scrim close the modal (closing reveals the backdrop with a small "Reopen" link so the exploration can be replayed).
- Signature must equal the trimmed `First Last` the learner typed; validate on blur and on input once touched.
- I Agree enables only when: checkbox ticked, First/Last non-empty, Signature valid, Date set and not in the future. Clicking it shows a brief success state inside the modal (checkmark, "Affidavit signed", the signed date) then closes after 1.2s.
- Focus moves into the modal on open (to the checkbox), is trapped inside, and returns to the Reopen link on close. `role="dialog" aria-modal="true" aria-labelledby`.
- A `?state=` query switch for the handoff gallery: `empty` (default), `filled`, `error`, `signed`.

## Deliver

- The HTML file, the row, and a one-line note in `docs/prototypes.md` under the explorations list saying what this one argues.
- Run `npx tsc -b --noEmit`, `npx vitest run` and `npm run smoke`. Do not add a new smoke suite unless one of the existing ones fails because of the row.
- Then run `/share-branch` so it lands in Refinement tagged Atlas, with Added by: Jillienne.

## Out of scope — say so if you're tempted

- No React component, no flag, no `AffidavitModal.tsx` edit. If I decide this should replace the e2e modal, that is a second job: `/share-component` to fork `AffidavitModalV2.tsx` behind a flag, with this HTML as its spec.
- No change to the demo controls bar or any protected file other than the row.
