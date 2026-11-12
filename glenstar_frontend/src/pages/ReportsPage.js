import React, { useMemo, useState } from 'react';
import { getJSON } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { fmtDate, plural } from '../lib/format';
import { DocStatusChip, Empty, ErrorState, Icon, Link, Loading, ORIGIN_LABEL, useApp } from '../components/ui';

const qIndex = q => (q ? parseInt(q.slice(3), 10) * 4 + parseInt(q[1], 10) : -1);

export default function ReportsPage() {
  const { navigate, stats } = useApp();
  const { data, error, loading, reload } = useLoad(() => getJSON('/api/documents'), [], { interval: 20000 });
  const [quarter, setQuarter] = useState('all');
  const [search, setSearch] = useState('');

  const docs = useMemo(() => data || [], [data]);
  const used = docs.filter(d => d.quarter && ['ready', 'needs_review'].includes(d.status));
  const quarters = useMemo(
    () => Array.from(new Set(used.map(d => d.quarter))).sort((a, b) => qIndex(b) - qIndex(a)), [used]);

  if (loading && !data) return <Loading rows={8} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!docs.length) {
    return (
      <div className="card">
        <Empty icon="library" title="The library is empty"
               action={<Link to="/data" className="btn primary"><Icon name="upload" />Add reports</Link>}>
          Every report you add — and every one the scanner finds — is kept here, filed by quarter, with the original
          PDF and the figures read from it.
        </Empty>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const match = d => !q || [d.title, d.filename, d.source, ...(d.markets || [])].filter(Boolean).some(s => s.toLowerCase().includes(q));
  const shown = docs.filter(match).filter(d => {
    if (quarter === 'all') return true;
    if (quarter === 'unused') return !['ready', 'needs_review'].includes(d.status);
    return d.quarter === quarter && ['ready', 'needs_review'].includes(d.status);
  });
  const unused = docs.filter(d => !['ready', 'needs_review'].includes(d.status)).length;
  const groups = quarter === 'all'
    ? [...quarters.map(k => [k, shown.filter(d => d.quarter === k && ['ready', 'needs_review'].includes(d.status))]),
       ['Not used', shown.filter(d => !['ready', 'needs_review'].includes(d.status))]]
    : [[quarter === 'unused' ? 'Not used' : quarter, shown]];

  return (
    <div className="stack">
      <div className="row wrap">
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={15} style={{ position: 'absolute', left: 11, top: 10.5, color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: 32, width: 240 }} placeholder="Search by market, broker or title"
                 value={search} onChange={e => setSearch(e.target.value)} aria-label="Search reports" />
        </div>
        <div className="seg">
          <button className={quarter === 'all' ? 'on' : ''} onClick={() => setQuarter('all')}>All<span className="count">{docs.length}</span></button>
          {quarters.map(k => (
            <button key={k} className={quarter === k ? 'on' : ''} onClick={() => setQuarter(k)}>
              {k}{stats && k === stats.expected_quarter ? ' · latest' : ''}<span className="count">{used.filter(d => d.quarter === k).length}</span>
            </button>
          ))}
          {unused > 0 && <button className={quarter === 'unused' ? 'on' : ''} onClick={() => setQuarter('unused')}>Not used<span className="count">{unused}</span></button>}
        </div>
        <span className="grow" />
        <Link to="/data" className="btn primary"><Icon name="upload" />Add reports</Link>
      </div>

      {groups.filter(([, list]) => list.length).map(([label, list]) => (
        <div className="card" key={label}>
          <div className="card-head">
            <div className="card-title">{label}</div>
            <div className="card-sub">{plural(list.length, 'report')}</div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr>
                <th className="l">Report</th><th className="l">Broker</th><th className="l">Markets</th>
                <th className="l">Added</th><th>Figures</th><th className="l">Status</th>
              </tr></thead>
              <tbody>
                {list.map(d => (
                  <tr key={d.id} className="click" onClick={() => navigate(`/reports/${d.id}`)}>
                    <td className="l wrap" style={{ maxWidth: 380 }}>
                      <div className="strong">{d.title || d.filename}</div>
                      {(d.status === 'failed' || d.status === 'rejected') && d.error
                        ? <div className="bad" style={{ fontSize: 12.5 }}>{d.error}</div>
                        : <div className="dim" style={{ fontSize: 12 }}>{d.filename}</div>}
                    </td>
                    <td className="l">{d.source || <span className="na">—</span>}</td>
                    <td className="l muted">
                      {!d.markets || !d.markets.length ? <span className="na">—</span>
                        : d.markets.length <= 2 ? d.markets.join(', ') : `${d.markets.length} markets`}
                    </td>
                    <td className="l muted">{fmtDate(d.created_at)}<div className="dim" style={{ fontSize: 12 }}>{ORIGIN_LABEL[d.origin] || d.origin}</div></td>
                    <td className="num">
                      {d.value_counts.published}
                      {d.value_counts.needs_review > 0 && <span className="warn"> +{d.value_counts.needs_review} to check</span>}
                    </td>
                    <td className="l"><DocStatusChip status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {shown.length === 0 && <div className="card card-body muted">No reports match.</div>}
    </div>
  );
}
