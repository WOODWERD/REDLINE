/* ================= WOODWERD Mini Loop: image module =================
   Appended to the end of the Loop page script by build-mini.py.
   Function declarations here replace Loop's PDF versions of the same name (the later
   declaration wins), so every other part of Loop (tools, standards, submit flow) runs unchanged.
   An image is shown through a tiny stand-in for a pdf.js document: one page whose size is the
   image's pixel size. Markup pts are image pixels, origin top left. */
const isImg=f=>!!f&&(/^image\//.test(f.type||"")||/\.(png|jpe?g|webp|gif)$/i.test(f.name||""));
function loadImg(blob){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("That image couldn't be read."));i.src=typeof blob==="string"?blob:URL.createObjectURL(blob)})}
function imgDoc(img){const w=img.naturalWidth,h=img.naturalHeight;
  const page={getViewport:({scale})=>({width:w*scale,height:h*scale,scale}),
    render:({canvasContext:ctx,viewport,transform})=>{let stop=false;
      const promise=new Promise((res,rej)=>requestAnimationFrame(()=>{if(stop)return rej(new Error("cancelled"));
        ctx.save();if(transform)ctx.setTransform(...transform);ctx.imageSmoothingEnabled=viewport.scale<3;ctx.imageSmoothingQuality="high";
        ctx.drawImage(img,0,0,viewport.width,viewport.height);ctx.restore();res()}));
      return{promise,cancel(){stop=true}}}};
  return{numPages:1,getPage:async()=>page,_img:img}}
async function sha(buf){try{const d=await crypto.subtle.digest("SHA-256",buf);return[...new Uint8Array(d)].slice(0,16).map(b=>b.toString(16).padStart(2,"0")).join("")}catch{return""}}
function stamp(){const d=new Date(),p=n=>String(n).padStart(2,"0");return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`}
function nameOf(file,meta){const n=(file.name||"").replace(/\.(png|jpe?g|webp|gif)$/i,"").trim();
  if(meta&&meta.prev)return meta.prev.name||"Screen grab";
  return!n||/^(image|screenshot|clipboard|blob|pasted.*)$/i.test(n)?"Screen grab "+stamp():n}
function bumpVer(r){const m=/^(.*?)(\d+)$/.exec(r||"");return m?m[1]+(+m[2]+1):(r?r+".1":"v2")}

/* strokes sized for screen pixels rather than 36" sheets */
function K(){return Math.max(.5,Math.max(S.W,S.H)/2000)}
/* scale: -1 = not to scale (measures read in pixels); otherwise Loop's paper-inches-per-foot, set by calibration */
function measureText(len,scale){if(!(+scale>0))return Math.round(len)+" px";const inches=len/72;
  if(+scale>=12){return(Math.round(inches*16)/16).toFixed(2).replace(/\.?0+$/,"")+'"'}
  const ft=inches/scale;let f=Math.floor(ft),i=Math.round((ft-f)*12);if(i===12){f++;i=0}return`${f}'-${i}"`}
function realInches(m){const s=+m.scale;if(!(s>0))return NaN;const[a,b]=m.pts;return Math.hypot(b[0]-a[0],b[1]-a[1])/72*12/s}
function stdCheck(m){if(!STD||!m.std||m.type!=="measure")return null;const r=realInches(m);return isFinite(r)?STD.check(m.std,r):null}
/* Build REV is a drawing-set step; images go round by version instead */
function revReady(){return false}

/* ---------- open an image ---------- */
async function handleFile(file,meta){
  if(!isImg(file)){libMsg("That isn't an image. Paste a screen grab, or drop a PNG or JPG.",true);return}
  const prev=meta&&meta.prev||null;
  if(S.doc)showLibrary();
  libMsg(`Reading ${prev?"the new version":file.name||"the image"} · ${fmtMB(file.size)}…`);
  let img;try{img=await loadImg(file)}catch(err){libMsg(err.message,true);return}
  const fp=await sha(await file.arrayBuffer());
  let row=[...S.docs.values()].find(d=>fp&&d.fp===fp);
  if(!row){
    const id=uid(16);
    row={id,kind:"image",name:nameOf(file,meta),fp,pages:1,w:img.naturalWidth,h:img.naturalHeight,mime:file.type||"image/png",round:prev?bumpVer(prev.round||"v1"):"v1",
      size:file.size,createdAt:Date.now(),by:S.me||null,assetId:null,source:meta&&meta.pasted?"paste":"file"};
    if(prev){row.prev=prev.id;if(prev.project)row.project=prev.project;if(prev.chat)row.chat=prev.chat;if(prev.scale)row.scale=prev.scale}
    S.docs.set(id,row);
  }
  local.set(row.id,{pdf:imgDoc(img),file});
  if(!row.assetId&&assets&&file.size<=MAX_ASSET){
    libMsg("Storing the image so Claude can open it…");
    try{const up=await assets.upload(file,{type:file.type||"image/png"});row.assetId=up.id}catch(err){libMsg(`Opened, but the image couldn't be stored (${err&&err.code||"error"}). Markups still save.`,true)}
  }
  if(colD){try{const{id,...rest}=row;await colD.doc(row.id).set({...rest,touchedAt:Date.now()})}catch(err){failSave(err)}}
  saveLocal();libMsg("");
  location.hash=`#d-${row.id}`;
}
function blobUrl(d){return d.assetUrl||(d.assetId?"/_blob/"+d.assetId:"")}
function libThumb(d){const u=blobUrl(d);const b=el("div",{class:"lthumb","data-id":d.id});
  if(u&&!PUBLIC)b.append(el("img",{src:u,alt:"",loading:"lazy",decoding:"async",onerror:e=>e.target.remove()}));return b}
async function openDoc(id,page){
  const tok=++openTok;
  showView("doc");
  const row=S.docs.get(id);
  if(!row){if(db&&!S.dbReady){tmsg("Loading the image list…");return}tmsg("This image isn't in the library.",true);$("#dname").textContent="Not found";return}
  S.doc=row;$("#dname").textContent=row.name||"Untitled image";$("#round").value=row.round||"";
  if(!pdf||pdf._wwid!==id){
    pdf=null;pageObj=null;$("#pages").innerHTML="";$("#layer").innerHTML="";clearCanvases();
    const loc=local.get(id);
    if(loc)pdf=loc.pdf;
    else if(blobUrl(row)){
      tmsg(`Loading ${row.name||"the image"}…`);
      try{const r=await fetch(blobUrl(row));if(!r.ok)throw new Error(r.status===404?"The stored image is missing.":"Couldn't fetch the image ("+r.status+").");
        const blob=await r.blob();if(tok!==openTok)return;const img=await loadImg(blob);pdf=imgDoc(img);local.set(id,{pdf,file:blob})}
      catch(err){if(tok!==openTok)return;tmsg(`${err&&err.message||"Couldn't load the image."} Paste or drop it again to reopen it.`,true);renderList();return}
    }else{tmsg("This image isn't stored with the page yet. Paste or drop the same image to open it, and its markups come back.",true);renderList();return}
    if(tok!==openTok)return;
    pdf._wwid=id;S.pages=1;
    const im=pdf._img;if(colD&&(!row.w||!row.h)){try{await colD.doc(id).update({w:im.naturalWidth,h:im.naturalHeight,pages:1})}catch{}}
    buildPages();
  }
  applyScale(row);
  await goPage(1,false);
}
async function goPage(n,keepView){
  if(!pdf)return;const tok=++pageTok;
  S.page=1;S.sel=null;
  try{pageObj=await pdf.getPage(1)}catch(err){tmsg("Couldn't draw the image.",true);return}
  if(tok!==pageTok)return;
  const vp=pageObj.getViewport({scale:1});S.W=vp.width;S.H=vp.height;
  const st=$("#stage");st.style.width=S.W+"px";st.style.height=S.H+"px";
  const ink=$("#ink");ink.setAttribute("viewBox",`0 0 ${S.W} ${S.H}`);ink.setAttribute("width",S.W);ink.setAttribute("height",S.H);
  $("#psize").textContent=`${S.W} × ${S.H} px`;
  setHash(`#d-${S.doc.id}`);
  tmsg("");
  if(!keepView)fit();
  updateCounts();render();renderList();
  renderBase(tok);
}

/* ---------- paste ---------- */
function pasteFile(f){handleFile(f,{pasted:true,prev:S.doc||null})}
document.addEventListener("paste",e=>{
  if(e.target&&e.target.closest&&e.target.closest("textarea,input"))return;
  const f=[...(e.clipboardData&&e.clipboardData.files||[])].find(isImg)||
    [...(e.clipboardData&&e.clipboardData.items||[])].filter(i=>i.kind==="file"&&/^image\//.test(i.type)).map(i=>i.getAsFile()).find(Boolean);
  if(!f)return;e.preventDefault();pasteFile(f)});
async function pasteButton(){
  const mac=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent),key=mac?"⌘V":"Ctrl+V";
  try{if(!navigator.clipboard||!navigator.clipboard.read)throw 0;
    const items=await navigator.clipboard.read();
    for(const it of items){const t=it.types.find(x=>/^image\//.test(x));if(t){const b=await it.getType(t);pasteFile(new File([b],"image."+(t.split("/")[1]||"png"),{type:t}));return}}
    libMsg(`There's no image on the clipboard. Take a screen grab, then press ${key} here.`,true)}
  catch{libMsg(`Press ${key} to paste. This browser doesn't let the button read the clipboard.`,true)}}
for(const id of["#pastebtn"]){const b=$(id);if(!b)continue;
  b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();pasteButton()});
  b.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pasteButton()}})}

/* ---------- scale calibration ---------- */
let CAL=false;
function applyScale(row){const sel=$("#scale");[...sel.options].forEach(o=>{if(o.value!=="-1")o.remove()});
  const v=+(row&&row.scale)||+store.get("ww-scale-"+(row&&row.id))||0;
  if(v>0){sel.append(el("option",{value:String(v),text:"Calibrated"}));sel.value=String(v)}else sel.value="-1"}
function parseLen(t){t=(t||"").trim().toLowerCase().replace(/[’′]/g,"'").replace(/[”″]/g,'"');let m;
  if((m=/^([\d.]+)\s*(mm|cm|m)$/.exec(t)))return+m[1]/({mm:25.4,cm:2.54,m:.0254})[m[2]];
  if((m=/^(?:([\d.]+)\s*'\s*-?\s*)?(?:([\d.]+)(?:\s+(\d+)\/(\d+))?\s*"?)?$/.exec(t))&&(m[1]||m[2])){
    if(m[1]&&!m[2]&&!/'/.test(t))return NaN;
    return(+m[1]||0)*12+(+m[2]||0)+(m[3]?+m[3]/+m[4]:0)}
  if((m=/^([\d.]+)\s*(ft|feet|')$/.exec(t)))return+m[1]*12;
  return NaN}
$("#calbtn").addEventListener("click",()=>{if(!S.doc)return;CAL=true;setTool("measure");
  $("#hint").textContent="Set scale: drag along something whose real length you know, like a cabinet width or a wall. Esc cancels."});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&CAL){CAL=false;setTool("measure")}});
function calHook(o){if(!CAL||o.type!=="measure")return false;CAL=false;
  const[a,b]=o.pts,len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const d=$("#draft");d.innerHTML="";const g=sv("g");draw({type:"measure",pts:o.pts,color:o.color,scale:-1},g);d.append(g);
  const inp=el("input",{type:"text",placeholder:`36" or 3'-0" or 914mm`,"aria-label":"Real length of that line",style:"border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);padding:4px 8px;color:var(--ink);width:16ch"});
  const err=el("span",{class:"err"});
  const done=()=>{d.innerHTML="";tmsg("");setTool("measure")};
  const set=async()=>{const R=parseLen(inp.value);if(!(R>0)){err.textContent=" Type a length like 36\", 3'-0\" or 914mm.";inp.focus();return}
    const v=+((len/72)*12/R).toFixed(6);S.doc.scale=v;store.set("ww-scale-"+S.doc.id,String(v));applyScale(S.doc);
    for(const m of docMarks())if(m.type==="measure")patch(m.id,{scale:v});
    if(colD){try{await colD.doc(S.doc.id).update({scale:v,scaleRef:{px:Math.round(len),inches:+R.toFixed(3)}});saved()}catch(er){failSave(er)}}
    done();$("#hint").textContent=`Scale set: ${Math.round(len)} px = ${measureText(len,v)}. Measures now read in feet and inches.`};
  const m=$("#tmsg");m.hidden=false;const box=$("#tmsgin");box.innerHTML="";
  box.append(el("span",{class:"sdot attention pulse"}),el("div",{},document.createTextNode(`That line is ${Math.round(len)} px. How long is it really? `),inp,err),
    el("button",{class:"primary",text:"Set scale",onclick:set}),el("button",{class:"btn",text:"Cancel",onclick:done}));
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();set()}if(e.key==="Escape")done()});
  setTimeout(()=>inp.focus(),0);return true}

/* ---------- flatten: the image with its markups drawn on, as a PNG ---------- */
async function flatten(maxDim){
  if(!S.doc||!pdf||!pdf._img)throw new Error("Open an image first.");
  const s=Math.min(1,(maxDim||8192)/Math.max(S.W,S.H)),c=document.createElement("canvas");
  c.width=Math.round(S.W*s);c.height=Math.round(S.H*s);const ctx=c.getContext("2d");ctx.drawImage(pdf._img,0,0,c.width,c.height);
  numberAll();
  const svg=sv("svg",{xmlns:NS,viewBox:`0 0 ${S.W} ${S.H}`,width:c.width,height:c.height}),defs=sv("defs"),g=sv("g"),made=new Set();
  svg.append(defs,g);
  for(const m of docMarks()){if(isSup(m))continue;const gg=sv("g");if(isClosed(m))gg.setAttribute("opacity",".4");draw(m,gg);g.append(gg)}
  g.querySelectorAll(".hit").forEach(x=>x.remove());
  /* markers coloured per ink (context-stroke isn't safe when the SVG is drawn as an image) */
  g.querySelectorAll("[marker-start],[marker-end]").forEach(x=>{const col=x.getAttribute("stroke")||"#e0261b",key=col.replace(/[^a-z0-9]/gi,"");
    for(const at of["marker-start","marker-end"]){const v=x.getAttribute(at);if(!v)continue;const base=/#(\w+)/.exec(v)[1],id=base+"-"+key;
      if(!made.has(id)){made.add(id);const src=$("#ink #"+base);if(src){const mk=src.cloneNode(true);mk.id=id;mk.querySelectorAll("path").forEach(p=>{if(p.getAttribute("fill")==="context-stroke")p.setAttribute("fill",col);if(p.getAttribute("stroke")==="context-stroke")p.setAttribute("stroke",col)});defs.append(mk)}}
      x.setAttribute(at,`url(#${id})`)}});
  const xml=new XMLSerializer().serializeToString(svg);
  const im=await loadImg("data:image/svg+xml;charset=utf-8,"+encodeURIComponent(xml));ctx.drawImage(im,0,0,c.width,c.height);
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error("Couldn't make the PNG.")),"image/png"))}
/* on Submit / Commit: store the marked-up image so Claude can look at exactly what was marked */
async function miniFlat(sid){if(!assets||!db)return null;
  try{const b=await flatten(2560);const up=await assets.upload(new File([b],`mini-loop-${sid}.png`,{type:"image/png"}),{type:"image/png"});
    await db.collection("submissions").doc(sid).update({markedAssetId:up.id});return up.id}catch{return null}}
async function downloadMarked(note,btn){
  if(!S.doc||!pdf){note.hidden=false;note.textContent="Open an image first.";return}
  btn.disabled=true;note.hidden=false;note.textContent="Drawing your markups onto the image…";
  try{const blob=await flatten();const d=new Date(),day=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const fname=`${(S.doc.name||"image").replace(/[\\/:*?"<>|]+/g,"-")}${S.doc.round?" "+S.doc.round:""} - markups - ${day}.png`;
    if(PUBLIC){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fname;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);note.textContent=`Downloaded “${fname}”.`}
    else{const dl=await window.claude.use("downloads");if(!dl)throw new Error("Downloads aren't available in this view.");
      try{await dl.save({filename:fname,data:blob});note.textContent=`Saved “${fname}”.`}catch(err){note.textContent=err&&err.code==="declined"?"Download cancelled.":`Couldn't save the file (${err&&err.code||"error"}).`}}}
  catch(err){note.textContent=`Couldn't make the PNG: ${err&&err.message||"unknown error"}`}
  btn.disabled=false}
/* ---------- clean up: trash per image, select several, delete older ones ---------- */
const PICK=new Set();
const _renderLibrary=renderLibrary;
renderLibrary=function(){_renderLibrary();if(PUBLIC||!colD)return;
  for(const k of[...PICK])if(!S.docs.has(k))PICK.delete(k);
  document.querySelectorAll("#docs .drow").forEach(row=>{const th=row.querySelector(".lthumb");const d=th&&S.docs.get(th.dataset.id);if(!d)return;
    const cb=el("input",{type:"checkbox",class:"pick","aria-label":`Select ${d.name||"image"}`});cb.checked=PICK.has(d.id);
    cb.addEventListener("change",()=>{cb.checked?PICK.add(d.id):PICK.delete(d.id);cleanBar()});
    row.insertBefore(el("label",{class:"pickw"},cb),row.firstChild);
    const act=row.querySelector(".dact");if(act)act.append(iconBtn("trash",`Delete ${d.name||"this image"}`,()=>askDelete(row,[d])))});
  cleanBar()};
function cleanBar(){let bar=$("#cleanbar");const docs=[...S.docs.values()];
  if(!docs.length){if(bar)bar.remove();return}
  if(!bar){bar=el("div",{id:"cleanbar",class:"cleanbar"});$("#docs").before(bar)}
  bar.innerHTML="";const n=PICK.size,week=Date.now()-7*864e5;
  const old=docs.filter(d=>(d.touchedAt||d.createdAt||0)<week);
  bar.append(el("span",{class:"cbt",text:n?`${n} selected`:"Clean up"}),
    el("button",{class:"link",type:"button",text:"Select all",onclick:()=>{docs.forEach(d=>PICK.add(d.id));renderLibrary()}}),
    el("button",{class:"link",type:"button",text:`Select older than a week (${old.length})`,disabled:old.length?null:"",onclick:()=>{old.forEach(d=>PICK.add(d.id));renderLibrary()}}),
    n?el("button",{class:"link",type:"button",text:"Clear",onclick:()=>{PICK.clear();renderLibrary()}}):"",
    el("span",{class:"sp"}),
    el("button",{class:"btn danger-btn",type:"button",text:n?`Delete ${n} image${n>1?"s":""}`:"Delete selected",disabled:n?null:"",onclick:()=>askDelete(bar,docs.filter(d=>PICK.has(d.id)))}))}
function askDelete(host,list){if(!list.length||host.querySelector(".forget"))return;
  const n=list.reduce((a,d)=>a+[...S.marks.values()].filter(m=>m.doc===d.id).length,0);
  const what=list.length===1?`“${list[0].name||"this image"}” ${list[0].round||""}`.trim():`${list.length} images`;
  const box=el("div",{class:"forget",role:"alert"},el("span",{text:`Delete ${what}, ${n} markup${n===1?"":"s"} and their review history for good? This can't be undone.`}),
    el("div",{class:"crow"},el("button",{class:"primary danger",text:"Delete",onclick:async e=>{e.currentTarget.disabled=true;await deleteDocs(list,box)}}),el("button",{class:"btn",text:"Cancel",onclick:()=>box.remove()})));
  host.append(box);box.querySelector(".danger").focus()}
async function deleteDocs(list,box){
  const ids=new Set(list.map(d=>d.id)),keepAssets=new Set([...S.docs.values()].filter(d=>!ids.has(d.id)).map(d=>d.assetId).filter(Boolean));
  let done=0,fail=0;const say=t=>{const s=box&&box.querySelector("span");if(s)s.textContent=t};
  for(const d of list){say(`Deleting ${++done} of ${list.length}…`);
    try{for(const m of[...S.marks.values()].filter(m=>m.doc===d.id)){await colM.doc(m.id).delete();S.marks.delete(m.id)}
      for(const sb of[...S.subs.values()].filter(x=>x.doc===d.id)){if(assets&&sb.markedAssetId){try{await assets.delete(sb.markedAssetId)}catch{}}await db.collection("submissions").doc(sb.id).delete();S.subs.delete(sb.id)}
      if(assets&&d.assetId&&!keepAssets.has(d.assetId)){try{await assets.delete(d.assetId)}catch{}}
      await colD.doc(d.id).delete();S.docs.delete(d.id);local.delete(d.id);PICK.delete(d.id);try{localStorage.removeItem("ww-scale-"+d.id)}catch{}}
    catch(err){fail++}}
  libMsg(fail?`Deleted ${list.length-fail} of ${list.length}. ${fail} couldn't be deleted (you may not have edit access).`:`Deleted ${list.length} image${list.length>1?"s":""}.`,!!fail);
  setTimeout(()=>libMsg(""),fail?8000:3000);renderLibrary()}

/* ---------- copy: the marked-up image to the clipboard, to paste straight into a chat ---------- */
async function copyImage(btn){const note=$("#copynote");const show=t=>{note.textContent=t;note.hidden=!t;clearTimeout(copyImage.t);copyImage.t=setTimeout(()=>{note.hidden=true},4000)};
  if(!S.doc||!pdf){show("Open an image first.");return}
  btn.disabled=true;const p=flatten();
  try{if(!navigator.clipboard||!window.ClipboardItem)throw new Error("no clipboard");
    await navigator.clipboard.write([new ClipboardItem({"image/png":p})]);
    show(`Copied. Paste it into any chat with ${/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent)?"⌘V":"Ctrl+V"}.`)}
  catch{try{const blob=await p;const dl=await window.claude.use("downloads");
      if(!dl)throw 0;const fname=`${(S.doc.name||"image").replace(/[\\/:*?"<>|]+/g,"-")} ${S.doc.round||""} marked.png`.replace(/\s+/g," ");
      await dl.save({filename:fname,data:blob});show("This view won't let the page use the clipboard, so it saved the PNG instead. Drag it into the chat.")}
    catch{show("Couldn't copy here. Use Download marked-up PNG.")}}
  btn.disabled=false}
$("#copybtn").addEventListener("click",e=>copyImage(e.currentTarget));
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.shiftKey&&e.key.toLowerCase()==="c"&&S.doc&&!$("#table").hidden){e.preventDefault();copyImage($("#copybtn"))}});
/* ================= end Mini Loop image module ================= */
