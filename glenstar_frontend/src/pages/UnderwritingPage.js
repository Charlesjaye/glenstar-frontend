import React, { useEffect, useMemo, useState } from 'react';
import { getJSON, putJSON } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { downloadCSV, fmtMoney, fmtSheet } from '../lib/format';
import Fig from '../components/Fig';
import { Banner, Chip, Empty, ErrorState, Icon, Link, Loading, QuarterChip, useApp } from '../components/ui';

const ESTIMATES_KEY = 'glenstar-show-estimates';
const GROUPS = ['Revenue', 'Construction', 'Leasing', 'Exit', 'Operating'];

function readPref() {
  try { return window.localStorage.getItem(ESTIMATES_KEY) !== 'off'; } catch { return true; }
}

// Which layer supplies a cell's working value: your assumption, then the broker figure,
// then (only if switched on) the unverified starter estimate. Layers are never blended.
export function resolveCell(cell, showEstimates) {
  if (cell.assumption) return { source: 'assumption', value: cell.assumption.value };
  if (cell.broker) return { source: 'broker', value: cell.broker.sheet_value };
  if (showEstimates && cell.estimate != null) return { source: 'estimate', value: cell.estimate };
  return { source: null, value: null };
}

const SOURCE = {
  broker:     { label: 'Broker report',       tone: 'good', icon: 'shield' },
  assumption: { label: 'Your assumption',     tone: 'info', icon: 'edit' },
  estimate:   { label: 'Unverified estimate', tone: 'warn', icon: 'alert' },
};

function SheetRow({ field, cell, showEstimates, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [allBands, setAllBands] = useState(false);
  const r = resolveCell(cell, showEstimates);
  const src = SOURCE[r.source];
  const b = cell.broker;

  const start = () => { setDraft(r.value != null ? String(r.value) : ''); setAllBands(false); setEditing(true); };
  const save = async () => { await onSave(field.key, draft, allBands); setEditing(false); };

  return (
    <tr>
      <td className="l strong">{field.label}</td>
      <td style={{ width: 220 }}>
        {editing ? (
          <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
            <input className="input sm num" style={{ width: 110, textAlign: 'right' }} autoFocus value={draft}
                   aria-label={`${field.label} — your assumption`} onChange={e => setDraft(e.target.value)}
                   onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }} />
            <button className="btn xs primary" onClick={save}>Save</button>
          </div>
        ) : r.source === 'broker' ? (
          <span style={{ fontWeight: 600 }}>
            {field.key === 'rent' && b.annualized != null
              ? <span className="num" title={`Published as ${fmtMoney(b.value)}/SF/mo; shown ×12`}>{fmtSheet(r.value, field.unit)}</span>
              : <Fig v={b} exact />}
          </span>
        ) : (
          <span className={`num ${r.source === 'estimate' ? 'muted' : ''}`} style={{ fontWeight: r.source ? 600 : 400 }}>
            {r.source ? fmtSheet(r.value, field.unit) : <span className="na">—</span>}
          </span>
        )}
      </td>
      <td className="l wrap">
        {editing ? (
          <label className="row muted" style={{ gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={allBands} onChange={e => setAllBands(e.target.checked)} />
            Use for every building size · leave blank to clear
          </label>
        ) : (
          <div className="row wrap" style={{ gap: 8 }}>
            {src ? <Chip tone={src.tone} icon={src.icon}>{src.label}</Chip>
              : <span className="dim" style={{ fontSize: 12.5 }}>{field.metric ? 'Not in the reports on file' : 'Not published by brokers'}</span>}
            {r.source === 'broker' && (
              <span className="dim" style={{ fontSize: 12.5 }}>
                {b.doc.source} · {b.quarter}
                {b.scope === 'market' ? ' · market-wide figure' : b.fit === 'exact' ? ` · ${b.broker_band}`
                  : ` · broker band “${b.broker_band}” (${b.fit === 'spans' ? 'wider than this size' : 'part of this size'})`}
              </span>
            )}
            {r.source === 'assumption' && b && (
              <span className="dim" style={{ fontSize: 12.5 }}>Broker figure: {fmtSheet(b.sheet_value, field.unit)} ({b.doc.source})</span>
            )}
            {r.source === 'assumption' && cell.assumption.note && <span className="dim" style={{ fontSize: 12.5 }}>{cell.assumption.note}</span>}
          </div>
        )}
      </td>
      <td style={{ width: 44 }}>
        {!editing && (
          <button className="btn xs ghost" onClick={start} title={r.source === 'assumption' ? 'Change or clear your assumption' : 'Enter your own assumption'}>
            <Icon name="edit" />
          </button>
        )}
      </td>
    </tr>
  );
}

// Quick development feasibility from the sheet's working values. Every input is editable;
// nothing here is broker data — it is arithmetic on the numbers shown.
function Feasibility({ band, values }) {
  const defaults = useMemo(() => ({
    size: { b1: 40000, b2: 75000, b3: 175000, b4: 375000, b5: 625000, b6: 1000000 }[band.key],
    rent: values.rent, cost: values.cost, other: '', vacancy: 5, leakage: values.cap_reserve ?? '', cap: values.cap,
  }), [band.key, values.rent, values.cost, values.cap, values.cap_reserve]);
  const [f, setF] = useState(defaults);
  useEffect(() => { setF(defaults); }, [defaults]);
  const n = k => { const x = parseFloat(String(f[k]).replace(/,/g, '')); return Number.isFinite(x) ? x : null; };

  const size = n('size'), rent = n('rent'), cost = n('cost'), other = n('other') ?? 0, vac = n('vacancy') ?? 0,
    leak = n('leakage') ?? 0, cap = n('cap');
  const ready = size && rent != null && cost != null && cap;
  const totalPsf = ready ? cost + other : null;
  const noiPsf = ready ? rent * (1 - vac / 100) - leak : null;
  const yoc = ready && totalPsf ? (noiPsf / totalPsf) * 100 : null;
  const spread = yoc != null ? (yoc - cap) * 100 : null;
  const valuePsf = ready ? noiPsf / (cap / 100) : null;
  const margin = ready && totalPsf ? ((valuePsf - totalPsf) / totalPsf) * 100 : null;
  const money = x => (x == null ? '—' : `$${Math.round(x).toLocaleString('en-US')}`);

  const input = (key, label, hint, suffix) => (
    <div className="field">
      <label htmlFor={`fz-${key}`}>{label}</label>
      <div className="row" style={{ gap: 6 }}>
        <input id={`fz-${key}`} className="input sm num grow" value={f[key] ?? ''} placeholder="—"
               onChange={e => setF(s => ({ ...s, [key]: e.target.value }))} inputMode="decimal" />
        <span className="dim" style={{ fontSize: 12, minWidth: 34 }}>{suffix}</span>
      </div>
      {hint && <span className="dim" style={{ fontSize: 11.5 }}>{hint}</span>}
    </div>
  );

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Quick feasibility — {band.label}</div>
          <div className="card-sub">A back-of-envelope check using the sheet above. Change any input; nothing is saved.</div>
        </div>
      </div>
      <div className="card-body">
        <div className="form-grid">
          {input('size', 'Building size', null, 'SF')}
          {input('rent', 'Rent', 'From the sheet', '$/SF/yr')}
          {input('cost', 'Hard cost', 'From the sheet', '$/SF')}
          {input('other', 'Land + soft costs', 'Your number', '$/SF')}
          {input('vacancy', 'Stabilised vacancy', 'Underwriting allowance', '%')}
          {input('leakage', 'Non-recoverable costs', 'Reserves, mgmt', '$/SF/yr')}
          {input('cap', 'Exit cap rate', 'From the sheet', '%')}
        </div>
        {!ready ? (
          <div className="muted" style={{ marginTop: 16, fontSize: 13.5 }}>
            Enter a rent, hard cost and exit cap rate to see yield on cost and development spread.
          </div>
        ) : (
          <>
            <div className="metric-grid" style={{ marginTop: 18 }}>
              <div className="metric-tile"><div className="eyebrow">Yield on cost</div>
                <div className="v num">{yoc.toFixed(2)}%</div><div className="s">NOI ÷ total cost</div></div>
              <div className="metric-tile"><div className="eyebrow">Development spread</div>
                <div className={`v num ${spread >= 150 ? 'good' : spread < 75 ? 'bad' : ''}`}>{Math.round(spread)} bps</div>
                <div className="s">Yield on cost − exit cap</div></div>
              <div className="metric-tile"><div className="eyebrow">Stabilised NOI</div>
                <div className="v num">{money(noiPsf * size)}</div><div className="s">${noiPsf.toFixed(2)}/SF</div></div>
              <div className="metric-tile"><div className="eyebrow">Total cost</div>
                <div className="v num">{money(totalPsf * size)}</div><div className="s">${totalPsf.toFixed(2)}/SF</div></div>
              <div className="metric-tile"><div className="eyebrow">Value at exit</div>
                <div className="v num">{money(valuePsf * size)}</div><div className="s">${valuePsf.toFixed(2)}/SF</div></div>
              <div className="metric-tile"><div className="eyebrow">Margin on cost</div>
                <div className={`v num ${margin < 0 ? 'bad' : ''}`}>{margin.toFixed(1)}%</div>
                <div className="s">{money((valuePsf - totalPsf) * size)} profit</div></div>
            </div>
            <div className="dim" style={{ fontSize: 12, marginTop: 12 }}>
              NOI = rent × (1 − vacancy) − non-recoverable costs. Untrended and unlevered: no rent growth, lease-up,
              financing, free rent or leasing costs. Use it to screen, not to underwrite.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnderwritingPage() {
  const { toast } = useApp();
  const index = useLoad(() => getJSON('/api/underwriting'), []);
  const [selected, setSelected] = useState(null);
  const [bandKey, setBandKey] = useState('b3');
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState(null);
  const [sheetError, setSheetError] = useState(null);
  const [showEstimates, setShowEstimates] = useState(readPref);
  const [copied, setCopied] = useState(false);

  const markets = useMemo(() => (index.data ? index.data.markets : []), [index.data]);

  // Open on the first market that has broker data (or simply the first market).
  useEffect(() => {
    if (!selected && markets.length) setSelected((markets.find(m => m.broker_figures > 0) || markets[0]).market);
  }, [markets, selected]);

  useEffect(() => {
    if (!selected) return undefined;
    let alive = true;
    setSheet(null); setSheetError(null);
    getJSON(`/api/underwriting/${encodeURIComponent(selected)}`)
      .then(d => { if (alive) setSheet(d); })
      .catch(err => { if (alive) setSheetError(err.message); });
    return () => { alive = false; };
  }, [selected]);

  const toggleEstimates = on => {
    setShowEstimates(on);
    try { window.localStorage.setItem(ESTIMATES_KEY, on ? 'on' : 'off'); } catch { /* not remembered */ }
  };

  if (index.loading) return <Loading rows={8} />;
  if (index.error) return <ErrorState message={index.error} onRetry={index.reload} />;

  const shown = markets.filter(m => m.market.toLowerCase().includes(search.trim().toLowerCase()));
  const band = sheet && sheet.bands.find(b => b.key === bandKey);
  const fields = sheet ? sheet.fields : [];
  const working = band ? Object.fromEntries(fields.map(f => [f.key, resolveCell(band.cells[f.key], showEstimates).value])) : {};
  const counts = band ? fields.reduce((acc, f) => {
    const s = resolveCell(band.cells[f.key], showEstimates).source || 'none';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {}) : {};

  const save = async (field, value, allBands) => {
    try {
      const fresh = await putJSON(`/api/underwriting/${encodeURIComponent(selected)}/assumptions`,
        { band: bandKey, field, value, all_bands: allBands });
      setSheet(fresh);
      index.reload({ quiet: true });
      toast(value === '' ? 'Assumption cleared.' : 'Assumption saved.', 'success');
    } catch (err) { toast(err.message, 'error'); }
  };

  const rows = () => {
    const out = [['Market', 'Building size', 'Field', 'Value', 'Unit', 'Source', 'Broker', 'Quarter', 'Page', 'Broker size band']];
    for (const b of sheet.bands) {
      for (const f of fields) {
        const cell = b.cells[f.key];
        const r = resolveCell(cell, showEstimates);
        if (r.source == null) continue;
        const br = r.source === 'broker' ? cell.broker : null;
        out.push([sheet.market, b.label, f.label, r.value,
          { percent: '%', months: 'months', usd_psf: '$/SF', usd_psf_yr: '$/SF/yr' }[f.unit],
          { broker: 'Broker report', assumption: 'Glenstar assumption', estimate: 'UNVERIFIED estimate' }[r.source],
          br ? br.doc.source : '', br ? br.quarter : '', br ? (br.page || '') : '',
          br ? (br.scope === 'market' ? 'Market-wide' : br.broker_band) : '']);
      }
    }
    return out;
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rows().filter((r, i) => i === 0 || r[1] === band.label).map(r => r.join('\t')).join('\n'));
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { toast('Copying is not available in this browser.', 'error'); }
  };

  return (
    <div className="uw">
      <div className="card uw-list">
        <div style={{ padding: 12, borderBottom: '1px solid var(--line)' }}>
          <input className="input" style={{ width: '100%' }} placeholder="Search markets" value={search}
                 onChange={e => setSearch(e.target.value)} aria-label="Search markets" />
        </div>
        <div className="uw-list-scroll">
          {shown.map(m => (
            <button key={m.market} onClick={() => setSelected(m.market)} aria-pressed={selected === m.market}
                    className={`uw-item ${selected === m.market ? 'on' : ''}`}>
              <span className="grow" style={{ minWidth: 0 }}>
                <span className="uw-item-name truncate">{m.market}</span>
                <span className="dim truncate" style={{ display: 'block', fontSize: 12 }}>
                  {m.broker_figures > 0 ? `${m.broker_figures} broker figures${m.has_size_data ? ' · by size' : ''}` : 'No broker report yet'}
                  {m.assumptions > 0 ? ` · ${m.assumptions} of yours` : ''}
                </span>
              </span>
              {m.quarter ? <QuarterChip quarter={m.quarter} behind={m.quarters_behind} /> : null}
            </button>
          ))}
          {shown.length === 0 && <div className="card-body muted">No markets match.</div>}
        </div>
      </div>

      <div className="stack" style={{ minWidth: 0 }}>
        {sheetError && <ErrorState message={sheetError} />}
        {!sheet && !sheetError && <Loading rows={8} />}
        {sheet && band && (
          <>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="page-title" style={{ fontSize: 21 }}>{sheet.market}</div>
                  <div className="row wrap" style={{ marginTop: 6 }}>
                    {sheet.quarter ? <QuarterChip quarter={sheet.quarter} behind={sheet.quarters_behind} /> : <Chip>No broker report on file</Chip>}
                    {sheet.sources.map(s => <Chip key={s} tone="outline">{s}</Chip>)}
                    <span className="dim" style={{ fontSize: 12.5 }}>{sheet.region}</span>
                  </div>
                </div>
                <div className="row wrap">
                  <button className="btn sm" onClick={copy}><Icon name={copied ? 'check' : 'copy'} />{copied ? 'Copied' : 'Copy for Excel'}</button>
                  <button className="btn sm" onClick={() => downloadCSV(`${sheet.market} underwriting.csv`, rows())}><Icon name="file" />Download CSV</button>
                </div>
              </div>
              <div className="card-body" style={{ paddingBottom: 0 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Building size</div>
                <div className="seg" role="tablist" aria-label="Building size">
                  {sheet.bands.map(b => (
                    <button key={b.key} role="tab" aria-selected={bandKey === b.key} className={bandKey === b.key ? 'on' : ''}
                            onClick={() => setBandKey(b.key)} title={b.note}>{b.label}</button>
                  ))}
                </div>
                <div className="row wrap" style={{ marginTop: 14, gap: 14 }}>
                  <span className="legend">
                    <span><i style={{ background: 'var(--good)' }} />{counts.broker || 0} from broker reports</span>
                    <span><i style={{ background: 'var(--info)' }} />{counts.assumption || 0} your assumptions</span>
                    {showEstimates && <span><i style={{ background: 'var(--warn)' }} />{counts.estimate || 0} unverified estimates</span>}
                    <span><i style={{ background: 'var(--surface-3)' }} />{counts.none || 0} empty</span>
                  </span>
                  <span className="grow" />
                  {sheet.has_estimates && (
                    <label className="row muted" style={{ gap: 7, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={showEstimates} onChange={e => toggleEstimates(e.target.checked)} />
                      Fill gaps with unverified starter estimates
                    </label>
                  )}
                </div>
              </div>

              {showEstimates && (counts.estimate || 0) > 0 && (
                <div style={{ padding: '14px 18px 0' }}>
                  <Banner tone="warn" title={`${counts.estimate} of these values are unverified estimates`}>
                    They were carried over from the first version of the site and do not come from a broker report.
                    Treat them as placeholders: replace each with your own assumption (pencil icon) or add a report
                    that publishes it. They are marked “UNVERIFIED” when copied or downloaded.
                  </Banner>
                </div>
              )}

              {GROUPS.map(group => (
                <div key={group}>
                  <div className="uw-group eyebrow">{group}</div>
                  <table className="table uw-table">
                    <tbody>
                      {fields.filter(f => f.group === group).map(f => (
                        <SheetRow key={`${selected}-${bandKey}-${f.key}`} field={f} cell={band.cells[f.key]}
                                  showEstimates={showEstimates} onSave={save} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="dim" style={{ padding: '12px 18px 16px', fontSize: 12, borderTop: '1px solid var(--line)' }}>
                Order of precedence: your assumption, then the broker figure, then (if switched on) the starter estimate.
                The three are never averaged. Click a broker figure to see the report and page it came from.
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">All building sizes</div>
                  <div className="card-sub">Working values for each size. Click a row to switch the sheet to it.</div>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr>
                    <th className="l">Size</th>
                    {['rent', 'vacancy', 'cost', 'free_rent', 'ti_new', 'lease_term', 'cap'].map(k => (
                      <th key={k}>{fields.find(f => f.key === k).label}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {sheet.bands.map(b => (
                      <tr key={b.key} className="click" onClick={() => setBandKey(b.key)}
                          style={b.key === bandKey ? { background: 'var(--accent-soft)' } : undefined}>
                        <td className="l"><span className="strong">{b.label}</span> <span className="dim" style={{ fontSize: 12 }}>{b.note}</span></td>
                        {['rent', 'vacancy', 'cost', 'free_rent', 'ti_new', 'lease_term', 'cap'].map(k => {
                          const f = fields.find(x => x.key === k);
                          const r = resolveCell(b.cells[k], showEstimates);
                          return (
                            <td key={k} className="num" title={r.source ? SOURCE[r.source].label : 'No value'}>
                              {r.source ? (
                                <span className={r.source === 'estimate' ? 'muted' : ''}>
                                  <span className={`dot ${SOURCE[r.source].tone}`} style={{ display: 'inline-block', marginRight: 7, verticalAlign: 'middle' }} />
                                  {fmtSheet(r.value, f.unit).replace('/SF/yr', '').replace('/SF', '')}
                                </span>
                              ) : <span className="na">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Feasibility band={band} values={working} />

            {!sheet.quarter && (
              <Banner tone="info" title="No broker report on file for this market"
                      action={<Link to="/data" className="btn sm primary">Add report</Link>}>
                Add the latest broker report and its rent, vacancy and other published figures will fill in here with sources.
              </Banner>
            )}
          </>
        )}
        {!selected && <div className="card"><Empty icon="underwriting" title="Select a market" /></div>}
      </div>
    </div>
  );
}
