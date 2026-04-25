import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, DARK_COLORS } from '../constants/theme';

const dc = DARK_COLORS;

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

function CheckRow({ text, ok = true }) {
  return (
    <View style={styles.checkRow}>
      <Text style={[styles.checkIcon, { color: ok ? dc.teal : dc.mauve }]}>
        {ok ? '✓' : '✗'}
      </Text>
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={dc.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.titleMuted}>GhostScore</Text>
          <Text style={styles.titleBold}>Gizlilik Politikası</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Özet kutusu */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>🔒  Kısa Özet</Text>
          <CheckRow text="Instagram şifreni asla kaydetmiyoruz" ok={true} />
          <CheckRow text="Verilerini üçüncü taraflarla paylaşmıyoruz" ok={true} />
          <CheckRow text="Analiz sonuçları şifreli saklanır" ok={true} />
          <CheckRow text="İstediğin zaman tüm verilerini silebilirsin" ok={true} />
          <CheckRow text="Konum, rehber, mikrofon erişimi istenmez" ok={true} />
        </View>

        <Section title="1. Topladığımız Veriler">
          GhostScore, Instagram hesabınıza bağlanmak için bir oturum anahtarı (session token) kullanır. Bu işlem sırasında Instagram kullanıcı adınız sistemimize kaydedilir. Şifreniz hiçbir zaman depolanmaz ve sunucularımıza gönderilmez — yalnızca bağlantı kurulumu sırasında cihazınızın belleğinde kısa süre bulunur ve ardından silinir.{'\n\n'}
          Analiz sonuçları (takipçi sayısı, unfollower listesi vb.) hesabınıza ait anonim veriler olarak güvenli şekilde saklanır.
        </Section>

        <Section title="2. Saklamadığımız Veriler">
          Instagram şifreniz, doğrulama kodlarınız (2FA), özel mesajlarınız, gönderileriniz, hikayeleriniz, konum bilginiz, rehberiniz ve ödeme bilgileriniz GhostScore tarafından hiçbir şekilde işlenmez veya saklanmaz.
        </Section>

        <Section title="3. Verilerinizi Nasıl Kullanıyoruz">
          Topladığımız veriler yalnızca size analiz sonuçları sunmak amacıyla kullanılır. Verileriniz reklam amacıyla kullanılmaz, üçüncü taraflara satılmaz veya aktarılmaz.
        </Section>

        <Section title="4. Güvenlik">
          Instagram oturum anahtarınız AES-256 şifreleme ile korunur. Sunucularımız HTTPS üzerinden hizmet verir. Verilerinize yalnızca siz erişebilirsiniz.
        </Section>

        <Section title="5. Veri Saklama Süresi">
          Analiz sonuçları 30 gün boyunca saklanır, ardından otomatik olarak silinir. Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak kaldırılır.
        </Section>

        <Section title="6. Haklarınız">
          Dilediğiniz zaman hesabınızı ve tüm verilerinizi silebilirsiniz. Bunun için Ayarlar → Hesap → Çıkış Yap ve ardından destek ekibimizle iletişime geçin.
        </Section>

        <Section title="7. İletişim">
          Gizlilik ile ilgili sorularınız için: privacy@ghostscore.app
        </Section>

        <Text style={styles.lastUpdated}>Son güncelleme: Nisan 2025</Text>
        <Text style={styles.disclaimer}>
          Bu uygulama Meta Platforms, Inc. ile resmi olarak bağlantılı değildir.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: dc.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, paddingBottom: SPACING.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titleMuted: { fontSize: 13, color: dc.textMuted },
  titleBold:  { fontSize: 22, fontWeight: '800', color: dc.textPrimary },

  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  summaryBox: {
    backgroundColor: dc.teal + '12',
    borderWidth: 1, borderColor: dc.teal + '30',
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: dc.teal, marginBottom: SPACING.md },
  checkRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm, gap: SPACING.sm },
  checkIcon: { fontSize: 15, fontWeight: '700', marginTop: 1 },
  checkText: { fontSize: 14, color: dc.textSecondary, flex: 1, lineHeight: 20 },

  section:      { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: dc.textPrimary, marginBottom: SPACING.sm },
  sectionBody:  { fontSize: 14, color: dc.textMuted, lineHeight: 22 },

  lastUpdated: { fontSize: 12, color: dc.textMuted, textAlign: 'center', marginBottom: SPACING.sm },
  disclaimer:  { fontSize: 11, color: dc.textMuted, textAlign: 'center', lineHeight: 17 },
});
