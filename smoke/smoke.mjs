import fs from 'fs';
import { JSDOM } from 'jsdom';
const html = fs.readFileSync(new URL('../public/prototypes/xcel-lms-wireframes.html', import.meta.url),'utf8');
const errs=[];
const dom = new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
  virtualConsole:new (await import('jsdom')).VirtualConsole().on('jsdomError',e=>errs.push('jsdomError: '+e.message))});
const {window}=dom, D=window.document;
window.addEventListener('error',e=>errs.push('window.error: '+e.message));
const q=s=>D.querySelector(s), txt=s=>(q(s)?.textContent||'').replace(/\s+/g,' ').trim();
const click=el=>{ if(!el) throw new Error('missing element'); el.dispatchEvent(new window.MouseEvent('click',{bubbles:true})); };
const log=[];
function ck(name,cond,extra=''){ log.push((cond?'PASS':'FAIL')+'  '+name+(extra?'  — '+extra:'')); }

// ---- stage 1: arrival
ck('arrival renders invite', /Meridian/.test(txt('#arr-body')));
click(q('#arr-body button[data-go="landing"]'));
ck('arrival → landing', /Your price/.test(txt('#arr-body')));
click(q('#arr-body button[data-go="magiclink"]'));
ck('arrival → magic link', !!q('#arr-email'));
q('#arr-email').value='test@x.com';
click(q('#arr-body button[data-go="wait"]'));
ck('arrival → wait, email carried', /test@x\.com/.test(txt('#arr-body')));
click(q('#arr-expire'));
ck('expire shows expired state', /expired/i.test(txt('#arr-body')));
click(q('#arr-body button[data-act="fresh"]'));
ck('fresh link recovers to wait', /Check your email/.test(txt('#arr-body')));
click(q('#arr-es'));
ck('spanish swaps copy', /Revise su correo/.test(txt('#arr-body')), txt('#arr-body').slice(0,40));
click(q('#arr-es')); click(q('#arr-restart'));
click(q('#arr-body button[data-go="landing"]'));
click(q('#arr-body button[data-go="magiclink"]'));
click(q('#arr-body button[data-go="wait"]'));
click(q('#arr-body button[data-go="landed"]'));
ck('arrival → landed', /Welcome, Jordan/.test(txt('#arr-body')));

// ---- stage 2: compass
ck('compass dashboard', /Welcome back/.test(txt('#cmp-body')));
click(q('#cmp-body button[data-go="entering"]'));
ck('compass entering wait', /Opening/.test(txt('#cmp-body')));
click(q('#cmp-body button[data-go="dashboard"]'));  // cancel
ck('cancel returns to dashboard', /Welcome back/.test(txt('#cmp-body')));
// mode C + exam => focus, no exit chip
click(q('[data-cmp-mode="c"]')); click(q('[data-cmp-act="exam"]'));
click(q('#cmp-body button[data-go="entering"]'));
await new Promise(r=>setTimeout(r,2000));
const courseTxt=txt('#cmp-body');
ck('C+exam reaches course frame', /Exam simulation/.test(courseTxt), courseTxt.slice(0,60));
ck('C+exam hides Exit course', !/Exit course/.test(courseTxt));
ck('C+exam shows deliberate end', /End exam early/.test(courseTxt));
click(q('[data-cmp-mode="a"]'));
ck('A shows back-to-dashboard', /Back to Dashboard/.test(txt('#cmp-body')));
click(q('#cmp-body button[data-go="exiting"]'));
ck('exit shows Updating', /Updating/.test(txt('#cmp-body')));
await new Promise(r=>setTimeout(r,2600));
ck('progress resolves after lag', /% complete/.test(txt('#cmp-body')), txt('#cmp-body').slice(0,80));

// ---- stage 3: interruption
ck('exam baseline', /Q 24 \/ 60/.test(txt('#int-qn')));
click(q('#int-q [data-opt="1"]'));
ck('option selects', q('#int-q [data-opt="1"]').getAttribute('aria-pressed')==='true');
click(q('#int-next'));
ck('next advances', /Q 25 \/ 60/.test(txt('#int-qn')));
click(q('[data-int="offline"]'));
ck('offline strip', /offline/i.test(txt('#int-slot')));
click(q('#int-next')); click(q('#int-next'));
ck('offline counts pending', /3 answers waiting/.test(txt('#int-slot')), txt('#int-slot'));
ck('next still enabled offline', !q('#int-next').disabled);
click(q('[data-int="online"]'));
await new Promise(r=>setTimeout(r,1600));
ck('reconnect confirms saved', /answers saved/.test(txt('#int-slot')), txt('#int-slot'));
click(q('[data-int="dead"]'));
ck('unreachable = not designed', /Not designed/.test(txt('#int-slot')));
ck('unreachable disables next', q('#int-next').disabled);
click(q('#int-restart'));
ck('restart recovers', !q('#int-next').disabled && /Q 24/.test(txt('#int-qn')));

// ---- stage 4: exam lifecycle
ck('exam unscheduled', /Not booked yet/.test(txt('#exm-card')));
click(q('#exm-card button[data-act="open-sched"]'));
ck('schedule panel opens', !!q('#exm-date'));
click(q('#exm-card button[data-act="save-sched"]'));
ck('booked → scheduled', /weeks/.test(txt('#exm-card')), txt('#exm-card').slice(0,90));
click(q('[data-exm-day="-3"]'));
ck('clock → imminent', /In 3 days/.test(txt('#exm-card')));
click(q('[data-exm-day="1"]'));
ck('clock → awaiting result', /Awaiting result/.test(txt('#exm-card')));
click(q('#exm-card button[data-act="open-res"]'));
click(q('#exm-card button[data-res="failed"]'));
click(q('#exm-card button[data-act="save-res"]'));
ck('records fail', /Not passed/.test(txt('#exm-card')) && /Schedule retake/.test(txt('#exm-card')));
click(q('#exm-card button[data-act="retake"]'));
click(q('#exm-card button[data-act="save-sched"]'));
ck('retake creates attempt 2', /2 · /.test(txt('#exm-attempts')), txt('#exm-attempts'));
click(q('[data-exm-day="1"]'));
click(q('#exm-card button[data-act="open-res"]'));
click(q('#exm-card button[data-res="passed"]'));
click(q('#exm-card button[data-act="save-res"]'));
ck('pass is terminal, no CTA', /Passed/.test(txt('#exm-card')) && !q('#exm-card button'));

// ---- §02 links out to the live product
// The trap this guards: the page is served from two different sites, so a
// root-relative /dashboard-rebrand resolves on one and 404s on the other.
const live=[...D.querySelectorAll('#s-exists .livelink[href]')];
ck('live links present', live.length===10, live.length+' found');
ck('live links absolute to the LMS deploy',
  live.every(a=>a.getAttribute('href').startsWith('https://ux-lms-dashboard.netlify.app/')),
  live.map(a=>a.getAttribute('href')).filter(h=>!h.startsWith('https://ux-lms-dashboard.netlify.app/')).join(' '));
ck('live links open in a new tab, safely',
  live.every(a=>a.target==='_blank' && /noopener/.test(a.rel)));
// Every in-page reference resolves — a renamed section id would otherwise
// leave a link that scrolls nowhere and reads as the page being broken.
const jumps=[...D.querySelectorAll('#s-exists a[href^="#"]')];
ck('§ references resolve', jumps.length===3 && jumps.every(a=>!!D.getElementById(a.getAttribute('href').slice(1))),
  jumps.map(a=>a.getAttribute('href')).join(' '));

// ---- mode reorder keeps content in DOM
const before=D.getElementById('doc').textContent.length;
click(q('#m-build'));
ck('build mode keeps all content', D.getElementById('doc').textContent.length===before);
ck('build mode reorders', D.getElementById('s-exists').style.order==='2');

console.log(log.join('\n'));
console.log('\nJS errors:', errs.length? errs.join('\n'):'none');
const f=log.filter(l=>l.startsWith('FAIL')).length;
console.log(f? '\n'+f+' FAILING':'\nAll '+log.length+' checks pass');

dom.window.close();
process.exit(f?1:0);
