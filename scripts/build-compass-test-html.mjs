#!/usr/bin/env node
/**
 * Build the PARTICIPANT copy of the Compass staged HTML prototype.
 *
 * 2026-11-13. The export Jillienne keeps in Downloads
 * (`Compass-Learner-Stages-Desktop-<date>.html`) is one file carrying 29
 * pages, a "Pages" picker, a dark "Prototype" stage bar on every page and a
 * "Demo settings" dialog in the course. A user-test participant must see none
 * of that — so this script reads the export and writes
 * `public/demos/compass-course-test.html`, which:
 *
 *   - keeps THREE pages: Overview (Main), Learn and Course — the first-time
 *     learner's path from "Start lesson" into the lesson reader;
 *   - drops the Pages picker and the history hash (`#Course`) navigation;
 *   - hides the stage bar, the Demo settings button and its "Demo only"
 *     caption with CSS injected into every page;
 *   - pins the learner stage to Q1 (first-time learner · 0%) and clears any
 *     remembered Demo settings / message-mode / contents-style choice on
 *     every load, so each participant starts the same way;
 *   - inlines the React runtime rather than serving it from a blob: URL, so
 *     the file also renders under a strict CSP (the Artifact preview);
 *   - answers a link to any dropped page with a quiet toast rather than a
 *     silent nothing — an unmoderated tester cannot be asked "what did you
 *     expect?", so a dead end must at least say it is one.
 *
 * Usage:  node scripts/build-compass-test-html.mjs <path-to-export.html>
 *
 * Not wired into the build. Re-run it when a new export lands; the output is
 * committed and served as a static file. `public/demos/` is reachable on the
 * testing build (only `/prototypes/*` is 404'd there — see
 * `scripts/public-redirects.mjs`).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/* Usage:
     node scripts/build-compass-test-html.mjs <export.html> [--out <name>.html]
       [--keep Main,Learn,Course] [--start Main] [--stage q1]
   Defaults are the course-content session of 2026-11-13. A second session is
   a second --out beside the first — static files, so one test branch can
   carry several participant links at once, each frozen on its own. */
const argv = process.argv.slice(2)
const src = argv.find((a) => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--'))
const opt = (name, dflt) => {
  const i = argv.indexOf('--' + name)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt
}
if (!src) {
  console.error('usage: node scripts/build-compass-test-html.mjs <export.html> [--out name.html] [--keep A,B] [--start A] [--stage q1]')
  process.exit(1)
}
const out = join(root, 'public', 'demos', opt('out', 'compass-course-test.html'))
const KEEP = opt('keep', 'Main,Learn,Course').split(',').map((p) => p.trim() + '.dc.html')
const START = opt('start', KEEP[0].replace('.dc.html', '')) + '.dc.html'
const STAGE = opt('stage', 'q1')
/* Rubi message mode: 'current' or 'new' (LX 11-2). The prototype defaults to
   current when nothing is stored; pinning it makes the session's record say so. */
const MSG = opt('msg', 'current')
if (!KEEP.includes(START)) {
  console.error(`--start ${START} is not in --keep`)
  process.exit(1)
}

const text = readFileSync(src, 'utf8')
const pagesLine = text.split('\n').find((l) => l.startsWith('var PAGES = '))
const rtLine = text.split('\n').find((l) => l.startsWith('var RT = '))
if (!pagesLine || !rtLine) {
  console.error('could not find PAGES / RT in the export — is this the staged prototype?')
  process.exit(1)
}
const PAGES = JSON.parse(pagesLine.replace(/^var PAGES = /, '').replace(/;$/, ''))
const RT = JSON.parse(rtLine.replace(/^var RT = /, '').replace(/;$/, ''))
for (const k of KEEP) {
  if (!PAGES[k]) {
    console.error(`export has no page "${k}" — pages are: ${Object.keys(PAGES).join(', ')}`)
    process.exit(1)
  }
}
/* The runtime is inlined into a <script>, so the HTML parser sees its text.
   It contains `<!--` and `<script` inside JS string literals, and in script
   data that pair puts the parser into the "double escaped" state where the
   real </script> no longer closes the element — the rest of the page is
   swallowed as script and the first page never renders. `\x3c` is `<` to the
   JS engine and nothing to the HTML parser. Every occurrence in this runtime
   sits inside a string literal, which the check below pins. */
const RISKY = /<!--|<\/?script/g
const risky = RT.match(RISKY) || []
const inlinedRT = RT.replace(RISKY, (m) => '\\x3c' + m.slice(1))
if (risky.length && !/\\x3c/.test(inlinedRT)) {
  console.error('runtime escape failed')
  process.exit(1)
}

/* What every kept page gets, just before </head>. CSS rather than DOM
   surgery because the pages re-render their chrome (the Contents aside
   collapses and comes back), and a rule survives a re-render. */
const INJECT = `<style data-participant>
[aria-label="Prototype stage selector"]{display:none !important}
#demo-btn,#demo-btn + p{display:none !important}
div:has(> #demo-btn){display:none !important}
</style>`

/* The pages keep the `<script src="__RT__">` placeholder. The runtime is
   spliced in by the wrapper, at load, into the srcdoc ONLY — the copy the
   runtime fetches back as its template source (`parent.__curSrc`) must NOT
   carry the runtime's text, because the runtime finds its template by
   scanning that source for tags and the inlined runtime is full of tags in
   strings (`<x-dc>`, `<body>`…): it rendered its own minified source as the
   page. Keeping the runtime out of the source also stores it once, not per
   page. */
const pages = {}
for (const k of KEEP) {
  pages[k] = PAGES[k].replace('</head>', () => INJECT + '\n</head>')
}

/* localStorage keys the staged prototype reads. Cleared or pinned on every
   load — the iframe is srcdoc, so it shares the wrapper's origin and storage. */
const RESET = `
try {
  localStorage.setItem('compass-stage-v1', ${JSON.stringify(STAGE)});
  localStorage.setItem('compass-msg-v1', ${JSON.stringify(MSG)});
  ['compassB.demo','compass-toc-v1','compass-rubinudge-v1','compass-fc-sel','compass-exam-provider']
    .forEach(function (k) { localStorage.removeItem(k); });
} catch (e) {}`

/* JSON that lives INSIDE a <script> must not contain `</script>` — the HTML
   parser ends the script there, whatever the JS says, and the rest of the
   data shows on screen as text (it did: raw `{{stageHint}}` and `\\n`
   everywhere). `\\u003c` is `<` to JSON and nothing to the HTML parser; the
   original export does the same. */
const inScript = (v) => JSON.stringify(v).replace(/</g, '\\u003c')

const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>XCEL Compass</title>
<style>
html,body{margin:0;height:100%;background:#FFFFFF;font-family:'Open Sans',system-ui,sans-serif}
#frame{position:fixed;inset:0;width:100%;height:100%;border:0;display:block}
#toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:20;max-width:min(92vw,520px);padding:12px 18px;border-radius:10px;background:#1F1D18;color:#FFFFFF;font-size:14px;line-height:1.4;box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .2s}
#toast[data-on]{opacity:1}
</style>
</head>
<body>
<iframe id="frame" title="XCEL Compass"></iframe>
<div id="toast" role="status" aria-live="polite"></div>
<script>
${RESET}
var PAGES = ${inScript(pages)};
var RT = ${inScript(inlinedRT)};
var frame = document.getElementById('frame');
var toast = document.getElementById('toast'), toastT = null;
function say(msg) {
  toast.textContent = msg; toast.setAttribute('data-on', '');
  clearTimeout(toastT); toastT = setTimeout(function () { toast.removeAttribute('data-on'); }, 3200);
}
function go(name) {
  if (!PAGES[name]) { say('That part of Compass is not in this test. Please stay with your course.'); return; }
  window.__curSrc = PAGES[name];
  // Function replacer: the runtime contains "$&", which a string replacement would expand.
  // Spelled with \\x3c so the HTML parser never sees a closing script tag inside this script.
  frame.srcdoc = PAGES[name].replace('\\x3cscript src="__RT__">\\x3c/script>', function () { return '\\x3cscript>' + RT + '\\x3c/script>'; });
}
window.addEventListener('message', function (e) { if (e.data && e.data.__proto === 'go') go(e.data.page); });
go(${JSON.stringify(START)});
</script>
</body>
</html>
`

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, doc)
console.log(`wrote ${out} — ${(doc.length / 1024).toFixed(0)} KB, pages: ${KEEP.join(', ')}, start ${START}, stage ${STAGE}, Rubi messages ${MSG}`)
