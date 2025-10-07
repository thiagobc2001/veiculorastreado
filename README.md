# MF Rastreamento App

A React Native app built with Expo that displays a WebView and handles push notifications.

## Features

- WebView integration with FCM token passing
- Firebase Cloud Messaging (FCM) for push notifications
- Configurable WebView URL through environment variables
- Simplified build and configuration process

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Android Studio (for Android development)
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file to set your WebView URL and keystore passwords:
   ```
   WEBVIEW_BASE_URL=https://your-client-specific-url.com/path
   ANDROID_KEYSTORE_PASSWORD=your_keystore_password
   ANDROID_KEY_PASSWORD=your_key_password
   ```

## Available Scripts

### Configuration and Building

- `npm run configure` - Run the unified configuration script
- `npm run build` - Configure and build a release APK
- `npm run bundle` - Configure and build a release AAB (Android App Bundle)

### Development

- `npm run start` - Start the Expo development server
- `npm run run` - Configure and run on an Android device/emulator
- `npm run run-quick` - Run on an Android device/emulator without configuration (faster)

### Utilities

- `npm run env` - Display commands to set environment variables for your OS
- `npm run rebrand` - Run the rebranding script to customize the app for a new client

## Configuration

The app uses a unified configuration approach with these sources (in order of priority):

1. Environment variables (`.env` file)
2. Rebrand configuration (`rebrand-config.json`)
3. Default values

### WebView URL Configuration

The WebView URL **must** be configured in one of these ways:

1. Set `WEBVIEW_BASE_URL` in your `.env` file
2. Set `webviewBaseUrl` in `rebrand-config.json`

If not configured, the app will display an error message.

## Rebranding

To rebrand the app for a different client:

1. Edit `rebrand-config.json` with the new client's information
2. Run the rebranding script:
   ```bash
   npm run rebrand
   ```
3. Configure and build the app:
   ```bash
   npm run configure
   npm run build
   ```

## Troubleshooting

### Common Issues

- **Configuration errors**: Make sure your `.env` file contains the required variables
- **Build failures**: Run `npm run configure` to ensure all files are properly set up
- **WebView not loading**: Check that `WEBVIEW_BASE_URL` is correctly set in your `.env` file

### Getting Help

If you encounter issues, check the logs for detailed error messages. Most configuration issues can be resolved by running the unified configuration script:

```bash
npm run configure
```
