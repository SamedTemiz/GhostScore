import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const GHOST = require('../../assets/main/Shy_Mode.png');

function MutedRow({ item, colors }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Image source={{ uri: item.profilePic }} style={[styles.avatar, { backgroundColor: colors.cardMauve }]} />
      <View style={styles.info}>
        <Text style={[styles.username, { color: colors.textPrimary }]}>@{item.username}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Son görülme: {item.lastSeen}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.cardMauve }]}>
        <Text style={[styles.badgeValue, { color: colors.mauve }]}>{item.rankDelta}</Text>
        <Text style={[styles.badgeLabel, { color: colors.textMuted }]}>sıra</Text>
      </View>
    </View>
  );
}

export default function MutedScreen({ navigation }) {
  const { colors } = useTheme();
  const { data } = useAuth();
  const muted = data?.muted ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.titleMuted, { color: colors.textSecondary }]}>Sessizleşenler</Text>
          <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Mute Listesi</Text>
        </View>
      </View>

      {/* Colored chart section */}
      <View style={[styles.chartSection, { backgroundColor: colors.cardMauve, borderColor: colors.border }]}>
        <View style={styles.chartLeft}>
          <Text style={[styles.bigCount, { color: colors.mauve }]}>{muted.length}</Text>
          <Text style={[styles.bigCountLabel, { color: colors.textSecondary }]}>Mute tespit edildi</Text>
          <View style={[styles.pill, { backgroundColor: colors.mauve + '22', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <Ionicons name="notifications-off-outline" size={14} color={colors.mauve} />
            <Text style={{ fontSize: 11, color: colors.mauve, fontWeight: '600' }}>Sıralama düştü</Text>
          </View>
        </View>
        <Image source={GHOST} style={styles.headerGhost} />
      </View>

      <FlatList
        data={muted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MutedRow item={item} colors={colors} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Mute listesi boş</Text>}
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

  list:  { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  row:   { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1 },
  avatar:     { width: 44, height: 44, borderRadius: RADIUS.full, marginRight: SPACING.md },
  info:       { flex: 1 },
  username:   { fontSize: 14, fontWeight: '600' },
  subtitle:   { fontSize: 12, marginTop: 2 },
  badge:      { alignItems: 'center', borderRadius: RADIUS.sm, padding: SPACING.sm, minWidth: 48 },
  badgeValue: { fontSize: 16, fontWeight: '800' },
  badgeLabel: { fontSize: 10 },
  empty:      { textAlign: 'center', marginTop: SPACING.xxl },
});
