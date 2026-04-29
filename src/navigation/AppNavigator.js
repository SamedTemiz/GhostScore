import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { tokenStore } from '../services/api';

import OnboardingScreen    from '../screens/OnboardingScreen';
import InstagramAuthScreen from '../screens/InstagramAuthScreen';
import WelcomeScreen       from '../screens/WelcomeScreen';
import LoginScreen         from '../screens/LoginScreen';
import AnalysisScreen      from '../screens/AnalysisScreen';
import ResultsScreen       from '../screens/ResultsScreen';
import DashboardScreen     from '../screens/DashboardScreen';
import SettingsScreen      from '../screens/SettingsScreen';
import StalkersScreen      from '../screens/StalkersScreen';
import MutedScreen         from '../screens/MutedScreen';
import UnfollowersScreen   from '../screens/UnfollowersScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

const Stack = createStackNavigator();
const GHOST  = require('../../assets/main/Default_Pose.png');

async function resolveInitialRoute() {
  const token = await tokenStore.getAccess();
  if (token) return 'Main';
  const done = await AsyncStorage.getItem('onboarding_done');
  return done ? 'Login' : 'Welcome';
}

// ── Animasyonlu JS splash ────────────────────────────────────────
function AnimatedSplash({ colors, onFinish }) {
  const ghostScale   = useRef(new Animated.Value(0.82)).current;
  const ghostOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const textY        = useRef(new Animated.Value(12)).current;
  const screenOp    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Ghost giriş
      Animated.parallel([
        Animated.spring(ghostScale,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(ghostOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      // Text giriş (100ms sonra)
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
      // 700ms bekle
      Animated.delay(700),
      // Tüm ekran fade-out
      Animated.timing(screenOp, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.splash, { backgroundColor: colors.background, opacity: screenOp }]}>
      <Animated.Image
        source={GHOST}
        style={[styles.ghost, { opacity: ghostOpacity, transform: [{ scale: ghostScale }] }]}
        resizeMode="contain"
      />
      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }] }}>
        <Text style={[styles.brand, { color: colors.textPrimary }]}>GhostScore</Text>
        <Text style={[styles.tagline, { color: colors.textMuted }]}>Instagram Analiz</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ── Ana navigator ────────────────────────────────────────────────
export default function AppNavigator() {
  const { colors, isDark } = useTheme();
  const [initialRoute, setInitialRoute] = useState(null);
  const [splashDone, setSplashDone]     = useState(false);

  useEffect(() => {
    resolveInitialRoute()
      .then(setInitialRoute)
      .finally(() => SplashScreen.hideAsync()); // native splash kapat
  }, []);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  // Native splash kapanana kadar (initialRoute null) hiçbir şey render etme
  if (!initialRoute) return null;

  // JS animasyonlu splash göster
  if (!splashDone) {
    return (
      <AnimatedSplash
        colors={colors}
        onFinish={() => setSplashDone(true)}
      />
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome"       component={WelcomeScreen} />
        <Stack.Screen name="Onboarding"    component={OnboardingScreen} />
        <Stack.Screen name="Login"         component={LoginScreen} />
        <Stack.Screen name="InstagramAuth" component={InstagramAuthScreen} />
        <Stack.Screen name="Analysis"      component={AnalysisScreen} />
        <Stack.Screen name="Results"       component={ResultsScreen} />
        <Stack.Screen name="Main"          component={DashboardScreen} />
        <Stack.Screen name="Stalkers"      component={StalkersScreen} />
        <Stack.Screen name="Muted"         component={MutedScreen} />
        <Stack.Screen name="Unfollowers"   component={UnfollowersScreen} />
        <Stack.Screen name="Settings"      component={SettingsScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  ghost: {
    width: 120,
    height: 120,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
