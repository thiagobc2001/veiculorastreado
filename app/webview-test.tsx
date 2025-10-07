import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { getFCMToken } from '../utils/messaging';
import config from '../utils/config';

export default function WebViewTestScreen() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [webviewUrl, setWebviewUrl] = useState<string>('');

  useEffect(() => {
    // Get the FCM token to display the URL that would be used
    const getToken = async () => {
      try {
        const token = await getFCMToken();
        setFcmToken(token);

        if (token) {
          const url = `${config.webview.baseUrl}?device=${token}`;
          setWebviewUrl(url);
        }
      } catch (error) {
        console.error('Error getting FCM token:', error);
      }
    };

    getToken();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>WebView Test</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FCM Token</Text>
          <Text style={styles.tokenText}>{fcmToken || 'Loading...'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WebView URL</Text>
          <Text style={styles.urlText}>{webviewUrl || 'Waiting for FCM token...'}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Go to WebView</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/fcm-token" asChild>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.buttonText}>View FCM Token Details</Text>
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
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tokenText: {
    fontSize: 14,
    fontFamily: 'monospace',
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  urlText: {
    fontSize: 14,
    fontFamily: 'monospace',
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    color: '#0066cc',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  secondaryButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
