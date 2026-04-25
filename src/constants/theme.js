// Referans görseldeki 3 ekranın renk paletleri
// Sol: Dark, Orta/Sağ: Light

export const LIGHT_COLORS = {
  // ── Zemin ─────────────────────────────────────────────────
  background: '#EDEEF0',   // referans orta/sağ ekran açık gri zemin
  surface:    '#FFFFFF',   // beyaz kartlar

  // ── Kart arka planları (Pastel Tonlar - Referanstan) ───────
  cardPurple: '#E0D7E5',   // lila kart (soft)
  cardMauve:  '#EEDBD7',   // somon kart (soft)
  cardTeal:   '#DAEDEB',   // mint kart (soft)
  cardGold:   '#F8F0D0',   // altın kart (soft)
  
  // ── Koyu Kartlar (Orta ekrandaki üst kart gibi) ──────────
  cardDark:   '#5C4B5E',   // orta ekran "Your Health Data" kartı

  // ── Ana renkler ───────────────────────────────────────────
  purple:    '#9B7AAB',    // metin/ikon için daha koyu lila
  mauve:     '#B56D63',    // metin/ikon için daha koyu somon
  teal:      '#4A8F87',    // metin/ikon için daha koyu mint
  gold:      '#D4A017',    // metin/ikon için daha koyu altın

  // ── Yazı ──────────────────────────────────────────────────
  textPrimary:   '#1A1628',  // koyu lacivert (eski zemin rengimiz)
  textSecondary: '#4A455C',  // orta gri-lacivert
  textMuted:     '#7C788A',  // silik yazı

  // ── UI ────────────────────────────────────────────────────
  border: '#D1D5DB',
  white:  '#FFFFFF',
  purpleBright: '#C4AFCC', // Referans orijinal pastel renkler

  // ── Uyumluluk için eklenenler ─────────────────────────────
  success: '#4DBDBD',
  warning: '#C9A84C',
  danger:  '#D4808A',
  primary: '#9B7AAB',
  card:    '#FFFFFF',
};

export const DARK_COLORS = {
  background: '#1A1628',
  surface:    '#231D38',
  cardPurple: '#2E2448',
  cardMauve:  '#362030',
  cardTeal:   '#1A3030',
  cardGold:   '#2E2010',
  purple:    '#C4AFCC',
  mauve:     '#C49088',
  teal:      '#6ABFB5',
  gold:      '#E8C040',
  textPrimary:   '#F0EEF8',
  textSecondary: '#B8B0D0',
  textMuted:     '#8878A8',
  border: '#3A3060',
  white:  '#FFFFFF',

  // ── Uyumluluk için eklenenler ─────────────────────────────
  success: '#6ABFB5',
  warning: '#E8C040',
  danger:  '#C49088',
  primary: '#C4AFCC',
  card:    '#231D38',
};

// Varsayılan olarak LIGHT_COLORS kullanacağız (Referans uyumu için)
export const COLORS = LIGHT_COLORS;

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
