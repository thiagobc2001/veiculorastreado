#!/usr/bin/env node

/**
 * Unified Configuration Script
 *
 * This script consolidates all configuration tasks into a single, well-organized process:
 * 1. Environment setup - Loads and validates environment variables
 * 2. Firebase configuration - Sets up Firebase for notifications
 * 3. Keystore setup - Creates and configures keystores for signing
 * 4. Android configuration - Updates Android manifest and resources
 * 5. WebView configuration - Sets up WebView URLs and allowed domains
 * 6. Notification setup - Configures notification channels and icons
 *    - Checks for notification-icon.png in assets/images/
 *    - Creates fallback vector drawable if asset is missing
 *    - Updates app.json configuration accordingly
 * 7. Clean build - Cleans build artifacts for a fresh build
 *
 * Usage:
 *   npm run configure
 *   npm run configure -- --skip-clean
 *   npm run configure -- --skip-prebuild
 *   npm run configure -- --continue-on-error
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const chalk = require('chalk') || { green: (s) => s, red: (s) => s, yellow: (s) => s, blue: (s) => s, cyan: (s) => s };

// Load environment variables
dotenv.config();

// Paths to important files
const paths = {
  root: path.join(__dirname, '..'),
  android: path.join(__dirname, '..', 'android'),
  androidApp: path.join(__dirname, '..', 'android', 'app'),
  androidSrc: path.join(__dirname, '..', 'android', 'app', 'src'),
  androidMain: path.join(__dirname, '..', 'android', 'app', 'src', 'main'),
  androidRes: path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res'),
  androidValues: path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'values'),
  androidManifest: path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
  colorsXml: path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'values', 'colors.xml'),
  firebaseJson: path.join(__dirname, '..', 'firebase.json'),
  googleServices: path.join(__dirname, '..', 'google-services.json'),
  keystoreDir: path.join(__dirname, '..', 'android', 'app', 'keystores'),
  appJson: path.join(__dirname, '..', 'app.json'),
  appConfig: path.join(__dirname, '..', 'app.config.js'),
  rebrandConfig: path.join(__dirname, '..', 'rebrand-config.json'),
  utilsConfig: path.join(__dirname, '..', 'utils', 'config.ts'),
  env: path.join(__dirname, '..', '.env'),
  envExample: path.join(__dirname, '..', '.env.example'),
};

// Load rebrand config
let rebrandConfig = {};
try {
  if (fs.existsSync(paths.rebrandConfig)) {
    rebrandConfig = JSON.parse(fs.readFileSync(paths.rebrandConfig, 'utf8'));
    console.log(chalk.green('✓') + ' Loaded rebrand configuration');
  }
} catch (error) {
  console.warn(chalk.yellow('⚠') + ' Failed to load rebrand-config.json:', error.message);
}

// Configuration values
const config = {
  packageName: rebrandConfig.newPackageName || rebrandConfig.originalPackageName || 'com.wesodev1.mfrastreamento',
  appName: rebrandConfig.newAppName || rebrandConfig.originalAppName || 'MF Rastreamento',
  notificationChannelId: rebrandConfig.notificationChannelId || 'high-priority',
  notificationColor: '@color/blue',
  colorBlue: rebrandConfig.colors?.secondary || '#2196F3',
  headlessTaskTimeout: 30000,
  webviewBaseUrl: rebrandConfig.webviewBaseUrl || process.env.WEBVIEW_BASE_URL || 'https://m.wefleet.com.br/mob/mfrastreadores',
};

// Logger utility
const logger = {
  section: (title) => {
    console.log('\n' + chalk.blue('=== ' + title + ' ==='));
  },
  step: (message) => {
    console.log(chalk.blue('→') + ' ' + message);
  },
  success: (message) => {
    console.log(chalk.green('✓') + ' ' + message);
  },
  warning: (message) => {
    console.log(chalk.yellow('⚠') + ' ' + message);
  },
  error: (message, error) => {
    console.error(chalk.red('✗') + ' ' + message);
    if (error) {
      console.error('  ' + error.message);
    }
  },
  info: (message) => {
    console.log('  ' + message);
  },
};

// File utilities
const fileUtils = {
  exists: (filePath) => {
    return fs.existsSync(filePath);
  },
  ensureDir: (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created directory: ${path.relative(paths.root, dirPath)}`);
      return true;
    }
    return false;
  },
  readFile: (filePath) => {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      logger.error(`Failed to read file: ${path.relative(paths.root, filePath)}`, error);
      return null;
    }
  },
  writeFile: (filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      logger.info(`Updated file: ${path.relative(paths.root, filePath)}`);
      return true;
    } catch (error) {
      logger.error(`Failed to write file: ${path.relative(paths.root, filePath)}`, error);
      return false;
    }
  },
  readJson: (filePath) => {
    const content = fileUtils.readFile(filePath);
    if (!content) return null;

    try {
      return JSON.parse(content);
    } catch (error) {
      logger.error(`Failed to parse JSON: ${path.relative(paths.root, filePath)}`, error);
      return null;
    }
  },
  writeJson: (filePath, data) => {
    try {
      const content = JSON.stringify(data, null, 2);
      return fileUtils.writeFile(filePath, content);
    } catch (error) {
      logger.error(`Failed to stringify JSON: ${path.relative(paths.root, filePath)}`, error);
      return false;
    }
  },
  copyFile: (sourcePath, destPath) => {
    try {
      fs.copyFileSync(sourcePath, destPath);
      logger.info(`Copied file: ${path.relative(paths.root, sourcePath)} → ${path.relative(paths.root, destPath)}`);
      return true;
    } catch (error) {
      logger.error(`Failed to copy file: ${path.relative(paths.root, sourcePath)}`, error);
      return false;
    }
  },
  deleteFile: (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted file: ${path.relative(paths.root, filePath)}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to delete file: ${path.relative(paths.root, filePath)}`, error);
      return false;
    }
  },
};

/**
 * Execute a shell command
 * @param {string} command - The command to execute
 * @param {object} options - Options for child_process.execSync
 * @returns {boolean} - Whether the command was successful
 */
function executeCommand(command, options = {}) {
  const defaultOptions = {
    cwd: paths.root,
    stdio: 'inherit',
    encoding: 'utf8',
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    logger.step(`Executing: ${command}`);

    // For Windows compatibility, use cmd.exe for complex commands with pipes or redirects
    if (process.platform === 'win32' && (command.includes('|') || command.includes('>') || command.includes('<'))) {
      command = `cmd.exe /c "${command}"`;
      logger.info(`Modified command for Windows: ${command}`);
    }

    execSync(command, mergedOptions);
    return true;
  } catch (error) {
    logger.error(`Command failed: ${command}`, error);

    // Log more detailed error information
    if (error.stderr) {
      logger.error(`Error output: ${error.stderr.toString()}`);
    }
    if (error.stdout) {
      logger.info(`Command output: ${error.stdout.toString()}`);
    }

    return false;
  }
}

/**
 * Set up environment variables
 * @returns {boolean} - Whether setup was successful
 */
function setupEnvironment() {
  logger.section('Setting up environment');

  // Check if .env file exists
  if (!fileUtils.exists(paths.env)) {
    logger.warning('.env file not found');

    // Check if .env.example exists
    if (fileUtils.exists(paths.envExample)) {
      logger.info('Creating .env file from .env.example');
      fileUtils.copyFile(paths.envExample, paths.env);
      logger.warning('Please update the .env file with your actual values');
    } else {
      logger.error('.env.example file not found');
      return false;
    }
  }

  // Load environment variables
  const envConfig = dotenv.config({ path: paths.env });
  if (envConfig.error) {
    logger.error('Failed to load environment variables', envConfig.error);
    return false;
  }

  // Check for required environment variables
  const requiredVars = ['ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_PASSWORD'];
  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    logger.warning(`Missing required environment variables: ${missingVars.join(', ')}`);
    logger.info('Please update your .env file with these variables');
  } else {
    logger.success('All required environment variables are set');
  }

  // Validate that WebView base URL is provided
  if (!process.env.WEBVIEW_BASE_URL && !config.webviewBaseUrl) {
    logger.error('WebView base URL is not configured!');
    logger.info('You must set WEBVIEW_BASE_URL in .env file or webviewBaseUrl in rebrand-config.json');

    // Check if .env exists and add a placeholder comment
    if (fileUtils.exists(paths.env)) {
      const envContent = fileUtils.readFile(paths.env) || '';
      if (!envContent.includes('WEBVIEW_BASE_URL=')) {
        const updatedEnvContent = envContent +
          (envContent.endsWith('\n') ? '' : '\n') +
          `\n# WebView Configuration\n# WEBVIEW_BASE_URL=https://your-client-specific-url.com/path\n`;
        fileUtils.writeFile(paths.env, updatedEnvContent);
        logger.info('Added WEBVIEW_BASE_URL placeholder to .env file. Please update it with the correct URL.');
      }
    }

    return false;
  }
  // Update .env with WebView base URL if not present in .env but available in config
  else if (!process.env.WEBVIEW_BASE_URL && config.webviewBaseUrl) {
    logger.info('Adding WEBVIEW_BASE_URL to .env file');
    const envContent = fileUtils.readFile(paths.env) || '';
    if (!envContent.includes('WEBVIEW_BASE_URL=')) {
      const updatedEnvContent = envContent +
        (envContent.endsWith('\n') ? '' : '\n') +
        `\n# WebView Configuration\nWEBVIEW_BASE_URL=${config.webviewBaseUrl}\n`;
      fileUtils.writeFile(paths.env, updatedEnvContent);
    }
  }

  logger.success('Environment setup completed');
  return true;
}

/**
 * Set up keystores for signing
 * @returns {boolean} - Whether setup was successful
 */
function setupKeystores() {
  logger.section('Setting up keystores');

  // Ensure keystore directory exists
  fileUtils.ensureDir(paths.keystoreDir);

  // Check if keystore already exists
  const keystorePath = path.join(paths.keystoreDir, 'mfrastreamento.keystore');
  if (fileUtils.exists(keystorePath)) {
    logger.success('Keystore already exists');
    return true;
  }

  // Check if we have the required environment variables
  if (!process.env.ANDROID_KEYSTORE_PASSWORD || !process.env.ANDROID_KEY_PASSWORD) {
    logger.error('Missing required environment variables for keystore generation');
    logger.info('Please set ANDROID_KEYSTORE_PASSWORD and ANDROID_KEY_PASSWORD in your .env file');
    return false;
  }

  // Generate keystore
  logger.step('Generating keystore');

  // Determine the correct keytool command based on platform
  const keytoolCmd = process.platform === 'win32' ? 'keytool' : 'keytool';

  // Build the keytool command
  const keystoreAlias = rebrandConfig.keystoreAlias || 'mfrastreamento';
  const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
  const keyPassword = process.env.ANDROID_KEY_PASSWORD;

  const keytoolCommand = `${keytoolCmd} -genkeypair -v -keystore "${keystorePath}" -alias ${keystoreAlias} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${keystorePassword} -keypass ${keyPassword} -dname "CN=Android Debug,O=Android,C=US"`;

  // Execute the keytool command
  const success = executeCommand(keytoolCommand, { stdio: 'pipe' });

  if (success) {
    logger.success('Keystore generated successfully');
    return true;
  } else {
    logger.error('Failed to generate keystore');
    return false;
  }
}

/**
 * Set up Firebase configuration
 * @returns {boolean} - Whether setup was successful
 */
function setupFirebase() {
  logger.section('Setting up Firebase configuration');

  // Check if google-services.json exists
  if (!fileUtils.exists(paths.googleServices)) {
    logger.error('google-services.json not found');
    logger.info('Please download google-services.json from Firebase console and place it in the project root');
    return false;
  }

  // Copy google-services.json to android/app if it doesn't exist there
  const androidGoogleServices = path.join(paths.androidApp, 'google-services.json');
  if (!fileUtils.exists(androidGoogleServices) && fileUtils.exists(paths.androidApp)) {
    logger.step('Copying google-services.json to android/app');
    fileUtils.copyFile(paths.googleServices, androidGoogleServices);
  }

  logger.step('Setting up firebase.json configuration');

  // Default Firebase configuration
  const firebaseConfig = {
    "react-native": {
      "messaging_android_notification_channel_id": config.notificationChannelId,
      "messaging_android_notification_color": config.notificationColor,
      "messaging_android_headless_task_timeout": config.headlessTaskTimeout,
      "messaging_ios_auto_register_for_remote_messages": true,
      "messaging_ios_foreground_presentation_options": ["badge", "sound", "list", "banner"],
      "messaging_auto_init_enabled": true,
      "analytics_auto_collection_enabled": true,
      "messaging_android_notification_delegation_enabled": true
    }
  };

  // Read existing configuration if it exists
  let existingConfig = {};
  if (fileUtils.exists(paths.firebaseJson)) {
    existingConfig = fileUtils.readJson(paths.firebaseJson) || {};
    logger.info('Existing firebase.json found');
  }

  // Merge configurations
  const mergedConfig = {
    ...existingConfig,
    "react-native": {
      ...(existingConfig["react-native"] || {}),
      ...firebaseConfig["react-native"]
    }
  };

  // Write the merged configuration
  if (fileUtils.writeJson(paths.firebaseJson, mergedConfig)) {
    logger.success('Firebase configuration updated');
    return true;
  } else {
    return false;
  }
}

/**
 * Configure notifications
 * @returns {boolean} - Whether configuration was successful
 */
function configureNotifications() {
  logger.section('Configuring notifications');

  // Ensure Android resources directory exists
  fileUtils.ensureDir(paths.androidValues);

  // Update colors.xml
  logger.step('Updating colors.xml');
  let colorsContent = '';

  if (fileUtils.exists(paths.colorsXml)) {
    colorsContent = fileUtils.readFile(paths.colorsXml);

    // Check if blue color is already defined
    if (!colorsContent.includes('name="blue"')) {
      logger.info('Adding blue color definition');
      colorsContent = colorsContent.replace(
        '</resources>',
        `  <color name="blue">${config.colorBlue}</color>\n</resources>`
      );
    } else {
      logger.info('Blue color already defined');
    }
  } else {
    // Create colors.xml if it doesn't exist
    logger.info('Creating colors.xml');
    colorsContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="blue">${config.colorBlue}</color>
</resources>`;
  }

  // Write updated colors.xml
  if (fileUtils.writeFile(paths.colorsXml, colorsContent)) {
    logger.success('colors.xml updated');
  } else {
    logger.error('Failed to update colors.xml');
    return false;
  }

  // Create notification icon
  logger.step('Setting up notification icon');

  // Check if notification icon exists in assets
  const notificationIconAsset = path.join(paths.root, 'assets', 'images', 'notification-icon.png');

  if (!fileUtils.exists(notificationIconAsset)) {
    logger.warning('Notification icon not found in assets/images/notification-icon.png');
    logger.info('Creating a fallback notification icon in Android resources');

    // Create notification icon directories
    const drawableDirectories = [
      path.join(paths.androidRes, 'drawable'),
      path.join(paths.androidRes, 'drawable-hdpi'),
      path.join(paths.androidRes, 'drawable-mdpi'),
      path.join(paths.androidRes, 'drawable-xhdpi'),
      path.join(paths.androidRes, 'drawable-xxhdpi'),
      path.join(paths.androidRes, 'drawable-xxxhdpi')
    ];

    // Ensure all drawable directories exist
    drawableDirectories.forEach(dir => fileUtils.ensureDir(dir));

    // Create a simple notification icon XML (vector drawable) as fallback
    const notificationIconXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="?attr/colorOnPrimary">
  <path
      android:fillColor="@android:color/white"
      android:pathData="M18.92,6.01C18.72,5.42 18.16,5 17.5,5h-11C5.84,5 5.28,5.42 5.08,6.01L3,12v8c0,0.55 0.45,1 1,1h1c0.55,0 1,-0.45 1,-1v-1h12v1c0,0.55 0.45,1 1,1h1c0.55,0 1,-0.45 1,-1v-8L18.92,6.01zM6.5,16C5.67,16 5,15.33 5,14.5S5.67,13 6.5,13S8,13.67 8,14.5S7.33,16 6.5,16zM17.5,16c-0.83,0 -1.5,-0.67 -1.5,-1.5s0.67,-1.5 1.5,-1.5s1.5,0.67 1.5,1.5S18.33,16 17.5,16zM5,11l1.5,-4.5h11L19,11H5z"/>
</vector>`;

    // Write the notification icon to the main drawable directory
    const notificationIconPath = path.join(paths.androidRes, 'drawable', 'ic_notification.xml');
    if (fileUtils.writeFile(notificationIconPath, notificationIconXml)) {
      logger.success('Created fallback notification icon: ic_notification.xml');
    } else {
      logger.error('Failed to create fallback notification icon');
      return false;
    }

    // Update app.json to use the fallback icon
    logger.info('Updating app.json to use fallback notification icon');
    const appJsonPath = path.join(paths.root, 'app.json');
    const appJsonContent = fileUtils.readJson(appJsonPath);
    if (appJsonContent && appJsonContent.expo && appJsonContent.expo.android && appJsonContent.expo.android.notification) {
      appJsonContent.expo.android.notification.icon = 'ic_notification';
      if (fileUtils.writeJson(appJsonPath, appJsonContent)) {
        logger.success('Updated app.json to use fallback notification icon');
      }
    }
  } else {
    logger.success('Notification icon found in assets: notification-icon.png');
    logger.info('Expo will automatically handle the notification icon from assets during build');
  }

  logger.success('Notification configuration completed');

  return true;
}

/**
 * Configure WebView
 * @returns {boolean} - Whether configuration was successful
 */
function configureWebView() {
  logger.section('Configuring WebView');

  // Update app.config.js with WebView base URL
  logger.step('Updating app.config.js with WebView base URL');

  if (!fileUtils.exists(paths.appConfig)) {
    logger.warning('app.config.js not found, creating it');

    // Create app.config.js
    const appConfigContent = `/**
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
    // Add extra configuration that can be accessed at runtime
    extra: {
      ...appJson.expo.extra,
      // WebView configuration
      webviewBaseUrl: process.env.WEBVIEW_BASE_URL || rebrandConfig.webviewBaseUrl || '${config.webviewBaseUrl}',
    },
  },
};`;

    fileUtils.writeFile(paths.appConfig, appConfigContent);
  } else {
    logger.info('app.config.js already exists');
  }

  // Update utils/config.ts with WebView base URL
  logger.step('Updating utils/config.ts with WebView base URL');

  if (!fileUtils.exists(paths.utilsConfig)) {
    logger.warning('utils/config.ts not found, creating it');

    // Create utils/config.ts
    const utilsConfigContent = `/**
 * Configuration utility for the app
 * Centralizes configuration values from various sources (rebrand-config.json, .env, etc.)
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Try to import the rebrand config
let rebrandConfig: any = {};
try {
  // Using require to load JSON at build time
  rebrandConfig = require('../rebrand-config.json');
} catch (error) {
  console.warn('Failed to load rebrand-config.json:', error);
}

/**
 * App configuration values
 */
const config = {
  // App information
  appName: rebrandConfig.newAppName || rebrandConfig.originalAppName || '${config.appName}',
  packageName: rebrandConfig.newPackageName || rebrandConfig.originalPackageName || '${config.packageName}',

  // WebView configuration
  webview: {
    // Base URL for the WebView - can be overridden by WEBVIEW_BASE_URL in .env
    baseUrl: Constants.expoConfig?.extra?.webviewBaseUrl ||
             process.env.WEBVIEW_BASE_URL ||
             rebrandConfig.webviewBaseUrl ||
             '${config.webviewBaseUrl}',

    // Allowed domains for WebView navigation
    allowedDomains: ['wefleet.com.br'],
  },

  // Firebase configuration
  firebase: {
    projectId: rebrandConfig.firebaseProjectId || 'mf-rastreamento-9317b',
    notificationChannelId: rebrandConfig.notificationChannelId || '${config.notificationChannelId}',
    notificationChannelName: rebrandConfig.notificationChannelName || 'Notificações Importantes',
  },

  // Colors
  colors: {
    primary: rebrandConfig.colors?.primary || '#023c69',
    secondary: rebrandConfig.colors?.secondary || '${config.colorBlue}',
    background: rebrandConfig.colors?.background || '#232323',
    text: rebrandConfig.colors?.text || '#FFFFFF',
  },
};

export default config;`;

    // Ensure utils directory exists
    fileUtils.ensureDir(path.dirname(paths.utilsConfig));
    fileUtils.writeFile(paths.utilsConfig, utilsConfigContent);
  } else {
    logger.info('utils/config.ts already exists');
  }

  logger.success('WebView configuration completed');
  return true;
}

/**
 * Show environment variable commands for the current platform
 * This function displays commands to set environment variables based on the user's OS
 */
function showEnvironmentCommands() {
  logger.section('Android Signing Environment Variables');

  // Check if .env file exists
  if (!fileUtils.exists(paths.env)) {
    logger.error('.env file not found');
    logger.info('Please create a .env file based on .env.example');
    return false;
  }

  // Read .env file
  const envContent = fileUtils.readFile(paths.env);
  if (!envContent) {
    logger.error('Failed to read .env file');
    return false;
  }

  // Parse environment variables
  const envVars = {};
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) {
      return;
    }

    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });

  // Check if required variables are present
  const requiredVars = ['ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_PASSWORD'];
  const missingVars = requiredVars.filter(v => !envVars[v]);

  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    logger.info('Please update your .env file with these variables');
    return false;
  }

  // Determine platform and output appropriate commands
  const isWindows = process.platform === 'win32';
  const isPowerShell = isWindows && process.env.SHELL && process.env.SHELL.toLowerCase().includes('powershell');

  console.log('Copy and paste these commands to set environment variables:');
  console.log('');

  if (isWindows) {
    if (isPowerShell) {
      // PowerShell commands
      console.log(chalk.cyan('# PowerShell commands:'));
      Object.entries(envVars).forEach(([key, value]) => {
        console.log(`$env:${key}="${value}"`);
      });
    } else {
      // Command Prompt commands
      console.log(chalk.cyan('# Command Prompt commands:'));
      Object.entries(envVars).forEach(([key, value]) => {
        console.log(`set ${key}=${value}`);
      });
    }
  } else {
    // Bash/Shell commands
    console.log(chalk.cyan('# Bash/Shell commands:'));
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`export ${key}="${value}"`);
    });
  }

  console.log('');
  console.log('After setting these variables, you can build your app with:');
  console.log(chalk.green('npm run build'));

  return true;
}

/**
 * Clean build artifacts
 * @returns {boolean} - Whether cleaning was successful
 */
function cleanBuild() {
  logger.section('Cleaning build artifacts');

  // Clean commands based on platform
  const cleanCommands = [];

  if (process.platform === 'win32') {
    // Windows commands
    // Use rm -rf .expo instead of expo-doctor clean
    cleanCommands.push('npx rimraf .expo');

    // Alternative: Remove node_modules/.cache directory
    if (fileUtils.exists(path.join(paths.root, 'node_modules', '.cache'))) {
      logger.info('Cleaning node_modules/.cache directory');
      try {
        // Try to use fs.rmSync first (Node.js 14+)
        if (fs.rmSync) {
          fs.rmSync(path.join(paths.root, 'node_modules', '.cache'), { recursive: true, force: true });
          logger.success('Cleaned node_modules/.cache directory using fs.rmSync');
        } else {
          // Fall back to rimraf if available
          try {
            const rimraf = require('rimraf');
            rimraf.sync(path.join(paths.root, 'node_modules', '.cache'));
            logger.success('Cleaned node_modules/.cache directory using rimraf');
          } catch (rimrafError) {
            // If rimraf is not available, use a simple recursive delete function
            logger.info('rimraf not available, using manual directory deletion');
            const deleteFolderRecursive = function(folderPath) {
              if (fs.existsSync(folderPath)) {
                fs.readdirSync(folderPath).forEach((file) => {
                  const curPath = path.join(folderPath, file);
                  if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolderRecursive(curPath);
                  } else {
                    fs.unlinkSync(curPath);
                  }
                });
                fs.rmdirSync(folderPath);
              }
            };
            deleteFolderRecursive(path.join(paths.root, 'node_modules', '.cache'));
            logger.success('Cleaned node_modules/.cache directory manually');
          }
        }
      } catch (error) {
        logger.warning('Failed to clean node_modules/.cache directory:', error);
      }
    }

    if (fileUtils.exists(path.join(paths.android, 'gradlew.bat'))) {
      cleanCommands.push('cd android && gradlew.bat clean');
    }
  } else {
    // Unix commands
    // Use rm -rf .expo instead of expo-doctor clean
    cleanCommands.push('npx rimraf .expo');

    // Alternative: Remove node_modules/.cache directory
    if (fileUtils.exists(path.join(paths.root, 'node_modules', '.cache'))) {
      logger.info('Cleaning node_modules/.cache directory');
      try {
        // Try to use fs.rmSync first (Node.js 14+)
        if (fs.rmSync) {
          fs.rmSync(path.join(paths.root, 'node_modules', '.cache'), { recursive: true, force: true });
          logger.success('Cleaned node_modules/.cache directory using fs.rmSync');
        } else {
          // Fall back to rimraf if available
          try {
            const rimraf = require('rimraf');
            rimraf.sync(path.join(paths.root, 'node_modules', '.cache'));
            logger.success('Cleaned node_modules/.cache directory using rimraf');
          } catch (rimrafError) {
            // If rimraf is not available, use a simple recursive delete function
            logger.info('rimraf not available, using manual directory deletion');
            const deleteFolderRecursive = function(folderPath) {
              if (fs.existsSync(folderPath)) {
                fs.readdirSync(folderPath).forEach((file) => {
                  const curPath = path.join(folderPath, file);
                  if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolderRecursive(curPath);
                  } else {
                    fs.unlinkSync(curPath);
                  }
                });
                fs.rmdirSync(folderPath);
              }
            };
            deleteFolderRecursive(path.join(paths.root, 'node_modules', '.cache'));
            logger.success('Cleaned node_modules/.cache directory manually');
          }
        }
      } catch (error) {
        logger.warning('Failed to clean node_modules/.cache directory:', error);
      }
    }

    if (fileUtils.exists(path.join(paths.android, 'gradlew'))) {
      cleanCommands.push('cd android && ./gradlew clean');
    }
  }

  // Execute clean commands
  let success = true;
  for (const command of cleanCommands) {
    success = executeCommand(command) && success;
  }

  if (success) {
    logger.success('Build artifacts cleaned');
  } else {
    logger.warning('Some clean commands failed');
  }

  return success;
}

/**
 * Run prebuild to generate native projects
 * @returns {boolean} - Whether prebuild was successful
 */
function runPrebuild() {
  logger.section('Running prebuild');

  // Run prebuild command
  const success = executeCommand('npx expo prebuild --clean');

  if (success) {
    logger.success('Prebuild completed successfully');
  } else {
    logger.error('Prebuild failed');
  }

  return success;
}

/**
 * Main configuration function
 */
async function configureProject() {
  console.log(chalk.blue('\n=== MF RASTREAMENTO CONFIGURATION ===\n'));

  // Track results of each step
  const results = {
    environment: false,
    prebuild: false,
    keystores: false,
    firebase: false,
    notifications: false,
    webview: false,
    clean: false,
  };

  // Get command line arguments
  const args = process.argv.slice(2);
  const skipPrebuild = args.includes('--skip-prebuild');
  const skipClean = args.includes('--skip-clean');
  const showEnvCommands = args.includes('--show-env-commands');
  const continueOnError = args.includes('--continue-on-error') || true; // Default to true

  // If --show-env-commands flag is present, just show environment variable commands and exit
  if (showEnvCommands) {
    showEnvironmentCommands();
    return true;
  }

  // 1. Set up environment
  results.environment = setupEnvironment();
  if (!results.environment && !continueOnError) {
    logger.error('Environment setup failed. Stopping configuration.');
    return false;
  }

  // 2. Set up WebView configuration
  results.webview = configureWebView();
  if (!results.webview && !continueOnError) {
    logger.error('WebView configuration failed. Stopping configuration.');
    return false;
  }

  // 3. Run prebuild if not skipped
  if (!skipPrebuild) {
    results.prebuild = runPrebuild();
    if (!results.prebuild && !continueOnError) {
      logger.error('Prebuild failed. Stopping configuration.');
      return false;
    }
  } else {
    logger.info('Skipping prebuild step');
    results.prebuild = true;
  }

  // 4. Set up keystores
  results.keystores = setupKeystores();
  if (!results.keystores && !continueOnError) {
    logger.error('Keystore setup failed. Stopping configuration.');
    return false;
  }

  // 5. Set up Firebase
  results.firebase = setupFirebase();
  if (!results.firebase && !continueOnError) {
    logger.error('Firebase setup failed. Stopping configuration.');
    return false;
  }

  // 6. Configure notifications
  results.notifications = configureNotifications();
  if (!results.notifications && !continueOnError) {
    logger.error('Notification configuration failed. Stopping configuration.');
    return false;
  }

  // 7. Clean build artifacts if not skipped
  if (!skipClean) {
    results.clean = cleanBuild();
  } else {
    logger.info('Skipping clean step');
    results.clean = true;
  }

  // Print configuration summary
  console.log(chalk.blue('\nCONFIGURATION SUMMARY'));
  console.log(chalk.blue('=============================='));
  Object.entries(results).forEach(([key, value]) => {
    const status = value ? chalk.green('✓') : chalk.red('✗');
    const statusText = value ? 'SUCCESS' : 'FAILED';
    console.log(`${status} ${key.padEnd(12)} ${statusText}`);
  });

  // Check if all steps were successful
  const allSuccessful = Object.values(results).every(result => result === true);

  if (allSuccessful) {
    console.log(chalk.green('\n CONFIGURATION COMPLETED SUCCESSFULLY \n'));
  } else {
    console.log(chalk.yellow('\n CONFIGURATION COMPLETED WITH WARNINGS \n'));
    console.log('Some steps failed but the configuration process continued.');
    console.log('Review the logs above for details on the failed steps.');
    console.log('\nYou can still try to build and run your app, but it may not work correctly.');
  }

  return allSuccessful;
}

// Run the configuration process
configureProject().catch(error => {
  console.error(chalk.red('Configuration failed with an error:'), error);
  process.exit(1);
});
