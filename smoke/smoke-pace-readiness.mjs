import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

/* ============================================================
   smoke-pace-readiness.mjs — xcel-study-pace-readiness.html

   Everything on that page is derived, so these assert RELATIONSHIPS:
     · no percentage sign ever appears inside either widget, in any state
     · "ready" never appears on the Readiness widget before the practice exam
     · Behind says "after your exam date" ONLY when the projection lands after it
     · slightly-behind (ratio in the tolerance band) reads as On track
     · the Not-enough-time state is the only one that questions the date
     · red (--brand-500) is used for exactly one thing: the exam tick
     · quiz-mode lists contain only covered chapters; PE mode can name uncovered
     · option B never lists more items than option A (it only dedupes)
     · the constants table renders from the RULES array the logic reads
   ============================================================ */

const html = fs.readFileSync(new URL('../public/prototypes/xcel-study-pace-readiness.html', import.meta.url), 'utf8');
const errs = [];
const vc = new VirtualConsole().on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  url: 'https://example.test/prototypes/xcel-study-pace-readiness.html' });
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

const pace = () => q('#live [data-widget="pace"]');
const read = () => q('#live [data-widget="readiness"]');
const readB = () => q('#readB [data-widget="readiness"]');
const readC = () => q('#readC [data-widget="readiness"]');

/* ---------- mounts ---------- */
ck('page mounts with no script errors', errs.length === 0, errs.slice(0, 2).join(' | '));
ck('four demo axes render', all('#dStage .dchip').length === 5 && all('#dRate .dchip').length === 4 &&
   all('#dQuiz .dchip').length === 3 && all('#dPE .dchip').length === 2);
ck('both widgets render in the live slice', !!pace() && !!read());

/* ---------- sweep every reachable state ---------- */
const STAGES = all('#dStage .dchip').map(b => b.textContent.trim());
const RATES  = all('#dRate .dchip').map(b => b.textContent.trim());
const QUIZ   = all('#dQuiz .dchip').map(b => b.textContent.trim());
const PES    = all('#dPE .dchip').map(b => b.textContent.trim());

let pctHits = 0, readyEarly = 0, behindWrong = 0, dateMentionedOutsideImpossible = 0, bMoreThanA = 0,
    uncoveredInQuizMode = 0, states = new Set(), rstates = new Set(), combos = 0, cPct = 0, cBad = 0;
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const parseDates = txt => [...txt.matchAll(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})/g)]
  .map(m => new Date(2026, MON.indexOf(m[1]), +m[2]));
const EXAM = new Date(2026, 11, 15);

for (const s of STAGES) for (const r of RATES) for (const z of QUIZ) for (const p of PES) {
  axis('#dStage', s); axis('#dRate', r); axis('#dQuiz', z); axis('#dPE', p); combos++;
  const pw = pace(), rw = read(), rb = readB();
  const pt = T(pw), rt = T(rw);
  if (/%/.test(pt) || /%/.test(rt)) pctHits++;
  states.add(pw.dataset.state); rstates.add(rw.dataset.state);

  /* "ready" only after the practice exam has been taken AND is open */
  const peMode = /practice exam/.test(T(pw.parentElement.querySelector('[data-widget="readiness"] .eb')));
  if (!peMode && /\bready\b/i.test(T(rw.querySelector('.head')))) readyEarly++;

  /* Behind: the head sentence must match where the projection actually lands */
  if (pw.dataset.state === 'behind') {
    const saysAfter = /after your exam date/.test(pt);
    const label = pw.querySelector('.tl')?.getAttribute('aria-label') || '';
    const proj = parseDates(label.split('you would finish')[1] || '')[0];
    if (!proj || (proj > EXAM) !== saysAfter) behindWrong++;
  }
  /* only Not-enough-time may question the date */
  if (pw.dataset.state !== 'impossible' && /about your exam date/.test(pt)) dateMentionedOutsideImpossible++;

  /* option B dedupes; it can never be longer than A */
  if (rb.querySelectorAll('.rl li').length > rw.querySelectorAll('.rl li').length) bMoreThanA++;

  /* option C: never a %, never the word ready, and its pill agrees with the number vs the pass mark */
  const rc = readC(); const ct = T(rc);
  if (/%/.test(ct) || /\bready\b/i.test(ct)) cPct++;
  if (rc.dataset.state !== 'none') {
    const n = +T(rc.querySelector('.gn')), pass = +T(rc.querySelector('.gp')).match(/\d+/)[0];
    if ((n >= pass) !== (rc.dataset.state === 'above')) cBad++;
  }

  /* quiz mode lists only covered chapters → nothing marked "Not covered yet" */
  if (!peMode && rw.querySelector('.rl .g.nc')) uncoveredInQuizMode++;
}
ck('swept every axis combination', combos === STAGES.length * RATES.length * QUIZ.length * PES.length, combos + ' combos');
ck('no percentage sign inside either widget, in any state', pctHits === 0, pctHits + ' hits');
ck('"ready" never appears before the practice exam', readyEarly === 0, readyEarly + ' early');
ck('Behind head sentence agrees with where the projection lands', behindWrong === 0, behindWrong + ' wrong');
ck('only Not-enough-time questions the exam date', dateMentionedOutsideImpossible === 0);
ck('option B never lists more topics than option A', bMoreThanA === 0);
ck('quiz mode never lists an uncovered chapter', uncoveredInQuizMode === 0);
ck('option C shows a number but never a % and never "ready"', cPct === 0, cPct + ' hits');
ck('option C pill agrees with score vs pass mark in every state', cBad === 0, cBad + ' wrong');
ck('every pace state is reachable from the axes',
   ['finding','ahead','ontrack','behind','paused','impossible','complete'].every(s => states.has(s)),
   [...states].join(' '));
ck('every readiness state is reachable from the axes',
   ['none','clear','review','ready','almost','ready-partial'].every(s => rstates.has(s)),
   [...rstates].join(' '));

/* ---------- the mock's own state ---------- */
axis('#dStage', 'Midway (the mock)'); axis('#dRate', 'Steady'); axis('#dQuiz', 'A couple soft'); axis('#dPE', 'Not taken');
ck('the mock state reads On track', pace().dataset.state === 'ontrack', T(pace().querySelector('.pill')));
ck('the mock state lists two chapters for review', read().querySelectorAll('.rl li').length === 2);
ck('every review line has a Review link into a chapter',
   [...read().querySelectorAll('.rl li a')].every(a => /^#ch\d+$/.test(a.getAttribute('href')) && /Review/.test(a.textContent)));
ck('the readiness eyebrow scopes the claim to what was covered', /what you’ve covered/.test(T(read().querySelector('.eb'))));

/* the timeline: two colours, two facts */
ck('exam tick is the only brand-red element in the pace widget', (() => {
  const css = html.slice(0, html.indexOf('</style>'));
  const reds = [...css.matchAll(/\.tl [^{]*\{[^}]*--brand-500/g)].map(m => m[0]);
  return reds.length === 2 && reds.every(r => /\.exam/.test(r));   // the tick and its label
})());
ck('coursework-due and projected-finish are both primary, not brand',
   /\.tl \.mk\{[^}]*--primary-500/.test(html) && /\.tl \.mk\.proj\{[^}]*--primary-500/.test(html));

/* slightly behind reads as On track */
axis('#dRate', 'Steady');
const slight = q('#paceLadder [data-ladder="ontrack-slight"]');
ck('the slightly-behind ladder row exists and renders On track', !!slight && /On track/.test(T(slight.querySelector('.pill'))));
ck('slightly-behind uses the SAME copy as On track', !!slight &&
   T(slight.querySelector('.head')) === T(q('#paceLadder [data-ladder="ontrack"] .head')));

/* pace is derived — flip the axis and the projection moves */
axis('#dRate', 'Brisk'); const briskLabel = pace().querySelector('.tl')?.getAttribute('aria-label');
axis('#dRate', 'Light'); const lightLabel = pace().querySelector('.tl')?.getAttribute('aria-label');
ck('the projected finish moves with the pace axis', briskLabel && lightLabel && briskLabel !== lightLabel);
ck('Light pace at midway projects AFTER the exam', (() => {
  const d = parseDates((lightLabel || '').split('you would finish')[1] || '')[0]; return d && d > EXAM;
})());
ck('Light pace at midway is Behind and recommends minutes, not a date change',
   pace().dataset.state === 'behind' && /a night/.test(T(pace())) && !/move|change your date/i.test(T(pace())));

/* practice exam gating */
axis('#dStage', 'Just started'); axis('#dPE', 'Taken');
ck('practice exam "Taken" is ignored before the unlock threshold', !/practice exam/.test(T(read().querySelector('.eb'))));
axis('#dStage', 'Coursework done'); axis('#dQuiz', 'All held up');
ck('coursework done + practice exam clean = Ready', read().dataset.state === 'ready' && /Ready/.test(T(read().querySelector('.pill'))));
axis('#dPE', 'Not taken');
ck('coursework done WITHOUT practice exam is not Ready', read().dataset.state !== 'ready' && !/\bready\b/i.test(T(read().querySelector('.head'))));
axis('#dStage', 'Midway (the mock)'); axis('#dPE', 'Taken'); axis('#dQuiz', 'A couple soft');
ck('practice exam mid-course can name an uncovered topic, marked as such',
   !!read().querySelector('.rl .g.nc') && /Not covered yet/.test(T(read())) && /Preview/.test(T(read())));
axis('#dQuiz', 'Several soft');
ck('option B collapses the shared Insurance Regulation domain',
   readB().querySelectorAll('.rl li').length < read().querySelectorAll('.rl li').length &&
   /Two chapters feed this/.test(T(readB())));
axis('#dPE', 'Not taken');

/* option C is derived — the score moves with the quiz axis and blends the practice exam */
axis('#dQuiz', 'All held up'); const cSolid = T(readC().querySelector('.gn'));
axis('#dQuiz', 'Several soft'); const cRough = T(readC().querySelector('.gn'));
ck('option C score falls when quizzes are soft', +cRough < +cSolid, cSolid + ' → ' + cRough);
ck('option C is below the pass mark when several quizzes are soft', readC().dataset.state === 'below');
axis('#dPE', 'Taken'); ck('option C names the practice exam once it is blended in', /practice exam/.test(T(readC().querySelector('.src'))));
axis('#dPE', 'Not taken'); axis('#dQuiz', 'A couple soft');
ck('option C never mentions completion as an ingredient', !/complet/i.test(T(readC())));

/* ---------- §02 the recommendation ---------- */
const rec = () => q('#recWidget [data-widget="recommend"]');
const recMins = () => { const m = T(rec().querySelector('.head')).match(/About (.+?) a night, (\d) nights/); return m && { mins: m[1], nights: +m[2] }; };
const toMin = t => { const h = t.match(/(\d+)([¼½¾])? hour/), mn = t.match(/(\d+) min/); const F = { '¼': 15, '½': 30, '¾': 45 }; return h ? +h[1] * 60 + (h[2] ? F[h[2]] : 0) : (mn ? +mn[1] : NaN); };
const dayChip = l => { const b = all('#recDays .mchip').find(x => x.textContent.trim() === l); click(b); };

ck('the recommendation renders set on load, with nothing asked', !!rec() && rec().dataset.adjusted === 'false' &&
   /Recommended/.test(T(rec().querySelector('.pill'))) && /Adjust/.test(T(rec())));
ck('day one is derived from the 30-day access, not the exam', /30-day access/.test(T(rec())) && !/exam/i.test(T(rec())));
ck('the recommendation timeline has no exam tick — access end is not red',
   !rec().querySelector('.tl .mk.exam') && !!rec().querySelector('.tl .mk.acc'));
ck('day one finish sits the buffer before access ends', /5 days before/.test(T(rec())));
ck('the word Relaxed appears nowhere on the widget', !/relaxed/i.test(T(rec())));
const d1 = recMins();
ck('the recommended evening is under the strain line', d1 && toMin(d1.mins) <= 120, JSON.stringify(d1));
ck('Adjust is collapsed by default and toggles', (() => {
  const b = q('#recAdjBtn'); if (!b || b.getAttribute('aria-expanded') !== 'false' || !q('#recAdj').hidden) return false;
  click(b); return q('#recAdjBtn').getAttribute('aria-expanded') === 'true' && !q('#recAdj').hidden;
})());
ck('Finish-by can never be later than the day before access ends', (() => {
  const i = q('#recFinish'); return i && i.max === '2026-10-17' && i.value === '2026-10-13';
})(), q('#recFinish')?.max + ' / ' + q('#recFinish')?.value);
click(all('#recAdj [data-nights]').find(b => b.dataset.nights === '6'));
const six = recMins();
ck('more nights → a shorter evening, and the pill becomes Your pace', six && six.nights === 6 && toMin(six.mins) < toMin(d1.mins) &&
   /Your pace/.test(T(rec().querySelector('.pill'))) && rec().dataset.adjusted === 'true');
click(all('#recAdj [data-style]').find(b => b.dataset.style === 'thorough'));
const thorough = recMins();
ck('Thorough costs more per night than Average at the same nights', toMin(thorough.mins) > toMin(six.mins), six.mins + ' → ' + thorough.mins);
(() => { const i = q('#recFinish'); i.value = '2026-11-30'; i.dispatchEvent(new window.Event('change', { bubbles: true })); })();
ck('a finish date past access is clamped, not accepted', q('#recFinish').value === '2026-10-17' && /1 day before/.test(T(rec())));
click(q('#recReset'));
ck('Reset returns to the recommended state', rec().dataset.adjusted === 'false' && recMins().mins === d1.mins && q('#recFinish').value === '2026-10-13');
dayChip('Day 10');
const d10 = recMins();
ck('day 10 re-derives and moves to five nights to stay under strain', d10 && d10.nights === 5 && toMin(d10.mins) <= 120, JSON.stringify(d10));
dayChip('Day 22');
ck('day 22 will not fit and routes to an extension, quoting no pace',
   rec().dataset.state === 'impossible' && /Extend access/.test(T(rec())) && !/^About/.test(T(rec().querySelector('.head'))));
dayChip('Day 1');

/* the ladders render every row through the real model */
ck('pace ladder has 8 rows, all rendered', all('#paceLadder .lrow').length === 8 &&
   all('#paceLadder .lrow [data-widget="pace"]').length === 8);
ck('readiness ladder has 7 rows, all rendered', all('#readLadder .lrow').length === 7 &&
   all('#readLadder .lrow [data-widget="readiness"]').length === 7);
ck('the Not-enough-time row is reached and routes to a person',
   T(q('#paceLadder [data-ladder="impossible"]')).includes('Get help'));

/* constants table derives from RULES */
const ruleRows = all('#rules tbody tr');
ck('rules table renders from the RULES array', ruleRows.length === (html.match(/^ \{k:'[A-Z_]+'/gm) || []).length && ruleRows.length >= 14,
   ruleRows.length + ' rows');
ck('every rule names an owner', ruleRows.every(tr => T(tr.children[3]).length > 3));

/* ---------- house rules ---------- */
ck('no raw hex outside the token block', (() => {
  const body = html.slice(html.indexOf('<body'));
  return (body.match(/#[0-9a-fA-F]{6}\b/g) || []).length <= 3;   // the three palette swatches
})());
ck('the prototype bar links to its siblings', all('.pbar .plink').length >= 6);
ck('no errors after the full interaction sweep', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ---------- report ---------- */
const fails = log.filter(l => l.startsWith('FAIL'));
console.log(log.join('\n'));
console.log('\npace-readiness: ' + (log.length - fails.length) + '/' + log.length + ' assertions passed');
if (fails.length) process.exit(1);
