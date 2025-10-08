const path = require('path');
const fs = require('fs');
const { config } = require('dotenv');
const withForceModularHeaders = require('./with-force-modular-headers'); // <-- Importa o plugin personalizado

// Carrega variáveis de ambiente, se houver .env
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
  console.log('Loaded environment variables from .env file');
}

// Tenta carregar rebrand config (se usar)
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

// app.json base
const appJson = require('./app.json');

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: process.env.IOS_BUNDLE_ID || "com.vrveiculorastreado.app",
      googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      ...appJson.expo.android,
      package: process.env.ANDROID_PACKAGE || "com.vrveiculorastreado.app",
      googleServicesFile: "./google-services.json",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#232323"
        }
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          ios: {
            useModularHeaders: true
          }
        }
      ],
      withForceModularHeaders, // <-- Aqui o plugin custom pra modular headers!
    ],
    extra: {
      ...appJson.expo.extra,
      webviewBaseUrl: process.env.WEBVIEW_BASE_URL || rebrandConfig.webviewBaseUrl
    }
  }
};
