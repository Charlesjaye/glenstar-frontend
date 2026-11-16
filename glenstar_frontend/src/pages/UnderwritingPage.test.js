import { resolveCell } from './UnderwritingPage';

const broker = { sheet_value: 10.6 };

test('your assumption wins, then the broker figure, then the estimate', () => {
  expect(resolveCell({ assumption: { value: 11 }, broker, estimate: 9 }, true)).toEqual({ source: 'assumption', value: 11 });
  expect(resolveCell({ assumption: null, broker, estimate: 9 }, true)).toEqual({ source: 'broker', value: 10.6 });
  expect(resolveCell({ assumption: null, broker: null, estimate: 9 }, true)).toEqual({ source: 'estimate', value: 9 });
});

test('unverified estimates are never used when switched off', () => {
  expect(resolveCell({ assumption: null, broker: null, estimate: 9 }, false)).toEqual({ source: null, value: null });
  expect(resolveCell({ assumption: null, broker: null, estimate: null }, true)).toEqual({ source: null, value: null });
});
