import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Linking,
  Modal,
  SafeAreaView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import app logo and config
const appLogo = require('../assets/images/icon.png');
import config from '../utils/config';

// Global reference to the active toast
let globalToast: {
  show: (message: string, duration?: number, actionText?: string, actionHandler?: () => void) => void;
  hide: () => void;
} | null = null;

// Global reference to the in-app notification
let globalNotification: {
  show: (title: string, body: string, data?: any, icon?: any) => void;
  hide: () => void;
} | null = null;

/**
 * Show a toast message
 * @param message The message to display
 * @param duration How long to show the toast (ms)
 * @param actionText Optional text for an action button
 * @param actionHandler Optional handler for the action button
 */
export function showToast(
  message: string,
  duration: number = 3000,
  actionText?: string,
  actionHandler?: () => void
) {
  if (globalToast) {
    globalToast.show(message, duration, actionText, actionHandler);
  } else {
    console.warn('Toast component not mounted');
  }
}

/**
 * Hide the currently displayed toast
 */
export function hideToast() {
  if (globalToast) {
    globalToast.hide();
  }
}

/**
 * Show a custom in-app notification
 * @param title The notification title
 * @param body The notification body
 * @param data Optional data to pass to the handler (e.g. coordinates)
 * @param icon Optional icon for the notification
 */
export function showNotification(
  title: string,
  body: string,
  data?: any,
  icon?: any
) {
  if (globalNotification) {
    globalNotification.show(title, body, data, icon);
  } else {
    console.warn('Notification component not mounted');
  }
}

/**
 * Hide the currently displayed notification
 */
export function hideNotification() {
  if (globalNotification) {
    globalNotification.hide();
  }
}

/**
 * Open app settings
 */
export function openAppSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

/**
 * Show a toast about notification permissions being disabled
 * with a button to open app settings
 */
export function showNotificationPermissionToast() {
  showToast(
    'Notifications are disabled. Enable them in app settings for updates.',
    5000,
    'Settings',
    openAppSettings
  );
}

/**
 * Custom in-app notification component to be rendered at the root of your app
 */
export function InAppNotification() {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [data, setData] = useState<any>(null);
  const [icon, setIcon] = useState<any>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(-100))[0];

  // Import router for navigation
  const router = require('expo-router').useRouter();

  useEffect(() => {
    // Register the notification methods globally
    globalNotification = {
      show: (titleText, bodyText, notificationData, iconImage) => {
        setTitle(titleText);
        setBody(bodyText);
        setData(notificationData);
        setIcon(iconImage);
        setVisible(true);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();

        // Não fechamos automaticamente mais - o usuário precisa clicar em "Fechar"
      },
      hide: hide
    };

    return () => {
      globalNotification = null;
    };
  }, []);

  const hide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setVisible(false);
    });
  };

  const handleViewDetails = () => {
    // Hide the notification
    hide();

    console.log('=== TOAST VIEW DETAILS ANALYSIS ===');
    console.log('Handling View Details button click');

    // Navigate to MapScreen with the notification data
    if (data) {
      console.log('Notification data available:', data);
      console.log('Data keys:', Object.keys(data));

      // Analyze location data
      console.log('Location data:');
      console.log('- lat:', data.lat, typeof data.lat);
      console.log('- lon:', data.lon, typeof data.lon);
      console.log('- latitude:', data.latitude, typeof data.latitude);
      console.log('- longitude:', data.longitude, typeof data.longitude);

      // Analyze other fields
      console.log('Other fields:');
      console.log('- title:', title);
      console.log('- body:', body);
      console.log('- data.message:', data.message);
      console.log('- data.placa:', data.placa);
      console.log('- data.end:', data.end);
      console.log('- data.vel:', data.vel);
      console.log('- data.dt:', data.dt);
      console.log('- data.ign:', data.ign);
      console.log('- data.id:', data.id);

      // Create parameters with notification data
      const params: Record<string, string> = {
        ...data,
        title: title || 'Localização',
        message: body || data.message || '' // Use notification body or message from data
      };

      // Handle lat/lon fields from notification data
      console.log('Toast data for map navigation:', data);

      // Convert lat to latitude if needed
      if (data.lat && !params.latitude) {
        console.log('Converting lat to latitude:', data.lat);
        // Pass the original string value without conversion
        params.latitude = data.lat as string;
        console.log('Set latitude param to:', params.latitude);
      }

      // Convert lon to longitude if needed
      if (data.lon && !params.longitude) {
        console.log('Converting lon to longitude:', data.lon);
        // Pass the original string value without conversion
        params.longitude = data.lon as string;
        console.log('Set longitude param to:', params.longitude);
      }

      // Remove latitude/longitude if they don't exist
      if (!params.latitude && !data.lat) {
        delete params.latitude;
      }

      if (!params.longitude && !data.lon) {
        delete params.longitude;
      }

      router.push({
        pathname: '/map',
        params
      });
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={hide}
    >
      <SafeAreaView style={notificationStyles.modalContainer}>
        <Animated.View
          style={[
            notificationStyles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={notificationStyles.notification}>
            <View style={notificationStyles.content}>
              <View style={notificationStyles.iconContainer}>
                <Image source={appLogo} style={notificationStyles.icon} />
              </View>
              <View style={notificationStyles.textContainer}>
                <Text style={notificationStyles.title}>{title}</Text>
                <Text style={notificationStyles.body}>{body}</Text>
              </View>
            </View>

            <View style={notificationStyles.footer}>

              {data && (
                <TouchableOpacity
                  onPress={handleViewDetails}
                  style={[notificationStyles.textButton, notificationStyles.viewDetailsButton]}
                >
                  <Text style={[notificationStyles.textButtonText]}>Ver detalhes</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={hide}
                style={notificationStyles.textButton}
              >
                <Text style={notificationStyles.textButtonText}>Fechar</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Toast component to be rendered at the root of your app
 */
export function Toast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [actionText, setActionText] = useState<string | undefined>(undefined);
  const [actionHandler, setActionHandler] = useState<(() => void) | undefined>(undefined);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Register the toast methods globally
    globalToast = {
      show: (msg, duration = 3000, action?, handler?) => {
        setMessage(msg);
        setActionText(action);
        setActionHandler(handler);
        setVisible(true);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Auto hide after duration
        setTimeout(() => {
          hide();
        }, duration);
      },
      hide: hide
    };

    return () => {
      globalToast = null;
    };
  }, []);

  const hide = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.toast}>
        <Text style={styles.message}>{message}</Text>
        {actionText && actionHandler && (
          <TouchableOpacity onPress={actionHandler} style={styles.actionButton}>
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const notificationStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
  },
  container: {
    width: '100%',
  },
  notification: {
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: config.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  body: {
    color: '#333',
    fontSize: 14,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  textButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textButtonText: {
    color: '#3b80b8',
    fontWeight: '500',
    fontSize: 14,
  },
  viewDetailsButton: {
    marginLeft: 8,
  },
  viewDetailsText: {
    color: config.colors.primary,
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '90%',
    minWidth: '50%',
  },
  message: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  actionButton: {
    marginLeft: 16,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
  },
  actionText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
