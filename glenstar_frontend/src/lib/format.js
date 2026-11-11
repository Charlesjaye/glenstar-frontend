// Shared number formatters and colour scales for market metrics.

export const f = {
  pct:  v => v != null ? `${Number(v).toFixed(1)}%`                      : 'N/A',
  rent: v => v != null ? `$${Number(v).toFixed(2)}/SF`                   : 'N/A',
  msf:  v => v != null ? `${Number(v).toFixed(1)} MSF`                   : 'N/A',
  rg:   v => v != null ? `${v >= 0 ? '+' : ''}${Number(v).toFixed(1)}%` : 'N/A',
  cost: v => v != null ? `$${Math.round(Number(v))}/SF`                  : 'N/A',
};

export const clr = {
  vac:  v => v == null ? 'var(--muted)' : v < 7  ? 'var(--good)' : v < 10 ? 'var(--warn)' : 'var(--danger)',
  rg:   v => v == null ? 'var(--muted)' : v >= 3 ? 'var(--good)' : v < 0  ? 'var(--danger)' : 'var(--muted)',
  abs:  v => v == null ? 'var(--muted)' : v >= 0 ? 'var(--good)' : 'var(--danger)',
  cost: v => v == null ? 'var(--muted)' : v < 70 ? 'var(--good)' : v > 120 ? 'var(--danger)' : 'var(--muted)',
  sc:   s => s >= 80 ? 'var(--orange)' : s >= 65 ? 'var(--info)' : 'var(--purple)',
};
