import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, RADIUS, DARK_COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.78;
const dc = DARK_COLORS;

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

function PreviewCard({ color, icon, label, value, rotate, top, left, chartType = 'bars', floatY }) {
  const data = chartType === 'wave' ? WAVE : BARS;
  return (
    <Animated.View
      style={[
        styles.previewCard,
        { backgroundColor: color, transform: [{ rotate }, { translateY: floatY }], top, left, width: CARD_W },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View style={[styles.chartArea, chartType === 'wave' && styles.chartAreaWave]}>
          {data.map((h, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                chartType === 'wave'
                  ? { height: h * 22, width: 3, marginHorizontal: 1.5 }
                  : { height: h * 34, width: 6, marginHorizontal: 2 },
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </Animated.View>
  );
}

export default function WelcomeScreen({ navigation }) {
  const float1 = useFloatAnim(0,    10, 2400);
  const float2 = useFloatAnim(400,  8,  2000);
  const float3 = useFloatAnim(800,  12, 2600);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: dc.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={dc.background} />

      <View style={styles.container}>
        {/* Animated preview cards */}
        <View style={styles.cardsArea}>
          <PreviewCard
            color={dc.cardPurple} icon="👁️" label="Stalkers" value="5 kişi"
            rotate="-10deg" top={8} left={width * 0.04} chartType="wave"
            floatY={float1}
          />
          <PreviewCard
            color={dc.cardMauve} icon="🔇" label="Muted" value="4 kişi"
            rotate="5deg" top={52} left={width * 0.10}
            floatY={float2}
          />
          <PreviewCard
            color={dc.cardTeal} icon="🚨" label="Unfollowers" value="6 kişi"
            rotate="-2deg" top={96} left={width * 0.16}
            floatY={float3}
          />
        </View>

        {/* Headline */}
        <View style={styles.headline}>
          <Text style={[styles.headlineSub1, { color: dc.textSecondary }]}>Sosyal auronu</Text>
          <Text style={[styles.headlineBold, { color: dc.textPrimary }]}>keşfet.</Text>
          <Text style={[styles.headlineBody, { color: dc.textMuted }]}>
            Kim seni takip ediyor, kim mute'ladı,{'\n'}kim sessizce izliyor — hepsini gör.
          </Text>
        </View>

        {/* Single CTA */}
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: dc.gold }]}
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

  cardsArea:   { height: 285, marginTop: SPACING.lg, position: 'relative' },
  previewCard: { position: 'absolute', borderRadius: RADIUS.lg, padding: SPACING.md, paddingBottom: SPACING.lg },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.md },
  iconBox:     { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  chartArea:     { flexDirection: 'row', alignItems: 'flex-end', height: 40 },
  chartAreaWave: { height: 28 },
  bar:           { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 3 },
  cardLabel:     { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  cardValue:     { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 2 },

  headline:     { marginTop: SPACING.lg },
  headlineSub1: { fontSize: 30, fontWeight: '400' },
  headlineBold: { fontSize: 44, fontWeight: '800', lineHeight: 48, marginBottom: SPACING.md },
  headlineBody: { fontSize: 14, lineHeight: 22 },

  btnPrimary:     { borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { color: '#1A1200', fontSize: 17, fontWeight: '700' },
});
