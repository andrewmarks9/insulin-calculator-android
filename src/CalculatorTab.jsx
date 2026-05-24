import React from 'react';
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
  const errorClass = (field) =>
    invalidCalculateFields.includes(field)
      ? `input-error${shakeInvalidFields ? ' input-shake' : ''}`
      : '';

  return (
    <div className="calculator-view">
      <div className="input-group">
        <label>Current BG ({unit})</label>
        <input
          type="number"
          inputMode="decimal"
          name="currentBG"
          value={inputs.currentBG}
          onChange={onInputChange}
          placeholder="e.g. 150"
          className={errorClass('currentBG')}
        />
      </div>
      <div className="input-group">
        <label>Target BG ({unit})</label>
        <input
          type="number"
          inputMode="decimal"
          name="targetBG"
          value={inputs.targetBG}
          onChange={onInputChange}
          placeholder="e.g. 100"
          className={errorClass('targetBG')}
        />
      </div>
      <div className="input-group">
        <label>Carbs (g)</label>
        <div className="carbs-input-container" style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number"
            inputMode="decimal"
            name="carbs"
            value={inputs.carbs}
            onChange={onInputChange}
            placeholder="e.g. 60"
            className={errorClass('carbs')}
            style={{ flex: 1, margin: 0 }}
          />
          <button
            type="button"
            className="camera-btn"
            onClick={onScanMeal}
            disabled={isAnalyzingImage}
            style={{
              background: '#e0e7ff',
              color: '#4f46e5',
              border: 'none',
              borderRadius: '8px',
              padding: '0 15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              minWidth: '48px'
            }}
            title="Estimate Carbs from Photo"
          >
            {isAnalyzingImage ? '⏳' : '📷'}
          </button>
        </div>
      </div>

      <div className="input-group">
        <label>Food Description (Optional)</label>
        <input
          type="text"
          name="foodName"
          value={inputs.foodName}
          onChange={onInputChange}
          placeholder="e.g. Slice of Pizza"
        />
      </div>

      <div className="settings-row">
        <div className="input-group">
          <label>Carb Ratio (g/u)</label>
          <input
            type="number"
            inputMode="decimal"
            name="carbRatio"
            value={inputs.carbRatio}
            onChange={onInputChange}
            className={errorClass('carbRatio')}
          />
        </div>
        <div className="input-group">
          <label>ISK / Sensitivity</label>
          <input
            type="number"
            inputMode="decimal"
            name="correctionFactor"
            value={inputs.correctionFactor}
            onChange={onInputChange}
            className={errorClass('correctionFactor')}
          />
        </div>
      </div>

      {statusMessage && (
        <div className={`export-status ${statusMessage.type}`}>
          {statusMessage.type === 'success' ? '✓ ' : '⚠ '}
          {statusMessage.message}
        </div>
      )}

      {calculateError && <p className="validation-error">{calculateError}</p>}

      <button className="primary-btn" onClick={onCalculate}>Calculate Dose</button>

      {result && (
        <div className="result-card">
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
