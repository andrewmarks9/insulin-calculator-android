import { describe, it, expect, beforeEach, vi } from 'vitest';

const { writeFileMock } = vi.hoisted(() => ({
  writeFileMock: vi.fn()
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: writeFileMock
  },
  Directory: {
    Documents: 'DOCUMENTS',
    Cache: 'CACHE'
  }
}));

import { validateExportInput, filterHistoryByDays, buildExportDataset, savePdfToFilesystem, downloadPdfInBrowser } from './pdfExport';

function createHistoryItem({ id, daysAgo, currentBG, carbs, unit = 'mg/dL', totalDose, carbDose, correctionDose, foodName = '' }) {
  const now = Date.now();
  return {
    id,
    timestamp: new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    inputs: {
      currentBG: String(currentBG),
      carbs: String(carbs),
      unit,
      foodName
    },
    result: {
      totalDose,
      carbDose,
      correctionDose
    }
  };
}

describe('pdfExport', () => {
  beforeEach(() => {
    writeFileMock.mockReset();
  });

  describe('validateExportInput', () => {
    it('throws when history is missing', () => {
      expect(() => validateExportInput({ history: null })).toThrow('No history to export');
    });

    it('throws when history is empty', () => {
      expect(() => validateExportInput({ history: [] })).toThrow('No history to export');
    });

    it('does not throw when history has items', () => {
      const history = [createHistoryItem({
        id: 1,
        daysAgo: 1,
        currentBG: 140,
        carbs: 30,
        totalDose: 2.4,
        carbDose: 2,
        correctionDose: 0.4
      })];

      expect(() => validateExportInput({ history })).not.toThrow();
    });

    it('throws when selected date range has no rows', () => {
      const history = [createHistoryItem({
        id: 1,
        daysAgo: 90,
        currentBG: 140,
        carbs: 30,
        totalDose: 2.4,
        carbDose: 2,
        correctionDose: 0.4
      })];

      expect(() => validateExportInput({ history, dateRange: 30 })).toThrow('No data in the last 30 days');
    });

    it('does not throw when selected date range includes rows', () => {
      const history = [createHistoryItem({
        id: 1,
        daysAgo: 2,
        currentBG: 140,
        carbs: 30,
        totalDose: 2.4,
        carbDose: 2,
        correctionDose: 0.4
      })];

      expect(() => validateExportInput({ history, dateRange: 30 })).not.toThrow();
    });
  });

  describe('buildExportDataset', () => {
    it('filters history by date range using shared helper', () => {
      const newest = createHistoryItem({
        id: 1,
        daysAgo: 2,
        currentBG: 140,
        carbs: 30,
        totalDose: 2.4,
        carbDose: 2,
        correctionDose: 0.4
      });
      const old = createHistoryItem({
        id: 2,
        daysAgo: 45,
        currentBG: 150,
        carbs: 40,
        totalDose: 3.2,
        carbDose: 2.5,
        correctionDose: 0.7
      });

      const filtered = filterHistoryByDays([newest, old], 30);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(1);
    });

    it('filters by date range and returns chronological recentHistory', () => {
      const newest = createHistoryItem({
        id: 1,
        daysAgo: 1,
        currentBG: 150,
        carbs: 60,
        totalDose: 3.26,
        carbDose: 2.6,
        correctionDose: 0.66,
        foodName: 'Pasta'
      });
      const olderInRange = createHistoryItem({
        id: 2,
        daysAgo: 5,
        currentBG: 120,
        carbs: 20,
        totalDose: 2.04,
        carbDose: 1.5,
        correctionDose: 0.54,
        foodName: 'Toast'
      });
      const outOfRange = createHistoryItem({
        id: 3,
        daysAgo: 45,
        currentBG: 180,
        carbs: 80,
        totalDose: 6.5,
        carbDose: 5,
        correctionDose: 1.5,
        foodName: 'Rice'
      });

      // History is typically stored newest-first.
      const history = [newest, olderInRange, outOfRange];
      const dataset = buildExportDataset({ history, dateRange: 30 });

      expect(dataset.recentHistory).toHaveLength(2);
      expect(dataset.recentHistory[0].id).toBe(2);
      expect(dataset.recentHistory[1].id).toBe(1);

      expect(dataset.totalDoses).toEqual([2, 3.3]);
      expect(dataset.bgLevels).toEqual([120, 150]);
      expect(dataset.carbIntakes).toEqual([20, 60]);
      expect(dataset.carbDoses).toEqual([1.5, 2.6]);
      expect(dataset.correctionDoses).toEqual([0.5, 0.7]);
      expect(dataset.bgUnit).toBe('mg/dL');

      expect(dataset.tableData).toHaveLength(2);
      expect(dataset.tableData[0][2]).toBe('120 mg/dL');
      expect(dataset.tableData[0][3]).toContain('20g');
      expect(dataset.tableData[0][3]).toContain('(Toast)');
    });

    it('throws when no entries are inside the selected date range', () => {
      const history = [createHistoryItem({
        id: 1,
        daysAgo: 90,
        currentBG: 140,
        carbs: 30,
        totalDose: 2.4,
        carbDose: 2,
        correctionDose: 0.4
      })];

      expect(() => buildExportDataset({ history, dateRange: 30 })).toThrow('No data in the last 30 days');
    });
  });

  describe('savePdfToFilesystem', () => {
    it('writes to Documents when the initial write succeeds', async () => {
      const doc = {
        output: vi.fn(() => 'data:application/pdf;base64,abc123')
      };
      const expectedResult = { uri: 'documents://insulin_history_2026-05-23.pdf' };
      writeFileMock.mockResolvedValueOnce(expectedResult);

      const result = await savePdfToFilesystem(doc);

      expect(doc.output).toHaveBeenCalledWith('datauristring');
      expect(writeFileMock).toHaveBeenCalledTimes(1);
      expect(writeFileMock).toHaveBeenCalledWith(expect.objectContaining({
        data: 'abc123',
        directory: 'DOCUMENTS',
        recursive: true
      }));
      expect(result).toEqual(expectedResult);
    });

    it('falls back to Cache when Documents write fails', async () => {
      const doc = {
        output: vi.fn(() => 'data:application/pdf;base64,abc123')
      };
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      writeFileMock
        .mockRejectedValueOnce(new Error('documents write failed'))
        .mockResolvedValueOnce({ uri: 'cache://insulin_history_2026-05-23.pdf' });

      const result = await savePdfToFilesystem(doc);

      expect(writeFileMock).toHaveBeenCalledTimes(2);
      expect(writeFileMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
        directory: 'DOCUMENTS',
        recursive: true
      }));
      expect(writeFileMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
        directory: 'CACHE'
      }));
      expect(result).toEqual({ uri: 'cache://insulin_history_2026-05-23.pdf' });

      warnSpy.mockRestore();
    });
  });

  describe('downloadPdfInBrowser', () => {
    it('creates a blob url and triggers a browser download', () => {
      const doc = {
        output: vi.fn(() => new Blob(['pdf-content'], { type: 'application/pdf' }))
      };

      const createObjectURLMock = vi.fn(() => 'blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;

      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: createObjectURLMock
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: revokeObjectURLMock
      });

      const appendSpy = vi.spyOn(document.body, 'appendChild');
      const anchor = document.createElement('a');
      const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return anchor;
        }
        return originalCreateElement(tagName);
      });

      try {
        const result = downloadPdfInBrowser(doc);

        expect(doc.output).toHaveBeenCalledWith('blob');
        expect(createObjectURLMock).toHaveBeenCalledTimes(1);
        expect(appendSpy).toHaveBeenCalledWith(anchor);
        expect(clickSpy).toHaveBeenCalledTimes(1);
        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
        expect(result.fileName).toMatch(/^insulin_history_\d{4}-\d{2}-\d{2}\.pdf$/);
      } finally {
        createElementSpy.mockRestore();
        clickSpy.mockRestore();
        appendSpy.mockRestore();
        Object.defineProperty(URL, 'createObjectURL', {
          configurable: true,
          writable: true,
          value: originalCreateObjectURL
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
          configurable: true,
          writable: true,
          value: originalRevokeObjectURL
        });
      }
    });
  });
});