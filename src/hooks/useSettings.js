import { useState, useEffect, useRef } from 'react';
import { UNITS } from '../utils/calculator';
import { saveSettings, getSettings, DEFAULT_HISTORY_LIMIT_GB } from '../utils/storage';
import { getGeminiApiKey, saveGeminiApiKey } from '../utils/secureStorage';

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
    void saveGeminiApiKey(settings.geminiApiKey);
    saveSettings({ unit, ...settings });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, settings.targetBG, settings.carbRatio, settings.correctionFactor, settings.geminiApiKey, settings.historyLimitGb]);

  const updateSetting = (name, value) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return { unit, setUnit, settings, updateSetting, updateSettings };
}
