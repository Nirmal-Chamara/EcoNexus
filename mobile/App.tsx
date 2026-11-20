import React, { useEffect } from 'react';
import { StyleSheet, View, Platform, DevSettings, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import RootNavigator from './src/navigation/RootNavigator';
import NetworkStatusBanner from './src/components/common/NetworkStatusBanner';
import ThemePreviewScreen from './src/screens/dev/ThemePreviewScreen';
import ComponentGalleryScreen from './src/screens/dev/ComponentGalleryScreen';
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
  const [showTokens, setShowTokens] = React.useState(false);
  const [showComponents, setShowComponents] = React.useState(false);

  React.useEffect(() => {
    if (__DEV__ && DevSettings?.addMenuItem) {
      DevSettings.addMenuItem('EcoNexus design tokens', () => setShowTokens(true));
      DevSettings.addMenuItem('EcoNexus component gallery', () => setShowComponents(true));
    }
  }, []);

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <AuthProvider>
        <View style={styles.canvas}>
          <View style={styles.phoneFrame}>
            <NetworkStatusBanner />
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
            <StatusBar style="auto" />
          </View>
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
