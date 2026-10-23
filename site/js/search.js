/* search.js — поиск на YouTube (вкладка «Упражнения») и поиск музыки (вкладка «Музыка»).
   С сервером (модуль Б, js/api.js): результаты приходят прямо на сайт —
     /api/youtube/search (YouTube Data API) и /api/music/search (iTunes Search API + ссылка на Яндекс Музыку).
   Без сервера (опубликованный макет): открывается поиск на самом YouTube / в Яндекс Музыке в новой вкладке. */
(()=>{
const $=id=>document.getElementById(id);
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=()=>window.dfApi&&window.dfApi.on;
const open=u=>{const a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove()};
/* ---------- YouTube ---------- */
if($('ytGo'))$('ytGo').onclick=async()=>{const q=($('vq').value||'').trim()||'упражнения тренировка';
 const url='https://www.youtube.com/results?search_query='+encodeURIComponent(q);
 if(!api()){open(url);$('ytNote').textContent='Открыли поиск YouTube в новой вкладке. На сервере (модуль Б) результаты будут прямо здесь.';return}
 $('ytNote').textContent='Ищем на YouTube…';$('ytRes').innerHTML='';
 try{const r=await window.dfApi.call('GET','/youtube/search?q='+encodeURIComponent(q));
  $('ytNote').innerHTML=r.note?esc(r.note)+' <a href="'+esc(r.search_url)+'" target="_blank" rel="noopener noreferrer">Открыть поиск на YouTube ↗</a>':'Результаты YouTube по запросу «'+esc(q)+'»';
  $('ytRes').innerHTML=r.items.length?r.items.map(v=>'<a class="ytc" href="'+esc(v.url)+'" target="_blank" rel="noopener noreferrer"><img src="'+esc(v.thumb)+'" alt="" loading="lazy"><b>'+esc(v.title)+'</b><small>'+esc(v.channel||'Библиотека Drip Fit')+'</small></a>').join(''):'<p class="mut">Ничего не нашлось.</p>'}
 catch(e){$('ytNote').textContent='Не получилось: '+e.message}};
/* ---------- музыка ---------- */
const au=new Audio();let playing=null;
if($('mForm'))$('mForm').onsubmit=async e=>{e.preventDefault();const q=$('mQ').value.trim();if(!q){$('mQ').focus();return}
 const ya='https://music.yandex.ru/search?text='+encodeURIComponent(q);
 if(!api()){open(ya);$('mNote').textContent='Открыли поиск Яндекс Музыки в новой вкладке. На сервере (модуль Б) результаты будут прямо здесь.';return}
 $('mNote').textContent='Ищем…';$('mRes').innerHTML='';
 try{const r=await window.dfApi.call('GET','/music/search?q='+encodeURIComponent(q));
  $('mNote').innerHTML=(r.note?esc(r.note)+' ':'Отрывки по 30 секунд. Полные треки — ')+'<a href="'+esc(r.yandex_search)+'" target="_blank" rel="noopener noreferrer">в Яндекс Музыке ↗</a>';
  $('mRes').innerHTML=r.items.map((t,i)=>'<div class="mrow"><img src="'+esc(t.cover)+'" alt="" loading="lazy"><div><b>'+esc(t.title)+'</b><small>'+esc(t.artist)+(t.album?' · '+esc(t.album):'')+'</small></div>'
   +'<button type="button" class="mplay" data-i="'+i+'" data-src="'+esc(t.preview)+'" aria-label="Слушать отрывок">'+(typeof ic==='function'?ic('play'):'▶')+'</button><a class="mya" href="'+esc(t.yandex)+'" target="_blank" rel="noopener noreferrer" title="Найти в Яндекс Музыке">ЯМ ↗</a></div>').join('')}
 catch(err){$('mNote').textContent='Не получилось: '+err.message}};
if($('mRes'))$('mRes').onclick=e=>{const b=e.target.closest('.mplay');if(!b)return;
 if(playing===b){au.pause();playing=null;b.innerHTML=ic('play');return}
 if(playing)playing.innerHTML=ic('play');au.src=b.dataset.src;au.play().catch(()=>{});playing=b;b.innerHTML=ic('pause')};
au.onended=()=>{if(playing)playing.innerHTML=ic('play');playing=null};
})();
