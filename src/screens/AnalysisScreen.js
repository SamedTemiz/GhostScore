import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, DARK_COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const dc = DARK_COLORS;

const MESSAGES = [
  { text: 'Profil inceleniyor',               emoji: '👻' },
  { text: 'Gizli gözetçiler aranıyor',         emoji: '🕵️' },
  { text: 'Takipçi listesi taranıyor',         emoji: '📋' },
  { text: 'Story geçmişi analiz ediliyor',     emoji: '👁️' },
  { text: 'Mute listesi çözümleniyor',         emoji: '🔇' },
  { text: 'Takibi bırakanlar hesaplanıyor',    emoji: '📊' },
  { text: 'Sosyal hayatın haritalanıyor',      emoji: '🗺️' },
  { text: 'Gizli bağlantılar tespit ediliyor', emoji: '🔗' },
  { text: 'Sonuçlar hazırlanıyor',             emoji: '✨' },
];

const MIN_DURATION = 5000; // ms — minimum screen time
const MSG_INTERVAL = 600;  // ms per message

export default function AnalysisScreen({ navigation }) {
  const { data } = useAuth();
  const [msgIndex, setMsgIndex] = useState(0);
  const [minDone, setMinDone] = useState(false);

  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const scaleAnim    = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  // Cycle messages with fade + scale
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.85, duration: 180, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <Animated.View style={[styles.msgBox, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>{msg.emoji}</Text>
          <Text style={styles.message}>{msg.text}</Text>
          <Text style={[styles.dots, { color: dc.purple }]}>...</Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <Text style={styles.footer}>@{data?.profile?.username ?? 'hesap'} analiz ediliyor</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: dc.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },

  msgBox:  { alignItems: 'center', marginBottom: SPACING.xl * 2 },
  emoji:   { fontSize: 72, marginBottom: SPACING.lg },
  message: { fontSize: 22, fontWeight: '700', color: dc.textPrimary, textAlign: 'center', lineHeight: 30 },
  dots:    { fontSize: 28, marginTop: SPACING.sm, letterSpacing: 4 },

  progressTrack: {
    width: '75%', height: 5, backgroundColor: dc.border,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: 5, backgroundColor: dc.purple, borderRadius: 3 },

  footer: { color: dc.textMuted, fontSize: 13, marginTop: SPACING.lg },
});
