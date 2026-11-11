import React, { useState, useEffect } from 'react';
import { getJSON } from '../lib/api';
import { f, clr } from '../lib/format';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getJSON('/api/reports')
      .then(d => setReports(Array.isArray(d) ? d : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered  = filter==='all' ? reports : reports.filter(r=>r.source===filter);
  const sources   = ['all', ...new Set(reports.map(r=>r.source).filter(Boolean).sort())];
  const srcCls    = {'JLL':'bjll','CBRE':'bcb','C&W':'bcw','Avison Young':'bay','Newmark':'bnm','Colliers':'bcl'};
  const qBadge    = q => q&&q.includes('2026') ? 'bpr' : q&&q.includes('Q4 2025') ? 'bca' : 'bse';

  return (
    <div className="panel">
      <div className="ph">
        <span className="pt">Industrial report library — {reports.length} reports · click market name ↗ to open source report</span>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          {sources.map(s=>(
            <button key={s} className={`btn bsm ${filter===s?'bp':'bg'}`} onClick={()=>setFilter(s)}>
              {s==='all'?'All sources':s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'var(--muted)'}}>Loading reports...</div>
      ) : error ? (
        <div style={{padding:40,textAlign:'center',color:'var(--danger)'}}>Could not load reports: {error}</div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table className="dtbl" style={{minWidth:940}}>
            <thead><tr>
              <th style={{textAlign:'left'}}>Source</th>
              <th style={{textAlign:'left'}}>Market — click ↗ to open</th>
              <th style={{textAlign:'left'}}>Region</th>
              <th style={{textAlign:'left'}}>Quarter</th>
              <th>Vacancy</th><th>Occ.</th>
              <th>Rent $/SF</th><th>Rent Chg</th>
              <th>YTD Abs.</th><th>Cap Rate</th>
              <th>Build $/SF</th><th>Data %</th>
            </tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={12} style={{textAlign:'center',padding:30,color:'var(--dim)'}}>No reports found</td></tr>
                : filtered.map((r,i)=>(
                  <tr key={i}>
                    <td style={{textAlign:'left'}}><span className={`badge ${srcCls[r.source]||'bjll'}`}>{r.source}</span></td>
                    <td style={{fontWeight:600}}>
                      {r.report_url
                        ? <a href={r.report_url} target="_blank" rel="noreferrer" style={{color:'var(--text)',textDecoration:'none'}} title="Open original broker report">
                            {r.market} <span style={{color:'var(--orange)',fontSize:11}}>↗</span>
                          </a>
                        : r.market
                      }
                    </td>
                    <td style={{textAlign:'left',fontSize:10,color:'var(--muted)'}}>{r.region||'N/A'}</td>
                    <td style={{textAlign:'left'}}><span className={`badge ${qBadge(r.quarter)}`} style={{fontSize:8}}>{r.quarter||'N/A'}</span></td>
                    <td className="mono" style={{color:clr.vac(r.vacancy_rate),fontWeight:600}}>{f.pct(r.vacancy_rate)}</td>
                    <td className="mono">{f.pct(r.occupancy_rate)}</td>
                    <td className="mono" style={{color:'var(--orange)',fontWeight:600}}>{f.rent(r.asking_rent_psf)}</td>
                    <td className="mono" style={{color:clr.rg(r.rent_growth_pct)}}>{f.rg(r.rent_growth_pct)}</td>
                    <td className="mono" style={{color:clr.abs(r.ytd_absorption_msf)}}>{f.msf(r.ytd_absorption_msf)}</td>
                    <td className="mono">{r.cap_rate!=null?r.cap_rate+'%':'N/A'}</td>
                    <td className="mono" style={{color:clr.cost(r.construction_cost_psf)}}>{f.cost(r.construction_cost_psf)}</td>
                    <td>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,
                        color:(r.data_completeness_pct||0)>=80?'var(--good)':(r.data_completeness_pct||0)>=60?'var(--warn)':'var(--danger)'}}>
                        {r.data_completeness_pct!=null?r.data_completeness_pct+'%':'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      <div style={{padding:'10px 14px',borderTop:'1px solid var(--border)',display:'flex',gap:16,flexWrap:'wrap'}}>
        <span style={{fontSize:10,color:'var(--dim)'}}>↗ Click any market name to open the original broker report in a new tab</span>
        <span style={{fontSize:10,color:'var(--dim)',marginLeft:'auto'}}>N/A = metric not reported in source document · never estimated or fabricated</span>
      </div>
    </div>
  );
}
