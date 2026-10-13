import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';

/**
 * EcoNexus App Root
 *
 * Provider hierarchy (outermost → innermost):
 *   SafeAreaProvider    — native safe area insets for all screens
 *   AuthProvider        — global auth state, session restoration, force-logout
 *   [Navigation]        — (Phase 6) RootNavigator will mount here
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* Phase 6: <RootNavigator /> will replace this placeholder */}
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
