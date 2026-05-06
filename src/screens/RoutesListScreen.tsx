import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Route } from '../models';
import { RouteService } from '../services';
import { colors, typography, spacing, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RoutesList'>;

export const RoutesListScreen: React.FC<Props> = ({ navigation }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  useFocusEffect(
    useCallback(() => {
      setRoutes(RouteService.getAllRoutes());
    }, [])
  );

  const handleDelete = useCallback((id: string, name: string): void => {
    Alert.alert('Eliminar ruta', `¿Eliminar "${name}"?`, [
      {
        text: 'Cancelar',
        style: 'cancel',
        onPress: () => swipeableRefs.current.get(id)?.close(),
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          RouteService.deleteRoute(id);
          setRoutes((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  }, []);

  const renderRightActions = useCallback((id: string, name: string) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDelete(id, name)}
      accessibilityLabel={`Eliminar ruta ${name}`}
    >
      <Text style={styles.deleteActionText}>Eliminar</Text>
    </TouchableOpacity>
  ), [handleDelete]);

  const renderItem = useCallback(({ item }: { item: Route }) => {
    const km = RouteService.calculateDistance(item.path);
    const date = new Date(item.createdAt).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
          else swipeableRefs.current.delete(item.id);
        }}
        renderRightActions={() => renderRightActions(item.id, item.name)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
          accessibilityLabel={`Ruta ${item.name}`}
        >
          <Text style={styles.routeName}>{item.name}</Text>
          <Text style={styles.routeMeta}>
            {km.toFixed(1)} km · {item.checkpoints.length} checkpoints · {item.notes.length} notas
          </Text>
          <Text style={styles.routeDate}>{date}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
  }, [navigation, renderRightActions]);

  const emptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏍️</Text>
      <Text style={styles.emptyTitle}>Aún no tienes rutas</Text>
      <Text style={styles.emptySubtitle}>
        Toca el botón + para crear tu primera ruta
      </Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={[styles.list, routes.length === 0 && styles.listEmpty]}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Map', {})}
        accessibilityLabel="Nueva ruta"
      >
        <Text style={styles.fabText}>+ Nueva ruta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 96 },
  listEmpty: { flex: 1 },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: { fontSize: 56, marginBottom: spacing.lg },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    elevation: 4,
  },
  fabText: {
    color: colors.surface,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.md,
  },
});
