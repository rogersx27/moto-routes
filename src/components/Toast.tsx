import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme';

interface Props {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export const Toast: React.FC<Props> = ({ message, visible, onHide }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;

    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onHide());
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { top: top + spacing.md, opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.overlayLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    zIndex: 999,
  },
  text: {
    color: colors.surface,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
