# Automated APK Release Guide

## How It Works

The GitHub Actions workflow automatically builds and releases your APK whenever you push a git tag starting with `v` (e.g., `v1.0.0`, `v0.1.0`).

## Quick Start

### 1. Create a Release Tag
```bash
# Make sure everything is committed
git add .
git commit -m "Your commit message"

# Create and push a version tag
git tag v0.1.0
git push origin v0.1.0
```

### 2. Monitor the Build
- Go to your GitHub repository
- Click **Actions** tab
- Watch the workflow execute
- Once complete, the APK will be available as a **Release** and **Artifact**

### 3. Download the APK
- **Option A (GitHub Releases)**: Go to **Releases** page → Click the latest release → Download APK
- **Option B (Artifacts)**: Go to **Actions** → Click completed workflow → Download artifact at bottom

## Version Tagging Convention

Use semantic versioning:
```bash
git tag v1.0.0    # Major release
git tag v0.1.0    # Minor release
git tag v0.0.1    # Patch release
```

## What Happens Automatically

When you push a tag:
1. ✅ Checks out your code
2. ✅ Installs Node dependencies
3. ✅ Builds web assets with Vite (`npm run build`)
4. ✅ Sets up Android SDK
5. ✅ Syncs Capacitor configuration
6. ✅ Builds release APK with Gradle
7. ✅ Creates a GitHub Release with the APK attached
8. ✅ Stores APK as artifact (kept for 30 days)

## Signing APK (Optional but Recommended)

To sign the APK for production:

### 1. Generate Keystore
```bash
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

### 2. Add to GitHub Secrets
- Repository → Settings → Secrets and variables → Actions
- Add two secrets:
  - `KEYSTORE_BASE64`: Contents of keystore file encoded in base64
  - `KEYSTORE_PASSWORD`: Your keystore password
  - `KEY_ALIAS`: Your key alias
  - `KEY_PASSWORD`: Your key password

### 3. Update Workflow
Update `.github/workflows/build-release.yml`:
```yaml
- name: Build signed APK
  working-directory: android
  env:
    KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
    KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
    KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
    KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
  run: |
    echo "$KEYSTORE_BASE64" | base64 -d > app/upload-keystore.jks
    chmod +x gradlew
    ./gradlew assembleRelease \
      -Pandroid.injected.signing.store.file=app/upload-keystore.jks \
      -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
      -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
      -Pandroid.injected.signing.key.password="$KEY_PASSWORD"
```

## Troubleshooting

### Build fails with "SDK not found"
- Workflow automatically installs Android SDK, but if it fails:
  - Check Actions logs for specific errors
  - May need to accept Android SDK licenses manually locally first

### APK not generated
- Check the Actions logs for build errors
- Common issues: Missing dependencies, Android manifest problems
- Run locally first: `npm run build && npx cap sync android && cd android && ./gradlew assembleRelease`

### Want to Disable Auto-Release
Edit `.github/workflows/build-release.yml` and comment out the "Create Release" step if you only want artifacts.

## Local Testing Before Release

```bash
# Test the build process locally
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Next Steps

1. Commit this workflow: `git add .github/workflows/build-release.yml`
2. Push to main: `git push origin main`
3. Create first release: `git tag v0.0.1 && git push origin v0.0.1`
4. Watch the magic! ✨
