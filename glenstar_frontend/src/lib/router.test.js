import { pageFromPath } from './router';

const routes = [
  { id: 'thesis', path: '/' },
  { id: 'markets', path: '/markets' },
  { id: 'underwriting', path: '/underwriting' },
];

test.each([
  ['/', 'thesis'],
  ['/markets', 'markets'],
  ['/markets/', 'markets'],
  ['/underwriting', 'underwriting'],
  ['/does-not-exist', 'thesis'],
  ['', 'thesis'],
])('%s -> %s', (path, expected) => {
  expect(pageFromPath(path, routes)).toBe(expected);
});
