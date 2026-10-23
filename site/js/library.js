/* library.js — раздел «Библиотека»: музыка (свои mp3 + плейлисты) и каталог упражнений.
   Состояние пока в памяти (после обновления страницы сбрасывается): в модуле Б переедет в БД. */
(()=>{
const $=id=>document.getElementById(id);
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=s=>isFinite(s)&&s>0?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
const hue=t=>{let h=0;for(const c of t)h=(h*31+c.charCodeAt(0))%360;return h};
const grad=h=>'linear-gradient(135deg,hsl('+h+',85%,55%),hsl('+(h+70)%360+',85%,45%))';

/* ================= МУЗЫКА ================= */
const au=new Audio();au.preload='metadata';au.volume=.8;
let tracks=[],lists=[],cur=null,view='all',shuf=false,rep=false,nid=1,lid=1;
const byId=id=>tracks.find(t=>t.id===id);
const queue=()=>view==='all'?tracks:(lists.find(l=>l.id===view)?.ids||[]).map(byId).filter(Boolean);

function setWave(t){ // цвета фона зависят от текущего трека
  const h=t?hue(t.name):45,r=document.body.style;
  r.setProperty('--c1','hsl('+h+',95%,55%)');r.setProperty('--c2','hsl('+(h+70)%360+',85%,50%)');r.setProperty('--c3','hsl('+(h+170)%360+',85%,50%)')}
function addFiles(fl){
  [...fl].filter(f=>f.type.startsWith('audio/')||/\.(mp3|m4a|wav|ogg)$/i.test(f.name)).forEach(f=>{
    const t={id:nid++,name:f.name.replace(/\.[^.]+$/,''),url:URL.createObjectURL(f),dur:0};tracks.push(t);
    const a=new Audio(t.url);a.preload='metadata';a.onloadedmetadata=()=>{t.dur=a.duration;draw()}});
  draw()}
function play(id){
  const t=byId(id);if(!t)return;cur=id;au.src=t.url;au.play().catch(()=>{});setWave(t);ui();draw()}
function step(d){
  const q=queue();if(!q.length)return;
  let i=q.findIndex(t=>t.id===cur);
  if(shuf&&q.length>1){let n;do n=Math.floor(Math.random()*q.length);while(n===i);i=n}
  else{i+=d;if(i>=q.length){if(!rep&&d>0&&au.ended){ui();return}i=0}if(i<0)i=q.length-1}
  play(q[i].id)}
function ui(){
  const t=byId(cur),p=!au.paused&&!!t;
  $('npName').textContent=t?t.name:'Выбери трек';
  $('npSub').textContent=t?'Моя музыка':'Загрузи mp3 ниже и нажми на трек';
  $('cover').style.background=t?grad(hue(t.name)):'';$('cover').innerHTML=ic('note');
  $('bPlay').innerHTML=ic(p?'pause':'play');$('miniP').innerHTML=ic(p?'pause':'play');
  $('bMute').innerHTML=ic(au.muted?'mute':'volume');const fv=lists.find(x=>x.fav),lk=!!(t&&fv&&fv.ids.includes(t.id));$('bLike').innerHTML=ic(lk?'heartfill':'heart');$('bLike').classList.toggle('on',lk);$('fill').style.width=au.duration?(au.currentTime/au.duration*100)+'%':'0%';$('bShuf').classList.toggle('on',shuf);$('bRep').classList.toggle('on',rep);
  $('miniN').textContent=t?t.name:'';miniVis()}
function miniVis(){
  const onMusic=document.body.dataset.theme==='music';
  $('mini').classList.toggle('on',!!byId(cur)&&!onMusic)}
new MutationObserver(miniVis).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
au.onplay=au.onpause=ui;au.onended=()=>step(1);
au.ontimeupdate=()=>{if(au.duration){const p=au.currentTime/au.duration;$('seek').value=p*1000;$('fill').style.width=(p*100)+'%'}$('tCur').textContent=fmt(au.currentTime)};
au.onloadedmetadata=()=>$('tDur').textContent=fmt(au.duration);
$('pillbar').onclick=e=>{if(!au.duration)return;const r=e.currentTarget.getBoundingClientRect();au.currentTime=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width))*au.duration};
$('bMute').onclick=()=>{au.muted=!au.muted;ui()};
$('bLike').onclick=()=>{const t=byId(cur);if(!t)return;let f=lists.find(x=>x.fav);if(!f){f={id:lid++,name:'Понравилось',ids:[],fav:true};lists.push(f)}
  f.ids.includes(t.id)?f.ids=f.ids.filter(i=>i!==t.id):f.ids.push(t.id);ui();draw()};
$('seek').oninput=e=>{if(au.duration)au.currentTime=e.target.value/1000*au.duration};
$('vol').oninput=e=>au.volume=e.target.value/100;
const toggle=()=>{if(!byId(cur)){const q=queue();if(q.length)play(q[0].id);return}au.paused?au.play():au.pause()};
$('bPlay').onclick=toggle;$('miniP').onclick=toggle;
$('bNext').onclick=()=>step(1);$('bPrev').onclick=()=>step(-1);
$('bShuf').onclick=()=>{shuf=!shuf;ui()};$('bRep').onclick=()=>{rep=!rep;ui()};
$('miniC').onclick=$('miniN').onclick=()=>go('music');
$('files').onchange=e=>{addFiles(e.target.files);e.target.value=''};
const dr=$('drop');
['dragenter','dragover'].forEach(n=>dr.addEventListener(n,e=>{e.preventDefault();dr.classList.add('over')}));
['dragleave','drop'].forEach(n=>dr.addEventListener(n,e=>{e.preventDefault();dr.classList.remove('over')}));
dr.addEventListener('drop',e=>addFiles(e.dataTransfer.files));
$('plForm').onsubmit=e=>{e.preventDefault();const n=$('plName').value.trim();if(!n)return;
  const l={id:lid++,name:n,ids:[]};lists.push(l);view=l.id;$('plName').value='';draw()};
document.addEventListener('keydown',e=>{
  if(e.code==='Space'&&document.getElementById('music').classList.contains('on')&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)&&e.target.tagName!=='BUTTON'){e.preventDefault();toggle()}});

function draw(){
  const ch=$('plChips');ch.innerHTML='';
  const chip=(id,txt)=>{const b=document.createElement('button');b.type='button';b.className='chp'+(view===id?' on':'');b.textContent=txt;b.onclick=()=>{view=id;draw()};ch.appendChild(b)};
  chip('all','Все треки ('+tracks.length+')');lists.forEach(l=>chip(l.id,l.name+' ('+l.ids.filter(byId).length+')'));
  const L=lists.find(l=>l.id===view);
  if(L){const d=document.createElement('button');d.type='button';d.className='chp';d.innerHTML=ic('trash')+' Удалить плейлист';
    d.onclick=()=>{lists=lists.filter(x=>x!==L);view='all';draw()};ch.appendChild(d)}
  $('listTitle').textContent=L?L.name:'Все треки';
  const box=$('tracks');box.innerHTML='';const q=queue();
  if(!q.length){box.innerHTML='<p class="empty">'+(tracks.length?'В этом плейлисте пока пусто. Добавь треки через список справа от трека.':'Здесь пока тихо. Добавь свои mp3, и они появятся здесь.')+'</p>';return}
  q.forEach(t=>{
    const r=document.createElement('div');r.className='trk'+(t.id===cur?' cur':'');
    const playing=t.id===cur&&!au.paused;
    r.innerHTML='<div class="tc" style="background:'+grad(hue(t.name))+'">'+ic(playing?'pause':'play')+'</div><div class="tn">'+esc(t.name)+'</div><span class="td">'+fmt(t.dur)+'</span>';
    r.querySelector('.tc').onclick=r.querySelector('.tn').onclick=()=>t.id===cur?toggle():play(t.id);
    if(lists.length){const s=document.createElement('select');s.setAttribute('aria-label','Добавить в плейлист');
      s.innerHTML='<option value="">＋ В плейлист</option>'+lists.map(l=>'<option value="'+l.id+'">'+esc(l.name)+(l.ids.includes(t.id)?' ✓':'')+'</option>').join('');
      s.onchange=()=>{const l=lists.find(x=>x.id==s.value);if(l&&!l.ids.includes(t.id))l.ids.push(t.id);draw()};r.appendChild(s)}
    const x=document.createElement('button');x.className='x';x.innerHTML=ic('close');
    x.title=L?'Убрать из плейлиста':'Удалить трек';
    x.onclick=()=>{if(L){L.ids=L.ids.filter(i=>i!==t.id)}else{if(t.id===cur){au.pause();cur=null;setWave(null)}URL.revokeObjectURL(t.url);tracks=tracks.filter(i=>i!==t);lists.forEach(l=>l.ids=l.ids.filter(i=>i!==t.id));ui()}draw()};
    r.appendChild(x);box.appendChild(r)})}
draw();ui();setWave(null);

/* ================= УПРАЖНЕНИЯ (в духе YouTube) =================
   Чтобы добавить ролик, достаточно дописать объект в EXERCISES:
   {id:1,title:'Зарядка на 10 минут',cat:'Зарядка',dur:'10:00',yt:'ID_РОЛИКА_С_YOUTUBE',by:'Drip Fit',desc:'Описание'} */
const EXERCISES=[
{
"id": "v01",
"title": "Простая утренняя гимнастика за 10 минут",
"cat": "Зарядка",
"dur": "10 мин",
"yt": "jTtBY4syEYs",
"by": "Ivan Krasavin",
"desc": ""
},
{
"id": "v02",
"title": "Утренняя зарядка на всё тело и суставная разминка",
"cat": "Зарядка",
"dur": "10 мин",
"yt": "aaZ2XMxIIH4",
"by": "VVPROFITNESS",
"desc": "",
"ex": "Суставная гимнастика"
},
{
"id": "v03",
"title": "Утренняя умная зарядка на всё тело",
"cat": "Зарядка",
"dur": "10 мин",
"yt": "0LrpF4JK_N0",
"by": "VVPROFITNESS",
"desc": ""
},
{
"id": "v04",
"title": "Лучшая утренняя зарядка для похудения",
"cat": "Зарядка",
"dur": "10 мин",
"yt": "Yf2PR1M6BSc",
"by": "Xenia_rg - тренировки дома",
"desc": ""
},
{
"id": "v05",
"title": "Утренняя зарядка стоя",
"cat": "Зарядка",
"dur": "10 мин",
"yt": "XbZjvNtC3Xk",
"by": "Татьяна Метельская",
"desc": ""
},
{
"id": "v06",
"title": "Утренняя зарядка: убери отёки и зарядись энергией",
"cat": "Зарядка",
"dur": "10 мин",
"yt": "TkCQ0f8bd-g",
"by": "Ivan Krasavin",
"desc": ""
},
{
"id": "v07",
"title": "Пробуждающая утренняя зарядка",
"cat": "Зарядка",
"dur": "",
"yt": "PAVhRc4-Bww",
"by": "Яна Варкова",
"desc": ""
},
{
"id": "v08",
"title": "Силовая на всё тело дома без прыжков и инвентаря",
"cat": "Силовые",
"dur": "",
"yt": "UjSSSN5VdcQ",
"by": "Xenia_rg - тренировки дома",
"desc": ""
},
{
"id": "v09",
"title": "Силовая для начинающих с собственным весом",
"cat": "Силовые",
"dur": "",
"yt": "5XjJT1VqwGM",
"by": "Mote Fitness",
"desc": ""
},
{
"id": "v10",
"title": "Домашняя круговая силовая без оборудования",
"cat": "Силовые",
"dur": "",
"yt": "z6Gqb2aQIFI",
"by": "Анна Shen",
"desc": ""
},
{
"id": "v11",
"title": "30-минутная тренировка на всё тело дома",
"cat": "Силовые",
"dur": "30 мин",
"yt": "TjAUvSjVI48",
"by": "Xenia_rg - тренировки дома",
"desc": ""
},
{
"id": "v12",
"title": "30 минут тренировки на всё тело дома",
"cat": "Силовые",
"dur": "30 мин",
"yt": "Z4nI_RQYISU",
"by": "Лера Логунова",
"desc": ""
},
{
"id": "v13",
"title": "Силовая дома для начинающих",
"cat": "Силовые",
"dur": "",
"yt": "YGztqWDEOXU",
"by": "Тренер Андрей",
"desc": ""
},
{
"id": "v14",
"title": "Силовая тренировка на всё тело",
"cat": "Силовые",
"dur": "",
"yt": "WQeHGPQnl-Y",
"by": "ViaFit",
"desc": ""
},
{
"id": "v15",
"title": "Интенсивное кардио и пресс",
"cat": "Кардио",
"dur": "20 мин",
"yt": "L3d5FTZ1g8M",
"by": "Лера Логунова",
"desc": ""
},
{
"id": "v16",
"title": "2500 шагов за 20 минут, кардио дома",
"cat": "Кардио",
"dur": "20 мин",
"yt": "Z9Iso_4ehmg",
"by": "Физкультурница",
"desc": ""
},
{
"id": "v17",
"title": "Кардио дома для сжигания жира",
"cat": "Кардио",
"dur": "20 мин",
"yt": "ZyvAEiKYeTU",
"by": "Xenia_rg - тренировки дома",
"desc": ""
},
{
"id": "v18",
"title": "Домашнее кардио на всё тело с разминкой и заминкой",
"cat": "Кардио",
"dur": "20 мин",
"yt": "iH8J3xVIDWY",
"by": "Арсений Ким",
"desc": ""
},
{
"id": "v19",
"title": "Кардио на всё тело",
"cat": "Кардио",
"dur": "20 мин",
"yt": "mMmeAQVM018",
"by": "Лера Логунова",
"desc": ""
},
{
"id": "v20",
"title": "Растяжка для всего тела для начинающих",
"cat": "Растяжка",
"dur": "",
"yt": "MB1w67L3XvU",
"by": "Студия растяжки TOPSTRETCHING",
"desc": "",
"ex": "Растяжка всего тела"
},
{
"id": "v21",
"title": "Растяжка на всё тело за 20 минут в день",
"cat": "Растяжка",
"dur": "20 мин",
"yt": "o-31NP2Djl0",
"by": "Растяжка с Кутузовой",
"desc": ""
},
{
"id": "v22",
"title": "Растяжка на всё тело с секретами тренера",
"cat": "Растяжка",
"dur": "",
"yt": "lx1cBZDNsCc",
"by": "Аніта Луценко",
"desc": ""
},
{
"id": "v23",
"title": "Растяжка на всё тело",
"cat": "Растяжка",
"dur": "",
"yt": "uYRU7B8q-Z0",
"by": "Mari Stretching",
"desc": ""
},
{
"id": "v24",
"title": "Растяжка всего тела за 10 минут",
"cat": "Растяжка",
"dur": "10 мин",
"yt": "X9hhzhwlVww",
"by": "Лера Логунова",
"desc": ""
},
{
"id": "v25",
"title": "Растяжка тела за 20 минут для всех",
"cat": "Растяжка",
"dur": "20 мин",
"yt": "OIc5U46m_ms",
"by": "Ivan Krasavin",
"desc": ""
},
{
"id": "v26",
"title": "Вечерняя йога для начинающих",
"cat": "Йога",
"dur": "",
"yt": "m62MFlPacpE",
"by": "IMAGINE fitness",
"desc": ""
},
{
"id": "v27",
"title": "Йога для начинающих на всё тело",
"cat": "Йога",
"dur": "50 мин",
"yt": "fA23dMSGC9Q",
"by": "Йога chilelavida Елена Малова",
"desc": "",
"ex": "Йога"
},
{
"id": "v28",
"title": "Йога для начинающих дома",
"cat": "Йога",
"dur": "",
"yt": "bQOuc9ZwjC0",
"by": "Оксана Журавлева",
"desc": ""
},
{
"id": "v29",
"title": "Йога для начинающих дома, занятие 1",
"cat": "Йога",
"dur": "40 мин",
"yt": "1cCLguVQsMU",
"by": "ProBeautykz",
"desc": ""
},
{
"id": "v30",
"title": "Вечерняя йога для спины и ног",
"cat": "Йога",
"dur": "15 мин",
"yt": "2gCuD9yBxDE",
"by": "Медитация - Лев Соловьев",
"desc": ""
},
{
"id": "v31",
"title": "Красивый пресс за 10 минут, метод 4×4",
"cat": "Пресс",
"dur": "10 мин",
"yt": "AN295HL0GD0",
"by": "ДелайТело",
"desc": ""
},
{
"id": "v32",
"title": "Как накачать пресс за 10 минут дома",
"cat": "Пресс",
"dur": "10 мин",
"yt": "GKz-VdYelPI",
"by": "Sergio Nee",
"desc": ""
},
{
"id": "v33",
"title": "Пресс на каждый день, без планок",
"cat": "Пресс",
"dur": "10 мин",
"yt": "sMdFxUm9E9k",
"by": "Лера Логунова",
"desc": ""
},
{
"id": "v34",
"title": "Убей свой пресс за 10 минут",
"cat": "Пресс",
"dur": "10 мин",
"yt": "VSzEycJUBaY",
"by": "Дикий Лось",
"desc": ""
},
{
"id": "v35",
"title": "Интенсивная тренировка пресса",
"cat": "Пресс",
"dur": "10 мин",
"yt": "0ojrGf3RKmo",
"by": "Лера Логунова",
"desc": ""
},
{
"id": "v36",
"title": "Как накачать пресс дома за 10 минут в день",
"cat": "Пресс",
"dur": "10 мин",
"yt": "zDX7iTTqgmI",
"by": "Хромосома",
"desc": ""
},
{
"id": "s101",
"title": "Топ упражнений на спину",
"cat": "Зал: Спина",
"dur": "",
"yt": "e3ovTzoQUx0",
"by": "Gera FitSchool",
"short": true,
"desc": ""
},
{
"id": "s102",
"title": "Тренировка спины в тренажёрном зале",
"cat": "Зал: Спина",
"dur": "",
"yt": "5NGXzzVep9c",
"by": "Fit with Anna",
"short": true,
"desc": ""
},
{
"id": "s103",
"title": "Один тренажёр на всю спину",
"cat": "Зал: Спина",
"dur": "",
"yt": "WjhkBEDTHsw",
"by": "Про силу в натураху",
"short": true,
"desc": ""
},
{
"id": "s104",
"title": "Эффективная тренировка спины",
"cat": "Зал: Спина",
"dur": "",
"yt": "kxE6Pr4Grik",
"by": "Denis Orlov",
"short": true,
"desc": ""
},
{
"id": "s105",
"title": "Ошибка в вертикальной тяге на спину",
"cat": "Зал: Спина",
"dur": "",
"yt": "ViA3Ws4Ezak",
"by": "Про силу в натураху",
"short": true,
"desc": "",
"ex": "Тяга верхнего блока"
},
{
"id": "s106",
"title": "Лучшие упражнения на грудь",
"cat": "Зал: Грудь",
"dur": "",
"yt": "ObgBfiduM-k",
"by": "Про силу в натураху",
"short": true,
"desc": ""
},
{
"id": "s107",
"title": "Сведения «бабочка» на грудь",
"cat": "Зал: Грудь",
"dur": "",
"yt": "uHhZJUeQgXI",
"by": "Илья Петров | О фитнесе",
"short": true,
"desc": ""
},
{
"id": "s108",
"title": "Самое эффективное упражнение на грудь",
"cat": "Зал: Грудь",
"dur": "",
"yt": "eKrGF4ZDlQY",
"by": "Павел Тулюпа",
"short": true,
"desc": ""
},
{
"id": "s109",
"title": "Жим на грудь в тренажёре: выполняй правильно",
"cat": "Зал: Грудь",
"dur": "",
"yt": "EC1Yf3M0im8",
"by": "Yan",
"short": true,
"desc": ""
},
{
"id": "s110",
"title": "Техника: жим на грудь в тренажёре",
"cat": "Зал: Грудь",
"dur": "",
"yt": "5vN74c6uByI",
"by": "Анастасия НОВИКОВА про женский фитнес",
"short": true,
"desc": "",
"ex": "Жим в тренажёре на грудь"
},
{
"id": "s111",
"title": "Как делать бабочку в тренажёре",
"cat": "Зал: Грудь",
"dur": "",
"yt": "Aecxf5T5PMs",
"by": "RAHMANOV FIT",
"short": true,
"desc": "",
"ex": "Бабочка (пек-дек)"
},
{
"id": "s112",
"title": "Мощная тренировка ног",
"cat": "Зал: Ноги",
"dur": "",
"yt": "4C5AyjqUvUw",
"by": "Про силу в натураху",
"short": true,
"desc": ""
},
{
"id": "s113",
"title": "Ошибки в жиме ногами в тренажёре",
"cat": "Зал: Ноги",
"dur": "",
"yt": "Who_DS-KCiQ",
"by": "Denis Orlov",
"short": true,
"desc": ""
},
{
"id": "s114",
"title": "Жим ногами: как правильно",
"cat": "Зал: Ноги",
"dur": "",
"yt": "Sq5D0HeO588",
"by": "Про силу в натураху",
"short": true,
"desc": "",
"ex": "Жим ногами"
},
{
"id": "s115",
"title": "Румынская и мёртвая тяга: в чём отличие",
"cat": "Зал: Ноги",
"dur": "",
"yt": "byN5M2Xx2gM",
"by": "dana_fit",
"short": true,
"desc": ""
},
{
"id": "s116",
"title": "Как сохранить поясницу в приседе",
"cat": "Зал: Ноги",
"dur": "",
"yt": "BlPg_RFilnc",
"by": "Toros Fit",
"short": true,
"desc": ""
},
{
"id": "s117",
"title": "Правильная техника приседаний со штангой",
"cat": "Зал: Ноги",
"dur": "",
"yt": "Rz2LEXWc3Jc",
"by": "Антон Дорошин",
"short": true,
"desc": "",
"ex": "Приседания со штангой"
},
{
"id": "s118",
"title": "Тренировка на плечи",
"cat": "Зал: Плечи",
"dur": "",
"yt": "v2daNjK3Gzk",
"by": "Про силу в натураху",
"short": true,
"desc": ""
},
{
"id": "s119",
"title": "3 простых упражнения на плечи",
"cat": "Зал: Плечи",
"dur": "",
"yt": "8m_B2HZLIiU",
"by": "Toros Fit",
"short": true,
"desc": ""
},
{
"id": "s120",
"title": "Плечи в зале: 3 упражнения на все пучки",
"cat": "Зал: Плечи",
"dur": "",
"yt": "C4mN1dZmg9k",
"by": "POWERELIX workout",
"short": true,
"desc": ""
},
{
"id": "s121",
"title": "Топ 4 упражнения на среднюю дельту",
"cat": "Зал: Плечи",
"dur": "",
"yt": "KtgvyJK2NfY",
"by": "Максим Гришанин",
"short": true,
"desc": ""
},
{
"id": "s122",
"title": "Лучшие упражнения на плечи",
"cat": "Зал: Плечи",
"dur": "",
"yt": "K2KGRYFmTDc",
"by": "-MANGO-",
"short": true,
"desc": ""
},
{
"id": "s123",
"title": "Трицепс: топ 3 упражнения",
"cat": "Зал: Руки",
"dur": "",
"yt": "U_yi7o_KZQk",
"by": "Мариан Фитнес Тренер",
"short": true,
"desc": ""
},
{
"id": "s124",
"title": "Лучшие упражнения на трицепс",
"cat": "Зал: Руки",
"dur": "",
"yt": "UEb8VxD-_Es",
"by": "-MANGO-",
"short": true,
"desc": ""
},
{
"id": "s125",
"title": "Разгибания на трицепс в блоке",
"cat": "Зал: Руки",
"dur": "",
"yt": "MEy01FPS3KE",
"by": "Евгений Токарев",
"short": true,
"desc": "",
"ex": "Разгибания на блоке (трицепс)"
},
{
"id": "s126",
"title": "Не растёт бицепс? Делай эти упражнения",
"cat": "Зал: Руки",
"dur": "",
"yt": "OhUGHWY0uHE",
"by": "Про силу в натураху",
"short": true,
"desc": ""
},
{
"id": "s127",
"title": "3 упражнения для больших рук",
"cat": "Зал: Руки",
"dur": "",
"yt": "GJ-I9Gkt9BE",
"by": "Новое Тело",
"short": true,
"desc": ""
},
{
"id": "s128",
"title": "Тренировка на ягодицы в кроссовере",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "xj7lGxNZ5IU",
"by": "Алина | твоя фитнес подружка",
"short": true,
"desc": ""
},
{
"id": "s129",
"title": "Разведение ног в тренажёре на ягодичные",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "wgcvvrgD3q8",
"by": "Anna Na Sporte",
"short": true,
"desc": "",
"ex": "Разведение ног в тренажёре"
},
{
"id": "s130",
"title": "Глют-машина: как проработать ягодицы",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "ylNzAkO2Ci0",
"by": "Underground Fitness",
"short": true,
"desc": ""
},
{
"id": "s131",
"title": "Упражнения на ягодицы для твоей программы",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "tVg8K1Ll91s",
"by": "Павел Тулюпа",
"short": true,
"desc": ""
},
{
"id": "s132",
"title": "3 лучших упражнения на верх ягодиц",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "jXgkJvSnPyY",
"by": "ВЕРЬЁМИНА",
"short": true,
"desc": ""
},
{
"id": "s133",
"title": "Идеальный жим лёжа за 5 шагов",
"cat": "Зал: Техника",
"dur": "",
"yt": "jWdzYreqKLc",
"by": "LITVINOV FIT",
"short": true,
"desc": "",
"ex": "Жим штанги лёжа"
},
{
"id": "s134",
"title": "7 правил идеального жима лёжа",
"cat": "Зал: Техника",
"dur": "",
"yt": "99BNLbWk1bA",
"by": "Про силу в натураху",
"short": true,
"desc": ""
},
{
"id": "s135",
"title": "Жим штанги: как правильно",
"cat": "Зал: Техника",
"dur": "",
"yt": "0LS9e6fNN3E",
"by": "Toros Fit",
"short": true,
"desc": ""
},
{
"id": "s136",
"title": "Жим гантелей лёжа: не совершай эту ошибку",
"cat": "Зал: Техника",
"dur": "",
"yt": "nJMlHnS7dDQ",
"by": "Про силу в натураху",
"short": true,
"desc": ""
},
{
"id": "s137",
"title": "Жим гантелей лёжа на горизонтальной скамье",
"cat": "Зал: Техника",
"dur": "",
"yt": "C8VoyKIe_ho",
"by": "Из котлеты в атлета",
"short": true,
"desc": "",
"ex": "Жим гантелей лёжа"
},
{
"id": "s138",
"title": "Как правильно приседать со штангой",
"cat": "Зал: Техника",
"dur": "",
"yt": "E5er_tzOGCw",
"by": "Денис Мильто",
"short": true,
"desc": ""
},
{
"id": "s139",
"title": "Как правильно приседать со штангой",
"cat": "Зал: Техника",
"dur": "",
"yt": "HIwf047r93o",
"by": "Тренируйся правильно",
"short": true,
"desc": ""
},
{
"id": "s201",
"title": "Сет на грудные мышцы",
"cat": "Зал: Грудь",
"dur": "",
"yt": "eVuwmX3lvRQ",
"by": "Violetta Pekarskaya",
"short": true,
"desc": ""
},
{
"id": "s202",
"title": "Ошибка в жиме лёжа с гантелями",
"cat": "Зал: Грудь",
"dur": "",
"yt": "MiH2zoD_mj4",
"by": "Игорь Ботоговский",
"short": true,
"desc": ""
},
{
"id": "s203",
"title": "Не накачаешь грудь, если жмёшь лёжа так",
"cat": "Зал: Грудь",
"dur": "",
"yt": "eOJJw-k1v1Q",
"by": "Илья Петров | О фитнесе",
"short": true,
"desc": ""
},
{
"id": "s204",
"title": "Жим штанги на наклонной скамье",
"cat": "Зал: Грудь",
"dur": "",
"yt": "HLNhELbmOtE",
"by": "Спортивные советы",
"short": true,
"desc": "",
"ex": "Жим штанги на наклонной скамье"
},
{
"id": "s205",
"title": "Как правильно делать жим лёжа",
"cat": "Зал: Грудь",
"dur": "",
"yt": "AzaVIlqqQ-I",
"by": "Кирилл Витютнев",
"short": true,
"desc": ""
},
{
"id": "s206",
"title": "Подтягивания на перекладине",
"cat": "Зал: Спина",
"dur": "",
"yt": "PD0mm8MUTqI",
"by": "Спортивные советы",
"short": true,
"desc": "",
"ex": "Подтягивания"
},
{
"id": "s207",
"title": "Быстрый старт в подтягиваниях",
"cat": "Зал: Спина",
"dur": "",
"yt": "JJHBYvFE79Y",
"by": "Система Тела",
"short": true,
"desc": ""
},
{
"id": "s208",
"title": "Билдерские подтягивания: ошибка или техника",
"cat": "Зал: Спина",
"dur": "",
"yt": "-mV_cVY9Bpg",
"by": "Система Тела",
"short": true,
"desc": ""
},
{
"id": "s209",
"title": "Нюанс, который поможет подтягиваться выше",
"cat": "Зал: Спина",
"dur": "",
"yt": "85jPzi2Qad8",
"by": "Школа Воркаута",
"short": true,
"desc": ""
},
{
"id": "s210",
"title": "Если день ног, то только такой",
"cat": "Зал: Ноги",
"dur": "",
"yt": "F4VHKzu-vv0",
"by": "Spirit. Fitness",
"short": true,
"desc": ""
},
{
"id": "s211",
"title": "День ног: тренировка в зале",
"cat": "Зал: Ноги",
"dur": "",
"yt": "XpfvFZPQpwo",
"by": "Sport Motion",
"short": true,
"desc": ""
},
{
"id": "s212",
"title": "Простые упражнения на все мышцы ног",
"cat": "Зал: Ноги",
"dur": "",
"yt": "j74VfwE5Jz8",
"by": "Павел Тулюпа",
"short": true,
"desc": ""
},
{
"id": "s213",
"title": "Румынская тяга: делай правильно",
"cat": "Зал: Ноги",
"dur": "",
"yt": "GRhqo3H12Hs",
"by": "Олександр Попенко",
"short": true,
"desc": "",
"ex": "Румынская тяга"
},
{
"id": "s214",
"title": "Идеальная техника приседа",
"cat": "Зал: Ноги",
"dur": "",
"yt": "RxjRhlUEuD8",
"by": "ALFA_SYNDICATE",
"short": true,
"desc": ""
},
{
"id": "s215",
"title": "Средняя дельта: как тренировать",
"cat": "Зал: Плечи",
"dur": "",
"yt": "B28eDsh8Xnk",
"by": "Артём Бойко",
"short": true,
"desc": ""
},
{
"id": "s216",
"title": "Передние дельты по науке",
"cat": "Зал: Плечи",
"dur": "",
"yt": "2YpvprB4ZuM",
"by": "Алексей",
"short": true,
"desc": ""
},
{
"id": "s217",
"title": "Выбираем лучшие упражнения на плечи",
"cat": "Зал: Плечи",
"dur": "",
"yt": "Qkt7ww7k0CE",
"by": "Павел Тулюпа",
"short": true,
"desc": ""
},
{
"id": "s218",
"title": "Махи гантелями сидя",
"cat": "Зал: Плечи",
"dur": "",
"yt": "CCWQPBgRarI",
"by": "Спортивные советы",
"short": true,
"desc": ""
},
{
"id": "s219",
"title": "Махи с гантелями в стороны сидя",
"cat": "Зал: Плечи",
"dur": "",
"yt": "0--n3Arw9hQ",
"by": "Игорь Ботоговский",
"short": true,
"desc": "",
"ex": "Махи гантелей в стороны"
},
{
"id": "s220",
"title": "Тир-лист упражнений на трицепс",
"cat": "Зал: Руки",
"dur": "",
"yt": "n59SJvMKOu4",
"by": "Илья Бурдатский",
"short": true,
"desc": ""
},
{
"id": "s221",
"title": "Подъём штанги на бицепс стоя",
"cat": "Зал: Руки",
"dur": "",
"yt": "Y7ecWDbRbk4",
"by": "Спортивные советы",
"short": true,
"desc": "",
"ex": "Подъём штанги на бицепс"
},
{
"id": "s222",
"title": "Огненная тренировка на ягодицы в зале",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "h2l1tB1y6HQ",
"by": "Юлия Гайтур",
"short": true,
"desc": ""
},
{
"id": "s223",
"title": "Академия ягодиц",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "bP7XwGPLX2k",
"by": "Ksenija | xenifit",
"short": true,
"desc": ""
},
{
"id": "s224",
"title": "Как накачать ягодицы, а не ноги",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "fVHINVbXB-8",
"by": "FLEX.MYBODY",
"short": true,
"desc": ""
},
{
"id": "s225",
"title": "Как накачать ягодицы в зале",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "JHK_HDR_3JE",
"by": "Людмила Божкова",
"short": true,
"desc": ""
},
{
"id": "s226",
"title": "Техника ягодичного мостика",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "9UdCcfihPaA",
"by": "Юрий Спасокукоцкий",
"short": true,
"desc": "",
"ex": "Ягодичный мостик со штангой"
},
{
"id": "s227",
"title": "Техника приседаний со штангой",
"cat": "Зал: Техника",
"dur": "",
"yt": "NwNppOiZihU",
"by": "Антон Дорошин",
"short": true,
"desc": ""
},
{
"id": "s228",
"title": "Чем отличается присед: ТА и лифтерский",
"cat": "Зал: Техника",
"dur": "",
"yt": "SFr0Sp5EGLk",
"by": "Про силу в натураху",
"short": true,
"desc": ""
},
{
"id": "s229",
"title": "Как правильно делать приседания со штангой",
"cat": "Зал: Техника",
"dur": "",
"yt": "IhQhRxihJSQ",
"by": "Vadim4emaev",
"short": true,
"desc": ""
},
{
"id": "s230",
"title": "Разбор техники в жиме лёжа",
"cat": "Зал: Техника",
"dur": "",
"yt": "G2pJSMi0yMw",
"by": "KIRILL SARYCHEV SHORTS",
"short": true,
"desc": ""
},
{
"id": "t1",
"title": "Становая тяга классическая — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "6me_dMqwqCA",
"by": "",
"short": false,
"desc": "",
"ex": "Становая тяга классическая"
},
{
"id": "t2",
"title": "Становая тяга сумо — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "qFl_1jl5c9M",
"by": "",
"short": false,
"desc": "",
"ex": "Становая тяга сумо"
},
{
"id": "t3",
"title": "Жим лёжа узким хватом — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "Er_XTfK3Auc",
"by": "",
"short": false,
"desc": "",
"ex": "Жим лёжа узким хватом"
},
{
"id": "t4",
"title": "Приседания с паузой — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "vQdHMw0t3Js",
"by": "",
"short": false,
"desc": "",
"ex": "Приседания с паузой"
},
{
"id": "t5",
"title": "Жим лёжа с паузой — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "nWo_m0REGMA",
"by": "",
"short": false,
"desc": "",
"ex": "Жим лёжа с паузой"
},
{
"id": "t6",
"title": "Рывок — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "_EFTfzmp8g4",
"by": "",
"short": false,
"desc": "",
"ex": "Рывок"
},
{
"id": "t7",
"title": "Толчок — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "o8fAxrae8XM",
"by": "",
"short": false,
"desc": "",
"ex": "Толчок"
},
{
"id": "t8",
"title": "Взятие на грудь — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "cIBSp1mGopI",
"by": "",
"short": false,
"desc": "",
"ex": "Взятие на грудь"
},
{
"id": "t9",
"title": "Швунг жимовой — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "mMJ6arJCjxs",
"by": "",
"short": false,
"desc": "",
"ex": "Швунг жимовой"
},
{
"id": "t10",
"title": "Приседания со штангой на груди — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "Is39GjSFhkQ",
"by": "",
"short": false,
"desc": "",
"ex": "Приседания со штангой на груди"
},
{
"id": "t11",
"title": "Рывковая тяга — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "OzXygcDsrLU",
"by": "",
"short": false,
"desc": "",
"ex": "Рывковая тяга"
},
{
"id": "t12",
"title": "Толчковая тяга — техника выполнения",
"cat": "Зал: Техника",
"dur": "",
"yt": "wVXcrEzrX9c",
"by": "",
"short": false,
"desc": "",
"ex": "Толчковая тяга"
},
{
"id": "t13",
"title": "Жим гантелей на наклонной скамье — техника выполнения",
"cat": "Зал: Грудь",
"dur": "",
"yt": "JmWz8gHXo7Y",
"by": "",
"short": false,
"desc": "",
"ex": "Жим гантелей на наклонной скамье"
},
{
"id": "t14",
"title": "Разводка гантелей лёжа — техника выполнения",
"cat": "Зал: Грудь",
"dur": "",
"yt": "q7DoKfJR14A",
"by": "",
"short": false,
"desc": "",
"ex": "Разводка гантелей лёжа"
},
{
"id": "t15",
"title": "Сведение рук в кроссовере — техника выполнения",
"cat": "Зал: Грудь",
"dur": "",
"yt": "BbdRugGGv3Q",
"by": "",
"short": false,
"desc": "",
"ex": "Сведение рук в кроссовере"
},
{
"id": "t16",
"title": "Отжимания на брусьях — техника выполнения",
"cat": "Зал: Грудь",
"dur": "",
"yt": "XSmkKGKk-IA",
"by": "",
"short": false,
"desc": "",
"ex": "Отжимания на брусьях"
},
{
"id": "t17",
"title": "Тяга штанги в наклоне — техника выполнения",
"cat": "Зал: Спина",
"dur": "",
"yt": "njGz6T135lQ",
"by": "",
"short": false,
"desc": "",
"ex": "Тяга штанги в наклоне"
},
{
"id": "t18",
"title": "Тяга гантели одной рукой — техника выполнения",
"cat": "Зал: Спина",
"dur": "",
"yt": "DLpIrbhR3X8",
"by": "",
"short": false,
"desc": "",
"ex": "Тяга гантели одной рукой"
},
{
"id": "t19",
"title": "Тяга горизонтального блока — техника выполнения",
"cat": "Зал: Спина",
"dur": "",
"yt": "3h97McFzMGo",
"by": "",
"short": false,
"desc": "",
"ex": "Тяга горизонтального блока"
},
{
"id": "t20",
"title": "Тяга Т-грифа — техника выполнения",
"cat": "Зал: Спина",
"dur": "",
"yt": "vqkJ8xb-Byk",
"by": "",
"short": false,
"desc": "",
"ex": "Тяга Т-грифа"
},
{
"id": "t21",
"title": "Австралийские подтягивания — техника выполнения",
"cat": "Зал: Спина",
"dur": "",
"yt": "JU4ig_3UyQ4",
"by": "",
"short": false,
"desc": "",
"ex": "Австралийские подтягивания"
},
{
"id": "t22",
"title": "Пуловер на блоке — техника выполнения",
"cat": "Зал: Спина",
"dur": "",
"yt": "KrVV7VzTQ2A",
"by": "",
"short": false,
"desc": "",
"ex": "Пуловер на блоке"
},
{
"id": "t23",
"title": "Гиперэкстензия — техника выполнения",
"cat": "Зал: Спина",
"dur": "",
"yt": "02eW1R_ZYxA",
"by": "",
"short": false,
"desc": "",
"ex": "Гиперэкстензия"
},
{
"id": "t24",
"title": "Гакк-приседания — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "rSnQ1eBG_jQ",
"by": "",
"short": false,
"desc": "",
"ex": "Гакк-приседания"
},
{
"id": "t25",
"title": "Выпады со штангой — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "jJGe6O2Cz3I",
"by": "",
"short": false,
"desc": "",
"ex": "Выпады со штангой"
},
{
"id": "t26",
"title": "Выпады с гантелями — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "vNrkKOiksCs",
"by": "",
"short": false,
"desc": "",
"ex": "Выпады с гантелями"
},
{
"id": "t27",
"title": "Болгарские сплит-приседания — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "VDyPdfpOnw0",
"by": "",
"short": false,
"desc": "",
"ex": "Болгарские сплит-приседания"
},
{
"id": "t28",
"title": "Разгибание ног в тренажёре — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "90q3AHfoAaw",
"by": "",
"short": false,
"desc": "",
"ex": "Разгибание ног в тренажёре"
},
{
"id": "t29",
"title": "Сгибание ног лёжа — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "rUz7mPfvi48",
"by": "",
"short": false,
"desc": "",
"ex": "Сгибание ног лёжа"
},
{
"id": "t30",
"title": "Подъёмы на носки (икры) — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "Wqan5aV88LM",
"by": "",
"short": false,
"desc": "",
"ex": "Подъёмы на носки (икры)"
},
{
"id": "t31",
"title": "Приседания в Смите — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "aDc00kqojGY",
"by": "",
"short": false,
"desc": "",
"ex": "Приседания в Смите"
},
{
"id": "t32",
"title": "Приседания — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "hvNCnOTKfc0",
"by": "",
"short": false,
"desc": "",
"ex": "Приседания"
},
{
"id": "t33",
"title": "Выпады — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "d3xVz2ObWyg",
"by": "",
"short": false,
"desc": "",
"ex": "Выпады"
},
{
"id": "t34",
"title": "Стульчик у стены — техника выполнения",
"cat": "Зал: Ноги",
"dur": "",
"yt": "istDtyUPrJI",
"by": "",
"short": false,
"desc": "",
"ex": "Стульчик у стены"
},
{
"id": "t35",
"title": "Отведение ноги в кроссовере — техника выполнения",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "DBEkzSfUXaw",
"by": "",
"short": false,
"desc": "",
"ex": "Отведение ноги в кроссовере"
},
{
"id": "t36",
"title": "Гиперэкстензия на ягодицы — техника выполнения",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "4ZtPrZNpzo8",
"by": "",
"short": false,
"desc": "",
"ex": "Гиперэкстензия на ягодицы"
},
{
"id": "t37",
"title": "Зашагивания на тумбу с гантелями — техника выполнения",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "zpLCeGhBul0",
"by": "",
"short": false,
"desc": "",
"ex": "Зашагивания на тумбу с гантелями"
},
{
"id": "t38",
"title": "Ягодичный мостик на полу — техника выполнения",
"cat": "Зал: Ягодицы",
"dur": "",
"yt": "kOFaJYPUEvk",
"by": "",
"short": true,
"desc": "",
"ex": "Ягодичный мостик на полу"
},
{
"id": "t39",
"title": "Армейский жим — техника выполнения",
"cat": "Зал: Плечи",
"dur": "",
"yt": "n29rjCKdjzA",
"by": "",
"short": false,
"desc": "",
"ex": "Армейский жим"
},
{
"id": "t40",
"title": "Жим гантелей сидя — техника выполнения",
"cat": "Зал: Плечи",
"dur": "",
"yt": "X5bgyaiWoJI",
"by": "",
"short": false,
"desc": "",
"ex": "Жим гантелей сидя"
},
{
"id": "t41",
"title": "Жим Арнольда — техника выполнения",
"cat": "Зал: Плечи",
"dur": "",
"yt": "qe-BdRqm4kY",
"by": "",
"short": false,
"desc": "",
"ex": "Жим Арнольда"
},
{
"id": "t42",
"title": "Махи в наклоне (задняя дельта) — техника выполнения",
"cat": "Зал: Плечи",
"dur": "",
"yt": "vLZQ96BUFsU",
"by": "",
"short": false,
"desc": "",
"ex": "Махи в наклоне (задняя дельта)"
},
{
"id": "t43",
"title": "Тяга штанги к подбородку — техника выполнения",
"cat": "Зал: Плечи",
"dur": "",
"yt": "mM38ILtpXN0",
"by": "",
"short": false,
"desc": "",
"ex": "Тяга штанги к подбородку"
},
{
"id": "t44",
"title": "Обратная бабочка — техника выполнения",
"cat": "Зал: Плечи",
"dur": "",
"yt": "Iww1W9LSOio",
"by": "",
"short": false,
"desc": "",
"ex": "Обратная бабочка"
},
{
"id": "t45",
"title": "Шраги — техника выполнения",
"cat": "Зал: Плечи",
"dur": "",
"yt": "cdjovZj0BMA",
"by": "",
"short": false,
"desc": "",
"ex": "Шраги"
},
{
"id": "t46",
"title": "Пайк-отжимания — техника выполнения",
"cat": "Зал: Плечи",
"dur": "",
"yt": "qmcHu-82now",
"by": "",
"short": false,
"desc": "",
"ex": "Пайк-отжимания"
},
{
"id": "t47",
"title": "Молотки с гантелями — техника выполнения",
"cat": "Зал: Руки",
"dur": "",
"yt": "r1JuI8A6baI",
"by": "",
"short": false,
"desc": "",
"ex": "Молотки с гантелями"
},
{
"id": "t48",
"title": "Сгибания на скамье Скотта — техника выполнения",
"cat": "Зал: Руки",
"dur": "",
"yt": "P_-B3w6viqs",
"by": "",
"short": false,
"desc": "",
"ex": "Сгибания на скамье Скотта"
},
{
"id": "t49",
"title": "Концентрированный подъём на бицепс — техника выполнения",
"cat": "Зал: Руки",
"dur": "",
"yt": "okSVviH_JLg",
"by": "",
"short": false,
"desc": "",
"ex": "Концентрированный подъём на бицепс"
},
{
"id": "t50",
"title": "Французский жим — техника выполнения",
"cat": "Зал: Руки",
"dur": "",
"yt": "NA4eP-L0PRY",
"by": "",
"short": false,
"desc": "",
"ex": "Французский жим"
},
{
"id": "t51",
"title": "Разгибание гантели из-за головы — техника выполнения",
"cat": "Зал: Руки",
"dur": "",
"yt": "PznTt_xfEd0",
"by": "",
"short": false,
"desc": "",
"ex": "Разгибание гантели из-за головы"
},
{
"id": "t52",
"title": "Отжимания узким хватом — техника выполнения",
"cat": "Зал: Руки",
"dur": "",
"yt": "YuU9tvc9SZc",
"by": "",
"short": false,
"desc": "",
"ex": "Отжимания узким хватом"
},
{
"id": "t53",
"title": "Сгибания запястий (предплечья) — техника выполнения",
"cat": "Зал: Руки",
"dur": "",
"yt": "qs6wnDgcfjg",
"by": "",
"short": false,
"desc": "",
"ex": "Сгибания запястий (предплечья)"
},
{
"id": "t54",
"title": "Скручивания — техника выполнения",
"cat": "Пресс",
"dur": "",
"yt": "H8xSHCAjM-I",
"by": "",
"short": false,
"desc": "",
"ex": "Скручивания"
},
{
"id": "t55",
"title": "Подъём ног в висе — техника выполнения",
"cat": "Пресс",
"dur": "",
"yt": "oWbow6-4XPo",
"by": "",
"short": false,
"desc": "",
"ex": "Подъём ног в висе"
},
{
"id": "t56",
"title": "Планка — техника выполнения",
"cat": "Пресс",
"dur": "",
"yt": "zk11mcZYbnY",
"by": "",
"short": false,
"desc": "",
"ex": "Планка"
},
{
"id": "t57",
"title": "Боковая планка — техника выполнения",
"cat": "Пресс",
"dur": "",
"yt": "q4hzrrvIFtk",
"by": "",
"short": false,
"desc": "",
"ex": "Боковая планка"
},
{
"id": "t58",
"title": "Ролик для пресса — техника выполнения",
"cat": "Пресс",
"dur": "",
"yt": "7uLQv8ZCsek",
"by": "",
"short": false,
"desc": "",
"ex": "Ролик для пресса"
},
{
"id": "t59",
"title": "Русские скручивания — техника выполнения",
"cat": "Пресс",
"dur": "",
"yt": "CRS8837Aq4I",
"by": "",
"short": false,
"desc": "",
"ex": "Русские скручивания"
},
{
"id": "t60",
"title": "Скручивания на блоке — техника выполнения",
"cat": "Пресс",
"dur": "",
"yt": "4dnFqdd61JE",
"by": "",
"short": false,
"desc": "",
"ex": "Скручивания на блоке"
},
{
"id": "t61",
"title": "Вакуум — техника выполнения",
"cat": "Пресс",
"dur": "",
"yt": "MlJ3XyMKgmc",
"by": "",
"short": false,
"desc": "",
"ex": "Вакуум"
},
{
"id": "t62",
"title": "Отжимания — техника выполнения",
"cat": "Калистеника",
"dur": "",
"yt": "PiG-gkXvIV8",
"by": "",
"short": false,
"desc": "",
"ex": "Отжимания"
},
{
"id": "t63",
"title": "Подтягивания широким хватом — техника выполнения",
"cat": "Калистеника",
"dur": "",
"yt": "vFQcAUAB8rU",
"by": "",
"short": false,
"desc": "",
"ex": "Подтягивания широким хватом"
},
{
"id": "t64",
"title": "Выход силой — техника выполнения",
"cat": "Калистеника",
"dur": "",
"yt": "A1nM0JaY0cE",
"by": "",
"short": false,
"desc": "",
"ex": "Выход силой"
},
{
"id": "t65",
"title": "Пистолетик — техника выполнения",
"cat": "Калистеника",
"dur": "",
"yt": "cmA9lejhFMM",
"by": "",
"short": false,
"desc": "",
"ex": "Пистолетик"
},
{
"id": "t66",
"title": "Передний вис — техника выполнения",
"cat": "Калистеника",
"dur": "",
"yt": "zd6HRm0W1Fc",
"by": "",
"short": false,
"desc": "",
"ex": "Передний вис"
},
{
"id": "t67",
"title": "Задний вис — техника выполнения",
"cat": "Калистеника",
"dur": "",
"yt": "caQ4oODH5Y8",
"by": "",
"short": false,
"desc": "",
"ex": "Задний вис"
},
{
"id": "t68",
"title": "Стойка на руках — техника выполнения",
"cat": "Калистеника",
"dur": "",
"yt": "Ipe3sQTFJF4",
"by": "",
"short": false,
"desc": "",
"ex": "Стойка на руках"
},
{
"id": "t69",
"title": "Флажок — техника выполнения",
"cat": "Калистеника",
"dur": "",
"yt": "eMMMf9B-V3Y",
"by": "",
"short": false,
"desc": "",
"ex": "Флажок"
},
{
"id": "t70",
"title": "Уголок на брусьях — техника выполнения",
"cat": "Калистеника",
"dur": "",
"yt": "OoXox5ehLcI",
"by": "",
"short": false,
"desc": "",
"ex": "Уголок на брусьях"
},
{
"id": "t71",
"title": "Отжимания в стойке на руках — техника выполнения",
"cat": "Калистеника",
"dur": "",
"yt": "U0OK-zbhdf0",
"by": "",
"short": false,
"desc": "",
"ex": "Отжимания в стойке на руках"
},
{
"id": "t72",
"title": "Трастеры — техника выполнения",
"cat": "Кроссфит",
"dur": "",
"yt": "d4S0fe2uK1E",
"by": "",
"short": false,
"desc": "",
"ex": "Трастеры"
},
{
"id": "t73",
"title": "Махи гирей — техника выполнения",
"cat": "Кроссфит",
"dur": "",
"yt": "HSTreJWu6N0",
"by": "",
"short": false,
"desc": "",
"ex": "Махи гирей"
},
{
"id": "t74",
"title": "Рывок гири — техника выполнения",
"cat": "Кроссфит",
"dur": "",
"yt": "gX8d0Wkb_tg",
"by": "",
"short": false,
"desc": "",
"ex": "Рывок гири"
},
{
"id": "t75",
"title": "Толчок гирь — техника выполнения",
"cat": "Кроссфит",
"dur": "",
"yt": "tAavqiQ0PAk",
"by": "",
"short": false,
"desc": "",
"ex": "Толчок гирь"
},
{
"id": "t76",
"title": "Берпи — техника выполнения",
"cat": "Кроссфит",
"dur": "",
"yt": "sAYBg-eA_j4",
"by": "",
"short": false,
"desc": "",
"ex": "Берпи"
},
{
"id": "t77",
"title": "Прыжки на тумбу — техника выполнения",
"cat": "Кроссфит",
"dur": "",
"yt": "a_GUgtxVggg",
"by": "",
"short": false,
"desc": "",
"ex": "Прыжки на тумбу"
},
{
"id": "t78",
"title": "Броски мяча в стену (wall ball) — техника выполнения",
"cat": "Кроссфит",
"dur": "",
"yt": "PlUSQt9ppjQ",
"by": "",
"short": false,
"desc": "",
"ex": "Броски мяча в стену (wall ball)"
},
{
"id": "t79",
"title": "Лазание по канату — техника выполнения",
"cat": "Кроссфит",
"dur": "",
"yt": "I76Cfl2e2g0",
"by": "",
"short": false,
"desc": "",
"ex": "Лазание по канату"
},
{
"id": "t80",
"title": "Фермерская прогулка — техника выполнения",
"cat": "Кроссфит",
"dur": "",
"yt": "kTP_MaG7gLw",
"by": "",
"short": false,
"desc": "",
"ex": "Фермерская прогулка"
},
{
"id": "t81",
"title": "Комплекс «Мёрф»: разбор",
"cat": "Кроссфит",
"dur": "",
"yt": "FVsJwuvrvaY",
"by": "",
"short": false,
"desc": "",
"ex": "Комплекс «Мёрф»"
},
{
"id": "t82",
"title": "Комплекс «Фрэн»: разбор",
"cat": "Кроссфит",
"dur": "",
"yt": "elMoeDs8cTk",
"by": "",
"short": false,
"desc": "",
"ex": "Комплекс «Фрэн»"
},
{
"id": "t83",
"title": "Бег — как правильно",
"cat": "Кардио",
"dur": "",
"yt": "Qb_jY1dRjXo",
"by": "",
"short": false,
"desc": "",
"ex": "Бег"
},
{
"id": "t84",
"title": "Беговая дорожка — как правильно",
"cat": "Кардио",
"dur": "",
"yt": "fpU5mc-Dqtk",
"by": "",
"short": false,
"desc": "",
"ex": "Беговая дорожка"
},
{
"id": "t85",
"title": "Велотренажёр — как правильно",
"cat": "Кардио",
"dur": "",
"yt": "YdXjL9Psz0o",
"by": "",
"short": false,
"desc": "",
"ex": "Велотренажёр"
},
{
"id": "t86",
"title": "Гребной тренажёр — как правильно",
"cat": "Кардио",
"dur": "",
"yt": "y3vHj1JCMME",
"by": "",
"short": false,
"desc": "",
"ex": "Гребной тренажёр"
},
{
"id": "t87",
"title": "Эллипс — как правильно",
"cat": "Кардио",
"dur": "",
"yt": "jXKGEIvIScU",
"by": "",
"short": false,
"desc": "",
"ex": "Эллипс"
},
{
"id": "t88",
"title": "Плавание — как правильно",
"cat": "Кардио",
"dur": "",
"yt": "I2Q3kmBvs3I",
"by": "",
"short": false,
"desc": "",
"ex": "Плавание"
},
{
"id": "t89",
"title": "Скакалка — как правильно",
"cat": "Кардио",
"dur": "",
"yt": "U9cIMgcwJ4I",
"by": "",
"short": false,
"desc": "",
"ex": "Скакалка"
},
{
"id": "t90",
"title": "Степпер — как правильно",
"cat": "Кардио",
"dur": "",
"yt": "UAXZOffhA6c",
"by": "",
"short": false,
"desc": "",
"ex": "Степпер"
},
{
"id": "t91",
"title": "Ходьба в горку — как правильно",
"cat": "Кардио",
"dur": "",
"yt": "Fs7Gg-1_slc",
"by": "",
"short": false,
"desc": "",
"ex": "Ходьба в горку"
},
{
"id": "t92",
"title": "Продольный шпагат (см до пола) — техника выполнения",
"cat": "Растяжка",
"dur": "",
"yt": "N-YLup0o-Ho",
"by": "",
"short": false,
"desc": "",
"ex": "Продольный шпагат (см до пола)"
},
{
"id": "t93",
"title": "Поперечный шпагат (см до пола) — техника выполнения",
"cat": "Растяжка",
"dur": "",
"yt": "8JLVVrs0s64",
"by": "",
"short": false,
"desc": "",
"ex": "Поперечный шпагат (см до пола)"
},
{
"id": "t94",
"title": "Наклон вперёд (см за стопы) — техника выполнения",
"cat": "Растяжка",
"dur": "",
"yt": "cZOVkWn_VVQ",
"by": "",
"short": false,
"desc": "",
"ex": "Наклон вперёд (см за стопы)"
},
{
"id": "b1",
"title": "Отжимания с колен — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "CxGm0k_3O0Q",
"by": "",
"short": false,
"desc": "",
"ex": "Отжимания с колен"
},
{
"id": "b2",
"title": "Обратные отжимания от скамьи — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "xT0SoUkhs-A",
"by": "",
"short": false,
"desc": "",
"ex": "Обратные отжимания от скамьи"
},
{
"id": "b3",
"title": "Выпрыгивания из приседа — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "eGRF-mw0CyY",
"by": "",
"short": false,
"desc": "",
"ex": "Выпрыгивания из приседа"
},
{
"id": "b4",
"title": "Прыжки «Джампинг Джек» — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "m3ffeKafWQg",
"by": "",
"short": false,
"desc": "",
"ex": "Прыжки «Джампинг Джек»"
},
{
"id": "b5",
"title": "Скалолаз (альпинист) — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "XbMvNlCUnXA",
"by": "",
"short": false,
"desc": "",
"ex": "Скалолаз (альпинист)"
},
{
"id": "b6",
"title": "Подъёмы ног лёжа — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "3ZkYpSG108k",
"by": "",
"short": false,
"desc": "",
"ex": "Подъёмы ног лёжа"
},
{
"id": "b7",
"title": "Велосипед (на пресс) — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "2sz4FeDU5IA",
"by": "",
"short": false,
"desc": "",
"ex": "Велосипед (на пресс)"
},
{
"id": "b8",
"title": "Супермен (лодочка) — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "O45VWmcWojA",
"by": "",
"short": false,
"desc": "",
"ex": "Супермен (лодочка)"
},
{
"id": "b9",
"title": "Махи ногами — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "4_jOPWdFK7c",
"by": "",
"short": false,
"desc": "",
"ex": "Махи ногами"
},
{
"id": "b10",
"title": "Наклоны в стороны — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "ILSvcyRn7us",
"by": "",
"short": false,
"desc": "",
"ex": "Наклоны в стороны"
},
{
"id": "b11",
"title": "Приседания плие (сумо) — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "VYvnjkfIiSU",
"by": "",
"short": false,
"desc": "",
"ex": "Приседания плие (сумо)"
},
{
"id": "b12",
"title": "Бег на месте — как правильно",
"cat": "Для новичков",
"dur": "",
"yt": "2CHtZogDOHE",
"by": "",
"short": false,
"desc": "",
"ex": "Бег на месте"
},
{
"id": "b13",
"title": "Ходьба — как правильно",
"cat": "Для новичков",
"dur": "",
"yt": "jlv6VdcEUyc",
"by": "",
"short": false,
"desc": "",
"ex": "Ходьба"
},
{
"id": "b14",
"title": "Становая тяга с гантелями — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "OJeZGCr3XnM",
"by": "",
"short": false,
"desc": "",
"ex": "Становая тяга с гантелями"
},
{
"id": "b15",
"title": "Жим гантелей стоя — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "ttHDBnUtmc0",
"by": "",
"short": false,
"desc": "",
"ex": "Жим гантелей стоя"
},
{
"id": "b16",
"title": "Подъём гантелей на бицепс — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "H_JMAU1NKB8",
"by": "",
"short": false,
"desc": "",
"ex": "Подъём гантелей на бицепс"
},
{
"id": "b17",
"title": "Разгибание руки с гантелью в наклоне — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "-zWLdF8R42Y",
"by": "",
"short": false,
"desc": "",
"ex": "Разгибание руки с гантелью в наклоне"
},
{
"id": "b18",
"title": "Выпады назад — техника выполнения",
"cat": "Для новичков",
"dur": "",
"yt": "-n201mLoEhg",
"by": "",
"short": false,
"desc": "",
"ex": "Выпады назад"
},
{
"id": "b19",
"title": "Велосипед (езда) — как правильно",
"cat": "Для новичков",
"dur": "",
"yt": "4XsKoLhVsqw",
"by": "",
"short": false,
"desc": "",
"ex": "Велосипед (езда)"
}
];
window.dfVideos=EXERCISES; // для карты мышц на странице «Спорт»
const CATS=['Все','Для новичков','Зарядка','Силовые','Кардио','Растяжка','Йога','Пресс','Зал: Спина','Зал: Грудь','Зал: Ноги','Зал: Плечи','Зал: Руки','Зал: Ягодицы','Зал: Техника','Калистеника','Кроссфит'];
let cat='Все',q='';
/* избранное: храним id видео (YouTube) в браузере; в модуле Б — в аккаунте */
let FAV=(()=>{try{return JSON.parse(localStorage.getItem('df-vfav'))||[]}catch(e){return[]}})();
const saveFav=()=>{try{localStorage.setItem('df-vfav',JSON.stringify(FAV))}catch(e){}};
const FAVC='Избранное';
function drawCats(){const b=$('vCats');b.innerHTML='';[CATS[0],FAVC,...CATS.slice(1)].forEach(c=>{const e=document.createElement('button');e.type='button';if(c===FAVC){e.innerHTML=ic(FAV.length?'heartfill':'heart')+' Избранное'+(FAV.length?' <small>'+FAV.length+'</small>':'');e.classList.add('favc')}else e.textContent=c;if(c===cat)e.classList.add('on');e.onclick=()=>{cat=c;drawV()};b.appendChild(e)})}
$('vGrid').addEventListener('click',e=>{const b=e.target.closest('.vfav');if(!b)return;e.preventDefault();e.stopPropagation();
  const id=b.dataset.yt,on=FAV.includes(id);FAV=on?FAV.filter(x=>x!==id):[id,...FAV];saveFav();
  if(cat===FAVC)drawV();else{b.classList.toggle('on',!on);b.innerHTML=ic(on?'heart':'heartfill');b.setAttribute('aria-pressed',String(!on));const t=on?'Добавить в избранное':'Убрать из избранного';b.setAttribute('aria-label',t);b.title=t;drawCats()}});
function drawV(){
  drawCats();const g=$('vGrid');g.innerHTML='';
  const list=EXERCISES.filter(v=>(cat==='Все'||(cat===FAVC?FAV.includes(v.yt):v.cat===cat))&&v.title.toLowerCase().includes(q.toLowerCase()));
  $('vSoon').hidden=EXERCISES.length>0;
  if(!EXERCISES.length){for(let i=0;i<8;i++)g.insertAdjacentHTML('beforeend','<div class="vc sk"><div class="th"></div><div class="mt"><div class="ch"></div><div style="flex:1"><div class="l"></div><div class="l" style="width:60%"></div></div></div></div>');return}
  if(!list.length){g.innerHTML=cat===FAVC&&!q?'<p class="mut vempty">'+ic('heart')+' В избранном пока пусто. Нажми на сердечко у любого видео — оно появится здесь.</p>':'<p class="mut">Ничего не найдено. Попробуй другой запрос.</p>';return}
  list.forEach(v=>{const b=document.createElement('div');b.className='vc';const url='https://www.youtube.com/'+(v.short?'shorts/':'watch?v=')+encodeURIComponent(v.yt),fv=FAV.includes(v.yt),ft=fv?'Убрать из избранного':'Добавить в избранное';
    /* сердечко — отдельная кнопка рядом со ссылкой, а не внутри неё: иначе клик открывает видео */
    b.innerHTML='<button type="button" class="vfav'+(fv?' on':'')+'" data-yt="'+esc(v.yt)+'" aria-pressed="'+fv+'" aria-label="'+ft+'" title="'+ft+'">'+ic(fv?'heartfill':'heart')+'</button><a class="vca" href="'+url+'" target="_blank" rel="noopener noreferrer" title="'+esc(v.title)+'"><div class="th" style="--g:'+grad(hue(v.title))+'"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/'+encodeURIComponent(v.yt)+'/hqdefault.jpg" onerror="this.parentNode.classList.add(\'nf\');this.remove()"><span class="pl">'+ic('play')+'</span>'+(v.short?'<span class="sh">Shorts</span>':'')+(v.dur?'<span class="du">'+esc(v.dur)+'</span>':'')+'</div><div class="mt"><div class="ch">'+esc((v.by||'Y')[0])+'</div><div><b>'+esc(v.title)+'</b><small>'+esc(v.by||'YouTube')+' · '+esc(v.cat)+'</small></div></div></a>';
    g.appendChild(b)})}
function watch(v){
  $('vList').hidden=true;const w=$('vWatch');w.hidden=false;
  w.innerHTML='<button class="pill back" id="vBack">'+ic('back')+' К списку</button><div class="pl"><iframe src="https://www.youtube.com/embed/'+encodeURIComponent(v.yt)+'?autoplay=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="'+esc(v.title)+'"></iframe></div><h2>'+esc(v.title)+'</h2><p class="mut">'+esc(v.by||'Drip Fit')+' · '+esc(v.cat)+'</p><p>'+esc(v.desc||'')+'</p>';
  $('vBack').onclick=closeWatch}
function closeWatch(){$('vWatch').innerHTML='';$('vWatch').hidden=true;$('vList').hidden=false}
$('vForm').onsubmit=e=>{e.preventDefault();q=$('vq').value;drawV()};
$('vq').oninput=e=>{q=e.target.value;drawV()};
document.querySelectorAll('.menu [data-go],#video [data-go]').forEach(b=>b.addEventListener('click',closeWatch));
drawV();
})();
