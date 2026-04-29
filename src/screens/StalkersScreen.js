import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon, ViewIcon } from '@hugeicons/core-free-icons';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const GHOST = require('../../assets/main/Suspicious_Look.png');

function StalkerRow({ item, index, colors }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rank, { color: colors.textMuted }]}>#{index + 1}</Text>
      {item.profilePic && !imgErr
        ? <Image source={{ uri: item.profilePic }} style={[styles.avatar, { backgroundColor: colors.cardPurple }]} onError={() => setImgErr(true)} />
        : <View style={[styles.avatar, { backgroundColor: colors.cardPurple }]} />
      }
      <View style={styles.info}>
        <Text style={[styles.username, { color: colors.textPrimary }]}>@{item.username}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Takip etmiyor</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.cardPurple }]}>
        <Text style={[styles.badgeValue, { color: colors.purple }]}>{item.viewedStories}</Text>
        <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>story</Text>
      </View>
    </View>
  );
}

export default function StalkersScreen({ navigation }) {
  const { colors } = useTheme();
  const { data } = useAuth();
  const stalkers = data?.stalkers ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.titleMuted, { color: colors.textSecondary }]}>Seni izleyenler</Text>
          <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Stalker Listesi</Text>
        </View>
      </View>

      {/* Colored chart section */}
      <View style={[styles.chartSection, { backgroundColor: colors.cardPurple, borderColor: colors.border }]}>
        <View style={styles.chartLeft}>
          <Text style={[styles.bigCount, { color: colors.purple }]}>{stalkers.length}</Text>
          <Text style={[styles.bigCountLabel, { color: colors.textSecondary }]}>Stalker bulundu</Text>
          <View style={[styles.pill, { backgroundColor: colors.purple + '22', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <HugeiconsIcon icon={ViewIcon} size={14} color={colors.purple} />
            <Text style={{ fontSize: 11, color: colors.purple, fontWeight: '600' }}>Story izleyici</Text>
          </View>
        </View>
        <Image source={GHOST} style={styles.headerGhost} />
      </View>

      <FlatList
        data={stalkers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <StalkerRow item={item} index={index} colors={colors} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Henüz stalker yok 🎉</Text>}
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
  chartLeft:     {},
  bigCount:      { fontSize: 48, fontWeight: '800', lineHeight: 52 },
  bigCountLabel: { fontSize: 13, marginTop: 2, marginBottom: SPACING.sm },
  pill:          { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4, alignSelf: 'flex-start' },
  headerGhost: { width: 88, height: 88 },

  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  row:  { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1 },
  rank: { fontSize: 13, width: 28, fontWeight: '600' },
  avatar:     { width: 44, height: 44, borderRadius: RADIUS.full, marginRight: SPACING.md },
  info:       { flex: 1 },
  username:   { fontSize: 14, fontWeight: '600' },
  subtitle:   { fontSize: 12, marginTop: 2 },
  badge:      { alignItems: 'center', borderRadius: RADIUS.sm, padding: SPACING.sm, minWidth: 48 },
  badgeValue: { fontSize: 16, fontWeight: '800' },
  badgeLabel: { fontSize: 10 },
  empty:      { textAlign: 'center', marginTop: SPACING.xxl },
});
