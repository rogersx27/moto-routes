import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { MapPressEvent } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { Route, Coordinate } from '../../models';
import { RouteService, LocationService } from '../../services';
import { AlertDialog, InputModal, Toast, RouteMap } from '../../components';
import { useFirstTimeHint } from '../../hooks/useFirstTimeHint';
import { spacing } from '../../theme';
import type { DrawingMode } from './types';
import { MapToolbar } from './MapToolbar';
import { ModeHintBanner } from './ModeHintBanner';
import { MapEmptyState } from './MapEmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

export const MapScreen: React.FC<Props> = ({ navigation, route: navParams }) => {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [mode, setMode] = useState<DrawingMode>('idle');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [pendingCoord, setPendingCoord] = useState<Coordinate | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [leaveAlert, setLeaveAlert] = useState<{ visible: boolean; action: (() => void) | null }>({
    visible: false,
    action: null,
  });
  const [infoAlert, setInfoAlert] = useState({ visible: false, title: '', message: '' });
  const mapRef = useRef<MapView>(null);
  const { bottom } = useSafeAreaInsets();
  const { triggerHint, hintDialog, dismissHint } = useFirstTimeHint();

  const modeHint = useMemo<Partial<Record<DrawingMode, string>>>(() => ({
    drawing: 'Toca el mapa para trazar la ruta',
    checkpoint: 'Toca el mapa para marcar un checkpoint',
    note: 'Toca el mapa para dejar una nota',
    tracking: `Grabando con GPS… ${currentRoute?.path.length ?? 0} pts`,
  }), [currentRoute?.path.length]);

  useEffect(() => {
    const routeId = navParams.params?.routeId;
    if (routeId) {
      const loaded = RouteService.getRouteById(routeId);
      if (loaded) setCurrentRoute(loaded);
    }
  }, [navParams.params?.routeId]);

  useEffect(() => {
    return () => { LocationService.stopTracking(); };
  }, []);

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

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!currentRoute || currentRoute.path.length === 0) return;
      e.preventDefault();
      setLeaveAlert({ visible: true, action: () => navigation.dispatch(e.data.action) });
    });
    return unsub;
  }, [navigation, currentRoute]);

  const handleMapPress = useCallback((event: MapPressEvent) => {
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
  }, [mode, currentRoute]);

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
    const updated = mode === 'checkpoint'
      ? RouteService.addCheckpoint(currentRoute, pendingCoord, modalInput.trim())
      : RouteService.addNote(currentRoute, pendingCoord, modalInput.trim());
    setCurrentRoute(updated);
    setModalVisible(false);
    setMode(LocationService.isTracking() ? 'tracking' : 'idle');
  }, [mode, currentRoute, pendingCoord, modalInput]);

  const handleStartTracking = useCallback(async () => {
    if (!currentRoute) {
      setInfoAlert({ visible: true, title: 'Crea una ruta primero', message: '' });
      return;
    }
    const started = await LocationService.startTracking((coord) => {
      setUserLocation(coord);
      setCurrentRoute((prev) => prev && RouteService.appendPathPoint(prev, coord));
    });
    if (started) {
      setMode('tracking');
    } else {
      setInfoAlert({
        visible: true,
        title: 'Permiso denegado',
        message: 'Activa la ubicación para grabar el trayecto.',
      });
    }
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

  const handleToggle = useCallback((targetMode: 'drawing' | 'checkpoint' | 'note') => {
    const next = mode === targetMode ? 'idle' : targetMode;
    setMode(next);
    if (next === targetMode) triggerHint(targetMode);
  }, [mode, triggerHint]);

  const modalTitle =
    mode === 'newRoute' ? 'Nombre de la ruta'
    : mode === 'checkpoint' ? 'Nombre del checkpoint'
    : 'Texto de la nota';

  const modalPlaceholder =
    mode === 'newRoute' ? 'Ej: Ruta de montaña'
    : mode === 'checkpoint' ? 'Ej: Gasolinera'
    : 'Ej: Vista increíble aquí';

  const toolbarBottom = Math.max(spacing.xl, bottom + spacing.sm);
  const activeHint = modeHint[mode];

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

      <MapToolbar
        currentRoute={currentRoute}
        mode={mode}
        bottom={toolbarBottom}
        onNewRoute={handleNewRoute}
        onToggleDrawing={() => handleToggle('drawing')}
        onToggleCheckpoint={() => handleToggle('checkpoint')}
        onToggleNote={() => handleToggle('note')}
        onStartTracking={handleStartTracking}
        onStopTracking={handleStopTracking}
        onUndo={handleUndo}
        onSave={handleSave}
      />

      {!currentRoute && mode === 'idle' && <MapEmptyState />}
      {activeHint && <ModeHintBanner hint={activeHint} />}

      <Toast
        message={`Ruta "${currentRoute?.name}" guardada`}
        visible={toastVisible}
        onHide={() => {
          setToastVisible(false);
          navigation.goBack();
        }}
      />

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

      <AlertDialog
        visible={leaveAlert.visible}
        title="Salir sin guardar"
        message="La ruta tiene cambios sin guardar. ¿Descartar?"
        confirmLabel="Descartar"
        confirmVariant="danger"
        onConfirm={() => {
          leaveAlert.action?.();
          setLeaveAlert({ visible: false, action: null });
        }}
        onCancel={() => setLeaveAlert({ visible: false, action: null })}
      />

      <AlertDialog
        visible={infoAlert.visible}
        title={infoAlert.title}
        message={infoAlert.message || undefined}
        onConfirm={() => setInfoAlert((prev) => ({ ...prev, visible: false }))}
      />

      <AlertDialog
        visible={hintDialog.visible}
        title={hintDialog.title}
        message={hintDialog.message}
        confirmLabel="Entendido"
        onConfirm={dismissHint}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
