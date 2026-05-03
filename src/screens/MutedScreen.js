import { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft02Icon, UserMinus01Icon, CheckmarkCircle01Icon,
  LockIcon, PlayCircleIcon,
} from '@hugeicons/core-free-icons';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AD_UNIT_IDS } from '../constants/ads';
import unlockState from '../state/unlockState';

const VISIBLE_COUNT = 2;

function UserRow({ item, colors }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <View style={[styles.userRow, { borderBottomColor: colors.border }]}>
      {item.profilePic && !imgErr
        ? <Image source={{ uri: item.profilePic }} style={[styles.avatar, { backgroundColor: colors.cardMauve }]} onError={() => setImgErr(true)} />
        : <View style={[styles.avatar, { backgroundColor: colors.cardMauve }]} />
      }
      <View style={{ flex: 1 }}>
        <Text style={[styles.username, { color: colors.textPrimary }]}>@{item.username}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>Son postlarda beğeni yok</Text>
      </View>
      <View style={[styles.storyBadge, { backgroundColor: colors.mauve + '20' }]}>
        <Text style={[styles.storyCount, { color: colors.mauve }]}>0</Text>
        <Text style={[styles.storyLabel, { color: colors.textMuted }]}>beğeni</Text>
      </View>
    </View>
  );
}

function BlurredRow({ item, colors }) {
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
          <Text style={[styles.username, { color: colors.textPrimary, opacity: 0.15 }]}>
            @{item?.username || 'kullanici'}
          </Text>
          <View style={[StyleSheet.absoluteFill, { borderRadius: 4, backgroundColor: colors.border }]} />
        </View>
        <View style={[styles.blurLine, { backgroundColor: colors.border }]} />
      </View>
    </View>
  );
}

function LockOverlay({ onUnlock, count, colors }) {
  const rewardedRef = useRef(null);

  const handleUnlock = useCallback(() => {
    const rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
    rewardedRef.current = rewarded;
    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, onUnlock);
    rewarded.addAdEventListener(AdEventType.ERROR, onUnlock);
    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => rewarded.show());
    rewarded.load();
  }, [onUnlock]);

  return (
    <View style={[styles.lockOverlay, { backgroundColor: colors.background + 'CC' }]}>
      <HugeiconsIcon icon={LockIcon} size={28} color={colors.mauve} style={{ marginBottom: SPACING.xs }} />
      <Text style={[styles.lockTitle, { color: colors.textPrimary }]}>{count} kişi daha gizli</Text>
      <Text style={[styles.lockSub, { color: colors.textMuted }]}>Listenin tamamını görmek için devam et</Text>
      <TouchableOpacity
        style={[styles.adBtn, { backgroundColor: colors.mauve, flexDirection: 'row', alignItems: 'center', gap: 6 }]}
        onPress={handleUnlock}
        activeOpacity={0.85}
      >
        <HugeiconsIcon icon={PlayCircleIcon} size={16} color="#fff" />
        <Text style={styles.adBtnText}>Tümünü Göster</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MutedScreen({ navigation }) {
  const { colors } = useTheme();
  const { data } = useAuth();
  const ghostFollowers = data?.ghostFollowers ?? [];
  const [unlocked, setUnlocked] = useState(unlockState.ghostFollowers);

  const handleUnlock = useCallback(() => {
    unlockState.ghostFollowers = true;
    setUnlocked(true);
  }, []);

  const visible = ghostFollowers.slice(0, VISIBLE_COUNT);
  const locked  = ghostFollowers.slice(VISIBLE_COUNT);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.titleMuted, { color: colors.textSecondary }]}>Etkileşim Analizi</Text>
          <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Hayalet Takipçiler</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.badge2, { backgroundColor: colors.mauve + '25' }]}>
          <Text style={[styles.badgeText, { color: colors.mauve }]}>HAYALET TAKİPÇİLER</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {ghostFollowers.length} Kişi{'\n'}Hiç Etkileşime Girmedi
          </Text>
          <HugeiconsIcon icon={UserMinus01Icon} size={42} color={colors.mauve + '40'} />
        </View>

        <View style={[styles.hintBox, { backgroundColor: colors.mauve + '15', marginBottom: SPACING.md }]}>
          <Text style={[styles.hintText, { color: colors.mauve }]}>
            Seni takip ediyor ama son postlarından hiçbirini beğenmedi.
          </Text>
        </View>

        {ghostFollowers.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.cardMauve }]}>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={48} color={colors.teal} style={{ marginBottom: SPACING.sm }} />
            <Text style={[styles.emptyTitle, { color: colors.mauve }]}>Hayalet yok!</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Tüm takipçilerin son postlarınla etkileşime geçmiş.</Text>
          </View>
        ) : (
          <>
            {visible.map((g) => (
              <UserRow key={g.id} item={g} colors={colors} />
            ))}

            {!unlocked && locked.length > 0 && (
              <View style={[styles.lockedSection, { minHeight: Math.min(locked.length, 3) * 68 + 140 }]}>
                {locked.slice(0, 3).map((g, i) => (
                  <BlurredRow key={i} item={g} colors={colors} />
                ))}
                <LockOverlay onUnlock={handleUnlock} count={locked.length} colors={colors} />
              </View>
            )}

            {unlocked && locked.map((g) => (
              <UserRow key={g.id} item={g} colors={colors} />
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  header:     { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.md },
  backBtn:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titleMuted: { fontSize: 13 },
  titleBold:  { fontSize: 22, fontWeight: '800' },

  badge2:    { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4, marginBottom: SPACING.md },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },

  titleRow:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACING.lg },
  cardTitle: { fontSize: 32, fontWeight: '800', lineHeight: 38, flex: 1 },

  hintBox:  { borderRadius: RADIUS.md, padding: SPACING.md },
  hintText: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 },

  userRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1 },
  avatar:     { width: 44, height: 44, borderRadius: RADIUS.full, marginRight: SPACING.md },
  username:   { fontSize: 14, fontWeight: '600' },
  hint:       { fontSize: 12, marginTop: 2 },
  storyBadge: { alignItems: 'center', borderRadius: RADIUS.sm, padding: SPACING.sm, minWidth: 50 },
  storyCount: { fontSize: 16, fontWeight: '800' },
  storyLabel: { fontSize: 10 },

  blurRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md },
  blurAvatarWrap: { position: 'relative', width: 44, height: 44 },
  blurCircle:     { width: 44, height: 44, borderRadius: 22 },
  blurLine:       { height: 12, width: '45%', borderRadius: 6 },

  lockedSection: { marginTop: SPACING.xs, position: 'relative', overflow: 'hidden', borderRadius: RADIUS.md },
  lockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.md, padding: SPACING.lg,
  },
  lockTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  lockSub:   { fontSize: 13, textAlign: 'center', marginBottom: SPACING.md },
  adBtn:     { borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 10 },
  adBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  emptyState: { borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', marginTop: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptyText:  { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
