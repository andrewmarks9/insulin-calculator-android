const HISTORY_KEY = 'insulin_calc_history';
const BYTES_PER_GB = 1024 * 1024 * 1024;
const DEFAULT_HISTORY_LIMIT_GB = 0.005; // 5 MB default
const MIN_HISTORY_LIMIT_GB = 0.001; // 1 MB minimum
const MAX_HISTORY_LIMIT_GB = 1; // 1 GB maximum configurable limit

function estimateJsonStorageBytes(value) {
    const json = JSON.stringify(value);
    if (typeof Blob !== 'undefined') {
        return new Blob([json]).size;
    }
    // UTF-16 fallback approximation for environments without Blob.
    return json.length * 2;
}

function normalizeHistoryLimitGb(limitGb) {
    const parsed = Number.parseFloat(limitGb);
    if (Number.isNaN(parsed)) {
        return DEFAULT_HISTORY_LIMIT_GB;
    }
    return Math.min(MAX_HISTORY_LIMIT_GB, Math.max(MIN_HISTORY_LIMIT_GB, parsed));
}

function convertGbToBytes(limitGb) {
    return Math.floor(limitGb * BYTES_PER_GB);
}

function trimHistoryBySize(history, maxBytes) {
    if (estimateJsonStorageBytes(history) <= maxBytes) {
        return history;
    }

    const trimmedHistory = [...history];
    while (trimmedHistory.length > 0 && estimateJsonStorageBytes(trimmedHistory) > maxBytes) {
        trimmedHistory.pop();
    }
    return trimmedHistory;
}

function getConfiguredHistoryLimitBytes() {
    const settings = getSettings();
    const normalizedLimitGb = normalizeHistoryLimitGb(settings?.historyLimitGb);
    return convertGbToBytes(normalizedLimitGb);
}

export function saveHistoryItem(item) {
    try {
        const history = getHistory();
        const maxHistoryBytes = getConfiguredHistoryLimitBytes();
        const newItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...item
        };
        // Limit history serialized size to the configured cap.
        const updatedHistory = trimHistoryBySize([newItem, ...history], maxHistoryBytes);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
    } catch (error) {
        console.error('Error saving history item:', error);
        // If quota exceeded, try to clear old items and retry
        if (error.name === 'QuotaExceededError') {
            try {
                const history = getHistory();
                const reducedHistory = trimHistoryBySize(history, Math.floor(getConfiguredHistoryLimitBytes() / 2));
                localStorage.setItem(HISTORY_KEY, JSON.stringify(reducedHistory));
                throw new Error('Storage quota exceeded. Older history items were removed.');
            } catch {
                throw new Error('Unable to save: storage is full. Please clear some history.');
            }
        }
        throw error;
    }
}

export function getHistory() {
    try {
        const json = localStorage.getItem(HISTORY_KEY);
        return json ? JSON.parse(json) : [];
    } catch (error) {
        console.error('Error reading history:', error);
        return [];
    }
}

export function clearHistory() {
    try {
        localStorage.removeItem(HISTORY_KEY);
        return [];
    } catch (error) {
        console.error('Error clearing history:', error);
        return [];
    }
}

const SETTINGS_KEY = 'insulin_calc_settings';

export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
        // Settings are less critical, so we just log the error
    }
}

export function getSettings() {
    try {
        const json = localStorage.getItem(SETTINGS_KEY);
        return json ? JSON.parse(json) : null;
    } catch (error) {
        console.error('Error reading settings:', error);
        return null;
    }
}

export function enforceHistoryLimit(limitGb) {
    try {
        const history = getHistory();
        const normalizedLimitGb = normalizeHistoryLimitGb(limitGb);
        const maxHistoryBytes = convertGbToBytes(normalizedLimitGb);
        const trimmedHistory = trimHistoryBySize(history, maxHistoryBytes);
        if (trimmedHistory.length !== history.length) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
        }
        return trimmedHistory;
    } catch (error) {
        console.error('Error enforcing history limit:', error);
        return getHistory();
    }
}

export { DEFAULT_HISTORY_LIMIT_GB, MIN_HISTORY_LIMIT_GB, MAX_HISTORY_LIMIT_GB };
