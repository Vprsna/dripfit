/* api.js — связь сайта с сервером модуля Б (server/app.py).
   Если сайт открыт с сервера (http://localhost:8000), включается:
   • настоящая регистрация и вход (пароли на сервере хешем, токен сессии в localStorage df-token);
   • сохранение данных в базе: всё, что сайт пишет в ключи df-*, отправляется на сервер (PUT /api/sync/<ключ>),
     а при входе загружается обратно — данные доступны с любого устройства;
   • баланс фитов, профиль, аватар и серия — в аккаунте;
   • рейтинг и друзья — по настоящим пользователям (rank.js, friends.js), поиск YouTube и музыки (search.js).
   Без сервера (опубликованный макет) файл ничего не меняет — сайт работает на localStorage, как раньше. */
(()=>{
const SYNC=['df-log','df-workouts','df-plans','df-plan-done','df-food','df-water','df-water-bonus','df-ach','df-ach-seen','df-charts','df-charts-per',
 'df-charts-mode','df-vfav','df-level','df-gen','df-train-paid','df-rank','df-dyn','df-dyn-per','df-int','df-shop','df-study','df-home','df-money'];
const RAWKEYS=['df-train-paid']; // хранятся строкой, не JSON
const isSync=k=>SYNC.includes(k)||/^df-xp-/.test(k);
const origSet=Storage.prototype.setItem,origGet=Storage.prototype.getItem,origDel=Storage.prototype.removeItem;
const raw={get:k=>{try{return origGet.call(localStorage,k)}catch(e){return null}},set:(k,v)=>{try{origSet.call(localStorage,k,v)}catch(e){}},del:k=>{try{origDel.call(localStorage,k)}catch(e){}}};
const A={on:false,token:raw.get('df-token'),user:null};

async function call(method,path,data){
 const r=await fetch('/api'+path,{method,headers:Object.assign({'Content-Type':'application/json'},A.token?{Authorization:'Bearer '+A.token}:{}),body:data===undefined?undefined:JSON.stringify(data)});
 const j=await r.json().catch(()=>({}));
 if(r.status===401&&A.token&&!/^\/auth\//.test(path)){A.token=null;A.user=null;raw.del('df-token')}
 if(!r.ok)throw Object.assign(new Error(j.error||('Ошибка сервера '+r.status)),{status:r.status});
 return j}

/* ---------- изменения в localStorage → сервер ---------- */
const pending={};let timer=null;
const parse=v=>{try{return JSON.parse(v)}catch(e){return v}};
function flush(){Object.keys(pending).forEach(k=>{const v=pending[k];delete pending[k];call('PUT','/sync/'+encodeURIComponent(k),parse(v)).catch(()=>{})})}
Storage.prototype.setItem=function(k,v){origSet.call(this,k,v);
 if(this===localStorage&&A.on&&A.user&&isSync(k)){pending[k]=String(v);clearTimeout(timer);timer=setTimeout(flush,700)}};
addEventListener('beforeunload',()=>{if(Object.keys(pending).length)flush()});

/* ---------- данные аккаунта ↔ браузер ---------- */
async function pull(){const all=await call('GET','/sync');
 SYNC.forEach(k=>raw.del(k));Object.keys(localStorage).filter(k=>/^df-xp-/.test(k)).forEach(raw.del);
 Object.entries(all).forEach(([k,v])=>raw.set(k,typeof v==='string'&&RAWKEYS.includes(k)?v:JSON.stringify(v)))}
async function pushAll(){for(const k of Object.keys(localStorage).filter(isSync)){await call('PUT','/sync/'+encodeURIComponent(k),parse(raw.get(k))).catch(()=>{})}}

/* ---------- вход / выход в интерфейсе ---------- */
let lastFits=null;
function applyUser(u){A.user=u;
 try{pendingGo=document.querySelector('.page.on')&&document.querySelector('.page.on').id!=='auth'?document.querySelector('.page.on').id:'cabinet'}catch(e){}
 if(typeof enter==='function')enter({login:u.login,name:u.name,vip:u.vip,avatar:u.avatar||null});
 try{if(!u.vip){fits=u.fits;lastFits=u.fits}if(typeof showFits==='function')showFits()}catch(e){}
 const set=(id,v)=>{const el=document.getElementById(id);if(el&&v!=null)el.value=v};set('pfH',u.height);set('pfW',u.weight);set('pfG',u.goal);
 document.documentElement.classList.add('api-user')}

function hookUI(){
 const f=document.getElementById('afrm');
 if(f)f.onsubmit=async e=>{e.preventDefault();
  const reg=f.dataset.mode==='up',$=id=>document.getElementById(id);
  const lg=$('fLogin').value.trim(),mail=$('fMail').value.trim(),pw=$('fPass').value,pw2=$('fPass2').value,disp=$('fDisp').value.trim();
  ['eLogin','eMail','ePass','ePass2','aMsg','eDisp'].forEach(id=>{const x=$(id);if(x)x.textContent=''});
  if(!lg){$('eLogin').textContent=reg?'Придумай никнейм':'Введи никнейм или почту';return}
  if(!pw){$('ePass').textContent='Введи пароль';return}
  if(reg&&pw2!==pw){$('ePass2').textContent='Пароли не совпадают';return}
  const btn=$('aSub');if(btn)btn.disabled=true;
  try{const r=await call('POST',reg?'/auth/register':'/auth/login',reg?{login:lg,email:mail,password:pw,name:disp}:{login:lg,password:pw});
   A.token=r.token;raw.set('df-token',r.token);A.user=r.user;
   if(reg)await pushAll(); // новый аккаунт забирает то, что гость уже успел записать
   else await pull();
   location.reload()}
  catch(err){const m=err.message||'';
   if(/никнейм/i.test(m)&&reg)$('eLogin').textContent=m;else if(/почт/i.test(m)&&reg)$('eMail').textContent=m;else if(/пароль/i.test(m)&&reg)$('ePass').textContent=m;else $('aMsg').textContent=m}
  finally{if(btn)btn.disabled=false}};
 const out=document.getElementById('hOut');
 if(out)out.onclick=async()=>{flush();try{await call('POST','/auth/logout')}catch(e){}
  raw.del('df-token');SYNC.forEach(k=>raw.del(k));location.reload()};
 const save=document.getElementById('pfSave');
 if(save)save.addEventListener('click',()=>{if(!A.user)return;const $=id=>document.getElementById(id);
  call('PUT','/me',{name:$('pfName').value.trim(),height:$('pfH').value||null,weight:$('pfW').value||null,goal:$('pfG').value}).then(u=>{A.user=u}).catch(e=>{const m=$('pfMsg');if(m)m.textContent=e.message})});
 // аватар: setAvatar объявлена в основном скрипте
 if(typeof setAvatar==='function'){const _s=setAvatar;window.setAvatar=setAvatar=function(src){_s(src);if(A.user&&src!==A.user.avatar){A.user.avatar=src;call('PUT','/me',{avatar:src}).catch(()=>{})}}}
 // фиты за тренировку: сервер тоже ведёт серию дней
 if(window.dfTrainPay){const _p=window.dfTrainPay;window.dfTrainPay=()=>{const ok=_p();if(ok&&A.user)call('POST','/fits/daily').catch(()=>{});return ok}}
 // баланс фитов (магазин, достижения, бонусы) — раз в 3 секунды, если изменился
 setInterval(()=>{try{if(A.user&&!A.user.vip&&typeof fits==='number'&&isFinite(fits)&&fits!==lastFits){lastFits=fits;call('PUT','/me',{fits})}}catch(e){}},3000);
}

const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();
window.dfApi={get on(){return A.on},get user(){return A.user},live:()=>A.on&&!!A.user,call};
fetch('/api/health',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(h=>{if(!h||!h.ok)return;A.on=true;
 ready(()=>{hookUI();document.documentElement.classList.add('api-on');
  call('GET','/shop/music').then(r=>{try{const x=ITEMS.find(i=>i.id==='lofi');if(x&&r.lofi&&r.lofi.embed){x.src=r.lofi.embed;x.yt=r.lofi.url;apply()}}catch(e){}}).catch(()=>{});
  if(A.token)call('GET','/me').then(u=>{applyUser(u);dispatchEvent(new Event('dfapi-user'))}).catch(()=>{});
  dispatchEvent(new Event('dfapi'))})}).catch(()=>{});
})();
