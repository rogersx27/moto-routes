import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { Route } from '../../models';
import { RouteService } from '../../services';
import { AlertDialog } from '../../components';
import { colors, typography, spacing, radius } from '../../theme';
import { RouteListItem } from './RouteListItem';
import { EmptyRouteList } from './EmptyRouteList';

type Props = NativeStackScreenProps<RootStackParamList, 'RoutesList'>;

interface DeleteTarget {
  id: string;
  name: string;
}

export const RoutesListScreen: React.FC<Props> = ({ navigation }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const swipeableRefs = useRef<Map<string, React.RefObject<SwipeableMethods | null>>>(new Map());

  const getItemRef = useCallback((id: string): React.RefObject<SwipeableMethods | null> => {
    if (!swipeableRefs.current.has(id)) {
      swipeableRefs.current.set(id, React.createRef<SwipeableMethods | null>());
    }
    return swipeableRefs.current.get(id)!;
  }, []);

  useFocusEffect(
    useCallback(() => {
      setRoutes(RouteService.getAllRoutes());
    }, [])
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    RouteService.deleteRoute(deleteTarget.id);
    setRoutes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    swipeableRefs.current.delete(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget]);

  const handleDeleteCancel = useCallback(() => {
    if (deleteTarget) {
      swipeableRefs.current.get(deleteTarget.id)?.current?.close();
    }
    setDeleteTarget(null);
  }, [deleteTarget]);

  const renderItem = useCallback(({ item }: { item: Route }) => (
    <RouteListItem
      item={item}
      swipeRef={getItemRef(item.id)}
      onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
      onDeleteRequest={() => setDeleteTarget({ id: item.id, name: item.name })}
    />
  ), [navigation, getItemRef]);

  return (
    <View style={styles.container}>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={EmptyRouteList}
        contentContainerStyle={[styles.list, routes.length === 0 && styles.listEmpty]}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Map', {})}
        accessibilityLabel="Nueva ruta"
      >
        <Text style={styles.fabText}>+ Nueva ruta</Text>
      </TouchableOpacity>

      <AlertDialog
        visible={deleteTarget !== null}
        title="Eliminar ruta"
        message={deleteTarget ? `¿Eliminar "${deleteTarget.name}"?` : undefined}
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 96 },
  listEmpty: { flex: 1 },
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
