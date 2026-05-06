import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { Route } from '../../models';
import { RouteService } from '../../services';
import { colors, typography, spacing, radius } from '../../theme';

interface Props {
  item: Route;
  swipeRef: React.RefObject<SwipeableMethods | null>;
  onPress: () => void;
  onDeleteRequest: () => void;
}

export const RouteListItem: React.FC<Props> = ({ item, swipeRef, onPress, onDeleteRequest }) => {
  const km = RouteService.calculateDistance(item.path);
  const date = new Date(item.createdAt).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      renderRightActions={() => (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={onDeleteRequest}
          accessibilityLabel={`Eliminar ruta ${item.name}`}
        >
          <Text style={styles.deleteActionText}>Eliminar</Text>
        </TouchableOpacity>
      )}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        accessibilityLabel={`Ruta ${item.name}`}
      >
        <Text style={styles.routeName}>{item.name}</Text>
        <Text style={styles.routeMeta}>
          {km.toFixed(1)} km · {item.checkpoints.length} checkpoints · {item.notes.length} notas
        </Text>
        <Text style={styles.routeDate}>{date}</Text>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  routeName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  routeMeta: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  routeDate: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    marginBottom: spacing.md,
    borderRadius: radius.md,
  },
  deleteActionText: {
    color: colors.surface,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
});
