import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon, UserMinus01Icon, InformationCircleIcon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const GHOST = require('../../assets/main/Shy_Mode.png');

function GhostRow({ item, colors }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      {item.profilePic && !imgErr
        ? <Image source={{ uri: item.profilePic }} style={[styles.avatar, { backgroundColor: colors.cardMauve }]} onError={() => setImgErr(true)} />
        : <View style={[styles.avatar, { backgroundColor: colors.cardMauve }]} />
      }
      <View style={styles.info}>
        <Text style={[styles.username, { color: colors.textPrimary }]}>@{item.username}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Son postlarda beğeni yok</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.cardMauve }]}>
        <Text style={[styles.badgeValue, { color: colors.mauve }]}>0</Text>
        <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>beğeni</Text>
      </View>
    </View>
  );
}

export default function MutedScreen({ navigation }) {
  const { colors } = useTheme();
  const { data } = useAuth();
  const ghostFollowers = data?.ghostFollowers ?? [];

  const ghostRate = data?.profile
    ? Math.round((ghostFollowers.length / Math.max(data.profile.followers, 1)) * 100)
    : 0;

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

      <View style={[styles.chartSection, { backgroundColor: colors.cardMauve, borderColor: colors.border }]}>
        <View style={styles.chartLeft}>
          <Text style={[styles.bigCount, { color: colors.mauve }]}>{ghostFollowers.length}</Text>
          <Text style={[styles.bigCountLabel, { color: colors.textSecondary }]}>Hayalet takipçi</Text>
          <View style={[styles.pill, { backgroundColor: colors.mauve + '22', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <HugeiconsIcon icon={UserMinus01Icon} size={14} color={colors.mauve} />
            <Text style={{ fontSize: 11, color: colors.mauve, fontWeight: '600' }}>%{ghostRate} oran</Text>
          </View>
        </View>
        <Image source={GHOST} style={styles.headerGhost} />
      </View>

      {ghostFollowers.length > 0 && (
        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={InformationCircleIcon} size={16} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Son 4 postunu analiz ettik. Bu kişiler takipçin ama hiçbirini beğenmedi.
          </Text>
        </View>
      )}

      <FlatList
        data={ghostFollowers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <GhostRow item={item} colors={colors} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={48} color={colors.teal} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Hayalet yok!</Text>
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              Tüm takipçilerin son postlarınla etkileşime geçmiş.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header:     { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.md },
  backBtn:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titleMuted: { fontSize: 13 },
  titleBold:  { fontSize: 22, fontWeight: '800' },

  chartSection: {
    marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', borderWidth: 1,
  },
  bigCount:      { fontSize: 48, fontWeight: '800', lineHeight: 52 },
  bigCountLabel: { fontSize: 13, marginTop: 2, marginBottom: SPACING.sm },
  pill:          { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4, alignSelf: 'flex-start' },
  headerGhost:   { width: 88, height: 88 },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    borderRadius: RADIUS.md, borderWidth: 1, padding: SPACING.sm,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },

  list:      { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1 },
  avatar:    { width: 44, height: 44, borderRadius: RADIUS.full, marginRight: SPACING.md },
  info:      { flex: 1 },
  username:  { fontSize: 14, fontWeight: '600' },
  subtitle:  { fontSize: 12, marginTop: 2 },
  badge:     { alignItems: 'center', borderRadius: RADIUS.sm, padding: SPACING.sm, minWidth: 48 },
  badgeValue: { fontSize: 16, fontWeight: '800' },
  badgeLabel: { fontSize: 10 },

  emptyWrap:  { alignItems: 'center', marginTop: SPACING.xxl, gap: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  empty:      { textAlign: 'center', fontSize: 14, lineHeight: 21 },
});
