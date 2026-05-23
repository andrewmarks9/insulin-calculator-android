export const UNITS = {
  MGDL: 'mg/dL',
  MMOL: 'mmol/L'
};

export const CONVERSION_FACTOR = 18.0182; // mmol/L * 18.0182 = mg/dL

export function convertUnitValue(value, fromUnit, toUnit, precision = 2) {
  if (value === '' || value === null || value === undefined || fromUnit === toUnit) {
    return value;
  }

  const numericValue = parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return value;
  }

  const convertedValue = fromUnit === UNITS.MGDL && toUnit === UNITS.MMOL
    ? numericValue / CONVERSION_FACTOR
    : fromUnit === UNITS.MMOL && toUnit === UNITS.MGDL
      ? numericValue * CONVERSION_FACTOR
      : numericValue;

  return Number.parseFloat(convertedValue.toFixed(precision)).toString();
}

export function calculateDose({
  currentBG,
  targetBG,
  correctionFactor,
  carbs,
  carbRatio
}) {
  const current = parseFloat(currentBG);
  const target = parseFloat(targetBG);
  const correction = parseFloat(correctionFactor);
  const c = parseFloat(carbs);
  const ratio = parseFloat(carbRatio);

  if (isNaN(current) || isNaN(target) || isNaN(correction) || isNaN(c) || isNaN(ratio)) {
    return null;
  }

  // Guard against invalid denominators that would produce Infinity/NaN.
  if (correction === 0 || ratio === 0) {
    return null;
  }

  // Calculate Correction Dose
  // (Current - Target) / CorrectionFactor
  let correctionDose = (current - target) / correction;
  
  // Calculate Carb Dose
  // Carbs / Ratio
  let carbDose = c / ratio;

  // Total
  let total = Math.max(0, correctionDose) + Math.max(0, carbDose);

  // Rounding to 1 decimal place (or 0.5 steps depending on pump/pen, standard is usually 1 decimal for apps)
  return {
    correctionDose: Math.max(0, correctionDose), // Usually don't give negative correction unless specified
    carbDose: Math.max(0, carbDose),
    totalDose: Math.max(0, total)
  };
}

export function formatNumber(num) {
  return parseFloat(num.toFixed(1)); // Return number with 1 decimal place
}
