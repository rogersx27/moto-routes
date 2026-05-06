import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import MapView, { MapPressEvent } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Route, Coordinate } from '../models';
import { RouteService, LocationService } from '../services';
import { InputModal, PillButton, Toast, RouteMap } from '../components';
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

  const MODE_HINT = useMemo<Partial<Record<DrawingMode, string>>>(() => ({
    drawing: 'Toca el mapa para trazar la ruta',
    checkpoint: 'Toca el mapa para marcar un checkpoint',
    note: 'Toca el mapa para dejar una nota',
    tracking: `Grabando con GPS… ${currentRoute?.path.length ?? 0} pts`,
  }), [currentRoute?.path.length]);

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

  const modalTitle =
    mode === 'newRoute'
      ? 'Nombre de la ruta'
      : mode === 'checkpoint'
      ? 'Nombre del checkpoint'
      : 'Texto de la nota';

  const modalPlaceholder =
    mode === 'newRoute'
      ? 'Ej: Ruta de montaña'
      : mode === 'checkpoint'
      ? 'Ej: Gasolinera'
      : 'Ej: Vista increíble aquí';

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
          <PillButton
            label="+ Ruta"
            onPress={handleNewRoute}
            accessibilityLabel="Crear nueva ruta"
          />
        )}

        {currentRoute && (
          <>
            {mode !== 'tracking' && (
              <PillButton
                label="Dibujar"
                onPress={() => {
                  const next = mode === 'drawing' ? 'idle' : 'drawing';
                  setMode(next);
                  if (next === 'drawing') triggerHint('drawing');
                }}
                active={mode === 'drawing'}
                accessibilityLabel="Modo dibujar"
              />
            )}

            <PillButton
              label="Checkpoint"
              onPress={() => {
                const next = mode === 'checkpoint' ? 'idle' : 'checkpoint';
                setMode(next);
                if (next === 'checkpoint') triggerHint('checkpoint');
              }}
              active={mode === 'checkpoint'}
              accessibilityLabel="Añadir checkpoint"
            />

            <PillButton
              label="Nota"
              onPress={() => {
                const next = mode === 'note' ? 'idle' : 'note';
                setMode(next);
                if (next === 'note') triggerHint('note');
              }}
              active={mode === 'note'}
              accessibilityLabel="Añadir nota"
            />

            {mode !== 'tracking' && (
              <PillButton
                label="⏺ Grabar ruta"
                onPress={handleStartTracking}
                variant="gps"
                accessibilityLabel="Grabar ruta con GPS"
              />
            )}

            {mode === 'drawing' && currentRoute.path.length > 0 && (
              <PillButton
                label="↩ Deshacer"
                onPress={handleUndo}
                accessibilityLabel="Deshacer último punto"
              />
            )}

            {mode !== 'tracking' ? (
              <PillButton
                label="Guardar"
                onPress={handleSave}
                variant="save"
                accessibilityLabel="Guardar ruta"
              />
            ) : (
              <PillButton
                label="⏹ Detener"
                onPress={handleStopTracking}
                variant="stop"
                accessibilityLabel="Detener grabación GPS"
              />
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
      <InputModal
        visible={modalVisible}
        title={modalTitle}
        placeholder={modalPlaceholder}
        value={modalInput}
        onChange={setModalInput}
        onConfirm={handleModalConfirm}
        onCancel={() => {
          setModalVisible(false);
          setMode('idle');
        }}
        confirmLabel="Agregar"
      />
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
});
