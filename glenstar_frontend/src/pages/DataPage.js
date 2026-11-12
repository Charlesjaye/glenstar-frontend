import React, { useEffect, useState } from 'react';
import { API_BASE, getJSON, postJSON } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { plural, timeAgo } from '../lib/format';
import UploadZone, { documentOutcome } from '../components/UploadZone';
import { Banner, Chip, DocStatusChip, ErrorState, Icon, Link, Loading, Spinner, useApp } from '../components/ui';

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
  const { stats, toast, reloadStats } = useApp();
  const cov = useLoad(() => getJSON('/api/coverage'), [], { interval: 15000 });
  const review = useLoad(() => getJSON('/api/documents?status=needs_review,failed'), [], { interval: 15000 });
  const [showCurrent, setShowCurrent] = useState(false);
  const [starting, setStarting] = useState(false);

  const job = stats ? stats.finder : null;
  const searching = job && job.status === 'running';
  // While a web search is running, keep the coverage list fresh.
  useEffect(() => {
    if (!searching) return undefined;
    const id = setInterval(() => { cov.reload({ quiet: true }); reloadStats(); }, 5000);
    return () => clearInterval(id);
  }, [searching, cov, reloadStats]);

  const searchWeb = async () => {
    setStarting(true);
    try {
      const res = await postJSON('/api/finder', {});
      toast(res.started ? `Searching the web for ${res.markets} missing market${res.markets === 1 ? '' : 's'}…`
        : res.markets === 0 ? 'Nothing to search for — every market is covered.' : 'A search is already running.', 'info');
      reloadStats();
    } catch (err) { toast(err.message, 'error'); }
    setStarting(false);
  };

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
          <div className="row wrap">
            <Chip tone="good" dot>{counts.current} up to date</Chip>
            {counts.review > 0 && <Chip tone="warn" dot>{counts.review} in review</Chip>}
            <Chip dot>{counts.missing} needed</Chip>
            {counts.missing > 0 && (
              <button className="btn sm primary" onClick={searchWeb} disabled={starting || searching || (stats && !stats.api_key_configured)}
                      title="Claude searches the web for each missing market's latest report PDF and files what it finds">
                {starting || searching ? <Spinner /> : <Icon name="search" />}
                {searching ? `Searching… ${job.done}/${job.total}` : 'Find missing reports on the web'}
              </button>
            )}
          </div>
        </div>
        {searching && (
          <div className="cov-hint" style={{ color: 'var(--accent)' }}>
            <Spinner />Searching for {job.current}… {job.found > 0 ? `${job.found} found so far. ` : ''}You can leave this page; it keeps going.
          </div>
        )}

        {missing.length === 0 && inReview.length === 0 && (
          <div className="card-body row"><Icon name="checkCircle" size={18} style={{ color: 'var(--good)' }} />
            <span>Every tracked market has a {quarter} report.</span></div>
        )}

        {inReview.map(m => (
          <div className="cov-row" key={m.market}>
            <div><div style={{ fontWeight: 600 }}>{m.market}</div><div className="dim" style={{ fontSize: 12 }}>{m.region}</div></div>
            <div><Chip tone="warn" dot>In review</Chip></div>
            <div className="muted" style={{ fontSize: 13 }}>A {quarter} report has been read, but its figures are waiting for your check.</div>
            <div style={{ textAlign: 'right' }}><Link to={`/reports/${m.review_documents[0]}`} className="btn sm primary">Review</Link></div>
          </div>
        ))}

        {missing.length > 0 && (
          <div className="cov-hint">
            <Icon name="info" size={15} />
            Open the broker's page, download the {quarter} industrial report PDF, and drop it in the box above.
            The coloured dot shows what happened when the site last checked that page.
          </div>
        )}
        {missing.map(m => (
          <div className="cov-row" key={m.market}>
            <div>
              <div style={{ fontWeight: 600 }}>{m.market}</div>
              <div className="dim" style={{ fontSize: 12 }}>{m.region}</div>
            </div>
            <div>
              {m.latest_quarter
                ? <Chip tone="warn" icon="clock" title="Newest report on file — out of date">{m.latest_quarter} on file</Chip>
                : <Chip>No report</Chip>}
            </div>
            <div className="cov-sources">
              {m.targets.map(t => {
                const r = RESULT[t.result];
                return (
                  <a key={t.id} className="src-link" href={t.url} target="_blank" rel="noreferrer"
                     title={`${r ? r.text : 'Not checked yet'}${t.last_checked ? ` · checked ${timeAgo(t.last_checked)}` : ''}`}>
                    <span className={`dot ${r && r.tone ? r.tone : 'dim'}`} />
                    {t.source}<Icon name="external" />
                  </a>
                );
              })}
              {m.targets.length === 0 && <span className="dim" style={{ fontSize: 12.5 }}>Search the broker's research page for “{m.market} industrial {quarter}”.</span>}
            </div>
            <div className="dim cov-reason">
              {m.search ? <span title={m.search.detail}>Web search {timeAgo(m.search.at)}: {m.search.status === 'failed' ? 'failed' : 'nothing usable found'}</span> : reason(m)}
            </div>
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

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Ways reports arrive on their own</div>
            <div className="card-sub">Everything below feeds the same checks as a dropped PDF. Nothing is ever guessed.</div>
          </div>
        </div>
        <div className="grid k3" style={{ padding: 18 }}>
          <div>
            <div className="row"><Icon name="search" size={17} style={{ color: 'var(--accent)' }} /><span style={{ fontWeight: 600 }}>Web search</span><Chip tone="good" dot>On</Chip></div>
            <div className="muted" style={{ marginTop: 6, fontSize: 13.5 }}>
              Twice a day Claude searches the web for the latest report for each missing market and downloads the PDF
              directly. Broker pages block robots, but the PDF files themselves are usually public.
            </div>
          </div>
          <div>
            <div className="row"><Icon name="sources" size={17} style={{ color: 'var(--accent)' }} /><span style={{ fontWeight: 600 }}>Page scan</span><Chip tone="good" dot>On</Chip></div>
            <div className="muted" style={{ marginTop: 6, fontSize: 13.5 }}>
              Twice a day the saved broker pages are checked for new report links. Most refuse automated visitors — see{' '}
              <Link to="/sources" className="accent">Broker sources</Link> for what each one returned.
            </div>
          </div>
          <div>
            <div className="row"><Icon name="link" size={17} style={{ color: 'var(--accent)' }} /><span style={{ fontWeight: 600 }}>Email forwarding</span>
              {stats && stats.inbound_enabled ? <Chip tone="info" dot>Ready to connect</Chip> : <Chip dot>Needs a passcode</Chip>}</div>
            <div className="muted" style={{ marginTop: 6, fontSize: 13.5 }}>
              Subscribe to each broker's research emails, then have an automation (Zapier, Make, Power Automate) send
              new emails' attachments and text to:
              <div className="mono" style={{ fontSize: 11.5, margin: '8px 0', padding: '7px 9px', background: 'var(--surface-2)', borderRadius: 6, wordBreak: 'break-all', color: 'var(--text)' }}>
                {(API_BASE || window.location.origin)}/api/inbound?token=YOUR-PASSCODE
              </div>
              {stats && !stats.inbound_enabled && 'Set ADMIN_TOKEN on the backend first; that passcode is the token.'}
            </div>
          </div>
        </div>
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
