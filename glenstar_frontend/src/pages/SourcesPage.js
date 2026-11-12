import React, { useEffect, useMemo, useState } from 'react';
import { getJSON, patchJSON, postJSON } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { timeAgo } from '../lib/format';
import { Banner, Chip, ErrorState, Icon, Link, Loading, Spinner, useApp } from '../components/ui';

const RESULT = {
  new_report:      { tone: 'good', label: 'Report found' },
  no_change:       { tone: '',     label: 'Nothing new' },
  blocked:         { tone: 'bad',  label: 'Blocked' },
  not_found:       { tone: 'warn', label: 'Dead link' },
  no_report_found: { tone: '',     label: 'No report on page' },
  error:           { tone: 'warn', label: 'Unreachable' },
  needs_api_key:   { tone: 'warn', label: 'AI not set up' },
};

export default function SourcesPage() {
  const { toast, reloadStats } = useApp();
  const targets = useLoad(() => getJSON('/api/scan/targets'), []);
  const status = useLoad(() => getJSON('/api/scan/status'), []);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [starting, setStarting] = useState(false);

  const run = status.data && status.data.run;
  const running = run && run.status === 'running';

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => { status.reload({ quiet: true }); targets.reload({ quiet: true }); }, 3000);
    return () => clearInterval(id);
  }, [running, status, targets]);

  // When a scan finishes, refresh the headline numbers.
  useEffect(() => { if (run && run.status === 'done') reloadStats(); }, [run && run.status, run && run.id]);

  const list = useMemo(() => targets.data || [], [targets.data]);
  const tally = useMemo(() => {
    const t = { all: list.length, blocked: 0, problem: 0, ok: 0, unchecked: 0 };
    for (const x of list) {
      if (!x.result) t.unchecked += 1;
      else if (x.result === 'blocked') t.blocked += 1;
      else if (['not_found', 'error', 'needs_api_key'].includes(x.result)) t.problem += 1;
      else t.ok += 1;
    }
    return t;
  }, [list]);

  if (targets.loading && !targets.data) return <Loading rows={8} />;
  if (targets.error) return <ErrorState message={targets.error} onRetry={targets.reload} />;

  const scan = async () => {
    setStarting(true);
    try {
      const res = await postJSON('/api/scan');
      toast(res.started ? 'Scan started — checking every broker page.' : 'A scan is already running.', 'info');
      await status.reload({ quiet: true });
    } catch (err) { toast(err.message, 'error'); }
    setStarting(false);
  };
  const saveUrl = async t => {
    try {
      await patchJSON(`/api/scan/targets/${t.id}`, { url: draft });
      setEditing(null);
      targets.reload({ quiet: true });
      toast('Link updated. It will be checked on the next scan.', 'success');
    } catch (err) { toast(err.message, 'error'); }
  };

  const shown = list.filter(t => filter === 'all'
    || (filter === 'blocked' && t.result === 'blocked')
    || (filter === 'problem' && ['not_found', 'error', 'needs_api_key'].includes(t.result))
    || (filter === 'ok' && ['new_report', 'no_change', 'no_report_found'].includes(t.result))
    || (filter === 'unchecked' && !t.result));

  return (
    <div className="stack">
      <div className="card card-body">
        <div className="spread" style={{ flexWrap: 'wrap' }}>
          <div>
            <div className="card-title">Automatic scan</div>
            <div className="card-sub">
              Twice a day ({status.data ? status.data.schedule : '…'}) the site visits each broker page below and looks for a new report.
              {run && !running && <> Last scan {timeAgo(run.finished_at || run.started_at)}: {run.new_documents} new, {run.blocked} blocked.</>}
              {!run && ' No scan has run yet.'}
            </div>
          </div>
          <button className="btn primary" onClick={scan} disabled={starting || running}>
            {starting || running ? <Spinner /> : <Icon name="refresh" />}{running ? `Scanning… ${run.checked}/${run.total}` : 'Scan now'}
          </button>
        </div>
        {running && (
          <div className="meter" style={{ marginTop: 14 }}><span className="m-good" style={{ width: `${(100 * run.checked) / Math.max(1, run.total)}%`, background: 'var(--accent)' }} /></div>
        )}
      </div>

      {tally.blocked > 0 && (
        <Banner tone="info" title={`${tally.blocked} broker pages block automated access`}
                action={<Link to="/data" className="btn sm primary">Add reports</Link>}>
          Most brokerage sites refuse automated visitors. When that happens nothing is guessed — the market is listed
          under “needs a report” and you can download the PDF from the broker page and drop it in.
        </Banner>
      )}

      <div className="card">
        <div className="card-head">
          <div className="card-title">Broker pages being watched</div>
          <div className="seg">
            {[['all', 'All'], ['blocked', 'Blocked'], ['problem', 'Problems'], ['ok', 'Reachable'], ['unchecked', 'Not checked']]
              .filter(([k]) => k === 'all' || tally[k] > 0)
              .map(([k, label]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{label}<span className="count">{tally[k]}</span></button>)}
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th className="l">Broker</th><th className="l">Market</th><th className="l">Last result</th><th className="l">Page</th><th className="l">Checked</th><th /></tr></thead>
            <tbody>
              {shown.map(t => {
                const r = RESULT[t.result];
                return (
                  <tr key={t.id}>
                    <td className="l strong">{t.source}</td>
                    <td className="l">{t.market}</td>
                    <td className="l wrap" style={{ maxWidth: 300 }}>
                      {r ? <Chip tone={r.tone} dot title={t.detail}>{r.label}</Chip> : <Chip>Not checked yet</Chip>}
                      {t.result === 'new_report' && t.last_document_id && (
                        <Link to={`/reports/${t.last_document_id}`} className="accent" style={{ marginLeft: 8, fontSize: 12.5 }}>Open report</Link>
                      )}
                      {t.detail && ['not_found', 'error'].includes(t.result) && <div className="dim" style={{ fontSize: 12, marginTop: 3 }}>{t.detail}</div>}
                    </td>
                    <td className="l" style={{ maxWidth: 340 }}>
                      {editing === t.id ? (
                        <div className="row">
                          <input className="input sm grow" value={draft} onChange={e => setDraft(e.target.value)} autoFocus aria-label="Page address"
                                 onKeyDown={e => { if (e.key === 'Enter') saveUrl(t); if (e.key === 'Escape') setEditing(null); }} />
                          <button className="btn xs primary" onClick={() => saveUrl(t)}>Save</button>
                        </div>
                      ) : (
                        <a className="muted truncate" style={{ display: 'block', fontSize: 12.5 }} href={t.url} target="_blank" rel="noreferrer">
                          {t.url.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      )}
                    </td>
                    <td className="l muted" style={{ fontSize: 12.5 }}>{t.last_checked ? timeAgo(t.last_checked) : '—'}</td>
                    <td>
                      {editing !== t.id && (
                        <button className="btn xs ghost" onClick={() => { setEditing(t.id); setDraft(t.url); }} title="Change the page address"><Icon name="edit" /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
