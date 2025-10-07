import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { getMessaging, onMessage as onMessageModular, getToken, onTokenRefresh as onTokenRefreshModular, setBackgroundMessageHandler as setBackgroundMessageHandlerModular } from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import { Platform, PermissionsAndroid, ToastAndroid } from 'react-native';
import Constants from 'expo-constants';
import { showNotificationPermissionToast } from './toast';

/**
 * Check if the device is running Android 13 (API level 33) or higher
 * @returns {boolean} Whether the device is running Android 13+
 */
function isAndroid13OrHigher(): boolean {
  if (Platform.OS !== 'android') return false;

  try {
    // Get the Android API level
    // First try to use Platform.Version which is more reliable for API level
    const apiLevel = Platform.Version ? parseInt(Platform.Version.toString(), 10) : 0;

    // If Platform.Version is available and valid, use it
    if (apiLevel > 0) {
      console.log('Android API level from Platform.Version:', apiLevel);
      return apiLevel >= 33;
    }

    // Fallback to Constants.systemVersion
    const androidApiLevel = Constants.systemVersion ?
      (typeof Constants.systemVersion === 'string' ?
        parseInt(Constants.systemVersion, 10) :
        Constants.systemVersion) : 0;

    console.log('Android API level from Constants.systemVersion:', androidApiLevel);
    return androidApiLevel >= 33;
  } catch (error) {
    console.error('Error determining Android API level:', error);
    // Default to requesting permissions if we can't determine the API level
    // This ensures we don't miss requesting permissions on Android 13+
    return true;
  }
}

/**
 * Create a notification channel for Android
 * This is required for Android 8.0 (API level 26) and higher
 *
 * Note: The actual channel creation is handled by the native module
 * when the app initializes with the configuration from firebase.json
 */
export async function createNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    console.log('Notification channel configured via firebase.json');
  }
}

/**
 * Request permission for push notifications
 * @param {boolean} showToastOnDenied Whether to show a toast when permission is denied
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestNotificationPermission(showToastOnDenied: boolean = true): Promise<boolean> {
  try {
    console.log('Requesting notification permission...');
    let permissionGranted = false;

    // For Android 13+ (API level 33+), we need to request the POST_NOTIFICATIONS permission
    if (Platform.OS === 'android' && isAndroid13OrHigher()) {
      console.log('Android 13+ detected, requesting POST_NOTIFICATIONS permission');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message: 'This app needs notification permission to send you updates.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      console.log('Android 13+ permission result:', permissionGranted ? 'GRANTED' : 'DENIED');
    }
    // For Android < 13, permissions are granted by default
    else if (Platform.OS === 'android') {
      console.log('Android < 13 detected, permissions granted by default');
      permissionGranted = true;
    }
    // For iOS, use the Firebase Messaging requestPermission method
    else if (Platform.OS === 'ios') {
      console.log('iOS detected, requesting permission via Firebase Messaging');
      const messagingInstance = getMessaging(getApp());
      const authStatus = await messagingInstance.requestPermission();
      permissionGranted =
        authStatus === FirebaseMessagingTypes.AuthorizationStatus.AUTHORIZED ||
        authStatus === FirebaseMessagingTypes.AuthorizationStatus.PROVISIONAL;
      console.log('iOS permission result:', permissionGranted ? 'GRANTED' : 'DENIED');
    }

    // Show toast if permission was denied and showToastOnDenied is true
    if (!permissionGranted && showToastOnDenied) {
      console.log('Permission denied, showing toast notification');
      // Use setTimeout to ensure the toast is shown after the component is mounted
      setTimeout(() => {
        showNotificationPermissionToast();
      }, 1000);
    }

    return permissionGranted;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Get the FCM token for this device
 * @param {boolean} forcePermissionRequest Whether to force a permission request if not already granted
 * @param {boolean} showToastOnDenied Whether to show a toast when permission is denied
 * @returns {Promise<string|null>} The FCM token or null if it couldn't be retrieved
 */
export async function getFCMToken(forcePermissionRequest: boolean = false, showToastOnDenied: boolean = true): Promise<string | null> {
  try {
    console.log('Getting FCM token, forcePermissionRequest:', forcePermissionRequest);
    // Check if permission is granted first
    let hasPermission = true;

    if (forcePermissionRequest) {
      hasPermission = await requestNotificationPermission(showToastOnDenied);
    } else {
      console.log('Checking existing permission status');
      // On iOS, check the authorization status
      if (Platform.OS === 'ios') {
        const messagingInstance = getMessaging(getApp());
        const authStatus = await messagingInstance.hasPermission();
        hasPermission =
          authStatus === FirebaseMessagingTypes.AuthorizationStatus.AUTHORIZED ||
          authStatus === FirebaseMessagingTypes.AuthorizationStatus.PROVISIONAL;
        console.log('iOS permission status:', hasPermission ? 'GRANTED' : 'DENIED');
      }

      // On Android 13+, we need to check if the permission is granted
      if (Platform.OS === 'android' && isAndroid13OrHigher()) {
        hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        console.log('Android 13+ permission status:', hasPermission ? 'GRANTED' : 'DENIED');

        // If permission is not granted, request it
        if (!hasPermission) {
          console.log('Permission not granted, requesting it now');
          hasPermission = await requestNotificationPermission(showToastOnDenied);
        }
      }
    }

    if (!hasPermission) {
      console.warn('Notification permission not granted');
      if (showToastOnDenied) {
        // Show toast with a slight delay to ensure it's visible
        setTimeout(() => {
          showNotificationPermissionToast();
        }, 1000);
      }
      return null;
    }

    // Get the token using the modular API
    const messagingInstance = getMessaging(getApp());
    const token = await getToken(messagingInstance);
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Register a callback for when the FCM token changes
 * @param {Function} callback Function to call with the new token
 * @returns {Function} Unsubscribe function
 */
export function onTokenRefresh(callback: (token: string) => void): () => void {
  const messagingInstance = getMessaging(getApp());
  return onTokenRefreshModular(messagingInstance, callback);
}

/**
 * Register a callback for foreground messages
 * @param {Function} callback Function to call with the message
 * @returns {Function} Unsubscribe function
 */
export function onMessage(callback: (message: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
  const messagingInstance = getMessaging(getApp());
  return onMessageModular(messagingInstance, callback);
}

/**
 * Set up background message handler
 * @param {Function} handler Function to handle background messages
 */
export function setBackgroundMessageHandler(handler: (message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>): void {
  const messagingInstance = getMessaging(getApp());
  setBackgroundMessageHandlerModular(messagingInstance, handler);
}

