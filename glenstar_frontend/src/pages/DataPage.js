import React, { useState } from 'react';
import { getJSON } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { plural, timeAgo } from '../lib/format';
import UploadZone, { documentOutcome } from '../components/UploadZone';
import { Banner, Chip, DocStatusChip, ErrorState, Icon, Link, Loading, useApp } from '../components/ui';

// Why a broker page did not yield a report, in plain words.
const RESULT = {
  blocked:         { tone: 'bad',  text: 'Site blocks automated access' },
  not_found:       { tone: 'warn', text: 'Link is dead' },
  no_report_found: { tone: '',     text: 'Nothing found on page' },
  no_change:       { tone: '',     text: 'Nothing new' },
  error:           { tone: 'warn', text: 'Site unreachable' },
  needs_api_key:   { tone: 'warn', text: 'AI not set up' },
  new_report:      { tone: 'good', text: 'Report found' },
};

function reason(market) {
  const results = market.targets.map(t => t.result).filter(Boolean);
  if (!market.targets.length) return 'No broker page is being watched for this market';
  if (!results.length) return 'Not checked yet';
  if (results.every(r => r === 'blocked')) return 'Broker sites block automated access';
  if (results.includes('blocked')) return 'Some broker sites block automated access';
  if (results.every(r => r === 'not_found')) return 'Saved broker links are dead';
  return 'No new report found automatically';
}

export default function DataPage() {
  const { stats } = useApp();
  const cov = useLoad(() => getJSON('/api/coverage'), [], { interval: 15000 });
  const review = useLoad(() => getJSON('/api/documents?status=needs_review,failed'), [], { interval: 15000 });
  const [showCurrent, setShowCurrent] = useState(false);

  const refresh = () => { cov.reload({ quiet: true }); review.reload({ quiet: true }); };

  if (cov.loading && !cov.data) return <Loading rows={6} />;
  if (cov.error) return <ErrorState message={cov.error} onRetry={cov.reload} />;

  const { expected_quarter: quarter, markets, counts } = cov.data;
  const missing = markets.filter(m => m.status === 'missing');
  const inReview = markets.filter(m => m.status === 'review');
  const current = markets.filter(m => m.status === 'current');
  const toReview = (review.data || []).filter(d => d.status === 'needs_review');
  const failed = (review.data || []).filter(d => d.status === 'failed');

  return (
    <div className="stack">
      {stats && !stats.api_key_configured && (
        <Banner tone="bad" title="The AI reader is not set up">
          Reports can be uploaded but not read until <span className="mono">ANTHROPIC_API_KEY</span> is added to the
          backend service (Render → your service → Environment) and it has redeployed.
        </Banner>
      )}
      {stats && !stats.storage_persistent && (
        <Banner tone="warn" title="Uploaded reports are not being stored permanently">
          The backend is using temporary storage, which is wiped whenever the server restarts or redeploys. Attach a
          Postgres database (set <span className="mono">DATABASE_URL</span>) so reports and their data are kept.
        </Banner>
      )}

      <UploadZone onChange={refresh} />

      {(toReview.length > 0 || failed.length > 0) && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Needs your attention</div>
              <div className="card-sub">Figures that could not be confirmed automatically stay off the site until you check them.</div>
            </div>
          </div>
          {[...toReview, ...failed].map(d => (
            <div className="upload-item" key={d.id}>
              <div className="file-icon"><Icon name="file" /></div>
              <div className="grow">
                <div className="truncate" style={{ fontWeight: 600 }}>{d.title || d.filename}</div>
                <div className={d.status === 'failed' ? 'bad' : 'muted'} style={{ fontSize: 12.5 }}>{documentOutcome(d)}</div>
              </div>
              <DocStatusChip status={d.status} />
              <Link to={`/reports/${d.id}`} className="btn sm primary">{d.status === 'failed' ? 'Open' : 'Review'}</Link>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">{quarter} coverage</div>
            <div className="card-sub">
              {quarter} is the latest quarter brokers have published. {counts.current} of {counts.total} tracked markets
              have a report for it.
            </div>
          </div>
          <div className="row">
            <Chip tone="good" dot>{counts.current} up to date</Chip>
            {counts.review > 0 && <Chip tone="warn" dot>{counts.review} in review</Chip>}
            <Chip dot>{counts.missing} needed</Chip>
          </div>
        </div>

        {missing.length === 0 && inReview.length === 0 && (
          <div className="card-body row"><Icon name="checkCircle" size={18} style={{ color: 'var(--good)' }} />
            <span>Every tracked market has a {quarter} report.</span></div>
        )}

        {inReview.map(m => (
          <div className="cov-row" key={m.market}>
            <div><div style={{ fontWeight: 600 }}>{m.market}</div><div className="dim" style={{ fontSize: 12 }}>{m.region}</div></div>
            <Chip tone="warn" dot>In review</Chip>
            <div className="muted" style={{ fontSize: 13 }}>A {quarter} report has been read, but its figures are waiting for your check.</div>
            <Link to={`/reports/${m.review_documents[0]}`} className="btn sm primary">Review</Link>
          </div>
        ))}

        {missing.map(m => (
          <div className="cov-row" key={m.market}>
            <div>
              <div style={{ fontWeight: 600 }}>{m.market}</div>
              <div className="dim" style={{ fontSize: 12 }}>{m.region}</div>
            </div>
            {m.latest_quarter
              ? <Chip tone="warn" icon="clock" title="Newest report on file">{m.latest_quarter}</Chip>
              : <Chip>No report</Chip>}
            <div>
              <div className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>{reason(m)} — download the PDF and drop it in above:</div>
              <div className="cov-sources">
                {m.targets.map(t => {
                  const r = RESULT[t.result];
                  return (
                    <a key={t.id} className="src-link" href={t.url} target="_blank" rel="noreferrer"
                       title={`${t.detail || 'Not checked yet'}${t.last_checked ? ` · checked ${timeAgo(t.last_checked)}` : ''}`}>
                      {r && r.tone && <span className={`dot ${r.tone}`} />}
                      {t.source}<Icon name="external" />
                    </a>
                  );
                })}
                {m.targets.length === 0 && <span className="dim" style={{ fontSize: 12.5 }}>Search the broker's research page for “{m.market} industrial {quarter}”.</span>}
              </div>
            </div>
            <span />
          </div>
        ))}

        {current.length > 0 && (
          <>
            <button className="spread" style={{ width: '100%', padding: '13px 18px', borderTop: '1px solid var(--line)' }}
                    onClick={() => setShowCurrent(s => !s)} aria-expanded={showCurrent}>
              <span className="row"><Icon name="checkCircle" size={16} style={{ color: 'var(--good)' }} />
                <span style={{ fontWeight: 600 }}>{plural(current.length, 'market')} up to date for {quarter}</span></span>
              <span className="muted" style={{ fontSize: 12.5 }}>{showCurrent ? 'Hide' : 'Show'}</span>
            </button>
            {showCurrent && (
              <div className="current-grid" style={{ paddingTop: 0 }}>
                {current.map(m => (
                  <div className="current-cell" key={m.market} title={m.sources.join(', ')}>
                    <Icon name="check" /><span className="truncate grow">{m.market}</span>
                    <span className="dim" style={{ fontSize: 11.5 }}>{m.sources.length > 1 ? `${m.sources.length} brokers` : m.sources[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid k3">
        {[
          ['upload', 'Drop in any broker PDF', 'Market reports, MarketBeats, Figures, national tables — one file or fifty. A national report fills every market it covers.'],
          ['shield', 'Every figure is checked', 'Each number is matched to the exact text in the PDF, then re-read by a second independent AI pass. Anything doubtful is held for you.'],
          ['clock', 'History builds itself', 'Each report is filed under its quarter. The site always shows the newest quarter and keeps older ones for comparison.'],
        ].map(([icon, title, text]) => (
          <div className="card card-body" key={title}>
            <div className="row"><Icon name={icon} size={18} style={{ color: 'var(--accent)' }} /><span style={{ fontWeight: 600 }}>{title}</span></div>
            <div className="muted" style={{ marginTop: 6, fontSize: 13.5 }}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
