import { HugeiconsIcon } from '@hugeicons/react-native';
import { InstagramIcon, GearsIcon, ShieldKeyIcon, ViewIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Modal, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPACING, RADIUS, SHADOWS, GLOSS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const IG_COLOR     = '#C13584';
const DEV_MODE_KEY = 'gs_dev_mode';

export default function LoginScreen({ navigation }) {
  const { colors }                          = useTheme();
  const { login, verify2fa, loginWithMock, loading, error } = useAuth();

  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [devMode, setDevMode]         = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

  // 2FA state
  const [twoFaVisible, setTwoFaVisible]       = useState(false);
  const [twoFaCode, setTwoFaCode]             = useState('');
  const [twoFaIdentifier, setTwoFaIdentifier] = useState('');
  const [twoFaError, setTwoFaError]           = useState('');
  const [twoFaLoading, setTwoFaLoading]       = useState(false);

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

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    try {
      await login(username.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'Analysis' }] });
    } catch (err) {
      if (err.status === 202) {
        setTwoFaIdentifier(err.twoFaIdentifier || '');
        setTwoFaVisible(true);
      }
    }
  };

  const handleVerify2fa = async () => {
    if (!twoFaCode.trim()) return;
    setTwoFaLoading(true);
    setTwoFaError('');
    try {
      await verify2fa(username.trim(), twoFaCode.trim(), twoFaIdentifier);
      setTwoFaVisible(false);
      navigation.reset({ index: 0, routes: [{ name: 'Analysis' }] });
    } catch (err) {
      setTwoFaError(err.message || 'Kod hatalı, tekrar dene.');
    } finally {
      setTwoFaLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.main}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>

              {/* Başlık */}
              <View style={styles.header}>
                <View style={[styles.igIconWrap, SHADOWS.glowPurple]}>
                  <HugeiconsIcon icon={InstagramIcon} size={36} color="#fff" />
                </View>
                <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Hesabına Giriş Yap</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Instagram kullanıcı adı ve şifrenle giriş yap.
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Kullanıcı adı"
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  autoComplete="username"
                  textContentType="username"
                />

                <View style={[styles.passWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.passInput, { color: colors.textPrimary }]}
                    placeholder="Şifre"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    autoComplete="current-password"
                    textContentType="password"
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                    <HugeiconsIcon icon={showPass ? ViewOffSlashIcon : ViewIcon} size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Hata */}
                {error ? (
                  <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}>
                    <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                  </View>
                ) : null}

                {/* Giriş butonu */}
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.purple, opacity: (!username.trim() || !password.trim()) ? 0.5 : 1 }, SHADOWS.glowPurple]}
                  onPress={handleLogin}
                  disabled={loading || !username.trim() || !password.trim()}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>Giriş Yap</Text>
                  }
                </TouchableOpacity>
              </View>

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
      </KeyboardAvoidingView>

      {/* 2FA Modal */}
      <Modal visible={twoFaVisible} animationType="slide" transparent onRequestClose={() => setTwoFaVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>İki Faktörlü Doğrulama</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Instagram'ın sana gönderdiği 6 haneli kodu gir.
            </Text>
            <TextInput
              style={[styles.codeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              value={twoFaCode}
              onChangeText={setTwoFaCode}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
            {twoFaError ? <Text style={[styles.errorText, { color: colors.danger, textAlign: 'center', marginBottom: SPACING.sm }]}>{twoFaError}</Text> : null}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.purple }]}
              onPress={handleVerify2fa}
              disabled={twoFaLoading}
              activeOpacity={0.85}
            >
              {twoFaLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Doğrula</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTwoFaVisible(false)} style={{ marginTop: SPACING.md, alignItems: 'center' }}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
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

  form: { marginBottom: SPACING.lg },
  input: {
    borderWidth: 1, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    fontSize: 15, marginBottom: SPACING.sm,
  },
  passWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: RADIUS.md,
    marginBottom: SPACING.sm, overflow: 'hidden',
  },
  passInput: {
    flex: 1, paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: 15,
  },
  eyeBtn: { paddingHorizontal: SPACING.md },

  errorBox: {
    borderWidth: 1, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.sm,
  },
  errorText: { fontSize: 13 },

  btn: {
    borderRadius: RADIUS.full, paddingVertical: 15,
    alignItems: 'center', marginBottom: SPACING.sm, ...GLOSS,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

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
  modalSub:        { fontSize: 14, lineHeight: 20, marginBottom: SPACING.lg },
  modalRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.md },
  modalRowIcon:    { fontSize: 16, marginTop: 1 },
  modalRowText:    { fontSize: 14, lineHeight: 21, flex: 1 },
  modalFooterNote: { fontSize: 12, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.lg },

  codeInput: {
    borderWidth: 1, borderRadius: RADIUS.md,
    paddingVertical: 14, fontSize: 24, fontWeight: '800',
    letterSpacing: 8, marginBottom: SPACING.md,
  },
  cancelText: { fontSize: 14 },
});
