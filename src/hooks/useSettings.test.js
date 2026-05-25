import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const {
  saveSettingsMock,
  getSettingsMock,
  clearLegacyGeminiApiKeyFromSettingsMock,
  getGeminiApiKeyMock,
  saveGeminiApiKeyMock,
  clearGeminiApiKeyMock
} = vi.hoisted(() => ({
  saveSettingsMock: vi.fn(),
  getSettingsMock: vi.fn(),
  clearLegacyGeminiApiKeyFromSettingsMock: vi.fn(),
  getGeminiApiKeyMock: vi.fn(),
  saveGeminiApiKeyMock: vi.fn(),
  clearGeminiApiKeyMock: vi.fn()
}));

vi.mock('../utils/storage', () => ({
  saveSettings: saveSettingsMock,
  getSettings: getSettingsMock,
  clearLegacyGeminiApiKeyFromSettings: clearLegacyGeminiApiKeyFromSettingsMock,
  DEFAULT_HISTORY_LIMIT_GB: 0.005
}));

vi.mock('../utils/secureStorage', () => ({
  getGeminiApiKey: getGeminiApiKeyMock,
  saveGeminiApiKey: saveGeminiApiKeyMock,
  clearGeminiApiKey: clearGeminiApiKeyMock
}));

import { useSettings } from './useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGeminiApiKeyMock.mockResolvedValue('');
    saveGeminiApiKeyMock.mockResolvedValue(undefined);
    clearGeminiApiKeyMock.mockResolvedValue(undefined);
  });

  it('purges legacy key from local storage immediately after secure migration on hydration', async () => {
    getSettingsMock.mockReturnValue({
      unit: 'mg/dL',
      targetBG: '100',
      carbRatio: '10',
      correctionFactor: '50',
      geminiApiKey: 'legacy-key'
    });

    renderHook(() => useSettings());

    await waitFor(() => {
      expect(saveGeminiApiKeyMock).toHaveBeenCalledWith('legacy-key');
    });

    expect(clearLegacyGeminiApiKeyFromSettingsMock).toHaveBeenCalledTimes(1);

    const saveCallOrder = saveGeminiApiKeyMock.mock.invocationCallOrder[0];
    const clearCallOrder = clearLegacyGeminiApiKeyFromSettingsMock.mock.invocationCallOrder[0];
    expect(clearCallOrder).toBeGreaterThan(saveCallOrder);
  });

  it('does not purge legacy key when no legacy plaintext key exists', async () => {
    getSettingsMock.mockReturnValue({
      unit: 'mg/dL',
      targetBG: '100',
      carbRatio: '10',
      correctionFactor: '50'
    });

    renderHook(() => useSettings());

    await waitFor(() => {
      expect(saveSettingsMock).toHaveBeenCalled();
    });

    expect(clearLegacyGeminiApiKeyFromSettingsMock).not.toHaveBeenCalled();
  });
});
