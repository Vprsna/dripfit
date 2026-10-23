/* icons.js — SVG-иконки вместо эмодзи. Использование: в JS ic('bolt'), в HTML <svg class="ic ic-bolt"><use href="#i-bolt"/></svg>.
   Цвет по умолчанию = цвет текста (currentColor), размер = размер шрифта. Новые иконки добавляй в объект I. */
(()=>{
const O='fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const F='fill="currentColor" stroke="none"';
const I={
 bolt:[F,'<path d="M13.5 2 4.5 13.5H11L9.5 22l9-11.5H12.5z"/>'],
 fire:[F,'<path d="M12 2c.8 3.6 5.200 5.400 5.200 10.500A5.200 5.200 0 0 1 6.800 12.500c0-2 1-3.500 2.200-4.600.1 1.800.9 2.800 1.800 3C10.200 8 10.600 4.600 12 2z"/>'],
 menu:[O,'<path d="M4 6h16M4 12h16M4 18h16"/>'],
 expand:[O,'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'],
 shrink:[O,'<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'],
 camera:[O,'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'],
 cup:[O,'<path d="M6 4h12l-1.500 16h-9z"/><path d="M6.800 10h10.400"/>'],
 stretch:[O,'<circle cx="12" cy="4.500" r="2"/><path d="M4 9.500l8 1.500 8-1.500M12 11v4l-4 6M12 15l4 6"/>'],
 check:[O,'<path d="M4.500 12.500l5 5 10-11"/>'],
 lock:[O,'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'],
 trophy:[O,'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9.500 18h5"/>'],
 close:[O,'<path d="M5 5l14 14M19 5 5 19"/>'],
 back:[O,'<path d="M19 12H5M11 6l-6 6 6 6"/>'],
 note:[O,'<path d="M9 18V5l11-2v13"/><circle cx="6.500" cy="18" r="2.500"/><circle cx="17.500" cy="16" r="2.500"/>'],
 volume:[O,'<path d="M4 9.500v5h3.500L13 19V5L7.500 9.500zM16.500 8.500a5 5 0 0 1 0 7"/>'],
 mute:[O,'<path d="M4 9.500v5h3.500L13 19V5L7.500 9.500zM17 9l5 6M22 9l-5 6"/>'],
 shuffle:[O,'<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'],
 repeat:[O,'<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>'],
 prev:[F,'<path d="M19 5v14L8 12zM4.500 5h2.500v14H4.500z"/>'],
 next:[F,'<path d="M5 5v14l11-7zM17 5h2.500v14H17z"/>'],
 play:[F,'<path d="M7 4v16l13-8z"/>'],
 pause:[F,'<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'],
 heart:[O,'<path d="M12 20.500s-8-5-8-10.500A4.500 4.500 0 0 1 12 7.500 4.500 4.500 0 0 1 20 10c0 5.500-8 10.500-8 10.500z"/>'],
 heartfill:[F,'<path d="M12 20.500s-8-5-8-10.500A4.500 4.500 0 0 1 12 7.500 4.500 4.500 0 0 1 20 10c0 5.500-8 10.500-8 10.500z"/>'],
 search:[O,'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'],
 trash:[O,'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'],
 eye:[O,'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'],
 smile:[O,'<circle cx="12" cy="12" r="9"/><path d="M8.500 14s1.300 2 3.500 2 3.500-2 3.500-2"/><path d="M9 9.500h.01M15 9.500h.01" stroke-width="3"/>'],
 crown:[F,'<path d="M3 18.500h18l1.200-11-5.200 4.200L12 4.500 7 11.700 1.800 7.500z"/><path d="M3 20h18v1.500H3z"/>'],
 snow:[O,'<path d="M12 2v20M3.300 7 20.700 17M3.300 17 20.700 7M9.500 4 12 6.500 14.500 4M9.500 20 12 17.500 14.500 20"/>'],
 party:[O,'<path d="M4 20 8.500 7 17 15.500z"/><path d="M13 4v2M19 6l-1.500 1.500M20 12h-2M15.500 9.500l3-3"/>'],
 spark:[F,'<path d="M12 2.500 14.300 9.700 21.500 12 14.300 14.300 12 21.500 9.700 14.300 2.500 12 9.700 9.700z"/>'],
 quasar:[O,'<circle cx="12" cy="12" r="3"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>'],
 phones:[O,'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><path d="M4 15h3v5H4zM17 15h3v5h-3z"/>'],
 dumbbell:[O,'<path d="M6 7v10M3 9.500v5M18 7v10M21 9.500v5M6 12h12"/>'],
 sunrise:[O,'<path d="M3 19h18M7 19a5 5 0 0 1 10 0M12 4v4M4.500 9.500 6.500 11.500M19.500 9.500 17.500 11.500"/>']
};
window.ic=(n,c)=>'<svg class="ic ic-'+n+(c?' '+c:'')+'" aria-hidden="true"><use href="#i-'+n+'"/></svg>';
const sp='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+Object.entries(I).map(([k,[a,b]])=>'<symbol id="i-'+k+'" viewBox="0 0 24 24" '+a+'>'+b+'</symbol>').join('')+'</defs></svg>';
document.body.insertAdjacentHTML('afterbegin',sp);
})();
