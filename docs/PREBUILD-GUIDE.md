# Android Prebuild Guide

This guide explains how to manage Android prebuild and keystore files in this project using the unified configuration script.

## What the Unified Configuration Script Does

The unified configuration script (`scripts/unified-config.js`) handles several important tasks:

1. **Environment Setup**:
   - Loads and validates environment variables from `.env`
   - Ensures all required variables are set

2. **Keystore Management**:
   - Creates and configures keystores for signing
   - Sets up the proper directory structure
   - Backs up and restores keystore files when needed

3. **Firebase Configuration**:
   - Sets up Firebase for notifications
   - Configures notification channels and colors

4. **WebView Configuration**:
   - Sets up WebView URLs and allowed domains
   - Validates that required configuration is present

5. **Prebuild Process**:
   - Runs Expo prebuild when needed
   - Cleans build artifacts for a fresh build

## Available Commands

### `npm run configure`

This is the main command that runs the complete configuration process. It handles all the steps mentioned above in a single, organized process.

### `npm run build`

Configures the project and builds a release APK. This is equivalent to:

```bash
npm run configure -- --skip-prebuild && cd android && gradlew.bat assembleRelease
```

### `npm run run`

Configures the project and runs it on an Android device/emulator. This is equivalent to:

```bash
npm run configure -- --skip-prebuild && npx expo run:android
```

### `npm run run-quick`

Runs the app on an Android device/emulator without configuration. This is the fastest option for development when you don't need to update configuration.

### `npm run env`

Displays commands to set environment variables for your operating system. Use this before building a signed APK to set up the required environment variables.

## Typical Workflow

### First-time setup

If you're setting up the project for the first time:

```bash
# Generate the Android project
npx expo prebuild --platform android

# Set up the keystores directory
npm run setup-keystores
```

### Updating the Android project

When you need to update the Android project (e.g., after changing app.json):

```bash
# Run the complete prebuild process
npm run prebuild-android
```

### After pulling changes from version control

If you've pulled changes that include updates to the Android configuration:

```bash
# Run the complete prebuild process
npm run prebuild-android
```

## Environment Variables for Signing

The build.gradle configuration uses environment variables for keystore passwords. Before building a signed APK, you need to set these variables.

### Using the set-env Script

1. Create a `.env` file based on `.env.example` with your actual passwords:
   ```
   ANDROID_KEYSTORE_PASSWORD=your_actual_password
   ANDROID_KEY_PASSWORD=your_actual_password
   ```

2. Run the set-env script:
   ```bash
   npm run set-env
   ```

3. Copy and paste the commands output by the script to set the environment variables.

### Manual Setup

Alternatively, you can set the environment variables manually:

```bash
# For Windows (Command Prompt)
set ANDROID_KEYSTORE_PASSWORD=your_keystore_password
set ANDROID_KEY_PASSWORD=your_key_password

# For Windows (PowerShell)
$env:ANDROID_KEYSTORE_PASSWORD="your_keystore_password"
$env:ANDROID_KEY_PASSWORD="your_key_password"

# For macOS/Linux
export ANDROID_KEYSTORE_PASSWORD=your_keystore_password
export ANDROID_KEY_PASSWORD=your_key_password
```

Replace `your_keystore_password` and `your_key_password` with your actual passwords.

## Important Notes

1. **Keystore Backup**: Your keystore files are automatically backed up to `backup/keystores/` when running `prebuild-android`.

2. **Version Control**: The `backup/keystores/` directory should be added to your `.gitignore` file to prevent committing sensitive keystore files.

3. **Manual Backup**: It's recommended to keep a separate backup of your keystore files in a secure location outside of the project directory.

4. **Environment Variables**: For security, set the environment variables only when needed and avoid storing them in scripts that might be committed to version control.

5. **Troubleshooting**: If you encounter issues with the scripts, you can run each step manually:
   ```bash
   # Backup keystores
   npm run backup-keystores

   # Remove Android directory
   rm -rf android

   # Run prebuild
   npx expo prebuild --platform android

   # Restore keystores
   npm run setup-keystores
   ```
