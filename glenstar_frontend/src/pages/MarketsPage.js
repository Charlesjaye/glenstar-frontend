import React, { useMemo, useState } from 'react';
import { getJSON } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { downloadCSV, sortValue, toneClass, plural } from '../lib/format';
import Fig from '../components/Fig';
import { DirectionChip, Empty, ErrorState, Icon, Link, Loading, QuarterChip, useApp } from '../components/ui';

const SHORT = {
  vacancy_rate: 'Vacancy', asking_rent: 'Asking rent', net_absorption_qtr: 'Net absorption (qtr)',
  net_absorption_ytd: 'Net absorption (YTD)', under_construction: 'Under construction', rent_growth_yoy: 'Rent growth YoY',
  availability_rate: 'Availability',
};
const DIRECTION_ORDER = { improving: 3, mixed: 2, unknown: 1, weakening: 0 };
const SIZE_METRICS = ['vacancy_rate', 'asking_rent', 'availability_rate', 'net_absorption_qtr'];

export default function MarketsPage() {
  const { openMarket } = useApp();
  const { data, error, loading, reload } = useLoad(() => getJSON('/api/markets'), []);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [size, setSize] = useState('all');
  const [onlyCurrent, setOnlyCurrent] = useState(false);
  const [sort, setSort] = useState({ key: 'market', dir: 1 });

  const markets = useMemo(() => (data ? data.markets : []), [data]);
  const regions = useMemo(() => ['All', ...Array.from(new Set(markets.map(m => m.region).filter(Boolean))).sort()], [markets]);
  const bands = data ? data.size_bands : [];
  const hasSizes = markets.some(m => Object.keys(m.by_band || {}).length);

  // The figure a row shows for a metric: the market total, or the broker band matching the chosen size.
  const cell = useMemo(() => (m, k) => (size === 'all' ? m.metrics[k] : (m.by_band[size] || {})[k]), [size]);

  const columns = useMemo(() => {
    if (!data) return [];
    const keys = size === 'all' ? data.headline_metrics : SIZE_METRICS;
    return keys.filter(k => markets.some(m => cell(m, k)));
  }, [data, markets, size, cell]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = markets
      .filter(m => region === 'All' || m.region === region)
      .filter(m => !onlyCurrent || m.is_current)
      .filter(m => size === 'all' || m.by_band[size])
      .filter(m => !q || m.market.toLowerCase().includes(q));
    const value = m => (sort.key === 'market' ? m.market : sort.key === 'quarter' ? -m.quarters_behind
      : sort.key === 'trend' ? DIRECTION_ORDER[m.trend.direction] * 100 + m.trend.score : sortValue(cell(m, sort.key)));
    return list.sort((a, b) => {
      const x = value(a), y = value(b);
      if (x == null && y == null) return a.market.localeCompare(b.market);
      if (x == null) return 1;                    // markets without the figure always sort last
      if (y == null) return -1;
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sort.dir;
    });
  }, [markets, region, onlyCurrent, search, sort, size, cell]);

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
  const band = bands.find(b => b.key === size);
  const exportCSV = () => {
    const head = ['Market', 'Region', 'Quarter', 'Source', 'Direction of travel', ...(band ? ['Broker size band'] : []),
      ...columns.flatMap(k => [SHORT[k] || k, `${SHORT[k] || k} — unit`, `${SHORT[k] || k} — source`])];
    const body = rows.map(m => {
      const first = columns.map(k => cell(m, k)).find(Boolean);
      return [m.market, m.region, m.quarter, m.primary_source, m.trend.direction,
        ...(band ? [first ? first.broker_band : ''] : []),
        ...columns.flatMap(k => {
          const v = cell(m, k);
          if (!v) return ['', '', ''];
          const unit = v.unit === 'percent' ? '%' : v.unit === 'sf' ? 'SF' : `$/SF/${v.period || 'yr'}`;
          return [v.value, unit, `${v.doc.source} ${v.quarter} p.${v.page || '?'}`];
        })];
    });
    downloadCSV(`Glenstar markets${band ? ` ${band.label}` : ''}.csv`, [head, ...body]);
  };

  return (
    <div className="stack">
      <div className="row wrap">
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={15} style={{ position: 'absolute', left: 11, top: 10.5, color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: 32, width: 200 }} placeholder="Search markets" value={search}
                 onChange={e => setSearch(e.target.value)} aria-label="Search markets" />
        </div>
        <select className="select" value={region} onChange={e => setRegion(e.target.value)} aria-label="Region">
          {regions.map(r => <option key={r} value={r}>{r === 'All' ? 'All regions' : r}</option>)}
        </select>
        <label className="row muted" style={{ gap: 7, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={onlyCurrent} onChange={e => setOnlyCurrent(e.target.checked)} />
          Only {data.expected_quarter}
        </label>
        <span className="grow" />
        <span className="dim" style={{ fontSize: 12.5 }}>{plural(rows.length, 'market')}</span>
        <button className="btn sm" onClick={exportCSV}><Icon name="file" />Download CSV</button>
      </div>

      {hasSizes && (
        <div className="row wrap">
          <span className="eyebrow">Building size</span>
          <div className="seg" role="tablist" aria-label="Building size">
            <button role="tab" aria-selected={size === 'all'} className={size === 'all' ? 'on' : ''} onClick={() => setSize('all')}>All sizes</button>
            {bands.map(b => {
              const n = markets.filter(m => m.by_band[b.key]).length;
              return (
                <button key={b.key} role="tab" aria-selected={size === b.key} className={size === b.key ? 'on' : ''}
                        onClick={() => { setSize(b.key); if (!['market', 'quarter', 'trend', ...SIZE_METRICS].includes(sort.key)) setSort({ key: 'market', dir: 1 }); }}
                        disabled={!n} title={`${b.note} · ${n} market${n === 1 ? '' : 's'} with size data`} style={!n ? { opacity: 0.4 } : undefined}>
                  {b.short}
                </button>
              );
            })}
          </div>
          {band && <span className="dim" style={{ fontSize: 12.5 }}>Showing each broker's size band that covers {band.label} — bands differ by broker and are noted on each row.</span>}
        </div>
      )}

      <div className="card table-wrap">
        <table className="table">
          <thead><tr>
            {th('market', 'Market', true)}
            {th('quarter', 'Quarter', true)}
            <th className="l">Source</th>
            {th('trend', 'Direction', true)}
            {band && <th className="l">Broker's band</th>}
            {columns.map(k => th(k, SHORT[k] || k))}
            <th />
          </tr></thead>
          <tbody>
            {rows.map(m => {
              const first = band ? columns.map(k => cell(m, k)).find(Boolean) : null;
              return (
                <tr key={m.market} className="click" onClick={() => openMarket(m.market)}>
                  <td className="l">
                    <div className="strong">{m.market}</div>
                    <div className="dim" style={{ fontSize: 12 }}>{m.region || '—'}</div>
                  </td>
                  <td className="l"><QuarterChip quarter={m.quarter} behind={m.quarters_behind} /></td>
                  <td className="l muted">{m.primary_source}{m.sources.length > 1 ? <span className="dim"> +{m.sources.length - 1}</span> : null}</td>
                  <td className="l"><DirectionChip direction={m.trend.direction}
                    title={m.trend.signals.map(s => s.label).join(' · ') || 'No earlier-period figures on file yet'} /></td>
                  {band && (
                    <td className="l muted" style={{ fontSize: 12.5 }}>
                      {first ? <>{first.broker_range || first.broker_band}{first.fit === 'spans' && <span className="dim"> · wider</span>}{first.fit === 'within' && <span className="dim"> · narrower</span>}</> : '—'}
                    </td>
                  )}
                  {columns.map(k => (
                    <td key={k} className={toneClass(k, cell(m, k))}><Fig v={cell(m, k)} /></td>
                  ))}
                  <td><Icon name="chevron" size={16} style={{ color: 'var(--text-3)' }} /></td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 6} className="l muted" style={{ padding: 28, textAlign: 'center' }}>
                {band ? `No broker report on file breaks these markets down to ${band.label}.` : 'No markets match these filters.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="dim" style={{ fontSize: 12.5 }}>
        Click a number to see the report, page and sentence it came from. “—” means the broker did not publish that
        figure; nothing is estimated. “Direction” is calculated from each market's own figures over time.
      </div>
    </div>
  );
}
