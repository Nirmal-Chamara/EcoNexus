import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { tokenStorage } from './src/services/tokenStorage';

function AppContent() {
  useEffect(() => {
    // Optional local development override: if EXPO_PUBLIC_DEV_TOKEN is configured
    const devToken = process.env.EXPO_PUBLIC_DEV_TOKEN;
    if (devToken) {
      tokenStorage.saveTokens(devToken, 'dev-refresh').catch(() => {});
    }
  }, []);

  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider style={styles.root}>
      <AuthProvider>
        <View style={styles.root}>
          <AppContent />
          <StatusBar style="auto" />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
