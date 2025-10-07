import React from 'react';
import { StyleSheet } from 'react-native';
import WebViewScreen from '../components/WebViewScreen';

export default function HomeScreen() {
  // The WebView component will handle getting the FCM token and showing the webview
  // It will also manage the splash screen, hiding it once the token is retrieved
  return <WebViewScreen />;
}

const styles = StyleSheet.create({
  // Styles not needed for the WebView implementation
});
