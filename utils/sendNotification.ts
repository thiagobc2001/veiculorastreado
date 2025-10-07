import { Alert, Platform } from 'react-native';

/**
 * Send a test notification to a specific FCM token
 *
 * This function uses the Firebase Cloud Messaging HTTP v1 API to send a notification
 * to a specific device using its FCM token.
 *
 * @param token The FCM token of the device to send the notification to
 * @returns A promise that resolves when the notification is sent
 */
export async function sendTestNotification(token: string): Promise<boolean> {
  try {
    // Firebase project credentials from google-services.json
    const projectId = 'mf-rastreamento-9317b';

    // Endpoint for FCM HTTP v1 API
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    // Get the current time for a unique notification
    const timestamp = new Date().toLocaleTimeString();

    // Prepare the notification payload
    const message = {
      message: {
        token: token,
        notification: {
          title: 'Test Notification',
          body: `This is a test notification sent at ${timestamp}`,
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
      },
    };

    // Send the notification
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a production app, you would need to authenticate with Firebase
        // using a server key or OAuth token. This example won't work as-is
        // because it lacks proper authentication.
        // 'Authorization': 'Bearer YOUR_SERVER_KEY',
      },
      body: JSON.stringify(message),
    });

    // Check if the request was successful
    if (response.ok) {
      console.log('Notification sent successfully');
      return true;
    } else {
      const errorData = await response.json();
      console.error('Failed to send notification:', errorData);
      return false;
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Alternative method to send a test notification using a simple backend service
 *
 * This function demonstrates how you might call your own backend service
 * that handles the Firebase authentication and sends the notification.
 *
 * @param token The FCM token of the device to send the notification to
 * @returns A promise that resolves when the notification is sent
 */
export async function sendTestNotificationViaBackend(token: string): Promise<boolean> {
  try {
    // Get the appropriate server URL based on the environment
    const getServerUrl = () => {
      if (Platform.OS === 'android') {
        // For Android emulator, use 10.0.2.2 to reach host machine
        if (__DEV__) {
          return 'http://10.0.2.2:3000/api/send-notification';
        }
        // For physical Android devices, use the actual IP address
        return 'http://192.168.1.10:3000/api/send-notification';
      } else if (Platform.OS === 'ios') {
        // For iOS simulator, localhost works
        if (__DEV__) {
          return 'http://localhost:3000/api/send-notification';
        }
        // For physical iOS devices, use the actual IP address
        return 'http://192.168.1.10:3000/api/send-notification';
      } else {
        // Default fallback
        return 'http://192.168.1.10:3000/api/send-notification';
      }
    };

    const backendUrl = getServerUrl();
    console.log('Using backend URL:', backendUrl);

    // Get the current time for a unique notification
    const timestamp = new Date().toLocaleTimeString();

    // Prepare the request payload
    const payload = {
      token: token,
      title: 'Test Notification',
      body: `This is a test notification sent at ${timestamp}`,
      data: {
        type: 'test',
        timestamp: Date.now().toString(),
      },
    };
    console.log('Sending notification payload:', payload);

    // Send the request to your backend
    console.log('Fetching from backend...');
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log('Fetch response received, status:', response.status);

    // Check if the request was successful
    if (response.ok) {
      const result = await response.json();
      console.log('Notification sent successfully via backend:', result);
      return true;
    } else {
      try {
        const errorData = await response.json();
        console.error('Failed to send notification via backend:', errorData);
      } catch (jsonError) {
        console.error('Failed to parse error response:', await response.text());
      }
      return false;
    }
  } catch (error) {
    console.error('Error sending notification via backend:', error);
    return false;
  }
}

/**
 * Send a test notification using Firebase Admin SDK
 *
 * Note: This is a mock function that simulates sending a notification.
 * In a real app, this would be implemented on your backend server using
 * the Firebase Admin SDK, not in the client app.
 *
 * @param token The FCM token of the device to send the notification to
 * @param customData Optional custom notification data and content
 */
export function mockSendTestNotification(
  token: string, 
  customData?: {
    notification?: { title?: string; body?: string; },
    data?: Record<string, string>;
  }
): void {
  // Simulate a successful notification
  console.log(`[MOCK] Sending notification to token: ${token}`);
  if (customData) {
    console.log('[MOCK] Custom notification data:', customData);
  }

  // Show an alert to inform the user
  setTimeout(() => {
    if (customData?.notification) {
      // We don't show an alert for custom notifications since they might be
      // simulating background notifications that shouldn't interrupt the user
      console.log('[MOCK] Custom notification would be displayed:', 
        customData.notification.title || 'Notification',
        customData.notification.body || 'You received a notification'
      );
    } else {
      // Only show the alert for default test notifications
      Alert.alert(
        'Notification Simulation',
        'In a real app, this would send a notification to your device. ' +
        'To actually send notifications, you need a server with Firebase Admin SDK credentials.',
        [{ text: 'OK' }]
      );
    }
  }, 1000);
}
