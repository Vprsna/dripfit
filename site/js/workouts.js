/* workouts.js — «Мои тренировки» в личном кабинете.
   Тренировка = название + список упражнений из каталога «Отчётов» с плановыми подходами/повторами/весом.
   Можно создать, открыть, переименовать, добавить/убрать упражнения, поменять порядок, удалить тренировку
   и отметить выполнение: все упражнения записываются в «Отчёты» за сегодня. Фиты за тренировку — +50 один раз в день (общий лимит, см. home.js).
   Хранение — localStorage (df-workouts); в модуле Б — таблица workouts в базе данных. */
(()=>{
const $=id=>document.getElementById(id);
const C=()=>window.dfCat;
if(!$('woCard')||!C())return;
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icn=n=>typeof ic==='function'?ic(n):'';
const exN=n=>C().EX.find(e=>e.n===n);
const plan=e=>{const o={};(C().F[e.t]||[]).forEach(([k,,d])=>o[k]=d);return o};
const item=e=>Object.assign({ex:e.id},plan(e));

let W=ld('df-workouts',null);
if(!Array.isArray(W)){W=[];sv('df-workouts',W)}
if(false){const mk=(name,L)=>({id:Date.now()+Math.random(),name,items:L.map(exN).filter(Boolean).map(item),done:{}});
 W=[mk('Грудь и трицепс',['Жим штанги лёжа','Жим гантелей на наклонной скамье','Отжимания','Разгибания на блоке (трицепс)']),
    mk('Всё тело для старта',['Приседания','Отжимания с колен','Ягодичный мостик на полу','Планка'])];sv('df-workouts',W)}
const save=()=>sv('df-workouts',W);
let open=null,confirmDel=null,q='';
const byWid=id=>W.find(w=>String(w.id)===String(id));
const word=n=>n%10===1&&n%100!==11?'упражнение':[2,3,4].includes(n%10)&&![12,13,14].includes(n%100)?'упражнения':'упражнений';

/* ---------- список тренировок ---------- */
function drawList(){
 $('woList').innerHTML=W.length?W.map(w=>{const last=Object.keys(w.done||{}).sort().pop();
  return '<div class="wot"><button type="button" class="wotb" data-open="'+w.id+'"><b>'+esc(w.name)+'</b><small>'+w.items.length+' '+word(w.items.length)+'</small>'
   +'<span class="woex">'+w.items.slice(0,3).map(x=>{const e=C().byId(x.ex);return e?esc(e.n):''}).join(' · ')+(w.items.length>3?' …':'')+'</span>'
   +'<em>'+(last?'Выполнена: '+esc(C().fmtDate(last)):'Ещё не выполнялась')+'</em></button>'
   +'<div class="wota"><button type="button" class="btn alt" data-open="'+w.id+'">Открыть</button><button type="button" class="pdel'+(confirmDel===String(w.id)?' sure':'')+'" data-del="'+w.id+'" aria-label="Удалить тренировку">'+(confirmDel===String(w.id)?'Точно?':icn('trash'))+'</button></div></div>'}).join('')
  :'<p class="mut">Тренировок пока нет. Впиши название выше и нажми «Создать».</p>'}
$('woNew').onsubmit=e=>{e.preventDefault();const n=$('woName').value.trim()||('Тренировка '+(W.length+1));
 const w={id:Date.now(),name:n.slice(0,40),items:[],done:{}};W.unshift(w);save();$('woName').value='';openWo(w.id)};
$('woList').onclick=e=>{const o=e.target.closest('[data-open]'),d=e.target.closest('[data-del]');
 if(o){openWo(o.dataset.open);return}
 if(d)delWo(d.dataset.del,drawList)};
function delWo(id,after){id=String(id);
 if(confirmDel!==id){confirmDel=id;after();setTimeout(()=>{if(confirmDel===id){confirmDel=null;after()}},3000);return}
 W=W.filter(w=>String(w.id)!==id);confirmDel=null;save();if(open&&String(open)===id)closeWo();else after()}

/* ---------- редактор ---------- */
function openWo(id){open=id;q='';$('woHome').hidden=true;$('woEd').hidden=false;drawEd();
 $('woCard').scrollIntoView({behavior:'smooth',block:'start'})}
function closeWo(){open=null;confirmDel=null;$('woEd').hidden=true;$('woHome').hidden=false;drawList()}
function vid(e){const v=(window.dfVideos||[]).find(v=>v.ex===e.n);return v?'<a class="mxv tv" href="https://www.youtube.com/'+(v.short?'shorts/':'watch?v=')+encodeURIComponent(v.yt)+'" target="_blank" rel="noopener noreferrer" title="Видео: как делать" aria-label="Видео: '+esc(e.n)+'">'+icn('play')+'</a>':''}
function drawEd(){const w=byWid(open);if(!w){closeWo();return}
 const td=C().today(),doneT=w.done&&w.done[td];
 $('woEd').innerHTML='<div class="woeh"><button type="button" class="lnk2" data-act="back">← Все тренировки</button>'
  +'<label class="woname"><span class="mut">Название</span><input id="woTitle" maxlength="40" value="'+esc(w.name)+'" aria-label="Название тренировки"></label></div>'
  +'<ol class="woitems">'+(w.items.length?w.items.map((x,i)=>{const e=C().byId(x.ex);if(!e)return'';
    return '<li><i class="won">'+(i+1)+'</i><div class="woen">'+vid(e)+'<div><b>'+esc(e.n)+'</b><small>'+esc(e.b===C().BASIC_BR?'Для новичков':e.b)+'</small></div></div>'
     +'<div class="wof">'+(C().F[e.t]||[]).map(([k,l,,st,mx])=>'<label>'+esc(l)+'<input type="number" inputmode="decimal" min="0" max="'+mx+'" step="'+st+'" data-i="'+i+'" data-k="'+k+'" value="'+(x[k]??'')+'"></label>').join('')+'</div>'
     +(window.dfHow?'<div class="wohow">'+window.dfHow.block(e)+'</div>':'')+'<div class="woia"><button type="button" class="pdel" data-act="up" data-i="'+i+'" aria-label="Выше"'+(i?'':' disabled')+'>↑</button><button type="button" class="pdel" data-act="down" data-i="'+i+'" aria-label="Ниже"'+(i<w.items.length-1?'':' disabled')+'>↓</button><button type="button" class="pdel" data-act="rm" data-i="'+i+'" aria-label="Убрать упражнение">'+icn('close')+'</button></div></li>'}).join('')
    :'<li class="mut woempty">В тренировке пока нет упражнений. Найди их поиском ниже.</li>')+'</ol>'
  +'<div class="woadd"><h3>Добавить упражнение</h3><label class="rsearch"><svg class="ic" aria-hidden="true"><use href="#i-search"/></svg><input id="woQ" placeholder="Название или группа мышц: жим, спина, пресс…" autocomplete="off" aria-label="Поиск упражнения" value="'+esc(q)+'"></label><div class="wosug" id="woSug"></div></div>'
  +'<div class="woft"><button type="button" class="btn" data-act="done"'+(w.items.length?'':' disabled')+'>'+(doneT?'Выполнена сегодня — обновить запись':'Выполнил — записать в отчёт'+(window.dfTrainPaid&&window.dfTrainPaid()?'':' +50 фитов'))+'</button>'
  +'<button type="button" class="btn alt'+(confirmDel===String(w.id)?' sure':'')+'" data-act="del">'+(confirmDel===String(w.id)?'Точно удалить?':'Удалить тренировку')+'</button></div>'
  +'<p class="wook" id="woOk" role="status" hidden></p>';
 drawSug()}
function drawSug(){const box=$('woSug');if(!box)return;const qq=q.trim().toLowerCase();
 if(qq.length<2){box.innerHTML='<p class="mut psm">Например: «присед», «грудь», «бег».</p>';return}
 const lv=e=>C().lvlOf?C().lvlOf(e):1;
 const L=C().EX.filter(e=>!['cm','kg','pct'].includes(e.t)&&(e.n.toLowerCase().includes(qq)||e.b.toLowerCase().includes(qq)||(window.dfHow&&window.dfHow.tags(e).includes(qq)))).sort((a,b)=>lv(a)-lv(b)).slice(0,10);
 box.innerHTML=L.length?L.map(e=>'<button type="button" data-add="'+e.id+'"><b>+ '+esc(e.n)+'</b><small>'+esc(e.b===C().BASIC_BR?'Для новичков':e.b)+'</small></button>').join(''):'<p class="mut psm">Ничего не нашлось.</p>'}
$('woEd').addEventListener('input',e=>{const w=byWid(open);if(!w)return;
 if(e.target.id==='woTitle'){w.name=e.target.value.slice(0,40)||'Без названия';save();return}
 if(e.target.id==='woQ'){q=e.target.value;drawSug();return}
 const i=e.target.dataset.i,k=e.target.dataset.k;if(i!=null&&k){const mx=+e.target.max||1e9;let v=parseFloat(String(e.target.value).replace(',','.'));v=isFinite(v)?Math.max(0,v):0;
  if(v>mx){v=mx;e.target.value=mx;flash('Максимум для этого поля — '+mx)}w.items[+i][k]=v;save()}});
$('woEd').addEventListener('click',e=>{const w=byWid(open);if(!w)return;
 const add=e.target.closest('[data-add]');
 if(add){const ex=C().byId(+add.dataset.add);w.items.push(item(ex));save();q='';drawEd();const n=$('woEd').querySelectorAll('.woitems li');if(n.length)n[n.length-1].classList.add('new');flash('Добавлено: '+ex.n);return}
 const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,i=+b.dataset.i;
 if(a==='back')closeWo();
 if(a==='rm'){w.items.splice(i,1);save();drawEd()}
 if(a==='up'&&i>0){[w.items[i-1],w.items[i]]=[w.items[i],w.items[i-1]];save();drawEd()}
 if(a==='down'&&i<w.items.length-1){[w.items[i+1],w.items[i]]=[w.items[i],w.items[i+1]];save();drawEd()}
 if(a==='del')delWo(w.id,drawEd);
 if(a==='done'&&w.items.length){const td=C().today();
  w.logs=w.logs||{};const again=!!(w.logs[td]&&w.logs[td].length);if(again&&C().remove)C().remove(w.logs[td]);
  w.logs[td]=[];w.items.forEach(x=>{const r=Object.assign({},x,{d:td});C().add(r);w.logs[td].push(r.id)});w.done=w.done||{};w.done[td]=1;save();
  const got=window.dfTrainPay?window.dfTrainPay():false;
  if(C().refresh)C().refresh();if(window.dfRankRefresh)window.dfRankRefresh();
  drawEd();flash((again?'Запись за сегодня обновлена: ':'Записано в «Отчёты» за сегодня: ')+w.items.length+' '+word(w.items.length)+(got?' · +50 фитов':' · фиты за тренировку сегодня уже получены'))}});
$('woEd').addEventListener('keydown',e=>{if(e.target.id==='woQ'&&e.key==='Enter'){e.preventDefault();const b=$('woSug').querySelector('[data-add]');if(b)b.click()}});
function flash(t){const m=$('woOk');if(!m)return;m.textContent=t;m.hidden=false;clearTimeout(m._t);m._t=setTimeout(()=>m.hidden=true,3000)}

/* ---------- API для других вкладок ---------- */
window.dfWorkouts={list:()=>W,
 create(name,names){const w={id:Date.now(),name:String(name).slice(0,40),items:names.map(exN).filter(Boolean).map(item),done:{}};W.unshift(w);save();drawList();return w},
 open(id){if(typeof go==='function')go('cabinet');setTimeout(()=>openWo(id),60)}};

/* кнопка «В тренировку» в форме «Отчётов» */
window.dfWoPick=(box,ex)=>{if(!box||!ex)return;let on=false;
 const draw=msg=>{box.innerHTML='<button type="button" class="btn alt rtwb" aria-expanded="'+on+'">+ В тренировку</button>'
  +(on?'<div class="rtwm">'+W.map(w=>'<button type="button" data-w="'+w.id+'">'+esc(w.name)+'<small>'+w.items.length+' упр.</small></button>').join('')+'<button type="button" data-w="new" class="rtwnew">+ Новая тренировка</button></div>':'')
  +(msg||'')};
 box.onclick=e=>{if(e.target.closest('.rtwb')){on=!on;draw();return}
  const b=e.target.closest('[data-w]');if(b){let w;
   if(b.dataset.w==='new'){w={id:Date.now(),name:ex.n,items:[],done:{}};W.unshift(w)}else w=byWid(b.dataset.w);
   w.items.push(item(ex));save();drawList();on=false;
   draw('<p class="rtwok">Добавлено в «'+esc(w.name)+'» <button type="button" class="lnk2" data-wopen="'+w.id+'">Открыть →</button></p>');return}
  const o=e.target.closest('[data-wopen]');if(o)window.dfWorkouts.open(o.dataset.wopen)};
 draw()};

/* генератор на «Спорте»: сохранить подборку как тренировку */
const gw=$('genWo');
if(gw)gw.onclick=()=>{const names=[...document.querySelectorAll('#genList li:not(.mut) b')].map(b=>b.textContent);if(!names.length)return;
 const g=document.querySelector('#genG .on'),t=document.querySelector('#genT .on');
 const w=window.dfWorkouts.create((g?g.textContent.trim():'Тренировка')+(t?' · '+t.textContent.trim():''),names);
 const m=$('genMsg');m.innerHTML='Сохранено в «Мои тренировки»: «'+esc(w.name)+'». <button type="button" class="lnk2" data-wopen="'+w.id+'">Открыть →</button>';m.hidden=false;
 m.onclick=e=>{const o=e.target.closest('[data-wopen]');if(o)window.dfWorkouts.open(o.dataset.wopen)}};

document.addEventListener('df-train-paid',()=>{if(open)drawEd()});
/* кнопки «Настроить тренировку» на других вкладках → личный кабинет, блок «Мои тренировки» */
/* data-goto="id" — то же для любого блока кабинета (например, «Мои планы») */
document.addEventListener('click',e=>{const b=e.target.closest('[data-wo-go],[data-goto]');if(!b)return;const t=b.hasAttribute('data-wo-go')?'woCard':b.dataset.goto;
 if(typeof go==='function')go('cabinet');
 setTimeout(()=>{const el=$(t);if($('cabinet').classList.contains('on')&&el){el.scrollIntoView({behavior:'smooth',block:'start'});const f=el.querySelector('input');if(f&&t==='planner')setTimeout(()=>f.focus({preventScroll:true}),500)}},80)});
drawList();
const _go=window.go;window.go=function(id){_go(id);if(id==='cabinet'&&!open)drawList()};
})();
