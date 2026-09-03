import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const html = fs.readFileSync(new URL('../public/prototypes/xcel-lms-walkthrough.html', import.meta.url),'utf8');
const errs=[];
const vc=new VirtualConsole().on('jsdomError',e=>errs.push('jsdomError: '+e.message));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc});
const {window}=dom, D=window.document;
window.addEventListener('error',e=>errs.push('window.error: '+e.message));
const q=s=>D.querySelector(s);
const T=s=>(q(s)?.textContent||'').replace(/\s+/g,' ').trim();
const click=(sel,label)=>{const el=typeof sel==='string'?q(sel):sel;
  if(!el) throw new Error('missing: '+(label||sel)); el.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=[]; const ck=(n,c,x='')=>log.push((c?'PASS':'FAIL')+'  '+n+(x?'  — '+x:''));
const insp=()=>T('#inspect');

// ---- ch1 arrive
ck('starts at invite', /Meridian/.test(T('#ph')));
click('#ph button[data-go="landing"]');
ck('landing shows agency pays', /Paid by your agency/.test(T('#ph')));
click('#ph button[data-go="email"]');
q('#f-email').value='jordan@gmail.com';
click('#ph button[data-act="sendlink"]');
ck('wait carries the typed email', /jordan@gmail\.com/.test(T('#ph')));
click('[data-p="expire"]');
ck('expire is recoverable', /expired/i.test(T('#ph')) && /still valid/i.test(T('#ph')));
click('#ph button[data-act="resend"]');
click('#ph button[data-act="clicklink"]');
ck('account created silently', /Welcome, Jordan/.test(T('#ph')));
ck('INSPECTOR: account carries', /jordan@gmail\.com/.test(insp()), insp().slice(0,46));

// ---- ch2 target date -> plan
click('#ph button[data-go="settarget"]');
q('#f-target').value='2026-10-19';
click('#ph button[data-act="buildplan"]');
const planTxt=T('#ph');
ck('plan built from MY date', /19 October 2026/.test(planTxt), planTxt.slice(0,60));
const planDays=(insp().match(/(\d+) days/)||[])[1];
ck('INSPECTOR: plan days derived', Number(planDays)>10, planDays+' days');

// ---- ch3 study loop: home -> handover -> course -> exit
click('#ph button[data-go="home"]');
ck('home shows target countdown', /Target exam in/.test(T('#ph')), T('#ph').slice(0,40));
click('#ph button[data-go="handover"]');
ck('handover names their place', /left off at question 6/.test(T('#ph')));
await wait(2100);
ck('auto-advances into Compass frame', /Compass renders this/.test(T('#ph')));
ck('shell persists (Back present)', /←/.test(T('#ph-bar')));
click('#ph button[data-act="finishch"]');
ck('exit shows Updating', /Updating/.test(T('#ph')));
await wait(2100);
ck('progress resolves late', /8% complete/.test(T('#ph')), T('#ph').match(/\d+% complete/)?.[0]);
click('#ph button[data-go="home"]');
ck('home now says chapter 2', /Chapter 2/.test(T('#ph')));

// ---- practice unlocks at 4
click('[data-p="skip"]');
ck('practice appears at 4 chapters', /Progress Exam 1/.test(T('#ph')));
click('#ph button[data-go="practice"]');
click('#ph button[data-act="finishpractice"]');
ck('practice auto-completes', /did not mark this done/.test(T('#ph')));
click('#ph button[data-go="home"]');

// ---- sim unlocks at 8
click('[data-p="skip"]');
ck('sim unlocked at 8 chapters', /Exam simulation/.test(T('#ph')), T('#ph').slice(0,70));
click('#ph button[data-go="simintro"]');
click('#ph button[data-act="startsim"]');
ck('sim starts at 90:00', /90:00 left/.test(T('#ph-bar')), T('#ph-bar'));
click('#ph [data-opt="1"]');
ck('option selects', q('#ph [data-opt="1"]').getAttribute('aria-pressed')==='true');
click('#ph button[data-act="simnext"]');
ck('advances to Q2', /Q 2 \/ 60/.test(T('#ph-bar')));
click('[data-p="offline"]');
ck('offline strip + status bar', /offline/i.test(T('#ph')) && /No signal/.test(T('#ph-net')));
click('#ph button[data-act="simnext"]'); click('#ph button[data-act="simnext"]');
ck('held answers count up', /3 answers waiting/.test(T('#ph')), (T('#ph').match(/\d+ answers waiting/)||[])[0]);
ck('Next stays enabled offline', !q('#ph button[data-act="simnext"]').disabled);
click('[data-p="online"]');
await wait(1700);
ck('reconnect flushes held answers', /All 3 answers saved/.test(T('#ph')));
click('[data-p="dead"]');
ck('unreachable = hatched hole', /Not designed/.test(T('#ph')));
ck('unreachable disables Next', q('#ph button[data-act="simnext"]').disabled);
click('[data-p="online"]');
click('#ph button[data-act="simsubmit"]');
ck('sim result', /41 of 60/.test(T('#ph')));
ck('offline answers acknowledged', /including the ones you answered offline/.test(T('#ph')));

// ---- readiness
click('#ph button[data-go="readiness"]');
ck('readiness states its basis', /340 practice questions/.test(T('#ph')));
ck('readiness is falsifiable, not a promise', /estimate, not a prediction/.test(T('#ph')) && /7 in 10/.test(T('#ph')));
ck('INSPECTOR: readiness carries', /Medium/.test(insp()));
click('#ph button[data-go="home"]');

// ---- finish coursework -> book
click('[data-p="finishall"]');
ck('coursework complete unlocks booking', /Book my exam/.test(T('#ph')));
click('#ph button[data-go="book"]');
q('#f-exam').value='2026-10-05';
click('#ph button[data-act="savebooking"]');
ck('booked, plan rebuilt', /Exam booked/.test(T('#ph')) && /plan rebuilt/i.test(T('#ph')));
ck('INSPECTOR: booking carries', /5 Oct 2026/.test(insp()), (insp().match(/Exam booked\S* ?[^A]*/)||[])[0]?.slice(0,30));

// ---- sit it, fail
click('[data-p="toexam"]');
ck('day after = awaiting result', /Awaiting result/.test(T('#ph')));
click('#ph button[data-go="record"]');
ck('save disabled until outcome chosen', q('#ph button[data-act="saveresult"]').disabled);
click('#ph button[data-res="failed"]');
q('#f-score').value='62';
click('#ph button[data-act="saveresult"]');
ck('fail is a setback not an error', /setback, not a stop/.test(T('#ph')));
ck('fail preserves coursework', /unaffected/.test(T('#ph')));

// ---- retake -> pass
click('#ph button[data-go="retake"]');
ck('retake flags cooling-off as unresolved', /Not designed/.test(T('#ph')) && /cooling-off/.test(T('#ph')));
click('#ph button[data-act="savebooking"]');
ck('attempt 2 booked', /Attempt 2/.test(T('#ph-bar')), T('#ph-bar'));
click('[data-p="toexam"]');
click('#ph button[data-go="record"]');
click('#ph button[data-res="passed"]');
click('#ph button[data-act="saveresult"]');
ck('passed', /You passed/.test(T('#ph')));
ck('pass is terminal — no primary CTA', !q('#ph button.act:not(.sec):not(.link)'));
click('#ph button[data-go="records"]');
ck('records shows BOTH attempts', /1 · 5 Oct 2026 · not passed/.test(T('#ph')) && /2 ·/.test(T('#ph')) && /passed/.test(T('#ph')), T('#ph').match(/1 · .*?passed/)?.[0]);
ck('records flags multi-state hole', /Not designed/.test(T('#ph')) && /second state/i.test(T('#ph')));
ck('INSPECTOR: licence carries', /Texas L&H/.test(insp()));

// ---- restart clears everything
click('#restart');
ck('restart returns to invite', /Meridian/.test(T('#ph')));
ck('restart clears state', /none yet/.test(insp()) && /not set/.test(insp()));

console.log(log.join('\n'));
console.log('\nJS errors: '+(errs.length?errs.join('\n'):'none'));
const f=log.filter(l=>l.startsWith('FAIL')).length;
console.log(f? '\n'+f+' FAILING of '+log.length : '\nAll '+log.length+' checks pass');
dom.window.close();
process.exit(f?1:0);
