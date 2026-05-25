# Changelog

All notable changes to the Insulin Calculator Android app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.31] - 2026-05-25

### Refactored
- Renamed status hook from `useExportStatus` to `useAppStatus` to reflect app-wide usage beyond PDF export
- Renamed shared status state/prop naming from `exportStatus` to `appStatus` across App and History flows

## [0.4.30] - 2026-05-25

### Refactored
- Simplified dose return values in `calculateDose` by returning the already-rounded `roundedCorrectionDose` and `roundedCarbDose` variables directly

## [0.4.29] - 2026-05-25

### Fixed
- Hardened settings hydration by explicitly purging legacy plaintext `geminiApiKey` from LocalStorage immediately after secure-storage migration succeeds

### Tests
- Added `useSettings` hydration tests covering legacy key purge-on-migration behavior and no-purge behavior when no legacy key exists

### Notes
- This release supersedes/repairs `v0.4.28`

## [0.4.27] - 2026-05-25

### Changed
- Debounced settings persistence to reduce LocalStorage write churn during rapid settings updates
- Gated export and permission debug logs to development builds to reduce production console noise
- Clear-saved-key action now clears secure storage immediately and purges any legacy Gemini key from LocalStorage settings

### Fixed
- Updated App permission status effect to use a stable callback/dependency pattern for safer hooks maintenance
- Added specific validation messages when ISF (correction factor) and/or carb ratio are zero

### Chore
- Aligned `package.json` version with the release line (`0.4.27`)

## [0.4.26] - 2026-05-25

### Tests
- Strengthened mmol/L coverage with a paired equivalence test proving mmol inputs match converted mg/dL inputs when correction factor conversion is consistent

## [0.4.25] - 2026-05-25

### Fixed
- Aligned export input validation with the selected date range so exports fail fast when the filtered range has no rows

## [0.4.24] - 2026-05-25

### Changed
- Export now uses browser download on web while keeping native Filesystem + Share flow on Android

### Fixed
- Replaced fixed chart capture delay with render-complete/frame-based waiting for more reliable PDF chart images on slower devices

## [0.4.23] - 2026-05-25

### Changed
- Added release-prep documentation updates for the web export path across project markdown files

## [0.4.22] - 2026-05-25

### Fixed
- Replaced Date.now-based history IDs with collision-resistant string IDs so rapid saves do not reuse the same identifier

## [0.4.21] - 2026-05-25

### Fixed
- Hardened Gemini meal estimation parsing so fenced JSON, trailing text, and malformed responses are handled with a clear user-facing error

## [0.4.20] - 2026-05-25

### Added
- Added a Settings action to clear the stored Gemini API key from secure device storage

## [0.4.19] - 2026-05-25

### Added
- Moved the Gemini API key out of LocalStorage and into secure device storage, with migration from older plaintext settings on first load

### Changed
- Updated settings persistence so LocalStorage only keeps public app preferences

## [0.4.18] - 2026-05-25

### Fixed
- Aligned History export button state with the selected date range so export is disabled only when the filtered range has no entries

### Changed
- Renamed the History export action to reflect the selected range (`Export last N days`)

## [0.4.17] - 2026-05-25

### Added
- Basic accessibility improvements across tabs and forms:
  - Main tab buttons now expose tab semantics (`tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`)
  - Number inputs now expose invalid/error state via `aria-invalid` and shared error descriptions
  - Result and status banners now use live-region semantics for assistive technologies
  - Labels are explicitly tied to inputs via `htmlFor`/`id`
  - Result card receives focus after calculate for clearer keyboard/screen-reader flow

## [0.4.16] - 2026-05-25

### Refactored
- Replaced inline calculator/settings styles with CSS classes for consistent theming and easier maintenance

## [0.4.15] - 2026-05-24

### Changed
- Replaced blocking `alert()` usage in calculator/AI flows with in-app timed status banners

## [0.4.14] - 2026-05-24

### Added
- Implemented `openAppSettings()` with `@capacitor/app` so denied permission flows can deep-link into app settings

## [0.4.13] - 2026-05-24

### Fixed
- Prevented initial settings overwrite/write churn by skipping auto-save until settings hydration completes

## [0.4.12] - 2026-05-24

### Performance
- Memoized filtered history in App with `useMemo` and passed pre-filtered history to History tab

## [0.4.11] - 2026-05-24

### Refactored
- Added shared `filterHistoryByDays(history, dateRange)` helper used by both History UI and PDF export dataset building

## [0.4.10] - 2026-05-23

### Fixed
- Resolved React Hooks lint failure by initializing history with lazy `useState(() => getHistory())` instead of calling `setState` inside an effect

## [0.4.9] - 2026-05-23

### Fixed
- `calculateDose` now returns doses already rounded to 1 decimal place so stored history and PDF exports match the on-screen display (removed double-formatting inconsistency)

### Refactored
- Extracted `CalculatorTab`, `HistoryTab`, and `SettingsTab` presentational components out of `App.jsx`
- Extracted `useSettings`, `useHistory`, and `useExportStatus` custom hooks; `App.jsx` reduced from ~545 to ~306 lines
- `useExportStatus` centralises the repeated `setTimeout(() => setExportStatus(null), ms)` pattern

## [0.4.8] - 2026-05-23

### Fixed
- Converted current BG, target BG, and sensitivity values when toggling between mg/dL and mmol/L

### Changed
- Updated all tracked Markdown docs for v0.4.8 release consistency and current behavior notes

## [0.4.7] - 2026-05-23

### Fixed
- Kept total insulin dose aligned with clamped component doses to avoid breakdown mismatches

### Changed
- Updated all tracked Markdown docs for v0.4.7 release consistency and current behavior notes

## [0.4.6] - 2026-05-23

### Fixed
- Rejected zero denominators in insulin calculation (`correctionFactor` and `carbRatio`) to prevent Infinity/NaN dose results

### Changed
- Updated all tracked Markdown docs for v0.4.6 release consistency and current behavior notes

## [0.4.5] - 2026-05-23

### Added
- Inline calculate validation feedback with invalid-field highlighting and shake animation

### Changed
- Updated all tracked Markdown docs for v0.4.5 release consistency

## [0.4.4] - 2026-05-23

### Added
- Focused unit tests for PDF export data-shaping helpers
- Fallback unit tests for PDF save behavior (Documents to Cache)

### Changed
- Refactored PDF export flow into modular utility pipeline functions:
  - validateExportInput
  - buildExportDataset
  - renderChartsToImages
  - buildPdfDocument
  - savePdfToFilesystem
  - sharePdf

## [0.4.3] - 2026-05-23

### Added
- Settings slider for history storage limit in gigabytes

### Changed
- Switched history retention from entry-count limits to gigabyte-based storage limits
- History trimming now enforces serialized storage size caps

## [0.4.2] - 2026-05-23

### Added
- Configurable history storage limit setting (10 to 5,000 entries)

### Changed
- Updated root and Android README files with release and storage-limit documentation
- History retention now follows the user-defined storage limit instead of a fixed cap

## [0.1.0] - 2026-02-07

### Added
- Initial release of Insulin Calculator Android app
- **Core Features**:
  - Insulin dose calculator based on blood glucose and carbohydrate intake
  - Automatic history tracking with timestamps
  - PDF export functionality for history reports
  - Persistent settings stored locally on device
  - Support for mg/dL and mmol/L glucose units
  - Dark mode UI

- **Technical Features**:
  - Automated APK building and GitHub Releases via GitHub Actions
  - Comprehensive unit tests for calculator and storage logic
  - Android permission handling for file operations (Android 13+)
  - LocalStorage quota management (max 1,000 history items)
  - PDF export with error handling and recovery
  - User-friendly error messages and confirmations

- **Infrastructure**:
  - GitHub Actions workflows for CI/CD
  - Automated test suite (calculator.test.js, storage.test.js)
  - Comprehensive documentation (README, DEVELOPMENT.md, AUTOMATE_RELEASES.md)
  - ESLint configuration for code quality
  - Vite development server with hot reload
  - Capacitor integration for Android compilation

### Security
- All data stored locally on device (no backend)
- No user tracking or analytics
- No internet connection required (except initial install)
- Proper Android permission requests with user prompts

### Documentation
- README.md with setup and features
- DEVELOPMENT.md with Git, build, and permissions guide
- AUTOMATE_RELEASES.md with release automation instructions
- In-app Privacy Policy

## Version Numbering

- **Major** (1.0.0): Significant features, breaking changes
- **Minor** (0.1.0): New features, backwards compatible
- **Patch** (0.1.1): Bug fixes, improvements

## Release Process

Releases are triggered automatically by pushing git tags:

```bash
git tag v0.1.0
git push origin v0.1.0
```

This triggers:
1. GitHub Actions build workflow
2. Automated APK compilation
3. GitHub Release creation with APK attached

See [AUTOMATE_RELEASES.md](AUTOMATE_RELEASES.md) for details.
