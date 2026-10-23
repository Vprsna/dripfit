/* home.js — фиты за тренировку: ОДИН раз в день, где бы её ни отметили
   (карточка «Твой день» на главной, «Сегодня» на «Спорте» или «Мои тренировки» в кабинете).
   Дата последней оплаты — в localStorage (df-train-paid). В модуле Б проверка будет на сервере. */
(()=>{
const KEY='df-train-paid';
const dk=()=>{const z=new Date();z.setMinutes(z.getMinutes()-z.getTimezoneOffset());return z.toISOString().slice(0,10)};
const paid=()=>{try{return localStorage.getItem(KEY)===dk()}catch(e){return false}};
let paidMem=false;
function sync(){const on=paid()||paidMem,b=document.getElementById('dayBtn'),t=document.getElementById('todayBtn'),d=document.getElementById('dayDone');
 if(b){b.disabled=on;b.textContent=on?'Выполнено сегодня':'Отметить тренировку +50'}
 if(d)d.textContent=on?'1 из 1':'0 из 1';
 if(t){t.disabled=on;t.textContent=on?'Тренировка сегодня отмечена':'Отметить тренировку +50 фитов'}
 document.dispatchEvent(new CustomEvent('df-train-paid'))}
/* вернёт true, если фиты начислены сейчас; false — если сегодня уже получены */
window.dfTrainPaid=()=>paid()||paidMem;
window.dfTrainPay=()=>{if(window.dfTrainPaid())return false;
 paidMem=true;try{localStorage.setItem(KEY,dk())}catch(e){}
 try{if(typeof fits==='number'&&isFinite(fits)){fits+=50;if(typeof showFits==='function')showFits()}}catch(e){}
 if(typeof coins==='function')try{coins()}catch(e){}
 sync();return true};
const b=document.getElementById('dayBtn');if(b)b.onclick=()=>window.dfTrainPay();
sync();
})();
