import * as ExpoLocation from 'expo-location';
import type { Coordinate } from '../models';

type LocationCallback = (coordinate: Coordinate) => void;

let watchSubscription: ExpoLocation.LocationSubscription | null = null;

const requestPermissions = async (): Promise<boolean> => {
  const { status: foreground } = await ExpoLocation.requestForegroundPermissionsAsync();
  if (foreground !== 'granted') return false;

  const { status: background } = await ExpoLocation.requestBackgroundPermissionsAsync();
  return background === 'granted';
};

const getCurrentPosition = async (): Promise<Coordinate | null> => {
  const { status } = await ExpoLocation.getForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const location = await ExpoLocation.getCurrentPositionAsync({
    accuracy: ExpoLocation.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};

const startTracking = async (onUpdate: LocationCallback): Promise<boolean> => {
  const granted = await requestPermissions();
  if (!granted) return false;

  watchSubscription = await ExpoLocation.watchPositionAsync(
    {
      accuracy: ExpoLocation.Accuracy.High,
      // Update every 5 seconds or 10 meters
      timeInterval: 5000,
      distanceInterval: 10,
    },
    (location) => {
      onUpdate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  );

  return true;
};

const stopTracking = (): void => {
  watchSubscription?.remove();
  watchSubscription = null;
};

const isTracking = (): boolean => watchSubscription !== null;

export const LocationService = {
  requestPermissions,
  getCurrentPosition,
  startTracking,
  stopTracking,
  isTracking,
};
