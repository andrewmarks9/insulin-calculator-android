import { describe, it, expect } from 'vitest';
import { calculateDose, formatNumber, UNITS, CONVERSION_FACTOR, convertUnitValue } from './calculator';

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

  it('returns null when correctionFactor is zero', () => {
    const result = calculateDose({
      currentBG: 180,
      targetBG: 100,
      correctionFactor: 0,
      carbs: 60,
      carbRatio: 10,
      unit: UNITS.MGDL
    });

    expect(result).toBeNull();
  });

  it('returns null when carbRatio is zero', () => {
    const result = calculateDose({
      currentBG: 180,
      targetBG: 100,
      correctionFactor: 50,
      carbs: 60,
      carbRatio: 0,
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

  it('keeps totalDose aligned with clamped component doses', () => {
    const result = calculateDose({
      currentBG: 80,
      targetBG: 100,
      correctionFactor: 50,
      carbs: 2,
      carbRatio: 10,
      unit: UNITS.MGDL
    });

    expect(result).toEqual({
      correctionDose: 0,
      carbDose: 0.2,
      totalDose: 0.2
    });
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

  it('calculates expected dose for known mmol/L inputs', () => {
    const result = calculateDose({
      currentBG: 10,
      targetBG: 5.5,
      correctionFactor: 2.8,
      carbs: 60,
      carbRatio: 10,
      unit: UNITS.MMOL
    });

    expect(result).toEqual({
      correctionDose: 1.6,
      carbDose: 6,
      totalDose: 7.6
    });
  });

  it('matches mmol/L dose with equivalent converted mg/dL inputs', () => {
    const mmolInput = {
      currentBG: '10',
      targetBG: '5.5',
      correctionFactor: '2.8',
      carbs: 60,
      carbRatio: 10
    };

    const mgdlInput = {
      currentBG: convertUnitValue(mmolInput.currentBG, UNITS.MMOL, UNITS.MGDL, 4),
      targetBG: convertUnitValue(mmolInput.targetBG, UNITS.MMOL, UNITS.MGDL, 4),
      correctionFactor: convertUnitValue(mmolInput.correctionFactor, UNITS.MMOL, UNITS.MGDL, 4),
      carbs: mmolInput.carbs,
      carbRatio: mmolInput.carbRatio
    };

    const mmolResult = calculateDose({
      ...mmolInput,
      unit: UNITS.MMOL
    });

    const mgdlResult = calculateDose({
      ...mgdlInput,
      unit: UNITS.MGDL
    });

    expect(mgdlResult).toEqual(mmolResult);
  });

  it('rounds returned doses to one decimal for consistent persistence', () => {
    const result = calculateDose({
      currentBG: 183,
      targetBG: 100,
      correctionFactor: 70,
      carbs: 35,
      carbRatio: 9,
      unit: UNITS.MGDL
    });

    expect(result).toEqual({
      correctionDose: 1.2,
      carbDose: 3.9,
      totalDose: 5.1
    });
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

describe('convertUnitValue', () => {
  it('converts mg/dL to mmol/L', () => {
    expect(convertUnitValue('180', UNITS.MGDL, UNITS.MMOL, 2)).toBe('9.99');
    expect(convertUnitValue('50', UNITS.MGDL, UNITS.MMOL, 3)).toBe('2.775');
  });

  it('converts mmol/L to mg/dL', () => {
    expect(convertUnitValue('10', UNITS.MMOL, UNITS.MGDL, 2)).toBe('180.18');
    expect(convertUnitValue('2.775', UNITS.MMOL, UNITS.MGDL, 1)).toBe('50');
  });

  it('leaves invalid or empty values unchanged', () => {
    expect(convertUnitValue('', UNITS.MGDL, UNITS.MMOL)).toBe('');
    expect(convertUnitValue('abc', UNITS.MGDL, UNITS.MMOL)).toBe('abc');
  });
});
