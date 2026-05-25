import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Chart } from 'chart.js/auto';
import { formatNumber } from './calculator';

function createPdfFileName() {
  const dateStr = new Date().toISOString().split('T')[0];
  return `insulin_history_${dateStr}.pdf`;
}

function generateChartImage(config) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const chart = new Chart(ctx, {
      ...config,
      options: {
        ...config.options,
        animation: false,
        responsive: false,
      }
    });

    setTimeout(() => {
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      chart.destroy();
      resolve(imageData);
    }, 50);
  });
}

export function validateExportInput({ history }) {
  if (!history || history.length === 0) {
    throw new Error('No history to export');
  }
}

export function filterHistoryByDays(history, dateRange) {
  const cutoffDate = new Date(Date.now() - (dateRange * 24 * 60 * 60 * 1000));
  return history.filter(item => new Date(item.timestamp) >= cutoffDate);
}

export function buildExportDataset({ history, dateRange }) {
  const filteredHistory = filterHistoryByDays(history, dateRange);
  const recentHistory = filteredHistory.slice().reverse();

  if (recentHistory.length === 0) {
    throw new Error(`No data in the last ${dateRange} days`);
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
  const bgUnit = recentHistory[0]?.inputs.unit || 'mg/dL';

  const tableData = recentHistory.map(item => {
    const dateObj = new Date(item.timestamp);
    return [
      dateObj.toLocaleDateString(),
      dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      `${item.inputs.currentBG} ${item.inputs.unit}`,
      `${item.inputs.carbs}g${item.inputs.foodName ? `\n(${item.inputs.foodName})` : ''}`,
      `${formatNumber(item.result.totalDose)} u`
    ];
  });

  return {
    recentHistory,
    dates,
    totalDoses,
    bgLevels,
    carbIntakes,
    carbDoses,
    correctionDoses,
    bgUnit,
    tableData
  };
}

export async function renderChartsToImages(dataset) {
  const {
    dates,
    totalDoses,
    bgLevels,
    carbIntakes,
    carbDoses,
    correctionDoses,
    bgUnit
  } = dataset;

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

  return {
    doseChartImage,
    bgChartImage,
    doseBreakdownImage,
    carbChartImage
  };
}

export function buildPdfDocument({ dataset, chartImages, dateRange }) {
  const doc = new jsPDF();
  let yPosition = 20;

  doc.setFontSize(18);
  doc.text('Insulin Dose History Report', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  doc.text(`Date Range: Last ${dateRange} days (${dataset.recentHistory.length} entries)`, 14, yPosition + 5);
  yPosition += 15;

  doc.addImage(chartImages.doseChartImage, 'JPEG', 10, yPosition, 190, 95);
  yPosition += 100;

  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.addImage(chartImages.bgChartImage, 'JPEG', 10, yPosition, 190, 95);

  doc.addPage();
  yPosition = 20;

  doc.addImage(chartImages.doseBreakdownImage, 'JPEG', 10, yPosition, 190, 95);
  yPosition += 100;

  doc.addImage(chartImages.carbChartImage, 'JPEG', 10, yPosition, 190, 95);

  doc.addPage();
  yPosition = 20;

  doc.setFontSize(14);
  doc.text('Detailed History', 14, yPosition);
  yPosition += 5;

  autoTable(doc, {
    startY: yPosition,
    head: [['Date', 'Time', 'BG', 'Carbs', 'Total Dose']],
    body: dataset.tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 9 }
  });

  return doc;
}

export async function savePdfToFilesystem(doc) {
  const fileName = createPdfFileName();
  const pdfBase64 = doc.output('datauristring').split(',')[1];

  try {
    return await Filesystem.writeFile({
      path: fileName,
      data: pdfBase64,
      directory: Directory.Documents,
      recursive: true
    });
  } catch (docError) {
    console.warn('Could not save to Documents, trying Cache:', docError);
    return await Filesystem.writeFile({
      path: fileName,
      data: pdfBase64,
      directory: Directory.Cache
    });
  }
}

export function downloadPdfInBrowser(doc) {
  if (typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') {
    throw new Error('Browser download is unavailable on this platform.');
  }

  const fileName = createPdfFileName();
  const pdfBlob = doc.output('blob');
  const objectUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');

  try {
    link.href = objectUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
  } finally {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    URL.revokeObjectURL(objectUrl);
  }

  return { fileName };
}

export async function sharePdf(savedFile) {
  return await Share.share({
    title: 'Save PDF',
    text: 'Save your insulin dosage history',
    url: savedFile.uri,
    dialogTitle: 'Save PDF to Files',
    files: [savedFile.uri]
  });
}