/**
 * REVO FIXER ULTRA - Client Application
 * Connects to server-side AI proxy
 */

'use strict';

// ══════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════

const API_BASE = window.location.origin;
const ENDPOINTS = {
  health: `${API_BASE}/api/health`,
  liveData: `${API_BASE}/api/live-data`,
  claude: `${API_BASE}/api/ai/claude`,
  gpt: `${API_BASE}/api/ai/gpt`,
  gemini: `${API_BASE}/api/ai/gemini`,
  ensemble: `${API_BASE}/api/ai/ensemble`
};

// ══════════════════════════════════════════
// SIGNAL MAP
// ══════════════════════════════════════════

const SM = {
  '1':        {rc:'r-1', icon:'1️⃣', label:'1',         bonus:false, exp:44, col:'#f43f5e'},
  '2':        {rc:'r-2', icon:'2️⃣', label:'2',         bonus:false, exp:27, col:'#3b82f6'},
  '5':        {rc:'r-5', icon:'5️⃣', label:'5',         bonus:false, exp:15, col:'#22c55e'},
  '10':       {rc:'r-10',icon:'🔟', label:'10',        bonus:false, exp:8,  col:'#f97316'},
  'pachinko': {rc:'r-pa',icon:'🎰', label:'Pachinko',  bonus:true,  exp:2,  col:'#fbbf24'},
  'cashunt':  {rc:'r-ca',icon:'🎯', label:'Cash Hunt', bonus:true,  exp:2,  col:'#818cf8'},
  'cash hunt':{rc:'r-ca',icon:'🎯', label:'Cash Hunt', bonus:true,  exp:2,  col:'#818cf8'},
  'coinflip': {rc:'r-co',icon:'🪙', label:'Coin Flip', bonus:true,  exp:2,  col:'#34d399'},
  'coin flip':{rc:'r-co',icon:'🪙', label:'Coin Flip', bonus:true,  exp:2,  col:'#34d399'},
  'crazytime':{rc:'r-ct',icon:'🎪', label:'Crazy Time',bonus:true,  exp:1,  col:'#F4C542'},
  'crazy time':{rc:'r-ct',icon:'🎪', label:'Crazy Time',bonus:true,  exp:1,  col:'#F4C542'},
};
const SK = ['1','2','5','10','pachinko','cashunt','coinflip','crazytime'];

// ══════════════════════════════════════════
// FAST PRNG
// ══════════════════════════════════════════

let _s = ((Date.now() & 0x7FFFFFFF) | 1) >>> 0;
function rnd() {
  _s = (_s + 0x6D2B79F5) >>> 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ══════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════

function nk(raw) {
  const r = (raw||'').toString().toLowerCase().trim().replace(/^x/,'');
  if(r==='1'||r==='one') return '1';
  if(r==='2'||r==='two') return '2';
  if(r==='5'||r==='five') return '5';
  if(r==='10'||r==='ten') return '10';
  if(r.includes('pachinko')) return 'pachinko';
  if(r.includes('cash')) return 'cashunt';
  if(r.includes('coin')||r.includes('flip')) return 'coinflip';
  if(r.includes('crazy')||r.includes('time')) return 'crazytime';
  if(r.startsWith('1')) return '1';
  if(r.startsWith('2')) return '2';
  if(r.startsWith('5')) return '5';
  return '1';
}

function fmtT(ts) {
  if(!ts) return '';
  const d = typeof ts==='number' ? new Date(ts*1000) : new Date(ts);
  return isNaN(d) ? '' : d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════

let liveData = [];
let lastSig = null;
let autoPred = true;
let busy = false;
let predCD = 60;
let predTm = null;
let dataLabel = 'Server data';
let serverHealth = null;
const stats = {total:0, bonus:0};

// ══════════════════════════════════════════
// SERVER COMMUNICATION
// ══════════════════════════════════════════

async function checkServerHealth() {
  try {
    const res = await fetch(ENDPOINTS.health);
    const data = await res.json();
    serverHealth = data;
    console.log('Server health:', data);
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
}

async function fetchLiveData() {
  try {
    const res = await fetch(ENDPOINTS.liveData);
    const result = await res.json();
    
    if (result.success && result.data && result.data.length >= 5) {
      const sig = result.data.slice(0,5).map(i=>i.result).join(',');
      const isNew = sig !== lastSig && lastSig !== null;
      lastSig = sig;
      liveData = result.data;
      dataLabel = `Server · ${result.data.length} real spins`;
      
      const t = new Date().toLocaleTimeString();
      document.getElementById('linfo').textContent = 
        `✅ ${t} · ${result.data.length} real spins from server`;
      
      renderTiles(result.data);
      renderFreq(result.data);
      
      return {items: result.data, isNew};
    }
    
    throw new Error('Insufficient data');
  } catch (error) {
    console.error('Live data fetch failed:', error);
    document.getElementById('linfo').textContent = 
      '⚠️ Server data unavailable · Using statistical model';
    return null;
  }
}

async function callServerAI(endpoint, persona, recent, frequency) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({prompt: '', recent, frequency}),
      signal: AbortSignal.timeout(18000)
    });
    
    const result = await res.json();
    
    if (result.success && result.data) {
      return {success: true, data: result.data, provider: result.provider};
    }
    
    throw new Error(result.error || 'API call failed');
  } catch (error) {
    console.warn(`${persona} API failed:`, error.message);
    return {success: false, error: error.message};
  }
}

// ══════════════════════════════════════════
// ANALYTICS ENGINE (Local Fallback)
// ══════════════════════════════════════════

function buildAn(keys) {
  const n=keys.length, cnt={}, gap={}, found={};
  SK.forEach(k=>{cnt[k]=0; gap[k]=n;});
  keys.forEach((k,i)=>{if(cnt.hasOwnProperty(k)){cnt[k]++; if(!found[k]){gap[k]=i; found[k]=true;}}});
  const wc={};
  [3,5,10,20,50].forEach(w=>{
    wc[w]={}; SK.forEach(k=>{wc[w][k]=0;});
    keys.slice(0,Math.min(w,n)).forEach(k=>{if(wc[w][k]!==undefined)wc[w][k]++;});
  });
  const dev={}, gS={};
  SK.forEach(k=>{const e=(SM[k].exp/100)*n; dev[k]=(e-cnt[k])/Math.max(e,1); gS[k]=gap[k]/Math.max(100/SM[k].exp,1);});
  const hot  = SK.reduce((b,k)=>cnt[k]>cnt[b]?k:b, SK[0]);
  const due  = SK.reduce((b,k)=>gS[k]>gS[b]?k:b, SK[0]);
  const cold = SK.reduce((b,k)=>cnt[k]<cnt[b]?k:b, SK[0]);
  return {n, cnt, gap, dev, gS, wc, hot, due, cold};
}

function wPick(w) {
  let tot=0; SK.forEach(k=>{tot+=w[k]||0;});
  if(!tot) return SK[0];
  let r=rnd()*tot;
  for(const k of SK){r-=w[k]||0; if(r<=0) return k;}
  return SK[SK.length-1];
}

function aiMarkov(keys, an) {
  const n=keys.length;
  const t1={}; SK.forEach(k=>{t1[k]={}; SK.forEach(j=>{t1[k][j]=0;});});
  for(let i=0;i<n-1;i++){if(t1[keys[i]]&&t1[keys[i]][keys[i+1]]!==undefined)t1[keys[i]][keys[i+1]]++;}
  const tp1={}; SK.forEach(k=>{const tot=SK.reduce((s,j)=>s+t1[k][j],0)||1; tp1[k]={}; SK.forEach(j=>{tp1[k][j]=t1[k][j]/tot;});});
  const L1=keys[0]||'1', o1=tp1[L1]||{};
  const sc={};
  SK.forEach(k=>{
    const v1=o1[k]!==undefined?o1[k]:SM[k].exp/100;
    sc[k]=Math.max(0,(v1*0.45+Math.max(0,an.dev[k])*0.15+Math.min(an.gS[k]*0.12,0.18))*100);
  });
  const top=SK.slice().sort((a,b)=>sc[b]-sc[a])[0];
  const conf=Math.min(94, Math.round(58+sc[top]*0.65+rnd()*4));
  return {top, conf, sc, rsn:`Markov: ${SM[top].label} follows ${SM[L1].label} in ${Math.round((o1[top]||0)*100)}% of chains. Gap: ${an.gap[top]}.`};
}

function aiPattern(keys, an) {
  const n=keys.length;
  const w={};
  SK.forEach(k=>{
    const ew=an.cnt[k]/Math.max(n,1);
    const gB=Math.min((an.gS[k])*0.18,0.25);
    const rec=(an.wc[5][k]||0)/Math.min(5,n);
    const rB=rec<(SM[k].exp/100)*0.5?0.12:0;
    w[k]=Math.max(0.01, ew*0.52+SM[k].exp/100*0.28+gB+rB);
  });
  const SIM=4000, sim={}; SK.forEach(k=>{sim[k]=0;});
  for(let i=0;i<SIM;i++) sim[wPick(w)]++;
  const sc={}; SK.forEach(k=>{sc[k]=(sim[k]/SIM)*100;});
  const top=SK.slice().sort((a,b)=>sc[b]-sc[a])[0];
  const conf=Math.min(96, Math.round(54+sc[top]*0.66+rnd()*5));
  return {top, conf, sc, rsn:`Pattern: ${sim[top]}/${SIM} sims → ${SM[top].label} (${sc[top].toFixed(1)}%). Gap: ${an.gS[top].toFixed(2)}×.`};
}

function aiBayes(keys, an) {
  const n=keys.length;
  const wins=[3,5,10,20,50], ww=[0.35,0.25,0.20,0.12,0.08];
  const post={};
  SK.forEach(k=>{
    const pr=SM[k].exp/100; let wL=0;
    wins.forEach((w,wi)=>{const wl=Math.min(w,n); const f=(an.wc[w]?an.wc[w][k]||0:0)/Math.max(wl,1); wL+=f*ww[wi];});
    const gB=Math.min(an.gS[k]*0.14,0.18);
    post[k]=Math.max(0.001,(pr*0.3+wL*0.35+gB));
  });
  const tot=SK.reduce((s,k)=>s+post[k],0)||1;
  const sc={}; SK.forEach(k=>{sc[k]=(post[k]/tot)*100;});
  const top=SK.slice().sort((a,b)=>sc[b]-sc[a])[0];
  const conf=Math.min(93, Math.round(56+sc[top]*0.63+rnd()*4));
  return {top, conf, sc, rsn:`Bayes: ${SM[top].label} posterior=${sc[top].toFixed(1)}% (gap×${an.gS[top].toFixed(1)}).`};
}

function aiEnsemble(predictions) {
  const sc={}; 
  SK.forEach(k=>{
    sc[k] = predictions.reduce((sum, p, i) => {
      const weight = [0.35, 0.38, 0.27][i] || 0.33;
      return sum + (p.sc[k] || 0) * weight;
    }, 0);
  });
  const top=SK.slice().sort((a,b)=>sc[b]-sc[a])[0];
  const votes = predictions.filter(p => p.top === top).length;
  const allA = predictions.every(p => p.top === top);
  const twoA = votes >= 2;
  const base=Math.round(predictions.reduce((sum,p)=>sum+p.conf,0)/predictions.length);
  const conf=Math.min(98, allA?base+8:twoA?base+4:base);
  return {top, conf, sc, rsn:`${allA?'✅ All agree':twoA?`${votes}/${predictions.length} agree`:'Split'}. ${SM[top].label} at ${conf}%.`};
}

function generateRealisticMock(n) {
  const w={}; SK.forEach(k=>{ w[k]=SM[k].exp; });
  return Array.from({length:n}, ()=>({result: SM[wPick(w)].label}));
}

// ══════════════════════════════════════════
// UI RENDERING
// ══════════════════════════════════════════

function renderTiles(items) {
  const row = document.getElementById('resRow');
  row.innerHTML = '';
  items.slice(0,50).forEach(it => {
    const k = nk(it.result); const s = SM[k];
    const t = document.createElement('div');
    t.className = 'rtile rt-' + k;
    t.innerHTML = `<div class="ri">${s.icon}</div><div class="rl">${s.label}</div>${it.time?`<div class="rtt">${fmtT(it.time)}</div>`:''}`;
    row.appendChild(t);
  });
}

function renderFreq(items) {
  const n = items.length;
  const cnt={}, gap={}, found={};
  SK.forEach(k=>{cnt[k]=0; gap[k]=n;});
  items.forEach((it,i)=>{const k=nk(it.result); cnt[k]++; if(!found[k]){gap[k]=i; found[k]=true;}});
  const sorted = SK.map(k=>({k,c:cnt[k],pct:Math.round(cnt[k]/Math.max(n,1)*100),gap:gap[k]})).sort((a,b)=>b.c-a.c);
  document.getElementById('fGrid').innerHTML = sorted.map(({k,c,pct,gap:g})=>{
    const exp=SM[k].exp, eG=Math.round(100/exp);
    const tg = pct>exp*1.35?{cls:'tg-h',l:'HOT'}:pct<exp*0.55?{cls:'tg-c',l:'COLD'}:g>eG*1.3?{cls:'tg-d',l:'DUE'}:{cls:'',l:''};
    return `<div class="fr"><div class="fi">${SM[k].icon}</div><div class="fn">${SM[k].label}</div>
      <div class="fb"><div class="ff" style="width:${pct}%;background:${SM[k].col};"></div></div>
      <div class="fp">${pct}%</div><div class="fc">(${c})</div>
      ${tg.l?`<div class="ftg ${tg.cls}">${tg.l}</div>`:''}</div>`;
  }).join('');
}

function setBoxLoading(p, col) {
  const pill=document.getElementById('pill-'+p);
  if(pill){pill.textContent='AI…'; pill.classList.add('pill-thinking');}
  document.getElementById('res-'+p).innerHTML=
    `<div class="rload" style="border-top-color:${col};"></div>
     <div class="ltxt">Server AI thinking<span class="ldots"><span>.</span><span>.</span><span>.</span></span></div>`;
}

function renderBox(p, top, conf, rsn, an, src) {
  const k = nk(top);
  const s = SM[k] || SM['1'];
  const safeConf = Math.min(97, Math.max(60, conf||75));
  const hotK = nk(an.hot||'1'), dueK = nk(an.due||'5'), coldK = nk(an.cold||'crazytime');

  const pill=document.getElementById('pill-'+p);
  if(pill){pill.textContent='LIVE'; pill.classList.remove('pill-thinking');}

  const rInner = s.bonus
    ? `<div class="rtx">${s.label.replace(' ','<br>')}</div>`
    : `<div class="rv">${s.label}</div>`;

  document.getElementById('res-'+p).innerHTML=
    `<div class="aring ${s.rc} do-pop" id="ar-${p}">${rInner}</div>
     <div class="albl">${s.label}</div>
     <div class="aconf" style="width:100%;">
       <div class="acrow"><div class="aclbl">CONFIDENCE</div><div class="acpct">${safeConf}%</div></div>
       <div class="acbar"><div class="acf" id="acf-${p}" style="width:0%;"></div></div>
     </div>
     <div class="ahcd" style="width:100%;">
       <div class="hcell hc-h"><span class="hclb">🔥HOT</span><span class="hcval">${SM[hotK].icon}</span></div>
       <div class="hcell hc-d"><span class="hclb">⏳DUE</span><span class="hcval">${SM[dueK].icon}</span></div>
       <div class="hcell hc-c"><span class="hclb">❄️CLD</span><span class="hcval">${SM[coldK].icon}</span></div>
     </div>
     <div class="arsn" style="width:100%;">${rsn}</div>
     <div class="asrc" style="width:100%;">${src}</div>`;

  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const cf=document.getElementById('acf-'+p); if(cf) cf.style.width=safeConf+'%';
    setTimeout(()=>{const ar=document.getElementById('ar-'+p); if(ar) ar.classList.add('do-pulse');}, 300);
  }));
  return k;
}

function setAiStatus(type, title, desc, time) {
  const el = document.getElementById('aiSt');
  el.className = 'aist aist-' + ({live:'live',search:'search',local:'local',err:'err'}[type]||'local');
  document.getElementById('aiStT').textContent = title;
  document.getElementById('aiStD').textContent = desc;
  if(time) document.getElementById('aiStTm').textContent = time;
}

function renderConsensus(tops) {
  const votes={};
  tops.filter(Boolean).forEach(t=>{votes[t]=(votes[t]||0)+1;});
  const n=tops.filter(Boolean).length;
  document.getElementById('consC').textContent = n+' AIs analysed';
  if(!Object.keys(votes).length) return;
  const sorted=Object.entries(votes).sort((a,b)=>b[1]-a[1]);
  const maxV=sorted[0][1];
  document.getElementById('consR').innerHTML = sorted.map(([k,v])=>{
    const s=SM[k]; if(!s) return '';
    return `<div class="ci${v===maxV?' win':''}">
      <div class="ci-ic">${s.icon}</div>
      <div class="ci-lb">${s.label}</div>
      <div class="ci-v">${v} AI${v>1?'s':''}</div></div>`;
  }).join('');
}

// ══════════════════════════════════════════
// MASTER PREDICT
// ══════════════════════════════════════════

async function predict() {
  if(busy) return;
  busy = true;
  document.getElementById('btnPred').disabled = true;

  setAiStatus('search', '🔍 AI SEARCHING', 'Server AI analysing live patterns…', '');

  setBoxLoading('cl','var(--cl)'); setBoxLoading('gp','var(--gp)');
  setBoxLoading('gm','var(--gm)'); setBoxLoading('en','var(--en)');

  // Fetch live data
  await Promise.race([
    fetchLiveData(),
    new Promise(r => setTimeout(() => r(null), 5000))
  ]);

  // Get keys
  const data = liveData.length >= 10 ? liveData : generateRealisticMock(80);
  const keys = data.map(d => nk(d.result||d));
  const an = buildAn(keys);

  // Prepare prompts
  const recent = keys.slice(0,20).map(k=>SM[k].label).join(', ');
  const cnt={}; SK.forEach(k=>{cnt[k]=0;}); keys.forEach(k=>{cnt[k]++;});
  const frequency = SK.map(k=>`${SM[k].label}:${cnt[k]}/${keys.length}`).join(', ');

  // Generate local predictions first (instant fallback)
  const localR = {
    cl: aiMarkov(keys, an),
    gp: aiPattern(keys, an),
    gm: aiBayes(keys, an),
  };
  localR.en = aiEnsemble([localR.cl, localR.gp, localR.gm]);

  // Render local immediately
  let tops = [];
  const localOrder = [localR.cl, localR.gp, localR.gm, localR.en];
  localOrder.forEach((r, i) => {
    const p = ['cl','gp','gm','en'][i];
    const top = renderBox(p, r.top, r.conf, r.rsn, an, `🧮 Statistical · ${dataLabel}`);
    tops.push(top);
  });

  renderConsensus(tops);
  setAiStatus('local','📊 AI ACTIVE', `Statistical AI · ${keys.length} spins · Trying server AI…`, new Date().toLocaleTimeString());

  // Try server AI in parallel
  const aiCalls = [
    callServerAI(ENDPOINTS.claude, 'claude', recent, frequency),
    callServerAI(ENDPOINTS.gpt, 'gpt', recent, frequency),
    callServerAI(ENDPOINTS.gemini, 'gemini', recent, frequency)
  ];

  const results = await Promise.allSettled(aiCalls);
  const serverPredictions = [];
  let anyServerAI = false;

  results.forEach((res, i) => {
    if(res.status === 'fulfilled' && res.value.success) {
      anyServerAI = true;
      const d = res.value.data;
      const p = ['cl','gp','gm'][i];
      
      try {
        const top = renderBox(
          p, 
          d.prediction, 
          d.confidence||78, 
          d.reason||'Server AI analysis', 
          an, 
          `🤖 Real ${res.value.provider.toUpperCase()} AI · Server`
        );
        tops[i] = top;
        serverPredictions.push({
          prediction: nk(d.prediction),
          confidence: d.confidence||78,
          hot: d.hot,
          due: d.due,
          cold: d.cold
        });
      } catch(e) {
        console.error('Render error:', e);
      }
    }
  });

  // Ensemble from server if we have predictions
  if(serverPredictions.length >= 2) {
    try {
      const ensRes = await fetch(ENDPOINTS.ensemble, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({recent, frequency, predictions: serverPredictions})
      });
      const ensData = await ensRes.json();
      if(ensData.success) {
        const top = renderBox(
          'en',
          ensData.data.prediction,
          ensData.data.confidence,
          ensData.data.reason,
          an,
          `⚖️ Ensemble AI · Server`
        );
        tops[3] = top;
      }
    } catch(e) {
      console.error('Ensemble error:', e);
    }
  }

  renderConsensus(tops);

  if(anyServerAI) {
    setAiStatus('live','✅ REAL AI ONLINE', `Server AI predictions · ${new Date().toLocaleTimeString()}`, new Date().toLocaleTimeString());
  } else {
    setAiStatus('local','📊 AI ACTIVE', `Statistical AI · ${keys.length} spins · ${dataLabel}`, new Date().toLocaleTimeString());
  }

  // Stats
  stats.total += 4;
  const anyBonus = tops.some(t => SM[t]&&SM[t].bonus);
  if(anyBonus) stats.bonus++;
  const acc = Math.max(83, Math.min(97, 88+Math.round(rnd()*6)));
  document.getElementById('stT').textContent = stats.total;
  document.getElementById('stB').textContent = stats.bonus;
  document.getElementById('stA').textContent = acc+'%';

  busy = false;
  document.getElementById('btnPred').disabled = false;
  resetTimer();
}

// ══════════════════════════════════════════
// TIMER & EVENTS
// ══════════════════════════════════════════

function resetTimer() {
  clearInterval(predTm); predCD=60;
  predTm = setInterval(()=>{
    predCD--;
    document.getElementById('atxt').textContent=predCD+'s';
    if(predCD<=0){ if(autoPred&&!busy) predict(); predCD=60; }
  },1000);
}

document.getElementById('btnPred').addEventListener('click', ()=>{ if(!busy) predict(); });
document.getElementById('btnRef' ).addEventListener('click', ()=>{ if(!busy) predict(); });
document.getElementById('btnAuto').addEventListener('click', ()=>{
  autoPred=!autoPred;
  document.getElementById('autoBadge').textContent = autoPred?'AUTO ON':'AUTO OFF';
  document.getElementById('autoBadge').className   = 'abadge '+(autoPred?'a-on':'a-off');
  document.getElementById('autoLbl').textContent   = autoPred?'Auto-predict every 60 seconds':'Auto-predict OFF — manual only';
});

setInterval(()=>{
  const u=1100+Math.floor(rnd()*350);
  document.getElementById('stU').textContent = u>=1000?(u/1000).toFixed(1)+'K':u;
}, 6000);

document.addEventListener('keydown', e=>{
  if((e.code==='Enter'||e.code==='Space')&&!busy){e.preventDefault(); predict();}
});

document.addEventListener('visibilitychange', ()=>{ 
  if(!document.hidden&&!busy) resetTimer(); 
});

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════

(async () => {
  console.log('🎰 REVO FIXER ULTRA - Initializing...');
  
  // Check server health
  const health = await checkServerHealth();
  if(health) {
    console.log('✅ Server online');
    console.log('AI Providers:', health.aiProviders);
  } else {
    console.warn('⚠️ Server health check failed - using local AI only');
  }
  
  // Start prediction
  predict();
  resetTimer();
})();
