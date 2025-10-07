/**
 * Expo configuration with environment variables support
 */

const path = require('path');
const fs = require('fs');
const { config } = require('dotenv');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
  console.log('Loaded environment variables from .env file');
}

// Load rebrand config
let rebrandConfig = {};
try {
  const rebrandConfigPath = path.resolve(__dirname, 'rebrand-config.json');
  if (fs.existsSync(rebrandConfigPath)) {
    rebrandConfig = JSON.parse(fs.readFileSync(rebrandConfigPath, 'utf8'));
    console.log('Loaded rebrand configuration');
  }
} catch (error) {
  console.warn('Failed to load rebrand-config.json:', error.message);
}

// Get app.json content
const appJson = require('./app.json');

// Export the configuration
module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    ios: {
      bundleIdentifier: process.env.IOS_BUNDLE_ID || "com.wesodev1.mfrastreamento",
      googleServicesFile: "./GoogleService-Info.plist", // 👈 arquivo do Firebase iOS
    },
    android: {
      package: process.env.ANDROID_PACKAGE || "com.wesodev1.mfrastreamento",
      googleServicesFile: "./google-services.json", // 👈 arquivo do Firebase Android
    },
    extra: {
      ...appJson.expo.extra,
      webviewBaseUrl: process.env.WEBVIEW_BASE_URL || rebrandConfig.webviewBaseUrl,
    },
  },
};