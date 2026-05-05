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

type Props = NativeStackScreenProps<RootStackParamList, 'RoutesList'>;

export const RoutesListScreen: React.FC<Props> = ({ navigation }) => {
  const [routes, setRoutes] = useState<Route[]>([]);

  // Reload routes every time this screen gains focus
  useFocusEffect(
    useCallback(() => {
      try {
        setRoutes(RouteService.getAllRoutes());
      } catch {
        Alert.alert('Error', 'No se pudieron cargar las rutas.');
      }
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
    >
      <Text style={styles.routeName}>{item.name}</Text>
      <Text style={styles.routeMeta}>
        {item.checkpoints.length} checkpoints · {item.notes.length} notas
      </Text>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id, item.name)}
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
      >
        <Text style={styles.fabText}>+ Nueva ruta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  routeName: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  routeMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  deleteBtn: { marginTop: 10, alignSelf: 'flex-start' },
  deleteBtnText: { color: '#e53935', fontSize: 13 },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    color: '#999',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#FF6B00',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 14,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
