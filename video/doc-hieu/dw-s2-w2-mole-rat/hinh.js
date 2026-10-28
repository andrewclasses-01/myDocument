// Hình minh hoạ kiểu sách giáo khoa (mẫu v3 thầy chốt 27/10/2026): chuột chũi trụi lông, ong, kiến.
// Các hàm vẽ chép nguyên từ "myStudio - thiet ke/thu-chuot/1-minh-hoa-v3/index.html" — muốn sửa dáng con vật thì sửa ở đó rồi chạy lại tao-hinh.js.
// HINH.nap() dựng sẵn từng ảnh (SVG → Image) trước khi phim bắt đầu; art.js dùng HINH.anh[ten] + HINH.khung[ten].
const HINH = (() => {
const NS = 'http://www.w3.org/2000/svg';
function rng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const f1 = n => Math.round(n*10)/10;
const pt = p => f1(p[0])+','+f1(p[1]);
const lerp=(a,b,t)=>a+(b-a)*t;
// Catmull-Rom -> cubic bezier
function smooth(pts, closed=false, k=1){
  const n=pts.length; let d='M'+pt(pts[0]);
  const last = closed? n : n-1;
  for(let i=0;i<last;i++){
    const p0=pts[closed?(i-1+n)%n:Math.max(i-1,0)], p1=pts[i], p2=pts[(i+1)%n], p3=pts[closed?(i+2)%n:Math.min(i+2,n-1)];
    const c1=[p1[0]+(p2[0]-p0[0])/6*k, p1[1]+(p2[1]-p0[1])/6*k];
    const c2=[p2[0]-(p3[0]-p1[0])/6*k, p2[1]-(p3[1]-p1[1])/6*k];
    d+='C'+pt(c1)+' '+pt(c2)+' '+pt(p2);
  }
  return d+(closed?'Z':'');
}
// sample a path: outline points + top/bottom edge lookup by x
const probe=document.createElementNS(NS,'svg'); probe.setAttribute('style','position:absolute;left:-9999px;top:0;visibility:hidden'); document.body.appendChild(probe);
function edges(d){
  const p=document.createElementNS(NS,'path'); p.setAttribute('d',d); probe.appendChild(p);
  const L=p.getTotalLength(), N=Math.ceil(L/2), pts=[], top={}, bot={};
  let minx=1e9,maxx=-1e9;
  for(let i=0;i<=N;i++){const q=p.getPointAtLength(L*i/N); pts.push([q.x,q.y]); const k=Math.round(q.x/2);
    if(top[k]===undefined||q.y<top[k])top[k]=q.y; if(bot[k]===undefined||q.y>bot[k])bot[k]=q.y; minx=Math.min(minx,q.x);maxx=Math.max(maxx,q.x);}
  const get=(m,x)=>{let k=Math.round(Math.min(Math.max(x,minx),maxx)/2); for(let j=0;j<40;j++){if(m[k+j]!==undefined)return m[k+j]; if(m[k-j]!==undefined)return m[k-j];} return 0;};
  return {pts, top:x=>get(top,x), bot:x=>get(bot,x), minx, maxx};
}
const line=(a,b,c,w,o=1)=>`<path d="M${pt(a)}L${pt(b)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${o}" fill="none"/>`;
// jointed limb: outline stroke + fill stroke + highlight
function limb(pts, w, fill, edge, hi, taper=0.75){
  let s='';
  for(let i=0;i<pts.length-1;i++){
    const ww = w*Math.pow(taper,i);
    s+=`<path d="M${pt(pts[i])}L${pt(pts[i+1])}" stroke="${edge}" stroke-width="${f1(ww+2.6)}" stroke-linecap="round" fill="none"/>`;
  }
  for(let i=0;i<pts.length-1;i++){
    const ww = w*Math.pow(taper,i);
    s+=`<path d="M${pt(pts[i])}L${pt(pts[i+1])}" stroke="${fill}" stroke-width="${f1(ww)}" stroke-linecap="round" fill="none"/>`;
    if(hi){const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=dy/l*ww*0.22,ny=-dx/l*ww*0.22;
      const sg = ny<0?1:-1; s+=line([a[0]+nx*sg+dx*.15,a[1]+ny*sg+dy*.15],[b[0]+nx*sg-dx*.15,b[1]+ny*sg-dy*.15],hi,Math.max(ww*0.25,0.8),0.8);}
  }
  return s;
}
// skin fold: shadow groove + light crest next to it (light from top-left)
function fold(d, w, a, shadow='120,62,56', light='255,238,230'){
  // soft blurred groove + crisp crease + soft highlight on the lit (upper-left) side = a fold with volume
  return `<path d="${d}" stroke="rgba(${shadow},${f1(a*0.55*100)/100})" stroke-width="${f1(w*3.2)}" fill="none" stroke-linecap="round" filter="url(#fblur)" transform="translate(${f1(w*0.6)},${f1(w*0.4)})"/>`+
         `<path d="${d}" stroke="rgba(${shadow},${f1(a*0.6*100)/100})" stroke-width="${f1(w*0.6)}" fill="none" stroke-linecap="round"/>`+
         `<path d="${d}" transform="translate(-${f1(w*1.5)},-${f1(w*0.9)})" stroke="rgba(${light},${f1(a*0.85*100)/100})" stroke-width="${f1(w*1.4)}" fill="none" stroke-linecap="round" filter="url(#fblur)"/>`;
}
let DEFS=[]; // shared defs collected here

/* ---------------- Naked mole rat, side view, facing right. Ground = y 0.
   Rump ~x 0, nose ~x 792, incisor tips ~x 880, tail tip ~x -190. Drawn at 1:1 pixel size (body+head ~800 px). ---------------- */
// tapered tube along a centre line with a width per point (legs, tusks, tail)
function tube(c, ws, k=0.9){const L=[],R=[]; for(let i=0;i<c.length;i++){const a=c[Math.max(i-1,0)],b=c[Math.min(i+1,c.length-1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,w=ws[i]/2;
  L.push([c[i][0]-dy/l*w,c[i][1]+dx/l*w]); R.push([c[i][0]+dy/l*w,c[i][1]-dx/l*w]);} return smooth([...L,...R.reverse()],true,k);}
function moleRatSide(id='mr', o={}){
  const r=rng(o.seed||11);
  const SKE='#ad675e';
  // silhouette: narrow hips -> broad chest -> collar of skin rolls -> lower, wedge-shaped head
  const P=[[30,-66],[6,-92],[0,-126],[10,-160],[38,-192],[82,-214],[146,-234],[226,-250],[306,-259],[386,-263],[452,-262],[500,-255],
    [526,-237],[542,-240],[562,-228],[580,-231],[600,-219],[624,-214],[664,-205],[704,-192],[738,-176],[764,-160],[782,-144],[791,-128],[790,-114],[781,-103],
    [766,-96],[758,-86],[762,-73],[756,-61],[734,-53],[702,-53],[676,-56],[660,-50],[644,-55],[626,-48],[602,-47],[566,-44],[520,-40],[460,-29],[400,-25],[330,-28],[262,-38],[200,-50],[140,-58],[80,-62]];
  const body=smooth(P,true,1);
  const E=edges(body);
  DEFS.push(`
   <linearGradient id="${id}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7a69c"/><stop offset=".22" stop-color="#f1c9bb"/><stop offset=".5" stop-color="#f7d4c6"/><stop offset=".78" stop-color="#f0b9aa"/><stop offset="1" stop-color="#d9988c"/></linearGradient>
   <linearGradient id="${id}ln" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9f5d55" stop-opacity=".35"/><stop offset=".1" stop-color="#9f5d55" stop-opacity="0"/><stop offset=".9" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff3ec" stop-opacity=".2"/></linearGradient>
   <clipPath id="${id}cb"><path d="${body}"/></clipPath>
   <filter id="${id}tex" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="5"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .30  0 0 0 0 .30  0 0 0 1.5 -.6"/></filter>
   <filter id="${id}b3" filterUnits="userSpaceOnUse" x="-600" y="-700" width="1800" height="900"><feGaussianBlur stdDeviation="3"/></filter>
   <filter id="${id}b6" filterUnits="userSpaceOnUse" x="-600" y="-700" width="1800" height="900"><feGaussianBlur stdDeviation="6"/></filter>
   <filter id="${id}b14" filterUnits="userSpaceOnUse" x="-600" y="-700" width="1800" height="900"><feGaussianBlur stdDeviation="14"/></filter>
   <linearGradient id="${id}tooth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde9b4"/><stop offset=".4" stop-color="#f2bb62"/><stop offset="1" stop-color="#c47a2a"/></linearGradient>
   <linearGradient id="${id}tail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dba297"/><stop offset=".45" stop-color="#f4cdbf"/><stop offset="1" stop-color="#c98a7f"/></linearGradient>
   <linearGradient id="${id}lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6d2c4"/><stop offset=".6" stop-color="#eebbac"/><stop offset="1" stop-color="#d89a8e"/></linearGradient>
   <linearGradient id="${id}ft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4cbbd"/><stop offset="1" stop-color="#dd9f92"/></linearGradient>
   <linearGradient id="${id}lp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c4b5"/><stop offset="1" stop-color="#d9978a"/></linearGradient>
   <linearGradient id="${id}lf" gradientUnits="userSpaceOnUse" x1="0" y1="-84" x2="0" y2="-50"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
   <mask id="${id}lm" maskUnits="userSpaceOnUse" x="-400" y="-400" width="1600" height="460"><rect x="-400" y="-400" width="1600" height="460" fill="url(#${id}lf)"/></mask>
  `);
  // deep crease: dark soft groove on the shaded side + crisp crease + lit ridge of the next roll
  const deep=(d,w,a)=>`<path d="${d}" stroke="rgba(118,54,50,${f1(a*.55*100)/100})" stroke-width="${f1(w*6)}" fill="none" stroke-linecap="round" filter="url(#${id}b3)" transform="translate(${f1(-w*1.4)},${f1(-w*.5)})"/>`+
    `<path d="${d}" stroke="rgba(255,242,234,${f1(a*.8*100)/100})" stroke-width="${f1(w*3.4)}" fill="none" stroke-linecap="round" filter="url(#${id}b3)" transform="translate(${f1(w*3)},${f1(w*1.2)})"/>`+
    `<path d="${d}" stroke="rgba(106,44,40,${a})" stroke-width="${f1(w*1.1)}" fill="none" stroke-linecap="round"/>`;
  let s='';
  // contact shadow
  s+=`<ellipse cx="400" cy="3" rx="470" ry="16" fill="#2a1a10" opacity=".5" filter="url(#${id}b14)"/>`;
  // ---- far-side legs (behind the body, darker); mid-walk: far front back, far hind forward
  s+=leg([590,-100],[552,-32],[546,-16],[524,0],70,true);
  s+=leg([200,-110],[250,-36],[206,-16],[184,0],84,true);
  // ---- tail: thin, hairless, ringed, drooping to the floor
  const tc=[[24,-104],[-14,-100],[-52,-84],[-82,-58],[-100,-32],[-108,-12],[-100,-4],[-80,-3],[-60,-6]];
  const tw=[28,22,17,13.5,11,8.5,6,4,1.8];
  const tailD=tube(tc,tw,0.9);
  s+=`<path d="${tailD}" fill="url(#${id}tail)" stroke="${SKE}" stroke-width="1.8"/>`;
  s+=`<clipPath id="${id}ct"><path d="${tailD}"/></clipPath><g clip-path="url(#${id}ct)">`;
  for(let i=1;i<40;i++){const t=i/40; const k=t*(tc.length-1), j=Math.floor(k), f=k-j; const a=tc[j], b=tc[Math.min(j+1,tc.length-1)];
    const x=lerp(a[0],b[0],f), y=lerp(a[1],b[1],f), w=lerp(tw[j],tw[Math.min(j+1,tw.length-1)],f); const dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1, nx=-dy/l, ny=dx/l;
    s+=`<path d="M${f1(x+nx*w)},${f1(y+ny*w)} Q${f1(x-dx/l*3)},${f1(y-dy/l*3)} ${f1(x-nx*w)},${f1(y-ny*w)}" stroke="rgba(150,78,70,.35)" stroke-width="1" fill="none"/>`;}
  s+=`<path d="${smooth(tc.map((p,i)=>[p[0]+1,p[1]-tw[i]*0.22]))}" stroke="rgba(255,242,234,.6)" stroke-width="2.4" fill="none"/></g>`;
  // ---- body
  s+=`<path d="${body}" fill="url(#${id}sk)"/>`;
  s+=`<g clip-path="url(#${id}cb)">`;
  s+=`<rect x="-20" y="-280" width="840" height="280" filter="url(#${id}tex)" opacity=".34"/>`;
  s+=`<rect x="-20" y="-280" width="840" height="280" fill="url(#${id}ln)"/>`;
  // darker, greyer back (pigment) along the top edge
  s+=`<path d="${smooth(P.slice(1,22).map(p=>[p[0],p[1]+4]))}" stroke="#a7766f" stroke-width="34" fill="none" opacity=".42" filter="url(#${id}b14)"/>`;
  // lit band a little below the back = round volume
  s+=`<path d="M70,-170 C180,-210 330,-222 470,-214 C560,-206 640,-184 720,-154" stroke="#fff4ee" stroke-width="26" fill="none" opacity=".55" filter="url(#${id}b14)"/>`;
  // translucent warm belly + shadow under it
  s+=`<path d="M60,-70 C200,-80 420,-74 640,-80 L640,10 L60,10Z" fill="#e58e80" opacity=".28" filter="url(#${id}b14)"/>`;
  s+=`<path d="M70,-50 C200,-56 420,-46 620,-56" stroke="#8d4842" stroke-width="18" fill="none" opacity=".35" filter="url(#${id}b14)"/>`;
  // rump shadow + head/cheek volume
  s+=`<path d="M20,-190 C-6,-140 0,-90 40,-60" stroke="#94504a" stroke-width="30" opacity=".28" fill="none" filter="url(#${id}b14)"/>`;
  s+=`<ellipse cx="690" cy="-128" rx="62" ry="40" fill="#fff2ea" opacity=".42" filter="url(#${id}b6)"/>`;
  s+=`<path d="M630,-68 C670,-74 712,-72 752,-66" stroke="#8d4842" stroke-width="12" opacity=".35" fill="none" filter="url(#${id}b6)"/>`;
  // faint veins (translucent skin)
  for(let i=0;i<9;i++){const x=110+r()*420,y=E.top(x)+40+r()*110; let d='M'+f1(x)+','+f1(y); let cx=x,cy=y; for(let j=0;j<5;j++){cx+= -10+r()*40; cy+= -6+r()*14; d+=' L'+f1(cx)+','+f1(cy);} s+=`<path d="${d}" stroke="#c45a55" stroke-width="1.1" opacity=".15" fill="none"/>`;}
  // fine wrinkles everywhere: short broken transverse lines
  for(let i=0;i<60;i++){const x=40+r()*620; const t=E.top(x), b=E.bot(x); const f0=.05+r()*.75, f1_=Math.min(f0+.1+r()*.16,.98); const y0=lerp(t,b,f0), y1=lerp(t,b,f1_); const bw=5+r()*6;
    s+=fold(`M${f1(x+2)},${f1(y0)} Q${f1(x-bw)},${f1((y0+y1)/2)} ${f1(x+1)},${f1(y1)}`,0.7+r()*.3,.16+r()*.1);}
  // longitudinal fine wrinkles on the flank
  for(let j=0;j<5;j++){const xa=120+r()*120, xb=380+r()*160, fy=.45+j*.08; const ps=[]; for(let k=0;k<=10;k++){const x=lerp(xa,xb,k/10); ps.push([x, lerp(E.top(x),E.bot(x),fy)+Math.sin(k*1.4+j)*3]);} s+=fold(smooth(ps),.7,.16);}
  // ---- DEEP folds
  const vf=(xt,xb,bow,w,a,f0=0,f1_=1)=>{const yt=lerp(E.top(xt),E.bot(xt),f0)+3, yb=lerp(E.top(xb),E.bot(xb),f1_)-3; return deep(`M${f1(xt)},${f1(yt)} C${f1(xt+bow)},${f1(lerp(yt,yb,.35))} ${f1(xb+bow)},${f1(lerp(yt,yb,.7))} ${f1(xb)},${f1(yb)}`,w,a);};
  // collar of loose skin behind the head (deepest)
  s+=vf(528,560,-20,2.6,.85); s+=vf(564,600,-18,2.6,.85); s+=vf(602,640,-16,2.3,.8); s+=vf(626,662,-10,1.6,.55,0.08,0.95);
  s+=vf(492,522,-18,2.1,.6,0.02,0.7); s+=vf(470,488,-14,1.5,.4,0.05,0.55);
  // hip / lumbar rolls
  s+=vf(70,84,-16,1.7,.45,0.08,0.62); s+=vf(110,122,-14,1.3,.34,0.05,0.5); s+=vf(300,312,-12,1.2,.28,0.04,0.5);
  // belly sag: loose skin hanging under the body
  for(const [xa,xb,dy] of [[200,330,0],[316,470,3],[452,600,-2]]){const ps=[]; for(let k=0;k<=8;k++){const x=lerp(xa,xb,k/8); ps.push([x, E.bot(x)-24-dy-Math.sin(k/8*Math.PI)*7+Math.sin(k*1.9+xa)*1.5]);} s+=deep(smooth(ps),1.8,.55);}
  {const ps=[]; for(let k=0;k<=10;k++){const x=lerp(250,540,k/10); ps.push([x, E.bot(x)-46-Math.sin(k/10*Math.PI)*8+Math.sin(k*1.7)*2]);} s+=deep(smooth(ps),1.2,.35);}
  // folds around the legs (where the limbs leave the body)
  s+=deep('M108,-146 C142,-166 196,-152 212,-112',1.6,.42);
  // face wrinkles (muzzle, brow)
  for(let i=0;i<5;i++){const x=716+i*11; s+=fold(`M${x},${f1(E.top(x)+8)} Q${x-9},${f1(lerp(E.top(x),E.bot(x),.4))} ${x-2},${f1(lerp(E.top(x),E.bot(x),.62))}`,0.9,.36);}
  s+=deep('M664,-176 Q692,-166 724,-170',1,.4);
  s+=`</g>`;
  s+=`<path d="${body}" fill="none" stroke="${SKE}" stroke-width="2.2" opacity=".9"/>`;
  // ---- head details
  // ear hole (no external ear)
  s+=deep('M630,-168 C640,-174 652,-170 654,-160',0.8,.45); s+=`<ellipse cx="643" cy="-161" rx="3.4" ry="2.4" fill="#8f4c45"/>`;
  // tiny eye with lid folds
  s+=fold('M696,-171 Q706,-178 716,-170',0.9,.5)+fold('M698,-160 Q707,-156 715,-161',0.8,.4);
  s+=`<circle cx="706" cy="-166" r="3.4" fill="#24110f"/><circle cx="705" cy="-167.3" r="1.1" fill="#fff" opacity=".8"/>`;
  // nose pad + nostril
  s+=`<path d="M778,-150 C790,-142 796,-126 794,-114 C788,-108 780,-111 776,-118 C772,-130 772,-142 778,-150Z" fill="#df978c" stroke="#b9746a" stroke-width="1"/>`;
  s+=`<path d="M788,-132 q-6,2 -5,9 q5,-1 7,-5Z" fill="#6a3330"/>`;
  // furry lips that close BEHIND the incisors: upper lip pad, lower lip / chin pad, mouth seam between
  s+=`<path d="M734,-122 C752,-126 776,-122 788,-112 C794,-102 786,-90 770,-88 C756,-86 742,-88 735,-95 C729,-104 728,-116 734,-122Z" fill="url(#${id}lp)" stroke="${SKE}" stroke-width="1.2"/>`;
  s+=`<path d="M730,-86 C746,-90 762,-84 764,-72 C765,-60 756,-51 742,-50 C730,-50 721,-57 722,-68 C723,-78 726,-84 730,-86Z" fill="url(#${id}lp)" stroke="${SKE}" stroke-width="1.2"/>`;
  s+=`<path d="M732,-88 C744,-87 756,-87 768,-87" stroke="#8a423c" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  for(let i=0;i<34;i++){const up=i<18; const x=up?738+r()*46:726+r()*36, y=up?-118+r()*26:-82+r()*28; s+=line([x,y],[x+2+r()*4,y+(up?2:-2)+r()*3],'#fff4ec',0.8,.9);}
  // whiskers (sparse, fine) + a few long sensory hairs on the head
  for(let i=0;i<8;i++){const x0=748+r()*36, y0=-150+r()*30, L=34+r()*36, ang=(-40+r()*55)*Math.PI/180; const x1=x0+Math.cos(ang)*L, y1=y0+Math.sin(ang)*L;
    s+=`<path d="M${f1(x0)},${f1(y0)} Q${f1((x0+x1)/2)},${f1((y0+y1)/2-6)} ${f1(x1)},${f1(y1)}" stroke="#fffaf4" stroke-width="1.1" fill="none" opacity=".9"/>`;}
  // incisors: long yellow-orange tusks standing out in front of the lips. far pair first (darker, offset), near pair on top.
  // tooth = curved tapering tusk with a bevelled chisel tip. x0,y0 root, a0 start heading (deg, + = down), turn (deg), len, root/tip width
  const tusk=(x0,y0,a0,turn,len,w0,w1)=>{const N=12,C=[],W=[]; let x=x0,y=y0; for(let i=0;i<=N;i++){const t=i/N, an=(a0+turn*t)*Math.PI/180; C.push([x,y,an]); W.push(lerp(w0,w1,Math.pow(t,0.8))); x+=Math.cos(an)*len/N; y+=Math.sin(an)*len/N;}
    const L=[],R=[]; C.forEach((c,i)=>{const nx=-Math.sin(c[2]), ny=Math.cos(c[2]); L.push([c[0]-nx*W[i]/2,c[1]-ny*W[i]/2]); R.push([c[0]+nx*W[i]/2,c[1]+ny*W[i]/2]);});
    const e=C[N], bev=[e[0]+Math.cos(e[2])*w1*0.9, e[1]+Math.sin(e[2])*w1*0.9];  // chisel: the outer edge runs on, the inner edge is cut back
    const tipSide = turn>=0 ? L : R; tipSide[N]=[(tipSide[N][0]+bev[0])/2+ (bev[0]-e[0])*0.6,(tipSide[N][1]+bev[1])/2+(bev[1]-e[1])*0.6];
    return {d:smooth([...L,...R.slice().reverse()],true,0.7), C, W};};
  // v3 (thầy chốt phong cách này 27/10): răng thu về tỉ lệ thật — trên chếch xuống-trước, dưới chếch lên-trước, hai đầu răng gặp nhau
  // trước miệng (lộ ra ~1/2 chiều cao đầu), không còn "ngà" dài
  const UP=tusk(780,-110,56,14,40,17,10), LO=tusk(758,-62,-16,10,46,16,9);
  const T=(t,dx,dy,fill,sw=1.5)=>`<path transform="translate(${dx},${dy})" d="${t.d}" fill="${fill}" stroke="#8f5118" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const shine=(t,side,o)=>{const ps=t.C.slice(2,11).map((c,i)=>{const w=t.W[i+2]*0.28*side; return [c[0]+Math.sin(c[2])*w, c[1]-Math.cos(c[2])*w];}); return `<path d="${smooth(ps)}" stroke="#fff6d8" stroke-width="2.2" fill="none" opacity="${o}" stroke-linecap="round"/>`;};
  s+=`<ellipse cx="772" cy="-110" rx="10" ry="8" fill="#7a3a32" opacity=".5" filter="url(#${id}b3)"/><ellipse cx="748" cy="-53" rx="10" ry="8" fill="#7a3a32" opacity=".5" filter="url(#${id}b3)"/>`;
  s+=T(LO,-2,-4,'#b9772c',1.2)+T(UP,-4,-1,'#b9772c',1.2);           // far-side pair, just peeking out behind
  s+=T(LO,0,0,`url(#${id}tooth)`)+shine(LO,1,.85);
  s+=T(UP,0,0,`url(#${id}tooth)`)+shine(UP,1,.85);
  // skin collars where the tusks leave the jaw (hide the root ends)
  // v3: bỏ 2 "cổ răng" tròn (trông lổn nhổn) — chân răng giấu bằng mép môi mềm, không viền
  s+=`<path d="M772,-122 C784,-122 790,-114 788,-106 C782,-102 774,-104 770,-110 C768,-115 769,-120 772,-122Z" fill="url(#${id}lp)"/>`;
  s+=`<path d="M748,-70 C758,-72 764,-66 762,-58 C756,-54 748,-56 745,-62 C744,-66 745,-69 748,-70Z" fill="url(#${id}lp)"/>`;
  // ---- near-side legs (in front of the body, fading into the skin at the top); mid-walk: near front forward, near hind back
  s+=leg([616,-96],[592,-32],[642,-18],[628,0],82,false);
  s+=leg([150,-100],[188,-36],[126,-17],[104,0],94,false);
  // ---- sparse fine hairs on the body (and a few sticking out at the outline)
  for(let i=0;i<30;i++){const x=60+r()*680; const t=E.top(x), b=E.bot(x); const y=lerp(t+8,b-8,r()); const L=7+r()*9; const a=(200+r()*30)*Math.PI/180;
    s+=line([x,y+1],[x+Math.cos(a)*L,y+1+Math.sin(a)*L],'rgba(150,90,80,.3)',1); s+=line([x,y],[x+Math.cos(a)*L,y+Math.sin(a)*L],'#fffaf5',0.8,.9);}
  for(let i=0;i<20;i++){const x=40+r()*700; const y=E.top(x)+1; const L=9+r()*11; const a=(205+r()*35)*Math.PI/180; s+=line([x,y],[x+Math.cos(a)*L,y+Math.sin(a)*L],'#fff6ee',0.9,.75);}
  return s;

  // leg: shoulder/hip (hidden in body) -> elbow/knee (bent) -> wrist/ankle -> big flat foot: heel h, length len
  function leg(sh, el, wr, h, len, far){
    let g='';
    const fill= far?'#c98a80':`url(#${id}lg)`, edge= far?'#9a5a52':SKE;
    const tub=tube([sh,el,wr],[64,34,24],0.9);
    let lg=`<path d="${tub}" fill="${fill}" stroke="${edge}" stroke-width="1.6"/>`;
    if(!far){ // elbow/knee crease + highlight on the limb
      lg+=deep(`M${f1(el[0]-12)},${f1(el[1]-6)} Q${f1(el[0])},${f1(el[1]+4)} ${f1(el[0]+12)},${f1(el[1]-4)}`,0.9,.4);
      lg+=line([lerp(sh[0],el[0],.55)-6,lerp(sh[1],el[1],.55)],[el[0]-5,el[1]-6],'#fff2ea',4,.45);
    }
    g+= far? lg : `<g mask="url(#${id}lm)">${lg}</g>`;
    // ---- foot: 5 pale toes fanned (far toes higher), sole, fringe of stiff hairs
    const bx=h[0]+len*0.5, gy=h[1], tl=len*0.5;
    const toes=[[-2,-23,.5],[2,-16,.8],[4,-9.5,1],[2,-4.5,.92],[-2,-1.2,.7]];
    for(let j=0;j<5;j++){const [dx,ty,lf]=toes[j]; const x0=bx-8, y0=gy-15+j*3.2, tx=bx+tl*lf+dx, tyy=gy+ty;
      const c= far?['#b97c73','#c0837a','#c88a81','#cf9187','#d4978d'][j]:['#efc3b5','#f3cabd','#f7d4c8','#f9dbd0','#fbe2d8'][j];
      g+=`<path d="M${f1(x0)},${f1(y0)} L${f1(tx)},${f1(tyy)}" stroke="${edge}" stroke-width="${far?8.5:10}" stroke-linecap="round"/><path d="M${f1(x0)},${f1(y0)} L${f1(tx)},${f1(tyy)}" stroke="${c}" stroke-width="${far?6.3:7.4}" stroke-linecap="round"/>`;
      g+=`<circle cx="${f1(tx-1)}" cy="${f1(tyy+0.5)}" r="${far?2.4:3}" fill="${far?'#d9a49a':'#fff0e8'}" opacity=".8"/><path d="M${f1(tx+2)},${f1(tyy-3)} q4,1 4.5,5" stroke="${far?'#d8c6b6':'#fbf1e2'}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
      for(let q=0;q<3;q++){const xx=lerp(x0,tx,0.35+q*0.22), yy=lerp(y0,tyy,0.35+q*0.22)+3.4; const an=(55+r()*70)*Math.PI/180; g+=line([xx,yy],[xx+Math.cos(an)*4.5,yy+Math.sin(an)*4.5],far?'#e3cfc7':'#fffaf4',0.7,.8);}}
    const F=smooth([[h[0]+3,gy],[h[0]-3,gy-7],[h[0]+len*.2,gy-19],[bx-6,gy-21],[bx+2,gy-15],[bx+3,gy-6],[bx-3,gy]],true,1);
    g+=`<path d="${F}" fill="${far?'#c98a80':`url(#${id}ft)`}" stroke="${edge}" stroke-width="1.5"/>`;
    if(!far) g+=line([h[0]+6,gy-11],[bx-12,gy-15],'#fff2ea',2.5,.5);
    g+=fold(`M${f1(h[0]+len*.2)},${f1(gy-17)} Q${f1(h[0]+len*.28)},${f1(gy-10)} ${f1(h[0]+len*.36)},${f1(gy-17)}`,0.8,.35);
    // fringe of stiff hairs along the sole edge
    for(let i=0;i<=12;i++){const x=lerp(h[0]-2,bx+4,i/12)+(r()-.5)*3; const an=(65+r()*60)*Math.PI/180, L=3.5+r()*3.5; g+=line([x,gy-1],[x+Math.cos(an)*L,gy-1+Math.sin(an)*L],far?'#e9d6cf':'#fffaf4',0.8,.8);}
    for(let i=0;i<5;i++){const x=lerp(h[0],h[0]+len*.2,i/4); const y=lerp(gy-6,gy-17,i/4); const an=(190+r()*40)*Math.PI/180; g+=line([x-2,y],[x-2+Math.cos(an)*5,y+Math.sin(an)*5],far?'#e9d6cf':'#fffaf4',0.7,.75);}
    return g;
  }
}

/* ---------------- Naked mole rat face, front view. (0,0) = nose; head is BROAD and FLAT (about 1.4 : 1); chin ~ y 256 ---------------- */
function moleRatFace(id='mf', o={}){
  const r=rng(o.seed||23);
  const head='M0,-176 C100,-178 190,-172 240,-146 C288,-120 302,-52 300,8 C298,70 278,128 234,172 C184,222 100,252 0,254 C-100,252 -184,222 -234,172 C-278,128 -298,70 -300,8 C-302,-52 -288,-120 -240,-146 C-190,-172 -100,-178 0,-176Z';
  const E=edges(head);
  const EDGE='#ac6a62';
  DEFS.push(`
   <radialGradient id="${id}sk" cx="0.42" cy="0.32" r="0.72"><stop offset="0" stop-color="#fbe2d6"/><stop offset=".5" stop-color="#f2c6b6"/><stop offset=".85" stop-color="#e2a294"/><stop offset="1" stop-color="#cd8a7e"/></radialGradient>
   <radialGradient id="${id}bd" cx="0.5" cy="0.1" r="0.9"><stop offset="0" stop-color="#e6ac9e"/><stop offset="1" stop-color="#c27f74"/></radialGradient>
   <radialGradient id="${id}mz" cx="0.45" cy="0.35" r="0.7"><stop offset="0" stop-color="#fff0e8" stop-opacity=".85"/><stop offset=".7" stop-color="#f6cfc1" stop-opacity=".35"/><stop offset="1" stop-color="#f0bfb0" stop-opacity="0"/></radialGradient>
   <linearGradient id="${id}lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4c9ba"/><stop offset="1" stop-color="#d8968a"/></linearGradient>
   <linearGradient id="${id}cur" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8958a"/><stop offset=".5" stop-color="#b7726a"/><stop offset="1" stop-color="#d8958a"/></linearGradient>
   <linearGradient id="${id}th" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d88f36"/><stop offset=".35" stop-color="#fbe0a0"/><stop offset=".7" stop-color="#efb45a"/><stop offset="1" stop-color="#c47828"/></linearGradient>
   <clipPath id="${id}ch"><path d="${head}"/></clipPath>
   <filter id="${id}tex" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="9"/><feColorMatrix values="0 0 0 0 .58  0 0 0 0 .30  0 0 0 0 .30  0 0 0 1.5 -.6"/></filter>
   <filter id="${id}bl" filterUnits="userSpaceOnUse" x="-500" y="-400" width="1000" height="900"><feGaussianBlur stdDeviation="10"/></filter>
   <filter id="${id}b3" filterUnits="userSpaceOnUse" x="-500" y="-400" width="1000" height="900"><feGaussianBlur stdDeviation="2.6"/></filter>
  `);
  const deep=(d,w,a)=>`<path d="${d}" stroke="rgba(118,54,50,${f1(a*.55*100)/100})" stroke-width="${f1(w*5.5)}" fill="none" stroke-linecap="round" filter="url(#${id}b3)" transform="translate(${f1(-w*1.2)},${f1(-w*.8)})"/>`+
    `<path d="${d}" stroke="rgba(255,242,234,${f1(a*.8*100)/100})" stroke-width="${f1(w*3.2)}" fill="none" stroke-linecap="round" filter="url(#${id}b3)" transform="translate(${f1(w*2.4)},${f1(w*2)})"/>`+
    `<path d="${d}" stroke="rgba(106,44,40,${a})" stroke-width="${f1(w*1.05)}" fill="none" stroke-linecap="round"/>`;
  let s='';
  // shoulders / chest with heavy loose rolls behind the head
  const bodyD='M-380,440 C-380,270 -320,150 -220,118 L220,118 C320,150 380,270 380,440Z';
  s+=`<path d="${bodyD}" fill="url(#${id}bd)" stroke="${EDGE}" stroke-width="2"/>`;
  for(let i=0;i<5;i++){const y=150+i*32; for(const sg of [-1,1]) s+=deep(`M${sg*(340-i*4)},${y+70} C${sg*290},${y} ${sg*230},${y-12} ${sg*170},${y+8}`,2.2,.55);}
  s+=`<ellipse cx="0" cy="250" rx="230" ry="44" fill="#6d3530" opacity=".45" filter="url(#${id}bl)"/>`;
  // head
  s+=`<path d="${head}" fill="url(#${id}sk)"/>`;
  s+=`<g clip-path="url(#${id}ch)">`;
  s+=`<rect x="-310" y="-190" width="620" height="460" filter="url(#${id}tex)" opacity=".34"/>`;
  s+=`<path d="M-240,-150 C-120,-182 120,-182 240,-150" stroke="#a7766f" stroke-width="40" fill="none" opacity=".35" filter="url(#${id}bl)"/>`;
  s+=`<ellipse cx="-70" cy="-118" rx="150" ry="40" fill="#fff6f0" opacity=".5" filter="url(#${id}bl)"/>`;
  for(const sg of [-1,1]) s+=`<ellipse cx="${sg*262}" cy="40" rx="60" ry="180" fill="#9c5850" opacity="${sg>0?.4:.25}" filter="url(#${id}bl)"/>`;
  s+=`<ellipse cx="0" cy="60" rx="150" ry="130" fill="url(#${id}mz)"/>`;
  // flat forehead: long horizontal wrinkles
  for(let i=0;i<14;i++){const y=-162+(i%7)*12+r()*6, w=40+r()*60, x=(i<7?-1:1)*(30+r()*100); s+=deep(`M${f1(x-w)},${f1(y+4+r()*6)} C${f1(x-w/3)},${f1(y-5-r()*4)} ${f1(x+w/3)},${f1(y+6+r()*4)} ${f1(x+w)},${f1(y-2+r()*8)}`,(i%7)<3?1.1:0.8,.3+r()*.16);}
  // frown folds between the eyes
  for(const sg of [-1,1]) s+=deep(`M${sg*22},-112 C${sg*28},-90 ${sg*30},-70 ${sg*26},-46`,1,.35);
  for(const sg of [-1,1]){
    // wide cheeks: vertical folds near the sides
    for(let i=0;i<5;i++){const x0=sg*(176+i*20+r()*6), y0=-120+i*8+r()*24, y1=70+r()*80+i*10; s+=deep(`M${f1(x0)},${f1(y0)} C${f1(x0+sg*(10+r()*12))},${f1(lerp(y0,y1,.33))} ${f1(x0+sg*(4+r()*10))},${f1(lerp(y0,y1,.66))} ${f1(x0-sg*(14+r()*10))},${f1(y1)}`,1.3,.32+r()*.12);}
    // deep folds that frame the muzzle (cheek pouches meet the lips)
    s+=deep(`M${sg*42},-26 C${sg*96},0 ${sg*126},70 ${sg*116},150`,2,.6);
    s+=deep(`M${sg*70},-56 C${sg*140},-26 ${sg*170},70 ${sg*156},176`,1.7,.45);
    s+=deep(`M${sg*112},176 C${sg*84},212 ${sg*44},232 0,238`,1.6,.4);
    s+=deep(`M${sg*150},-6 C${sg*200},40 ${sg*214},120 ${sg*196},190`,1.3,.3);
  }
  s+=`</g>`;
  s+=`<path d="${head}" fill="none" stroke="${EDGE}" stroke-width="2.2"/>`;
  // no outer ears: small ear holes at the sides
  for(const sg of [-1,1]){const x=sg*283,y=-34; s+=deep(`M${x-sg*2},${y-12} C${x-sg*12},${y-6} ${x-sg*12},${y+8} ${x-sg*2},${y+12}`,0.9,.5); s+=`<ellipse cx="${x}" cy="${y}" rx="3.5" ry="6" fill="#8f4c45"/>`;}
  // tiny pinpoint eyes, far apart and high, sunk in skin folds
  for(const sg of [-1,1]){const x=sg*156,y=-98;
    s+=deep(`M${x-15},${y-3} Q${x},${y-13} ${x+15},${y-3}`,1,.5)+fold(`M${x-12},${y+7} Q${x},${y+12} ${x+12},${y+7}`,1.3,.4);
    s+=`<ellipse cx="${x}" cy="${y}" rx="4.6" ry="4.2" fill="#24110f"/><circle cx="${x-1.4}" cy="${y-1.4}" r="1.3" fill="#fff" opacity=".85"/>`;}
  // small pink nose pad + nostrils + philtrum
  s+=`<path d="M-28,-24 C-16,-36 16,-36 28,-24 C34,-8 18,8 0,10 C-18,8 -34,-8 -28,-24Z" fill="#df988c" stroke="#b9746a" stroke-width="1.4"/>`;
  s+=`<path d="M-16,-29 C-6,-33 6,-33 16,-29" stroke="#fff3ee" stroke-width="2.6" fill="none" opacity=".6"/>`;
  for(const sg of [-1,1]) s+=`<path d="M${sg*7},-12 q${sg*9},-5 ${sg*14},2 q${-sg*5},5 ${-sg*14},-2Z" fill="#6b3431"/>`;
  s+=`<path d="M0,10 L0,30" stroke="#b66f66" stroke-width="2"/>`;
  // furry lips: a closed curtain BEHIND the teeth; left and right halves meet in the middle
  const cur='M-92,30 C-104,90 -100,168 -78,236 L78,236 C100,168 104,90 92,30 C56,22 -56,22 -92,30Z';
  s+=`<path d="${cur}" fill="url(#${id}lip)" stroke="#b9746a" stroke-width="1.4"/>`;
  s+=`<path d="M-40,40 C-32,100 -32,170 -40,232 L40,232 C32,170 32,100 40,40Z" fill="url(#${id}cur)" opacity=".75"/>`;
  s+=`<path d="M0,44 L0,232" stroke="#8a423c" stroke-width="2.4"/>`;
  for(const sg of [-1,1]) for(let i=0;i<3;i++){const x=sg*(48+i*14); s+=fold(`M${x},60 C${x+sg*6},110 ${x+sg*6},170 ${x},228`,1,.35);}
  for(let i=0;i<70;i++){const sg=r()<.5?-1:1; const x=sg*(4+r()*80),y=56+r()*176; s+=line([x,y],[x-sg*(3+r()*4),y+2+r()*3],'#fbe4da',0.9,.85);}
  // lower incisors: longer, rising from the lower lip, tips spread apart
  const lowerT=sg=>{const m=sg; return `<path d="M${m*4},238 L${m*32},238 C${m*35},206 ${m*39},172 ${m*44},142 C${m*36},135 ${m*24},132 ${m*14},134 C${m*10},168 ${m*6},204 ${m*4},238Z" fill="url(#${id}th)" stroke="#9c5a1c" stroke-width="1.8"/>`+line([m*15,226],[m*25,148],'#fff7dc',2.6,.8)+`<path d="M${m*15},136 L${m*42},143" stroke="#fff3c6" stroke-width="2"/>`;};
  if(o.teeth!=='none'&&o.teeth!=='top') s+=lowerT(-1)+lowerT(1);
  // upper incisors: shorter and broad, chisel tips, from under the upper lip
  const upperT=sg=>{const m=sg; return `<path d="M${m*3},44 L${m*40},44 C${m*40},72 ${m*39},100 ${m*37},126 C${m*27},131 ${m*13},132 ${m*3},128 C${m*2},100 ${m*2},72 ${m*3},44Z" fill="url(#${id}th)" stroke="#9c5a1c" stroke-width="1.8"/>`+line([m*14,60],[m*14,118],'#fff7dc',3,.8)+`<path d="M${m*5},126 C${m*16},121 ${m*28},120 ${m*35},123" stroke="#fff3c6" stroke-width="1.6" fill="none"/>`;};
  if(o.teeth!=='none') s+=upperT(-1)+upperT(1);
  // upper lip lobes over the tooth roots
  for(const sg of [-1,1]) s+=`<path d="M0,32 C${sg*-2},26 ${sg*38},20 ${sg*68},26 C${sg*100},34 ${sg*108},60 ${sg*94},76 C${sg*78},86 ${sg*52},72 ${sg*40},60 C${sg*26},52 ${sg*8},52 0,56Z" fill="url(#${id}lip)" stroke="#b9746a" stroke-width="1.5"/>`;
  // lower lip / chin pad over the lower tooth roots
  s+=`<path d="M-88,226 C-72,208 -36,210 0,220 C36,210 72,208 88,226 C90,250 48,264 0,264 C-48,264 -90,250 -88,226Z" fill="url(#${id}lip)" stroke="#b9746a" stroke-width="1.5"/>`;
  for(let i=0;i<46;i++){const sg=r()<.5?-1:1; const x=sg*(6+r()*82), y=30+r()*40; s+=line([x,y],[x+sg*(3+r()*4),y+3+r()*3],'#fff7f1',0.9,.85);}
  for(let i=0;i<30;i++){const x=(r()-.5)*160, y=218+r()*40; s+=line([x,y],[x+(r()-.5)*6,y+4+r()*3],'#fff7f1',0.9,.85);}
  // sparse whiskers from the muzzle sides
  for(const sg of [-1,1]) for(let i=0;i<5;i++){const x0=sg*(78+r()*22), y0=24+i*18+r()*6, L=100+r()*70, a=(sg>0?0:180)+(-20+i*11+r()*6)*sg; const ar=a*Math.PI/180;
    const x1=x0+Math.cos(ar)*L, y1=y0+Math.sin(ar)*L; s+=`<path d="M${f1(x0)},${f1(y0)} Q${f1((x0+x1)/2)},${f1((y0+y1)/2-10)} ${f1(x1)},${f1(y1)}" stroke="#8a6a60" stroke-width="1.6" opacity=".35" fill="none"/><path d="M${f1(x0)},${f1(y0-1)} Q${f1((x0+x1)/2)},${f1((y0+y1)/2-11)} ${f1(x1)},${f1(y1-1)}" stroke="#fffaf5" stroke-width="1.2" fill="none"/>`;}
  // sparse fine hairs on head & outline
  for(let i=0;i<44;i++){const x=(r()-.5)*520, t=E.top(x), b=E.bot(x)-70; if(b<=t+20) continue; const y=lerp(t+10,b,r()); if(Math.abs(x)<100&&y>-40) continue; const a=(r()*360)*Math.PI/180, L=9+r()*8;
    s+=line([x,y+1],[x+Math.cos(a)*L,y+1+Math.sin(a)*L],'rgba(150,90,80,.3)',1)+line([x,y],[x+Math.cos(a)*L,y+Math.sin(a)*L],'#fffaf5',1,.95);}
  for(let i=0;i<26;i++){const p=E.pts[Math.floor(r()*E.pts.length)]; if(p[1]>150) continue; const a=Math.atan2(p[1]-20,p[0])+(r()-.5)*.6, L=10+r()*12; s+=line(p,[p[0]+Math.cos(a)*L,p[1]+Math.sin(a)*L],'#fff6ee',1.1,.9);}
  return s;
}

/* ---------------- Honeybee, side view, facing right. Ground (comb surface) = y 95 ---------------- */
function bee(id='hb', o={}){
  const r=rng(o.seed||31);
  const abd='M-12,-18 C-36,-58 -118,-68 -168,-42 C-198,-26 -214,-2 -222,18 C-208,40 -176,64 -120,66 C-60,70 -22,52 -12,22 C-8,6 -8,-6 -12,-18Z';
  DEFS.push(`
   <radialGradient id="${id}ab" cx="0.45" cy="0.3" r="0.75"><stop offset="0" stop-color="#ffd877"/><stop offset=".5" stop-color="#eaa53a"/><stop offset="1" stop-color="#b8731b"/></radialGradient>
   <radialGradient id="${id}th" cx="0.4" cy="0.3" r="0.7"><stop offset="0" stop-color="#b58548"/><stop offset=".6" stop-color="#7a4d22"/><stop offset="1" stop-color="#3f2612"/></radialGradient>
   <radialGradient id="${id}hd" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="#5a4130"/><stop offset="1" stop-color="#1e140e"/></radialGradient>
   <radialGradient id="${id}ey" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#6a5544"/><stop offset=".5" stop-color="#2c2018"/><stop offset="1" stop-color="#120c08"/></radialGradient>
   <linearGradient id="${id}wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".7"/><stop offset=".5" stop-color="#d5e3ee" stop-opacity=".38"/><stop offset="1" stop-color="#b9cddd" stop-opacity=".5"/></linearGradient>
   <radialGradient id="${id}pl" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#ffd36a"/><stop offset="1" stop-color="#e08a1e"/></radialGradient>
   <clipPath id="${id}ca"><path d="${abd}"/></clipPath>
  `);
  let s='';
  s+=`<ellipse cx="-30" cy="96" rx="170" ry="9" fill="#5a3a10" opacity=".35" filter="url(#softblur)"/>`;
  const LEG='#3a2416', LEGE='#1c110a';
  // far legs
  s+=limb([[52,30],[78,58],[100,80],[118,95]],7,'#2a1a10',LEGE,null,0.8);
  s+=limb([[30,36],[24,64],[4,84],[-12,95]],7,'#2a1a10',LEGE,null,0.8);
  s+=limb([[6,36],[-30,56],[-62,78],[-92,95]],8,'#2a1a10',LEGE,null,0.85);
  // abdomen + bands
  s+=`<path d="${abd}" fill="url(#${id}ab)" stroke="#8a5212" stroke-width="1.6"/>`;
  s+=`<g clip-path="url(#${id}ca)">`;
  const bands=[-46,-86,-124,-160,-192];
  bands.forEach((x,i)=>{const w=16+i*1.5; s+=`<path d="M${x},-80 Q${x-26},10 ${x},90 L${x-w},90 Q${x-w-26},10 ${x-w},-80Z" fill="#4a2a12" opacity=".92"/>`;
    for(let k=0;k<24;k++){const t=k/23, y=lerp(-70,75,t), xx=x+ (-26)*4*t*(1-t)*1 + 1; s+=line([xx,y],[xx+4+r()*3,y-2+r()*4],'#f3d79a',1,.7);} });
  s+=`<path d="M-200,-80 Q-232,10 -200,90 L-260,90 L-260,-80Z" fill="#3a2010"/>`;
  s+=`<ellipse cx="-90" cy="-38" rx="70" ry="12" fill="#fff6d8" opacity=".45" filter="url(#softblur)"/>`;
  s+=`<path d="M-20,40 C-60,72 -150,72 -200,40 L-200,90 L-20,90Z" fill="#5a2c08" opacity=".3" filter="url(#softblur)"/>`;
  s+=`</g>`;
  s+=`<path d="M-221,18 L-236,22 L-221,24Z" fill="#2a1a10"/>`;
  // thorax (fuzzy)
  s+=`<circle cx="36" cy="-6" r="54" fill="url(#${id}th)"/>`;
  for(let i=0;i<340;i++){const a=r()*Math.PI*2, rr=40+r()*14, L=6+r()*8; const x=36+Math.cos(a)*rr, y=-6+Math.sin(a)*rr; const c= r()<.5?'#dcb57c':'#b88a52';
    s+=line([x,y],[x+Math.cos(a+(r()-.5)*.8)*L,y+Math.sin(a+(r()-.5)*.8)*L],c,1,.85);}
  for(let i=0;i<120;i++){const a=r()*Math.PI*2, rr=r()*40; const x=36+Math.cos(a)*rr, y=-6+Math.sin(a)*rr; s+=line([x,y],[x+(r()-.5)*7,y+(r()-.5)*7],'#c99a5e',0.9,.6);}
  // head
  s+=`<path d="M96,-42 C122,-56 152,-42 162,-14 C170,14 162,46 142,60 C126,68 106,62 98,42 C88,16 84,-26 96,-42Z" fill="url(#${id}hd)" stroke="#120a06" stroke-width="1.4"/>`;
  s+=`<ellipse cx="122" cy="-4" rx="19" ry="36" transform="rotate(-8 122 -4)" fill="url(#${id}ey)"/>`;
  for(let i=0;i<40;i++){const a=r()*Math.PI*2, rr=Math.sqrt(r()); s+=`<circle cx="${f1(122+Math.cos(a)*rr*15)}" cy="${f1(-4+Math.sin(a)*rr*30)}" r="1.2" fill="#7a6858" opacity=".4"/>`;}
  s+=`<ellipse cx="115" cy="-22" rx="5" ry="10" fill="#fff" opacity=".35" transform="rotate(-8 115 -22)"/>`;
  for(let i=0;i<3;i++) s+=`<circle cx="${132+i*6}" cy="${-42+i*2}" r="2" fill="#a08870"/>`;
  for(let i=0;i<40;i++){const x=140+r()*20, y=10+r()*40; s+=line([x,y],[x+3+r()*5,y+(r()-.5)*5],'#e3c48e',1,.8);}
  s+=`<path d="M146,58 C152,66 158,70 162,66 L156,58Z" fill="#3a2214"/>`;
  s+=`<path d="M138,62 C134,74 120,80 104,80" stroke="#5a3a1e" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  // elbowed antenna
  s+=limb([[150,-30],[164,-78]],5,'#2c1c12',LEGE,'#7a604a',1);
  s+=limb([[164,-78],[198,-80],[220,-56],[232,-28]],4,'#2c1c12',LEGE,null,0.95);
  for(let i=0;i<8;i++){const t=i/8; s+=`<circle cx="${f1(lerp(198,232,t))}" cy="${f1(lerp(-80,-28,t)+(t<.4?0:0))}" r="0.9" fill="#6a503a"/>`;}
  // wings (hind then fore), transparent with veins
  const hw='M30,-40 C-20,-62 -92,-70 -134,-60 C-154,-52 -144,-40 -112,-36 C-60,-30 0,-32 30,-38Z';
  const fw='M48,-50 C8,-92 -92,-110 -176,-96 C-206,-90 -210,-72 -184,-64 C-122,-50 -30,-44 48,-46Z';
  s+=`<path d="${hw}" fill="url(#${id}wg)" stroke="rgba(60,42,30,.75)" stroke-width="1.5"/>`;
  s+=`<path d="M28,-40 C-30,-52 -80,-56 -120,-52 M-40,-50 L-70,-40 M-80,-54 L-96,-40" stroke="rgba(70,50,35,.5)" stroke-width="1" fill="none"/>`;
  s+=`<path d="${fw}" fill="url(#${id}wg)" stroke="rgba(60,42,30,.85)" stroke-width="1.8"/>`;
  s+=`<path d="M48,-50 C8,-92 -70,-104 -120,-102" stroke="#4a3220" stroke-width="2.4" fill="none"/>`;
  s+=`<path d="M44,-48 C0,-74 -60,-84 -112,-86 C-136,-86 -150,-82 -160,-78 M10,-62 C-20,-70 -60,-72 -96,-70 L-120,-60 M-30,-74 L-46,-56 L-96,-60 M-70,-86 L-80,-70 M-112,-86 L-118,-72 C-130,-74 -150,-74 -160,-78 M-60,-54 L-110,-58" stroke="rgba(55,38,26,.75)" stroke-width="1.2" fill="none"/>`;
  s+=`<path d="M-20,-86 C-60,-96 -110,-100 -150,-94" stroke="#fff" stroke-width="3" opacity=".45" fill="none"/>`;
  // near legs: hind with pollen basket, middle, front
  s+=limb([[14,36],[-24,60],[-56,80],[-86,95]],10,LEG,LEGE,'#7a5a40',0.9);
  s+=`<ellipse cx="-42" cy="70" rx="17" ry="12" transform="rotate(32 -42 70)" fill="url(#${id}pl)" stroke="#b8681a" stroke-width="1.2"/>`;
  for(let i=0;i<14;i++) s+=`<circle cx="${f1(-42+(r()-.5)*22)}" cy="${f1(70+(r()-.5)*14)}" r="1.3" fill="#ffe7a6" opacity=".8"/>`;
  s+=limb([[38,42],[48,68],[32,86],[16,95]],8,LEG,LEGE,'#7a5a40',0.85);
  s+=limb([[62,36],[92,58],[110,80],[128,95]],8,LEG,LEGE,'#7a5a40',0.85);
  for(const [x,y] of [[-86,95],[16,95],[128,95]]) s+=`<path d="M${x},${y} l5,2 M${x},${y} l-2,3" stroke="${LEGE}" stroke-width="1.2"/>`;
  // leg hairs
  for(let i=0;i<40;i++){const t=r(); const p=[lerp(-56,14,t),lerp(80,36,t)]; s+=line(p,[p[0]+(r()-.5)*6,p[1]+4+r()*3],'#c9a070',.8,.7);}
  return s;
}
/* honeycomb patch seen at an angle; top surface at y 0 */
function honeycomb(id='hc', o={}){
  const r=rng(o.seed||41); const R=30, sq=0.5;
  DEFS.push(`
   <radialGradient id="${id}cell" cx="0.5" cy="0.35" r="0.6"><stop offset="0" stop-color="#8a4f10"/><stop offset=".7" stop-color="#c27f22"/><stop offset="1" stop-color="#e2a645"/></radialGradient>
   <radialGradient id="${id}hon" cx="0.4" cy="0.35" r="0.65"><stop offset="0" stop-color="#ffe08a"/><stop offset=".5" stop-color="#e79a20"/><stop offset="1" stop-color="#b8650c"/></radialGradient>
   <radialGradient id="${id}cap" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#fff0c2"/><stop offset="1" stop-color="#e8c46c"/></radialGradient>
  `);
  let s=`<ellipse cx="0" cy="${R*sq*2.6}" rx="${R*6.2}" ry="${R*sq*3.6}" fill="#c48c34" opacity=".35" filter="url(#softblur)"/>`;
  const W=Math.sqrt(3)*R;
  for(let row=0;row<4;row++) for(let col=-4;col<=4;col++){
    const cx=col*W+(row%2?W/2:0), cy=row*R*1.5;
    const lim = 3.6 - row*0.35; if(Math.abs(cx/W)>lim) continue;
    const hex=[];for(let k=0;k<6;k++){const a=Math.PI/6+k*Math.PI/3; hex.push([cx+Math.cos(a)*R, (cy+Math.sin(a)*R)*sq]);}
    const inner=hex.map(p=>[cx+(p[0]-cx)*.8, cy*sq+(p[1]-cy*sq)*.8]);
    s+=`<path d="M${hex.map(pt).join('L')}Z" fill="#f0c25e" stroke="#b47a22" stroke-width="1.4"/>`;
    const kind=r(); const fill= kind<.25?`url(#${id}cap)`: kind<.6?`url(#${id}hon)`:`url(#${id}cell)`;
    s+=`<path d="M${inner.map(pt).join('L')}Z" fill="${fill}" stroke="#a86d1c" stroke-width="1"/>`;
    s+=`<path d="M${pt(inner[3])}L${pt(inner[4])}L${pt(inner[5])}" stroke="#fff3c8" stroke-width="1.6" fill="none" opacity=".7"/>`;
    if(kind>=.25&&kind<.6) s+=`<ellipse cx="${f1(cx-6)}" cy="${f1(cy*sq-4)}" rx="6" ry="2.2" fill="#fff" opacity=".6"/>`;
  }
  return s;
}

/* ---------------- Ant, side view, facing right. Ground = y 70 ---------------- */
function ant(id='an', o={}){
  const r=rng(o.seed||53);
  DEFS.push(`
   <radialGradient id="${id}b" cx="0.38" cy="0.28" r="0.8"><stop offset="0" stop-color="#7a5038"/><stop offset=".45" stop-color="#3a2418"/><stop offset="1" stop-color="#140c08"/></radialGradient>
  `);
  const B=`url(#${id}b)`, E='#0e0805', LEG='#2a1a12';
  let s='';
  s+=`<ellipse cx="-10" cy="71" rx="180" ry="8" fill="#2a1a10" opacity=".4" filter="url(#softblur)"/>`;
  // far legs
  s+=limb([[74,2],[96,24],[102,58],[120,70]],6,'#1c120c',E,null,0.85);
  s+=limb([[42,6],[30,30],[6,60],[-8,70]],6,'#1c120c',E,null,0.85);
  s+=limb([[12,6],[-24,22],[-72,58],[-98,70]],6,'#1c120c',E,null,0.85);
  // gaster
  const g='M-46,-6 C-50,-40 -100,-58 -144,-50 C-184,-42 -196,-6 -186,20 C-174,48 -130,58 -92,48 C-62,40 -44,22 -46,-6Z';
  s+=`<path d="${g}" fill="${B}" stroke="${E}" stroke-width="1.4"/>`;
  s+=`<path d="M-80,-50 C-96,-10 -94,30 -84,50 M-118,-56 C-132,-16 -130,30 -118,56 M-152,-48 C-164,-14 -164,24 -154,48" stroke="#6a4a36" stroke-width="1.4" fill="none" opacity=".6"/>`;
  s+=`<ellipse cx="-112" cy="-34" rx="34" ry="9" transform="rotate(-8 -112 -34)" fill="#fff" opacity=".28"/>`;
  for(let i=0;i<14;i++){const p=[-60-r()*120,-30+r()*70]; s+=line(p,[p[0]-6,p[1]-3],'#8a6a50',.8,.6);}
  // petiole with node
  s+=`<path d="M-24,-6 C-28,-6 -32,-14 -33,-28 C-34,-38 -42,-38 -44,-28 C-45,-16 -46,-10 -50,-6 L-48,6 C-42,4 -32,6 -24,4Z" fill="${B}" stroke="${E}" stroke-width="1.3"/>`;
  // mesosoma (thorax)
  s+=`<path d="M-28,-6 C-28,-24 -12,-30 4,-26 C18,-42 40,-46 60,-40 C76,-38 90,-32 94,-20 C98,-6 90,6 76,8 C50,12 10,12 -18,8 C-28,6 -30,0 -28,-6Z" fill="${B}" stroke="${E}" stroke-width="1.4"/>`;
  s+=`<path d="M6,-26 C10,-12 10,0 6,8 M62,-40 C64,-24 62,-6 58,10" stroke="#6a4a36" stroke-width="1.3" fill="none" opacity=".7"/>`;
  s+=`<path d="M10,-30 C26,-40 44,-42 58,-38" stroke="#fff" stroke-width="3" opacity=".3" fill="none" stroke-linecap="round"/>`;
  // neck + head
  s+=`<path d="M88,-16 C96,-20 104,-20 106,-12 C104,-4 96,-2 88,-4Z" fill="#2a1a12"/>`;
  s+=`<path d="M100,-30 C106,-58 142,-64 160,-48 C174,-34 174,-6 162,8 C146,22 112,16 102,0 C96,-10 96,-22 100,-30Z" fill="${B}" stroke="${E}" stroke-width="1.4"/>`;
  s+=`<ellipse cx="138" cy="-30" rx="10" ry="8" fill="#0a0604"/><ellipse cx="135" cy="-33" rx="3.5" ry="2.5" fill="#fff" opacity=".55"/>`;
  for(let i=0;i<10;i++){const a=r()*Math.PI*2,rr=Math.sqrt(r())*7; s+=`<circle cx="${f1(138+Math.cos(a)*rr)}" cy="${f1(-30+Math.sin(a)*rr*.8)}" r=".8" fill="#5a4a40" opacity=".6"/>`;}
  s+=`<ellipse cx="124" cy="-48" rx="16" ry="5" transform="rotate(-20 124 -48)" fill="#fff" opacity=".25"/>`;
  // mandibles (toothed), far one first
  const mand=(dx,dy,c)=>`<path transform="translate(${dx},${dy})" d="M152,0 C168,-4 184,2 192,14 L185,13 L183,8 L177,10 L175,5 L169,7 C164,6 158,6 150,6Z" fill="${c}" stroke="${E}" stroke-width="1.1"/>`;
  s+=mand(-4,2,'#24160e')+mand(0,0,'#4a2e1c');
  // elbowed antennae (far, near)
  s+=limb([[144,-46],[112,-92]],4,'#1c120c',E,null,1);
  s+=limb([[112,-92],[140,-112],[170,-108],[190,-86]],3,'#1c120c',E,null,1);
  s+=limb([[152,-44],[138,-102]],5,LEG,E,'#6a4a36',1);
  const fn=[[138,-102],[172,-116],[202,-102],[222,-76],[230,-58]];
  s+=limb(fn,4,LEG,E,null,1);
  for(let i=1;i<11;i++){const t=i/11, k=t*(fn.length-1), j=Math.floor(k), f=k-j; const a=fn[j], b=fn[Math.min(j+1,fn.length-1)]; s+=`<circle cx="${f1(lerp(a[0],b[0],f))}" cy="${f1(lerp(a[1],b[1],f))}" r="${i>8?3.4:2.4}" fill="#3a2418" stroke="${E}" stroke-width=".6"/>`;}
  // near legs, all from the thorax
  s+=limb([[82,4],[110,24],[126,56],[152,70]],8,LEG,E,'#6a4a36',0.8);
  s+=limb([[48,8],[62,32],[46,60],[26,70]],8,LEG,E,'#6a4a36',0.8);
  s+=limb([[16,8],[-12,30],[-48,58],[-78,70]],8,LEG,E,'#6a4a36',0.8);
  for(const p of [[82,4],[48,8],[16,8]]) s+=`<ellipse cx="${p[0]}" cy="${p[1]+2}" rx="7" ry="9" fill="${B}" stroke="${E}" stroke-width="1"/>`;
  return s;
}

const VE = {
  chuot: () => moleRatSide('mr'),
  mat0: () => moleRatFace('mf', { teeth: 'none' }), mat1: () => moleRatFace('mf', { teeth: 'top' }), mat2: () => moleRatFace('mf'),
  ong: () => bee('hb').replace(/<ellipse[^>]*softblur[^>]*\/>/g, ''),   // ong bay: bỏ bóng dưới đất
  kien: () => ant('an'),
};
const CHUNG = '<filter id="fblur" filterUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000"><feGaussianBlur stdDeviation="1.7"/></filter>'
  + '<filter id="softblur" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>';
const anh = {}, khung = {};
async function nap() {
  const tam = document.createElementNS(NS, 'svg'); tam.setAttribute('style', 'position:absolute;left:-9999px;top:0'); tam.setAttribute('width', '10'); tam.setAttribute('height', '10');
  document.body.appendChild(tam);
  await Promise.all(Object.entries(VE).map(async ([ten, f]) => {
    DEFS = []; const than = f(), defs = '<defs>' + CHUNG + DEFS.join('') + '</defs>';
    tam.innerHTML = defs + '<g id="do">' + than + '</g>';
    const bb = tam.querySelector('#do').getBBox(), p = 24;   // chừa chỗ cho viền mờ
    const x = Math.floor(bb.x - p), y = Math.floor(bb.y - p), w = Math.ceil(bb.width + 2 * p), h = Math.ceil(bb.height + 2 * p);
    const svg = '<svg xmlns="' + NS + '" width="' + w * 2 + '" height="' + h * 2 + '" viewBox="' + [x, y, w, h].join(' ') + '">' + defs + than + '</svg>';
    const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await im.decode();
    anh[ten] = im; khung[ten] = [x, y, x + w, y + h];
  }));
  tam.remove();
}
return { nap, anh, khung };
})();
