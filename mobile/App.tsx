import React from 'react';
import { DevSettings, Modal } from 'react-native';
import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import RootNavigator from './src/navigation/RootNavigator';
import NetworkStatusBanner from './src/components/common/NetworkStatusBanner';
import ThemePreviewScreen from './src/screens/dev/ThemePreviewScreen';
import ComponentGalleryScreen from './src/screens/dev/ComponentGalleryScreen';
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
  const [showTokens, setShowTokens] = React.useState(false);
  const [showComponents, setShowComponents] = React.useState(false);

  React.useEffect(() => {
    if (__DEV__ && DevSettings?.addMenuItem) {
      DevSettings.addMenuItem('EcoNexus design tokens', () => setShowTokens(true));
      DevSettings.addMenuItem('EcoNexus component gallery', () => setShowComponents(true));
    }
  }, []);

  return (
    <SafeAreaProvider style={styles.root}>
      <AuthProvider>
        <NetworkStatusBanner />
        <ErrorBoundary>
          <RootNavigator />
        </ErrorBoundary>
        <StatusBar style="light" />
        <View style={styles.root}>
          <AppContent />
          <StatusBar style="auto" />
        </View>
      </AuthProvider>
      {__DEV__ && (
        <Modal visible={showComponents} onRequestClose={() => setShowComponents(false)}>
          <SafeAreaProvider>
            <ComponentGalleryScreen onClose={() => setShowComponents(false)} />
            <StatusBar style="light" />
          </SafeAreaProvider>
        </Modal>
      )}
      {__DEV__ && (
        <Modal visible={showTokens} onRequestClose={() => setShowTokens(false)}>
          <SafeAreaProvider>
            <ThemePreviewScreen onClose={() => setShowTokens(false)} />
            <StatusBar style="dark" />
          </SafeAreaProvider>
        </Modal>
      )}
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
