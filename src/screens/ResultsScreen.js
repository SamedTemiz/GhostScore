import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ViewIcon, UserMinus01Icon, BadgeAlertIcon, LockIcon, ArrowDown01Icon, AlertSquareIcon, Rocket01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, RADIUS } from '../constants/theme';
const { width } = Dimensions.get('window');

// ─── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 130 }) {
  const { colors } = useTheme();
  const color = score >= 70 ? colors.teal : score >= 40 ? colors.gold : colors.mauve;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 6, borderColor: color,
      backgroundColor: color + '18',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: colors.textPrimary, fontSize: 38, fontWeight: '800', lineHeight: 42 }}>{score}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>skor</Text>
    </View>
  );
}

// ─── Lock Overlay ─────────────────────────────────────────────────────────────
function LockOverlay({ onUnlock }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.lockOverlay, { backgroundColor: colors.background + 'EE', borderColor: colors.border }]}>
      <HugeiconsIcon icon={LockIcon} size={32} color={colors.textMuted} style={{ marginBottom: SPACING.sm }} />
      <Text style={[styles.lockTitle, { color: colors.textPrimary }]}>Tümünü Gör</Text>
      <Text style={[styles.lockSub, { color: colors.textMuted }]}>Listenin tamamına ulaşmak için devam et</Text>
      <TouchableOpacity style={[styles.adBtn, { backgroundColor: colors.purple, flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={onUnlock} activeOpacity={0.85}>
        <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#fff" />
        <Text style={[styles.adBtnText, { color: '#fff' }]}>Tümünü Göster</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Blurred Row (fake) ───────────────────────────────────────────────────────
function BlurredRow() {
  const { colors } = useTheme();
  return (
    <View style={styles.blurRow}>
      <View style={[styles.blurCircle, { backgroundColor: colors.border }]} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={[styles.blurLine, { backgroundColor: colors.border }]} />
        <View style={[styles.blurLine, { width: '45%', backgroundColor: colors.border }]} />
      </View>
    </View>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ item, right }) {
  const { colors } = useTheme();
  const [imgErr, setImgErr] = useState(false);
  return (
    <View style={[styles.userRow, { borderBottomColor: colors.border }]}>
      {item.profilePic && !imgErr
        ? <Image source={{ uri: item.profilePic }} style={[styles.avatar, { backgroundColor: colors.cardPurple }]} onError={() => setImgErr(true)} />
        : <View style={[styles.avatar, { backgroundColor: colors.cardPurple }]} />
      }
      <View style={{ flex: 1 }}>
        <Text style={[styles.username, { color: colors.textPrimary }]}>@{item.username}</Text>
        {item.hint ? <Text style={[styles.usernameHint, { color: colors.textMuted }]}>{item.hint}</Text> : null}
      </View>
      {right}
    </View>
  );
}

// ─── CARD 1: Ghost Score ──────────────────────────────────────────────────────
const SCORE_GHOST = {
  high:   require('../../assets/main/Happy_Spectator.png'),
  mid:    require('../../assets/main/Undecided_Score.png'),
  low:    require('../../assets/main/Surprised_Ghost.png'),
};

function ScoreCard({ profile }) {
  const { colors } = useTheme();
  const score = profile?.ghostScore ?? 0;
  const ghost = score >= 70 ? SCORE_GHOST.high : score >= 40 ? SCORE_GHOST.mid : SCORE_GHOST.low;
  return (
    <View style={styles.card}>
      <View style={[styles.cardBadge, { backgroundColor: colors.purple + '25' }]}>
        <Text style={[styles.cardBadgeText, { color: colors.purple }]}>GHOST SCORE</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Sosyal{'\n'}Skorum</Text>
        <Image source={ghost} style={styles.scoreGhost} />
      </View>

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
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.hintBox, { backgroundColor: score >= 70 ? colors.teal + '18' : colors.gold + '18' }]}>
        {score >= 70 ? (
          <Text style={[styles.hintText, { color: colors.teal }]}>🔥 Profilini aktif ve etkili kullanıyorsun!</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm }}>
            <Image source={SCORE_GHOST.mid} style={{ width: 22, height: 22 }} resizeMode="contain" />
            <Text style={[styles.hintText, { color: colors.gold }]}>Sosyal etkileşimini artırmaya ne dersin?</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── CARD 2: Stalkers ─────────────────────────────────────────────────────────
function StalkersCard({ stalkers }) {
  const { colors } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const visible   = stalkers.slice(0, 1);
  const locked    = stalkers.slice(1);

  return (
    <View style={styles.card}>
      <View style={[styles.cardBadge, { backgroundColor: colors.purple + '25' }]}>
        <Text style={[styles.cardBadgeText, { color: colors.purple }]}>STALKER LİSTESİ</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{stalkers.length} Kişi{'\n'}Seni İzliyor</Text>
        <HugeiconsIcon icon={ViewIcon} size={42} color={colors.purple + '40'} />
      </View>

      {visible.map((s) => (
        <UserRow
          key={s.id}
          item={{ ...s, hint: 'Takip etmiyor' }}
          right={
            <View style={[styles.storyBadge, { backgroundColor: colors.purple + '20' }]}>
              <Text style={[styles.storyCount, { color: colors.purple }]}>{s.viewedStories}</Text>
              <Text style={[styles.storyLabel, { color: colors.textMuted }]}>story</Text>
            </View>
          }
        />
      ))}

      {stalkers.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.cardPurple }]}>
          <Text style={styles.emptyEmoji}>👻</Text>
          <Text style={[styles.emptyTitle, { color: colors.purple }]}>Stalker yok!</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Son storylerine bakan takipçisiz kimse görünmüyor.</Text>
        </View>
      )}

      {!unlocked && stalkers.length > 0 && locked.length > 0 && (
        <View style={styles.lockedSection}>
          {[0, 1, 2].map((i) => <BlurredRow key={i} />)}
          <LockOverlay onUnlock={() => setUnlocked(true)} />
        </View>
      )}

      {unlocked && locked.map((s) => (
        <UserRow
          key={s.id}
          item={{ ...s, hint: 'Takip etmiyor' }}
          right={
            <View style={[styles.storyBadge, { backgroundColor: colors.purple + '20' }]}>
              <Text style={[styles.storyCount, { color: colors.purple }]}>{s.viewedStories}</Text>
              <Text style={[styles.storyLabel, { color: colors.textMuted }]}>story</Text>
            </View>
          }
        />
      ))}
    </View>
  );
}

// ─── CARD 3: Engagement Drop (eski "Muted") ───────────────────────────────────
function MutedCard({ ghostFollowers }) {
  const { colors } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const visible = ghostFollowers.slice(0, 2);
  const locked  = ghostFollowers.slice(2);

  return (
    <View style={styles.card}>
      <View style={[styles.cardBadge, { backgroundColor: colors.mauve + '25' }]}>
        <Text style={[styles.cardBadgeText, { color: colors.mauve }]}>HAYALET TAKİPÇİLER</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{ghostFollowers.length} Kişi{'\n'}Hiç Etkileşmedi</Text>
        <HugeiconsIcon icon={UserMinus01Icon} size={42} color={colors.mauve + '40'} />
      </View>

      <View style={[styles.hintBox, { backgroundColor: colors.mauve + '15', marginBottom: SPACING.md }]}>
        <Text style={[styles.hintText, { color: colors.mauve }]}>
          Seni takip ediyor ama son postlarından hiçbirini beğenmedi.
        </Text>
      </View>

      {ghostFollowers.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.cardMauve }]}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={[styles.emptyTitle, { color: colors.mauve }]}>Hayalet yok!</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Tüm takipçilerin son postlarınla etkileşime geçmiş.</Text>
        </View>
      ) : (
        <>
          {visible.map((g) => (
            <UserRow
              key={g.id}
              item={{ ...g, hint: 'Son postlarda beğeni yok' }}
              right={
                <View style={[styles.storyBadge, { backgroundColor: colors.mauve + '20' }]}>
                  <Text style={[styles.storyCount, { color: colors.mauve }]}>0</Text>
                  <Text style={[styles.storyLabel, { color: colors.textMuted }]}>beğeni</Text>
                </View>
              }
            />
          ))}
          {!unlocked && locked.length > 0 && (
            <View style={styles.lockedSection}>
              {[0, 1, 2].map((i) => <BlurredRow key={i} />)}
              <LockOverlay onUnlock={() => setUnlocked(true)} />
            </View>
          )}
          {unlocked && locked.map((g) => (
            <UserRow
              key={g.id}
              item={{ ...g, hint: 'Son postlarda beğeni yok' }}
              right={
                <View style={[styles.storyBadge, { backgroundColor: colors.mauve + '20' }]}>
                  <Text style={[styles.storyCount, { color: colors.mauve }]}>0</Text>
                  <Text style={[styles.storyLabel, { color: colors.textMuted }]}>beğeni</Text>
                </View>
              }
            />
          ))}
        </>
      )}
    </View>
  );
}

// ─── CARD 4: Unfollowers ──────────────────────────────────────────────────────
function UnfollowersCard({ unfollowers }) {
  const { colors } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const mutual   = unfollowers.filter((u) => u.wasFollowedBack).length;
  const visible  = unfollowers.slice(0, 2);
  const locked   = unfollowers.slice(2);

  return (
    <View style={styles.card}>
      <View style={[styles.cardBadge, { backgroundColor: colors.teal + '25' }]}>
        <Text style={[styles.cardBadgeText, { color: colors.teal }]}>UNFOLLOWER ALARMI</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{unfollowers.length} Kişi{'\n'}Takibi Bıraktı</Text>
        <HugeiconsIcon icon={BadgeAlertIcon} size={42} color={colors.teal + '40'} />
      </View>

      <View style={[styles.mutualPill, { backgroundColor: colors.gold + '20', flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
        <HugeiconsIcon icon={AlertSquareIcon} size={14} color={colors.gold} />
        <Text style={[styles.mutualText, { color: colors.gold }]}>
          {mutual} karşılıklı takip bıraktı
        </Text>
      </View>

      {visible.map((u) => (
        <UserRow
          key={u.id}
          item={{ ...u, hint: u.unfollowedAt }}
          right={
            <View style={[
              styles.badge,
              { borderColor: u.wasFollowedBack ? colors.teal + '50' : colors.border },
            ]}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: u.wasFollowedBack ? colors.teal : colors.textMuted }}>
                {u.wasFollowedBack ? 'Karşılıklı' : 'Tek taraflı'}
              </Text>
            </View>
          }
        />
      ))}

      {!unlocked && locked.length > 0 && (
        <View style={styles.lockedSection}>
          {[0, 1, 2].map((i) => <BlurredRow key={i} />)}
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
              { borderColor: u.wasFollowedBack ? colors.teal + '50' : colors.border },
            ]}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: u.wasFollowedBack ? colors.teal : colors.textMuted }}>
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
  const { colors } = useTheme();
  const { data } = useAuth();
  const scrollRef = useRef(null);
  const [cardIndex, setCardIndex] = useState(0);

  const profile        = data?.profile        ?? {};
  const stalkers       = data?.stalkers       ?? [];
  const ghostFollowers = data?.ghostFollowers ?? [];
  const unfollowers    = data?.unfollowers    ?? [];

  const CARDS = [
    { key: 'score',       component: <ScoreCard profile={profile} /> },
    { key: 'stalkers',    component: <StalkersCard stalkers={stalkers} /> },
    { key: 'muted',       component: <MutedCard ghostFollowers={ghostFollowers} /> },
    { key: 'unfollowers', component: <UnfollowersCard unfollowers={unfollowers} /> },
  ];

  const isLast = cardIndex === CARDS.length - 1;

  const next = () => {
    if (isLast) {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      const n = cardIndex + 1;
      scrollRef.current?.scrollTo({ x: n * width, animated: true });
      setCardIndex(n);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {CARDS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i <= cardIndex
                ? { backgroundColor: colors.purple, width: i === cardIndex ? 28 : 8 }
                : { backgroundColor: colors.border },
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
        {CARDS.map((c) => (
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
        style={[styles.nextBtn, { backgroundColor: colors.purple }]}
        onPress={next}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isLast && <HugeiconsIcon icon={Rocket01Icon} size={20} color="#FFF" />}
          <Text style={styles.nextBtnText}>
            {isLast ? 'Dashboard\'a Geç' : 'Sonraki'}
          </Text>
          {!isLast && <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#FFF" />}
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md },
  progressDot: { height: 8, borderRadius: 4 },

  cardScroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  // Card wrapper
  card: { paddingBottom: SPACING.lg },

  cardBadge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginBottom: SPACING.md,
  },
  cardBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },

  cardTitle: {
    fontSize: 32, fontWeight: '800',
    lineHeight: 38, marginBottom: SPACING.lg,
  },

  scoreGhost: { width: 92, height: 92 },

  // Score card
  scoreCenterRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.lg, marginBottom: SPACING.lg,
  },
  statColumn: { flex: 1, gap: SPACING.sm },
  statItem:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statValue:  { fontSize: 16, fontWeight: '700' },
  statLabel:  { fontSize: 12 },
  hintBox:    { borderRadius: RADIUS.md, padding: SPACING.md },
  hintText:   { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 },

  // User rows
  userRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1 },
  avatar:    { width: 44, height: 44, borderRadius: RADIUS.full, marginRight: SPACING.md },
  username:  { fontSize: 14, fontWeight: '600' },
  usernameHint: { fontSize: 12, marginTop: 2 },

  storyBadge: { alignItems: 'center', borderRadius: RADIUS.sm, padding: SPACING.sm, minWidth: 50 },
  storyCount: { fontSize: 16, fontWeight: '800' },
  storyLabel: { fontSize: 10 },

  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },

  // Mutual pill
  mutualPill: { borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md, alignSelf: 'flex-start' },
  mutualText: { fontSize: 12, fontWeight: '700' },

  // Empty state
  emptyState:  { borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', marginTop: SPACING.sm },
  emptyEmoji:  { fontSize: 36, marginBottom: SPACING.sm },
  emptyTitle:  { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptyText:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Locked section
  lockedSection: { marginTop: SPACING.xs, position: 'relative', overflow: 'hidden', borderRadius: RADIUS.md, minHeight: 170 },
  blurRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md, opacity: 0.3 },
  blurCircle: { width: 44, height: 44, borderRadius: 22 },
  blurLine:   { height: 12, width: '65%', borderRadius: 6 },

  lockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.md, padding: SPACING.lg,
    borderWidth: 1,
  },
  lockEmoji: { fontSize: 32, marginBottom: SPACING.sm },
  lockTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  lockSub:   { fontSize: 13, textAlign: 'center', marginBottom: SPACING.md },
  adBtn:     { borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 10 },
  adBtnText: { color: '#1A1200', fontSize: 14, fontWeight: '700' },

  // Next button
  nextBtn: {
    margin: SPACING.lg,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
