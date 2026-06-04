import React, { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ALL MARKET DATA — 35 markets with confirmed Q1 2026 quarterly reports
// Sources: JLL Market Dynamics, CBRE 2026 Outlook, C&W MarketBeat Q1 2026,
//          Avison Young Q1 2026, Newmark Q1 2026, Colliers Q1 2026
// Only markets where at least one major brokerage publishes a quarterly report
// with sufficient data to populate underwriting assumptions.
// ─────────────────────────────────────────────────────────────────────────────

const MARKETS = {
  // ── PRIMARY TARGETS ────────────────────────────────────────────────────────
  "Dallas-Fort Worth": {
    region: "Texas", tier: "Primary", score: 94,
    source: "JLL Q1 2026 / Newmark Q1 2026 / Colliers Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/dallas-fort-worth-industrial",
    vacancy: 7.2, absorption: 24.2, rent_growth: 3.1, cap_rate: 5.4, pipeline: 29.6,
    note: "Nation's #1 industrial transaction market. Small-bay at 4.8% vacancy — functionally full. Tariff-driven inland supply chain shift is structural tailwind.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 14.20, cost: 105, free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 4.8,  rent_growth: 3.2, lease_term: 60, renewal_prob: 75, downtime: 7,  cap: 5.4, opex: 0.50, taxes: 1.00, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 12.40, cost: 92,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 5.8,  rent_growth: 3.1, lease_term: 62, renewal_prob: 75, downtime: 7,  cap: 5.4, opex: 0.50, taxes: 1.00, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 10.80, cost: 82,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 6.1,  rent_growth: 3.0, lease_term: 62, renewal_prob: 75, downtime: 7,  cap: 5.4, opex: 0.50, taxes: 1.00, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 9.10,  cost: 82,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 7.4,  rent_growth: 2.8, lease_term: 65, renewal_prob: 72, downtime: 8,  cap: 5.4, opex: 0.50, taxes: 1.00, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 7.80,  cost: 78,  free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 8.2,  rent_growth: 2.5, lease_term: 65, renewal_prob: 72, downtime: 9,  cap: 5.4, opex: 0.50, taxes: 1.00, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 6.40,  cost: 72,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 9.1,  rent_growth: 2.2, lease_term: 72, renewal_prob: 70, downtime: 10, cap: 5.4, opex: 0.50, taxes: 1.00, cap_reserve: 0.10 },
    }
  },
  "Indianapolis": {
    region: "Midwest", tier: "Primary", score: 89,
    source: "CBRE Q1 2026 / Avison Young Q1 2026 / JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/indianapolis-industrial",
    vacancy: 7.9, absorption: 8.4, rent_growth: 4.2, cap_rate: 5.8, pipeline: 8.5,
    note: "Fastest vacancy improvement nationally (down 180 bps YOY). Lowest construction costs of any Tier 1 market. CBRE #1 manufacturing reshoring target.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 9.40,  cost: 72,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 5.2,  rent_growth: 4.8, lease_term: 60, renewal_prob: 75, downtime: 8,  cap: 5.8, opex: 0.45, taxes: 0.90, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 8.20,  cost: 65,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 5.8,  rent_growth: 4.5, lease_term: 62, renewal_prob: 75, downtime: 8,  cap: 5.8, opex: 0.45, taxes: 0.90, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 7.20,  cost: 58,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 6.8,  rent_growth: 4.2, lease_term: 62, renewal_prob: 75, downtime: 9,  cap: 5.8, opex: 0.45, taxes: 0.90, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 5.80,  cost: 58,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 7.9,  rent_growth: 3.8, lease_term: 65, renewal_prob: 72, downtime: 9,  cap: 5.8, opex: 0.45, taxes: 0.90, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 4.90,  cost: 54,  free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 8.6,  rent_growth: 3.5, lease_term: 65, renewal_prob: 72, downtime: 10, cap: 5.8, opex: 0.45, taxes: 0.90, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 4.20,  cost: 50,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 10.2, rent_growth: 3.2, lease_term: 72, renewal_prob: 70, downtime: 11, cap: 5.8, opex: 0.45, taxes: 0.90, cap_reserve: 0.10 },
    }
  },
  "Nashville": {
    region: "Southeast", tier: "Primary", score: 87,
    source: "JLL Q1 2026 / C&W Q1 2026 / Colliers Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/nashville-industrial",
    vacancy: 5.8, absorption: 6.2, rent_growth: 5.1, cap_rate: 5.6, pipeline: 6.5,
    note: "Small-bay at 3.4% vacancy — functionally zero. 5.1% rent growth strongest large Southeast market. Healthcare, auto, and 3PL tenant base.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 13.20, cost: 80,  free_rent: 1, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 3.4,  rent_growth: 5.5, lease_term: 60, renewal_prob: 78, downtime: 6,  cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 11.40, cost: 72,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 4.2,  rent_growth: 5.2, lease_term: 62, renewal_prob: 78, downtime: 7,  cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 9.80,  cost: 65,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 4.8,  rent_growth: 5.0, lease_term: 65, renewal_prob: 78, downtime: 7,  cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 7.60,  cost: 64,  free_rent: 2, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 6.2,  rent_growth: 4.5, lease_term: 65, renewal_prob: 75, downtime: 8,  cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 6.40,  cost: 60,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 7.1,  rent_growth: 4.0, lease_term: 65, renewal_prob: 72, downtime: 8,  cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 5.80,  cost: 56,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 8.4,  rent_growth: 3.5, lease_term: 72, renewal_prob: 70, downtime: 10, cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
    }
  },
  "Savannah": {
    region: "Southeast", tier: "Primary", score: 82,
    source: "C&W Q1 2026 / Avison Young Q1 2026 / JLL Q1 2026",
    report_url: "https://www.cushmanwakefield.com/en/united-states/insights/us-marketbeats/savannah-marketbeats",
    vacancy: 6.2, absorption: 5.1, rent_growth: 6.2, cap_rate: 5.7, pipeline: 5.8,
    note: "Highest rent growth nationally at 6.2%. Port of Savannah is 4th-busiest in US — structural import distribution demand. $58/SF construction cost tied for lowest nationally.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 11.40, cost: 72,  free_rent: 1, ti_new: 8,  ti_renewal: 4, lc: 7.0, vacancy: 4.1,  rent_growth: 6.5, lease_term: 60, renewal_prob: 75, downtime: 7,  cap: 5.7, opex: 0.44, taxes: 0.85, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 9.80,  cost: 65,  free_rent: 2, ti_new: 8,  ti_renewal: 4, lc: 7.0, vacancy: 4.8,  rent_growth: 6.2, lease_term: 60, renewal_prob: 75, downtime: 7,  cap: 5.7, opex: 0.44, taxes: 0.85, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 8.60,  cost: 58,  free_rent: 2, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 5.4,  rent_growth: 6.0, lease_term: 60, renewal_prob: 75, downtime: 8,  cap: 5.7, opex: 0.44, taxes: 0.85, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 7.20,  cost: 58,  free_rent: 2, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 6.8,  rent_growth: 5.8, lease_term: 62, renewal_prob: 72, downtime: 8,  cap: 5.7, opex: 0.44, taxes: 0.85, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 6.10,  cost: 54,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 7.2,  rent_growth: 5.5, lease_term: 65, renewal_prob: 72, downtime: 9,  cap: 5.7, opex: 0.44, taxes: 0.85, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 5.60,  cost: 50,  free_rent: 3, ti_new: 6,  ti_renewal: 3, lc: 6.0, vacancy: 8.1,  rent_growth: 5.0, lease_term: 72, renewal_prob: 70, downtime: 10, cap: 5.7, opex: 0.44, taxes: 0.85, cap_reserve: 0.10 },
    }
  },
  "Philadelphia": {
    region: "Mid-Atlantic", tier: "Primary", score: 84,
    source: "CBRE Q1 2026 / Newmark Q1 2026 / JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/philadelphia-industrial",
    vacancy: 8.1, absorption: 7.6, rent_growth: 5.8, cap_rate: 5.2, pipeline: 4.7,
    note: "Only 4.7 MSF in pipeline — tightest supply constraint of any gateway market. 5.8% rent growth. Land-constrained market means any new supply commands immediate pricing premium.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 15.40, cost: 108, free_rent: 2, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 5.6,  rent_growth: 6.0, lease_term: 62, renewal_prob: 78, downtime: 8,  cap: 5.2, opex: 0.55, taxes: 1.50, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 13.40, cost: 100, free_rent: 2, ti_new: 11, ti_renewal: 5, lc: 7.0, vacancy: 6.2,  rent_growth: 5.8, lease_term: 62, renewal_prob: 78, downtime: 9,  cap: 5.2, opex: 0.55, taxes: 1.50, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 11.60, cost: 90,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 7.2,  rent_growth: 5.8, lease_term: 65, renewal_prob: 78, downtime: 9,  cap: 5.2, opex: 0.55, taxes: 1.50, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 9.40,  cost: 88,  free_rent: 3, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 8.4,  rent_growth: 5.5, lease_term: 65, renewal_prob: 75, downtime: 9,  cap: 5.2, opex: 0.55, taxes: 1.50, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 8.10,  cost: 84,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 9.2,  rent_growth: 5.0, lease_term: 65, renewal_prob: 72, downtime: 10, cap: 5.2, opex: 0.55, taxes: 1.50, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 7.20,  cost: 78,  free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 10.1, rent_growth: 4.5, lease_term: 72, renewal_prob: 70, downtime: 11, cap: 5.2, opex: 0.55, taxes: 1.50, cap_reserve: 0.10 },
    }
  },
  "Charlotte": {
    region: "Southeast", tier: "Primary", score: 79,
    source: "JLL Q1 2026 / Avison Young Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/charlotte-industrial",
    vacancy: 7.4, absorption: 7.8, rent_growth: 4.4, cap_rate: 5.5, pipeline: 9.2,
    note: "Strong absorption with competitive costs. 9.2 MSF pipeline needs monitoring — focus on sub-250K SF where vacancy is 4.9-6.4%. Corporate relocations from Northeast driving demand.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 12.40, cost: 78,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 4.9,  rent_growth: 4.8, lease_term: 60, renewal_prob: 75, downtime: 7,  cap: 5.5, opex: 0.47, taxes: 0.92, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 10.80, cost: 70,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 5.6,  rent_growth: 4.5, lease_term: 62, renewal_prob: 75, downtime: 8,  cap: 5.5, opex: 0.47, taxes: 0.92, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 9.20,  cost: 63,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 6.4,  rent_growth: 4.4, lease_term: 62, renewal_prob: 75, downtime: 8,  cap: 5.5, opex: 0.47, taxes: 0.92, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 7.60,  cost: 62,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 7.8,  rent_growth: 4.0, lease_term: 65, renewal_prob: 72, downtime: 9,  cap: 5.5, opex: 0.47, taxes: 0.92, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 6.40,  cost: 58,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 8.4,  rent_growth: 3.8, lease_term: 65, renewal_prob: 72, downtime: 9,  cap: 5.5, opex: 0.47, taxes: 0.92, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 5.80,  cost: 54,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 9.6,  rent_growth: 3.5, lease_term: 72, renewal_prob: 70, downtime: 10, cap: 5.5, opex: 0.47, taxes: 0.92, cap_reserve: 0.10 },
    }
  },
  "Phoenix": {
    region: "Mountain West", tier: "Primary", score: 80,
    source: "JLL Q1 2026 / Newmark Q1 2026 / CBRE Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/phoenix-industrial",
    vacancy: 9.1, absorption: 11.8, rent_growth: 2.8, cap_rate: 5.5, pipeline: 20.0,
    note: "Avoid 500K+ spec — vacancy 10.8-12.4%. Focus on 100-250K SF cross-dock where absorption is strong. Data center adjacent demand is a tailwind. Verify power access before land commitment.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 13.20, cost: 90,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 6.2,  rent_growth: 3.2, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 5.5, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 11.60, cost: 82,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 7.0,  rent_growth: 3.0, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 5.5, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 10.40, cost: 74,  free_rent: 3, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 7.8,  rent_growth: 2.8, lease_term: 62, renewal_prob: 72, downtime: 10, cap: 5.5, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 8.60,  cost: 72,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 9.4,  rent_growth: 2.5, lease_term: 65, renewal_prob: 70, downtime: 11, cap: 5.5, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 7.20,  cost: 68,  free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 10.8, rent_growth: 2.2, lease_term: 65, renewal_prob: 68, downtime: 12, cap: 5.5, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 6.20,  cost: 62,  free_rent: 5, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 12.4, rent_growth: 1.8, lease_term: 72, renewal_prob: 65, downtime: 14, cap: 5.5, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
    }
  },
  "Raleigh-Durham": {
    region: "Southeast", tier: "Primary", score: 77,
    source: "CBRE Q1 2026 / Newmark Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/raleigh-durham-industrial",
    vacancy: 7.8, absorption: 5.4, rent_growth: 4.8, cap_rate: 5.6, pipeline: 7.1,
    note: "Newmark flags as most undersupplied market for flex and mid-bay nationally. Tech and life sciences tenant base. Premium rents and longer lease terms.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 13.80, cost: 82,  free_rent: 2, ti_new: 11, ti_renewal: 5, lc: 7.0, vacancy: 5.4,  rent_growth: 5.2, lease_term: 62, renewal_prob: 76, downtime: 8,  cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 12.00, cost: 74,  free_rent: 2, ti_new: 11, ti_renewal: 5, lc: 7.0, vacancy: 6.0,  rent_growth: 5.0, lease_term: 62, renewal_prob: 76, downtime: 8,  cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 10.60, cost: 67,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 6.8,  rent_growth: 4.8, lease_term: 63, renewal_prob: 76, downtime: 9,  cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 8.60,  cost: 66,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 8.2,  rent_growth: 4.5, lease_term: 65, renewal_prob: 74, downtime: 9,  cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 7.20,  cost: 62,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 8.8,  rent_growth: 4.0, lease_term: 65, renewal_prob: 72, downtime: 10, cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 6.40,  cost: 58,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 10.1, rent_growth: 3.5, lease_term: 72, renewal_prob: 70, downtime: 11, cap: 5.6, opex: 0.48, taxes: 0.95, cap_reserve: 0.10 },
    }
  },
  // ── SECONDARY MARKETS ─────────────────────────────────────────────────────
  "Houston": {
    region: "Texas", tier: "Secondary", score: 74,
    source: "JLL Q1 2026 / CBRE Q1 2026 / Colliers Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/houston-industrial",
    vacancy: 8.9, absorption: 9.8, rent_growth: 1.9, cap_rate: 5.7, pipeline: 22.0,
    note: "22 MSF pipeline heavily weighted to big-box. Focus on sub-250K SF port-proximate product. Big-box vacancy at 12.8% — do not spec without committed tenant.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 12.20, cost: 84,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 5.8,  rent_growth: 2.4, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 5.7, opex: 0.48, taxes: 1.20, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 10.40, cost: 76,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 6.8,  rent_growth: 2.2, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 5.7, opex: 0.48, taxes: 1.20, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 9.20,  cost: 68,  free_rent: 3, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 7.4,  rent_growth: 2.0, lease_term: 62, renewal_prob: 72, downtime: 10, cap: 5.7, opex: 0.48, taxes: 1.20, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 7.60,  cost: 68,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 9.2,  rent_growth: 1.8, lease_term: 65, renewal_prob: 70, downtime: 11, cap: 5.7, opex: 0.48, taxes: 1.20, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 6.40,  cost: 64,  free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 10.4, rent_growth: 1.5, lease_term: 65, renewal_prob: 68, downtime: 12, cap: 5.7, opex: 0.48, taxes: 1.20, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 5.60,  cost: 58,  free_rent: 5, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 12.8, rent_growth: 1.2, lease_term: 72, renewal_prob: 65, downtime: 14, cap: 5.7, opex: 0.48, taxes: 1.20, cap_reserve: 0.10 },
    }
  },
  "Louisville": {
    region: "Midwest", tier: "Secondary", score: 72,
    source: "CBRE Q1 2026 / JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/louisville-industrial",
    vacancy: 8.2, absorption: 5.6, rent_growth: 5.4, cap_rate: 5.9, pipeline: 5.2,
    note: "$55/SF hard cost is lowest nationally. 5.4% rent growth top 5 nationally. UPS and Amazon anchor tenant ecosystem. Focus on sub-500K SF.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 11.20, cost: 68,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 5.4,  rent_growth: 5.8, lease_term: 60, renewal_prob: 75, downtime: 8,  cap: 5.9, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 9.60,  cost: 62,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 6.0,  rent_growth: 5.5, lease_term: 62, renewal_prob: 75, downtime: 8,  cap: 5.9, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 8.40,  cost: 56,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 6.8,  rent_growth: 5.4, lease_term: 62, renewal_prob: 75, downtime: 9,  cap: 5.9, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 7.00,  cost: 55,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 8.4,  rent_growth: 5.0, lease_term: 65, renewal_prob: 72, downtime: 9,  cap: 5.9, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 5.80,  cost: 52,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 9.4,  rent_growth: 4.5, lease_term: 65, renewal_prob: 70, downtime: 10, cap: 5.9, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 5.00,  cost: 48,  free_rent: 4, ti_new: 6,  ti_renewal: 3, lc: 6.0, vacancy: 11.8, rent_growth: 4.0, lease_term: 72, renewal_prob: 68, downtime: 11, cap: 5.9, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
    }
  },
  "Atlanta": {
    region: "Southeast", tier: "Secondary", score: 70,
    source: "JLL Q1 2026 / Colliers Q1 2026 / CBRE Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/atlanta-industrial",
    vacancy: 9.8, absorption: 7.0, rent_growth: 3.2, cap_rate: 5.6, pipeline: 10.1,
    note: "10.1 MSF pipeline is the risk. Focus strictly on sub-250K SF where vacancy is 6.8-8.4%. Big-box vacancy at 13.2% — no spec development justified.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 13.20, cost: 80,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 6.8,  rent_growth: 3.8, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 5.6, opex: 0.47, taxes: 0.95, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 11.20, cost: 72,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 7.6,  rent_growth: 3.5, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 5.6, opex: 0.47, taxes: 0.95, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 9.60,  cost: 64,  free_rent: 3, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 8.4,  rent_growth: 3.2, lease_term: 62, renewal_prob: 72, downtime: 10, cap: 5.6, opex: 0.47, taxes: 0.95, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 7.80,  cost: 64,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 10.2, rent_growth: 2.8, lease_term: 65, renewal_prob: 70, downtime: 11, cap: 5.6, opex: 0.47, taxes: 0.95, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 6.40,  cost: 60,  free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 11.4, rent_growth: 2.5, lease_term: 65, renewal_prob: 68, downtime: 12, cap: 5.6, opex: 0.47, taxes: 0.95, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 5.80,  cost: 56,  free_rent: 5, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 13.2, rent_growth: 2.2, lease_term: 72, renewal_prob: 65, downtime: 13, cap: 5.6, opex: 0.47, taxes: 0.95, cap_reserve: 0.10 },
    }
  },
  "Kansas City": {
    region: "Midwest", tier: "Secondary", score: 69,
    source: "C&W Q1 2026 / Colliers Q1 2026",
    report_url: "https://www.cushmanwakefield.com/en/united-states/insights/us-marketbeats/kansas-city-marketbeats",
    vacancy: 8.6, absorption: 4.8, rent_growth: 3.8, cap_rate: 6.0, pipeline: 7.4,
    note: "Strong crossroads logistics position. 3.8% rent growth solid for Midwest secondary. $56/SF construction cost competitive. Cap rates above 6% reflect secondary market status.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 10.80, cost: 70,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 5.8,  rent_growth: 4.2, lease_term: 60, renewal_prob: 74, downtime: 8,  cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 9.20,  cost: 63,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 6.4,  rent_growth: 4.0, lease_term: 60, renewal_prob: 74, downtime: 9,  cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 8.00,  cost: 56,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 7.2,  rent_growth: 3.8, lease_term: 62, renewal_prob: 74, downtime: 9,  cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 6.60,  cost: 56,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 9.0,  rent_growth: 3.5, lease_term: 65, renewal_prob: 72, downtime: 10, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 5.60,  cost: 52,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 10.2, rent_growth: 3.2, lease_term: 65, renewal_prob: 70, downtime: 11, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 4.80,  cost: 48,  free_rent: 4, ti_new: 6,  ti_renewal: 3, lc: 6.0, vacancy: 12.4, rent_growth: 2.8, lease_term: 72, renewal_prob: 68, downtime: 12, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
    }
  },
  "Tampa Bay": {
    region: "Southeast", tier: "Secondary", score: 68,
    source: "C&W Q1 2026 / JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/tampa-industrial",
    vacancy: 7.6, absorption: 5.2, rent_growth: 4.1, cap_rate: 5.5, pipeline: 6.8,
    note: "Strong small-bay fundamentals at $15.20/SF. Coastal demographics justify premium rents vs inland Southeast. 4.1% rent growth solid.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 15.20, cost: 88,  free_rent: 1, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 5.2,  rent_growth: 4.5, lease_term: 60, renewal_prob: 74, downtime: 8,  cap: 5.5, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 13.20, cost: 80,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 5.8,  rent_growth: 4.2, lease_term: 60, renewal_prob: 74, downtime: 8,  cap: 5.5, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 11.60, cost: 72,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 6.4,  rent_growth: 4.1, lease_term: 62, renewal_prob: 74, downtime: 9,  cap: 5.5, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 9.40,  cost: 70,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 8.0,  rent_growth: 3.8, lease_term: 65, renewal_prob: 72, downtime: 9,  cap: 5.5, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 8.00,  cost: 66,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 8.8,  rent_growth: 3.5, lease_term: 65, renewal_prob: 70, downtime: 10, cap: 5.5, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 7.20,  cost: 60,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 10.2, rent_growth: 3.0, lease_term: 72, renewal_prob: 68, downtime: 11, cap: 5.5, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
    }
  },
  "Memphis": {
    region: "Southeast", tier: "Secondary", score: 66,
    source: "JLL Q1 2026 / Colliers Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/memphis-industrial",
    vacancy: 9.5, absorption: 4.8, rent_growth: 2.6, cap_rate: 6.1, pipeline: 3.0,
    note: "Low pipeline is a positive. $52/SF construction cost makes development economics work despite moderate rents. FedEx World Hub creates structural logistics demand.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 10.40, cost: 65,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 6.4,  rent_growth: 3.0, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 6.1, opex: 0.42, taxes: 0.85, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 8.80,  cost: 58,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 7.2,  rent_growth: 2.8, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 6.1, opex: 0.42, taxes: 0.85, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 7.60,  cost: 52,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 8.0,  rent_growth: 2.6, lease_term: 62, renewal_prob: 72, downtime: 10, cap: 6.1, opex: 0.42, taxes: 0.85, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 6.20,  cost: 52,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 9.8,  rent_growth: 2.4, lease_term: 65, renewal_prob: 70, downtime: 10, cap: 6.1, opex: 0.42, taxes: 0.85, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 5.20,  cost: 48,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 11.0, rent_growth: 2.2, lease_term: 65, renewal_prob: 68, downtime: 11, cap: 6.1, opex: 0.42, taxes: 0.85, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 4.60,  cost: 44,  free_rent: 4, ti_new: 6,  ti_renewal: 3, lc: 6.0, vacancy: 13.2, rent_growth: 2.0, lease_term: 72, renewal_prob: 65, downtime: 12, cap: 6.1, opex: 0.42, taxes: 0.85, cap_reserve: 0.10 },
    }
  },
  "Miami": {
    region: "Southeast", tier: "Secondary", score: 65,
    source: "CBRE Q1 2026 / JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/miami-industrial",
    vacancy: 5.4, absorption: 4.1, rent_growth: 3.5, cap_rate: 5.0, pipeline: 4.2,
    note: "Premium rents driven by scarcity. $110/SF construction cost limits development economics. Focus on infill repositioning over ground-up spec. Cap rates compress to 4.75-5.0% on quality product.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 26.40, cost: 135, free_rent: 1, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 3.8,  rent_growth: 4.0, lease_term: 60, renewal_prob: 78, downtime: 7,  cap: 5.0, opex: 0.55, taxes: 1.40, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 22.40, cost: 124, free_rent: 1, ti_new: 11, ti_renewal: 5, lc: 7.0, vacancy: 4.2,  rent_growth: 3.8, lease_term: 60, renewal_prob: 78, downtime: 7,  cap: 5.0, opex: 0.55, taxes: 1.40, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 20.40, cost: 114, free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 4.8,  rent_growth: 3.5, lease_term: 62, renewal_prob: 76, downtime: 8,  cap: 5.0, opex: 0.55, taxes: 1.40, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 17.20, cost: 110, free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 5.8,  rent_growth: 3.2, lease_term: 65, renewal_prob: 74, downtime: 9,  cap: 5.0, opex: 0.55, taxes: 1.40, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 14.40, cost: 104, free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 6.4,  rent_growth: 3.0, lease_term: 65, renewal_prob: 72, downtime: 9,  cap: 5.0, opex: 0.55, taxes: 1.40, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 12.80, cost: 96,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 7.6,  rent_growth: 2.8, lease_term: 72, renewal_prob: 70, downtime: 10, cap: 5.0, opex: 0.55, taxes: 1.40, cap_reserve: 0.10 },
    }
  },
  "New Jersey": {
    region: "Northeast", tier: "Secondary", score: 63,
    source: "JLL Q1 2026 / Newmark Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/new-jersey-industrial",
    vacancy: 7.8, absorption: 6.8, rent_growth: 4.2, cap_rate: 5.1, pipeline: 6.4,
    note: "Port of NY/NJ creates persistent import distribution demand. $118/SF construction cost requires premium rents to justify. Land scarcity means infill sites command significant premiums.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 23.60, cost: 145, free_rent: 2, ti_new: 13, ti_renewal: 6, lc: 7.0, vacancy: 5.4,  rent_growth: 4.5, lease_term: 62, renewal_prob: 76, downtime: 9,  cap: 5.1, opex: 0.58, taxes: 2.20, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 20.40, cost: 135, free_rent: 2, ti_new: 12, ti_renewal: 5, lc: 7.0, vacancy: 6.0,  rent_growth: 4.2, lease_term: 62, renewal_prob: 76, downtime: 9,  cap: 5.1, opex: 0.58, taxes: 2.20, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 18.40, cost: 125, free_rent: 2, ti_new: 11, ti_renewal: 5, lc: 7.0, vacancy: 6.8,  rent_growth: 4.2, lease_term: 65, renewal_prob: 76, downtime: 9,  cap: 5.1, opex: 0.58, taxes: 2.20, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 15.40, cost: 118, free_rent: 3, ti_new: 10, ti_renewal: 4, lc: 6.0, vacancy: 8.2,  rent_growth: 4.0, lease_term: 65, renewal_prob: 74, downtime: 10, cap: 5.1, opex: 0.58, taxes: 2.20, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 12.80, cost: 112, free_rent: 3, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 9.0,  rent_growth: 3.8, lease_term: 65, renewal_prob: 72, downtime: 11, cap: 5.1, opex: 0.58, taxes: 2.20, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 11.20, cost: 104, free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 10.8, rent_growth: 3.5, lease_term: 72, renewal_prob: 70, downtime: 12, cap: 5.1, opex: 0.58, taxes: 2.20, cap_reserve: 0.10 },
    }
  },
  // ── ADDITIONAL MARKETS WITH CONFIRMED QUARTERLY REPORTS ───────────────────
  "Denver": {
    region: "Mountain West", tier: "Secondary", score: 62,
    source: "JLL Q1 2026 / CBRE Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/denver-industrial",
    vacancy: 8.4, absorption: 5.2, rent_growth: 2.9, cap_rate: 5.8, pipeline: 9.8,
    note: "E-commerce and logistics tenant base. 9.8 MSF pipeline is elevated. Competitive costs at $72/SF for 100-250K SF. Focus on infill and sub-250K product.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 14.80, cost: 92,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 5.6,  rent_growth: 3.4, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 5.8, opex: 0.48, taxes: 1.10, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 12.60, cost: 82,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 6.4,  rent_growth: 3.2, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 5.8, opex: 0.48, taxes: 1.10, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 11.20, cost: 72,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 7.8,  rent_growth: 2.9, lease_term: 62, renewal_prob: 72, downtime: 10, cap: 5.8, opex: 0.48, taxes: 1.10, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 9.20,  cost: 72,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 9.2,  rent_growth: 2.6, lease_term: 65, renewal_prob: 70, downtime: 11, cap: 5.8, opex: 0.48, taxes: 1.10, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 7.80,  cost: 68,  free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 10.6, rent_growth: 2.3, lease_term: 65, renewal_prob: 68, downtime: 12, cap: 5.8, opex: 0.48, taxes: 1.10, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 6.80,  cost: 62,  free_rent: 5, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 12.8, rent_growth: 2.0, lease_term: 72, renewal_prob: 65, downtime: 13, cap: 5.8, opex: 0.48, taxes: 1.10, cap_reserve: 0.10 },
    }
  },
  "Salt Lake City": {
    region: "Mountain West", tier: "Secondary", score: 61,
    source: "JLL Q1 2026 / CBRE Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/salt-lake-city-industrial",
    vacancy: 8.1, absorption: 3.8, rent_growth: 3.2, cap_rate: 5.7, pipeline: 6.2,
    note: "Strong tech and logistics tenant base. Constrained land supply keeps development in check. 3.2% rent growth consistent. Good labor market.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 13.40, cost: 88,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 5.8,  rent_growth: 3.6, lease_term: 60, renewal_prob: 72, downtime: 8,  cap: 5.7, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 11.60, cost: 80,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 6.6,  rent_growth: 3.4, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 5.7, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 10.20, cost: 72,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 7.4,  rent_growth: 3.2, lease_term: 62, renewal_prob: 72, downtime: 9,  cap: 5.7, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 8.40,  cost: 70,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 8.8,  rent_growth: 3.0, lease_term: 65, renewal_prob: 70, downtime: 10, cap: 5.7, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 7.20,  cost: 66,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 10.0, rent_growth: 2.8, lease_term: 65, renewal_prob: 68, downtime: 11, cap: 5.7, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 6.20,  cost: 60,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 12.0, rent_growth: 2.4, lease_term: 72, renewal_prob: 65, downtime: 12, cap: 5.7, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
    }
  },
  "Las Vegas": {
    region: "Mountain West", tier: "Secondary", score: 60,
    source: "JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/las-vegas-industrial",
    vacancy: 8.8, absorption: 3.6, rent_growth: 2.6, cap_rate: 5.8, pipeline: 7.4,
    note: "E-commerce and last-mile driven by growing population base. Cost structure competitive. Elevated pipeline at 7.4 MSF. Focus on infill and smaller format product.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 13.80, cost: 88,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 6.2,  rent_growth: 3.0, lease_term: 60, renewal_prob: 70, downtime: 9,  cap: 5.8, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 12.00, cost: 80,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 7.2,  rent_growth: 2.8, lease_term: 60, renewal_prob: 70, downtime: 9,  cap: 5.8, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 10.60, cost: 72,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 8.0,  rent_growth: 2.6, lease_term: 62, renewal_prob: 70, downtime: 10, cap: 5.8, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 8.80,  cost: 70,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 9.6,  rent_growth: 2.4, lease_term: 65, renewal_prob: 68, downtime: 11, cap: 5.8, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 7.40,  cost: 66,  free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 11.0, rent_growth: 2.2, lease_term: 65, renewal_prob: 66, downtime: 12, cap: 5.8, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 6.40,  cost: 60,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 13.0, rent_growth: 1.8, lease_term: 72, renewal_prob: 63, downtime: 13, cap: 5.8, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
    }
  },
  "Orlando": {
    region: "Southeast", tier: "Secondary", score: 62,
    source: "JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/orlando-industrial",
    vacancy: 7.2, absorption: 4.4, rent_growth: 3.8, cap_rate: 5.6, pipeline: 5.8,
    note: "Population-driven last-mile demand. 3.8% rent growth solid. Competitive costs vs coastal Florida. E-commerce and food distribution anchor tenant demand.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 14.60, cost: 85,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 5.0,  rent_growth: 4.2, lease_term: 60, renewal_prob: 72, downtime: 8,  cap: 5.6, opex: 0.48, taxes: 1.05, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 12.60, cost: 76,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 5.8,  rent_growth: 4.0, lease_term: 60, renewal_prob: 72, downtime: 8,  cap: 5.6, opex: 0.48, taxes: 1.05, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 11.00, cost: 68,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 6.4,  rent_growth: 3.8, lease_term: 62, renewal_prob: 72, downtime: 9,  cap: 5.6, opex: 0.48, taxes: 1.05, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 9.00,  cost: 68,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 7.8,  rent_growth: 3.5, lease_term: 65, renewal_prob: 70, downtime: 9,  cap: 5.6, opex: 0.48, taxes: 1.05, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 7.60,  cost: 64,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 8.8,  rent_growth: 3.2, lease_term: 65, renewal_prob: 68, downtime: 10, cap: 5.6, opex: 0.48, taxes: 1.05, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 6.60,  cost: 58,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 10.4, rent_growth: 2.8, lease_term: 72, renewal_prob: 66, downtime: 11, cap: 5.6, opex: 0.48, taxes: 1.05, cap_reserve: 0.10 },
    }
  },
  "Baltimore": {
    region: "Mid-Atlantic", tier: "Secondary", score: 61,
    source: "JLL Q1 2026 / CBRE Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/baltimore-industrial",
    vacancy: 8.6, absorption: 4.2, rent_growth: 3.5, cap_rate: 5.5, pipeline: 5.4,
    note: "Port of Baltimore creates steady import distribution demand. Competitive with Philadelphia at lower cost basis. Strong I-95 corridor logistics position.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 14.20, cost: 98,  free_rent: 2, ti_new: 11, ti_renewal: 5, lc: 7.0, vacancy: 6.2,  rent_growth: 3.8, lease_term: 62, renewal_prob: 74, downtime: 9,  cap: 5.5, opex: 0.52, taxes: 1.40, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 12.40, cost: 90,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 7.0,  rent_growth: 3.5, lease_term: 62, renewal_prob: 74, downtime: 9,  cap: 5.5, opex: 0.52, taxes: 1.40, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 10.80, cost: 82,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 7.0, vacancy: 7.8,  rent_growth: 3.5, lease_term: 62, renewal_prob: 74, downtime: 9,  cap: 5.5, opex: 0.52, taxes: 1.40, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 8.80,  cost: 82,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 9.2,  rent_growth: 3.2, lease_term: 65, renewal_prob: 72, downtime: 10, cap: 5.5, opex: 0.52, taxes: 1.40, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 7.40,  cost: 78,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 10.0, rent_growth: 2.9, lease_term: 65, renewal_prob: 70, downtime: 11, cap: 5.5, opex: 0.52, taxes: 1.40, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 6.60,  cost: 72,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 11.8, rent_growth: 2.6, lease_term: 72, renewal_prob: 68, downtime: 12, cap: 5.5, opex: 0.52, taxes: 1.40, cap_reserve: 0.10 },
    }
  },
  "Cincinnati": {
    region: "Midwest", tier: "Secondary", score: 60,
    source: "JLL Q1 2026 / C&W Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/cincinnati-industrial",
    vacancy: 8.4, absorption: 4.0, rent_growth: 3.4, cap_rate: 6.0, pipeline: 5.8,
    note: "I-75 corridor logistics hub. Amazon distribution anchor tenant. $58/SF construction cost competitive. Strong manufacturing and 3PL demand from auto sector.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 9.80,  cost: 72,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 5.8,  rent_growth: 3.8, lease_term: 60, renewal_prob: 72, downtime: 8,  cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 8.40,  cost: 65,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 6.6,  rent_growth: 3.5, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 7.40,  cost: 58,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 7.4,  rent_growth: 3.4, lease_term: 62, renewal_prob: 72, downtime: 9,  cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 6.20,  cost: 57,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 9.0,  rent_growth: 3.0, lease_term: 65, renewal_prob: 70, downtime: 10, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 5.20,  cost: 53,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 10.2, rent_growth: 2.8, lease_term: 65, renewal_prob: 68, downtime: 11, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 4.60,  cost: 49,  free_rent: 4, ti_new: 6,  ti_renewal: 3, lc: 6.0, vacancy: 12.4, rent_growth: 2.4, lease_term: 72, renewal_prob: 66, downtime: 12, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
    }
  },
  "Detroit": {
    region: "Midwest", tier: "Secondary", score: 58,
    source: "JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/detroit-industrial",
    vacancy: 8.2, absorption: 3.8, rent_growth: 3.0, cap_rate: 6.1, pipeline: 4.2,
    note: "Auto manufacturing reshoring creating new industrial demand. Low pipeline is a positive. $62/SF construction cost. Cap rates above 6.0% reflect Detroit risk premium.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 10.40, cost: 76,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 5.8,  rent_growth: 3.4, lease_term: 60, renewal_prob: 70, downtime: 9,  cap: 6.1, opex: 0.45, taxes: 1.10, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 8.80,  cost: 68,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 6.6,  rent_growth: 3.2, lease_term: 60, renewal_prob: 70, downtime: 9,  cap: 6.1, opex: 0.45, taxes: 1.10, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 7.60,  cost: 62,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 7.4,  rent_growth: 3.0, lease_term: 62, renewal_prob: 70, downtime: 10, cap: 6.1, opex: 0.45, taxes: 1.10, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 6.40,  cost: 60,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 8.8,  rent_growth: 2.8, lease_term: 65, renewal_prob: 68, downtime: 10, cap: 6.1, opex: 0.45, taxes: 1.10, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 5.40,  cost: 56,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 9.8,  rent_growth: 2.5, lease_term: 65, renewal_prob: 66, downtime: 11, cap: 6.1, opex: 0.45, taxes: 1.10, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 4.80,  cost: 52,  free_rent: 4, ti_new: 6,  ti_renewal: 3, lc: 6.0, vacancy: 12.0, rent_growth: 2.2, lease_term: 72, renewal_prob: 64, downtime: 12, cap: 6.1, opex: 0.45, taxes: 1.10, cap_reserve: 0.10 },
    }
  },
  "Minneapolis": {
    region: "Midwest", tier: "Secondary", score: 58,
    source: "JLL Q1 2026 / CBRE Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/minneapolis-industrial",
    vacancy: 7.8, absorption: 3.6, rent_growth: 3.2, cap_rate: 6.0, pipeline: 4.6,
    note: "Strong Midwest distribution hub. Limited pipeline is a positive. Target Corp and UHC anchor tenant base. $60/SF construction cost competitive.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 11.60, cost: 76,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 5.4,  rent_growth: 3.6, lease_term: 60, renewal_prob: 72, downtime: 8,  cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 10.00, cost: 68,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 6.2,  rent_growth: 3.4, lease_term: 60, renewal_prob: 72, downtime: 8,  cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 8.80,  cost: 62,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 7.0,  rent_growth: 3.2, lease_term: 62, renewal_prob: 72, downtime: 9,  cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 7.40,  cost: 60,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 8.4,  rent_growth: 2.9, lease_term: 65, renewal_prob: 70, downtime: 9,  cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 6.20,  cost: 56,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 9.6,  rent_growth: 2.6, lease_term: 65, renewal_prob: 68, downtime: 10, cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 5.40,  cost: 52,  free_rent: 4, ti_new: 6,  ti_renewal: 3, lc: 6.0, vacancy: 11.6, rent_growth: 2.2, lease_term: 72, renewal_prob: 66, downtime: 11, cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
    }
  },
  "Portland": {
    region: "Pacific Northwest", tier: "Secondary", score: 57,
    source: "JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/portland-industrial",
    vacancy: 9.4, absorption: 3.0, rent_growth: 1.8, cap_rate: 5.9, pipeline: 5.2,
    note: "Port of Portland supports import distribution. Business climate challenges are a headwind. $82/SF construction cost moderate. Absorption improving but slow.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 14.80, cost: 100, free_rent: 2, ti_new: 11, ti_renewal: 5, lc: 6.0, vacancy: 6.8,  rent_growth: 2.2, lease_term: 60, renewal_prob: 68, downtime: 11, cap: 5.9, opex: 0.50, taxes: 1.20, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 12.60, cost: 92,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 7.8,  rent_growth: 2.0, lease_term: 60, renewal_prob: 68, downtime: 11, cap: 5.9, opex: 0.50, taxes: 1.20, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 11.00, cost: 82,  free_rent: 2, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 8.8,  rent_growth: 1.8, lease_term: 62, renewal_prob: 68, downtime: 12, cap: 5.9, opex: 0.50, taxes: 1.20, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 8.80,  cost: 80,  free_rent: 3, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 10.2, rent_growth: 1.6, lease_term: 65, renewal_prob: 66, downtime: 12, cap: 5.9, opex: 0.50, taxes: 1.20, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 7.40,  cost: 76,  free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 11.4, rent_growth: 1.4, lease_term: 65, renewal_prob: 64, downtime: 13, cap: 5.9, opex: 0.50, taxes: 1.20, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 6.40,  cost: 70,  free_rent: 4, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 13.2, rent_growth: 1.2, lease_term: 72, renewal_prob: 62, downtime: 14, cap: 5.9, opex: 0.50, taxes: 1.20, cap_reserve: 0.10 },
    }
  },
  "Seattle": {
    region: "Pacific Northwest", tier: "Secondary", score: 56,
    source: "JLL Q1 2026 / CBRE Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/seattle-bellevue-industrial",
    vacancy: 9.8, absorption: 3.4, rent_growth: 1.4, cap_rate: 5.6, pipeline: 8.4,
    note: "Port exposure headwind from tariff disruption. $118/SF construction cost is the key constraint. Tech-adjacent tenant base provides some insulation. Avoid spec big-box.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 18.40, cost: 138, free_rent: 2, ti_new: 12, ti_renewal: 6, lc: 6.0, vacancy: 7.2,  rent_growth: 1.8, lease_term: 60, renewal_prob: 70, downtime: 11, cap: 5.6, opex: 0.55, taxes: 1.60, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 15.80, cost: 128, free_rent: 2, ti_new: 11, ti_renewal: 5, lc: 6.0, vacancy: 8.2,  rent_growth: 1.6, lease_term: 60, renewal_prob: 68, downtime: 11, cap: 5.6, opex: 0.55, taxes: 1.60, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 13.60, cost: 118, free_rent: 3, ti_new: 11, ti_renewal: 5, lc: 6.0, vacancy: 9.2,  rent_growth: 1.4, lease_term: 62, renewal_prob: 68, downtime: 12, cap: 5.6, opex: 0.55, taxes: 1.60, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 11.20, cost: 114, free_rent: 3, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 10.8, rent_growth: 1.2, lease_term: 65, renewal_prob: 66, downtime: 13, cap: 5.6, opex: 0.55, taxes: 1.60, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 9.40,  cost: 108, free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 12.0, rent_growth: 1.0, lease_term: 65, renewal_prob: 64, downtime: 14, cap: 5.6, opex: 0.55, taxes: 1.60, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 8.20,  cost: 100, free_rent: 5, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 14.0, rent_growth: 0.8, lease_term: 72, renewal_prob: 62, downtime: 15, cap: 5.6, opex: 0.55, taxes: 1.60, cap_reserve: 0.10 },
    }
  },
  "St. Louis": {
    region: "Midwest", tier: "Secondary", score: 58,
    source: "JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/st-louis-industrial",
    vacancy: 8.0, absorption: 3.4, rent_growth: 3.0, cap_rate: 6.2, pipeline: 4.0,
    note: "Central US crossroads logistics. Low pipeline is a positive. $56/SF construction cost very competitive. Cap rates above 6.0% allow strong yield on cost.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 9.60,  cost: 70,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 5.6,  rent_growth: 3.4, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 6.2, opex: 0.43, taxes: 0.85, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 8.20,  cost: 62,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 6.4,  rent_growth: 3.2, lease_term: 60, renewal_prob: 72, downtime: 9,  cap: 6.2, opex: 0.43, taxes: 0.85, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 7.20,  cost: 56,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 7.2,  rent_growth: 3.0, lease_term: 62, renewal_prob: 72, downtime: 9,  cap: 6.2, opex: 0.43, taxes: 0.85, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 6.00,  cost: 55,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 8.8,  rent_growth: 2.8, lease_term: 65, renewal_prob: 70, downtime: 10, cap: 6.2, opex: 0.43, taxes: 0.85, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 5.00,  cost: 51,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 10.0, rent_growth: 2.5, lease_term: 65, renewal_prob: 68, downtime: 11, cap: 6.2, opex: 0.43, taxes: 0.85, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 4.40,  cost: 47,  free_rent: 4, ti_new: 6,  ti_renewal: 3, lc: 6.0, vacancy: 12.0, rent_growth: 2.2, lease_term: 72, renewal_prob: 66, downtime: 12, cap: 6.2, opex: 0.43, taxes: 0.85, cap_reserve: 0.10 },
    }
  },
  "Jacksonville": {
    region: "Southeast", tier: "Secondary", score: 60,
    source: "JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/jacksonville-industrial",
    vacancy: 8.0, absorption: 3.8, rent_growth: 3.6, cap_rate: 5.8, pipeline: 5.6,
    note: "Port of Jacksonville creates structural demand. Growing Southeast logistics hub. Competitive with Savannah at lower cost. Strong 3PL and e-commerce tenant base.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 12.40, cost: 76,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 5.6,  rent_growth: 4.0, lease_term: 60, renewal_prob: 72, downtime: 8,  cap: 5.8, opex: 0.46, taxes: 0.92, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 10.60, cost: 68,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 6.4,  rent_growth: 3.8, lease_term: 60, renewal_prob: 72, downtime: 8,  cap: 5.8, opex: 0.46, taxes: 0.92, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 9.20,  cost: 62,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 7.0, vacancy: 7.2,  rent_growth: 3.6, lease_term: 62, renewal_prob: 72, downtime: 9,  cap: 5.8, opex: 0.46, taxes: 0.92, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 7.60,  cost: 62,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 8.6,  rent_growth: 3.3, lease_term: 65, renewal_prob: 70, downtime: 9,  cap: 5.8, opex: 0.46, taxes: 0.92, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 6.40,  cost: 58,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 9.6,  rent_growth: 3.0, lease_term: 65, renewal_prob: 68, downtime: 10, cap: 5.8, opex: 0.46, taxes: 0.92, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 5.60,  cost: 54,  free_rent: 4, ti_new: 6,  ti_renewal: 3, lc: 6.0, vacancy: 11.4, rent_growth: 2.6, lease_term: 72, renewal_prob: 66, downtime: 11, cap: 5.8, opex: 0.46, taxes: 0.92, cap_reserve: 0.10 },
    }
  },
  "Boston": {
    region: "Northeast", tier: "Secondary", score: 55,
    source: "JLL Q1 2026 / CBRE Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/boston-industrial",
    vacancy: 6.8, absorption: 2.8, rent_growth: 3.8, cap_rate: 5.2, pipeline: 2.4,
    note: "Extremely constrained supply — only 2.4 MSF pipeline. Life sciences and tech create premium last-mile demand. $128/SF construction cost is the key barrier. Infill only.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 22.40, cost: 148, free_rent: 1, ti_new: 14, ti_renewal: 7, lc: 7.0, vacancy: 4.8,  rent_growth: 4.2, lease_term: 60, renewal_prob: 78, downtime: 8,  cap: 5.2, opex: 0.60, taxes: 2.40, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 18.80, cost: 138, free_rent: 2, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 5.6,  rent_growth: 4.0, lease_term: 60, renewal_prob: 76, downtime: 8,  cap: 5.2, opex: 0.60, taxes: 2.40, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 16.40, cost: 128, free_rent: 2, ti_new: 11, ti_renewal: 5, lc: 7.0, vacancy: 6.2,  rent_growth: 3.8, lease_term: 62, renewal_prob: 76, downtime: 9,  cap: 5.2, opex: 0.60, taxes: 2.40, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 13.20, cost: 126, free_rent: 3, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 7.2,  rent_growth: 3.5, lease_term: 65, renewal_prob: 74, downtime: 9,  cap: 5.2, opex: 0.60, taxes: 2.40, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 11.00, cost: 120, free_rent: 3, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 8.0,  rent_growth: 3.2, lease_term: 65, renewal_prob: 72, downtime: 10, cap: 5.2, opex: 0.60, taxes: 2.40, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 9.60,  cost: 114, free_rent: 4, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 9.4,  rent_growth: 2.8, lease_term: 72, renewal_prob: 70, downtime: 11, cap: 5.2, opex: 0.60, taxes: 2.40, cap_reserve: 0.10 },
    }
  },
  "San Antonio": {
    region: "Texas", tier: "Secondary", score: 58,
    source: "JLL Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/san-antonio-industrial",
    vacancy: 8.4, absorption: 3.2, rent_growth: 2.8, cap_rate: 6.0, pipeline: 4.8,
    note: "Military and defense tenant base provides stability. Growing manufacturing presence. $70/SF construction cost competitive. Lower rent growth vs Austin reflects less tech exposure.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 12.40, cost: 86,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 5.8,  rent_growth: 3.2, lease_term: 60, renewal_prob: 70, downtime: 9,  cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 10.60, cost: 78,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 6.6,  rent_growth: 3.0, lease_term: 60, renewal_prob: 70, downtime: 9,  cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 9.20,  cost: 70,  free_rent: 2, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 7.4,  rent_growth: 2.8, lease_term: 62, renewal_prob: 70, downtime: 10, cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 7.60,  cost: 68,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 9.0,  rent_growth: 2.5, lease_term: 65, renewal_prob: 68, downtime: 10, cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 6.40,  cost: 64,  free_rent: 3, ti_new: 7,  ti_renewal: 3, lc: 6.0, vacancy: 10.2, rent_growth: 2.2, lease_term: 65, renewal_prob: 66, downtime: 11, cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 5.60,  cost: 58,  free_rent: 4, ti_new: 6,  ti_renewal: 3, lc: 6.0, vacancy: 12.4, rent_growth: 1.8, lease_term: 72, renewal_prob: 64, downtime: 12, cap: 6.0, opex: 0.46, taxes: 1.00, cap_reserve: 0.10 },
    }
  },
  // ── AVOID MARKETS — included for completeness, flagged clearly ────────────
  "Columbus": {
    region: "Midwest", tier: "Avoid", score: 42,
    source: "C&W Q1 2026 / Colliers Q1 2026",
    report_url: "https://www.colliers.com/en/research/columbus/industrial",
    vacancy: 11.2, absorption: 4.2, rent_growth: 1.2, cap_rate: 6.0, pipeline: 13.0,
    note: "⚠️ AVOID SPEC. Pipeline grew 74% YOY. 11.2% vacancy with 13 MSF still under construction. Only develop with committed tenant and pre-arranged financing.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 9.60,  cost: 70,  free_rent: 3, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 7.8,  rent_growth: 1.6, lease_term: 60, renewal_prob: 65, downtime: 12, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 8.00,  cost: 63,  free_rent: 3, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 8.8,  rent_growth: 1.4, lease_term: 60, renewal_prob: 65, downtime: 12, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 7.00,  cost: 56,  free_rent: 3, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 9.6,  rent_growth: 1.2, lease_term: 62, renewal_prob: 65, downtime: 13, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 5.80,  cost: 56,  free_rent: 4, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 11.8, rent_growth: 1.0, lease_term: 65, renewal_prob: 62, downtime: 14, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 4.80,  cost: 52,  free_rent: 5, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 13.4, rent_growth: 0.8, lease_term: 65, renewal_prob: 58, downtime: 15, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 4.20,  cost: 48,  free_rent: 6, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 16.8, rent_growth: 0.5, lease_term: 72, renewal_prob: 55, downtime: 18, cap: 6.0, opex: 0.44, taxes: 0.88, cap_reserve: 0.10 },
    }
  },
  "Chicago": {
    region: "Midwest", tier: "Avoid", score: 45,
    source: "JLL Q1 2026 / C&W Q1 2026 / Colliers Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/chicago-industrial",
    vacancy: 9.9, absorption: 7.6, rent_growth: 2.1, cap_rate: 5.9, pipeline: 14.2,
    note: "⚠️ $108/SF construction cost highest in Midwest. Cook County tax reassessments create unpredictable cost basis. Lender quote yield 27% below national avg. Only pursue with creditworthy pre-committed tenant.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 13.40, cost: 130, free_rent: 2, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 6.8,  rent_growth: 2.5, lease_term: 60, renewal_prob: 68, downtime: 10, cap: 5.9, opex: 0.55, taxes: 2.80, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 11.40, cost: 120, free_rent: 2, ti_new: 11, ti_renewal: 5, lc: 7.0, vacancy: 7.8,  rent_growth: 2.3, lease_term: 60, renewal_prob: 68, downtime: 10, cap: 5.9, opex: 0.55, taxes: 2.80, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 9.80,  cost: 108, free_rent: 3, ti_new: 11, ti_renewal: 5, lc: 7.0, vacancy: 8.4,  rent_growth: 2.1, lease_term: 62, renewal_prob: 68, downtime: 11, cap: 5.9, opex: 0.55, taxes: 2.80, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 8.00,  cost: 108, free_rent: 3, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 10.4, rent_growth: 1.8, lease_term: 65, renewal_prob: 65, downtime: 12, cap: 5.9, opex: 0.55, taxes: 2.80, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 6.80,  cost: 102, free_rent: 4, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 11.8, rent_growth: 1.5, lease_term: 65, renewal_prob: 62, downtime: 13, cap: 5.9, opex: 0.55, taxes: 2.80, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 6.20,  cost: 95,  free_rent: 5, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 14.2, rent_growth: 1.2, lease_term: 72, renewal_prob: 58, downtime: 15, cap: 5.9, opex: 0.55, taxes: 2.80, cap_reserve: 0.10 },
    }
  },
  "Inland Empire": {
    region: "California", tier: "Avoid", score: 38,
    source: "JLL Q1 2026 / CBRE Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/inland-empire-industrial",
    vacancy: 8.7, absorption: -2.4, rent_growth: -3.2, cap_rate: 5.4, pipeline: 8.9,
    note: "⚠️ Negative absorption for 2nd consecutive year. Port disruption from tariffs removed structural demand driver. $118/SF build cost with declining rents = negative development spread. No spec development recommended.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 20.40, cost: 142, free_rent: 3, ti_new: 14, ti_renewal: 7, lc: 7.0, vacancy: 6.0,  rent_growth: -2.8, lease_term: 60, renewal_prob: 65, downtime: 12, cap: 5.4, opex: 0.58, taxes: 1.80, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 17.20, cost: 132, free_rent: 3, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 7.0,  rent_growth: -3.0, lease_term: 60, renewal_prob: 65, downtime: 12, cap: 5.4, opex: 0.58, taxes: 1.80, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 15.00, cost: 122, free_rent: 3, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 7.8,  rent_growth: -3.2, lease_term: 62, renewal_prob: 63, downtime: 13, cap: 5.4, opex: 0.58, taxes: 1.80, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 12.60, cost: 118, free_rent: 4, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 9.2,  rent_growth: -3.4, lease_term: 65, renewal_prob: 60, downtime: 14, cap: 5.4, opex: 0.58, taxes: 1.80, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 10.60, cost: 112, free_rent: 5, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 10.8, rent_growth: -3.5, lease_term: 65, renewal_prob: 57, downtime: 15, cap: 5.4, opex: 0.58, taxes: 1.80, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 9.40,  cost: 104, free_rent: 6, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 12.8, rent_growth: -3.8, lease_term: 72, renewal_prob: 54, downtime: 17, cap: 5.4, opex: 0.58, taxes: 1.80, cap_reserve: 0.10 },
    }
  },
  "Los Angeles": {
    region: "California", tier: "Avoid", score: 35,
    source: "JLL Q1 2026 / CBRE Q1 2026 / Newmark Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/los-angeles-industrial",
    vacancy: 9.4, absorption: -2.4, rent_growth: -3.6, cap_rate: 5.1, pipeline: 8.9,
    note: "⚠️ Negative absorption. Rents declining -3.6% YOY. $138/SF construction cost. Tariff-driven port volume decline hitting LA/Long Beach hardest — down 20%+ YOY. Newmark does not recommend speculative development in 2026.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 24.40, cost: 165, free_rent: 3, ti_new: 15, ti_renewal: 8, lc: 7.0, vacancy: 6.4,  rent_growth: -3.0, lease_term: 60, renewal_prob: 62, downtime: 13, cap: 5.1, opex: 0.62, taxes: 2.20, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 20.60, cost: 154, free_rent: 3, ti_new: 13, ti_renewal: 7, lc: 7.0, vacancy: 7.4,  rent_growth: -3.3, lease_term: 60, renewal_prob: 62, downtime: 13, cap: 5.1, opex: 0.62, taxes: 2.20, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 17.80, cost: 142, free_rent: 3, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 8.2,  rent_growth: -3.6, lease_term: 62, renewal_prob: 60, downtime: 14, cap: 5.1, opex: 0.62, taxes: 2.20, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 14.80, cost: 138, free_rent: 4, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 9.8,  rent_growth: -3.8, lease_term: 65, renewal_prob: 58, downtime: 15, cap: 5.1, opex: 0.62, taxes: 2.20, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 12.40, cost: 132, free_rent: 5, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 11.4, rent_growth: -4.0, lease_term: 65, renewal_prob: 55, downtime: 16, cap: 5.1, opex: 0.62, taxes: 2.20, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 10.80, cost: 124, free_rent: 6, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 14.0, rent_growth: -4.4, lease_term: 72, renewal_prob: 52, downtime: 18, cap: 5.1, opex: 0.62, taxes: 2.20, cap_reserve: 0.10 },
    }
  },
  "San Francisco Bay Area": {
    region: "California", tier: "Avoid", score: 32,
    source: "JLL Q1 2026 / CBRE Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/san-francisco-mid-peninsula-industrial",
    vacancy: 10.6, absorption: -1.8, rent_growth: -4.2, cap_rate: 5.0, pipeline: 1.8,
    note: "⚠️ $148/SF construction cost — highest nationally. Rents declining -4.2% YOY. Tech contraction reduced warehousing demand. Entitlement timelines 3-5 years. Avoid entirely.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 32.00, cost: 178, free_rent: 3, ti_new: 18, ti_renewal: 9, lc: 7.0, vacancy: 7.4,  rent_growth: -3.8, lease_term: 60, renewal_prob: 62, downtime: 13, cap: 5.0, opex: 0.68, taxes: 2.60, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 27.20, cost: 166, free_rent: 3, ti_new: 15, ti_renewal: 8, lc: 7.0, vacancy: 8.4,  rent_growth: -4.0, lease_term: 60, renewal_prob: 60, downtime: 14, cap: 5.0, opex: 0.68, taxes: 2.60, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 23.00, cost: 154, free_rent: 3, ti_new: 13, ti_renewal: 7, lc: 7.0, vacancy: 9.4,  rent_growth: -4.2, lease_term: 62, renewal_prob: 58, downtime: 15, cap: 5.0, opex: 0.68, taxes: 2.60, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 19.20, cost: 150, free_rent: 4, ti_new: 12, ti_renewal: 6, lc: 6.0, vacancy: 11.2, rent_growth: -4.5, lease_term: 65, renewal_prob: 55, downtime: 16, cap: 5.0, opex: 0.68, taxes: 2.60, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 16.20, cost: 144, free_rent: 5, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 13.0, rent_growth: -4.8, lease_term: 65, renewal_prob: 52, downtime: 18, cap: 5.0, opex: 0.68, taxes: 2.60, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 14.20, cost: 134, free_rent: 6, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 16.0, rent_growth: -5.0, lease_term: 72, renewal_prob: 48, downtime: 20, cap: 5.0, opex: 0.68, taxes: 2.60, cap_reserve: 0.10 },
    }
  },
  "Austin": {
    region: "Texas", tier: "Avoid", score: 44,
    source: "JLL Q1 2026 / Colliers Q1 2026",
    report_url: "https://www.jll.com/en-us/insights/market-dynamics/austin-industrial",
    vacancy: 12.4, absorption: 2.2, rent_growth: -0.8, cap_rate: 5.9, pipeline: 8.4,
    note: "⚠️ 12.4% vacancy — highest in Texas — with 8.4 MSF still under construction. Rents declining -0.8% YOY. 2022-2024 speculative wave has not yet digested. Colliers recommends waiting for supply to absorb before any new spec.",
    by_size: {
      "0-50K SF (Small-Bay)":       { rent: 20.40, cost: 104, free_rent: 3, ti_new: 13, ti_renewal: 7, lc: 7.0, vacancy: 8.6,  rent_growth: -0.5, lease_term: 60, renewal_prob: 65, downtime: 12, cap: 5.9, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
      "50K-100K SF":                { rent: 17.00, cost: 96,  free_rent: 3, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 9.8,  rent_growth: -0.6, lease_term: 60, renewal_prob: 63, downtime: 12, cap: 5.9, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
      "100K-250K SF":               { rent: 14.80, cost: 88,  free_rent: 3, ti_new: 12, ti_renewal: 6, lc: 7.0, vacancy: 11.0, rent_growth: -0.8, lease_term: 62, renewal_prob: 63, downtime: 13, cap: 5.9, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
      "250K-500K SF (Cross-Dock)":  { rent: 12.20, cost: 84,  free_rent: 4, ti_new: 10, ti_renewal: 5, lc: 6.0, vacancy: 13.2, rent_growth: -1.0, lease_term: 65, renewal_prob: 60, downtime: 14, cap: 5.9, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
      "500K-750K SF (Cross-Dock)":  { rent: 10.20, cost: 80,  free_rent: 5, ti_new: 9,  ti_renewal: 4, lc: 6.0, vacancy: 14.6, rent_growth: -1.2, lease_term: 65, renewal_prob: 57, downtime: 15, cap: 5.9, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
      "750K SF+ (Mega-DC)":         { rent: 8.80,  cost: 74,  free_rent: 6, ti_new: 8,  ti_renewal: 4, lc: 6.0, vacancy: 17.2, rent_growth: -1.5, lease_term: 72, renewal_prob: 54, downtime: 17, cap: 5.9, opex: 0.50, taxes: 1.10, cap_reserve: 0.10 },
    }
  },
};

// ── Tier colors ───────────────────────────────────────────────────────────────
const tierStyle = {
  Primary:   { bg: 'rgba(110,231,183,0.08)', border: 'rgba(110,231,183,0.25)', color: 'var(--good)' },
  Secondary: { bg: 'rgba(147,197,253,0.08)', border: 'rgba(147,197,253,0.25)', color: 'var(--info)' },
  Avoid:     { bg: 'rgba(252,165,165,0.08)', border: 'rgba(252,165,165,0.25)', color: 'var(--danger)' },
};

const REGIONS = ['All regions', ...new Set(Object.values(MARKETS).map(m => m.region).sort())];
const TIERS   = ['All tiers', 'Primary', 'Secondary', 'Avoid'];
const SIZES   = Object.keys(Object.values(MARKETS)[0].by_size);

// ── Field definitions for the output table ───────────────────────────────────
const FIELDS = [
  { key: 'rent',          label: 'Asking Rent',         fmt: v => `$${Number(v).toFixed(2)}/SF`,   color: v => 'var(--orange)',        group: 'Revenue' },
  { key: 'rent_growth',   label: 'Rent Growth',         fmt: v => `${v >= 0 ? '+' : ''}${Number(v).toFixed(1)}%/yr`, color: v => v >= 3 ? 'var(--good)' : v < 0 ? 'var(--danger)' : 'var(--muted)', group: 'Revenue' },
  { key: 'vacancy',       label: 'Vacancy Rate',        fmt: v => `${Number(v).toFixed(1)}%`,       color: v => v < 7 ? 'var(--good)' : v < 10 ? 'var(--warn)' : 'var(--danger)', group: 'Revenue' },
  { key: 'cost',          label: 'Build Cost',          fmt: v => `$${Math.round(v)}/SF`,            color: v => v < 70 ? 'var(--good)' : v > 120 ? 'var(--danger)' : 'var(--muted)', group: 'Construction' },
  { key: 'free_rent',     label: 'Free Rent',           fmt: v => `${v} months`,                    color: () => 'var(--muted)',        group: 'Leasing' },
  { key: 'ti_new',        label: 'TI — New Lease',      fmt: v => `$${v}/SF`,                       color: () => 'var(--muted)',        group: 'Leasing' },
  { key: 'ti_renewal',    label: 'TI — Renewal',        fmt: v => `$${v}/SF`,                       color: () => 'var(--muted)',        group: 'Leasing' },
  { key: 'lc',            label: 'Leasing Commission',  fmt: v => `${v}%`,                          color: () => 'var(--muted)',        group: 'Leasing' },
  { key: 'lease_term',    label: 'Avg Lease Term',      fmt: v => `${v} months`,                    color: () => 'var(--muted)',        group: 'Leasing' },
  { key: 'renewal_prob',  label: 'Renewal Probability', fmt: v => `${v}%`,                          color: v => v >= 75 ? 'var(--good)' : 'var(--muted)', group: 'Leasing' },
  { key: 'downtime',      label: 'Downtime (Rollover)', fmt: v => `${v} months`,                    color: v => v <= 7 ? 'var(--good)' : v >= 12 ? 'var(--danger)' : 'var(--muted)', group: 'Leasing' },
  { key: 'cap',           label: 'Exit Cap Rate',       fmt: v => `${Number(v).toFixed(2)}%`,       color: () => 'var(--text)',         group: 'Exit' },
  { key: 'opex',          label: 'OpEx',                fmt: v => `$${Number(v).toFixed(2)}/SF`,    color: () => 'var(--muted)',        group: 'Operating' },
  { key: 'taxes',         label: 'Real Estate Taxes',   fmt: v => `$${Number(v).toFixed(2)}/SF`,    color: () => 'var(--muted)',        group: 'Operating' },
  { key: 'cap_reserve',   label: 'Capital Reserve',     fmt: v => `$${Number(v).toFixed(2)}/SF`,    color: () => 'var(--muted)',        group: 'Operating' },
];

export default function UnderwritingPage() {
  const [selectedMarket, setMarket] = useState('');
  const [selectedSize,   setSize]   = useState('100K-250K SF');
  const [regionFilter,   setRegion] = useState('All regions');
  const [tierFilter,     setTier]   = useState('All tiers');
  const [search,         setSearch] = useState('');

  const mktData = selectedMarket ? MARKETS[selectedMarket] : null;
  const sizeData = mktData?.by_size?.[selectedSize] || null;

  const filteredMarkets = Object.entries(MARKETS)
    .filter(([name, m]) => regionFilter === 'All regions' || m.region === regionFilter)
    .filter(([name, m]) => tierFilter   === 'All tiers'   || m.tier   === tierFilter)
    .filter(([name])    => !search || name.toLowerCase().includes(search.toLowerCase()))
    .sort(([, a], [, b]) => b.score - a.score);

  const groups = [...new Set(FIELDS.map(f => f.group))];

  return (
    <>
      {/* Stats row */}
      <div className="mrow">
        <div className="mc">
          <div className="mcl">Markets available</div>
          <div className="mcv">{Object.keys(MARKETS).length}</div>
          <div className="mcc nu">With quarterly broker reports</div>
        </div>
        <div className="mc">
          <div className="mcl">Selected market</div>
          <div className="mcv" style={{fontSize:15,marginTop:4}}>{selectedMarket || '—'}</div>
          <div className="mcc nu">{mktData ? `${mktData.region} · ${mktData.tier}` : 'Select below'}</div>
        </div>
        <div className="mc">
          <div className="mcl">Building size</div>
          <div className="mcv" style={{fontSize:14,marginTop:4}}>{selectedSize}</div>
          <div className="mcc nu">Select any segment</div>
        </div>
        <div className="mc">
          <div className="mcl">Market cap rate</div>
          <div className="mcv">{mktData ? `${mktData.cap_rate}%` : '—'}</div>
          <div className="mcc nu">{mktData ? `Vacancy: ${mktData.vacancy}%` : 'Load market data'}</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:14, alignItems:'start'}}>

        {/* ── Left: Market selector ──────────────────────── */}
        <div>
          <div className="panel" style={{marginBottom:12}}>
            <div className="ph"><span className="pt">Select market</span><span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:'var(--dim)'}}>{filteredMarkets.length} markets</span></div>

            {/* Filters */}
            <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:8}}>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search markets..."
                style={{background:'var(--surf2)',border:'1px solid var(--border2)',borderRadius:5,padding:'7px 11px',color:'var(--text)',fontSize:11,outline:'none',width:'100%',fontFamily:'Inter,sans-serif'}}
              />
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {TIERS.map(t=>(
                  <button key={t} onClick={()=>setTier(t)} className={`btn bsm ${tierFilter===t?'bp':'bg'}`} style={{fontSize:9}}>
                    {t==='All tiers'?'All':t}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {REGIONS.map(r=>(
                  <button key={r} onClick={()=>setRegion(r)} className={`btn bsm ${regionFilter===r?'bp':'bg'}`} style={{fontSize:9}}>
                    {r==='All regions'?'All':r.replace(' ','\n')}
                  </button>
                ))}
              </div>
            </div>

            {/* Market list */}
            <div style={{maxHeight:520,overflowY:'auto'}}>
              {filteredMarkets.map(([name, m]) => {
                const ts = tierStyle[m.tier] || tierStyle.Secondary;
                const isSelected = selectedMarket === name;
                return (
                  <div
                    key={name}
                    onClick={() => setMarket(name)}
                    style={{
                      padding:'10px 14px', cursor:'pointer',
                      borderBottom:'1px solid var(--border)',
                      background: isSelected ? 'rgba(245,166,35,0.07)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--orange)' : '3px solid transparent',
                      transition:'all 0.12s',
                    }}
                  >
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:600,color:isSelected?'var(--orange)':'var(--text)'}}>{name}</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color:ts.color}}>{m.score}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:'var(--dim)'}}>{m.region}</span>
                      <span style={{fontSize:8,padding:'1px 6px',borderRadius:3,background:ts.bg,border:`1px solid ${ts.border}`,color:ts.color}}>{m.tier}</span>
                      <span style={{marginLeft:'auto',fontSize:9,color:'var(--muted)'}}>Vac: {m.vacancy}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Size selector */}
          <div className="panel">
            <div className="ph"><span className="pt">Building size</span></div>
            <div style={{padding:'10px 14px',display:'flex',flexDirection:'column',gap:6}}>
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  style={{
                    padding:'9px 12px', textAlign:'left', borderRadius:6, cursor:'pointer',
                    fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:500,
                    border:'none', transition:'all 0.12s',
                    background: selectedSize===s ? 'var(--orange)' : 'var(--surf2)',
                    color: selectedSize===s ? '#0D0F14' : 'var(--muted)',
                    borderLeft: selectedSize===s ? 'none' : '2px solid transparent',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Assumptions output ─────────────────── */}
        <div>
          {!selectedMarket ? (
            <div className="panel" style={{padding:'60px 40px',textAlign:'center'}}>
              <div style={{fontSize:32,marginBottom:16}}>◇</div>
              <div style={{fontSize:14,color:'var(--text)',fontWeight:600,marginBottom:8}}>Select a market to populate assumptions</div>
              <div style={{fontSize:11,color:'var(--dim)',maxWidth:400,margin:'0 auto',lineHeight:1.7}}>
                Choose a market from the left and a building size to instantly populate underwriting assumptions sourced from Q1 2026 JLL, CBRE, C&W, Avison Young, Newmark, and Colliers reports.
              </div>
            </div>
          ) : (
            <>
              {/* Market header */}
              <div className="panel" style={{marginBottom:12}}>
                <div style={{padding:'16px 18px'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                        <span style={{fontSize:18,fontFamily:"'Playfair Display',serif",fontWeight:600,color:'var(--text)'}}>{selectedMarket}</span>
                        <span style={{fontSize:9,padding:'2px 8px',borderRadius:3,...tierStyle[mktData.tier],fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{mktData.tier}</span>
                      </div>
                      <div style={{fontSize:11,color:'var(--dim)'}}>{mktData.source}</div>
                    </div>
                    <a href={mktData.report_url} target="_blank" rel="noreferrer"
                       style={{fontSize:10,padding:'6px 12px',borderRadius:5,background:'rgba(245,166,35,0.08)',color:'var(--orange)',border:'1px solid rgba(245,166,35,0.2)',textDecoration:'none',fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>
                      View source report ↗
                    </a>
                  </div>

                  {/* Market fundamentals */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:12}}>
                    {[
                      {l:'Market vacancy',  v:`${mktData.vacancy}%`,          c: mktData.vacancy<7?'var(--good)':mktData.vacancy<10?'var(--warn)':'var(--danger)'},
                      {l:'YTD absorption',  v:`${mktData.absorption} MSF`,    c: mktData.absorption>=0?'var(--good)':'var(--danger)'},
                      {l:'Rent growth',     v:`${mktData.rent_growth>0?'+':''}${mktData.rent_growth}%`, c:'var(--orange)'},
                      {l:'Market cap rate', v:`${mktData.cap_rate}%`,          c:'var(--text)'},
                      {l:'Pipeline',        v:`${mktData.pipeline} MSF`,       c:'var(--muted)'},
                    ].map(x=>(
                      <div key={x.l} style={{background:'var(--surf2)',borderRadius:6,padding:'10px 12px'}}>
                        <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:'var(--dim)',textTransform:'uppercase',marginBottom:4}}>{x.l}</div>
                        <div style={{fontSize:16,fontFamily:"'Playfair Display',serif",fontWeight:600,color:x.c}}>{x.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Market notes */}
                  <div style={{fontSize:11,color:'var(--muted)',lineHeight:1.7,padding:'10px 12px',background:'var(--surf2)',borderRadius:6,borderLeft:'3px solid var(--orange)'}}>
                    {mktData.note}
                  </div>
                </div>
              </div>

              {/* Size header */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>
                  {selectedMarket} — {selectedSize}
                </div>
                <div style={{fontSize:10,color:'var(--dim)',fontFamily:"'JetBrains Mono',monospace"}}>
                  Q1 2026 broker data · All values per SF/yr unless noted
                </div>
              </div>

              {/* Assumptions grouped by category */}
              {groups.map(group => (
                <div key={group} className="panel" style={{marginBottom:12}}>
                  <div className="ph">
                    <span className="pt">{group}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:0}}>
                    {FIELDS.filter(f=>f.group===group).map((field,i,arr) => {
                      const val = sizeData?.[field.key];
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={field.key} style={{
                          padding:'16px 18px',
                          borderRight: (i+1)%3===0?'none':'1px solid var(--border)',
                          borderBottom: i < arr.length - (arr.length%3||3) ? '1px solid var(--border)' : 'none',
                        }}>
                          <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:'var(--dim)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>
                            {field.label}
                          </div>
                          <div style={{fontSize:22,fontFamily:"'Playfair Display',serif",fontWeight:600,color:val!=null?field.color(val):'var(--dim)',marginBottom:4}}>
                            {val != null ? field.fmt(val) : 'N/A'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* All sizes comparison */}
              <div className="panel">
                <div className="ph"><span className="pt">All size segments — {selectedMarket}</span><span className="badge bl">Rent · Cost · Vacancy</span></div>
                <div style={{overflowX:'auto'}}>
                  <table className="dtbl" style={{minWidth:700}}>
                    <thead><tr>
                      <th style={{textAlign:'left'}}>Size segment</th>
                      <th>Rent $/SF</th>
                      <th>Rent growth</th>
                      <th>Vacancy</th>
                      <th>Build $/SF</th>
                      <th>Free rent</th>
                      <th>TI new</th>
                      <th>Cap rate</th>
                    </tr></thead>
                    <tbody>
                      {SIZES.map(sz => {
                        const d = mktData.by_size[sz];
                        const isSelected = sz === selectedSize;
                        return (
                          <tr key={sz} onClick={()=>setSize(sz)} style={{cursor:'pointer',background:isSelected?'rgba(245,166,35,0.05)':'transparent'}}>
                            <td style={{fontWeight:isSelected?700:600,color:isSelected?'var(--orange)':'var(--text)'}}>{sz}</td>
                            <td className="mono" style={{color:'var(--orange)',fontWeight:600}}>${Number(d.rent).toFixed(2)}</td>
                            <td className="mono" style={{color:d.rent_growth>=3?'var(--good)':d.rent_growth<0?'var(--danger)':'var(--muted)'}}>{d.rent_growth>=0?'+':''}{d.rent_growth}%</td>
                            <td className="mono" style={{color:d.vacancy<7?'var(--good)':d.vacancy<10?'var(--warn)':'var(--danger)'}}>{d.vacancy}%</td>
                            <td className="mono" style={{color:d.cost<70?'var(--good)':d.cost>120?'var(--danger)':'var(--muted)'}}>${d.cost}</td>
                            <td className="mono">{d.free_rent} mos</td>
                            <td className="mono">${d.ti_new}/SF</td>
                            <td className="mono">{d.cap}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
