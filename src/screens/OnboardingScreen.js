import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, RADIUS, DARK_COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');
const dc = DARK_COLORS;

const SLIDES = [
  {
    emoji: '👻',
    title: 'GhostScore\'a\nHoş Geldin!',
    subtitle: 'Instagram hesabının gerçek sosyal etkisini keşfet. Gizli gözetçilerden takip bırakanlara — hepsi burada.',
    accent: dc.purple,
  },
  {
    emoji: '👁️',
    title: 'Stalker\'ları\nBul',
    subtitle: 'Seni takip etmeden story\'lerini izleyen gizli gözetçileri tek tıkla tespit et.',
    accent: dc.mauve,
  },
  {
    emoji: '🔇',
    title: 'Sessiz\nGözlemciler',
    subtitle: 'Seni mute\'layan veya takibi bırakan hesapları gerçek zamanlı gör. Artık gizli sırlar yok.',
    accent: dc.teal,
  },
];

export default function OnboardingScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

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
    <SafeAreaView style={styles.safe}>
      {/* Skip */}
      <TouchableOpacity onPress={() => navigation.replace('Welcome')} style={styles.skipBtn}>
        <Text style={styles.skipText}>Geç</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={styles.slide}>
            <View style={[styles.emojiCircle, { backgroundColor: s.accent + '20' }]}>
              <Text style={styles.emoji}>{s.emoji}</Text>
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[
              styles.dot,
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
  safe: { flex: 1, backgroundColor: dc.background },

  skipBtn: { alignSelf: 'flex-end', marginTop: SPACING.sm, marginRight: SPACING.lg, padding: SPACING.sm },
  skipText: { color: dc.textMuted, fontSize: 14 },

  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emojiCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 36, fontWeight: '800', color: dc.textPrimary,
    textAlign: 'center', lineHeight: 44, marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: 15, color: dc.textMuted, textAlign: 'center', lineHeight: 24,
  },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: SPACING.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: dc.border },

  btn: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.xl,
    borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center',
  },
  btnText: { color: '#1A1200', fontSize: 16, fontWeight: '700' },
});
