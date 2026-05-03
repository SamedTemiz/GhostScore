import { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon, BadgeAlertIcon, AlertSquareIcon, LockIcon, PlayCircleIcon } from '@hugeicons/core-free-icons';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AD_UNIT_IDS } from '../constants/ads';
import unlockState from '../state/unlockState';

const VISIBLE_COUNT = 2;

const MASCOT = require('../../assets/main/Shy_Mode.png');

function UserRow({ item, colors }) {
  const [imgErr, setImgErr] = useState(false);
  const mutual  = item.wasFollowedBack;
  const initial = (item.username || '?')[0].toUpperCase();
  return (
    <View style={[styles.userRow, {
      borderBottomColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: colors.teal + '70',
      paddingLeft: SPACING.sm,
    }]}>
      {item.profilePic && !imgErr
        ? <Image source={{ uri: item.profilePic }} style={[styles.avatar, { backgroundColor: colors.teal + '20' }]} onError={() => setImgErr(true)} />
        : <View style={[styles.avatar, { backgroundColor: colors.teal + '20', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: colors.teal, fontSize: 18, fontWeight: '800' }}>{initial}</Text>
          </View>
      }
      <View style={{ flex: 1 }}>
        <Text style={[styles.username, { color: colors.textPrimary }]}>@{item.username}</Text>
        {item.hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{item.hint}</Text> : null}
      </View>
      <View style={[styles.badge, { borderColor: mutual ? colors.teal + '50' : colors.border }]}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: mutual ? colors.teal : colors.textMuted }}>
          {mutual ? 'Takibi bıraktı' : 'Hiç takip etmedi'}
        </Text>
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
      <HugeiconsIcon icon={LockIcon} size={28} color={colors.teal} style={{ marginBottom: SPACING.xs }} />
      <Text style={[styles.lockTitle, { color: colors.textPrimary }]}>{count} kişi daha gizli</Text>
      <Text style={[styles.lockSub, { color: colors.textMuted }]}>Listenin tamamını görmek için devam et</Text>
      <TouchableOpacity
        style={[styles.adBtn, { backgroundColor: colors.teal, flexDirection: 'row', alignItems: 'center', gap: 6 }]}
        onPress={handleUnlock}
        activeOpacity={0.85}
      >
        <HugeiconsIcon icon={PlayCircleIcon} size={16} color="#fff" />
        <Text style={styles.adBtnText}>Tümünü Göster</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function UnfollowersScreen({ navigation }) {
  const { colors } = useTheme();
  const { data } = useAuth();
  const unfollowers = data?.unfollowers ?? [];
  const [unlocked, setUnlocked] = useState(unlockState.unfollowers);

  const handleUnlock = useCallback(() => {
    unlockState.unfollowers = true;
    setUnlocked(true);
  }, []);

  const mutual  = unfollowers.filter((u) => u.wasFollowedBack).length;
  const visible = unfollowers.slice(0, VISIBLE_COUNT);
  const locked  = unfollowers.slice(VISIBLE_COUNT);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.titleMuted, { color: colors.textSecondary }]}>Takibi bırakanlar</Text>
          <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Unfollower Alarmı</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.badge2, { backgroundColor: colors.teal + '25' }]}>
          <Text style={[styles.badgeText, { color: colors.teal }]}>GERİ TAKİP ETMEYENLER</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {unfollowers.length > 0 ? `${unfollowers.length} Kişi\nSeni Takip Etmiyor` : 'Karşılıklı\nTakipleşiyorsunuz!'}
          </Text>
          <HugeiconsIcon icon={BadgeAlertIcon} size={42} color={colors.teal + '40'} />
        </View>

        {unfollowers.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.cardTeal }]}>
            <Image source={MASCOT} style={styles.emptyMascot} resizeMode="contain" />
            <Text style={[styles.emptyTitle, { color: colors.teal }]}>Harika! Hepsi takip ediyor.</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Takip ettiğin herkes seni de takip ediyor.
            </Text>
            <View style={[styles.emptyTip, { backgroundColor: colors.teal + '18' }]}>
              <Text style={[styles.emptyTipText, { color: colors.teal }]}>
                💡 Takip ettiğin ama seni takip etmeyenler burada görünür.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {mutual > 0 && (
              <View style={[styles.mutualPill, { backgroundColor: colors.gold + '20' }]}>
                <HugeiconsIcon icon={AlertSquareIcon} size={14} color={colors.gold} />
                <Text style={[styles.mutualText, { color: colors.gold }]}>
                  {mutual} kişi eskiden seni takip ediyordu
                </Text>
              </View>
            )}

            {visible.map((u) => (
              <UserRow key={u.id} item={{ ...u, hint: u.unfollowedAt }} colors={colors} />
            ))}

            {!unlocked && locked.length > 0 && (
              <View style={[styles.lockedSection, { minHeight: Math.min(locked.length, 3) * 68 + 140 }]}>
                {locked.slice(0, 3).map((u, i) => (
                  <BlurredRow key={i} item={u} colors={colors} />
                ))}
                <LockOverlay onUnlock={handleUnlock} count={locked.length} colors={colors} />
              </View>
            )}

            {unlocked && locked.map((u) => (
              <UserRow key={u.id} item={{ ...u, hint: u.unfollowedAt }} colors={colors} />
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

  mutualPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md, alignSelf: 'flex-start' },
  mutualText: { fontSize: 12, fontWeight: '700' },

  userRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1 },
  avatar:   { width: 44, height: 44, borderRadius: RADIUS.full, marginRight: SPACING.md },
  username: { fontSize: 14, fontWeight: '600' },
  hint:     { fontSize: 12, marginTop: 2 },
  badge:    { paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },

  blurRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md },
  blurAvatarWrap: { position: 'relative', width: 44, height: 44 },
  blurCircle:     { width: 44, height: 44, borderRadius: 22 },
  blurLine:       { height: 12, width: '45%', borderRadius: 6 },

  lockedSection: { marginTop: SPACING.xs, position: 'relative', overflow: 'hidden', borderRadius: RADIUS.md },
  lockOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, padding: SPACING.lg },
  lockTitle:     { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  lockSub:       { fontSize: 13, textAlign: 'center', marginBottom: SPACING.md },
  adBtn:         { borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 10 },
  adBtnText:     { color: '#fff', fontSize: 14, fontWeight: '700' },

  emptyContainer: { borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginTop: SPACING.xs },
  emptyMascot:    { width: 110, height: 110, marginBottom: SPACING.md },
  emptyTitle:     { fontSize: 18, fontWeight: '800', marginBottom: SPACING.xs, textAlign: 'center' },
  emptySubtitle:  { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
  emptyTip:       { borderRadius: RADIUS.md, padding: SPACING.sm, paddingHorizontal: SPACING.md, alignSelf: 'stretch' },
  emptyTipText:   { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
