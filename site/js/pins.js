/* pins.js — единый стиль табличек на всех вкладках (кроме главной, у неё свой):
   «листочек» с гвоздиком сверху, оборванным низом и лёгким покачиванием при наведении (класс .pin).
   Цвет гвоздика — третий цвет палитры вкладки (переменная --pin в shell.css). */
(()=>{
const SKIP='.wk,.vc,.rx,.wot,.vlt';
function pinify(root){(root||document).querySelectorAll('section.page:not(#main) .card, #music .glass').forEach(c=>{
  if(c.classList.contains('pin')||c.matches(SKIP))return;
  const up=c.parentElement&&c.parentElement.closest('.card,.glass,.pin');if(up)return; // вложенные не трогаем
  c.classList.add('pin');if(c.parentElement&&c.parentElement.matches('section.page'))c.classList.add('wide')})}
pinify();
const _go=window.go;window.go=function(id){_go(id);pinify()};
new MutationObserver(()=>pinify()).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
})();
