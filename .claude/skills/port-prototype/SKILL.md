---
name: port-prototype
description: Port a designer's standalone HTML prototype into the React product — faithfully, in one pass, by reading the RUNNING BUILD rather than the source. Covers finding the live build, capturing every pane's DOM before writing a line, what counts as a design decision versus a cosmetic, their demo controls becoming design-bar flags, and handing the port back to its designer for review instead of guessing. Trigger on "port this prototype", "port her work to React", "turn this HTML into React", "bring the prototype into the product", "/port-prototype".
---

# Skill: Port a prototype

A designer's exploration lives in `public/prototypes/<name>.html` — one
hand-authored file, thousands of lines, no build step. The Prototypes rows open
the REACT product. Getting from one to the other is this skill.

## ⚠ READ THE BUILD, NOT THE SOURCE

**This is the whole skill. Everything else is detail.**

On 2026-11-04 Anjani's 9,292-line Compass Workspace was ported by reading her
file. It took FOUR passes, and the design lead found every miss. Everything
that was wrong was visible in minutes in a browser — most of it just by
looking, the rest by pressing a button:

| Got wrong by reading the source | Visible immediately in the build |
|---|---|
| Put the nav row last, and wrote in a comment AND a test that her file had no nav row | Her rail read `Overview · Learn · Workspace · Study planner` |
| A right rail called "Make something" with four buttons | A **Studio**: readiness block, six make actions, two Coming soon, three artefacts already made |
| The raw Rubi answer in the hero | `Rubi, last time: …` |
| "Carry on" | **Continue** |
| Marks listed provenance above passage | Passage first, provenance under it |
| All three panes on the home | The home hides both side panes and goes one column |
| The made-tag as a text pill | An icon with its name read aloud |
| No session mode at all | **"+ New workspace" opens the Notebook with Rubi** — the surface's whole reason for existing |
| No deck player | Opening a deck replaces the centre: *1 of 8*, flip, three confidence answers, prev/next |
| "It made something" | Four Make actions, four names, three payload shapes — a CTA, a body, an audio player |

The nav row was in a function called `addNav()` **inside the block already
extracted**. Reading 9,000 lines of string-building JavaScript tells you the
structure and lies to you about the result. A prototype is a program whose
output is the design; run the program.

So: **the first tool call of this skill opens the build. No React is written
until every pane's DOM has been captured.**

## Step 1 — find the running build, and open it

The designer's Refinement row carries the link. If you do not have it, ask —
do not go looking in the file.

```
https://<branch>--ux-design-xceldashboard.netlify.app/prototypes/<name>.html
```

Branch deploys of this site serve `public/prototypes/*` (the `BLOCKED` list in
`scripts/public-redirects.mjs` only applies to the trimmed testing build), so
the file is reachable. If it is not, the fallback is to copy the file under
`public/prototypes/` in the primary checkout untracked and open it on the dev
server — never to port from the source instead.

Open it with the Browser pane and leave it open. You will come back to it
after every pane you write.

## Step 2 — capture every pane, before writing anything

Walk the prototype the way a learner would, and at each screen record:

```js
// the shell, and which panes are actually showing
const sh = document.querySelector('<their shell>')
;[...sh.children].map((c) => ({ cls: c.className, display: getComputedStyle(c).display }))

// every pane's text, in order
el.innerText.split('\n').map((s) => s.trim()).filter(Boolean)

// and the markup of anything repeated — a card, a row, a chip
el.outerHTML.replace(/\s+/g, ' ')
```

⚠ **`display: none` is a design decision.** Panes hidden on one screen and
shown on another are the designer saying what you are meant to be looking at.
That is exactly what was missed twice above.

⚠ **Capture the NAV as rendered.** Prototypes build their navigation at run
time more often than not. Read the rail off the DOM; never conclude from the
source that a row does not exist.

## Step 2b — press every control, and write down what each one DOES

⚠ **This is not "click around". It is an inventory, and it is the step that
decides whether the port takes one pass or four.** On 2026-11-04 the Compass
Workspace was ported three times and still missing two whole modes, because
nothing renders until a button is pressed and nobody had pressed them.

Enumerate first, so you cannot quietly skip one:

```js
const scr = document.querySelector('<their screen>')
const ctrls = [...scr.querySelectorAll('button,[role=button],select,input,a[href],[onclick]')]
  .map((e) => ({
    label: (e.getAttribute('aria-label') || e.textContent || e.placeholder || '').trim(),
    data: [...e.attributes].filter((a) => a.name.startsWith('data-')).map((a) => a.name).join(','),
  }))
// group by data-attribute: prototypes name their actions there, and the
// distinct names ARE the list of behaviours you have to account for
```

The Workspace had 71 controls in 21 distinct actions. Press **one of each**,
and after every press record three things:

1. **what replaced the centre** — a new mode, or nothing
2. **what changed elsewhere** — a new row in a side rail, a changed bar
3. **the toast**, verbatim, if one fires

⚠ **A button that makes something is not done when it fires.** Her four Make
actions each produce a differently-named artefact with a different payload —
one gets a CTA, one gets a body of text, one gets an audio player. "It made
something" is not the finding; the four names and the three payload shapes are.

⚠ **Count the modes before you write any React.** A mode is anything that
replaces the main pane: a conversation, a player, a wizard, a detail. The
Workspace has at least five, and three of them are only reachable by pressing
something. If your port has fewer modes than your inventory, it is not done.

⚠ **Press the thing you think is decorative.** "+ New workspace" looks like a
button that opens a dialog. It opens the surface's entire reason for existing.

⚠ **Click through the states too.** Empty, loaded, one thing selected,
something open. A card's selected state and an empty list's message are
content.

Write what you captured somewhere you can diff against — the scratchpad is
fine. This is the specification; the file is not.

## Step 3 — their demo controls become design-bar flags

A prototype usually carries its own control bar. Each axis becomes a flag in
`src/context/FeatureFlagContext.tsx`:

```ts
surface: 'design',          // the DESIGN bar, never the demo bar
owner: '<designer id>',
versions: ['<their version>'],
surfaces: ['<surface id>'], // add it to src/context/designSurface.ts
variants: [...],            // one per option, THEIR labels
defaultVariant: '<the one their file opens on>',
```

⚠ **Their defaults become the committed defaults.** A Prototypes row opens at
`?demo=1`, which forces committed defaults — so these ARE what Stage shows.
Take them off the running build (what it opens on), not off a constant in the
source, which may be overridden later in the file.

⚠ **A control their file BUILDS AND THEN HIDES is a question, not an answer.**
Anjani's v4 creates its Workspace, Home and Story choosers and removes them on
a `setTimeout(…, 0)`. Expose them if the point of the port is to compare
variations — but say so, and ask the designer whether they had settled.

⚠ **Never edit `DemoControlsBar.tsx` or `DesignControlsBar.tsx`.** Both are
protected. A flag with `surface: 'design'` appears on the bar by itself.

## Step 4 — write it, against the capture

- **Their words are theirs.** Every string a user reads is copied verbatim,
  including a learner's first-person notes. Port structure, never rewrite copy.
- **Prefix their class names.** These stylesheets are imported globally and
  prototype classes (`.f-a`, `.r-c`, `.n`, `.big`) will escape onto the whole
  app. Use `cre-<surface>-*` and scope every rule under the root, which is what
  `compassAnjani.css` and `compassWorkspace.css` do.
- **Map their palette to this repo's tokens**, in a header comment listing each
  one. Never a raw hex. Check before inventing: `--color-compass-page-rubi`
  already existed for the colour the first pass was about to approximate.
- **Use the icon registry.** Where there is no match, use the nearest and say
  so in a comment; do not add an SVG as part of a port.
- **Port a sketch as a sketch.** Four of Anjani's six layouts are twenty lines
  each. Filling them in makes them yours. Say which ones are thin in the flag
  description so a reviewer reads them correctly.

## Step 4b — capture a PARITY FIXTURE, and let a test do the diffing

The capture from step 2 is not just notes — commit it, and write a test that
asserts your React renders every string in it. `CompassWorkspaceParity.test.tsx`
and `fixtures/compassWorkspaceParity.json` are the worked example.

```js
// run in their build, per mode; this is what the fixture holds
const strings = (root) => {
  const out = new Set()
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let n; while ((n = w.nextNode())) {
    const t = (n.textContent || '').replace(/\s+/g, ' ').trim()
    if (t.length > 2 && t.length < 200) out.add(t)
  }
  root.querySelectorAll('[aria-label],[placeholder],[title]').forEach((e) =>
    ['aria-label', 'placeholder', 'title'].forEach((a) => e.getAttribute(a) && out.add(e.getAttribute(a))))
  return [...out]
}
```

Also record the things TEXT CANNOT CARRY — the nav's order, the widths a
folded pane collapses to, whether their shell is a takeover. Three of the
Workspace's five misses were structural and no string check would have found
them.

⚠ **RE-CAPTURE, NEVER HAND-EDIT.** A fixture edited to make a test pass is a
diff against the port's own opinion, which is worth nothing.

⚠ **CAPTURE THE CHROME TOO** — per pane: `backgroundColor`, `border`,
`borderRadius`, and the shell's `gap` / `padding`. This is the category that
got through three audits of the Workspace: every string present, every node
accounted for, and the surface still wrong, because her panes are flat paper
with a hairline between columns and the port had made each one a rounded
bordered card on a grey page. Her shell class said `f-flat` the whole time.

⚠ **AND IT IS STILL NOT ENOUGH.** A check tells you the words are there and
the boxes are there. Only a SCREENSHOT tells you it looks like the same
product. Run the suite, then look at the two side by side — the suite is what
makes that look worth the designer's time, not a replacement for it.

When they ship a new version: re-capture, overwrite the fixture, and whatever
the suite reports IS the delta to port.

## Step 5 — compare, pane by pane, before you call it done

Open the two side by side — their build in one tab, the dev server in another —
and walk the same path through both. For each pane, diff your capture from
step 2 against what you built.

**The bar is: no design decision is lost.** It is NOT "pixel identical" —
different shell, real routing, real tokens, dark mode and accessibility all
make exact parity impossible, and chasing it wastes the designer's review on
things that do not matter.

| A decision — fix it | A cosmetic — let it go |
|---|---|
| where a nav row sits | the icon, where the registry has no match |
| what a button says | 2px of padding |
| which panes show on which screen | a serif that resolves differently |
| the order of a card's parts | a card 10px narrower in the product shell |
| a state that exists at all | a gradient the tokens cannot express |

## Step 6 — hand it to the designer, not to the lead

Share to stage (`/share-to-stage`), then send the DESIGNER the stage link with
one question:

> This is your ‹surface› ported to React. Open it beside your prototype and
> tell me anything that reads wrong — I will have missed things. These four
> layouts are ported as the sketches they are in your file; say if that is
> wrong too.

⚠ **The review belongs to the person who drew it.** On 2026-11-04 it landed on
Jillienne instead, who had to find the rail row herself and send it back twice.
The designer can judge fidelity at a glance and nobody else can.

Then fix what they list, and only then is the port done.

## Afterwards: diff, do not re-port

Once a prototype is ported, the React is the baseline. When their next version
arrives, **apply the delta** — diff their old file against their new one and
port the change — rather than porting the new file from scratch. A re-port
repeats every drift in full. This is what turns a port into a one-time cost
instead of a recurring tax.

## What NOT to port

- Screens already in React from an earlier port. Check first: content parity is
  a poor test (a restyle carries no new words), so compare the RENDER.
- A restyle of a screen whose design has not been declared settled. Anjani's v4
  restyles her planner, home and notebook — ~480 CSS rule lines, zero new copy
  — and that was deliberately left on 2026-11-04. Ask before taking it.
- Their sign-in screen, their dev toggles, their `?ws=1` deep links: scaffolding
  for the prototype, not the product.
