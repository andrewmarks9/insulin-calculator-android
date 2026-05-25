import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('capacitor-secure-storage-plugin', () => ({
  SecureStoragePlugin: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }
}));

import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  saveGeminiApiKey,
  GEMINI_API_KEY_STORAGE_KEY
} from './secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves the Gemini API key in secure storage', async () => {
    await saveGeminiApiKey('test-key');

    expect(SecureStoragePlugin.set).toHaveBeenCalledWith({
      key: GEMINI_API_KEY_STORAGE_KEY,
      value: 'test-key'
    });
  });

  it('removes the Gemini API key when an empty value is saved', async () => {
    await saveGeminiApiKey('');

    expect(SecureStoragePlugin.remove).toHaveBeenCalledWith({
      key: GEMINI_API_KEY_STORAGE_KEY
    });
  });

  it('reads the Gemini API key from secure storage', async () => {
    SecureStoragePlugin.get.mockResolvedValue({ value: 'stored-key' });

    await expect(getGeminiApiKey()).resolves.toBe('stored-key');
  });

  it('returns an empty string when secure storage misses the key', async () => {
    SecureStoragePlugin.get.mockRejectedValue(new Error('missing'));

    await expect(getGeminiApiKey()).resolves.toBe('');
  });

  it('clears the Gemini API key from secure storage', async () => {
    await clearGeminiApiKey();

    expect(SecureStoragePlugin.remove).toHaveBeenCalledWith({
      key: GEMINI_API_KEY_STORAGE_KEY
    });
  });
});