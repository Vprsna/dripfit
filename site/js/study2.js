/* study2.js — «Учёба», часть 2: расписание (из Excel по классу или вручную), оценки, карточки для запоминания,
   время по предметам. Данные — в том же df-study (через window.dfStudy из study.js). */
(()=>{
const $=id=>document.getElementById(id);
const D=window.dfStudy;if(!D||!$('stSched'))return;
const S=()=>D.S,save=()=>D.save(),esc=D.esc,today=D.today,addD=D.addD;
const icn=n=>typeof ic==='function'?ic(n):'';
const DAYS=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],SH=['Пн','Вт','Ср','Чт','Пт','Сб'];
const DEF_SUBJ=['Математика','Русский язык','Литература','Английский','Физика','Химия','Биология','История','География','Информатика','Физкультура'];
const st=S();st.sched=st.sched||{cl:'',days:[[],[],[],[],[],[]]};st.grades=st.grades||[];st.cards=st.cards||[];st.gpaid=st.gpaid||{};st.reviews=st.reviews||0;
const wd=()=>(new Date().getDay()+6)%7; // 0 = понедельник, 6 = воскресенье

/* ================= разбор Excel ================= */
const LAT={A:'А',B:'В',E:'Е',K:'К',M:'М',H:'Н',O:'О',P:'Р',C:'С',T:'Т',X:'Х',Y:'У'};
const clKey=v=>String(v??'').toUpperCase().replace(/КЛАСС|КЛ\.?/g,'').replace(/[\s\-"«»().]/g,'').replace(/[ABEKMHOPCTXY]/g,c=>LAT[c]);
const isCl=v=>/^\d{1,2}[А-ЯЁ]{1,2}$/.test(clKey(v))&&String(v).length<=12;
const DRE=[/^(пон|пн\b)/i,/^(вто|вт\b)/i,/^(сре|ср\b)/i,/^(чет|чт\b)/i,/^(пят|пт\b)/i,/^(суб|сб\b)/i];
const dayOf=v=>{const s=String(v??'').trim().toLowerCase();if(s.length>14)return -1;return DRE.findIndex(r=>r.test(s))};
const isNum=v=>/^\s*\d{1,2}\s*\.?\s*(урок)?\s*$/i.test(String(v??''));
const roomHdr=v=>/каб|ауд|room/i.test(String(v??''));
/* время уроков: «8:30-9:15», «8.30–9.15», «с 8:30 до 9:15» или числа Excel (доля суток) в одном/двух столбцах */
const TRE=/(\d{1,2})[:.](\d{2})\s*(?:[-–—]|до)\s*(\d{1,2})[:.](\d{2})/;
const hh=(h,m)=>String(+h).padStart(2,'0')+':'+m;
const frac=v=>{const x=parseFloat(String(v).replace(',','.'));if(!(x>0&&x<1)||!/^\s*0?[.,]\d+\s*$/.test(String(v)))return null;const t=Math.round(x*1440);return hh(Math.floor(t/60),String(t%60).padStart(2,'0'))};
const isTimeCell=v=>TRE.test(String(v??''))||frac(v)!=null||/^\s*\d{1,2}[:.]\d{2}\s*$/.test(String(v??''));
const single=v=>{if(frac(v))return frac(v);const m=String(v??'').match(/^\s*(\d{1,2})[:.](\d{2})\s*$/);return m?hh(m[1],m[2]):null};
function timeOf(row,tcols,subj){for(const c of tcols){const m=String(row[c]??'').match(TRE);if(m)return{a:hh(m[1],m[2]),b:hh(m[3],m[4])}}
 if(tcols.length>=2){const a=single(row[tcols[0]]),b=single(row[tcols[1]]);if(a&&b)return{a,b}}
 if(tcols.length===1){const a=single(row[tcols[0]]);if(a)return{a,b:''}}
 const m=String(subj??'').match(TRE);return m?{a:hh(m[1],m[2]),b:hh(m[3],m[4])}:{a:'',b:''}}
const stripTime=s=>String(s).replace(TRE,'').replace(/\s{2,}/g,' ').replace(/^[\s,–-]+|[\s,–-]+$/g,'');
function timeCols(rows,from,skip){const c1=bestCol(rows,from,v=>TRE.test(String(v??'')),skip);if(c1>=0)return[c1];
 const cnt={};rows.slice(from).forEach(r=>(r||[]).forEach((v,c)=>{if(!skip.includes(c)&&single(v))cnt[c]=(cnt[c]||0)+1}));
 return Object.keys(cnt).filter(c=>cnt[c]>=2).map(Number).sort((a,b)=>a-b).slice(0,2)}
function bestCol(rows,from,test,skip=[]){const cnt={};rows.slice(from).forEach(r=>(r||[]).forEach((v,c)=>{if(!skip.includes(c)&&test(v))cnt[c]=(cnt[c]||0)+1}));
 let best=-1,m=0;for(const c in cnt)if(cnt[c]>m){m=cnt[c];best=+c}return m>=2?best:-1}
function emptyWeek(){return [[],[],[],[],[],[]]}
/* формат 1: классы — столбцы в одной строке-шапке, дни — столбец слева (часто объединён) или строки-разделители */
function byColumn(rows,r,c){const days=emptyWeek();const dayCol=bestCol(rows,r+1,v=>dayOf(v)>=0,[c]);const numCol=bestCol(rows,r+1,isNum,[c,dayCol]);
 const roomCol=roomHdr((rows[r]||[])[c+1])?c+1:-1;const tcols=timeCols(rows,r+1,[c,dayCol,numCol,roomCol]);let cur=-1,count=0;
 for(let i=r+1;i<rows.length;i++){const row=rows[i]||[];
  let d=dayCol>=0?dayOf(row[dayCol]):-1;
  if(d<0){const only=row.filter(x=>x!=null&&x!=='');if(only.length===1&&dayOf(only[0])>=0)d=dayOf(only[0]);if(d>=0&&only.length===1){if(d!==cur){cur=d;count=0}continue}}
  if(d>=0&&d!==cur){cur=d;count=0}
  if(row.some(isCl)&&i>r+1&&!row.some(v=>dayOf(v)>=0))break; // начинается таблица следующей смены
  if(cur<0)continue;
  const s=row[c];count++;const n=numCol>=0&&isNum(row[numCol])?parseInt(row[numCol]):count;
  if(s&&!isCl(s)&&dayOf(s)<0&&!isTimeCell(s)&&stripTime(s))days[cur].push(Object.assign({n,s:stripTime(s),room:roomCol>=0&&row[roomCol]?String(row[roomCol]):''},timeOf(row,tcols,s)))}
 return days}
/* формат 2: отдельный лист на класс — дни столбцом/строками-разделителями, предмет в первом «текстовом» столбце */
function bySheet(rows){const days=emptyWeek();
 const hdr=rows.findIndex(r=>(r||[]).filter(v=>dayOf(v)>=0).length>=3);
 if(hdr>=0){(rows[hdr]||[]).forEach((v,c)=>{const d=dayOf(v);if(d<0)return;let n=0;for(let i=hdr+1;i<rows.length;i++){const s=(rows[i]||[])[c];if(s&&!isNum(s)){n++;days[d].push({n,s:String(s),room:''})}}});return days}
 let cur=-1,count=0;const dayCol=bestCol(rows,0,v=>dayOf(v)>=0);const tcols=timeCols(rows,0,[dayCol]);
 for(const row of rows){const r=row||[];const cells=r.map((v,i)=>[v,i]).filter(([v])=>v!=null&&v!=='');
  const dc=cells.find(([v])=>dayOf(v)>=0);if(dc&&(cells.length===1||dc[1]===dayCol)){const d=dayOf(dc[0]);if(d!==cur){cur=d;count=0}if(cells.length===1)continue}
  if(cur<0)continue;const rest=cells.filter(([v,i])=>dayOf(v)<0&&!isNum(v)&&!isTimeCell(v)&&i!==dayCol&&!tcols.includes(i));if(!rest.length)continue;
  const numCell=cells.find(([v])=>isNum(v));count++;
  let s=stripTime(rest[0][0]),room=rest[1]?String(rest[1][0]):'';const rm=s.match(/^(.*?)\s+(?:каб\.?\s*)?(\d{1,4}[а-я]?)$/i);if(!room&&rm){s=rm[1];room=rm[2]}
  days[cur].push(Object.assign({n:numCell&&!isTimeCell(numCell[0])?parseInt(numCell[0]):count,s,room},timeOf(r,tcols,rest[0][0])))}
 return days}
function parse(sheets,cl){const key=clKey(cl),seen=new Set();
 for(const sh of sheets){if(clKey(sh.name)===key){const d=bySheet(sh.rows);if(d.some(x=>x.length))return{days:d}}}
 for(const sh of sheets){for(let r=0;r<sh.rows.length;r++){const row=sh.rows[r]||[];
   for(let c=0;c<row.length;c++){if(isCl(row[c]))seen.add(clKey(row[c]));if(row[c]!=null&&clKey(row[c])===key&&isCl(row[c])){const d=byColumn(sh.rows,r,c);if(d.some(x=>x.length))return{days:d}}}}
  if(isCl(sh.name))seen.add(clKey(sh.name))}
 return{seen:[...seen].slice(0,30)}}

/* ================= расписание: вывод и правка ================= */
let day=Math.min(wd(),5),editing=false;
function subjects(){const s=new Set();S().sched.days.flat().forEach(x=>x.s&&s.add(x.s.replace(/\s*\(.*\)$/,'')));S().tasks.forEach(t=>t.s&&s.add(t.s));S().grades.forEach(g=>s.add(g.s));
 return s.size?[...s].sort():DEF_SUBJ}
const mins=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);return m?+m[1]*60+ +m[2]:null};
function lessonLine(x){return (x.a?'<span class="schtm">'+esc(x.a)+(x.b?'–'+esc(x.b):'')+'</span>':'')+'<b>'+esc(x.s)+'</b>'+(x.room?'<small>каб. '+esc(String(x.room).replace(/^каб\.?\s*/i,''))+'</small>':'')}
/* список уроков с переменами между ними; isToday — подсветить текущий урок/перемену */
function lessonsHtml(L,isToday){const now=new Date(),nm=now.getHours()*60+now.getMinutes();let out='',status='';
 L.forEach((x,i)=>{const p=L[i-1],a=mins(x.a),b=mins(x.b),pb=p&&mins(p.b);
  if(p&&pb!=null&&a!=null&&a>pb){const brk=a-pb,inBrk=isToday&&nm>=pb&&nm<a;out+='<li class="schbrk'+(inBrk?' now':'')+'" aria-hidden="true">перемена '+brk+' мин</li>';if(inBrk)status='Перемена — следующий урок «'+x.s+'» в '+x.a}
  const live=isToday&&a!=null&&b!=null&&nm>=a&&nm<b;if(live)status='Сейчас: «'+x.s+'», до конца '+(b-nm)+' мин';
  out+='<li value="'+x.n+'" class="'+(live?'now':'')+'">'+lessonLine(x)+'</li>'});
 if(isToday&&!status&&L.length){const f=mins(L[0].a),l=mins(L[L.length-1].b);if(f!=null&&nm<f)status='Первый урок в '+L[0].a;else if(l!=null&&nm>=l)status='Уроки на сегодня закончились'}
 return{html:out,status}}
function drawSched(){const sc=S().sched;$('schCl').value=sc.cl||'';
 const t=wd(),has=sc.days.some(d=>d.length);
 if(!has){$('schToday').innerHTML='';}
 else{const show=(i,label,isT)=>{const L=sc.days[i]||[],r=lessonsHtml(L,isT);return '<div class="schday"><span>'+label+'</span>'+(r.status?'<p class="schnow">'+esc(r.status)+'</p>':'')+(L.length?'<ol>'+r.html+'</ol>':'<p class="mut">Уроков нет — отдыхай!</p>')+'</div>'};
  const tomorrow=t>=5?0:t+1;
  $('schToday').innerHTML=(t<=5?show(t,'Сегодня, '+DAYS[t].toLowerCase(),true):'<div class="schday"><span>Сегодня воскресенье</span><p class="mut">Выходной!</p></div>')+show(tomorrow,(t>=5?'В понедельник':'Завтра, '+DAYS[tomorrow].toLowerCase()))}
 $('schDays').innerHTML=SH.map((d,i)=>'<button type="button" data-d="'+i+'" class="'+(i===day?'on':'')+(i===t?' td':'')+'">'+d+'<small>'+sc.days[i].length+'</small></button>').join('');
 const L=sc.days[day];
 $('schList').innerHTML=editing?L.map((x,i)=>'<li class="ed"><input value="'+esc(x.s)+'" data-i="'+i+'" data-k="s" list="stSubj" placeholder="Предмет" aria-label="Предмет"><input value="'+esc(x.room)+'" data-i="'+i+'" data-k="room" placeholder="Каб." aria-label="Кабинет" class="room"><input type="time" value="'+esc(x.a||'')+'" data-i="'+i+'" data-k="a" aria-label="Начало урока" class="tm"><input type="time" value="'+esc(x.b||'')+'" data-i="'+i+'" data-k="b" aria-label="Конец урока" class="tm"><button type="button" class="pdel" data-rm="'+i+'" aria-label="Убрать урок">'+icn('close')+'</button></li>').join('')+'<li class="ed add"><button type="button" class="btn alt" id="schAdd">+ Урок</button></li>'
  :(L.length?lessonsHtml(L,false).html:'<li class="mut schnone">'+(has?'В этот день уроков нет.':'Расписания пока нет.')+'</li>');
 $('schEdit').textContent=editing?'Готово':'Изменить вручную';
 const dl=$('stSubj');if(dl)dl.innerHTML=[...new Set([...subjects(),...DEF_SUBJ])].map(s=>'<option>'+esc(s)+'</option>').join('');
 const fs=$('stFS');if(fs){const v=fs.value;fs.innerHTML='<option>Без предмета</option>'+subjects().map(s=>'<option>'+esc(s)+'</option>').join('');if([...fs.options].some(o=>o.value===v))fs.value=v}}
$('schDays').onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;day=+b.dataset.d;drawSched()};
$('schEdit').onclick=()=>{editing=!editing;if(!editing){S().sched.days[day]=S().sched.days[day].filter(x=>x.s.trim());renum();save();drawAll()}else drawSched()};
function renum(){S().sched.days.forEach(L=>L.forEach((x,i)=>x.n=i+1))}
$('schList').addEventListener('input',e=>{const i=e.target.dataset.i,k=e.target.dataset.k;if(i==null)return;S().sched.days[day][+i][k]=e.target.value;save()});
$('schList').addEventListener('click',e=>{if(e.target.id==='schAdd'){S().sched.days[day].push({n:S().sched.days[day].length+1,s:'',room:''});drawSched();const ins=$('schList').querySelectorAll('input[data-k=s]');if(ins.length)ins[ins.length-1].focus();return}
 const r=e.target.closest('[data-rm]');if(r){S().sched.days[day].splice(+r.dataset.rm,1);renum();save();drawSched()}});
$('schCl').addEventListener('change',()=>{S().sched.cl=$('schCl').value.trim();save()});
$('schFile').onchange=async()=>{const f=$('schFile').files[0];$('schFile').value='';if(!f)return;const cl=$('schCl').value.trim();
 const msg=t=>$('schMsg').innerHTML=t;
 if(!cl){msg('<b class="err">Сначала впиши свой класс</b>, например 3Б, — и снова выбери файл.');$('schCl').focus();return}
 if(!window.dfXlsx){msg('Не удалось загрузить читатель Excel.');return}
 msg('Читаю «'+esc(f.name)+'»…');
 try{const sheets=await window.dfXlsx.read(f),r=parse(sheets,cl);
  if(r.days){const n=r.days.reduce((a,d)=>a+d.length,0);S().sched={cl,days:r.days};save();day=Math.min(wd(),5);
   msg('Готово: нашёл расписание <b>'+esc(clKey(cl))+'</b> — '+n+' '+(n%10===1&&n%100!==11?'урок':[2,3,4].includes(n%10)&&![12,13,14].includes(n%100)?'урока':'уроков')+'. Если что-то не так — нажми «Изменить вручную».');drawAll()}
  else msg('<b class="err">Класс '+esc(clKey(cl))+' в файле не найден.</b> '+(r.seen.length?'В таблице есть: '+r.seen.map(esc).join(', ')+'.':'Похоже, в файле нет столбцов с названиями классов — можно заполнить расписание вручную.'))}
 catch(err){msg('<b class="err">Не получилось прочитать файл.</b> '+esc(err.message||''))}};

/* ================= оценки ================= */
const gcls=a=>a>=4.5?'g5':a>=3.5?'g4':a>=2.5?'g3':'g2';
function drawGrades(){const sel=$('grS'),v=sel.value;sel.innerHTML=subjects().map(s=>'<option>'+esc(s)+'</option>').join('');if([...sel.options].some(o=>o.value===v))sel.value=v;
 const G=S().grades,by={};G.forEach(g=>(by[g.s]=by[g.s]||[]).push(g));
 const avg=G.length?G.reduce((a,g)=>a+g.g,0)/G.length:0;
 $('grUndo').disabled=$('grClr').disabled=!G.length;
 $('grAvg').textContent=G.length?avg.toFixed(2).replace('.',','):'—';$('grAvg').className=G.length?gcls(avg):'';
 const subs=Object.keys(by).sort((a,b)=>by[b].length-by[a].length);
 $('grList').innerHTML=subs.length?subs.map(s=>{const L=by[s],a=L.reduce((x,g)=>x+g.g,0)/L.length;
   return '<li><span class="grs">'+esc(s)+'</span><span class="grchips">'+L.slice(-8).map(g=>'<i class="g'+g.g+'" title="'+D.fmt(g.d)+' · нажми, чтобы удалить" data-del="'+g.id+'">'+g.g+'</i>').join('')+'</span><b class="'+gcls(a)+'">'+a.toFixed(1).replace('.',',')+'</b></li>'}).join('')
  :'<li class="mut">Оценок пока нет.</li>'}
$('grBtns').onclick=e=>{const b=e.target.closest('[data-g]');if(!b)return;const s=$('grS').value;if(!s)return;const g=+b.dataset.g,t=today();
 const rec={id:Date.now(),s,g,d:t};S().grades.push(rec);
 if(g===5&&(S().gpaid[t]||0)<3){S().gpaid[t]=(S().gpaid[t]||0)+1;D.fitsAdd(10);rec.paid=1}
 save();drawGrades();b.classList.add('pop');setTimeout(()=>b.classList.remove('pop'),400)};
$('grUndo').onclick=()=>{const G=S().grades;if(!G.length)return;const g=G.pop(),t=today();
 if(g.g===5&&g.d===t&&g.paid){S().gpaid[t]=Math.max(0,(S().gpaid[t]||0)-1);D.fitsAdd(-10)}save();drawGrades()};
let clrT=null;$('grClr').onclick=()=>{const b=$('grClr');if(!S().grades.length)return;
 if(!b.classList.contains('sure')){b.classList.add('sure');b.textContent='Точно стереть все оценки?';clearTimeout(clrT);clrT=setTimeout(()=>{b.classList.remove('sure');b.textContent='Стереть все'},3000);return}
 clearTimeout(clrT);S().grades=[];save();b.classList.remove('sure');b.textContent='Стереть все';drawGrades()};
$('grList').onclick=e=>{const x=e.target.closest('[data-del]');if(!x)return;const id=+x.dataset.del;
 if(x.classList.contains('sure')){S().grades=S().grades.filter(g=>g.id!==id);save();drawGrades()}else{x.classList.add('sure');setTimeout(()=>x.classList.remove('sure'),2500)}};

/* ================= карточки (повторение по коробкам Лейтнера) ================= */
const GAP=[0,1,2,4,8,16];let cur=null,shown=false;
const due=()=>S().cards.filter(c=>!c.due||c.due<=today());
function drawCards(){const C=S().cards,d=due();
 if(cur&&!C.includes(cur))cur=null;
 if(cur){$('cdLearn').innerHTML='<div class="cdcard'+(shown?' open':'')+'"><small>Вопрос</small><b>'+esc(cur.q)+'</b>'+(shown?'<small>Ответ</small><b class="cda">'+esc(cur.a)+'</b>':'')+'</div>'
   +(shown?'<div class="sprow cdbtns"><button type="button" class="btn alt" data-r="0">Не помню</button><button type="button" class="btn" data-r="1">Помню</button></div>'
   :'<button type="button" class="btn" id="cdShow">Показать ответ</button>')+'<small class="mut">Осталось на сегодня: '+d.length+'</small>'}
 else $('cdLearn').innerHTML=C.length?(d.length?'<button type="button" class="btn" id="cdGo">Учить: '+d.length+' '+(d.length%10===1&&d.length%100!==11?'карточка':[2,3,4].includes(d.length%10)&&![12,13,14].includes(d.length%100)?'карточки':'карточек')+'</button>':'<p class="cddone">На сегодня всё повторено! Следующие карточки появятся завтра.</p>')
   :'<p class="mut">Добавь первую карточку ниже.</p>';
 $('cdSum').textContent='Все карточки ('+C.length+')';
 $('cdList').innerHTML=C.map(c=>'<li><span><b>'+esc(c.q)+'</b> — '+esc(c.a)+'</span><small title="Коробка: чем больше, тем реже повтор">'+'●'.repeat(c.box||1)+'</small><button type="button" class="pdel" data-cdel="'+c.id+'" aria-label="Удалить карточку">'+icn('close')+'</button></li>').join('')||'<li class="mut">Пусто</li>'}
$('cdForm').onsubmit=e=>{e.preventDefault();const q=$('cdQ').value.trim(),a=$('cdA').value.trim();if(!q||!a)return;
 S().cards.push({id:Date.now(),q,a,box:1,due:''});save();$('cdQ').value='';$('cdA').value='';$('cdQ').focus();drawCards()};
$('cdLearn').onclick=e=>{if(e.target.id==='cdGo'){cur=due()[0];shown=false;drawCards();return}
 if(e.target.id==='cdShow'){shown=true;drawCards();return}
 const r=e.target.closest('[data-r]');if(!r||!cur)return;const ok=r.dataset.r==='1';
 cur.box=ok?Math.min(5,(cur.box||1)+1):1;cur.due=ok?addD(today(),GAP[cur.box]):today();S().reviews++;save();
 const rest=due().filter(c=>c!==cur);cur=rest[0]||null;shown=false;drawCards()};
$('cdList').onclick=e=>{const b=e.target.closest('[data-cdel]');if(!b)return;S().cards=S().cards.filter(c=>c.id!==+b.dataset.cdel);save();drawCards()};
if(!st.cards.length){st.cards=[{id:1,q:'apple',a:'яблоко',box:1,due:''},{id:2,q:'Формула площади круга',a:'S = πr²',box:1,due:''},{id:3,q:'Год крещения Руси',a:'988',box:1,due:''}];save()}

/* ================= время по предметам ================= */
function drawTime(){const T=S().time||{},from=addD(today(),-6),sum={};
 Object.entries(T).forEach(([d,m])=>{if(d>=from)Object.entries(m).forEach(([s,v])=>sum[s]=(sum[s]||0)+v)});
 const L=Object.entries(sum).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...L.map(x=>x[1])),tot=L.reduce((a,x)=>a+x[1],0);
 const hm=v=>v>=60?Math.floor(v/60)+' ч '+(v%60?v%60+' мин':''):v+' мин';
 $('tmBars').innerHTML=L.length?L.map(([s,v])=>'<div class="tmrow"><span>'+esc(s)+'</span><div class="bar"><i style="width:'+(v/mx*100).toFixed(0)+'%"></i></div><b>'+hm(v)+'</b></div>').join('')+'<p class="tmtot">Всего за неделю: <b>'+hm(tot)+'</b></p>'
  :'<p class="mut">Пока пусто: запусти фокус-сессию, выбрав предмет.</p>'}

function drawAll(){drawSched();drawGrades();drawCards();drawTime()}
window.dfStudyHook=drawTime;
setInterval(()=>{if(document.querySelector('#study.on')&&!editing)drawSched()},60000);
drawAll();
const _go=window.go;window.go=function(id){_go(id);if(id==='study')drawAll()};
})();
