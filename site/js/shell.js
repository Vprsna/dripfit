(function(){const nav=document.getElementById('tnav'),_go=window.go;
function mark(id){const t={video:'lib',music:'lib',privacy:'main',auth:'cabinet'}[id]||id;nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.go===t))}
window.go=function(id){_go(id);mark(id)};mark('main');
nav.querySelectorAll('button').forEach(b=>b.onclick=()=>window.go(b.dataset.go));
document.querySelectorAll('.top .logo').forEach(b=>b.onclick=()=>window.go('main'));
const bar=(p)=>'<div class="bar"><i style="width:'+p+'%"></i></div>';
/* ===== планы: редактируются в кабинете, сегодняшние выводятся на главную =====
   в модуле Б хранение переедет из localStorage в базу данных */
const DAYS=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],DAYSF=['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];
const todayIdx=()=>(new Date().getDay()+6)%7, dateKey=()=>new Date().toISOString().slice(0,10);
const escH=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let plans=ld('df-plans',null),uid=Date.now();
if(!plans||typeof plans!=='object'){plans={all:[],d:[[],[],[],[],[],[],[]]};
 plans.d[todayIdx()]=[{id:1,t:'Жим лёжа',x:'4×10 · 60 кг'},{id:2,t:'Отжимания',x:'3×20'},{id:3,t:'Разгибания на блоке',x:'3×12'}];
 plans.all=[{id:4,t:'Растяжка',x:'5 минут'}];sv('df-plans',plans)}
let done=ld('df-plan-done',{});if(done.date!==dateKey())done={date:dateKey(),ids:[],paid:false};
const plan=document.getElementById('plan'),pb=document.getElementById('planBtn'),pc=document.getElementById('planCnt'),pe=document.getElementById('planEmpty'),pdy=document.getElementById('planDay');
const todayList=()=>[...plans.d[todayIdx()],...plans.all];
function renderPlan(){const L=todayList();
 plan.innerHTML=L.map(p=>'<li><label><input type="checkbox" data-id="'+p.id+'"'+(done.ids.includes(p.id)?' checked':'')+'><span class="bx"></span><b>'+escH(p.t)+'</b><em>'+escH(p.x||'')+'</em></label></li>').join('');
 pe.hidden=L.length>0;pb.hidden=!L.length;const n=L.filter(p=>done.ids.includes(p.id)).length;
 pc.textContent=L.length?n+' из '+L.length:DAYSF[todayIdx()];
 pb.disabled=done.paid||n<L.length;pb.textContent=done.paid?'План закрыт':'Закрыть план +50'}
plan.onchange=e=>{const id=+e.target.dataset.id;if(!id)return;done.ids=e.target.checked?[...new Set([...done.ids,id])]:done.ids.filter(x=>x!==id);sv('df-plan-done',done);renderPlan()};
pb.onclick=()=>{if(done.paid)return;done.paid=true;sv('df-plan-done',done);if(fits!==Infinity)fits+=50;showFits();renderPlan()};
// кнопка в пустом плане ведёт в «Мои планы» (data-goto, см. workouts.js)
/* редактор в кабинете */
let tab=todayIdx();const ptabs=document.getElementById('ptabs'),plist=document.getElementById('plist');
function listOf(t){return t==='all'?plans.all:plans.d[t]}
function renderEd(){ptabs.innerHTML=DAYS.map((d,i)=>'<button type="button" role="tab" data-t="'+i+'" class="'+(tab===i?'on':'')+(i===todayIdx()?' td':'')+'">'+d+'<small>'+plans.d[i].length+'</small></button>').join('')+'<button type="button" role="tab" data-t="all" class="'+(tab==='all'?'on':'')+'">Каждый день<small>'+plans.all.length+'</small></button>';
 const L=listOf(tab);plist.innerHTML=L.length?L.map(p=>'<li><b>'+escH(p.t)+'</b><em>'+escH(p.x||'')+'</em><button type="button" class="pdel" data-id="'+p.id+'" aria-label="Удалить «'+escH(p.t)+'»">'+ic('close')+'</button></li>').join(''):'<li class="mut">'+(tab==='all'?'Нет задач на каждый день.':'На '+(tab===todayIdx()?'сегодня':DAYS[tab])+' задач нет.')+'</li>'}
ptabs.onclick=e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.t==='all'?'all':+b.dataset.t;renderEd()};
/* «5,4,60» → «5×4 · 60 кг»; «3,20» → «3×20»; любой другой текст остаётся как есть */
function fmtDet(v){v=v.trim();if(!v)return'';const p=v.split(/\s*[,;×xх*\s]\s*/i).filter(Boolean);
 if(p.length>=2&&p.length<=3&&p.every(n=>/^\d+([.,]\d+)?$/.test(n))){const s=p[0]+'×'+p[1];return p.length===3?s+' · '+p[2].replace('.',',')+' кг':s}return v}
const pPrev=document.getElementById('pPrev');
pDet.addEventListener('input',()=>{const f=fmtDet(pDet.value);pPrev.textContent=f&&f!==pDet.value.trim()?'Будет записано: '+f:''});
pDet.addEventListener('blur',()=>{const f=fmtDet(pDet.value);if(f)pDet.value=f;pPrev.textContent=''});
document.getElementById('padd').onsubmit=e=>{e.preventDefault();const t=pText.value.trim();if(!t)return;listOf(tab).push({id:++uid,t,x:fmtDet(pDet.value)});sv('df-plans',plans);pText.value='';pDet.value='';pPrev.textContent='';pText.focus();renderEd();renderPlan()};
plist.onclick=e=>{const b=e.target.closest('.pdel');if(!b)return;const id=+b.dataset.id,L=listOf(tab);L.splice(L.findIndex(p=>p.id===id),1);sv('df-plans',plans);renderEd();renderPlan()};
renderPlan();renderEd();
window.dfPlans={add(items){const L=plans.d[todayIdx()];items.forEach(p=>L.push({id:++uid,t:p.t,x:p.x||''}));sv('df-plans',plans);renderPlan();renderEd()}};
const _go2=window.go;window.go=function(id){_go2(id);if(id==='main')renderPlan();if(id==='cabinet')renderEd()};
const CH=[['5 тренировок за 7 дней',3,5,'+150'],['Растяжка каждый день',4,7,'+80'],['Три видео из библиотеки',1,3,'+40']];
document.getElementById('chal').innerHTML=CH.map(c=>'<div class="it"><div class="r"><b>'+c[0]+'</b><span class="rw">'+c[3]+' фитов</span></div>'+bar(c[1]/c[2]*100)+'<small class="mut">'+c[1]+' из '+c[2]+'</small></div>').join('');
const NR=[['Привычка','14 дней серии',12,14,'+120'],['Втянулся','50 тренировок',41,50,'+200'],['Рекордсмен','10 личных рекордов',7,10,'+250']];
document.getElementById('near').innerHTML=NR.map(c=>'<div class="it"><div class="r"><b>'+c[0]+'</b><span class="rw">'+c[4]+' фитов</span></div>'+bar(c[2]/c[3]*100)+'<small class="mut">'+c[1]+' · '+Math.round(c[2]/c[3]*100)+'%</small></div>').join('');
document.querySelectorAll('.blocks .all[data-go]').forEach(b=>b.onclick=()=>window.go(b.dataset.go));


/* вид интерфейса: компьютер (М4) / телефон (Т3) */
const vmBtn=document.getElementById('vmBtn'),vmMenu=document.getElementById('vmMenu');
const ICO={pc:vmMenu.querySelector('[data-m=pc] svg').outerHTML,phone:vmMenu.querySelector('[data-m=phone] svg').outerHTML};
const small=()=>Math.min(screen.width,innerWidth)<700;
let mode;try{mode=localStorage.getItem('df-view')}catch(e){}
if(mode!=='pc'&&mode!=='phone')mode=small()?'phone':'pc';
function setView(m,save){mode=m;document.body.classList.toggle('phone',m==='phone'&&!small());
 vmBtn.innerHTML=ICO[m];vmBtn.title=m==='pc'?'Вид: компьютер':'Вид: телефон';
 vmMenu.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
 const vp=document.querySelector('meta[name=viewport]');if(vp&&small())vp.setAttribute('content',m==='pc'?'width=1280':'width=device-width, initial-scale=1, viewport-fit=cover');
 if(save)try{localStorage.setItem('df-view',m)}catch(e){}}
function closeVm(){vmMenu.hidden=true;vmBtn.setAttribute('aria-expanded','false')}
vmBtn.onclick=e=>{e.stopPropagation();const o=vmMenu.hidden;vmMenu.hidden=!o;vmBtn.setAttribute('aria-expanded',String(o))};
vmMenu.onclick=e=>{const b=e.target.closest('button');if(!b)return;setView(b.dataset.m,true);closeVm()};
document.addEventListener('click',e=>{if(!vmMenu.hidden&&!e.target.closest('.vmode'))closeVm()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeVm()});
setView(mode,false);

/* полоса-уведомление сверху: крестик убирает её (запоминаем) */
const ann=document.getElementById('ann'),annX=document.getElementById('annX');
const hideAnn=()=>{ann.hidden=true;document.body.classList.add('noann')};
try{if(localStorage.getItem('df-ann-off')==='1')hideAnn()}catch(e){}
annX.onclick=()=>{hideAnn();try{localStorage.setItem('df-ann-off','1')}catch(e){}};

/* колёсико мыши листает горизонтальные ряды чипов */
document.addEventListener('wheel',e=>{const r=e.target.closest('.ycats,.rbr,.ptabs,.brands,.spopt,.chips');
 if(!r||r.scrollWidth<=r.clientWidth+2||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
 const max=r.scrollWidth-r.clientWidth;if((e.deltaY<0&&r.scrollLeft<=0)||(e.deltaY>0&&r.scrollLeft>=max-1))return;
 r.scrollLeft+=e.deltaY;e.preventDefault()},{passive:false});
})();
