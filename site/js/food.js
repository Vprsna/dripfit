/* food.js — вкладка «Питание»: норма калорий, распознавание блюда по названию, дневник, вода.
   Сейчас продукты ищутся во встроенной таблице FOOD (на 100 г). В модуле Б — запрос к базе продуктов в интернете,
   распознавание по фото — через сервер. Данные пока хранятся в браузере (df-food, df-water). */
(()=>{
const $=id=>document.getElementById(id);
if(!$('food'))return;
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icn=n=>typeof ic==='function'?ic(n):'';
// [название, корни слов для поиска, ккал, белки, жиры, углеводы] — на 100 г
const FOOD=[
 ['Гречка варёная',['гречк','гречн'],110,4.2,1.1,21.3],['Рис варёный',['рис'],130,2.7,0.3,28.2],['Макароны варёные',['макарон','паст','спагет'],158,5.8,0.9,30.9],
 ['Овсянка на воде',['овсян','овсянк','геркулес','каш'],88,3,1.7,15],['Картофель варёный',['картоф','картош'],82,2,0.4,16.7],['Картофельное пюре',['пюре'],106,2.5,4.2,14.6],
 ['Картофель фри',['фри'],312,3.4,15,41],['Хлеб белый',['хлеб','батон'],265,8,3.2,49],['Хлеб ржаной',['ржан','бородин'],210,6.6,1.2,40],['Лаваш',['лаваш'],275,9,1.2,56],
 ['Куриная грудка',['куриц','курин','грудк','кур'],165,31,3.6,0],['Говядина',['говяд','говядин','стейк'],250,26,15,0],['Свинина',['свин'],242,27,14,0],
 ['Котлета',['котлет'],220,15,14,8],['Пельмени',['пельмен'],275,11.9,12.4,29],['Сосиски',['сосис','сардель'],266,11,23.9,1.6],
 ['Рыба (минтай, треска)',['рыб','минта','треск'],82,18,0.8,0],['Лосось',['лосос','семг','форел'],208,20,13,0],['Тунец консервированный',['тунец','тунц'],116,26,1,0],
 ['Яйцо',['яйц','яич','омлет','глазун'],155,12.6,10.6,1.1],['Творог 5%',['творог','творож'],121,17.2,5,1.8],['Молоко 2,5%',['молок'],52,2.8,2.5,4.7],
 ['Кефир 1%',['кефир'],40,3,1,4],['Йогурт натуральный',['йогурт'],66,5,3.2,3.5],['Сыр',['сыр'],350,25,27,0],['Сметана 15%',['сметан'],158,2.6,15,3],
 ['Банан',['банан'],89,1.1,0.3,22.8],['Яблоко',['яблок'],52,0.3,0.2,13.8],['Апельсин',['апельсин','мандарин'],43,0.9,0.2,8.1],['Огурец',['огурц','огурец'],15,0.7,0.1,3],
 ['Помидор',['помидор','томат'],18,0.9,0.2,3.9],['Салат овощной',['салат'],45,1.2,2.8,4],['Брокколи',['брокол'],34,2.8,0.4,6.6],['Авокадо',['авокадо'],160,2,14.7,8.5],
 ['Орехи',['орех','миндал','арахис','кешью'],600,20,52,16],['Арахисовая паста',['арахисов'],588,25,50,20],['Протеиновый батончик',['батончик'],350,30,10,35],
 ['Протеиновый коктейль',['протеин','коктейл'],380,75,5,8],['Борщ',['борщ'],49,1.1,2.2,6.7],['Суп куриный',['суп','бульон'],36,2.6,1.2,3.5],
 ['Плов',['плов'],180,7,8,21],['Шаурма',['шаурм','шаверм'],210,10,10,20],['Пицца',['пицц'],266,11,10,33],['Бургер',['бургер','гамбургер','чизбургер'],254,13,12,24],
 ['Блины',['блин','блинчик'],230,6,9,30],['Сырники',['сырник'],220,15,10,18],['Шоколад',['шоколад'],546,5,31,61],['Печенье',['печень'],450,6,18,66],
 ['Мёд',['мёд','мед'],304,0.3,0,82],['Сок',['сок'],45,0.5,0.1,10],['Газировка',['газиров','кола','лимонад'],42,0,0,10.6],['Энергетик',['энергет'],45,0,0,11]
];
const norm=s=>s.toLowerCase().replace(/ё/g,'е');
const KEY=FOOD.map(f=>f[1].map(norm));
// распознать: находит все продукты, слова которых есть во фразе («гречка с курицей» → гречка + курица)
function recognize(q){const t=norm(q).split(/[^a-zа-я0-9]+/).filter(Boolean),hit=[];
 FOOD.forEach((f,i)=>{if(KEY[i].some(k=>t.some(w=>w.startsWith(k))))hit.push(i)});
 // более точное название поглощает общее: «картофель фри» — это не варёный картофель + фри
 const ix=n=>FOOD.findIndex(f=>f[0]===n);
 [['Картофель фри','Картофель варёный'],['Картофельное пюре','Картофель варёный'],['Хлеб ржаной','Хлеб белый'],['Арахисовая паста','Орехи'],
  ['Протеиновый батончик','Протеиновый коктейль'],['Суп куриный','Куриная грудка'],['Тунец консервированный','Рыба (минтай, треска)'],['Сырники','Творог 5%'],['Шаурма','Куриная грудка'],['Шаурма','Лаваш']]
  .forEach(([a,b])=>{const A=ix(a),B=ix(b);if(hit.includes(A)&&hit.includes(B))hit.splice(hit.indexOf(B),1)});
 return hit}
const D=864e5,key=d=>{const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const S=ld('df-food',null)||{goal:2200,days:{}};if(!S.days)S.days={};
const save=()=>sv('df-food',S);
let day=new Date(),meal=(h=>h<11?'Завтрак':h<16?'Обед':h<21?'Ужин':'Перекус')(new Date().getHours()),pending=null;
const items=()=>S.days[key(day)]||(S.days[key(day)]=[]);
const r0=n=>Math.round(n),r1=n=>Math.round(n*10)/10;
const calc=(i,g)=>{const f=FOOD[i],k=g/100;return{n:f[0],g,kc:r0(f[2]*k),p:r1(f[3]*k),f:r1(f[4]*k),c:r1(f[5]*k)}};

function drawGoal(){const L=items(),sum=L.reduce((a,x)=>({kc:a.kc+x.kc,p:a.p+x.p,f:a.f+x.f,c:a.c+x.c}),{kc:0,p:0,f:0,c:0});
 const pct=Math.min(1,sum.kc/S.goal),C=2*Math.PI*50,arc=$('fdArc');
 arc.style.strokeDasharray=C;arc.style.strokeDashoffset=C*(1-pct);arc.classList.toggle('over',sum.kc>S.goal);
 $('fdEaten').textContent=sum.kc.toLocaleString('ru-RU');$('fdGoalT').textContent=S.goal.toLocaleString('ru-RU');$('fdGoal').value=S.goal;
 const left=S.goal-sum.kc;$('fdLeft').innerHTML=left>=0?'Осталось <b>'+left.toLocaleString('ru-RU')+' ккал</b>':'Больше нормы на <b>'+(-left).toLocaleString('ru-RU')+' ккал</b>';
 // ориентиры БЖУ от нормы: 25% / 30% / 45% калорий
 const T={p:S.goal*.25/4,f:S.goal*.30/9,c:S.goal*.45/4};
 $('fdMac').innerHTML=[['p','Белки'],['f','Жиры'],['c','Углеводы']].map(([k,n])=>'<div class="fdm"><span>'+n+'</span><div class="bar"><i style="width:'+Math.min(100,sum[k]/T[k]*100).toFixed(0)+'%"></i></div><small>'+r0(sum[k])+' / '+r0(T[k])+' г</small></div>').join('')}
function drawDay(){const L=items(),isT=key(day)===key(new Date());
 $('fdDayT').textContent=isT?'сегодня':day.toLocaleDateString('ru-RU',{day:'numeric',month:'long'});$('fdNext').disabled=isT;
 const M=['Завтрак','Обед','Ужин','Перекус'];
 $('fdList').innerHTML=L.length?M.filter(m=>L.some(x=>x.m===m)).map(m=>{const g=L.map((x,i)=>[x,i]).filter(([x])=>x.m===m);
   return '<div class="fdmealb"><h3>'+m+'<span>'+g.reduce((a,[x])=>a+x.kc,0)+' ккал</span></h3><ul class="plist">'+g.map(([x,i])=>'<li><span>'+esc(x.n)+' <small class="mut">'+x.g+' г</small></span><b>'+x.kc+'</b><button type="button" class="pdel" data-del="'+i+'" aria-label="Удалить">'+icn('close')+'</button></li>').join('')+'</ul></div>'}).join('')
  :'<p class="mut">Пока пусто. Напиши, что ты съел — сайт сам посчитает калории.</p>';
 drawGoal();drawWater()}
function drawMeal(){document.querySelectorAll('#fdMeal button').forEach(b=>b.classList.toggle('on',b.dataset.m===meal))}
function showRes(hit,g,q){const r=$('fdRes');
 if(!hit.length){pending=null;r.hidden=false;r.innerHTML='<p>Не нашли «'+esc(q)+'» в таблице продуктов. Попробуй проще: «рис», «курица», «банан».</p><p class="mut psm">В модуле Б поиск пойдёт по большой базе продуктов в интернете.</p>';return}
 // вес делим поровну между найденными продуктами
 const each=Math.max(1,Math.round(g/hit.length));pending=hit.map(i=>calc(i,each));
 const tot=pending.reduce((a,x)=>a+x.kc,0);
 r.hidden=false;r.innerHTML='<p class="fdrh">Распознано: '+pending.map(x=>'<b>'+esc(x.n)+'</b>').join(' + ')+'</p><ul class="plist">'+pending.map(x=>'<li><span>'+esc(x.n)+' <small class="mut">'+x.g+' г · Б '+x.p+' · Ж '+x.f+' · У '+x.c+'</small></span><b>'+x.kc+' ккал</b></li>').join('')+'</ul><div class="fdrt">Итого: <b>'+tot+' ккал</b></div><button type="button" class="btn" id="fdAdd">Добавить в «'+meal+'»</button>'}
function sug(){const q=norm($('fdQ').value.trim()),s=$('fdSug');if(q.length<2){s.innerHTML='';return}
 const w=q.split(/\s+/).pop();const L=FOOD.map((f,i)=>i).filter(i=>norm(FOOD[i][0]).includes(w)||KEY[i].some(k=>k.startsWith(w)||w.startsWith(k))).slice(0,6);
 s.innerHTML=L.map(i=>'<button type="button" data-i="'+i+'">'+esc(FOOD[i][0])+' <small>'+FOOD[i][2]+' ккал/100 г</small></button>').join('')}

$('fdForm').onsubmit=e=>{e.preventDefault();const q=$('fdQ').value.trim();if(!q){$('fdQ').focus();return}
 const g=Math.max(1,Math.min(3000,+$('fdG').value||100));$('fdSug').innerHTML='';showRes(recognize(q),g,q)};
$('fdQ').addEventListener('input',()=>{$('fdRes').hidden=true;sug()});
$('fdSug').onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;const i=+b.dataset.i;$('fdQ').value=FOOD[i][0];$('fdSug').innerHTML='';showRes([i],Math.max(1,+$('fdG').value||100),FOOD[i][0])};
$('fdRes').onclick=e=>{if(e.target.id!=='fdAdd'||!pending)return;pending.forEach(x=>items().push(Object.assign({m:meal},x)));save();pending=null;
 $('fdRes').hidden=true;$('fdQ').value='';drawDay()};
$('fdMeal').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;meal=b.dataset.m;drawMeal();const a=$('fdAdd');if(a)a.textContent='Добавить в «'+meal+'»'};
$('fdList').onclick=e=>{const b=e.target.closest('[data-del]');if(!b)return;items().splice(+b.dataset.del,1);save();drawDay()};
$('fdPrev').onclick=()=>{day=new Date(day.getTime()-D);drawDay()};
$('fdNext').onclick=()=>{if(key(day)===key(new Date()))return;day=new Date(day.getTime()+D);drawDay()};
$('fdGoalF').onsubmit=e=>{e.preventDefault();const v=+$('fdGoal').value;if(v>=800&&v<=6000){S.goal=Math.round(v);save();drawGoal()}};
$('fdPh').onchange=()=>{$('fdPhMsg').textContent='Фото получено. Распознавание по фото заработает в модуле Б, когда подключим сервер. Пока напиши название блюда.';$('fdPh').value=''};

/* вода */
const W=ld('df-water',{});let bonus=ld('df-water-bonus',{});
function drawWater(){const k=key(day),n=W[k]||0;
 $('fdCups').innerHTML=Array.from({length:8},(_,i)=>'<button type="button" class="'+(i<n?'on':'')+'" data-c="'+(i+1)+'" aria-label="Стакан '+(i+1)+'">'+icn('cup')+'</button>').join('');
 $('fdWaterT').textContent=(n*250/1000).toLocaleString('ru-RU')+' л из 2 л'}
$('fdCups').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;const k=key(day),c=+b.dataset.c;W[k]=(W[k]===c?c-1:c);sv('df-water',W);
 if(W[k]>=8&&!bonus[k]&&k===key(new Date())){bonus[k]=1;sv('df-water-bonus',bonus);try{if(typeof fits==='number'&&isFinite(fits)){fits+=10;if(typeof showFits==='function')showFits()}}catch(err){}}
 drawWater()};

drawMeal();drawDay();
const _go=window.go;window.go=function(id){_go(id);if(id==='food'){day=new Date();drawDay()}};
})();
