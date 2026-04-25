import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function SettingRow({ icon, label, subtitle, right, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon} size={20} color={colors.purple} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </TouchableOpacity>
  );
}

function SectionTitle({ title, colors }) {
  return (
    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
  );
}

export default function SettingsScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.titleMuted, { color: colors.textSecondary }]}>Uygulama</Text>
            <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Ayarlar</Text>
          </View>
        </View>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardPurple, borderColor: colors.border }]}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.purpleDim }]}>
            <Text style={{ fontSize: 28 }}>👻</Text>
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
            icon="refresh-outline"
            label="Verileri Yenile"
            subtitle="Son güncelleme: az önce"
            colors={colors}
            onPress={() => {}}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Gizlilik"
            subtitle="Şifren hiçbir zaman saklanmaz"
            colors={colors}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
          <SettingRow
            icon="log-out-outline"
            label="Çıkış Yap"
            colors={colors}
            onPress={logout}
            right={<Ionicons name="chevron-forward" size={18} color={colors.danger} />}
          />
        </View>

        {/* Hakkında */}
        <SectionTitle title="HAKKINDA" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="information-circle-outline"
            label="Uygulama Hakkında"
            subtitle="GhostScore v1.0.0"
            colors={colors}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Gizlilik Politikası"
            subtitle="Verileriniz nasıl korunur?"
            colors={colors}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Bu uygulama Instagram ile resmi olarak bağlantılı değildir.
        </Text>

      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    gap: SPACING.md,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileSub: { fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.4,
    textTransform: 'uppercase', marginBottom: SPACING.sm, marginLeft: SPACING.xs,
  },
  card: {
    borderRadius: RADIUS.lg, borderWidth: 1,
    overflow: 'hidden', marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
    borderBottomWidth: 1, gap: SPACING.md,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  footer: { fontSize: 11, textAlign: 'center', lineHeight: 18, marginTop: SPACING.sm },
});
