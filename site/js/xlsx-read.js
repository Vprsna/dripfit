/* xlsx-read.js — маленький читатель Excel-файлов (.xlsx) прямо в браузере, без библиотек и без интернета.
   .xlsx — это zip-архив с XML внутри: распаковываем встроенным DecompressionStream и читаем листы.
   window.dfXlsx.read(file) → [{name, rows: [[ячейка, …], …]}], объединённые ячейки заполнены значением.
   Старый формат .xls не поддерживается — его нужно пересохранить как .xlsx (Файл → Сохранить как). Поддерживается и .csv. */
(()=>{
const u16=(d,o)=>d.getUint16(o,true),u32=(d,o)=>d.getUint32(o,true);
async function inflate(bytes){const s=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return new Uint8Array(await new Response(s).arrayBuffer())}
async function unzip(buf){const d=new DataView(buf),files={};let e=-1;
 for(let i=buf.byteLength-22;i>=Math.max(0,buf.byteLength-66000);i--)if(u32(d,i)===0x06054b50){e=i;break}
 if(e<0)throw new Error('Это не файл .xlsx');
 let p=u32(d,e+16);const n=u16(d,e+10),dec=new TextDecoder();
 for(let k=0;k<n;k++){if(u32(d,p)!==0x02014b50)break;
  const method=u16(d,p+10),csize=u32(d,p+20),nl=u16(d,p+28),xl=u16(d,p+30),cl=u16(d,p+32),off=u32(d,p+42);
  const name=dec.decode(new Uint8Array(buf,p+46,nl));files[name]={method,csize,off};p+=46+nl+xl+cl}
 return async name=>{const f=files[name];if(!f)return null;const s=f.off+30+u16(d,f.off+26)+u16(d,f.off+28);
  const raw=new Uint8Array(buf,s,f.csize);return dec.decode(f.method===8?await inflate(raw):raw)}}
const xml=t=>new DOMParser().parseFromString(t,'application/xml');
const col=ref=>{let c=0;for(const ch of ref.replace(/\d+/g,''))c=c*26+ch.charCodeAt(0)-64;return c-1};
const rowOf=ref=>+ref.replace(/[A-Z]+/g,'')-1;
const txt=el=>[...el.getElementsByTagName('t')].map(t=>t.textContent).join('');
async function readXlsx(buf){const get=await unzip(buf);
 const ssT=await get('xl/sharedStrings.xml'),ss=ssT?[...xml(ssT).getElementsByTagName('si')].map(txt):[];
 const wb=xml(await get('xl/workbook.xml')),rels=xml(await get('xl/_rels/workbook.xml.rels')||'<r/>');
 const target={};[...rels.getElementsByTagName('Relationship')].forEach(r=>target[r.getAttribute('Id')]=r.getAttribute('Target'));
 const out=[];
 for(const sh of wb.getElementsByTagName('sheet')){
  const id=sh.getAttribute('r:id')||sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
  let path=(target[id]||'').replace(/^\//,'');if(!path.startsWith('xl/'))path='xl/'+path;
  const t=await get(path);if(!t)continue;const doc=xml(t),rows=[];
  for(const c of doc.getElementsByTagName('c')){const ref=c.getAttribute('r');if(!ref)continue;const ty=c.getAttribute('t'),v=c.getElementsByTagName('v')[0];
   let val=ty==='s'?ss[+(v&&v.textContent)]:ty==='inlineStr'?txt(c):v?v.textContent:'';if(val==null||val==='')continue;
   const r=rowOf(ref),k=col(ref);(rows[r]=rows[r]||[])[k]=String(val).trim()}
  for(const m of doc.getElementsByTagName('mergeCell')){const [a,b]=m.getAttribute('ref').split(':');if(!b)continue;
   const r1=rowOf(a),c1=col(a),r2=rowOf(b),c2=col(b),v=(rows[r1]||[])[c1];if(v==null)continue;
   for(let r=r1;r<=r2;r++)for(let k=c1;k<=c2;k++){rows[r]=rows[r]||[];if(rows[r][k]==null)rows[r][k]=v}}
  for(let r=0;r<rows.length;r++)rows[r]=rows[r]||[];
  out.push({name:sh.getAttribute('name')||'Лист',rows})}
 return out}
function readCsv(text){const sep=(text.split('\n')[0].match(/;/g)||[]).length>(text.split('\n')[0].match(/,/g)||[]).length?';':',';
 return [{name:'CSV',rows:text.split(/\r?\n/).map(l=>l.split(sep).map(x=>x.replace(/^"|"$/g,'').trim()))}]}
window.dfXlsx={async read(file){const name=file.name.toLowerCase();
 if(name.endsWith('.csv'))return readCsv(await file.text());
 if(name.endsWith('.xls'))throw new Error('Это старый формат .xls. Открой файл в Excel и сохрани как .xlsx (Файл → Сохранить как → Книга Excel).');
 if(typeof DecompressionStream==='undefined')throw new Error('Браузер слишком старый для чтения Excel — обнови его.');
 return readXlsx(await file.arrayBuffer())}};
})();
