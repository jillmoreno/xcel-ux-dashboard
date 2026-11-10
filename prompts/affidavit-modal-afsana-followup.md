# Follow-up for Afsana — four changes to the affidavit modal since your brief (2026-11-10)

**Afsana:** this amends `prompts/affidavit-modal-afsana.md`; it does not replace it.

- **Not started yet?** Read both together — this one wins wherever they disagree — and build once.
- **Already building?** Everything below is a change to what that brief told you. Three of the four are new; one *contradicts* it outright and is marked ⚠.

Open Claude with the `xcel-ux-dashboard` folder connected and paste everything under the rule. Every step is a sentence to Claude — no terminal needed.

My standalone exploration is the spec, and it has moved: `public/prototypes/xcel-affidavit-modal.html` on `feat/affidavit-modal-house-style` (branch build at `feat-affidavit-modal-house-style--ux-design-xceldashboard.netlify.app/prototypes/xcel-affidavit-modal.html`). **Open it and look before you read any of this** — it is faster than the list.

---

I've made four changes to the affidavit modal since I wrote your brief. Read `prompts/affidavit-modal-afsana.md` first — it is still the spec — then apply these on top. Read `public/prototypes/xcel-affidavit-modal.html` as the reference for all four; every value below is in it.

## 1. ⚠ The warning banner is TWO banners now — this replaces §2 of the brief

The brief gave the warning one skin (the amber `warning-100/300/700`) and had the eyebrow swap its words between actors. That was too quiet a difference: a proctor and a student were being told apart by one line of small caps. **The skin changes with the actor too, and so does the icon.**

| | `actor: 'student'` (default) | `actor: 'proctor'` |
|---|---|---|
| Fill | `#bcebf1` | `--color-warning-100` |
| Border (1px) | `--color-info-500` (`#1fbdd2`) | `--color-warning-300` |
| Text | `#105f69` | `--color-warning-700` |
| Icon (16px, at left) | `User` from `@/icons` | `TriangleExclamation` from `@/icons` |
| Eyebrow | `STUDENT ACTION REQUIRED` | `PROCTOR ACTION REQUIRED` |

Everything else about the banner is unchanged: 8px radius, 10px/12px padding, the eyebrow at 11px/700/`0.08em`/uppercase, the body at 13px/600, both icons 16px and top-aligned with a 2px nudge.

**Both icons are already in the registry** — `import { User, TriangleExclamation } from '@/icons'` — so don't add an SVG.

⚠ **Two of the three teals are not tokens.** `#1fbdd2` is `--color-info-500` exactly. `#bcebf1` sits between `--color-info-100` (`#d2f1f6`) and `-200` (`#a5e4ed`); `#105f69` sits between `--color-info-700` (`#12717e`) and `-800` (`#0c4b53`). They are mine, deliberately, and the pair runs 5.69:1 where the amber runs 4.19:1. Treat them exactly like the CTA's `#3d5a73` — see §4 below, because the question of where all three live is open and it is mine to answer, not yours to guess.

## 2. ⚠ No hairline above the footer — this corrects §8 of the brief

§8 said "a hairline above, then the I Agree button alone." **Drop the hairline.** The button carries that edge on its own; the rule was doing nothing but cutting the modal in half. The footer is now just padding and one right-aligned button. Everything else in §8 stands — `#3d5a73`, no status line, no Cancel.

## 3. The spacing — new, the brief did not pin these

The brief set the inputs but never the modal's own frame. It is:

- **Body padding `30px 30px 8px`** (not 40) with a 20px gap between the stacked sections.
- **Footer padding `16px 30px 32px`** — the 30px sides match the body, so the button lines up with the fields above it.
- **20px of air above the name row.** It was butting straight onto the document group and reading as part of it.

## 4. The ✕ lines up with the I Agree button — new

Not with the button's hit area — with its **glyph**. The ✕ is an 18px icon centred in a 36px round target, so the target has to overhang the padding by 9px (`margin-right: -9px` on the close button, or the `CSSProperties` equivalent) to put the visible glyph flush with the CTA's right edge. The 36px target stays 36px; only the glyph moves. In my page both land 31px off the modal's right edge — measure it in the browser rather than trusting the arithmetic.

The title and the ✕ still share one row, vertically centred, title 20px, no subtitle.

## What this changes in your flag work

`affidavit-modal-proctor` is no longer an eyebrow switch. Its description in §2 of the brief ("Show the warning's PROCTOR ACTION REQUIRED eyebrow instead of the student one.") is now too narrow — write it as something like **"Show the proctor's warning — amber with the triangle — instead of the student's teal."** The flag still drives the same `actor` prop; the prop just does more.

When you check it on the Design bar, the test is that flipping "Proctor actor" changes the banner's **colour and icon**, not only its words.

## The token question is MINE — don't decide it

Your brief tells you to add `--color-xcel-affidavit-cta: #3d5a73` to the XCEL block in `tokens.css`. There are now **three** off-ramp values, not one — that CTA plus the two teals above — and I have not settled whether they land in `tokens.css` on your branch, on mine, or at all. I kept all three as local constants on my exploration page rather than put them in the ramp.

**So: don't touch `tokens.css` yet.** Use the three literals in your component with a comment beside each naming it as mine and dated 2026-11-10, exactly as my page does, and **ask me** when you get there. If I say yes, it is three token entries and a one-line swap; if I say no, you have already written it the way it ships. Either way the value lives in one place in your file.

## Unchanged

Everything else in `prompts/affidavit-modal-afsana.md` stands as written: the component at `src/components/e2e/AffidavitModalV2.tsx` with the same public API, `AffidavitModal.tsx` untouched beyond exporting its copy table, the one-line switch at both call sites, the `affidavit-modal-version` flag on the Design bar with `versions: ['eric-atlas-e2e']`, the handoff gallery left on the original, and no signed state — a valid I Agree just closes.

Then check and share as §5 of that brief says.
