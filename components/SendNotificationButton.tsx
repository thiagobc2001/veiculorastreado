import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, View } from 'react-native';
import { getFCMToken } from '../utils/messaging';
import { mockSendTestNotification, sendTestNotificationViaBackend } from '../utils/sendNotification';
import { showNotificationPermissionToast } from '../utils/toast';
import config from '../utils/config';

interface SendNotificationButtonProps {
  // Optional custom token, if not provided, will get the current device token
  token?: string | null;
}

export default function SendNotificationButton({ token: providedToken }: SendNotificationButtonProps) {
  const [loading, setLoading] = useState(false);

  const sendNotification = async () => {
    try {
      console.log('Starting notification process...');
      setLoading(true);

      // Get the token if not provided
      console.log('Getting FCM token...');
      const token = providedToken || await getFCMToken();
      console.log('FCM token obtained:', token ? 'Yes' : 'No');

      if (!token) {
        console.log('No FCM token available');
        // Show a toast with a button to open settings
        showNotificationPermissionToast();
        setLoading(false); // Make sure to reset loading state
        return;
      }

      // Try to send a notification via the backend first
      try {
        console.log('Attempting to send notification via backend...');
        const success = await sendTestNotificationViaBackend(token);
        console.log('Backend notification result:', success ? 'Success' : 'Failed');

        if (!success) {
          // If the backend call fails, fall back to the mock implementation
          console.log('Backend notification failed, using mock implementation');
          mockSendTestNotification(token);
        }
      } catch (error: any) {
        // If there's an error with the backend call, use the mock implementation
        console.error('Error with backend notification:', error);

        // Show a more detailed error message
        Alert.alert(
          'Connection Error',
          'Could not connect to the notification server. Make sure the server is running and accessible. ' +
          'Using mock implementation instead.\n\n' +
          `Error: ${error?.message || error?.toString() || 'Unknown error'}`,
          [{ text: 'OK' }]
        );

        mockSendTestNotification(token);
      }

      // Show success message
      Alert.alert(
        'Success',
        'Test notification request sent. You should receive a notification shortly.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert(
        'Error',
        'Failed to send test notification. See console for details.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to send a location notification that opens the map screen
  const sendLocationNotification = async () => {
    try {
      console.log('Starting location notification process...');
      setLoading(true);

      // Get the token if not provided
      console.log('Getting FCM token...');
      const token = providedToken || await getFCMToken();
      console.log('FCM token obtained:', token ? 'Yes' : 'No');

      if (!token) {
        console.log('No FCM token available');
        // Show a toast with a button to open settings
        showNotificationPermissionToast();
        setLoading(false); // Make sure to reset loading state
        return;
      }

      // Create mock notification data with location information matching the required structure
      try {
        console.log('Sending mock location notification...');
        
        // Current date in DD/MM/YYYY format
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
        const yyyy = today.getFullYear();
        const formattedDate = dd + '/' + mm + '/' + yyyy;
        
        // Random time for the notification
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        
        // Create notification data according to the specified structure
        const locationNotificationData = {
          notification: {
            title: "Alerta de Movimento",
            body: "Veículo em movimento detectado."
          },
          data: {
            title: "Alerta de Movimento",
            lat: "-22.9519", // Rio de Janeiro coordinates
            lon: "-43.2105",
            dt: formattedDate,
            placa: "ABC1234",
            end: "Av. Atlântica, Copacabana, Rio de Janeiro",
            vel: "60",
            id: "12345",
            ign: "ON",
            message: "Veículo em movimento detectado."
          }
        };
        
        // Send the mock notification
        mockSendTestNotification(token, locationNotificationData);
        
        Alert.alert(
          'Notificação Enviada',
          'Uma notificação de localização foi enviada para o dispositivo.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Error sending mock notification:', error);
        
        Alert.alert(
          'Erro de Notificação',
          'Não foi possível enviar a notificação de localização.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in location notification process:', error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={sendNotification}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Enviar Notificação de Teste</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.locationButton]}
        onPress={sendLocationNotification}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Enviar Notificação de Localização</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  button: {
    backgroundColor: config.colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  locationButton: {
    backgroundColor: config.colors.secondary || '#4CAF50',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
