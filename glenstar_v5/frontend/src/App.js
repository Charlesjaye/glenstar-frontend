import React, { useState, useEffect } from 'react';
import './App.css';
import ThesisPage from './pages/ThesisPage';
import MarketsPage from './pages/MarketsPage';
import ChatPage from './pages/ChatPage';
import ReportsPage from './pages/ReportsPage';
import MonitorPage from './pages/MonitorPage';

const API = process.env.REACT_APP_API_URL || '';

export default function App() {
  const [page, setPage]   = useState('thesis');
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchStats = () => {
    fetch(`${API}/api/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 5 minutes to keep quarter current
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const notify = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const triggerScan = async () => {
    notify('Scanning all 6 industrial report sources...', 'info');
    try {
      await fetch(`${API}/api/monitor/scan`, { method: 'POST' });
      fetchStats();
      notify('Scan complete — checking for updated reports.', 'success');
    } catch {
      notify('Scan failed — check that your backend is running.', 'error');
    }
  };

  const triggerThesis = async () => {
    notify('Regenerating investment thesis with Claude AI...', 'info');
    try {
      await fetch(`${API}/api/thesis/regenerate`, { method: 'POST' });
      fetchStats();
      notify('New thesis generated successfully.', 'success');
    } catch {
      notify('Thesis generation failed. Check backend logs.', 'error');
    }
  };

  const navItems = [
    { id: 'thesis',  label: 'Live Thesis',     icon: '◆', group: 'Analysis' },
    { id: 'markets', label: 'Market Analytics', icon: '◈', group: null },
    { id: 'chat',    label: 'Ask Claude',       icon: '◇', group: null },
    { id: 'reports', label: 'Report Library',   icon: '▣', group: 'Data' },
    { id: 'monitor', label: 'Source Monitor',   icon: '▷', group: null },
  ];

  const pageMeta = {
    thesis:  { title: 'Live Investment Thesis',   sub: 'AI-generated · 6 brokerages · industrial only · auto-updates twice daily' },
    markets: { title: 'Market Analytics',         sub: 'Industrial fundamentals by building size · verified data only · N/A shown where data unavailable' },
    chat:    { title: 'Ask Claude',               sub: 'AI-powered analysis grounded in verified industrial market data from 6 brokerages' },
    reports: { title: 'Report Library',           sub: 'Click any market name to open the original broker report · N/A shown for unconfirmed metrics' },
    monitor: { title: 'Source Monitor',           sub: 'Twice-daily scans at 6:00 AM and 6:00 PM · 6 brokerages · 94 industrial pages tracked' },
  };

  // Auto-determine the current quarter from stats — always shows most recent
  const currentQuarter = stats?.latest_quarter || stats?.thesis_quarter || 'Q1 2026';
  const reportCount    = stats?.real_data_count || stats?.report_count || 0;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-g">GLENSTAR</div>
          <div className="logo-i">Intelligence</div>
          <div className="logo-t">Industrial Market Platform</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <React.Fragment key={item.id}>
              {item.group && <div className="nav-s">{item.group}</div>}
              <div
                className={`ni ${page === item.id ? 'on' : ''}`}
                onClick={() => setPage(item.id)}
              >
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
            <h1 className="ptitle">{pageMeta[page].title}</h1>
            <p className="psub">{pageMeta[page].sub}</p>
          </div>
          <div className="tbr">
            <div className="tmeta">
              {/* Auto-updates from backend — always shows most recent quarter */}
              <div style={{color:'var(--text)',fontWeight:500}}>{currentQuarter} data</div>
              <div style={{color:'var(--dim)'}}>Industrial only · {reportCount} verified reports</div>
            </div>
            <button className="btn bg" onClick={triggerScan}>Scan sources</button>
            <button className="btn bp" onClick={triggerThesis}>Regenerate thesis</button>
          </div>
        </header>

        <main className="content">
          {page === 'thesis'  && <ThesisPage  api={API} />}
          {page === 'markets' && <MarketsPage api={API} />}
          {page === 'chat'    && <ChatPage    api={API} />}
          {page === 'reports' && <ReportsPage api={API} />}
          {page === 'monitor' && <MonitorPage api={API} onScan={triggerScan} />}
        </main>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
