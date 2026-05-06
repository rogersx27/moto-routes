import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import MapView from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { Route } from '../../models';
import { RouteService } from '../../services';
import { InputModal, ActionButton, RouteMap } from '../../components';
import { colors, typography, spacing } from '../../theme';
import { RouteDetailHeader } from './RouteDetailHeader';
import { CheckpointsList } from './CheckpointsList';
import { NotesList } from './NotesList';

type Props = NativeStackScreenProps<RootStackParamList, 'RouteDetail'>;

const getRegionFromPath = (path: { latitude: number; longitude: number }[]) => {
  if (path.length === 0) return null;
  const lats = path.map((p) => p.latitude);
  const lons = path.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.01),
    longitudeDelta: Math.max((maxLon - minLon) * 1.4, 0.01),
  };
};

export const RouteDetailScreen: React.FC<Props> = ({ navigation, route: navParams }) => {
  const [route, setRoute] = useState<Route | null>(null);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameInput, setRenameInput] = useState('');

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

  const km = RouteService.calculateDistance(route.path);
  const region = getRegionFromPath(route.path);
  const hasAnnotations = route.checkpoints.length > 0 || route.notes.length > 0;

  const handleRenameConfirm = () => {
    if (!renameInput.trim()) return;
    RouteService.renameRoute(route.id, renameInput.trim());
    setRoute((prev) => prev && { ...prev, name: renameInput.trim() });
    setRenameVisible(false);
  };

  const handleDelete = () => {
    Alert.alert('Eliminar ruta', '¿Eliminar esta ruta permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          RouteService.deleteRoute(route.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {region ? (
        <MapView
          style={styles.mapPreview}
          initialRegion={region}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <RouteMap route={route} />
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Sin recorrido trazado</Text>
        </View>
      )}

      <RouteDetailHeader
        name={route.name}
        formattedDate={formattedDate}
        km={km}
        description={route.description}
        onRenamePress={() => {
          setRenameInput(route.name);
          setRenameVisible(true);
        }}
      />

      <CheckpointsList checkpoints={route.checkpoints} />
      <NotesList notes={route.notes} />

      {!hasAnnotations && (
        <Text style={styles.noAnnotations}>Sin checkpoints ni notas aún.</Text>
      )}

      <ActionButton
        label="Editar ruta"
        onPress={() => navigation.navigate('Map', { routeId: route.id })}
        accessibilityLabel="Editar ruta en el mapa"
        style={{ marginTop: spacing.xxl }}
      />

      <ActionButton
        label="Eliminar ruta"
        onPress={handleDelete}
        variant="danger"
        accessibilityLabel="Eliminar ruta"
        style={{ marginTop: spacing.md }}
      />

      <InputModal
        visible={renameVisible}
        title="Renombrar ruta"
        placeholder="Nombre de la ruta"
        value={renameInput}
        onChange={setRenameInput}
        onConfirm={handleRenameConfirm}
        onCancel={() => setRenameVisible(false)}
        confirmLabel="Guardar"
        confirmDisabled={!renameInput.trim()}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: colors.textMuted, fontSize: typography.size.md },
  mapPreview: { width: '100%', height: 220 },
  mapPlaceholder: {
    height: 120,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: { color: colors.textMuted, fontSize: typography.size.base },
  noAnnotations: {
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textMuted,
    fontSize: typography.size.base,
    paddingHorizontal: spacing.xl,
  },
});
