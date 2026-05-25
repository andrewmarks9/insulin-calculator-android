import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

const GEMINI_API_KEY_STORAGE_KEY = 'insulin_calc_gemini_api_key';

export async function saveGeminiApiKey(apiKey) {
  try {
    if (!apiKey) {
      await SecureStoragePlugin.remove({ key: GEMINI_API_KEY_STORAGE_KEY });
      return;
    }

    await SecureStoragePlugin.set({
      key: GEMINI_API_KEY_STORAGE_KEY,
      value: apiKey
    });
  } catch (error) {
    console.error('Error saving Gemini API key:', error);
    throw error;
  }
}

export async function getGeminiApiKey() {
  try {
    const result = await SecureStoragePlugin.get({ key: GEMINI_API_KEY_STORAGE_KEY });
    return result.value || '';
  } catch {
    return '';
  }
}

export async function clearGeminiApiKey() {
  try {
    await SecureStoragePlugin.remove({ key: GEMINI_API_KEY_STORAGE_KEY });
  } catch (error) {
    console.error('Error clearing Gemini API key:', error);
  }
}

export { GEMINI_API_KEY_STORAGE_KEY };