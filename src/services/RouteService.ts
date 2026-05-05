import * as Crypto from 'expo-crypto';
import type { Route, Checkpoint, Note, Coordinate } from '../models';
import { DatabaseService } from './DatabaseService';

const createRoute = (name: string, description: string, path: Coordinate[]): Route => {
  const now = Date.now();

  return {
    id: Crypto.randomUUID(),
    name,
    description,
    path,
    checkpoints: [],
    notes: [],
    createdAt: now,
    updatedAt: now,
  };
};

const addCheckpoint = (route: Route, coordinate: Coordinate, label: string): Route => {
  const checkpoint: Checkpoint = {
    id: Crypto.randomUUID(),
    routeId: route.id,
    coordinate,
    label,
    createdAt: Date.now(),
  };

  return {
    ...route,
    checkpoints: [...route.checkpoints, checkpoint],
    updatedAt: Date.now(),
  };
};

const addNote = (route: Route, coordinate: Coordinate, text: string): Route => {
  const note: Note = {
    id: Crypto.randomUUID(),
    routeId: route.id,
    coordinate,
    text,
    createdAt: Date.now(),
  };

  return {
    ...route,
    notes: [...route.notes, note],
    updatedAt: Date.now(),
  };
};

const appendPathPoint = (route: Route, coordinate: Coordinate): Route => ({
  ...route,
  path: [...route.path, coordinate],
  updatedAt: Date.now(),
});

const removeLastPathPoint = (route: Route): Route => ({
  ...route,
  path: route.path.slice(0, -1),
  updatedAt: Date.now(),
});

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

const calculateDistance = (path: Coordinate[]): number => {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const dLat = toRad(curr.latitude - prev.latitude);
    const dLon = toRad(curr.longitude - prev.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(prev.latitude)) *
        Math.cos(toRad(curr.latitude)) *
        Math.sin(dLon / 2) ** 2;
    total += EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
};

const saveRoute = (route: Route): void => {
  DatabaseService.saveRoute(route);
};

const getAllRoutes = (): Route[] => DatabaseService.fetchAllRoutes();

const getRouteById = (id: string): Route | null => DatabaseService.fetchRouteById(id);

const deleteRoute = (id: string): void => DatabaseService.deleteRoute(id);

const renameRoute = (id: string, name: string): void => DatabaseService.renameRoute(id, name);

export const RouteService = {
  createRoute,
  addCheckpoint,
  addNote,
  appendPathPoint,
  removeLastPathPoint,
  calculateDistance,
  saveRoute,
  getAllRoutes,
  getRouteById,
  deleteRoute,
  renameRoute,
};
