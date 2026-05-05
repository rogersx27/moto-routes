import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import MapView from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Route } from '../models';
import { RouteService } from '../services';
import { AppModal, RouteMap } from '../components';
import { colors, typography, spacing, radius } from '../theme';

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
      {/* Map preview */}
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

      {/* Header */}
      <TouchableOpacity
        style={styles.titleRow}
        onPress={() => {
          setRenameInput(route.name);
          setRenameVisible(true);
        }}
        accessibilityLabel="Renombrar ruta"
      >
        <Text style={styles.title}>{route.name}</Text>
        <Text style={styles.editIcon}>✏️</Text>
      </TouchableOpacity>
      <Text style={styles.date}>{formattedDate}</Text>
      {km > 0 && (
        <Text style={styles.distance}>{km.toFixed(2)} km recorridos</Text>
      )}

      {route.description ? (
        <Text style={styles.description}>{route.description}</Text>
      ) : null}

      {/* Checkpoints */}
      {route.checkpoints.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            Checkpoints ({route.checkpoints.length})
          </Text>
          {route.checkpoints.map((cp) => (
            <View key={cp.id} style={styles.listItem}>
              <Text style={styles.itemLabel}>📍 {cp.label}</Text>
            </View>
          ))}
        </>
      )}

      {/* Notes */}
      {route.notes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            Notas ({route.notes.length})
          </Text>
          {route.notes.map((note) => (
            <View key={note.id} style={styles.listItem}>
              <Text style={styles.itemLabel}>📝 {note.text}</Text>
            </View>
          ))}
        </>
      )}

      {!hasAnnotations && (
        <Text style={styles.noAnnotations}>Sin checkpoints ni notas aún.</Text>
      )}

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => navigation.navigate('Map', { routeId: route.id })}
        accessibilityLabel="Editar ruta en el mapa"
      >
        <Text style={styles.editBtnText}>Editar ruta</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDelete}
        accessibilityLabel="Eliminar ruta"
      >
        <Text style={styles.deleteBtnText}>Eliminar ruta</Text>
      </TouchableOpacity>

      {/* Rename modal */}
      <AppModal visible={renameVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Renombrar ruta</Text>
            <TextInput
              style={styles.modalInput}
              value={renameInput}
              onChangeText={setRenameInput}
              placeholder="Nombre de la ruta"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setRenameVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRenameConfirm}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Text style={[
                  styles.modalConfirm,
                  !renameInput.trim() && styles.modalConfirmDisabled,
                ]}>
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AppModal>
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

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  editIcon: { fontSize: 18 },
  date: {
    fontSize: typography.size.sm,
    color: '#888',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  distance: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  description: {
    fontSize: typography.size.base,
    color: '#444',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: '#333',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  listItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xl,
  },
  itemLabel: { fontSize: typography.size.base, color: colors.textPrimary },
  noAnnotations: {
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textMuted,
    fontSize: typography.size.base,
    paddingHorizontal: spacing.xl,
  },

  editBtn: {
    marginTop: spacing.xxl,
    marginHorizontal: spacing.xl,
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
  deleteBtn: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.size.md + 1,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: typography.size.base + 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: spacing.lg,
  },
  modalCancel: { color: colors.textMuted, fontSize: typography.size.base + 1 },
  modalConfirm: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.base + 1,
  },
  modalConfirmDisabled: { color: colors.border },
});
