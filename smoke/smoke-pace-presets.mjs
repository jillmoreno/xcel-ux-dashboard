import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

/* ============================================================
   smoke-pace-presets.mjs — xcel-pace-presets.html

   The page's claim is that three presets are three DATES inside the access
   window, that the CARD operates nothing, and that everything adjustable lives
   in one sheet. So the assertions are relationships and boundaries:

     · Relaxed finishes at the binding ceiling; Recommended a buffer before it;
       Focused two weeks out — ordered, and sharing ONE nights count
     · the card carries no preset/nights control at all — only Start and Adjust
     · the sheet's four groups exist, and Esc / scrim / Save all close it
     · TWO ceilings: an exam date inside the window becomes binding and the
       sheet SAYS which one is doing the work
     · the weekday picker only exists once the calendar is switched on, and
       ticking days re-prices the pace rather than disagreeing with it
     · Relaxed only earns the word on the short courses (grid labels)
     · Focused is dropped once it is no longer faster than Recommended
     · no percentage sign anywhere on a widget
   ============================================================ */

const html = fs.readFileSync(new URL('../public/prototypes/xcel-pace-presets.html', import.meta.url), 'utf8');
const errs = [];
const vc = new VirtualConsole().on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  url: 'https://example.test/prototypes/xcel-pace-presets.html' });
const { window } = dom, D = window.document;
window.addEventListener('error', e => errs.push(e.message));

const q = s => D.querySelector(s), all = s => [...D.querySelectorAll(s)];
const T = el => ((typeof el === 'string' ? q(el) : el)?.textContent || '').replace(/\s+/g, ' ').trim();
const click = el => { if (!el) throw new Error('nothing to click'); el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); };
const change = (el, v) => { el.value = v; el.dispatchEvent(new window.Event('change', { bubbles: true })); };
const axis = (host, label) => { const b = all(host + ' .dchip').find(x => x.textContent.trim() === label); if (!b) throw new Error('no chip ' + label); click(b); };
const log = [], ck = (n, c, x = '') => log.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  — ' + x : ''));

const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pd = txt => { const m = txt.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})/); return m ? new Date(2026, MON.indexOf(m[1]), +m[2]) : null; };
const toMin = t => { const h = t.match(/(\d+)([¼½¾])? hour/), mn = t.match(/(\d+) min/); const F = { '¼': 15, '½': 30, '¾': 45 };
  return h ? +h[1] * 60 + (h[2] ? F[h[2]] : 0) : (mn ? +mn[1] : NaN); };
const rows = () => all('#derive tbody tr').map(r => { const c = [...r.children].map(x => T(x));
  return { id: r.dataset.preset, state: r.dataset.state, finish: pd(c[2]), days: +c[3], nights: +c[5], mins: toMin(c[6]), raw: c }; });
const card = () => q('#cardHost .w');
const sheet = () => q('#sheet');
const openSheet = () => { if (!sheet()) click(q('[data-open-sheet]')); };
const aimRows = () => all('.aimrow').map(a => ({ id: a.dataset.preset, finish: pd(T(a.querySelector('.as'))), mins: toMin(T(a.querySelector('.ac .n'))), on: a.getAttribute('aria-checked') === 'true' }));

/* ---------- mounts ---------- */
ck('page mounts with no script errors', errs.length === 0, errs.slice(0, 2).join(' | '));
ck('three demo axes render', all('#dCourse .dchip').length === 3 && all('#dStyle .dchip').length === 3 && all('#dDay .dchip').length === 3);
ck('the card and the three alternates render', !!card() && !!q('#altB .w') && !!q('#altC .w') && !!q('#altD .w'));

/* ---------- the derivation (42 lessons · Average · Day 1 · no exam) ---------- */
let r = rows();
ck('three presets derive', r.length === 3 && r.map(x => x.id).join() === 'relaxed,recommended,focused');
ck('Relaxed finishes the day before access ends', r[0].finish?.getTime() === new Date(2026, 9, 17).getTime(), r[0].raw[2]);
ck('Recommended finishes the buffer before that', r[1].finish?.getTime() === new Date(2026, 9, 13).getTime(), r[1].raw[2]);
ck('Focused finishes two weeks from today', r[2].days === 14, r[2].raw[3]);
ck('the three presets are ordered by date', r[2].finish < r[1].finish && r[1].finish < r[0].finish);
ck('all three share ONE nights count', r[0].nights === r[1].nights && r[1].nights === r[2].nights, r.map(x => x.nights).join('/'));
ck('per-night cost rises Relaxed → Recommended → Focused', r[0].mins < r[1].mins && r[1].mins < r[2].mins, r.map(x => x.mins).join(' < '));
ck('Focused on 42 lessons is flagged heavy — the two-week claim priced honestly', r[2].state === 'heavy');
ck('the Recommended row is the highlighted one', q('#derive tbody tr.rec')?.dataset.preset === 'recommended');

/* ---------- THE CARD OPERATES NOTHING ---------- */
ck('the card has exactly two buttons: Start and Adjust', (() => {
  const b = all('#cardHost button'); return b.length === 2 && /Start studying/.test(b[0].textContent) && /Adjust/.test(b[1].textContent);
})(), all('#cardHost button').map(b => T(b)).join(' / '));
ck('the card carries no preset or nights control', !q('#cardHost [data-preset][role="radio"]') && !q('#cardHost [data-nights]') && !q('#cardHost .seg'));
ck('the card starts on Recommended and says where the number came from',
   card().dataset.preset === 'recommended' && card().dataset.adjusted === 'false' && /Set from your 30-day access/.test(T(card())));
ck('the card names the finish date and the access end', /by Oct 13/.test(T(card())) && /access ends on Oct 18/.test(T(card())));

/* ---------- the sheet ---------- */
ck('the sheet is closed until Adjust is pressed', !sheet() && q('#sheetHost').hidden);
openSheet();
ck('Adjust opens a modal dialog', !!sheet() && sheet().getAttribute('role') === 'dialog' && sheet().getAttribute('aria-modal') === 'true');
ck('the sheet has all four groups in order', all('#sheet .fgrp').map(g => g.dataset.grp).join() === 'aim,nights,exam,plan',
   all('#sheet .fgrp').map(g => g.dataset.grp).join());
let a = aimRows();
ck('the aim group offers the three presets, Recommended selected', a.length === 3 && a[1].id === 'recommended' && a[1].on);
ck('the sheet rows agree with the derivation table', a[0].mins === r[0].mins && a[1].mins === r[1].mins && a[2].mins === r[2].mins);
ck('with no exam date, the hint names the access window', /30-day access/.test(T('#sheet [data-grp="aim"] .hint')) && !q('.bindnote'));
ck('the nights group marks the suggested count', (() => {
  const b = all('#sheet [data-nights]'); return b.length === 4 && b.filter(x => /suggested/.test(x.textContent)).length === 1; })());
ck('no weekday picker until the calendar is switched on', !q('.wday') && !!q('#planSw'));

/* choosing in the sheet moves the card */
click(all('#sheet .aimrow').find(x => x.dataset.preset === 'relaxed'));
ck('picking Relaxed in the sheet re-renders the card behind it',
   card().dataset.preset === 'relaxed' && /Relaxed/.test(T(card().querySelector('.pill'))) && card().dataset.adjusted === 'true');
ck('the card drops "set from your access" once the learner chose', !/Set from your 30-day access/.test(T(card())) && /yours/.test(T(card().querySelector('.eb'))));
click(all('#sheet [data-nights]').find(b => b.dataset.nights === '6'));
ck('choosing 6 days re-prices every preset on 6 days', rows().every(x => x.nights === 6));
ck('6 days makes the evening shorter than 4 did', rows()[0].mins < r[0].mins, rows()[0].mins + ' < ' + r[0].mins);

/* ---------- two ceilings ---------- */
change(q('#examIn'), '2026-10-10');
ck('an exam date inside the window becomes the binding ceiling', q('.bindnote')?.dataset.binding === 'exam');
ck('the sheet says WHICH ceiling is doing the work', /exam date is the one doing the work/.test(T('.bindnote')) && /Oct 18/.test(T('.bindnote')));
a = aimRows();
ck('Relaxed now finishes the exam buffer (7d) before the exam, not at the window',
   a[0].finish?.getTime() === new Date(2026, 9, 3).getTime(), T('.aimrow .as'));
ck('every preset moved earlier with the exam date', a[0].finish < r[0].finish);
ck('the card explains itself against the exam, not the access window',
   /before your exam on Oct 10/.test(T(card())) && !/access ends/.test(T(card())));
ck('the derivation note switches to the exam explanation', /exam date is binding/.test(T('#deriveNote')));
change(q('#examIn'), '2026-12-15');
ck('an exam far outside the window leaves the window binding', q('.bindnote')?.dataset.binding === 'window' && /access is still the one doing the work/.test(T('.bindnote')));
ck('the timeline stretches to the exam when it sits past access end', /Exam · Dec 15/.test(T('#cardHost .tl')));
click(q('#examClear'));
ck('clearing the exam returns to the window', !q('.bindnote') && /access ends on Oct 18/.test(T(card())));

/* ---------- the study plan calendar ---------- */
click(q('#planSw'));
ck('switching on the plan reveals weekdays, a start time and a preview',
   all('.wday').length === 7 && !!q('#timeIn') && all('.sess .sr').length > 1);
ck('weekdays are pre-ticked to match the chosen days a week',
   all('.wday').filter(b => b.getAttribute('aria-pressed') === 'true').length === +T('#sheet [data-nights][aria-checked="true"]').replace(/\D/g, ''));
const before = all('.sess .sr')[0] && T(all('.sess .sr')[0]);
ck('the first session is a real dated evening at the chosen time', /\d(am|pm) – \d/.test(before), before);
change(q('#timeIn'), '06:30');
ck('changing the time moves every session', /6:30am/.test(T('.sess')) && !/7pm/.test(T('.sess')));
const nightsBefore = +T('#sheet [data-nights][aria-checked="true"]').replace(/\D/g, '');
click(all('.wday').find(b => b.getAttribute('aria-pressed') === 'true'));
ck('un-ticking a day re-prices the pace rather than disagreeing with it',
   +T('#sheet [data-nights][aria-checked="true"]').replace(/\D/g, '') === nightsBefore - 1 &&
   all('.wday').filter(b => b.getAttribute('aria-pressed') === 'true').length === nightsBefore - 1);
ck('the card behind follows the weekday change', new RegExp(nightsBefore - 1 + ' nights a week').test(T(card())));
ck('the save button offers to build the plan', /build my plan/i.test(T('#shSave')));
click(q('#shSave'));
ck('Save closes the sheet and the card notes the plan', !sheet() && q('#sheetHost').hidden && /study plan is on the calendar/.test(T(card())));

/* ---------- closing ---------- */
openSheet();
click(q('.scrim'));
ck('the scrim closes the sheet', !sheet());
openSheet();
D.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ck('Escape closes the sheet', !sheet());
openSheet();
click(q('#shReset'));
ck('Reset returns everything to recommended', card().dataset.preset === 'recommended' && card().dataset.adjusted === 'false' && !q('.wday'));
click(q('.sheet .x'));

/* ---------- course sizes ---------- */
const cells = id => all('#grid3 tr[data-course="' + id + '"] .cell').map(c => ({ preset: c.dataset.preset, state: c.dataset.state, mins: toMin(T(c.querySelector('.cm'))), label: T(c.querySelector('.cl')) }));
const g12 = cells('c12'), g20 = cells('c20'), g42 = cells('c42');
ck('grid renders 3 courses × 3 presets', g12.length === 3 && g20.length === 3 && g42.length === 3);
ck('Relaxed gets cheaper as the course gets shorter', g12[0].mins < g20[0].mins && g20[0].mins < g42[0].mins, [g12[0].mins, g20[0].mins, g42[0].mins].join(' < '));
ck('Relaxed earns its label on 12 lessons and not on 42', /earned/i.test(g12[0].label) && /Full window/.test(g42[0].label), g12[0].label + ' | ' + g42[0].label);
ck('the grid note counts how many courses earn the word', /earns its name on \d of the 3/.test(T('#gridNote')));
ck('Recommended column is highlighted in every row', all('#grid3 .cell.rec').length === 3 && all('#grid3 .cell.rec').every(c => c.dataset.preset === 'recommended'));

/* ---------- axes re-derive ---------- */
axis('#dStyle', 'Quick'); const quick = rows()[1]; axis('#dStyle', 'Thorough'); const thorough = rows()[1]; axis('#dStyle', 'Average');
ck('study style scales the week (Quick costs less than Thorough)',
   quick.nights * quick.mins < thorough.nights * thorough.mins, quick.nights + '×' + quick.mins + ' < ' + thorough.nights + '×' + thorough.mins);
axis('#dDay', 'Day 15');
openSheet();
ck('on Day 15 Focused is dropped — no longer faster than Recommended',
   aimRows().length === 2 && /Dropped/.test(T(q('#derive tbody tr[data-preset="focused"]'))) && /dropped/.test(T('#deriveNote')));
ck('with Focused dropped the card still reads Recommended', card().dataset.preset === 'recommended');
click(q('.sheet .x'));
axis('#dDay', 'Day 1');
axis('#dCourse', '12 lessons');
ck('12-lesson course: Recommended is a light evening', rows()[1].state === 'easy' && /genuinely relaxed/.test(T('#deriveNote')));
axis('#dCourse', '42 lessons');

/* ---------- house rules ---------- */
const surfaces = () => all('.w').map(w => T(w)).join(' ') + ' ' + T('#sheetHost');
ck('no percentage sign on any widget or in the sheet', !/%/.test(surfaces()));
ck('the word Aggressive appears nowhere (the reference label was not carried over)', !/aggressive/i.test(surfaces()));
ck('access end is never brand red', (() => { const css = html.slice(0, html.indexOf('</style>'));
  return !/\.tl \.mk\.acc\{[^}]*--brand/.test(css) && !/\.tl \.lab\.acc\{[^}]*--brand/.test(css); })());
ck('the exam tick IS brand red — the one semantic red keeps', /\.tl \.mk\.exam\{[^}]*--brand-500/.test(html));
ck('no raw hex outside the token block', (html.slice(html.indexOf('<body')).match(/#[0-9a-fA-F]{6}\b/g) || []).length <= 3);
ck('rules table renders from the RULES array', all('#rules tbody tr').length === (html.match(/^ \{k:'[A-Z_]+'/gm) || []).length && all('#rules tbody tr').length >= 10);
ck('the exam buffer matches the study-plan page constant (7d)', /EXAM_BUFFER_INVENTED',\s*v:7,/.test(html));
ck('the prototype bar links to its siblings', all('.pbar .plink').length >= 5);
ck('no errors after the full interaction sweep', errs.length === 0, errs.slice(0, 2).join(' | '));

const fails = log.filter(l => l.startsWith('FAIL'));
console.log(log.join('\n'));
console.log('\npace-presets: ' + (log.length - fails.length) + '/' + log.length + ' assertions passed');
if (fails.length) process.exit(1);
