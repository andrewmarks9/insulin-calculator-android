import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./hooks/useSettings', () => ({
  useSettings: () => ({
    unit: 'mg/dL',
    setUnit: vi.fn(),
    settings: {
      targetBG: '',
      carbRatio: '',
      correctionFactor: '',
      geminiApiKey: '',
      historyLimitGb: '0.005'
    },
    updateSetting: vi.fn(),
    updateSettings: vi.fn()
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
  it('shows calculate validation error when required fields are empty', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /calculate dose/i }));

    expect(screen.getByText('Enter all numeric fields before calculating.')).toBeInTheDocument();
  });
});
