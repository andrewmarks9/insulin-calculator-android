const HISTORY_KEY = 'insulin_calc_history';
const MAX_HISTORY_ITEMS = 1000; // Prevent unlimited growth

export function saveHistoryItem(item) {
    try {
        const history = getHistory();
        const newItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...item
        };
        // Limit history size to prevent storage issues
        const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
    } catch (error) {
        console.error('Error saving history item:', error);
        // If quota exceeded, try to clear old items and retry
        if (error.name === 'QuotaExceededError') {
            try {
                const history = getHistory();
                const reducedHistory = history.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
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
