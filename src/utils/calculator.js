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

  const clampedCorrectionDose = Math.max(0, correctionDose);
  const clampedCarbDose = Math.max(0, carbDose);

  // Round at return time so UI, history, and export values stay aligned.
  const roundedCorrectionDose = formatNumber(clampedCorrectionDose);
  const roundedCarbDose = formatNumber(clampedCarbDose);

  return {
    correctionDose: roundedCorrectionDose,
    carbDose: roundedCarbDose,
    totalDose: formatNumber(roundedCorrectionDose + roundedCarbDose)
  };
}

export function formatNumber(num) {
  return parseFloat(num.toFixed(1)); // Return number with 1 decimal place
}
