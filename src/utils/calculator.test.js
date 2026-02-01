import { describe, it, expect } from 'vitest';
import { calculateDose, formatNumber, UNITS, CONVERSION_FACTOR } from './calculator';

describe('calculateDose', () => {
  it('calculates basic insulin dose correctly', () => {
    const result = calculateDose({
      currentBG: 180,
      targetBG: 100,
      correctionFactor: 50,
      carbs: 60,
      carbRatio: 10,
      unit: UNITS.MGDL
    });

    expect(result).toEqual({
      correctionDose: 1.6,
      carbDose: 6,
      totalDose: 7.6
    });
  });

  it('returns null for invalid inputs', () => {
    const result = calculateDose({
      currentBG: 'invalid',
      targetBG: 100,
      correctionFactor: 50,
      carbs: 60,
      carbRatio: 10,
      unit: UNITS.MGDL
    });

    expect(result).toBeNull();
  });

  it('returns 0 for negative correction dose', () => {
    const result = calculateDose({
      currentBG: 80,
      targetBG: 100,
      correctionFactor: 50,
      carbs: 0,
      carbRatio: 10,
      unit: UNITS.MGDL
    });

    expect(result.correctionDose).toBe(0);
    expect(result.totalDose).toBe(0);
  });

  it('handles zero carbs correctly', () => {
    const result = calculateDose({
      currentBG: 150,
      targetBG: 100,
      correctionFactor: 50,
      carbs: 0,
      carbRatio: 10,
      unit: UNITS.MGDL
    });

    expect(result.carbDose).toBe(0);
    expect(result.correctionDose).toBe(1);
    expect(result.totalDose).toBe(1);
  });

  it('handles mmol/L units', () => {
    const result = calculateDose({
      currentBG: 10,
      targetBG: 5.5,
      correctionFactor: 2.8,
      carbs: 60,
      carbRatio: 10,
      unit: UNITS.MMOL
    });

    expect(result).toBeDefined();
    expect(result.totalDose).toBeGreaterThan(0);
  });
});

describe('formatNumber', () => {
  it('rounds to 1 decimal place', () => {
    expect(formatNumber(7.654)).toBe(7.7);
    expect(formatNumber(7.634)).toBe(7.6);
    expect(formatNumber(7.65)).toBe(7.7);
  });

  it('handles integers', () => {
    expect(formatNumber(5)).toBe(5.0);
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe(0.0);
  });
});

describe('CONSTANTS', () => {
  it('exports correct units', () => {
    expect(UNITS.MGDL).toBe('mg/dL');
    expect(UNITS.MMOL).toBe('mmol/L');
  });

  it('exports correct conversion factor', () => {
    expect(CONVERSION_FACTOR).toBe(18.0182);
  });
});
