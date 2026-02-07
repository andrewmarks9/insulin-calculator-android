# Insulin Calculator Android App

## 🚧 Alpha Release

**This is an alpha release.** Some features are still under development:
- ⚠️ **PDF Export** - Currently requires additional work and may not function as expected

A modern, user-friendly Android application for calculating insulin doses based on blood glucose levels and carbohydrate intake. Built with React, Vite, and Capacitor.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android-green.svg)

## ⚠️ Medical Disclaimer

**This app is for informational purposes only and is NOT medical advice.** Always consult with your healthcare professional before making any medical decisions. The calculations provided by this app should be verified with your doctor.

## Features

- 🧮 **Insulin Dose Calculator** - Calculate total insulin dose based on:
  - Current blood glucose level
  - Target blood glucose level
  - Carbohydrate intake
  - Personal carb ratio and correction factor
  
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
git tag v0.1.0
git push origin v0.1.0
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
│   ├── App.jsx             # Main application component
│   ├── App.css             # Application styles
│   ├── PrivacyPolicy.jsx   # Privacy policy component
│   ├── utils/
│   │   ├── calculator.js   # Insulin calculation logic
│   │   └── storage.js      # LocalStorage utilities
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
```

## Building for Production

### Web Build

```bash
npm run build
```

The optimized files will be in the `dist/` directory.

### Android APK/AAB

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

For detailed publishing instructions, see the [Publishing Guide](.agent/workflows/publishing_guide.md).

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

Settings are automatically saved to LocalStorage.

## Recent Improvements

This app includes modern improvements for reliability and user experience:
- ✅ **Automated APK Releases**: Push a git tag to automatically build and release on GitHub
- ✅ **PDF Export with Error Handling**: Professional PDF generation with recovery from failures
- ✅ **Smart File Saving**: Saves to Documents with fallback to Cache directory
- ✅ **Permissions Handling**: Automatically requests storage permissions on Android 13+
- ✅ **LocalStorage Quota Management**: Auto-cleanup of old history (max 1,000 items)
- ✅ **User-Friendly Error Messages**: Clear guidance when something goes wrong
- ✅ **Confirmation Dialogs**: Prevents accidental data loss

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
- ✅ Stores all data locally on your device
- ✅ Does NOT send data to any servers
- ✅ Does NOT track user behavior
- ✅ Does NOT require internet connection (except for initial install)

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

### v1.0.0 (Current)
- Initial release
- Insulin dose calculator
- History tracking with PDF export
- Persistent settings
- Dark mode UI
- Enhanced file saving with error handling

---

**Remember**: This app is a tool to assist with diabetes management, not a replacement for medical advice. Always consult your healthcare provider.
