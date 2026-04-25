import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Dimensions, Animated, Image,
} from 'react-native';

const MASCOT = require('../../assets/main/Default_Pose.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, DARK_COLORS, LIGHT_COLORS, SHADOWS, GLOSS } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.78;

const WAVE = [0.3, 0.9, 0.4, 1.0, 0.3, 0.85, 0.5, 0.95, 0.4, 0.7];
const BARS = [0.4, 0.7, 0.55, 0.9, 0.6, 0.8, 0.5];

function useFloatAnim(delay = 0, amplitude = 10, duration = 2200) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: -amplitude, duration, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

function PreviewCard({ color, icon, label, value, rotate, top, left, chartType = 'bars', floatY, accent }) {
  const data = chartType === 'wave' ? WAVE : BARS;
  return (
    <Animated.View
      style={[
        styles.previewCard,
        { backgroundColor: color, transform: [{ rotate }, { translateY: floatY }], top, left, width: CARD_W },
        SHADOWS.glass,
        GLOSS
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: accent + '20' }]}>
          <Ionicons name={icon} size={20} color={accent} />
        </View>
        <View style={[styles.chartArea, chartType === 'wave' && styles.chartAreaWave]}>
          {data.map((h, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                { backgroundColor: accent, opacity: 0.3 },
                chartType === 'wave'
                  ? { height: h * 22, width: 3, marginHorizontal: 1.5 }
                  : { height: h * 34, width: 6, marginHorizontal: 2 },
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={[styles.cardLabel, { color: accent }]}>{label}</Text>
      <Text style={[styles.cardValue, { color: accent }]}>{value}</Text>
    </Animated.View>
  );
}

export default function WelcomeScreen({ navigation }) {
  const colors = DARK_COLORS;
  // Kartlar için referans görseldeki PASTEL renkleri kullanıyoruz
  const cardColors = LIGHT_COLORS;

  const float1 = useFloatAnim(0,    10, 2400);
  const float2 = useFloatAnim(400,  8,  2000);
  const float3 = useFloatAnim(800,  12, 2600);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        {/* Animated preview cards */}
        <View style={styles.cardsArea}>
          <PreviewCard
            color={cardColors.cardPurple} icon="eye-outline" label="Stalkers" value="5 kişi" accent={cardColors.purple}
            rotate="-10deg" top={8} left={width * 0.04} chartType="wave"
            floatY={float1}
          />
          <PreviewCard
            color={cardColors.cardMauve} icon="notifications-off-outline" label="Muted" value="4 kişi" accent={cardColors.mauve}
            rotate="5deg" top={52} left={width * 0.10}
            floatY={float2}
          />
          <PreviewCard
            color={cardColors.cardTeal} icon="alert-circle-outline" label="Unfollowers" value="6 kişi" accent={cardColors.teal}
            rotate="-2deg" top={96} left={width * 0.16}
            floatY={float3}
          />
        </View>

        {/* Headline */}
        <View style={styles.headline}>
          <Text style={[styles.headlineSub1, { color: colors.textSecondary }]}>Sosyal auronu</Text>
          <Text style={[styles.headlineBold, { color: colors.textPrimary }]}>keşfet.</Text>
          <View style={styles.headlineBodyRow}>
            <Text style={[styles.headlineBody, { color: colors.textMuted, flex: 1 }]}>
              Kim seni takip ediyor, kim mute'ladı,{'\n'}kim sessizce izliyor — hepsini gör.
            </Text>
          </View>
        </View>

        {/* Single CTA */}
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: colors.gold }, SHADOWS.glowGold, GLOSS]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.btnPrimaryText}>Başla →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'space-between', paddingBottom: SPACING.xl },

  cardsArea:   { height: 320, marginTop: SPACING.lg, position: 'relative' },
  previewCard: { position: 'absolute', borderRadius: RADIUS.lg, padding: SPACING.md, paddingBottom: SPACING.lg },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.md },
  iconBox:     { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  chartArea:     { flexDirection: 'row', alignItems: 'flex-end', height: 40 },
  chartAreaWave: { height: 28 },
  bar:           { borderRadius: 3 },
  cardLabel:     { fontSize: 13, fontWeight: '500' },
  cardValue:     { fontSize: 26, fontWeight: '800', marginTop: 2 },

  headline:     { marginTop: SPACING.lg },
  headlineSub1: { fontSize: 30, fontWeight: '400' },
  headlineBold: { fontSize: 44, fontWeight: '800', lineHeight: 48, marginBottom: SPACING.md },
  headlineBodyRow: { flexDirection: 'row', alignItems: 'flex-end' },
  headlineBody: { fontSize: 14, lineHeight: 22 },

  btnPrimary:     { borderRadius: RADIUS.full, paddingVertical: 18, alignItems: 'center' },
  btnPrimaryText: { color: '#1A1200', fontSize: 17, fontWeight: '800' },
});
