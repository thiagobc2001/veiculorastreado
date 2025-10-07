import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { showNotificationPermissionToast } from '../utils/toast';
import { getFCMToken, onTokenRefresh, requestNotificationPermission } from '../utils/messaging';

export default function FCMTokenDisplay() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'unknown'>('unknown');

  useEffect(() => {
    // Get the initial token
    const getToken = async () => {
      try {
        setLoading(true);
        console.log('FCMTokenDisplay: Checking notification permission...');

        // Check if we already have permission
        const hasPermission = await requestNotificationPermission();
        console.log('FCMTokenDisplay: Permission status:', hasPermission ? 'granted' : 'denied');
        setPermissionStatus(hasPermission ? 'granted' : 'denied');

        if (hasPermission) {
          // If we have permission, get the token
          console.log('FCMTokenDisplay: Getting FCM token...');
          const token = await getFCMToken();
          console.log('FCMTokenDisplay: Token received:', token ? 'Yes (length: ' + token.length + ')' : 'No');
          if (token) {
            console.log('FCMTokenDisplay: Token starts with:', token.substring(0, 10) + '...');
          }
          setFcmToken(token);
        } else {
          // If we don't have permission, we can't get a token
          console.log('FCMTokenDisplay: Notification permission not granted');
          setFcmToken(null);
        }
      } catch (error) {
        console.error('FCMTokenDisplay: Error getting FCM token:', error);
        Alert.alert('Error', 'Failed to get FCM token');
        setPermissionStatus('unknown');
      } finally {
        setLoading(false);
      }
    };

    getToken();

    // Listen for token refreshes
    const unsubscribe = onTokenRefresh((token) => {
      console.log('FCM Token refreshed');
      setFcmToken(token);
    });

    // Clean up the listener
    return unsubscribe;
  }, []);

  const copyToClipboard = async () => {
    if (fcmToken) {
      await Clipboard.setStringAsync(fcmToken);
      Alert.alert('Success', 'FCM Token copied to clipboard');
    }
  };

  const refreshToken = async () => {
    try {
      setLoading(true);

      // First request permission explicitly
      const permissionGranted = await requestNotificationPermission();
      setPermissionStatus(permissionGranted ? 'granted' : 'denied');

      if (permissionGranted) {
        // If permission granted, get the token
        const token = await getFCMToken(true);
        setFcmToken(token);
      } else {
        // If permission denied, show a toast with a button to open settings
        showNotificationPermissionToast();
        setFcmToken(null);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      Alert.alert('Error', 'Failed to refresh FCM token');
      setFcmToken(null);
      setPermissionStatus('unknown');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Cloud Messaging Token</Text>

      {/* Permission Status Indicator */}
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionLabel}>Notification Permission:</Text>
        <View style={[
          styles.permissionStatus,
          permissionStatus === 'granted' ? styles.permissionGranted :
          permissionStatus === 'denied' ? styles.permissionDenied :
          styles.permissionUnknown
        ]}>
          <Text style={styles.permissionStatusText}>
            {permissionStatus === 'granted' ? 'Granted' :
             permissionStatus === 'denied' ? 'Denied' :
             'Unknown'}
          </Text>
        </View>
      </View>

      {loading ? (
        <Text style={styles.loading}>Loading token...</Text>
      ) : fcmToken ? (
        <>
          <Text style={styles.tokenLabel}>Your FCM Token:</Text>
          <Text style={styles.token} selectable>{fcmToken}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={copyToClipboard}>
              <Text style={styles.buttonText}>Copy to Clipboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={refreshToken}>
              <Text style={styles.buttonText}>Refresh Token</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.error}>
            {permissionStatus === 'denied'
              ? 'Notification permission denied. Please enable in settings.'
              : 'Failed to get FCM token'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={refreshToken}>
            <Text style={styles.buttonText}>Request Permission & Try Again</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  // Permission status styles
  permissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#e9e9e9',
    padding: 10,
    borderRadius: 5,
  },
  permissionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  permissionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  permissionGranted: {
    backgroundColor: '#4CAF50',
  },
  permissionDenied: {
    backgroundColor: '#F44336',
  },
  permissionUnknown: {
    backgroundColor: '#9E9E9E',
  },
  permissionStatusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // Token styles
  tokenLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  token: {
    fontSize: 12,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
});
