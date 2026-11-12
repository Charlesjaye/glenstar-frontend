import React, { useEffect, useMemo, useState } from 'react';
import { del, documentFileUrl, getJSON, patchJSON, postJSON } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { fmtBytes, fmtDate, fmtValue, plural } from '../lib/format';
import { Quote } from '../components/Fig';
import {
  Banner, Chip, DocStatusChip, ErrorState, Icon, Link, Loading, Modal, ORIGIN_LABEL, Spinner, VALUE_STATUS, useApp,
} from '../components/ui';

const PUBLISHED = ['verified', 'confirmed', 'edited', 'manual'];
const BROKERS = ['JLL', 'CBRE', 'Cushman & Wakefield', 'Colliers', 'Newmark', 'Avison Young', 'Savills',
  'Lee & Associates', 'Transwestern', 'Kidder Mathews', 'NAI', 'Marcus & Millichap', 'CoStar', 'Other'];

function ValueRow({ v, active, onJump, onAction, busy }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(v.value));
  const status = VALUE_STATUS[v.status] || VALUE_STATUS.needs_review;
  const { text, unit } = fmtValue(v, { exact: true });
  const failures = v.checks.filter(c => !c.ok);
  const passes = v.checks.filter(c => c.ok && !c.skipped);

  // When the stored number disagrees with the figure printed in the report, offer the printed one.
  const printedNumber = (() => {
    if (v.unit === 'sf') return null;                       // square-foot figures may need unit scaling
    const m = (v.printed || '').match(/\d[\d,]*(?:\.\d+)?/);
    if (!m) return null;
    const n = Number(m[0].replace(/,/g, '')) * (/^\s*[-−–(]/.test(v.printed) ? -1 : 1);
    return Math.abs(n - v.value) > 1e-9 ? n : null;
  })();

  const save = () => {
    const n = Number(draft.replace(/,/g, ''));
    if (draft.trim() === '' || Number.isNaN(n)) return;
    onAction(v, { action: 'edit', value: n });
    setEditing(false);
  };

  return (
    <div id={`value-${v.id}`} className={`val ${v.status === 'needs_review' ? 'flag' : ''} ${active ? 'active' : ''}`}>
      <div className="val-top">
        <div>
          <span className="val-metric">{v.label}</span>
          {v.segment && <span className="muted"> · {v.segment}</span>}
          {v.note && <span className="dim"> · {v.note}</span>}
        </div>
        <Chip tone={status.tone} icon={status.icon} title={status.help}>{status.label}</Chip>
      </div>
      <div className="row" style={{ marginTop: 6, alignItems: 'baseline', gap: 12 }}>
        {editing ? (
          <>
            <input className="input sm num" style={{ width: 160 }} value={draft} autoFocus aria-label="Corrected value"
                   onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }} />
            <span className="dim" style={{ fontSize: 12 }}>{v.unit === 'sf' ? 'square feet' : v.unit === 'percent' ? '%' : `$ per SF${v.period ? ` / ${v.period}` : ''}`}</span>
            <button className="btn xs primary" onClick={save}>Save</button>
            <button className="btn xs ghost" onClick={() => setEditing(false)}>Cancel</button>
          </>
        ) : (
          <>
            <span className="val-num num">{text}<span className="dim" style={{ fontSize: 13, fontWeight: 400 }}>{unit}</span></span>
            {v.printed && <span className="muted" style={{ fontSize: 12.5 }}>printed as “{v.printed}”</span>}
            {v.original_value != null && <span className="dim" style={{ fontSize: 12.5 }}>AI read {v.original_value}</span>}
          </>
        )}
        <span className="grow" />
        {v.page && (
          <button className="btn xs" onClick={() => onJump(v)} title="Show this page in the report">
            <Icon name="file" />Page {v.page}
          </button>
        )}
      </div>
      <Quote quote={v.quote} printed={v.printed} className="val-quote" />
      <div className="checks">
        {failures.map((c, i) => (
          <div className="check fail" key={`f${i}`}><Icon name="alert" /><span>{c.detail}</span></div>
        ))}
        {passes.length > 0 && failures.length === 0 && (
          <div className="check ok"><Icon name="check" /><span>{passes.map(c => c.detail).join(' ')}</span></div>
        )}
      </div>
      {!editing && (
        <div className="val-actions">
          {v.status === 'needs_review' && printedNumber != null && (
            <button className="btn xs primary" disabled={busy} onClick={() => onAction(v, { action: 'edit', value: printedNumber })}>
              <Icon name="check" />Use the printed figure ({printedNumber})
            </button>
          )}
          {v.status === 'needs_review' && (
            <button className={`btn xs ${printedNumber == null ? 'primary' : ''}`} disabled={busy} onClick={() => onAction(v, { action: 'confirm' })}>
              <Icon name="check" />{printedNumber == null ? 'Correct — publish' : `Keep ${v.value}`}
            </button>
          )}
          <button className="btn xs" disabled={busy} onClick={() => { setDraft(String(v.value)); setEditing(true); }}>
            <Icon name="edit" />Fix the number
          </button>
          {v.status !== 'rejected'
            ? <button className="btn xs ghost danger" disabled={busy} onClick={() => onAction(v, { action: 'reject' })}><Icon name="ban" />Wrong — remove</button>
            : <button className="btn xs" disabled={busy} onClick={() => onAction(v, { action: 'confirm' })}>Restore</button>}
        </div>
      )}
    </div>
  );
}

function AddValue({ doc, metrics, onAdded }) {
  const { toast } = useApp();
  const [form, setForm] = useState({ metric: 'vacancy_rate', value: '', page: '', period: 'yr', market: '', segment: '' });
  const set = (k, val) => setForm(f => ({ ...f, [k]: val }));
  const submit = async e => {
    e.preventDefault();
    try {
      const updated = await postJSON(`/api/documents/${doc.id}/values`, {
        ...form, value: form.value.replace(/,/g, ''), page: form.page ? Number(form.page) : null,
      });
      onAdded(updated);
      setForm(f => ({ ...f, value: '', segment: '' }));
      toast('Figure added.', 'success');
    } catch (err) { toast(err.message, 'error'); }
  };
  const def = metrics.find(m => m.key === form.metric);
  return (
    <form className="card-body" onSubmit={submit} style={{ borderTop: '1px solid var(--line)' }}>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>Add a figure the AI missed</div>
      <div className="form-grid">
        <div className="field"><label>Metric</label>
          <select className="select sm" value={form.metric} onChange={e => set('metric', e.target.value)}>
            {metrics.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select></div>
        <div className="field"><label>Value {def && (def.unit === 'sf' ? '(square feet)' : def.unit === 'percent' ? '(%)' : '($ per SF)')}</label>
          <input className="input sm num" required value={form.value} onChange={e => set('value', e.target.value)} /></div>
        {form.metric === 'asking_rent' && (
          <div className="field"><label>Quoted per</label>
            <select className="select sm" value={form.period} onChange={e => set('period', e.target.value)}>
              <option value="yr">Year</option><option value="mo">Month</option>
            </select></div>
        )}
        {!doc.primary_market && (
          <div className="field"><label>Market</label>
            <input className="input sm" required value={form.market} onChange={e => set('market', e.target.value)} /></div>
        )}
        <div className="field"><label>Size band / type (optional)</label>
          <input className="input sm" value={form.segment} onChange={e => set('segment', e.target.value)} placeholder="Market total" /></div>
        <div className="field"><label>Page</label>
          <input className="input sm num" value={form.page} onChange={e => set('page', e.target.value)} inputMode="numeric" /></div>
      </div>
      <button className="btn sm" style={{ marginTop: 12 }}><Icon name="plus" />Add figure</button>
    </form>
  );
}

export default function ReportPage({ id, search }) {
  const { toast, navigate, reloadStats } = useApp();
  const { data: doc, error, loading, reload } = useLoad(() => getJSON(`/api/documents/${id}`), [id]);
  const meta = useLoad(() => getJSON('/api/markets'), []);
  const focus = useMemo(() => Number(new URLSearchParams(search).get('value')) || null, [search]);
  const [local, setLocal] = useState(null);
  const [page, setPage] = useState(null);
  const [active, setActive] = useState(focus);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editMeta, setEditMeta] = useState(false);
  const [adding, setAdding] = useState(false);
  const d = local && local.id === Number(id) ? local : doc;

  useEffect(() => { setLocal(null); setPage(null); setActive(focus); }, [id, focus]);

  const reading = d && (d.status === 'queued' || d.status === 'processing');
  useEffect(() => {
    if (!reading) return undefined;
    const t = setInterval(async () => { const fresh = await reload({ quiet: true }); if (fresh) setLocal(fresh); }, 2500);
    return () => clearInterval(t);
  }, [reading, reload]);

  // Jump to the figure the user came from (e.g. clicked "Open the report" on a number).
  useEffect(() => {
    if (!d || !focus) return;
    const v = d.values.find(x => x.id === focus);
    if (v) {
      if (v.page) setPage(v.page);
      const el = document.getElementById(`value-${focus}`);
      if (el) el.scrollIntoView({ block: 'center' });
    }
  }, [d && d.id, focus]);

  if (loading && !d) return <Loading rows={8} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const act = async fn => {
    setBusy(true);
    try { await fn(); reloadStats(); } catch (err) { toast(err.message, 'error'); }
    setBusy(false);
  };
  const onAction = (v, body) => act(async () => {
    const updated = await patchJSON(`/api/values/${v.id}`, body);
    const fresh = await getJSON(`/api/documents/${d.id}`);
    setLocal(fresh);
    if (body.action === 'reject') toast('Removed — it will not appear on the site.', 'info');
    else if (updated.status === 'edited') toast('Corrected and published.', 'success');
  });
  const confirmAll = () => act(async () => {
    setLocal(await postJSON(`/api/documents/${d.id}/confirm-all`));
    toast('All figures confirmed and published.', 'success');
  });
  const reread = () => act(async () => {
    setLocal(await postJSON(`/api/documents/${d.id}/reprocess`));
    toast('Reading the report again…', 'info');
  });
  const remove = () => act(async () => {
    await del(`/api/documents/${d.id}`);
    toast('Report deleted.', 'info');
    navigate('/reports');
  });
  const jump = v => { setPage(v.page); setActive(v.id); };

  const counts = {
    all: d.values.length,
    needs_review: d.values.filter(v => v.status === 'needs_review').length,
    published: d.values.filter(v => PUBLISHED.includes(v.status)).length,
    rejected: d.values.filter(v => v.status === 'rejected').length,
  };
  const shown = d.values.filter(v => filter === 'all' || (filter === 'published' ? PUBLISHED.includes(v.status) : v.status === filter));
  const groups = [];
  for (const v of shown) {
    const last = groups[groups.length - 1];
    if (last && last.market === v.market) last.values.push(v); else groups.push({ market: v.market, values: [v] });
  }
  const isPdf = d.mime === 'application/pdf';

  return (
    <div className="stack">
      <div className="spread" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="grow">
          <Link to="/reports" className="row muted" style={{ textDecoration: 'none', fontSize: 13, marginBottom: 8 }}>
            <Icon name="back" size={14} />Report library
          </Link>
          <div className="page-title" style={{ fontSize: 21 }}>{d.title || d.filename}</div>
          <div className="row wrap" style={{ marginTop: 8 }}>
            <DocStatusChip status={d.status} />
            {d.source && <Chip tone="outline">{d.source}</Chip>}
            {d.quarter && <Chip tone="outline">{d.quarter}</Chip>}
            {d.primary_market && <Chip tone="outline">{d.primary_market}</Chip>}
            {!d.primary_market && d.markets.length > 0 && <Chip tone="outline">{plural(d.markets.length, 'market')}</Chip>}
            <span className="dim" style={{ fontSize: 12.5 }}>
              {ORIGIN_LABEL[d.origin] || d.origin} {fmtDate(d.created_at)} · {plural(d.page_count, 'page')} · {fmtBytes(d.size)}
            </span>
          </div>
        </div>
        <div className="row wrap">
          <button className="btn sm" onClick={() => setEditMeta(true)} disabled={reading}><Icon name="edit" />Edit details</button>
          <button className="btn sm" onClick={reread} disabled={busy || reading}><Icon name="refresh" />Read again</button>
          {d.report_url && <a className="btn sm" href={d.report_url} target="_blank" rel="noreferrer"><Icon name="external" />Original</a>}
          <button className="btn sm ghost danger" onClick={() => setConfirmDelete(true)} disabled={busy}><Icon name="trash" />Delete</button>
        </div>
      </div>

      {reading && <Banner tone="accent" icon="clock" title="Reading this report…">Every figure is being matched to the text and re-checked. This usually takes under two minutes.</Banner>}
      {(d.status === 'failed' || d.status === 'rejected') && (
        <Banner tone="bad" title={d.status === 'failed' ? 'This report could not be read' : 'This report is not being used'}>{d.error}</Banner>
      )}
      {!d.has_text && isPdf && d.values.length > 0 && (
        <Banner tone="warn" title="This PDF is a scan">It has no selectable text, so figures cannot be matched to the page automatically. Check each one against the PDF before publishing.</Banner>
      )}
      {counts.needs_review > 0 && (
        <Banner tone="warn" title={`${plural(counts.needs_review, 'figure')} could not be confirmed automatically`}
                action={<button className="btn sm primary" onClick={confirmAll} disabled={busy}>{busy ? <Spinner /> : <Icon name="check" />}I've checked them all — publish</button>}>
          They are held back from the site. Compare each with the PDF, then confirm, fix or remove it.
        </Banner>
      )}

      <div className="review">
        <div>
          <div className="pdf-pane">
            {isPdf
              ? <iframe key={page || 'start'} title="Report PDF" src={documentFileUrl(d.id, page)} />
              : <iframe title="Report text" src={documentFileUrl(d.id)} />}
          </div>
          <div className="spread dim" style={{ fontSize: 12.5, marginTop: 8 }}>
            <span>{page ? `Showing page ${page}` : 'The original document, exactly as added'}</span>
            <a className="accent" href={documentFileUrl(d.id, page)} target="_blank" rel="noreferrer">Open in a new tab ↗</a>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Figures read from this report</div>
              <div className="card-sub">{counts.published} published{counts.needs_review ? ` · ${counts.needs_review} to check` : ''}{counts.rejected ? ` · ${counts.rejected} removed` : ''}</div>
            </div>
            <div className="seg">
              {[['all', 'All'], ['needs_review', 'To check'], ['published', 'Published'], ['rejected', 'Removed']]
                .filter(([k]) => k === 'all' || counts[k] > 0)
                .map(([k, label]) => (
                  <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{label}<span className="count">{counts[k]}</span></button>
                ))}
            </div>
          </div>
          {d.values.length === 0 && !reading && (
            <div className="card-body muted">No figures were read from this report.</div>
          )}
          {groups.map(g => (
            <div key={g.market}>
              {(groups.length > 1 || !d.primary_market) && (
                <div className="eyebrow" style={{ padding: '12px 18px 4px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>{g.market}</div>
              )}
              {g.values.map(v => <ValueRow key={v.id} v={v} active={active === v.id} onJump={jump} onAction={onAction} busy={busy} />)}
            </div>
          ))}
          {d.quarter && !reading && (
            adding
              ? <AddValue doc={d} metrics={meta.data ? meta.data.metrics : []} onAdded={setLocal} />
              : <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)' }}>
                  <button className="btn sm ghost" onClick={() => setAdding(true)}><Icon name="plus" />Add a figure the AI missed</button>
                </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <Modal title="Delete this report?" onClose={() => setConfirmDelete(false)}>
          <p className="muted">The PDF and every figure read from it will be removed from the site. This cannot be undone.</p>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn danger" onClick={remove} disabled={busy}>Delete report</button>
          </div>
        </Modal>
      )}
      {editMeta && <EditDetails doc={d} onClose={() => setEditMeta(false)} onSaved={fresh => { setLocal(fresh); reloadStats(); }} />}
    </div>
  );
}

function EditDetails({ doc, onClose, onSaved }) {
  const { toast } = useApp();
  const [source, setSource] = useState(doc.source || '');
  const [quarter, setQuarter] = useState(doc.quarter || '');
  const [market, setMarket] = useState(doc.primary_market || '');
  const [saving, setSaving] = useState(false);
  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {};
      if (source && source !== doc.source) body.source = source;
      if (quarter && quarter !== doc.quarter) body.quarter = quarter;
      if (market && market !== doc.primary_market) body.market = market;
      let fresh = Object.keys(body).length ? await patchJSON(`/api/documents/${doc.id}`, body) : doc;
      // A report rejected for having no quarter is read again once one is supplied.
      if (body.quarter && doc.status === 'rejected') fresh = await postJSON(`/api/documents/${doc.id}/reprocess`);
      onSaved(fresh);
      toast('Report details updated.', 'success');
      onClose();
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };
  return (
    <Modal title="Report details" onClose={onClose}>
      <p className="muted" style={{ marginBottom: 16 }}>These are read from the report. Correct them here if the AI got one wrong.</p>
      <form className="stack" style={{ gap: 12 }} onSubmit={save}>
        <div className="field"><label>Brokerage</label>
          <select className="select" value={source} onChange={e => setSource(e.target.value)}>
            <option value="">—</option>{BROKERS.map(b => <option key={b}>{b}</option>)}
          </select></div>
        <div className="field"><label>Quarter</label>
          <input className="input" value={quarter} onChange={e => setQuarter(e.target.value)} placeholder="Q3 2026" /></div>
        {doc.scope !== 'multi_market' && (
          <div className="field"><label>Market</label>
            <input className="input" value={market} onChange={e => setMarket(e.target.value)} placeholder="Dallas-Fort Worth" /></div>
        )}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={saving}>{saving && <Spinner />}Save</button>
        </div>
      </form>
    </Modal>
  );
}
