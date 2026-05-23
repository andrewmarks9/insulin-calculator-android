import React, { useState, useEffect } from 'react';
import { calculateDose, UNITS, convertUnitValue } from './utils/calculator';
import { saveHistoryItem, clearHistory, enforceHistoryLimit } from './utils/storage';
import { ensureStoragePermission, checkStoragePermission, getPermissionErrorMessage, PermissionState, isNativePlatform } from './utils/permissions';
import { PrivacyPolicy } from './PrivacyPolicy';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { estimateCarbsFromImage } from './utils/ai';
import { validateExportInput, buildExportDataset, renderChartsToImages, buildPdfDocument, savePdfToFilesystem, sharePdf } from './utils/pdfExport';
import { useSettings } from './hooks/useSettings';
import { useHistory } from './hooks/useHistory';
import { useExportStatus } from './hooks/useExportStatus';
import { CalculatorTab } from './CalculatorTab';
import { HistoryTab } from './HistoryTab';
import { SettingsTab } from './SettingsTab';
import './App.css';
import './PrivacyPolicy.css';

const SETTINGS_FIELDS = ['targetBG', 'carbRatio', 'correctionFactor', 'geminiApiKey', 'historyLimitGb'];

function App() {
  const { unit, setUnit, settings, updateSetting, updateSettings } = useSettings();
  const [history, setHistory] = useHistory();
  const [exportStatus, setTimedStatus] = useExportStatus();

  const [localInputs, setLocalInputs] = useState({ currentBG: '', carbs: '', foodName: '' });
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('calculate');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [calculateError, setCalculateError] = useState('');
  const [invalidCalculateFields, setInvalidCalculateFields] = useState([]);
  const [shakeInvalidFields, setShakeInvalidFields] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [dateRange, setDateRange] = useState(30);

  // Enforce history size cap whenever the limit changes
  useEffect(() => {
    const updated = enforceHistoryLimit(settings.historyLimitGb);
    setHistory(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.historyLimitGb]);

  // Check storage permission once on native platform mount
  useEffect(() => {
    if (isNativePlatform()) {
      checkStoragePermission()
        .then(status => setPermissionStatus(status))
        .catch(err => console.error('Error checking permission:', err));
    }
  }, []);

  // Merged view used by CalculatorTab and calculateDose
  const inputs = { ...localInputs, ...settings };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (SETTINGS_FIELDS.includes(name)) {
      updateSetting(name, value);
    } else {
      setLocalInputs(prev => ({ ...prev, [name]: value }));
    }
    if (calculateError) setCalculateError('');
    if (invalidCalculateFields.includes(name)) {
      setInvalidCalculateFields(prev => prev.filter(f => f !== name));
    }
  };

  const getInvalidCalculateFields = () => {
    const required = ['currentBG', 'targetBG', 'carbs', 'carbRatio', 'correctionFactor'];
    return required.filter(field => Number.isNaN(parseFloat(inputs[field])));
  };

  const handleUnitChange = (nextUnit) => {
    if (nextUnit === unit) return;
    setLocalInputs(prev => ({
      ...prev,
      currentBG: convertUnitValue(prev.currentBG, unit, nextUnit, 2)
    }));
    updateSettings({
      targetBG: convertUnitValue(settings.targetBG, unit, nextUnit, 2),
      correctionFactor: convertUnitValue(settings.correctionFactor, unit, nextUnit, 3)
    });
    setUnit(nextUnit);
  };

  const handleRequestPermission = async () => {
    try {
      const permResult = await ensureStoragePermission(true);
      setPermissionStatus(permResult.state);
      if (permResult.granted) {
        setTimedStatus({ type: 'success', message: 'Storage permission granted!' }, 3000);
      } else {
        setTimedStatus({
          type: 'error',
          message: 'Permission denied. Please enable it in Settings → Apps → Insulin Calculator → Permissions → Storage'
        }, 8000);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setTimedStatus({ type: 'error', message: 'Failed to request permission' }, 3000);
    }
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
        if (!settings.geminiApiKey) {
          alert('Please enter your Gemini API Key in the Settings tab first.');
          setIsAnalyzingImage(false);
          return;
        }
        const { carbs: estimatedCarbs, foodName: identifiedFood } = await estimateCarbsFromImage(
          image.base64String, `image/${image.format}`, settings.geminiApiKey
        );
        setLocalInputs(prev => ({ ...prev, carbs: estimatedCarbs.toString(), foodName: identifiedFood }));
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
      const doseResult = calculateDose({ ...inputs, unit });
      if (doseResult) {
        setCalculateError('');
        setInvalidCalculateFields([]);
        setResult(doseResult);
        const newItem = saveHistoryItem({ inputs: { ...inputs, unit }, result: doseResult });
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

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      clearHistory();
      setHistory([]);
      setTimedStatus({ type: 'success', message: 'History cleared' }, 3000);
    }
  };

  const getFilteredHistory = () => {
    const cutoff = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
    return history.filter(item => new Date(item.timestamp) >= cutoff);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      validateExportInput({ history });
      console.log('Checking storage permissions...');
      const permResult = await ensureStoragePermission(true);
      if (!permResult.granted) {
        let errorMessage = getPermissionErrorMessage(permResult.state);
        if (permResult.state === PermissionState.DENIED) {
          errorMessage += '\n\nTo enable: Go to Settings → Apps → Insulin Calculator → Permissions → Storage';
        }
        setTimedStatus({ type: 'error', message: errorMessage }, 8000);
        return;
      }
      console.log('Storage permission granted, proceeding with export...');
      setPermissionStatus(permResult.state);
      const dataset = buildExportDataset({ history, dateRange });
      const chartImages = await renderChartsToImages(dataset);
      const doc = buildPdfDocument({ dataset, chartImages, dateRange });
      const savedFile = await savePdfToFilesystem(doc);
      const shareResult = await sharePdf(savedFile);
      console.log('Share result:', shareResult);
      setTimedStatus({
        type: 'success',
        message: `PDF exported successfully! (${dataset.recentHistory.length} entries from last ${dateRange} days)`
      }, 5000);
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
      setTimedStatus({ type: 'error', message: errorMessage }, 5000);
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
          <CalculatorTab
            unit={unit}
            inputs={inputs}
            onInputChange={handleInputChange}
            result={result}
            calculateError={calculateError}
            invalidCalculateFields={invalidCalculateFields}
            shakeInvalidFields={shakeInvalidFields}
            isAnalyzingImage={isAnalyzingImage}
            onCalculate={handleCalculate}
            onScanMeal={handleScanMeal}
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab
            history={history}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            isExporting={isExporting}
            exportStatus={exportStatus}
            permissionStatus={permissionStatus}
            onExport={handleExportPDF}
            onClear={handleClear}
            onRequestPermission={handleRequestPermission}
            getFilteredHistory={getFilteredHistory}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onInputChange={handleInputChange}
          />
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
