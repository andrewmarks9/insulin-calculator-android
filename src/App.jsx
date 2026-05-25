import React, { useState, useEffect, useMemo } from 'react';
import { calculateDose, UNITS, convertUnitValue } from './utils/calculator';
import { saveHistoryItem, clearHistory, enforceHistoryLimit } from './utils/storage';
import { ensureStoragePermission, checkStoragePermission, getPermissionErrorMessage, openAppSettings, PermissionState, isNativePlatform } from './utils/permissions';
import { PrivacyPolicy } from './PrivacyPolicy';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { estimateCarbsFromImage } from './utils/ai';
import { validateExportInput, filterHistoryByDays, buildExportDataset, renderChartsToImages, buildPdfDocument, savePdfToFilesystem, downloadPdfInBrowser, sharePdf } from './utils/pdfExport';
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
        if (permResult.state === PermissionState.DENIED) {
          const opened = await openAppSettings();
          setTimedStatus({
            type: 'error',
            message: opened
              ? 'Permission denied. Opened app settings so you can enable Storage permission.'
              : 'Permission denied. Please enable it in Settings -> Apps -> Insulin Calculator -> Permissions -> Storage.'
          }, 8000);
          return;
        }

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
          setTimedStatus({ type: 'error', message: 'Please enter your Gemini API Key in the Settings tab first.' }, 5000);
          setIsAnalyzingImage(false);
          return;
        }
        const { carbs: estimatedCarbs, foodName: identifiedFood } = await estimateCarbsFromImage(
          image.base64String, `image/${image.format}`, settings.geminiApiKey
        );
        setLocalInputs(prev => ({ ...prev, carbs: estimatedCarbs.toString(), foodName: identifiedFood }));
        setTimedStatus({ type: 'success', message: `Estimated ${estimatedCarbs}g of carbs for: ${identifiedFood}` }, 5000);
      }
    } catch (error) {
      console.error('Camera/AI Error:', error);
      if (error.message && !error.message.includes('User cancelled')) {
        setTimedStatus({ type: 'error', message: error.message || 'Failed to analyze meal image.' }, 5000);
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
      setTimedStatus({ type: 'error', message: error.message || 'Failed to save calculation. Please try clearing old history.' }, 5000);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      clearHistory();
      setHistory([]);
      setTimedStatus({ type: 'success', message: 'History cleared' }, 3000);
    }
  };

  const handleClearGeminiApiKey = () => {
    updateSetting('geminiApiKey', '');
    setTimedStatus({ type: 'success', message: 'Gemini API key cleared from secure storage.' }, 3000);
  };

  const filteredHistory = useMemo(() => filterHistoryByDays(history, dateRange), [history, dateRange]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      validateExportInput({ history });
      const dataset = buildExportDataset({ history, dateRange });
      const chartImages = await renderChartsToImages(dataset);
      const doc = buildPdfDocument({ dataset, chartImages, dateRange });

      if (isNativePlatform()) {
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

        console.log('Storage permission granted, proceeding with native export...');
        setPermissionStatus(permResult.state);
        const savedFile = await savePdfToFilesystem(doc);
        const shareResult = await sharePdf(savedFile);
        console.log('Share result:', shareResult);
        setTimedStatus({
          type: 'success',
          message: `PDF exported successfully! (${dataset.recentHistory.length} entries from last ${dateRange} days)`
        }, 5000);
      } else {
        const { fileName } = downloadPdfInBrowser(doc);
        setTimedStatus({
          type: 'success',
          message: `PDF downloaded (${fileName}) with ${dataset.recentHistory.length} entries from last ${dateRange} days`
        }, 5000);
      }
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

      <div className="tabs" role="tablist" aria-label="Main sections">
        <button
          id="tab-calculate"
          role="tab"
          aria-selected={activeTab === 'calculate'}
          aria-controls="panel-calculate"
          className={activeTab === 'calculate' ? 'active' : ''}
          onClick={() => setActiveTab('calculate')}>Calculate
        </button>
        <button
          id="tab-history"
          role="tab"
          aria-selected={activeTab === 'history'}
          aria-controls="panel-history"
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}>History
        </button>
        <button
          id="tab-settings"
          role="tab"
          aria-selected={activeTab === 'settings'}
          aria-controls="panel-settings"
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}>Settings
        </button>
      </div>

      <main>
        {activeTab === 'calculate' && (
          <div id="panel-calculate" role="tabpanel" aria-labelledby="tab-calculate">
            <CalculatorTab
              unit={unit}
              inputs={inputs}
              onInputChange={handleInputChange}
              result={result}
              statusMessage={exportStatus}
              calculateError={calculateError}
              invalidCalculateFields={invalidCalculateFields}
              shakeInvalidFields={shakeInvalidFields}
              isAnalyzingImage={isAnalyzingImage}
              onCalculate={handleCalculate}
              onScanMeal={handleScanMeal}
            />
          </div>
        )}
        {activeTab === 'history' && (
          <div id="panel-history" role="tabpanel" aria-labelledby="tab-history">
            <HistoryTab
              history={history}
              filteredHistory={filteredHistory}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              isExporting={isExporting}
              exportStatus={exportStatus}
              permissionStatus={permissionStatus}
              onExport={handleExportPDF}
              onClear={handleClear}
              onRequestPermission={handleRequestPermission}
            />
          </div>
        )}
        {activeTab === 'settings' && (
          <div id="panel-settings" role="tabpanel" aria-labelledby="tab-settings">
            <SettingsTab
              settings={settings}
              onInputChange={handleInputChange}
              onClearGeminiApiKey={handleClearGeminiApiKey}
            />
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
