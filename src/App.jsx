import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Chart } from 'chart.js/auto';
import { calculateDose, formatNumber, UNITS } from './utils/calculator';
import { saveHistoryItem, getHistory, clearHistory, saveSettings, getSettings } from './utils/storage';
import { ensureStoragePermission, checkStoragePermission, getPermissionErrorMessage, PermissionState, isNativePlatform } from './utils/permissions';
import { PrivacyPolicy } from './PrivacyPolicy';
import './App.css';
import './PrivacyPolicy.css';

function App() {
  const [unit, setUnit] = useState(UNITS.MGDL);
  const [inputs, setInputs] = useState({
    currentBG: '',
    targetBG: '',
    carbs: '',
    carbRatio: '',
    correctionFactor: ''
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('calculate'); // 'calculate' or 'history'
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null); // { type: 'success' | 'error', message: string }
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
        correctionFactor: savedSettings.correctionFactor || ''
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

  // Save settings when they change
  useEffect(() => {
    saveSettings({
      unit,
      targetBG: inputs.targetBG,
      carbRatio: inputs.carbRatio,
      correctionFactor: inputs.correctionFactor
    });
  }, [unit, inputs.targetBG, inputs.carbRatio, inputs.correctionFactor]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleCalculate = () => {
    try {
      const doseResult = calculateDose({
        ...inputs,
        unit
      });

      if (doseResult) {
        setResult(doseResult);
        // Save to history automatically
        const newItem = saveHistoryItem({
          inputs: { ...inputs, unit },
          result: doseResult
        });
        setHistory(newItem);
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

  // Helper function to generate chart image
  const generateChartImage = (config) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      // Fill background with white - CRITICAL for JPEG and jsPDF compatibility
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const chart = new Chart(ctx, {
        ...config,
        options: {
          ...config.options,
          animation: false, // Disable animations for synchronous capture
          responsive: false, // Use fixed canvas size
        }
      });
      
      // Wait briefly for Chart.js to finalize the render
      setTimeout(() => {
        // Use JPEG instead of PNG to avoid "wrong png signature" errors in jsPDF
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        chart.destroy();
        resolve(imageData);
      }, 50);
    });
  };

  const handleExportPDF = async () => {
    if (history.length === 0) {
      setExportStatus({ type: 'error', message: 'No history to export' });
      setTimeout(() => setExportStatus(null), 3000);
      return;
    }

    setIsExporting(true);
    setExportStatus(null);

    try {
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

      // Step 2: Prepare data for charts using filtered history
      const filteredHistory = getFilteredHistory();
      const recentHistory = filteredHistory.slice().reverse(); // Reverse for chronological order
      
      if (recentHistory.length === 0) {
        setExportStatus({ type: 'error', message: `No data in the last ${dateRange} days` });
        setTimeout(() => setExportStatus(null), 3000);
        return;
      }
      
      const dates = recentHistory.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      const totalDoses = recentHistory.map(item => formatNumber(item.result.totalDose));
      const bgLevels = recentHistory.map(item => parseFloat(item.inputs.currentBG));
      const carbIntakes = recentHistory.map(item => parseFloat(item.inputs.carbs));
      const carbDoses = recentHistory.map(item => formatNumber(item.result.carbDose));
      const correctionDoses = recentHistory.map(item => formatNumber(item.result.correctionDose));

      // Chart 1: Total Insulin Dose Over Time
      const doseChartImage = await generateChartImage({
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Total Insulin Dose (units)',
            data: totalDoses,
            borderColor: 'rgb(79, 70, 229)',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Total Insulin Dose Trend',
              font: { size: 16 }
            },
            legend: { display: true }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Units' }
            }
          }
        }
      });

      // Chart 2: Blood Glucose Levels
      const bgUnit = recentHistory[0]?.inputs.unit || 'mg/dL';
      const bgChartImage = await generateChartImage({
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: `Blood Glucose (${bgUnit})`,
            data: bgLevels,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Blood Glucose Levels',
              font: { size: 16 }
            },
            legend: { display: true }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: { display: true, text: bgUnit }
            }
          }
        }
      });

      // Chart 3: Stacked Bar - Carb vs Correction Dose
      const doseBreakdownImage = await generateChartImage({
        type: 'bar',
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Carb Dose',
              data: carbDoses,
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
            },
            {
              label: 'Correction Dose',
              data: correctionDoses,
              backgroundColor: 'rgba(245, 158, 11, 0.8)',
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Dose Breakdown: Carb vs Correction',
              font: { size: 16 }
            },
            legend: { display: true }
          },
          scales: {
            x: { stacked: true },
            y: {
              stacked: true,
              beginAtZero: true,
              title: { display: true, text: 'Units' }
            }
          }
        }
      });

      // Chart 4: Carbohydrate Intake
      const carbChartImage = await generateChartImage({
        type: 'bar',
        data: {
          labels: dates,
          datasets: [{
            label: 'Carbohydrate Intake (grams)',
            data: carbIntakes,
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Carbohydrate Intake',
              font: { size: 16 }
            },
            legend: { display: true }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Grams' }
            }
          }
        }
      });

      // Step 3: Generate PDF
      const doc = new jsPDF();
      let yPosition = 20;

      // Add title
      doc.setFontSize(18);
      doc.text("Insulin Dose History Report", 14, yPosition);
      yPosition += 8;

      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
      doc.text(`Date Range: Last ${dateRange} days (${recentHistory.length} entries)`, 14, yPosition + 5);
      yPosition += 15;

      // Add charts to PDF (using JPEG to avoid signature issues)
      doc.addImage(doseChartImage, 'JPEG', 10, yPosition, 190, 95);
      yPosition += 100;
      
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.addImage(bgChartImage, 'JPEG', 10, yPosition, 190, 95);
      yPosition += 100;

      // Add new page for more charts
      doc.addPage();
      yPosition = 20;
      
      doc.addImage(doseBreakdownImage, 'JPEG', 10, yPosition, 190, 95);
      yPosition += 100;
      
      doc.addImage(carbChartImage, 'JPEG', 10, yPosition, 190, 95);
      yPosition += 105;

      // Add new page for data table
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(14);
      doc.text("Detailed History", 14, yPosition);
      yPosition += 5;

      // Prepare table data from filtered history
      const tableData = recentHistory.map(item => {
        const dateObj = new Date(item.timestamp);
        return [
          dateObj.toLocaleDateString(),
          dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          `${item.inputs.currentBG} ${item.inputs.unit}`,
          `${item.inputs.carbs}g`,
          `${formatNumber(item.result.totalDose)} u`
        ];
      });

      // Add table
      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Time', 'BG', 'Carbs', 'Total Dose']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 }
      });

      // Generate filename with readable date
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `insulin_history_${dateStr}.pdf`;

      // Get base64 string (remove data URI prefix)
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Step 4: Try to save to Documents directory first (more permanent)
      let savedFile;
      try {
        savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });
        console.log('PDF saved to Documents:', savedFile.uri);
      } catch (docError) {
        console.warn('Could not save to Documents, trying Cache:', docError);
        // Fallback to Cache directory if Documents fails
        savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache
        });
        console.log('PDF saved to Cache:', savedFile.uri);
      }

      // Step 5: Share the file using native share dialog (defaults to Files app on Android)
      const shareResult = await Share.share({
        title: 'Save PDF',
        text: 'Save your insulin dosage history',
        url: savedFile.uri,
        dialogTitle: 'Save PDF to Files',
        files: [savedFile.uri]
      });

      console.log('Share result:', shareResult);

      setExportStatus({
        type: 'success',
        message: `PDF exported successfully! (${recentHistory.length} entries from last ${dateRange} days)`
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
            onClick={() => setUnit(UNITS.MGDL)}>mg/dL
          </button>
          <button
            className={unit === UNITS.MMOL ? 'active' : ''}
            onClick={() => setUnit(UNITS.MMOL)}>mmol/L
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
              />
            </div>
            <div className="input-group">
              <label>Carbs (g)</label>
              <input
                type="number"
                inputMode="decimal"
                name="carbs"
                value={inputs.carbs}
                onChange={handleInputChange}
                placeholder="e.g. 60"
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
                />
              </div>
            </div>

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
                          <span>Carbs: {item.inputs.carbs}g</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
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
