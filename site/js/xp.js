/* xp.js — опыт и уровни.
   Опыт = все заработанные фиты (покупки опыт не отнимают). Чтобы перейти с уровня L на L+1, нужно 100 × L опыта.
   Всего до уровня L: 50 × L × (L − 1). Ранги: Новичок 1–9, Любитель 10–19, Атлет 20–29, Мастер 30–49, Чемпион 50–74, Легенда 75+.
   За новый уровень — бонус: уровень × 10 фитов. Пока хранится в браузере, в модуле Б — в аккаунте. */
(()=>{
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const RANKS=[[75,'Легенда'],[50,'Чемпион'],[30,'Мастер'],[20,'Атлет'],[10,'Любитель'],[1,'Новичок']];
const total=L=>50*L*(L-1);                       // опыта нужно, чтобы стоять на уровне L
const levelOf=xp=>{let L=Math.floor((1+Math.sqrt(1+xp/12.5))/2);while(total(L+1)<=xp)L++;while(L>1&&total(L)>xp)L--;return Math.max(1,L)};
const rankOf=L=>RANKS.find(r=>L>=r[0])[1];
window.dfLevel={levelOf,rankOf,total};
let who=null,xp=0,last=null,lvl=1;
const cur=()=>{try{return user}catch(e){return null}};
const key=u=>'df-xp-'+u.login;
function show(){const u=cur();if(!u)return;
 const prof=document.querySelector('.prof .bar i'),t=document.getElementById('xpTxt'),n=document.getElementById('uname');
 if(u.vip){u.rank='Легенда, ур. 99';if(n)n.textContent=u.name+' · '+u.rank;if(t)t.textContent='∞ опыта';if(prof)prof.style.width='100%';return}
 const L=levelOf(xp),have=xp-total(L),need=100*L;
 u.rank=rankOf(L)+', ур. '+L;if(n)n.textContent=u.name+' · '+u.rank;
 if(prof)prof.style.width=Math.min(100,have/need*100).toFixed(1)+'%';
 if(t)t.textContent=have.toLocaleString('ru-RU')+' / '+need.toLocaleString('ru-RU')+' опыта до ур. '+(L+1)+' · всего '+xp.toLocaleString('ru-RU');
}
function toast(msg){let el=document.getElementById('lvlToast');
 if(!el){el=document.createElement('div');el.id='lvlToast';el.className='lvltoast';el.setAttribute('role','status');document.body.appendChild(el)}
 el.innerHTML=msg;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),3800)}
function tick(){const u=cur();
 if(!u||u.vip){who=u&&u.login;last=null;if(u&&u.vip)show();return}
 if(who!==u.login){who=u.login;xp=ld(key(u),0);lvl=levelOf(xp);last=fits;show();return} // новый вход: стартуем от текущего баланса
 if(typeof fits!=='number'||!isFinite(fits)){last=fits;return}
 if(last!==null&&fits>last){xp+=fits-last;sv(key(u),xp);
  const L=levelOf(xp);
  if(L>lvl){const bonus=L*10;lvl=L;fits+=bonus;if(typeof showFits==='function')showFits();
   toast('<b>Уровень '+L+'!</b> '+rankOf(L)+' · +'+bonus+' фитов');xp+=bonus;sv(key(u),xp);lvl=levelOf(xp)}
  show()}
 last=fits}
setInterval(tick,250);
/* таблица уровней на странице «Награды» */
const rl=document.getElementById('rl');
if(rl){const rows=[1,2,3,5,10,20,30,50,75,99].map(L=>'<tr><td>'+L+'</td><td>'+rankOf(L)+'</td><td>'+(L>1?(100*(L-1)).toLocaleString('ru-RU'):'—')+'</td><td class="fv">'+total(L).toLocaleString('ru-RU')+'</td></tr>').join('');
 rl.insertAdjacentHTML('beforeend','<div class="card"><h2>Опыт и уровни</h2><p class="mut">Опыт — это все заработанные фиты; покупки его не отнимают. Чем выше уровень, тем больше опыта нужно до следующего: 100 × уровень. За каждый новый уровень — бонус: уровень × 10 фитов.</p><div class="tw"><table class="tbl"><tr><th>Уровень</th><th>Ранг</th><th>Опыта на прошлый шаг</th><th>Всего опыта</th></tr>'+rows+'</table></div></div>')}
const _go=window.go;window.go=function(id){_go(id);if(id==='cabinet'){tick();show()}};
})();
