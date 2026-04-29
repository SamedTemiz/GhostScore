import { useRef, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ViewIcon, BadgeAlertIcon, UserMinus01Icon, UserCircleIcon, Settings01Icon } from '@hugeicons/core-free-icons';

const SUSPICIOUS = require('../../assets/main/Suspicious_Look.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, RADIUS, SHADOWS, GLOSS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const GHOST_ASSETS = [
  require('../../assets/main/Default_Pose.png'),
  require('../../assets/main/Left_Profile.png'),
  require('../../assets/main/Right_Profile.png'),
  require('../../assets/main/Top_View.png'),
  require('../../assets/main/Shy_Mode.png'),
];

function BackgroundGhost({ delay = 0 }) {
  const xAnim    = useRef(new Animated.Value(-150)).current;
  const ghostIdx = useRef(Math.floor(Math.random() * GHOST_ASSETS.length)).current;
  const sizeRef  = useRef(Math.random() * 32 + 48).current;      // 48-80px
  const yPosRef  = useRef(Math.random() * height).current;
  const durRef   = useRef(Math.random() * 3000 + 7000).current;  // 7-10s
  const dirRef   = useRef(Math.random() > 0.5 ? 1 : -1).current;
  const scaleRef = useRef(Math.random() * 0.3 + 0.7).current;

  useEffect(() => {
    const startX = dirRef === 1 ? -150 : width + 50;
    const endX   = dirRef === 1 ? width + 50 : -150;
    const loop = () => {
      xAnim.setValue(startX);
      Animated.timing(xAnim, { toValue: endX, duration: durRef, useNativeDriver: true }).start(loop);
    };
    const t = setTimeout(loop, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.Image
      source={GHOST_ASSETS[ghostIdx]}
      style={[
        styles.bgGhost,
        {
          top: yPosRef,
          width: sizeRef, height: sizeRef,
          transform: [
            { translateX: xAnim },
            { scaleX: dirRef === -1 ? -scaleRef : scaleRef },
            { scaleY: scaleRef },
          ],
        },
      ]}
    />
  );
}

// Score ring — always white text because it sits on the dark featured card
function ScoreRing({ score = 72, size = 120 }) {
  const color = score >= 70 ? '#4DBDBD' : score >= 40 ? '#C9A84C' : '#D4808A';
  return (
    <View style={[
      {
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 5, borderColor: color,
        backgroundColor: color + '18',
        alignItems: 'center', justifyContent: 'center',
      },
      SHADOWS.glowPurple
    ]}>
      <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '800', lineHeight: 38 }}>{score}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 }}>skor</Text>
    </View>
  );
}

function AnalyticsCard({ icon, title, count, subtitle, cardBg, accent, border, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}
      style={[styles.analyticsCard, { backgroundColor: cardBg }, SHADOWS.glass]}>
      <View style={styles.analyticsCardTop}>
        <View style={[styles.analyticsIcon, { backgroundColor: accent + '25' }]}>
          <HugeiconsIcon icon={icon} size={20} color={accent} />
        </View>
        <Text style={[styles.analyticsCount, { color: accent }]}>{count}</Text>
      </View>
      <Text style={[styles.analyticsTitle, { color: accent }]}>{title}</Text>
      <Text style={[styles.analyticsSubtitle, { color: '#5A5475' }]}>{subtitle}</Text>
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
  const { user, data, logout } = useAuth();
  const profile   = data?.profile;
  const score     = profile?.ghostScore ?? 0;
  const picUri    = user?.profilePic || profile?.profilePic || '';
  const [picError, setPicError] = useState(false);
  // Featured card stays dark as in the middle screen of the reference
  const featuredBg = colors.cardDark || '#5C4B5E';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Arka plan ghost efektleri — yavaş ve az */}
      {[...Array(20)].map((_, i) => (
        <BackgroundGhost key={i} delay={i * 600} />
      ))}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOWS.soft]}>
              {picUri && !picError
                ? <Image source={{ uri: picUri }} style={styles.avatarImg} onError={() => setPicError(true)} />
                : <HugeiconsIcon icon={UserCircleIcon} size={24} color={colors.textPrimary} />
              }
            </View>
            <View>
              <Text style={[styles.topGreeting, { color: colors.textMuted }]}>Merhaba,</Text>
              <Text style={[styles.topUsername, { color: colors.textPrimary }]}>@{user?.username || profile?.username || '...'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.logoutBtn, { borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface }, SHADOWS.soft]}>
            <HugeiconsIcon icon={Settings01Icon} size={16} color={colors.textSecondary} />
            <Text style={[styles.logoutText, { color: colors.textSecondary }]}>Ayarlar</Text>
          </TouchableOpacity>
        </View>

        {/* Page title */}
        <Text style={[styles.pageTitle, { color: colors.textSecondary }]}>
          {'Sosyal '}
          <Text style={[styles.pageTitleBold, { color: colors.textPrimary }]}>Verilerin</Text>
        </Text>

        {/* ─── Featured score card (always dark — like reference) ─── */}
        <View style={[styles.scoreCard, { backgroundColor: featuredBg }, SHADOWS.glowPurple]}>
          {/* Card header row */}
          <View style={styles.scoreCardHeader}>
            <Text style={styles.scoreCardTitle}>Ghost Score</Text>
            <View style={[
              styles.scorePill,
              { backgroundColor: score >= 70 ? '#4DBDBD22' : '#C9A84C22',
                flexDirection: 'row', alignItems: 'center', gap: 4 },
            ]}>
              {score >= 70
                ? <Text style={{ fontSize: 11, fontWeight: '700', color: '#4DBDBD' }}>🔥 Yüksek</Text>
                : <>
                    <Image source={SUSPICIOUS} style={{ width: 16, height: 16 }} resizeMode="contain" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#C9A84C' }}>Düşük</Text>
                  </>
              }
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
          <TouchableOpacity style={styles.scoreCardFooter} onPress={() => navigation.navigate('Results')} activeOpacity={0.7}>
            <Text style={styles.scoreCardFooterText}>İstatistikleri Gör →</Text>
          </TouchableOpacity>
        </View>

        {/* Section label */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Analizler</Text>

        {/* 2-column analytics */}
        <View style={styles.grid}>
          <AnalyticsCard
            icon={ViewIcon} title="Stalkers" count={data?.stalkers?.length ?? 0}
            subtitle="Takip etmeden izliyor"
            cardBg={colors.cardPurple} accent={colors.purple} border={colors.border}
            onPress={() => navigation.navigate('Stalkers')}
          />
          <AnalyticsCard
            icon={UserMinus01Icon} title="Hayalet Takipçi" count={data?.ghostFollowers?.length ?? 0}
            subtitle="Hiç etkileşim kurmadı"
            cardBg={colors.cardMauve} accent={colors.mauve} border={colors.border}
            onPress={() => navigation.navigate('Muted')}
          />
        </View>

        {/* Full-width unfollower card */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Unfollowers')}
          style={[styles.unfollowerCard, { backgroundColor: colors.cardTeal }, SHADOWS.glass]}>
          <View style={styles.unfollowerLeft}>
            <View style={[styles.analyticsIcon, { backgroundColor: colors.teal + '25' }]}>
              <HugeiconsIcon icon={BadgeAlertIcon} size={22} color={colors.teal} />
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

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          {data?.createdAt
            ? `Son güncelleme: ${new Date(data.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`
            : 'Henüz analiz yapılmadı'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  bgGhost: {
    position: 'absolute',
    opacity: 0.22,
    zIndex: 0,
  },

  // Top bar
  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  topLeft:      { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, ...GLOSS, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm, overflow: 'hidden' },
  avatarImg:    { width: 42, height: 42, borderRadius: 21 },
  topGreeting:  { fontSize: 12 },
  topUsername:  { fontSize: 15, fontWeight: '700' },
  logoutBtn:    { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, ...GLOSS },
  logoutText:   { fontSize: 13 },

  pageTitle:     { fontSize: 26, fontWeight: '400', marginBottom: SPACING.lg },
  pageTitleBold: { fontWeight: '800' },

  // Featured card
  scoreCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...GLOSS },
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
  analyticsCard:    { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.md, ...GLOSS },
  analyticsCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  analyticsIcon:    { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  analyticsCount:   { fontSize: 24, fontWeight: '800' },
  analyticsTitle:   { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  analyticsSubtitle: { fontSize: 11, marginBottom: SPACING.sm },
  miniBarRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 20 },
  miniBar:          { width: 5, borderRadius: 2 },

  // Unfollower
  unfollowerCard: { borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...GLOSS, marginBottom: SPACING.lg },
  unfollowerLeft: { flexDirection: 'row', alignItems: 'center' },

  footer: { fontSize: 11, textAlign: 'center' },
});
