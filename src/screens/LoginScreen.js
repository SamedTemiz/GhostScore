import { HugeiconsIcon } from '@hugeicons/react-native';
import { InstagramIcon, GearsIcon, ShieldKeyIcon } from '@hugeicons/core-free-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, Modal, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import { SPACING, RADIUS, SHADOWS, GLOSS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const IG_COLOR     = '#C13584';
const DEV_MODE_KEY = 'gs_dev_mode';
const IG_LOGIN_URL = 'https://www.instagram.com/accounts/login/';
const IG_HOME_URL  = 'https://www.instagram.com/';

export default function LoginScreen({ navigation }) {
  const { colors }                          = useTheme();
  const { loginWithSession, loginWithMock, loading, error, setError } = useAuth();

  const [devMode, setDevMode]               = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [webviewVisible, setWebviewVisible] = useState(false);
  const [webviewLoading, setWebviewLoading] = useState(true);
  const [extracting, setExtracting]         = useState(false);
  const [loggedInToIG, setLoggedInToIG]     = useState(false);

  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(DEV_MODE_KEY).then(v => { if (v === '1') setDevMode(true); });
  }, []);

  const handleFooterTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      const next = !devMode;
      setDevMode(next);
      AsyncStorage.setItem(DEV_MODE_KEY, next ? '1' : '0').catch(() => {});
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    }
  };

  const handleMockLogin = () => {
    loginWithMock();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const openWebView = async () => {
    await CookieManager.clearAll();
    if (setError) setError(null);
    setLoggedInToIG(false);
    setWebviewVisible(true);
    setWebviewLoading(true);
  };

  const extractAndLogin = async () => {
    if (extracting) return;
    setExtracting(true);
    try {
      const cookies = await CookieManager.get('https://www.instagram.com');
      const sessionId = cookies?.sessionid?.value;

      if (!sessionId) {
        setExtracting(false);
        if (setError) setError('Oturum bilgisi alınamadı. Lütfen Instagram\'a giriş yap.');
        return;
      }

      setWebviewVisible(false);
      navigation.reset({ index: 0, routes: [{ name: 'Analysis', params: { sessionId } }] });
    } catch (err) {
      setExtracting(false);
    }
  };

  const handleNavigationChange = async (navState) => {
    const { url } = navState;
    if (!url) return;

    const isLoginPage = url.includes('/accounts/login') || url.includes('/accounts/emailsignup');
    const isOnIG = url.startsWith('https://www.instagram.com') && !isLoginPage;

    if (isOnIG) setLoggedInToIG(true);

    const isHome = url === IG_HOME_URL || url === 'https://www.instagram.com' || url.startsWith('https://www.instagram.com/?');
    if (!isHome || extracting) return;

    await extractAndLogin();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.main}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.content}>

            {/* Başlık */}
            <View style={styles.header}>
              <View style={[styles.igIconWrap, SHADOWS.glowPurple]}>
                <HugeiconsIcon icon={InstagramIcon} size={36} color="#fff" />
              </View>
              <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Instagram ile Giriş Yap</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Instagram'ın güvenli giriş sayfası açılacak. Şifren bize iletilmez.
              </Text>
            </View>

            {/* Hata */}
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            ) : null}

            {/* Giriş butonu */}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: IG_COLOR }, SHADOWS.glowPurple]}
              onPress={openWebView}
              disabled={loading || extracting}
              activeOpacity={0.85}
            >
              {loading || extracting
                ? <ActivityIndicator color="#fff" />
                : (
                  <View style={styles.btnInner}>
                    <HugeiconsIcon icon={InstagramIcon} size={20} color="#fff" />
                    <Text style={styles.btnText}>Instagram ile Giriş Yap</Text>
                  </View>
                )
              }
            </TouchableOpacity>

            {/* Dev panel */}
            {devMode && (
              <View style={[styles.devPanel, { borderColor: colors.purple + '40', backgroundColor: colors.purple + '10' }]}>
                <View style={styles.devHeader}>
                  <View style={[styles.devBadge, { backgroundColor: colors.purple }]}>
                    <Text style={styles.devBadgeText}>DEV</Text>
                  </View>
                  <Text style={[styles.devTitle, { color: colors.textMuted }]}>Developer Mode</Text>
                </View>
                <TouchableOpacity
                  style={[styles.devBtn, { backgroundColor: colors.purple + '20' }]}
                  onPress={handleMockLogin}
                >
                  <HugeiconsIcon icon={GearsIcon} size={15} color={colors.purple} />
                  <Text style={[styles.devBtnText, { color: colors.purple }]}>Mock Data ile Giriş</Text>
                </TouchableOpacity>
                <View style={styles.testRow}>
                  {[
                    { label: 'Dashboard', screen: 'Main',     color: colors.purple },
                    { label: 'Analiz',    screen: 'Analysis', color: colors.mauve, params: { simulation: true } },
                    { label: 'Sonuçlar', screen: 'Results',  color: colors.teal },
                  ].map(({ label, screen, color, params }) => (
                    <TouchableOpacity
                      key={screen}
                      style={[styles.testBtn, { backgroundColor: color + '20' }]}
                      onPress={() => navigation.navigate(screen, params)}
                    >
                      <Text style={[styles.testBtnText, { color }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Şeffaflık butonu */}
            <TouchableOpacity
              onPress={() => setPrivacyVisible(true)}
              style={[styles.privacyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <HugeiconsIcon icon={ShieldKeyIcon} size={14} color={colors.teal} />
              <Text style={[styles.privacyBtnText, { color: colors.teal }]}>Verilerinle ne yapıyoruz?</Text>
            </TouchableOpacity>

          </View>
        </View>

        <TouchableOpacity style={styles.footer} onPress={handleFooterTap} activeOpacity={1}>
          <Text style={[styles.legal, { color: colors.textMuted }]}>
            Bu uygulama Instagram LLC ile resmi olarak ilişkili değildir.{devMode ? '  ⚙️' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instagram WebView Modal */}
      <Modal visible={webviewVisible} animationType="slide" onRequestClose={() => setWebviewVisible(false)}>
        <SafeAreaView style={[styles.webviewSafe, { backgroundColor: colors.background }]}>
          <View style={[styles.webviewHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setWebviewVisible(false)} style={styles.webviewCancelBtn}>
              <Text style={[styles.webviewCloseText, { color: colors.textMuted }]}>İptal</Text>
            </TouchableOpacity>
            <Text style={[styles.webviewTitle, { color: colors.textPrimary }]}>Instagram Giriş</Text>
            {loggedInToIG ? (
              <TouchableOpacity onPress={extractAndLogin} style={[styles.webviewDoneBtn, { backgroundColor: IG_COLOR }]} disabled={extracting}>
                {extracting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.webviewDoneText}>Devam Et</Text>
                }
              </TouchableOpacity>
            ) : (
              <View style={styles.webviewCancelBtn} />
            )}
          </View>

          {webviewLoading && (
            <View style={styles.webviewSpinner}>
              <ActivityIndicator size="large" color={IG_COLOR} />
            </View>
          )}

          <WebView
            source={{ uri: IG_LOGIN_URL }}
            onNavigationStateChange={handleNavigationChange}
            onLoadStart={() => setWebviewLoading(true)}
            onLoadEnd={() => setWebviewLoading(false)}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            style={{ flex: 1 }}
            userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          />
        </SafeAreaView>
      </Modal>

      {/* Şeffaflık Modal */}
      <Modal visible={privacyVisible} animationType="slide" transparent onRequestClose={() => setPrivacyVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Verilerinle Ne Yapıyoruz?</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { icon: '✅', text: 'Instagram şifreni asla görmüyoruz veya kaydetmiyoruz.' },
                { icon: '✅', text: 'Verilerini üçüncü taraflarla paylaşmıyoruz.' },
                { icon: '✅', text: 'Analiz sonuçları AES-256 ile şifreli saklanır.' },
                { icon: '✅', text: 'Konum, rehber veya mikrofon erişimi istemiyoruz.' },
                { icon: '✅', text: 'İstediğin zaman tüm verilerini silebilirsin.' },
                { icon: '🔒', text: 'Yalnızca takipçi listesi, story izleyicileri ve gönderi etkileşimlerine erişiyoruz.' },
              ].map((row, i) => (
                <View key={i} style={styles.modalRow}>
                  <Text style={styles.modalRowIcon}>{row.icon}</Text>
                  <Text style={[styles.modalRowText, { color: colors.textSecondary }]}>{row.text}</Text>
                </View>
              ))}
              <Text style={[styles.modalFooterNote, { color: colors.textMuted }]}>
                Daha fazla bilgi için Ayarlar → Gizlilik Politikası
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.purple, marginTop: SPACING.sm }]}
              onPress={() => setPrivacyVisible(false)}
            >
              <Text style={styles.btnText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  main:      { flex: 1 },
  container: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center' },
  content:   { width: '100%' },
  footer:    { paddingBottom: SPACING.lg, alignItems: 'center', paddingHorizontal: SPACING.lg },

  header: { alignItems: 'center', marginBottom: SPACING.xl },
  igIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: IG_COLOR,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md, ...GLOSS,
  },
  titleBold: { fontSize: 22, fontWeight: '800', marginBottom: SPACING.xs, textAlign: 'center' },
  subtitle:  { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  errorBox: {
    borderWidth: 1, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.sm,
  },
  errorText: { fontSize: 13 },

  btn: {
    borderRadius: RADIUS.full, paddingVertical: 15,
    alignItems: 'center', marginBottom: SPACING.lg, ...GLOSS,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  btnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },

  devPanel: {
    borderWidth: 1, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  devHeader:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  devBadge:     { borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  devBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  devTitle:     { fontSize: 12, fontWeight: '600' },
  devBtn:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  devBtnText:   { fontSize: 13, fontWeight: '700' },
  testRow:      { flexDirection: 'row', gap: SPACING.sm },
  testBtn:      { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center' },
  testBtnText:  { fontSize: 12, fontWeight: '700' },

  privacyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    alignSelf: 'center', marginBottom: SPACING.xl,
  },
  privacyBtnText: { fontSize: 13, fontWeight: '600' },

  legal: { fontSize: 11, textAlign: 'center', lineHeight: 17 },

  // WebView
  webviewSafe:      { flex: 1 },
  webviewHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1 },
  webviewTitle:     { fontSize: 16, fontWeight: '700', textAlign: 'center', flex: 1 },
  webviewCancelBtn: { width: 60 },
  webviewCloseText: { fontSize: 15 },
  webviewDoneBtn:   { borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6, width: 60, alignItems: 'center' },
  webviewDoneText:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  webviewSpinner:   { position: 'absolute', top: '50%', left: '50%', zIndex: 10 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, padding: SPACING.lg, paddingBottom: SPACING.xxl, maxHeight: '80%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#444', alignSelf: 'center', marginBottom: SPACING.lg,
  },
  modalTitle:      { fontSize: 20, fontWeight: '800', marginBottom: SPACING.sm },
  modalRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.md },
  modalRowIcon:    { fontSize: 16, marginTop: 1 },
  modalRowText:    { fontSize: 14, lineHeight: 21, flex: 1 },
  modalFooterNote: { fontSize: 12, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.lg },
  cancelText:      { fontSize: 14 },
});
