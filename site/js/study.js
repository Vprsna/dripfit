/* study.js — вкладка «Учёба»: свои задачи-заметки, отметка выполненного, прогресс и фокус-сессия.
   Хранение — localStorage (df-study); с сервером модуля Б ключ синхронизируется вместе с остальными. */
(()=>{
const $=id=>document.getElementById(id);
if(!$('stForm'))return;
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icn=n=>typeof ic==='function'?ic(n):'';
const dk=d=>{const z=new Date(d);z.setMinutes(z.getMinutes()-z.getTimezoneOffset());return z.toISOString().slice(0,10)};
const today=()=>dk(new Date()),addD=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return dk(d)};
const fmt=s=>new Date(s+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
const PAY=5,MAXPAY=5,GOAL=3;

let S=ld('df-study',null);
if(!S||!Array.isArray(S.tasks)){const t=today();
 S={tasks:[{id:1,t:'Конспект по физике',s:'Физика',due:t,done:null},{id:2,t:'Тренажёр по JS — 3 задачи',s:'Программирование',due:addD(t,2),done:null},{id:3,t:'Повторить слова к тесту',s:'Английский',due:'',done:addD(t,-1)}],paid:{},focus:{}};sv('df-study',S)}
S.paid=S.paid||{};S.focus=S.focus||{};S.time=S.time||{};
const save=()=>sv('df-study',S);
let flt='todo',editId=null;
const hue=t=>{let h=0;for(const c of String(t))h=(h*31+c.charCodeAt(0))%360;return h};

function dueTag(x){if(!x.due||x.done)return'';const t=today();
 const cls=x.due<t?'late':x.due===t?'now':'',txt=x.due<t?'просрочено · '+fmt(x.due):x.due===t?'сегодня':x.due===addD(t,1)?'завтра':'до '+fmt(x.due);
 return '<span class="stdueb '+cls+'">'+txt+'</span>'}
function drawList(){const L=S.tasks.filter(x=>flt==='all'||(flt==='done'?x.done:!x.done))
  .sort((a,b)=>flt==='done'?String(b.done).localeCompare(String(a.done)):((a.due||'9999')).localeCompare(b.due||'9999'));
 document.querySelectorAll('#stF [data-f]').forEach(b=>{b.classList.toggle('on',b.dataset.f===flt);
  b.dataset.n=S.tasks.filter(x=>b.dataset.f==='all'||(b.dataset.f==='done'?x.done:!x.done)).length});
 $('stList').innerHTML=L.length?L.map(x=>'<li class="'+(x.done?'done':'')+'">'
  +'<label class="stck"><input type="checkbox" data-ck="'+x.id+'"'+(x.done?' checked':'')+' aria-label="Сделано"><span class="bx"></span></label>'
  +(editId===x.id?'<form class="sted" data-ed="'+x.id+'"><input value="'+esc(x.t)+'" maxlength="80" aria-label="Текст задачи"><input value="'+esc(x.s)+'" maxlength="24" list="stSubj" placeholder="Предмет" aria-label="Предмет"><input type="date" value="'+esc(x.due)+'" aria-label="Срок"><button class="btn" type="submit">OK</button></form>'
   :'<div class="sttx"><b>'+esc(x.t)+'</b><span>'+(x.s?'<i class="stsub" style="--h:'+hue(x.s)+'">'+esc(x.s)+'</i>':'')+dueTag(x)+(x.done?'<small class="mut">сделано '+fmt(x.done)+'</small>':'')+'</span></div>'
   +'<div class="stact"><button type="button" class="pdel" data-edit="'+x.id+'" aria-label="Изменить">✎</button><button type="button" class="pdel" data-del="'+x.id+'" aria-label="Удалить">'+icn('close')+'</button></div>')
  +'</li>').join(''):'<li class="mut stempty">'+(flt==='done'?'Пока ничего не отмечено.':flt==='todo'?'Все задачи сделаны! Добавь новую выше.':'Задач пока нет.')+'</li>'}
function streak(){let n=0,d=today();const has=s=>S.tasks.some(x=>x.done===s)||(S.focus[s]||0)>0;
 if(!has(d))d=addD(d,-1);while(has(d)){n++;d=addD(d,-1)}return n}
function drawProg(){const t=today(),n=S.tasks.filter(x=>x.done===t).length,wk=addD(t,-6);
 $('stToday').textContent=n;$('stBar').style.width=Math.min(100,n/GOAL*100)+'%';
 $('stLeft').textContent=n>=GOAL?'Дневная цель выполнена — так держать!':'До дневной цели ('+GOAL+' задачи): ещё '+(GOAL-n);
 $('stWeek').textContent=S.tasks.filter(x=>x.done&&x.done>=wk).length;$('stStreak').textContent=streak()}
function draw(){drawList();drawProg()}
function fitsAdd(n){try{if(typeof fits==='number'&&isFinite(fits)){fits+=n;if(typeof showFits==='function')showFits()}}catch(e){}}

$('stForm').onsubmit=e=>{e.preventDefault();const t=$('stT').value.trim();if(!t)return;
 S.tasks.push({id:Date.now(),t:t.slice(0,80),s:$('stS').value.trim().slice(0,24),due:$('stD').value||'',done:null});save();
 $('stT').value='';$('stD').value='';$('stT').focus();if(flt==='done')flt='todo';draw()};
$('stF').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;flt=b.dataset.f;editId=null;drawList()};
$('stList').addEventListener('change',e=>{const id=+e.target.dataset.ck;if(!id)return;const x=S.tasks.find(t=>t.id===id);if(!x)return;
 const t=today();
 if(e.target.checked){x.done=t;if((S.paid[t]||0)<MAXPAY){S.paid[t]=(S.paid[t]||0)+1;fitsAdd(PAY)}}
 else{if(x.done===t&&S.paid[t]>0){S.paid[t]--;fitsAdd(-PAY)}x.done=null}
 save();const li=e.target.closest('li');li.classList.toggle('done',!!x.done);setTimeout(draw,e.target.checked?450:0)});
$('stList').addEventListener('click',e=>{const d=e.target.closest('[data-del]'),ed=e.target.closest('[data-edit]');
 if(d){S.tasks=S.tasks.filter(x=>x.id!==+d.dataset.del);save();draw()}
 if(ed){editId=+ed.dataset.edit;drawList();const i=$('stList').querySelector('.sted input');if(i)i.focus()}});
$('stList').addEventListener('submit',e=>{e.preventDefault();const f=e.target.closest('[data-ed]');if(!f)return;const x=S.tasks.find(t=>t.id===+f.dataset.ed);
 const [a,b,c]=f.querySelectorAll('input');if(x&&a.value.trim()){x.t=a.value.trim().slice(0,80);x.s=b.value.trim().slice(0,24);x.due=c.value||''}editId=null;save();draw()});
$('stList').addEventListener('keydown',e=>{if(e.key==='Escape'&&editId){editId=null;drawList()}});

/* ---------- фокус-сессия: 25 минут работы, 5 отдыха ---------- */
const WORK=25*60,REST=5*60;let left=WORK,phase='work',tm=null;
const mm=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function beep(){try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=.15;o.start();o.stop(a.currentTime+.35)}catch(e){}}
function drawFocus(){$('stTime').textContent=mm(left);$('stGo').textContent=tm?'Пауза':(left<(phase==='work'?WORK:REST)?'Продолжить':'Старт');
 $('stPh').textContent=phase==='work'?'25 минут без отвлечений, потом 5 минут отдыха':'Отдых: встань, разомнись, попей воды';
 const n=S.focus[today()]||0;$('stFc').textContent=n?'Сессий сегодня: '+n+' · за каждую +10 фитов':'За каждую законченную сессию +10 фитов';
 $('stTime').classList.toggle('rest',phase==='rest')}
function tick(){left--;if(left<=0){beep();clearInterval(tm);tm=null;
  if(phase==='work'){const t=today();S.focus[t]=(S.focus[t]||0)+1;const sb=($('stFS')&&$('stFS').value)||'Без предмета';S.time[t]=S.time[t]||{};S.time[t][sb]=(S.time[t][sb]||0)+25;save();fitsAdd(10);phase='rest';left=REST;drawProg();if(window.dfStudyHook)window.dfStudyHook()}else{phase='work';left=WORK}}
 drawFocus()}
$('stGo').onclick=()=>{if(tm){clearInterval(tm);tm=null}else tm=setInterval(tick,1000);drawFocus()};
$('stReset').onclick=()=>{clearInterval(tm);tm=null;phase='work';left=WORK;drawFocus()};

window.dfStudy={get S(){return S},save,fitsAdd,today,addD,fmt,esc,redraw:draw};
draw();drawFocus();
const _go=window.go;window.go=function(id){_go(id);if(id==='study')draw()};
})();
