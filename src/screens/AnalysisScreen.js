import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING } from '../constants/theme';

const ANALYSIS_GHOST = require('../../assets/main/Top_View.png');

const MESSAGES = [
  'Profil inceleniyor',
  'Gizli gözetçiler aranıyor',
  'Takipçi listesi taranıyor',
  'Story geçmişi analiz ediliyor',
  'Mute listesi çözümleniyor',
  'Takibi bırakanlar hesaplanıyor',
  'Sosyal hayatın haritalanıyor',
  'Gizli bağlantılar tespit ediliyor',
  'Sonuçlar hazırlanıyor',
];

const MIN_DURATION = 5000; // ms — minimum screen time
const MSG_INTERVAL = 600;  // ms per message

export default function AnalysisScreen({ navigation }) {
  const { colors } = useTheme();
  const { data } = useAuth();
  const [msgIndex, setMsgIndex] = useState(0);
  const [minDone, setMinDone] = useState(false);

  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const scaleAnim    = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatAnim    = useRef(new Animated.Value(0)).current;

  // Progress bar fills over MIN_DURATION
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: MIN_DURATION,
      useNativeDriver: false,
    }).start();
    const t = setTimeout(() => setMinDone(true), MIN_DURATION);
    return () => clearTimeout(t);
  }, []);

  // Ghost float animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1400, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 1400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Cycle messages with fade + scale
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.85, duration: 180, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      ]).start();
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, MSG_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Navigate when data is ready AND min time passed
  useEffect(() => {
    if (data && minDone) {
      navigation.replace('Results');
    }
  }, [data, minDone]);

  const msg = MESSAGES[msgIndex];

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>

        <Animated.Image
          source={ANALYSIS_GHOST}
          style={[styles.analysisGhost, { transform: [{ translateY: floatAnim }] }]}
        />

        <Animated.View style={[styles.msgBox, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.message, { color: colors.textPrimary }]}>{msg}</Text>
          <Text style={[styles.dots, { color: colors.purple }]}>...</Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.purple }]} />
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>@{data?.profile?.username ?? 'hesap'} analiz ediliyor</Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },

  analysisGhost: { width: 110, height: 110, marginBottom: SPACING.xl },
  msgBox: { alignItems: 'center', marginBottom: SPACING.xl * 2 },
  message: { fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 30 },
  dots: { fontSize: 28, marginTop: SPACING.sm, letterSpacing: 4 },

  progressTrack: {
    width: '75%', height: 5,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3 },

  footer: { fontSize: 13, marginTop: SPACING.lg },

});
