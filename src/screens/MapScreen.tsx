import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import MapView, { MapPressEvent } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Route, Coordinate } from '../models';
import { RouteService, LocationService } from '../services';
import { AppModal, Toast, RouteMap } from '../components';
import { useFirstTimeHint } from '../hooks/useFirstTimeHint';
import { colors, typography, spacing, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

type DrawingMode = 'idle' | 'drawing' | 'tracking' | 'checkpoint' | 'note' | 'newRoute';

export const MapScreen: React.FC<Props> = ({ navigation, route: navParams }) => {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [mode, setMode] = useState<DrawingMode>('idle');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [pendingCoord, setPendingCoord] = useState<Coordinate | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const mapRef = useRef<MapView>(null);
  const { bottom } = useSafeAreaInsets();
  const triggerHint = useFirstTimeHint();

  const MODE_HINT: Partial<Record<DrawingMode, string>> = {
    drawing: 'Toca el mapa para trazar la ruta',
    checkpoint: 'Toca el mapa para marcar un checkpoint',
    note: 'Toca el mapa para dejar una nota',
    tracking: `Grabando con GPS… ${currentRoute?.path.length ?? 0} pts`,
  };

  // Load existing route if editing
  useEffect(() => {
    const routeId = navParams.params?.routeId;
    if (routeId) {
      const loaded = RouteService.getRouteById(routeId);
      if (loaded) setCurrentRoute(loaded);
    }
  }, [navParams.params?.routeId]);

  // Stop tracking when screen unmounts to avoid GPS leak
  useEffect(() => {
    return () => {
      LocationService.stopTracking();
    };
  }, []);

  // Center map on user location on mount
  useEffect(() => {
    LocationService.getCurrentPosition().then((coord) => {
      if (coord) {
        setUserLocation(coord);
        mapRef.current?.animateToRegion({
          ...coord,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    });
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!currentRoute || currentRoute.path.length === 0) return;
      e.preventDefault();
      Alert.alert(
        'Salir sin guardar',
        'La ruta tiene cambios sin guardar. ¿Descartar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return unsub;
  }, [navigation, currentRoute]);

  const handleMapPress = useCallback(
    (event: MapPressEvent) => {
      const coord = event.nativeEvent.coordinate;

      if (mode === 'drawing' && currentRoute) {
        setCurrentRoute((prev) => prev && RouteService.appendPathPoint(prev, coord));
        return;
      }

      if (mode === 'checkpoint' || mode === 'note') {
        setPendingCoord(coord);
        setModalInput('');
        setModalVisible(true);
      }
    },
    [mode, currentRoute]
  );

  const handleModalConfirm = useCallback(() => {
    if (!modalInput.trim()) return;

    if (mode === 'newRoute') {
      const created = RouteService.createRoute(modalInput.trim(), '', []);
      setCurrentRoute(created);
      setModalVisible(false);
      setMode('drawing');
      return;
    }

    if (!pendingCoord || !currentRoute) return;

    const updated =
      mode === 'checkpoint'
        ? RouteService.addCheckpoint(currentRoute, pendingCoord, modalInput.trim())
        : RouteService.addNote(currentRoute, pendingCoord, modalInput.trim());

    setCurrentRoute(updated);
    setModalVisible(false);
    setMode(LocationService.isTracking() ? 'tracking' : 'idle');
  }, [mode, currentRoute, pendingCoord, modalInput]);

  const handleStartTracking = useCallback(async () => {
    if (!currentRoute) {
      Alert.alert('Crea una ruta primero');
      return;
    }

    const started = await LocationService.startTracking((coord) => {
      setUserLocation(coord);
      setCurrentRoute((prev) => prev && RouteService.appendPathPoint(prev, coord));
    });

    if (started) setMode('tracking');
    else Alert.alert('Permiso denegado', 'Activa la ubicación para grabar el trayecto.');
  }, [currentRoute]);

  const handleStopTracking = useCallback(() => {
    LocationService.stopTracking();
    setMode('idle');
  }, []);

  const handleNewRoute = useCallback(() => {
    setModalInput('');
    setModalVisible(true);
    setMode('newRoute');
  }, []);

  const handleSave = useCallback(() => {
    if (!currentRoute) return;
    RouteService.saveRoute(currentRoute);
    setToastVisible(true);
  }, [currentRoute]);

  const handleUndo = useCallback(() => {
    setCurrentRoute((prev) => prev && RouteService.removeLastPathPoint(prev));
  }, []);

  const toolbarBottom = Math.max(spacing.xl, bottom + spacing.sm);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        onPress={handleMapPress}
      >
        {currentRoute && <RouteMap route={currentRoute} />}
      </MapView>

      <View style={[styles.toolbar, { bottom: toolbarBottom }]}>
        {!currentRoute && (
          <TouchableOpacity
            style={styles.btn}
            onPress={handleNewRoute}
            accessibilityLabel="Crear nueva ruta"
          >
            <Text style={styles.btnText}>+ Ruta</Text>
          </TouchableOpacity>
        )}

        {currentRoute && (
          <>
            {mode !== 'tracking' && (
              <TouchableOpacity
                style={[styles.btn, mode === 'drawing' && styles.btnActive]}
                onPress={() => {
                  const next = mode === 'drawing' ? 'idle' : 'drawing';
                  setMode(next);
                  if (next === 'drawing') triggerHint('drawing');
                }}
                accessibilityLabel="Modo dibujar"
              >
                <Text style={styles.btnText}>Dibujar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btn, mode === 'checkpoint' && styles.btnActive]}
              onPress={() => {
                const next = mode === 'checkpoint' ? 'idle' : 'checkpoint';
                setMode(next);
                if (next === 'checkpoint') triggerHint('checkpoint');
              }}
              accessibilityLabel="Añadir checkpoint"
            >
              <Text style={styles.btnText}>Checkpoint</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, mode === 'note' && styles.btnActive]}
              onPress={() => {
                const next = mode === 'note' ? 'idle' : 'note';
                setMode(next);
                if (next === 'note') triggerHint('note');
              }}
              accessibilityLabel="Añadir nota"
            >
              <Text style={styles.btnText}>Nota</Text>
            </TouchableOpacity>

            {mode !== 'tracking' && (
              <TouchableOpacity
                style={[styles.btn, styles.btnGps]}
                onPress={handleStartTracking}
                accessibilityLabel="Grabar ruta con GPS"
              >
                <Text style={styles.btnText}>⏺ Grabar ruta</Text>
              </TouchableOpacity>
            )}

            {mode === 'drawing' && currentRoute.path.length > 0 && (
              <TouchableOpacity
                style={styles.btn}
                onPress={handleUndo}
                accessibilityLabel="Deshacer último punto"
              >
                <Text style={styles.btnText}>↩ Deshacer</Text>
              </TouchableOpacity>
            )}

            {mode !== 'tracking' ? (
              <TouchableOpacity
                style={[styles.btn, styles.btnSave]}
                onPress={handleSave}
                accessibilityLabel="Guardar ruta"
              >
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.btn, styles.btnStop]}
                onPress={handleStopTracking}
                accessibilityLabel="Detener grabación GPS"
              >
                <Text style={styles.btnText}>⏹ Detener</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Empty state — no route loaded */}
      {!currentRoute && mode === 'idle' && (
        <View style={styles.emptyState} pointerEvents="none">
          <Text style={styles.emptyStateText}>
            Toca "+ Ruta" para comenzar a trazar tu recorrido
          </Text>
        </View>
      )}

      {/* Mode hint banner */}
      {MODE_HINT[mode] && (
        <View style={styles.modeBanner} pointerEvents="none">
          <Text style={styles.modeBannerText}>{MODE_HINT[mode]}</Text>
        </View>
      )}

      {/* Save toast */}
      <Toast
        message={`Ruta "${currentRoute?.name}" guardada`}
        visible={toastVisible}
        onHide={() => {
          setToastVisible(false);
          navigation.goBack();
        }}
      />

      {/* Modal for checkpoint / note / new route input */}
      <AppModal visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {mode === 'newRoute'
                ? 'Nombre de la ruta'
                : mode === 'checkpoint'
                ? 'Nombre del checkpoint'
                : 'Texto de la nota'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={modalInput}
              onChangeText={setModalInput}
              placeholder={
                mode === 'newRoute'
                  ? 'Ej: Ruta de montaña'
                  : mode === 'checkpoint'
                  ? 'Ej: Gasolinera'
                  : 'Ej: Vista increíble aquí'
              }
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setMode('idle');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleModalConfirm}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Text style={styles.modalConfirm}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AppModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  toolbar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  btn: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  btnActive: { backgroundColor: colors.primary },
  btnGps: { backgroundColor: colors.info },
  btnSave: { backgroundColor: colors.success },
  btnStop: { backgroundColor: colors.danger },
  btnText: {
    color: colors.surface,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.sm,
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
  emptyState: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    maxWidth: 260,
  },
  emptyStateText: {
    color: colors.textPrimary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
    lineHeight: 22,
  },
  modeBanner: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    backgroundColor: colors.overlayLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
  },
  modeBannerText: {
    color: colors.surface,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  modalCancel: { color: colors.textMuted, fontSize: typography.size.base + 1 },
  modalConfirm: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.base + 1,
  },
});
