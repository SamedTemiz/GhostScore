import { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Image,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ViewIcon, UserMinus01Icon, BadgeAlertIcon,
  LockIcon, AlertSquareIcon, Rocket01Icon,
  ArrowRight01Icon, PlayCircleIcon,
} from '@hugeicons/core-free-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize, RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, RADIUS } from '../constants/theme';
import { AD_UNIT_IDS } from '../constants/ads';
import unlockState from '../state/unlockState';

const { width } = Dimensions.get('window');

const SCORE_GHOST = {
  high: require('../../assets/main/Happy_Spectator.png'),
  mid:  require('../../assets/main/Undecided_Score.png'),
  low:  require('../../assets/main/Surprised_Ghost.png'),
};

const EMPTY_GHOST = {
  stalkers:    require('../../assets/main/Happy_Spectator.png'),
  muted:       require('../../assets/main/Top_View.png'),
  unfollowers: require('../../assets/main/Shy_Mode.png'),
};

// ─── Score Ring ───────────────────────────────────────────────────────────────
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

// ─── Score Breakdown ─────────────────────────────────────────────────────────
function ScoreBreakdown({ profile }) {
  const { colors } = useTheme();
  const followers  = profile?.followers ?? 0;
  const following  = profile?.following ?? 0;
  const posts      = profile?.posts ?? 0;
  const visibility = profile?.visibilityScore ?? 0;

  const ratio    = followers / Math.max(following, 1);
  const ratioPct = Math.min(100, Math.round((ratio / 3) * 100));
  const postPct  = Math.min(100, Math.round((posts / 100) * 100));

  const bars = [
    { label: 'Takipçi / Takip Oranı', pct: ratioPct,  color: colors.purple },
    { label: 'İçerik Aktivitesi',      pct: postPct,   color: colors.teal },
    { label: 'Görünürlük Skoru',       pct: visibility, color: colors.gold },
  ];

  return (
    <View style={[styles.breakdownBox, { backgroundColor: colors.surface }]}>
      <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>SKOR DETAYI</Text>
      {bars.map((bar) => (
        <View key={bar.label} style={styles.barRow}>
          <View style={styles.barHeader}>
            <Text style={[styles.barName, { color: colors.textSecondary }]}>{bar.label}</Text>
            <Text style={[styles.barPct, { color: bar.color }]}>%{bar.pct}</Text>
          </View>
          <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.barFill, { width: `${bar.pct}%`, backgroundColor: bar.color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ mascot, title, subtitle, tip, accentColor, bgColor }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.emptyContainer, { backgroundColor: bgColor }]}>
      <Image source={mascot} style={styles.emptyMascot} resizeMode="contain" />
      <Text style={[styles.emptyTitle, { color: accentColor }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      {tip ? (
        <View style={[styles.emptyTip, { backgroundColor: accentColor + '18' }]}>
          <Text style={[styles.emptyTipText, { color: accentColor }]}>{tip}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Lock Overlay ─────────────────────────────────────────────────────────────
function LockOverlay({ onUnlock, count, accentColor }) {
  const { colors } = useTheme();
  const accent = accentColor || colors.purple;
  const rewardedRef = useRef(null);

  const handleUnlock = useCallback(() => {
    const rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
    rewardedRef.current = rewarded;
    const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, onUnlock);
    const unsubError  = rewarded.addAdEventListener(AdEventType.ERROR, onUnlock);
    rewarded.load();
    const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => rewarded.show());
    return () => { unsubEarned(); unsubError(); unsubLoaded(); };
  }, [onUnlock]);

  return (
    <View style={[styles.lockOverlay, { backgroundColor: colors.background + 'CC' }]}>
      <HugeiconsIcon icon={LockIcon} size={28} color={accent} style={{ marginBottom: SPACING.xs }} />
      <Text style={[styles.lockTitle, { color: colors.textPrimary }]}>{count} kişi daha gizli</Text>
      <Text style={[styles.lockSub, { color: colors.textMuted }]}>Listenin tamamını görmek için devam et</Text>
      <TouchableOpacity
        style={[styles.adBtn, { backgroundColor: accent, flexDirection: 'row', alignItems: 'center', gap: 6 }]}
        onPress={handleUnlock}
        activeOpacity={0.85}
      >
        <HugeiconsIcon icon={PlayCircleIcon} size={16} color="#fff" />
        <Text style={[styles.adBtnText, { color: '#fff' }]}>Tümünü Göster</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Blurred Row ──────────────────────────────────────────────────────────────
function BlurredRow({ item }) {
  const { colors } = useTheme();
  const [imgErr, setImgErr] = useState(false);
  return (
    <View style={styles.blurRow}>
      <View style={styles.blurAvatarWrap}>
        {item?.profilePic && !imgErr
          ? <Image source={{ uri: item.profilePic }} style={[styles.blurCircle, { backgroundColor: colors.border }]} onError={() => setImgErr(true)} />
          : <View style={[styles.blurCircle, { backgroundColor: colors.border }]} />
        }
        <View style={[StyleSheet.absoluteFill, { borderRadius: 22, backgroundColor: colors.background + 'BB' }]} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ position: 'relative' }}>
          <Text style={[styles.blurUsername, { color: colors.textPrimary, opacity: 0.15 }]}>
            @{item?.username || 'kullanici'}
          </Text>
          <View style={[StyleSheet.absoluteFill, { borderRadius: 4, backgroundColor: colors.border }]} />
        </View>
        <View style={[styles.blurLine, { width: '45%', backgroundColor: colors.border }]} />
      </View>
    </View>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ item, right, accentColor }) {
  const { colors } = useTheme();
  const [imgErr, setImgErr] = useState(false);
  const accent  = accentColor || colors.purple;
  const initial = (item.username || '?')[0].toUpperCase();
  return (
    <View style={[styles.userRow, {
      borderBottomColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: accent + '70',
      paddingLeft: SPACING.sm,
    }]}>
      {item.profilePic && !imgErr
        ? <Image
            source={{ uri: item.profilePic }}
            style={[styles.avatar, { backgroundColor: accent + '20' }]}
            onError={() => setImgErr(true)}
          />
        : <View style={[styles.avatar, { backgroundColor: accent + '20', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: accent, fontSize: 18, fontWeight: '800' }}>{initial}</Text>
          </View>
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
        <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0, flex: 1 }]}>Sosyal{'\n'}Skorum</Text>
        <Image source={ghost} style={styles.scoreGhost} />
      </View>

      <View style={styles.scoreCenterRow}>
        <ScoreRing score={score} />
        <View style={styles.statColumn}>
          {[
            { label: 'Takipçi',    value: (profile?.followers ?? 0).toLocaleString() },
            { label: 'Takip',      value: (profile?.following ?? 0).toLocaleString() },
            { label: 'Post',       value: String(profile?.posts ?? 0) },
            { label: 'Görünürlük', value: `%${profile?.visibilityScore ?? 0}` },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.hintBox, { backgroundColor: score >= 70 ? colors.teal + '18' : colors.gold + '18', marginBottom: SPACING.md }]}>
        {score >= 70 ? (
          <Text style={[styles.hintText, { color: colors.teal }]}>🔥 Profilini aktif ve etkili kullanıyorsun!</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm }}>
            <Image source={SCORE_GHOST.mid} style={{ width: 22, height: 22 }} resizeMode="contain" />
            <Text style={[styles.hintText, { color: colors.gold }]}>Sosyal etkileşimini artırmaya ne dersin?</Text>
          </View>
        )}
      </View>

      <ScoreBreakdown profile={profile} />
    </View>
  );
}

// ─── CARD 2: Stalkers ─────────────────────────────────────────────────────────
function StalkersCard({ stalkers }) {
  const { colors } = useTheme();
  const [unlocked, setUnlocked] = useState(unlockState.stalkers);
  const visible = stalkers.slice(0, 1);
  const locked  = stalkers.slice(1);

  const handleUnlock = useCallback(() => {
    unlockState.stalkers = true;
    setUnlocked(true);
  }, []);

  return (
    <View style={styles.card}>
      <View style={[styles.cardBadge, { backgroundColor: colors.purple + '25' }]}>
        <Text style={[styles.cardBadgeText, { color: colors.purple }]}>STALKER LİSTESİ</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0, flex: 1 }]}>
          {stalkers.length > 0 ? `${stalkers.length} Kişi\nSeni İzliyor` : 'Gizli\nİzleyici Yok'}
        </Text>
        <HugeiconsIcon icon={ViewIcon} size={42} color={colors.purple + '40'} />
      </View>

      {stalkers.length === 0 ? (
        <EmptyState
          mascot={EMPTY_GHOST.stalkers}
          title="Temiz! Gizli izleyici yok."
          subtitle="Son storylerine bakan herkes zaten takipçin."
          tip="💡 Stalkerleri görmek için aktif story paylaşman gerekiyor."
          accentColor={colors.purple}
          bgColor={colors.cardPurple}
        />
      ) : (
        <>
          {visible.map((s) => (
            <UserRow
              key={s.id}
              item={{ ...s, hint: 'Takip etmiyor' }}
              accentColor={colors.purple}
              right={
                <View style={[styles.storyBadge, { backgroundColor: colors.purple + '20' }]}>
                  <Text style={[styles.storyCount, { color: colors.purple }]}>{s.viewedStories}</Text>
                  <Text style={[styles.storyLabel, { color: colors.textMuted }]}>story</Text>
                </View>
              }
            />
          ))}
          {!unlocked && locked.length > 0 && (
            <View style={styles.lockedSection}>
              {locked.slice(0, 3).map((s, i) => <BlurredRow key={i} item={s} />)}
              <LockOverlay onUnlock={handleUnlock} count={locked.length} accentColor={colors.purple} />
            </View>
          )}
          {unlocked && locked.map((s) => (
            <UserRow
              key={s.id}
              item={{ ...s, hint: 'Takip etmiyor' }}
              accentColor={colors.purple}
              right={
                <View style={[styles.storyBadge, { backgroundColor: colors.purple + '20' }]}>
                  <Text style={[styles.storyCount, { color: colors.purple }]}>{s.viewedStories}</Text>
                  <Text style={[styles.storyLabel, { color: colors.textMuted }]}>story</Text>
                </View>
              }
            />
          ))}
        </>
      )}
    </View>
  );
}

// ─── CARD 3: Ghost Followers ──────────────────────────────────────────────────
function MutedCard({ ghostFollowers }) {
  const { colors } = useTheme();
  const [unlocked, setUnlocked] = useState(unlockState.ghostFollowers);
  const visible = ghostFollowers.slice(0, 2);
  const locked  = ghostFollowers.slice(2);

  const handleUnlock = useCallback(() => {
    unlockState.ghostFollowers = true;
    setUnlocked(true);
  }, []);

  return (
    <View style={styles.card}>
      <View style={[styles.cardBadge, { backgroundColor: colors.mauve + '25' }]}>
        <Text style={[styles.cardBadgeText, { color: colors.mauve }]}>HAYALET TAKİPÇİLER</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0, flex: 1 }]}>
          {ghostFollowers.length > 0 ? `${ghostFollowers.length} Kişi\nHiç Etkileşime Girmedi` : 'Etkileşim\nHarika!'}
        </Text>
        <HugeiconsIcon icon={UserMinus01Icon} size={42} color={colors.mauve + '40'} />
      </View>

      {ghostFollowers.length === 0 ? (
        <EmptyState
          mascot={EMPTY_GHOST.muted}
          title="Hayalet takipçi bulunamadı!"
          subtitle="Takipçilerin son postlarınla etkileşime geçmiş görünüyor."
          tip="💡 Son 4 postunu hiç beğenmeyen takipçiler burada listelenir."
          accentColor={colors.mauve}
          bgColor={colors.cardMauve}
        />
      ) : (
        <>
          <View style={[styles.hintBox, { backgroundColor: colors.mauve + '15', marginBottom: SPACING.md }]}>
            <Text style={[styles.hintText, { color: colors.mauve }]}>
              Seni takip ediyor ama son postlarından hiçbirini beğenmedi.
            </Text>
          </View>
          {visible.map((g) => (
            <UserRow
              key={g.id}
              item={{ ...g, hint: 'Son postlarda beğeni yok' }}
              accentColor={colors.mauve}
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
              {locked.slice(0, 3).map((g, i) => <BlurredRow key={i} item={g} />)}
              <LockOverlay onUnlock={handleUnlock} count={locked.length} accentColor={colors.mauve} />
            </View>
          )}
          {unlocked && locked.map((g) => (
            <UserRow
              key={g.id}
              item={{ ...g, hint: 'Son postlarda beğeni yok' }}
              accentColor={colors.mauve}
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
  const [unlocked, setUnlocked] = useState(unlockState.unfollowers);
  const mutual  = unfollowers.filter((u) => u.wasFollowedBack).length;
  const visible = unfollowers.slice(0, 2);
  const locked  = unfollowers.slice(2);

  const handleUnlock = useCallback(() => {
    unlockState.unfollowers = true;
    setUnlocked(true);
  }, []);

  return (
    <View style={styles.card}>
      <View style={[styles.cardBadge, { backgroundColor: colors.teal + '25' }]}>
        <Text style={[styles.cardBadgeText, { color: colors.teal }]}>GERİ TAKİP ETMEYENLER</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0, flex: 1 }]}>
          {unfollowers.length > 0 ? `${unfollowers.length} Kişi\nSeni Takip Etmiyor` : 'Karşılıklı\nTakipleşiyorsunuz!'}
        </Text>
        <HugeiconsIcon icon={BadgeAlertIcon} size={42} color={colors.teal + '40'} />
      </View>

      {unfollowers.length === 0 ? (
        <EmptyState
          mascot={EMPTY_GHOST.unfollowers}
          title="Harika! Hepsi takip ediyor."
          subtitle="Takip ettiğin herkes seni de takip ediyor."
          tip="💡 Takip ettiğin ama seni takip etmeyenler burada görünür."
          accentColor={colors.teal}
          bgColor={colors.cardTeal}
        />
      ) : (
        <>
          {mutual > 0 && (
            <View style={[styles.mutualPill, { backgroundColor: colors.gold + '20', flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <HugeiconsIcon icon={AlertSquareIcon} size={14} color={colors.gold} />
              <Text style={[styles.mutualText, { color: colors.gold }]}>
                {mutual} kişi eskiden seni takip ediyordu
              </Text>
            </View>
          )}
          {visible.map((u) => (
            <UserRow
              key={u.id}
              item={{ ...u, hint: u.unfollowedAt }}
              accentColor={colors.teal}
              right={
                <View style={[styles.badge, { borderColor: u.wasFollowedBack ? colors.teal + '50' : colors.border }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: u.wasFollowedBack ? colors.teal : colors.textMuted }}>
                    {u.wasFollowedBack ? 'Takibi bıraktı' : 'Hiç takip etmedi'}
                  </Text>
                </View>
              }
            />
          ))}
          {!unlocked && locked.length > 0 && (
            <View style={styles.lockedSection}>
              {locked.slice(0, 3).map((u, i) => <BlurredRow key={i} item={u} />)}
              <LockOverlay onUnlock={handleUnlock} count={locked.length} accentColor={colors.teal} />
            </View>
          )}
          {unlocked && locked.map((u) => (
            <UserRow
              key={u.id}
              item={{ ...u, hint: u.unfollowedAt }}
              accentColor={colors.teal}
              right={
                <View style={[styles.badge, { borderColor: u.wasFollowedBack ? colors.teal + '50' : colors.border }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: u.wasFollowedBack ? colors.teal : colors.textMuted }}>
                    {u.wasFollowedBack ? 'Takibi bıraktı' : 'Hiç takip etmedi'}
                  </Text>
                </View>
              }
            />
          ))}
        </>
      )}
    </View>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────
export default function ResultsScreen({ navigation }) {
  const { colors } = useTheme();
  const { data } = useAuth();
  const scrollRef  = useRef(null);
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

      <BannerAd unitId={AD_UNIT_IDS.BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.purple }]}
        onPress={next}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isLast && <HugeiconsIcon icon={Rocket01Icon} size={20} color="#FFF" />}
          <Text style={styles.nextBtnText}>{isLast ? "Dashboard'a Geç" : 'Sonraki'}</Text>
          {!isLast && <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#FFF" />}
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  dotsRow:     { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md },
  progressDot: { height: 8, borderRadius: 4 },
  cardScroll:  { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  card:        { paddingBottom: SPACING.lg },

  cardBadge:     { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4, marginBottom: SPACING.md },
  cardBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  cardTitle:     { fontSize: 32, fontWeight: '800', lineHeight: 38, marginBottom: SPACING.lg },
  scoreGhost:    { width: 92, height: 92 },

  scoreCenterRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.lg },
  statColumn:     { flex: 1, gap: SPACING.sm },
  statItem:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statValue:      { fontSize: 16, fontWeight: '700' },
  statLabel:      { fontSize: 12 },

  hintBox:  { borderRadius: RADIUS.md, padding: SPACING.md },
  hintText: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 },

  // Score breakdown
  breakdownBox:   { borderRadius: RADIUS.md, padding: SPACING.md },
  breakdownLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: SPACING.sm },
  barRow:         { marginBottom: SPACING.sm },
  barHeader:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barName:        { fontSize: 12 },
  barPct:         { fontSize: 12, fontWeight: '700' },
  barTrack:       { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill:        { height: 6, borderRadius: 3 },

  // Empty state
  emptyContainer: { borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginTop: SPACING.xs },
  emptyMascot:    { width: 110, height: 110, marginBottom: SPACING.md },
  emptyTitle:     { fontSize: 18, fontWeight: '800', marginBottom: SPACING.xs, textAlign: 'center' },
  emptySubtitle:  { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
  emptyTip:       { borderRadius: RADIUS.md, padding: SPACING.sm, paddingHorizontal: SPACING.md, alignSelf: 'stretch' },
  emptyTipText:   { fontSize: 12, lineHeight: 18, textAlign: 'center' },

  // User rows
  userRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1 },
  avatar:       { width: 44, height: 44, borderRadius: RADIUS.full, marginRight: SPACING.md },
  username:     { fontSize: 14, fontWeight: '600' },
  usernameHint: { fontSize: 12, marginTop: 2 },

  storyBadge: { alignItems: 'center', borderRadius: RADIUS.sm, padding: SPACING.sm, minWidth: 50 },
  storyCount: { fontSize: 16, fontWeight: '800' },
  storyLabel: { fontSize: 10 },
  badge:      { paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },

  mutualPill: { borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md, alignSelf: 'flex-start' },
  mutualText: { fontSize: 12, fontWeight: '700' },

  // Blurred row
  blurRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md },
  blurAvatarWrap:{ position: 'relative', width: 44, height: 44 },
  blurCircle:    { width: 44, height: 44, borderRadius: 22 },
  blurLine:      { height: 12, width: '65%', borderRadius: 6 },
  blurUsername:  { fontSize: 14, fontWeight: '600', lineHeight: 20 },

  // Lock overlay
  lockedSection: { marginTop: SPACING.xs, position: 'relative', overflow: 'hidden', borderRadius: RADIUS.md, minHeight: 170 },
  lockOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, padding: SPACING.lg },
  lockTitle:     { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  lockSub:       { fontSize: 13, textAlign: 'center', marginBottom: SPACING.md },
  adBtn:         { borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 10 },
  adBtnText:     { fontSize: 14, fontWeight: '700' },

  // Next button
  nextBtn:     { margin: SPACING.lg, borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
