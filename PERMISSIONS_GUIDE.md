# File Permissions Implementation

## Overview
This document explains the file permission system implemented for the Insulin Calculator Android app. The app now properly requests and handles storage permissions before saving PDF files to the device.

## What Was Added

### 1. Android Manifest Permissions (`android/app/src/main/AndroidManifest.xml`)

Added the following permissions to support file saving across different Android versions:

```xml
<!-- Storage permissions for Android 12 and below -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

<!-- Storage permissions for Android 13+ (API 33+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
```

**Why these permissions?**
- **Android 12 and below**: Uses `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`
- **Android 13+**: Uses granular media permissions (`READ_MEDIA_*`)
- The `maxSdkVersion="32"` ensures old permissions only apply to older Android versions

### 2. Permissions Utility Module (`src/utils/permissions.js`)

Created a comprehensive utility module that handles:

#### Functions:
- **`checkStoragePermission()`**: Checks current permission status without requesting
- **`requestStoragePermission()`**: Requests storage permissions from the user
- **`ensureStoragePermission(autoRequest)`**: Checks and optionally requests permissions in one call
- **`getPermissionErrorMessage(state)`**: Returns user-friendly error messages
- **`isNativePlatform()`**: Checks if running on native (vs web)

#### Permission States:
- `GRANTED`: Permission is granted
- `DENIED`: Permission is denied (permanently or temporarily)
- `PROMPT`: User hasn't been asked yet
- `PROMPT_WITH_RATIONALE`: Should show explanation before asking
- `LIMITED`: Limited access granted

### 3. Updated PDF Export (`src/App.jsx`)

The `handleExportPDF` function now follows this flow:

```
1. Check if history exists
2. ✨ Check and request storage permissions
3. If denied, show helpful error message with settings path
4. Generate PDF with jsPDF
5. Save to Documents directory (or Cache as fallback)
6. Open native share dialog
7. Show success/error status
```

## How It Works

### Permission Request Flow

1. **User clicks "Export PDF"**
   - App shows "Exporting..." state

2. **Permission Check**
   ```javascript
   const permissionResult = await ensureStoragePermission(true);
   ```
   - Checks if permission is already granted
   - If not, automatically requests it

3. **Permission Dialog**
   - Android shows native permission dialog
   - User can Allow or Deny

4. **Handle Result**
   - **If Granted**: Proceed with PDF export
   - **If Denied**: Show error message with instructions

### User Experience

#### First Time Export
1. User clicks "Export PDF"
2. Android shows permission dialog: "Allow Insulin Calculator to access photos and media on your device?"
3. User taps "Allow"
4. PDF is generated and share dialog opens

#### Permission Denied
If user denies permission, they see:
```
Storage permission denied. Please enable it in your device settings to save files.

To enable: Go to Settings → Apps → Insulin Calculator → Permissions → Storage
```

#### Already Granted
If permission was previously granted:
1. User clicks "Export PDF"
2. PDF generates immediately (no permission dialog)
3. Share dialog opens

## Error Handling

The implementation handles several error scenarios:

### 1. Permission Denied
```javascript
if (!permissionResult.granted) {
  let errorMessage = getPermissionErrorMessage(permissionResult.state);
  if (permissionResult.state === PermissionState.DENIED) {
    errorMessage += '\n\nTo enable: Go to Settings → Apps → ...';
  }
  setExportStatus({ type: 'error', message: errorMessage });
}
```

### 2. File System Errors
- Tries Documents directory first
- Falls back to Cache directory if Documents fails
- Shows specific error messages

### 3. Share Dialog Errors
- Detects if share fails
- Shows "Could not share file. Please try again."

## Testing Checklist

### On Android Device/Emulator:

1. **First Install - Permission Request**
   - [ ] Install app fresh
   - [ ] Add some history entries
   - [ ] Click "Export PDF"
   - [ ] Verify permission dialog appears
   - [ ] Tap "Allow"
   - [ ] Verify PDF exports successfully

2. **Permission Denied**
   - [ ] Uninstall and reinstall app
   - [ ] Click "Export PDF"
   - [ ] Tap "Deny" on permission dialog
   - [ ] Verify error message shows with settings instructions
   - [ ] Go to Settings and manually grant permission
   - [ ] Try export again - should work

3. **Permission Already Granted**
   - [ ] With permission already granted
   - [ ] Click "Export PDF"
   - [ ] Verify no permission dialog (goes straight to share)

4. **Different Android Versions**
   - [ ] Test on Android 12 or below (uses WRITE_EXTERNAL_STORAGE)
   - [ ] Test on Android 13+ (uses READ_MEDIA_*)

5. **Web Browser**
   - [ ] Test in web browser
   - [ ] Verify no permission dialogs (web doesn't need them)
   - [ ] Verify export still works

## Platform Differences

### Android (Native)
- **Requires runtime permissions**
- Shows native Android permission dialog
- Permissions persist across app sessions
- User can revoke in Settings

### Web Browser
- **No permissions needed**
- Files download directly
- Browser handles file saving

### Detection
```javascript
if (Capacitor.isNativePlatform()) {
  // Request permissions
} else {
  // Skip permissions (web)
}
```

## Troubleshooting

### Permission Dialog Not Showing
- Check `AndroidManifest.xml` has correct permissions
- Verify `@capacitor/filesystem` is installed
- Check console for errors

### Permission Permanently Denied
- User must manually enable in Settings
- App shows instructions: "Settings → Apps → Insulin Calculator → Permissions"

### Export Works in Browser but Not Android
- Likely a permission issue
- Check logcat: `adb logcat | grep -i permission`
- Verify permissions in AndroidManifest.xml

### Files Not Saving
- Check if permission is granted
- Try Cache directory instead of Documents
- Check device storage space

## Console Logging

The implementation includes helpful console logs:

```javascript
console.log('Checking storage permissions...');
console.log('Storage permission status:', permission);
console.log('Storage permission granted, proceeding with export...');
console.log('PDF saved to Documents:', savedFile.uri);
```

Use these to debug issues:
```bash
# View logs on Android
adb logcat | grep -i "storage\|permission\|pdf"
```

## Future Enhancements

Potential improvements:

1. **Settings Button in Error Message**
   - Add button to open app settings directly
   - Requires `@capacitor/app` plugin

2. **Permission Rationale Dialog**
   - Show custom dialog explaining why permission is needed
   - Before showing system permission dialog

3. **Persistent Permission State**
   - Remember if user denied permanently
   - Don't keep asking if they said no

4. **Alternative Save Methods**
   - If permission denied, offer to share via email
   - Or copy to clipboard as base64

## Related Files

- `android/app/src/main/AndroidManifest.xml` - Permission declarations
- `src/utils/permissions.js` - Permission logic
- `src/App.jsx` - PDF export with permission checks
- `package.json` - Capacitor dependencies

## Resources

- [Capacitor Filesystem API](https://capacitorjs.com/docs/apis/filesystem)
- [Android Permissions Guide](https://developer.android.com/guide/topics/permissions/overview)
- [Android 13 Storage Changes](https://developer.android.com/about/versions/13/behavior-changes-13#granular-media-permissions)
