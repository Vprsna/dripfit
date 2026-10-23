/* life.js — вкладки «Дом» (свои дела с повтором, порядок сегодня, список покупок) и «Деньги» (доходы и расходы,
   цель месяца, категории, история по месяцам). Хранение: df-home, df-money (с сервером модуля Б — в аккаунте). */
(()=>{
const $=id=>document.getElementById(id);
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icn=n=>typeof ic==='function'?ic(n):'';
const dk=d=>{const z=new Date(d);z.setMinutes(z.getMinutes()-z.getTimezoneOffset());return z.toISOString().slice(0,10)};
const today=()=>dk(new Date()),addD=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return dk(d)};
const fitsAdd=n=>{try{if(typeof fits==='number'&&isFinite(fits)){fits+=n;if(typeof showFits==='function')showFits()}}catch(e){}};
const rub=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';

/* ======================= ДОМ ======================= */
if($('hmForm')){
let H=ld('df-home',null);
if(!H||!Array.isArray(H.jobs))H={jobs:[],done:{},paid:{},buy:[]};
H.done=H.done||{};H.paid=H.paid||{};H.buy=H.buy||[];
const save=()=>sv('df-home',H);
const RN={d:'каждый день',w:'раз в неделю',o:'один раз'};
const lastDone=id=>Object.keys(H.done).filter(d=>H.done[d].includes(id)).sort().pop();
// дело «на сегодня»: ежедневное — всегда; недельное — если за 7 дней не сделано или сделано сегодня; разовое — пока не сделано (или сделано сегодня)
const isToday=j=>{const l=lastDone(j.id),t=today();if(j.r==='d')return true;if(j.r==='w')return !l||l===t||l<addD(t,-6);return !l||l===t};
function draw(){const t=today(),dn=H.done[t]||[],L=H.jobs.filter(isToday);
 $('hmToday').innerHTML=L.length?L.map(j=>'<li class="'+(dn.includes(j.id)?'done':'')+'"><label class="stck"><input type="checkbox" data-hk="'+j.id+'"'+(dn.includes(j.id)?' checked':'')+' aria-label="Сделано"><span class="bx"></span></label><div class="sttx"><b>'+esc(j.t)+'</b><span><i class="stsub" style="--h:'+(j.z.length*47%360)+'">'+esc(j.z)+'</i><small class="mut">'+RN[j.r]+'</small></span></div><span></span></li>').join(''):'<li class="mut stempty">На сегодня дел нет — добавь новые выше.</li>';
 $('hmAllS').textContent='Все дела ('+H.jobs.length+')';
 $('hmAll').innerHTML=H.jobs.map(j=>{const l=lastDone(j.id);return '<li><span><b>'+esc(j.t)+'</b> · '+esc(j.z)+' · '+RN[j.r]+'<small class="mut"> · '+(l?'было '+new Date(l+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'ещё не делали')+'</small></span><span></span><button type="button" class="pdel" data-hdel="'+j.id+'" aria-label="Удалить">'+icn('close')+'</button></li>'}).join('')||'<li class="mut">Пусто</li>';
 const n=L.filter(j=>dn.includes(j.id)).length;$('hmDone').textContent=n;$('hmOf').textContent='из '+L.length+' дел';$('hmBar').style.width=(L.length?n/L.length*100:0)+'%';
 let wk=0;for(let i=0;i<7;i++)wk+=(H.done[addD(t,-i)]||[]).length;$('hmWeek').textContent=wk;
 let st=0,d=t;if(!(H.done[d]||[]).length)d=addD(d,-1);while((H.done[d]||[]).length){st++;d=addD(d,-1)}$('hmStreak').textContent=st;
 const zones={};H.jobs.forEach(j=>{const l=lastDone(j.id);if(!zones[j.z]||(l||'')<zones[j.z])zones[j.z]=l||''});
 const old=Object.entries(zones).filter(([,l])=>!l||l<addD(t,-6)).map(([z])=>z);
 $('hmZones').textContent=old.length?'Давно не было уборки: '+old.join(', '):'Во всех зонах порядок!';
 $('buyList').innerHTML=H.buy.length?H.buy.map(b=>'<li class="'+(b.ok?'done':'')+'"><label class="stck"><input type="checkbox" data-bk="'+b.id+'"'+(b.ok?' checked':'')+' aria-label="Куплено"><span class="bx"></span></label><div class="sttx"><b>'+esc(b.t)+'</b></div><button type="button" class="pdel" data-bdel="'+b.id+'" aria-label="Удалить">'+icn('close')+'</button></li>').join(''):'<li class="mut stempty">Список пуст.</li>'}
$('hmForm').onsubmit=e=>{e.preventDefault();const t=$('hmT').value.trim();if(!t)return;H.jobs.push({id:Date.now(),t:t.slice(0,60),z:$('hmZ').value,r:$('hmR').value});save();$('hmT').value='';draw()};
$('hmToday').addEventListener('change',e=>{const id=+e.target.dataset.hk;if(!id)return;const t=today();H.done[t]=H.done[t]||[];
 if(e.target.checked){if(!H.done[t].includes(id))H.done[t].push(id);if((H.paid[t]||0)<6){H.paid[t]=(H.paid[t]||0)+1;fitsAdd(5)}}
 else{H.done[t]=H.done[t].filter(x=>x!==id);if(H.paid[t]>0){H.paid[t]--;fitsAdd(-5)}}save();draw()});
$('hmAll').onclick=e=>{const b=e.target.closest('[data-hdel]');if(!b)return;H.jobs=H.jobs.filter(j=>j.id!==+b.dataset.hdel);save();draw()};
$('buyForm').onsubmit=e=>{e.preventDefault();const t=$('buyT').value.trim();if(!t)return;H.buy.push({id:Date.now(),t:t.slice(0,40),ok:false});save();$('buyT').value='';$('buyT').focus();draw()};
$('buyList').addEventListener('change',e=>{const b=H.buy.find(x=>x.id===+e.target.dataset.bk);if(!b)return;b.ok=e.target.checked;save();draw()});
$('buyList').addEventListener('click',e=>{const b=e.target.closest('[data-bdel]');if(!b)return;H.buy=H.buy.filter(x=>x.id!==+b.dataset.bdel);save();draw()});
$('buyClr').onclick=()=>{H.buy=H.buy.filter(b=>!b.ok);save();draw()};
draw();const _go=window.go;window.go=function(id){_go(id);if(id==='home')draw()};
}

/* ===== показывать ли вкладку «Деньги» (например, для детей можно скрыть) ===== */
(()=>{const key='df-money-hide',nav=document.querySelector('#tnav [data-go=money]');
 const home=nav&&nav.previousElementSibling,cab=document.querySelector('#tnav [data-go=cabinet]');
 const set=(hide,save)=>{if(nav){nav.classList.toggle('navdim',hide);nav.title=hide?'Вкладка скрыта — включить можно на ней самой или в профиле':'';if(hide)nav.parentNode.insertBefore(nav,cab);else if(home)home.after(nav)}['mnShow','mnShow2'].forEach(id=>{const c=$(id);if(c)c.checked=!hide});if(save)sv(key,hide)};
 set(!!ld(key,false));['mnShow','mnShow2'].forEach(id=>{const c=$(id);if(c)c.onchange=()=>set(!c.checked,true)})})();

/* ======================= ДЕНЬГИ ======================= */
if($('mnForm')){
let M=ld('df-money',null);
if(!M||!Array.isArray(M.ops))M={goal:{},ops:[],paid:{}};
M.goal=M.goal||{};M.paid=M.paid||{};
const save=()=>sv('df-money',M);
const CATS={in:['Подработка','Зарплата','Стипендия','Карманные','Подарок','Продажа','Другое'],out:['Еда','Транспорт','Спорт','Учёба','Развлечения','Одежда','Связь','Подарки','Другое']};
let ty='in';const ym=()=>today().slice(0,7);
const mName=m=>new Date(m+'-15T12:00').toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
function cats(){$('mnCat').innerHTML=CATS[ty].map(c=>'<option>'+c+'</option>').join('');document.querySelectorAll('#mnType [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===ty))}
function draw(){const m=ym(),L=M.ops.filter(o=>o.d.slice(0,7)===m),inc=L.filter(o=>o.ty==='in').reduce((a,o)=>a+o.sum,0),exp=L.filter(o=>o.ty==='out').reduce((a,o)=>a+o.sum,0),g=M.goal[m]||0;
 $('mnMonth').textContent=mName(m).replace(/^./,c=>c.toUpperCase());$('mnInc').textContent=rub(inc);$('mnGoalT').textContent=g?'из цели '+rub(g):'цель не задана';
 $('mnBar').style.width=(g?Math.min(100,inc/g*100):0)+'%';$('mnExp').textContent=rub(exp);$('mnBal').textContent=rub(inc-exp);$('mnGoal').placeholder=g?'Цель: '+rub(g):'Цель дохода на месяц, ₽';
 if(g&&inc>=g&&!M.paid[m]){M.paid[m]=1;fitsAdd(100);save()}
 const by={};L.filter(o=>o.ty==='out').forEach(o=>by[o.cat]=(by[o.cat]||0)+o.sum);const E=Object.entries(by).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...E.map(x=>x[1]));
 $('mnCats').innerHTML=E.length?E.map(([c,v])=>'<div class="tmrow"><span>'+esc(c)+'</span><div class="bar"><i style="width:'+(v/mx*100).toFixed(0)+'%"></i></div><b>'+rub(v)+'</b></div>').join(''):'<p class="mut">Расходов в этом месяце пока нет.</p>';
 $('mnList').innerHTML=[...M.ops].sort((a,b)=>b.d.localeCompare(a.d)||b.id-a.id).slice(0,12).map(o=>'<li><span><b class="'+(o.ty==='in'?'mnin':'mnout')+'">'+(o.ty==='in'?'+':'−')+rub(o.sum)+'</b> · '+esc(o.cat)+(o.note?' · '+esc(o.note):'')+'<small class="mut"> · '+new Date(o.d+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'})+'</small></span><span></span><button type="button" class="pdel" data-mdel="'+o.id+'" aria-label="Удалить">'+icn('close')+'</button></li>').join('')||'<li class="mut">Записей нет.</li>';
 const months=[];for(let i=5;i>=0;i--){const d=new Date();d.setDate(15);d.setMonth(d.getMonth()-i);months.push(dk(d).slice(0,7))}
 const val=months.map(mm=>M.ops.filter(o=>o.d.slice(0,7)===mm&&o.ty==='in').reduce((a,o)=>a+o.sum,0)),mxh=Math.max(1,...val,...months.map(mm=>M.goal[mm]||0));
 $('mnHist').innerHTML=months.map((mm,i)=>'<div class="dynb'+(i===5?' now':'')+'"><span class="dynv">'+(val[i]?Math.round(val[i]/1000)+'k':'0')+(M.goal[mm]?' / '+Math.round(M.goal[mm]/1000)+'k':'')+'</span><i style="height:'+Math.max(3,val[i]/mxh*100).toFixed(1)+'%"></i><small>'+new Date(mm+'-15T12:00').toLocaleDateString('ru-RU',{month:'short'})+'</small></div>').join('')}
$('mnType').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;ty=b.dataset.t;cats()};
$('mnForm').onsubmit=e=>{e.preventDefault();const s=Math.round(+$('mnSum').value);if(!(s>0))return;M.ops.push({id:Date.now(),d:today(),ty,sum:s,cat:$('mnCat').value,note:$('mnNote').value.trim().slice(0,40)});save();$('mnSum').value='';$('mnNote').value='';draw()};
$('mnGoalF').onsubmit=e=>{e.preventDefault();const g=Math.round(+$('mnGoal').value);if(g>=0){M.goal[ym()]=g;save();$('mnGoal').value='';draw()}};
$('mnList').onclick=e=>{const b=e.target.closest('[data-mdel]');if(!b)return;M.ops=M.ops.filter(o=>o.id!==+b.dataset.mdel);save();draw()};
cats();draw();save();const _go=window.go;window.go=function(id){_go(id);if(id==='money')draw()};
}
})();
