import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Score ring — always white text because it sits on the dark featured card
function ScoreRing({ score = 72, size = 120 }) {
  const color = score >= 70 ? '#4DBDBD' : score >= 40 ? '#C9A84C' : '#D4808A';
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 5, borderColor: color,
      backgroundColor: color + '18',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '800', lineHeight: 38 }}>{score}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 }}>skor</Text>
    </View>
  );
}

function AnalyticsCard({ icon, title, count, subtitle, cardBg, accent, border, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}
      style={[styles.analyticsCard, { backgroundColor: cardBg, borderColor: border }]}>
      <View style={styles.analyticsCardTop}>
        <View style={[styles.analyticsIcon, { backgroundColor: accent + '25' }]}>
          <Ionicons name={icon} size={20} color={accent} />
        </View>
        <Text style={[styles.analyticsCount, { color: accent }]}>{count}</Text>
      </View>
      <Text style={[styles.analyticsTitle, { color: accent }]}>{title}</Text>
      <Text style={styles.analyticsSubtitle}>{subtitle}</Text>
      <View style={styles.miniBarRow}>
        {[0.3, 0.6, 0.5, 0.8, 0.4, 0.7, 0.9].map((h, i) => (
          <View key={i} style={[styles.miniBar, { height: h * 20, backgroundColor: accent, opacity: 0.35 + h * 0.45 }]} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const LEGEND = [
  { label: 'Takipçi',    key: 'followers',       fmt: (v) => v.toLocaleString(), color: '#9B7FD4' },
  { label: 'Takip',      key: 'following',        fmt: (v) => v.toLocaleString(), color: '#D4808A' },
  { label: 'Post',       key: 'posts',            fmt: (v) => v.toLocaleString(), color: '#4DBDBD' },
  { label: 'Görünürlük', key: 'visibilityScore',  fmt: (v) => `%${v}`,            color: '#C9A84C' },
];

export default function DashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { data, logout } = useAuth();
  const profile   = data?.profile;
  const score     = profile?.ghostScore ?? 0;
  // Featured card stays dark as in the middle screen of the reference
  const featuredBg = colors.cardDark || '#5C4B5E';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={24} color={colors.textPrimary} />
            </View>
            <View>
              <Text style={[styles.topGreeting, { color: colors.textMuted }]}>Merhaba,</Text>
              <Text style={[styles.topUsername, { color: colors.textPrimary }]}>@{profile?.username}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.logoutBtn, { borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <Ionicons name="settings-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.logoutText, { color: colors.textSecondary }]}>Ayarlar</Text>
          </TouchableOpacity>
        </View>

        {/* Page title */}
        <Text style={[styles.pageTitle, { color: colors.textSecondary }]}>
          {'Sosyal '}
          <Text style={[styles.pageTitleBold, { color: colors.textPrimary }]}>Verilerin</Text>
        </Text>

        {/* ─── Featured score card (always dark — like reference) ─── */}
        <View style={[styles.scoreCard, { backgroundColor: featuredBg }]}>
          {/* Card header row */}
          <View style={styles.scoreCardHeader}>
            <Text style={styles.scoreCardTitle}>Ghost Score</Text>
            <View style={[
              styles.scorePill,
              { backgroundColor: score >= 70 ? '#4DBDBD22' : '#C9A84C22' },
            ]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: score >= 70 ? '#4DBDBD' : '#C9A84C' }}>
                {score >= 70 ? '🔥 Yüksek' : '👻 Düşük'}
              </Text>
            </View>
          </View>

          {/* Legend + ring */}
          <View style={styles.scoreCardBody}>
            <View style={styles.legendList}>
              {LEGEND.map(({ label, key, fmt, color }) => (
                <View key={key} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <View>
                    <Text style={styles.legendValue}>{fmt(profile?.[key] ?? 0)}</Text>
                    <Text style={styles.legendLabel}>{label}</Text>
                  </View>
                </View>
              ))}
            </View>
            <ScoreRing score={score} size={120} />
          </View>

          {/* Footer rule */}
          <View style={styles.scoreCardFooter}>
            <Text style={styles.scoreCardFooterText}>İstatistikleri Gör →</Text>
          </View>
        </View>

        {/* Section label */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Analizler</Text>

        {/* 2-column analytics */}
        <View style={styles.grid}>
          <AnalyticsCard
            icon="eye-outline" title="Stalkers" count={data?.stalkers?.length ?? 0}
            subtitle="Takip etmeden izliyor"
            cardBg={colors.cardPurple} accent={colors.purple} border={colors.border}
            onPress={() => navigation.navigate('Stalkers')}
          />
          <AnalyticsCard
            icon="notifications-off-outline" title="Muted" count={data?.muted?.length ?? 0}
            subtitle="Sıralama düştü"
            cardBg={colors.cardMauve} accent={colors.mauve} border={colors.border}
            onPress={() => navigation.navigate('Muted')}
          />
        </View>

        {/* Full-width unfollower card */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Unfollowers')}
          style={[styles.unfollowerCard, { backgroundColor: colors.cardTeal, borderColor: colors.teal + '15' }]}>
          <View style={styles.unfollowerLeft}>
            <View style={[styles.analyticsIcon, { backgroundColor: colors.teal + '25' }]}>
              <Ionicons name="alert-circle-outline" size={22} color={colors.teal} />
            </View>
            <View style={{ marginLeft: SPACING.md }}>
              <Text style={[styles.analyticsTitle, { color: colors.teal }]}>Unfollower Alarmı</Text>
              <Text style={[styles.analyticsSubtitle, { color: colors.textMuted }]}>Son 30 günde takibi bırakanlar</Text>
            </View>
          </View>
          <Text style={[styles.analyticsCount, { color: colors.teal, fontSize: 30 }]}>
            {data?.unfollowers?.length ?? 0}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.textMuted }]}>Son güncelleme: Az önce</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  // Top bar
  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  topLeft:      { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  topGreeting:  { fontSize: 12 },
  topUsername:  { fontSize: 15, fontWeight: '700' },
  logoutBtn:    { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1 },
  logoutText:   { fontSize: 13 },

  pageTitle:     { fontSize: 26, fontWeight: '400', marginBottom: SPACING.lg },
  pageTitleBold: { fontWeight: '800' },

  // Featured card
  scoreCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
  scoreCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  scoreCardTitle:  { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  scorePill:       { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 5 },
  scoreCardBody:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  legendList:      { flex: 1, paddingRight: SPACING.md },
  legendRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  legendDot:       { width: 9, height: 9, borderRadius: 4.5, marginRight: SPACING.sm },
  legendValue:     { color: '#FFFFFF', fontSize: 15, fontWeight: '700', lineHeight: 18 },
  legendLabel:     { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  scoreCardFooter:     { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: SPACING.md },
  scoreCardFooterText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' },

  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: SPACING.md },

  // Analytics cards
  grid:             { flexDirection: 'row', marginBottom: SPACING.md, gap: SPACING.md },
  analyticsCard:    { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1 },
  analyticsCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  analyticsIcon:    { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  analyticsCount:   { fontSize: 24, fontWeight: '800' },
  analyticsTitle:   { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  analyticsSubtitle: { fontSize: 11, marginBottom: SPACING.sm },
  miniBarRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20 },
  miniBar:          { width: 5, borderRadius: 2 },

  // Unfollower
  unfollowerCard: { borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, marginBottom: SPACING.lg },
  unfollowerLeft: { flexDirection: 'row', alignItems: 'center' },

  footer: { fontSize: 11, textAlign: 'center' },
});
