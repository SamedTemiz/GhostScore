// Tek tema — referans görselden birebir alınan renkler
// Sol ekran: koyu lacivert zemin, lila / somon / mint kartlar, altın buton

export const DARK_COLORS = {
  // ── Zemin ─────────────────────────────────────────────────
  background: '#1A1628',   // referans: sol ekran koyu lacivert-mor zemin
  surface:    '#231D38',   // biraz daha açık yüzey (kartlar, modal)

  // ── Kart arka planları (koyu ton) ─────────────────────────
  cardPurple: '#2E2448',   // lila kart zemini
  cardMauve:  '#362030',   // somon/pembe kart zemini
  cardTeal:   '#1A3030',   // mint/teal kart zemini
  cardGold:   '#2E2010',   // altın kart zemini

  // ── Ana renkler — referans kart renkleri ──────────────────
  purple:    '#C4AFCC',    // referans: lila/lavander kart rengi
  purpleDim: '#C4AFCC20',
  mauve:     '#C49088',    // referans: somon/pembe kart rengi
  mauveDim:  '#C4908820',
  teal:      '#6ABFB5',    // referans: mint/teal kart rengi
  tealDim:   '#6ABFB520',
  gold:      '#E8C040',    // referans: "Get Started" buton rengi
  goldDim:   '#E8C04020',

  // ── Semantik ──────────────────────────────────────────────
  success: '#6ABFB5',
  warning: '#E8C040',
  danger:  '#C49088',

  // ── Yazı ──────────────────────────────────────────────────
  textPrimary:   '#F0EEF8',  // beyaz-mor
  textSecondary: '#B8B0D0',  // soluk mor-gri (okunabilir)
  textMuted:     '#8878A8',  // muted — koyu zeminde görünür

  // ── UI ────────────────────────────────────────────────────
  border: '#3A3060',   // biraz daha belirgin kart sınırı
  white:  '#FFFFFF',
};

// Geriye dönük uyumluluk — uygulamada her zaman dark tema kullanılır
export const COLORS = DARK_COLORS;

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const RADIUS = {
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  full: 9999,
};
