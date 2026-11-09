const $=id=>document.getElementById(id),C=$('c'),dpr=Math.min(devicePixelRatio||1,2),M=400,PI=Math.PI;
C.width=C.height=800*dpr;const X=C.getContext('2d');X.setTransform(dpr,0,0,dpr,0,0);
const rot=(d,x,y)=>{const a=d*PI/2,c=Math.cos(a),s=Math.sin(a);return[M+x*c-y*s,M+x*s+y*c]};
/* ---------- Klien WebSocket -> Gateway -> Virtual PLC ---------- */
let st={running:false,emergency:false,phase:'STOPPED',direction:'ALL',color:'RED',remaining:0,settings:{green:12,yellow:3,allRed:2}},link=false,plcUp=false,ws;
const CN={GREEN:'Hijau',YELLOW:'Kuning',RED:'Merah'},FN={NS_GREEN:1,NS_YELLOW:2,ALL_RED_1:3,EW_GREEN:4,EW_YELLOW:5,ALL_RED_2:6};
function lc(d){if(st.emergency)return Math.floor(T*2)%2?'RED':'OFF';if(!link||!plcUp||!st.running||st.direction=='ALL')return'RED';return(st.direction=='NS')==(d%2==0)?st.color:'RED'}
const lcs=d=>{const c=lc(d);return c=='OFF'?'RED':c};
function connect(){try{ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+(location.host||'127.0.0.1:3000')+'/ws')}catch(e){return setTimeout(connect,2000)}
 ws.onopen=()=>{link=true;ui()};
 ws.onclose=()=>{link=false;plcUp=false;ui();setTimeout(connect,2000)};
 ws.onerror=()=>ws.close();
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}
  if(m.type=='STATUS')st=m;
  else if(m.type=='CONNECTION')plcUp=m.plc;
  ui()}}
function ui(){const ok=link&&plcUp,run=ok&&st.running&&!st.emergency;
 $('lk').textContent='GATEWAY: '+(!link?'TERPUTUS':plcUp?'TERHUBUNG':'PLC OFFLINE');$('lk').className='lk '+(ok?'on':'off');
 $('ph').textContent=!ok?'-':st.emergency?'DARURAT':st.running?st.phase.replace('_',' '):'STOPPED';
 $('rm').textContent=run?st.remaining+'s':'-'}
/* ---------- Background ---------- */
const bg=document.createElement('canvas');bg.width=bg.height=800*dpr;const B=bg.getContext('2d');B.scale(dpr,dpr);
B.fillStyle='#0a0a1c';B.fillRect(0,0,800,800);
const NE=['#ff3e9d','#00e5ff','#ffd166','#8b5cf6'];
[[0,0],[1,0],[0,1],[1,1]].forEach(([i,j],k)=>{
 B.fillStyle='#26263f';B.fillRect(i?472:0,j?472:0,328,328);
 const bx=i?486:14,by=j?486:14;
 const g=B.createLinearGradient(bx,by,bx+300,by+300);g.addColorStop(0,'#1d1740');g.addColorStop(1,'#0f0f26');
 B.fillStyle=g;B.fillRect(bx,by,300,300);
 B.save();B.shadowColor=NE[k];B.shadowBlur=14;B.strokeStyle=NE[k];B.lineWidth=2;B.strokeRect(bx,by,300,300);B.restore();
 for(let x=bx+16;x<bx+290;x+=26)for(let y=by+16;y<by+290;y+=26){B.fillStyle=Math.random()<.45?(Math.random()<.5?'#ffd16688':'#00e5ff66'):'#ffffff0d';B.fillRect(x,y,12,14)}

});
B.fillStyle='#1b1b2c';B.fillRect(328,0,144,800);B.fillRect(0,328,800,144);
for(let d=0;d<4;d++){B.save();B.translate(M,M);B.rotate(d*PI/2);
 B.lineWidth=2;B.strokeStyle='#ffffff55';B.beginPath();B.moveTo(-72,100);B.lineTo(-72,400);B.moveTo(72,100);B.lineTo(72,400);B.stroke();
 B.strokeStyle='#ffd166';B.beginPath();B.moveTo(-2,100);B.lineTo(-2,400);B.moveTo(2,100);B.lineTo(2,400);B.stroke();
 B.strokeStyle='#ffffff88';B.setLineDash([16,14]);B.beginPath();B.moveTo(-36,100);B.lineTo(-36,400);B.stroke();B.setLineDash([]);
 B.fillStyle='#fff';B.fillRect(-72,98,72,5);
 B.fillStyle='#ffffffcc';for(let x=-68;x<70;x+=12)B.fillRect(x,76,7,18);
 B.restore()}
/* ---------- Paths ---------- */
const LX=[-54,-18],SP0=360,bez=(p,c,q,n=30)=>{const a=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;a.push([u*u*p[0]+2*u*t*c[0]+t*t*q[0],u*u*p[1]+2*u*t*c[1]+t*t*q[1]])}return a};
function build(l,m){const x=LX[l];let p=[[x,460]];
 if(m=='S')p.push([x,-460]);
 if(m=='L')p.push(...bez([x,100],[x,54],[-100,54]),[-460,54]);
 if(m=='R')p.push(...bez([x,100],[x,-18],[100,-18]),[460,-18]);
 const cum=[0];for(let i=1;i<p.length;i++)cum.push(cum[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));
 return{pts:p,cum,len:cum[cum.length-1]}}
const P={};for(let l=0;l<2;l++)for(const m of['S',l?'R':'L'])P[l+m]=build(l,m);
function at(p,s){s=Math.max(0,Math.min(p.len,s));let i=1;while(i<p.cum.length-1&&p.cum[i]<s)i++;const t=(s-p.cum[i-1])/(p.cum[i]-p.cum[i-1]||1),a=p.pts[i-1],b=p.pts[i];return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,Math.atan2(b[1]-a[1],b[0]-a[0])]}
/* ---------- Cars ---------- */
const TY=[{n:'sedan',L:40,W:19},{n:'suv',L:44,W:21},{n:'sport',L:41,W:19},{n:'van',L:50,W:21}];
const CL=['#ff3e9d','#00b8d9','#ffc233','#8b5cf6','#e8e8f0','#ff6b35','#22c58b','#c0152f'];
let cars=[],T=0,SPD=1,DEN=.16;
function spawn(d,l){const m=l?(Math.random()<.7?'S':'R'):(Math.random()<.65?'S':'L'),ty=TY[Math.random()*4|0];
 if(cars.some(o=>o.d==d&&o.l==l&&o.s-o.L<ty.L+16))return;
 cars.push({d,l,m,path:P[l+m],s:ty.L,v:60,L:ty.L,W:ty.W,n:ty.n,col:ty.n=='van'?'#dfe3ee':CL[Math.random()*CL.length|0],br:false})}
function update(dt){
 for(const c of cars){let tgt=1e9;const col=lcs(c.d),pv=c.v;
  if(c.s<SP0-1){const dist=SP0-2-c.s;
   if(col=='RED'||(col=='YELLOW'&&dist>c.v*c.v/300+6))tgt=SP0-2;
   if(c.m=='R'&&cars.some(o=>o.d==(c.d+2)%4&&o.m=='S'&&o.s>SP0-70&&o.s<SP0+230))tgt=SP0-2}
  for(const o of cars)if(o!==c&&o.d==c.d&&o.l==c.l&&o.s>c.s&&(o.m==c.m||o.s<SP0+40))tgt=Math.min(tgt,o.s-o.L-9);
  let vd=110;if(c.m!='S'&&c.s>SP0-30&&c.s<c.path.len-120)vd=55;
  const al=tgt>=1e8?vd:Math.min(vd,Math.sqrt(2*220*Math.max(tgt-c.s,0)));
  c.v+=Math.max(-280*dt,Math.min(110*dt,al-c.v));if(c.v<.5&&al<1)c.v=0;
  c.s+=c.v*dt;if(tgt<1e8&&c.s>tgt&&c.s-dt*c.v<=tgt+.01)c.s=tgt;
  c.br=c.v<pv-.15||(c.v<4&&tgt<1e8)}
 cars=cars.filter(c=>c.s<c.path.len+c.L+4)}
/* ---------- Drawing ---------- */
function drawCar(c){const q=at(c.path,c.s-c.L/2),[wx,wy]=rot(c.d,q[0],q[1]),L=c.L,W=c.W;
 X.save();X.translate(wx,wy);X.rotate(q[2]+c.d*PI/2);
 let g=X.createLinearGradient(L/2,0,L/2+75,0);g.addColorStop(0,'rgba(255,244,190,.3)');g.addColorStop(1,'rgba(255,244,190,0)');
 X.fillStyle=g;X.beginPath();X.moveTo(L/2-2,-W/2+3);X.lineTo(L/2+75,-W/2-16);X.lineTo(L/2+75,W/2+16);X.lineTo(L/2-2,W/2-3);X.fill();
 X.fillStyle='rgba(0,0,0,.5)';X.beginPath();X.roundRect(-L/2+2,-W/2+3,L,W,7);X.fill();
 X.fillStyle=c.col;X.beginPath();X.roundRect(-L/2,-W/2,L,W,7);X.fill();
 X.fillStyle='rgba(255,255,255,.2)';X.beginPath();X.roundRect(-L/2+3,-W/2+1.5,L-6,W*.3,4);X.fill();
 if(c.n=='sport'){X.fillStyle='rgba(255,255,255,.75)';X.fillRect(-L/2+3,-1.6,L-6,3.2)}
 const van=c.n=='van',f=van?.34:.27;
 X.fillStyle='#0b1120';X.beginPath();X.moveTo(L*(f-.13),-W*.4);X.lineTo(L*f,-W*.34);X.lineTo(L*f,W*.34);X.lineTo(L*(f-.13),W*.4);X.fill();
 X.beginPath();X.moveTo(-L*.3,-W*.36);X.lineTo(-L*.36,-W*.4);X.lineTo(-L*.36,W*.4);X.lineTo(-L*.3,W*.36);X.fill();
 X.fillStyle=c.col;X.fillRect(-L*.3,-W*.38,L*(f+.17),W*.76);
 X.fillStyle='rgba(0,0,0,.25)';X.fillRect(-L*.3,-W*.38,L*(f+.17),W*.76);
 if(c.n=='suv'){X.strokeStyle='rgba(0,0,0,.55)';X.lineWidth=1.2;X.strokeRect(-L*.22,-W*.3,L*.3,W*.6)}
 for(const s of[-1,1]){X.fillStyle='#fffbd0';X.beginPath();X.ellipse(L/2-2,s*(W/2-4),2.2,3,0,0,7);X.fill();
  X.fillStyle=c.br?'#ff2040':'#7a1020';if(c.br){X.shadowColor='#ff2040';X.shadowBlur=10}X.fillRect(-L/2-.5,s*(W/2-5)-2,2.6,4);X.shadowBlur=0}
 if(c.m!='S'&&c.s>SP0-150&&c.s<c.path.len-120&&Math.floor(T*3)%2){const s=c.m=='L'?-1:1;X.fillStyle='#ffb000';X.shadowColor='#ffb000';X.shadowBlur=8;
  X.beginPath();X.arc(L/2-3,s*W/2,2,0,7);X.arc(-L/2+3,s*W/2,2,0,7);X.fill();X.shadowBlur=0}
 X.restore()}
function drawLight(d){const[x,y]=rot(d,-90,114),col=lc(d);
 X.fillStyle='#555';X.fillRect(x-1.5,y+22,3,8);
 X.fillStyle='#0b0b14';X.strokeStyle='#3a3a55';X.lineWidth=1.5;X.beginPath();X.roundRect(x-10,y-26,20,50,6);X.fill();X.stroke();
 [['RED','#ff2d4d'],['YELLOW','#ffc400'],['GREEN','#22ff9a']].forEach(([n,c],k)=>{const on=col==n,cy=y-14+k*14;
  X.beginPath();X.arc(x,cy,5.5,0,7);X.fillStyle=on?c:c+'28';if(on){X.shadowColor=c;X.shadowBlur=18}X.fill();X.shadowBlur=0});
 if(link&&plcUp&&st.running&&!st.emergency&&col!='RED'){X.fillStyle=col=='GREEN'?'#22ff9a':'#ffc400';X.font='700 12px Orbitron,sans-serif';X.textAlign='center';X.fillText(st.remaining,x,y+43)}}
function frame(ts){const dt=Math.min(.05,(ts-(frame.l||ts))/1000)*SPD;frame.l=ts;T+=dt;
  for(let d=0;d<4;d++)for(let l=0;l<2;l++)if(Math.random()<DEN*dt)spawn(d,l);
 update(dt);X.drawImage(bg,0,0,800,800);
 cars.slice().sort((a,b)=>a.s-b.s).forEach(drawCar);for(let d=0;d<4;d++)drawLight(d);
 $('cn').textContent=cars.length;
 requestAnimationFrame(frame)}
$('sd').onchange=()=>DEN=+$('sd').value;$('ss').onchange=()=>SPD=+$('ss').value;
connect();ui();requestAnimationFrame(frame);
