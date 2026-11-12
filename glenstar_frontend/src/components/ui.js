import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ── App-wide context (navigation, live stats, toasts, market drawer) ─────────
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// ── Icons (stroke icons, 24×24 viewBox) ──────────────────────────────────────
const PATHS = {
  overview: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  markets: 'M3 3v18h18M7 15l4-5 4 3 5-7',
  underwriting: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  library: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V5a2 2 0 0 1 2-2h14v18H6.5A2.5 2.5 0 0 1 4 19.5z',
  sources: 'M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  check: 'M20 6 9 17l-5-5',
  checkCircle: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  x: 'M18 6 6 18M6 6l12 12',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
  chevron: 'M9 18l6-6-6-6',
  back: 'M19 12H5M12 19l-7-7 7-7',
  sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.8 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  copy: 'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  plus: 'M12 5v14M5 12h14',
  ban: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM4.9 4.9l14.2 14.2',
};

export function Icon({ name, size, style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
         strokeLinejoin="round" aria-hidden="true" style={size ? { width: size, height: size, ...style } : style}>
      <path d={PATHS[name] || ''} />
    </svg>
  );
}

// ── Small building blocks ────────────────────────────────────────────────────
export function Chip({ tone = '', icon, children, title, dot, pulse }) {
  return (
    <span className={`chip ${tone}`} title={title}>
      {dot && <span className={`dot ${pulse ? 'pulse' : ''}`} />}
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}

export function Banner({ tone = 'info', icon, title, children, action }) {
  const fallback = { warn: 'alert', bad: 'alert', info: 'info', accent: 'sparkles' }[tone] || 'info';
  return (
    <div className={`banner ${tone}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <Icon name={icon || fallback} />
      <div className="grow">
        {title && <div className="banner-title">{title}</div>}
        {children && <div className="banner-text">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon = 'file', title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} /></div>
      <div className="empty-title">{title}</div>
      {children && <div className="empty-text">{children}</div>}
      {action}
    </div>
  );
}

export function Loading({ label = 'Loading…', rows = 4 }) {
  return (
    <div className="card card-body" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 18, marginBottom: 14, width: `${92 - i * 11}%` }} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Banner tone="bad" title="Something went wrong"
            action={onRetry && <button className="btn sm" onClick={onRetry}><Icon name="refresh" />Try again</button>}>
      {message}
    </Banner>
  );
}

export function Spinner() { return <span className="spinner" role="status" aria-label="Working" />; }

// In-app link that keeps open-in-new-tab working.
export function Link({ to, className, children, ...rest }) {
  const { navigate } = useApp();
  return (
    <a href={to} className={className} {...rest}
       onClick={e => {
         if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
         e.preventDefault();
         navigate(to);
       }}>
      {children}
    </a>
  );
}

// ── Popover anchored to an element, rendered in a portal so it is never clipped ─
export function Popover({ anchor, onClose, children }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const a = anchor.getBoundingClientRect();
    const p = ref.current.getBoundingClientRect();
    let left = a.left + a.width / 2 - p.width / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - p.width - 12));
    let top = a.bottom + 8;
    if (top + p.height > window.innerHeight - 12) top = Math.max(12, a.top - p.height - 8);
    setPos({ top, left });
  }, [anchor, children]);

  useEffect(() => {
    const onDown = e => {
      if (ref.current && !ref.current.contains(e.target) && !(anchor && anchor.contains(e.target))) onClose();
    };
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    const onScroll = e => { if (!(ref.current && ref.current.contains(e.target))) onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onClose);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div className="pop" ref={ref} style={pos} role="dialog">{children}</div>,
    document.body,
  );
}

export function Drawer({ title, subtitle, onClose, children, actions }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Details'}>
        <div className="drawer-head">
          <div className="grow">
            <div className="page-title">{title}</div>
            {subtitle && <div className="page-sub">{subtitle}</div>}
          </div>
          {actions}
          <button className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </>,
    document.body,
  );
}

export function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <>
      <div className="scrim" style={{ zIndex: 50 }} onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </>,
    document.body,
  );
}

// ── Toasts ───────────────────────────────────────────────────────────────────
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), type === 'error' ? 8000 : 4500);
  }, []);
  const view = toasts.length ? createPortal(
    <div className="toasts" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <Icon name={t.type === 'success' ? 'checkCircle' : t.type === 'error' ? 'alert' : 'info'} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>, document.body) : null;
  return [push, view];
}

// ── Status vocabulary shared across pages ────────────────────────────────────
export const VALUE_STATUS = {
  verified:     { label: 'Verified',        tone: 'good', icon: 'shield', help: 'Matched to the report text automatically and confirmed by a second AI read.' },
  confirmed:    { label: 'Confirmed by you', tone: 'good', icon: 'check',  help: 'A person checked this against the report and confirmed it.' },
  edited:       { label: 'Corrected by you', tone: 'info', icon: 'edit',   help: 'A person corrected this value after checking the report.' },
  manual:       { label: 'Entered by you',  tone: 'info', icon: 'edit',   help: 'A person added this figure from the report.' },
  needs_review: { label: 'Needs review',    tone: 'warn', icon: 'alert',  help: 'Not shown on the site until someone checks it against the report.' },
  rejected:     { label: 'Rejected',        tone: 'bad',  icon: 'ban',    help: 'Marked as wrong; not shown on the site.' },
};

export const DOC_STATUS = {
  queued:       { label: 'Waiting',       tone: 'info', pulse: true },
  processing:   { label: 'Reading…',      tone: 'accent', pulse: true },
  ready:        { label: 'Published',     tone: 'good' },
  needs_review: { label: 'Needs review',  tone: 'warn' },
  failed:       { label: 'Could not read', tone: 'bad' },
  rejected:     { label: 'Not used',      tone: 'bad' },
};

export const ORIGIN_LABEL = { upload: 'Uploaded', link: 'From link', scan: 'Found by scan', search: 'Found by search', email: 'From email' };

export const DIRECTION = {
  improving: { label: 'Improving', tone: 'good', arrow: '↗' },
  mixed:     { label: 'Mixed',     tone: 'warn', arrow: '→' },
  stable:    { label: 'Stable',    tone: 'info', arrow: '→' },
  weakening: { label: 'Weakening', tone: 'bad',  arrow: '↘' },
  unknown:   { label: 'No trend yet', tone: '', arrow: '·' },
  unclear:   { label: 'Unclear',   tone: '',     arrow: '·' },
};

export function DirectionChip({ direction, title }) {
  const d = DIRECTION[direction] || DIRECTION.unknown;
  return <span className={`chip ${d.tone}`} title={title}>{d.arrow} {d.label}</span>;
}

export function DocStatusChip({ status }) {
  const s = DOC_STATUS[status] || { label: status, tone: '' };
  return <Chip tone={s.tone} dot pulse={s.pulse}>{s.label}</Chip>;
}

export function QuarterChip({ quarter, behind }) {
  if (!quarter) return <Chip>No data</Chip>;
  if (!behind) return <Chip tone="good" title="This is the latest published quarter">{quarter}</Chip>;
  return (
    <Chip tone="warn" icon="clock"
          title={`${behind} quarter${behind > 1 ? 's' : ''} behind the latest published quarter — add a newer report`}>
      {quarter}
    </Chip>
  );
}
