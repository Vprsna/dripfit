/* friends.js — система друзей в личном кабинете (макет модуля А).
   Пока это имитация: «база» пользователей — демо-список DIR ниже, заявки принимаются автоматически через пару секунд.
   В модуле Б поиск по никам, заявки и ответы пойдут через сервер и базу данных. */
(()=>{
const DIR=[
 {n:'artem_pro',name:'Артём',st:21,wk:3420,on:'в сети'},
 {n:'liza_fit',name:'Лиза',st:14,wk:3105,on:'2 ч назад'},
 {n:'max_power',name:'Макс Power',st:9,wk:2780,on:'в сети'},
 {n:'sonya.run',name:'Соня',st:33,wk:2510,on:'вчера'},
 {n:'dimon_iron',name:'Дима',st:5,wk:1980,on:'15 мин назад'},
 {n:'katya_yoga',name:'Катюша',st:40,wk:1760,on:'в сети'},
 {n:'vlad_squat',name:'Влад',st:2,wk:1220,on:'3 дня назад'},
 {n:'nastya.stretch',name:'Настя',st:12,wk:990,on:'1 ч назад'},
 {n:'egor_cardio',name:'Егор',st:7,wk:860,on:'вчера'},
 {n:'polina_abs',name:'Полина',st:3,wk:540,on:'в сети'}
];
const $=id=>document.getElementById(id);
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v).trim().replace(/^@+/,'').toLowerCase();
let DIRX={}; // модуль Б: пользователи, пришедшие с сервера
const find=n=>DIR.find(u=>u.n===n)||DIRX[n];
const srv=()=>window.dfApi&&window.dfApi.live();
const asU=u=>DIRX[u.login]={n:u.login,name:u.name,st:u.streak||0,wk:u.vip?0:(u.fits||0),on:'на сайте'};
async function refresh(){if(!srv())return;try{const r=await window.dfApi.call('GET','/friends');
 [...r.friends,...r.incoming,...r.outgoing].forEach(asU);
 F={list:r.friends.map(u=>u.login),out:r.outgoing.map(u=>u.login),inc:r.incoming.map(u=>u.login)};draw()}catch(e){msg(e.message)}}
async function act(method,path,data,ok){try{await window.dfApi.call(method,path,data);if(ok)msg(ok,true)}catch(e){msg(e.message)}refresh()}
const hue=t=>{let h=0;for(const c of t)h=(h*31+c.charCodeAt(0))%360;return h};
let F=ld('df-friends',null);
if(!F||!Array.isArray(F.list)){F={list:['artem_pro','liza_fit'],out:[],inc:['sonya.run']};sv('df-friends',F)}
const save=()=>sv('df-friends',F);
const me=()=>{try{return user&&user.login?clean(user.login):'гость'}catch(e){return'гость'}};
const ava=u=>'<span class="fav" style="--h:'+hue(u.n)+'">'+esc((u.name||u.n)[0].toUpperCase())+'</span>';
let confirmDel=null;

function msg(t,ok){const m=$('frMsg');m.textContent=t;m.className='frmsg'+(ok?' ok':'');m.hidden=!t}
function draw(){
 if(!$('friends'))return;
 $('frMe').textContent='@'+me();
 // входящие
 $('frIn').innerHTML=F.inc.map(n=>{const u=find(n);return u?'<li>'+ava(u)+'<div><b>@'+esc(u.n)+'</b><small>'+esc(u.name)+' хочет добавить тебя в друзья</small></div><span class="fra"><button type="button" class="btn" data-act="acc" data-n="'+esc(n)+'">Принять</button><button type="button" class="btn alt" data-act="dec" data-n="'+esc(n)+'">Отклонить</button></span></li>':''}).join('');
 $('frInBox').hidden=!F.inc.length;
 // исходящие
 $('frOut').innerHTML=F.out.map(n=>{const u=find(n);return u?'<li>'+ava(u)+'<div><b>@'+esc(u.n)+'</b><small>Заявка отправлена, ждём ответа…</small></div><button type="button" class="pdel" data-act="cancel" data-n="'+esc(n)+'" aria-label="Отменить заявку">'+ic('close')+'</button></li>':''}).join('');
 $('frOutBox').hidden=!F.out.length;
 // друзья: по фитам за неделю, вместе с тобой
 const L=F.list.map(find).filter(Boolean).sort((a,b)=>b.wk-a.wk);
 $('frCnt').textContent=L.length?L.length+' '+(L.length%10===1&&L.length%100!==11?'друг':[2,3,4].includes(L.length%10)&&![12,13,14].includes(L.length%100)?'друга':'друзей'):'';
 $('frList').innerHTML=L.length?L.map((u,i)=>'<li>'+'<i class="frn">'+(i+1)+'</i>'+ava(u)+'<div><b>@'+esc(u.n)+'</b><small><span class="dot'+(u.on==='в сети'?' on':'')+'"></span>'+esc(u.name)+' · '+esc(u.on)+'</small></div>'
   +'<span class="frst" title="Серия, дней">'+ic('fire')+u.st+'</span><span class="frwk" title="Фиты за неделю">'+u.wk.toLocaleString('ru-RU')+'<small>фитов</small></span>'
   +'<button type="button" class="pdel'+(confirmDel===u.n?' sure':'')+'" data-act="del" data-n="'+esc(u.n)+'" aria-label="Удалить из друзей">'+(confirmDel===u.n?'Точно?':ic('close'))+'</button></li>').join('')
   :'<li class="mut">Пока никого. Впиши ник друга выше — например, <b>max_power</b>.</li>';
}
function add(){const n=clean($('frQ').value);$('frSug').hidden=true;
 if(!n){msg('Впиши ник друга');return}
 if(!/^[a-z0-9._-]+$/.test(n)){msg('Друзей ищут по никнейму — он только латиницей: буквы a–z, цифры, точка, _ или -');return}
 if(n.length<3||n.length>20){msg('Никнейм — от 3 до 20 символов');return}
 if(n===me()){msg('Это твой собственный ник');return}
 if(F.list.includes(n)){msg('@'+n+' уже у тебя в друзьях');return}
 if(F.out.includes(n)){msg('Заявка для @'+n+' уже отправлена');return}
 if(F.inc.includes(n)){F.inc=F.inc.filter(x=>x!==n);F.list.push(n);save();$('frQ').value='';msg('@'+n+' сам звал тебя в друзья — теперь вы друзья!',true);draw();return}
 if(srv()){$('frQ').value='';window.dfApi.call('POST','/friends',{login:n}).then(r=>{msg(r.status==='accepted'?'@'+n+' уже звал тебя — теперь вы друзья!':'Заявка отправлена @'+n+'. Друг увидит её у себя в кабинете',true);refresh()}).catch(e=>msg(e.message));return}
 const u=find(n);if(!u){msg('Пользователь @'+n+' не найден. Проверь ник');return}
 F.out.push(n);save();$('frQ').value='';msg('Заявка отправлена @'+n,true);draw();
 // имитация ответа друга (в модуле Б ответ придёт с сервера)
 setTimeout(()=>{if(!F.out.includes(n))return;F.out=F.out.filter(x=>x!==n);F.list.push(n);save();msg('@'+n+' принял(а) заявку — теперь вы друзья!',true);draw()},3500);
}
function sug(){const q=clean($('frQ').value),s=$('frSug');
 if(q.length<2){s.hidden=true;return}
 if(srv()){window.dfApi.call('GET','/users?q='+encodeURIComponent(q)).then(L=>{L=L.filter(u=>!F.list.includes(u.login)&&u.login!==me()).slice(0,5);L.forEach(asU);
  s.innerHTML=L.map(u=>{const x=DIRX[u.login];return '<button type="button" data-n="'+esc(x.n)+'">'+ava(x)+'<b>@'+esc(x.n)+'</b><small>'+esc(x.name)+(F.out.includes(x.n)?' · заявка отправлена':'')+'</small></button>'}).join('');s.hidden=!L.length}).catch(()=>{});return}
 const L=DIR.filter(u=>u.n.includes(q)&&!F.list.includes(u.n)).slice(0,5); // поиск только по никнейму
 s.innerHTML=L.map(u=>'<button type="button" data-n="'+esc(u.n)+'">'+ava(u)+'<b>@'+esc(u.n)+'</b><small>'+esc(u.name)+(F.out.includes(u.n)?' · заявка отправлена':'')+'</small></button>').join('');
 s.hidden=!L.length}

if($('friends')){
 $('frForm').onsubmit=e=>{e.preventDefault();add()};
 $('frQ').addEventListener('input',()=>{msg('');sug()});
 $('frQ').addEventListener('keydown',e=>{if(e.key==='Escape')$('frSug').hidden=true});
 $('frSug').onclick=e=>{const b=e.target.closest('button');if(!b)return;$('frQ').value=b.dataset.n;add()};
 document.addEventListener('click',e=>{if(!e.target.closest('.frform'))$('frSug').hidden=true});
 $('friends').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const n=b.dataset.n,a=b.dataset.act;
  if(srv()){
   if(a==='acc')return act('POST','/friends/'+encodeURIComponent(n)+'/accept',undefined,'@'+n+' теперь в друзьях');
   if(a==='dec'||a==='cancel')return act('DELETE','/friends/'+encodeURIComponent(n),undefined,a==='cancel'?'Заявка отменена':'');
   if(a==='del'){if(confirmDel!==n){confirmDel=n;draw();setTimeout(()=>{if(confirmDel===n){confirmDel=null;draw()}},3000);return}
    confirmDel=null;return act('DELETE','/friends/'+encodeURIComponent(n),undefined,'@'+n+' удалён(а) из друзей')}}
  if(a==='acc'){F.inc=F.inc.filter(x=>x!==n);F.list.push(n);msg('@'+n+' теперь в друзьях',true)}
  if(a==='dec'){F.inc=F.inc.filter(x=>x!==n);msg('')}
  if(a==='cancel'){F.out=F.out.filter(x=>x!==n);msg('Заявка для @'+n+' отменена',true)}
  if(a==='del'){if(confirmDel!==n){confirmDel=n;draw();setTimeout(()=>{if(confirmDel===n){confirmDel=null;draw()}},3000);return}
   F.list=F.list.filter(x=>x!==n);confirmDel=null;msg('@'+n+' удалён(а) из друзей',true)}
  save();draw()});
 $('frCopy').onclick=()=>{const t='@'+me(),b=$('frCopy');const done=()=>{b.textContent='Скопировано';setTimeout(()=>b.textContent='Копировать',1500)};
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,done);else done()};
 draw();
 const _go=window.go;window.go=function(id){_go(id);if(id==='cabinet'){draw();refresh()}};
 addEventListener('dfapi-user',refresh);
}
})();
