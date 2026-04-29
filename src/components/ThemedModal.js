import { useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle01Icon, Alert01Icon, HelpCircleIcon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * Kullanım:
 *   <ThemedModal
 *     visible={bool}
 *     type="success" | "error" | "confirm" | "info"
 *     title="Başlık"
 *     message="Açıklama"
 *     onConfirm={() => {}}   // onay / tamam butonu
 *     onCancel={() => {}}    // iptal butonu (sadece confirm tipinde)
 *     confirmText="Evet"
 *     cancelText="İptal"
 *   />
 */
export default function ThemedModal({
  visible,
  type = 'info',
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Tamam',
  cancelText = 'İptal',
}) {
  const { colors } = useTheme();
  const scale   = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1,    useNativeDriver: true, tension: 65, friction: 9 }),
        Animated.timing(opacity, { toValue: 1,    duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }
  }, [visible]);

  const META = {
    success: { icon: CheckmarkCircle01Icon, color: '#22C55E',    bg: '#22C55E18' },
    error:   { icon: Alert01Icon,           color: '#EF4444',    bg: '#EF444418' },
    confirm: { icon: HelpCircleIcon,        color: colors.purple, bg: colors.purple + '18' },
    info:    { icon: InformationCircleIcon, color: colors.purple, bg: colors.purple + '18' },
  };

  const { icon, color, bg } = META[type] || META.info;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity, transform: [{ scale }] },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: bg }]}>
            <HugeiconsIcon icon={icon} size={32} color={color} />
          </View>

          {/* Text */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
          ) : null}

          {/* Buttons */}
          <View style={[styles.btnRow, type === 'confirm' && styles.btnRowDouble]}>
            {type === 'confirm' && (
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={[styles.btnCancelText, { color: colors.textSecondary }]}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnConfirm,
                { backgroundColor: type === 'error' ? '#EF4444' : color },
                type === 'confirm' && styles.btnConfirmHalf,
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.btnConfirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: width - SPACING.xl * 2,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  title:   { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  btnRow:  { width: '100%', marginTop: SPACING.md },
  btnRowDouble: { flexDirection: 'row', gap: SPACING.sm },
  btn: {
    flex: 1, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancel:      { borderWidth: 1 },
  btnCancelText:  { fontSize: 15, fontWeight: '600' },
  btnConfirm:     {},
  btnConfirmHalf: {},
  btnConfirmText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
