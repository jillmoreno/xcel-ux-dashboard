import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

/* ============================================================
   smoke-pace-card-variations.mjs — xcel-pace-card-variations.html

   The page's whole claim is that 21 renderings say the SAME four facts off the
   SAME model. So these assert relationships rather than pixels:

     · the default reproduces the card in the brief exactly — 1¾ hours,
       5 nights, May 29 — which is what makes the comparison legitimate
     · every variation that prints a number prints the SAME number
     · the won't-fit state reaches ALL of them; no variation quietly renders a
       pace where the model says none is honest
     · §04·A operates nothing (one control), which is the shipped tile's
       load-bearing rule — a test counts the controls
     · the inline controls actually re-derive, and an axis change resets them
     · RED IS NEVER USED. --brand-* is declared (tokens are copied verbatim
       from the sibling) but must not be referenced: the exam tick on the
       sibling page is the only thing in this family allowed to be red.
   ============================================================ */

const html = fs.readFileSync(new URL('../public/prototypes/xcel-pace-card-variations.html', import.meta.url), 'utf8');
const errs = [];
const vc = new VirtualConsole().on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  url: 'https://example.test/prototypes/xcel-pace-card-variations.html' });
const { window } = dom, D = window.document;
window.addEventListener('error', e => errs.push(e.message));

const q = s => D.querySelector(s), all = s => [...D.querySelectorAll(s)];
const T = el => ((typeof el === 'string' ? q(el) : el)?.textContent || '').replace(/\s+/g, ' ').trim();
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const axis = (host, label) => {
  const b = all(host + ' .dchip').find(x => x.textContent.trim() === label);
  if (!b) throw new Error('no chip "' + label + '" in ' + host);
  click(b);
};
const log = [], ck = (n, c, x = '') => log.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  — ' + x : ''));

/** "1¾ hours" / "23 min" -> minutes. `parseFloat` cannot do this — it reads
 *  both "1½ hours" and "1¾ hours" as 1, which silently passes any comparison
 *  between two adjacent paces. */
const MARKS = { '': 0, '¼': .25, '½': .5, '¾': .75 };
const mins = s => {
  const h = /(\d+)([¼½¾]?)\s*hours?/.exec(s);
  if (h) return (+h[1] + MARKS[h[2]]) * 60;
  const m = /(\d+)\s*min/.exec(s);
  return m ? +m[1] : NaN;
};

/** Every tile on the page, including the real-width rail. */
const tiles = () => all('.tile');
const grid = id => all('#' + id + ' .tile');

/* ---------- mounts ---------- */
ck('page mounts with no script errors', errs.length === 0, errs.slice(0, 2).join(' | '));
ck('three demo axes render', all('#dHours .dchip').length === 3 &&
   all('#dStyle .dchip').length === 3 && all('#dAccess .dchip').length === 3);
ck('21 variations render', grid('g1').length === 6 && grid('g2').length === 4 &&
   grid('g3').length === 6 && grid('g4').length === 5,
   [grid('g1'), grid('g2'), grid('g3'), grid('g4')].map(g => g.length).join('/'));
ck('the real-width rail renders 8 cells', all('.railcell').length === 8);
ck('the scorecard renders every row it claims', all('#scoreTbl tbody tr').length === 18);

/* ---------- the default IS the card in the brief ---------- */
const baseline = () => grid('g1')[0];
ck('default reproduces the brief: 1¾ hours', T(baseline()).includes('1¾ hours'), T(baseline()));
ck('default reproduces the brief: 5 nights a week', T(baseline()).includes('5 nights a week'));
ck('default reproduces the brief: finishes by May 29', T(baseline()).includes('Finishes by May 29'));
ck('default chip says Recommended, not a preset name', T(q('#g1 .cchip')) === 'Recommended', T(q('#g1 .cchip')));

/* ---------- one model, 21 renderings ---------- */
/* Every variation that quotes an evening must quote the SAME evening. §02 is
   exempt by design — that section's whole point is a different lead figure —
   but each of its tiles still has to carry the evening somewhere. */
const evening = '1¾ hours';
const quotesEvening = g => grid(g).filter(t => T(t).includes(evening)).length;
ck('§01 — all six quote the same evening', quotesEvening('g1') === 6, quotesEvening('g1') + '/6');
ck('§02 — all four carry the evening despite leading differently', quotesEvening('g2') === 4, quotesEvening('g2') + '/4');
ck('§03 — all six quote the same evening', quotesEvening('g3') === 6, quotesEvening('g3') + '/6');
ck('§02·D quotes the week in the SAME vocabulary as an evening',
   /[¼½¾]? ?hours?$/.test(T(grid('g2')[3].querySelector('.big'))) &&
   !T(grid('g2')[3].querySelector('.big')).includes('.'),
   T(grid('g2')[3].querySelector('.big')));
ck('§02 leads with four DIFFERENT figures',
   new Set(grid('g2').map(t => T(t.querySelector('.big')))).size === 4,
   grid('g2').map(t => T(t.querySelector('.big'))).join(' | '));
const dated = all('.tile').filter(t => /May 2\d|May 3\d|Jun \d/.test(T(t))).length;
ck('every tile but the one that drops it prints a finish date', dated >= tiles().length - 1,
   dated + '/' + tiles().length);

/* ---------- §04·A operates nothing ---------- */
const controls = t => t.querySelectorAll('button, input, select, [role="radio"]').length;
ck('§04·A is a statement — one control (Adjust)', controls(grid('g4')[0]) === 1, String(controls(grid('g4')[0])));
ck('§04·B is a control panel — more than one', controls(grid('g4')[1]) > 1, String(controls(grid('g4')[1])));
ck('§04·D collapsed adds exactly one control over the baseline',
   controls(grid('g4')[3]) === 2, String(controls(grid('g4')[3])));
ck('§01 baseline operates nothing either', controls(grid('g1')[0]) === 1);

/* ---------- the inline controls really re-derive ---------- */
const stepper = () => [...grid('g4')[2].querySelectorAll('.stepper button')];
const beforeStep = T(grid('g4')[2].querySelector('.big'));
click(stepper()[1]);                                   /* + one night */
const afterStep = T(grid('g4')[2].querySelector('.big'));
ck('§04·C stepper re-derives the evening', beforeStep !== afterStep, beforeStep + ' → ' + afterStep);
ck('§04·C re-derives DOWNWARD — more nights is a lighter evening',
   mins(afterStep) < mins(beforeStep), mins(beforeStep) + ' → ' + mins(afterStep) + ' min');
ck('§04·C does not move any other variation', T(grid('g1')[0]).includes(evening));

click(grid('g4')[3].querySelector('.disc'));
ck('§04·D discloses the presets in place', grid('g4')[3].querySelectorAll('.pbtn2').length >= 2);
const relaxed = [...grid('g4')[3].querySelectorAll('.pbtn2')].find(b => /Relaxed|Full window/.test(T(b)));
click(relaxed);
ck('§04·D picking a preset re-derives that tile', !T(grid('g4')[3]).includes('Finishes by May 29'), T(grid('g4')[3]));
ck('§04·D leaves §04·A alone', T(grid('g4')[0]).includes('Finishes by May 29'));

/* ---------- axes re-derive everything, and reset per-tile choices ---------- */
axis('#dHours', '40 hours');
ck('a heavier course moves every variation off the default evening',
   grid('g1').every(t => !T(t).includes(evening)));
/* An axis change invalidates the learner's CHOICES — a preset picked against a
   23-day window is not a choice about a 12-day one — but NOT the disclosure's
   open/closed state, which is the reviewer's, not the learner's. Collapsing D
   on every axis change would make the variation impossible to evaluate. */
ck('an axis change resets the preset choice to Recommended',
   T(grid('g4')[3].querySelector('.cchip')).startsWith('Recommended'),
   T(grid('g4')[3].querySelector('.cchip')));
ck('an axis change does NOT collapse the disclosure', grid('g4')[3].querySelectorAll('.pbtn2').length >= 2);
ck('40 hours in a 23-day window is flagged heavy',
   T(q('#g1 .cchip')).includes('heavy'), T(q('#g1 .cchip')));

/* ---------- the refusal reaches ALL of them ---------- */
axis('#dAccess', '12 days');
const wont = tiles().filter(t => T(t).includes('Won’t fit')).length;
ck('won’t-fit reaches every tile on the page', wont === tiles().length, wont + '/' + tiles().length);
ck('no tile quotes an evening in the refusal state',
   !tiles().some(t => /\d+ min|\d[¼½¾]? hours? a night/.test(T(t))));
ck('the refusal says why, not just that', T(tiles()[0]).includes('before your access ends'));
ck('§04 keeps its controls reachable in the refusal state',
   controls(grid('g4')[1]) > 1 && controls(grid('g4')[4]) > 1);

/* ---------- back out, and the easy end ---------- */
axis('#dHours', '9 hours'); axis('#dAccess', '60 days');
ck('a light course recovers a normal pace', !T(grid('g1')[0]).includes('Won’t fit'), T(grid('g1')[0]));
ck('the easy end drops to the 3-night floor', T(grid('g1')[0]).includes('3 nights a week'), T(grid('g1')[0]));
ck('style is a real axis — Thorough costs more than Quick', (() => {
  axis('#dStyle', 'Quick'); const a = T(grid('g1')[0].querySelector('.big'));
  axis('#dStyle', 'Thorough'); const b = T(grid('g1')[0].querySelector('.big'));
  axis('#dStyle', 'Average');
  return a !== b;
})());

/* ---------- the colour rule ---------- */
const usesRed = (html.match(/var\(--brand-/g) || []).length;
ck('RED IS NEVER USED — --brand-* declared but never referenced', usesRed === 0, usesRed + ' references');
ck('the page carries the rule in a comment', html.includes('NO RED ANYWHERE ON THIS PAGE'));

/* ---------- house conventions ---------- */
ck('prototype bar present with palette + theme switches',
   !!q('.pbar') && all('.palbtn').length === 3 && !!q('#themeBtn'));
ck('cross-links back to the pace family', ['xcel-pace-presets', 'xcel-study-pace-readiness', 'xcel-study-plan']
   .every(h => html.includes('/prototypes/' + h + '.html')));
ck('every graphic carries a text alternative',
   all('[role="img"]').every(el => (el.getAttribute('aria-label') || '').length > 4));
ck('the page names its pinned date rather than drifting', html.includes('11 May 2026'));

/* ---------- report ---------- */
console.log(log.join('\n'));
const fails = log.filter(l => l.startsWith('FAIL'));
if (fails.length) { console.error('\n' + fails.length + ' FAILED'); process.exit(1); }
console.log('\nAll ' + log.length + ' checks pass');
