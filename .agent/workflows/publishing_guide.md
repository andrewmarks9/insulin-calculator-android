---
description: Guide to publishing the Android App to the Play Store
---

# Publishing to Google Play Store

## 1. Prepare Assets
Ensure you have high-resolution icons and splash screens.
We can use `@capacitor/assets` to generate these.
1. Place a 1024x1024 icon at `assets/icon.png`
2. Place a 1024x1024 splash image at `assets/splash.png`
3. Run `npx @capacitor/assets generate --android`

## 2. Versioning
Update your version numbers in `android/app/build.gradle`:
- `versionCode`: Integer (e.g., 2, 3). Must increase with every release.
- `versionName`: String (e.g., "1.0.1"). Visible to users.

## 3. Signing the App
You need a release Keystore to sign your app.
1. Generate keystore:
   ```bash
   keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
   ```
2. Move `my-release-key.jks` to `android/app/`.
3. Create `android/key.properties` (DO NOT COMMIT THIS FILE):
   ```properties
   storePassword=your_store_password
   keyPassword=your_key_password
   keyAlias=my-key-alias
   storeFile=my-release-key.jks
   ```
4. Update `android/app/build.gradle` to use these properties (I can help apply this code).

## 4. Build Release Bundle
Run the following command to generate the Android App Bundle (.aab):
```bash
cd android
./gradlew bundleRelease
```
The output file will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## 5. Upload to Play Console
1. Go to [Google Play Console](https://play.google.com/console).
2. Create a new app.
3. Upload the `.aab` file to the "Production" or "Internal Testing" track.
