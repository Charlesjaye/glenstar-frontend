import { f, clr } from './format';

test('formatters render N/A for missing values', () => {
  for (const fn of Object.values(f)) {
    expect(fn(null)).toBe('N/A');
    expect(fn(undefined)).toBe('N/A');
  }
});

test('formatters render numbers', () => {
  expect(f.pct(7.25)).toBe('7.3%');
  expect(f.rent(9.1)).toBe('$9.10/SF');
  expect(f.msf(24.2)).toBe('24.2 MSF');
  expect(f.rg(3.1)).toBe('+3.1%');
  expect(f.rg(-0.8)).toBe('-0.8%');
  expect(f.rg(0)).toBe('+0.0%');
  expect(f.cost(82.6)).toBe('$83/SF');
});

test('vacancy colour bands', () => {
  expect(clr.vac(6.9)).toBe('var(--good)');
  expect(clr.vac(7)).toBe('var(--warn)');
  expect(clr.vac(10)).toBe('var(--danger)');
  expect(clr.vac(null)).toBe('var(--muted)');
});
