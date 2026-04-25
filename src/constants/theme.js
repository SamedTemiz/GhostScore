// Referans görseldeki 3 ekranın renk paletleri
// Sol: Dark, Orta/Sağ: Light
// 3D Glassy UI Refresh (Experiment)

export const LIGHT_COLORS = {
  // ── Zemin ─────────────────────────────────────────────────
  background: '#EDEEF0',   // Orijinal gri zemin
  surface:    '#FFFFFF',   // beyaz kartlar

  // ── 3D/Glassy Kart Renkleri (Orijinal renkler + Şeffaflık) ──
  cardPurple: 'rgba(224, 215, 229, 0.85)',   // #E0D7E5 + alpha
  cardMauve:  'rgba(238, 219, 215, 0.85)',   // #EEDBD7 + alpha
  cardTeal:   'rgba(218, 237, 235, 0.85)',   // #DAEDEB + alpha
  cardGold:   'rgba(248, 240, 208, 0.85)',   // #F8F0D0 + alpha
  
  // ── Glassmorphism için saf beyaz geçişler ────────────────
  glassWhite: 'rgba(255, 255, 255, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.8)',

  // ── Koyu Kartlar ──────────────────────────────────────────
  cardDark:   '#5C4B5E',   // Orijinal koyu mor

  // ── Ana renkler (Orijinal değerler) ───────────────────────
  purple:    '#9B7AAB',    
  mauve:     '#B56D63',    
  teal:      '#4A8F87',    
  gold:      '#D4A017',    

  // ── Yazı ──────────────────────────────────────────────────
  textPrimary:   '#1A1628',  // Orijinal koyu lacivert
  textSecondary: '#4A455C',  
  textMuted:     '#7C788A',  

  // ── UI ────────────────────────────────────────────────────
  border: '#D1D5DB',
  white:  '#FFFFFF',
  purpleBright: '#C4AFCC', 

  // ── Uyumluluk ─────────────────────────────────────────────
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
  success: '#6ABFB5',
  warning: '#E8C040',
  danger:  '#C49088',
  primary: '#C4AFCC',
  card:    '#231D38',
};

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

// ── 3D Effects ─────────────────────────────────────────────
export const SHADOWS = {
  glass: {
    shadowColor: '#A482BA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  glowPurple: {
    shadowColor: '#A482BA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  glowGold: {
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  }
};

export const GLOSS = {
  borderWidth: 1.5,
  borderColor: 'rgba(255, 255, 255, 0.5)',
};
