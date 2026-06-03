import React, { useState, useEffect } from 'react';
import './App.css';
import ThesisPage  from './pages/ThesisPage';
import MarketsPage from './pages/MarketsPage';
import ChatPage    from './pages/ChatPage';
import ReportsPage from './pages/ReportsPage';
import MonitorPage from './pages/MonitorPage';

const API = process.env.REACT_APP_API_URL || '';

export default function App() {
  const [page,  setPage]  = useState('thesis');
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);

  const loadStats = () => {
    fetch(`${API}/api/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  };

  useEffect(() => {
    loadStats();
    const iv = setInterval(loadStats, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(iv);
  }, []);

  const notify = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const triggerScan = async () => {
    notify('Scanning all 6 industrial report sources...', 'info');
    try {
      await fetch(`${API}/api/monitor/scan`, { method: 'POST' });
      loadStats();
      notify('Scan complete.', 'success');
    } catch { notify('Scan failed — check backend is running.', 'error'); }
  };

  const triggerThesis = async () => {
    notify('Regenerating investment thesis with Claude AI...', 'info');
    try {
      await fetch(`${API}/api/thesis/regenerate`, { method: 'POST' });
      loadStats();
      notify('New thesis generated.', 'success');
    } catch { notify('Regeneration failed.', 'error'); }
  };

  const nav = [
    { id:'thesis',  label:'Live Thesis',     icon:'◆', group:'Analysis' },
    { id:'markets', label:'Market Analytics', icon:'◈', group:null },
    { id:'chat',    label:'Ask Claude',       icon:'◇', group:null },
    { id:'reports', label:'Report Library',   icon:'▣', group:'Data' },
    { id:'monitor', label:'Source Monitor',   icon:'▷', group:null },
  ];

  const meta = {
    thesis:  { title:'Live Investment Thesis',   sub:'AI-generated · 6 brokerages · industrial only · auto-updates twice daily' },
    markets: { title:'Market Analytics',         sub:'Industrial fundamentals by building size · size-specific construction costs · verified data only' },
    chat:    { title:'Ask Claude',               sub:'AI-powered industrial market analysis grounded in verified broker data' },
    reports: { title:'Report Library',           sub:'Click any market name ↗ to open the original broker report' },
    monitor: { title:'Source Monitor',           sub:'Twice-daily scans at 6:00 AM and 6:00 PM · 6 brokerages · auto quarter detection' },
  };

  // Auto-updates from backend — shows most current quarter from reports
  const quarter    = stats?.latest_quarter || stats?.thesis_quarter || '—';
  const reportCount = stats?.real_data_count || stats?.report_count || 0;
  const apiReady   = stats?.api_key_configured;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-g">GLENSTAR</div>
          <div className="logo-i">Intelligence</div>
          <div className="logo-t">Industrial Market Platform</div>
        </div>
        <nav className="sidebar-nav">
          {nav.map(item => (
            <React.Fragment key={item.id}>
              {item.group && <div className="nav-s">{item.group}</div>}
              <div className={`ni ${page===item.id?'on':''}`} onClick={()=>setPage(item.id)}>
                <span className="ni-ico">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="live-pill">
            <div className="live-dot" />
            <div>
              <div className="live-label">Live monitoring</div>
              <div className="live-sub">{reportCount} reports · 6 brokerages</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="ptitle">{meta[page].title}</h1>
            <p className="psub">{meta[page].sub}</p>
          </div>
          <div className="tbr">
            <div className="tmeta">
              <div style={{color:'var(--text)',fontWeight:500}}>{quarter} data</div>
              <div style={{color:'var(--dim)'}}>{reportCount} verified reports · {apiReady ? 'AI active' : 'AI key needed'}</div>
            </div>
            <button className="btn bg" onClick={triggerScan}>Scan sources</button>
            <button className="btn bp" onClick={triggerThesis}>Regenerate thesis</button>
          </div>
        </header>

        <main className="content">
          {page==='thesis'  && <ThesisPage  api={API} />}
          {page==='markets' && <MarketsPage api={API} />}
          {page==='chat'    && <ChatPage    api={API} apiReady={apiReady} />}
          {page==='reports' && <ReportsPage api={API} />}
          {page==='monitor' && <MonitorPage api={API} onScan={triggerScan} stats={stats} />}
        </main>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
