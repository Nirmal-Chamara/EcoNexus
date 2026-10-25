import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

/**
 * EcoNexus App Root
 *
 * Provider hierarchy (outermost → innermost):
 *   SafeAreaProvider    — native safe area insets for all screens
 *   AuthProvider        — global auth state, session restoration, force-logout
 *   RootNavigator       — auth flow and role-based navigation
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
