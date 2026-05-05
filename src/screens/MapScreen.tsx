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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Route, Coordinate } from '../models';
import { RouteService, LocationService } from '../services';
import { AppModal, RouteMap } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

type DrawingMode = 'idle' | 'drawing' | 'tracking' | 'checkpoint' | 'note' | 'newRoute';

export const MapScreen: React.FC<Props> = ({ navigation, route: navParams }) => {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [mode, setMode] = useState<DrawingMode>('idle');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [pendingCoord, setPendingCoord] = useState<Coordinate | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const mapRef = useRef<MapView>(null);

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
    setMode('idle');
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
    Alert.alert('Guardada', `Ruta "${currentRoute.name}" guardada.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }, [currentRoute, navigation]);

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

      <View style={styles.toolbar}>
        {!currentRoute && (
          <TouchableOpacity style={styles.btn} onPress={handleNewRoute}>
            <Text style={styles.btnText}>+ Ruta</Text>
          </TouchableOpacity>
        )}

        {currentRoute && mode !== 'tracking' && (
          <>
            <TouchableOpacity
              style={[styles.btn, mode === 'drawing' && styles.btnActive]}
              onPress={() => setMode(mode === 'drawing' ? 'idle' : 'drawing')}
            >
              <Text style={styles.btnText}>Dibujar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, mode === 'checkpoint' && styles.btnActive]}
              onPress={() => setMode(mode === 'checkpoint' ? 'idle' : 'checkpoint')}
            >
              <Text style={styles.btnText}>Checkpoint</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, mode === 'note' && styles.btnActive]}
              onPress={() => setMode(mode === 'note' ? 'idle' : 'note')}
            >
              <Text style={styles.btnText}>Nota</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnGps]} onPress={handleStartTracking}>
              <Text style={styles.btnText}>● GPS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSave}>
              <Text style={styles.btnText}>Guardar</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'tracking' && (
          <TouchableOpacity style={[styles.btn, styles.btnStop]} onPress={handleStopTracking}>
            <Text style={styles.btnText}>■ Detener</Text>
          </TouchableOpacity>
        )}
      </View>

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
              >
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleModalConfirm}>
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
    bottom: 24,
    left: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  btn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnActive: { backgroundColor: '#FF6B00' },
  btnGps: { backgroundColor: '#2196F3' },
  btnSave: { backgroundColor: '#4CAF50' },
  btnStop: { backgroundColor: '#e53935' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: 16,
  },
  modalCancel: { color: '#999', fontSize: 15 },
  modalConfirm: { color: '#FF6B00', fontWeight: '700', fontSize: 15 },
});
