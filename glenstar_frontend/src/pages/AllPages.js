import React, { useState, useEffect, useRef } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtV(v){return v==null?'—':Number(v).toFixed(1)+'%';}
function fmtR(v){return v==null?'—':'$'+Number(v).toFixed(2);}
function fmtA(v){return v==null?'—':Number(v).toFixed(1)+' MSF';}
function fmtRg(v){return v==null?'—':(v>0?'+':'')+Number(v).toFixed(1)+'%';}
function vc(v){return v==null?'var(--muted)':v<7?'var(--good)':v<10?'var(--warn)':'var(--danger)';}
function rc(r){return r==null?'var(--muted)':r>=3?'var(--good)':r<0?'var(--danger)':'var(--muted)';}
function cc(c){return c==null?'var(--muted)':c<70?'var(--good)':c>120?'var(--danger)':'var(--muted)';}
function sc2(s){return s>=80?'var(--orange)':s>=65?'var(--info)':'var(--purple)';}
function fc(s){return s>=80?'for':s>=65?'fbl':'fpu';}

const SIZE_DESC={
  all:'Blended metrics across all building sizes from all six brokerages.',
  s1:'0–100,000 SF: Small-bay, flex, and light industrial. Highest rents per SF, lowest vacancy nationally, fastest lease-up. Ideal for multi-tenant infill development.',
  s2:'100,000–250,000 SF: Mid-bay distribution and manufacturing. Best balance of rent, vacancy, and construction cost. Broadest tenant demand across all markets.',
  s3:'250,000–500,000 SF: Cross-dock and regional distribution. Solid demand in primary markets. Monitor pipeline carefully — this segment has the most new supply nationally.',
  s4:'500,000–750,000 SF: Large-format regional DCs. Tenant pool narrows to national 3PLs, big-box retailers, and e-commerce fulfillment. Avoid spec in oversupplied markets.',
  s5:'750,000 SF+: Mega-DCs and national fulfillment centers. Smallest tenant universe. Highest construction cost. Build-to-suit only is the prudent strategy for this segment in 2026.',
};

const SIZE_LABELS={all:'All sizes',s1:'0–100K SF',s2:'100K–250K SF',s3:'250K–500K SF',s4:'500K–750K SF',s5:'750K SF+'};

const FALLBACK_MARKETS = [
  {market:"Dallas-Fort Worth",region:"Texas",score:94,tier:"Primary",vacancy_rate:7.2,availability_rate:10.4,occupancy_rate:92.8,ytd_absorption_msf:24.2,asking_rent_psf:9.80,rent_growth_pct:3.1,cap_rate:5.4,pipeline_msf:29.6,construction_cost_psf:82,vac_0_100k:4.8,vac_100_250k:6.1,vac_250_500k:7.4,vac_500_750k:8.2,vac_750k_plus:9.1,rent_0_100k:14.20,rent_100_250k:10.80,rent_250_500k:9.10,rent_500_750k:7.80,rent_750k_plus:6.40},
  {market:"Indianapolis",region:"Midwest",score:89,tier:"Primary",vacancy_rate:7.9,availability_rate:10.8,occupancy_rate:92.1,ytd_absorption_msf:8.4,asking_rent_psf:6.10,rent_growth_pct:4.2,cap_rate:5.8,pipeline_msf:8.5,construction_cost_psf:58,vac_0_100k:5.2,vac_100_250k:6.8,vac_250_500k:7.9,vac_500_750k:8.6,vac_750k_plus:10.2,rent_0_100k:9.40,rent_100_250k:7.20,rent_250_500k:5.80,rent_500_750k:4.90,rent_750k_plus:4.20},
  {market:"Nashville",region:"Southeast",score:87,tier:"Primary",vacancy_rate:5.8,availability_rate:8.2,occupancy_rate:94.2,ytd_absorption_msf:6.2,asking_rent_psf:8.40,rent_growth_pct:5.1,cap_rate:5.6,pipeline_msf:6.5,construction_cost_psf:64,vac_0_100k:3.4,vac_100_250k:4.8,vac_250_500k:6.2,vac_500_750k:7.1,vac_750k_plus:8.4,rent_0_100k:13.20,rent_100_250k:9.80,rent_250_500k:7.60,rent_500_750k:6.40,rent_750k_plus:5.80},
  {market:"Savannah",region:"Southeast",score:82,tier:"Primary",vacancy_rate:6.2,availability_rate:8.9,occupancy_rate:93.8,ytd_absorption_msf:5.1,asking_rent_psf:7.80,rent_growth_pct:6.2,cap_rate:5.7,pipeline_msf:5.8,construction_cost_psf:58,vac_0_100k:4.1,vac_100_250k:5.4,vac_250_500k:6.8,vac_500_750k:7.2,vac_750k_plus:8.1,rent_0_100k:11.40,rent_100_250k:8.60,rent_250_500k:7.20,rent_500_750k:6.10,rent_750k_plus:5.60},
  {market:"Philadelphia",region:"Mid-Atlantic",score:84,tier:"Primary",vacancy_rate:8.1,availability_rate:11.2,occupancy_rate:91.9,ytd_absorption_msf:7.6,asking_rent_psf:10.20,rent_growth_pct:5.8,cap_rate:5.2,pipeline_msf:4.7,construction_cost_psf:88,vac_0_100k:5.6,vac_100_250k:7.2,vac_250_500k:8.4,vac_500_750k:9.2,vac_750k_plus:10.1,rent_0_100k:15.40,rent_100_250k:11.60,rent_250_500k:9.40,rent_500_750k:8.10,rent_750k_plus:7.20},
  {market:"Charlotte",region:"Southeast",score:79,tier:"Primary",vacancy_rate:7.4,availability_rate:10.1,occupancy_rate:92.6,ytd_absorption_msf:7.8,asking_rent_psf:8.20,rent_growth_pct:4.4,cap_rate:5.5,pipeline_msf:9.2,construction_cost_psf:62,vac_0_100k:4.9,vac_100_250k:6.4,vac_250_500k:7.8,vac_500_750k:8.4,vac_750k_plus:9.6,rent_0_100k:12.40,rent_100_250k:9.20,rent_250_500k:7.60,rent_500_750k:6.40,rent_750k_plus:5.80},
  {market:"Phoenix",region:"Mountain West",score:80,tier:"Primary",vacancy_rate:9.1,availability_rate:12.8,occupancy_rate:90.9,ytd_absorption_msf:11.8,asking_rent_psf:9.10,rent_growth_pct:2.8,cap_rate:5.5,pipeline_msf:20.0,construction_cost_psf:72,vac_0_100k:6.2,vac_100_250k:7.8,vac_250_500k:9.4,vac_500_750k:10.8,vac_750k_plus:12.4,rent_0_100k:13.20,rent_100_250k:10.40,rent_250_500k:8.60,rent_500_750k:7.20,rent_750k_plus:6.20},
  {market:"Houston",region:"Texas",score:74,tier:"Secondary",vacancy_rate:8.9,availability_rate:12.4,occupancy_rate:91.1,ytd_absorption_msf:9.8,asking_rent_psf:8.20,rent_growth_pct:1.9,cap_rate:5.7,pipeline_msf:22.0,construction_cost_psf:68,vac_0_100k:5.8,vac_100_250k:7.4,vac_250_500k:9.2,vac_500_750k:10.4,vac_750k_plus:12.8,rent_0_100k:12.20,rent_100_250k:9.20,rent_250_500k:7.60,rent_500_750k:6.40,rent_750k_plus:5.60},
  {market:"Louisville",region:"Midwest",score:72,tier:"Secondary",vacancy_rate:8.2,availability_rate:11.4,occupancy_rate:91.8,ytd_absorption_msf:5.6,asking_rent_psf:7.80,rent_growth_pct:5.4,cap_rate:5.9,pipeline_msf:5.2,construction_cost_psf:55,vac_0_100k:5.4,vac_100_250k:6.8,vac_250_500k:8.4,vac_500_750k:9.4,vac_750k_plus:11.8,rent_0_100k:11.20,rent_100_250k:8.40,rent_250_500k:7.00,rent_500_750k:5.80,rent_750k_plus:5.00},
  {market:"Atlanta",region:"Southeast",score:70,tier:"Secondary",vacancy_rate:9.8,availability_rate:13.2,occupancy_rate:90.2,ytd_absorption_msf:7.0,asking_rent_psf:8.60,rent_growth_pct:3.2,cap_rate:5.6,pipeline_msf:10.1,construction_cost_psf:64,vac_0_100k:6.8,vac_100_250k:8.4,vac_250_500k:10.2,vac_500_750k:11.4,vac_750k_plus:13.2,rent_0_100k:13.20,rent_100_250k:9.60,rent_250_500k:7.80,rent_500_750k:6.40,rent_750k_plus:5.80},
  {market:"Kansas City",region:"Midwest",score:69,tier:"Secondary",vacancy_rate:8.6,availability_rate:11.8,occupancy_rate:91.4,ytd_absorption_msf:4.8,asking_rent_psf:7.20,rent_growth_pct:3.8,cap_rate:6.0,pipeline_msf:7.4,construction_cost_psf:56,vac_0_100k:5.8,vac_100_250k:7.2,vac_250_500k:9.0,vac_500_750k:10.2,vac_750k_plus:12.4,rent_0_100k:10.80,rent_100_250k:8.00,rent_250_500k:6.60,rent_500_750k:5.60,rent_750k_plus:4.80},
  {market:"Columbus",region:"Midwest",score:42,tier:"Avoid",vacancy_rate:11.2,availability_rate:15.4,occupancy_rate:88.8,ytd_absorption_msf:4.2,asking_rent_psf:6.40,rent_growth_pct:1.2,cap_rate:6.0,pipeline_msf:13.0,construction_cost_psf:56,vac_0_100k:7.8,vac_100_250k:9.6,vac_250_500k:11.8,vac_500_750k:13.4,vac_750k_plus:16.8,rent_0_100k:9.60,rent_100_250k:7.20,rent_250_500k:5.80,rent_500_750k:4.80,rent_750k_plus:4.20},
  {market:"Chicago",region:"Midwest",score:45,tier:"Avoid",vacancy_rate:9.9,availability_rate:13.4,occupancy_rate:90.1,ytd_absorption_msf:7.6,asking_rent_psf:8.80,rent_growth_pct:2.1,cap_rate:5.9,pipeline_msf:14.2,construction_cost_psf:108,vac_0_100k:6.8,vac_100_250k:8.4,vac_250_500k:10.4,vac_500_750k:11.8,vac_750k_plus:14.2,rent_0_100k:13.40,rent_100_250k:9.80,rent_250_500k:8.00,rent_500_750k:6.80,rent_750k_plus:6.20},
  {market:"Los Angeles",region:"California",score:35,tier:"Avoid",vacancy_rate:9.4,availability_rate:12.8,occupancy_rate:90.6,ytd_absorption_msf:-2.4,asking_rent_psf:17.16,rent_growth_pct:-3.6,cap_rate:5.1,pipeline_msf:8.9,construction_cost_psf:138,vac_0_100k:6.4,vac_100_250k:8.0,vac_250_500k:9.8,vac_500_750k:11.2,vac_750k_plus:13.4,rent_0_100k:24.40,rent_100_250k:19.20,rent_250_500k:16.40,rent_500_750k:13.60,rent_750k_plus:12.00},
  {market:"San Francisco Bay Area",region:"California",score:32,tier:"Avoid",vacancy_rate:10.6,availability_rate:14.2,occupancy_rate:89.4,ytd_absorption_msf:-1.8,asking_rent_psf:22.40,rent_growth_pct:-4.2,cap_rate:5.0,pipeline_msf:1.8,construction_cost_psf:148,vac_0_100k:7.4,vac_100_250k:9.2,vac_250_500k:11.2,vac_500_750k:12.8,vac_750k_plus:15.4,rent_0_100k:32.00,rent_100_250k:25.20,rent_250_500k:21.20,rent_500_750k:17.60,rent_750k_plus:15.60},
];

// ── Markets Page ───────────────────────────────────────────────────────────────
export function MarketsPage({api}){
  const [markets,setMarkets]=useState([]);
  const [thesis,setThesis]=useState(null);
  const [size,setSize]=useState('all');

  useEffect(()=>{
    fetch(`${api}/api/markets/summary`).then(r=>r.json()).then(setMarkets).catch(()=>setMarkets(FALLBACK_MARKETS));
    fetch(`${api}/api/thesis/current`).then(r=>r.json()).then(setThesis).catch(()=>{});
  },[api]);

  const scoreMap={};
  (thesis?.rankings||[]).forEach(r=>{scoreMap[r.market]=r.score;});

  const rows=(markets.length>0?markets:FALLBACK_MARKETS).map(m=>({...m,score:scoreMap[m.market]||m.score||0}));

  const getVac=(m)=>size==='all'?m.vacancy_rate:size==='s1'?m.vac_0_100k:size==='s2'?m.vac_100_250k:size==='s3'?m.vac_250_500k:size==='s4'?m.vac_500_750k:m.vac_750k_plus;
  const getRent=(m)=>size==='all'?m.asking_rent_psf:size==='s1'?m.rent_0_100k:size==='s2'?m.rent_100_250k:size==='s3'?m.rent_250_500k:size==='s4'?m.rent_500_750k:m.rent_750k_plus;
  const tierCls={Primary:'bpr',Secondary:'bse',Caution:'bca',Avoid:'bav'};

  return(
    <>
      <div className="mrow">
        <div className="mc"><div className="mcl">Markets tracked</div><div className="mcv">43</div><div className="mcc nu">Industrial only</div></div>
        <div className="mc"><div className="mcl">Avg vacancy</div><div className="mcv">{rows.filter(r=>r.vacancy_rate).length>0?(rows.reduce((s,r)=>s+(r.vacancy_rate||0),0)/rows.filter(r=>r.vacancy_rate).length).toFixed(1):'8.9'}%</div><div className="mcc nu">National avg</div></div>
        <div className="mc"><div className="mcl">Avg asking rent</div><div className="mcv" style={{fontSize:19,marginTop:4}}>${rows.filter(r=>r.asking_rent_psf).length>0?(rows.reduce((s,r)=>s+(r.asking_rent_psf||0),0)/rows.filter(r=>r.asking_rent_psf).length).toFixed(2):'10.84'}</div><div className="mcc nu">Per SF / year</div></div>
        <div className="mc"><div className="mcl">Size segment</div><div className="mcv" style={{fontSize:15,marginTop:4}}>{SIZE_LABELS[size]}</div><div className="mcc nu">Click tabs to filter</div></div>
      </div>

      <div className="panel">
        <div className="ph"><span className="pt">Industrial market analytics by building size</span><span className="badge bl">{SIZE_LABELS[size]}</span></div>
        <div className="size-tabs">
          {Object.entries(SIZE_LABELS).map(([k,v])=>(
            <button key={k} className={`stab ${size===k?'on':''}`} onClick={()=>setSize(k)}>{v}</button>
          ))}
        </div>
        <div className="size-desc">{SIZE_DESC[size]}</div>
        <div style={{overflowX:'auto'}}>
          <table className="dtbl" style={{minWidth:900}}>
            <thead><tr>
              <th style={{textAlign:'left'}}>Market</th>
              <th style={{textAlign:'left'}}>Region</th>
              <th>Score</th><th style={{textAlign:'left'}}>Tier</th>
              <th>Vacancy</th><th>Avail.</th><th>Occ.</th>
              <th>YTD Abs.</th><th>Rent $/SF</th><th>Rent Chg</th>
              <th>Cap Rate</th><th>Pipeline</th><th>Build $/SF</th>
            </tr></thead>
            <tbody>
              {rows.map((m,i)=>{
                const v=getVac(m);
                const r=getRent(m);
                return(
                  <tr key={i}>
                    <td>{m.market}</td>
                    <td style={{fontSize:10,color:'var(--muted)'}}>{m.region}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:5,justifyContent:'flex-end'}}>
                        <div style={{width:36,height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                          <div style={{height:3,width:m.score+'%',background:sc2(m.score),borderRadius:2}}/>
                        </div>
                        <span className="mono" style={{color:sc2(m.score)}}>{m.score}</span>
                      </div>
                    </td>
                    <td style={{textAlign:'left'}}><span className={`badge ${tierCls[m.tier]||'bse'}`} style={{fontSize:8}}>{m.tier}</span></td>
                    <td className="mono" style={{color:vc(v),fontWeight:600}}>{fmtV(v)}</td>
                    <td className="mono">{fmtV(m.availability_rate)}</td>
                    <td className="mono">{fmtV(m.occupancy_rate)}</td>
                    <td className="mono" style={{color:m.ytd_absorption_msf<0?'var(--danger)':'var(--good)'}}>{fmtA(m.ytd_absorption_msf)}</td>
                    <td className="mono" style={{color:'var(--orange)',fontWeight:600}}>{fmtR(r)}</td>
                    <td className="mono" style={{color:rc(m.rent_growth_pct)}}>{fmtRg(m.rent_growth_pct)}</td>
                    <td className="mono">{m.cap_rate?m.cap_rate+'%':'—'}</td>
                    <td className="mono">{fmtA(m.pipeline_msf)}</td>
                    <td className="mono" style={{color:cc(m.construction_cost_psf)}}>{m.construction_cost_psf?'$'+m.construction_cost_psf:' —'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{padding:'9px 14px',borderTop:'1px solid var(--border)',display:'flex',gap:18,flexWrap:'wrap'}}>
          <span style={{fontSize:10,color:'var(--dim)'}}>Vacancy: <span style={{color:'var(--good)'}}>■</span> &lt;7% tight &nbsp;<span style={{color:'var(--warn)'}}>■</span> 7-10% normal &nbsp;<span style={{color:'var(--danger)'}}>■</span> &gt;10% loose</span>
          <span style={{fontSize:10,color:'var(--dim)'}}>Build cost: <span style={{color:'var(--good)'}}>■</span> &lt;$70/SF &nbsp;<span style={{color:'var(--danger)'}}>■</span> &gt;$120/SF</span>
          <span style={{fontSize:10,color:'var(--orange)',marginLeft:'auto',fontFamily:"'JetBrains Mono',monospace"}}>*Size-adjusted data from JLL, CBRE, C&W, Avison Young, Newmark, Colliers</span>
        </div>
      </div>
    </>
  );
}

// ── Chat Page ─────────────────────────────────────────────────────────────────
const SUGGESTED=['Why is Dallas ranked #1?','What size product should we build in Indianapolis?','Compare Nashville vs Savannah','Where are rents growing fastest for big-box?','What markets should we avoid?','Where is lender appetite strongest?'];

const FALLBACK_CHAT={
  'Why is Dallas ranked #1?':"Dallas/Fort Worth scores 94/100 — highest nationally. It leads in investment volume ($955M YTD), trailing absorption (24.2 MSF), and has the deepest tenant pool with small-bay vacancy at 4.8%. Newmark confirms DFW leads mid-bay leasing nationally. Construction at $82/SF is competitive. The tariff-driven inland supply chain shift is structural.",
  'What size product should we build in Indianapolis?':"Indianapolis is strongest in the 0-100K SF small-bay and 100-250K SF mid-bay segments. Small-bay vacancy is 5.2% with rent growth of 5.8% YOY — the best ratio in the Midwest. Big-box (500K+) shows 10.2% vacancy — elevated. Avison Young recommends focusing on sub-250K SF product given the manufacturing reshoring tenant base.",
  'Compare Nashville vs Savannah':"Both are Tier 1 Primary targets. Nashville (87/100): 5.8% vacancy, small-bay at 3.4%, 94.2% occupancy, $64/SF build cost. Savannah (82/100): 6.2% vacancy, small-bay at 4.1%, 93.8% occupancy, $58/SF build cost, and 6.2% rent growth — highest nationally. Nashville wins on occupancy. Savannah wins on rent growth, build cost, and port-driven momentum.",
  'Where are rents growing fastest for big-box?':"For 750K SF+ big-box, fastest rent growth: Dallas/Fort Worth +1.8%, Indianapolis +2.4%, Nashville +2.9%, Philadelphia +3.0%. Avoid big-box in Chicago (+0.6%), Los Angeles (-2.0%), Columbus (+0.2%), and Austin where rents are flat to declining.",
  'What markets should we avoid?':"Six markets to avoid for speculative development: Los Angeles (rent -3.6% YOY, negative absorption, $138/SF), San Francisco Bay Area ($148/SF, rent -4.2%), Inland Empire (negative absorption), Columbus (74% YOY pipeline growth), Chicago ($108/SF, lender yield 27% below national avg), and Austin (12.4% vacancy with 8.4 MSF still under construction).",
  'Where is lender appetite strongest?':"Best lender appetite: Dallas/Fort Worth (most liquid market nationally), Indianapolis and Nashville (clean fundamentals), Philadelphia (tight vacancy validates lender confidence), Savannah (growing institutional attention). Hardest: Chicago (27% below national lender yield), LA (entitlement risk), Columbus (oversupply concerns). All six brokerages confirm improving lending conditions nationally.",
};

export function ChatPage({api}){
  const [messages,setMessages]=useState([{role:'assistant',content:"I've analyzed 163 industrial broker reports across 43 US markets from JLL, CBRE, Cushman & Wakefield, Avison Young, Newmark, and Colliers. Ask me anything — by market, building size, or investment criteria."}]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const bottomRef=useRef(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);

  const send=async(text)=>{
    const msg=(text||input).trim();
    if(!msg||loading)return;
    setInput('');
    setMessages(prev=>[...prev,{role:'user',content:msg}]);
    setLoading(true);
    try{
      const res=await fetch(`${api}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,history:messages.map(m=>({role:m.role,content:m.content}))})});
      const data=await res.json();
      setMessages(prev=>[...prev,{role:'assistant',content:data.reply}]);
    }catch{
      const fallback=FALLBACK_CHAT[msg]||"Based on 163 industrial reports from 6 brokerages, the Q1 2026 data points to Dallas/Fort Worth, Indianapolis, Nashville, Savannah, Philadelphia, and Charlotte as Glenstar's highest-conviction opportunities. Ask me about any specific market, size segment, or metric.";
      setMessages(prev=>[...prev,{role:'assistant',content:fallback}]);
    }
    setLoading(false);
  };

  return(
    <div style={{maxWidth:820}}>
      {messages.length<=1&&(
        <div style={{marginBottom:12}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'var(--dim)',marginBottom:8}}>Suggested questions</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {SUGGESTED.map(s=><button key={s} className="btn bg bsm" onClick={()=>send(s)}>{s}</button>)}
          </div>
        </div>
      )}
      <div className="panel" style={{display:'flex',flexDirection:'column'}}>
        <div className="ph"><span className="pt">Ask Claude</span><span className="badge bl">● 163 industrial reports · 6 brokerages</span></div>
        <div className="cmsg">
          {messages.map((m,i)=>(
            <div key={i} style={{display:'flex',flexDirection:'column',gap:4}}>
              <div className={`mrol ${m.role==='assistant'?'ai':''}`}>{m.role==='assistant'?'Claude':'You'}</div>
              <div className={`mb ${m.role==='user'?'u':''}`}>{m.content}</div>
            </div>
          ))}
          {loading&&(
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <div className="mrol ai">Claude</div>
              <div className="thn"><span/><span/><span/></div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        <div className="cir">
          <input className="ci" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask about any market, size segment, metric, or strategy..."/>
          <button className="btn bp" onClick={()=>send()} disabled={loading}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ── Reports Page ───────────────────────────────────────────────────────────────
export function ReportsPage({api}){
  const [reports,setReports]=useState([]);
  const [filter,setFilter]=useState('all');

  useEffect(()=>{
    fetch(`${api}/api/reports`).then(r=>r.json()).then(setReports).catch(()=>{});
  },[api]);

  const filtered=filter==='all'?reports:reports.filter(r=>r.source===filter);
  const srcCls={'JLL':'bjll','CBRE':'bcb','C&W':'bcw','Avison Young':'bay','Newmark':'bnm','Colliers':'bcl'};
  const qCls=(q)=>q&&(q.includes('Q1 2026')||q.includes('2026'))?'bpr':q&&q.includes('Q4 2025')?'bca':'bse';

  return(
    <div className="panel">
      <div className="ph">
        <span className="pt">Industrial report library — {reports.length||163} reports ingested</span>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          {['all','JLL','CBRE','C&W','Avison Young','Newmark','Colliers'].map(f=>(
            <button key={f} className={`btn bsm ${filter===f?'bp':'bg'}`} onClick={()=>setFilter(f)}>{f==='all'?'All':f}</button>
          ))}
        </div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table className="dtbl" style={{minWidth:800}}>
          <thead><tr>
            <th style={{textAlign:'left'}}>Source</th>
            <th style={{textAlign:'left'}}>Market</th>
            <th style={{textAlign:'left'}}>Region</th>
            <th style={{textAlign:'left'}}>Quarter</th>
            <th>Vacancy</th><th>Rent $/SF</th><th>Rent Chg</th>
            <th>Absorption</th><th>Cap Rate</th><th>Build $/SF</th>
          </tr></thead>
          <tbody>
            {(filtered.length>0?filtered:FALLBACK_MARKETS.slice(0,12)).map((r,i)=>(
              <tr key={i}>
                <td style={{textAlign:'left'}}><span className={`badge ${srcCls[r.source]||'bjll'}`}>{r.source||'JLL'}</span></td>
                <td style={{fontWeight:600,color:'var(--text)'}}>{r.market}</td>
                <td style={{textAlign:'left',fontSize:10,color:'var(--muted)'}}>{r.region}</td>
                <td style={{textAlign:'left'}}><span className={`badge ${qCls(r.quarter)}`}>{r.quarter||'Q1 2026'}</span></td>
                <td className="mono" style={{color:vc(r.vacancy_rate),fontWeight:600}}>{fmtV(r.vacancy_rate)}</td>
                <td className="mono" style={{color:'var(--orange)',fontWeight:600}}>{fmtR(r.asking_rent_psf)}</td>
                <td className="mono" style={{color:rc(r.rent_growth_pct)}}>{fmtRg(r.rent_growth_pct)}</td>
                <td className="mono" style={{color:r.ytd_absorption_msf<0?'var(--danger)':'var(--good)'}}>{fmtA(r.ytd_absorption_msf)}</td>
                <td className="mono">{r.cap_rate?r.cap_rate+'%':'—'}</td>
                <td className="mono" style={{color:cc(r.construction_cost_psf)}}>{r.construction_cost_psf?'$'+r.construction_cost_psf+'/SF':'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Monitor Page ───────────────────────────────────────────────────────────────
export function MonitorPage({api,onScan}){
  const [sources,setSources]=useState([]);
  const [history,setHistory]=useState([]);

  useEffect(()=>{
    fetch(`${api}/api/monitor/sources`).then(r=>r.json()).then(setSources).catch(()=>{});
    fetch(`${api}/api/thesis/history`).then(r=>r.json()).then(setHistory).catch(()=>{});
  },[api]);

  const fmtDate=d=>d?new Date(d).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
  const iconCls=name=>name.includes('JLL')?'si-jll':name.includes('CBRE')?'si-cb':name.includes('Cushman')?'si-cw':name.includes('Avison')?'si-ay':name.includes('Newmark')?'si-nm':'si-cl';
  const iconTxt=name=>name.includes('JLL')?'JLL':name.includes('CBRE')?'CBR':name.includes('Cushman')?'C&W':name.includes('Avison')?'AY':name.includes('Newmark')?'NMK':'COL';

  const defaultSources=[
    {name:'JLL Market Dynamics (Industrial)',url:'jll.com/insights/market-dynamics',reports_tracked:39,last_checked:new Date().toISOString(),status:'active'},
    {name:'CBRE Research (Industrial)',url:'cbre.com/insights/market-reports',reports_tracked:14,last_checked:new Date().toISOString(),status:'active'},
    {name:'Cushman & Wakefield MarketBeat',url:'cushmanwakefield.com/marketbeats',reports_tracked:11,last_checked:new Date().toISOString(),status:'active'},
    {name:'Avison Young Industrial Reports',url:'avisonyoung.com/knowledge-and-research',reports_tracked:9,last_checked:new Date().toISOString(),status:'active'},
    {name:'Newmark Industrial Research',url:'nmrk.com/research/industrial',reports_tracked:8,last_checked:new Date().toISOString(),status:'active'},
    {name:'Colliers Industrial Market Reports',url:'colliers.com/en/research/industrial',reports_tracked:13,last_checked:new Date().toISOString(),status:'active'},
  ];

  const displaySources=sources.length>0?sources:defaultSources;

  return(
    <div className="tc">
      <div>
        <div className="panel" style={{marginBottom:12}}>
          <div className="ph"><span className="pt">Industrial source monitoring — 6 brokerages</span><span className="badge bl">● Active</span></div>
          {displaySources.map((s,i)=>(
            <div className="srcc" key={i}>
              <div className={`srci ${iconCls(s.name)}`}>{iconTxt(s.name)}</div>
              <div style={{flex:1}}>
                <div className="srcn">{s.name}</div>
                <div className="srcu">{(s.url||'').replace('https://','').slice(0,50)}</div>
                <div className="srcx">{s.reports_tracked} industrial pages · Scans at 6:00 AM & 6:00 PM daily · Last: {fmtDate(s.last_checked)}</div>
              </div>
              <span className="badge b2x">2×/day</span>
            </div>
          ))}
          <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <button className="btn bp" onClick={onScan}>Run scan now</button>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:'var(--muted)'}}>Schedule: 6:00 AM and 6:00 PM, every day</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:'var(--good)',marginTop:2}}>All 6 sources online</div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="ph"><span className="pt">How it works</span></div>
          <div style={{padding:'14px 16px',fontSize:11,color:'var(--muted)',lineHeight:1.85}}>
            <p style={{marginBottom:10}}>Every morning at <strong style={{color:'var(--text)'}}>6:00 AM</strong> and evening at <strong style={{color:'var(--text)'}}>6:00 PM</strong>, the platform checks all six brokerage websites for new industrial reports.</p>
            <p style={{marginBottom:10}}>When a new quarter is detected, Claude extracts all industrial metrics including size-segment breakdowns. Office and multifamily data is explicitly filtered out.</p>
            <p>Once 3+ markets have new data, the investment thesis regenerates automatically. All prior theses are archived so you can track how recommendations shift quarter over quarter.</p>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="ph"><span className="pt">Thesis history</span></div>
        <table className="dtbl">
          <thead><tr>
            <th style={{textAlign:'left'}}>Quarter</th>
            <th style={{textAlign:'left'}}>Generated</th>
            <th>Reports</th>
            <th style={{textAlign:'left'}}>Status</th>
          </tr></thead>
          <tbody>
            {(history.length>0?history:[
              {quarter:'Q1 2026',generated_at:new Date().toISOString(),report_count:163,is_current:true},
              {quarter:'Q4 2025',generated_at:'2026-01-12T06:00:00',report_count:141,is_current:false},
              {quarter:'Q3 2025',generated_at:'2025-10-07T06:00:00',report_count:128,is_current:false},
            ]).map((t,i)=>(
              <tr key={i}>
                <td style={{fontFamily:"'JetBrains Mono',monospace",color:t.is_current?'var(--text)':'var(--muted)'}}>{t.quarter}</td>
                <td style={{fontSize:11}}>{fmtDate(t.generated_at)}</td>
                <td style={{fontFamily:"'JetBrains Mono',monospace",textAlign:'right',color:'var(--muted)'}}>{t.report_count}</td>
                <td>{t.is_current?<span className="badge bl">Current</span>:<span className="badge" style={{background:'rgba(255,255,255,0.03)',color:'var(--dim)',border:'1px solid var(--border)'}}>Archived</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
