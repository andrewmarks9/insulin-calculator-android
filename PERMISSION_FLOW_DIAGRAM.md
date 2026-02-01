```
PERMISSION REQUEST FLOW
=======================

┌─────────────────────────────────────────────────────────────────┐
│                    User Clicks "Export PDF"                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Check Platform │
                    └────────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
         ┌──────────┐              ┌──────────┐
         │   Web    │              │ Android  │
         │ Browser  │              │  Native  │
         └────┬─────┘              └────┬─────┘
              │                         │
              │                         ▼
              │              ┌─────────────────────┐
              │              │ Check Permission    │
              │              │ Status              │
              │              └──────────┬──────────┘
              │                         │
              │              ┌──────────┴──────────┐
              │              │                     │
              │              ▼                     ▼
              │      ┌──────────────┐      ┌──────────────┐
              │      │   GRANTED    │      │ NOT GRANTED  │
              │      └──────┬───────┘      └──────┬───────┘
              │             │                     │
              │             │                     ▼
              │             │          ┌─────────────────────┐
              │             │          │ Request Permission  │
              │             │          │ (Show Dialog)       │
              │             │          └──────────┬──────────┘
              │             │                     │
              │             │          ┌──────────┴──────────┐
              │             │          │                     │
              │             │          ▼                     ▼
              │             │   ┌────────────┐      ┌────────────┐
              │             │   │   ALLOW    │      │    DENY    │
              │             │   └──────┬─────┘      └──────┬─────┘
              │             │          │                   │
              │             │          │                   ▼
              │             │          │         ┌──────────────────┐
              │             │          │         │ Show Error       │
              │             │          │         │ Message with     │
              │             │          │         │ Settings Path    │
              │             │          │         └──────────────────┘
              │             │          │                   │
              │             │          │                   ▼
              │             │          │              ┌─────────┐
              │             │          │              │  STOP   │
              │             │          │              └─────────┘
              │             │          │
              └─────────────┴──────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Generate PDF   │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Try Save to    │
                    │ Documents Dir  │
                    └────────┬───────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
           ┌──────────┐          ┌──────────┐
           │ SUCCESS  │          │  FAILED  │
           └────┬─────┘          └────┬─────┘
                │                     │
                │                     ▼
                │              ┌──────────────┐
                │              │ Fallback to  │
                │              │ Cache Dir    │
                │              └──────┬───────┘
                │                     │
                └─────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Open Share     │
                    │ Dialog         │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Show Success   │
                    │ Message        │
                    └────────────────┘
```

## Permission States Explained

### GRANTED
- Permission has been granted by the user
- App can save files immediately
- No dialog shown

### DENIED
- User explicitly denied permission
- Or permission was revoked in settings
- App shows error with instructions to enable in settings

### PROMPT
- User hasn't been asked yet
- System will show permission dialog
- First time requesting this permission

### PROMPT_WITH_RATIONALE
- User denied before but didn't select "Don't ask again"
- Should show explanation before requesting
- Gives user context for why permission is needed

## Android Version Differences

### Android 12 and Below (API ≤ 32)
```
Uses: WRITE_EXTERNAL_STORAGE
Dialog: "Allow Insulin Calculator to access photos and media?"
```

### Android 13+ (API ≥ 33)
```
Uses: READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO
Dialog: "Allow Insulin Calculator to access photos and media on your device?"
```

## Error Messages

### Permission Denied
```
Storage permission denied. Please enable it in your device settings to save files.

To enable: Go to Settings → Apps → Insulin Calculator → Permissions → Storage
```

### Permission Denied with Rationale
```
Storage permission is needed to save PDF files to your device.
```

### Limited Access
```
Limited storage access. Some features may not work properly.
```

## Code Flow

### 1. Check Permission
```javascript
const permissionResult = await ensureStoragePermission(true);
```

### 2. Handle Result
```javascript
if (!permissionResult.granted) {
  // Show error and stop
  return;
}
// Continue with export
```

### 3. Generate and Save
```javascript
const doc = new jsPDF();
// ... generate PDF ...
const savedFile = await Filesystem.writeFile({...});
```

### 4. Share
```javascript
await Share.share({
  url: savedFile.uri,
  ...
});
```
