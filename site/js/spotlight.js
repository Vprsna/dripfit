/* spotlight.js — плавно двигает тёмное пятно (#spot) за курсором. Работает на всех под-сайтах; цвет задаёт css/spotlight.css через --acc. */
(()=>{
const sp=document.getElementById('spot');if(!sp)return;
let tx=innerWidth/2,ty=innerHeight*.35,x=tx,y=ty,run=false;
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
function tick(){x+=(tx-x)*.16;y+=(ty-y)*.16;
  sp.style.setProperty('--mx',x.toFixed(1)+'px');sp.style.setProperty('--my',y.toFixed(1)+'px');
  if(Math.abs(tx-x)+Math.abs(ty-y)>.5)requestAnimationFrame(tick);else run=false}
addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;if(calm){x=tx;y=ty}if(!run){run=true;requestAnimationFrame(tick)}},{passive:true});
tick();
})();
