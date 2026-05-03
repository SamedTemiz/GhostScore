import { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Refresh01Icon, ShieldKeyIcon, Logout02Icon, AlertSquareIcon, ArrowLeft02Icon, UserCircleIcon, ArrowRight01Icon, Delete02Icon } from '@hugeicons/core-free-icons';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
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
  const { user, data, logout } = useAuth();
  const [picError, setPicError] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const picUri = user?.profilePic || '';

  const [modal, setModal] = useState({ visible: false, type: 'info', title: '', message: '' });
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [reanalysisConfirm, setReanalysisConfirm] = useState(false);

  const lastUpdate = data?.createdAt ? formatDate(data.createdAt) : 'Henüz analiz yok';

  const handleModalConfirm = () => {
    setModal(m => ({ ...m, visible: false }));
  };

  const handleReanalysisConfirmed = () => {
    setReanalysisConfirm(false);
    navigation.navigate('Analysis', { reanalysis: true });
  };

  const handleLogoutConfirmed = async () => {
    setLogoutConfirm(false);
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleDeleteConfirmed = async () => {
    setDeleteConfirm(false);
    setDeletingAccount(true);
    try {
      await usersApi.deleteAccount();
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      setModal({ visible: true, type: 'error', title: 'Hata', message: err.message || 'Hesap silinemedi. Lütfen tekrar dene.' });
    } finally {
      setDeletingAccount(false);
    }
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
            label="Analizi Yenile"
            subtitle={`Son analiz: ${lastUpdate}`}
            colors={colors}
            onPress={() => setReanalysisConfirm(true)}
            right={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.textMuted} />}
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
            onPress={() => setLogoutConfirm(true)}
            right={<HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.textMuted} />}
          />
        </View>

        {/* Hakkında */}
        <SectionTitle title="HAKKINDA" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon={AlertSquareIcon}
            label="Uygulama Hakkında"
            subtitle={`GhostScore v${APP_VERSION}`}
            colors={colors}
            right={<Text style={{ fontSize: 12, color: colors.textMuted }}>Beta</Text>}
          />
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Bu uygulama Instagram ile resmi olarak bağlantılı değildir.
        </Text>

        {/* Hesabı Sil — en altta, ayrı kart */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.danger + '40', marginTop: SPACING.sm }]}>
          <SettingRow
            icon={Delete02Icon}
            label="Hesabı Sil"
            subtitle="Tüm verilerini kalıcı olarak sil"
            colors={colors}
            danger
            onPress={deletingAccount ? null : () => setDeleteConfirm(true)}
            right={
              deletingAccount
                ? <ActivityIndicator size="small" color={colors.danger} />
                : <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.danger} />
            }
          />
        </View>

      </ScrollView>

      <ThemedModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText="Tamam"
        onConfirm={handleModalConfirm}
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

      <ThemedModal
        visible={deleteConfirm}
        type="confirm"
        title="Hesabı Sil"
        message="Tüm verilerini kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="İptal"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(false)}
      />

      <ThemedModal
        visible={reanalysisConfirm}
        type="confirm"
        title="Analizi Yenile"
        message="Instagram hesabın sıfırdan analiz edilecek. Bu işlem birkaç dakika sürebilir. Devam etmek istiyor musun?"
        confirmText="Analizi Başlat"
        cancelText="İptal"
        onConfirm={handleReanalysisConfirmed}
        onCancel={() => setReanalysisConfirm(false)}
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
