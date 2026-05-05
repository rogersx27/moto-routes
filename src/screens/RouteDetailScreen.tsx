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
import { colors, typography, spacing, radius } from '../theme';

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
        accessibilityLabel="Editar ruta en el mapa"
      >
        <Text style={styles.editBtnText}>Editar en el mapa</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: colors.textMuted, fontSize: typography.size.md },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  date: { fontSize: typography.size.sm, color: '#888', marginTop: spacing.xs },
  description: {
    fontSize: typography.size.base,
    color: '#444',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: '#333',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  listItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemLabel: { fontSize: typography.size.base, color: colors.textPrimary },
  itemCoord: { fontSize: typography.size.xs, color: '#aaa', marginTop: 2 },
  editBtn: {
    marginTop: spacing.xxl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editBtnText: {
    color: colors.surface,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.md,
  },
});
