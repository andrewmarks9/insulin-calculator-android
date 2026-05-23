import React from 'react';
import { DEFAULT_HISTORY_LIMIT_GB, MIN_HISTORY_LIMIT_GB, MAX_HISTORY_LIMIT_GB } from './utils/storage';

export function SettingsTab({ settings, onInputChange }) {
  return (
    <div className="settings-view" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
        <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
          Selected: {Number.parseFloat(settings.historyLimitGb || DEFAULT_HISTORY_LIMIT_GB).toFixed(3)} GB
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
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
        <div style={{ marginTop: '15px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155' }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '10px' }}>How to get your free API key:</h3>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Google AI Studio</a>.</li>
            <li>Sign in with your Google account.</li>
            <li>Click on the <strong>"Create API key"</strong> button.</li>
            <li>Select an existing project or click <strong>"Create API key in a new project"</strong>.</li>
            <li>Copy the long API key (starts with AIza...) and paste it in the box above.</li>
          </ol>
          <p style={{ margin: '15px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            <strong>Privacy Note:</strong> Your key is securely stored locally on this device. It is never sent to any server other than directly to Google's official AI endpoint.
          </p>
        </div>
      </div>

      <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
        <strong>Notice:</strong> Settings are saved automatically as you type. You can leave this page once you paste your key.
      </p>
    </div>
  );
}
