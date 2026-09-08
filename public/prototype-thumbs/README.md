# Prototype row thumbnails

Real screenshots for the UX dashboard's project rows (`/`, `UxDashboardPage`).

**Most features should NOT have one.** A row without a file here generates its
thumbnail from the feature's `accent` + `icon`, and an abstract mark cannot go
stale. These captures can — every one is a promise to re-shoot when the screen
changes.

## Convention

- One PNG per feature, named for its `id`: `<feature-id>.png`
- Referenced from `prototypeFeatures.ts` as `thumbnail: '/prototype-thumbs/<id>.png'`
- Roughly **3:2** — the tile renders at 160x110 and crops with
  `object-fit: cover`, anchored top-left, so anything off that aspect loses
  either its bottom (a taller capture) or its right (a wider one). A full-page
  capture is usually close enough. When a capture is wider than the tile and
  the right side matters, **pad it vertically to 1.4545 in its own background
  colour** rather than letting `cover` crop it — nothing is lost, it still
  fills the tile, and it stays on the same `cover` rule as every other
  thumbnail (see `onboarding-flow.png`).
- **Downscale before committing.** The tile needs 128x88 on a 2x display, so
  ~384px wide is already 3x oversupply and a fifth of the weight of a raw
  capture. A full-size screenshot is typically 380KB+ for a 64x44 tile:

      sips -Z 384 <file>.png --out <file>.png

A missing or broken file is not an error: the row falls back to the generated
mark, so deleting one is a safe way to retire it.


## Component row thumbnails

The same idea one level down, for the rows in a feature gateway's **UI
Components & UX Logic** tab (`DevHandoffComponent.thumbnail`).

- One PNG per component, in `components/`, named for its `id`:
  `components/<component-id>.png`
- Referenced from `prototypeFeatures.ts` as
  `thumbnail: '/prototype-thumbs/components/<id>.png'`
- Roughly **3:2** again — the row tile renders at 104x68 and crops with the same
  top-left `cover`.
- `sips -Z 320 <file>.png --out <file>.png` is ample (208x136 at 2x).

**A component row does NOT need one.** Without a file it renders a live,
inert miniature of the component's own preview, which cannot go stale. Reach for
a static image when the live one has a specific problem:

- its top-left is mostly white, so the miniature reads as a blank plate
  (the Sheets and Cancellation-flow rows are the current examples);
- the preview is expensive enough that mounting it per visible row is felt;
- **find-in-page is matching inside the thumbnail** — a live render puts its
  text in the DOM at 8% scale, so a search for a token name can hit a picture.
  A flat image has no searchable text at all.
