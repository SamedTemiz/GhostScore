import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS } from '../constants/theme';

const GHOST_IMAGES = [
  require('../../assets/main/Default_Pose.png'),
  require('../../assets/main/Suspicious_Look.png'),
  require('../../assets/main/Shy_Mode.png'),
];

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  const { colors } = useTheme();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const float0 = useRef(new Animated.Value(0)).current;
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -12, duration: 1600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0,   duration: 1600, useNativeDriver: true }),
        ]),
      );
    const l0 = makeLoop(float0, 0);
    const l1 = makeLoop(float1, 300);
    const l2 = makeLoop(float2, 600);
    l0.start(); l1.start(); l2.start();
    return () => { l0.stop(); l1.stop(); l2.stop(); };
  }, []);

  const SLIDES = [
    {
      title: 'GhostScore\'a\nHoş Geldin!',
      subtitle: 'Instagram hesabının gerçek sosyal etkisini keşfet. Gizli gözetçilerden takip bırakanlara — hepsi burada.',
      accent: colors.purple,
    },
    {
      title: 'Stalker\'ları\nBul',
      subtitle: 'Seni takip etmeden story\'lerini izleyen gizli gözetçileri tek tıkla tespit et.',
      accent: colors.mauve,
    },
    {
      title: 'Sessiz\nGözlemciler',
      subtitle: 'Seni mute\'layan veya takibi bırakan hesapları gerçek zamanlı gör. Artık gizli sırlar yok.',
      accent: colors.teal,
    },
  ];

  const goTo = (i) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      goTo(index + 1);
    } else {
      navigation.replace('Welcome');
    }
  };

  const slide = SLIDES[index];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      {/* Skip */}
      <TouchableOpacity onPress={() => navigation.replace('Welcome')} style={styles.skipBtn}>
        <Text style={[styles.skipText, { color: colors.textMuted }]}>Geç</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {SLIDES.map((s, i) => {
          const floatY = [float0, float1, float2][i];
          return (
            <View key={i} style={styles.slide}>
              <Animated.Image
                source={GHOST_IMAGES[i]}
                style={[styles.ghostImg, { transform: [{ translateY: floatY }] }]}
              />
              <Text style={[styles.title, { color: colors.textPrimary }]}>{s.title}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{s.subtitle}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[
              styles.dot,
              { backgroundColor: colors.border },
              i === index && { backgroundColor: slide.accent, width: 24 },
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity
        onPress={next}
        style={[styles.btn, { backgroundColor: slide.accent }]}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>
          {index === SLIDES.length - 1 ? 'Hadi Başlayalım →' : 'Sonraki →'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  skipBtn: { alignSelf: 'flex-end', marginTop: SPACING.sm, marginRight: SPACING.lg, padding: SPACING.sm },
  skipText: { fontSize: 14 },

  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  ghostImg: { width: 150, height: 150, marginBottom: SPACING.xl },
  title: {
    fontSize: 36, fontWeight: '800',
    textAlign: 'center', lineHeight: 44, marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: 15, textAlign: 'center', lineHeight: 24,
  },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: SPACING.lg },
  dot: { width: 8, height: 8, borderRadius: 4 },

  btn: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.xl,
    borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center',
  },
  btnText: { color: '#1A1200', fontSize: 16, fontWeight: '700' },
});
