/* sport.js — инструменты на странице «Спорт»: генератор тренировки, интервальный таймер, карта мышц, личные рекорды.
   Берёт каталог и записи из reports.js (window.dfCat), видео из library.js (window.dfVideos), «План дня» — window.dfPlans. */
(()=>{
const $=id=>document.getElementById(id);
if(!$('spTools'))return;
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const C=()=>window.dfCat||{EX:[],CAT:[],log:()=>[],byId:()=>null,desc:()=>''};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

/* таймер во весь экран: сначала настоящий fullscreen, если браузер не даёт — окно поверх сайта */
(()=>{const box=$('intBox'),b=$('intFs');
 const set=on=>{box.classList.toggle('intfull',on);document.body.classList.toggle('intlock',on);b.innerHTML='<svg class="ic"><use href="#i-'+(on?'shrink':'expand')+'"/></svg>';b.setAttribute('aria-label',on?'Свернуть':'Во весь экран');b.title=on?'Свернуть (Esc)':'Во весь экран'};
 b.onclick=()=>{const on=!box.classList.contains('intfull');set(on);
  try{if(on&&box.requestFullscreen)box.requestFullscreen().catch(()=>{});else if(!on&&document.fullscreenElement)document.exitFullscreen().catch(()=>{})}catch(e){}};
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&box.classList.contains('intfull'))set(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&box.classList.contains('intfull'))set(false)});
})();

/* ================= библиотека видео: плитки-подборки ================= */
(()=>{const T=[['Для новичков','spark','С чего начать'],['Зарядка','sunrise','Утро за 10 минут'],['Растяжка','stretch','Гибкость и восстановление'],['Зал: Ноги','dumbbell','Ноги в зале']];
 const V=window.dfVideos||[],cnt=c=>V.filter(v=>v.cat===c).length;
 const word=n=>n%10===1&&n%100!==11?'видео':'видео';
 $('vlTiles').innerHTML=T.map(([c,i,s])=>'<button type="button" class="vlt" data-cat="'+esc(c)+'"><span class="vli">'+ic(i)+'</span><b>'+esc(c.replace('Зал: ','Зал · '))+'</b><small>'+esc(s)+'</small><em>'+cnt(c)+' '+word(cnt(c))+'</em></button>').join('');
 const openCat=cat=>{window.go('video');if(!cat)return;const b=[...document.querySelectorAll('#vCats button')].find(x=>x.textContent.trim()===cat);if(b)b.click()};
 $('vlTiles').onclick=e=>{const b=e.target.closest('[data-cat]');if(b)openCat(b.dataset.cat)};
 $('vlAll').onclick=()=>openCat('Все');
})();

/* ================= уровень: новичок / любитель / профи ================= */
const LV={novice:1,amateur:2,pro:3};
let LEVEL=ld('df-level','novice');if(!LV[LEVEL])LEVEL='novice';
const okLvl=x=>(C().lvlOf?C().lvlOf(x):1)<=LV[LEVEL];
const LDESC={novice:'Только базовые упражнения: приседания, отжимания, планка, выпады — понятно без зала и тренера. У каждого есть видео «как делать».',
 amateur:'База плюс гантели и тренажёры: жимы, тяги, блоки. Для тех, кто уже ходит в зал.',
 pro:'Всё подряд: тяжёлая атлетика, кроссфит, элементы воркаута и вариации для опытных.'};
const TODAY={novice:['Всё тело для старта',[['Приседания','3×15'],['Отжимания с колен','3×10'],['Ягодичный мостик на полу','3×15'],['Планка','3×30 с']]],
 amateur:['Грудь и спина',[['Отжимания','3×20'],['Тяга гантели одной рукой','3×12'],['Жим гантелей лёжа','3×10'],['Выпады с гантелями','3×12']]],
 pro:['Грудь и трицепс',[['Жим штанги лёжа','4×10 · 60 кг'],['Отжимания на брусьях','3×12'],['Жим гантелей на наклонной скамье','3×10'],['Разгибания на блоке (трицепс)','3×12']]]};
function vidLink(n){const v=(window.dfVideos||[]).find(v=>v.ex===n);return v?'<a class="mxv tv" href="https://www.youtube.com/'+(v.short?'shorts/':'watch?v=')+encodeURIComponent(v.yt)+'" target="_blank" rel="noopener noreferrer" title="Видео: как делать" aria-label="Видео: '+esc(n)+'">'+ic('play')+'</a>':''}
function drawToday(){const [t,L]=TODAY[LEVEL];$('todayT').textContent='Сегодня: '+t.toLowerCase();
 $('todayL').innerHTML=L.map(([n,x])=>'<li><span class="tn2">'+vidLink(n)+esc(n)+'</span><span>'+esc(x)+'</span></li>').join('')}
function drawLevel(){document.querySelectorAll('#lvlBar [data-l]').forEach(b=>{const on=b.dataset.l===LEVEL;b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on))});$('lvlDesc').textContent=LDESC[LEVEL]}
$('lvlBar').onclick=e=>{const b=e.target.closest('[data-l]');if(!b)return;LEVEL=b.dataset.l;sv('df-level',LEVEL);drawLevel();drawToday();build();musAll=false;drawMus()};
$('todayBtn').onclick=()=>{if(window.dfTrainPay)window.dfTrainPay()};

/* ================= генератор тренировки ================= */
const GROUPS={'Грудь':['Грудь'],'Спина':['Спина'],'Ноги':['Ноги'],'Плечи':['Плечи'],'Руки':['Руки'],'Ягодицы':['Ягодицы'],'Пресс':['Пресс и кор'],'Всё тело':['Грудь','Спина','Ноги','Плечи','Пресс и кор'],'Кардио':['Кардио','Кроссфит и функционал']};
let G=ld('df-gen',{g:'Грудь',t:45,e:'Зал'}),gen=[];
function okEquip(x){if(G.e==='Зал')return true;if(G.e==='Без инвентаря')return x.t==='bw'||x.t==='hold'||(x.t==='cardio'&&/Бег|Ходьба/.test(x.n))||(x.t==='time'&&/Скакалка|Растяжка|Йога/.test(x.n));
 return x.t==='bw'||x.t==='hold'||/гантел|гир/i.test(x.n)||(x.t==='cardio'&&/Бег/.test(x.n))}
function presc(x){const r=pick;switch(x.t){case'wr':return r([3,4,4])+'×'+r([6,8,10,12]);case'bw':return r([3,4])+'×'+r([10,12,15]);case'hold':return'3×'+r([30,45,60])+' с';
 case'cardio':return r([15,20,25])+' мин';case'time':return r([5,8,10])+' мин';default:return''}}
const EXTRA={'Ноги':['Пистолетик','Прыжки на тумбу','Берпи'],'Грудь':['Отжимания'],'Спина':['Подтягивания широким хватом'],'Плечи':['Отжимания в стойке на руках','Стойка на руках'],'Руки':['Отжимания узким хватом'],'Ягодицы':['Пистолетик'],'Пресс':['Уголок на брусьях'],'Кардио':[],'Всё тело':['Берпи','Отжимания']};
const GB={'Грудь':['Отжимания','Отжимания с колен'],'Спина':['Супермен (лодочка)','Австралийские подтягивания','Подтягивания','Гиперэкстензия'],'Ноги':['Приседания','Выпады','Выпады назад','Приседания плие (сумо)','Выпрыгивания из приседа','Стульчик у стены'],'Плечи':['Жим гантелей стоя','Махи гантелей в стороны'],'Руки':['Подъём гантелей на бицепс','Обратные отжимания от скамьи','Разгибание руки с гантелью в наклоне','Отжимания узким хватом'],'Ягодицы':['Ягодичный мостик на полу','Махи ногами','Приседания плие (сумо)','Выпады назад'],'Пресс':['Планка','Боковая планка','Скручивания','Велосипед (на пресс)','Подъёмы ног лёжа','Скалолаз (альпинист)'],'Всё тело':['Приседания','Отжимания','Планка','Выпады','Берпи','Прыжки «Джампинг Джек»','Супермен (лодочка)'],'Кардио':['Бег на месте','Прыжки «Джампинг Джек»','Скакалка','Ходьба','Бег','Берпи','Скалолаз (альпинист)']};
function build(){const br=GROUPS[G.g],n={30:4,45:5,60:6}[G.t]||5,ex=EXTRA[G.g]||[];let pool=C().EX.filter(x=>(br.includes(x.b)||(G.e!=='Зал'&&ex.includes(x.n))||(GB[G.g]||[]).includes(x.n))&&okEquip(x)&&okLvl(x)&&!['cm','kg','pct'].includes(x.t));
 if(G.g==='Всё тело'&&LEVEL!=='novice'){const by=br.map(b=>shuffle(pool.filter(x=>x.b===b)));gen=[];let i=0;while(gen.length<n&&by.some(l=>l.length)){const l=by[i%by.length];if(l.length)gen.push(l.shift());i++}}
 else gen=shuffle(pool).slice(0,n);
 gen=gen.map(x=>({t:x.n,x:presc(x),b:x.b}));drawGen()}
function drawGen(){
 $('genG').innerHTML=Object.keys(GROUPS).map(g=>'<button type="button" class="'+(g===G.g?'on':'')+'" data-g="'+g+'">'+g+'</button>').join('');
 $('genT').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.t===G.t));
 $('genE').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.e===G.e));
 $('genList').innerHTML=gen.length?gen.map((p,i)=>'<li><i>'+(i+1)+'</i><b>'+esc(p.t)+'</b><em>'+esc(p.x)+'</em></li>').join(''):'<li class="mut">Под такие условия упражнений не нашлось — попробуй «Зал».</li>';
 $('genAdd').disabled=!gen.length}
$('genG').onclick=e=>{const b=e.target.closest('button');if(!b)return;G.g=b.dataset.g;sv('df-gen',G);build()};
$('genT').onclick=e=>{const b=e.target.closest('button');if(!b)return;G.t=+b.dataset.t;sv('df-gen',G);build()};
$('genE').onclick=e=>{const b=e.target.closest('button');if(!b)return;G.e=b.dataset.e;sv('df-gen',G);build()};
$('genNew').onclick=build;
$('genAdd').onclick=()=>{if(!gen.length||!window.dfPlans)return;window.dfPlans.add(gen);const m=$('genMsg');m.innerHTML='Добавлено в «План дня»: '+gen.length+' упр. <button type="button" class="lnk2" data-go="main">Открыть главную →</button>';m.hidden=false;
 m.querySelector('[data-go]').onclick=()=>window.go('main')};

/* ================= интервальный таймер ================= */
const MODES={tabata:{w:20,r:10,n:8,name:'Табата'},emom:{w:60,r:0,n:10,name:'EMOM'},custom:ld('df-int',{w:40,r:20,n:6,name:'Свой'})};
let mode='tabata',run=false,phase='idle',left=0,round=0,endAt=0,raf=0,actx=null;
function beep(f,d){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=f;o.connect(g);g.connect(actx.destination);g.gain.setValueAtTime(.18,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+d);o.start();o.stop(actx.currentTime+d)}catch(e){}
 try{navigator.vibrate&&navigator.vibrate(120)}catch(e){}}
const M=()=>MODES[mode];
const mmss=s=>{s=Math.max(0,Math.ceil(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function setPhase(p,sec){phase=p;left=sec;endAt=performance.now()+sec*1000;
 if(p==='work')beep(880,.35);else if(p==='rest')beep(440,.35);else if(p==='done'){beep(660,.25);setTimeout(()=>beep(990,.5),280)}}
function next(){const m=M();
 if(phase==='prep'||phase==='rest'){round++;setPhase('work',m.w);return}
 if(phase==='work'){if(round>=m.n){setPhase('done',0);run=false;return}if(m.r>0)setPhase('rest',m.r);else{round++;setPhase('work',m.w)}}}
let lastS=-1;
function loop(){if(!run)return;left=(endAt-performance.now())/1000;const s=Math.ceil(left);
 if(s!==lastS&&s<=3&&s>0&&phase!=='done')beep(520,.12);lastS=s;
 if(left<=0)next();drawInt();if(run)raf=requestAnimationFrame(loop)}
function drawInt(){const m=M(),box=$('intBox');
 $('intModes').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.m===mode));
 $('intCustom').hidden=mode!=='custom';
 box.dataset.ph=phase;
 $('intPh').textContent={idle:'Готов?',prep:'Приготовься',work:'Работа',rest:'Отдых',done:'Готово!'}[phase];
 const tot=phase==='work'?m.w:phase==='rest'?m.r:phase==='prep'?5:1;
 $('intTime').textContent=phase==='idle'?mmss(m.w):phase==='done'?'00:00':mmss(left);
 $('intRound').textContent=phase==='idle'?m.n+' раундов · '+m.w+' с работа'+(m.r?' / '+m.r+' с отдых':''):phase==='done'?'Все '+m.n+' раундов пройдены':'Раунд '+Math.max(1,round)+' из '+m.n;
 $('intBar').style.width=(phase==='idle'||phase==='done'?(phase==='done'?100:0):Math.min(100,(1-left/tot)*100))+'%';
 $('intGo').textContent=run?'Пауза':(phase==='idle'||phase==='done'?'Старт':'Продолжить')}
let pausedLeft=0;
$('intGo').onclick=()=>{if(run){run=false;pausedLeft=left;cancelAnimationFrame(raf);drawInt();return}
 if(phase==='idle'||phase==='done'){round=0;setPhase('prep',5)}else{endAt=performance.now()+pausedLeft*1000}
 run=true;loop()};
$('intReset').onclick=()=>{run=false;cancelAnimationFrame(raf);phase='idle';round=0;drawInt()};
$('intModes').onclick=e=>{const b=e.target.closest('button');if(!b||run)return;mode=b.dataset.m;phase='idle';drawInt()};
$('intCustom').oninput=e=>{const f=e.target;if(!f.name)return;const v=Math.max(f.name==='n'?1:0,Math.min(f.name==='n'?50:600,+f.value||0));MODES.custom[f.name]=v;sv('df-int',MODES.custom);if(!run){phase='idle';drawInt()}};
['w','r','n'].forEach(k=>{const f=$('intCustom').querySelector('[name='+k+']');if(f)f.value=MODES.custom[k]});

/* ================= карта мышц ================= */
const MUS={
 chest:{n:'Грудь',d:'Грудные мышцы. Работают, когда толкаешь что-то от себя: жимы и отжимания.',top:['Отжимания', 'Отжимания с колен', 'Жим штанги лёжа', 'Жим гантелей лёжа'],br:['Грудь'],kw:['жим лёжа'],vid:'Зал: Грудь'},
 delts:{n:'Плечи (дельты)',d:'Поднимают руки вперёд, в стороны и назад — от них зависит ширина плеч.',top:['Жим гантелей стоя', 'Махи гантелей в стороны', 'Армейский жим', 'Махи в наклоне (задняя дельта)'],br:['Плечи'],kw:['швунг'],vid:'Зал: Плечи'},
 biceps:{n:'Бицепс',d:'Передняя часть плеча. Сгибает руку в локте: подтянуть, поднять, притянуть к себе.',top:['Подъём гантелей на бицепс', 'Молотки с гантелями', 'Подъём штанги на бицепс', 'Подтягивания'],kw:['бицепс','молотки','скотта'],vid:'Зал: Руки'},
 triceps:{n:'Трицепс',d:'Задняя часть плеча — около двух третей объёма руки. Разгибает руку в жимах и отжиманиях.',top:['Обратные отжимания от скамьи', 'Отжимания узким хватом', 'Разгибание руки с гантелью в наклоне', 'Французский жим'],kw:['трицепс','французский','узким','разгибание гантели'],vid:'Зал: Руки'},
 forearms:{n:'Предплечья',d:'Отвечают за хват: чем они сильнее, тем дольше держишь гриф, гантели и турник.',top:['Фермерская прогулка','Сгибания запястий (предплечья)','Молотки с гантелями','Подтягивания'],kw:['запяст','фермер','вис'],vid:'Зал: Руки'},
 abs:{n:'Пресс',d:'Прямая и косые мышцы живота. Держат корпус ровным и защищают поясницу.',top:['Планка', 'Скручивания', 'Велосипед (на пресс)', 'Подъёмы ног лёжа'],br:['Пресс и кор'],kw:['уголок'],vid:'Пресс'},
 quads:{n:'Квадрицепс',d:'Передняя часть бедра. Разгибает ногу в колене: приседания, выпады, прыжки.',top:['Приседания', 'Выпады', 'Приседания со штангой', 'Жим ногами'],kw:['приседания','жим ногами','выпады','разгибание ног','гакк','пистолет','тумбу','стульчик'],vid:'Зал: Ноги'},
 adductors:{n:'Приводящие бедра',d:'Внутренняя часть бедра. Сводят ноги и держат колени ровно в приседе.',top:['Приседания плие (сумо)', 'Становая тяга сумо', 'Выпады', 'Поперечный шпагат (см до пола)'],kw:['сумо','поперечный'],vid:'Зал: Ноги'},
 calves:{n:'Икры',d:'Поднимают тело на носки — нужны для бега, прыжков и обычной ходьбы.',top:['Подъёмы на носки (икры)', 'Скакалка', 'Прыжки «Джампинг Джек»', 'Бег на месте'],kw:['носки','скакалка'],vid:'Зал: Ноги'},
 traps:{n:'Трапеции',d:'Поднимают и сводят плечи, помогают держать осанку.',top:['Шраги','Тяга штанги к подбородку','Фермерская прогулка','Становая тяга классическая'],kw:['шраги','подбородку'],vid:'Зал: Спина'},
 lats:{n:'Широчайшие',d:'Самые большие мышцы спины. Тянут руки вниз и к себе — делают спину «буквой V».',top:['Австралийские подтягивания', 'Подтягивания', 'Тяга верхнего блока', 'Тяга гантели одной рукой'],kw:['подтягивания','тяга верхнего','тяга штанги в наклоне','тяга гантели','горизонтального','т-грифа','пуловер'],vid:'Зал: Спина'},
 lower:{n:'Поясница',d:'Мышцы вдоль позвоночника. Держат спину прямой в тягах и приседаниях.',top:['Супермен (лодочка)', 'Гиперэкстензия', 'Становая тяга с гантелями', 'Румынская тяга'],kw:['гиперэкстензия','становая'],vid:'Зал: Спина'},
 glutes:{n:'Ягодицы',d:'Самая сильная мышца тела. Разгибает бедро: встать, прыгнуть, побежать.',top:['Ягодичный мостик на полу', 'Приседания плие (сумо)', 'Махи ногами', 'Ягодичный мостик со штангой'],br:['Ягодицы'],kw:['румынская','сплит'],vid:'Зал: Ягодицы'},
 hams:{n:'Бицепс бедра',d:'Задняя часть бедра. Сгибает колено и помогает ягодицам разгибать бедро.',top:['Становая тяга с гантелями', 'Румынская тяга', 'Сгибание ног лёжа', 'Гиперэкстензия на ягодицы'],kw:['сгибание ног','румынская','становая'],vid:'Зал: Ноги'}};
let mus='chest',musAll=false;
function musList(m){const c=C(),seen=new Set(),out=[];
 m.top.forEach(n=>{const x=c.EX.find(e=>e.n===n);if(x&&okLvl(x)&&!seen.has(x.id)){seen.add(x.id);out.push(x)}});
 c.EX.filter(x=>!['cm','kg','pct'].includes(x.t)&&((m.br||[]).includes(x.b)||m.kw.some(k=>x.n.toLowerCase().includes(k)))).forEach(x=>{if(okLvl(x)&&!seen.has(x.id)){seen.add(x.id);out.push(x)}});
 return out.sort((a,b)=>(c.lvlOf?c.lvlOf(a)-c.lvlOf(b):0))}
function drawMus(){document.querySelectorAll('#musMap [data-m]').forEach(el=>{const on=el.dataset.m===mus;el.classList.toggle('on',on);el.setAttribute('aria-pressed',String(on))});
 const m=MUS[mus],L=musList(m),show=musAll?L:L.slice(0,4),V=window.dfVideos||[];
 $('musName').textContent=m.n;$('musDesc').textContent=m.d;
 $('musEx').innerHTML=show.map(x=>{const v=V.find(v=>v.ex===x.n);return'<div class="mxt"><button type="button" class="mxb" data-ex="'+x.id+'"><b>'+esc(x.n)+'</b><small>'+esc(x.b)+'</small></button>'+(v?'<a class="mxv" href="https://www.youtube.com/'+(v.short?'shorts/':'watch?v=')+encodeURIComponent(v.yt)+'" target="_blank" rel="noopener noreferrer" title="Видео: как делать" aria-label="Видео: '+esc(x.n)+'">'+ic('play')+'</a>':'')+'</div>'}).join('');
 $('musMore').hidden=L.length<=4;$('musMore').textContent=musAll?'Свернуть ↑':'Показать все упражнения ('+L.length+') ↓'}
$('musMap').addEventListener('click',e=>{const el=e.target.closest('[data-m]');if(!el)return;mus=el.dataset.m;musAll=false;drawMus()});
$('musMap').addEventListener('keydown',e=>{const el=e.target.closest('[data-m]');if((e.key==='Enter'||e.key===' ')&&el){e.preventDefault();mus=el.dataset.m;musAll=false;drawMus()}});
$('musMore').onclick=()=>{musAll=!musAll;drawMus()};
$('musVid').onclick=()=>{const cat=MUS[mus].vid;window.go('video');const b=[...document.querySelectorAll('#vCats button')].find(x=>x.textContent.trim()===cat);if(b)b.click()};
$('musEx').onclick=e=>{const b=e.target.closest('.mxb');if(!b)return;window.go('reports');const q=$('rQ');if(q){q.value=C().byId(+b.dataset.ex).n;q.dispatchEvent(new Event('input'));const r=document.querySelector('#rList .rx');if(r)r.click()}};

/* ================= личные рекорды ================= */
function drawRec(){const c=C(),L=c.log(),best={};
 L.forEach(x=>{const e=c.byId(x.ex);if(!e||['cm','kg','pct'].includes(e.t))return;
  const v=e.t==='wr'?x.w:e.t==='bw'?x.r+(x.w||0)/100:e.t==='hold'?x.r:e.t==='cardio'?x.km:x.min;
  if(!(v>0))return;const b=best[x.ex];if(!b||v>b.v||(v===b.v&&x.d<b.x.d))best[x.ex]={v,x,e}});
 const wk=new Date();wk.setDate(wk.getDate()-7);const wks=wk.toISOString().slice(0,10);
 const R=Object.values(best).sort((a,b)=>b.x.d.localeCompare(a.x.d)).slice(0,8);
 const lab=b=>b.e.t==='wr'?b.x.w.toLocaleString('ru-RU')+' кг<small> × '+b.x.r+'</small>':b.e.t==='bw'?b.x.r+' раз'+(b.x.w?'<small> +'+b.x.w+' кг</small>':''):b.e.t==='hold'?b.x.r+' с':b.e.t==='cardio'?String(b.x.km).replace('.',',')+' км':b.x.min+' мин';
 $('recList').innerHTML=R.length?R.map(b=>'<li><div><b>'+esc(b.e.n)+'</b><small>'+new Date(b.x.d+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'})+'</small></div>'+(b.x.d>=wks?'<span class="new">Новый!</span>':'')+'<em>'+lab(b)+'</em></li>').join('')
  :'<li class="mut">Рекорды появятся, когда добавишь записи во вкладке «Отчёты».</li>'}
$('recGo').onclick=()=>window.go('reports');

/* ================= запуск ================= */
drawLevel();drawToday();build();drawInt();drawMus();drawRec();
const _go=window.go;window.go=function(id){_go(id);if(id==='sport'){drawRec();if(!gen.length)build()}};
})();
