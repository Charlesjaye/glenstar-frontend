import React, { useEffect, useState } from 'react';
import { getJSON, postJSON } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { fmtDate, plural } from '../lib/format';
import Fig from '../components/Fig';
import { Banner, Chip, DIRECTION, DirectionChip, Empty, ErrorState, Icon, Link, Loading, Spinner, useApp } from '../components/ui';

const OUTLOOK = {
  Emerging:      { tone: 'accent', blurb: 'Improving, with room to run' },
  Established:   { tone: 'good',   blurb: 'Strong today and holding' },
  Watch:         { tone: 'warn',   blurb: 'Mixed, or too little history to call' },
  Deteriorating: { tone: 'bad',    blurb: 'Moving the wrong way' },
};
const scoreColor = s => (s >= 75 ? 'var(--good)' : s >= 55 ? 'var(--accent)' : s >= 40 ? 'var(--warn)' : 'var(--bad)');

function leader(markets, key, pick) {
  const withValue = markets.filter(m => m.is_current && m.metrics[key]);
  if (!withValue.length) return null;
  return withValue.reduce((best, m) => (pick(m.metrics[key], best.metrics[key]) ? m : best));
}
const annual = v => (v.annualized != null ? v.annualized : v.value);

function Coverage({ stats }) {
  const c = stats.coverage;
  const pct = n => `${(100 * n) / Math.max(1, c.total)}%`;
  return (
    <div className="card card-body">
      <div className="spread" style={{ flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div className="kpi-value" style={{ marginTop: 0 }}>
            {c.current}<span className="dim" style={{ fontSize: 18 }}> of {c.total}</span>
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>tracked markets have a {stats.expected_quarter} report</div>
            <div className="muted" style={{ fontSize: 13 }}>{stats.expected_quarter} is the latest quarter brokers have published.</div>
          </div>
        </div>
        <Link to="/data" className="btn primary"><Icon name="upload" />Add reports</Link>
      </div>
      <div className="meter" style={{ margin: '16px 0 10px' }}>
        <span className="m-good" style={{ width: pct(c.current) }} />
        <span className="m-warn" style={{ width: pct(c.review) }} />
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--good)' }} />{c.current} up to date</span>
        {c.review > 0 && <span><i style={{ background: 'var(--warn)' }} />{c.review} waiting for your review</span>}
        <span><i style={{ background: 'var(--surface-3)' }} />{c.missing} need a report</span>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { stats, toast, openMarket, reloadStats } = useApp();
  const thesisLoad = useLoad(() => getJSON('/api/thesis/current'), []);
  const marketsLoad = useLoad(() => getJSON('/api/markets'), []);
  const [tab, setTab] = useState('summary');
  const [open, setOpen] = useState(null);
  const [starting, setStarting] = useState(false);

  const info = thesisLoad.data;
  const running = info && info.job.status === 'running';

  // While the thesis is being written, check back until it is done.
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => thesisLoad.reload({ quiet: true }), 4000);
    return () => clearInterval(id);
  }, [running, thesisLoad]);

  const generate = async () => {
    setStarting(true);
    try {
      await postJSON('/api/thesis/regenerate');
      await thesisLoad.reload({ quiet: true });
      toast('Writing a new thesis from the latest report data…', 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
    setStarting(false);
    reloadStats();
  };

  if (marketsLoad.loading || thesisLoad.loading || !stats) return <Loading rows={6} />;
  if (marketsLoad.error) return <ErrorState message={marketsLoad.error} onRetry={marketsLoad.reload} />;

  const markets = marketsLoad.data.markets;
  const thesis = info && info.thesis;

  if (!markets.length) {
    return (
      <div className="card">
        <Empty icon="upload" title="No broker reports yet"
               action={<Link to="/data" className="btn primary"><Icon name="upload" />Add your first reports</Link>}>
          Every number on this site comes straight from a broker report — nothing is estimated or pre-filled.
          Drop in the {stats.expected_quarter} industrial reports (JLL, CBRE, Cushman &amp; Wakefield, Colliers, Newmark,
          Avison Young…) and the market data, rankings and thesis build themselves, each figure linked to the page
          it came from.
        </Empty>
      </div>
    );
  }

  const tight = leader(markets, 'vacancy_rate', (a, b) => a.value < b.value);
  const absorb = leader(markets, 'net_absorption_qtr', (a, b) => a.value > b.value)
    || leader(markets, 'net_absorption_ytd', (a, b) => a.value > b.value);
  const rent = leader(markets, 'asking_rent', (a, b) => annual(a) > annual(b));
  const absorbKey = absorb && (absorb.metrics.net_absorption_qtr ? 'net_absorption_qtr' : 'net_absorption_ytd');
  const byName = Object.fromEntries(markets.map(m => [m.market, m]));
  const paragraphs = thesis ? thesis.summary.split(/\n\s*\n/).filter(Boolean) : [];
  const year = thesis ? parseInt(thesis.quarter.slice(3), 10) : null;
  const horizon = year ? `${year + 2}–${year + 3}` : '';
  const tally = markets.reduce((acc, m) => { acc[m.trend.direction] = (acc[m.trend.direction] || 0) + 1; return acc; }, {});
  const directionCounts = ['improving', 'mixed', 'weakening', 'unknown'].filter(k => tally[k])
    .map(k => `${tally[k]} ${DIRECTION[k].label.toLowerCase()}`).join(' · ');

  return (
    <div className="stack">
      <Coverage stats={stats} />
      {thesis && thesis.rankings.length > 0 ? (
        <div>
          <div className="spread" style={{ marginBottom: 10 }}>
            <div className="eyebrow">Where the puck is going · top trajectory scores for {horizon}</div>
            <div className="dim" style={{ fontSize: 12.5 }}>{directionCounts}</div>
          </div>
          <div className="grid k3">
            {thesis.rankings.slice(0, 3).map(r => (
              <div className="card out-card" key={r.market} onClick={() => openMarket(r.market)} role="button" tabIndex={0}
                   onKeyDown={e => { if (e.key === 'Enter') openMarket(r.market); }}>
                <div className="spread">
                  <Chip tone={(OUTLOOK[r.outlook] || {}).tone}>{r.outlook}</Chip>
                  <span className="score-n" style={{ color: scoreColor(r.score), width: 'auto' }}>{r.score}</span>
                </div>
                <div className="kpi-value sm" style={{ marginTop: 10 }}>{r.market}</div>
                <div className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>{r.headline}</div>
                <div className="row wrap dim" style={{ marginTop: 10, gap: 8, fontSize: 12.5 }}>
                  <DirectionChip direction={r.direction} />
                  <span>{r.confidence} confidence · {r.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="grid k3">
        {[
          { label: 'Tightest vacancy', m: tight, key: 'vacancy_rate' },
          { label: absorbKey === 'net_absorption_ytd' ? 'Strongest absorption (YTD)' : 'Strongest absorption', m: absorb, key: absorbKey },
          { label: 'Highest asking rent', m: rent, key: 'asking_rent' },
        ].map(k => (
          <div className="card kpi" key={k.label}>
            <div className="eyebrow">{k.label} · {stats.expected_quarter}</div>
            {k.m ? (
              <>
                <div className="kpi-value"><Fig v={k.m.metrics[k.key]} /></div>
                <div className="kpi-note">
                  <button className="accent" style={{ fontWeight: 600 }} onClick={() => openMarket(k.m.market)}>{k.m.market}</button>
                  {' · '}{k.m.metrics[k.key].doc.source}
                </div>
              </>
            ) : (
              <>
                <div className="kpi-value sm dim">—</div>
                <div className="kpi-note">No {stats.expected_quarter} reports yet</div>
              </>
            )}
          </div>
        ))}
      </div>
      )}

      {stats.review_document_count > 0 && (
        <Banner tone="warn" title={`${plural(stats.review_value_count, 'figure')} in ${plural(stats.review_document_count, 'report')} need your check`}
                action={<Link to="/data" className="btn sm primary">Review now</Link>}>
          These could not be confirmed automatically, so they are held back from the site until you check them against the PDF.
        </Banner>
      )}

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Forward thesis{thesis ? ` — ${horizon} outlook, from ${thesis.quarter} data` : ''}</div>
            <div className="card-sub">
              {thesis
                ? `Which markets should lead in two to three years · written by Claude from ${plural(thesis.market_count, 'market')} of report data · ${fmtDate(thesis.generated_at, true)}`
                : 'Which markets are set to lead in two to three years — reasoned only from the report data on file'}
            </div>
          </div>
          <div className="row">
            {running && <Chip tone="accent" dot pulse>Writing…</Chip>}
            <button className="btn" onClick={generate} disabled={starting || running || !info || !info.can_generate}>
              {starting ? <Spinner /> : <Icon name="sparkles" />}{thesis ? 'Regenerate' : 'Generate thesis'}
            </button>
          </div>
        </div>

        {info && info.job.status === 'failed' && (
          <div style={{ padding: '14px 18px 0' }}><Banner tone="bad" title="The thesis could not be generated">{info.job.detail}</Banner></div>
        )}
        {thesis && info.stale && !running && (
          <div style={{ padding: '14px 18px 0' }}>
            <Banner tone="accent" icon="refresh" title="Report data has changed since this thesis was written"
                    action={<button className="btn sm primary" onClick={generate} disabled={starting}>Update thesis</button>}>
              New or corrected figures are on file. Regenerate to bring the analysis in line with them.
            </Banner>
          </div>
        )}
        {thesis && thesis.warnings.length > 0 && (
          <div style={{ padding: '14px 18px 0' }}>
            <Banner tone="warn" title="Some figures in this commentary could not be matched to report data">
              {thesis.warnings.slice(0, 8).map(w => w.figure).join(', ')}
              {thesis.warnings.length > 8 ? ` and ${thesis.warnings.length - 8} more` : ''}. Treat these as the AI's own
              wording, not broker data. The figures in the tables and market pages are unaffected.
            </Banner>
          </div>
        )}

        {!thesis ? (
          <Empty icon="sparkles" title={running ? 'Writing the thesis…' : 'No thesis yet'}>
            {!info.api_key_configured
              ? 'The AI is not set up yet: add ANTHROPIC_API_KEY to the backend service and redeploy.'
              : info.available_market_count < info.min_markets
                ? `A thesis needs reports for at least ${info.min_markets} markets in the same quarter. Add a few more reports.`
                : running ? 'This usually takes a minute or two.'
                  : `Reports for ${plural(info.available_market_count, 'market')} (${info.available_quarter}) are ready to analyse.`}
          </Empty>
        ) : (
          <>
            <div style={{ padding: '14px 18px 0' }}>
              <div className="seg" role="tablist">
                {[['summary', 'Summary'], ['rankings', 'Trajectory ranking', thesis.rankings.length], ['risks', 'Risks to the view', thesis.risks.length]].map(([k, label, n]) => (
                  <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                    {label}{n != null && <span className="count">{n}</span>}
                  </button>
                ))}
              </div>
            </div>
            {tab === 'summary' && (
              <div className="card-body prose" style={{ maxWidth: 860 }}>
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
            {tab === 'rankings' && (
              <div style={{ marginTop: 12 }}>
                <div className="row wrap dim" style={{ padding: '0 18px 12px', gap: 14, fontSize: 12.5 }}>
                  {Object.entries(OUTLOOK).map(([k, o]) => <span key={k}><Chip tone={o.tone}>{k}</Chip> {o.blurb}</span>)}
                </div>
                {thesis.rankings.map(r => (
                  <React.Fragment key={r.market}>
                    <div className={`rank-row ${open === r.market ? 'open' : ''}`} onClick={() => setOpen(o => (o === r.market ? null : r.market))}
                         role="button" tabIndex={0} aria-expanded={open === r.market}
                         onKeyDown={e => { if (e.key === 'Enter') setOpen(o => (o === r.market ? null : r.market)); }}>
                      <div className="rank-n">{r.rank}</div>
                      <div className="grow">
                        <div className="row wrap" style={{ gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{r.market}</span>
                          <Chip tone={(OUTLOOK[r.outlook] || {}).tone}>{r.outlook}</Chip>
                          <DirectionChip direction={r.direction} />
                          <span className="dim" style={{ fontSize: 12.5 }}>{r.region} · {r.source} · {r.confidence} confidence</span>
                        </div>
                        <div className="muted" style={{ marginTop: 3, fontSize: 13.5 }}>{r.headline}</div>
                      </div>
                      <div className="score" title="Trajectory score: how attractive the market should be in two to three years, judged from the reported figures">
                        <div className="score-bar"><span style={{ width: `${r.score}%`, background: scoreColor(r.score) }} /></div>
                        <div className="score-n" style={{ color: scoreColor(r.score) }}>{r.score}</div>
                      </div>
                    </div>
                    {open === r.market && (
                      <div className="rank-detail">
                        <div style={{ lineHeight: 1.65 }}>{r.thesis}</div>
                        <div style={{ margin: '12px 0 4px' }}>
                          {r.signals.map((sg, i) => (
                            <div className="sig-row" key={i}>
                              <span style={{ fontWeight: 600 }}>{sg.name}</span>
                              <span className="pips" title={`${sg.score} of 5`}>{[1, 2, 3, 4, 5].map(n => <i key={n} className={n <= sg.score ? 'on' : ''} />)}</span>
                              <span className="muted">{sg.note}</span>
                            </div>
                          ))}
                        </div>
                        {byName[r.market] && (
                          <div className="row wrap dim" style={{ margin: '10px 0', gap: 16, fontSize: 12.5 }}>
                            {['vacancy_rate', 'asking_rent', 'net_absorption_qtr', 'under_construction'].filter(k => byName[r.market].metrics[k]).map(k => (
                              <span key={k}>
                                {{ vacancy_rate: 'Vacancy', asking_rent: 'Rent', net_absorption_qtr: 'Absorption', under_construction: 'Pipeline' }[k]}{' '}
                                <span style={{ color: 'var(--text)' }}><Fig v={byName[r.market].metrics[k]} showDelta /></span>
                              </span>
                            ))}
                          </div>
                        )}
                        {r.watch && <div className="muted" style={{ fontSize: 13 }}><strong style={{ color: 'var(--text)' }}>What would change this view:</strong> {r.watch}</div>}
                        <button className="btn sm" style={{ marginTop: 12 }} onClick={() => openMarket(r.market)}>Open {r.market}<Icon name="chevron" /></button>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
            {tab === 'risks' && (
              <div style={{ marginTop: 12 }}>
                {thesis.risks.length === 0 && <div className="card-body muted">No risks were identified from the current data.</div>}
                {thesis.risks.map((r, i) => (
                  <div className="risk" key={i}>
                    <Chip tone={r.level === 'high' ? 'bad' : r.level === 'medium' ? 'warn' : 'info'}>{r.level}</Chip>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.title}</div>
                      <div className="muted" style={{ marginTop: 2 }}>{r.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="dim" style={{ padding: '12px 18px 16px', fontSize: 12, borderTop: '1px solid var(--line)', marginTop: 12 }}>
              This is a forward-looking judgement by Claude, reasoned from the reported figures and their direction — not a
              forecast and not broker data. The statistics themselves come only from broker reports; click any number to
              see its source.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
