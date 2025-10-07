# MF Rastreamento Configuration Guide

This document explains the configuration process for the MF Rastreamento app, focusing on the unified configuration approach.

## Unified Configuration System

The app uses a single, comprehensive configuration script (`scripts/unified-config.js`) that handles all aspects of the setup process in one place.

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run configure` | Run the complete configuration process |
| `npm run build` | Configure and build a release APK |
| `npm run run` | Configure and run on an Android device/emulator |
| `npm run run-quick` | Run on Android device/emulator without configuration (fastest) |
| `npm run bundle` | Configure and build a release AAB (Android App Bundle) |
| `npm run env` | Display commands to set environment variables for your OS |
| `npm run rebrand` | Run the rebranding script to customize the app for a new client |

### Command-Line Flags

The unified configuration script supports several command-line flags:

| Flag | Description |
|------|-------------|
| `--skip-prebuild` | Skip the Expo prebuild step (useful for quick updates) |
| `--skip-clean` | Skip cleaning the Android build (preserves compiled resources) |
| `--continue-on-error` | Continue with the configuration process even if some steps fail |

You can use these flags with any of the npm scripts that use the configuration script:

```
npm run configure -- --skip-prebuild --skip-clean
```

## Configuration Process

The configuration script performs the following steps in order:

1. **Environment Setup**
   - Sets up environment variables needed for the build process

2. **Expo Prebuild**
   - Runs `expo prebuild` to generate native code
   - Can be skipped with the `--skip-prebuild` flag

3. **Keystore Setup**
   - Configures signing keystores for Android

4. **Firebase Configuration**
   - Creates/updates `firebase.json` with proper settings for FCM
   - Configures notification channels and other Firebase settings

5. **Notification Configuration**
   - Updates color resources for notifications
   - Creates notification icons

6. **Android Manifest Updates**
   - Adds notification channel metadata to AndroidManifest.xml
   - Configures notification appearance settings

7. **Android Build Cleaning**
   - Cleans the Android build to ensure fresh compilation
   - Can be skipped with the `--skip-clean` flag

## Firebase Cloud Messaging Configuration

The app uses Firebase Cloud Messaging for push notifications. The configuration includes:

### Notification Channel

A high-priority notification channel is created with the following properties:
- Channel ID: `high-priority`
- Color: `#2196F3` (blue)
- Sound: Enabled
- Vibration: Enabled

### Firebase Configuration

The `firebase.json` file is configured with these settings:

```json
{
  "react-native": {
    "messaging_android_notification_channel_id": "high-priority",
    "messaging_android_notification_color": "@color/blue",
    "messaging_android_headless_task_timeout": 30000,
    "messaging_ios_auto_register_for_remote_messages": true,
    "messaging_ios_foreground_presentation_options": ["badge", "sound", "list", "banner"],
    "messaging_auto_init_enabled": true,
    "analytics_auto_collection_enabled": true,
    "messaging_android_notification_delegation_enabled": false
  }
}
```

## Troubleshooting

### Common Issues

#### Notifications Not Showing

If notifications are not showing:

1. Make sure you've run `npm run configure` at least once
2. Check that the `google-services.json` file is present in the project root
3. Verify that the notification channel is properly configured in the Android settings
4. Check the logs for any errors during the configuration process

#### Windows-Specific Issues

If you're running on Windows and encounter issues with Gradle commands:

1. Make sure you're using the correct Gradle command format: `gradlew.bat` instead of `./gradlew`
2. If you see errors about '.' not being recognized as a command, this is a Windows-specific issue
3. Try running the command with the `--skip-clean` flag to avoid Gradle clean issues

#### Build Errors

If you encounter build errors:

1. Try running a full configuration with `npm run configure`
2. Check the Android build logs for specific error messages
3. Make sure all required dependencies are installed
4. Verify that the Android SDK and NDK are properly configured

### Detailed Logging

For more detailed logs, you can run the configuration script directly:

```
node ./scripts/configure-project.js
```

### Recovering from Failed Configuration

If the configuration process fails:

1. Fix any issues reported in the logs
2. Run the configuration again with the `--continue-on-error` flag to skip failed steps
3. If specific steps are failing, try running them individually using the dedicated scripts

```
npm run setup-firebase
npm run fix-notification
npm run create-notification-icon
```

## Manual Configuration

If you need to manually configure specific parts of the app:

- **Firebase**: Run `npm run setup-firebase`
- **Notifications**: Run `npm run fix-notification`
- **Notification Icons**: Run `npm run create-notification-icon`
- **Keystores**: Run `npm run setup-keystores`

## Android Keystore Generation

For app signing and publishing to the Google Play Store, you need to generate keystores. Here are the commands to generate different types of keystores:

### Generate Debug Keystore

A debug keystore is used during development:

```bash
# On Windows
keytool -genkeypair -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android

# On macOS/Linux
keytool -genkeypair -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android
```

### Generate Release Keystore (JKS format)

A release keystore is required for publishing your app to the Google Play Store:

```bash
# On Windows
keytool -genkeypair -v -keystore mfrastreamento.keystore -alias mfrastreamento -keyalg RSA -keysize 2048 -validity 10000

# On macOS/Linux
keytool -genkeypair -v -keystore mfrastreamento.keystore -alias mfrastreamento -keyalg RSA -keysize 2048 -validity 10000
```

When running this command, you'll be prompted to enter:
- Password for the keystore (remember this for future use)
- Your name, organization, city, state, and country code
- Key password (can be the same as the keystore password)

### Convert JKS to PKCS12 Format

If you need to convert a JKS keystore to PKCS12 format:

```bash
# On Windows
keytool -importkeystore -srckeystore mfrastreamento.keystore -destkeystore mfrastreamento.p12 -srcstoretype JKS -deststoretype PKCS12 -srcalias mfrastreamento -destalias mfrastreamento

# On macOS/Linux
keytool -importkeystore -srckeystore mfrastreamento.keystore -destkeystore mfrastreamento.p12 -srcstoretype JKS -deststoretype PKCS12 -srcalias mfrastreamento -destalias mfrastreamento
```

### Verify Keystore Contents

To verify the contents of a keystore:

```bash
# On Windows
keytool -list -v -keystore mfrastreamento.keystore

# On macOS/Linux
keytool -list -v -keystore mfrastreamento.keystore
```

### Keystore Location

The keystores should be placed in the following location:

```
android/app/keystores/
```

The `setup-keystores` script will automatically copy the keystores to this location if they are found in the project root.

### Configure Keystore in Gradle

After generating the keystore, you need to configure it in your Gradle build. This can be done by adding the following properties to your `android/gradle.properties` file:

```properties
MFRASTREAMENTO_UPLOAD_STORE_FILE=mfrastreamento.keystore
MFRASTREAMENTO_UPLOAD_KEY_ALIAS=mfrastreamento
MFRASTREAMENTO_UPLOAD_STORE_PASSWORD=your-keystore-password
MFRASTREAMENTO_UPLOAD_KEY_PASSWORD=your-key-password
```

Replace `your-keystore-password` and `your-key-password` with the actual passwords you used when creating the keystore.

> **Security Note**: Never commit these passwords to version control. Consider using environment variables or a secure key management system for production builds.

Then, modify the `android/app/build.gradle` file to include the signing configuration:

```gradle
android {
    ...

    signingConfigs {
        debug {
            storeFile file('keystores/debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file('keystores/mfrastreamento.keystore')
            storePassword MFRASTREAMENTO_UPLOAD_STORE_PASSWORD
            keyAlias MFRASTREAMENTO_UPLOAD_KEY_ALIAS
            keyPassword MFRASTREAMENTO_UPLOAD_KEY_PASSWORD
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
            ...
        }
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

The `setup-keystores` script in this project automates most of these steps for you.

### Building Signed APK/AAB for Release

Once you have configured your keystore and signing configuration, you can build a signed APK or Android App Bundle (AAB) for release:

#### Build Signed APK

```bash
# On Windows
cd android
gradlew.bat assembleRelease

# On macOS/Linux
cd android
./gradlew assembleRelease
```

The signed APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### Build Android App Bundle (AAB)

```bash
# On Windows
cd android
gradlew.bat bundleRelease

# On macOS/Linux
cd android
./gradlew bundleRelease
```

The AAB file will be located at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

#### Using npm Scripts

This project includes npm scripts for building release versions:

```bash
# Build a signed APK
npm run build-android-release

# Build a signed AAB
npm run build-android-bundle
```

These scripts will run the configuration process first to ensure all settings are properly applied before building.
