import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS } from '../constants/theme';

function Section({ title, children, colors }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: colors.textMuted }]}>{children}</Text>
    </View>
  );
}

function CheckRow({ text, ok = true, colors }) {
  return (
    <View style={styles.checkRow}>
      <Text style={[styles.checkIcon, { color: ok ? colors.teal : colors.mauve }]}>
        {ok ? '✓' : '✗'}
      </Text>
      <Text style={[styles.checkText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen({ navigation }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.titleMuted, { color: colors.textMuted }]}>GhostScore</Text>
          <Text style={[styles.titleBold, { color: colors.textPrimary }]}>Gizlilik Politikası</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Özet kutusu */}
        <View style={[styles.summaryBox, { backgroundColor: colors.teal + '12', borderColor: colors.teal + '30' }]}>
          <Text style={[styles.summaryTitle, { color: colors.teal }]}>🔒  Kısa Özet</Text>
          <CheckRow text="Instagram şifreni asla kaydetmiyoruz" ok={true} colors={colors} />
          <CheckRow text="Verilerini üçüncü taraflarla paylaşmıyoruz" ok={true} colors={colors} />
          <CheckRow text="Analiz sonuçları şifreli saklanır" ok={true} colors={colors} />
          <CheckRow text="İstediğin zaman tüm verilerini silebilirsin" ok={true} colors={colors} />
          <CheckRow text="Konum, rehber, mikrofon erişimi istenmez" ok={true} colors={colors} />
        </View>

        <Section title="1. Topladığımız Veriler" colors={colors}>
          GhostScore, Instagram hesabınıza bağlanmak için bir oturum anahtarı (session token) kullanır. Bu işlem sırasında Instagram kullanıcı adınız sistemimize kaydedilir. Şifreniz hiçbir zaman depolanmaz ve sunucularımıza gönderilmez — yalnızca bağlantı kurulumu sırasında cihazınızın belleğinde kısa süre bulunur ve ardından silinir.{'\n\n'}
          Analiz sonuçları (takipçi sayısı, unfollower listesi vb.) hesabınıza ait anonim veriler olarak güvenli şekilde saklanır.
        </Section>

        <Section title="2. Saklamadığımız Veriler" colors={colors}>
          Instagram şifreniz, doğrulama kodlarınız (2FA), özel mesajlarınız, gönderileriniz, hikayeleriniz, konum bilginiz, rehberiniz ve ödeme bilgileriniz GhostScore tarafından hiçbir şekilde işlenmez veya saklanmaz.
        </Section>

        <Section title="3. Verilerinizi Nasıl Kullanıyoruz" colors={colors}>
          Topladığımız veriler yalnızca size analiz sonuçları sunmak amacıyla kullanılır. Verileriniz reklam amacıyla kullanılmaz, üçüncü taraflara satılmaz veya aktarılmaz.
        </Section>

        <Section title="4. Güvenlik" colors={colors}>
          Instagram oturum anahtarınız AES-256 şifreleme ile korunur. Sunucularımız HTTPS üzerinden hizmet verir. Verilerinize yalnızca siz erişebilirsiniz.
        </Section>

        <Section title="5. Veri Saklama Süresi" colors={colors}>
          Analiz sonuçları 30 gün boyunca saklanır, ardından otomatik olarak silinir. Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak kaldırılır.
        </Section>

        <Section title="6. Haklarınız" colors={colors}>
          Dilediğiniz zaman hesabınızı ve tüm verilerinizi silebilirsiniz. Bunun için Ayarlar → Hesap → Çıkış Yap ve ardından destek ekibimizle iletişime geçin.
        </Section>

        <Section title="7. İletişim" colors={colors}>
          Gizlilik ile ilgili sorularınız için: privacy@ghostscore.app
        </Section>

        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>Son güncelleme: Nisan 2025</Text>
        <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
          Bu uygulama Meta Platforms, Inc. ile resmi olarak bağlantılı değildir.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, paddingBottom: SPACING.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titleMuted: { fontSize: 13 },
  titleBold:  { fontSize: 22, fontWeight: '800' },

  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  summaryBox: {
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.xl, borderWidth: 1,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.md },
  checkRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm, gap: SPACING.sm },
  checkIcon: { fontSize: 15, fontWeight: '700', marginTop: 1 },
  checkText: { fontSize: 14, flex: 1, lineHeight: 20 },

  section:      { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: SPACING.sm },
  sectionBody:  { fontSize: 14, lineHeight: 22 },

  lastUpdated: { fontSize: 12, textAlign: 'center', marginBottom: SPACING.sm },
  disclaimer:  { fontSize: 11, textAlign: 'center', lineHeight: 17 },
});
