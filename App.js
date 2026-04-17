import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // No más seed local, las categorías están en Firestore
      } catch (e) {
        console.warn('Prepare error:', e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded && appReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appReady]);

  if (!fontsLoaded || !appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.amarillo} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center' }}>
      <View style={{
        flex: 1,
        width: '100%',
        maxWidth: Platform.OS === 'web' ? 480 : '100%',
        overflow: 'hidden',
        backgroundColor: colors.bg,
        borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
        borderRightWidth: Platform.OS === 'web' ? 1 : 0,
        borderColor: colors.border
      }}>
        <StatusBar hidden={true} translucent={true} />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </View>
    </View>
  );
}
