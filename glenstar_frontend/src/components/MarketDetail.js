import React, { useState } from 'react';
import Fig from './Fig';
import { Banner, Chip, Icon, Link, QuarterChip, useApp } from './ui';

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

export default function MarketDetail({ market: m, metricDefs, ranking }) {
  const { toast } = useApp();
  const [copied, setCopied] = useState(false);
  const present = metricDefs.filter(d => m.metrics[d.key]);
  const absent = metricDefs.filter(d => !m.metrics[d.key]);
  const segMetrics = metricDefs.filter(d => m.segments.some(s => s.metrics[d.key]));
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
          <div className="spread">
            <div className="eyebrow">AI assessment · based on the reported figures</div>
            <Chip tone={ranking.tier === 'Primary' ? 'good' : ranking.tier === 'Avoid' ? 'bad' : ranking.tier === 'Caution' ? 'warn' : 'info'}>
              {ranking.tier} · {ranking.score}/100
            </Chip>
          </div>
          <div style={{ fontWeight: 600, marginTop: 8 }}>{ranking.headline}</div>
          <div className="muted" style={{ marginTop: 4 }}>{ranking.detail}</div>
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

      {m.segments.length > 0 && (
        <>
          <div className="section-title">By building size / product type <span className="dim" style={{ fontWeight: 400, fontSize: 12 }}>Bands as published by the broker</span></div>
          <div className="card table-wrap">
            <table className="table">
              <thead><tr>
                <th className="l">Segment</th>
                {segMetrics.map(d => <th key={d.key}>{d.label}</th>)}
              </tr></thead>
              <tbody>
                {m.segments.map(s => (
                  <tr key={s.segment}>
                    <td className="l strong">{s.segment}</td>
                    {segMetrics.map(d => <td key={d.key}><Fig v={s.metrics[d.key]} /></td>)}
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
                    <td className="l muted">{h.source}</td>
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
