import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Dimensions, Animated, Image,
} from 'react-native';

const MASCOT = require('../../assets/main/Default_Pose.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ViewIcon, NotificationBlock01Icon, BadgeAlertIcon } from '@hugeicons/core-free-icons';
import { SPACING, RADIUS, DARK_COLORS, LIGHT_COLORS, SHADOWS, GLOSS } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const CARD_W = width * 0.78;

const GHOST_ASSETS = [
  require('../../assets/main/Top_View.png'),
  require('../../assets/main/Left_Profile.png'),
  require('../../assets/main/Right_Profile.png'),
  require('../../assets/main/Shy_Mode.png'),
  require('../../assets/main/Surprised_Ghost.png'),
  require('../../assets/main/Suspicious_Look.png'),
  require('../../assets/main/Happy_Spectator.png'),
];

function BackgroundGhost({ delay = 0 }) {
  const xAnim    = useRef(new Animated.Value(-150)).current;
  const ghostIdx = useRef(Math.floor(Math.random() * GHOST_ASSETS.length)).current;
  const sizeRef  = useRef(Math.random() * 30 + 50).current;
  const yPosRef  = useRef(Math.random() * height).current;
  const durRef   = useRef(Math.random() * 4000 + 6000).current;
  const dirRef   = useRef(Math.random() > 0.5 ? 1 : -1).current;
  const scaleRef = useRef(Math.random() * 0.4 + 0.8).current;

  useEffect(() => {
    const startX = dirRef === 1 ? -150 : width + 50;
    const endX   = dirRef === 1 ? width + 50 : -150;
    const loop = () => {
      xAnim.setValue(startX);
      Animated.timing(xAnim, { toValue: endX, duration: durRef, useNativeDriver: true }).start(loop);
    };
    const t = setTimeout(loop, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.Image
      source={GHOST_ASSETS[ghostIdx]}
      style={[
        styles.bgGhost,
        {
          top: yPosRef,
          width: sizeRef, height: sizeRef,
          transform: [
            { translateX: xAnim },
            { scaleX: dirRef === -1 ? -scaleRef : scaleRef },
            { scaleY: scaleRef },
          ],
        },
      ]}
    />
  );
}

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
          <HugeiconsIcon icon={icon} size={20} color={accent} />
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

      {[...Array(24)].map((_, i) => (
        <BackgroundGhost key={i} delay={i * 600} />
      ))}

      <View style={styles.container}>
        {/* Animated preview cards */}
        <View style={styles.cardsArea}>
          <PreviewCard
            color={cardColors.cardPurple} icon={ViewIcon} label="Stalkers" value="5 kişi" accent={cardColors.purple}
            rotate="-10deg" top={8} left={width * 0.04} chartType="wave"
            floatY={float1}
          />
          <PreviewCard
            color={cardColors.cardMauve} icon={NotificationBlock01Icon} label="Hayalet" value="4 kişi" accent={cardColors.mauve}
            rotate="5deg" top={52} left={width * 0.10}
            floatY={float2}
          />
          <PreviewCard
            color={cardColors.cardTeal} icon={BadgeAlertIcon} label="Unfollowers" value="6 kişi" accent={cardColors.teal}
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
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={styles.btnPrimaryText}>Başla →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'space-between', paddingBottom: SPACING.xl, zIndex: 1 },

  bgGhost: {
    position: 'absolute',
    opacity: 0.15,
    zIndex: 0,
  },

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
