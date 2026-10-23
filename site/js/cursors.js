/* cursors.js — неоновые курсоры в цвете текущего под-сайта (контур = --acc, заливка = --bg).
   Правило проекта: любой новый под-сайт получает курсоры автоматически — достаточно задать --acc и --bg в themes.css. */
(()=>{
const body=document.body;
const P={ // [svg-содержимое, hotspot x, y]; closed=true — рисуется с заливкой
  def:['<path d="M7 3v22l5-5 4 8 3.5-1.7-4-8H22z" fill="F"/>',7,3],
  ptr:['<path d="M13 4.5a2 2 0 0 1 4 0V13h1v-1.5a2 2 0 0 1 4 0V13h1a2 2 0 0 1 4 0v8c0 4-3 7-7 7h-3c-3 0-4.5-1.5-6-4l-4-6.5a2 2 0 0 1 3.2-2.3L13 17z" fill="F"/>',14,4],
  txt:['<path d="M11 4h10M16 4v24M11 28h10" fill="none"/>',16,16],
  wait:['<path d="M9 4h14M9 28h14M10 4c0 8 6 9 6 12s-6 4-6 12M22 4c0 8-6 9-6 12s6 4 6 12" fill="F"/>',16,16],
  help:['<path d="M6 3v20l4.5-4.5 3.5 7 3-1.5-3.5-6.5H19z" fill="F"/><path d="M22 6a3.5 3.5 0 1 1 3.5 4.5V13M25.5 17v.5" fill="none"/>',6,3],
  cross:['<path d="M16 3v10M16 19v10M3 16h10M19 16h10" fill="none"/>',16,16],
  ew:['<path d="M3 16h26M3 16l6-5.5M3 16l6 5.5M29 16l-6-5.5M29 16l-6 5.5" fill="none"/>',16,16],
  ns:['<path d="M16 3v26M16 3l-5.5 6M16 3l5.5 6M16 29l-5.5-6M16 29l5.5-6" fill="none"/>',16,16],
  nwse:['<g transform="rotate(45 16 16)"><path d="M3 16h26M3 16l6-5.5M3 16l6 5.5M29 16l-6-5.5M29 16l-6 5.5" fill="none"/></g>',16,16],
  nesw:['<g transform="rotate(-45 16 16)"><path d="M3 16h26M3 16l6-5.5M3 16l6 5.5M29 16l-6-5.5M29 16l-6 5.5" fill="none"/></g>',16,16],
  no:['<circle cx="16" cy="16" r="11" fill="none"/><path d="M8.5 23.5l15-15" fill="none"/>',16,16]
};
const css={def:'auto',ptr:'pointer',txt:'text',wait:'wait',help:'help',cross:'crosshair',ew:'ew-resize',ns:'ns-resize',nwse:'nwse-resize',nesw:'nesw-resize',no:'not-allowed'};
function build(){
  const cs=getComputedStyle(body),acc=cs.getPropertyValue('--acc').trim()||'#d32d2d',bg=cs.getPropertyValue('--bg').trim()||'#000';
  for(const k in P){
    const [d,x,y]=P[k];
    const inner=d.replace(/fill="F"/g,'fill="'+bg+'"');
    // тонкая тёмная подложка под неон, чтобы курсор читался на любом фоне
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" stroke-linecap="round" stroke-linejoin="round">'
      +'<g stroke="#000" stroke-opacity=".45" stroke-width="4.6" transform="translate(.4 .6)">'+inner.replace(/fill="[^"]*"/g,'fill="none"')+'</g>'
      +'<g stroke="'+acc+'" stroke-width="2.2">'+inner+'</g></svg>';
    body.style.setProperty('--c-'+k,'url("data:image/svg+xml,'+encodeURIComponent(svg)+'") '+x+' '+y+', '+css[k]);
  }
}
const upd=()=>requestAnimationFrame(build);
new MutationObserver(upd).observe(body,{attributes:true,attributeFilter:['data-theme','data-ptheme']});
upd();
window.__cursorSheet=build;
})();
