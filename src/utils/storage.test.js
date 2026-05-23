import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveHistoryItem, getHistory, clearHistory, saveSettings, getSettings, enforceHistoryLimit } from './storage';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

globalThis.localStorage = localStorageMock;

describe('storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('getHistory', () => {
    it('returns empty array when no history exists', () => {
      const history = getHistory();
      expect(history).toEqual([]);
    });

    it('returns parsed history from localStorage', () => {
      const mockHistory = [
        { id: 1, totalDose: 5.5, timestamp: '2026-02-01T10:00:00.000Z' }
      ];
      localStorageMock.setItem('insulin_calc_history', JSON.stringify(mockHistory));
      
      const history = getHistory();
      expect(history).toEqual(mockHistory);
    });

    it('returns empty array on parse error', () => {
      localStorageMock.setItem('insulin_calc_history', 'invalid json');
      
      const history = getHistory();
      expect(history).toEqual([]);
    });
  });

  describe('saveHistoryItem', () => {
    it('adds new item to history with id and timestamp', () => {
      const item = {
        currentBG: 180,
        targetBG: 100,
        carbs: 60,
        totalDose: 7.6
      };

      const result = saveHistoryItem(item);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(item);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('timestamp');
    });

    it('prepends new items to history', () => {
      saveHistoryItem({ totalDose: 5 });
      const result = saveHistoryItem({ totalDose: 10 });
      
      expect(result).toHaveLength(2);
      expect(result[0].totalDose).toBe(10);
      expect(result[1].totalDose).toBe(5);
    });

    it('limits history to MAX_HISTORY_ITEMS', () => {
      // Save 1001 items
      for (let i = 0; i < 1001; i++) {
        saveHistoryItem({ totalDose: i });
      }
      
      const history = getHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });

    it('uses configured historyLimit from settings', () => {
      saveSettings({ historyLimit: 25 });

      for (let i = 0; i < 50; i++) {
        saveHistoryItem({ totalDose: i });
      }

      const history = getHistory();
      expect(history).toHaveLength(25);
    });
  });

  describe('enforceHistoryLimit', () => {
    it('trims existing history to provided limit', () => {
      for (let i = 0; i < 20; i++) {
        saveHistoryItem({ totalDose: i });
      }

      const trimmed = enforceHistoryLimit(12);
      expect(trimmed).toHaveLength(12);
      expect(getHistory()).toHaveLength(12);
    });

    it('clamps invalid low limit to minimum', () => {
      for (let i = 0; i < 30; i++) {
        saveHistoryItem({ totalDose: i });
      }

      const trimmed = enforceHistoryLimit(0);
      expect(trimmed).toHaveLength(10);
    });
  });

  describe('clearHistory', () => {
    it('removes history from localStorage', () => {
      saveHistoryItem({ totalDose: 5 });
      
      const result = clearHistory();
      
      expect(result).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('insulin_calc_history');
    });
  });

  describe('saveSettings', () => {
    it('saves settings to localStorage', () => {
      const settings = {
        unit: 'mg/dL',
        targetBG: 100,
        correctionFactor: 50,
        carbRatio: 10
      };

      saveSettings(settings);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'insulin_calc_settings',
        JSON.stringify(settings)
      );
    });
  });

  describe('getSettings', () => {
    it('returns null when no settings exist', () => {
      const settings = getSettings();
      expect(settings).toBeNull();
    });

    it('returns parsed settings from localStorage', () => {
      const mockSettings = {
        unit: 'mg/dL',
        targetBG: 100,
        correctionFactor: 50,
        carbRatio: 10
      };
      localStorageMock.setItem('insulin_calc_settings', JSON.stringify(mockSettings));
      
      const settings = getSettings();
      expect(settings).toEqual(mockSettings);
    });

    it('returns null on parse error', () => {
      localStorageMock.setItem('insulin_calc_settings', 'invalid json');
      
      const settings = getSettings();
      expect(settings).toBeNull();
    });
  });
});
