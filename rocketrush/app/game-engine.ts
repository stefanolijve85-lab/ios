// @ts-nocheck
/* RocketRush game engine.
   - NET mode: connects to the authoritative game server (server/game-server.mjs)
     so all players share one round clock. The server owns crash points + balances.
   - LOCAL mode: if the server can't be reached (offline / file://), it runs the
     same loop as a client-side simulation so the game is ALWAYS playable.
   Client-side only: call startGame() inside a useEffect. Returns a teardown fn. */
import { io } from 'socket.io-client';

export function startGame(): () => void {
  'use strict';
  let ENGINE_ALIVE = true;
  const _ints: number[] = [];
  const _int = (f: any, m: number) => { const id = window.setInterval(f, m); _ints.push(id); return id; };
  const NET = { sock: null, port: 3001 };

/* ============================================================
   RocketRush — single-file playable demo
   Game loop, provably-fair engine, simulated multiplayer.
   In production: this client-side loop is driven by the
   NestJS game server over Socket.io (see /docs).
   ============================================================ */



/* ---------- tiny helpers ---------- */
const $ = id => document.getElementById(id);
const rnd = (a,b) => a + Math.random()*(b-a);
const fmt = n => n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

/* ============================================================
   PROVABLY FAIR ENGINE (Web Crypto, identical to server)
   crash = floor( (100*E - h) / (E - h) ) / 100, capped.
   We derive h from HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`).
   2% house edge implemented via the instant-crash probability.
   ============================================================ */
const HOUSE_EDGE = 0.02;
const enc = new TextEncoder();

/* ---- crypto.subtle is ONLY available on https or localhost. On an iPhone
   hitting http://192.168.x.x:3000 over the LAN it is undefined, so we ship a
   tiny pure-JS SHA-256 + HMAC fallback. Output is byte-identical to WebCrypto
   and to node's crypto, so provably-fair verification still passes. ---- */
const _K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
const _rotr = (n,x) => (x>>>n)|(x<<(32-n));
function _sha256bytes(bytes){
  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
  const l=bytes.length, msg=bytes.slice(); msg.push(0x80);
  while(msg.length%64!==56) msg.push(0);
  const bits=l*8;
  for(let i=7;i>=0;i--) msg.push((Math.floor(bits/Math.pow(2,8*i)))&0xff);
  const w=new Array(64);
  for(let i=0;i<msg.length;i+=64){
    for(let t=0;t<16;t++) w[t]=((msg[i+4*t]<<24)|(msg[i+4*t+1]<<16)|(msg[i+4*t+2]<<8)|msg[i+4*t+3])|0;
    for(let t=16;t<64;t++){
      const s0=_rotr(7,w[t-15])^_rotr(18,w[t-15])^(w[t-15]>>>3);
      const s1=_rotr(17,w[t-2])^_rotr(19,w[t-2])^(w[t-2]>>>10);
      w[t]=(w[t-16]+s0+w[t-7]+s1)|0;
    }
    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for(let t=0;t<64;t++){
      const S1=_rotr(6,e)^_rotr(11,e)^_rotr(25,e);
      const ch=(e&f)^((~e)&g);
      const t1=(h+S1+ch+_K[t]+w[t])|0;
      const S0=_rotr(2,a)^_rotr(13,a)^_rotr(22,a);
      const maj=(a&b)^(a&c)^(b&c);
      const t2=(S0+maj)|0;
      h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
    }
    h0=(h0+a)|0;h1=(h1+b)|0;h2=(h2+c)|0;h3=(h3+d)|0;h4=(h4+e)|0;h5=(h5+f)|0;h6=(h6+g)|0;h7=(h7+h)|0;
  }
  const hx=x=>((x>>>0).toString(16).padStart(8,'0'));
  return hx(h0)+hx(h1)+hx(h2)+hx(h3)+hx(h4)+hx(h5)+hx(h6)+hx(h7);
}
const _hexToBytes = hex => { const o=[]; for(let i=0;i<hex.length;i+=2) o.push(parseInt(hex.substr(i,2),16)); return o; };
function _jsSha256Hex(str){ return _sha256bytes(Array.from(enc.encode(str))); }
function _jsHmacHex(keyStr,msgStr){
  let key=Array.from(enc.encode(keyStr));
  if(key.length>64) key=_hexToBytes(_sha256bytes(key));
  const k=new Array(64).fill(0); for(let i=0;i<key.length;i++) k[i]=key[i];
  const ipad=k.map(b=>b^0x36), opad=k.map(b=>b^0x5c);
  const inner=_sha256bytes(ipad.concat(Array.from(enc.encode(msgStr))));
  return _sha256bytes(opad.concat(_hexToBytes(inner)));
}
const HAS_SUBTLE = typeof crypto !== 'undefined' && !!(crypto.subtle);

async function sha256Hex(str){
  if(HAS_SUBTLE){
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  return _jsSha256Hex(str);
}
async function hmacHex(key, msg){
  if(HAS_SUBTLE){
    const k = await crypto.subtle.importKey('raw', enc.encode(key), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
    return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  return _jsHmacHex(key, msg);
}
function randSeed(){
  const a = new Uint8Array(16);
  if(typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(a);
  else for(let i=0;i<16;i++) a[i]=Math.floor(Math.random()*256);
  return [...a].map(b=>b.toString(16).padStart(2,'0')).join('');
}
// Deterministic crash point from an HMAC hex digest.
function crashFromHmac(hex){
  // Instant-crash slice => the house edge.
  const hInt = parseInt(hex.slice(0,8),16);
  if (hInt % Math.round(1/HOUSE_EDGE) === 0) return 1.00;
  // Uniform 52-bit float in [0,1)
  const h = parseInt(hex.slice(0,13),16);
  const e = Math.pow(2,52);
  const result = Math.floor((100*e - h) / (e - h)) / 100;
  return Math.max(1.00, result);
}

/* ============================================================
   STATE
   ============================================================ */
const S = {
  balance: 1000.00,
  bet: 100,
  auto: 2.00,           // 0 = off
  mode: 'local',        // 'local' (simulation) | 'net' (authoritative server)
  rounds: [],           // recent completed rounds {nonce,crash,serverSeed,clientSeed,hmac}
  myBets: [],           // player outcomes {nonce,amount,won,mult,payout,profit}
  curBet: null,         // the bet active this round {nonce,amount}
  stats: { played:0, wins:0, wagered:0, returned:0, best:0, bestWin:0, streak:0, bestStreak:0 },
  phase: 'idle',        // betting | running | crashed
  mult: 1.00,
  crashAt: 0,
  startTs: 0,
  roundStart: 0,
  nonce: 1,
  serverSeed: randSeed(),
  serverSeedHash: '',
  clientSeed: randSeed().slice(0,12),
  prevServerSeed: '—',
  lastRound: null,      // {nonce, serverSeed, clientSeed, hmac, crash}
  bet_placed: false,    // bet active this round
  bet_amount: 0,
  cashedOut: false,
  cashedAt: 0,
  queuedBet: false,     // bet queued for next round
  history: [],
  sound: true,
  lowBw: false,
  bots: [],
  lang: 'en',
};

/* i18n — minimal, enough to prove localization is wired */
const I18N = {
  en:{place:'PLACE BET',cashout:'CASH OUT',waiting:'WAITING…',cancel:'CANCEL',queued:'BET QUEUED',crashed:'CRASHED',flew:'FLEW AWAY',launching:'LAUNCHING',rising:'RISING'},
  nl:{place:'INZET PLAATSEN',cashout:'UITBETALEN',waiting:'WACHTEN…',cancel:'ANNULEER',queued:'INZET IN WACHTRIJ',crashed:'GECRASHT',flew:'WEGGEVLOGEN',launching:'LANCEREN',rising:'STIJGT'},
  de:{place:'EINSATZ',cashout:'AUSZAHLEN',waiting:'WARTEN…',cancel:'ABBRECHEN',queued:'EINSATZ IN WARTESCHLANGE',crashed:'ABGESTÜRZT',flew:'WEGGEFLOGEN',launching:'START',rising:'STEIGT'},
  es:{place:'APOSTAR',cashout:'RETIRAR',waiting:'ESPERANDO…',cancel:'CANCELAR',queued:'APUESTA EN COLA',crashed:'EXPLOTÓ',flew:'VOLÓ',launching:'DESPEGUE',rising:'SUBIENDO'},
  pt:{place:'APOSTAR',cashout:'SACAR',waiting:'AGUARDANDO…',cancel:'CANCELAR',queued:'APOSTA NA FILA',crashed:'EXPLODIU',flew:'VOOU',launching:'LANÇANDO',rising:'SUBINDO'},
  tr:{place:'BAHİS YAP',cashout:'PARA ÇEK',waiting:'BEKLENİYOR…',cancel:'İPTAL',queued:'BAHİS SIRADA',crashed:'PATLADI',flew:'UÇTU',launching:'KALKIŞ',rising:'YÜKSELİYOR'},
};
const T = k => (I18N[S.lang]||I18N.en)[k] || I18N.en[k];

/* ============================================================
   SOUND (WebAudio, no assets)
   ============================================================ */
let actx;
function beep(freq, dur, type='sine', vol=.08){
  if(!S.sound) return;
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type=type; o.frequency.value=freq; o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime+dur);
    o.start(); o.stop(actx.currentTime+dur);
  }catch(e){}
}
const sfx = {
  tick:  ()=>beep(880,.05,'square',.03),
  bet:   ()=>beep(440,.12,'triangle',.07),
  cash:  ()=>{beep(660,.1,'sine',.09); setTimeout(()=>beep(990,.18,'sine',.09),90);},
  crash: ()=>beep(120,.35,'sawtooth',.10),
  launch:()=>beep(220,.3,'sawtooth',.05),
};

/* ============================================================
   SIMULATED MULTIPLAYER (bots) — no backend needed for demo
   ============================================================ */
const NAMES = ['Nova','Orbit','Zenith','Comet','Vega','Astra','Pulsar','Quasar','Lyra','Titan','Apollo','Luna','Helio','Cosmo','Stellar','Falcon','Drift','Echo','Onyx','Mika','Rin','Kai','Juno','Atlas','Sol','Iris','Nyx','Rex','Zara','Milo'];
const COLORS = ['#FF8A00','#9B5CF6','#22C55E','#38BDF8','#F43F5E','#EAB308','#EC4899','#14B8A6'];
const CHATTER = ['gg 🚀','cashed at last sec 😮‍💨','to the moon!','rip my bet','easy 2x','who else holding?','that was brutal','provably fair ftw','nice round','my heart can’t take this 😂','10x incoming i feel it','cashed early again ugh','lfg 🔥','red wall incoming','green day today'];

function makeBots(n){
  const out=[];
  for(let i=0;i<n;i++){
    out.push({ name: NAMES[i%NAMES.length] + (i>=NAMES.length? (Math.floor(i/NAMES.length)+1):''),
               color: COLORS[i%COLORS.length],
               bet: Math.round(rnd(20,800)/10)*10,
               target: rnd(1.2,7), active:false, done:false });
  }
  return out;
}

/* ============================================================
   STARFIELD + ROCKET CANVAS
   ============================================================ */
const cvs = $('sky'), ctx = cvs.getContext('2d');
let W=0,H=0,DPR=1, stars=[], particles=[];
function resize(){
  DPR = Math.min(window.devicePixelRatio||1, 2);
  const r = cvs.getBoundingClientRect();
  W=r.width; H=r.height;
  cvs.width=W*DPR; cvs.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
  const count = S.lowBw? 40 : 130;
  stars = Array.from({length:count}, ()=>({ x:Math.random()*W, y:Math.random()*H, z:Math.random()*.8+.2, r:Math.random()*1.4+.3 }));
}
window.addEventListener('resize', resize);

function rocketPos(t){ // t in seconds; returns point on flight curve in canvas space
  // Curve: rocket climbs from bottom-left toward top-right, easing as multiplier grows.
  const climb = Math.min(t/9, 1);
  const eased = 1 - Math.pow(1-climb, 2.2);
  const x = 0.12*W + eased * 0.72*W;
  const y = 0.86*H - eased * 0.66*H;
  return {x,y};
}

let shakeT=0;
function draw(ts){ if(!ENGINE_ALIVE) return;
  ctx.clearRect(0,0,W,H);

  // stars (parallax drift; faster while running)
  const speed = S.phase==='running' ? Math.min(S.mult*0.4, 8) : 0.3;
  ctx.fillStyle='#fff';
  for(const s of stars){
    s.y += s.z*speed;
    if(s.y>H){ s.y=0; s.x=Math.random()*W; }
    ctx.globalAlpha = s.z*0.9;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,7); ctx.fill();
  }
  ctx.globalAlpha=1;

  if(S.phase==='running' || S.phase==='crashed'){
    const t = (performance.now()-S.startTs)/1000;
    const tt = S.phase==='crashed' ? S.crashTime : t;
    const p = rocketPos(tt);

    // shake on crash
    let ox=0,oy=0;
    if(S.phase==='crashed' && shakeT>0){ ox=rnd(-6,6); oy=rnd(-6,6); shakeT-=16; }

    // flight trail (gradient curve)
    ctx.save(); ctx.translate(ox,oy);
    ctx.beginPath();
    ctx.moveTo(0.12*W, 0.86*H);
    const steps=36;
    for(let i=1;i<=steps;i++){
      const q=rocketPos(tt*i/steps);
      ctx.lineTo(q.x,q.y);
    }
    const grad = ctx.createLinearGradient(0.12*W,0.86*H,p.x,p.y);
    grad.addColorStop(0,'rgba(255,138,0,0)');
    grad.addColorStop(1, S.phase==='crashed'? 'rgba(244,63,94,.9)' : 'rgba(255,138,0,.95)');
    ctx.strokeStyle=grad; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.stroke();

    // area fill under curve
    ctx.lineTo(p.x, 0.86*H); ctx.lineTo(0.12*W,0.86*H); ctx.closePath();
    ctx.fillStyle = S.phase==='crashed'? 'rgba(244,63,94,.06)':'rgba(255,138,0,.07)';
    ctx.fill();

    // rocket
    if(S.phase==='running'){
      // exhaust particles
      if(!S.lowBw && Math.random()<.9){
        particles.push({x:p.x,y:p.y, vx:rnd(-.6,.6)-1.2, vy:rnd(-.4,.4)+1.4, life:1, c: Math.random()<.5?'#FF8A00':'#FFD166'});
      }
      drawRocket(p.x,p.y, Math.atan2(-( rocketPos(tt+.01).y-p.y),(rocketPos(tt+.01).x-p.x)));
    } else {
      // explosion
      drawBoom(p.x,p.y);
    }
    ctx.restore();
  }

  // particles
  for(let i=particles.length-1;i>=0;i--){
    const pt=particles[i]; pt.x+=pt.vx; pt.y+=pt.vy; pt.life-=.04;
    if(pt.life<=0){ particles.splice(i,1); continue; }
    ctx.globalAlpha=pt.life; ctx.fillStyle=pt.c;
    ctx.beginPath(); ctx.arc(pt.x,pt.y,2.4*pt.life+.6,0,7); ctx.fill();
  }
  ctx.globalAlpha=1;
  requestAnimationFrame(draw);
}

function drawRocket(x,y,ang){
  ctx.save(); ctx.translate(x,y); ctx.rotate(-0.9 + ang*0); // keep nose up-right
  ctx.rotate(-Math.PI/4);
  // glow
  ctx.shadowColor='#FF8A00'; ctx.shadowBlur=20;
  // body
  ctx.fillStyle='#fff';
  ctx.beginPath();
  ctx.moveTo(0,-13); ctx.quadraticCurveTo(7,-3,6,8); ctx.lineTo(-6,8); ctx.quadraticCurveTo(-7,-3,0,-13); ctx.fill();
  // window
  ctx.shadowBlur=0; ctx.fillStyle='#9B5CF6';
  ctx.beginPath(); ctx.arc(0,-2,3,0,7); ctx.fill();
  // fins
  ctx.fillStyle='#FF8A00';
  ctx.beginPath(); ctx.moveTo(-6,4); ctx.lineTo(-11,11); ctx.lineTo(-6,8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6,4); ctx.lineTo(11,11); ctx.lineTo(6,8); ctx.fill();
  // flame
  const f = 8+Math.sin(performance.now()/40)*4;
  ctx.fillStyle='rgba(255,209,102,.95)';
  ctx.beginPath(); ctx.moveTo(-4,8); ctx.lineTo(0,8+f); ctx.lineTo(4,8); ctx.fill();
  ctx.restore();
}
function drawBoom(x,y){
  ctx.save(); ctx.translate(x,y);
  ctx.shadowColor='#F43F5E'; ctx.shadowBlur=30;
  ctx.fillStyle='rgba(244,63,94,.9)';
  for(let i=0;i<8;i++){ ctx.beginPath(); const a=i/8*7; ctx.arc(Math.cos(a)*8,Math.sin(a)*8,5,0,7); ctx.fill(); }
  ctx.restore();
}

/* ============================================================
   ROUND LIFECYCLE
   ============================================================ */
async function newServerSeed(){
  S.prevServerSeed = S.serverSeed;
  S.serverSeed = randSeed();
  S.serverSeedHash = await sha256Hex(S.serverSeed);
  $('fSeedHash').textContent = S.serverSeedHash;
  $('fSeedReveal').textContent = S.prevServerSeed;
  $('fNonce').textContent = S.nonce;
}

async function startBetting(){ if(!ENGINE_ALIVE) return;
  S.phase='betting';
  S.mult=1.00; S.cashedOut=false; S.bet_placed=false; S.bet_amount=0;
  particles=[];
  await newServerSeed();
  // compute crash point for THIS round now (provably fair, fixed before round)
  const hmac = await hmacHex(S.serverSeed, `${S.clientSeed}:${S.nonce}`);
  S.crashAt = crashFromHmac(hmac);
  S.thisHmac = hmac;

  // bots decide their targets
  S.bots.forEach(b=>{ b.active=Math.random()<.7; b.done=false; b.bet=Math.round(rnd(20,800)/10)*10; b.target=rnd(1.15,8); });

  // if a bet was queued, place it now
  if(S.queuedBet && S.balance>=S.bet){
    S.queuedBet=false; placeBet(true);
  }

  showCountdown(5000, startRunning);
  renderAction();
}

// Shared countdown UI. onDone is null in net mode (the server starts the round).
function showCountdown(ms, onDone){
  $('centerMain').style.display='none';
  $('countWrap').style.display='flex';
  const total=Math.max(1,ms); let left=ms;
  $('countNum').textContent=Math.max(0,Math.ceil(left/1000));
  $('countBar').style.transform='scaleX(1)';
  clearInterval(S.cdTimer);
  S.cdTimer=_int(()=>{
    left-=100;
    $('countBar').style.transform='scaleX('+Math.max(0,left/total)+')';
    const sec=Math.max(0,Math.ceil(left/1000));
    if(sec!==+$('countNum').textContent && left>0){ $('countNum').textContent=sec; if(sec<=3) sfx.tick(); }
    if(left<=0){ clearInterval(S.cdTimer); if(onDone) onDone(); }
  },100);
}

function startRunning(){
  S.phase='running';
  S.startTs=performance.now();
  $('countWrap').style.display='none';
  $('centerMain').style.display='block';
  $('status').textContent='FLY HIGHER, CASH OUT SOONER!';
  $('mult').classList.remove('crashed-tag');
  sfx.launch();
  renderAction();
  tickRun();
}

function multAt(t){ // exponential growth; ~ reaches 2x at ~4.2s
  return Math.max(1, Math.pow(Math.E, 0.16*t));
}

function tickRun(){ if(!ENGINE_ALIVE) return;
  if(S.phase!=='running') return;
  const t=(performance.now()-S.startTs)/1000;
  S.mult = multAt(t);

  if(S.mode==='local'){
    if(S.mult>=S.crashAt){
      S.mult=S.crashAt; S.crashTime=t;
      return crash();
    }
    // auto cashout (server handles this in net mode)
    if(S.bet_placed && !S.cashedOut && S.auto>0 && S.mult>=S.auto){ doCashout(); }
    // bots cash out (server sends winners in net mode)
    S.bots.forEach(b=>{
      if(b.active && !b.done && S.mult>=b.target && b.target<S.crashAt){
        b.done=true; addWinner(b.name,b.color,b.target,b.bet*b.target);
      }
    });
  }

  // UI
  $('mult').textContent=S.mult.toFixed(2)+'x';
  const col = S.mult<2? '#fff' : S.mult<5? 'var(--primary)' : S.mult<10? 'var(--secondary)':'var(--success)';
  $('mult').style.color=col;
  $('status').textContent = 'FLY HIGHER, CASH OUT SOONER!';
  if(S.bet_placed && !S.cashedOut) renderAction();
  requestAnimationFrame(tickRun);
}

function crash(){
  S.phase='crashed'; shakeT=240;
  $('mult').textContent=S.crashAt.toFixed(2)+'x';
  $('mult').classList.add('crashed-tag');
  $('status').textContent=T('crashed')+' — '+T('flew');
  sfx.crash();

  // bust any active un-cashed bet
  if(S.bet_placed && !S.cashedOut){ S.bet_placed=false; flashWon('-€'+fmt(S.bet_amount), false); }
  if(S.curBet) recordLoss();   // resolve the round's bet (win already cleared curBet)

  // record provably-fair last round
  S.lastRound = { nonce:S.nonce, serverSeed:S.serverSeed, clientSeed:S.clientSeed, hmac:S.thisHmac, crash:S.crashAt };
  pushRound({ nonce:S.nonce, crash:S.crashAt, serverSeed:S.serverSeed, clientSeed:S.clientSeed, hmac:S.thisHmac, serverSeedHash:S.serverSeedHash });
  pushHistory(S.crashAt);
  S.nonce++;
  renderAction();
  sysChat(`Round #${S.nonce-1} crashed @ ${S.crashAt.toFixed(2)}x`);

  setTimeout(startBetting, 3200);
}

/* ============================================================
   BETTING ACTIONS
   ============================================================ */
function placeBet(silent){
  if(S.balance<S.bet) return;
  if(S.mode==='net'){ NET.sock.emit('bet:place',{amount:S.bet, auto:S.auto}); if(!silent) sfx.bet(); return; }
  S.balance-=S.bet; S.bet_placed=true; S.bet_amount=S.bet; S.cashedOut=false;
  recordBetPlaced(S.nonce, S.bet_amount);
  updateBalance();
  if(!silent) sfx.bet();
  renderAction();
}
function doCashout(){
  if(!S.bet_placed||S.cashedOut) return;
  if(S.mode==='net'){ NET.sock.emit('cashout'); return; } // server confirms + pays
  S.cashedOut=true; S.bet_placed=false; S.cashedAt=S.mult;
  const win=S.bet_amount*S.mult;
  S.balance+=win; updateBalance();
  sfx.cash();
  recordWin(S.mult, win);
  addWinner('You','#22C55E',S.mult,win,true);
  flashWon('+€'+fmt(win)+'  @ '+S.mult.toFixed(2)+'x', true);
  renderAction();
}

function onAction(){
  if(S.phase==='betting'){
    if(S.bet_placed){ // cancel
      if(S.mode==='net'){ NET.sock.emit('bet:cancel'); }
      else { S.balance+=S.bet_amount; S.bet_placed=false; S.curBet=null; updateBalance(); }
    } else placeBet();
    renderAction();
  } else if(S.phase==='running'){
    if(S.bet_placed && !S.cashedOut) doCashout();
    else { // queue for next round
      S.queuedBet=!S.queuedBet; renderAction();
    }
  } else if(S.phase==='crashed'){
    S.queuedBet=!S.queuedBet; renderAction();
  }
}

function renderAction(){
  const a=$('action'), m=$('actionMain'), sub=$('actionSub');
  a.className='action'; a.disabled=false;
  if(S.phase==='betting'){
    if(S.bet_placed){ a.classList.add('cancel'); m.textContent=T('cancel'); sub.textContent='€'+fmt(S.bet_amount)+' in'; }
    else { a.classList.add('bet'); m.textContent=T('place'); sub.textContent='€'+fmt(S.bet); if(S.balance<S.bet) a.disabled=true; }
  } else if(S.phase==='running'){
    if(S.bet_placed && !S.cashedOut){
      a.classList.add('cashout'); m.textContent=T('cashout'); sub.textContent='€'+fmt(S.bet_amount*S.mult);
    } else {
      a.classList.add(S.queuedBet?'cancel':'waiting'); m.textContent=S.queuedBet?T('queued'):T('place'); sub.textContent=S.queuedBet?'next round':'€'+fmt(S.bet);
    }
  } else { // crashed
    a.classList.add(S.queuedBet?'cancel':'waiting'); m.textContent=S.queuedBet?T('queued'):T('waiting'); sub.textContent=S.queuedBet?'next round':'';
  }
}

/* ============================================================
   UI: winners, chat, history, balance
   ============================================================ */
function updateBalance(){ $('balance').textContent=fmt(S.balance); persist(); }
function flashWon(text, good){
  const el=$('youWon'); el.textContent=text;
  el.style.color = good? 'var(--success)':'var(--danger)';
  el.style.background = good? 'rgba(34,197,94,.16)':'rgba(244,63,94,.16)';
  el.style.borderColor = good? 'rgba(34,197,94,.45)':'rgba(244,63,94,.45)';
  el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2600);
}
function addWinner(name,color,mult,amt,you){
  const wrap=$('winners');
  const row=document.createElement('div'); row.className='winner';
  const initial=name[0].toUpperCase();
  row.innerHTML=`<div class="av" style="background:${color}">${initial}</div>
    <div class="nm">${you?'<span style="color:#22C55E">'+name+'</span>':name}<small>${mult.toFixed(2)}x</small></div>
    <div class="amt tnum">€${fmt(amt)}</div>`;
  wrap.prepend(row);
  while(wrap.children.length>10) wrap.lastChild.remove();
}
function multCls(v){ return v<2?'lo':v<5?'mid':v<10?'hi':'huge'; }
function crashColor(v){ return v<2?'#9aa3b2':v<5?'var(--primary)':v<10?'var(--secondary)':'var(--success)'; }
function renderPills(){
  const h=$('history'); h.innerHTML='';
  S.history.forEach(v=>{
    const p=document.createElement('span'); p.className='hp '+multCls(v); p.textContent=v.toFixed(2)+'x';
    h.appendChild(p);
  });
}
function pushHistory(m){
  S.history.unshift(m); if(S.history.length>18) S.history.pop();
  renderPills();
}
function pushRound(r){ S.rounds.unshift(r); if(S.rounds.length>50) S.rounds.pop(); }

/* ============================================================
   HISTORY & STATS (player outcomes, server-driven)
   ============================================================ */
// every placed bet resolves to exactly one record: a win (on cashout) or a
// loss (on crash). If a previous bet was somehow never resolved, settle it first.
function recordBetPlaced(nonce, amount){ if(S.curBet) recordLoss(); S.curBet={ nonce, amount }; }
function recordWin(mult, payout){
  if(!S.curBet) return;
  const amount=S.curBet.amount, profit=Math.round((payout-amount)*100)/100;
  S.myBets.unshift({ nonce:S.curBet.nonce, amount, won:true, mult, payout, profit });
  if(S.myBets.length>100) S.myBets.pop();
  const s=S.stats; s.played++; s.wins++; s.wagered+=amount; s.returned+=payout;
  s.best=Math.max(s.best,mult); s.bestWin=Math.max(s.bestWin,profit);
  s.streak++; s.bestStreak=Math.max(s.bestStreak,s.streak);
  S.curBet=null; persist(); refreshScreens();
}
function recordLoss(){
  if(!S.curBet) return;
  const amount=S.curBet.amount;
  S.myBets.unshift({ nonce:S.curBet.nonce, amount, won:false, profit:-amount });
  if(S.myBets.length>100) S.myBets.pop();
  const s=S.stats; s.played++; s.wagered+=amount; s.streak=0;
  S.curBet=null; persist(); refreshScreens();
}

function renderHistory(){
  const bb=$('histBets'); bb.innerHTML='';
  if(!S.myBets.length){ bb.innerHTML='<div class="empty">No bets yet — place your first bet 🚀</div>'; }
  else S.myBets.slice(0,50).forEach(b=>{
    const row=document.createElement('div'); row.className='bet-row';
    const res = b.won
      ? `<span class="res win">+€${fmt(b.profit)} @ ${b.mult.toFixed(2)}x</span>`
      : `<span class="res loss">−€${fmt(b.amount)}</span>`;
    row.innerHTML=`<span class="rno">#${b.nonce}</span><span class="mid">€${fmt(b.amount)} bet</span>${res}`;
    bb.appendChild(row);
  });

  const rr=$('histRounds'); rr.innerHTML='';
  if(!S.rounds.length){ rr.innerHTML='<div class="empty">Rounds will appear here as they complete.</div>'; }
  else S.rounds.slice(0,30).forEach(r=>{
    const row=document.createElement('div'); row.className='round-row';
    row.innerHTML=`<span class="rno">Round #${r.nonce}</span><span class="rc" style="color:${crashColor(r.crash)}">${r.crash.toFixed(2)}x</span>`;
    const v=document.createElement('button'); v.className='vbtn'; v.textContent='🛡️ Verify';
    if(r.hmac){ v.onclick=()=>openFairForRound(r); } else { v.disabled=true; }
    row.appendChild(v); rr.appendChild(row);
  });
}
function renderStats(){
  const s=S.stats;
  const profit=Math.round((s.returned-s.wagered)*100)/100;
  const winRate=s.played? Math.round(s.wins/s.played*100):0;
  const cards=[
    ['Net Profit', (profit>=0?'+':'−')+'€'+fmt(Math.abs(profit)), profit>=0?'var(--success)':'var(--danger)'],
    ['Balance', '€'+fmt(S.balance), '#fff'],
    ['Win Rate', winRate+'%', '#fff'],
    ['Rounds Played', String(s.played), '#fff'],
    ['Total Wagered', '€'+fmt(s.wagered), '#fff'],
    ['Best Win', '+€'+fmt(s.bestWin), 'var(--success)'],
    ['Best Multiplier', s.best.toFixed(2)+'x', 'var(--secondary)'],
    ['Best Streak', s.bestStreak+'×', 'var(--primary)'],
  ];
  $('statGrid').innerHTML=cards.map(([l,v,c])=>`<div class="stat-card"><div class="v" style="color:${c}">${v}</div><div class="l">${l}</div></div>`).join('');
}
function refreshScreens(){
  if($('screenHistory').classList.contains('show')) renderHistory();
  if($('screenStats').classList.contains('show')) renderStats();
}
function setNavActive(name){ document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active', x.dataset.nav===name)); }
function openScreen(name){
  closeScreens(false);
  if(name==='history'){ renderHistory(); $('screenHistory').classList.add('show'); }
  if(name==='stats'){ renderStats(); $('screenStats').classList.add('show'); }
  setNavActive(name);
}
function closeScreens(toGame){
  $('screenHistory').classList.remove('show');
  $('screenStats').classList.remove('show');
  if(toGame!==false) setNavActive('game');
}
function openFairForRound(r){
  $('fSeedHash').textContent = r.serverSeedHash || '(revealed below)';
  $('fSeedReveal').textContent = r.serverSeed || '—';
  $('fClientSeed').value = r.clientSeed || S.clientSeed;
  $('fNonce').textContent = r.nonce;
  $('fHmac').textContent = r.hmac || '—';
  const computed = r.hmac ? crashFromHmac(r.hmac) : null;
  $('fComputed').textContent = computed!=null ? computed.toFixed(2)+'x' : '—';
  $('fActual').textContent = r.crash.toFixed(2)+'x';
  const ok = computed!=null && Math.abs(computed-r.crash)<0.001;
  $('fMatch').innerHTML = ok ? '<span style="color:#22C55E">✓ VERIFIED</span>' : '<span style="color:#F43F5E">✗ MISMATCH</span>';
  $('fairModal').classList.add('show');
}
function addChat(name,text,sys){
  const c=$('chat'); const d=document.createElement('div'); d.className='msg'+(sys?' sys':'');
  d.innerHTML=`<b>${name}</b>${text}`; c.appendChild(d);
  while(c.children.length>60) c.firstChild.remove();
  c.scrollTop=c.scrollHeight;
}
function sysChat(t){ addChat('RocketRush', t, true); }

/* ============================================================
   CONTROLS WIRING
   ============================================================ */
function setBet(v){ S.bet=Math.max(10,Math.min(Math.round(v), Math.max(10,Math.floor(S.balance)))); $('betVal').textContent=S.bet; renderAction(); }
function setAuto(v){ S.auto = v<=1? 0 : Math.min(v,1000); $('autoVal').textContent = S.auto===0? 'OFF' : S.auto.toFixed(2); }

function clearChips(){ document.querySelectorAll('[data-betset]').forEach(x=>x.classList.remove('active')); }
function syncChips(){ clearChips(); document.querySelectorAll('[data-betset]').forEach(x=>{ if(+x.dataset.betset===S.bet) x.classList.add('active'); }); }
document.querySelectorAll('[data-bet]').forEach(b=>b.onclick=()=>{
  const step = S.bet<100?10:S.bet<500?50:100;
  setBet(S.bet + (b.dataset.bet==='+'?step:-step));
  syncChips();
});
// preset bet chips (10 / 25 / 50 / 100 / 500)
document.querySelectorAll('[data-betset]').forEach(b=>b.onclick=()=>{
  setBet(parseFloat(b.dataset.betset));
  clearChips(); b.classList.add('active');
});
document.querySelectorAll('[data-auto]').forEach(b=>b.onclick=()=>{
  const step = S.auto<2?0.1:S.auto<10?0.5:1;
  setAuto((S.auto||1) + (b.dataset.auto==='+'?step:-step));
});
document.querySelectorAll('[data-autoq]').forEach(b=>b.onclick=()=>{
  const q=b.dataset.autoq; setAuto(q==='off'?0:parseFloat(q));
});
$('action').onclick=onAction;

// chat
function sendChat(){
  const i=$('chatInput'); const v=i.value.trim(); if(!v) return;
  addChat('You', v, false); i.value='';
}
$('chatSend').onclick=sendChat;
$('chatInput').addEventListener('keydown',e=>{ if(e.key==='Enter') sendChat(); });

// sound
function syncSound(){ $('btnSound').textContent=S.sound?'🔊':'🔇'; $('btnSound').classList.toggle('off',!S.sound); $('swSound').classList.toggle('on',S.sound); }
$('btnSound').onclick=()=>{ S.sound=!S.sound; syncSound(); };

// settings modal
$('btnSettings').onclick=()=>$('settingsModal').classList.add('show');
$('badgeFair').onclick=openFair;
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{ b.closest('.modal-bg').classList.remove('show'); });
document.querySelectorAll('.modal-bg').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) m.classList.remove('show'); }));
$('swSound').onclick=()=>{ S.sound=!S.sound; syncSound(); };
$('swLow').onclick=function(){ S.lowBw=!S.lowBw; this.classList.toggle('on',S.lowBw); resize(); };
$('swReality').onclick=function(){ this.classList.toggle('on'); };
$('swSession').onclick=function(){ this.classList.toggle('on'); };
{ const rb=$('btnReset'); if(rb) rb.onclick=()=>{ resetProgress(); $('settingsModal').classList.remove('show'); }; }

// language
$('lang').onchange=e=>{ S.lang=e.target.value; renderAction(); };

// bottom navigation (Game / History / Bet / Stats / Menu)
document.querySelectorAll('.nav-item').forEach(n=>n.onclick=()=>{
  const a=n.dataset.nav;
  if(a==='menu'){ $('settingsModal').classList.add('show'); return; }
  if(a==='history'){ openScreen('history'); return; }
  if(a==='stats'){ openScreen('stats'); return; }
  if(a==='game'){ closeScreens(); }
});
// back buttons on the full-screen tabs
document.querySelectorAll('[data-screen-close]').forEach(b=>b.onclick=()=>closeScreens());
// center FAB = quick place-bet / cash-out shortcut
const fab=document.querySelector('.nav-fab'); if(fab) fab.onclick=onAction;

/* ============================================================
   PROVABLY FAIR MODAL
   ============================================================ */
async function openFair(){
  $('fSeedHash').textContent=S.serverSeedHash;
  $('fSeedReveal').textContent=S.prevServerSeed;
  $('fClientSeed').value=S.clientSeed;
  $('fNonce').textContent=S.nonce;
  if(S.lastRound){
    const r=S.lastRound;
    $('fHmac').textContent=r.hmac;
    const computed=crashFromHmac(r.hmac);
    $('fComputed').textContent=computed.toFixed(2)+'x';
    $('fActual').textContent=r.crash.toFixed(2)+'x';
    const ok=Math.abs(computed-r.crash)<0.001;
    $('fMatch').innerHTML=ok?'<span style="color:#22C55E">✓ VERIFIED</span>':'<span style="color:#F43F5E">✗ MISMATCH</span>';
  }
  $('fairModal').classList.add('show');
}
$('fClientSeed').addEventListener('change',e=>{ const v=e.target.value.trim(); if(v) S.clientSeed=v; });

/* ============================================================
   AMBIENT: online count + bot chatter
   ============================================================ */
function ambient(){
  // online count wobble
  let base = 2800 + Math.floor(rnd(-120,120));
  _int(()=>{ base += Math.floor(rnd(-25,28)); base=Math.max(1800,base); $('online').textContent=base.toLocaleString('en-US'); }, 2200);
  $('online').textContent=base.toLocaleString('en-US');
  // bot chat
  _int(()=>{
    if(Math.random()<.7){
      const n=NAMES[Math.floor(Math.random()*NAMES.length)];
      addChat(n, CHATTER[Math.floor(Math.random()*CHATTER.length)], false);
    }
  }, 3400);
}

/* ============================================================
   NETWORK: authoritative server, with graceful local fallback
   ============================================================ */
function setOnline(n){ $('online').textContent = (typeof n==='number'? n : 0).toLocaleString('en-US'); }

function netBetting(d){
  S.phase='betting'; S.mult=1.00; S.cashedOut=false; S.bet_placed=false; S.bet_amount=0; particles=[];
  S.nonce=d.nonce; S.serverSeedHash=d.serverSeedHash; S.prevServerSeed=d.prevServerSeed; if(d.clientSeed) S.clientSeed=d.clientSeed;
  $('fSeedHash').textContent=S.serverSeedHash||'—';
  $('fSeedReveal').textContent=S.prevServerSeed||'—';
  $('fNonce').textContent=S.nonce;
  if(S.queuedBet && S.balance>=S.bet){ S.queuedBet=false; placeBet(true); }
  showCountdown(d.startsInMs, null);   // the server triggers round:start
  renderAction();
}
function netStart(){
  S.phase='running'; S.startTs=performance.now();
  $('countWrap').style.display='none'; $('centerMain').style.display='block';
  $('status').textContent='FLY HIGHER, CASH OUT SOONER!';
  $('mult').classList.remove('crashed-tag');
  sfx.launch(); renderAction(); tickRun();
}
function netCrash(d){
  S.phase='crashed'; shakeT=240; S.crashAt=d.crashPoint; S.mult=d.crashPoint;
  S.crashTime=(performance.now()-S.startTs)/1000;
  $('mult').textContent=d.crashPoint.toFixed(2)+'x'; $('mult').classList.add('crashed-tag');
  $('status').textContent=T('crashed')+' — '+T('flew'); sfx.crash();
  if(S.bet_placed && !S.cashedOut){ S.bet_placed=false; flashWon('-€'+fmt(S.bet_amount), false); }
  if(S.curBet) recordLoss();   // resolve the round's bet (win already cleared curBet)
  S.lastRound={ nonce:d.nonce, serverSeed:d.serverSeed, clientSeed:d.clientSeed||S.clientSeed, hmac:d.hmac, crash:d.crashPoint };
  pushRound({ nonce:d.nonce, crash:d.crashPoint, serverSeed:d.serverSeed, clientSeed:d.clientSeed||S.clientSeed, hmac:d.hmac });
  pushHistory(d.crashPoint);
  renderAction();
}
function bindNet(sock){
  sock.on('round:betting', d=>{ if(S.mode==='net') netBetting(d); });
  sock.on('round:start',  ()=>{ if(S.mode==='net') netStart(); });
  sock.on('round:crash',  d=>{ if(S.mode==='net') netCrash(d); });
  sock.on('bet:confirmed', d=>{ S.bet_placed=true; S.bet_amount=d.amount; S.cashedOut=false; S.balance=d.balance; recordBetPlaced(S.nonce, d.amount); updateBalance(); renderAction(); });
  sock.on('bet:cancelled', d=>{ S.bet_placed=false; S.curBet=null; S.balance=d.balance; updateBalance(); renderAction(); });
  sock.on('bet:rejected',  ()=>{ renderAction(); });
  sock.on('cashout:confirmed', d=>{
    S.cashedOut=true; S.bet_placed=false; S.cashedAt=d.multiplier; S.balance=d.balance; updateBalance();
    sfx.cash(); recordWin(d.multiplier, d.payout); addWinner('You','#22C55E',d.multiplier,d.payout,true);
    flashWon('+€'+fmt(d.payout)+'  @ '+d.multiplier.toFixed(2)+'x', true); renderAction();
  });
  sock.on('winner', d=>{ if(d.name!=='You') addWinner(d.name, d.color||'#FF8A00', d.multiplier, d.amount); });
  sock.on('chat',   d=>{ addChat(d.user, d.text, false); });
  sock.on('players',d=>{ setOnline(d.count); });
  sock.on('welcome',d=>{ S.balance=d.balance; updateBalance(); setOnline(d.online); });
  sock.on('balance',d=>{ S.balance=d.balance; updateBalance(); });
  sock.on('history',d=>{
    S.rounds=(d.rounds||[]).map(r=>({ nonce:r.nonce, crash:r.crash, serverSeed:r.serverSeed, clientSeed:r.clientSeed, hmac:r.hmac }));
    if(S.rounds.length){ S.history=S.rounds.slice(0,18).map(r=>r.crash); renderPills(); }
    refreshScreens();
  });
}
function startLocal(){
  if(S.mode==='net') return;
  S.mode='local';
  sysChat('Offline mode — playing a local simulation. Start the game server for live multiplayer.');
  ambient();
  startBetting();
}
function connectNet(){
  let settled=false;
  try{
    const proto = location.protocol==='https:' ? 'https' : 'http';
    const url = `${proto}://${location.hostname||'localhost'}:${NET.port}`;
    const sock = io(url, { transports:['websocket','polling'], reconnection:true, timeout:1500, auth:{ playerId:getPid() } });
    NET.sock=sock;
    bindNet(sock);
    sock.on('connect', ()=>{
      if(!settled){ settled=true; S.mode='net'; clearInterval(S.cdTimer); sysChat('🌍 Connected — playing live with everyone online.'); }
    });
    sock.on('connect_error', ()=>{ if(!settled){ settled=true; try{sock.close();}catch(e){} startLocal(); } });
    setTimeout(()=>{ if(!settled){ settled=true; try{sock.close();}catch(e){} startLocal(); } }, 1800);
  }catch(e){
    startLocal();
  }
}

/* ============================================================
   PERSISTENCE: balance (server-authoritative) + history/stats (local)
   ============================================================ */
function getPid(){ try{ let p=localStorage.getItem('rr_pid'); if(!p){ p=randSeed(); localStorage.setItem('rr_pid',p); } return p; }catch(e){ return randSeed(); } }
function persist(){
  try{ localStorage.setItem('rr_save', JSON.stringify({ v:1, balance:S.balance, myBets:S.myBets.slice(0,100), stats:S.stats })); }catch(e){}
}
function loadSave(){
  try{
    const j=JSON.parse(localStorage.getItem('rr_save')||'null');
    if(j && j.v===1){
      if(Array.isArray(j.myBets)) S.myBets=j.myBets;
      if(j.stats) S.stats=Object.assign(S.stats, j.stats);
      if(typeof j.balance==='number') S.balance=j.balance;  // local mode; net welcome overrides
    }
  }catch(e){}
}
function resetProgress(){
  S.myBets=[]; S.curBet=null;
  S.stats={ played:0, wins:0, wagered:0, returned:0, best:0, bestWin:0, streak:0, bestStreak:0 };
  if(S.mode==='net' && NET.sock){ NET.sock.emit('reset'); } else { S.balance=1000; updateBalance(); }
  persist(); refreshScreens();
}

/* ============================================================
   BOOT
   ============================================================ */
function seedWinners(){
  for(let i=0;i<6;i++){
    const n=NAMES[Math.floor(Math.random()*NAMES.length)];
    const m=rnd(1.2,9), bet=Math.round(rnd(20,500)/10)*10;
    addWinner(n,COLORS[i%COLORS.length],m,bet*m);
  }
}
function seedHistory(){
  const demo=[1.23,2.15,8.42,1.08,12.65,2.34,1.91];
  // pushHistory prepends (newest = leftmost), so insert reversed to keep order
  [...demo].reverse().forEach(v=>pushHistory(v));
}
function boot(){
  S.bots=makeBots(18);
  resize();
  requestAnimationFrame(draw);
  seedWinners();
  seedHistory();
  loadSave();   // restore balance (local) + history/stats from a previous session
  sysChat('Welcome to RocketRush 🚀  Place a bet, cash out before the crash.');
  syncSound();
  updateBalance();
  setBet(100); setAuto(2.00);
  connectNet();   // tries the live server; falls back to local simulation
}
boot();


  return () => { ENGINE_ALIVE = false; _ints.forEach(clearInterval); if (typeof S !== "undefined" && S.cdTimer) clearInterval(S.cdTimer); try { if (NET.sock) NET.sock.close(); } catch (e) {} };
}
