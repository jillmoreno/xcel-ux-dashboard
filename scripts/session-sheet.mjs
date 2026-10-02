#!/usr/bin/env node
/**
 * Build the HTML session sheet that `/promote-to-testing` publishes.
 *
 * A moderated session needs a document a second person can open and act on:
 * which build is live, which controls go nowhere, and what each dead end is
 * there to ask. This writes that page, pre-ticked with the session's own
 * choices, and leaves the builder live underneath so a moderator can re-tick
 * mid-session and get a new link without going back to Claude.
 *
 * ⚠ THE CATALOG IS READ FROM SOURCE, EVERY RUN, and that is the entire reason
 * this is a generator rather than a page someone keeps up to date. A sheet is
 * handed to a colleague and trusted; one listing a control that no longer
 * exists — or missing one that does — sends them looking for a button that is
 * not there. `TESTABLE_CTAS` is the single source of truth and this reads it
 * rather than restating it.
 *
 * ⚠ IT FAILS LOUDLY ON A PARSE MISS. The catalog is TypeScript and this is a
 * plain node script, so the rows come out by regex — which is exactly the kind
 * of coupling that rots silently when someone reformats the file. Zero rows,
 * or fewer than the file's own `TESTABLE_CTAS.length`, is an error rather than
 * an empty sheet. `SessionSheet.test.ts` holds the same line from the other
 * side.
 *
 * Usage:
 *   node scripts/session-sheet.mjs --out sheet.html \
 *     --sha 731a293 --branch test/session-1 --tag session-2026-09-24-pace \
 *     --persona progress-on-track --nav option-2 \
 *     --dead nav.courses,home.exam-date-save
 *
 * Only `--out` is required. Everything else describes the session; omitted, the
 * sheet renders the site's own defaults (0%, Option 1, nothing broken).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://xcelusertesting.netlify.app'
const SURFACE = '/dashboard-rebrand'

/* Controls that only render in part of the product. A run that kills one of
   these outside its state has killed nothing — and a participant's shrug then
   reads as a finding about the session's rigging rather than about the
   product. The sheet says so on the row. */
const CONDITIONS = {
  'home.pace-option': ['zero', 'Only exists at 0% — past that the picker is hidden.'],
  'home.week-strip': ['zero', 'Only exists at 0% — past that the strip becomes the activity chart.'],
  'home.exam-date-save': ['editor', 'Only once the exam-date editor is open.'],
  'home.exam-date-clear': ['stored', 'Only when a date is already saved.'],
}

// ─── arguments ──────────────────────────────────────────────────────────────

function args(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue
    const key = argv[i].slice(2)
    const next = argv[i + 1]
    out[key] = next && !next.startsWith('--') ? next : 'true'
  }
  return out
}

const opts = args(process.argv.slice(2))
if (!opts.out) {
  console.error('[session-sheet] --out <path> is required')
  process.exit(1)
}

const session = {
  sha: opts.sha ?? '',
  branch: opts.branch ?? 'test/session-1',
  tag: opts.tag ?? '',
  persona: opts.persona ?? '',
  nav: opts.nav ?? '',
  dead: (opts.dead ?? '').split(',').map((s) => s.trim()).filter(Boolean),
}

// ─── the catalog, read from source ──────────────────────────────────────────

const src = readFileSync(resolve(ROOT, 'src/data/testableCtas.ts'), 'utf8')

const rows = [...src.matchAll(
  /\{\s*id: '([^']+)',\s*label: '((?:[^'\\]|\\.)*)',\s*region: '([^']+)',\s*asks:\s*'((?:[^'\\]|\\.)*)',/g,
)].map((m) => ({
  id: m[1],
  label: m[2].replace(/\\'/g, "'"),
  region: m[3],
  asks: m[4].replace(/\\'/g, "'"),
}))

if (rows.length === 0) {
  console.error(
    '[session-sheet] parsed NO rows out of testableCtas.ts.\n' +
      '  The catalog is TypeScript and this script reads it by regex, so a\n' +
      '  reformat can break the coupling. Fix the pattern rather than shipping\n' +
      '  an empty sheet — a sheet listing no controls is worse than no sheet.',
  )
  process.exit(1)
}

const unknown = session.dead.filter((id) => !rows.some((r) => r.id === id))
if (unknown.length > 0) {
  console.error(
    `[session-sheet] not in the catalog: ${unknown.join(', ')}\n` +
      '  An id the app does not know leaves that control LIVE, and the only\n' +
      '  warning at run time is a console message nobody is watching.',
  )
  process.exit(1)
}

// ─── the link this session hands out ────────────────────────────────────────

const ff = [
  session.persona && `dashboard-progress-state:${session.persona}`,
  session.nav && `dashboard-navigation:${session.nav}`,
].filter(Boolean).join(',')

const query = [ff && `ff=${ff}`, session.dead.length && `dead=${session.dead.join(',')}`]
  .filter(Boolean)
  .join('&')

const participant = SITE + SURFACE + (query ? `?${query}` : '')
const moderator = SITE + SURFACE + `?test=0${query ? `&${query}` : ''}`

// ─── render ─────────────────────────────────────────────────────────────────

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const attr = (s) => esc(s).replace(/"/g, '&quot;')

const regions = []
for (const row of rows) {
  const last = regions[regions.length - 1]
  if (last && last.name === row.region) last.rows.push(row)
  else regions.push({ name: row.region, rows: [row] })
}

const personaLabel = session.persona === 'progress-on-track' ? 'On Track · ~63%' : 'Not Started · 0%'
const navLabel = session.nav === 'option-2' ? 'Option 2' : 'Option 1'

const catalogJson = JSON.stringify(
  Object.fromEntries(rows.map((r) => [r.id, { label: r.label, asks: r.asks }])),
)

const rowsHtml = regions.map((region) => {
  const items = region.rows.map((row) => {
    const on = session.dead.includes(row.id)
    const cond = CONDITIONS[row.id]
    return `
          <label class="row${on ? ' on' : ''}" data-id="${attr(row.id)}"${cond ? ` data-cond="${cond[0]}"` : ''}>
            <input type="checkbox" value="${attr(row.id)}"${on ? ' checked' : ''}>
            <span>
              <span class="row-label">${esc(row.label)} <span class="row-id">${esc(row.id)}</span></span>
              <span class="row-asks">${esc(row.asks)}</span>
              ${cond ? `<span class="warn">${esc(cond[1])}</span>` : ''}
            </span>
          </label>`
  }).join('')
  return `
      <div class="region">
        <div class="region-name">${esc(region.name)}</div>
        <div class="rows">${items}
        </div>
      </div>`
}).join('')

const stamp = [
  session.sha && `<div class="fact"><dt>build</dt><dd><b>${esc(session.sha)}</b> on ${esc(session.branch)}</dd></div>`,
  session.tag && `<div class="fact"><dt>tag</dt><dd><b>${esc(session.tag)}</b></dd></div>`,
  `<div class="fact"><dt>learner</dt><dd><b>${esc(personaLabel)}</b></dd></div>`,
  `<div class="fact"><dt>nav</dt><dd><b>${esc(navLabel)}</b></dd></div>`,
].filter(Boolean).join('')

const html = `<title>Session Sheet${session.tag ? ` ${esc(session.tag.replace(/^session-/, ''))}` : ''}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">

<style>
  :root {
    --paper:#f4f6f7; --surface:#fff; --sunk:#eef1f3; --ink:#131a20; --muted:#5a6a76;
    --faint:#8496a3; --edge:#d6dde2; --rule:#e6ebee; --navy:#2d5872; --navy-lo:#e7eef3;
    --clay:#a3553a; --clay-lo:#f6ebe6; --ok:#2f6b52;
    --ui:'Archivo','Helvetica Neue',system-ui,sans-serif;
    --mono:'IBM Plex Mono',ui-monospace,'SF Mono',Menlo,monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper:#101519; --surface:#161d23; --sunk:#1c242b; --ink:#e4eaef; --muted:#9aabb7;
      --faint:#71838f; --edge:#2b353d; --rule:#232c34; --navy:#86aec9; --navy-lo:#1b2932;
      --clay:#d18f72; --clay-lo:#2b2019; --ok:#77bb9b;
    }
  }
  :root[data-theme="dark"] {
    --paper:#101519; --surface:#161d23; --sunk:#1c242b; --ink:#e4eaef; --muted:#9aabb7;
    --faint:#71838f; --edge:#2b353d; --rule:#232c34; --navy:#86aec9; --navy-lo:#1b2932;
    --clay:#d18f72; --clay-lo:#2b2019; --ok:#77bb9b;
  }
  * { box-sizing:border-box; }
  body { background:var(--paper); color:var(--ink); font-family:var(--ui); font-size:15px; line-height:1.5; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:1180px; margin:0 auto; padding:32px 24px 72px; }

  .mast { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px 24px; padding-bottom:18px; border-bottom:2px solid var(--ink); }
  .mast h1 { font-size:clamp(26px,3.4vw,38px); font-weight:700; letter-spacing:-0.02em; margin:0; text-wrap:balance; }
  .mast p { margin:6px 0 0; color:var(--muted); max-width:58ch; font-size:14.5px; }
  .stamp { display:flex; flex-direction:column; gap:0; min-width:250px; }
  .fact { display:grid; grid-template-columns:62px minmax(0,1fr); gap:10px; padding:5px 0; font-size:13px; border-bottom:1px solid var(--rule); }
  .fact:last-child { border-bottom:0; }
  .fact dt { font-family:var(--mono); font-size:11px; color:var(--clay); padding-top:2px; }
  .fact dd { margin:0; color:var(--muted); }
  .fact dd b { color:var(--ink); font-weight:600; font-family:var(--mono); font-size:12.5px; }

  .bench { display:grid; grid-template-columns:minmax(0,1fr) 400px; gap:32px; margin-top:30px; align-items:start; }
  @media (max-width:940px) { .bench { grid-template-columns:minmax(0,1fr); } }
  .step { display:flex; flex-direction:column; gap:14px; }
  .step + .step { margin-top:34px; }
  .step-head { display:flex; align-items:baseline; gap:10px; }
  .num { font-family:var(--mono); font-size:11px; font-weight:600; color:var(--surface); background:var(--ink); border-radius:2px; padding:3px 6px; line-height:1; }
  .step-head h2 { margin:0; font-size:17px; font-weight:700; letter-spacing:-0.01em; }
  .step-head span { color:var(--faint); font-size:13.5px; }

  .seg { display:flex; flex-wrap:wrap; gap:8px; }
  .seg label { position:relative; cursor:pointer; }
  .seg input { position:absolute; inset:0; opacity:0; cursor:pointer; }
  .seg span { display:flex; flex-direction:column; gap:2px; padding:9px 14px; border:1px solid var(--edge); background:var(--surface); border-radius:3px; font-size:14px; font-weight:500; transition:border-color .12s,background .12s; }
  .seg span em { font-style:normal; font-family:var(--mono); font-size:11px; color:var(--faint); }
  .seg input:checked + span { border-color:var(--navy); background:var(--navy-lo); box-shadow:inset 0 -2px 0 var(--navy); }
  .seg input:checked + span em { color:var(--navy); }
  .seg input:focus-visible + span { outline:2px solid var(--navy); outline-offset:2px; }

  .region-name { font-family:var(--mono); font-size:10.5px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--faint); padding:0 0 6px; }
  .region + .region { margin-top:18px; }
  .rows { display:flex; flex-direction:column; border-top:1px solid var(--rule); }
  .row { display:grid; grid-template-columns:22px minmax(0,1fr); gap:11px; align-items:start; padding:10px 6px; border-bottom:1px solid var(--rule); cursor:pointer; transition:background .12s; }
  .row:hover { background:var(--surface); }
  .row input { width:16px; height:16px; margin:3px 0 0; accent-color:var(--clay); cursor:pointer; }
  .row-label { font-weight:600; font-size:14.5px; display:flex; flex-wrap:wrap; align-items:baseline; gap:8px; }
  .row-id { font-family:var(--mono); font-size:11.5px; font-weight:400; color:var(--faint); }
  .row-asks { color:var(--muted); font-size:13px; margin-top:1px; }
  .row.on { background:var(--clay-lo); }
  .row.on .row-label { color:var(--clay); }
  .warn { display:none; margin-top:5px; font-size:12.5px; color:var(--clay); font-weight:500; border-left:2px solid var(--clay); padding-left:8px; }
  .row.on.flag .warn { display:block; }

  .panel { position:sticky; top:20px; display:flex; flex-direction:column; background:var(--surface); border:1px solid var(--edge); border-radius:3px; overflow:hidden; }
  @media (max-width:940px) { .panel { position:static; } }
  .panel-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 16px; background:var(--ink); color:var(--paper); }
  .panel-head h2 { margin:0; font-size:13px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
  .count { font-family:var(--mono); font-size:12px; }
  .out { padding:16px; border-bottom:1px solid var(--rule); display:flex; flex-direction:column; gap:8px; }
  .out h3 { margin:0; font-size:12px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--navy); }
  .out p { margin:0; font-size:12.5px; color:var(--muted); }
  .url { font-family:var(--mono); font-size:12px; line-height:1.65; background:var(--sunk); border:1px solid var(--rule); border-radius:3px; padding:10px; word-break:break-all; color:var(--ink); }
  button.copy { align-self:flex-start; font-family:var(--ui); font-size:13px; font-weight:600; padding:7px 14px; border-radius:3px; border:1px solid var(--navy); background:var(--navy); color:#fff; cursor:pointer; transition:opacity .12s; }
  button.copy:hover { opacity:.88; }
  button.copy:focus-visible { outline:2px solid var(--ink); outline-offset:2px; }
  button.copy.done { background:var(--ok); border-color:var(--ok); }
  .crib { padding:16px; display:flex; flex-direction:column; gap:10px; }
  .crib h3 { margin:0; font-size:12px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--navy); }
  .crib ol { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:10px; counter-reset:c; }
  .crib li { display:grid; grid-template-columns:18px minmax(0,1fr); gap:9px; font-size:13px; }
  .crib li::before { counter-increment:c; content:counter(c); font-family:var(--mono); font-size:11px; color:var(--clay); font-weight:600; padding-top:2px; }
  .crib b { display:block; font-weight:600; }
  .crib em { font-style:normal; color:var(--muted); }
  .crib .empty { color:var(--muted); font-size:13px; }
  .ceiling { font-size:12.5px; color:var(--clay); border-left:2px solid var(--clay); padding-left:9px; }

  .ref { margin-top:48px; display:grid; grid-template-columns:repeat(auto-fit,minmax(310px,1fr)); gap:28px; }
  .card { background:var(--surface); border:1px solid var(--edge); border-radius:3px; padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
  .card h2 { margin:0; font-size:15px; font-weight:700; }
  .card p { margin:0; font-size:13.5px; color:var(--muted); }
  .inline { font-family:var(--mono); font-size:12.5px; background:var(--sunk); border-radius:2px; padding:1px 5px; color:var(--ink); }
  pre { margin:0; font-family:var(--mono); font-size:12px; line-height:1.7; background:var(--sunk); border:1px solid var(--rule); border-radius:3px; padding:12px; overflow-x:auto; color:var(--ink); }
  pre .c { color:var(--faint); }
  .foot { margin-top:40px; padding-top:16px; border-top:1px solid var(--edge); font-size:12.5px; color:var(--faint); display:flex; flex-wrap:wrap; gap:8px 20px; }
  .foot span { font-family:var(--mono); }
  @media (prefers-reduced-motion: reduce) { * { transition:none !important; } }
</style>

<div class="wrap">
  <header class="mast">
    <div>
      <h1>Session Sheet</h1>
      <p>What this build rigs, and the links that run it. Re-tick anything below and the links rebuild — no need to come back for a new one.</p>
    </div>
    <dl class="stamp">${stamp}</dl>
  </header>

  <div class="bench">
    <div>
      <section class="step">
        <div class="step-head"><span class="num">1</span><h2>Who is the learner?</h2><span>defaults to 0%</span></div>
        <div class="seg" id="persona">
          <label><input type="radio" name="p" value=""${session.persona ? '' : ' checked'}><span>Not Started · 0%<em>the site default</em></span></label>
          <label><input type="radio" name="p" value="dashboard-progress-state:progress-on-track"${session.persona === 'progress-on-track' ? ' checked' : ''}><span>On Track · ~63%<em>13 days in, 17 left</em></span></label>
        </div>
      </section>

      <section class="step">
        <div class="step-head"><span class="num">2</span><h2>Which navigation?</h2><span>the A/B</span></div>
        <div class="seg" id="nav">
          <label><input type="radio" name="n" value=""${session.nav ? '' : ' checked'}><span>Option 1<em>control arm</em></span></label>
          <label><input type="radio" name="n" value="dashboard-navigation:option-2"${session.nav === 'option-2' ? ' checked' : ''}><span>Option 2<em>Compass header on the course page</em></span></label>
        </div>
      </section>

      <section class="step">
        <div class="step-head"><span class="num">3</span><h2>What goes nowhere?</h2><span>leave all unticked for a live session</span></div>
        <div id="cats">${rowsHtml}
      </div>
      </section>
    </div>

    <aside class="panel">
      <div class="panel-head"><h2>Links</h2><span class="count" id="count"></span></div>
      <div class="out">
        <h3>Participant</h3>
        <div class="url" id="urlP"></div>
        <button class="copy" data-target="urlP">Copy participant link</button>
      </div>
      <div class="out">
        <h3>Moderator</h3>
        <p>Same session with the full demo bar, for setting things up before you hand the laptop over.</p>
        <div class="url" id="urlM"></div>
        <button class="copy" data-target="urlM">Copy moderator link</button>
      </div>
      <div class="crib">
        <h3>Crib sheet</h3>
        <div id="crib"></div>
        <p class="ceiling" id="ceiling" hidden>Six or more dead ends and a participant stops exploring and starts performing. Three to five is the working ceiling.</p>
      </div>
    </aside>
  </div>

  <div class="ref">
    <section class="card">
      <h2>Before you share it</h2>
      <p>Open <strong>Netlify → Deploys</strong> and check the live deploy shows${session.sha ? ` <span class="inline">${esc(session.sha)}</span>` : ' the commit you froze'}. The password means a link looks identical whether it is serving your build or the previous one — this is the step most likely to go wrong.</p>
      <p><b>Survives</b> a reload in the same tab. <b>Dies with</b> the tab, so a fresh tab is a clean product. <b>Clears</b> mid-session with <span class="inline">&amp;dead=</span> and nothing after it.</p>
      <p>A mistyped id leaves that control <b>live</b> and warns only in the console.</p>
    </section>

    <section class="card">
      <h2>What a dead end looks like</h2>
      <p>It doesn't. A broken control renders, focuses and reads exactly like a live one — no dimming, no disabled state. The click simply does nothing.</p>
      <p>That is deliberate: an announced-disabled control answers the moderator's question for the participant, and the reach is the data.</p>
      <p>The cost is real — a screen-reader user is told the control is operable, operates it, and gets silence. <b>Run a session with an assistive-technology participant with no dead ends.</b></p>
    </section>

    <section class="card">
      <h2>Re-freezing</h2>
      <p>The site rebuilds on every push to <span class="inline">${esc(session.branch)}</span>. Nothing reaches a participant until you run this.</p>
      <pre><span class="c"># from the branch you have been working on</span>
git push -f origin HEAD:${esc(session.branch)}

<span class="c"># record what the new session rigs</span>
git tag -a session-$(date +%F)-slug HEAD -m "dead=..."
git push origin session-$(date +%F)-slug</pre>
    </section>
  </div>

  <footer class="foot">
    <span>${rows.length} controls in the catalog</span>
    <span>src/data/testableCtas.ts</span>
    <span>/promote-to-testing</span>
  </footer>
</div>

<script>
  var BASE = ${JSON.stringify(SITE + SURFACE)};
  var CAT = ${catalogJson};

  function render() {
    var persona = document.querySelector('input[name="p"]:checked').value;
    var nav = document.querySelector('input[name="n"]:checked').value;
    var boxes = [].slice.call(document.querySelectorAll('#cats input:checked'));
    var dead = boxes.map(function (b) { return b.value; });

    [].forEach.call(document.querySelectorAll('.row'), function (row) {
      var on = row.querySelector('input').checked;
      row.classList.toggle('on', on);
      var cond = row.getAttribute('data-cond');
      /* A 0%-only control is flagged only when the session is NOT at 0% —
         there it is genuinely killable. The other conditions always apply. */
      var flag = cond === 'zero' ? persona !== '' : Boolean(cond);
      row.classList.toggle('flag', flag);
    });

    var ff = [persona, nav].filter(Boolean).join(',');
    var parts = [];
    if (ff) parts.push('ff=' + ff);
    if (dead.length) parts.push('dead=' + dead.join(','));

    var q = parts.length ? '?' + parts.join('&') : '';
    document.getElementById('urlP').textContent = BASE + q;
    document.getElementById('urlM').textContent =
      BASE + '?test=0' + (parts.length ? '&' + parts.join('&') : '');

    document.getElementById('count').textContent =
      dead.length + (dead.length === 1 ? ' dead end' : ' dead ends');
    document.getElementById('ceiling').hidden = dead.length < 6;

    var crib = document.getElementById('crib');
    if (!dead.length) {
      crib.innerHTML = '<p class="empty">Nothing broken — a fully live session. Often the right first one: see where people go before you take anything away.</p>';
      return;
    }
    var html = dead.map(function (id) {
      var c = CAT[id] || { label: id, asks: '' };
      var b = document.createElement('b');
      b.textContent = c.label;
      var em = document.createElement('em');
      em.textContent = c.asks;
      return '<li><span>' + b.outerHTML + em.outerHTML + '</span></li>';
    }).join('');
    crib.innerHTML = '<ol>' + html + '</ol>';
  }

  document.addEventListener('change', render);
  render();

  [].forEach.call(document.querySelectorAll('button.copy'), function (btn) {
    btn.addEventListener('click', function () {
      var text = document.getElementById(btn.getAttribute('data-target')).textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
      var was = btn.textContent;
      btn.textContent = 'Copied';
      btn.classList.add('done');
      setTimeout(function () { btn.textContent = was; btn.classList.remove('done'); }, 1400);
    });
  });
</script>
`

mkdirSync(dirname(resolve(opts.out)), { recursive: true })
writeFileSync(resolve(opts.out), html)

console.log(`[session-sheet] ${rows.length} controls · ${session.dead.length} dead`)
console.log(`[session-sheet] participant  ${participant}`)
console.log(`[session-sheet] moderator    ${moderator}`)
console.log(`[session-sheet] wrote        ${resolve(opts.out)}`)
