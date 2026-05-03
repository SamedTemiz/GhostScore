import * as SplashScreen from 'expo-splash-screen';
import 'react-native-gesture-handler';
import mobileAds from 'react-native-google-mobile-ads';

// Native splash ekranını JS hazır olana kadar açık tut
SplashScreen.preventAutoHideAsync();

// AdMob başlat
mobileAds().initialize().catch(() => {});

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
