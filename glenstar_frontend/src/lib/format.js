// Formatting for report figures. Values arrive in canonical units:
//   percent → 7.2      sf → 6412300      usd_psf → 9.85 (rents carry period yr|mo)
// Compact forms are for tables; the exact figure is always available in the
// source popover and detail views.

const DASH = '—';

export function fmtSF(value, { exact = false } = {}) {
  if (value == null) return DASH;
  if (exact) return `${Math.round(value).toLocaleString('en-US')} SF`;
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1e9) return `${sign}${trim(abs / 1e9, 2)}B SF`;
  if (abs >= 1e6) return `${sign}${trim(abs / 1e6, 2)}M SF`;
  if (abs >= 1e3) return `${sign}${trim(abs / 1e3, 0)}K SF`;
  return `${sign}${abs} SF`;
}

function trim(n, digits) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

export function fmtPercent(value) {
  if (value == null) return DASH;
  return `${value < 0 ? '−' : ''}${trim(Math.abs(value), 2)}%`;
}

export function fmtMoney(value) {
  if (value == null) return DASH;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Returns { text, unit } so the unit can be styled smaller.
export function fmtValue(v, opts = {}) {
  if (!v || v.value == null) return { text: DASH, unit: '' };
  if (v.unit === 'percent') return { text: fmtPercent(v.value), unit: '' };
  if (v.unit === 'sf') return { text: fmtSF(v.value, opts), unit: '' };
  if (v.metric === 'asking_rent') return { text: fmtMoney(v.value), unit: `/SF/${v.period || 'yr'}` };
  return { text: fmtMoney(v.value), unit: '/SF' };
}

export function fmtValueText(v, opts) {
  const { text, unit } = fmtValue(v, opts);
  return `${text}${unit}`;
}

// A number comparable across markets (monthly rents annualised for sorting only).
export function sortValue(v) {
  if (!v || v.value == null) return null;
  return v.annualized != null ? v.annualized : v.value;
}

// Quarter-over-quarter change against the same broker's previous report.
export function fmtDelta(v) {
  if (!v || !v.previous || v.previous.value == null) return null;
  const diff = v.value - v.previous.value;
  if (Math.abs(diff) < 1e-9) return { text: 'unchanged', dir: 0 };
  const arrow = diff > 0 ? '▲' : '▼';
  let text;
  if (v.unit === 'percent') text = `${arrow} ${trim(Math.abs(diff) * 100, 0)} bps`;
  else if (v.unit === 'sf') text = `${arrow} ${fmtSF(Math.abs(diff))}`;
  else text = `${arrow} ${fmtMoney(Math.abs(diff))}`;
  return { text, dir: Math.sign(diff), quarter: v.previous.quarter };
}

// For a metric, is a higher number good (1), bad (-1) or neutral (0) for a developer?
export const METRIC_TONE = {
  vacancy_rate: -1, availability_rate: -1, net_absorption_qtr: 1, net_absorption_ytd: 1,
  asking_rent: 1, rent_growth_yoy: 1, leasing_activity_qtr: 1, leasing_activity_ytd: 1,
};

export function toneClass(metric, v) {
  if (!v || v.value == null) return '';
  if (metric === 'vacancy_rate') return v.value < 5 ? 'good' : v.value >= 10 ? 'bad' : '';
  if (metric === 'net_absorption_qtr' || metric === 'net_absorption_ytd' || metric === 'rent_growth_yoy') {
    return v.value < 0 ? 'bad' : v.value > 0 ? 'good' : '';
  }
  return '';
}

export function fmtDate(iso, withTime = false) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return d.toLocaleString('en-US', withTime
    ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(iso) {
  if (!iso) return 'never';
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  const days = Math.floor(seconds / 86400);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export function fmtBytes(n) {
  if (!n) return '';
  return n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

export function plural(n, word, pluralWord) {
  return `${n} ${n === 1 ? word : (pluralWord || `${word}s`)}`;
}
