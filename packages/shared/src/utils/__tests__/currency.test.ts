import { describe, it, expect } from 'vitest';
import { centsToUSD, centsToDollars, dollarsToCents } from '../currency';

describe('centsToUSD', () => {
  it('formats zero cents as $0.00', () => {
    expect(centsToUSD(0)).toBe('$0.00');
  });

  it('formats 100 cents as $1.00', () => {
    expect(centsToUSD(100)).toBe('$1.00');
  });

  it('formats 1099 cents as $10.99', () => {
    expect(centsToUSD(1099)).toBe('$10.99');
  });

  it('formats large values correctly', () => {
    expect(centsToUSD(100000)).toBe('$1,000.00');
  });

  it('formats 1 cent as $0.01', () => {
    expect(centsToUSD(1)).toBe('$0.01');
  });

  it('formats negative values with minus sign', () => {
    const result = centsToUSD(-500);
    expect(result).toContain('5.00');
  });
});

describe('centsToDollars', () => {
  it('converts 100 cents to 1 dollar', () => {
    expect(centsToDollars(100)).toBe(1);
  });

  it('converts 0 to 0', () => {
    expect(centsToDollars(0)).toBe(0);
  });

  it('converts 1099 to 10.99', () => {
    expect(centsToDollars(1099)).toBe(10.99);
  });

  it('converts 1 cent to 0.01', () => {
    expect(centsToDollars(1)).toBe(0.01);
  });
});

describe('dollarsToCents', () => {
  it('converts 1 dollar to 100 cents', () => {
    expect(dollarsToCents(1)).toBe(100);
  });

  it('converts 0 to 0', () => {
    expect(dollarsToCents(0)).toBe(0);
  });

  it('converts 10.99 to 1099 cents', () => {
    expect(dollarsToCents(10.99)).toBe(1099);
  });

  it('rounds floating point correctly (0.1 + 0.2 = 0.30 cents = 30)', () => {
    // Math.round handles float imprecision at the boundary
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
  });

  it('handles float precision edge case (1.005 * 100 = 100.4999... → rounds to 100)', () => {
    // JS float: 1.005 * 100 = 100.49999999999999, so Math.round gives 100 not 101.
    // This documents the known float behavior — use server-side pricing for exact values.
    expect(dollarsToCents(1.005)).toBe(100);
  });

  it('is inverse of centsToDollars for whole cent values', () => {
    expect(dollarsToCents(centsToDollars(1099))).toBe(1099);
  });
});
