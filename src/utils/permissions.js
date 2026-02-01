import { Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

/**
 * Permission states
 */
export const PermissionState = {
    GRANTED: 'granted',
    DENIED: 'denied',
    PROMPT: 'prompt',
    PROMPT_WITH_RATIONALE: 'prompt-with-rationale',
    LIMITED: 'limited'
};

/**
 * Check if we're running on a native platform
 */
export function isNativePlatform() {
    return Capacitor.isNativePlatform();
}

/**
 * Check current storage permission status
 * @returns {Promise<string>} Permission state
 */
export async function checkStoragePermission() {
    try {
        if (!isNativePlatform()) {
            // Web doesn't need permissions
            return PermissionState.GRANTED;
        }

        const permission = await Filesystem.checkPermissions();
        console.log('Storage permission status:', permission);

        // publicStorage permission is what we need for saving files
        return permission.publicStorage || PermissionState.PROMPT;
    } catch (error) {
        console.error('Error checking storage permission:', error);
        return PermissionState.PROMPT;
    }
}

/**
 * Request storage permissions from the user
 * @returns {Promise<{granted: boolean, state: string}>}
 */
export async function requestStoragePermission() {
    try {
        if (!isNativePlatform()) {
            // Web doesn't need permissions
            return { granted: true, state: PermissionState.GRANTED };
        }

        console.log('Requesting storage permissions...');
        const permission = await Filesystem.requestPermissions();
        console.log('Permission request result:', permission);

        const state = permission.publicStorage || PermissionState.DENIED;
        const granted = state === PermissionState.GRANTED;

        return { granted, state };
    } catch (error) {
        console.error('Error requesting storage permission:', error);
        return { granted: false, state: PermissionState.DENIED };
    }
}

/**
 * Check if permission is granted, and request if needed
 * @param {boolean} autoRequest - Automatically request if not granted
 * @returns {Promise<{granted: boolean, state: string, shouldShowRationale: boolean}>}
 */
export async function ensureStoragePermission(autoRequest = true) {
    try {
        // First check current status
        const currentState = await checkStoragePermission();

        if (currentState === PermissionState.GRANTED) {
            return {
                granted: true,
                state: currentState,
                shouldShowRationale: false
            };
        }

        // If already denied and we shouldn't auto-request, return current state
        if (!autoRequest) {
            return {
                granted: false,
                state: currentState,
                shouldShowRationale: currentState === PermissionState.PROMPT_WITH_RATIONALE
            };
        }

        // Request permission
        const result = await requestStoragePermission();

        return {
            granted: result.granted,
            state: result.state,
            shouldShowRationale: result.state === PermissionState.PROMPT_WITH_RATIONALE
        };
    } catch (error) {
        console.error('Error ensuring storage permission:', error);
        return {
            granted: false,
            state: PermissionState.DENIED,
            shouldShowRationale: false
        };
    }
}

/**
 * Open app settings so user can manually grant permissions
 * This is useful when permissions are permanently denied
 */
export async function openAppSettings() {
    try {
        if (!isNativePlatform()) {
            console.log('Cannot open settings on web platform');
            return false;
        }

        // Note: Capacitor doesn't have a built-in way to open settings
        // You might need to use a plugin like @capacitor/app or implement native code
        // For now, we'll just log this
        console.log('Please manually enable storage permissions in your device settings');

        // You could use the App plugin to open settings:
        // import { App } from '@capacitor/app';
        // await App.openUrl({ url: 'app-settings:' });

        return true;
    } catch (error) {
        console.error('Error opening app settings:', error);
        return false;
    }
}

/**
 * Get user-friendly permission error message
 * @param {string} state - Permission state
 * @returns {string} User-friendly message
 */
export function getPermissionErrorMessage(state) {
    switch (state) {
        case PermissionState.DENIED:
            return 'Storage permission denied. Please enable it in your device settings to save files.';
        case PermissionState.PROMPT_WITH_RATIONALE:
            return 'Storage permission is needed to save PDF files to your device.';
        case PermissionState.LIMITED:
            return 'Limited storage access. Some features may not work properly.';
        default:
            return 'Unable to access storage. Please check your device settings.';
    }
}
