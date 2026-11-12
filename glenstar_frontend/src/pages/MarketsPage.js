import React, { useMemo, useState } from 'react';
import { getJSON } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { sortValue, toneClass, plural } from '../lib/format';
import Fig from '../components/Fig';
import { Empty, ErrorState, Icon, Link, Loading, QuarterChip, useApp } from '../components/ui';

const SHORT = {
  vacancy_rate: 'Vacancy', asking_rent: 'Asking rent', net_absorption_qtr: 'Net absorption (qtr)',
  net_absorption_ytd: 'Net absorption (YTD)', under_construction: 'Under construction', rent_growth_yoy: 'Rent growth YoY',
  availability_rate: 'Availability',
};

export default function MarketsPage() {
  const { openMarket, stats } = useApp();
  const { data, error, loading, reload } = useLoad(() => getJSON('/api/markets'), []);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [onlyCurrent, setOnlyCurrent] = useState(false);
  const [sort, setSort] = useState({ key: 'market', dir: 1 });

  const markets = useMemo(() => (data ? data.markets : []), [data]);
  const regions = useMemo(() => ['All', ...Array.from(new Set(markets.map(m => m.region).filter(Boolean))).sort()], [markets]);

  // Show a column only if at least one market has that metric.
  const columns = useMemo(() => {
    if (!data) return [];
    return data.headline_metrics.filter(k => markets.some(m => m.metrics[k]));
  }, [data, markets]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = markets
      .filter(m => region === 'All' || m.region === region)
      .filter(m => !onlyCurrent || m.is_current)
      .filter(m => !q || m.market.toLowerCase().includes(q));
    const value = m => (sort.key === 'market' ? m.market : sort.key === 'quarter' ? -m.quarters_behind : sortValue(m.metrics[sort.key]));
    return list.sort((a, b) => {
      const x = value(a), y = value(b);
      if (x == null && y == null) return a.market.localeCompare(b.market);
      if (x == null) return 1;                    // markets without the figure always sort last
      if (y == null) return -1;
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sort.dir;
    });
  }, [markets, region, onlyCurrent, search, sort]);

  if (loading) return <Loading rows={8} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!markets.length) {
    return (
      <div className="card">
        <Empty icon="markets" title="No market data yet"
               action={<Link to="/data" className="btn primary"><Icon name="upload" />Add reports</Link>}>
          Markets appear here as soon as a broker report for them has been added and checked.
        </Empty>
      </div>
    );
  }

  const th = (key, label, left) => (
    <th key={key} className={`sortable ${left ? 'l' : ''}`} onClick={() => setSort(s => ({ key, dir: s.key === key ? -s.dir : (key === 'market' ? 1 : -1) }))}
        aria-sort={sort.key === key ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}>
      {label}{sort.key === key && <span className="arrow">{sort.dir > 0 ? '↑' : '↓'}</span>}
    </th>
  );
  const stale = markets.filter(m => !m.is_current).length;

  return (
    <div className="stack">
      <div className="row wrap">
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={15} style={{ position: 'absolute', left: 11, top: 10.5, color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: 32, width: 220 }} placeholder="Search markets" value={search}
                 onChange={e => setSearch(e.target.value)} aria-label="Search markets" />
        </div>
        <div className="seg">
          {regions.map(r => <button key={r} className={region === r ? 'on' : ''} onClick={() => setRegion(r)}>{r}</button>)}
        </div>
        <label className="row muted" style={{ gap: 7, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyCurrent} onChange={e => setOnlyCurrent(e.target.checked)} />
          Only {data.expected_quarter}
        </label>
        <span className="grow" />
        <span className="dim" style={{ fontSize: 12.5 }}>
          {plural(rows.length, 'market')}{stale > 0 && stats ? ` · ${stale} on an older quarter` : ''}
        </span>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead><tr>
            {th('market', 'Market', true)}
            {th('quarter', 'Quarter', true)}
            <th className="l">Source</th>
            {columns.map(k => th(k, SHORT[k] || k))}
            <th />
          </tr></thead>
          <tbody>
            {rows.map(m => (
              <tr key={m.market} className="click" onClick={() => openMarket(m.market)}>
                <td className="l">
                  <div className="strong">{m.market}</div>
                  <div className="dim" style={{ fontSize: 12 }}>{m.region || '—'}</div>
                </td>
                <td className="l"><QuarterChip quarter={m.quarter} behind={m.quarters_behind} /></td>
                <td className="l muted">{m.primary_source}{m.sources.length > 1 ? <span className="dim"> +{m.sources.length - 1}</span> : null}</td>
                {columns.map(k => (
                  <td key={k} className={toneClass(k, m.metrics[k])}><Fig v={m.metrics[k]} /></td>
                ))}
                <td><Icon name="chevron" size={16} style={{ color: 'var(--text-3)' }} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 4} className="l muted" style={{ padding: 28, textAlign: 'center' }}>No markets match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="dim" style={{ fontSize: 12.5 }}>
        Click a number to see the report, page and sentence it came from. “—” means the broker did not publish that
        figure; nothing is estimated. Brokers define markets differently, so compare across brokers with care.
      </div>
    </div>
  );
}
