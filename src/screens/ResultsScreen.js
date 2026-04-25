import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, RADIUS, DARK_COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const dc = DARK_COLORS;

// ─── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 130 }) {
  const color = score >= 70 ? dc.teal : score >= 40 ? dc.gold : dc.mauve;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 6, borderColor: color,
      backgroundColor: color + '18',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#FFF', fontSize: 38, fontWeight: '800', lineHeight: 42 }}>{score}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>skor</Text>
    </View>
  );
}

// ─── Lock Overlay ─────────────────────────────────────────────────────────────
function LockOverlay({ onUnlock }) {
  return (
    <View style={styles.lockOverlay}>
      <Text style={styles.lockEmoji}>🔒</Text>
      <Text style={styles.lockTitle}>Bu içerik kilitli</Text>
      <Text style={styles.lockSub}>Tüm sonuçları görmek için reklam izle</Text>
      <TouchableOpacity style={styles.adBtn} onPress={onUnlock} activeOpacity={0.85}>
        <Text style={styles.adBtnText}>📺  Reklam İzle</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Blurred Row (fake) ───────────────────────────────────────────────────────
function BlurredRow() {
  return (
    <View style={styles.blurRow}>
      <View style={styles.blurCircle} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.blurLine} />
        <View style={[styles.blurLine, { width: '45%' }]} />
      </View>
    </View>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ item, right }) {
  return (
    <View style={styles.userRow}>
      <Image source={{ uri: item.profilePic }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.username}>@{item.username}</Text>
        {item.hint ? <Text style={styles.usernameHint}>{item.hint}</Text> : null}
      </View>
      {right}
    </View>
  );
}

// ─── CARD 1: Ghost Score ──────────────────────────────────────────────────────
function ScoreCard({ profile }) {
  const score = profile?.ghostScore ?? 0;
  return (
    <View style={styles.card}>
      <View style={styles.cardBadge}>
        <Text style={styles.cardBadgeText}>GHOST SCORE</Text>
      </View>
      <Text style={styles.cardTitle}>Sosyal{'\n'}Skorum</Text>

      <View style={styles.scoreCenterRow}>
        <ScoreRing score={score} />
        <View style={styles.statColumn}>
          {[
            { label: 'Takipçi', value: (profile?.followers ?? 0).toLocaleString() },
            { label: 'Takip', value: (profile?.following ?? 0).toLocaleString() },
            { label: 'Post', value: String(profile?.posts ?? 0) },
            { label: 'Görünürlük', value: `%${profile?.visibilityScore ?? 0}` },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.hintBox, { backgroundColor: score >= 70 ? dc.teal + '18' : dc.gold + '18' }]}>
        <Text style={[styles.hintText, { color: score >= 70 ? dc.teal : dc.gold }]}>
          {score >= 70
            ? '🔥 Profilini aktif ve etkili kullanıyorsun!'
            : '👻 Sosyal etkileşimini artırmaya ne dersin?'}
        </Text>
      </View>
    </View>
  );
}

// ─── CARD 2: Stalkers ─────────────────────────────────────────────────────────
function StalkersCard({ stalkers }) {
  const [unlocked, setUnlocked] = useState(false);
  const visible   = stalkers.slice(0, 1);
  const locked    = stalkers.slice(1);

  return (
    <View style={styles.card}>
      <View style={[styles.cardBadge, { backgroundColor: dc.purple + '25' }]}>
        <Text style={[styles.cardBadgeText, { color: dc.purple }]}>STALKER LİSTESİ</Text>
      </View>
      <Text style={styles.cardTitle}>{stalkers.length} Kişi{'\n'}Seni İzliyor 👁️</Text>

      {visible.map((s) => (
        <UserRow
          key={s.id}
          item={{ ...s, hint: 'Takip etmiyor' }}
          right={
            <View style={[styles.storyBadge, { backgroundColor: dc.purple + '20' }]}>
              <Text style={[styles.storyCount, { color: dc.purple }]}>{s.viewedStories}</Text>
              <Text style={styles.storyLabel}>story</Text>
            </View>
          }
        />
      ))}

      {!unlocked && locked.length > 0 && (
        <View style={styles.lockedSection}>
          {locked.slice(0, 3).map((_, i) => <BlurredRow key={i} />)}
          <LockOverlay onUnlock={() => setUnlocked(true)} />
        </View>
      )}

      {unlocked && locked.map((s) => (
        <UserRow
          key={s.id}
          item={{ ...s, hint: 'Takip etmiyor' }}
          right={
            <View style={[styles.storyBadge, { backgroundColor: dc.purple + '20' }]}>
              <Text style={[styles.storyCount, { color: dc.purple }]}>{s.viewedStories}</Text>
              <Text style={styles.storyLabel}>story</Text>
            </View>
          }
        />
      ))}
    </View>
  );
}

// ─── CARD 3: Muted (fully locked) ────────────────────────────────────────────
function MutedCard({ muted }) {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <View style={styles.card}>
      <View style={[styles.cardBadge, { backgroundColor: dc.mauve + '25' }]}>
        <Text style={[styles.cardBadgeText, { color: dc.mauve }]}>MUTE LİSTESİ</Text>
      </View>
      <Text style={styles.cardTitle}>{muted.length} Kişi Seni{'\n'}Sessize Aldı 🔇</Text>

      <View style={styles.lockedSection}>
        {muted.slice(0, 4).map((_, i) => <BlurredRow key={i} />)}
        {!unlocked && <LockOverlay onUnlock={() => setUnlocked(true)} />}
      </View>

      {unlocked && muted.map((m) => (
        <UserRow
          key={m.id}
          item={{ ...m, hint: `Son görülme: ${m.lastSeen}` }}
          right={
            <View style={[styles.storyBadge, { backgroundColor: dc.mauve + '20' }]}>
              <Text style={[styles.storyCount, { color: dc.mauve }]}>{m.rankDelta}</Text>
              <Text style={styles.storyLabel}>sıra</Text>
            </View>
          }
        />
      ))}
    </View>
  );
}

// ─── CARD 4: Unfollowers ──────────────────────────────────────────────────────
function UnfollowersCard({ unfollowers }) {
  const [unlocked, setUnlocked] = useState(false);
  const mutual   = unfollowers.filter((u) => u.wasFollowedBack).length;
  const visible  = unfollowers.slice(0, 2);
  const locked   = unfollowers.slice(2);

  return (
    <View style={styles.card}>
      <View style={[styles.cardBadge, { backgroundColor: dc.teal + '25' }]}>
        <Text style={[styles.cardBadgeText, { color: dc.teal }]}>UNFOLLOWER ALARMI</Text>
      </View>
      <Text style={styles.cardTitle}>{unfollowers.length} Kişi{'\n'}Takibi Bıraktı 🚨</Text>

      <View style={[styles.mutualPill, { backgroundColor: dc.gold + '20' }]}>
        <Text style={[styles.mutualText, { color: dc.gold }]}>
          ⚠️  {mutual} karşılıklı takip bıraktı
        </Text>
      </View>

      {visible.map((u) => (
        <UserRow
          key={u.id}
          item={{ ...u, hint: u.unfollowedAt }}
          right={
            <View style={[
              styles.badge,
              { borderColor: u.wasFollowedBack ? dc.teal + '50' : dc.border },
            ]}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: u.wasFollowedBack ? dc.teal : dc.textMuted }}>
                {u.wasFollowedBack ? 'Karşılıklı' : 'Tek taraflı'}
              </Text>
            </View>
          }
        />
      ))}

      {!unlocked && locked.length > 0 && (
        <View style={styles.lockedSection}>
          {locked.slice(0, 3).map((_, i) => <BlurredRow key={i} />)}
          <LockOverlay onUnlock={() => setUnlocked(true)} />
        </View>
      )}

      {unlocked && locked.map((u) => (
        <UserRow
          key={u.id}
          item={{ ...u, hint: u.unfollowedAt }}
          right={
            <View style={[
              styles.badge,
              { borderColor: u.wasFollowedBack ? dc.teal + '50' : dc.border },
            ]}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: u.wasFollowedBack ? dc.teal : dc.textMuted }}>
                {u.wasFollowedBack ? 'Karşılıklı' : 'Tek taraflı'}
              </Text>
            </View>
          }
        />
      ))}
    </View>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────
export default function ResultsScreen({ navigation }) {
  const { data } = useAuth();
  const scrollRef = useRef(null);
  const [cardIndex, setCardIndex] = useState(0);

  const profile    = data?.profile    ?? {};
  const stalkers   = data?.stalkers   ?? [];
  const muted      = data?.muted      ?? [];
  const unfollowers = data?.unfollowers ?? [];

  const CARDS = [
    { key: 'score',       component: <ScoreCard profile={profile} /> },
    { key: 'stalkers',    component: <StalkersCard stalkers={stalkers} /> },
    { key: 'muted',       component: <MutedCard muted={muted} /> },
    { key: 'unfollowers', component: <UnfollowersCard unfollowers={unfollowers} /> },
  ];

  const isLast = cardIndex === CARDS.length - 1;

  const next = () => {
    if (isLast) {
      navigation.replace('Main');
    } else {
      const n = cardIndex + 1;
      scrollRef.current?.scrollTo({ x: n * width, animated: true });
      setCardIndex(n);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {CARDS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i <= cardIndex
                ? { backgroundColor: dc.purple, width: i === cardIndex ? 28 : 8 }
                : { backgroundColor: dc.border },
            ]}
          />
        ))}
      </View>

      {/* Cards horizontal pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {CARDS.map((c, i) => (
          <ScrollView
            key={c.key}
            style={{ width }}
            contentContainerStyle={styles.cardScroll}
            showsVerticalScrollIndicator={false}
          >
            {c.component}
          </ScrollView>
        ))}
      </ScrollView>

      {/* Next button */}
      <TouchableOpacity
        style={styles.nextBtn}
        onPress={next}
        activeOpacity={0.85}
      >
        <Text style={styles.nextBtnText}>
          {isLast ? '🚀  Dashboard\'a Geç' : 'Sonraki  →'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dc.background },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md },
  progressDot: { height: 8, borderRadius: 4 },

  cardScroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  // Card wrapper
  card: { paddingBottom: SPACING.lg },

  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: dc.purple + '25',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginBottom: SPACING.md,
  },
  cardBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: dc.purple },

  cardTitle: {
    fontSize: 32, fontWeight: '800', color: dc.textPrimary,
    lineHeight: 38, marginBottom: SPACING.lg,
  },

  // Score card
  scoreCenterRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.lg, marginBottom: SPACING.lg,
  },
  statColumn: { flex: 1, gap: SPACING.sm },
  statItem:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statValue:  { fontSize: 16, fontWeight: '700', color: dc.textPrimary },
  statLabel:  { fontSize: 12, color: dc.textMuted },
  hintBox:    { borderRadius: RADIUS.md, padding: SPACING.md },
  hintText:   { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 },

  // User rows
  userRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: dc.border },
  avatar:    { width: 44, height: 44, borderRadius: RADIUS.full, marginRight: SPACING.md, backgroundColor: dc.cardPurple },
  username:  { fontSize: 14, fontWeight: '600', color: dc.textPrimary },
  usernameHint: { fontSize: 12, color: dc.textMuted, marginTop: 2 },

  storyBadge: { alignItems: 'center', borderRadius: RADIUS.sm, padding: SPACING.sm, minWidth: 50 },
  storyCount: { fontSize: 16, fontWeight: '800' },
  storyLabel: { fontSize: 10, color: dc.textMuted },

  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },

  // Mutual pill
  mutualPill: { borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md, alignSelf: 'flex-start' },
  mutualText: { fontSize: 12, fontWeight: '700' },

  // Locked section
  lockedSection: { marginTop: SPACING.xs, position: 'relative', overflow: 'hidden', borderRadius: RADIUS.md },
  blurRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md, opacity: 0.3 },
  blurCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: dc.border },
  blurLine:   { height: 12, width: '65%', backgroundColor: dc.border, borderRadius: 6 },

  lockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: dc.background + 'DD',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.md, padding: SPACING.lg,
    borderWidth: 1, borderColor: dc.border,
  },
  lockEmoji: { fontSize: 32, marginBottom: SPACING.sm },
  lockTitle: { fontSize: 16, fontWeight: '800', color: dc.textPrimary, marginBottom: 4 },
  lockSub:   { fontSize: 13, color: dc.textMuted, textAlign: 'center', marginBottom: SPACING.md },
  adBtn:     { backgroundColor: dc.gold, borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 10 },
  adBtnText: { color: '#1A1200', fontSize: 14, fontWeight: '700' },

  // Next button
  nextBtn: {
    margin: SPACING.lg,
    backgroundColor: dc.purple,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
