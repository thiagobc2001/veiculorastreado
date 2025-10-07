import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StatusBar, Platform, SafeAreaView, View, StyleSheet } from 'react-native';
import { getFCMToken, requestNotificationPermission, onMessage, createNotificationChannel } from '../utils/messaging';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { getMessaging, getInitialNotification, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { Toast, showNotificationPermissionToast, InAppNotification, showNotification } from '../utils/toast';
import * as SplashScreen from 'expo-splash-screen';
import config from '../utils/config';
import { useRouter } from 'expo-router';

// Import Firebase initialization
import '../firebase-init';

// Keep the splash screen visible until explicitly hidden by the WebView component
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

// Define styles for the layout
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: config.colors.background, // Using the background color from config
  },
  safeArea: {
    flex: 1,
  },
});

export default function RootLayout() {
  const router = useRouter();

  // Render the Toast component at the root level
  // This ensures it can be shown from anywhere in the app
  // First useEffect to initialize the Toast component
  useEffect(() => {
    console.log('RootLayout: Toast component initialized');
    // This empty useEffect ensures the Toast component is mounted
    // before we try to show any toasts
  }, []);

  // Second useEffect to initialize FCM with a slight delay
  useEffect(() => {
    // Initialize FCM when the app starts, with a slight delay to ensure Toast is ready
    const initFCMTimeout = setTimeout(() => {
      console.log('RootLayout: Starting FCM initialization...');
      initFCM().catch(error => {
        console.error('RootLayout: Unhandled error in FCM initialization:', error);
      });
    }, 1000); // Increased delay to ensure Firebase is fully initialized

    return () => clearTimeout(initFCMTimeout);
  }, []);

  // Function to initialize FCM
  const initFCM = async () => {
    try {
      console.log('RootLayout: Initializing FCM...');

      // Create notification channel for Android
      await createNotificationChannel();
      console.log('RootLayout: Notification channel created');

      // Request notification permissions first - force request and show toast if denied
      console.log('RootLayout: Requesting notification permission...');
      const permissionGranted = await requestNotificationPermission(true);
      console.log('RootLayout: Permission granted:', permissionGranted);

      if (permissionGranted) {
        // Get the initial token if permission is granted
        const token = await getFCMToken(false, true);
        console.log('RootLayout: FCM Token obtained:', token ? 'Yes' : 'No');
        if (token) {
          console.log('RootLayout: Token value:', token);
        } else {
          console.warn('RootLayout: No FCM token received even though permission was granted');
        }

        try {
          // Check if app was opened from a notification
          const messagingInstance = getMessaging();
          console.log('[messagingInstance] Messaging instance created successfully -> ', messagingInstance);

          const initialNotification = await getInitialNotification(messagingInstance);
          console.log('[initialNotification] Initial notification check completed:', initialNotification);

          if (initialNotification) {
            console.log('RootLayout: App opened from notification:', initialNotification);
            handleNotificationNavigation(initialNotification);
          }

          // Set up a listener for when the app is opened from a notification when in background
          console.log('RootLayout: Setting up onNotificationOpenedApp listener');
          onNotificationOpenedApp(messagingInstance, (notification: FirebaseMessagingTypes.RemoteMessage) => {
            console.log('RootLayout: Notification opened app from background state:', notification);
            handleNotificationNavigation(notification);
          });
          console.log('RootLayout: Notification opened app listener set up successfully');
        } catch (notificationError) {
          console.error('RootLayout: Error setting up notification handlers:', notificationError);
        }
      } else {
        // Show a toast message that notifications won't work without permission
        // and provide a button to open app settings
        console.log('RootLayout: Showing permission toast');
        showNotificationPermissionToast();
      }
    } catch (error) {
      console.error('RootLayout: Error initializing FCM:', error);
      // Try to recover and show helpful message
      if (error instanceof Error) {
        console.error('RootLayout: Error details:', error.message);
        if (error.stack) {
          console.error('RootLayout: Stack trace:', error.stack);
        }
      }
    }
  };

  // Function to handle navigation based on notification data
  const handleNotificationNavigation = (notification: FirebaseMessagingTypes.RemoteMessage) => {
    try {
      console.log('=== NOTIFICATION DATA ANALYSIS ===');
      console.log('Full notification object:', JSON.stringify(notification, null, 2));

      // Analyze data payload
      if (notification.data) {
        console.log('DATA PAYLOAD ANALYSIS:');
        console.log('- Data keys:', Object.keys(notification.data));

        // Location data
        console.log('- Location data:');
        console.log('  - lat:', notification.data.lat, typeof notification.data.lat);
        console.log('  - lon:', notification.data.lon, typeof notification.data.lon);

        // Vehicle data
        console.log('- Vehicle data:');
        console.log('  - placa:', notification.data.placa);
        console.log('  - end:', notification.data.end);
        console.log('  - vel:', notification.data.vel);
        console.log('  - dt:', notification.data.dt);
        console.log('  - ign:', notification.data.ign);
        console.log('  - id:', notification.data.id);

        // Message content
        console.log('- Message content:');
        console.log('  - title:', notification.data.title);
        console.log('  - message:', notification.data.message);
      }

      // Analyze notification payload
      if (notification.notification) {
        console.log('NOTIFICATION PAYLOAD ANALYSIS:');
        console.log('- title:', notification.notification.title);
        console.log('- body:', notification.notification.body);
        console.log('- android:', notification.notification.android);
        console.log('- ios:', notification.notification.ios);
      }

      console.log('=== NOTIFICATION DATA ANALYSIS END ===');
      // Check if the notification has data
      if (notification.data && Object.keys(notification.data).length > 0) {
        // If the notification contains location data (lat/lon format), navigate to map screen
        if (notification.data.lat && notification.data.lon) {
          console.log('Navigating to map with coordinates from lat/lon:', notification.data.lat, notification.data.lon);
          console.log('Including title and message from notification');

          const latitude = typeof notification.data.lat === 'string'
            ? notification.data.lat
            : String(notification.data.lat);

          const longitude = typeof notification.data.lon === 'string'
            ? notification.data.lon
            : String(notification.data.lon);

          // Use the original notification title and message
          const title = typeof notification.data.title === 'string'
            ? notification.data.title
            : notification.notification?.title || 'Localização';

          const message = typeof notification.data.message === 'string'
            ? notification.data.message
            : notification.notification?.body || '';

          // Get additional vehicle data from notification
          const additionalParams: Record<string, string> = {};

          // Add each parameter if it exists and is a string
          if (typeof notification.data.placa === 'string') additionalParams.placa = notification.data.placa;
          if (typeof notification.data.end === 'string') additionalParams.end = notification.data.end;
          if (typeof notification.data.vel === 'string') additionalParams.vel = notification.data.vel;
          if (typeof notification.data.dt === 'string') additionalParams.dt = notification.data.dt;
          if (typeof notification.data.ign === 'string') additionalParams.ign = notification.data.ign;
          if (typeof notification.data.id === 'string') additionalParams.id = notification.data.id;

          // Navigate to map with all the parameters
          router.push({
            pathname: '/map' as const,
            params: {
              latitude,
              longitude,
              title,
              message,
              ...additionalParams
            }
          });
        }
        // For backward compatibility, still check for latitude/longitude
        else if (notification.data.latitude && notification.data.longitude) {
          console.log('Navigating to map with coordinates:', notification.data.latitude, notification.data.longitude);
          console.log('Including title and message from notification');

          const latitude = typeof notification.data.latitude === 'string'
            ? notification.data.latitude
            : String(notification.data.latitude);

          const longitude = typeof notification.data.longitude === 'string'
            ? notification.data.longitude
            : String(notification.data.longitude);

          // Use the original notification title and message
          const title = typeof notification.data.title === 'string'
            ? notification.data.title
            : notification.notification?.title || 'Localização';

          const message = typeof notification.data.message === 'string'
            ? notification.data.message
            : notification.notification?.body || '';

          // Get additional vehicle data from notification
          const additionalParams: Record<string, string> = {};

          // Add each parameter if it exists and is a string
          if (typeof notification.data.placa === 'string') additionalParams.placa = notification.data.placa;
          if (typeof notification.data.end === 'string') additionalParams.end = notification.data.end;
          if (typeof notification.data.vel === 'string') additionalParams.vel = notification.data.vel;
          if (typeof notification.data.dt === 'string') additionalParams.dt = notification.data.dt;
          if (typeof notification.data.ign === 'string') additionalParams.ign = notification.data.ign;
          if (typeof notification.data.id === 'string') additionalParams.id = notification.data.id;

          router.push({
            pathname: '/map' as const,
            params: {
              latitude,
              longitude,
              title,
              message,
              ...additionalParams
            }
          });
        }
        // Check if there's a specific screen to navigate to
        else if (notification.data.screen) {
          const screen = typeof notification.data.screen === 'string'
            ? notification.data.screen
            : '/';

          console.log('Navigating to screen:', screen);
          router.push(screen as any);
        }
        // If no location data or target screen is specified, use notification data
        else {
          navigateWithNotificationData(notification);
        }
      }
      // If there's no data at all, use notification data
      else {
        navigateWithNotificationData(notification);
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
      // If there's an error, try to navigate with notification data as a fallback
      try {
        navigateWithNotificationData(notification);
      } catch (fallbackError) {
        console.error('Error navigating with notification data:', fallbackError);
      }
    }
  };

  // Function to navigate to the map with actual notification data
  const navigateWithNotificationData = (notification: FirebaseMessagingTypes.RemoteMessage) => {
    console.log('=== NAVIGATE WITH NOTIFICATION DATA ===');
    console.log('Navigating to map with actual notification data');

    // Analyze notification structure
    console.log('Notification structure:');
    console.log('- Has data payload:', !!notification.data);
    console.log('- Has notification payload:', !!notification.notification);

    if (notification.data) {
      console.log('Data payload keys:', Object.keys(notification.data));
      console.log('Data payload values:');
      Object.entries(notification.data).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value} (${typeof value})`);
      });
    }

    // Use notification title and body if available
    const title = notification.notification?.title || 'Notificação';
    const message = notification.notification?.body || '';

    console.log('Using title:', title);
    console.log('Using message:', message);

    // Create parameters for the map screen using only notification data
    const params: Record<string, string> = {
      title,
      message
    };

    // Only add coordinates if they exist in the notification
    if (notification.data) {
      console.log('Checking for coordinates in notification data');

      // Check for lat/lon (primary format from your server)
      if (notification.data.lat) {
        console.log('Found lat:', notification.data.lat);
        // Store the original string value - don't convert here
        params.latitude = notification.data.lat as string;
        console.log('Set latitude param to:', params.latitude);
      }
      // Fallback to latitude if lat is not available
      else if (notification.data.latitude) {
        console.log('Found latitude:', notification.data.latitude);
        params.latitude = notification.data.latitude as string;
        console.log('Set latitude param to:', params.latitude);
      }

      // Check for lon (primary format from your server)
      if (notification.data.lon) {
        console.log('Found lon:', notification.data.lon);
        // Store the original string value - don't convert here
        params.longitude = notification.data.lon as string;
        console.log('Set longitude param to:', params.longitude);
      }
      // Fallback to longitude if lon is not available
      else if (notification.data.longitude) {
        console.log('Found longitude:', notification.data.longitude);
        params.longitude = notification.data.longitude as string;
        console.log('Set longitude param to:', params.longitude);
      }
    }

    // Add any additional data from the notification if available
    if (notification.data) {
      if (notification.data.placa) params.placa = notification.data.placa as string;
      if (notification.data.end) params.end = notification.data.end as string;
      if (notification.data.vel) params.vel = notification.data.vel as string;
      if (notification.data.dt) params.dt = notification.data.dt as string;
      if (notification.data.ign) params.ign = notification.data.ign as string;
      if (notification.data.id) params.id = notification.data.id as string;
    }

    console.log('Navigating to map with notification data:', params);

    // Navigate to the map screen with the notification data
    router.push({
      pathname: '/map' as const,
      params
    });
  };

  // Third useEffect to set up foreground message handler
  useEffect(() => {
    try {
      console.log('RootLayout: Setting up foreground message handler');
      // Set up foreground message handler
      const unsubscribeForeground = onMessage((message) => {
        console.log('=== FOREGROUND MESSAGE ANALYSIS ===');
        console.log('Full message object:', JSON.stringify(message, null, 2));

        // Analyze data payload
        if (message.data) {
          console.log('FOREGROUND DATA PAYLOAD:');
          console.log('- Data keys:', Object.keys(message.data));

          // Location data
          console.log('- Location data:');
          console.log('  - lat:', message.data.lat, typeof message.data.lat);
          console.log('  - lon:', message.data.lon, typeof message.data.lon);

          // Vehicle data
          console.log('- Vehicle data:');
          console.log('  - placa:', message.data.placa);
          console.log('  - end:', message.data.end);
          console.log('  - vel:', message.data.vel);
          console.log('  - dt:', message.data.dt);
          console.log('  - ign:', message.data.ign);
          console.log('  - id:', message.data.id);
        }

        // Analyze notification payload
        if (message.notification) {
          console.log('FOREGROUND NOTIFICATION PAYLOAD:');
          console.log('- title:', message.notification.title);
          console.log('- body:', message.notification.body);
        }

        console.log('=== FOREGROUND MESSAGE ANALYSIS END ===');

        // Use custom notification instead of Alert
        if (message.notification) {
          // Extract any location data from message.data
          const locationData = message.data ? {
            // Use lat/lon directly without conversion - will be handled in map screen
            latitude: message.data.lat || message.data.latitude,
            longitude: message.data.lon || message.data.longitude,
            placa: message.data.placa,
            end: message.data.end,
            vel: message.data.vel,
            dt: message.data.dt,
            ign: message.data.ign,
            id: message.data.id,
            title: message.notification.title, // Include notification title
            message: message.notification.body // Include notification body as message
          } : {
            title: message.notification.title, // Include notification title
            message: message.notification.body // Include notification body even without location data
          };

          console.log('Foreground notification data:', locationData);

          // Show the custom notification
          showNotification(
            message.notification.title || 'Nova Notificação',
            message.notification.body || 'Você recebeu uma nova notificação',
            locationData
          );
        }
      });
      console.log('RootLayout: Foreground message handler set up successfully');

      // Clean up subscription
      return () => {
        console.log('RootLayout: Cleaning up foreground message handler');
        unsubscribeForeground();
      };
    } catch (error) {
      console.error('RootLayout: Error setting up foreground message handler:', error);
      return () => {}; // Return empty cleanup function
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Set status bar with theme colors */}
      <StatusBar
        translucent={true}
        backgroundColor={config.colors.primary}
        barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'}
      />

      <SafeAreaView style={styles.safeArea}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="index"
            options={{
              title: 'Home',
              headerShown: false,
            }}
          />
          {/* <Stack.Screen
            name="fcm-token"
            options={{
              title: 'FCM Token',
              // Keep the header for the FCM token screen for testing purposes
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="webview-test"
            options={{
              title: 'WebView Test',
              headerShown: true,
            }}
          /> */}
        </Stack>
      </SafeAreaView>
      <Toast />
      <InAppNotification />
    </View>
  );
}
