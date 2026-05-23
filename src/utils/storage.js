const HISTORY_KEY = 'insulin_calc_history';
const DEFAULT_MAX_HISTORY_ITEMS = 1000; // Prevent unlimited growth
const MIN_HISTORY_ITEMS = 10;
const MAX_HISTORY_ITEMS = 5000;

function normalizeHistoryLimit(limit) {
    const parsed = Number.parseInt(limit, 10);
    if (Number.isNaN(parsed)) {
        return DEFAULT_MAX_HISTORY_ITEMS;
    }
    return Math.min(MAX_HISTORY_ITEMS, Math.max(MIN_HISTORY_ITEMS, parsed));
}

function getConfiguredHistoryLimit() {
    const settings = getSettings();
    return normalizeHistoryLimit(settings?.historyLimit);
}

export function saveHistoryItem(item) {
    try {
        const history = getHistory();
        const maxHistoryItems = getConfiguredHistoryLimit();
        const newItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...item
        };
        // Limit history size to prevent storage issues
        const updatedHistory = [newItem, ...history].slice(0, maxHistoryItems);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
    } catch (error) {
        console.error('Error saving history item:', error);
        // If quota exceeded, try to clear old items and retry
        if (error.name === 'QuotaExceededError') {
            try {
                const history = getHistory();
                const reducedHistory = history.slice(0, Math.floor(getConfiguredHistoryLimit() / 2));
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

export function enforceHistoryLimit(limit) {
    try {
        const history = getHistory();
        const maxHistoryItems = normalizeHistoryLimit(limit);
        const trimmedHistory = history.slice(0, maxHistoryItems);
        if (trimmedHistory.length !== history.length) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
        }
        return trimmedHistory;
    } catch (error) {
        console.error('Error enforcing history limit:', error);
        return getHistory();
    }
}

export { DEFAULT_MAX_HISTORY_ITEMS, MIN_HISTORY_ITEMS, MAX_HISTORY_ITEMS };
