import React, { useRef, useState, useCallback } from 'react';
import { fmtValue, fmtValueText, fmtDelta } from '../lib/format';
import { Popover, Chip, Icon, Link, VALUE_STATUS } from './ui';

// Highlight the printed figure inside its quote.
export function Quote({ quote, printed, className = 'pop-quote' }) {
  if (!quote) return null;
  const token = ((printed || '').match(/\d[\d,]*(?:\.\d+)?/) || [])[0];
  const at = token ? quote.indexOf(token) : -1;
  return (
    <div className={className}>
      {at < 0 ? `“${quote}”` : (
        <>“{quote.slice(0, at)}<mark>{token}</mark>{quote.slice(at + token.length)}”</>
      )}
    </div>
  );
}

// A figure from a broker report. Click (or focus + Enter) to see exactly where it came from.
export default function Fig({ v, exact = false, showDelta = false, className = '' }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  if (!v || v.value == null) return <span className="na" title="Not published in the reports on file">—</span>;

  const { text, unit } = fmtValue(v, { exact });
  const status = VALUE_STATUS[v.status] || VALUE_STATUS.verified;
  const delta = showDelta ? fmtDelta(v) : null;

  return (
    <>
      <span
        ref={ref} className={`fig num ${open ? 'open' : ''} ${className}`} tabIndex={0} role="button"
        aria-label={`${fmtValueText(v, { exact: true })} — show source`}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); } }}
      >
        {text}{unit && <span className="unit">{unit}</span>}
      </span>
      {delta && (
        <span className="delta dim" title={`Change from ${delta.quarter} (same broker)`}>{delta.text}</span>
      )}
      {open && (
        <Popover anchor={ref.current} onClose={close}>
          <div onClick={e => e.stopPropagation()}>
            <div className="spread">
              <div>
                <div style={{ fontWeight: 600 }}>{v.doc.source} · {v.quarter}</div>
                <div className="dim" style={{ fontSize: 12 }}>{v.doc.title}</div>
              </div>
              <Chip tone={status.tone} icon={status.icon} title={status.help}>{status.label}</Chip>
            </div>
            <Quote quote={v.quote} printed={v.printed} />
            <div className="muted" style={{ fontSize: 12.5 }}>
              Printed as <strong className="num" style={{ color: 'var(--text)' }}>{v.printed || fmtValueText(v, { exact: true })}</strong>
              {v.page ? <> on page {v.page}</> : null}
              {v.unit === 'sf' && <> · {fmtValueText(v, { exact: true })}</>}
              {v.annualized != null && <> · {`$${v.annualized.toFixed(2)}/SF/yr annualised`}</>}
              {v.note ? <> · {v.note}</> : null}
            </div>
            <div style={{ marginTop: 12 }}>
              <Link to={`/reports/${v.doc.id}?value=${v.id}`} className="btn sm">
                <Icon name="file" />Open the report{v.page ? ` at page ${v.page}` : ''}
              </Link>
            </div>
          </div>
        </Popover>
      )}
    </>
  );
}
