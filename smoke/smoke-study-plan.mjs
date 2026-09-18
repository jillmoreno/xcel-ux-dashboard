import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

/* ============================================================
   smoke-study-plan.mjs — xcel-study-plan.html

   What this suite is actually for: every number on that page is DERIVED, so
   the failure mode is not a missing element, it is a number that stops
   agreeing with the constant it came from. These assertions check the
   load-bearing claims specifically —

     · stage 0 shows no goal surface at all (the whole ask)
     · the stage-1 offer is built from the learner's OWN rate, proved by
       flipping the rate axis and requiring the quoted date to MOVE
     · the sit date is always the coursework date + EXAM_BUFFER_INVENTED
     · an impossible date is refused rather than silently accepted
     · a strained-but-reachable date is accepted rather than refused
     · the "slightly behind" drift row shows the learner nothing
     · "date at risk" prices BOTH options rather than picking one
   ============================================================ */

const html = fs.readFileSync(new URL('../public/prototypes/xcel-study-plan.html', import.meta.url), 'utf8');
const errs = [];
const vc = new VirtualConsole().on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
const { window } = dom, D = window.document;
window.addEventListener('error', e => errs.push(e.message));

const q = s => D.querySelector(s), all = s => [...D.querySelectorAll(s)];
const T = s => (q(s)?.textContent || '').replace(/\s+/g, ' ').trim();
const click = (s, l) => {
  const el = typeof s === 'string' ? q(s) : s;
  if (!el) throw new Error('missing ' + (l || s));
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
};
const axis = (host, label) => {
  const b = all(host + ' .dchip').find(x => x.textContent.trim() === label);
  if (!b) throw new Error('no chip "' + label + '" in ' + host);
  click(b);
};
const log = [], ck = (n, c, x = '') => log.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  — ' + x : ''));

/* "Fri 16 Oct" → a comparable Date in 2026/2027. Dates on this page never
   span more than a few months from TODAY, so a fixed year is safe. */
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const parseDates = txt => [...txt.matchAll(/(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g)]
  .map(m => { const mo = MON.indexOf(m[2]); return new Date(mo < 8 ? 2027 : 2026, mo, +m[1]); });
const dayGap = (a, b) => Math.round((b - a) / 86400000);

const EXAM_BUFFER = 7;                       // must track the page constant
const TODAY = new Date(2026, 8, 16);
const iso = d => { const m = d.getMonth() + 1, dd = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; };
const setDate = d => { const i = q('#tg'); i.value = iso(d);
  i.dispatchEvent(new window.Event('change', { bubbles: true })); };

/* ---------- it mounts ---------- */
ck('page mounts with no script errors', errs.length === 0, errs.slice(0, 2).join(' | '));
ck('both demo axes render', all('#dStage .dchip').length === 4 && all('#dRate .dchip').length === 3,
   all('#dStage .dchip').length + ' stages, ' + all('#dRate .dchip').length + ' rates');
ck('all four stages render in the timeline', all('#stages .stg').length === 4);
ck('exactly one stage is marked current', all('#stages .stg.here').length === 1);
ck('invented rules table is populated from RULES', all('#rulesBody tr').length === 8,
   all('#rulesBody tr').length + ' rows');
ck('every rule row names a constant and an owner',
   all('#rulesBody tr').every(r => /_INVENTED/.test(r.cells[0].textContent) && r.cells[2].textContent.trim().length > 3));

/* ---------- §03 · the pre-plan window ---------- */
axis('#dStage', 'Nothing done');
ck('STAGE 0 shows no nudge at all', all('#surf .nudge').length === 0, 'the whole ask');
ck('stage 0 says nothing is recorded yet', /nothing recorded yet/.test(T('#surf')));
ck('stage 0 still offers one quiet opt-in link', /Set a target date/.test(T('#surf')));
ck('stage 0 note argues a bad goal beats no goal', /bad goal is worse than no goal/i.test(T('#stageNote')));

axis('#dStage', 'Chapter 1 done');
ck('stage 1 raises exactly one nudge', all('#surf .nudge').length === 1);
ck('stage 1 nudge is the quiet inline level', !!q('#surf .nudge.lvl1'));
ck('stage 1 nudge is dismissible', /Not now/.test(T('#surf .nudge')));
ck('stage 1 quotes a measured chapter-1 duration', /finished Chapter 1 in/.test(T('#surf .nudge')));

axis('#dStage', '4 chapters, no goal');
ck('stage 2 escalates to the card level', !!q('#surf .nudge.lvl2'));
ck('stage 2 is still dismissible', /Later/.test(T('#surf .nudge')));
ck('stage 2 argues consequence, not obligation', /not whether you are on track/.test(T('#surf .nudge')));

axis('#dStage', 'Near eligibility');
ck('stage 3 is the load-bearing level', !!q('#surf .nudge.lvl3'));
ck('stage 3 has NO dismiss control', !q('#surf .nudge.lvl3 .dis'), 'hard-deadline case');
ck('stage 3 names the external booking reason', /PSI/.test(T('#surf .nudge')));

/* ---------- the personalisation claim, proved ---------- */
axis('#dStage', 'Chapter 1 done');
axis('#dRate', 'Fast');
const fastOffer = parseDates(T('#surf .nudge'))[0];
const fastCh1   = T('#surf .nudge');
axis('#dRate', 'Slow');
const slowOffer = parseDates(T('#surf .nudge'))[0];
ck('the offer is built from the learner\'s OWN rate (date moves with pace)',
   fastOffer && slowOffer && dayGap(fastOffer, slowOffer) > 14,
   fastOffer + ' → ' + slowOffer);
ck('the measured chapter-1 time moves with pace too', fastCh1 !== T('#surf .nudge'));
axis('#dRate', 'Typical');

/* ---------- §04 · the picker ---------- */
ck('picker renders three paces', all('#picker .pace').length === 3);
ck('exactly one pace is selected on load', all('#picker .pace[aria-checked="true"]').length === 1);
ck('paces are priced in evenings, not credit hours',
   /nights a week/.test(T('#picker .pace')) && !/credit hours per week/i.test(T('#picker')));
ck('the date field is a peer of the presets, not a fifth card', !!q('#picker #tg'));

/* every preset must quote BOTH dates, one buffer apart */
let bufferOk = true, bufferDetail = '';
all('#picker .pace').forEach(p => {
  const d = parseDates(p.textContent);
  if (d.length < 2 || dayGap(d[0], d[1]) !== EXAM_BUFFER) {
    bufferOk = false; bufferDetail = p.textContent.replace(/\s+/g, ' ').slice(0, 60);
  }
});
ck('every preset separates coursework and sit date by EXAM_BUFFER_INVENTED', bufferOk, bufferDetail);
/* Red is the licensing-exam semantic and NOTHING else on this page. Inline
   --brand-500 appears exactly once per pace row (the sit date); the readout's
   sit date takes it from the .outexam class instead. Anything above that count
   means red has started carrying a second job, which is the failure the
   desktop prototype's palette split exists to prevent. */
ck('brand red is spent only on the sit date',
   (q('#picker').innerHTML.match(/var\(--brand-500\)/g) || []).length === all('#picker .pace').length,
   (q('#picker').innerHTML.match(/var\(--brand-500\)/g) || []).length + ' inline uses for ' +
   all('#picker .pace').length + ' paces');
ck('the readout sit date is brand-toned by class, not by hex', !!q('#picker .outexam'));

/* selecting a preset fills the date field */
click(all('#picker .pace')[1]);
ck('choosing a pace writes the derived date into the field', !!q('#picker #tg').value);
ck('choosing a pace moves the selection', q('#picker .pace[aria-checked="true"]') === all('#picker .pace')[1]);

/* a comfortable date */
setDate(new Date(2026, 11, 20));
ck('a roomy date reads as comfortable', !!q('#picker .okbox'), T('#picker .pkR').slice(0, 70));
ck('Set my goal is enabled for a comfortable date', !q('#picker .pkfoot .btn[disabled]'));
ck('a custom date reports its closest preset', /Closest preset/.test(T('#picker')));

/* a strained but legal date */
setDate(new Date(2026, 9, 9));
ck('a tight date is flagged, not refused', !!q('#picker .warnbox') && !q('#picker .pkfoot .btn[disabled]'),
   T('#picker .warnbox').slice(0, 70));
ck('the tight-date copy quotes minutes a night', /minutes a night/.test(T('#picker .warnbox')));

/* an impossible date */
setDate(new Date(2026, 8, 25));
ck('an impossible date is called unreachable', /cannot make this date honest/.test(T('#picker .warnbox')),
   T('#picker .warnbox').slice(0, 70));
ck('Set my goal is disabled for an impossible date', !!q('#picker .pkfoot .btn[disabled]'));
ck('an impossible date still shows the sit date the learner asked for', /26 Sep|25 Sep/.test(T('#picker .outexam')));

/* inside the buffer */
setDate(new Date(2026, 8, 18));
ck('a date inside the exam buffer is caught separately', /inside the exam buffer/.test(T('#picker .warnbox')));

/* the 30-day finding */
setDate(new Date(2026, 10, 1));
ck('the 30-day note computes rather than asserts', /minutes a night, five nights a week/.test(T('#pickNote')));
ck('the 30-day note names the top preset, not the middle', /top<\/i>|<i>top<\/i>|top/.test(q('#pickNote').innerHTML));

/* ---------- §05 · drift ---------- */
ck('five drift states render', all('#drifts .drift').length === 5);
const drift = i => all('#drifts .drift')[i].textContent.replace(/\s+/g, ' ');
ck('on-pace says one line and no adjective', /On plan for/.test(drift(0)));
ck('SLIGHTLY BEHIND shows the learner nothing', /Nothing is shown/.test(drift(1)),
   'the tolerance is the design');
ck('slightly-behind carries the silent pill', /silent/.test(drift(1)));
/* Read the ACTIONS, not the whole row — the rationale text under it argues
   against a re-plan by name, so matching the row would always fail. */
const acts = i => all('#drifts .drift')[i].querySelector('.acts').textContent.replace(/\s+/g, ' ');
ck('behind offers the cheapest correction, not a re-plan',
   /Add two evenings/.test(acts(2)) && !/re-plan|change my plan|new plan/i.test(acts(2)), acts(2));
ck('behind keeps the original date in the message', parseDates(drift(2)).length >= 1);
ck('date-at-risk prices BOTH options', /Keep the date/.test(drift(3)) && /Keep the pace/.test(drift(3)));
ck('date-at-risk quotes a number on each option',
   /\d+ min a night/.test(drift(3)) && parseDates(drift(3)).length >= 2);
ck('the moved date is LATER than the original', (() => {
  const d = parseDates(drift(3)); return d.length >= 2 && dayGap(d[0], d[d.length - 1]) > 0;
})());
ck('ahead offers keeping the date as a real answer', /Keep /.test(drift(4)) && /Bring my date forward/.test(drift(4)));
ck('the pulled-in date is EARLIER than the original', (() => {
  const d = parseDates(drift(4)); return d.length >= 2 && dayGap(d[0], d[1]) < 0;
})());

/* drift is derived too — it must move with the rate axis */
const driftFastBefore = drift(3);
axis('#dRate', 'Slow');
ck('drift maths re-derives from the pace axis', drift(3) !== driftFastBefore);
axis('#dRate', 'Typical');

/* ---------- house rules ---------- */
ck('no raw hex outside the token block', (() => {
  const body = html.slice(html.indexOf('<body'));
  const hex = body.match(/#[0-9a-fA-F]{6}\b/g) || [];
  return hex.length <= 3;               // the three palette swatches in the pbar
})(), (html.slice(html.indexOf('<body')).match(/#[0-9a-fA-F]{6}\b/g) || []).join(' '));
ck('the prototype bar links to its siblings', all('.pbar .plink').length >= 4);
ck('palette switcher offers all three candidates', all('.palbtn').length === 3);
ck('no errors after the full interaction sweep', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ---------- report ---------- */
const fails = log.filter(l => l.startsWith('FAIL'));
console.log(log.join('\n'));
console.log('\nstudy-plan: ' + (log.length - fails.length) + '/' + log.length + ' assertions passed');
if (fails.length) process.exit(1);
