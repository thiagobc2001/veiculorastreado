// Initialize Firebase and set up background message handler
import { initializeApp, getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Make sure Firebase is initialized properly
let app;
try {
  app = getApp();
  console.log('Firebase app already initialized, using existing instance');
} catch (error) {
  console.log('Firebase app not yet initialized, initializing now');
  app = initializeApp();
  console.log('Firebase app initialized successfully');
}

// Set up background message handler
try {
  console.log('Setting up Firebase background message handler');
  const messaging = getMessaging(app);
  
  setBackgroundMessageHandler(messaging, async (message) => {
    console.log('Background message received:', message);

    // For Android, Firebase should automatically display the notification when the app is in the background
    // This handler is just for processing any data or performing background tasks when a notification arrives

    // Process any data payload if needed
    if (message.data) {
      console.log('Processing data payload:', message.data);
      // Process the data as needed
    }

    // Return true to indicate the message has been handled
    return Promise.resolve();
  });
  console.log('Firebase background message handler successfully set up');
} catch (error) {
  console.error('Error setting up Firebase background message handler:', error);
  console.error(error instanceof Error ? error.message : 'Unknown error');
}

console.log('Firebase initialization completed');
