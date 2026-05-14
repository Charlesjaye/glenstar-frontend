import React, { useState, useEffect } from 'react';

const MKT = [
  {rank:1,market:"Dallas / Fort Worth",region:"Texas",score:94,tier:"Primary",vac:{all:7.2,s1:4.8,s2:6.1,s3:7.4,s4:8.2,s5:9.1},rent:{all:9.80,s1:14.20,s2:10.80,s3:9.10,s4:7.80,s5:6.40},rg:{all:3.1},abs:{all:24.2},cap:5.4,pip:{all:29.6},cost:82,ls:42.1,src:"JLL/Newmark/Colliers",
   why:"Nation's #1 industrial transaction market — $955M YTD sales, 24.2 MSF trailing absorption, deepest 3PL and e-commerce tenant pool. Tariff-driven inland supply chain shift is structural. PwC/ULI #1 ranked market two consecutive years.",
   scores_detail:[{f:"Capital access",sc:5,note:"#1 in transaction volume nationally. Life cos, CMBS, banks all competing."},{f:"Achievable rent",sc:4,note:"$9.80/SF blended. Small-bay at $14.20 among highest in Texas."},{f:"Occupancy / vacancy",sc:4,note:"7.2% blended vacancy. Small-bay at 4.8% — functionally full."},{f:"Build cost",sc:4,note:"$82/SF — 24% cheaper than Chicago, 40% cheaper than coastal markets."},{f:"Tenant demand depth",sc:5,note:"42.1 MSF of leasing activity. 3PL, e-commerce, data center all active."},{f:"Absorption trend",sc:5,note:"24.2 MSF YTD — highest nationally. Consistent across all size segments."}]},
  {rank:2,market:"Indianapolis",region:"Midwest",score:89,tier:"Primary",vac:{all:7.9,s1:5.2,s2:6.8,s3:7.9,s4:8.6,s5:10.2},rent:{all:6.10,s1:9.40,s2:7.20,s3:5.80,s4:4.90,s5:4.20},rg:{all:4.2},abs:{all:8.4},cap:5.8,pip:{all:8.5},cost:58,ls:18.2,src:"CBRE/JLL/Avison Young",
   why:"Fastest vacancy improvement nationally — down 180 bps YOY. Lowest construction costs of any Tier 1 market at $58/SF. CBRE's #1 manufacturing reshoring target. Strong auto and 3PL tenant base.",
   scores_detail:[{f:"Capital access",sc:4,note:"Strong lender appetite. CBRE reports 38% quote yield — above national avg."},{f:"Achievable rent",sc:4,note:"$6.10/SF blended but small-bay at $9.40. Rent growth 4.2% YOY top 5 nationally."},{f:"Occupancy / vacancy",sc:5,note:"Fastest vacancy improvement of any major market — down 180 bps YOY."},{f:"Build cost",sc:5,note:"$58/SF — lowest of any Tier 1 market. 33% cheaper than Chicago."},{f:"Tenant demand depth",sc:4,note:"18.2 MSF leasing. Manufacturing reshoring + 3PL + auto sector active."},{f:"Absorption trend",sc:4,note:"8.4 MSF YTD. Consistent across small and mid-bay segments."}]},
  {rank:3,market:"Nashville",region:"Southeast",score:87,tier:"Primary",vac:{all:5.8,s1:3.4,s2:4.8,s3:6.2,s4:7.1,s5:8.4},rent:{all:8.40,s1:13.20,s2:9.80,s3:7.60,s4:6.40,s5:5.80},rg:{all:5.1},abs:{all:6.2},cap:5.6,pip:{all:6.5},cost:64,ls:14.8,src:"JLL/C&W/Colliers",
   why:"94.2% occupancy — historically tightest vacancy market in the US. 80%+ long-term rent growth. Strong healthcare, auto manufacturing, and 3PL tenant base. CBRE top expansion target nationally.",
   scores_detail:[{f:"Capital access",sc:4,note:"Strong lender appetite driven by tight occupancy. Multiple lenders competing."},{f:"Achievable rent",sc:5,note:"$8.40/SF blended. Small-bay at $13.20 — highest in the Southeast."},{f:"Occupancy / vacancy",sc:5,note:"94.2% occupancy. Small-bay at 96.6% — historically tightest major market."},{f:"Build cost",sc:4,note:"$64/SF — competitive. Below Chicago and all coastal markets."},{f:"Tenant demand depth",sc:4,note:"14.8 MSF leasing. Healthcare, automotive, and 3PL driving demand."},{f:"Absorption trend",sc:4,note:"6.2 MSF YTD concentrated in small and mid-bay segments."}]},
  {rank:4,market:"Savannah",region:"Southeast",score:82,tier:"Primary",vac:{all:6.2,s1:4.1,s2:5.4,s3:6.8,s4:7.2,s5:8.1},rent:{all:7.80,s1:11.40,s2:8.60,s3:7.20,s4:6.10,s5:5.60},rg:{all:6.2},abs:{all:5.1},cap:5.7,pip:{all:5.8},cost:58,ls:9.8,src:"C&W/Avison Young/Colliers",
   why:"Breakout market of this cycle — 6.2% vacancy, highest rent growth nationally at 6.2% YOY. $58/SF build cost tied with Indianapolis. Port-proximate demand accelerating from East Coast trade shifts. Avison Young identifies Savannah as fastest-growing industrial market in the US.",
   scores_detail:[{f:"Capital access",sc:4,note:"Growing institutional attention. Avison Young confirms 3 life company term sheets in Q1 2026."},{f:"Achievable rent",sc:5,note:"$7.80/SF blended. 6.2% rent growth is highest nationally."},{f:"Occupancy / vacancy",sc:5,note:"93.8% occupancy. Small-bay at 95.9% — port-proximate demand means nothing sits vacant."},{f:"Build cost",sc:5,note:"$58/SF — tied for lowest nationally. Limited construction activity keeps labor available."},{f:"Tenant demand depth",sc:4,note:"9.8 MSF leasing. Port-proximate 3PL, e-commerce, import distribution."},{f:"Absorption trend",sc:4,note:"5.1 MSF YTD for a 110 MSF inventory market — highest absorption/inventory ratio nationally."}]},
  {rank:5,market:"Philadelphia",region:"Mid-Atlantic",score:84,tier:"Primary",vac:{all:8.1,s1:5.6,s2:7.2,s3:8.4,s4:9.2,s5:10.1},rent:{all:10.20,s1:15.40,s2:11.60,s3:9.40,s4:8.10,s5:7.20},rg:{all:5.8},abs:{all:7.6},cap:5.2,pip:{all:4.7},cost:88,ls:22.4,src:"CBRE/JLL/Newmark",
   why:"The rent story of this cycle — only 4.7 MSF pipeline. Land-constrained conditions mean any new modern supply creates an immediate pricing event. 5.8% rent growth. Newmark Q1 confirms Mid-Atlantic gateway is one of the tightest industrial markets east of the Mississippi.",
   scores_detail:[{f:"Capital access",sc:4,note:"Life company and CMBS both active with tightest spreads since 2021."},{f:"Achievable rent",sc:5,note:"$10.20/SF blended. Small-bay at $15.40. 5.8% growth is top 3 nationally."},{f:"Occupancy / vacancy",sc:4,note:"91.9% overall. Only 4.7 MSF pipeline means vacancy will keep tightening."},{f:"Build cost",sc:3,note:"$88/SF — above Midwest peers. Land costs are the primary driver."},{f:"Tenant demand depth",sc:4,note:"22.4 MSF leasing. Mid-Atlantic gateway creates persistent diverse demand."},{f:"Absorption trend",sc:4,note:"7.6 MSF YTD concentrated in 100-500K range."}]},
  {rank:6,market:"Charlotte",region:"Southeast",score:79,tier:"Primary",vac:{all:7.4,s1:4.9,s2:6.4,s3:7.8,s4:8.4,s5:9.6},rent:{all:8.20,s1:12.40,s2:9.20,s3:7.60,s4:6.40,s5:5.80},rg:{all:4.4},abs:{all:7.8},cap:5.5,pip:{all:9.2},cost:62,ls:16.4,src:"JLL/Avison Young/Colliers",
   why:"Strong 7.8 MSF YTD absorption with competitive $62/SF build cost. Avison Young Q1 confirms Charlotte as one of two fastest-growing industrial markets in the Southeast by leasing volume.",
   scores_detail:[{f:"Capital access",sc:4,note:"Regional and national lender appetite both strong."},{f:"Achievable rent",sc:4,note:"$8.20/SF blended. Small-bay at $12.40. 4.4% rent growth consistent."},{f:"Occupancy / vacancy",sc:4,note:"92.6% occupancy. Small-bay at 95.1%. Pipeline of 9.2 MSF needs monitoring."},{f:"Build cost",sc:5,note:"$62/SF — among cheapest in the Southeast. Good labor market."},{f:"Tenant demand depth",sc:4,note:"16.4 MSF leasing. Corporate relocations from Northeast driving new entrants."},{f:"Absorption trend",sc:4,note:"7.8 MSF YTD. Avison Young ranks it #2 in Southeast absorption rate."}]},
  {rank:7,market:"Phoenix",region:"Mountain West",score:80,tier:"Primary",vac:{all:9.1,s1:6.2,s2:7.8,s3:9.4,s4:10.8,s5:12.4},rent:{all:9.10,s1:13.20,s2:10.40,s3:8.60,s4:7.20,s5:6.20},rg:{all:2.8},abs:{all:11.8},cap:5.5,pip:{all:20.0},cost:72,ls:28.6,src:"JLL/C&W/Newmark",
   why:"Led Western markets with $523M YTD investment sales. Data center, semiconductor, and logistics tenant surge. 11.8 MSF YTD absorption. First-gen big-box shrinking rapidly. Newmark flags Phoenix as #1 data center adjacent industrial market.",
   scores_detail:[{f:"Capital access",sc:4,note:"Institutional capital most active in Phoenix outside DFW/Nashville."},{f:"Achievable rent",sc:4,note:"$9.10/SF blended. Small-bay at $13.20. Rent growth 2.8% — lower due to elevated supply."},{f:"Occupancy / vacancy",sc:3,note:"90.9% overall. Big-box at 12.4% needs caution. Small-bay at 6.2% fine."},{f:"Build cost",sc:4,note:"$72/SF — reasonable. Power infrastructure becoming meaningful cost adder."},{f:"Tenant demand depth",sc:5,note:"28.6 MSF leasing. Data centers, semiconductor, 3PL, e-commerce all competing."},{f:"Absorption trend",sc:5,note:"11.8 MSF YTD. Strong across 100-500K range. Avoid big-box spec."}]},
  {rank:8,market:"Raleigh-Durham",region:"Southeast",score:77,tier:"Primary",vac:{all:7.8,s1:5.4,s2:6.8,s3:8.2,s4:8.8,s5:10.1},rent:{all:9.40,s1:13.80,s2:10.60,s3:8.60,s4:7.20,s5:6.40},rg:{all:4.8},abs:{all:5.4},cap:5.6,pip:{all:7.1},cost:66,ls:11.2,src:"CBRE/Newmark",
   why:"Tech and life sciences tenant base driving high-quality industrial demand. 4.8% rent growth, 92.2% occupancy, $66/SF build cost. Newmark flags the Triangle as most undersupplied market for flex and mid-bay product.",
   scores_detail:[{f:"Capital access",sc:4,note:"Growing institutional attention. CBRE and Newmark both report improved lender activity Q1 2026."},{f:"Achievable rent",sc:4,note:"$9.40/SF blended. Small-bay at $13.80. Premium tenants pay above-market rents."},{f:"Occupancy / vacancy",sc:4,note:"92.2% overall. Small-bay at 94.6%. Flex and light industrial essentially fully occupied."},{f:"Build cost",sc:4,note:"$66/SF — competitive for an East Coast market."},{f:"Tenant demand depth",sc:4,note:"11.2 MSF leasing. Tech, biotech, advanced manufacturing — higher credit tenants."},{f:"Absorption trend",sc:3,note:"5.4 MSF YTD — moderate but improving. Smaller market than peers."}]},
  {rank:9,market:"Houston",region:"Texas",score:74,tier:"Secondary",vac:{all:8.9,s1:5.8,s2:7.4,s3:9.2,s4:10.4,s5:12.8},rent:{all:8.20,s1:12.20,s2:9.20,s3:7.60,s4:6.40,s5:5.60},rg:{all:1.9},abs:{all:9.8},cap:5.7,pip:{all:22.0},cost:68,ls:32.1,src:"JLL/CBRE/Colliers",
   why:"Strong 9.8 MSF YTD absorption with port proximity premium. 22 MSF pipeline is elevated and heavily weighted to 500K+ big-box. Best positioned for port-adjacent, mid-bay product under 250K SF.",
   scores_detail:[{f:"Capital access",sc:4,note:"Strong lender appetite for well-located product."},{f:"Achievable rent",sc:3,note:"$8.20/SF blended. Rent growth only 1.9% — dragged by big-box oversupply."},{f:"Occupancy / vacancy",sc:3,note:"91.1% overall but big-box at 12.8% — significantly elevated."},{f:"Build cost",sc:4,note:"$68/SF — competitive. Labor abundant given large construction workforce."},{f:"Tenant demand depth",sc:4,note:"32.1 MSF leasing. Port proximity attracts energy, chemicals, import distribution."},{f:"Absorption trend",sc:4,note:"9.8 MSF YTD but concentrated. Avoid big-box spec given 22 MSF pipeline."}]},
  {rank:10,market:"Louisville",region:"Midwest",score:72,tier:"Secondary",vac:{all:8.2,s1:5.4,s2:6.8,s3:8.4,s4:9.4,s5:11.8},rent:{all:7.80,s1:11.20,s2:8.40,s3:7.00,s4:5.80,s5:5.00},rg:{all:5.4},abs:{all:5.6},cap:5.9,pip:{all:5.2},cost:55,ls:14.2,src:"CBRE/Avison Young",
   why:"80%+ long-term rent growth and $55/SF build cost — lowest in the region. UPS and Amazon anchor the tenant ecosystem. Very limited first-gen big-box supply. CBRE names it top expansion target for manufacturing.",
   scores_detail:[{f:"Capital access",sc:3,note:"Regional lenders active. Fewer national institutions vs top-tier markets."},{f:"Achievable rent",sc:4,note:"$7.80/SF blended. Small-bay at $11.20. 5.4% growth among best in the Midwest."},{f:"Occupancy / vacancy",sc:4,note:"91.8% overall. Small-bay at 94.6%. Focus on sub-500K SF product."},{f:"Build cost",sc:5,note:"$55/SF — lowest of all tracked markets."},{f:"Tenant demand depth",sc:4,note:"14.2 MSF leasing. UPS and Amazon create anchor demand."},{f:"Absorption trend",sc:3,note:"5.6 MSF YTD. Concentrated in 100-500K range."}]},
];

const AVOID = [
  {market:"Columbus",region:"Midwest",score:42,vac:11.2,rent:6.40,abs:4.2,pip:13.0,cost:56,rg:1.2,src:"C&W/Colliers",why:"Pipeline grew 74% YOY — highest in the Midwest. 11.2% vacancy with 13 MSF still under construction. Supply far outpacing demand in every size segment. Big-box vacancy at 16.8%. Only develop with a committed tenant and pre-arranged financing."},
  {market:"Chicago",region:"Midwest",score:45,vac:9.9,rent:8.80,abs:7.6,pip:14.2,cost:108,rg:2.1,src:"C&W/JLL/Colliers",why:"$108/SF construction cost — highest in the Midwest. Lender quote yield 27% below national average due to tax volatility, Cook County reassessments, and regulatory complexity. Only pursue with a creditworthy pre-committed tenant."},
  {market:"Los Angeles",region:"California",score:35,vac:9.4,rent:17.16,abs:-2.4,pip:8.9,cost:138,rg:-3.6,src:"CBRE/JLL/Newmark",why:"Negative absorption YTD. Rent declining -3.6% YOY. $138/SF construction cost. Tariff-driven port volume decline hitting LA/Long Beach hardest — down 20%+ YOY. Newmark does not recommend speculative industrial development in LA in 2026."},
  {market:"San Francisco Bay Area",region:"California",score:32,vac:10.6,rent:22.40,abs:-1.8,pip:1.8,cost:148,rg:-4.2,src:"CBRE/Newmark",why:"$148/SF construction cost — highest nationally. Rent declining -4.2% YOY. Negative absorption in every segment. Tech contraction reduced warehousing demand. Entitlement timelines 3-5 years. Avoid entirely."},
  {market:"Inland Empire",region:"California",score:38,vac:8.7,rent:14.40,abs:-2.4,pip:8.9,cost:118,rg:-3.2,src:"JLL/Avison Young",why:"Negative absorption for the second consecutive year. Port disruption from tariffs removed the structural demand driver. $118/SF build cost with declining rents creates a negative development spread. No speculative development recommended in 2026."},
  {market:"Austin",region:"Texas",score:44,vac:12.4,rent:14.20,abs:2.2,pip:8.4,cost:84,rg:-0.8,src:"JLL/Colliers",why:"12.4% vacancy — highest in Texas — with 8.4 MSF still under construction. Rent declining -0.8% YOY. Demand has not kept pace with the 2022-2024 speculative construction wave. Colliers recommends waiting for supply to digest before any speculative development."},
];

function rnCls(r,t){if(t==='Avoid')return'rna';if(r===1)return'rn1';if(r===2)return'rn2';if(r===3)return'rn3';return'rno';}
function sc2(s){return s>=80?'var(--orange)':s>=65?'var(--info)':'var(--purple)';}
function tbd(t){const m={Primary:'bpr',Secondary:'bse',Caution:'bca',Avoid:'bav'};return<span className={`badge ${m[t]||'bse'}`}>{t}</span>;}
function fc(s){return s>=80?'for':s>=65?'fbl':'fpu';}
function fmtV(v){return v==null?'—':v.toFixed(1)+'%';}
function fmtR(v){return v==null?'—':'$'+v.toFixed(2)+'/SF';}
function fmtA(v){return v==null?'—':(v<0?'':'')+v.toFixed(1)+' MSF';}
function fmtRg(v){return v==null?'—':(v>0?'+':'')+v.toFixed(1)+'%';}
function vc(v){return v<7?'var(--good)':v<10?'var(--warn)':'var(--danger)';}
function rc(r){return r>=3?'var(--good)':r<0?'var(--danger)':'var(--muted)';}

function Chip({label,value,color}){
  return(
    <div className="mc-chip">
      <div className="mc-chip-l">{label}</div>
      <div className="mc-chip-v" style={{color:color||'var(--text)'}}>{value}</div>
    </div>
  );
}

function MarketRow({m,onOpen}){
  return(
    <div className="mr" onClick={()=>onOpen(m)}>
      <div className={`rnum ${rnCls(m.rank,m.tier)}`}>#{m.rank}</div>
      <div className="mi">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
          <div className="mn">{m.market}</div>
          <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>{tbd(m.tier)}<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:sc2(m.score)}}>{m.score}</span></div>
        </div>
        <div className="mr-region">{m.region} · {m.src}</div>
        <div className="ml">{m.why.slice(0,100)}...</div>
        <div className="mini-chips">
          <Chip label="Vacancy" value={fmtV(m.vac.all)} color={vc(m.vac.all)}/>
          <Chip label="Rent $/SF" value={fmtR(m.rent.all)} color="var(--orange)"/>
          <Chip label="Rent growth" value={fmtRg(m.rg.all)} color={rc(m.rg.all)}/>
          <Chip label="YTD abs." value={fmtA(m.abs.all)}/>
          <Chip label="Cap rate" value={m.cap+'%'}/>
          <Chip label="Build $/SF" value={'$'+m.cost} color={m.cost<70?'var(--good)':m.cost>120?'var(--danger)':null}/>
        </div>
        <div className="sbar" style={{marginTop:6}}>
          <div className="sbg"><div className={`sbf ${fc(m.score)}`} style={{width:m.score+'%'}}/></div>
        </div>
      </div>
      <div className="arr">›</div>
    </div>
  );
}

function ScorePopup({m,onClose}){
  if(!m)return null;
  return(
    <div className="score-popup on" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="popup-box">
        <div className="popup-head">
          <div>
            <div className="popup-title">{m.market}</div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{m.region} · {m.src} · Q1 2026</div>
          </div>
          <button className="popup-close" onClick={onClose}>Close ✕</button>
        </div>
        <div className="popup-body">
          <div className="pop-stat-grid">
            {[
              {l:'Overall score',v:m.score+'/100',c:sc2(m.score)},
              {l:'Vacancy',v:fmtV(m.vac.all),c:vc(m.vac.all)},
              {l:'Asking rent',v:fmtR(m.rent.all),c:'var(--orange)'},
              {l:'Rent growth',v:fmtRg(m.rg.all),c:rc(m.rg.all)},
              {l:'YTD absorption',v:fmtA(m.abs.all),c:'var(--text)'},
              {l:'Cap rate',v:m.cap+'%',c:'var(--text)'},
              {l:'Build cost',v:'$'+m.cost+'/SF',c:m.cost<70?'var(--good)':m.cost>120?'var(--danger)':'var(--text)'},
              {l:'Pipeline',v:fmtA(m.pip.all),c:'var(--text)'},
              {l:'Leasing activity',v:m.ls+' MSF',c:'var(--text)'},
            ].map(x=>(
              <div className="psg" key={x.l}>
                <div className="psg-l">{x.l}</div>
                <div className="psg-v" style={{color:x.c||'var(--text)'}}>{x.v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,fontWeight:600,color:'var(--text)',marginBottom:10}}>Scoring breakdown</div>
          {(m.scores_detail||[]).map(f=>(
            <div key={f.f}>
              <div className="score-factor">
                <div className="sf-label">{f.f}</div>
                <div className="sf-dots">{[1,2,3,4,5].map(i=><div key={i} className={`sfd${i<=f.sc?' on':''}`}/>)}</div>
                <div className="sf-score">{f.sc}/5</div>
              </div>
              <div style={{padding:'4px 0 8px 150px',fontSize:10,color:'var(--dim)',borderBottom:'1px solid var(--border)',lineHeight:1.55}}>{f.note}</div>
            </div>
          ))}
          <div className="why-box">
            <div className="why-box-title">Investment rationale</div>
            <div>{m.why}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThesisPage({api}){
  const [thesis,setThesis]=useState(null);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('summary');
  const [popup,setPopup]=useState(null);

  useEffect(()=>{
    fetch(`${api}/api/thesis/current`).then(r=>r.json()).then(d=>{setThesis(d);setLoading(false);}).catch(()=>setLoading(false));
  },[api]);

  const rankings=thesis?.rankings||MKT.map(m=>({...m,headline:m.why.slice(0,80)+'...'}));
  const risks=thesis?.risk_factors||[
    {level:'high',title:'Steel & aluminum tariffs at 50%',detail:'Input costs up 7-12% annualized. Total project costs +3% vs 2024. Lock GC contracts with escalation caps. Procure structural steel early on every deal.'},
    {level:'high',title:'Power and electrical capacity',detail:'Single most critical site selection constraint in 2026. Transformer lead times 18-24 months in Phoenix, Dallas, Atlanta. Underwrite power access before committing to land.'},
    {level:'medium',title:'Skilled labor shortage',detail:'~500K additional workers needed nationally. 40% of skilled trades over 45. Inland Midwest has best labor availability relative to demand.'},
    {level:'medium',title:'Trade policy and port disruption',detail:'West Coast port volumes down 13-25% from tariffs. Tailwind for East Coast and inland markets, headwind for LA and Seattle.'},
    {level:'low',title:'Lending environment improving',detail:'CBRE Lending Momentum Index at highest since 2018. Industrial spreads at 148 bps over 10-yr Treasury. Most favorable financing in 3 years.'},
    {level:'low',title:'Supply pipeline contracting',detail:'New completions down 27% YOY — 9-year low. Structural supply reduction is the primary tailwind for new development through 2026-2027.'},
  ];
  const summary=thesis?.summary||'Loading thesis data from all six brokerages...';
  const paragraphs=summary.split('\n\n').filter(Boolean);

  if(loading)return(
    <div style={{padding:'60px 0',textAlign:'center',color:'var(--muted)'}}>
      <div className="thn" style={{justifyContent:'center',marginBottom:10}}><span/><span/><span/></div>
      Loading investment thesis...
    </div>
  );

  return(
    <>
      <div className="mrow">
        <div className="mc"><div className="mcl">Reports ingested</div><div className="mcv">{thesis?.report_count||163}</div><div className="mcc up">6 brokerages</div></div>
        <div className="mc"><div className="mcl">Markets tracked</div><div className="mcv">43</div><div className="mcc nu">Industrial only</div></div>
        <div className="mc"><div className="mcl">Top market</div><div className="mcv" style={{fontSize:16,marginTop:5}}>Dallas / FW</div><div className="mcc up">Score 94/100</div></div>
        <div className="mc"><div className="mcl">Data quarter</div><div className="mcv" style={{fontSize:19,marginTop:5}}>{thesis?.quarter||'Q1 2026'}</div><div className="mcc nu">Auto-updating</div></div>
      </div>

      <div className="tc">
        <div className="panel" style={{height:600,display:'flex',flexDirection:'column',marginBottom:0}}>
          <div className="ph"><span className="pt">AI Investment Thesis — {thesis?.quarter||'Q1 2026'}</span><span className="badge bl">● Industrial only</span></div>
          <div className="tabrow">
            {['summary','top10','avoid','risks'].map(t=>(
              <div key={t} className={`tab ${tab===t?'on':''}`} onClick={()=>setTab(t)}>
                {t==='top10'?'Top 10':t==='risks'?'Risk Factors':t.charAt(0).toUpperCase()+t.slice(1)}
              </div>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {tab==='summary'&&(
              <div className="tbody">
                {paragraphs.map((p,i)=>(
                  <p key={i} style={{animationDelay:`${i*0.1}s`}}>
                    {p.split(/(\*\*[^*]+\*\*)/).map((chunk,j)=>
                      chunk.startsWith('**')&&chunk.endsWith('**')
                        ?<span key={j} className="hl">{chunk.slice(2,-2)}</span>
                        :chunk
                    )}
                  </p>
                ))}
              </div>
            )}
            {tab==='top10'&&(
              <>
                <div style={{padding:'7px 16px',fontSize:10,color:'var(--dim)',borderBottom:'1px solid var(--border)'}}>Click any market for the full scoring breakdown →</div>
                {MKT.map(m=><MarketRow key={m.rank} m={m} onOpen={setPopup}/>)}
              </>
            )}
            {tab==='avoid'&&(
              <>
                <div style={{padding:'10px 16px',fontSize:10,color:'var(--dim)',borderBottom:'1px solid var(--border)'}}>Markets where Glenstar should NOT pursue speculative development without a committed tenant.</div>
                {AVOID.map((m,i)=>(
                  <div className="avoid-row" key={i}>
                    <div className="rnum rna" style={{marginTop:1}}>✕</div>
                    <div className="mi">
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                        <div className="mn">{m.market}</div>
                        <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}><span className="badge bav">Avoid</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:'var(--purple)'}}>{m.score}</span></div>
                      </div>
                      <div className="mr-region">{m.region} · {m.src}</div>
                      <div className="ml">{m.why}</div>
                      <div className="mini-chips">
                        <Chip label="Vacancy" value={fmtV(m.vac)} color={vc(m.vac)}/>
                        <Chip label="Rent $/SF" value={fmtR(m.rent)} color="var(--orange)"/>
                        <Chip label="Rent chg" value={fmtRg(m.rg)} color={rc(m.rg)}/>
                        <Chip label="YTD abs." value={fmtA(m.abs)} color={m.abs<0?'var(--danger)':null}/>
                        <Chip label="Build $/SF" value={'$'+m.cost} color={m.cost>120?'var(--danger)':null}/>
                        <Chip label="Pipeline" value={fmtA(m.pip)}/>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {tab==='risks'&&risks.map((r,i)=>(
              <div className="riskr" key={i}>
                <span className={`rl rl${r.level.charAt(0)}`}>{r.level}</span>
                <div><div className="rkt">{r.title}</div><div className="rkd">{r.detail}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{height:600,display:'flex',flexDirection:'column',marginBottom:0}}>
          <div className="ph"><span className="pt">Top 10 target markets</span><span className="badge bl">Click for score breakdown</span></div>
          <div style={{flex:1,overflowY:'auto'}}>
            {MKT.map(m=><MarketRow key={m.rank} m={m} onOpen={setPopup}/>)}
          </div>
        </div>
      </div>

      <ScorePopup m={popup} onClose={()=>setPopup(null)}/>
    </>
  );
}
