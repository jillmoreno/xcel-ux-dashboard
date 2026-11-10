# Claude Code prompt — build the affidavit modal exploration

Open a terminal in `xcel-ux-dashboard`, run `claude`, and paste everything below the rule. Attach the screenshot of the production modal with it (drag it into the terminal, or `@` the file).

> Already have the branch from Cowork? If `git branch --list feat/affidavit-modal-house-style` shows it, skip to **Path B** at the bottom — the build is done and only the checks and the share are left.

---

I'm attaching a screenshot of the production XCEL LMS's **Ohio Property Pre-Licensing Insurance Affidavit** modal. Build it as a **standalone HTML exploration** in this repo — same content, same flow, re-skinned on the XCEL brand tokens so it looks like part of the product. Read `CLAUDE.md` first; this is an Exploration row, not a React route, and not a flag.

## Setup

1. `git fetch origin && git checkout -b feat/affidavit-modal-house-style origin/main`.
2. Read these before writing anything: `src/styles/tokens.css` (the `[data-brand='xcel']` block — colour rules and contrast notes), `src/components/e2e/AffidavitModal.tsx` (the End-to-End Demo's pre-course affidavit — the closest sibling; borrow its title serif, its Brick button and its hidden-checkbox-drawn-as-a-square pattern), one existing exploration row in `src/data/prototypeFeatures.ts` (search `category: 'exploration'`), and the `EXPECTED_PLACEMENT` map in `src/test/UxDashboard.smoke.test.tsx`.

## The page — `public/prototypes/xcel-affidavit-modal.html`

Self-contained: inline CSS, vanilla JS, no framework, no build step. Google Fonts for Open Sans and DM Serif Display with the fallback stacks from `--font-body` / `--font-heading-serif`. The modal renders **open over a flat, low-detail stand-in of Atlas Home** (top bar with the XCEL wordmark, a left rail, a heading, three empty cards) under a `rgb(0 0 0 / .5)` scrim. Max-width 560, 16px radius, 1px `#e5e7eb` border, 40px padding, soft drop shadow.

Keep everything in the screenshot, in this order: title · warning banner · one-sentence intro · the PDF row (file icon, linked title, "PDF · opens in a new tab", external-link icon) · the attestation checkbox · Legal first / middle / last name in one row · Signature ("Type your full legal name") · Date exam was completed (a real `<input type="date">`, `max` = today) · footer with Cancel as a text link and one **I Agree** button.

### House-style rules

**Every colour is a value from the XCEL token block, with the token's name in a CSS comment beside it. No other hex appears in the file.**

| Element | Treatment |
|---|---|
| Title | DM Serif Display 24/32, Charcoal `#3a3a3a` (`--color-text-primary`), on **white** — no coloured header bar; the product doesn't have one. Subtitle "Before your final exam" in Gray `#666666`. |
| Warning | `#fdf0d4` fill, `#fbd27e` border, `#956c18` text (`warning-100/300/700`), triangle icon, 13px/600, **sentence case** — "This must be completed and signed by you, the student. Nobody can sign it on your behalf." It stays; it stops shouting. |
| PDF row + attestation | One bordered group, one hairline between them. Row fill `#ececec` (`neutral-100`), link in San Juan `#2d5872` (`primary-500`), underline on hover only. Checkbox: a real `<input type="checkbox">` kept for keyboard/AT, drawn as an 18px square with a 1.5px San Juan border that fills San Juan when checked. |
| Inputs | 40px tall, 1px `#c7c7c7` (`neutral-300`) border, 8px radius, Charcoal text, placeholder `#737373`; focus = San Juan border + 2px San Juan ring. Required = Brick asterisk + `aria-required`. Error = Brick border + 12px Brick helper line. |
| I Agree | Brick `#9a1b1e` (`--color-xcel-brick`) fill, white 700 15px, 8px radius, 14px/24px padding; hover `#7f1619`; disabled = `#666666` fill, `cursor: not-allowed`, no opacity trick. |
| Signed state | `#cce7d7` circle with a `#018937` check (`success-100/500`), "Affidavit signed", "Signed by {name} · exam completed {date}". |
| Never | Saffron (`secondary-*`) as text, icon, border or ring — it's fill-only in this brand and fails contrast everywhere else. |

Voice: plain, second person, sentence case. Rewrite the attestation to read naturally but keep the document's full name and the legal meaning: "I have read the Ohio Property Pre-Licensing Insurance Affidavit and swear that the statements in it are true."

### Behaviour

- I Agree enables only when: checkbox ticked · first and last non-empty · signature equals trimmed `First Last` (case-insensitive, whitespace-collapsed) · date set and not after today. Validate on blur, and on input once a field has been touched. A footer line (`aria-live="polite"`) reads "Complete every required field to continue." / "Everything is in order."
- Submit with an invalid form focuses the first bad field; a valid one shows the signed state, then closes after ~1.4s.
- Escape, ✕, Cancel and a click on the scrim close it; the backdrop then shows a "Reopen the affidavit" link so the page can be replayed. Focus moves to the checkbox on open, is trapped inside, and returns to Reopen on close. `role="dialog" aria-modal="true" aria-labelledby aria-describedby`.
- `?state=` for the handoff gallery: `empty` (default) · `filled` · `error` (bad signature, future date, untouched checkbox, all painted) · `signed`.
- Honour `prefers-reduced-motion` on the entrance animation.

## The row

Add to `PROTOTYPE_FEATURES` in `src/data/prototypeFeatures.ts`, right after the `xcel-pace-presets` row, with a comment block explaining what it explores and that it is **not** `AffidavitModal.tsx` (different document — pre-course vs. pre-exam):

```ts
{
  id: 'xcel-affidavit-modal',
  title: 'Affidavit modal — the house style',
  accent: 'blue',
  icon: 'flag',
  blurb: '…what it argues, two or three sentences…',
  tileBlurb: 'The production affidavit modal, re-skinned on our tokens. Four states: empty, filled, error, signed.',
  kind: 'explore',
  kindLabel: 'Standalone HTML',
  status: 'ready',
  category: 'exploration',
  externalUrl: `${PROTOTYPE_BASE}/xcel-affidavit-modal.html`,
  livePreviewUrl: `${PROTOTYPE_BASE}/xcel-affidavit-modal.html`,
  brands: ['xcel'],
},
```

No `devStatus` — `sectionOf` checks it before `category` and would move the row out of Explorations. Then add `'xcel-affidavit-modal': 'exploration'` to `EXPECTED_PLACEMENT` in `src/test/UxDashboard.smoke.test.tsx`, and a short section at the end of `docs/prototypes.md` saying what the page argues.

`prototypeFeatures.ts` is on the protected list; I'm Jillienne and exempt, so edit it.

## Verify, then share

1. `npx tsc -b --noEmit` · `npx vitest run` · `npm run smoke`. All three, green.
2. Write a throwaway jsdom script (jsdom is already in `node_modules`) that loads the page and asserts: disabled on open · focus on the checkbox · mismatched signature errors · future date errors · valid form enables · submit shows signed · Escape closes · Reopen reopens · each `?state=` renders · every `#rrggbb` in the file is in the allowed token-value set. Run it, show me the output, delete it.
3. Open the page in a browser (`npx vite` then `/prototypes/xcel-affidavit-modal.html`, plus `?state=error` and `?state=signed`) and take screenshots of the four states so I can see them.
4. Commit with a message in this repo's voice (read the last ten `git log` subjects), then run `/share-branch` — Refinement row tagged Atlas, Added by Jillienne.

## Out of scope

No React component, no flag, no edit to `AffidavitModal.tsx`, no change to any other protected file. If this is later chosen to replace the e2e modal, that is a `/share-component` job with this page as the spec.

---

## Path B — the branch already exists from Cowork

```
git checkout feat/affidavit-modal-house-style
git log --oneline -1          # expect: feat(prototypes): the affidavit modal rebuilt in the house style
```

The page, the row, the smoke-test pin and the docs note are committed. tsc and the smoke suites passed; the full vitest run and the visual check did not happen there. Do steps 1–4 of **Verify, then share** above (step 2's jsdom checks already passed once — re-run them anyway), fix anything the tests or the screenshots turn up, and amend or add a commit before `/share-branch`.
