import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Route } from '../models';
import { RouteService } from '../services';
import { colors, typography, spacing, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RoutesList'>;

export const RoutesListScreen: React.FC<Props> = ({ navigation }) => {
  const [routes, setRoutes] = useState<Route[]>([]);

  useFocusEffect(
    useCallback(() => {
      setRoutes(RouteService.getAllRoutes());
    }, [])
  );

  const handleDelete = (id: string, name: string): void => {
    Alert.alert('Eliminar ruta', `¿Eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          RouteService.deleteRoute(id);
          setRoutes((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
      accessibilityLabel={`Ruta ${item.name}`}
    >
      <Text style={styles.routeName}>{item.name}</Text>
      <Text style={styles.routeMeta}>
        {item.checkpoints.length} checkpoints · {item.notes.length} notas
      </Text>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id, item.name)}
        accessibilityLabel={`Eliminar ruta ${item.name}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteBtnText}>Eliminar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aún no tienes rutas guardadas.</Text>
        }
        contentContainerStyle={styles.list}
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
  list: { padding: spacing.lg, paddingBottom: 80 },
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
  deleteBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  deleteBtnText: { color: colors.danger, fontSize: typography.size.sm },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    color: colors.textMuted,
    fontSize: typography.size.md,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 28,
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
