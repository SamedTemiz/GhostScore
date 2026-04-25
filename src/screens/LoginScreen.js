import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  Modal, Animated, StatusBar,
} from 'react-native';
import { SPACING, RADIUS, DARK_COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const IG_COLOR = '#C13584';

// ── Şifre bottom sheet ────────────────────────────────────────

function PasswordSheet({ visible, username, onClose, onSubmit, submitting, error, colors }) {
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [accepted, setAccepted]     = useState(false);

  const handleSubmit = () => {
    if (!password) return;
    onSubmit(password);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
      >
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

          {/* Başlık */}
          <View style={styles.sheetHeader}>
            <View style={styles.igIconSmall}>
              <Ionicons name="logo-instagram" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>@{username}</Text>
              <Text style={[styles.sheetSub, { color: colors.textMuted }]}>Tam analiz için şifreni gir</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Güven notu */}
          <View style={[styles.trustNote, { backgroundColor: colors.teal + '15' }]}>
            <Ionicons name="shield-checkmark" size={14} color={colors.teal} />
            <Text style={[styles.trustNoteText, { color: colors.teal }]}>
              Şifren yalnızca oturum açmak için kullanılır — veritabanına asla yazılmaz, şifreli oturum anahtarına dönüştürülür.
            </Text>
          </View>

          {/* Şifre input */}
          <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1, color: colors.textPrimary }]}
              placeholder="Instagram şifresi"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Hata */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Sorumluluk reddi onayı */}
          <TouchableOpacity
            style={styles.disclaimerRow}
            onPress={() => setAccepted(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, { borderColor: colors.textMuted }, accepted && { backgroundColor: colors.gold, borderColor: colors.gold }]}>
              {accepted && <Ionicons name="checkmark" size={13} color="#1A1628" />}
            </View>
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              Bu uygulamanın kullanımı sonucunda Instagram hesabımda oluşabilecek kısıtlama, askıya alma veya ban gibi durumlardan GhostScore'un herhangi bir sorumluluğu olmadığını anlıyor ve kabul ediyorum.
            </Text>
          </TouchableOpacity>

          {/* Bağlan butonu */}
          <TouchableOpacity
            style={[styles.btn, (!password || !accepted || submitting) && styles.btnDisabled, { backgroundColor: colors.gold }]}
            onPress={handleSubmit}
            disabled={!password || !accepted || submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {submitting ? 'Bağlanıyor...' : 'Tam Analizi Başlat →'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Ana ekran ─────────────────────────────────────────────────

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const { login, error } = useAuth();
  const [username, setUsername]       = useState('');
  const [sheetVisible, setSheet]      = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  const handleContinue = () => {
    if (!username.trim()) return;
    setSheet(true);
  };

  const handleLogin = async (password) => {
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      setSheet(false);
      navigation.replace('Analysis');
    } catch (err) {
      // hata AuthContext error state'ine yazıldı
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <PasswordSheet
        visible={sheetVisible}
        username={username.trim()}
        onClose={() => setSheet(false)}
        onSubmit={handleLogin}
        submitting={submitting}
        error={error}
        colors={colors}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Başlık */}
        <View style={styles.igHeader}>
          <View style={styles.igIconWrap}>
            <Ionicons name="logo-instagram" size={36} color="#fff" />
          </View>
          <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Instagram Hesabını Bağla</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Kullanıcı adını gir, hayaletlerini keşfet.
          </Text>
        </View>

        {/* Kullanıcı adı */}
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kullanıcı Adı</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.atSign, { color: colors.textMuted }]}>@</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="kullaniciadi"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleContinue}
          />
        </View>

        {/* Devam butonu */}
        <TouchableOpacity
          style={[styles.btn, !username.trim() && styles.btnDisabled, { backgroundColor: colors.gold }]}
          onPress={handleContinue}
          disabled={!username.trim()}
          activeOpacity={0.85}
        >
          <View style={styles.btnInner}>
            <Ionicons name="logo-instagram" size={18} color="#1A1200" />
            <Text style={styles.btnText}>Tam Analiz Yap</Text>
          </View>
        </TouchableOpacity>

        {/* Alt not */}
        <View style={styles.bottomNote}>
          <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.bottomNoteText, { color: colors.textMuted }]}>
            Devam ederek şifreni güvenli şekilde girmeni isteyeceğiz.
          </Text>
        </View>

        <Text style={[styles.legal, { color: colors.textMuted }]}>
          Bu uygulama Instagram LLC ile resmi olarak ilişkili değildir.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, paddingHorizontal: SPACING.lg },

  backBtn: { marginTop: SPACING.sm, marginBottom: SPACING.xl },

  igHeader: { alignItems: 'center', marginBottom: SPACING.xl * 1.5 },
  igIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: IG_COLOR,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  titleBold: { fontSize: 22, fontWeight: '800', marginBottom: SPACING.xs, textAlign: 'center' },
  subtitle:  { fontSize: 14, textAlign: 'center' },

  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: SPACING.xs },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.md, borderWidth: 1,
    paddingHorizontal: SPACING.md, marginBottom: SPACING.lg,
  },
  atSign:    { fontSize: 16, marginRight: 4 },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1, fontSize: 15,
    paddingVertical: SPACING.md,
  },
  eyeBtn: { padding: SPACING.xs },

  btn: {
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md, alignItems: 'center',
    marginBottom: SPACING.md,
  },
  btnDisabled: { opacity: 0.4 },
  btnInner:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  btnText:     { color: '#1A1200', fontSize: 16, fontWeight: '700' },

  bottomNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: SPACING.xl, justifyContent: 'center',
  },
  bottomNoteText: { fontSize: 12, flex: 1 },

  legal: { fontSize: 11, textAlign: 'center', lineHeight: 17 },

  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.xl, paddingBottom: SPACING.xxl,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: SPACING.lg,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginBottom: SPACING.lg,
  },
  igIconSmall: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: IG_COLOR,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sheetSub:   { fontSize: 13, marginTop: 2 },

  trustNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  trustNoteText: { fontSize: 12, flex: 1, lineHeight: 18 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: '#FF6B6B18', borderRadius: RADIUS.sm,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  errorText: { fontSize: 13, color: '#FF6B6B', flex: 1 },

  disclaimerRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: SPACING.sm, marginBottom: SPACING.md,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxActive: {
  },
  disclaimerText: {
    fontSize: 12, flex: 1, lineHeight: 18,
  },
});
