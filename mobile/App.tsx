import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { tokenStorage } from './src/services/tokenStorage';

const isWeb = Platform.OS === 'web';

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
    <SafeAreaProvider style={styles.safeArea}>
      <AuthProvider>
        <View style={styles.canvas}>
          <View style={styles.phoneFrame}>
            <AppContent />
            <StatusBar style="auto" />
          </View>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: isWeb ? '#0F172A' : '#F8FAFC',
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: isWeb ? '#0F172A' : '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: isWeb ? 430 : undefined,
    height: '100%',
    backgroundColor: '#F8FAFC',
    ...(isWeb
      ? {
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: '#1E293B',
          overflow: 'hidden',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.35,
          shadowRadius: 20,
        }
      : {}),
  },
});
