"""Generates the topo contours for the Invite & Purchase loading page:
a scalar field of a few hills, marching squares at evenly spaced levels,
Douglas-Peucker simplified, emitted as SVG path strings in a TS module."""
import math, sys

W, H, STEP = 1600, 1000, 8
HILLS = [  # (cx, cy, sigma, amplitude)
    (380, 300, 260, 1.0),
    (1180, 260, 200, 0.75),
    (900, 760, 320, 0.9),
    (260, 860, 180, 0.55),
    (1450, 700, 150, 0.5),
    (700, 480, 120, -0.35),  # a basin, so a few rings close the other way
    (1300, 950, 140, 0.45),
    (80, 120, 160, 0.4),
    (560, 980, 110, -0.3),
    (1050, 500, 90, 0.3),
]
def field(x, y):
    f = 0.0
    for cx, cy, s, a in HILLS:
        f += a * math.exp(-((x-cx)**2 + (y-cy)**2) / (2*s*s))
    f += 0.08 * math.sin(x/170) * math.cos(y/130) + 0.05 * math.sin((x+y)/260)
    return f

nx, ny = W//STEP + 1, H//STEP + 1
grid = [[field(i*STEP, j*STEP) for i in range(nx)] for j in range(ny)]
lo = min(min(r) for r in grid); hi = max(max(r) for r in grid)
LEVELS = [lo + (hi-lo) * (k+1)/31 for k in range(30)]

def lerp(p, q, fp, fq, lvl):
    t = 0.5 if fq == fp else (lvl - fp)/(fq - fp)
    return (p[0] + (q[0]-p[0])*t, p[1] + (q[1]-p[1])*t)

def segments(lvl):
    segs = []
    for j in range(ny-1):
        for i in range(nx-1):
            f = [grid[j][i], grid[j][i+1], grid[j+1][i+1], grid[j+1][i]]
            c = [(i*STEP, j*STEP), ((i+1)*STEP, j*STEP), ((i+1)*STEP, (j+1)*STEP), (i*STEP, (j+1)*STEP)]
            idx = sum(1 << k for k in range(4) if f[k] >= lvl)
            if idx in (0, 15): continue
            e = lambda a, b: lerp(c[a], c[b], f[a], f[b], lvl)
            E = {0: e(0,1), 1: e(1,2), 2: e(2,3), 3: e(3,0)}
            table = {1:[(3,0)],2:[(0,1)],3:[(3,1)],4:[(1,2)],6:[(0,2)],7:[(3,2)],8:[(2,3)],
                     9:[(0,2)],11:[(1,2)],12:[(3,1)],13:[(0,1)],14:[(3,0)]}
            if idx in (5, 10):
                centre = sum(f)/4 >= lvl
                if (idx == 5) == centre: pairs = [(3,0),(1,2)]
                else: pairs = [(0,1),(2,3)]
            else: pairs = table[idx]
            for a, b in pairs: segs.append((E[a], E[b]))
    return segs

def key(p): return (round(p[0], 2), round(p[1], 2))

def join(segs):
    adj = {}
    for a, b in segs:
        adj.setdefault(key(a), []).append(key(b)); adj.setdefault(key(b), []).append(key(a))
    seen = set(); lines = []
    def walk(start):
        line = [start]; seen.add(start); cur = start
        while True:
            nxt = [n for n in adj[cur] if n not in seen]
            if not nxt: return line
            cur = nxt[0]; seen.add(cur); line.append(cur)
    # open lines first (endpoints with one neighbour), then the closed rings
    for p, ns in adj.items():
        if len(ns) == 1 and p not in seen:
            lines.append((walk(p), False))
    for p in adj:
        if p not in seen:
            l = walk(p); lines.append((l, True))
    return lines

def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0]-a[0], b[1]-a[1]; n = math.hypot(dx, dy) or 1e-9
    dmax, idx = 0, 0
    for k in range(1, len(pts)-1):
        d = abs(dy*pts[k][0] - dx*pts[k][1] + b[0]*a[1] - b[1]*a[0]) / n
        if d > dmax: dmax, idx = d, k
    if dmax > tol:
        return simplify(pts[:idx+1], tol)[:-1] + simplify(pts[idx:], tol)
    return [a, b]

def fmt(v): return f"{v:.1f}".rstrip('0').rstrip('.')
paths = []
for li, lvl in enumerate(LEVELS):
    for pts, closed in join(segments(lvl)):
        if len(pts) < 6: continue
        if closed: pts = pts + [pts[0]]
        pts = simplify(pts, 0.9)
        if len(pts) < 4: continue
        d = "M" + " L".join(f"{fmt(x)} {fmt(y)}" for x, y in pts) + ("Z" if closed else "")
        paths.append((d, li % 5 == 4))

out = sys.argv[1]
with open(out, "w") as f:
    f.write("/* GENERATED — the topo contours behind the Invite & Purchase flow's loading\n")
    f.write("   page (2026-10-15, Jillienne: \"a topo map layout in the background, very\n")
    f.write("   light gray\"). A scalar field of ten hills (two basins), marching squares\n")
    f.write("   at 30 evenly spaced levels, Douglas-Peucker simplified; the generator is\n")
    f.write("   `scripts/topo-contours.py`. Coordinates are in a 1600 × 1000 box that the\n")
    f.write("   component slices to cover the page. */\n\n")
    f.write(f"export const TOPO_VIEWBOX = '0 0 {W} {H}'\n\n")
    f.write("/** `major`: an index contour, drawn a touch heavier, as on a map. */\n")
    f.write("export const TOPO_CONTOURS: readonly { d: string; major: boolean }[] = [\n")
    for d, major in paths: f.write(f"  {{ d: '{d}', major: {str(major).lower()} }},\n")
    f.write("]\n")
print(f"{len(paths)} paths")
