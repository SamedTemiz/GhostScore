import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

// Simple SVG-free score ring using border trick
export default function ScoreRing({ score = 72, size = 120 }) {
  const color = score >= 70 ? COLORS.success : score >= 40 ? COLORS.warning : COLORS.danger;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={[styles.score, { color }]}>{score}</Text>
      <Text style={styles.label}>Ghost{'\n'}Score</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
});
