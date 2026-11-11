import React, { useState, useEffect } from 'react';
import { getJSON } from '../lib/api';

// ── Tier colors ───────────────────────────────────────────────────────────────
const tierStyle = {
  Primary:   { bg: 'rgba(110,231,183,0.08)', border: 'rgba(110,231,183,0.25)', color: 'var(--good)' },
  Secondary: { bg: 'rgba(147,197,253,0.08)', border: 'rgba(147,197,253,0.25)', color: 'var(--info)' },
  Avoid:     { bg: 'rgba(252,165,165,0.08)', border: 'rgba(252,165,165,0.25)', color: 'var(--danger)' },
};

const TIERS   = ['All tiers', 'Primary', 'Secondary', 'Avoid'];

// ── Field definitions for the output table ───────────────────────────────────
const FIELDS = [
  { key: 'rent',          label: 'Asking Rent',         fmt: v => `$${Number(v).toFixed(2)}/SF`,   color: v => 'var(--orange)',        group: 'Revenue' },
  { key: 'rent_growth',   label: 'Rent Growth',         fmt: v => `${v >= 0 ? '+' : ''}${Number(v).toFixed(1)}%/yr`, color: v => v >= 3 ? 'var(--good)' : v < 0 ? 'var(--danger)' : 'var(--muted)', group: 'Revenue' },
  { key: 'vacancy',       label: 'Vacancy Rate',        fmt: v => `${Number(v).toFixed(1)}%`,       color: v => v < 7 ? 'var(--good)' : v < 10 ? 'var(--warn)' : 'var(--danger)', group: 'Revenue' },
  { key: 'cost',          label: 'Build Cost',          fmt: v => `$${Math.round(v)}/SF`,            color: v => v < 70 ? 'var(--good)' : v > 120 ? 'var(--danger)' : 'var(--muted)', group: 'Construction' },
  { key: 'free_rent',     label: 'Free Rent',           fmt: v => `${v} months`,                    color: () => 'var(--muted)',        group: 'Leasing' },
  { key: 'ti_new',        label: 'TI — New Lease',      fmt: v => `$${v}/SF`,                       color: () => 'var(--muted)',        group: 'Leasing' },
  { key: 'ti_renewal',    label: 'TI — Renewal',        fmt: v => `$${v}/SF`,                       color: () => 'var(--muted)',        group: 'Leasing' },
  { key: 'lc',            label: 'Leasing Commission',  fmt: v => `${v}%`,                          color: () => 'var(--muted)',        group: 'Leasing' },
  { key: 'lease_term',    label: 'Avg Lease Term',      fmt: v => `${v} months`,                    color: () => 'var(--muted)',        group: 'Leasing' },
  { key: 'renewal_prob',  label: 'Renewal Probability', fmt: v => `${v}%`,                          color: v => v >= 75 ? 'var(--good)' : 'var(--muted)', group: 'Leasing' },
  { key: 'downtime',      label: 'Downtime (Rollover)', fmt: v => `${v} months`,                    color: v => v <= 7 ? 'var(--good)' : v >= 12 ? 'var(--danger)' : 'var(--muted)', group: 'Leasing' },
  { key: 'cap',           label: 'Exit Cap Rate',       fmt: v => `${Number(v).toFixed(2)}%`,       color: () => 'var(--text)',         group: 'Exit' },
  { key: 'opex',          label: 'OpEx',                fmt: v => `$${Number(v).toFixed(2)}/SF`,    color: () => 'var(--muted)',        group: 'Operating' },
  { key: 'taxes',         label: 'Real Estate Taxes',   fmt: v => `$${Number(v).toFixed(2)}/SF`,    color: () => 'var(--muted)',        group: 'Operating' },
  { key: 'cap_reserve',   label: 'Capital Reserve',     fmt: v => `$${Number(v).toFixed(2)}/SF`,    color: () => 'var(--muted)',        group: 'Operating' },
];

// Loads the underwriting dataset from the backend (GET /api/underwriting/dataset),
// which is the single source of truth — edit underwriting_markets.json there.
export default function UnderwritingPage() {
  const [dataset, setDataset] = useState(null);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getJSON('/api/underwriting/dataset')
      .then(d => {
        if (!d || !d.markets || Object.keys(d.markets).length === 0) throw new Error('dataset is empty');
        setDataset(d);
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) return (
    <div className="panel" style={{padding:40,textAlign:'center',color:'var(--danger)',fontSize:12}}>
      Could not load underwriting data: {error}
    </div>
  );
  if (!dataset) return (
    <div style={{padding:'60px 0',textAlign:'center',color:'var(--muted)'}}>Loading underwriting data...</div>
  );
  return <UnderwritingView dataset={dataset} />;
}

function UnderwritingView({ dataset }) {
  const MARKETS = dataset.markets;
  const SIZES   = Object.keys(Object.values(MARKETS)[0].by_size);
  const REGIONS = ['All regions', ...new Set(Object.values(MARKETS).map(m => m.region).sort())];
  const QUARTER = dataset.quarter || '';

  const [selectedMarket, setMarket] = useState('');
  const [selectedSize,   setSize]   = useState(SIZES.includes('100K-250K SF') ? '100K-250K SF' : SIZES[0]);
  const [regionFilter,   setRegion] = useState('All regions');
  const [tierFilter,     setTier]   = useState('All tiers');
  const [search,         setSearch] = useState('');
  const [copied,         setCopied] = useState(false);

  const mktData = selectedMarket ? MARKETS[selectedMarket] : null;
  const sizeData = mktData?.by_size?.[selectedSize] || null;

  const filteredMarkets = Object.entries(MARKETS)
    .filter(([name, m]) => regionFilter === 'All regions' || m.region === regionFilter)
    .filter(([name, m]) => tierFilter   === 'All tiers'   || m.tier   === tierFilter)
    .filter(([name])    => !search || name.toLowerCase().includes(search.toLowerCase()))
    .sort(([, a], [, b]) => b.score - a.score);

  const groups = [...new Set(FIELDS.map(f => f.group))];

  return (
    <>
      {/* Stats row */}
      <div className="mrow">
        <div className="mc">
          <div className="mcl">Markets available</div>
          <div className="mcv">{Object.keys(MARKETS).length}</div>
          <div className="mcc nu">With quarterly broker reports</div>
        </div>
        <div className="mc">
          <div className="mcl">Selected market</div>
          <div className="mcv" style={{fontSize:15,marginTop:4}}>{selectedMarket || '—'}</div>
          <div className="mcc nu">{mktData ? `${mktData.region} · ${mktData.tier}` : 'Select below'}</div>
        </div>
        <div className="mc">
          <div className="mcl">Building size</div>
          <div className="mcv" style={{fontSize:14,marginTop:4}}>{selectedSize}</div>
          <div className="mcc nu">Select any segment</div>
        </div>
        <div className="mc">
          <div className="mcl">Market cap rate</div>
          <div className="mcv">{mktData ? `${mktData.cap_rate}%` : '—'}</div>
          <div className="mcc nu">{mktData ? `Vacancy: ${mktData.vacancy}%` : 'Load market data'}</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(300px, 340px) 1fr', gap:16, alignItems:'start', width:'100%'}}>

        {/* ── Left: Market selector ──────────────────────── */}
        <div>
          <div className="panel" style={{marginBottom:12}}>
            <div className="ph"><span className="pt">Select market</span><span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:'var(--dim)'}}>{filteredMarkets.length} markets</span></div>

            {/* Filters */}
            <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:8}}>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search markets..."
                style={{background:'var(--surf2)',border:'1px solid var(--border2)',borderRadius:5,padding:'7px 11px',color:'var(--text)',fontSize:11,outline:'none',width:'100%',fontFamily:'Inter,sans-serif'}}
              />
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {TIERS.map(t=>(
                  <button key={t} onClick={()=>setTier(t)} className={`btn bsm ${tierFilter===t?'bp':'bg'}`} style={{fontSize:9}}>
                    {t==='All tiers'?'All':t}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {REGIONS.map(r=>(
                  <button key={r} onClick={()=>setRegion(r)} className={`btn bsm ${regionFilter===r?'bp':'bg'}`} style={{fontSize:9}}>
                    {r==='All regions'?'All':r}
                  </button>
                ))}
              </div>
            </div>

            {/* Market list */}
            <div style={{maxHeight:520,overflowY:'auto'}}>
              {filteredMarkets.map(([name, m]) => {
                const ts = tierStyle[m.tier] || tierStyle.Secondary;
                const isSelected = selectedMarket === name;
                return (
                  <div
                    key={name}
                    onClick={() => setMarket(name)}
                    style={{
                      padding:'10px 14px', cursor:'pointer',
                      borderBottom:'1px solid var(--border)',
                      background: isSelected ? 'rgba(245,166,35,0.07)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--orange)' : '3px solid transparent',
                      transition:'all 0.12s',
                    }}
                  >
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:600,color:isSelected?'var(--orange)':'var(--text)'}}>{name}</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:ts.color}}>{m.score}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:'var(--dim)'}}>{m.region}</span>
                      <span style={{fontSize:8,padding:'1px 6px',borderRadius:3,background:ts.bg,border:`1px solid ${ts.border}`,color:ts.color}}>{m.tier}</span>
                      <span style={{marginLeft:'auto',fontSize:9,color:'var(--muted)'}}>Vac: {m.vacancy}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Size selector */}
          <div className="panel">
            <div className="ph"><span className="pt">Building size</span></div>
            <div style={{padding:'10px 14px',display:'flex',flexDirection:'column',gap:6}}>
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  style={{
                    padding:'9px 12px', textAlign:'left', borderRadius:6, cursor:'pointer',
                    fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:500,
                    border:'none', transition:'all 0.12s',
                    background: selectedSize===s ? 'var(--orange)' : 'var(--surf2)',
                    color: selectedSize===s ? '#0D0F14' : 'var(--muted)',
                    borderLeft: selectedSize===s ? 'none' : '2px solid transparent',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Assumptions output ─────────────────── */}
        <div>
          {!selectedMarket ? (
            <div className="panel" style={{padding:'60px 40px',textAlign:'center'}}>
              <div style={{fontSize:32,marginBottom:16}}>◇</div>
              <div style={{fontSize:14,color:'var(--text)',fontWeight:600,marginBottom:8}}>Select a market to populate assumptions</div>
              <div style={{fontSize:11,color:'var(--dim)',maxWidth:400,margin:'0 auto',lineHeight:1.7}}>
                Choose a market from the left and a building size to instantly populate underwriting assumptions sourced from {QUARTER} broker reports{dataset.sources ? ` (${dataset.sources})` : ''}.
              </div>
            </div>
          ) : (
            <>
              {/* Market header */}
              <div className="panel" style={{marginBottom:12}}>
                <div style={{padding:'16px 18px'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                        <span style={{fontSize:18,fontFamily:"'Playfair Display',serif",fontWeight:600,color:'var(--text)'}}>{selectedMarket}</span>
                        <span style={{fontSize:9,padding:'2px 8px',borderRadius:3,...tierStyle[mktData.tier],fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{mktData.tier}</span>
                      </div>
                      <div style={{fontSize:11,color:'var(--dim)'}}>{mktData.source}</div>
                    </div>
                    <a href={mktData.report_url} target="_blank" rel="noreferrer"
                       style={{fontSize:10,padding:'6px 12px',borderRadius:5,background:'rgba(245,166,35,0.08)',color:'var(--orange)',border:'1px solid rgba(245,166,35,0.2)',textDecoration:'none',fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>
                      View source report ↗
                    </a>
                  </div>

                  {/* Market fundamentals */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:12}}>
                    {[
                      {l:'Market vacancy',  v:`${mktData.vacancy}%`,          c: mktData.vacancy<7?'var(--good)':mktData.vacancy<10?'var(--warn)':'var(--danger)'},
                      {l:'YTD absorption',  v:`${mktData.absorption} MSF`,    c: mktData.absorption>=0?'var(--good)':'var(--danger)'},
                      {l:'Rent growth',     v:`${mktData.rent_growth>0?'+':''}${mktData.rent_growth}%`, c:'var(--orange)'},
                      {l:'Market cap rate', v:`${mktData.cap_rate}%`,          c:'var(--text)'},
                      {l:'Pipeline',        v:`${mktData.pipeline} MSF`,       c:'var(--muted)'},
                    ].map(x=>(
                      <div key={x.l} style={{background:'var(--surf2)',borderRadius:6,padding:'10px 12px'}}>
                        <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:'var(--dim)',textTransform:'uppercase',marginBottom:4}}>{x.l}</div>
                        <div style={{fontSize:16,fontFamily:"'Playfair Display',serif",fontWeight:600,color:x.c}}>{x.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Market notes */}
                  <div style={{fontSize:11,color:'var(--muted)',lineHeight:1.7,padding:'10px 12px',background:'var(--surf2)',borderRadius:6,borderLeft:'3px solid var(--orange)'}}>
                    {mktData.note}
                  </div>
                </div>
              </div>

              {/* Size header */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>
                  {selectedMarket} — {selectedSize}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:10,color:'var(--dim)',fontFamily:"'JetBrains Mono',monospace"}}>
                    {QUARTER} broker data
                  </span>
                  <button
                    className="btn bg bsm"
                    onClick={() => {
                      const rows = FIELDS.map(fl => `${fl.label}\t${sizeData?.[fl.key] ?? 'N/A'}`).join('\n');
                      const block = `${selectedMarket} — ${selectedSize}\nSource: ${mktData.source}\n\n${rows}`;
                      navigator.clipboard.writeText(block).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      });
                    }}
                  >
                    {copied ? '✓ Copied' : '⧉ Copy for Excel'}
                  </button>
                </div>
              </div>

              {/* Assumptions grouped by category */}
              {groups.map(group => (
                <div key={group} className="panel" style={{marginBottom:12}}>
                  <div className="ph">
                    <span className="pt">{group}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:10,padding:'14px 16px'}}>
                    {FIELDS.filter(f=>f.group===group).map((field) => {
                      const val = sizeData?.[field.key];
                      return (
                        <div key={field.key} style={{
                          padding:'14px 16px',
                          background:'var(--surf2)',
                          border:'1px solid var(--border)',
                          borderRadius:8,
                        }}>
                          <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:'var(--dim)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>
                            {field.label}
                          </div>
                          <div style={{fontSize:22,fontFamily:"'Playfair Display',serif",fontWeight:600,color:val!=null?field.color(val):'var(--dim)'}}>
                            {val != null ? field.fmt(val) : 'N/A'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* All sizes comparison */}
              <div className="panel">
                <div className="ph"><span className="pt">All size segments — {selectedMarket}</span><span className="badge bl">Rent · Cost · Vacancy</span></div>
                <div style={{overflowX:'auto'}}>
                  <table className="dtbl" style={{minWidth:700}}>
                    <thead><tr>
                      <th style={{textAlign:'left'}}>Size segment</th>
                      <th>Rent $/SF</th>
                      <th>Rent growth</th>
                      <th>Vacancy</th>
                      <th>Build $/SF</th>
                      <th>Free rent</th>
                      <th>TI new</th>
                      <th>Cap rate</th>
                    </tr></thead>
                    <tbody>
                      {SIZES.map(sz => {
                        const d = mktData.by_size[sz];
                        const isSelected = sz === selectedSize;
                        return (
                          <tr key={sz} onClick={()=>setSize(sz)} style={{cursor:'pointer',background:isSelected?'rgba(245,166,35,0.05)':'transparent'}}>
                            <td style={{fontWeight:isSelected?700:600,color:isSelected?'var(--orange)':'var(--text)'}}>{sz}</td>
                            <td className="mono" style={{color:'var(--orange)',fontWeight:600}}>${Number(d.rent).toFixed(2)}</td>
                            <td className="mono" style={{color:d.rent_growth>=3?'var(--good)':d.rent_growth<0?'var(--danger)':'var(--muted)'}}>{d.rent_growth>=0?'+':''}{d.rent_growth}%</td>
                            <td className="mono" style={{color:d.vacancy<7?'var(--good)':d.vacancy<10?'var(--warn)':'var(--danger)'}}>{d.vacancy}%</td>
                            <td className="mono" style={{color:d.cost<70?'var(--good)':d.cost>120?'var(--danger)':'var(--muted)'}}>${d.cost}</td>
                            <td className="mono">{d.free_rent} mos</td>
                            <td className="mono">${d.ti_new}/SF</td>
                            <td className="mono">{d.cap}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
