# `xcel-signin` assets

Art for [`../../xcel-signin.html`](../../xcel-signin.html), built from Figma
frame [`666:46`](https://www.figma.com/design/JEY1UPqWJ165AVy40in1KQ/?node-id=666-46).

| File | Figma node | Status |
|---|---|---|
| `compass-mark.svg` | `666:178` (Group 17) | **Present.** 199×199, white disc + `#a53739` compass. |
| `xcel-wordmark.png` | `666:147` | **Missing — export needed.** 141.71×52, @2x or @3x. |
| `contour-left.svg` | `666:164` (Group 16) | **Missing — export needed.** |
| `contour-right.svg` | `666:187` (Group 25) | **Missing — export needed.** |

## Why three files are missing

They could not be fetched programmatically: Figma's asset CDN
(`figma.com/api/mcp/asset/…`) is unreachable from the sandbox, and the
`localhost:3845` MCP asset server only exists on the machine running Figma
desktop. Export them from Figma and drop them in here under exactly the names
above — **no code change is needed.**

The page wires each one through an `onerror` fallback, the same trick
[`FeaturePreviewThumb`](../../../../src/components/prototype/FeaturePreviewThumb.tsx)
uses for row thumbnails:

- **Wordmark** — a dashed placeholder box of the right dimensions renders in its
  place, so the form's top-left never collapses and the gap is obviously
  unfinished rather than quietly wrong.
- **Contours** — the `<img>` removes itself. They are decorative topographic
  line art behind the gradient, so the composition still reads without them.

While anything is missing, a small **Missing art** chip sits in the bottom-right
naming the files. It disappears on its own once all three resolve, so it cannot
be left on by accident.

## Deliberately not hand-drawn

The wordmark is brand identity and the contours are real vector art — neither
was reconstructed by eye. A traced logo that is 95% right is worse than a
visible gap, because it stops looking like a gap.
