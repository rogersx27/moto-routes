import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Route } from '../models';
import { RouteService } from '../services';

type Props = NativeStackScreenProps<RootStackParamList, 'RouteDetail'>;

export const RouteDetailScreen: React.FC<Props> = ({ navigation, route: navParams }) => {
  const [route, setRoute] = useState<Route | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loaded = RouteService.getRouteById(navParams.params.routeId);
      setRoute(loaded);
    }, [navParams.params.routeId])
  );

  if (!route) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Ruta no encontrada.</Text>
      </View>
    );
  }

  const formattedDate = new Date(route.createdAt).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{route.name}</Text>
      <Text style={styles.date}>{formattedDate}</Text>

      {route.description ? (
        <Text style={styles.description}>{route.description}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>
        Checkpoints ({route.checkpoints.length})
      </Text>
      {route.checkpoints.map((cp) => (
        <View key={cp.id} style={styles.listItem}>
          <Text style={styles.itemLabel}>📍 {cp.label}</Text>
          <Text style={styles.itemCoord}>
            {cp.coordinate.latitude.toFixed(5)}, {cp.coordinate.longitude.toFixed(5)}
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Notas ({route.notes.length})</Text>
      {route.notes.map((note) => (
        <View key={note.id} style={styles.listItem}>
          <Text style={styles.itemLabel}>📝 {note.text}</Text>
          <Text style={styles.itemCoord}>
            {note.coordinate.latitude.toFixed(5)}, {note.coordinate.longitude.toFixed(5)}
          </Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => navigation.navigate('Map', { routeId: route.id })}
      >
        <Text style={styles.editBtnText}>Editar en el mapa</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: '#999', fontSize: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  date: { fontSize: 13, color: '#888', marginTop: 4 },
  description: { fontSize: 15, color: '#444', marginTop: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  itemLabel: { fontSize: 15, color: '#1a1a1a' },
  itemCoord: { fontSize: 11, color: '#aaa', marginTop: 2 },
  editBtn: {
    marginTop: 32,
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
