import React, { useState, useEffect } from 'react';
import { calculateDose, formatNumber, UNITS, convertUnitValue } from './utils/calculator';
import { saveHistoryItem, getHistory, clearHistory, saveSettings, getSettings, enforceHistoryLimit, DEFAULT_HISTORY_LIMIT_GB, MIN_HISTORY_LIMIT_GB, MAX_HISTORY_LIMIT_GB } from './utils/storage';
import { ensureStoragePermission, checkStoragePermission, getPermissionErrorMessage, PermissionState, isNativePlatform } from './utils/permissions';
import { PrivacyPolicy } from './PrivacyPolicy';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { estimateCarbsFromImage } from './utils/ai';
import { validateExportInput, buildExportDataset, renderChartsToImages, buildPdfDocument, savePdfToFilesystem, sharePdf } from './utils/pdfExport';
import './App.css';
import './PrivacyPolicy.css';

function App() {
  const [unit, setUnit] = useState(UNITS.MGDL);
  const [inputs, setInputs] = useState({
    currentBG: '',
    targetBG: '',
    carbs: '',
    foodName: '',
    carbRatio: '',
    correctionFactor: '',
    geminiApiKey: '',
    historyLimitGb: DEFAULT_HISTORY_LIMIT_GB.toString()
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('calculate'); // 'calculate' or 'history'
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [exportStatus, setExportStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [calculateError, setCalculateError] = useState('');
  const [invalidCalculateFields, setInvalidCalculateFields] = useState([]);
  const [shakeInvalidFields, setShakeInvalidFields] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null); // Permission state
  const [dateRange, setDateRange] = useState(30); // Days to show: 3, 7, 14, 30, 90

  useEffect(() => {
    setHistory(getHistory());
    const savedSettings = getSettings();
    if (savedSettings) {
      if (savedSettings.unit) setUnit(savedSettings.unit);
      setInputs(prev => ({
        ...prev,
        targetBG: savedSettings.targetBG || '',
        carbRatio: savedSettings.carbRatio || '',
        correctionFactor: savedSettings.correctionFactor || '',
        geminiApiKey: savedSettings.geminiApiKey || '',
        historyLimitGb: (savedSettings.historyLimitGb || DEFAULT_HISTORY_LIMIT_GB).toString()
      }));
    }
    
    // Check permission status on load (only on native platform)
    if (isNativePlatform()) {
      checkPermissionStatus();
    }
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const status = await checkStoragePermission();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const result = await ensureStoragePermission(true);
      setPermissionStatus(result.state);
      
      if (result.granted) {
        setExportStatus({ type: 'success', message: 'Storage permission granted!' });
        setTimeout(() => setExportStatus(null), 3000);
      } else {
        setExportStatus({ 
          type: 'error', 
          message: 'Permission denied. Please enable it in Settings → Apps → Insulin Calculator → Permissions → Storage' 
        });
        setTimeout(() => setExportStatus(null), 8000);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setExportStatus({ type: 'error', message: 'Failed to request permission' });
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  useEffect(() => {
    saveSettings({
      unit,
      targetBG: inputs.targetBG,
      carbRatio: inputs.carbRatio,
      correctionFactor: inputs.correctionFactor,
      geminiApiKey: inputs.geminiApiKey,
      historyLimitGb: inputs.historyLimitGb
    });
  }, [unit, inputs.targetBG, inputs.carbRatio, inputs.correctionFactor, inputs.geminiApiKey, inputs.historyLimitGb]);

  useEffect(() => {
    const updatedHistory = enforceHistoryLimit(inputs.historyLimitGb);
    setHistory(updatedHistory);
  }, [inputs.historyLimitGb]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
    if (calculateError) {
      setCalculateError('');
    }
    if (invalidCalculateFields.includes(name)) {
      setInvalidCalculateFields(prev => prev.filter(field => field !== name));
    }
  };

  const getInvalidCalculateFields = () => {
    const requiredNumericFields = ['currentBG', 'targetBG', 'carbs', 'carbRatio', 'correctionFactor'];
    return requiredNumericFields.filter((field) => Number.isNaN(parseFloat(inputs[field])));
  };

  const handleUnitChange = (nextUnit) => {
    if (nextUnit === unit) {
      return;
    }

    setInputs(prev => ({
      ...prev,
      currentBG: convertUnitValue(prev.currentBG, unit, nextUnit, 2),
      targetBG: convertUnitValue(prev.targetBG, unit, nextUnit, 2),
      correctionFactor: convertUnitValue(prev.correctionFactor, unit, nextUnit, 3)
    }));

    setUnit(nextUnit);
  };

  const triggerInvalidShake = () => {
    setShakeInvalidFields(false);
    requestAnimationFrame(() => {
      setShakeInvalidFields(true);
      setTimeout(() => setShakeInvalidFields(false), 350);
    });
  };

  const handleScanMeal = async () => {
    try {
      setIsAnalyzingImage(true);
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image.base64String) {
        if (!inputs.geminiApiKey) {
          alert('Please enter your Gemini API Key in the Settings tab first.');
          setIsAnalyzingImage(false);
          return;
        }
        const { carbs: estimatedCarbs, foodName: identifiedFood } = await estimateCarbsFromImage(image.base64String, `image/${image.format}`, inputs.geminiApiKey);
        setInputs(prev => ({ ...prev, carbs: estimatedCarbs.toString(), foodName: identifiedFood }));
        alert(`Estimated ${estimatedCarbs}g of carbs from the image for: ${identifiedFood}`);
      }
    } catch (error) {
      console.error('Camera/AI Error:', error);
      if (error.message && !error.message.includes('User cancelled')) {
         alert(error.message || 'Failed to analyze meal image.');
      }
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleCalculate = () => {
    try {
      const invalidFields = getInvalidCalculateFields();
      if (invalidFields.length > 0) {
        setCalculateError('Enter all numeric fields before calculating.');
        setInvalidCalculateFields(invalidFields);
        triggerInvalidShake();
        return;
      }

      const doseResult = calculateDose({
        ...inputs,
        unit
      });

      if (doseResult) {
        setCalculateError('');
        setInvalidCalculateFields([]);
        setResult(doseResult);
        // Save to history automatically
        const newItem = saveHistoryItem({
          inputs: { ...inputs, unit },
          result: doseResult
        });
        setHistory(newItem);
      } else {
        setCalculateError('Enter all numeric fields before calculating.');
        setInvalidCalculateFields(getInvalidCalculateFields());
        triggerInvalidShake();
      }
    } catch (error) {
      console.error('Error calculating or saving:', error);
      alert(error.message || 'Failed to save calculation. Please try clearing old history.');
    }
  };

  // Filter history by date range
  const getFilteredHistory = () => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (dateRange * 24 * 60 * 60 * 1000));
    return history.filter(item => new Date(item.timestamp) >= cutoffDate);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      validateExportInput({ history });

      // Step 1: Check and request storage permissions
      console.log('Checking storage permissions...');
      const permissionResult = await ensureStoragePermission(true);

      if (!permissionResult.granted) {
        console.log('Storage permission not granted:', permissionResult.state);

        let errorMessage = getPermissionErrorMessage(permissionResult.state);

        // If permission is permanently denied, guide user to settings
        if (permissionResult.state === PermissionState.DENIED) {
          errorMessage += '\n\nTo enable: Go to Settings → Apps → Insulin Calculator → Permissions → Storage';
        }

        setExportStatus({ type: 'error', message: errorMessage });
        setTimeout(() => setExportStatus(null), 8000); // Longer timeout for permission messages
        return;
      }

      console.log('Storage permission granted, proceeding with export...');

      // Update permission status in state
      setPermissionStatus(permissionResult.state);

      const dataset = buildExportDataset({ history, dateRange });
      const chartImages = await renderChartsToImages(dataset);
      const doc = buildPdfDocument({ dataset, chartImages, dateRange });
      const savedFile = await savePdfToFilesystem(doc);
      const shareResult = await sharePdf(savedFile);
      console.log('Share result:', shareResult);

      setExportStatus({
        type: 'success',
        message: `PDF exported successfully! (${dataset.recentHistory.length} entries from last ${dateRange} days)`
      });

      // Clear success message after 5 seconds
      setTimeout(() => setExportStatus(null), 5000);

    } catch (error) {
      console.error('Error exporting PDF:', error);

      let errorMessage = 'Failed to export PDF';
      if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please grant storage access in settings.';
      } else if (error.message.includes('share')) {
        errorMessage = 'Could not share file. Please try again.';
      } else if (error.message) {
        errorMessage = `Export failed: ${error.message}`;
      }

      setExportStatus({ type: 'error', message: errorMessage });

      // Clear error message after 5 seconds
      setTimeout(() => setExportStatus(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Insulin Calc</h1>
        <div className="unit-toggle">
          <button
            className={unit === UNITS.MGDL ? 'active' : ''}
            onClick={() => handleUnitChange(UNITS.MGDL)}>mg/dL
          </button>
          <button
            className={unit === UNITS.MMOL ? 'active' : ''}
            onClick={() => handleUnitChange(UNITS.MMOL)}>mmol/L
          </button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={activeTab === 'calculate' ? 'active' : ''}
          onClick={() => setActiveTab('calculate')}>Calculate
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}>History
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}>Settings
        </button>
      </div>

      <main>
        {activeTab === 'calculate' && (
          <div className="calculator-view">
            <div className="input-group">
              <label>Current BG ({unit})</label>
              <input
                type="number"
                inputMode="decimal"
                name="currentBG"
                value={inputs.currentBG}
                onChange={handleInputChange}
                placeholder="e.g. 150"
                className={invalidCalculateFields.includes('currentBG') ? `input-error ${shakeInvalidFields ? 'input-shake' : ''}` : ''}
              />
            </div>
            <div className="input-group">
              <label>Target BG ({unit})</label>
              <input
                type="number"
                inputMode="decimal"
                name="targetBG"
                value={inputs.targetBG}
                onChange={handleInputChange}
                placeholder="e.g. 100"
                className={invalidCalculateFields.includes('targetBG') ? `input-error ${shakeInvalidFields ? 'input-shake' : ''}` : ''}
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
                  onChange={handleInputChange}
                  placeholder="e.g. 60"
                  className={invalidCalculateFields.includes('carbs') ? `input-error ${shakeInvalidFields ? 'input-shake' : ''}` : ''}
                  style={{ flex: 1, margin: 0 }}
                />
                <button 
                  type="button" 
                  className="camera-btn" 
                  onClick={handleScanMeal}
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
                onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  className={invalidCalculateFields.includes('carbRatio') ? `input-error ${shakeInvalidFields ? 'input-shake' : ''}` : ''}
                />
              </div>
              <div className="input-group">
                <label>ISK / Sensitivity</label>
                <input
                  type="number"
                  inputMode="decimal"
                  name="correctionFactor"
                  value={inputs.correctionFactor}
                  onChange={handleInputChange}
                  className={invalidCalculateFields.includes('correctionFactor') ? `input-error ${shakeInvalidFields ? 'input-shake' : ''}` : ''}
                />
              </div>
            </div>

            {calculateError && <p className="validation-error">{calculateError}</p>}

            <button className="primary-btn" onClick={handleCalculate}>Calculate Dose</button>

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
        )}

        {activeTab === 'history' && (
          <div className="history-view">
            {/* Permission Status Banner (Android only) */}
            {isNativePlatform() && permissionStatus !== PermissionState.GRANTED && (
              <div className="permission-banner">
                <div className="permission-info">
                  <strong>📁 Storage Permission Required</strong>
                  <p>Allow file access to export your history as PDF</p>
                </div>
                <button 
                  className="secondary-btn small"
                  onClick={handleRequestPermission}
                >
                  Grant Permission
                </button>
              </div>
            )}

            {/* Date Range Filter */}
            <div className="date-range-filter">
              <label>Show data for:</label>
              <div className="range-buttons">
                {[3, 7, 14, 30, 90].map(days => (
                  <button
                    key={days}
                    className={`range-btn ${dateRange === days ? 'active' : ''}`}
                    onClick={() => setDateRange(days)}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>

            <div className="history-actions">
              <button
                className="secondary-btn"
                onClick={handleExportPDF}
                disabled={isExporting || history.length === 0}
              >
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button
                className="text-btn danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all history?')) {
                    clearHistory();
                    setHistory([]);
                    setExportStatus({ type: 'success', message: 'History cleared' });
                    setTimeout(() => setExportStatus(null), 3000);
                  }
                }}
                disabled={history.length === 0}
              >
                Clear
              </button>
            </div>

            {exportStatus && (
              <div className={`export-status ${exportStatus.type}`}>
                {exportStatus.type === 'success' ? '✓ ' : '⚠ '}
                {exportStatus.message}
              </div>
            )}

            {history.length === 0 ? (
              <p className="empty-history">No history yet.</p>
            ) : getFilteredHistory().length === 0 ? (
              <p className="empty-history">No entries in the last {dateRange} days.</p>
            ) : (
              Object.entries(
                getFilteredHistory().reduce((groups, item) => {
                  const date = new Date(item.timestamp).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(item);
                  return groups;
                }, {})
              ).map(([date, items]) => (
                <div key={date} className="history-group">
                  <h3 className="history-date-header">{date}</h3>
                  <ul className="history-list">
                    {items.map(item => (
                      <li key={item.id} className="history-item">
                        <div className="history-time">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="history-details">
                          <strong>{formatNumber(item.result.totalDose)} u</strong>
                          <span>BG: {item.inputs.currentBG}</span>
                          <span>Carbs: {item.inputs.carbs}g {item.inputs.foodName ? `(${item.inputs.foodName})` : ''}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-view" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2>App Settings</h2>
            <div className="input-group">
              <label>History Storage Limit (GB)</label>
              <input
                type="range"
                min={MIN_HISTORY_LIMIT_GB}
                max={MAX_HISTORY_LIMIT_GB}
                step="0.001"
                name="historyLimitGb"
                value={inputs.historyLimitGb || DEFAULT_HISTORY_LIMIT_GB.toString()}
                onChange={handleInputChange}
              />
              <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                Selected: {Number.parseFloat(inputs.historyLimitGb || DEFAULT_HISTORY_LIMIT_GB).toFixed(3)} GB
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Caps saved history size by storage usage. Allowed range: {MIN_HISTORY_LIMIT_GB} to {MAX_HISTORY_LIMIT_GB} GB.
              </p>
            </div>

            <div className="input-group">
              <label>Gemini API Key (for Camera Carbs Estimation)</label>
              <input
                type="password"
                name="geminiApiKey"
                value={inputs.geminiApiKey}
                onChange={handleInputChange}
                placeholder="AIzaSy..."
              />
              
              <div style={{ marginTop: '15px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155' }}>
                <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '10px' }}>How to get your free API key:</h3>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Google AI Studio</a>.</li>
                  <li>Sign in with your Google account.</li>
                  <li>Click on the <strong>"Create API key"</strong> button.</li>
                  <li>Select an existing project or click <strong>"Create API key in a new project"</strong>.</li>
                  <li>Copy the long API key (starts with AIza...) and paste it in the box above.</li>
                </ol>
                <p style={{ margin: '15px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  <strong>Privacy Note:</strong> Your key is securely stored locally on this device. It is never sent to any server other than directly to Google's official AI endpoint.
                </p>
              </div>
            </div>
            
            <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
              <strong>Notice:</strong> Settings are saved automatically as you type. You can leave this page once you paste your key.
            </p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          ⚠️ <strong>Disclaimer:</strong> This app is for informational purposes only. NOT medical advice. Always consult a healthcare professional.
          <button className="privacy-link" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
        </p>
      </footer>

      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}

export default App;
