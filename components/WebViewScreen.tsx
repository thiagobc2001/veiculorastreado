import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Alert,
  TouchableOpacity,
  Text,
  RefreshControl,
  ScrollView,
  Linking,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getFCMToken, onTokenRefresh } from '../utils/messaging';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../utils/toast';
import config from '../utils/config';

// Keep the splash screen visible until explicitly hidden
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

interface WebViewScreenProps {
  baseUrl?: string;
}

// This WebView is restricted to only load URLs from the allowed domains (wefleet.com.br)

/**
 * Opens WhatsApp with the given phone number and message
 * @param params - Object containing phone number and optional message
 */
const openWhatsApp = (params: { phone: string; message?: string }) => {
  try {
    const { phone, message = '' } = params;
    // Format phone number (remove non-numeric characters)
    const formattedPhone = phone.replace(/\D/g, '');

    // Create WhatsApp URL
    const whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

    // Open WhatsApp
    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // WhatsApp is not installed, try web version
          const webWhatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
          return Linking.openURL(webWhatsappUrl);
        }
      })
      .catch(error => {
        console.error('Error opening WhatsApp:', error);
        showToast('Could not open WhatsApp. Please make sure it is installed.');
      });
  } catch (error) {
    console.error('Error in openWhatsApp:', error);
    showToast('Failed to open WhatsApp');
  }
};

/**
 * Opens Waze navigation to a specific location
 * @param params - Object containing location coordinates and optional location name
 */
const openWaze = (params: { lat: string | number; lng: string | number; name?: string }) => {
  try {
    const { lat, lng, name = '' } = params;

    // Create Waze URL with coordinates and optional name
    let wazeUrl = `waze://?ll=${lat},${lng}`;

    // Add location name if provided
    if (name) {
      wazeUrl += `&navigate=yes&z=10&q=${encodeURIComponent(name)}`;
    } else {
      wazeUrl += '&navigate=yes';
    }

    // Try to open Waze app
    Linking.canOpenURL(wazeUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(wazeUrl);
        } else {
          // Waze is not installed, open in browser instead
          const webWazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes${name ? '&q=' + encodeURIComponent(name) : ''}`;
          showToast('Waze app not installed, opening in browser');
          return Linking.openURL(webWazeUrl);
        }
      })
      .catch(error => {
        console.error('Error opening Waze:', error);
        showToast('Could not open Waze. Please make sure it is installed.');
      });
  } catch (error) {
    console.error('Error in openWaze:', error);
    showToast('Failed to open Waze');
  }
};

/**
 * Opens a social media app or website
 * @param params - Object containing social media type and optional username/url
 */
const openSocial = (params: { type: string; username?: string; url?: string }) => {
  try {
    const { type, username, url } = params;
    let socialUrl = '';

    // Determine URL based on social media type
    switch (type.toLowerCase()) {
      case 'facebook':
        socialUrl = username
          ? `fb://profile/${username}`
          : url || 'https://www.facebook.com';
        break;
      case 'instagram':
        socialUrl = username
          ? `instagram://user?username=${username}`
          : url || 'https://www.instagram.com';
        break;
      case 'twitter':
      case 'x':
        socialUrl = username
          ? `twitter://user?screen_name=${username}`
          : url || 'https://twitter.com';
        break;
      case 'linkedin':
        socialUrl = url || 'https://www.linkedin.com';
        break;
      case 'youtube':
        socialUrl = url || 'https://www.youtube.com';
        break;
      default:
        // If type is not recognized, use the URL directly
        socialUrl = url || '';
        break;
    }

    if (!socialUrl) {
      showToast('Invalid social media parameters');
      return;
    }

    // Try to open the app first, fall back to web URL
    Linking.canOpenURL(socialUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(socialUrl);
        } else {
          // App is not installed or URL scheme is not supported
          // Fall back to web URL
          const webUrl = url ||
            (type.toLowerCase() === 'facebook' && username) ? `https://www.facebook.com/${username}` :
            (type.toLowerCase() === 'instagram' && username) ? `https://www.instagram.com/${username}` :
            (type.toLowerCase() === 'twitter' && username) ? `https://twitter.com/${username}` :
            (type.toLowerCase() === 'x' && username) ? `https://x.com/${username}` :
            `https://www.${type.toLowerCase()}.com`;

          return Linking.openURL(webUrl);
        }
      })
      .catch(error => {
        console.error(`Error opening ${type}:`, error);
        showToast(`Could not open ${type}`);
      });
  } catch (error) {
    console.error('Error in openSocial:', error);
    showToast('Failed to open social media');
  }
};

// JavaScript to inject into the WebView for communication
const INJECTED_JAVASCRIPT = `
(function() {
  // Function to send messages to React Native
  window.sendToReactNative = function(data) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  };

  // Create a global app interface for the website to use
  window.MobileApp = {
    // Open WhatsApp with the given phone number and message
    openWhatsApp: function(phone, message = '') {
      window.sendToReactNative({
        type: 'appEvent',
        data: {
          action: 'openWhatsApp',
          params: { phone, message }
        }
      });
    },

    // Open a social media app or website
    openSocial: function(type, username = '', url = '') {
      window.sendToReactNative({
        type: 'appEvent',
        data: {
          action: 'openSocial',
          params: { type, username, url }
        }
      });
    },

    // Open Waze navigation to a location
    openWaze: function(lat, lng, name = '') {
      window.sendToReactNative({
        type: 'appEvent',
        data: {
          action: 'openWaze',
          params: { lat, lng, name }
        }
      });
    }
  };

  // Listen for app-specific events
  document.addEventListener('appEvent', function(e) {
    window.sendToReactNative({
      type: 'appEvent',
      data: e.detail
    });
  });

  // Disable zooming by adding/updating viewport meta tag
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    // If viewport meta doesn't exist, create one
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.head.appendChild(viewportMeta);
  }
  // Set viewport properties to disable zooming
  viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

  // Add CSS to prevent zooming
  try {
    const style = document.createElement('style');
    style.textContent = 'html, body { touch-action: pan-x pan-y; }';
    document.head.appendChild(style);
  } catch(e) {
    console.error('Failed to add zoom prevention CSS:', e);
  }

  // Notify React Native that JS is initialized
  window.sendToReactNative({
    type: 'initialized',
    userAgent: navigator.userAgent
  });

  // Override window.open to handle external links
  const originalOpen = window.open;
  window.open = function(url, target, features) {
    window.sendToReactNative({
      type: 'windowOpen',
      url: url
    });
    return originalOpen.call(this, url, target, features);
  };

  // Add a message to the console to help developers
  console.log('MobileApp interface is ready. You can use MobileApp.openWhatsApp() and MobileApp.openSocial() to interact with native features.');

  true; // Note: this is needed for the injected script to work
})();
`;

export default function WebViewScreen({ baseUrl = config.webview.baseUrl }: WebViewScreenProps) {
  // Define allowed domains for navigation from config
  const allowedDomains = config.webview.allowedDomains;
  // State for loading and URL
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenRetryCount, setTokenRetryCount] = useState(0);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [webViewLoading, setWebViewLoading] = useState(true);

  // WebView state
  const webViewRef = useRef<WebView>(null);
  const [webViewCanGoBack, setWebViewCanGoBack] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0); // Used to force WebView refresh

  // Scroll state for pull-to-refresh
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollY, setScrollY] = useState(0);

  // Max number of token retrieval retries
  const MAX_TOKEN_RETRIES = 3;

  // Function to get FCM token with retry mechanism
  const getTokenWithRetry = useCallback(async (forceRequest: boolean = true): Promise<string | null> => {
    try {
      console.log(`WebViewScreen: Getting FCM token (attempt ${tokenRetryCount + 1}/${MAX_TOKEN_RETRIES})...`);
      const token = await getFCMToken(forceRequest);

      if (token) {
        console.log('WebViewScreen: FCM token obtained successfully');
        setError(null);
        setFcmToken(token);
        return token;
      } else {
        throw new Error('Token retrieval returned null');
      }
    } catch (error) {
      console.error('WebViewScreen: Error getting FCM token:', error);

      // If we haven't exceeded max retries, increment counter for next attempt
      if (tokenRetryCount < MAX_TOKEN_RETRIES - 1) {
        setTokenRetryCount(prev => prev + 1);
        setError(`Error getting FCM token. Retrying... (${tokenRetryCount + 1}/${MAX_TOKEN_RETRIES})`);

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getTokenWithRetry(forceRequest);
      } else {
        // Max retries exceeded
        setError('Failed to get FCM token after multiple attempts. Some features may not work properly.');
        return null;
      }
    }
  }, [tokenRetryCount, MAX_TOKEN_RETRIES]);

  // Function to construct URL with token
  const constructUrl = useCallback((token: string | null): string => {
    if (token) {
      return `${baseUrl}?device=${token}`;
    }
    return baseUrl;
  }, [baseUrl]);

  // Function to initialize the WebView
  const initWebView = useCallback(async () => {
    try {
      setLoading(true);

      // Validate that we have a base URL
      if (!baseUrl || baseUrl === 'https://error-no-url-configured') {
        throw new Error('WebView base URL is not configured. Please set WEBVIEW_BASE_URL in .env or webviewBaseUrl in rebrand-config.json');
      }

      // Try to get the token with retry mechanism
      const token = await getTokenWithRetry();

      // Construct and set the URL
      const fullUrl = constructUrl(token);
      setUrl(fullUrl);

      // Show refresh button if we couldn't get a token
      setShowRefreshButton(!token);

    } catch (error) {
      console.error('WebViewScreen: Error initializing WebView:', error);

      // Special handling for missing URL configuration
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('WebView base URL is not configured')) {
        setError('App configuration error: WebView URL is not set. Please contact support.');
        setUrl(null); // Don't set any URL
      } else {
        setError('Failed to initialize. Please check your connection and try again.');
        if (baseUrl && baseUrl !== 'https://error-no-url-configured') {
          setUrl(baseUrl); // Fallback to base URL without token only if it's valid
        } else {
          setUrl(null);
        }
      }

      setShowRefreshButton(true);
    } finally {
      // Hide the splash screen once we have the URL
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('WebViewScreen: Error hiding splash screen:', e);
      }
      setLoading(false);
    }
  }, [baseUrl, getTokenWithRetry, constructUrl]);

  // Initialize WebView on component mount
  useEffect(() => {
    initWebView();

    // Set up token refresh listener
    const unsubscribe = onTokenRefresh((newToken) => {
      console.log('WebViewScreen: FCM token refreshed');
      setFcmToken(newToken);

      // Update the URL with the new token
      const newUrl = constructUrl(newToken);
      setUrl(newUrl);

      // Optionally reload the WebView with the new token
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    });

    // Handle back button press for WebView navigation
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewCanGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // Prevent default behavior (exit app)
      }
      return false; // Let the default behavior happen (exit app)
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [baseUrl, initWebView, constructUrl]);

  // Handle WebView navigation state changes
  const handleNavigationStateChange = (navState: any) => {
    setWebViewCanGoBack(navState.canGoBack);

    // Update WebView loading state
    setWebViewLoading(navState.loading);

    // Log all navigation for debugging
    console.log('WebViewScreen: Navigation to URL:', navState.url);
    console.log('WebViewScreen: Navigation state:', {
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward,
      loading: navState.loading,
      title: navState.title
    });

    // Check if the URL is from an allowed domain
    try {
      // Parse the URL to get the hostname
      const urlObj = new URL(navState.url);
      const hostname = urlObj.hostname;

      // Log the hostname and allowed domains for debugging
      console.log('WebViewScreen: URL hostname:', hostname);
      console.log('WebViewScreen: Allowed domains:', allowedDomains);

      // Check if the hostname is in the allowed domains list
      const isAllowedUrl = allowedDomains.some(domain => {
        // If domain is a full hostname (contains dots), match exactly
        if (domain.includes('.')) {
          return hostname === domain || hostname.endsWith('.' + domain);
        }
        // Otherwise, check if hostname contains the domain
        return hostname.includes(domain);
      });

      if (!isAllowedUrl) {
        console.log('WebViewScreen: BLOCKED navigation to external URL:', navState.url);

        // Prevent WebView from loading the URL
        webViewRef.current?.stopLoading();

        // Show a message to the user
        showToast('Navigation to external URLs is not allowed');

        // Go back to previous page in WebView or reload the base URL
        if (webViewCanGoBack && webViewRef.current) {
          console.log('WebViewScreen: Going back to previous page');
          webViewRef.current.goBack();
        } else {
          // If can't go back, reload the base URL with token
          const currentUrl = constructUrl(fcmToken);
          console.log('WebViewScreen: Redirecting to base URL:', currentUrl);
          // Use injectJavaScript to navigate back to the base URL
          webViewRef.current?.injectJavaScript(`window.location.href = '${currentUrl}';`);
        }
      } else {
        console.log('WebViewScreen: Navigation allowed to:', navState.url);
      }
    } catch (error) {
      // If there's an error parsing the URL, log it and allow the navigation
      console.error('WebViewScreen: Error checking URL:', error);
      // We'll allow the navigation to continue in case of an error
    }
  };

  // We don't allow opening external URLs in this app

  // Handle WebView refresh
  const refreshWebView = useCallback(async () => {
    setRefreshing(true);
    setWebViewLoading(true);

    try {
      // Check if we need to get a new token
      if (!fcmToken) {
        const newToken = await getTokenWithRetry();
        if (newToken) {
          const newUrl = constructUrl(newToken);
          setUrl(newUrl);
        }
      }

      // Force WebView to reload by changing its key
      setWebViewKey(prevKey => prevKey + 1);

      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    } catch (error) {
      console.error('WebViewScreen: Error refreshing WebView:', error);
      setError('Failed to refresh. Please try again.');
      setWebViewLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [fcmToken, getTokenWithRetry, constructUrl]);

  // Handle messages from WebView JavaScript
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebViewScreen: Received message from WebView:', data);

      switch (data.type) {
        case 'initialized':
          console.log('WebViewScreen: WebView JS initialized');
          break;

        case 'windowOpen':
          // Block window.open calls from WebView
          console.log('WebViewScreen: Blocked window.open call to:', data.url);
          showToast('Navigation to external URLs is not allowed');
          break;

        case 'appEvent':
          // Handle custom app events
          console.log('WebViewScreen: Received app event:', data.data);

          // Handle specific app events
          console.log('WebViewScreen: ACTION:', data.data.action);
          if (data.data && data.data.action) {
            switch (data.data.action) {
              case 'openWhatsApp':
                console.log('WebViewScreen: Opening WhatsApp with params:', data.data.params);
                openWhatsApp(data.data.params);
                break;

              case 'openSocial':
                console.log('WebViewScreen: Opening social media with params:', data.data.params);
                openSocial(data.data.params);
                break;

              case 'openWaze':
                console.log('WebViewScreen: Opening Waze with params:', data.data.params);
                openWaze(data.data.params);
                break;

              default:
                console.log('WebViewScreen: Unknown app action:', data.data.action);
            }
          }
          break;

        default:
          console.log('WebViewScreen: Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('WebViewScreen: Error handling WebView message:', error);
    }
  };

  // Show loading indicator while initializing
  if (loading || !url) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // Render error screen if there's an error and no URL
  if (error && !url) {
    const isConfigError = error.includes('App configuration error');

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>
          {isConfigError ? 'Configuration Error' : 'Connection Error'}
        </Text>
        <Text style={styles.errorText}>{error}</Text>

        {isConfigError ? (
          // For configuration errors, show a more helpful message
          <View style={styles.configErrorContainer}>
            <Text style={styles.configErrorText}>
              This error occurs when the app is not properly configured.
            </Text>
            <Text style={styles.configErrorText}>
              Please contact the app administrator to resolve this issue.
            </Text>
          </View>
        ) : (
          // For connection errors, show a retry button
          <TouchableOpacity style={styles.refreshButton} onPress={refreshWebView}>
            <Text style={styles.refreshButtonText}>Tente Novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pull-to-refresh implementation */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={scrollY < 0}
        onScroll={(e) => {
          setScrollY(e.nativeEvent.contentOffset.y);
          if (e.nativeEvent.contentOffset.y < -100 && !refreshing) {
            refreshWebView();
          }
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshWebView}
            colors={['#2196F3']}
            progressBackgroundColor="#fff"
          />
        }
      >
        {/* WebView */}
        <View style={styles.webviewContainer}>
          <WebView
            key={webViewKey} // Force re-render on refresh
            ref={webViewRef}
            source={{ uri: url }}
            style={styles.webview}
            onNavigationStateChange={handleNavigationStateChange}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#2196F3" />
              </View>
            )}
            onLoadStart={() => {
              console.log('WebViewScreen: WebView started loading');
              setWebViewLoading(true);
            }}
            onLoadEnd={() => {
              console.log('WebViewScreen: WebView finished loading');
              setWebViewLoading(false);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              setError('Failed to load the page. Please check your connection and try again.');
              setShowRefreshButton(true);
              setWebViewLoading(false);
            }}
            onMessage={handleWebViewMessage}
            injectedJavaScript={INJECTED_JAVASCRIPT}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsBackForwardNavigationGestures={true}
            pullToRefreshEnabled={true}
            cacheEnabled={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            onContentProcessDidTerminate={() => {
              console.log('Processo de conteúdo terminado, reiniciando...');
              setWebViewLoading(true);
              webViewRef.current?.reload();
            }}
          />

          {/* Always show loading overlay when WebView is loading */}
          {/* {webViewLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          )} */}
        </View>
      </ScrollView>

      {/* Floating refresh button */}
      {showRefreshButton && (
        <TouchableOpacity
          style={styles.floatingRefreshButton}
          onPress={refreshWebView}
          disabled={refreshing}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Error toast */}
      {error && (
        <View style={styles.errorToast}>
          <Text style={styles.errorToastText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingTop: Platform.OS === 'android' ? 28 : 0, // Add padding for transparent status bar on Android
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 45 : 20, // Add extra padding for transparent status bar on Android
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 45 : 20, // Add extra padding for transparent status bar on Android
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d32f2f',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingRefreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  errorToast: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(211, 47, 47, 0.9)',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  errorToastText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  configErrorContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  configErrorText: {
    color: '#721c24',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
});
