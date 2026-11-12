import React, { useMemo, useState } from 'react';
import { getJSON } from '../lib/api';
import { useLoad } from '../lib/hooks';
import MarketDetail from '../components/MarketDetail';
import { Banner, Empty, ErrorState, Icon, Link, Loading, QuarterChip } from '../components/ui';

// Broker-published inputs for a pro forma: pick a market and get every figure
// the reports give for it, each with its source. Nothing here is estimated.
export default function UnderwritingPage() {
  const { data, error, loading, reload } = useLoad(() => getJSON('/api/markets'), []);
  const thesis = useLoad(() => getJSON('/api/thesis/current'), []);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const markets = useMemo(() => (data ? data.markets : []), [data]);
  const shown = markets.filter(m => m.market.toLowerCase().includes(search.trim().toLowerCase()));
  const market = markets.find(m => m.market === selected) || null;
  const ranking = market && thesis.data && thesis.data.thesis
    ? thesis.data.thesis.rankings.find(r => r.market === market.market) : null;

  if (loading) return <Loading rows={8} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!markets.length) {
    return (
      <div className="card">
        <Empty icon="underwriting" title="No underwriting inputs yet"
               action={<Link to="/data" className="btn primary"><Icon name="upload" />Add reports</Link>}>
          Once broker reports are on file, pick a market here to get its published rent, vacancy, absorption and
          pipeline figures — by building size where the broker breaks it out — ready to paste into your model.
        </Empty>
      </div>
    );
  }

  return (
    <div className="stack">
      <Banner tone="info" title="Only broker-published figures appear here">
        Assumptions that brokers do not publish — free rent, tenant improvements, leasing commissions, operating
        expenses, taxes — are deliberately left out rather than estimated. Use your own deal comps for those.
      </Banner>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) minmax(0, 1fr)', gap: 16, alignItems: 'start' }} className="uw-grid">
        <div className="card" style={{ position: 'sticky', top: 0 }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--line)' }}>
            <input className="input" style={{ width: '100%' }} placeholder="Search markets" value={search}
                   onChange={e => setSearch(e.target.value)} aria-label="Search markets" />
          </div>
          <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            {shown.map(m => (
              <button key={m.market} onClick={() => setSelected(m.market)}
                      className="spread" aria-pressed={selected === m.market}
                      style={{ width: '100%', padding: '11px 14px', borderBottom: '1px solid var(--line)', textAlign: 'left',
                               background: selected === m.market ? 'var(--accent-soft)' : 'transparent',
                               boxShadow: selected === m.market ? 'inset 2px 0 0 var(--accent)' : 'none' }}>
                <span>
                  <span style={{ fontWeight: 600, color: selected === m.market ? 'var(--accent)' : 'var(--text)' }}>{m.market}</span>
                  <span className="dim" style={{ display: 'block', fontSize: 12 }}>{m.primary_source} · {Object.keys(m.metrics).length} figures</span>
                </span>
                <QuarterChip quarter={m.quarter} behind={m.quarters_behind} />
              </button>
            ))}
            {shown.length === 0 && <div className="card-body muted">No markets match.</div>}
          </div>
        </div>
        <div className="card card-body">
          {market
            ? (<><div className="page-title" style={{ fontSize: 21, marginBottom: 14 }}>{market.market}</div>
                <MarketDetail market={market} metricDefs={data.metrics} ranking={ranking} /></>)
            : <Empty icon="underwriting" title="Select a market">Choose a market on the left to see every figure brokers have published for it, with sources.</Empty>}
        </div>
      </div>
    </div>
  );
}
