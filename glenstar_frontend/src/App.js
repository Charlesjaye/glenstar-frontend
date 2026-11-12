import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import OverviewPage     from './pages/OverviewPage';
import MarketsPage      from './pages/MarketsPage';
import UnderwritingPage from './pages/UnderwritingPage';
import ChatPage         from './pages/ChatPage';
import DataPage         from './pages/DataPage';
import ReportsPage      from './pages/ReportsPage';
import ReportPage       from './pages/ReportPage';
import SourcesPage      from './pages/SourcesPage';
import MarketDetail     from './components/MarketDetail';
import { AppContext, Banner, Drawer, Icon, Loading, Modal, useToasts } from './components/ui';
import { getJSON, onUnauthorized, postJSON, setAdminToken } from './lib/api';
import { useRoute, linkHandler } from './lib/router';

const ROUTES = [
  { id: 'overview',     path: '/' },
  { id: 'markets',      path: '/markets' },
  { id: 'underwriting', path: '/underwriting' },
  { id: 'chat',         path: '/chat' },
  { id: 'data',         path: '/data' },
  { id: 'reports',      path: '/reports' },
  { id: 'report',       path: '/reports/:id' },
  { id: 'sources',      path: '/sources' },
];

const NAV = [
  { group: 'Analysis' },
  { id: 'overview',     path: '/',             label: 'Overview',        icon: 'overview' },
  { id: 'markets',      path: '/markets',      label: 'Markets',         icon: 'markets' },
  { id: 'underwriting', path: '/underwriting', label: 'Underwriting',    icon: 'underwriting' },
  { id: 'chat',         path: '/chat',         label: 'Ask Claude',      icon: 'chat' },
  { group: 'Data' },
  { id: 'data',         path: '/data',         label: 'Add reports',     icon: 'upload' },
  { id: 'reports',      path: '/reports',      label: 'Report library',  icon: 'library' },
  { id: 'sources',      path: '/sources',      label: 'Broker sources',  icon: 'sources' },
];

const META = {
  overview:     { title: 'Overview',            sub: 'Where the industrial market stands, from the broker reports on file' },
  markets:      { title: 'Markets',             sub: 'Every figure links to the report, page and sentence it came from' },
  underwriting: { title: 'Underwriting inputs', sub: 'Broker-published figures for a market, ready for your model' },
  chat:         { title: 'Ask Claude',          sub: 'Questions answered from the report data, with sources' },
  data:         { title: 'Add reports',         sub: 'Drop in broker PDFs and see which markets still need one' },
  reports:      { title: 'Report library',      sub: 'Every report on file, by quarter' },
  report:       { title: 'Report',              sub: 'The original document and the figures read from it' },
  sources:      { title: 'Broker sources',      sub: 'The pages the site checks for new reports, and what happened' },
};

function PasscodeModal({ onSubmit, onCancel }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    const ok = await onSubmit(value);
    setBusy(false);
    if (!ok) setError('That passcode was not accepted.');
  };
  return (
    <Modal title="Enter the admin passcode" onClose={onCancel}>
      <p className="muted">Adding or changing report data is protected. The passcode is remembered on this device.</p>
      <form onSubmit={submit} style={{ marginTop: 16 }}>
        <input className="input" style={{ width: '100%' }} type="password" autoFocus value={value}
               onChange={e => { setValue(e.target.value); setError(''); }} aria-label="Admin passcode" />
        {error && <div className="bad" style={{ fontSize: 13, marginTop: 8 }}>{error}</div>}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" disabled={busy || !value}>Continue</button>
        </div>
      </form>
    </Modal>
  );
}

export default function App() {
  const [route, navigate] = useRoute(ROUTES);
  const [stats, setStats] = useState(null);
  const [offline, setOffline] = useState(false);
  const [toast, toastView] = useToasts();
  const [marketName, setMarketName] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [passcode, setPasscode] = useState(null);       // { resolve } while the modal is open

  const reloadStats = useCallback(() => {
    getJSON('/api/stats').then(s => { setStats(s); setOffline(false); }).catch(() => setOffline(true));
  }, []);

  // Refresh the headline numbers regularly — faster while reports are being read.
  const busy = stats && stats.processing_count > 0;
  useEffect(() => {
    reloadStats();
    const id = setInterval(reloadStats, busy ? 4000 : 30000);
    return () => clearInterval(id);
  }, [reloadStats, busy]);

  // When the backend asks for the admin passcode, show the modal and retry the request.
  const passcodeRef = useRef(null);
  useEffect(() => {
    onUnauthorized(() => {
      if (passcodeRef.current) return passcodeRef.current;
      passcodeRef.current = new Promise(resolve => setPasscode({ resolve }));
      return passcodeRef.current;
    });
    return () => onUnauthorized(null);
  }, []);
  const closePasscode = result => {
    if (passcode) passcode.resolve(result);
    passcodeRef.current = null;
    setPasscode(null);
  };
  const submitPasscode = async value => {
    setAdminToken(value);
    try {
      await postJSON('/api/auth/check', undefined, { retry: false });
      closePasscode(true);
      return true;
    } catch {
      setAdminToken('');
      return false;
    }
  };

  const openMarket = useCallback(name => {
    setMarketName(name);
    setMarketData(null);
    Promise.all([getJSON('/api/markets'), getJSON('/api/thesis/current').catch(() => null)])
      .then(([snapshot, thesis]) => setMarketData({ snapshot, thesis }))
      .catch(err => { toast(err.message, 'error'); setMarketName(null); });
  }, [toast]);

  useEffect(() => { setMarketName(null); }, [route.id, route.params.id]);

  const page = route.id;
  useEffect(() => { document.title = `${META[page].title} · Glenstar Intelligence`; }, [page]);

  const ctx = useMemo(() => ({ navigate, stats, reloadStats, toast, openMarket }),
    [navigate, stats, reloadStats, toast, openMarket]);

  const attention = stats ? stats.review_document_count : 0;
  const drawerMarket = marketData && marketData.snapshot.markets.find(m => m.market === marketName);
  const drawerRanking = drawerMarket && marketData.thesis && marketData.thesis.thesis
    ? marketData.thesis.thesis.rankings.find(r => r.market === marketName) : null;

  return (
    <AppContext.Provider value={ctx}>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-name">GLENSTAR</div>
            <div className="brand-sub">Intelligence</div>
          </div>
          <nav className="nav" aria-label="Main">
            {NAV.map((item, i) => item.group ? (
              <div className="nav-group eyebrow" key={`g${i}`}>{item.group}</div>
            ) : (
              <a key={item.id} href={item.path} onClick={linkHandler(navigate, item.path)}
                 className={`nav-item ${page === item.id || (item.id === 'reports' && page === 'report') ? 'on' : ''}`}
                 aria-current={page === item.id ? 'page' : undefined}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.id === 'data' && attention > 0 && <span className="nav-badge" title="Reports waiting for your review">{attention}</span>}
                {item.id === 'data' && attention === 0 && stats && stats.coverage.missing > 0 && (
                  <span className="nav-badge quiet" title={`Markets without a ${stats.expected_quarter} report`}>{stats.coverage.missing}</span>
                )}
              </a>
            ))}
          </nav>
          <div className="side-foot">
            <div className="side-card">
              <div className="eyebrow">Latest published quarter</div>
              <div className="big">{stats ? stats.expected_quarter : '—'}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                {offline ? <span className="bad">Backend unreachable</span>
                  : stats ? `${stats.coverage.current} of ${stats.coverage.total} markets up to date` : 'Connecting…'}
              </div>
            </div>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div>
              <h1 className="page-title">{META[page].title}</h1>
              <p className="page-sub">{META[page].sub}</p>
            </div>
            {stats && stats.processing_count > 0 && (
              <span className="chip accent"><span className="dot pulse" />Reading {stats.processing_count} report{stats.processing_count > 1 ? 's' : ''}…</span>
            )}
          </header>
          <main className="content">
            <div className="content-inner">
              {offline && !stats && (
                <div style={{ marginBottom: 16 }}>
                  <Banner tone="bad" title="Cannot reach the backend">
                    The data service is not responding. If it has been idle it may take a minute to wake up — this page
                    will reconnect on its own.
                  </Banner>
                </div>
              )}
              {page === 'overview'     && <OverviewPage />}
              {page === 'markets'      && <MarketsPage />}
              {page === 'underwriting' && <UnderwritingPage />}
              {page === 'chat'         && <ChatPage />}
              {page === 'data'         && <DataPage />}
              {page === 'reports'      && <ReportsPage />}
              {page === 'report'       && <ReportPage id={route.params.id} search={route.search} />}
              {page === 'sources'      && <SourcesPage />}
            </div>
          </main>
        </div>

        {marketName && (
          <Drawer title={marketName} subtitle={drawerMarket ? drawerMarket.region : undefined} onClose={() => setMarketName(null)}>
            {!marketData ? <Loading rows={5} />
              : drawerMarket ? <MarketDetail market={drawerMarket} metricDefs={marketData.snapshot.metrics} ranking={drawerRanking} />
                : <div className="muted">No published data for this market.</div>}
          </Drawer>
        )}
        {passcode && <PasscodeModal onSubmit={submitPasscode} onCancel={() => closePasscode(false)} />}
        {toastView}
      </div>
    </AppContext.Provider>
  );
}
