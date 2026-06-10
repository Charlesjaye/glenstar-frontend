import React, { useState, useEffect } from 'react';

// ── Formatters ─────────────────────────────────────────────────────────────────
const f = {
  pct:  v => v != null ? `${Number(v).toFixed(1)}%`         : 'N/A',
  rent: v => v != null ? `$${Number(v).toFixed(2)}/SF`      : 'N/A',
  msf:  v => v != null ? `${Number(v).toFixed(1)} MSF`      : 'N/A',
  rg:   v => v != null ? `${v>=0?'+':''}${Number(v).toFixed(1)}%` : 'N/A',
  cost: v => v != null ? `$${Math.round(Number(v))}/SF`     : 'N/A',
};

const clr = {
  vac:  v => v == null ? 'var(--muted)' : v<7  ? 'var(--good)' : v<10 ? 'var(--warn)' : 'var(--danger)',
  rg:   v => v == null ? 'var(--muted)' : v>=3 ? 'var(--good)' : v<0  ? 'var(--danger)' : 'var(--muted)',
  abs:  v => v == null ? 'var(--muted)' : v>=0 ? 'var(--good)' : 'var(--danger)',
  cost: v => v == null ? 'var(--muted)' : v<70 ? 'var(--good)' : v>120 ? 'var(--danger)' : 'var(--muted)',
  sc:   s => s>=80 ? 'var(--orange)' : s>=65 ? 'var(--info)' : 'var(--purple)',
};

const SIZE_KEYS = {
  all: { vac:'vacancy_rate',   rent:'asking_rent_psf',  cost:'construction_cost_psf', abs:'ytd_absorption_msf' },
  s1:  { vac:'vac_0_100k',     rent:'rent_0_100k',      cost:'cost_0_100k',           abs:'abs_0_100k' },
  s2:  { vac:'vac_100_250k',   rent:'rent_100_250k',    cost:'cost_100_250k',         abs:'abs_100_250k' },
  s3:  { vac:'vac_250_500k',   rent:'rent_250_500k',    cost:'cost_250_500k',         abs:'abs_250_500k' },
  s4:  { vac:'vac_500_750k',   rent:'rent_500_750k',    cost:'cost_500_750k',         abs:'abs_500_750k' },
  s5:  { vac:'vac_750k_plus',  rent:'rent_750k_plus',   cost:'cost_750k_plus',        abs:'abs_750k_plus' },
};

const SIZE_LABELS = {
  all:'All sizes', s1:'0–100K SF', s2:'100K–250K SF',
  s3:'250K–500K SF', s4:'500K–750K SF', s5:'750K SF+',
};

const SIZE_DESC = {
  all:'Blended metrics across all building sizes · Construction costs vary significantly by size',
  s1:'0–100,000 SF — Small-bay & flex. Highest rent and construction cost per SF. Lowest vacancy.',
  s2:'100,000–250,000 SF — Mid-bay distribution. Most efficient cost point. Broadest tenant demand.',
  s3:'250,000–500,000 SF — Cross-dock & regional distribution. Monitor pipeline carefully.',
  s4:'500,000–750,000 SF — Large regional DCs. Tenant pool narrows. Avoid spec in oversupplied markets.',
  s5:'750,000 SF+ — Mega-DCs. Build-to-suit only is the prudent 2026 strategy.',
};

export default function MarketsPage({ api }) {
  const [markets, setMarkets] = useState([]);
  const [thesis,  setThesis]  = useState(null);
  const [size,    setSize]    = useState('all');
  const [search,  setSearch]  = useState('');
  const [region,  setRegion]  = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${api}/api/markets/summary`).then(r => r.json()),
      fetch(`${api}/api/thesis/current`).then(r => r.json()).catch(() => null),
    ]).then(([mkts, th]) => {
      setMarkets(Array.isArray(mkts) ? mkts : []);
      if (th && !th.error) setThesis(th);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [api]);

  const scoreMap = {};
  const tierMap  = {};
  (thesis?.rankings || []).forEach(r => { scoreMap[r.market] = r.score; tierMap[r.market] = r.tier; });

  const keys = SIZE_KEYS[size];
  const regions = ['All', ...new Set(markets.map(m => m.region).filter(Boolean).sort())];

  const getMetric = (m, segKey, fallbackKey) => {
    const v = m[segKey];
    if (v != null) return v;
    if (size !== 'all') return m[fallbackKey] ?? null;
    return null;
  };

  let rows = markets
    .filter(m => m.vacancy_rate != null || m.asking_rent_psf != null)
    .filter(m => region === 'All' || m.region === region)
    .filter(m => !search || m.market.toLowerCase().includes(search.toLowerCase()))
    .map(m => ({
      ...m,
      score: scoreMap[m.market] ?? null,
      tier:  tierMap[m.market]  ?? null,
      _vac:  getMetric(m, keys.vac,  'vacancy_rate'),
      _rent: getMetric(m, keys.rent, 'asking_rent_psf'),
      _cost: getMetric(m, keys.cost, 'construction_cost_psf'),
      _abs:  getMetric(m, keys.abs,  'ytd_absorption_msf'),
    }));

  const tierCls = { Primary:'bpr', Secondary:'bse', Caution:'bca', Avoid:'bav' };
  const avgVac  = rows.filter(r=>r._vac!=null).reduce((s,r,_,a)=>s+r._vac/a.length,0);
  const avgRent = rows.filter(r=>r._rent!=null).reduce((s,r,_,a)=>s+r._rent/a.length,0);

  return (
    <>
      <div className="mrow">
        <div className="mc"><div className="mcl">Markets with data</div><div className="mcv">{rows.length}</div><div className="mcc nu">Verified sources only</div></div>
        <div className="mc"><div className="mcl">Avg vacancy</div><div className="mcv">{rows.filter(r=>r._vac!=null).length>0 ? f.pct(avgVac) : 'N/A'}</div><div className="mcc nu">{SIZE_LABELS[size]}</div></div>
        <div className="mc"><div className="mcl">Avg asking rent</div><div className="mcv" style={{fontSize:18,marginTop:4}}>{rows.filter(r=>r._rent!=null).length>0 ? `$${avgRent.toFixed(2)}` : 'N/A'}</div><div className="mcc nu">Per SF / year</div></div>
        <div className="mc"><div className="mcl">Size segment</div><div className="mcv" style={{fontSize:14,marginTop:4}}>{SIZE_LABELS[size]}</div><div className="mcc nu">Click tabs to filter</div></div>
      </div>

      <div className="panel">
        <div className="ph">
          <span className="pt">Industrial market analytics — {rows.length} verified markets</span>
          <span className="badge bl">{SIZE_LABELS[size]}</span>
        </div>
        <div className="size-tabs">
          {Object.entries(SIZE_LABELS).map(([k,v]) => (
            <button key={k} className={`stab ${size===k?'on':''}`} onClick={()=>setSize(k)}>{v}</button>
          ))}
        </div>
        <div className="size-desc">{SIZE_DESC[size]}</div>

        <div style={{padding:'8px 16px',borderBottom:'1px solid var(--border)',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search markets..."
            style={{background:'var(--surf2)',border:'1px solid var(--border2)',borderRadius:5,padding:'6px 11px',color:'var(--text)',fontSize:12,outline:'none',width:180,fontFamily:'Inter,sans-serif'}}
          />
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {regions.map(r=>(
              <button key={r} className={`btn bsm ${region===r?'bp':'bg'}`} onClick={()=>setRegion(r)}>{r}</button>
            ))}
          </div>
          <span style={{marginLeft:'auto',fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'var(--dim)'}}>
            {rows.length} markets · click ↗ for source report
          </span>
        </div>

        {loading ? (
          <div style={{padding:40,textAlign:'center',color:'var(--muted)'}}>Loading market data...</div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="dtbl" style={{minWidth:980}}>
              <thead><tr>
                <th style={{textAlign:'left'}}>Market ↗</th>
                <th style={{textAlign:'left'}}>Region</th>
                <th>Score</th>
                <th style={{textAlign:'left'}}>Tier</th>
                <th>Vacancy</th><th>Avail.</th><th>Occ.</th>
                <th>Absorption</th><th>Rent $/SF</th><th>Rent Chg</th>
                <th>Cap Rate</th><th>Pipeline</th>
                <th title="Construction cost varies by building size">Build $/SF</th>
                <th>Quarter</th>
              </tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={14} style={{textAlign:'center',padding:30,color:'var(--dim)'}}>No markets match</td></tr>
                  : rows.map((m,i) => (
                    <tr key={i}>
                      <td>
                        {m.report_url
                          ? <a href={m.report_url} target="_blank" rel="noreferrer" style={{color:'var(--text)',textDecoration:'none',fontWeight:600}}>{m.market} <span style={{color:'var(--orange)',fontSize:10}}>↗</span></a>
                          : <span style={{fontWeight:600}}>{m.market}</span>
                        }
                      </td>
                      <td style={{fontSize:10,color:'var(--muted)'}}>{m.region||'N/A'}</td>
                      <td>
                        {m.score!=null
                          ? <div style={{display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end'}}>
                              <div style={{width:34,height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                                <div style={{height:3,width:m.score+'%',background:clr.sc(m.score),borderRadius:2}}/>
                              </div>
                              <span className="mono" style={{color:clr.sc(m.score)}}>{m.score}</span>
                            </div>
                          : <span className="mono" style={{color:'var(--dim)'}}>N/A</span>
                        }
                      </td>
                      <td style={{textAlign:'left'}}>
                        {m.tier ? <span className={`badge ${tierCls[m.tier]||'bse'}`} style={{fontSize:8}}>{m.tier}</span> : <span style={{color:'var(--dim)',fontSize:10}}>N/A</span>}
                      </td>
                      <td className="mono" style={{color:clr.vac(m._vac),fontWeight:600}}>{f.pct(m._vac)}</td>
                      <td className="mono">{f.pct(m.availability_rate)}</td>
                      <td className="mono">{f.pct(m.occupancy_rate)}</td>
                      <td className="mono" style={{color:clr.abs(m._abs)}}>{f.msf(m._abs)}</td>
                      <td className="mono" style={{color:'var(--orange)',fontWeight:600}}>{f.rent(m._rent)}</td>
                      <td className="mono" style={{color:clr.rg(m.rent_growth_pct)}}>{f.rg(m.rent_growth_pct)}</td>
                      <td className="mono">{m.cap_rate!=null ? m.cap_rate+'%' : 'N/A'}</td>
                      <td className="mono">{f.msf(m.pipeline_msf)}</td>
                      <td className="mono" style={{color:clr.cost(m._cost)}}>{f.cost(m._cost)}</td>
                      <td><span className={`badge ${m.quarter&&m.quarter.includes('2026')?'bpr':'bca'}`} style={{fontSize:8}}>{m.quarter||'N/A'}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        <div style={{padding:'9px 14px',borderTop:'1px solid var(--border)',display:'flex',gap:16,flexWrap:'wrap'}}>
          <span style={{fontSize:10,color:'var(--dim)'}}>Vacancy: <span style={{color:'var(--good)'}}>■</span>&lt;7% &nbsp;<span style={{color:'var(--warn)'}}>■</span>7-10% &nbsp;<span style={{color:'var(--danger)'}}>■</span>&gt;10%</span>
          <span style={{fontSize:10,color:'var(--dim)'}}>Build $/SF: small-bay highest, big-box lowest · <span style={{color:'var(--good)'}}>■</span>&lt;$70 &nbsp;<span style={{color:'var(--danger)'}}>■</span>&gt;$120</span>
          <span style={{fontSize:10,color:'var(--dim)'}}>N/A = not reported · markets without data excluded</span>
        </div>
      </div>
    </>
  );
}
