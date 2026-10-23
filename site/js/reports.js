/* reports.js — вкладка «Отчёты» (ежедневные записи из зала) и графики в личном кабинете.
   Хранение пока в localStorage браузера; в модуле Б записи переедут в базу данных.
   Типы замеров:
     wr    — подходы × повторы × вес (кг)
     bw    — подходы × повторы, доп. вес необязателен (упражнения с весом тела)
     hold  — подходы × секунды удержания
     time  — минуты
     cardio— дистанция (км) + время (мин)
     cm/kg/pct — один замер (см, кг, %) */
(()=>{
const CAT=[
 ['Пауэрлифтинг',[['Приседания со штангой','wr'],['Жим штанги лёжа','wr'],['Становая тяга классическая','wr'],['Становая тяга сумо','wr'],['Жим лёжа узким хватом','wr'],['Приседания с паузой','wr'],['Жим лёжа с паузой','wr']]],
 ['Тяжёлая атлетика',[['Рывок','wr'],['Толчок','wr'],['Взятие на грудь','wr'],['Швунг жимовой','wr'],['Приседания со штангой на груди','wr'],['Рывковая тяга','wr'],['Толчковая тяга','wr']]],
 ['Грудь',[['Жим гантелей лёжа','wr'],['Жим штанги на наклонной скамье','wr'],['Жим гантелей на наклонной скамье','wr'],['Разводка гантелей лёжа','wr'],['Сведение рук в кроссовере','wr'],['Бабочка (пек-дек)','wr'],['Жим в тренажёре на грудь','wr'],['Отжимания на брусьях','bw']]],
 ['Спина',[['Подтягивания','bw'],['Тяга верхнего блока','wr'],['Тяга штанги в наклоне','wr'],['Тяга гантели одной рукой','wr'],['Тяга горизонтального блока','wr'],['Тяга Т-грифа','wr'],['Австралийские подтягивания','bw'],['Пуловер на блоке','wr'],['Гиперэкстензия','bw']]],
 ['Ноги',[['Жим ногами','wr'],['Гакк-приседания','wr'],['Выпады со штангой','wr'],['Выпады с гантелями','wr'],['Болгарские сплит-приседания','wr'],['Разгибание ног в тренажёре','wr'],['Сгибание ног лёжа','wr'],['Румынская тяга','wr'],['Подъёмы на носки (икры)','wr'],['Приседания в Смите','wr'],['Приседания','bw'],['Выпады','bw'],['Стульчик у стены','hold']]],
 ['Ягодицы',[['Ягодичный мостик со штангой','wr'],['Отведение ноги в кроссовере','wr'],['Разведение ног в тренажёре','wr'],['Гиперэкстензия на ягодицы','bw'],['Зашагивания на тумбу с гантелями','wr'],['Ягодичный мостик на полу','bw']]],
 ['Плечи',[['Армейский жим','wr'],['Жим гантелей сидя','wr'],['Жим Арнольда','wr'],['Махи гантелей в стороны','wr'],['Махи в наклоне (задняя дельта)','wr'],['Тяга штанги к подбородку','wr'],['Обратная бабочка','wr'],['Шраги','wr'],['Пайк-отжимания','bw']]],
 ['Руки',[['Подъём штанги на бицепс','wr'],['Молотки с гантелями','wr'],['Сгибания на скамье Скотта','wr'],['Концентрированный подъём на бицепс','wr'],['Французский жим','wr'],['Разгибания на блоке (трицепс)','wr'],['Разгибание гантели из-за головы','wr'],['Отжимания узким хватом','bw'],['Сгибания запястий (предплечья)','wr']]],
 ['Пресс и кор',[['Скручивания','bw'],['Подъём ног в висе','bw'],['Планка','hold'],['Боковая планка','hold'],['Ролик для пресса','bw'],['Русские скручивания','bw'],['Скручивания на блоке','wr'],['Вакуум','hold']]],
 ['Калистеника',[['Отжимания','bw'],['Подтягивания широким хватом','bw'],['Выход силой','bw'],['Пистолетик','bw'],['Передний вис','hold'],['Задний вис','hold'],['Стойка на руках','hold'],['Флажок','hold'],['Уголок на брусьях','hold'],['Отжимания в стойке на руках','bw']]],
 ['Кроссфит и функционал',[['Трастеры','wr'],['Махи гирей','wr'],['Рывок гири','wr'],['Толчок гирь','wr'],['Берпи','bw'],['Прыжки на тумбу','bw'],['Броски мяча в стену (wall ball)','bw'],['Лазание по канату','bw'],['Фермерская прогулка','wr'],['Комплекс «Мёрф»','time'],['Комплекс «Фрэн»','time']]],
 ['Кардио',[['Бег','cardio'],['Беговая дорожка','cardio'],['Велотренажёр','cardio'],['Гребной тренажёр','cardio'],['Эллипс','cardio'],['Плавание','cardio'],['Скакалка','time'],['Степпер','time'],['Ходьба в горку','cardio']]],
 ['Растяжка и мобильность',[['Продольный шпагат (см до пола)','cm'],['Поперечный шпагат (см до пола)','cm'],['Наклон вперёд (см за стопы)','cm'],['Растяжка всего тела','time'],['Йога','time'],['Суставная гимнастика','time']]],
 ['Замеры тела',[['Вес тела','kg'],['Обхват талии','cm'],['Обхват груди','cm'],['Обхват бицепса','cm'],['Обхват бедра','cm'],['Процент жира','pct']]],
 ['Базовые для новичков',[["Отжимания с колен", "bw"], ["Обратные отжимания от скамьи", "bw"], ["Выпрыгивания из приседа", "bw"], ["Прыжки «Джампинг Джек»", "bw"], ["Скалолаз (альпинист)", "bw"], ["Подъёмы ног лёжа", "bw"], ["Велосипед (на пресс)", "bw"], ["Супермен (лодочка)", "bw"], ["Махи ногами", "bw"], ["Наклоны в стороны", "bw"], ["Приседания плие (сумо)", "bw"], ["Бег на месте", "time"], ["Ходьба", "cardio"], ["Становая тяга с гантелями", "wr"], ["Жим гантелей стоя", "wr"], ["Подъём гантелей на бицепс", "wr"], ["Разгибание руки с гантелью в наклоне", "wr"], ["Выпады назад", "bw"], ["Велосипед (езда)", "cardio"]]]
];
const BASIC_BR='Базовые для новичков',CLASSIC=['Приседания','Выпады','Отжимания','Подтягивания','Планка','Боковая планка','Скручивания','Ягодичный мостик на полу','Берпи','Бег','Скакалка','Гиперэкстензия','Австралийские подтягивания','Стульчик у стены'];
const EX=[];CAT.forEach(([b,l])=>l.forEach(([n,t])=>EX.push({id:EX.length+1,n,t,b})));
const byId=id=>EX.find(e=>e.id===id);
const TYPE={wr:'подходы · повторы · вес',bw:'подходы · повторы',hold:'подходы · секунды',time:'минуты',cardio:'км · минуты',cm:'см',kg:'кг',pct:'%'};
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dk=d=>{const z=new Date(d);z.setMinutes(z.getMinutes()-z.getTimezoneOffset());return z.toISOString().slice(0,10)};
const today=()=>dk(new Date());
const addDays=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return dk(d)};
const fmtDate=s=>new Date(s+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'short'});
const num=v=>{const n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:0};
const nf=n=>Math.round(n*10)/10===Math.round(n)?Math.round(n).toLocaleString('ru-RU'):(Math.round(n*10)/10).toLocaleString('ru-RU');

/* ---------- данные ---------- */
let LOG=ld('df-log',null);
if(!Array.isArray(LOG)){ // демо-записи за последние недели, чтобы графики были видны сразу; их можно удалить одной кнопкой
 LOG=[];const t=today();let id=1;
 const bench=EX.find(e=>e.n==='Жим штанги лёжа').id,run=EX.find(e=>e.n==='Бег').id,bw=EX.find(e=>e.n==='Вес тела').id,pull=EX.find(e=>e.n==='Подтягивания').id;
 for(let i=27;i>=0;i--){const d=addDays(t,-i);
  if(i%3===0)LOG.push({id:id++,d,ex:bench,s:4,r:8,w:50+Math.round((27-i)/3)*2.5,demo:1});
  if(i%2===1)LOG.push({id:id++,d,ex:run,km:3+((27-i)%5)*0.5,min:20+((27-i)%5)*3,demo:1});
  if(i%4===0)LOG.push({id:id++,d,ex:pull,s:3,r:6+Math.round((27-i)/7),demo:1});
  if(i%7===0)LOG.push({id:id++,d,ex:bw,v:72-(27-i)*0.08,demo:1});
 }
 sv('df-log',LOG)}
let uid=LOG.reduce((m,x)=>Math.max(m,x.id),0);
const save=()=>{sv('df-log',LOG);if(window.dfWeekRefresh)setTimeout(window.dfWeekRefresh)};

/* описание одной записи */
function desc(x){const e=byId(x.ex);if(!e)return'';
 switch(e.t){
  case'wr':return x.s+'×'+x.r+' · '+nf(x.w)+' кг';
  case'bw':return x.s+'×'+x.r+(x.w?' · +'+nf(x.w)+' кг':'');
  case'hold':return x.s+'×'+x.r+' с';
  case'time':return nf(x.min)+' мин';
  case'cardio':return nf(x.km)+' км · '+nf(x.min)+' мин';
  case'cm':return nf(x.v)+' см';case'kg':return nf(x.v)+' кг';case'pct':return nf(x.v)+' %'}}

/* ---------- вкладка «Отчёты» ---------- */
const $=id=>document.getElementById(id);
let day=today(),br=(()=>{try{return (localStorage.getItem('df-level')||'').replace(/"/g,'')==='novice'||!localStorage.getItem('df-level')?BASIC_BR:'Все'}catch(e){return BASIC_BR}})(),sel=null,q='';
function drawCatalog(){
 const qq=q.trim().toLowerCase();
 const isBasic=e=>e.b===BASIC_BR||CLASSIC.includes(e.n);
 const L=[...EX].sort((a,b)=>isBasic(b)-isBasic(a)).filter(e=>(br==='Все'||(br===BASIC_BR?isBasic(e):e.b===br))&&(!qq||e.n.toLowerCase().includes(qq)||e.b.toLowerCase().includes(qq)||(window.dfHow&&window.dfHow.tags(e).includes(qq))));
 $('rCount').textContent=L.length?'Найдено: '+L.length:'';
 $('rList').innerHTML=L.length?L.slice(0,60).map(e=>'<button type="button" class="rx'+(sel&&sel.id===e.id?' on':'')+'" data-id="'+e.id+'"><b>'+esc(e.n)+'</b><small>'+(isBasic(e)?'<i class="rbase">База</i> ':'')+esc(e.b===BASIC_BR?'Для новичков':e.b)+' · '+TYPE[e.t]+'</small></button>').join(''):'<p class="mut">Ничего не нашлось. Попробуй другое слово, например «жим» или «бег».</p>';
}
function drawChips(){$('rBr').innerHTML=['Все',BASIC_BR,...CAT.map(c=>c[0]).filter(b=>b!==BASIC_BR)].map(b=>'<button type="button" class="'+(b===br?'on':'')+'" data-b="'+esc(b)+'">'+esc(b)+'</button>').join('')}
const F={ // [поле, подпись, по умолчанию, шаг, максимум] — максимум защищает от опечаток вроде 4000 кг
 wr:[['s','Подходы',4,1,50],['r','Повторы',10,1,100],['w','Вес, кг',40,0.5,400]],
 bw:[['s','Подходы',3,1,50],['r','Повторы',10,1,200],['w','Доп. вес, кг',0,0.5,150]],
 hold:[['s','Подходы',3,1,50],['r','Секунды',30,1,600]],
 time:[['min','Минуты',20,1,600]],
 cardio:[['km','Дистанция, км',3,0.1,100],['min','Время, мин',20,1,600]],
 cm:[['v','Сантиметры',0,0.1,300]],kg:[['v','Килограммы',70,0.1,300]],pct:[['v','Проценты',15,0.1,70]]};
function drawForm(){const f=$('rForm');
 if(!sel){f.innerHTML='<p class="mut">Выбери упражнение в списке слева или найди его поиском.</p>';return}
 const last=[...LOG].reverse().find(x=>x.ex===sel.id);
 f.innerHTML='<div class="rsel"><b>'+esc(sel.n)+'</b><small>'+esc(sel.b)+'</small></div><div class="rfields">'+F[sel.t].map(([k,l,def,st,mx])=>'<label>'+l+'<input type="number" inputmode="decimal" min="0" max="'+mx+'" step="'+st+'" name="'+k+'" value="'+(last&&last[k]!=null?+(Math.round(last[k]/st)*st).toFixed(2):def)+'" required></label>').join('')+'</div>'
  +(()=>{const v=(window.dfVideos||[]).find(v=>v.ex===sel.n);return v?'<a class="rvid" href="https://www.youtube.com/'+(v.short?'shorts/':'watch?v=')+encodeURIComponent(v.yt)+'" target="_blank" rel="noopener noreferrer">'+ic('play')+' Как делать: видео</a>':''})()+(window.dfHow?window.dfHow.block(sel):'')+(last?'<p class="mut rlast">В прошлый раз ('+fmtDate(last.d)+'): '+esc(desc(last))+'</p>':'')
  +'<button class="btn" type="submit">Добавить в отчёт за '+(day===today()?'сегодня':fmtDate(day))+'</button>'+'<div class="rtw" id="rTw"></div>';
 if(window.dfWoPick)window.dfWoPick($('rTw'),sel);
 const first=f.querySelector('input');if(first)first.focus({preventScroll:true});
}
function drawDay(){
 $('rDate').value=day;$('rDayT').textContent=day===today()?'сегодня':fmtDate(day);
 const L=LOG.filter(x=>x.d===day);
 $('rDay').innerHTML=L.length?L.map(x=>{const e=byId(x.ex);return'<li><div><b>'+esc(e?e.n:'?')+'</b><small>'+esc(e?e.b:'')+'</small></div><em>'+esc(desc(x))+'</em><button type="button" class="pdel" data-id="'+x.id+'" aria-label="Удалить запись">'+ic('close')+'</button></li>'}).join(''):'<li class="mut">За этот день записей нет.</li>';
 let ton=0,km=0,min=0,sets=0;L.forEach(x=>{const e=byId(x.ex);if(!e)return;if(e.t==='wr'){ton+=x.s*x.r*x.w;sets+=x.s}if(e.t==='bw'||e.t==='hold')sets+=x.s;if(e.t==='cardio'){km+=x.km;min+=x.min}if(e.t==='time')min+=x.min});
 const sm=[];if(sets)sm.push('Подходов: '+sets);if(ton)sm.push('Тоннаж: '+nf(ton)+' кг');if(km)sm.push('Дистанция: '+nf(km)+' км');if(min)sm.push('Время: '+nf(min)+' мин');
 $('rSum').textContent=sm.join(' · ');
 $('rSum').hidden=!sm.length;
}
function drawReports(){drawChips();drawCatalog();drawForm();drawDay()}
$('rQ').addEventListener('input',e=>{q=e.target.value;if(q.trim()&&br!=='Все'){br='Все';drawChips()}drawCatalog()}); // поиск всегда идёт по всем направлениям
$('rQ').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const b=$('rList').querySelector('.rx');if(b)b.click()}});
$('rBr').onclick=e=>{const b=e.target.closest('button');if(!b)return;br=b.dataset.b;drawChips();drawCatalog()};
$('rList').onclick=e=>{const b=e.target.closest('.rx');if(!b)return;sel=byId(+b.dataset.id);drawCatalog();drawForm();
 if(innerWidth<900||document.body.classList.contains('phone'))$('rForm').scrollIntoView({behavior:'smooth',block:'center'})};
$('rForm').onsubmit=e=>{e.preventDefault();if(!sel)return;const fd=new FormData(e.target),x={id:++uid,d:day,ex:sel.id};
 F[sel.t].forEach(([k])=>x[k]=num(fd.get(k)));LOG.push(x);save();drawForm();drawDay();
 const ok=$('rOk');ok.textContent='Записано: '+sel.n+' — '+desc(x);ok.hidden=false;clearTimeout(ok._t);ok._t=setTimeout(()=>ok.hidden=true,2500)};
$('rDay').onclick=e=>{const b=e.target.closest('.pdel');if(!b)return;LOG=LOG.filter(x=>x.id!==+b.dataset.id);save();drawDay()};
$('rPrev').onclick=()=>{day=addDays(day,-1);drawDay();drawForm()};
$('rNext').onclick=()=>{if(day<today()){day=addDays(day,1);drawDay();drawForm()}};
$('rToday').onclick=()=>{day=today();drawDay();drawForm()};
$('rDate').max=today();
$('rDate').onchange=e=>{if(e.target.value){day=e.target.value>today()?today():e.target.value;drawDay();drawForm()}};

/* ---------- графики в кабинете (до 3) ---------- */
const MET={wr:[['max','Макс. вес, кг'],['ton','Тоннаж, кг'],['rm','Оценка 1ПМ, кг']],bw:[['reps','Повторы в подходе'],['tot','Всего повторов']],hold:[['sec','Секунды']],time:[['min','Минуты']],cardio:[['km','Дистанция, км'],['pace','Темп, мин/км'],['min','Время, мин']],cm:[['v','Сантиметры']],kg:[['v','Килограммы']],pct:[['v','Проценты']]};
function val(x,e,m){switch(m){case'max':return x.w;case'ton':return x.s*x.r*x.w;case'rm':return x.w*(1+x.r/30);case'reps':return x.r;case'tot':return x.s*x.r;case'sec':return x.r;case'min':return x.min;case'km':return x.km;case'pace':return x.km?x.min/x.km:0;default:return x.v}}
const SUM={ton:1,tot:1,km:1,min:1}; // за день складываем; остальное — берём максимум (темп — минимум)
let CH=ld('df-charts',null);
if(!Array.isArray(CH)||CH.length!==3){CH=[{ex:EX.find(e=>e.n==='Жим штанги лёжа').id,m:'max'},{ex:EX.find(e=>e.n==='Бег').id,m:'km'},{ex:EX.find(e=>e.n==='Вес тела').id,m:'v'}];sv('df-charts',CH)}
let per=ld('df-charts-per',30),cmode=ld('df-charts-mode',3);
function series(c){const e=byId(c.ex);if(!e)return[];const from=per?addDays(today(),-per+1):'0000';const m={};
 LOG.filter(x=>x.ex===c.ex&&x.d>=from).forEach(x=>{const v=val(x,e,c.m);if(!(v>0))return;
  if(m[x.d]==null)m[x.d]=v;else m[x.d]=SUM[c.m]?m[x.d]+v:(c.m==='pace'?Math.min(m[x.d],v):Math.max(m[x.d],v))});
 return Object.keys(m).sort().map(d=>[d,m[d]])}
function svg(pts,big){if(!pts.length)return'<div class="cempty">Нет записей за период</div>';
 const W=big?760:320,H=big?300:150,P=big?[40,14,26,10]:[28,10,22,8]; // left,top,bottom,right
 const ys=pts.map(p=>p[1]);let lo=Math.min(...ys),hi=Math.max(...ys);if(lo===hi){lo-=1;hi+=1}const pad=(hi-lo)*.12;lo-=pad;hi+=pad;
 const t0=new Date(pts[0][0]+'T12:00').getTime(),t1=new Date(pts[pts.length-1][0]+'T12:00').getTime(),span=Math.max(1,t1-t0);
 const X=d=>P[0]+(pts.length===1?(W-P[0]-P[3])/2:(new Date(d+'T12:00').getTime()-t0)/span*(W-P[0]-P[3])),Y=v=>P[1]+(1-(v-lo)/(hi-lo))*(H-P[1]-P[2]);
 const line=pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ');
 const area=line+' L'+X(pts[pts.length-1][0]).toFixed(1)+' '+(H-P[2])+' L'+X(pts[0][0]).toFixed(1)+' '+(H-P[2])+'Z';
 const g=(big?[0,.25,.5,.75,1]:[0,.5,1]).map(f=>{const v=lo+(hi-lo)*(1-f),y=P[1]+f*(H-P[1]-P[2]);return'<line x1="'+P[0]+'" x2="'+(W-P[3])+'" y1="'+y+'" y2="'+y+'" class="cg"/><text x="'+(P[0]-4)+'" y="'+(y+3)+'" text-anchor="end" class="ct">'+nf(v)+'</text>'}).join('');
 const lab=d=>new Date(d+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
 const dots=pts.map(p=>'<circle cx="'+X(p[0]).toFixed(1)+'" cy="'+Y(p[1]).toFixed(1)+'" r="'+(big?3.4:2.6)+'" class="cd"><title>'+lab(p[0])+': '+nf(p[1])+'</title></circle>').join('');
 return'<svg viewBox="0 0 '+W+' '+H+'" class="csvg'+(big?' big':'')+'" role="img" aria-label="График">'+g+'<path d="'+area+'" class="ca"/><path d="'+line+'" class="cl"/>'+dots
  +'<text x="'+P[0]+'" y="'+(H-6)+'" class="ct">'+lab(pts[0][0])+'</text><text x="'+(W-P[3])+'" y="'+(H-6)+'" text-anchor="end" class="ct">'+lab(pts[pts.length-1][0])+'</text></svg>'}
function drawCharts(){const box=$('charts');if(!box)return;
 const used=[...new Set(LOG.map(x=>x.ex))].map(byId).filter(Boolean).sort((a,b)=>a.n.localeCompare(b.n,'ru'));
 $('chPer').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.p===per));
 $('chDemo').hidden=!LOG.some(x=>x.demo);
 $('chMode').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.m===cmode));
 box.classList.toggle('one',cmode===1);
 box.innerHTML=CH.slice(0,cmode).map((c,i)=>{const e=byId(c.ex);const ms=e?MET[e.t]:[];if(e&&!ms.some(m=>m[0]===c.m))c.m=ms[0][0];
  const pts=e?series(c):[];const last=pts.length?pts[pts.length-1][1]:null,first=pts.length?pts[0][1]:null;
  const diff=pts.length>1?last-first:0,better=c.m==='pace'?diff<0:diff>0,neutral=['cm','kg','pct'].includes(e&&e.t);
  return'<div class="chart"><div class="chh"><select data-i="'+i+'" data-k="ex" aria-label="Упражнение для графика '+(i+1)+'"><option value="0">— выбери упражнение —</option>'+used.map(u=>'<option value="'+u.id+'"'+(c.ex===u.id?' selected':'')+'>'+esc(u.n)+'</option>').join('')+'</select>'
   +(e?'<select data-i="'+i+'" data-k="m" aria-label="Показатель">'+ms.map(m=>'<option value="'+m[0]+'"'+(c.m===m[0]?' selected':'')+'>'+m[1]+'</option>').join('')+'</select>':'')+'</div>'
   +(e?'<div class="chv"><b>'+(last!=null?nf(last):'—')+'</b>'+(pts.length>1&&diff?'<span class="'+(neutral?'neu':better?'up':'dn')+'">'+(diff>0?'+':'')+nf(diff)+'</span>':'')+'</div>'+svg(pts,cmode===1):'<div class="cempty">Выбери упражнение, по которому есть записи</div>')+'</div>'}).join('');
}
const chBox=$('charts');
if(chBox){chBox.onchange=e=>{const s=e.target.closest('select');if(!s)return;const c=CH[+s.dataset.i];if(s.dataset.k==='ex'){c.ex=+s.value;const ex=byId(c.ex);c.m=ex?MET[ex.t][0][0]:''}else c.m=s.value;sv('df-charts',CH);drawCharts()};
 $('chPer').onclick=e=>{const b=e.target.closest('button');if(!b)return;per=+b.dataset.p;sv('df-charts-per',per);drawCharts()};
 $('chMode').onclick=e=>{const b=e.target.closest('button');if(!b)return;cmode=+b.dataset.m;sv('df-charts-mode',cmode);drawCharts()};
 $('chDemo').onclick=()=>{LOG=LOG.filter(x=>!x.demo);save();drawCharts();drawDay()};
 $('chGo').onclick=()=>window.go('reports')}

/* ---------- «Активность за неделю» и «Тренировки по группам» в кабинете — из записей ---------- */
window.dfWeekHook=w=>{const box=$('wkCols');if(!box)return;
 const start=dk(w),days=[...Array(7)].map((_,i)=>addDays(start,i)),t=today();
 const stat=d=>{const L=LOG.filter(x=>x.d===d);let sets=0,min=0;L.forEach(x=>{const e=byId(x.ex);if(!e)return;if(e.t==='wr'||e.t==='bw'||e.t==='hold')sets+=x.s;if(e.t==='cardio'||e.t==='time')min+=x.min});return{n:L.length,sets,min}};
 const S=days.map(stat),mx=Math.max(1,...S.map(x=>x.n)),tot=S.reduce((a,x)=>a+x.n,0);
 box.innerHTML=S.map((x,i)=>{const h=x.n?Math.max(8,Math.round(x.n/mx*100)):0,pc=tot?Math.round(x.n/tot*100):0;
  return'<div class="wkc'+(days[i]===t?' td':'')+(days[i]>t?' fut':'')+'" title="'+fmtDate(days[i])+': записей '+x.n+(x.sets?', подходов '+x.sets:'')+(x.min?', '+nf(x.min)+' мин':'')+'"><span class="wkb"><span class="wkv">'+(x.n?pc+'%':'')+'</span><i style="height:calc((100% - 18px) * '+(h/100)+')"></i></span><small>'+['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]+'</small><span class="wkn">'+(x.n||'—')+'</span></div>'}).join('');
 const act=S.filter(x=>x.n).length,sets=S.reduce((a,x)=>a+x.sets,0),min=S.reduce((a,x)=>a+x.min,0);
 const prev=[...Array(7)].map((_,i)=>addDays(start,i-7)).reduce((a,d)=>a+LOG.filter(x=>x.d===d).length,0);
 const ch=prev?Math.round((tot-prev)/prev*100):null;
 $('wkSum').innerHTML='Активных дней: <b>'+act+' из 7</b> ('+Math.round(act/7*100)+'%) · записей: <b>'+tot+'</b>'+(sets?' · подходов: <b>'+sets+'</b>':'')+(min?' · кардио: <b>'+nf(min)+' мин</b>':'')
  +(ch!==null?' · <span class="'+(ch>=0?'up':'dn')+'">'+(ch>0?'+':'')+ch+'% к прошлой неделе</span>':'');
 // группы
 const g={};days.forEach(d=>LOG.filter(x=>x.d===d).forEach(x=>{const e=byId(x.ex);if(e)g[e.b]=(g[e.b]||0)+1}));
 const G=Object.entries(g).sort((a,b)=>b[1]-a[1]),sum=G.reduce((a,x)=>a+x[1],0),dn=$('dn'),lg=$('lg');
 if(!dn)return;
 if(!sum){dn.style.background='conic-gradient(var(--bd2,#ffffff30) 0 100%)';lg.textContent='Нет записей за эту неделю';return}
 const top=G.slice(0,3);if(G.length>3)top.push(['Другое',G.slice(3).reduce((a,x)=>a+x[1],0)]);
 const C=['var(--acc)','#ffffffd0','#ffffff70','#ffffff30'];let acc=0;
 dn.style.background='conic-gradient('+top.map(([n,v],i)=>{const a=acc;acc+=v/sum*100;return C[i]+' '+a+'% '+acc+'%'}).join(',')+')';
 lg.innerHTML=top.map(([n,v],i)=>'<span class="lgi"><i style="background:'+C[i]+'"></i>'+esc(n)+' '+Math.round(v/sum*100)+'%</span>').join('');
};
if(window.dfWeekRefresh)window.dfWeekRefresh();
/* уровень упражнения: 1 — новичок (база), 2 — любитель, 3 — профи */
const PRO_BR=['Тяжёлая атлетика','Кроссфит и функционал'],PRO_OK=['Берпи','Прыжки на тумбу','Махи гирей','Фермерская прогулка'],
 PRO_N=['Выход силой','Передний вис','Задний вис','Стойка на руках','Флажок','Уголок на брусьях','Отжимания в стойке на руках','Пистолетик','Приседания с паузой','Жим лёжа с паузой','Становая тяга сумо','Лазание по канату'];
const lvlOf=e=>(e.b===BASIC_BR||CLASSIC.includes(e.n))?1:((PRO_BR.includes(e.b)&&!PRO_OK.includes(e.n))||PRO_N.includes(e.n))?3:2;
window.dfCat={CAT,EX,byId,desc,lvlOf,BASIC_BR,F,TYPE,today,addDays,fmtDate,refresh:()=>{drawDay();drawCharts()},log:()=>LOG,add:(x)=>{x.id=++uid;LOG.push(x);save();drawDay()},remove:ids=>{const s=new Set(ids);LOG=LOG.filter(x=>!s.has(x.id));save();drawDay()}};
drawReports();drawCharts();
const _go=window.go;window.go=function(id){_go(id);if(id==='reports')drawReports();if(id==='cabinet')drawCharts()};
})();
