/* ach.js — страница «Достижения»: прогресс считается по данным сайта, выполненные можно «забрать» за фиты.
   Источники: «Отчёты» (dfCat.log), «Мои тренировки», питание и вода, друзья, избранное видео, уровень.
   Забранные хранятся в localStorage (df-ach); в модуле Б — в аккаунте на сервере. */
(()=>{
const $=id=>document.getElementById(id);
if(!$('achGrid'))return;
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icn=n=>typeof ic==='function'?ic(n):'';
const nf=n=>Math.round(n).toLocaleString('ru-RU');

/* ---------- сбор статистики ---------- */
function stats(){const C=window.dfCat,L=C?C.log():[],days=new Set(),dayTon={};let km=0,weekTon=0;
 const wk=C?C.addDays(C.today(),-6):'';
 const uniq=new Set();let body=0;
 L.forEach(x=>{const e=C.byId(x.ex);if(!e)return;if(['cm','kg','pct'].includes(e.t)){body++;return}days.add(x.d);uniq.add(x.ex);
  if(e.t==='wr'){const t=x.s*x.r*x.w;dayTon[x.d]=(dayTon[x.d]||0)+t;if(x.d>=wk)weekTon+=t}if(e.t==='cardio')km+=x.km});
 const W=window.dfWorkouts?window.dfWorkouts.list():[];
 const food=ld('df-food',{days:{}}),water=ld('df-water',{});
 let lvl=1;try{if(user&&window.dfLevel){lvl=user.vip?99:window.dfLevel.levelOf(ld('df-xp-'+user.login,0))}}catch(e){}
 return{logs:L.length,uniq:uniq.size,body,days:days.size,maxTon:Math.max(0,...Object.values(dayTon)),weekTon,km,
  wCreated:W.length,wDone:W.reduce((a,w)=>a+Object.keys(w.done||{}).length,0),
  foodDays:Object.values(food.days||{}).filter(a=>a&&a.length).length,water8:Object.values(water).filter(n=>n>=8).length,
  ...(()=>{const st=ld('df-study',{})||{},T=st.tasks||[];return{focusN:Object.values(st.focus||{}).reduce((x,n)=>x+n,0),fives:(st.grades||[]).filter(g=>g.g===5).length,
   reviews:st.reviews||0,tasksDone:T.filter(t=>t.done).length,onTime:T.filter(t=>t.done&&t.due&&t.done<=t.due).length}})(),
  friends:(ld('df-friends',{list:[]}).list||[]).length,fav:(ld('df-vfav',[])||[]).length,streak:12,lvl}}

/* [id, раздел, иконка, название, условие, показатель, цель, награда] */
const A=[
 ['first','Тренировки','dumbbell','Первый шаг','Запиши первую тренировку в «Отчёты»','days',1,10],
 ['uniq10','Отчёты','search','Разнообразие','10 разных упражнений в «Отчётах»','uniq',10,40],
 ['log50','Отчёты','note','Летописец','50 записей в «Отчётах»','logs',50,80],
 ['body1','Отчёты','eye','Под контролем','Запиши замер тела: вес, талию или % жира','body',1,15],
 ['days10','Тренировки','dumbbell','Втянулся','10 дней с тренировками','days',10,100],
 ['days30','Тренировки','dumbbell','Железный','30 дней с тренировками','days',30,300],
 ['wcreate','Тренировки','spark','Конструктор','Собери 3 тренировки в «Моих тренировках»','wCreated',3,20],
 ['wdone','Тренировки','check','По плану','Выполни 5 тренировок из «Моих тренировок»','wDone',5,60],
 ['ton1','Тренировки','crown','Тонна','Подними 1 000 кг за один день','maxTon',1000,50],
 ['ton10','Тренировки','crown','Десять тонн','10 000 кг за неделю','weekTon',10000,150],
 ['km42','Тренировки','fire','Марафонец','Набегай 42 км кардио','km',42,200],
 ['st7','Привычки','fire','Огонёк','Серия 7 дней','streak',7,30],
 ['st14','Привычки','fire','Привычка','Серия 14 дней','streak',14,120],
 ['st100','Привычки','fire','Легенда','Серия 100 дней','streak',100,500],
 ['food1','Питание','note','Дневник питания','Запиши еду хотя бы за 1 день','foodDays',1,15],
 ['food7','Питание','note','Неделя под контролем','Веди дневник питания 7 дней','foodDays',7,100],
 ['water','Питание','cup','Водный баланс','Выпей 8 стаканов воды за день','water8',1,20],
 ['stTask','Учёба','check','Без хвостов','Выполни 20 задач на вкладке «Учёба»','tasksDone',20,60],
 ['stTime','Учёба','check','Точно в срок','10 задач сделано до срока','onTime',10,80],
 ['stFocus','Учёба','spark','Мастер фокуса','10 фокус-сессий по 25 минут','focusN',10,100],
 ['stFive','Учёба','crown','Отличник','Получи 5 пятёрок','fives',5,80],
 ['stCards','Учёба','note','Зубрила','Повтори карточки 50 раз','reviews',50,60],
 ['fr1','Сообщество','smile','Не один','Добавь первого друга','friends',1,10],
 ['fr5','Сообщество','smile','Команда','5 друзей','friends',5,80],
 ['fav3','Знания','heart','Насмотренность','Добавь 3 видео в избранное','fav',3,15],
 ['lvl5','Рост','trophy','Уровень 5','Дойди до 5 уровня','lvl',5,50],
 ['lvl10','Рост','trophy','Уровень 10','Дойди до 10 уровня','lvl',10,100]
];
const UNIT={maxTon:' кг',weekTon:' кг',km:' км'};
let claimed=ld('df-ach',{}),flt='all';
function rows(){const S=stats();return A.map(([id,g,i,n,d,k,goal,rw])=>{const v=Math.min(S[k],goal),ok=S[k]>=goal;
 return{id,g,i,n,d,k,goal,rw,v,ok,got:!!claimed[id],st:claimed[id]?'done':ok?'ready':'todo'}})}
function draw(){const R=rows(),done=R.filter(r=>r.got).length,ready=R.filter(r=>r.st==='ready').length,earned=R.filter(r=>r.got).reduce((a,r)=>a+r.rw,0),tot=R.length;
 const pct=Math.round(done/tot*100),C=2*Math.PI*44;
 $('achSum').innerHTML='<div class="achring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" class="trk"/><circle cx="50" cy="50" r="44" class="val" style="stroke-dasharray:'+C+';stroke-dashoffset:'+(C*(1-done/tot))+'"/></svg><div><b>'+done+'</b><small>из '+tot+'</small></div></div>'
  +'<div class="achst"><h2>Получено '+pct+'%</h2><p>'+icn('bolt')+' Заработано на достижениях: <b>'+nf(earned)+' фитов</b></p>'
  +(ready?'<p class="achready">Можно забрать: <b>'+ready+'</b>'+(ready>1?' <button type="button" class="btn achall" data-claim-all>Забрать всё</button>':' — не забудь!')+'</p>':'<p class="mut">Выполняй задания — награды появятся здесь.</p>')+'</div>';
 document.querySelectorAll('#achF [data-f]').forEach(b=>{const c={all:tot,ready,done,todo:R.filter(r=>r.st==='todo').length}[b.dataset.f];b.classList.toggle('on',b.dataset.f===flt);b.dataset.n=c});
 const show=R.filter(r=>flt==='all'||r.st===flt),G=[...new Set(show.map(r=>r.g))];
 const cards=G.map(g=>[show.filter(r=>r.g===g).length+2,'<div class="card pin achcat"><h2>'+esc(g)+'</h2><ul class="achl">'+show.filter(r=>r.g===g).map(r=>
  '<li class="'+r.st+'"><span class="achi">'+icn(r.st==='done'?'check':r.st==='todo'&&r.v===0?'lock':r.i)+'</span><div class="achtx"><b>'+esc(r.n)+'</b><small>'+esc(r.d)+'</small>'
  +'<div class="bar"><i style="width:'+(r.v/r.goal*100).toFixed(0)+'%"></i></div><em>'+nf(r.v)+' / '+nf(r.goal)+(UNIT[r.k]||'')+'</em></div>'
  +(r.st==='done'?'<span class="achok">Получено<small>+'+r.rw+' фитов</small></span>':r.st==='ready'?'<button type="button" class="btn achbtn" data-claim="'+r.id+'">Забрать +'+r.rw+'</button>':'<span class="achrw">+'+r.rw+'<small>фитов</small></span>')+'</li>').join('')+'</ul></div>']);
 /* раскладка по колонкам: длинные разделы не оставляют пустых дыр */
 const w=$('achGrid').clientWidth||innerWidth,n=document.body.classList.contains('phone')||w<700?1:w<1000?2:3,col=Array.from({length:n},()=>({h:0,c:[]}));
 cards.forEach(([h,html])=>{const c=col.reduce((m,x)=>x.h<m.h?x:m);c.h+=h;c.c.push(html)});
 $('achGrid').innerHTML=G.length?col.map(c=>'<div class="achcol">'+c.c.join('')+'</div>').join('')
  :'<p class="mut achempty">'+({ready:'Сейчас забирать нечего — выполняй задания!',done:'Пока ни одного полученного достижения.',todo:'Все достижения выполнены. Ты легенда!'}[flt]||'')+'</p>'}
$('achF').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;flt=b.dataset.f;draw()};
$('achSum').onclick=e=>{if(!e.target.closest('[data-claim-all]'))return;let sum=0;rows().filter(r=>r.st==='ready').forEach(r=>{claimed[r.id]=1;sum+=r.rw});sv('df-ach',claimed);
 try{if(typeof fits==='number'&&isFinite(fits)){fits+=sum;if(typeof showFits==='function')showFits()}}catch(err){}if(typeof coins==='function')try{coins()}catch(err){}draw();check()};
$('achGrid').onclick=e=>{const b=e.target.closest('[data-claim]');if(!b)return;const r=rows().find(x=>x.id===b.dataset.claim);if(!r||!r.ok||r.got)return;
 claimed[r.id]=1;sv('df-ach',claimed);try{if(typeof fits==='number'&&isFinite(fits)){fits+=r.rw;if(typeof showFits==='function')showFits()}}catch(err){}
 if(typeof coins==='function')try{coins()}catch(err){}draw();check()};
/* ---------- связь с «Отчётами»: как только запись выполнила условие — достижение засчитывается сразу ---------- */
let seen=ld('df-ach-seen',null);
function toast(html){let el=document.getElementById('achToast');
 if(!el){el=document.createElement('div');el.id='achToast';el.className='lvltoast achtoast';el.setAttribute('role','status');document.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target.closest('[data-go-ach]')&&typeof go==='function')go('ach')})}
 el.innerHTML=html;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),5000)}
function check(){let R;try{R=rows()}catch(e){return}
 const ready=R.filter(r=>r.st==='ready'),nav=document.querySelector('#tnav [data-go=ach]');
 if(nav){let b=nav.querySelector('.achbadge');if(ready.length){if(!b){b=document.createElement('i');b.className='achbadge';nav.appendChild(b)}b.textContent=ready.length}else if(b)b.remove()}
 const ok=R.filter(r=>r.ok).map(r=>r.id);
 if(seen===null){seen=ok;sv('df-ach-seen',seen);return} // первый запуск: не засыпаем уведомлениями за старые записи
 const fresh=R.filter(r=>r.ok&&!seen.includes(r.id));
 if(fresh.length){seen=[...new Set([...seen,...ok])];sv('df-ach-seen',seen);
  toast('<b>'+(fresh.length>1?'Достижения: '+fresh.length:'Достижение!')+'</b> '+fresh.map(r=>'«'+esc(r.n)+'»').join(', ')+' — засчитано. <button type="button" class="lnk2" data-go-ach>Забрать +'+fresh.reduce((a,r)=>a+r.rw,0)+' →</button>');
  if($('ach').classList.contains('on'))draw()}}
setInterval(check,1200);
draw();check();
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if($('ach').classList.contains('on'))draw()},150)});
const _go=window.go;window.go=function(id){_go(id);if(id==='ach')draw()};
})();
