# Insulin Calculator Android App

## 🚧 Alpha Release

**This is an alpha release.** Some features are still under development:
- ⚠️ **Medical validation remains required** - Always verify all dose suggestions with your care team

A modern, user-friendly Android application for calculating insulin doses based on blood glucose levels and carbohydrate intake. Built with React, Vite, and Capacitor.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android-green.svg)
![Tests](https://github.com/andrewmarks9/insulin-calculator-android/actions/workflows/test.yml/badge.svg)
[![Latest Release](https://img.shields.io/github/v/release/andrewmarks9/insulin-calculator-android?label=Latest%20Release&color=blue)](https://github.com/andrewmarks9/insulin-calculator-android/releases)

## ⚠️ Medical Disclaimer

**This app is for informational purposes only and is NOT medical advice.** Always consult with your healthcare professional before making any medical decisions. The calculations provided by this app should be verified with your doctor.

## Features

- 🧮 **Insulin Dose Calculator** - Calculate total insulin dose based on:
  - Current blood glucose level
  - Target blood glucose level
  - Carbohydrate intake
  - Personal carb ratio and correction factor
  
- 📸 **AI Meal Carb Estimation** - Snap a photo of your meal and let Google's Gemini AI automatically estimate the total carbohydrates!
  
- 📊 **History Tracking** - Automatic logging of all calculations with timestamps
- 📄 **PDF Export** - Export your history as a professional PDF report
- 💾 **Persistent Settings** - Your preferences are saved automatically
- 🌓 **Dark Mode UI** - Modern, eye-friendly interface
- 🔄 **Unit Support** - Switch between mg/dL and mmol/L
- 🔒 **Privacy First** - All data stored locally on your device

## Tech Stack

- **Frontend**: React 19 + Vite
- **Mobile**: Capacitor 6
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Storage**: LocalStorage with quota management
- **Styling**: Vanilla CSS with modern design

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Android Studio** (for building Android app) - [Download](https://developer.android.com/studio)
- **Git** - [Download](https://git-scm.com/)

## Getting Started

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/insulin-calculator-android.git

# Navigate to the project directory
cd insulin-calculator-android

# Install dependencies
npm install
```

### 2. Development

```bash
# Start the development server
npm run dev

# Open http://localhost:5173 in your browser
```

### 3. Build for Android

```bash
# Build the web app
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# Build and run from Android Studio
```

## Development & Contributing

For comprehensive guides on Git workflows, building locally, permissions, and more, see [DEVELOPMENT.md](DEVELOPMENT.md).

**Quick Git setup:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Commit and push workflow
git add .
git commit -m "Clear description of changes"
git push
```

**Create a release:**
```bash
git tag v0.4.18
git push origin v0.4.18
```

See [AUTOMATE_RELEASES.md](AUTOMATE_RELEASES.md) for automatic APK building on GitHub.

### .gitignore

The project includes a `.gitignore` file that excludes:
- `node_modules/` - Dependencies
- `dist/` - Build output
- `android/app/build/` - Android build files
- `.DS_Store` - macOS system files
- Environment files with sensitive data

## Project Structure

```
insulin-calculator-android/
├── android/                 # Capacitor Android project
├── src/
│   ├── App.jsx             # App shell and orchestration
│   ├── CalculatorTab.jsx   # Calculator tab UI
│   ├── HistoryTab.jsx      # History and export tab UI
│   ├── SettingsTab.jsx     # Settings tab UI
│   ├── App.css             # Application styles
│   ├── PrivacyPolicy.jsx   # Privacy policy component
│   ├── hooks/
│   │   ├── useSettings.js      # Persisted settings + unit state
│   │   ├── useHistory.js       # History state initialized from storage
│   │   └── useExportStatus.js  # Timed export status helper
│   ├── utils/
│   │   ├── calculator.js   # Insulin calculation logic
│   │   ├── storage.js      # LocalStorage utilities with GB size cap
│   │   ├── permissions.js  # Android permissions helpers
│   │   ├── pdfExport.js    # PDF export pipeline helpers
│   │   └── ai.js           # Gemini image carb estimation
│   └── main.jsx            # Application entry point
├── public/                 # Static assets
├── index.html              # HTML template
├── capacitor.config.json   # Capacitor configuration
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
└── README.md               # This file
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build           # Build for production
npm run preview         # Preview production build locally

# Capacitor
npx cap sync            # Sync web app with native projects
npx cap open android    # Open Android project in Android Studio
npx cap run android     # Build and run on Android device/emulator

# Linting
npm run lint            # Run ESLint

# Testing
npm test                # Run Vitest in watch mode
npm run test:ui         # Run Vitest with UI
npm run test:coverage   # Generate test coverage report
```

## Downloading APK Releases

### From GitHub Releases (Easiest)

Pre-built APK files are automatically available after each version release:

1. Go to your GitHub repository
2. Click **Releases** on the right sidebar
3. Click the latest release
4. Download the `insulin-calculator-release.apk` file
5. Transfer to your Android device and open to install

**Note**: Releases are created by pushing version tags:
```bash
git tag v0.4.18
git push origin v0.4.18
```

See [AUTOMATE_RELEASES.md](AUTOMATE_RELEASES.md) for full details on automated builds.

## Building for Production

### Web Build

```bash
npm run build
```

The optimized files will be in the `dist/` directory.

### Android APK/AAB (Build Locally)

If you want to build the APK yourself:

1. Build the web app:
   ```bash
   npm run build
   npx cap sync android
   ```

2. Open Android Studio:
   ```bash
   npx cap open android
   ```

3. In Android Studio:
   - Build → Generate Signed Bundle/APK
   - Follow the wizard to create a release build
   - Sign with your keystore

For detailed publishing instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Configuration

### Capacitor Configuration

Edit `capacitor.config.json` to customize:
- App ID
- App name
- Server URL (for development)

### App Settings

Users can configure:
- Blood glucose units (mg/dL or mmol/L)
- Target blood glucose
- Carb ratio
- Correction factor (ISF)
- History storage limit slider (0.001 to 1 GB)
- Gemini API Key (for AI tracking)

Settings are automatically saved to LocalStorage.

### 📸 AI Meal Carb Estimation Setup

To use the AI Meal Carb Estimation feature (the camera button next to the carbs input), you must provide your own Gemini API key. This setup guarantees that the feature remains free and your usage is tied only to your personal Google account.

**What the function does:** When you take a picture of a meal, the app securely sends the photo directly from your device to Google's official Gemini AI server (`gemini-2.5-flash`). It asks the AI to estimate the total grams of carbohydrates in the meal and automatically fills the "Carbs (g)" input with the result.

**How to get and configure your free API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click the **"Create API key"** button.
4. Select an existing project or click **"Create API key in a new project"**.
5. Copy the generated key.
6. Open the app, navigate to the **Settings** tab, and securely paste your key. Your key is stored only on your local device.

## Recent Improvements

This app includes modern improvements for reliability and user experience:
- ✅ **Automated APK Releases**: Push a git tag to automatically build and release on GitHub
- ✅ **PDF Export with Error Handling**: Professional PDF generation with recovery from failures
- ✅ **Smart File Saving**: Saves to Documents with fallback to Cache directory
- ✅ **Permissions Handling**: Automatically requests storage permissions on Android 13+
- ✅ **Configurable Storage Limit**: Use a GB slider to cap history storage usage
- ✅ **User-Friendly Error Messages**: Clear guidance when something goes wrong
- ✅ **Confirmation Dialogs**: Prevents accidental data loss
- ✅ **Modular App Architecture**: App shell split into `CalculatorTab`, `HistoryTab`, `SettingsTab`, and focused hooks
- ✅ **Consistent Dose Values**: Dose values are rounded once at calculation time for UI, history, and PDF consistency
- ✅ **Shared Date Filtering**: History UI and PDF export now use one shared `filterHistoryByDays` helper
- ✅ **History Rendering Optimization**: History filtering memoized with `useMemo` to avoid repeated recomputation

See [DEVELOPMENT.md](DEVELOPMENT.md) for technical details.

## Troubleshooting

### Common Issues

**Problem**: `npm install` fails
```bash
# Solution: Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Android build fails
```bash
# Solution: Clean and rebuild
cd android
./gradlew clean
cd ..
npx cap sync android
```

**Problem**: App won't save files on Android
- Check that storage permissions are granted in device settings
- Ensure the app has been built with proper permissions in AndroidManifest.xml

**Problem**: Git push rejected
```bash
# Solution: Pull latest changes first
git pull --rebase origin main
git push
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Privacy

This app:
- ✅ Stores all standard data locally on your device
- ✅ Does NOT send standard configuration or history to any servers
- ✅ Does NOT track user behavior
- ✅ Needs an internet connection ONLY when querying the Gemini API for meal carbohydrate estimations
- ✅ **AI Camera Note:** When utilizing the AI camera feature, images are sent *only and directly* to Google's official Generative AI endpoints to estimate carbohydrates.

See the in-app Privacy Policy for complete details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

## Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Capacitor](https://capacitorjs.com/)
- PDF generation by [jsPDF](https://github.com/parallax/jsPDF)
- Icons and design inspired by modern mobile UI patterns

## Version History

### v0.4.18 (Current)
- Aligned History export behavior with the selected date range and renamed the action to `Export last N days`

### v0.4.17
- Added a basic accessibility pass: semantic tab roles, `aria-selected` tab state, `aria-invalid` on invalid numeric fields, live-region status/result announcements, and focus to result after calculate

### v0.4.16
- Replaced inline calculator/settings styles with CSS classes for consistent theming

### v0.4.15
- Replaced blocking `alert()` usage in calculator and AI flows with in-app timed status banners

### v0.4.14
- Added native app-settings deep link in denied permission flows via `openAppSettings()` and `@capacitor/app`

### v0.4.13
- Prevented initial settings overwrite/extra writes by skipping auto-save until settings hydration finishes

### v0.4.12
- Memoized filtered history in App using `useMemo` and passed pre-filtered data to History tab

### v0.4.11
- Added shared `filterHistoryByDays(history, dateRange)` helper used by both History UI and PDF export dataset building

### v0.4.10
- Fixed React Hooks lint compliance for history initialization by switching to lazy `useState(() => getHistory())`
- Updated all tracked Markdown docs for v0.4.10 release consistency

### v0.4.9
- Dose values now rounded at calculation time so history, PDF, and display are always consistent
- Extracted `CalculatorTab`, `HistoryTab`, `SettingsTab` components and `useSettings` / `useHistory` / `useExportStatus` hooks; `App.jsx` reduced from ~545 to ~306 lines

### v0.4.8
- Converted blood glucose and sensitivity values when switching units between mg/dL and mmol/L
- Updated all tracked Markdown docs for v0.4.8 release consistency

### v0.4.7
- Kept total dose aligned with clamped component doses so the breakdown matches the total
- Updated all tracked Markdown docs for v0.4.7 release consistency

### v0.4.6
- Added explicit zero-denominator protection in dose calculation to prevent Infinity/NaN results
- Updated all tracked Markdown docs for v0.4.6 release consistency

### v0.4.5
- Added inline validation message and invalid-field shake animation for Calculate action
- Updated all tracked Markdown documentation for release consistency

### v0.4.4
- Refactored PDF export into a dedicated pipeline module with clear stages:
   - validateExportInput
   - buildExportDataset
   - renderChartsToImages
   - buildPdfDocument
   - savePdfToFilesystem
   - sharePdf
- Added focused unit tests for PDF export data-shaping and validation helpers
- Added fallback tests for PDF file saving (Documents to Cache)

### v0.4.3
- Switched history storage limits from entry count to gigabyte-based limits
- Added a slider control for history storage limit in Settings

### v0.4.2
- Added configurable history storage limit setting (10 to 5,000 entries)
- Updated project documentation for release packaging workflow and storage behavior

### v0.2.1
- Replaced deprecated AI model with `gemini-2.5-flash` to restore camera carb estimation functionality.

### v0.2.0
- Added AI Meal Carb Estimation feature using Google Gemini
- Added in-app Settings menu for secure, local API key storage
- Upgraded project dependencies (`@capacitor/camera`)

### v0.1.0
- Initial release
- Insulin dose calculator
- History tracking with PDF export
- Persistent settings
- Dark mode UI
- Enhanced file saving with error handling

---

**Remember**: This app is a tool to assist with diabetes management, not a replacement for medical advice. Always consult your healthcare provider.
