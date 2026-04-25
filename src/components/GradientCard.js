import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS, GLOSS } from '../constants/theme';

export default function GradientCard({ children, style, accent = COLORS.primary }) {
  return (
    <View style={[styles.card, SHADOWS.glass, style]}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, // Daha parlak bir yüzey
    borderRadius: RADIUS.lg,
    ...GLOSS, // 3D parlama efekti (border)
    marginBottom: SPACING.md,
    overflow: 'visible', // Gölgelerin görünmesi için
  },
  accentBar: {
    height: 4,
    width: '100%',
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  content: {
    paddingTop: SPACING.xs,
  }
});
