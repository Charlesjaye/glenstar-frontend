import React, { useState, useEffect } from 'react';

function rnCls(r,t){if(t==='Avoid')return'rna';if(r===1)return'rn1';if(r===2)return'rn2';if(r===3)return'rn3';return'rno';}
function sc2(s){return s>=80?'var(--orange)':s>=65?'var(--info)':'var(--purple)';}
function fc(s){return s>=80?'for':s>=65?'fbl':'fpu';}
function tbd(t){const m={Primary:'bpr',Secondary:'bse',Caution:'bca',Avoid:'bav'};return<span className={`badge ${m[t]||'bse'}`}>{t}</span>;}
function fV(v){return v!=null?`${Number(v).toFixed(1)}%`:'N/A';}
function fR(v){return v!=null?`$${Number(v).toFixed(2)}/SF`:'N/A';}
function fA(v){return v!=null?`${Number(v).toFixed(1)} MSF`:'N/A';}
function fG(v){return v!=null?`${v>=0?'+':''}${Number(v).toFixed(1)}%`:'N/A';}
function fC(v){return v!=null?`$${Math.round(v)}/SF`:'N/A';}
function cV(v){return v==null?'var(--muted)':v<7?'var(--good)':v<10?'var(--warn)':'var(--danger)';}
function cG(v){return v==null?'var(--muted)':v>=3?'var(--good)':v<0?'var(--danger)':'var(--muted)';}

function Chip({label,value,color}){
  return(
    <div className="mc-chip">
      <div className="mc-chip-l">{label}</div>
      <div className="mc-chip-v" style={{color:color||'var(--text)'}}>{value}</div>
    </div>
  );
}

function MarketRow({m,onOpen}){
  const ks=m.key_stats||{};
  return(
    <div className="mr" onClick={()=>onOpen(m)}>
      <div className={`rnum ${rnCls(m.rank,m.tier)}`}>#{m.rank}</div>
      <div className="mi">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
          <div className="mn">{m.market}</div>
          <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>{tbd(m.tier)}<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:sc2(m.score)}}>{m.score}</span></div>
        </div>
        <div className="mr-region">{m.region}</div>
        <div className="ml">{(m.headline||m.detail||'').slice(0,100)}...</div>
        <div className="mini-chips">
          <Chip label="Vacancy"   value={fV(ks.vacancy)}           color={cV(ks.vacancy)}/>
          <Chip label="Rent $/SF" value={fR(ks.rent)}              color="var(--orange)"/>
          <Chip label="Rent chg"  value={fG(m.rent_growth)}        color={cG(m.rent_growth)}/>
          <Chip label="YTD abs."  value={fA(ks.absorption)}/>
          <Chip label="Cap rate"  value={ks.cap_rate?ks.cap_rate+'%':'N/A'}/>
          <Chip label="Build $/SF" value={fC(ks.construction_cost)} color={ks.construction_cost&&ks.construction_cost<70?'var(--good)':ks.construction_cost&&ks.construction_cost>120?'var(--danger)':null}/>
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
  const ks=m.key_stats||{};
  return(
    <div className="score-popup on" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="popup-box">
        <div className="popup-head">
          <div>
            <div className="popup-title">{m.market}</div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{m.region} · Q1 2026 · Industrial</div>
          </div>
          <button className="popup-close" onClick={onClose}>Close ✕</button>
        </div>
        <div className="popup-body">
          <div className="pop-stat-grid">
            {[
              {l:'Overall score', v:m.score+'/100',       c:sc2(m.score)},
              {l:'Vacancy',       v:fV(ks.vacancy),       c:cV(ks.vacancy)},
              {l:'Asking rent',   v:fR(ks.rent),          c:'var(--orange)'},
              {l:'Rent growth',   v:fG(ks.rent_growth),   c:cG(ks.rent_growth)},
              {l:'YTD absorption',v:fA(ks.absorption),    c:'var(--text)'},
              {l:'Cap rate',      v:ks.cap_rate?ks.cap_rate+'%':'N/A', c:'var(--text)'},
              {l:'Build cost',    v:fC(ks.construction_cost), c:ks.construction_cost&&ks.construction_cost<70?'var(--good)':ks.construction_cost&&ks.construction_cost>120?'var(--danger)':'var(--text)'},
              {l:'Pipeline',      v:fA(ks.pipeline),      c:'var(--text)'},
              {l:'Tier',          v:m.tier,               c:'var(--text)'},
            ].map(x=>(
              <div className="psg" key={x.l}>
                <div className="psg-l">{x.l}</div>
                <div className="psg-v" style={{color:x.c||'var(--text)',fontSize:x.l==='Tier'?13:undefined}}>{x.v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,fontWeight:600,color:'var(--text)',marginBottom:10}}>Scoring breakdown — based only on confirmed data</div>
          {(m.scores_detail||[]).map((f,i)=>(
            <div key={i}>
              <div className="score-factor">
                <div className="sf-label">{f.f}</div>
                <div className="sf-dots">{[1,2,3,4,5].map(n=><div key={n} className={`sfd${n<=f.sc?' on':''}`}/>)}</div>
                <div className="sf-score">{f.sc}/5</div>
              </div>
              <div style={{padding:'4px 0 8px 150px',fontSize:10,color:'var(--dim)',borderBottom:'1px solid var(--border)',lineHeight:1.55}}>{f.note}</div>
            </div>
          ))}
          <div className="why-box">
            <div className="why-box-title">Investment rationale</div>
            <div>{m.detail||m.headline}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThesisPage({api}){
  const [thesis,  setThesis]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('summary');
  const [popup,   setPopup]   = useState(null);

  useEffect(()=>{
    fetch(`${api}/api/thesis/current`)
      .then(r=>r.json())
      .then(d=>{setThesis(d);setLoading(false);})
      .catch(()=>setLoading(false));
  },[api]);

  const rankings    = thesis?.rankings    || [];
  const risks       = thesis?.risk_factors|| [];
  const top10       = rankings.filter(r=>r.tier!=='Avoid').slice(0,10);
  const avoidList   = rankings.filter(r=>r.tier==='Avoid');
  const summary     = thesis?.summary     || '';
  const paragraphs  = summary.split('\n\n').filter(Boolean);

  if(loading) return(
    <div style={{padding:'60px 0',textAlign:'center',color:'var(--muted)'}}>
      <div className="thn" style={{justifyContent:'center',marginBottom:10}}><span/><span/><span/></div>
      Loading investment thesis...
    </div>
  );

  return(
    <>
      <div className="mrow">
        <div className="mc"><div className="mcl">Reports ingested</div><div className="mcv">{thesis?.report_count||53}</div><div className="mcc up">6 brokerages</div></div>
        <div className="mc"><div className="mcl">Markets tracked</div><div className="mcv">22</div><div className="mcc nu">Verified data only</div></div>
        <div className="mc"><div className="mcl">Top market</div><div className="mcv" style={{fontSize:16,marginTop:4}}>{top10[0]?.market||'Dallas / FW'}</div><div className="mcc up">Score {top10[0]?.score||94}/100</div></div>
        <div className="mc"><div className="mcl">Data quarter</div><div className="mcv" style={{fontSize:19,marginTop:4}}>{thesis?.quarter||'Q1 2026'}</div><div className="mcc nu">Auto-updating</div></div>
      </div>

      <div className="tc">
        <div className="panel" style={{height:600,display:'flex',flexDirection:'column',marginBottom:0}}>
          <div className="ph"><span className="pt">AI Investment Thesis — {thesis?.quarter||'Q1 2026'}</span><span className="badge bl">● Industrial only</span></div>
          <div className="tabrow">
            {[['summary','Summary'],['top10','Top 10'],['avoid','Avoid'],['risks','Risk Factors']].map(([k,v])=>(
              <div key={k} className={`tab ${tab===k?'on':''}`} onClick={()=>setTab(k)}>{v}</div>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            {tab==='summary'&&(
              <div className="tbody">
                {paragraphs.length>0 ? paragraphs.map((p,i)=>(
                  <p key={i}>{p.split(/(\*\*[^*]+\*\*)/).map((c,j)=>
                    c.startsWith('**')&&c.endsWith('**')
                      ?<span key={j} className="hl">{c.slice(2,-2)}</span>
                      :c
                  )}</p>
                )) : <p style={{color:'var(--dim)'}}>Loading thesis summary...</p>}
              </div>
            )}
            {tab==='top10'&&(
              <>
                <div style={{padding:'7px 16px',fontSize:10,color:'var(--dim)',borderBottom:'1px solid var(--border)'}}>Click any market for the full scoring breakdown →</div>
                {top10.map(m=><MarketRow key={m.rank} m={m} onOpen={setPopup}/>)}
                {top10.length===0&&<div style={{padding:20,color:'var(--dim)',fontSize:11}}>Rankings loading...</div>}
              </>
            )}
            {tab==='avoid'&&(
              <>
                <div style={{padding:'10px 16px',fontSize:10,color:'var(--dim)',borderBottom:'1px solid var(--border)'}}>Markets where Glenstar should NOT pursue speculative development without a committed tenant.</div>
                {avoidList.map((m,i)=>(
                  <div className="avoid-row" key={i}>
                    <div className="rnum rna" style={{marginTop:1}}>✕</div>
                    <div className="mi">
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                        <div className="mn">{m.market}</div>
                        <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}><span className="badge bav">Avoid</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:'var(--purple)'}}>{m.score}</span></div>
                      </div>
                      <div className="mr-region">{m.region}</div>
                      <div className="ml">{m.detail||m.headline}</div>
                      <div className="mini-chips">
                        {[
                          {l:'Vacancy',  v:fV(m.key_stats?.vacancy),     c:cV(m.key_stats?.vacancy)},
                          {l:'Rent',     v:fR(m.key_stats?.rent),         c:'var(--orange)'},
                          {l:'Rent chg', v:fG(m.key_stats?.rent_growth),  c:cG(m.key_stats?.rent_growth)},
                          {l:'Abs.',     v:fA(m.key_stats?.absorption),   c:m.key_stats?.absorption<0?'var(--danger)':null},
                          {l:'Cost/SF',  v:fC(m.key_stats?.construction_cost), c:m.key_stats?.construction_cost>120?'var(--danger)':null},
                          {l:'Pipeline', v:fA(m.key_stats?.pipeline)},
                        ].map(x=><Chip key={x.l} label={x.l} value={x.v} color={x.c}/>)}
                      </div>
                    </div>
                  </div>
                ))}
                {avoidList.length===0&&<div style={{padding:20,color:'var(--dim)',fontSize:11}}>Avoid market data loading...</div>}
              </>
            )}
            {tab==='risks'&&(
              (risks.length>0?risks:[
                {level:'high',title:'Steel & aluminum tariffs at 50%',detail:'Input costs up 7-12% annualized. Lock GC contracts with escalation caps. Procure structural steel early.'},
                {level:'high',title:'Power and electrical capacity',detail:'Transformer lead times 18-24 months in Phoenix, Dallas, Atlanta. Underwrite power access before committing to land.'},
                {level:'medium',title:'Skilled labor shortage',detail:'~500K additional workers needed nationally. Indianapolis, Louisville, Memphis have best labor availability.'},
                {level:'low',title:'Lending environment improving',detail:'CBRE Lending Momentum Index at highest since 2018. Most favorable financing window for industrial in 3 years.'},
              ]).map((r,i)=>(
                <div className="riskr" key={i}>
                  <span className={`rl rl${r.level.charAt(0)}`}>{r.level}</span>
                  <div><div className="rkt">{r.title}</div><div className="rkd">{r.detail}</div></div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel" style={{height:600,display:'flex',flexDirection:'column',marginBottom:0}}>
          <div className="ph"><span className="pt">Top 10 target markets</span><span className="badge bl">Click for score breakdown</span></div>
          <div style={{flex:1,overflowY:'auto'}}>
            {top10.map(m=><MarketRow key={m.rank} m={m} onOpen={setPopup}/>)}
            {top10.length===0&&<div style={{padding:20,color:'var(--dim)',fontSize:11}}>Rankings loading...</div>}
          </div>
        </div>
      </div>

      <ScorePopup m={popup} onClose={()=>setPopup(null)}/>
    </>
  );
}
