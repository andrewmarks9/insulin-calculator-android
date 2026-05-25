# AI Agent Instructions for Insulin Calculator Android

## Project Overview
React + Vite + Capacitor medical app for calculating insulin doses. All data stored locally (LocalStorage), no backend. Targets Android with native file system integration.

## Architecture

### Key Components
- **`src/App.jsx`**: App shell/orchestrator for tabs and shared actions
- **`src/CalculatorTab.jsx`**: Presentational calculator tab UI
- **`src/HistoryTab.jsx`**: Presentational history/export tab UI
- **`src/SettingsTab.jsx`**: Presentational settings tab UI
- **`src/hooks/useSettings.js`**: Persisted settings/unit state hook
- **`src/hooks/useHistory.js`**: History state hook initialized from storage
- **`src/hooks/useExportStatus.js`**: Shared timed export-status helper
- **`src/utils/calculator.js`**: Pure calculation logic, supports mg/dL and mmol/L units
- **`src/utils/storage.js`**: LocalStorage wrapper with GB-based history limits and trimming
- **`src/utils/pdfExport.js`**: PDF export pipeline utilities (validate/dataset/charts/document/save/share)
- **`src/utils/permissions.js`**: Capacitor filesystem permissions handling for Android
- **`android/`**: Capacitor-generated Android project

### Data Flow
1. User inputs → `calculateDose()` → Result displayed + auto-saved to history
2. History operations go through `storage.js` which handles quota exceeded errors gracefully
3. PDF export pipeline: Validate input → Build dataset → Render charts → Build PDF → Save file → Share

## Critical Conventions

### Medical App Requirements
- **Always preserve medical disclaimer** in footer and docs
- Input validation is minimal by design (medical professionals expected to verify)
- No negative insulin doses: `Math.max(0, dose)` in calculator
- All calculations rounded to 1 decimal place at calculation time (with display formatting kept consistent)

### Accessibility Baseline
- Tie form labels to controls via `htmlFor` + matching `id`
- Expose invalid calculate fields using `aria-invalid` and link errors via `aria-describedby`
- Use semantic tabs (`tablist`, `tab`, `tabpanel`) with `aria-selected` and `aria-controls`
- Announce calculation/status updates using live regions (`role=status` or `role=alert`)
- Move keyboard focus to newly rendered primary results after calculate
- Keep export actions aligned with the selected date range; do not gate export on total history alone.

### Secure Storage
- Store the Gemini API key in secure device storage on native platforms, not in LocalStorage
- Migrate any legacy plaintext API key out of LocalStorage on first load
- Keep LocalStorage settings limited to public preferences only
- Provide a user-facing action to clear the saved Gemini API key from secure storage

### Storage Patterns
```javascript
// All storage operations MUST be wrapped in try-catch
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Handle cleanup
  }
}
```
Current behavior uses a configurable GB-based limit with automatic oldest-entry trimming and quota handling.

History items should use collision-resistant string IDs, preferably `crypto.randomUUID()` with a string fallback, instead of `Date.now()` so rapid saves do not collide.

Dose calculation now explicitly rejects zero denominators (`correctionFactor`, `carbRatio`) and returns `null` for invalid inputs.

`calculateDose()` keeps `totalDose` aligned with clamped component doses so the breakdown matches the total.

Changing the unit toggle converts current BG, target BG, and correction factor values between mg/dL and mmol/L using `convertUnitValue()`.

### Permission Handling (Android)
Before any file operation, call `ensureStoragePermission(true)`:
```javascript
const permissionResult = await ensureStoragePermission(true);
if (!permissionResult.granted) {
  // Show user-friendly error and offer opening app settings
}
```
Platform detection via `Capacitor.isNativePlatform()` - web doesn't need permissions.

### State Management
No Redux/Context - useState/useEffect only. Settings auto-save on change via useEffect watching dependencies:
```javascript
useEffect(() => {
  saveSettings({ unit, targetBG, carbRatio, correctionFactor });
}, [unit, inputs.targetBG, inputs.carbRatio, inputs.correctionFactor]);
```

For history initialization in hooks, prefer lazy state initialization (`useState(() => getHistory())`) over calling `setState` inside a mount effect to keep React Hooks lint checks green.

## Development Workflow

### Build & Test Commands
```bash
npm run dev              # Web dev server at localhost:5173
npm run build            # Production build to dist/
npx cap sync android     # Copy dist/ to android/app/src/main/assets
npx cap open android     # Launch Android Studio
```

### Testing on Device
1. Build web: `npm run build`
2. Sync: `npx cap sync android`
3. Open Android Studio: `npx cap open android`
4. Run on connected device/emulator from Android Studio

### File Structure for New Features
- UI components → `src/` (co-locate .jsx and .css)
- Business logic → `src/utils/` (pure functions, no React)
- Android config → `android/app/src/main/AndroidManifest.xml`

## Common Tasks

### Adding Capacitor Plugins
1. `npm install @capacitor/plugin-name`
2. Update `android/app/src/main/AndroidManifest.xml` with required permissions
3. `npx cap sync android`
4. Import and use in React: `import { Plugin } from '@capacitor/plugin-name'`

### PDF Export Modifications
Modify jsPDF generation in `handleExportPDF()`. Always:
- Save to `Directory.Documents` with `Directory.Cache` fallback
- Branch on platform: use browser download on web and Filesystem + Share on native Android
- Avoid fixed chart-capture delays; wait for render completion or use a frame-based fallback before image export
- Validate export input against the selected date range, not just total history size
- Use readable filenames: `insulin_history_YYYY-MM-DD.pdf`
- Show loading state: `setIsExporting(true/false)`
- Display status: `setExportStatus({ type: 'success'|'error', message })`

### Adding Input Fields
1. Add to `inputs` state in App.jsx
2. Create input-group div with label matching existing pattern
3. Update `handleInputChange` if special logic needed
4. Add to `saveSettings()` if should persist

## Integration Points

### External Dependencies
- **jsPDF + jsPDF-AutoTable**: PDF generation (no server-side)
- **Capacitor Filesystem**: Android file I/O (abstracts Java APIs)
- **Capacitor Share**: Native share sheet
- **Capacitor App**: Open app settings when permission is denied
- **LocalStorage**: Only persistence layer (5-10MB limit)

### Platform Differences
Web vs Android checked via `Capacitor.isNativePlatform()`:
- Web: Skip permission checks, use browser downloads
- Android: Require storage permissions, use native filesystem + share

## Gotchas

1. **LocalStorage quota**: Never assume unlimited space. Always check for `QuotaExceededError`
2. **Android permissions**: Manifest has both legacy (`WRITE_EXTERNAL_STORAGE` maxSdk=32) and modern (`READ_MEDIA_*`) permissions
3. **Build sync**: After ANY Android manifest change, must run `npx cap sync android`
4. **PDF base64**: jsPDF outputs data URI - must strip `data:application/pdf;base64,` prefix for Filesystem.writeFile
5. **React 19**: Uses new `react-dom/client` - don't use legacy ReactDOM.render

## Documentation Context
- `PERMISSIONS_IMPLEMENTATION_SUMMARY.md`: Permission flow details
- `FILE_SAVING_IMPROVEMENTS.md`: PDF export architecture decisions
- `README.md`: User-facing setup and Git workflow (keep updated for users)
