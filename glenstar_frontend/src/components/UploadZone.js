import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getJSON, postJSON, uploadFiles } from '../lib/api';
import { fmtBytes, plural } from '../lib/format';
import { DocStatusChip, Icon, Link, Spinner, useApp } from './ui';

const ACTIVE = new Set(['queued', 'processing']);

// One-line plain-English result for a finished document.
export function documentOutcome(doc) {
  if (!doc) return '';
  const c = doc.value_counts || {};
  const where = [doc.source, doc.markets && doc.markets.length === 1 ? doc.markets[0]
    : doc.markets && doc.markets.length > 1 ? `${doc.markets.length} markets` : null, doc.quarter]
    .filter(Boolean).join(' · ');
  if (doc.status === 'queued') return 'Waiting to be read…';
  if (doc.status === 'processing') return 'Reading the report and checking every figure against the text…';
  if (doc.status === 'failed' || doc.status === 'rejected') return doc.error || 'This report could not be used.';
  if (doc.status === 'needs_review') {
    return `${where} — ${plural(c.published || 0, 'figure')} published, ${c.needs_review} waiting for your check`;
  }
  return `${where} — ${plural(c.published || 0, 'figure')} published`;
}

// Drag-and-drop area plus a live list of what happened to each file.
export default function UploadZone({ onChange, compact = false }) {
  const { toast, reloadStats } = useApp();
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [items, setItems] = useState([]);       // {key, name, size, state: uploading|error|doc, error, doc, duplicate}
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const patch = useCallback((key, changes) => {
    setItems(list => list.map(it => (it.key === key ? { ...it, ...changes } : it)));
  }, []);

  const addFiles = useCallback(async fileList => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const pdfs = files.filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    const skipped = files.length - pdfs.length;
    if (skipped) toast(`${plural(skipped, 'file')} skipped — only PDF reports can be added.`, 'error');
    if (!pdfs.length) return;

    const stamp = Date.now();
    const fresh = pdfs.map((f, i) => ({ key: `${stamp}-${i}`, name: f.name, size: f.size, state: 'uploading' }));
    setItems(list => [...fresh, ...list]);

    // Upload one at a time so a single large file cannot fail the whole batch.
    for (let i = 0; i < pdfs.length; i += 1) {
      const key = fresh[i].key;
      try {
        const [result] = await uploadFiles([pdfs[i]]);
        if (result.ok) patch(key, { state: 'doc', doc: result.document, duplicate: result.duplicate });
        else patch(key, { state: 'error', error: result.error });
      } catch (err) {
        patch(key, { state: 'error', error: err.message });
      }
    }
    reloadStats();
    if (onChange) onChange();
  }, [toast, patch, reloadStats, onChange]);

  const addLink = async e => {
    e.preventDefault();
    const link = url.trim();
    if (!link) return;
    setFetching(true);
    try {
      const result = await postJSON('/api/documents/from-url', { url: link });
      setItems(list => [{ key: `${Date.now()}-link`, name: result.document.filename, size: result.document.size,
                          state: 'doc', doc: result.document, duplicate: result.duplicate }, ...list]);
      setUrl('');
      reloadStats();
      if (onChange) onChange();
    } catch (err) {
      toast(err.message, 'error');
    }
    setFetching(false);
  };

  // Poll documents that are still being read.
  useEffect(() => {
    const id = setInterval(async () => {
      const active = itemsRef.current.filter(it => it.state === 'doc' && ACTIVE.has(it.doc.status));
      if (!active.length) return;
      let finished = false;
      await Promise.all(active.map(async it => {
        try {
          const doc = await getJSON(`/api/documents/${it.doc.id}`);
          if (!ACTIVE.has(doc.status)) finished = true;
          patch(it.key, { doc });
        } catch { /* keep polling */ }
      }));
      if (finished) { reloadStats(); if (onChange) onChange(); }
    }, 2500);
    return () => clearInterval(id);
  }, [patch, reloadStats, onChange]);

  return (
    <div>
      <div
        className={`dropzone ${over ? 'over' : ''}`} role="button" tabIndex={0}
        style={compact ? { padding: '24px 20px' } : undefined}
        onClick={() => input.current && input.current.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current.click(); } }}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
      >
        <div className="dropzone-icon"><Icon name="upload" /></div>
        <div className="dropzone-title">{over ? 'Drop to add' : 'Drop broker report PDFs here'}</div>
        <div className="dropzone-text">
          or <u>choose files</u> — add as many as you like. The brokerage, market and quarter are read from each report.
        </div>
        <input ref={input} type="file" accept="application/pdf,.pdf" multiple hidden
               onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>

      <form className="row" style={{ marginTop: 12 }} onSubmit={addLink}>
        <Icon name="link" size={16} style={{ color: 'var(--text-3)' }} />
        <input className="input grow" value={url} onChange={e => setUrl(e.target.value)}
               placeholder="…or paste a direct link to a report PDF" aria-label="Link to a report PDF" />
        <button className="btn" disabled={fetching || !url.trim()}>{fetching ? <Spinner /> : null}Add from link</button>
      </form>

      {items.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          {items.map(it => {
            const doc = it.doc;
            const busy = it.state === 'uploading' || (doc && ACTIVE.has(doc.status));
            return (
              <div className="upload-item" key={it.key}>
                <div className="file-icon">{busy ? <Spinner /> : <Icon name="file" />}</div>
                <div className="grow">
                  <div className="row" style={{ gap: 8 }}>
                    <span className="truncate" style={{ fontWeight: 600 }}>{(doc && doc.title) || it.name}</span>
                    {it.duplicate && <span className="chip">Already on file</span>}
                  </div>
                  <div className={it.state === 'error' || (doc && (doc.status === 'failed' || doc.status === 'rejected')) ? 'bad' : 'muted'}
                       style={{ fontSize: 12.5, marginTop: 1 }}>
                    {it.state === 'uploading' && `Uploading… ${fmtBytes(it.size)}`}
                    {it.state === 'error' && it.error}
                    {it.state === 'doc' && documentOutcome(doc)}
                  </div>
                </div>
                {doc && <DocStatusChip status={doc.status} />}
                {doc && !ACTIVE.has(doc.status) && (
                  <Link to={`/reports/${doc.id}`} className={`btn sm ${doc.status === 'needs_review' ? 'primary' : ''}`}>
                    {doc.status === 'needs_review' ? 'Review' : 'Open'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
