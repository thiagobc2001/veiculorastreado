import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import FCMTokenDisplay from '../components/FCMTokenDisplay';
import SendNotificationButton from '../components/SendNotificationButton';

export default function FCMTokenScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Firebase Cloud Messaging</Text>
        <Text style={styles.description}>
          This screen displays your Firebase Cloud Messaging (FCM) token, which is used to send push notifications to this device.
        </Text>

        <FCMTokenDisplay />

        <View style={styles.testNotificationContainer}>
          <Text style={styles.testNotificationTitle}>Test Push Notification</Text>
          <Text style={styles.testNotificationDescription}>
            Click the button below to send a test notification to this device using your FCM token.
          </Text>
          <SendNotificationButton />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>What is an FCM Token?</Text>
          <Text style={styles.infoText}>
            An FCM token is a unique identifier assigned to each device by Firebase Cloud Messaging.
            It's used to target specific devices when sending push notifications.
          </Text>

          <Text style={styles.infoTitle}>How to use this token?</Text>
          <Text style={styles.infoText}>
            You can use this token with the Firebase Admin SDK or Firebase Console to send test notifications to this specific device.
          </Text>

          <Text style={styles.infoTitle}>Token Lifecycle</Text>
          <Text style={styles.infoText}>
            FCM tokens can change when:
            {'\n'}- The app is restored on a new device
            {'\n'}- The user uninstalls/reinstalls the app
            {'\n'}- The user clears app data
          </Text>

          <Link href="/webview-test" asChild>
            <TouchableOpacity style={styles.testButton}>
              <Text style={styles.testButtonText}>Go to WebView Test</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/" asChild>
            <TouchableOpacity style={[styles.testButton, styles.mainButton]}>
              <Text style={styles.testButtonText}>Go to Main WebView</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  infoContainer: {
    marginTop: 20,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    color: '#333',
  },
  testNotificationContainer: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  testNotificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2e7d32',
  },
  testNotificationDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    color: '#333',
  },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  mainButton: {
    backgroundColor: '#4CAF50',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
