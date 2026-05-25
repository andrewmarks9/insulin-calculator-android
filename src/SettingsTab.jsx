import React from 'react';
import { DEFAULT_HISTORY_LIMIT_GB, MIN_HISTORY_LIMIT_GB, MAX_HISTORY_LIMIT_GB } from './utils/storage';

export function SettingsTab({ settings, onInputChange }) {
  return (
    <div className="settings-view">
      <h2>App Settings</h2>
      <div className="input-group">
        <label>History Storage Limit (GB)</label>
        <input
          type="range"
          min={MIN_HISTORY_LIMIT_GB}
          max={MAX_HISTORY_LIMIT_GB}
          step="0.001"
          name="historyLimitGb"
          value={settings.historyLimitGb || DEFAULT_HISTORY_LIMIT_GB.toString()}
          onChange={onInputChange}
        />
        <p className="settings-helper settings-helper-strong">
          Selected: {Number.parseFloat(settings.historyLimitGb || DEFAULT_HISTORY_LIMIT_GB).toFixed(3)} GB
        </p>
        <p className="settings-helper settings-helper-muted">
          Caps saved history size by storage usage. Allowed range: {MIN_HISTORY_LIMIT_GB} to {MAX_HISTORY_LIMIT_GB} GB.
        </p>
      </div>

      <div className="input-group">
        <label>Gemini API Key (for Camera Carbs Estimation)</label>
        <input
          type="password"
          name="geminiApiKey"
          value={settings.geminiApiKey}
          onChange={onInputChange}
          placeholder="AIzaSy..."
        />
        <div className="settings-info-card">
          <h3>How to get your free API key:</h3>
          <ol>
            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="settings-link">Google AI Studio</a>.</li>
            <li>Sign in with your Google account.</li>
            <li>Click on the <strong>"Create API key"</strong> button.</li>
            <li>Select an existing project or click <strong>"Create API key in a new project"</strong>.</li>
            <li>Copy the long API key (starts with AIza...) and paste it in the box above.</li>
          </ol>
          <p className="settings-info-note">
            <strong>Privacy Note:</strong> Your key is securely stored locally on this device. It is never sent to any server other than directly to Google's official AI endpoint.
          </p>
        </div>
      </div>

      <p className="settings-notice">
        <strong>Notice:</strong> Settings are saved automatically as you type. You can leave this page once you paste your key.
      </p>
    </div>
  );
}
