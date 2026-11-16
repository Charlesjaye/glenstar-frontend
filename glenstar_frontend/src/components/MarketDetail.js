import React, { useState } from 'react';
import Fig from './Fig';
import { Banner, Chip, DirectionChip, Icon, Link, QuarterChip, useApp } from './ui';
import { fmtSignal } from '../lib/format';

// Tab-separated block for pasting into Excel: every figure with its source.
export function excelBlock(m, metricDefs) {
  const lines = [
    `${m.market} — ${m.quarter}`,
    ['Metric', 'Segment', 'Value', 'Unit', 'As printed', 'Source', 'Quarter', 'Page'].join('\t'),
  ];
  const row = (label, segment, v) => [
    label, segment, v.value,
    v.unit === 'percent' ? '%' : v.unit === 'sf' ? 'SF' : v.metric === 'asking_rent' ? `$/SF/${v.period || 'yr'}` : '$/SF',
    v.printed || '', v.doc.source, v.quarter, v.page || '',
  ].join('\t');
  for (const def of metricDefs) {
    const v = m.metrics[def.key];
    if (v) lines.push(row(def.label, 'Market total', v));
  }
  for (const seg of m.segments) {
    for (const def of metricDefs) {
      const v = seg.metrics[def.key];
      if (v) lines.push(row(def.label, seg.segment, v));
    }
  }
  return lines.join('\n');
}

export default function MarketDetail({ market: m, metricDefs, ranking, sizeBands }) {
  const { toast } = useApp();
  const [copied, setCopied] = useState(false);
  const present = metricDefs.filter(d => m.metrics[d.key]);
  const absent = metricDefs.filter(d => !m.metrics[d.key]);
  const sizeRows = m.segments.filter(s => s.kind === 'size');
  const typeRows = m.segments.filter(s => s.kind !== 'size');
  const cols = rows => metricDefs.filter(d => rows.some(s => s.metrics[d.key]));
  const bandLabel = Object.fromEntries((sizeBands || []).map(b => [b.key, b.short]));
  const signals = (m.trend && m.trend.signals) || [];
  const historyMetrics = metricDefs.filter(d => m.history.some(h => h.metrics[d.key])).slice(0, 6);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(excelBlock(m, metricDefs));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Copying is not available in this browser.', 'error');
    }
  };

  return (
    <div>
      <div className="row wrap" style={{ marginBottom: 16 }}>
        <QuarterChip quarter={m.quarter} behind={m.quarters_behind} />
        {m.sources.map(s => <Chip key={s} tone="outline">{s}</Chip>)}
        <span className="grow" />
        <button className="btn sm" onClick={copy}>
          <Icon name={copied ? 'check' : 'copy'} />{copied ? 'Copied' : 'Copy for Excel'}
        </button>
      </div>

      {m.quarters_behind > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="warn" title={`These figures are from ${m.quarter}`}
                  action={<Link to="/data" className="btn sm primary">Add report</Link>}>
            No newer report is on file for this market. Add the latest broker report to bring it up to date.
          </Banner>
        </div>
      )}

      {ranking && (
        <div className="card card-body" style={{ marginBottom: 16, background: 'var(--surface-2)' }}>
          <div className="spread" style={{ flexWrap: 'wrap' }}>
            <div className="eyebrow">2–3 year outlook · AI judgement from the reported figures</div>
            <div className="row">
              <Chip tone={{ Emerging: 'accent', Established: 'good', Watch: 'warn', Deteriorating: 'bad' }[ranking.outlook] || ''}>{ranking.outlook}</Chip>
              <Chip tone="outline">Trajectory {ranking.score}/100</Chip>
              <Chip tone="outline">{ranking.confidence} confidence</Chip>
            </div>
          </div>
          <div style={{ fontWeight: 600, marginTop: 8 }}>{ranking.headline}</div>
          <div className="muted" style={{ marginTop: 4 }}>{ranking.thesis}</div>
          {ranking.watch && <div className="dim" style={{ marginTop: 8, fontSize: 13 }}><strong style={{ color: 'var(--text-2)' }}>What would change this view:</strong> {ranking.watch}</div>}
        </div>
      )}

      <div className="section-title">
        Direction of travel
        <DirectionChip direction={m.trend ? m.trend.direction : 'unknown'} title="Calculated from the report figures below" />
      </div>
      {signals.length === 0 ? (
        <div className="dim" style={{ fontSize: 13 }}>
          Not enough figures on file to show a direction yet. It appears once a report prints prior-period
          comparisons, or a second quarter is added from the same broker.
        </div>
      ) : (
        <div className="card">
          {signals.map(sig => (
            <div className="signal" key={sig.key}>
              <span className={`signal-arrow ${sig.tone > 0 ? 'good' : sig.tone < 0 ? 'bad' : 'dim'}`}>{sig.tone > 0 ? '▲' : sig.tone < 0 ? '▼' : '●'}</span>
              <span className="grow">
                <span style={{ fontWeight: 600 }}>{sig.label}</span>
                <span className="dim" style={{ display: 'block', fontSize: 12.5 }}>{sig.detail}</span>
              </span>
              <span className="num" style={{ fontWeight: 600 }}>{fmtSignal(sig)}</span>
            </div>
          ))}
          <div className="dim" style={{ padding: '10px 14px', fontSize: 12, borderTop: '1px solid var(--line)' }}>
            Calculated by the site from the report figures shown (same broker only). ▲ favourable for a developer, ▼ unfavourable.
          </div>
        </div>
      )}

      <div className="section-title">Published figures <span className="dim" style={{ fontWeight: 400, fontSize: 12 }}>Click any number to see its source</span></div>
      <div className="metric-grid">
        {present.map(def => {
          const v = m.metrics[def.key];
          return (
            <div className="metric-tile" key={def.key}>
              <div className="eyebrow">{def.label}</div>
              <div className="v"><Fig v={v} exact={v.unit !== 'sf'} showDelta /></div>
              <div className="s">{v.doc.source}{v.page ? ` · p.${v.page}` : ''}</div>
            </div>
          );
        })}
      </div>
      {absent.length > 0 && (
        <div className="dim" style={{ fontSize: 12.5, marginTop: 12 }}>
          Not published in the reports on file: {absent.map(d => d.label.toLowerCase()).join(', ')}.
        </div>
      )}

      {sizeRows.length > 0 && (
        <>
          <div className="section-title">By building size <span className="dim" style={{ fontWeight: 400, fontSize: 12 }}>The broker's own size bands, mapped to Glenstar's</span></div>
          <div className="card table-wrap">
            <table className="table">
              <thead><tr>
                <th className="l">Broker's band</th><th className="l">Glenstar size</th>
                {cols(sizeRows).map(d => <th key={d.key}>{d.label}</th>)}
              </tr></thead>
              <tbody>
                {sizeRows.map(s => (
                  <tr key={s.segment}>
                    <td className="l"><span className="strong">{s.range || s.segment}</span>
                      {s.range && s.range !== s.segment && <div className="dim" style={{ fontSize: 12 }}>printed as “{s.segment}”</div>}</td>
                    <td className="l">
                      <span className="row wrap" style={{ gap: 5 }}>
                        {s.bands.map(k => <Chip key={k} tone={s.fit === 'exact' ? 'good' : 'outline'}>{bandLabel[k] || k}</Chip>)}
                        {s.fit === 'spans' && <span className="dim" style={{ fontSize: 12 }}>covers {s.bands.length} of our sizes</span>}
                        {s.fit === 'within' && <span className="dim" style={{ fontSize: 12 }}>part of this size</span>}
                      </span>
                    </td>
                    {cols(sizeRows).map(d => <td key={d.key}><Fig v={s.metrics[d.key]} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {typeRows.length > 0 && (
        <>
          <div className="section-title">By product type <span className="dim" style={{ fontWeight: 400, fontSize: 12 }}>As published by the broker</span></div>
          <div className="card table-wrap">
            <table className="table">
              <thead><tr><th className="l">Type</th>{cols(typeRows).map(d => <th key={d.key}>{d.label}</th>)}</tr></thead>
              <tbody>
                {typeRows.map(s => (
                  <tr key={s.segment}>
                    <td className="l strong">{s.segment}</td>
                    {cols(typeRows).map(d => <td key={d.key}><Fig v={s.metrics[d.key]} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {m.history.length > 1 && (
        <>
          <div className="section-title">History</div>
          <div className="card table-wrap">
            <table className="table">
              <thead><tr>
                <th className="l">Quarter</th><th className="l">Source</th>
                {historyMetrics.map(d => <th key={d.key}>{d.label}</th>)}
              </tr></thead>
              <tbody>
                {m.history.map(h => (
                  <tr key={h.quarter}>
                    <td className="l strong">{h.quarter}</td>
                    <td className="l muted">{h.source}{h.restated && <span className="dim" title="Comparison figures printed in a later report"> · as restated</span>}</td>
                    {historyMetrics.map(d => <td key={d.key}><Fig v={h.metrics[d.key]} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="section-title">Source reports for {m.quarter}</div>
      <div className="card">
        {m.documents.map(d => (
          <Link key={d.id} to={`/reports/${d.id}`} className="upload-item" style={{ textDecoration: 'none' }}>
            <div className="file-icon"><Icon name="file" /></div>
            <div className="grow">
              <div className="truncate" style={{ fontWeight: 600 }}>{d.title}</div>
              <div className="dim" style={{ fontSize: 12.5 }}>{d.source}</div>
            </div>
            <Icon name="chevron" size={16} style={{ color: 'var(--text-3)' }} />
          </Link>
        ))}
      </div>
      <div className="dim" style={{ fontSize: 12, marginTop: 14 }}>
        Figures from different brokers are never averaged; each shows the broker it came from.
      </div>
    </div>
  );
}
