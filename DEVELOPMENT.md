# Development Guide

This guide covers Git workflows, building locally, and understanding key features of the Insulin Calculator app.

## Git Workflow

### First-Time Setup

```bash
# Configure Git (one-time)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# If repo doesn't exist yet:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/insulin-calculator-android.git
git branch -M main
git push -u origin main
```

### Daily Workflow

```bash
# Check what changed
git status
git diff

# Save your work
git add .
git commit -m "Clear message describing your changes"
git push

# Create a release tag
git tag v0.1.0
git push origin v0.1.0
```

### Useful Commands

```bash
# View commit history
git log --oneline

# Undo local changes (keep the file)
git restore <file>

# Undo last commit (keep the changes)
git reset --soft HEAD~1

# See what changed in a branch
git diff main feature-branch

# Merge a branch
git checkout main
git merge feature-branch
```

## Building Locally

### Web (Development)

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

### Web (Production Build)

```bash
npm run build
# Creates optimized dist/ folder
```

### Android

```bash
# 1. Build web assets
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. Build & run from Android Studio
# Or from terminal:
cd android
./gradlew assembleDebug      # Debug APK
./gradlew assembleRelease    # Release APK
```

## File Permissions (Android)

### How it Works

The app automatically handles storage permissions for PDF export:

1. **First time user exports PDF**: Android shows permission dialog
2. **User allows**: PDF saves and share dialog opens
3. **User denies**: Helpful error message shown with instructions

### Permission States

- ✅ **GRANTED**: Can save files
- ❌ **DENIED**: User said no (can retry)
- ❌ **PERMANENTLY DENIED**: User said no + "Don't ask again" (must go to settings)
- ❓ **PROMPT**: User hasn't been asked yet

### Technical Details

**Android Manifest** (`android/app/src/main/AndroidManifest.xml`):
- Android 12 and below: `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`
- Android 13+: `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`

**Permission Module** (`src/utils/permissions.js`):
- `checkStoragePermission()`: Check current state
- `requestStoragePermission()`: Ask user for permission
- `ensureStoragePermission(autoRequest)`: Check and optionally request

### Testing Permissions

1. Build and run on device/emulator
2. Go to Settings → Apps → Insulin Calculator → Permissions
3. Toggle Storage on/off
4. Try exporting PDF and observe behavior

## PDF Export & File Saving

### How it Works

1. User clicks "Export PDF"
2. App checks storage permission (requests if needed)
3. Generates PDF with jsPDF
4. **Saves to Documents** (primary) or **Cache** (fallback)
5. Opens native Android share dialog
6. Shows success/error status

### File Location

- **Production**: `Documents/insulin_history_YYYY-MM-DD.pdf`
- **Fallback**: `Cache/insulin_history_YYYY-MM-DD.pdf` (can be deleted by system)

### Error Handling

- **No permission**: Clear message with settings instructions
- **Share failed**: Suggests retry
- **Empty history**: Prevents export with user message
- **Storage full**: Auto-deletes oldest history items

### Testing Export

```bash
# On device
1. Add calculations to history
2. Click "Export PDF"
3. Approve permission if prompted
4. Share to file manager or email
5. Verify PDF content
```

## Storage & History

### LocalStorage Limits

- Max 1,000 history items (auto-cleanup if exceeded)
- ~5-10MB typical device limit
- All data stored locally (no backend)

### History Management

**Saving** (`src/utils/storage.js`):
```javascript
// Auto-saves after each calculation
saveHistoryItem({ inputs, dose, timestamp })
```

**Clearing** (`src/App.jsx`):
```javascript
// Shows confirmation dialog
// Prevents accidental loss of data
clearHistory()
```

**Quota Exceeded**:
- Automatically removes oldest items
- User sees message but export continues
- No data loss, just automatic cleanup

## Testing

### Run Tests

```bash
# Unit tests
npm test

# With UI
npm run test:ui

# Coverage
npm run test:coverage
```

### Test Files

- `src/utils/calculator.test.js`: Dose calculation logic
- `src/utils/storage.test.js`: Storage operations
- Test setup: `src/utils/test-setup.js`

## State Management

The app uses React hooks (no Redux/Context):

- **State**: `useState()` for component state
- **Side effects**: `useEffect()` for auto-save
- **Settings auto-save**: `useEffect` watches dependencies

```javascript
// Settings auto-save to localStorage
useEffect(() => {
  saveSettings({
    unit,
    targetBG: inputs.targetBG,
    carbRatio: inputs.carbRatio,
    correctionFactor: inputs.correctionFactor
  });
}, [unit, inputs.targetBG, inputs.carbRatio, inputs.correctionFactor]);
```

## Automated Releases

For automatic APK building and GitHub releases, see [AUTOMATE_RELEASES.md](AUTOMATE_RELEASES.md).

**Quick version:**
```bash
git tag v0.1.0
git push origin v0.1.0
# GitHub Actions builds APK automatically
```

## Project Structure

```
src/
  App.jsx              # Main component (state, calculations)
  App.css              # Styling
  main.jsx             # React entry point
  utils/
    calculator.js      # Dose calculation logic
    storage.js         # LocalStorage wrapper
    permissions.js     # Android permission handling
android/               # Capacitor Android project
dist/                  # Production build (generated)
```

## Medical App Conventions

⚠️ **Always maintain:**
- Medical disclaimer in footer
- No negative insulin doses
- All calculations rounded to 1 decimal place
- Input validation is minimal (medical pros verify)

## Troubleshooting

### Build Issues

```bash
# Clear cache and rebuild
rm -rf node_modules dist android/app/build
npm install
npm run build
```

### Android Sync Problems

```bash
# Force sync Capacitor
rm -rf android/app/src/main/assets/public
npx cap sync android
```

### Permission Problems

- Test locally: `npm run build && npx cap sync android`
- Check `android/app/src/main/AndroidManifest.xml` for permissions
- Emulator: Settings → Apps → Permissions (grant manually first time)
- Device: Same path, but swipe to grant

### Storage Full

- Check device storage: Settings → Storage
- History auto-cleans at 1,000 items
- Manual clear: Tap "Clear History" in app

## Commits & Releases

### Commit Message Format

```
Short description (50 chars max)

Optional longer explanation if needed.
- Bullet points are helpful
- Reference issues with #123
```

### Creating Releases

```bash
# After all changes are committed and pushed to main:
git tag v1.0.0 -m "Version 1.0.0: Initial release"
git push origin v1.0.0

# GitHub Actions will automatically:
# 1. Build the app
# 2. Create a GitHub Release
# 3. Attach the APK
# 4. Keep artifact for 30 days
```

See [AUTOMATE_RELEASES.md](AUTOMATE_RELEASES.md) for full details.

## Resources

- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **Capacitor**: https://capacitorjs.com
- **jsPDF**: https://github.com/parallax/jsPDF
- **Android Studio**: https://developer.android.com/studio
