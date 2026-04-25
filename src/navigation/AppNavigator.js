import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

import OnboardingScreen    from '../screens/OnboardingScreen';
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

export default function AppNavigator() {
  const { colors, isDark } = useTheme();

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

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding"  component={OnboardingScreen} />
        <Stack.Screen name="Welcome"     component={WelcomeScreen} />
        <Stack.Screen name="Login"       component={LoginScreen} />
        <Stack.Screen name="Analysis"    component={AnalysisScreen} />
        <Stack.Screen name="Results"     component={ResultsScreen} />
        <Stack.Screen name="Main"        component={DashboardScreen} />
        <Stack.Screen name="Stalkers"    component={StalkersScreen} />
        <Stack.Screen name="Muted"       component={MutedScreen} />
        <Stack.Screen name="Unfollowers" component={UnfollowersScreen} />
        <Stack.Screen name="Settings"      component={SettingsScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
