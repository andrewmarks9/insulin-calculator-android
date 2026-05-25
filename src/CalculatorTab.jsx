import React, { useEffect, useRef } from 'react';
import { formatNumber } from './utils/calculator';

export function CalculatorTab({
  unit,
  inputs,
  onInputChange,
  result,
  statusMessage,
  calculateError,
  invalidCalculateFields,
  shakeInvalidFields,
  isAnalyzingImage,
  onCalculate,
  onScanMeal
}) {
  const resultCardRef = useRef(null);

  useEffect(() => {
    if (result && resultCardRef.current) {
      resultCardRef.current.focus();
    }
  }, [result]);

  const errorClass = (field) =>
    invalidCalculateFields.includes(field)
      ? `input-error${shakeInvalidFields ? ' input-shake' : ''}`
      : '';

  const hasFieldError = (field) => invalidCalculateFields.includes(field);
  const getFieldDescribedBy = (field) => (hasFieldError(field) && calculateError ? 'calculate-error' : undefined);

  return (
    <div className="calculator-view">
      <div className="input-group">
        <label htmlFor="currentBG">Current BG ({unit})</label>
        <input
          id="currentBG"
          type="number"
          inputMode="decimal"
          name="currentBG"
          value={inputs.currentBG}
          onChange={onInputChange}
          placeholder="e.g. 150"
          className={errorClass('currentBG')}
          aria-invalid={hasFieldError('currentBG')}
          aria-describedby={getFieldDescribedBy('currentBG')}
        />
      </div>
      <div className="input-group">
        <label htmlFor="targetBG">Target BG ({unit})</label>
        <input
          id="targetBG"
          type="number"
          inputMode="decimal"
          name="targetBG"
          value={inputs.targetBG}
          onChange={onInputChange}
          placeholder="e.g. 100"
          className={errorClass('targetBG')}
          aria-invalid={hasFieldError('targetBG')}
          aria-describedby={getFieldDescribedBy('targetBG')}
        />
      </div>
      <div className="input-group">
        <label htmlFor="carbs">Carbs (g)</label>
        <div className="carbs-input-container">
          <input
            id="carbs"
            type="number"
            inputMode="decimal"
            name="carbs"
            value={inputs.carbs}
            onChange={onInputChange}
            placeholder="e.g. 60"
            className={`carbs-input ${errorClass('carbs')}`.trim()}
            aria-invalid={hasFieldError('carbs')}
            aria-describedby={getFieldDescribedBy('carbs')}
          />
          <button
            type="button"
            className="camera-btn"
            onClick={onScanMeal}
            disabled={isAnalyzingImage}
            title="Estimate Carbs from Photo"
            aria-label="Estimate carbs from photo"
          >
            {isAnalyzingImage ? '⏳' : '📷'}
          </button>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="foodName">Food Description (Optional)</label>
        <input
          id="foodName"
          type="text"
          name="foodName"
          value={inputs.foodName}
          onChange={onInputChange}
          placeholder="e.g. Slice of Pizza"
        />
      </div>

      <div className="settings-row">
        <div className="input-group">
          <label htmlFor="carbRatio">Carb Ratio (g/u)</label>
          <input
            id="carbRatio"
            type="number"
            inputMode="decimal"
            name="carbRatio"
            value={inputs.carbRatio}
            onChange={onInputChange}
            className={errorClass('carbRatio')}
            aria-invalid={hasFieldError('carbRatio')}
            aria-describedby={getFieldDescribedBy('carbRatio')}
          />
        </div>
        <div className="input-group">
          <label htmlFor="correctionFactor">ISK / Sensitivity</label>
          <input
            id="correctionFactor"
            type="number"
            inputMode="decimal"
            name="correctionFactor"
            value={inputs.correctionFactor}
            onChange={onInputChange}
            className={errorClass('correctionFactor')}
            aria-invalid={hasFieldError('correctionFactor')}
            aria-describedby={getFieldDescribedBy('correctionFactor')}
          />
        </div>
      </div>

      {statusMessage && (
        <div
          className={`export-status ${statusMessage.type}`}
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          aria-live={statusMessage.type === 'error' ? 'assertive' : 'polite'}
        >
          {statusMessage.type === 'success' ? '✓ ' : '⚠ '}
          {statusMessage.message}
        </div>
      )}

      {calculateError && (
        <p id="calculate-error" className="validation-error" role="alert">
          {calculateError}
        </p>
      )}

      <button className="primary-btn" onClick={onCalculate}>Calculate Dose</button>

      {result && (
        <div className="result-card" ref={resultCardRef} tabIndex={-1} role="status" aria-live="polite">
          <h2>Total: {formatNumber(result.totalDose)} Units</h2>
          <div className="result-breakdown">
            <span>Carb Dose: {formatNumber(result.carbDose)}</span>
            <span>Corr. Dose: {formatNumber(result.correctionDose)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
