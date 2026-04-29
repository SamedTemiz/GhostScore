import { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Settings01Icon, Refresh01Icon, ShieldKeyIcon, Logout02Icon, AlertSquareIcon, ArrowLeft02Icon, UserCircleIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

const REFRESH_COOLDOWN_MS = 2 * 60 * 1000; // 2 dakika
const LAST_REFRESH_KEY = 'gs_last_refresh_at';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ThemedModal from '../components/ThemedModal';

function SettingRow({ icon, label, subtitle, right, onPress, colors, danger }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.danger + '18' : colors.surface }]}>
        <HugeiconsIcon icon={icon} size={20} color={danger ? colors.danger : colors.purple} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, { color: danger ? colors.danger : colors.textPrimary }]}>{label}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </TouchableOpacity>
  );
}

function SectionTitle({ title, colors }) {
  return <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>;
}

function formatDate(iso) {
  if (!iso) return 'Henüz yok';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

export default function SettingsScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, data, logout, refreshData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [picError, setPicError] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const timerRef = useRef(null);
  const picUri = user?.profilePic || '';

  // Modal state
  const [modal, setModal] = useState({ visible: false, type: 'info', title: '', message: '' });
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const lastUpdate = data?.createdAt ? formatDate(data.createdAt) : 'Henüz analiz yok';

  // Cooldown geri sayımını başlat
  const startCooldown = (remainingMs) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCooldownSec(Math.ceil(remainingMs / 1000));
    timerRef.current = setInterval(() => {
      setCooldownSec(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Ekran açılınca kalan cooldown varsa geri sayım yap
  useEffect(() => {
    AsyncStorage.getItem(LAST_REFRESH_KEY).then(val => {
      if (!val) return;
      const elapsed = Date.now() - parseInt(val, 10);
      const remaining = REFRESH_COOLDOWN_MS - elapsed;
      if (remaining > 0) startCooldown(remaining);
    });
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleRefresh = async () => {
    if (cooldownSec > 0 || refreshing) return;
    setRefreshing(true);
    try {
      await refreshData();
      const now = Date.now();
      await AsyncStorage.setItem(LAST_REFRESH_KEY, String(now));
      startCooldown(REFRESH_COOLDOWN_MS);
      setModal({
        visible: true,
        type: 'success',
        title: 'Güncellendi',
        message: 'Veriler başarıyla yenilendi.',
      });
    } catch (err) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Güncelleme Başarısız',
        message: err.message || 'Veriler güncellenemedi. Lütfen tekrar dene.',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogoutConfirmed = async () => {
    setLogoutConfirm(false);
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <HugeiconsIcon icon={ArrowLeft02Icon} size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.titleMuted, { color: colors.textSecondary }]}>Uygulama</Text>
            <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Ayarlar</Text>
          </View>
        </View>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardPurple, borderColor: colors.border }]}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.purpleDim, overflow: 'hidden' }]}>
            {picUri && !picError
              ? <Image source={{ uri: picUri }} style={styles.avatarImg} onError={() => setPicError(true)} />
              : <HugeiconsIcon icon={UserCircleIcon} size={32} color={colors.purple} />
            }
          </View>
          <View>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              @{user?.username ?? 'kullanici'}
            </Text>
            <Text style={[styles.profileSub, { color: colors.textMuted }]}>Instagram hesabı bağlı</Text>
          </View>
        </View>

        {/* Hesap */}
        <SectionTitle title="HESAP" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon={Refresh01Icon}
            label="Verileri Yenile"
            subtitle={
              refreshing ? 'Güncelleniyor...' :
              cooldownSec > 0 ? `${cooldownSec} saniye sonra tekrar yenileyebilirsin` :
              `Son güncelleme: ${lastUpdate}`
            }
            colors={colors}
            onPress={refreshing || cooldownSec > 0 ? null : handleRefresh}
            right={
              refreshing
                ? <ActivityIndicator size="small" color={colors.purple} />
                : cooldownSec > 0
                ? <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }}>{cooldownSec}s</Text>
                : <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.textMuted} />
            }
          />
          <SettingRow
            icon={ShieldKeyIcon}
            label="Gizlilik Politikası"
            subtitle="Verileriniz nasıl korunur?"
            colors={colors}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            right={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.textMuted} />}
          />
          <SettingRow
            icon={Logout02Icon}
            label="Çıkış Yap"
            colors={colors}
            danger
            onPress={() => setLogoutConfirm(true)}
            right={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.danger} />}
          />
        </View>

        {/* Hakkında */}
        <SectionTitle title="HAKKINDA" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon={AlertSquareIcon}
            label="Uygulama Hakkında"
            subtitle="GhostScore v1.0.0"
            colors={colors}
            right={<Text style={{ fontSize: 12, color: colors.textMuted }}>Beta</Text>}
          />
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Bu uygulama Instagram ile resmi olarak bağlantılı değildir.
        </Text>

      </ScrollView>

      {/* Themed modals */}
      <ThemedModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText="Tamam"
        onConfirm={() => setModal(m => ({ ...m, visible: false }))}
      />

      <ThemedModal
        visible={logoutConfirm}
        type="confirm"
        title="Çıkış Yap"
        message="Hesabından çıkmak istediğine emin misin?"
        confirmText="Çıkış Yap"
        cancelText="İptal"
        onConfirm={handleLogoutConfirmed}
        onCancel={() => setLogoutConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titleMuted: { fontSize: 16, fontWeight: '400' },
  titleBold: { fontSize: 28, fontWeight: '800' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.lg, borderWidth: 1, gap: SPACING.md,
  },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarImg:     { width: 56, height: 56, borderRadius: 28 },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileSub: { fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.4,
    textTransform: 'uppercase', marginBottom: SPACING.sm, marginLeft: SPACING.xs,
  },
  card: { borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden', marginBottom: SPACING.lg },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    borderBottomWidth: 1, gap: SPACING.md,
  },
  rowIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  footer: { fontSize: 11, textAlign: 'center', lineHeight: 18, marginTop: SPACING.sm },
});
