# Changelog

All notable changes to the Insulin Calculator Android app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions badges to README showing build and test status

### Changed
- Consolidated documentation from 7 files into 3 focused guides
- Updated README with APK download instructions

### Removed
- Redundant documentation files (GIT_GUIDE.md, GIT_SETUP_SUMMARY.md, etc.)

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
