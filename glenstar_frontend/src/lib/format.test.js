import { fmtSF, fmtPercent, fmtMoney, fmtValue, fmtValueText, fmtDelta, sortValue, toneClass, plural } from './format';

test('square feet: compact and exact forms', () => {
  expect(fmtSF(6412300)).toBe('6.41M SF');
  expect(fmtSF(24150000)).toBe('24.15M SF');
  expect(fmtSF(1023456789)).toBe('1.02B SF');
  expect(fmtSF(350000)).toBe('350K SF');
  expect(fmtSF(-412600)).toBe('−413K SF');
  expect(fmtSF(6412300, { exact: true })).toBe('6,412,300 SF');
  expect(fmtSF(null)).toBe('—');
});

test('percent and money', () => {
  expect(fmtPercent(7.2)).toBe('7.2%');
  expect(fmtPercent(-1.4)).toBe('−1.4%');
  expect(fmtMoney(9.85)).toBe('$9.85');
  expect(fmtMoney(13.8)).toBe('$13.80');
});

test('values carry the unit the broker used', () => {
  expect(fmtValue({ metric: 'asking_rent', unit: 'usd_psf', period: 'yr', value: 9.85 })).toEqual({ text: '$9.85', unit: '/SF/yr' });
  expect(fmtValueText({ metric: 'asking_rent', unit: 'usd_psf', period: 'mo', value: 1.42 })).toBe('$1.42/SF/mo');
  expect(fmtValueText({ metric: 'vacancy_rate', unit: 'percent', value: 7.2 })).toBe('7.2%');
  expect(fmtValueText(null)).toBe('—');
});

test('monthly rents sort by their annualised value', () => {
  expect(sortValue({ value: 1.42, annualized: 17.04 })).toBe(17.04);
  expect(sortValue({ value: 9.85 })).toBe(9.85);
  expect(sortValue(undefined)).toBeNull();
});

test('quarter-over-quarter change', () => {
  expect(fmtDelta({ unit: 'percent', value: 7.2, previous: { value: 7.4, quarter: 'Q2 2026' } }))
    .toEqual({ text: '▼ 20 bps', dir: -1, quarter: 'Q2 2026' });
  expect(fmtDelta({ unit: 'usd_psf', value: 9.85, previous: { value: 9.7, quarter: 'Q2 2026' } }).text).toBe('▲ $0.15');
  expect(fmtDelta({ unit: 'percent', value: 7.2 })).toBeNull();
});

test('tone and plurals', () => {
  expect(toneClass('vacancy_rate', { value: 4.9 })).toBe('good');
  expect(toneClass('vacancy_rate', { value: 12.9 })).toBe('bad');
  expect(toneClass('net_absorption_qtr', { value: -285400 })).toBe('bad');
  expect(plural(1, 'report')).toBe('1 report');
  expect(plural(3, 'report')).toBe('3 reports');
});
