import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const CHART_H = [0.6, 0.4, 1.0, 0.7, 0.5, 0.9, 0.65, 0.85, 0.45, 0.75];

function UnfollowerRow({ item, colors }) {
  const mutual = item.wasFollowedBack;
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Image source={{ uri: item.profilePic }} style={[styles.avatar, { backgroundColor: colors.cardTeal }]} />
      <View style={styles.info}>
        <Text style={[styles.username, { color: colors.textPrimary }]}>@{item.username}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{item.unfollowedAt}</Text>
      </View>
      <View style={[
        styles.badge,
        { backgroundColor: mutual ? colors.tealDim : colors.surface, borderColor: mutual ? colors.teal + '50' : colors.border },
      ]}>
        <Text style={[styles.badgeText, { color: mutual ? colors.teal : colors.textMuted }]}>
          {mutual ? 'Karşılıklı' : 'Tek taraflı'}
        </Text>
      </View>
    </View>
  );
}

export default function UnfollowersScreen({ navigation }) {
  const { colors } = useTheme();
  const { data } = useAuth();
  const unfollowers = data?.unfollowers ?? [];
  const mutual = unfollowers.filter((u) => u.wasFollowedBack).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.titleMuted, { color: colors.textSecondary }]}>Takibi bırakanlar</Text>
          <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Unfollower Alarmı</Text>
        </View>
      </View>

      {/* Colored chart section */}
      <View style={[styles.chartSection, { backgroundColor: colors.cardTeal, borderColor: colors.border }]}>
        <View style={styles.chartLeft}>
          <Text style={[styles.bigCount, { color: colors.teal }]}>{unfollowers.length}</Text>
          <Text style={[styles.bigCountLabel, { color: colors.textSecondary }]}>Unfollower bulundu</Text>
          <View style={[styles.pill, { backgroundColor: colors.teal + '22' }]}>
            <Text style={{ fontSize: 11, color: colors.teal, fontWeight: '600' }}>
              🚨 {mutual} karşılıklı
            </Text>
          </View>
        </View>
        <View style={styles.chartBars}>
          {CHART_H.map((h, i) => (
            <View key={i} style={[styles.chartBar, { height: h * 64, backgroundColor: colors.teal, opacity: 0.28 + h * 0.52 }]} />
          ))}
        </View>
      </View>

      <FlatList
        data={unfollowers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UnfollowerRow item={item} colors={colors} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Kimse çıkmamış ✨</Text>}
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
  chartBars:     { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  chartBar:      { width: 8, borderRadius: 4 },

  list:  { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  row:   { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1 },
  avatar:    { width: 44, height: 44, borderRadius: RADIUS.full, marginRight: SPACING.md },
  info:      { flex: 1 },
  username:  { fontSize: 14, fontWeight: '600' },
  subtitle:  { fontSize: 12, marginTop: 2 },
  badge:     { paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty:     { textAlign: 'center', marginTop: SPACING.xxl },
});
