import { useState, useEffect, useRef } from 'react';
import { UNITS } from '../utils/calculator';
import {
  saveSettings,
  getSettings,
  clearLegacyGeminiApiKeyFromSettings,
  DEFAULT_HISTORY_LIMIT_GB
} from '../utils/storage';
import { getGeminiApiKey, saveGeminiApiKey, clearGeminiApiKey } from '../utils/secureStorage';

const INITIAL_SETTINGS = {
  targetBG: '',
  carbRatio: '',
  correctionFactor: '',
  geminiApiKey: '',
  historyLimitGb: DEFAULT_HISTORY_LIMIT_GB.toString()
};

export function useSettings() {
  const [unit, setUnit] = useState(UNITS.MGDL);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const settingsHydratedRef = useRef(false);
  const saveDebounceRef = useRef(null);

  // Load persisted settings once on mount
  useEffect(() => {
    let cancelled = false;

    const hydrateSettings = async () => {
      const saved = getSettings();
      const legacyGeminiApiKey = saved?.geminiApiKey || '';

      if (saved?.unit) {
        setUnit(saved.unit);
      }

      const publicSettings = {
        targetBG: saved?.targetBG || '',
        carbRatio: saved?.carbRatio || '',
        correctionFactor: saved?.correctionFactor || '',
        geminiApiKey: '',
        historyLimitGb: (saved?.historyLimitGb || DEFAULT_HISTORY_LIMIT_GB).toString()
      };

      const secureGeminiApiKey = await getGeminiApiKey();
      const geminiApiKey = secureGeminiApiKey || legacyGeminiApiKey;

      if (cancelled) {
        return;
      }

      setSettings({
        ...publicSettings,
        geminiApiKey
      });

      if (geminiApiKey) {
        await saveGeminiApiKey(geminiApiKey);
      }

      saveSettings({
        unit: saved?.unit || UNITS.MGDL,
        ...publicSettings,
        geminiApiKey
      });

      settingsHydratedRef.current = true;
    };

    hydrateSettings().catch(error => {
      console.error('Error hydrating settings:', error);
      settingsHydratedRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist whenever any tracked field changes
  useEffect(() => {
    if (!settingsHydratedRef.current) {
      return;
    }

    const persistedSettings = {
      targetBG: settings.targetBG,
      carbRatio: settings.carbRatio,
      correctionFactor: settings.correctionFactor,
      geminiApiKey: settings.geminiApiKey,
      historyLimitGb: settings.historyLimitGb
    };

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    saveDebounceRef.current = setTimeout(() => {
      void saveGeminiApiKey(persistedSettings.geminiApiKey);
      saveSettings({ unit, ...persistedSettings });
    }, 300);

    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, [unit, settings.targetBG, settings.carbRatio, settings.correctionFactor, settings.geminiApiKey, settings.historyLimitGb]);

  const updateSetting = (name, value) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const clearGeminiApiKeySetting = async () => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = null;
    }

    await clearGeminiApiKey();
    clearLegacyGeminiApiKeyFromSettings();
    setSettings(prev => ({ ...prev, geminiApiKey: '' }));
  };

  return { unit, setUnit, settings, updateSetting, updateSettings, clearGeminiApiKeySetting };
}
