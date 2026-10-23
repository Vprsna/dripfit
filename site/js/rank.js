/* rank.js — общий рейтинг пользователей по выбранному показателю (главная и «Спорт»)
   и «Динамика прогресса» на главной.
   Другие участники — демо-данные; твои цифры считаются по записям в «Отчётах».
   В модуле Б рейтинг будет приходить с сервера (GET /api/rating?metric=...). */
(()=>{
const $=id=>document.getElementById(id);
const C=()=>window.dfCat;
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=n=>Math.round(n).toLocaleString('ru-RU');
const M={fits:['Фиты','фитов за неделю',v=>nf(v)],ton:['Тоннаж','кг поднято за неделю',v=>nf(v)+' кг'],streak:['Серия','дней подряд',v=>v+' дн.'],cnt:['Тренировки','тренировок за 30 дней',v=>String(v)],km:['Кардио','км за неделю',v=>(Math.round(v*10)/10).toLocaleString('ru-RU')+' км']};
const DEMO=[['Артём',3420,18400,21,19,12.5],['Лиза',3105,9800,14,22,31],['Макс',2780,16900,9,15,4],['Соня',2510,4200,33,25,42.5],['Дима',1980,14100,5,11,6],
 ['Катюша',1760,2100,40,27,18],['Влад',1220,11800,2,8,0],['Настя',990,1500,12,14,9.5],['Егор',860,3900,7,9,24],['Полина',540,2600,3,6,7]];
const LOG=()=>C()?C().log():[];
const since=n=>C().addDays(C().today(),-n+1);
function mine(){const L=LOG(),w=since(7),m=since(30),E=C();let ton=0,km=0;const days=new Set();
 L.forEach(x=>{const e=E.byId(x.ex);if(!e)return;if(x.d>=w){if(e.t==='wr')ton+=x.s*x.r*x.w;if(e.t==='cardio')km+=x.km}if(x.d>=m&&!['cm','kg','pct'].includes(e.t))days.add(x.d)});
 let f=0;try{f=typeof fits==='number'&&isFinite(fits)?fits:99999}catch(e){}
 return{fits:f,ton,streak:12,cnt:days.size,km}}
function row(name,vals){const k=['fits','ton','streak','cnt','km'];const o={name};k.forEach((m,i)=>o[m]=vals[i]);return o}
function board(m){const me=Object.assign({name:'Вы',me:1},mine());
 return [...DEMO.map(d=>row(d[0],d.slice(1))),me].sort((a,b)=>b[m]-a[m])}
const state=ld('df-rank',{});
/* модуль Б: с сервером рейтинг строится по настоящим пользователям (GET /api/rating) */
const SRV={},loading={};
function srvBoard(m,card){if(SRV[m])return SRV[m];if(!loading[m]){loading[m]=1;
  window.dfApi.call('GET','/rating?metric='+m).then(r=>{const me=window.dfApi.user;
   SRV[m]=r.top.map(x=>{const o={name:me&&x.login===me.login?'Вы':x.name,me:!!(me&&x.login===me.login)};o[m]=x.value>=1e9?Infinity:x.value;return o});
   delete loading[m];cards.forEach(draw)}).catch(()=>{delete loading[m]})}
 return null}
addEventListener('dfapi-user',()=>{Object.keys(SRV).forEach(k=>delete SRV[k]);all()});
function draw(card){const m=card.dataset.rk in M?card.dataset.rk:'fits';
 const L=(window.dfApi&&window.dfApi.on&&srvBoard(m,card))||board(m),pos=L.findIndex(x=>x.me);
 card.querySelector('.rkopt').innerHTML=Object.keys(M).map(k=>'<button type="button" role="tab" aria-selected="'+(k===m)+'" class="'+(k===m?'on':'')+'" data-m="'+k+'">'+M[k][0]+'</button>').join('');
 const top=L.slice(0,5),show=pos<5?top:[...top.slice(0,4),null,L[pos]];const fmtv=v=>v===Infinity?'∞':M[m][2](v);
 card.querySelector('.rkl').innerHTML=show.map(x=>x?'<li class="'+(x.me?'me':'')+'" data-n="'+(L.indexOf(x)+1)+'">'+esc(x.name)+' <b>'+fmtv(x[m])+'</b></li>':'<li class="rkgap" aria-hidden="true">…</li>').join('');
 card.querySelector('.rkfoot').textContent=(pos<0?'Войди, чтобы увидеть своё место':'Ты на '+(pos+1)+' месте из '+L.length)+' · '+M[m][1]}
const cards=[...document.querySelectorAll('.rkcard')];
cards.forEach((c,i)=>{if(state[i])c.dataset.rk=state[i];
 c.addEventListener('click',e=>{const b=e.target.closest('.rkopt [data-m]');if(!b)return;c.dataset.rk=b.dataset.m;state[i]=b.dataset.m;sv('df-rank',state);draw(c)})});

/* ---------- динамика прогресса: 6 недель ---------- */
let dm=ld('df-dyn','ton'),dp=ld('df-dyn-per','w'); // dp: w — 6 недель, d — эта неделя по дням
const DN=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
function agg(from,to){const E=C();let ton=0,km=0;const d=new Set();
 LOG().forEach(x=>{if(x.d<from||x.d>to)return;const e=E.byId(x.ex);if(!e)return;if(e.t==='wr')ton+=x.s*x.r*x.w;if(e.t==='cardio')km+=x.km;if(!['cm','kg','pct'].includes(e.t))d.add(x.d)});
 return{from,to,ton,km,cnt:d.size}}
function weeks(){const E=C(),t=E.today(),out=[];for(let i=5;i>=0;i--){const to=E.addDays(t,-i*7);out.push(agg(E.addDays(to,-6),to))}return out}
function days(){const E=C(),t=E.today(),wd=(new Date(t+'T12:00').getDay()+6)%7,mon=E.addDays(t,-wd);
 return DN.map((n,i)=>{const d=E.addDays(mon,i);return Object.assign(agg(d,d),{n,future:d>t,today:d===t})})}
function drawDyn(){if(!$('dynCard')||!C())return;const byDay=dp==='d',W=byDay?days():weeks(),v=W.map(w=>w[dm]),mx=Math.max(...v,1);
 const U={ton:x=>nf(x)+' кг',cnt:x=>byDay?(x?'✓':'—'):x+' дн.',km:x=>(Math.round(x*10)/10).toLocaleString('ru-RU')+' км'}[dm];
 const lab=s=>new Date(s+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
 document.querySelectorAll('#dynOpt [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===dm));
 document.querySelectorAll('#dynPer [data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p===dp));
 $('dynSub').textContent=byDay?{ton:'Килограммы по дням этой недели',cnt:'Дни с тренировками на этой неделе',km:'Километры кардио по дням этой недели'}[dm]
  :{ton:'Сколько килограммов поднято за неделю',cnt:'Сколько дней с тренировками за неделю',km:'Сколько километров кардио за неделю'}[dm];
 $('dynBars').className='dynbars'+(byDay?' d7':'');
 $('dynBars').innerHTML=W.map((w,i)=>{const now=byDay?w.today:i===5;
  return '<div class="dynb'+(now?' now':'')+(w.future?' fut':'')+'" title="'+(byDay?lab(w.from):lab(w.from)+' – '+lab(w.to))+': '+U(w[dm])+'"><span class="dynv">'+(w.future?'':U(w[dm]))+'</span><i style="height:'+(w.future?0:Math.max(3,w[dm]/mx*100)).toFixed(1)+'%"></i><small>'+(byDay?w.n+(w.today?' · сегодня':''):(i===5?'Эта':lab(w.from)))+'</small></div>'}).join('');
 const t=$('dynTrend');
 if(byDay){const tot=v.reduce((a,b)=>a+b,0),best=W.reduce((m,w)=>!w.future&&w[dm]>(m?m[dm]:0)?w:m,null);
  t.innerHTML=tot?('За неделю: <b>'+(dm==='cnt'?tot+' дн.':U(tot))+'</b>'+(best&&dm!=='cnt'?' · лучший день — '+best.n:'')):'На этой неделе пока пусто — самое время начать!';return}
 const a=v[5],b=v[4];
 if(!b&&!a)t.innerHTML='Пока нет записей — заполни «Отчёты» или отметь тренировку.';
 else if(!b)t.innerHTML='Первая активная неделя — так держать!';
 else{const p=Math.round((a-b)/b*100);t.innerHTML=(p>=0?'<b class="up">↑ +'+p+'%</b>':'<b class="down">↓ '+p+'%</b>')+' к прошлой неделе'}}
const dy=$('dynOpt');if(dy)dy.onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;dm=b.dataset.m;sv('df-dyn',dm);drawDyn()};
const dper=$('dynPer');if(dper)dper.onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;dp=b.dataset.p;sv('df-dyn-per',dp);drawDyn()};

function all(){if(!C())return;cards.forEach(draw);drawDyn()}
window.dfRankRefresh=all;
all();
const _go=window.go;window.go=function(id){_go(id);if(id==='main'||id==='sport'){Object.keys(SRV).forEach(k=>delete SRV[k]);all()}};
})();
