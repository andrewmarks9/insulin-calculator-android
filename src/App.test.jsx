import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockedSettings, clearGeminiApiKeySettingMock } = vi.hoisted(() => ({
  mockedSettings: {
    targetBG: '',
    carbRatio: '',
    correctionFactor: '',
    geminiApiKey: '',
    historyLimitGb: '0.005'
  },
  clearGeminiApiKeySettingMock: vi.fn()
}));

vi.mock('./hooks/useSettings', () => ({
  useSettings: () => ({
    unit: 'mg/dL',
    setUnit: vi.fn(),
    settings: mockedSettings,
    updateSetting: vi.fn(),
    updateSettings: vi.fn(),
    clearGeminiApiKeySetting: clearGeminiApiKeySettingMock
  })
}));

vi.mock('./hooks/useHistory', () => ({
  useHistory: () => [[], vi.fn()]
}));

vi.mock('./hooks/useExportStatus', () => ({
  useExportStatus: () => [null, vi.fn()]
}));

vi.mock('./utils/permissions', () => ({
  ensureStoragePermission: vi.fn(),
  checkStoragePermission: vi.fn(),
  getPermissionErrorMessage: vi.fn(),
  openAppSettings: vi.fn(),
  PermissionState: {
    GRANTED: 'granted',
    DENIED: 'denied',
    PROMPT: 'prompt',
    PROMPT_WITH_RATIONALE: 'prompt-with-rationale',
    LIMITED: 'limited'
  },
  isNativePlatform: () => false
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    mockedSettings.targetBG = '';
    mockedSettings.carbRatio = '';
    mockedSettings.correctionFactor = '';
    mockedSettings.geminiApiKey = '';
    mockedSettings.historyLimitGb = '0.005';
    clearGeminiApiKeySettingMock.mockReset();
  });

  it('shows calculate validation error when required fields are empty', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /calculate dose/i }));

    expect(screen.getByText('Enter all numeric fields before calculating.')).toBeInTheDocument();
  });

  it('shows a specific validation message when ISF is zero', async () => {
    const user = userEvent.setup();

    mockedSettings.targetBG = '100';
    mockedSettings.carbRatio = '10';
    mockedSettings.correctionFactor = '0';

    render(<App />);

    await user.type(screen.getByLabelText(/current bg/i), '180');
    await user.type(screen.getByLabelText(/carbs \(g\)/i), '60');
    await user.click(screen.getByRole('button', { name: /calculate dose/i }));

    expect(screen.getByText('ISF (correction factor) must be greater than 0.')).toBeInTheDocument();
  });
});
