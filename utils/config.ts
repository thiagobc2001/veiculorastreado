/**
 * Configuration utility for the app
 * Centralizes configuration values from various sources (rebrand-config.json, .env, etc.)
 */

import Constants from 'expo-constants';

/**
 * App configuration values
 */
const config = {
  // App information
  appName: "MF Rastreamento",
  packageName: "com.wesodev1.mfrastreamento",

  // WebView configuration
  webview: {
    // Base URL for the WebView - MUST be provided in rebrand-config.json or .env
    get baseUrl() {
      const url = Constants.expoConfig?.extra?.webviewBaseUrl ||
                  process.env.WEBVIEW_BASE_URL ||
                  "https://m.wefleet.com.br/mob/mfrastreadores";

      if (!url) {
        // Log error and throw exception during development
        const error = 'WebView baseUrl is not configured! Set WEBVIEW_BASE_URL in .env or webviewBaseUrl in rebrand-config.json';
        console.error(error);
        if (__DEV__) {
          throw new Error(error);
        }
        // Return a placeholder in production to avoid crashes, but the app won't work properly
        return 'https://error-no-url-configured';
      }

      return url;
    },

    // Allowed domains for WebView navigation - derived from baseUrl
    get allowedDomains() {
      try {
        // Extract domain from baseUrl
        const url = this.baseUrl;
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const domain = hostname.split('.').slice(-2).join('.');

        // Create an array of allowed domains
        const domains = [domain]; // Base domain (e.g., wefleet.com.br)

        // Add specific subdomains that are known to be used
        if (hostname.includes('wefleet.com.br')) {
          // Add both m and m2 subdomains for wefleet.com.br
          domains.push('m.wefleet.com.br');
          domains.push('m2.wefleet.com.br');
        }

        console.log('WebView allowed domains:', domains);
        return domains;
      } catch (e) {
        console.error('Failed to parse domain from baseUrl:', e);
        return ['wefleet.com.br']; // Fallback to a default domain
      }
    },
  },

  // Firebase configuration
  firebase: {
    projectId: "mf-rastreamento-9317b",
    notificationChannelId: "high-priority",
    notificationChannelName: "Notificações Importantes",
  },

  // Colors
  colors: {
    primary: "#00789B",
    secondary: "#2196F3",
    background: "#232323",
    text: "#FFFFFF",
  },
};

export default config;
