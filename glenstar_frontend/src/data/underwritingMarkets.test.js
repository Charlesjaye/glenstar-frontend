// Sanity checks on the hand-entered underwriting dataset. These catch typos
// (missing fields, a rent of 140 instead of 14.0, a vacancy entered as 0.07)
// before they reach someone's pro forma.
import { MARKETS, SIZES } from './underwritingMarkets';

const FIELDS = [
  'rent', 'cost', 'free_rent', 'ti_new', 'ti_renewal', 'lc', 'vacancy', 'rent_growth',
  'lease_term', 'renewal_prob', 'downtime', 'cap', 'opex', 'taxes', 'cap_reserve',
];

// Plausible bounds for US industrial; values outside these are almost certainly typos.
const BOUNDS = {
  rent: [2, 40], cost: [30, 250], free_rent: [0, 12], ti_new: [0, 40], ti_renewal: [0, 25],
  lc: [0, 10], vacancy: [0, 30], rent_growth: [-10, 15], lease_term: [12, 180],
  renewal_prob: [30, 100], downtime: [0, 36], cap: [3, 10], opex: [0, 5], taxes: [0, 5],
  cap_reserve: [0, 1],
};

const entries = Object.entries(MARKETS);

test('has markets and size segments', () => {
  expect(entries.length).toBeGreaterThan(0);
  expect(SIZES.length).toBe(6);
});

describe.each(entries)('%s', (name, m) => {
  test('has market-level fields', () => {
    expect(['Primary', 'Secondary', 'Avoid']).toContain(m.tier);
    expect(typeof m.region).toBe('string');
    expect(m.score).toBeGreaterThanOrEqual(0);
    expect(m.score).toBeLessThanOrEqual(100);
    expect(m.report_url).toMatch(/^https:\/\//);
    for (const k of ['vacancy', 'absorption', 'rent_growth', 'cap_rate', 'pipeline']) {
      expect(typeof m[k]).toBe('number');
    }
  });

  test('has every size segment with every field in a plausible range', () => {
    expect(Object.keys(m.by_size).sort()).toEqual([...SIZES].sort());
    for (const size of SIZES) {
      const d = m.by_size[size];
      for (const field of FIELDS) {
        const v = d[field];
        const [lo, hi] = BOUNDS[field];
        if (typeof v !== 'number' || v < lo || v > hi) {
          throw new Error(`${name} / ${size} / ${field} = ${v} (expected ${lo}–${hi})`);
        }
      }
    }
  });
});
