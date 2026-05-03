import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, RADIUS } from '../constants/theme';
import { AD_UNIT_IDS } from '../constants/ads';

const { width, height } = Dimensions.get('window');

const GHOST_ASSETS = [
  require('../../assets/main/Top_View.png'),
  require('../../assets/main/Left_Profile.png'),
  require('../../assets/main/Right_Profile.png'),
  require('../../assets/main/Shy_Mode.png'),
  require('../../assets/main/Surprised_Ghost.png'),
  require('../../assets/main/Suspicious_Look.png'),
  require('../../assets/main/Happy_Spectator.png'),
  require('../../assets/main/instagram_logo.webp'),
];

const MESSAGES = [
  'Profil inceleniyor',
  'Gizli gözetçiler aranıyor',
  'Takipçi listesi taranıyor',
  'Story geçmişi analiz ediliyor',
  'Mute listesi çözümleniyor',
  'Takibi bırakanlar hesaplanıyor',
  'Sosyal hayatın haritalanıyor',
  'Gizli bağlantılar tespit ediliyor',
  'Story etkileşimleri puanlanıyor',
  'Profil popülerliği hesaplanıyor',
  'Sonuçlar hazırlanıyor',
];

const MIN_DURATION = 12000; // 12 saniye
const MSG_INTERVAL = 2500;
const TIMEOUT_MS   = 120000; // 120s sonra hata ekranı

// ── Arka plan ghost bileşeni ───────────────────────────────────
function BackgroundGhost({ delay = 0 }) {
  const xAnim = useRef(new Animated.Value(-150)).current;
  const ghostIdx = useRef(Math.floor(Math.random() * GHOST_ASSETS.length)).current;
  
  // Tüm rastgele değerleri useRef ile sabitle ki render sırasında değişmesinler
  const isIG = ghostIdx === GHOST_ASSETS.length - 1;
  const sizeRef = useRef(isIG ? (Math.random() * 20 + 25) : (Math.random() * 30 + 50)).current;
  const yPosRef  = useRef(Math.random() * height).current;
  const durationRef = useRef(Math.random() * 4000 + 6000).current;
  const directionRef = useRef(Math.random() > 0.5 ? 1 : -1).current;
  const scaleRef = useRef(Math.random() * 0.4 + 0.8).current; 

  useEffect(() => {
    const startX = directionRef === 1 ? -150 : width + 50;
    const endX   = directionRef === 1 ? width + 50 : -150;
    
    const runAnim = () => {
      xAnim.setValue(startX);
      Animated.timing(xAnim, {
        toValue: endX,
        duration: durationRef,
        useNativeDriver: true,
      }).start(() => {
        runAnim();
      });
    };

    const t = setTimeout(runAnim, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.Image
      source={GHOST_ASSETS[ghostIdx]}
      style={[
        styles.bgGhost,
        { 
          top: yPosRef,
          width: sizeRef,
          height: sizeRef,
          transform: [
            { translateX: xAnim },
            { scaleX: directionRef === -1 ? -scaleRef : scaleRef },
            { scaleY: scaleRef }
          ] 
        }
      ]}
    />
  );
}

export default function AnalysisScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { user, data, analysisError, loginWithSession, refreshData } = useAuth();
  const [msgIndex, setMsgIndex] = useState(0);
  const [minDone, setMinDone]   = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [reanalysisError, setReanalysisError] = useState(null);
  // reanalysis modunda data değişimini izlemek için ref — ilk mount'taki data'yı yoksay
  const prevDataRef = useRef(data);

  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const scaleAnim    = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatAnim    = useRef(new Animated.Value(0)).current;
  const timeoutRef   = useRef(null);

  // Progress bar: MIN_DURATION'a kadar %85'e dolar, sonra data gelene kadar bekler
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.85, duration: MIN_DURATION, useNativeDriver: false,
    }).start();
    const t = setTimeout(() => setMinDone(true), MIN_DURATION);
    return () => clearTimeout(t);
  }, []);

  // Hard timeout
  useEffect(() => {
    timeoutRef.current = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // Ana Ghost float
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Mesaj döngüsü
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, MSG_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const params = navigation.getState().routes.find(r => r.name === 'Analysis')?.params ?? {};
  const isSimulation  = params.simulation;
  const sessionId     = params.sessionId;
  const isReanalysis  = params.reanalysis === true;

  // sessionId ile backend login çağrısı
  useEffect(() => {
    if (!sessionId) return;
    loginWithSession(sessionId).catch(() => {});
  }, [sessionId]);

  // Yeniden analiz modu: refreshData() çağır
  useEffect(() => {
    if (!isReanalysis) return;
    refreshData().catch((err) => {
      clearTimeout(timeoutRef.current);
      setReanalysisError(err.message || 'Analiz başarısız oldu. Lütfen tekrar dene.');
    });
  }, [isReanalysis]);

  // Başarılı → Interstitial göster → Results'a geç
  useEffect(() => {
    // Reanalysis modunda: data öncekinden farklılaşınca tetikle (mount'taki data değil)
    const dataReady = isReanalysis
      ? (data && data !== prevDataRef.current)
      : (data || isSimulation);

    if (dataReady && minDone && !timedOut) {
      clearTimeout(timeoutRef.current);
      Animated.timing(progressAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();

      const goToResults = () => {
        navigation.reset({ index: 0, routes: [{ name: 'Results' }] });
      };

      const interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);
      const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, goToResults);
      const unsubError  = interstitial.addAdEventListener(AdEventType.ERROR, goToResults);
      const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitial.show();
      });

      const t = setTimeout(() => {
        interstitial.load();
      }, 600);

      return () => {
        clearTimeout(t);
        unsubClosed();
        unsubError();
        unsubLoaded();
      };
    }
  }, [data, minDone, isSimulation, isReanalysis]);

  const msg = MESSAGES[msgIndex];
  const hasError = (isReanalysis ? reanalysisError : analysisError) || timedOut;
  const errorMsg = (isReanalysis ? reanalysisError : analysisError) || 'Analiz zaman aşımına uğradı. Lütfen tekrar dene.';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (hasError) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <Image source={GHOST_ASSETS[4]} style={styles.analysisGhost} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Bir sorun oluştu</Text>
          <Text style={[styles.errorMsg, { color: colors.textMuted }]}>{errorMsg}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.purple }]}
            onPress={() => isReanalysis
              ? navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
              : navigation.replace('Login')
            }
            activeOpacity={0.85}
          >
            <Text style={styles.retryBtnText}>{isReanalysis ? 'Dashboard\'a Dön' : 'Geri Dön'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Arka plan ghostları - Daha yoğun (24 adet) */}
      {[...Array(24)].map((_, i) => (
        <BackgroundGhost key={i} delay={i * 600} />
      ))}

      <View style={styles.container}>
        <Animated.Image
          source={GHOST_ASSETS[0]}
          style={[styles.analysisGhost, { transform: [{ translateY: floatAnim }] }]}
        />

        <Animated.View style={[styles.msgBox, { opacity: fadeAnim }]}>
          <Text style={[styles.message, { color: colors.textPrimary }]}>{msg}</Text>
          <Text style={[styles.dots, { color: colors.purple }]}>...</Text>
        </Animated.View>

        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.purple }]} />
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          {user?.username || data?.profile?.username
            ? `@${user?.username || data?.profile?.username} analiz ediliyor`
            : 'Instagram hesabın analiz ediliyor'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, zIndex: 10 },

  bgGhost: {
    position: 'absolute',
    width: 80,
    height: 80,
    opacity: 0.15,
    zIndex: 1,
  },

  analysisGhost: { width: 140, height: 140, marginBottom: SPACING.xl },
  msgBox:   { alignItems: 'center', marginBottom: SPACING.xl * 2 },
  message:  { fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 30 },
  dots:     { fontSize: 28, marginTop: SPACING.sm, letterSpacing: 4 },

  progressTrack: { width: '75%', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },

  footer: { fontSize: 13, marginTop: SPACING.lg },

  errorTitle: { fontSize: 24, fontWeight: '800', marginBottom: SPACING.md, textAlign: 'center' },
  errorMsg:   { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  retryBtn: {
    borderRadius: RADIUS.full, paddingVertical: 14,
    paddingHorizontal: SPACING.xl * 2, alignItems: 'center',
  },
  retryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
