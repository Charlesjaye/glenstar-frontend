import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ThesisPage       from './pages/ThesisPage';
import MarketsPage      from './pages/MarketsPage';
import ChatPage         from './pages/ChatPage';
import ReportsPage      from './pages/ReportsPage';
import MonitorPage      from './pages/MonitorPage';
import UnderwritingPage from './pages/UnderwritingPage';
import { getJSON, postJSON } from './lib/api';
import { BROKERAGE_COUNT, UNDERWRITING_QUARTER } from './lib/constants';
import { MARKETS as UNDERWRITING_MARKETS } from './data/underwritingMarkets';
import { usePage } from './lib/router';

const UW_MARKET_COUNT = Object.keys(UNDERWRITING_MARKETS).length;

const NAV = [
  { id: 'thesis',       path: '/',             label: 'Live Thesis',      icon: '◆', group: 'Analysis' },
  { id: 'markets',      path: '/markets',      label: 'Market Analytics', icon: '◈', group: null },
  { id: 'underwriting', path: '/underwriting', label: 'Underwriting',     icon: '◉', group: null },
  { id: 'chat',         path: '/chat',         label: 'Ask Claude',       icon: '◇', group: null },
  { id: 'reports',      path: '/reports',      label: 'Report Library',   icon: '▣', group: 'Data' },
  { id: 'monitor',      path: '/monitor',      label: 'Source Monitor',   icon: '▷', group: null },
];

const META = {
  thesis:       { title: 'Live Investment Thesis',   sub: `AI-generated · ${BROKERAGE_COUNT} brokerages · industrial only · auto-updates twice daily` },
  markets:      { title: 'Market Analytics',         sub: 'Industrial fundamentals by building size · size-specific construction costs · verified data only' },
  underwriting: { title: 'Underwriting Assumptions', sub: `${UW_MARKET_COUNT} markets · ${UNDERWRITING_QUARTER} broker data · select market + building size to populate all assumptions` },
  chat:         { title: 'Ask Claude',               sub: 'AI-powered industrial market analysis grounded in verified broker data' },
  reports:      { title: 'Report Library',           sub: 'Click any market name ↗ to open the original broker report' },
  monitor:      { title: 'Source Monitor',           sub: `Twice-daily scans at 6:00 AM and 6:00 PM · ${BROKERAGE_COUNT} brokerages · auto quarter detection` },
};

export default function App() {
  const [page, navigate] = usePage(NAV);
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
  const [thesisVersion, setThesisVersion] = useState(0);

  const loadStats = useCallback(() => {
    getJSON('/api/stats').then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    loadStats();
    const iv = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [loadStats]);

  useEffect(() => {
    document.title = `${META[page].title} · Glenstar Intelligence`;
  }, [page]);

  const notify = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const triggerScan = async () => {
    notify(`Scanning all ${BROKERAGE_COUNT} industrial report sources...`, 'info');
    try {
      await postJSON('/api/monitor/scan');
      loadStats();
      notify('Scan complete.', 'success');
    } catch (err) {
      notify(`Scan failed: ${err.message}`, 'error');
    }
  };

  const triggerThesis = async () => {
    notify('Regenerating investment thesis with Claude AI...', 'info');
    try {
      await postJSON('/api/thesis/regenerate');
      loadStats();
      setThesisVersion(v => v + 1);
      notify('New thesis generated.', 'success');
    } catch (err) {
      notify(`Regeneration failed: ${err.message}`, 'error');
    }
  };

  const quarter     = stats?.latest_quarter || stats?.thesis_quarter || '—';
  const reportCount = stats?.real_data_count ?? stats?.report_count ?? 0;
  const marketCount = stats?.market_count ?? null;
  const apiReady    = stats?.api_key_configured;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-g">GLENSTAR</div>
          <div className="logo-i">Intelligence</div>
          <div className="logo-t">Industrial Market Platform</div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <React.Fragment key={item.id}>
              {item.group && <div className="nav-s">{item.group}</div>}
              <a
                href={item.path}
                className={`ni ${page === item.id ? 'on' : ''}`}
                style={{ textDecoration: 'none' }}
                onClick={e => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // allow open-in-new-tab
                  e.preventDefault();
                  navigate(item.id);
                }}
              >
                <span className="ni-ico">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="live-pill">
            <div className="live-dot" />
            <div>
              <div className="live-label">Live monitoring</div>
              <div className="live-sub">{reportCount} reports · {BROKERAGE_COUNT} brokerages</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="ptitle">{META[page].title}</h1>
            <p className="psub">{META[page].sub}</p>
          </div>
          <div className="tbr">
            <div className="tmeta">
              <div style={{ color: 'var(--text)', fontWeight: 500 }}>{quarter} data</div>
              <div style={{ color: 'var(--dim)' }}>
                {stats ? `${reportCount} verified reports · ${apiReady ? 'AI active' : 'API key needed'}` : 'Backend unreachable'}
              </div>
            </div>
            <button className="btn bg" onClick={triggerScan}>Scan sources</button>
            <button className="btn bp" onClick={triggerThesis}>Regenerate thesis</button>
          </div>
        </header>

        <main className="content">
          {page === 'thesis'       && <ThesisPage       refreshKey={thesisVersion} />}
          {page === 'markets'      && <MarketsPage />}
          {page === 'underwriting' && <UnderwritingPage />}
          {page === 'chat'         && <ChatPage         apiReady={apiReady} marketCount={marketCount} />}
          {page === 'reports'      && <ReportsPage />}
          {page === 'monitor'      && <MonitorPage      onScan={triggerScan} stats={stats} />}
        </main>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
