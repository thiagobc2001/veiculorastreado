import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';

import { requestNotificationPermission } from '../utils/messaging';
import { showNotificationPermissionToast } from '../utils/toast';
import { configureForegroundNotifications } from '../utils/foregroundNotifications';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Load settings when component mounts
  useEffect(() => {
    loadSettings();
    checkPermission();
  }, []);

  // Load settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      // No settings to load anymore
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check notification permission
  const checkPermission = async () => {
    const granted = await requestNotificationPermission(false);
    setPermissionGranted(granted);
  };

  // No longer need to toggle notification display mode as notifications always show in the status bar

  // Request notification permission
  const requestPermission = async () => {
    const granted = await requestNotificationPermission(true);
    setPermissionGranted(granted);

    if (!granted) {
      showNotificationPermissionToast();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>App Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>

          {!permissionGranted && (
            <View style={styles.permissionWarning}>
              <Text style={styles.permissionWarningText}>
                Notification permission is not granted. Some features may not work properly.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.displayModeInfo}>
            <Text style={styles.displayModeTitle}>
              Notification Behavior
            </Text>
            <Text style={styles.displayModeDescription}>
              Notifications will appear in the status bar even when the app is open
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  displayModeInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
  },
  displayModeTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2196F3',
    marginBottom: 4,
  },
  displayModeDescription: {
    fontSize: 14,
    color: '#555',
  },
  permissionWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  permissionWarningText: {
    color: '#856404',
    fontSize: 14,
    marginBottom: 8,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
});
