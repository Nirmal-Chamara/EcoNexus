import React, { useEffect } from 'react';
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
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
