import React, { useState, useEffect, useCallback } from 'react';
import { getJSON } from '../lib/api';
import { BROKERAGE_COUNT, SCAN_SCHEDULE } from '../lib/constants';

export default function MonitorPage({ onScan, stats }) {
  const [sources,  setSources]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(() => {
    setError(null);
    return Promise.all([getJSON('/api/monitor/sources'), getJSON('/api/thesis/history')])
      .then(([src, hist]) => {
        setSources(Array.isArray(src) ? src : []);
        setHistory(Array.isArray(hist) ? hist : []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmtDate = d => d
    ? new Date(d).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
    : 'Never';

  const icon = (name = '') =>
    name.includes('JLL')     ? {cls:'si-jll',txt:'JLL'} :
    name.includes('CBRE')    ? {cls:'si-cb', txt:'CBR'} :
    name.includes('Cushman') ? {cls:'si-cw', txt:'C&W'} :
    name.includes('Avison')  ? {cls:'si-ay', txt:'AY'}  :
    name.includes('Newmark') ? {cls:'si-nm', txt:'NMK'} :
                               {cls:'si-cl', txt:'COL'} ;

  const handleScan = async () => {
    setScanning(true);
    await onScan();
    setScanning(false);
    load();
  };

  const statusMsg = (text, color = 'var(--muted)') => (
    <div style={{padding:'24px 16px',textAlign:'center',fontSize:11,color}}>{text}</div>
  );

  return (
    <div className="tc">
      <div>
        <div className="panel" style={{marginBottom:12}}>
          <div className="ph"><span className="pt">Industrial source monitoring — {BROKERAGE_COUNT} brokerages</span><span className="badge bl">● Active</span></div>

          {loading && statusMsg('Loading sources...')}
          {!loading && error && statusMsg(`Could not load sources: ${error}`, 'var(--danger)')}
          {!loading && !error && sources.length === 0 && statusMsg('No sources reported by the backend yet.')}
          {sources.map((s,i) => {
            const ic = icon(s.name);
            return (
              <div className="srcc" key={i}>
                <div className={`srci ${ic.cls}`}>{ic.txt}</div>
                <div style={{flex:1}}>
                  <div className="srcn">{s.name}</div>
                  <div className="srcu">{(s.url||'').replace('https://','').slice(0,50)}</div>
                  <div className="srcx">{s.reports_tracked} pages · Last scan: {fmtDate(s.last_checked)}</div>
                </div>
                <span className="badge b2x">6AM & 6PM</span>
              </div>
            );
          })}

          <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <button className="btn bp" onClick={handleScan} disabled={scanning}>
              {scanning ? 'Scanning...' : 'Run scan now'}
            </button>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:'var(--muted)'}}>{SCAN_SCHEDULE} daily</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:'var(--good)',marginTop:2}}>
                {sources.length} of {BROKERAGE_COUNT} sources reporting · Industrial only
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="ph"><span className="pt">Quarter auto-detection</span></div>
          <div style={{padding:'14px 16px',fontSize:11,color:'var(--muted)',lineHeight:1.85}}>
            <p style={{marginBottom:8}}>
              <strong style={{color:'var(--text)'}}>Current dashboard quarter:</strong> {stats?.latest_quarter || '—'}
            </p>
            <p style={{marginBottom:8}}>
              <strong style={{color:'var(--text)'}}>Today's calendar quarter:</strong> {stats?.current_date_quarter || '—'}
            </p>
            <p style={{marginBottom:8}}>
              <strong style={{color:'var(--text)'}}>Expected latest reports:</strong> {stats?.expected_quarter || '—'}
            </p>
            <p style={{marginBottom:10,borderTop:'1px solid var(--border)',paddingTop:10}}>
              The dashboard automatically shows the most common quarter across all ingested reports.
              When a new quarter's reports start appearing (e.g. Q2 2026 reports in July),
              the quarter label updates automatically once 3+ markets have new data.
            </p>
            <p>
              Broker reports typically publish 4-6 weeks after quarter end.
              The twice-daily scan detects new quarters and triggers a thesis regeneration automatically.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="panel" style={{marginBottom:12}}>
          <div className="ph"><span className="pt">Thesis generation history</span></div>
          <table className="dtbl">
            <thead><tr>
              <th style={{textAlign:'left'}}>Quarter</th>
              <th style={{textAlign:'left'}}>Generated</th>
              <th>Reports</th>
              <th style={{textAlign:'left'}}>Status</th>
            </tr></thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={4} style={{textAlign:'center',padding:20,color:error?'var(--danger)':'var(--dim)'}}>
                  {loading ? 'Loading...' : error ? `Could not load history: ${error}` : 'No theses generated yet.'}
                </td></tr>
              )}
              {history.map((t,i)=>(
                <tr key={i}>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",color:t.is_current?'var(--text)':'var(--muted)'}}>{t.quarter}</td>
                  <td style={{fontSize:11}}>{fmtDate(t.generated_at)}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",textAlign:'right',color:'var(--muted)'}}>{t.report_count}</td>
                  <td>
                    {t.is_current
                      ? <span className="badge bl">Current</span>
                      : <span className="badge" style={{background:'rgba(255,255,255,0.03)',color:'var(--dim)',border:'1px solid var(--border)'}}>Archived</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="ph"><span className="pt">Data quality standards</span></div>
          <div style={{padding:'14px 16px',fontSize:11,color:'var(--muted)',lineHeight:1.85}}>
            <p style={{marginBottom:8}}><strong style={{color:'var(--good)'}}>85%+ completeness</strong> — Full confirmed data set. Highest confidence scores.</p>
            <p style={{marginBottom:8}}><strong style={{color:'var(--warn)'}}>60-84% completeness</strong> — Core metrics confirmed. Some supplementary fields missing.</p>
            <p style={{marginBottom:8}}><strong style={{color:'var(--danger)'}}>Below 60%</strong> — Excluded from Market Analytics until more data confirmed.</p>
            <p><strong style={{color:'var(--text)'}}>N/A</strong> — Metric not found in source document. Never estimated or fabricated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
