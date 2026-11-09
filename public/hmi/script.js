const $=id=>document.getElementById(id);
let st={running:false,emergency:false,phase:'STOPPED',direction:'ALL',color:'RED',remaining:0,settings:{green:12,yellow:3,allRed:2}},link=false,plcUp=false,ws;
const CN={GREEN:'Hijau',YELLOW:'Kuning',RED:'Merah'},FN={NS_GREEN:1,NS_YELLOW:2,ALL_RED_1:3,EW_GREEN:4,EW_YELLOW:5,ALL_RED_2:6};
function lamp(k){if(!link||!plcUp||!st.running||st.emergency||st.direction=='ALL')return'RED';return(st.direction=='NS')==(k==0)?st.color:'RED'}
function connect(){try{ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+(location.host||'127.0.0.1:3001')+'/ws')}catch(e){return setTimeout(connect,2000)}
 ws.onopen=()=>{link=true;ui()};
 ws.onclose=()=>{link=false;plcUp=false;ui();setTimeout(connect,2000)};
 ws.onerror=()=>ws.close();
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}
  if(m.type=='STATUS'){st=m;if(!/INPUT/.test(document.activeElement.tagName)){$('sg').value=m.settings.green;$('sy').value=m.settings.yellow;$('sr').value=m.settings.allRed}}
  else if(m.type=='CONNECTION')plcUp=m.plc;else if(m.type=='ERROR')flash=m.message;
  ui()}}
const send=o=>ws&&ws.readyState==1&&ws.send(JSON.stringify(o));
let flash='';
function ui(){const ok=link&&plcUp,run=ok&&st.running&&!st.emergency,blink=Math.floor(Date.now()/500)%2;
 $('lk').textContent='GATEWAY: '+(!link?'TERPUTUS':plcUp?'TERHUBUNG':'PLC OFFLINE');$('lk').className='lk '+(ok?'on':'off');
 $('info').textContent=flash||(st.emergency?'DARURAT • Semua Merah':run?`Fase ${FN[st.phase]} • ${CN[st.color]} • ${String(st.remaining).padStart(2,'0')} s`:'Siaga • Semua Merah');
 [0,1].forEach(k=>{const c=ok?lamp(k):'RED',off=st.emergency&&blink;['RED','YELLOW','GREEN'].forEach(n=>$('l'+k+n).style.opacity=off?.18:c==n?1:.18)});
 $('b3').classList.toggle('on',st.emergency)}
$('b1').onclick=()=>{flash='';send({type:'START'})};
$('b2').onclick=()=>{flash='';send({type:'STOP'})};
$('b3').onclick=()=>{flash='';send({type:'EMERGENCY',enabled:true})};
$('b5').onclick=()=>{flash='';send({type:'EMERGENCY',enabled:false});send({type:'START'})};
$('b4').onclick=()=>{flash='';send({type:'SETTINGS',green:+$('sg').value,yellow:+$('sy').value,allRed:+$('sr').value})};
connect();ui();setInterval(ui,500);
