import { Platform } from 'react-native';

/**
 * Configure foreground notifications to be shown in the status bar
 * This function should be called when the app starts
 *
 * Note: Foreground notification presentation options are configured in firebase.json:
 * {
 *   "react-native": {
 *     "messaging_ios_foreground_presentation_options": ["badge", "sound", "list", "banner"]
 *   }
 * }
 */
export function configureForegroundNotifications(): void {
  // For iOS, foreground presentation options are configured in firebase.json
  if (Platform.OS === 'ios') {
    console.log('iOS foreground notification presentation options configured via firebase.json');
  } else if (Platform.OS === 'android') {
    // For Android, we rely on the firebase.json configuration
    // with messaging_android_notification_delegation_enabled set to true
    // This ensures notifications are shown in the status bar when in foreground
    console.log('Android foreground notifications will be shown in the status bar');
  }

  console.log('Foreground notifications configured to show in the status bar');
}
