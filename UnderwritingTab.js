import React, { useState, useEffect, useCallback } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────────
const f = {
  pct:  v => v != null ? `${Number(v).toFixed(1)}%`         : 'N/A',
  rent: v => v != null ? `$${Number(v).toFixed(2)}/SF`      : 'N/A',
  cost: v => v != null ? `$${Math.round(Number(v))}/SF`     : 'N/A',
  msf:  v => v != null ? `${Number(v).toFixed(1)} MSF`      : 'N/A',
  num:  v => v != null ? Number(v).toLocaleString()         : '—',
};

const SIZE_SEGMENTS = [
  { key: '0_50k',     label: '0 – 50K SF',      desc: 'Small-bay & flex' },
  { key: '50_100k',   label: '50K – 100K SF',   desc: 'Mid-bay rear-load' },
  { key: '100_250k',  label: '100K – 250K SF',  desc: 'Regional distribution' },
  { key: '250_500k',  label: '250K – 500K SF',  desc: 'Cross-dock regional' },
  { key: '500_750k',  label: '500K – 750K SF',  desc: 'Large-format DC' },
  { key: '750k_plus', label: '750K SF+',        desc: 'Mega-DC / BTS only' },
];

const BLDG_TYPES = [
  { key: 'rear_load',  label: 'Rear-Load' },
  { key: 'cross_dock', label: 'Cross-Dock' },
];

const DEFAULT_BUILDING = {
  name: '',
  sqft: '',
  building_type: 'rear_load',
  size_segment: '100_250k',
  rent_psf: '',
  construction_cost_psf: '',
  exit_cap: '',
  free_rent_months: '',
  ti_new: '',
  lc_pct: '',
  rent_growth: '',
};

function statusColor(status) {
  if (status === 'above_market') return 'var(--warn)';
  if (status === 'below_market') return 'var(--good)';
  return 'var(--info)';
}

function statusLabel(status) {
  if (status === 'above_market') return '↑ Above market';
  if (status === 'below_market') return '↓ Below market';
  return '✓ At market';
}

function DeltaBadge({ delta, status }) {
  const c = statusColor(status);
  return (
    <span style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600,
      color: c, background: `${c}18`, border: `1px solid ${c}30`,
      borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap'
    }}>
      {delta > 0 ? '+' : ''}{delta}% — {statusLabel(status)}
    </span>
  );
}

function InputField({ label, value, onChange, prefix, suffix, placeholder, hint, type = 'number' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surf3)', border: '1px solid var(--border2)', borderRadius: 5, overflow: 'hidden' }}>
        {prefix && <span style={{ padding: '0 8px', fontSize: 11, color: 'var(--orange)', fontFamily: "'JetBrains Mono',monospace", borderRight: '1px solid var(--border)', background: 'rgba(245,166,35,0.06)' }}>{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || ''}
          step="0.01"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            padding: '8px 10px', color: 'var(--orange)', fontSize: 12,
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
          }}
        />
        {suffix && <span style={{ padding: '0 8px', fontSize: 11, color: 'var(--muted)', borderLeft: '1px solid var(--border)' }}>{suffix}</span>}
      </div>
      {hint && <div style={{ fontSize: 9, color: 'var(--dim)', fontStyle: 'italic', lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--surf3)', border: '1px solid var(--border2)', borderRadius: 5,
          padding: '8px 10px', color: 'var(--text)', fontSize: 12,
          fontFamily: "'Inter',sans-serif", outline: 'none', cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Market assumptions display panel ──────────────────────────────────────────
function MarketPanel({ data, selectedSegment }) {
  if (!data) return null;
  const seg = data.rents_by_size?.[selectedSegment] || {};
  const mf = data.market_fundamentals || {};

  return (
    <div style={{ background: 'var(--surf2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {data.market} — Q1 2026 Market Data
          </div>
          <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>
            Sources: {(data.sources || []).join(' · ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(data.report_urls || {}).slice(0, 3).map(([src, url]) => (
            <a key={src} href={url} target="_blank" rel="noreferrer"
               style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, padding: '3px 8px', borderRadius: 3,
                        background: 'rgba(245,166,35,0.08)', color: 'var(--orange)', border: '1px solid rgba(245,166,35,0.2)',
                        textDecoration: 'none' }}>
              {src} ↗
            </a>
          ))}
        </div>
      </div>

      {/* Market fundamentals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { l: 'Market vacancy', v: f.pct(mf.vacancy_rate), c: mf.vacancy_rate < 7 ? 'var(--good)' : mf.vacancy_rate < 10 ? 'var(--warn)' : 'var(--danger)' },
          { l: 'YTD absorption', v: f.msf(mf.ytd_absorption_msf), c: 'var(--good)' },
          { l: 'Rent growth', v: f.pct(mf.rent_growth_pct), c: 'var(--orange)' },
          { l: 'Market cap rate', v: f.pct(mf.cap_rate), c: 'var(--text)' },
          { l: 'Pipeline', v: f.msf(mf.pipeline_msf), c: 'var(--muted)' },
          { l: 'Avg lease term', v: mf.avg_lease_term_months ? `${mf.avg_lease_term_months} mos` : 'N/A', c: 'var(--muted)' },
        ].map(x => (
          <div key={x.l} style={{ background: 'var(--surf)', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 4 }}>{x.l}</div>
            <div style={{ fontSize: 16, fontFamily: "'Playfair Display',serif", color: x.c, fontWeight: 600 }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Size-segment specific data */}
      {seg.rent && (
        <div style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 7, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: 'var(--orange)', marginBottom: 10, fontWeight: 600 }}>
            {SIZE_SEGMENTS.find(s => s.key === selectedSegment)?.label} — Broker-confirmed data
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {[
              { l: 'Asking rent', v: f.rent(seg.rent), c: 'var(--orange)' },
              { l: 'Rent growth', v: f.pct(seg.rent_growth), c: 'var(--orange)' },
              { l: 'Segment vacancy', v: f.pct(seg.vacancy), c: seg.vacancy < 7 ? 'var(--good)' : seg.vacancy < 10 ? 'var(--warn)' : 'var(--danger)' },
              { l: 'Free rent', v: seg.free_rent_months ? `${seg.free_rent_months} mos` : 'N/A', c: 'var(--muted)' },
              { l: 'TI (new)', v: seg.ti_new ? `$${seg.ti_new}/SF` : 'N/A', c: 'var(--muted)' },
              { l: 'LC (net)', v: seg.lc_pct ? `${seg.lc_pct}%` : 'N/A', c: 'var(--muted)' },
            ].map(x => (
              <div key={x.l} style={{ background: 'var(--surf)', borderRadius: 5, padding: '9px 10px' }}>
                <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 3 }}>{x.l}</div>
                <div style={{ fontSize: 14, fontFamily: "'JetBrains Mono',monospace", color: x.c, fontWeight: 600 }}>{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Underwriting notes */}
      {data.underwriting_notes && (
        <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surf)', borderRadius: 6, fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, borderLeft: '3px solid var(--orange)' }}>
          <strong style={{ color: 'var(--text)', fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>UNDERWRITING GUIDANCE — </strong>
          {data.underwriting_notes}
        </div>
      )}
    </div>
  );
}

// ── Construction cost lookup panel ────────────────────────────────────────────
function CostPanel({ data, buildingType, sizeSegment }) {
  if (!data?.construction_costs) return null;
  const costs = data.construction_costs?.[buildingType] || {};
  const segCost = costs[sizeSegment];

  return (
    <div style={{ background: 'var(--surf2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
        Construction cost benchmarks — {data.market}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.entries(data.construction_costs).map(([btype, sizes]) => (
          <div key={btype}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {btype.replace('_', '-')}
            </div>
            {Object.entries(sizes).map(([sz, d]) => {
              const isSelected = btype === buildingType && sz === sizeSegment;
              return (
                <div key={sz} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 10px', borderRadius: 5, marginBottom: 3,
                  background: isSelected ? 'rgba(245,166,35,0.08)' : 'var(--surf)',
                  border: isSelected ? '1px solid rgba(245,166,35,0.3)' : '1px solid transparent',
                }}>
                  <div>
                    <span style={{ fontSize: 10, color: isSelected ? 'var(--orange)' : 'var(--muted)', fontWeight: isSelected ? 600 : 400 }}>
                      {SIZE_SEGMENTS.find(s => s.key === sz)?.label || sz}
                    </span>
                    <div style={{ fontSize: 9, color: 'var(--dim)', marginTop: 1 }}>{d.note}</div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--orange)' : 'var(--text)', flexShrink: 0, marginLeft: 12 }}>
                    ${d.cost_psf}/SF
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Validation results panel ───────────────────────────────────────────────────
function ValidationPanel({ results, loading }) {
  if (loading) return (
    <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)' }}>
      <div className="thn" style={{ justifyContent: 'center', marginBottom: 8 }}><span /><span /><span /></div>
      Validating against broker reports...
    </div>
  );

  if (!results) return null;

  return (
    <div>
      {/* AI narrative */}
      {results.ai_narrative && (
        <div style={{ background: 'var(--surf2)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 8, padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: 'var(--orange)', marginBottom: 10, fontWeight: 600 }}>
            ◆ AI UNDERWRITING VALIDATION — {results.market}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {results.ai_narrative}
          </div>
          <div style={{ marginTop: 10, fontSize: 9, color: 'var(--dim)', fontFamily: "'JetBrains Mono',monospace" }}>
            Sources: {(results.sources || []).join(' · ')}
          </div>
        </div>
      )}

      {/* Per-building validation */}
      {(results.validations || []).map((v, i) => (
        <div key={i} style={{ background: 'var(--surf2)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
            {v.building}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
            {/* Rent comparison */}
            <div style={{ background: 'var(--surf)', borderRadius: 7, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 8 }}>Asking rent comparison</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--dim)' }}>Your assumption</div>
                  <div style={{ fontSize: 22, fontFamily: "'Playfair Display',serif", color: 'var(--orange)' }}>{f.rent(v.user_rent)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'var(--dim)' }}>Broker data</div>
                  <div style={{ fontSize: 22, fontFamily: "'Playfair Display',serif", color: 'var(--text)' }}>{f.rent(v.market_rent)}</div>
                </div>
              </div>
              <DeltaBadge delta={v.rent_delta_pct} status={v.rent_status} />
            </div>

            {/* Cost comparison */}
            <div style={{ background: 'var(--surf)', borderRadius: 7, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 8 }}>Construction cost comparison</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--dim)' }}>Your assumption</div>
                  <div style={{ fontSize: 22, fontFamily: "'Playfair Display',serif", color: 'var(--orange)' }}>{f.cost(v.user_cost)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'var(--dim)' }}>Broker data</div>
                  <div style={{ fontSize: 22, fontFamily: "'Playfair Display',serif", color: 'var(--text)' }}>{f.cost(v.market_cost)}</div>
                </div>
              </div>
              <DeltaBadge delta={v.cost_delta_pct} status={v.cost_status} />
            </div>
          </div>

          {/* Market standard assumptions for this building */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { l: 'Market vacancy', v: f.pct(v.market_vacancy) },
              { l: 'Market rent growth', v: f.pct(v.market_rent_growth) },
              { l: 'Free rent (market)', v: v.market_free_rent ? `${v.market_free_rent} mos` : 'N/A' },
              { l: 'TI — new lease', v: v.market_ti ? `$${v.market_ti}/SF` : 'N/A' },
            ].map(x => (
              <div key={x.l} style={{ background: 'var(--surf)', borderRadius: 5, padding: '8px 10px' }}>
                <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 3 }}>{x.l}</div>
                <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)', fontWeight: 600 }}>{x.v}</div>
              </div>
            ))}
          </div>

          {v.source_note && (
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--dim)', fontStyle: 'italic' }}>
              📋 {v.source_note}
            </div>
          )}
        </div>
      ))}

      {/* Market notes */}
      {results.market_notes && !results.ai_narrative && (
        <div style={{ background: 'var(--surf)', borderLeft: '3px solid var(--orange)', borderRadius: '0 7px 7px 0', padding: '12px 14px', fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text)' }}>Market guidance: </strong>
          {results.market_notes}
        </div>
      )}
    </div>
  );
}

// ── Main Underwriting Tab ──────────────────────────────────────────────────────
export default function UnderwritingTab({ api }) {
  const [markets, setMarkets]         = useState([]);
  const [selectedMarket, setSelected] = useState('');
  const [marketData, setMarketData]   = useState(null);
  const [buildings, setBuildings]     = useState([{ ...DEFAULT_BUILDING, name: 'Building 1' }]);
  const [projectName, setProjectName] = useState('');
  const [results, setResults]         = useState(null);
  const [validating, setValidating]   = useState(false);
  const [loadingMarket, setLoadingMkt]= useState(false);
  const [activeBuilding, setActiveBldg] = useState(0);
  const [view, setView]               = useState('inputs'); // 'inputs' | 'costs' | 'results'

  // Load market list
  useEffect(() => {
    fetch(`${api}/api/underwriting/markets`)
      .then(r => r.json())
      .then(d => { setMarkets(Array.isArray(d) ? d : []); })
      .catch(() => {});
  }, [api]);

  // Load market data when market changes
  useEffect(() => {
    if (!selectedMarket) return;
    setLoadingMkt(true);
    fetch(`${api}/api/underwriting/assumptions/${encodeURIComponent(selectedMarket)}`)
      .then(r => r.json())
      .then(d => { setMarketData(d); setLoadingMkt(false); })
      .catch(() => setLoadingMkt(false));
  }, [api, selectedMarket]);

  // Auto-fill broker data into current building when market or segment changes
  const autofill = useCallback((bldgIndex, mktData) => {
    if (!mktData) return;
    const bldg = buildings[bldgIndex];
    const seg = bldg.size_segment;
    const btype = bldg.building_type;
    const rentSeg = mktData.rents_by_size?.[seg] || {};
    const costSeg = mktData.construction_costs?.[btype]?.[seg] || {};

    setBuildings(prev => prev.map((b, i) => i === bldgIndex ? {
      ...b,
      rent_psf:               b.rent_psf               || String(rentSeg.rent              || ''),
      construction_cost_psf:  b.construction_cost_psf  || String(costSeg.cost_psf          || ''),
      exit_cap:               b.exit_cap                || String(mktData.market_fundamentals?.cap_rate || ''),
      free_rent_months:       b.free_rent_months        || String(rentSeg.free_rent_months  || ''),
      ti_new:                 b.ti_new                  || String(rentSeg.ti_new            || ''),
      lc_pct:                 b.lc_pct                  || String(rentSeg.lc_pct            || ''),
      rent_growth:            b.rent_growth             || String(rentSeg.rent_growth        || ''),
    } : b));
  }, [buildings]);

  const handleMarketChange = (mkt) => {
    setSelected(mkt);
    setResults(null);
    // Reset rent/cost fields so autofill kicks in
    setBuildings(prev => prev.map(b => ({
      ...b,
      rent_psf: '', construction_cost_psf: '', exit_cap: '',
      free_rent_months: '', ti_new: '', lc_pct: '', rent_growth: '',
    })));
  };

  const handleSegmentChange = (bldgIndex, seg) => {
    setBuildings(prev => prev.map((b, i) => i === bldgIndex ? {
      ...b, size_segment: seg,
      rent_psf: '', construction_cost_psf: '', free_rent_months: '', ti_new: '', lc_pct: '', rent_growth: '',
    } : b));
    if (marketData) setTimeout(() => autofill(bldgIndex, marketData), 50);
  };

  // Trigger autofill when market loads
  useEffect(() => {
    if (marketData) buildings.forEach((_, i) => autofill(i, marketData));
  }, [marketData]); // eslint-disable-line

  const updateBuilding = (index, field, value) => {
    setBuildings(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  const addBuilding = () => {
    const n = buildings.length + 1;
    setBuildings(prev => [...prev, { ...DEFAULT_BUILDING, name: `Building ${n}` }]);
    setActiveBldg(buildings.length);
  };

  const removeBuilding = (index) => {
    if (buildings.length <= 1) return;
    setBuildings(prev => prev.filter((_, i) => i !== index));
    setActiveBldg(Math.max(0, index - 1));
  };

  const validate = async () => {
    if (!selectedMarket || buildings.some(b => !b.sqft)) return;
    setValidating(true);
    setView('results');
    try {
      const res = await fetch(`${api}/api/underwriting/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: selectedMarket,
          project: projectName,
          buildings: buildings.map(b => ({
            name: b.name || 'Unnamed',
            sqft: Number(b.sqft),
            building_type: b.building_type,
            size_segment: b.size_segment,
            rent_psf: Number(b.rent_psf),
            construction_cost_psf: Number(b.construction_cost_psf),
            exit_cap: Number(b.exit_cap),
            free_rent_months: Number(b.free_rent_months),
            ti_new: Number(b.ti_new),
            lc_pct: Number(b.lc_pct),
            rent_growth: Number(b.rent_growth),
          }))
        })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setResults({ error: 'Validation failed — check backend connection.' });
    }
    setValidating(false);
  };

  const currentBldg = buildings[activeBuilding] || buildings[0];
  const currentSeg = marketData?.rents_by_size?.[currentBldg?.size_segment] || {};

  // Total project SF
  const totalSF = buildings.reduce((s, b) => s + (Number(b.sqft) || 0), 0);

  return (
    <>
      {/* Header metrics row */}
      <div className="mrow" style={{ marginBottom: 14 }}>
        <div className="mc">
          <div className="mcl">Project</div>
          <div className="mcv" style={{ fontSize: 15, marginTop: 4 }}>{projectName || '—'}</div>
          <div className="mcc nu">{buildings.length} building{buildings.length > 1 ? 's' : ''}</div>
        </div>
        <div className="mc">
          <div className="mcl">Market selected</div>
          <div className="mcv" style={{ fontSize: 15, marginTop: 4 }}>{selectedMarket || '—'}</div>
          <div className="mcc nu">{marketData ? `Cap rate: ${marketData.market_fundamentals?.cap_rate}%` : 'Select market below'}</div>
        </div>
        <div className="mc">
          <div className="mcl">Total project SF</div>
          <div className="mcv">{totalSF > 0 ? f.num(totalSF) : '—'}</div>
          <div className="mcc nu">All buildings combined</div>
        </div>
        <div className="mc">
          <div className="mcl">Market rent growth</div>
          <div className="mcv">{marketData ? f.pct(marketData.market_fundamentals?.rent_growth_pct) : '—'}</div>
          <div className="mcc up">{marketData ? `${marketData.region} · Q1 2026` : 'Load market data'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 12, alignItems: 'start' }}>

        {/* ── Left panel — inputs ─────────────────────────────────── */}
        <div>
          {/* Project setup */}
          <div className="panel" style={{ marginBottom: 12 }}>
            <div className="ph"><span className="pt">Project setup</span></div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InputField
                label="Project name"
                value={projectName}
                onChange={setProjectName}
                placeholder="e.g. Imeson Park"
                type="text"
              />
              <SelectField
                label="Target market"
                value={selectedMarket}
                onChange={handleMarketChange}
                options={[
                  { value: '', label: '— Select a market —' },
                  ...markets.map(m => ({ value: m.market, label: `${m.market} (${m.region})` }))
                ]}
              />
              {loadingMarket && (
                <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>
                  Loading market data...
                </div>
              )}
            </div>
          </div>

          {/* Building tabs */}
          <div className="panel" style={{ marginBottom: 12 }}>
            <div className="ph" style={{ padding: '10px 16px' }}>
              <span className="pt">Buildings</span>
              <button className="btn bg bsm" onClick={addBuilding} disabled={buildings.length >= 9}>
                + Add building
              </button>
            </div>

            {/* Building selector tabs */}
            <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {buildings.map((b, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBldg(i)}
                  style={{
                    padding: '5px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
                    fontFamily: "'Inter',sans-serif", fontWeight: 500, border: 'none',
                    background: activeBuilding === i ? 'var(--orange)' : 'var(--surf2)',
                    color: activeBuilding === i ? '#0D0F14' : 'var(--muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {b.name || `Bldg ${i + 1}`}
                </button>
              ))}
            </div>

            {/* Active building inputs */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InputField
                label="Building name"
                value={currentBldg.name}
                onChange={v => updateBuilding(activeBuilding, 'name', v)}
                placeholder={`Building ${activeBuilding + 1}`}
                type="text"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <InputField
                  label="Building size (SF)"
                  value={currentBldg.sqft}
                  onChange={v => updateBuilding(activeBuilding, 'sqft', v)}
                  placeholder="e.g. 179235"
                  suffix="SF"
                />
                <SelectField
                  label="Building type"
                  value={currentBldg.building_type}
                  onChange={v => {
                    updateBuilding(activeBuilding, 'building_type', v);
                    updateBuilding(activeBuilding, 'construction_cost_psf', '');
                  }}
                  options={BLDG_TYPES.map(t => ({ value: t.key, label: t.label }))}
                />
              </div>

              <SelectField
                label="Size segment (for market comp)"
                value={currentBldg.size_segment}
                onChange={v => handleSegmentChange(activeBuilding, v)}
                options={SIZE_SEGMENTS.map(s => ({ value: s.key, label: `${s.label} — ${s.desc}` }))}
              />

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: 'var(--orange)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Your underwriting inputs
                  {marketData && <span style={{ color: 'var(--dim)', marginLeft: 6 }}>— pre-filled from broker data</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <InputField
                    label="Asking rent"
                    value={currentBldg.rent_psf}
                    onChange={v => updateBuilding(activeBuilding, 'rent_psf', v)}
                    prefix="$" suffix="/SF/yr"
                    placeholder={currentSeg.rent ? String(currentSeg.rent) : '0.00'}
                    hint={currentSeg.rent ? `Market: $${currentSeg.rent}/SF` : ''}
                  />
                  <InputField
                    label="Construction cost"
                    value={currentBldg.construction_cost_psf}
                    onChange={v => updateBuilding(activeBuilding, 'construction_cost_psf', v)}
                    prefix="$" suffix="/SF"
                    placeholder={
                      marketData?.construction_costs?.[currentBldg.building_type]?.[currentBldg.size_segment]?.cost_psf
                        ? String(marketData.construction_costs[currentBldg.building_type][currentBldg.size_segment].cost_psf)
                        : '0'
                    }
                    hint={
                      marketData?.construction_costs?.[currentBldg.building_type]?.[currentBldg.size_segment]?.cost_psf
                        ? `Market: $${marketData.construction_costs[currentBldg.building_type][currentBldg.size_segment].cost_psf}/SF`
                        : ''
                    }
                  />
                  <InputField
                    label="Exit cap rate"
                    value={currentBldg.exit_cap}
                    onChange={v => updateBuilding(activeBuilding, 'exit_cap', v)}
                    suffix="%"
                    placeholder={marketData?.market_fundamentals?.cap_rate ? String(marketData.market_fundamentals.cap_rate) : '5.50'}
                    hint={`Market: ${marketData?.market_fundamentals?.cap_rate || '—'}%`}
                  />
                  <InputField
                    label="Rent growth"
                    value={currentBldg.rent_growth}
                    onChange={v => updateBuilding(activeBuilding, 'rent_growth', v)}
                    suffix="%/yr"
                    placeholder={currentSeg.rent_growth ? String(currentSeg.rent_growth) : '3.0'}
                    hint={`Market: ${currentSeg.rent_growth || '—'}%/yr`}
                  />
                  <InputField
                    label="Free rent"
                    value={currentBldg.free_rent_months}
                    onChange={v => updateBuilding(activeBuilding, 'free_rent_months', v)}
                    suffix="mos"
                    placeholder={currentSeg.free_rent_months ? String(currentSeg.free_rent_months) : '2'}
                    hint={`Market: ${currentSeg.free_rent_months || '—'} months`}
                  />
                  <InputField
                    label="TI — new lease"
                    value={currentBldg.ti_new}
                    onChange={v => updateBuilding(activeBuilding, 'ti_new', v)}
                    prefix="$" suffix="/SF"
                    placeholder={currentSeg.ti_new ? String(currentSeg.ti_new) : '10'}
                    hint={`Market: $${currentSeg.ti_new || '—'}/SF`}
                  />
                  <InputField
                    label="Leasing commission"
                    value={currentBldg.lc_pct}
                    onChange={v => updateBuilding(activeBuilding, 'lc_pct', v)}
                    suffix="% net"
                    placeholder={currentSeg.lc_pct ? String(currentSeg.lc_pct) : '7.0'}
                    hint={`Market: ${currentSeg.lc_pct || '—'}% net`}
                  />
                </div>
              </div>

              {buildings.length > 1 && (
                <button
                  onClick={() => removeBuilding(activeBuilding)}
                  style={{ fontSize: 10, color: 'var(--danger)', background: 'rgba(252,165,165,0.06)', border: '1px solid rgba(252,165,165,0.2)', borderRadius: 5, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", marginTop: 4 }}
                >
                  Remove this building
                </button>
              )}
            </div>

            {/* Multi-building summary */}
            {buildings.length > 1 && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px' }}>
                <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: 'var(--dim)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Project summary — all buildings
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr>
                      {['Building', 'SF', 'Type', 'Rent', 'Cost/SF'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Building' ? 'left' : 'right', padding: '4px 6px', fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'var(--dim)', fontWeight: 400, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((b, i) => (
                      <tr key={i} onClick={() => setActiveBldg(i)} style={{ cursor: 'pointer' }}>
                        <td style={{ padding: '5px 6px', color: activeBuilding === i ? 'var(--orange)' : 'var(--text)', fontWeight: 600 }}>{b.name || `Bldg ${i+1}`}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace', color: 'var(--muted)'" }}>{b.sqft ? Number(b.sqft).toLocaleString() : '—'}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', color: 'var(--muted)' }}>{b.building_type === 'rear_load' ? 'RL' : 'XD'}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", color: 'var(--orange)' }}>{b.rent_psf ? `$${b.rent_psf}` : '—'}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", color: 'var(--muted)' }}>{b.construction_cost_psf ? `$${b.construction_cost_psf}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Validate button */}
          <button
            className="btn bp"
            onClick={validate}
            disabled={!selectedMarket || validating || buildings.some(b => !b.sqft)}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 13, fontWeight: 700 }}
          >
            {validating ? 'Validating...' : '◆ Validate against broker data'}
          </button>
          {(!selectedMarket || buildings.some(b => !b.sqft)) && (
            <div style={{ fontSize: 10, color: 'var(--dim)', textAlign: 'center', marginTop: 6 }}>
              {!selectedMarket ? 'Select a market to continue' : 'Enter building size (SF) to validate'}
            </div>
          )}
        </div>

        {/* ── Right panel — market data & results ──────────────────── */}
        <div>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              { k: 'inputs', l: 'Market data' },
              { k: 'costs',  l: 'Cost benchmarks' },
              { k: 'results',l: 'Validation results' },
            ].map(t => (
              <button key={t.k} className={`btn ${view === t.k ? 'bp' : 'bg'}`} onClick={() => setView(t.k)}>
                {t.l}
                {t.k === 'results' && results && <span style={{ marginLeft: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 9 }}>✓</span>}
              </button>
            ))}
          </div>

          {view === 'inputs' && (
            marketData
              ? <MarketPanel data={marketData} selectedSegment={currentBldg?.size_segment || '100_250k'} />
              : <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--dim)' }}>
                  Select a market on the left to load Q1 2026 broker data
                </div>
          )}

          {view === 'costs' && (
            marketData
              ? <CostPanel data={marketData} buildingType={currentBldg?.building_type || 'rear_load'} sizeSegment={currentBldg?.size_segment || '100_250k'} />
              : <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--dim)' }}>
                  Select a market to view construction cost benchmarks
                </div>
          )}

          {view === 'results' && (
            <div>
              {!results && !validating && (
                <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--dim)' }}>
                  Fill in your underwriting inputs and click "Validate against broker data"
                </div>
              )}
              <ValidationPanel results={results} loading={validating} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
