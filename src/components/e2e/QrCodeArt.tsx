import type { CSSProperties } from 'react'

/**
 * A QR CODE'S SHAPE, DRAWN — 2026-10-23, for the partner's share card.
 *
 * ⚠ IT IS NOT SCANNABLE, AND THAT IS THE ONE THING TO KNOW ABOUT IT. There is
 * no QR encoder in this repo and no dependency to reach for, so this draws the
 * ANATOMY of a code — three finder squares, an alignment square, the two
 * timing lines, a quiet zone — with a deterministic fill between them. A phone
 * pointed at it will find nothing.
 *
 * ⚠ DETERMINISTIC, from the string it is given. The same invite code always
 * draws the same pattern, so the screen does not reshuffle on every render and
 * a screenshot taken today matches one taken next week. A random fill would
 * have made the page quietly different in every capture.
 *
 * ⚠ TO MAKE IT REAL, encode `value` properly: either generate an SVG per
 * invite code at build time or add a QR dependency and render here. Everything
 * around it — the card, the sizing, the quiet zone — stays as it is; only the
 * module grid changes. Worth doing before anyone is asked to scan it from a
 * screen in a room.
 */
export function QrCodeArt({
  value,
  size = 228,
  style,
}: {
  value: string
  size?: number
  style?: CSSProperties
}) {
  const modules = buildModules(value)
  const n = MODULES
  return (
    <svg
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      style={{ display: 'block', shapeRendering: 'crispEdges', ...style }}
      role="img"
      /* ⚠ THE LABEL SAYS WHERE IT GOES, because the image IS the link for a
         sighted reader and a screen-reader user gets nothing from "QR code". */
      aria-label={`QR code for ${value}`}
    >
      <rect x={0} y={0} width={n} height={n} fill="var(--color-fixed-light)" />
      {modules.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="var(--color-neutral-950)" />
      ))}
    </svg>
  )
}

/* A 29×29 grid — the module count of a version-3 code, which is the size a
   short URL actually lands on. */
const MODULES = 29

function buildModules(value: string): [number, number][] {
  const on: [number, number][] = []
  const reserved = (x: number, y: number) =>
    inFinder(x, y) || inAlignment(x, y) || x === 6 || y === 6

  /* The three finders: a 7×7 ring with a 3×3 centre, at three corners. */
  for (const [ox, oy] of [
    [0, 0],
    [MODULES - 7, 0],
    [0, MODULES - 7],
  ]) {
    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
        if (edge || core) on.push([ox + x, oy + y])
      }
    }
  }

  /* The alignment square, bottom right. */
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      const edge = x === 0 || y === 0 || x === 4 || y === 4
      const core = x === 2 && y === 2
      if (edge || core) on.push([MODULES - 9 + x, MODULES - 9 + y])
    }
  }

  /* The timing lines — alternating modules joining the finders. */
  for (let i = 8; i < MODULES - 8; i++) {
    if (i % 2 === 0) {
      on.push([i, 6])
      on.push([6, i])
    }
  }

  /* …and the data, from a small string hash so one code always draws itself
     the same way. */
  let seed = 2166136261
  for (const ch of value) {
    seed ^= ch.charCodeAt(0)
    seed = Math.imul(seed, 16777619) >>> 0
  }
  const next = () => {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    seed >>>= 0
    return seed / 4294967296
  }
  for (let y = 0; y < MODULES; y++) {
    for (let x = 0; x < MODULES; x++) {
      if (reserved(x, y)) continue
      if (next() > 0.52) on.push([x, y])
    }
  }
  return on
}

function inFinder(x: number, y: number): boolean {
  const near = (a: number, b: number) => a >= b && a <= b + 7
  return (
    (near(x, 0) && near(y, 0)) ||
    (near(x, MODULES - 8) && near(y, 0)) ||
    (near(x, 0) && near(y, MODULES - 8))
  )
}

function inAlignment(x: number, y: number): boolean {
  return x >= MODULES - 10 && x <= MODULES - 4 && y >= MODULES - 10 && y <= MODULES - 4
}
