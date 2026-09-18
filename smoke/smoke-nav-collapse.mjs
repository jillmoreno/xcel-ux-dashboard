import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

/* ============================================================
   smoke-nav-collapse.mjs — xcel-nav-collapse.html

   What this suite is actually for. Every other claim on that page is
   argued in prose; ONE of them is a behaviour, and it is the one the
   pattern is usually shipped without:

     the accessible name of a nav button must survive collapse, and must
     NOT come from the tooltip.

   So the assertions below are weighted towards that — the label element
   is still present and still contributes its text when the rail is
   collapsed, the tooltip is attached with aria-describedby rather than
   aria-labelledby, and deleting the tooltip entirely would leave every
   button still named. The rest cover the three concepts actually being
   three different things, and the WCAG 1.4.13 trio (dismissible,
   hoverable, persistent).

   Timing note: TIP_HOVER_DELAY is real, so the hover assertions await it.
   The focus assertions deliberately do NOT await anything — that is the
   claim (TIP_FOCUS_DELAY is 0), and an await would hide a regression.
   ============================================================ */

const html = fs.readFileSync(new URL('../public/prototypes/xcel-nav-collapse.html', import.meta.url), 'utf8');
const errs = [];
const vc = new VirtualConsole().on('jsdomError', e => errs.push(e.message));
/* `url` is not decoration: without an origin jsdom gives the document an
   opaque one and every localStorage access throws SecurityError. The page
   wraps its own reads in try/catch (so it survives a private window), which
   means a suite that did not set this would silently test a page whose
   persistence never ran. */
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
  virtualConsole: vc, url: 'https://xcel.test/prototypes/xcel-nav-collapse.html' });
const { window } = dom, D = window.document;
window.addEventListener('error', e => errs.push(e.message));

const q = s => D.querySelector(s), all = s => [...D.querySelectorAll(s)];
const click = (s, l) => {
  const el = typeof s === 'string' ? q(s) : s;
  if (!el) throw new Error('missing ' + (l || s));
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
};
const log = [], ck = (n, c, x = '') => log.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  — ' + x : ''));
const wait = ms => new Promise(r => setTimeout(r, ms));

/* The accessible name, approximated the way a browser computes it: the
   button's own text with every aria-hidden subtree removed. If this returns
   '' for a collapsed item, the pattern is broken no matter how the tooltip
   behaves. */
const accName = btn => {
  const c = btn.cloneNode(true);
  [...c.querySelectorAll('[aria-hidden="true"]')].forEach(n => n.remove());
  /* Browsers join the contributions of separate elements with a space. The
     naive textContent read gives "Study CalendarBehind", which would let a
     genuinely run-together name pass unnoticed. */
  return [...c.children].map(n => n.textContent).concat(
    [...c.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent)
  ).join(' ').replace(/\s+/g, ' ').trim();
};
const stage = () => q('#stage');
const collapsed = () => stage().getAttribute('data-collapsed') === 'true';
const concept = c => { click(all('#dConcept .dchip').find(b => b.dataset.con === c), 'chip ' + c); };
const toggle = () => click('#railToggle', 'toggle');

/* these must track the page constants */
const TIP_HOVER_DELAY = 400, TIP_CLOSE_GRACE = 120, FLYOUT_OPEN_DELAY = 220;

/* ---------- it mounts ---------- */
ck('page mounts with no script errors', errs.length === 0, errs.slice(0, 2).join(' | '));
ck('the real seven nav sections render', all('.ritem').length === 7, all('.ritem').length + ' items');
ck('both nav groups render as labelled groups',
   all('.rgroup[role="group"]').length === 2 &&
   all('.rgroup').every(g => (g.getAttribute('aria-label') || '').length > 0));
ck('three concepts on the demo axis', all('#dConcept .dchip').length === 3);
ck('three concept cards, one per axis value', all('.con').length === 3);
ck('every invented rule renders from the array', all('.invs .inv').length === 5,
   all('.invs .inv').length + ' rules');
ck('every invented rule names an owner', all('.invs .inv .o').every(o => o.textContent.trim().length > 0));
ck('the prototype bar links to its siblings', all('.pbar .plink').length >= 4);

/* ---------- the toggle ---------- */
const tg = () => q('#railToggle');
ck('starts expanded', !collapsed(), stage().getAttribute('data-collapsed'));
ck('toggle is a button carrying aria-expanded, not a switch',
   tg().tagName === 'BUTTON' && tg().getAttribute('role') === null &&
   tg().getAttribute('aria-expanded') === 'true');
ck('toggle points at the nav it controls',
   tg().getAttribute('aria-controls') === 'railNav' && !!q('#railNav'));
ck('expanded, the toggle is named for the ACTION it will perform',
   /collapse/i.test(accName(tg())), accName(tg()));

toggle();
ck('clicking it collapses the rail', collapsed());
ck('aria-expanded flips with the state', tg().getAttribute('aria-expanded') === 'false');
ck('collapsed, the toggle is renamed to the new action',
   /expand/i.test(accName(tg())), accName(tg()));
ck('the collapse choice is persisted', window.localStorage.getItem('xcel.nav.collapsed') === '1');

/* ---------- THE LOAD-BEARING CLAIM ---------- */
const names = () => all('.ritem').map(accName);
ck('collapsed, every nav button still has an accessible name',
   names().every(n => n.length > 0), JSON.stringify(names()));
ck('…and the names are the real labels, not glyphs',
   names().some(n => n.startsWith('Study Calendar')) && names().includes('Records & Certificates'),
   JSON.stringify(names()));
ck('the label element is CLIPPED, never removed from the DOM',
   all('.ritem').every(b => !!b.querySelector('.lbl')));
ck('the glyph is hidden from the accessibility tree',
   all('.ritem .g').every(g => g.getAttribute('aria-hidden') === 'true'));

/* The strongest form of the claim: delete the tooltip node outright and
   every button is still named. If this fails, the tooltip IS the name. */
{
  const tipNode = q('#tip'), parent = tipNode.parentNode, next = tipNode.nextSibling;
  tipNode.remove();
  ck('deleting the tooltip node leaves every button still named',
     names().every(n => n.length > 0));
  parent.insertBefore(tipNode, next);
}

/* The badge has nowhere to go collapsed — it becomes a dot. A dot is colour
   alone, so the WORD has to stay in the name. */
const cal = () => all('.ritem').find(b => /Study Calendar/.test(accName(b)));
ck('collapsed, the "Behind" badge keeps its word in the accessible name',
   /Behind/.test(accName(cal())), accName(cal()));

/* ---------- the tooltip contract ---------- */
const tip = () => q('#tip');
ck('there is exactly ONE tooltip node', all('[role="tooltip"]').length === 1);
ck('it is hidden while idle', tip().hidden === true);
ck('nothing is described by it while idle',
   all('.ritem').every(b => !b.hasAttribute('aria-describedby')));

/* focus — instant, by contract */
const first = () => all('.ritem')[0];
first().dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
ck('keyboard focus shows the tooltip with NO delay', tip().hidden === false);
ck('it is attached as a DESCRIPTION, not as the name',
   first().getAttribute('aria-describedby') === 'tip' &&
   !first().hasAttribute('aria-labelledby'));
ck('the tooltip carries the label plus a hint, not just the label',
   /Dashboard/.test(tip().textContent) && tip().textContent.trim().length > 'Dashboard'.length);

/* dismissible — Escape closes it and does not move focus */
D.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ck('Escape dismisses the tooltip', tip().hidden === true);
ck('…and clears the description link', !first().hasAttribute('aria-describedby'));

const run = async () => {
  /* hover — waits, by contract */
  first().dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }));
  ck('hover does not show the tooltip immediately', tip().hidden === true);
  await wait(TIP_HOVER_DELAY + 80);
  ck('hover shows it after TIP_HOVER_DELAY', tip().hidden === false);

  /* hoverable — the pointer may travel onto the tooltip itself */
  first().dispatchEvent(new window.MouseEvent('mouseout', { bubbles: true }));
  tip().dispatchEvent(new window.MouseEvent('mouseenter', { bubbles: false }));
  await wait(TIP_CLOSE_GRACE + 60);
  ck('the tooltip survives the pointer moving onto it', tip().hidden === false);
  tip().dispatchEvent(new window.MouseEvent('mouseleave', { bubbles: false }));
  await wait(TIP_CLOSE_GRACE + 60);
  ck('…and closes once the pointer leaves the tooltip too', tip().hidden === true);

  /* expanded means no tooltip at all */
  toggle();
  ck('rail is expanded again', !collapsed());
  all('.ritem')[0].dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
  ck('EXPANDED, focus shows no tooltip — the label is already visible',
     tip().hidden === true);
  ck('…and nothing is described by it', !all('.ritem')[0].hasAttribute('aria-describedby'));

  /* ---------- concept B — micro-labels ---------- */
  concept('mini');
  ck('picking a concept collapses the rail (the axis only means something collapsed)',
     collapsed());
  ck('concept is recorded on the stage', stage().getAttribute('data-concept') === 'mini');
  ck('mini shows AUTHORED short labels, not truncations',
     all('.ritem .lbl').map(l => l.textContent.trim()).includes('Records'),
     all('.ritem .lbl').map(l => l.textContent.trim()).join(' · '));
  ck('…while the full label stays in the accessible name',
     names().includes('Records & Certificates'), JSON.stringify(names()));
  ck('no micro-label is an ellipsised full label',
     all('.ritem .lbl').every(l => !/…|\.\.\./.test(l.textContent)));
  ck('the visible micro-label is hidden from the accessibility tree, so no name is said twice',
     all('.ritem .lbl').every(l => l.getAttribute('aria-hidden') === 'true'));

  /* WCAG 2.5.3 Label in Name — the assertion that caught a real defect:
     "For you" under a button named "Recommended" cannot be spoken. */
  {
    const bad = all('.ritem').map(b => [
      b.querySelector('.lbl').textContent.trim(), accName(b)
    ]).filter(([short, name]) => !name.toLowerCase().includes(short.toLowerCase()));
    ck('every micro-label is contained in its own accessible name (Label in Name)',
       bad.length === 0, bad.map(p => p.join(' ⊄ ')).join(' | '));
  }

  /* ---------- concept C — the flyout ---------- */
  concept('flyout');
  ck('concept C renders a flyout panel', !!q('#flyout'));
  ck('…which starts closed', q('#flyout').hidden === true);
  ck('the flyout carries every section with its full label',
     all('#flyout .fitem').length === 7 &&
     all('#flyout .fitem').map(b => accName(b)).includes('Records & Certificates'));

  q('#railNav').dispatchEvent(new window.MouseEvent('mouseenter', { bubbles: false }));
  ck('flyout does not open instantly on hover', q('#flyout').hidden === true);
  await wait(FLYOUT_OPEN_DELAY + 80);
  ck('flyout opens after FLYOUT_OPEN_DELAY', q('#flyout').hidden === false);
  D.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ck('Escape closes the flyout too', q('#flyout').hidden === true);

  /* keyboard has its OWN route into the panel — the card claims it needs one */
  all('.ritem')[0].dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
  ck('focusing a rail icon opens the flyout for keyboard users',
     q('#flyout').hidden === false);
  ck('concept C shows no per-item tooltip — the panel IS the labels',
     tip().hidden === true);

  /* ---------- selecting still works in every concept ---------- */
  click(all('#flyout .fitem').find(b => /Course Catalog/.test(accName(b))), 'catalog');
  ck('choosing from the flyout changes the current section',
     !!all('.ritem').find(b => b.getAttribute('aria-current') === 'page' &&
        /Course Catalog/.test(accName(b))));
  ck('exactly one item is aria-current at a time',
     all('.ritem[aria-current="page"]').length === 1);
  ck('the concept choice is persisted', window.localStorage.getItem('xcel.nav.concept') === 'flyout');

  /* ---------- where the collapse control sits ----------
     The claim §03 rests on is that the top placement genuinely costs a tab
     stop — which is only true if the toggle moves in the DOM rather than
     just on screen. A CSS-only "move" (order / absolute positioning) would
     leave the tab order unchanged and quietly make the whole section
     wrong, so these assert DOM order, not appearance. */
  const tpos = k => click(all('#dTpos .dchip').find(b => b.dataset.tpos === k), 'tpos ' + k);
  const navButtons = () => [...D.querySelectorAll('#railNav button')];
  const firstStop = () => accName(navButtons()[0]);
  const lastStop = () => accName(navButtons()[navButtons().length - 1]);

  ck('a toggle-position axis exists with both placements', all('#dTpos .dchip').length === 2);
  ck('bottom is the default', stage().getAttribute('data-tpos') === 'bottom');
  ck('bottom: the first tab stop is a DESTINATION, not chrome',
     !/navigation$/.test(firstStop()), firstStop());
  ck('bottom: the toggle is the last stop', /navigation$/.test(lastStop()), lastStop());

  tpos('top');
  ck('top: the stage records the placement', stage().getAttribute('data-tpos') === 'top');
  ck('top: the toggle really moves in the DOM, not just visually',
     /navigation$/.test(firstStop()), firstStop());
  ck('top: …which is the cost — chrome before any destination',
     navButtons().length === 8 && !/navigation$/.test(lastStop()), lastStop());
  ck('exactly one toggle exists in either placement',
     all('#railToggle').length === 1 && all('.rtoggle').length === 1);
  ck('the placement is persisted', window.localStorage.getItem('xcel.nav.tpos') === 'top');

  /* The readout must be DERIVED. If it were authored it could describe an
     order the rail does not have — which is the failure this page spends
     §03 arguing about. Proved by requiring it to change with the axis and
     to name every section in rail order. */
  const readout = () => q('#tabOrder').textContent.replace(/\s+/g, ' ');
  const topReadout = readout();
  ck('the tab-order readout names every button in rail order',
     navButtons().every(b => topReadout.includes(accName(b))));
  tpos('bottom');
  ck('…and it changes when the toggle moves', readout() !== topReadout);
  ck('…reporting the destination-first order', /first stop is a place you can go/.test(readout()),
     readout().slice(-80));

  /* The floating-chevron placement §03 rules out should not exist. */
  ck('no third, boundary-straddling placement crept in',
     all('#dTpos .dchip').every(b => /^(Top|Bottom)$/.test(b.textContent.trim())));

  /* ---------- target size, declared not assumed ---------- */
  ck('a 44px target token is declared for the collapsed rail', /--tap:\s*44px/.test(html));
  ck('rail items take their minimum height from it', /\.ritem\{[^}]*min-height:var\(--tap\)/s.test(html));
  ck('so does the toggle', /\.rtoggle\{[^}]*min-height:var\(--tap\)/s.test(html));

  /* ---------- the rail's colours stay on rail tokens ---------- */
  const railBlock = html.slice(html.indexOf('.ritem{'), html.indexOf('/* ---- MINI'));
  ck('no raw hex in the rail item rules — they stay on --rail-* tokens',
     !/#[0-9a-f]{3,6}/i.test(railBlock), (railBlock.match(/#[0-9a-f]{3,6}/i) || [''])[0]);
  ck('the selected state uses the palette-scoped light stop',
     /--rail-accent/.test(railBlock));
  ck('reduced motion is honoured', /prefers-reduced-motion:reduce/.test(html));

  /* ---------- it is not a PROTOTYPE_FEATURES row ---------- */
  const feats = fs.readFileSync(new URL('../src/data/prototypeFeatures.ts', import.meta.url), 'utf8');
  ck('deliberately NOT a sixth-plus tile row', !/xcel-nav-collapse/.test(feats));

  /* ---------- report ---------- */
  const fail = log.filter(l => l.startsWith('FAIL'));
  console.log(log.join('\n'));
  console.log('\n' + (log.length - fail.length) + '/' + log.length + ' passed');
  if (fail.length) { console.error('\n' + fail.length + ' FAILED'); process.exit(1); }
};
run();
