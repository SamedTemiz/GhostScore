import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export default function GradientCard({ children, style, accent = COLORS.primary }) {
  return (
    <View style={[styles.card, { borderColor: accent + '40' }, style]}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
});
