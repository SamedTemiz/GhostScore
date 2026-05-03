import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, StatusBar, Animated, Dimensions, Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon, ArrowRight01Icon, LockIcon, Refresh01Icon, InstagramIcon, UserGroupIcon, ViewIcon, CheckmarkCircle01Icon, ShieldKeyIcon } from '@hugeicons/core-free-icons';
import CookieManager from '@react-native-cookies/cookies';
import * as Device from 'expo-device';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS, GLOSS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const IG_LOGIN_URL  = 'https://www.instagram.com/accounts/login/';
const IG_COLOR      = '#E1306C';
const IG_GRADIENT   = '#833AB4';

// expo-device: Platform.constants'tan daha güvenilir, native modülle doğrudan bağlantı kurar
function buildChromeUA() {
  const model   = Device.modelName  || Device.deviceName  || 'SM-A546B';
  const release = Device.osVersion  || '12';
  return (
    `Mozilla/5.0 (Linux; Android ${release}; ${model}) ` +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/124.0.6367.82 Mobile Safari/537.36'
  );
}

const ANTI_DETECTION_JS = `
  (function() {
    try {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
      if (!window.chrome) {
        window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
      }
    } catch(e) {}
  })();
  true;
`;

const LOGIN_BLOCKED_PATHS = [
  '/accounts/login', '/accounts/signup', '/accounts/emailsignup',
  '/challenge/', '/two_factor',
];

const POST_LOGIN_PATHS = [
  '/accounts/onetap', '/accounts/emails', '/accounts/privacy',
  '/accounts/nonce', '/accounts/security', '/?variant=', '/#',
];

const GHOST_ASSETS = [
  require('../../assets/main/Top_View.png'),
  require('../../assets/main/Left_Profile.png'),
  require('../../assets/main/Shy_Mode.png'),
  require('../../assets/main/Suspicious_Look.png'),
  require('../../assets/main/Happy_Spectator.png'),
];

function isLoginSuccess(url) {
  if (!url || !url.startsWith('https://www.instagram.com')) return false;
  if (LOGIN_BLOCKED_PATHS.some(p => url.includes(p))) return false;
  if (POST_LOGIN_PATHS.some(p => url.includes(p))) return true;
  // Ana sayfa veya profil sayfası = giriş başarılı
  const path = url.replace('https://www.instagram.com', '');
  if (path === '/' || path === '' || /^\/[^/]+\/?$/.test(path)) return true;
  return false;
}

// ── Arka plan ghost ────────────────────────────────────────────
function BgGhost({ delay }) {
  const x      = useRef(new Animated.Value(-120)).current;
  const idx    = useRef(Math.floor(Math.random() * GHOST_ASSETS.length)).current;
  const sz     = useRef(Math.random() * 28 + 40).current;
  const yPos   = useRef(Math.random() * height).current;
  const dur    = useRef(Math.random() * 4000 + 8000).current;
  const dir    = useRef(Math.random() > 0.5 ? 1 : -1).current;
  const sc     = useRef(Math.random() * 0.35 + 0.75).current;

  useEffect(() => {
    const s = dir === 1 ? -120 : width + 40;
    const e = dir === 1 ? width + 40 : -120;
    const loop = () => {
      x.setValue(s);
      Animated.timing(x, { toValue: e, duration: dur, useNativeDriver: true }).start(loop);
    };
    const t = setTimeout(loop, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.Image
      source={GHOST_ASSETS[idx]}
      style={{
        position: 'absolute', top: yPos,
        width: sz, height: sz, opacity: 0.10, zIndex: 0,
        transform: [{ translateX: x }, { scaleX: dir === -1 ? -sc : sc }, { scaleY: sc }],
      }}
    />
  );
}

// ── Floating ghost animasyonu (loading ekranı) ─────────────────
function FloatingGhost({ source, size = 110 }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -14, duration: 1100, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0,   duration: 1100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.Image source={source} style={{ width: size, height: size, transform: [{ translateY: y }] }} />
  );
}

// ── İzin satırı ────────────────────────────────────────────────
function PermRow({ icon, text, color, colors }) {
  return (
    <View style={styles.permRow}>
      <View style={[styles.permIconWrap, { backgroundColor: color + '18' }]}>
        <HugeiconsIcon icon={icon} size={16} color={color} />
      </View>
      <Text style={[styles.permText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

// ── Ana bileşen ────────────────────────────────────────────────
export default function InstagramAuthScreen({ navigation }) {
  const { colors }          = useTheme();
  const { loginWithSession } = useAuth();

  // 'intro' | 'webview' | 'loading' | 'error'
  const [status, setStatus]    = useState('intro');
  const [errorMsg, setErrorMsg] = useState('');
  const [webviewKey, setWebviewKey] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);

  const handledRef = useRef(false);
  const introFade  = useRef(new Animated.Value(0)).current;
  const introPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(introFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(introPulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(introPulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleLoginSuccess = async () => {
    if (handledRef.current) return;
    handledRef.current = true;
    setStatus('loading');
    try {
      await new Promise(r => setTimeout(r, 600));
      const cookies   = await CookieManager.get('https://www.instagram.com');
      const sessionId = cookies?.sessionid?.value;
      if (!sessionId) throw new Error('Oturum cookie\'si okunamadı. Tam giriş yaptığından emin ol.');
      await loginWithSession(sessionId);
      navigation.replace('Analysis');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Giriş başarısız oldu.');
      handledRef.current = false;
    }
  };

  const retry = () => {
    handledRef.current = false;
    setErrorMsg('');
    setWebviewKey(k => k + 1);
    setStatus('intro');
  };

  // ── INTRO ──────────────────────────────────────────────────────
  if (status === 'intro') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />

        {[...Array(10)].map((_, i) => <BgGhost key={i} delay={i * 900} />)}

        <Animated.View style={[styles.introWrap, { opacity: introFade }]}>
          {/* Geri butonu */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <HugeiconsIcon icon={ArrowLeft02Icon} size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Logo köprüsü */}
          <View style={styles.logoRow}>
            <Animated.View style={[styles.appLogoWrap, { backgroundColor: colors.purple }, SHADOWS.glowPurple, { transform: [{ scale: introPulse }] }]}>
              <Image source={require('../../assets/main/Default_Pose.png')} style={styles.appLogoImg} />
            </Animated.View>

            <View style={styles.logoDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.logoDot, { backgroundColor: colors.border, opacity: 0.5 + i * 0.2 }]} />
              ))}
            </View>

            <View style={[styles.igLogoWrap, { backgroundColor: IG_COLOR }, SHADOWS.soft]}>
              <HugeiconsIcon icon={InstagramIcon} size={28} color="#fff" />
            </View>
          </View>

          {/* Başlık */}
          <Text style={[styles.introTitle, { color: colors.textPrimary }]}>
            Instagram'a Güvenle Bağlan
          </Text>
          <Text style={[styles.introSub, { color: colors.textMuted }]}>
            Instagram'ın kendi giriş sayfasını açıyoruz.{'\n'}Şifren bize asla ulaşmaz.
          </Text>

          {/* İzin kartı */}
          <View style={[styles.permCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.permCardTitle, { color: colors.textMuted }]}>GhostScore şunları yapacak</Text>
            <PermRow icon={UserGroupIcon}         text="Takipçi ve takip listeni analiz eder"         color={colors.purple} colors={colors} />
            <PermRow icon={ViewIcon}              text="Story izleyicilerini tespit eder"              color={colors.teal}   colors={colors} />
            <PermRow icon={CheckmarkCircle01Icon} text="Hayalet skor ve görünürlüğünü hesaplar"        color={colors.gold}   colors={colors} />

            <View style={[styles.permDivider, { backgroundColor: colors.border }]} />

            <PermRow icon={LockIcon}              text="Şifreni asla görmez, saklamaz"                color={colors.mauve}  colors={colors} />
            <PermRow icon={ShieldKeyIcon}         text="Herhangi bir şeyi değiştirmez veya paylaşmaz" color={colors.mauve}  colors={colors} />
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.gold }, SHADOWS.glowGold, GLOSS]}
            onPress={async () => {
              try { await CookieManager.clearAll(true); } catch {}
              setStatus('webview');
            }}
            activeOpacity={0.88}
          >
            <HugeiconsIcon icon={InstagramIcon} size={18} color="#1A1200" />
            <Text style={styles.ctaBtnText}>Instagram'ı Aç</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#1A1200" />
          </TouchableOpacity>

          {/* Alt güvenlik notu */}
          <View style={styles.secureRow}>
            <HugeiconsIcon icon={LockIcon} size={11} color={colors.textMuted} />
            <Text style={[styles.secureText, { color: colors.textMuted }]}>
              instagram.com üzerinden şifreli bağlantı
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── WEBVIEW ────────────────────────────────────────────────────
  if (status === 'webview') {
    const chromeUA = buildChromeUA();
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={[styles.webHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStatus('intro')} style={styles.webHeaderBtn}>
            <HugeiconsIcon icon={ArrowLeft02Icon} size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.urlBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <HugeiconsIcon icon={LockIcon} size={12} color="#4CAF50" />
            <Text style={[styles.urlText, { color: colors.textSecondary }]}>instagram.com</Text>
          </View>

          <TouchableOpacity
            onPress={handleLoginSuccess}
            style={[styles.continueBtn, { backgroundColor: colors.teal }]}
          >
            <Text style={styles.continueBtnText}>Devam Et</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        {loadProgress > 0 && loadProgress < 1 && (
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${loadProgress * 100}%`, backgroundColor: IG_COLOR }]} />
          </View>
        )}

        <WebView
          key={webviewKey}
          source={{ uri: IG_LOGIN_URL }}
          userAgent={chromeUA}
          injectedJavaScriptBeforeContentLoaded={ANTI_DETECTION_JS}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          onNavigationStateChange={s => { if (isLoginSuccess(s.url)) handleLoginSuccess(); }}
          onLoadProgress={({ nativeEvent }) => setLoadProgress(nativeEvent.progress)}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.centerOverlay, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={IG_COLOR} />
              <Text style={[styles.loadText, { color: colors.textMuted }]}>Yükleniyor…</Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        {[...Array(8)].map((_, i) => <BgGhost key={i} delay={i * 700} />)}
        <View style={[styles.center, { zIndex: 1 }]}>
          <FloatingGhost source={require('../../assets/main/Happy_Spectator.png')} />
          <Text style={[styles.statusTitle, { color: colors.textPrimary, marginTop: SPACING.xl }]}>
            Giriş yapılıyor…
          </Text>
          <Text style={[styles.statusSub, { color: colors.textMuted }]}>
            Oturum okunuyor, veriler hazırlanıyor
          </Text>
          <ActivityIndicator size="small" color={colors.purple} style={{ marginTop: SPACING.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  // ── ERROR ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      {[...Array(6)].map((_, i) => <BgGhost key={i} delay={i * 800} />)}
      <View style={[styles.center, { zIndex: 1 }]}>
        <FloatingGhost source={require('../../assets/main/Surprised_Ghost.png')} />
        <Text style={[styles.statusTitle, { color: colors.textPrimary, marginTop: SPACING.xl }]}>
          Bir sorun oluştu
        </Text>
        <Text style={[styles.statusSub, { color: colors.textMuted }]}>{errorMsg}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.purple }, SHADOWS.glowPurple]}
          onPress={retry}
          activeOpacity={0.85}
        >
          <HugeiconsIcon icon={Refresh01Icon} size={16} color="#fff" />
          <Text style={styles.retryBtnText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // ── Intro ──────────────────────────────────────────────────
  introWrap: { flex: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, zIndex: 1 },
  backBtn:   { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xs },

  logoRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xl },
  appLogoWrap:{ width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  appLogoImg: { width: 52, height: 52 },
  logoDots:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: SPACING.md },
  logoDot:    { width: 6, height: 6, borderRadius: 3 },
  igLogoWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  introTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.sm },
  introSub:   { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: SPACING.xl },

  permCard:      { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.xl },
  permCardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.md },
  permRow:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  permIconWrap:  { width: 30, height: 30, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  permText:      { fontSize: 14, flex: 1, lineHeight: 19 },
  permDivider:   { height: 1, marginVertical: SPACING.sm },

  ctaBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderRadius: RADIUS.full, paddingVertical: SPACING.md + 2, marginBottom: SPACING.md },
  ctaBtnText: { color: '#1A1200', fontSize: 16, fontWeight: '800' },

  secureRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  secureText: { fontSize: 11 },

  // ── WebView ────────────────────────────────────────────────
  webHeader:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, gap: SPACING.sm },
  webHeaderBtn:   { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  continueBtn:    { borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6 },
  continueBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  urlBar:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 7 },
  urlText:      { fontSize: 13, fontWeight: '500' },
  progressTrack: { height: 2 },
  progressFill:  { height: 2 },
  webview:       { flex: 1 },

  centerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadText:      { fontSize: 14 },

  // ── Loading / Error ────────────────────────────────────────
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, gap: SPACING.md },
  statusTitle:  { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  statusSub:    { fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 300 },
  retryBtn:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full, marginTop: SPACING.sm },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
