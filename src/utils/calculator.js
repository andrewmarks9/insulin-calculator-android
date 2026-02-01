export const UNITS = {
  MGDL: 'mg/dL',
  MMOL: 'mmol/L'
};

export const CONVERSION_FACTOR = 18.0182; // mmol/L * 18.0182 = mg/dL

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

  // Calculate Correction Dose
  // (Current - Target) / CorrectionFactor
  let correctionDose = (current - target) / correction;
  
  // Calculate Carb Dose
  // Carbs / Ratio
  let carbDose = c / ratio;

  // Total
  let total = correctionDose + carbDose;

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
