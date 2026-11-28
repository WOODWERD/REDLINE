/* WOODWERD Redline: write markups into the PDF as real PDF comments (annotations with their own appearance),
   so they show and list in Bluebeam, Acrobat, Preview and browser viewers. Uses pdf-lib, loaded on first use. */
(function(){
let libP=null;
function loadLib(){
  if(window.PDFLib)return Promise.resolve(window.PDFLib);
  if(!libP)libP=new Promise((ok,no)=>{const s=document.createElement("script");s.src="vendor/pdf-lib.min.js";s.onload=()=>window.PDFLib?ok(window.PDFLib):no(new Error("PDF writer did not load"));s.onerror=()=>no(new Error("PDF writer did not load"));document.head.append(s)});
  return libP;
}
function hexRgb(h){const n=parseInt((h||"#e0261b").slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]}
function pdfDate(t){const d=new Date(t),p=n=>String(n).padStart(2,"0");return`D:${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`}
/* WinAnsi-safe text for the standard Helvetica font */
function ansi(t){return String(t||"").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,"-").replace(/…/g,"...").replace(/[^\x20-\x7E\xA0-\xFF]/g,"")}

/* Build the drawing of one markup in page view space (points, y down): polylines, filled polygons, text runs. */
function shapes(m,k,num){
  const c=m.color||"#e0261b",p=m.pts||[],sw=5*k,out={strokes:[],fills:[],texts:[]};
  const S=(pts,w,closed,opacity,dash)=>out.strokes.push({pts,w,closed,opacity:opacity||1,color:c,dash});
  const head=(a,b,len)=>{const ang=Math.atan2(b[1]-a[1],b[0]-a[0]),s=len,w=.45;return[b,[b[0]-s*Math.cos(ang-w),b[1]-s*Math.sin(ang-w)],[b[0]-s*Math.cos(ang+w),b[1]-s*Math.sin(ang+w)]]};
  if(m.type==="rect"||m.type==="cloud"){const b=bbox(p);
    if(m.type==="rect")S([[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]],sw,true);
    else{const r=16*k,pts=[];const edge=(x0,y0,dx,dy,len)=>{const n=Math.max(1,Math.round(len/(r*2))),seg=len/n,rad=seg/2;
        for(let i=0;i<n;i++){const cx=x0+dx*(i*seg+rad),cy=y0+dy*(i*seg+rad);const base=Math.atan2(-dy,-dx);
          for(let j=0;j<=10;j++){const a=base+Math.PI*j/10;pts.push([cx+rad*Math.cos(a),cy+rad*Math.sin(a)])}}};
      edge(b.x,b.y,1,0,b.w);edge(b.x+b.w,b.y,0,1,b.h);edge(b.x+b.w,b.y+b.h,-1,0,b.w);edge(b.x,b.y+b.h,0,-1,b.h);S(pts,sw,true)}}
  else if(m.type==="arrow"){const[a,b]=p;S([a,b],sw);out.fills.push({pts:head(a,b,sw*5),color:c})}
  else if(m.type==="cl"||m.type==="dash"){const[a,b]=p;
    if(m.type==="cl"){S([a,b],3.5*k,false,1,[70*k,16*k,14*k,16*k]);const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1,ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L;
      [[b,1],[a,-1]].forEach(([q,sg])=>{const cx=q[0]+sg*ux*34*k,cy=q[1]+sg*uy*34*k;clGlyph(cx,cy,k).forEach(l=>S(l,3.5*k))})}
    else S([a,b],4*k,false,1,[24*k,14*k])}
  else if(m.type==="xout"){const b=bbox(p),box=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]];out.areaFill={pts:box,color:c,opacity:.08};S(box,4*k,true);S([box[0],box[2]],4*k);S([box[1],box[3]],4*k)}
  else if(m.type==="area"){out.areaFill={pts:p,color:c,opacity:.08};const b=bbox(p),gap=18*k*1.41,lines=[];
    for(let t=b.x+b.y;t<=b.x+b.w+b.y+b.h;t+=gap)lines.push([[t-b.y,b.y],[t-(b.y+b.h),b.y+b.h]]);
    out.hatch={clip:p,lines,w:2.2*k,color:c,opacity:.55};S(p,4*k,true)}
  else if(m.type==="pline")S(p,sw);
  else if(m.type==="shape"){out.areaFill={pts:p,color:c,opacity:.2};S(p,4*k,true)}
  else if(m.type==="pen")S(p,sw);
  else if(m.type==="hl")S(p,26*k,false,.35);
  else if(m.type==="measure"){const[a,b]=p;S([a,b],3*k);const ang=Math.atan2(b[1]-a[1],b[0]-a[0]),nx=-Math.sin(ang)*8*k,ny=Math.cos(ang)*8*k;
    S([[a[0]-nx,a[1]-ny],[a[0]+nx,a[1]+ny]],3*k);S([[b[0]-nx,b[1]-ny],[b[0]+nx,b[1]+ny]],3*k);
    const t=measureText(Math.hypot(b[0]-a[0],b[1]-a[1]),m.scale||.25);out.texts.push({x:(a[0]+b[0])/2,y:(a[1]+b[1])/2-12*k,size:30*k,text:t,center:true,color:c,halo:true})}
  else if(m.type==="callout"){const[a,b]=p;const lines=wrap(m.text||"");const fs=36*k,lh=44*k,bw=Math.max(...lines.map(l=>l.length),4)*fs*.56+28*k,bh=lines.length*lh+20*k;
    const bx=b[0]-(b[0]<a[0]?bw:0),by=b[1]-bh/2;S([a,b],4*k);out.fills.push({pts:head(b,a,4*k*5),color:c});
    out.fills.push({pts:[[bx,by],[bx+bw,by],[bx+bw,by+bh],[bx,by+bh]],color:"#fffef8"});S([[bx,by],[bx+bw,by],[bx+bw,by+bh],[bx,by+bh]],4*k,true);
    lines.forEach((l,i)=>out.texts.push({x:bx+14*k,y:by+10*k+(i+1)*lh-4*k,size:fs,text:l,color:c}));
    out.callout={a,box:[bx,by,bw,bh]}}
  if(num&&p.length){const b=bbox(p),cx=b.x-4*k,cy=b.y-4*k,r=22*k,circ=[];for(let j=0;j<24;j++){const a=j/24*Math.PI*2;circ.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}
    out.fills.push({pts:circ,color:c});out.texts.push({x:cx,y:cy+10*k,size:26*k,text:String(num),center:true,color:"#ffffff"})}
  return out;
}

async function exportPdf(opts){
  const L=await loadLib();const{PDFDocument,PDFName,PDFString,PDFHexString,PDFArray,StandardFonts}=L;
  const doc=await PDFDocument.load(opts.bytes,{updateMetadata:false,ignoreEncryption:true});
  const font=await doc.embedFont(StandardFonts.Helvetica);
  const ctx=doc.context,author=ansi(opts.author||"Reviewer");
  const fmt=v=>+v.toFixed(3);
  let count=0;
  /* fill the PDF's own form fields with the typed Inputs values, so they print and show in any viewer */
  let filledFields=0;
  if(opts.fields){try{const form=doc.getForm();for(const[n,v]of Object.entries(opts.fields)){const t=String(v??"").trim();if(!t)continue;try{const f=form.getTextField(n);f.setText(ansi(t));try{const w=f.acroField.getWidgets()[0].getRectangle();f.setFontSize(Math.max(6,Math.min(w.height*.6,w.width/Math.max(1,t.length)*1.5)))}catch{}filledFields++}catch{}}
    if(filledFields)form.updateFieldAppearances(font)}catch(e){console.warn("inputs not written",e)}}
  for(const[pageNo,marks]of opts.byPage){
    const page=doc.getPage(pageNo-1),vp=opts.viewports[pageNo];
    const P=(x,y)=>vp.convertToPdfPoint(x,y);
    const o=P(0,0),ux=P(1,0),uy=P(0,-1);
    const ax=[ux[0]-o[0],ux[1]-o[1]],ay=[uy[0]-o[0],uy[1]-o[1]]; /* view right and view up, in PDF space */
    let annots=page.node.lookup(PDFName.of("Annots"));
    if(!(annots instanceof PDFArray)){annots=ctx.obj([]);page.node.set(PDFName.of("Annots"),annots)}
    const k=opts.k(pageNo);
    for(const m of marks){
      const sh=shapes(m,k,m.n);
      /* bounds in PDF space */
      const all=[];sh.strokes.forEach(s=>s.pts.forEach(q=>all.push([q,s.w])));sh.fills.forEach(f=>f.pts.forEach(q=>all.push([q,0])));
      sh.texts.forEach(t=>{const w=font.widthOfTextAtSize(ansi(t.text),t.size);const x0=t.center?t.x-w/2:t.x;all.push([[x0,t.y-t.size],t.size*.3],[[x0+w,t.y+t.size*.3],t.size*.3])});
      let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;
      for(const[q,w]of all){const r=P(q[0],q[1]);const pad=w/2+1;x1=Math.min(x1,r[0]-pad);y1=Math.min(y1,r[1]-pad);x2=Math.max(x2,r[0]+pad);y2=Math.max(y2,r[1]+pad)}
      if(!(x2>x1&&y2>y1))continue;
      /* appearance stream */
      const ops=[];const gsUsed={};
      const pt=q=>{const r=P(q[0],q[1]);return`${fmt(r[0])} ${fmt(r[1])}`};
      if(sh.areaFill){const[r,g,b]=hexRgb(sh.areaFill.color);gsUsed.GSa=sh.areaFill.opacity;const path=`${pt(sh.areaFill.pts[0])} m ${sh.areaFill.pts.slice(1).map(q=>pt(q)+" l").join(" ")} h`;
        ops.push(`q /GSa gs ${fmt(r)} ${fmt(g)} ${fmt(b)} rg ${path} f Q`);
        const H=sh.hatch;if(H){gsUsed.GSt=H.opacity;ops.push(`q ${path} W n /GSt gs ${fmt(r)} ${fmt(g)} ${fmt(b)} RG ${fmt(H.w)} w ${H.lines.map(l=>pt(l[0])+" m "+pt(l[1])+" l").join(" ")} S Q`)}}
      for(const f of sh.fills){const[r,g,b]=hexRgb(f.color);ops.push(`${fmt(r)} ${fmt(g)} ${fmt(b)} rg ${pt(f.pts[0])} m ${f.pts.slice(1).map(q=>pt(q)+" l").join(" ")} h f`)}
      for(const s of sh.strokes){const[r,g,b]=hexRgb(s.color);let gs="";if(s.opacity<1){gsUsed.GSh=s.opacity;gs="/GSh gs "}
        const dash=s.dash?`[${s.dash.map(fmt).join(" ")}] 0 d 0 J `:"1 J ";
        ops.push(`q ${gs}${fmt(r)} ${fmt(g)} ${fmt(b)} RG ${fmt(s.w)} w ${dash}1 j ${pt(s.pts[0])} m ${s.pts.slice(1).map(q=>pt(q)+" l").join(" ")} ${s.closed?"h ":""}S Q`)}
      /* the number badge circle is drawn after strokes so it sits on top */
      for(const t of sh.texts){const txt=ansi(t.text);if(!txt)continue;const w=font.widthOfTextAtSize(txt,t.size);const x0=t.center?t.x-w/2:t.x;const r0=P(x0,t.y);
        const[r,g,b]=hexRgb(t.color);const hex=font.encodeText(txt).toString();
        if(t.halo)ops.push(`q 1 1 1 RG ${fmt(t.size*.25)} w 1 j 1 Tr BT /Helv ${fmt(t.size)} Tf ${fmt(ax[0])} ${fmt(ax[1])} ${fmt(ay[0])} ${fmt(ay[1])} ${fmt(r0[0])} ${fmt(r0[1])} Tm ${hex} Tj ET Q`);
        ops.push(`q ${fmt(r)} ${fmt(g)} ${fmt(b)} rg BT /Helv ${fmt(t.size)} Tf ${fmt(ax[0])} ${fmt(ax[1])} ${fmt(ay[0])} ${fmt(ay[1])} ${fmt(r0[0])} ${fmt(r0[1])} Tm ${hex} Tj ET Q`)}
      if(sh.fills.length&&m.n){/* re-draw badge (last fill + last text) above strokes */
        const f=sh.fills[sh.fills.length-1],t=sh.texts[sh.texts.length-1];const[r,g,b]=hexRgb(f.color);
        ops.push(`${fmt(r)} ${fmt(g)} ${fmt(b)} rg ${pt(f.pts[0])} m ${f.pts.slice(1).map(q=>pt(q)+" l").join(" ")} h f`);
        const txt=ansi(t.text),w=font.widthOfTextAtSize(txt,t.size),r0=P(t.x-w/2,t.y);
        ops.push(`q 1 1 1 rg BT /Helv ${fmt(t.size)} Tf ${fmt(ax[0])} ${fmt(ax[1])} ${fmt(ay[0])} ${fmt(ay[1])} ${fmt(r0[0])} ${fmt(r0[1])} Tm ${font.encodeText(txt).toString()} Tj ET Q`)}
      const res={Font:{Helv:font.ref}};
      const eg={};for(const[n,v]of Object.entries(gsUsed))eg[n]={Type:"ExtGState",CA:v,ca:v};if(Object.keys(eg).length)res.ExtGState=eg;
      const ap=ctx.flateStream(ops.join("\n"),{Type:"XObject",Subtype:"Form",BBox:[fmt(x1),fmt(y1),fmt(x2),fmt(y2)],Resources:res});
      const apRef=ctx.register(ap);
      /* annotation dictionary */
      const [cr,cg,cb]=hexRgb(m.color);
      const what=(LABEL[m.type]||m.type)+(m.type==="measure"?" "+measureText(Math.hypot(m.pts[1][0]-m.pts[0][0],m.pts[1][1]-m.pts[0][1]),m.scale||.25):"");
      const sref=m.std&&window.WWSTD&&window.WWSTD.byId[m.std];const contents=`#${m.n} ${what}${m.text?": "+m.text.trim():""}${sref?` [${sref.ref} ${sref.name}]`:""}`;
      const d={Type:"Annot",Rect:[fmt(x1),fmt(y1),fmt(x2),fmt(y2)],C:[fmt(cr),fmt(cg),fmt(cb)],F:4,
        T:PDFHexString.fromText(opts.author||"Reviewer"),Contents:PDFHexString.fromText(contents),M:PDFString.of(pdfDate(m.updatedAt||m.createdAt||Date.now())),
        NM:PDFString.of("ww-"+m.id),Subj:PDFHexString.fromText("WOODWERD Redline "+(LABEL[m.type]||m.type)),AP:{N:apRef},BS:{W:fmt(5*k)}};
      const flat=pts=>pts.flatMap(q=>P(q[0],q[1])).map(fmt);
      if(m.type==="cloud"||m.type==="rect"){d.Subtype="Square";if(m.type==="cloud")d.BE={S:"C",I:1}}
      else if(m.type==="arrow"){d.Subtype="Line";d.L=flat(m.pts.slice(0,2));d.LE=["None","OpenArrow"]}
      else if(m.type==="cl"||m.type==="dash"){d.Subtype="Line";d.L=flat(m.pts.slice(0,2));d.LE=["None","None"];d.BS={W:fmt((m.type==="cl"?3.5:4)*k),S:"D",D:(m.type==="cl"?[70,16,14,16]:[24,14]).map(v=>fmt(v*k))}}
      else if(m.type==="xout"){d.Subtype="Square"}
      else if(m.type==="area"){d.Subtype="Polygon";d.Vertices=flat(m.pts);d.BS={W:fmt(4*k)}}
      else if(m.type==="shape"){d.Subtype="Polygon";d.Vertices=flat(m.pts);d.BS={W:fmt(4*k)};d.IC=[fmt(cr),fmt(cg),fmt(cb)];d.CA=1}
      else if(m.type==="pline"){d.Subtype="PolyLine";d.Vertices=flat(m.pts);d.BS={W:fmt(5*k)}}
      else if(m.type==="measure"){d.Subtype="Line";d.L=flat(m.pts.slice(0,2));d.LE=["Butt","Butt"];d.IT="LineDimension";d.Cap=true}
      else if(m.type==="pen"||m.type==="hl"){d.Subtype="Ink";d.InkList=[flat(m.pts)];if(m.type==="hl"){d.CA=.35;d.BS={W:fmt(26*k)}}}
      else if(m.type==="callout"){d.Subtype="FreeText";d.IT="FreeTextCallout";d.DA=PDFString.of(`/Helv ${fmt(36*k)} Tf ${fmt(cr)} ${fmt(cg)} ${fmt(cb)} rg`);
        d.CL=flat([m.pts[0],m.pts[1]]);
        d.Contents=PDFHexString.fromText(m.text||"")}
      else d.Subtype="Square";
      const ref=ctx.register(ctx.obj(d));annots.push(ref);
      /* popup so the note opens in viewers that show comment bubbles */
      count++;
    }
  }
  return{bytes:await doc.save({useObjectStreams:false}),count,filledFields};
}
window.WWExport={exportPdf,loadLib};
})();
