# Follow-up for Afsana — four changes to make to what you've already built (2026-11-10)

**Afsana:** you're mid-build on `prompts/affidavit-modal-afsana.md`. I've changed four things since I wrote it. **Keep going — none of this is a restart.** Two of the four are edits to code you have probably already written, and one asks you to back out a step that brief told you to take.

Open Claude with the `xcel-ux-dashboard` folder connected and paste everything under the rule. Every step is a sentence to Claude — no terminal needed.

**Look at my page before you read the list** — it is the spec and it has all four in it:
`feat-affidavit-modal-house-style--ux-design-xceldashboard.netlify.app/prototypes/xcel-affidavit-modal.html`
(source: `public/prototypes/xcel-affidavit-modal.html` on `feat/affidavit-modal-house-style`, the branch you cut from — pull it and the file is in your tree.)

---

I'm partway through my own affidavit exploration and four things changed after I wrote your brief. You're already building, so here they are as edits to what you have rather than as a spec. Read `public/prototypes/xcel-affidavit-modal.html` for all four; every value below is in it. Do them in this order — the first two are changes to existing code, the last two are probably still ahead of you.

## 1. ⚠ Back out the `tokens.css` edit — then leave it alone

Your brief told you to add `--color-xcel-affidavit-cta: #3d5a73` to the XCEL block. **If you've already done it, revert that file** — `git checkout -- src/styles/tokens.css`, or just delete the line — and check nothing else of yours is in there.

There are **three** off-ramp values now, not one (the CTA plus two teals in §2 below), and I haven't settled whether any of them belong in the ramp. I also don't want us both adding the same lines to the same file on two branches and colliding over it.

**Instead:** keep all three as constants at the top of your own component, each with a comment naming it as mine and dated 2026-11-10 — the way my page does it. Then **ask me.** If I say yes it's three token entries and a one-line swap; if I say no you've already written it the way it ships.

## 2. ⚠ The warning banner is TWO banners — this replaces §2 of your brief

You have it as one amber skin with the eyebrow swapping words between actors. That's too quiet — a proctor and a student were being told apart by one line of small caps. **The skin and the icon change with the actor too.**

| | `actor: 'student'` (default) | `actor: 'proctor'` |
|---|---|---|
| Fill | `#bcebf1` | `--color-warning-100` |
| Border (1px) | `--color-info-500` (`#1fbdd2`) | `--color-warning-300` |
| Text | `#105f69` | `--color-warning-700` |
| Icon (16px, at left) | `User` | `TriangleExclamation` |
| Eyebrow | `STUDENT ACTION REQUIRED` | `PROCTOR ACTION REQUIRED` |

Keep everything else about the banner as you have it: 8px radius, 10px/12px padding, eyebrow 11px/700/`0.08em`/uppercase, body 13px/600, icon 16px top-aligned with a 2px nudge.

**Both icons are already in the registry** — `import { User, TriangleExclamation } from '@/icons'` — so you're not adding an SVG. Of the three teals only `#1fbdd2` is a token (`--color-info-500`); the other two are mine and go in your constants per §1. The pair runs 5.69:1, where the amber runs 4.19:1.

**This changes your flag, not just your component.** `affidavit-modal-proctor` is no longer an eyebrow switch, so its description in your brief is now too narrow. Rewrite it as something like **"Show the proctor's warning — amber with the triangle — instead of the student's teal."** Same `actor` prop; the prop just does more. When you check it on the Design bar, the test is that the banner's **colour and icon** change, not only its words.

## 3. ⚠ Delete the hairline above the footer — this corrects §8 of your brief

§8 said "a hairline above, then the I Agree button alone." **Drop the hairline.** The button carries that edge on its own; the rule was cutting the modal in half for nothing. Everything else in §8 stands — `#3d5a73`, right-aligned, no status line, no Cancel.

## 4. The frame, and the ✕ — new, your brief never pinned these

Probably still ahead of you; if the modal's already laid out, these are three numbers and one offset.

- **Body padding `30px 30px 8px`**, 20px gap between the stacked sections.
- **Footer padding `16px 30px 32px`** — the 30px sides match the body so the button lines up with the fields above it.
- **20px above the name row.** It was butting onto the document group and reading as part of it.
- **The ✕ aligns with the I Agree button's GLYPH, not its hit area.** It's an 18px icon centred in a 36px round target, so the target overhangs the padding by 9px (`margin-right: -9px`) to put the visible glyph flush with the CTA's right edge. The target stays 36px; only the glyph moves. Both land 31px off the modal's right edge in my page — measure it in the browser rather than trusting that.

Title and ✕ still share one row, vertically centred, title 20px, no subtitle.

## Everything else in your brief stands

`AffidavitModalV2.tsx` with the same public API, `AffidavitModal.tsx` untouched beyond exporting its copy table, the one-line switch at both call sites, `affidavit-modal-version` on the Design bar with `versions: ['eric-atlas-e2e']`, the handoff gallery left on the original, and no signed state — a valid I Agree just closes.

Then check and share as §5 of that brief says. If any of this fights something you've already solved a better way, tell me rather than unpicking your work — I'd rather see it.
