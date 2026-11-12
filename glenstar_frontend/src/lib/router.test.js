import { matchRoute } from './router';

const routes = [
  { id: 'overview', path: '/' },
  { id: 'markets', path: '/markets' },
  { id: 'reports', path: '/reports' },
  { id: 'report', path: '/reports/:id' },
];

test.each([
  ['/', 'overview', {}],
  ['/markets', 'markets', {}],
  ['/markets/', 'markets', {}],
  ['/reports', 'reports', {}],
  ['/reports/42', 'report', { id: '42' }],
  ['/does-not-exist', 'overview', {}],
  ['', 'overview', {}],
])('%s -> %s', (path, id, params) => {
  expect(matchRoute(path, routes)).toEqual({ id, params });
});
