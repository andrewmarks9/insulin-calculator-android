import { useState, useEffect } from 'react';
import { UNITS } from '../utils/calculator';
import { saveSettings, getSettings, DEFAULT_HISTORY_LIMIT_GB } from '../utils/storage';

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

  // Load persisted settings once on mount
  useEffect(() => {
    const saved = getSettings();
    if (saved) {
      if (saved.unit) setUnit(saved.unit);
      setSettings({
        targetBG: saved.targetBG || '',
        carbRatio: saved.carbRatio || '',
        correctionFactor: saved.correctionFactor || '',
        geminiApiKey: saved.geminiApiKey || '',
        historyLimitGb: (saved.historyLimitGb || DEFAULT_HISTORY_LIMIT_GB).toString()
      });
    }
  }, []);

  // Persist whenever any tracked field changes
  useEffect(() => {
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
