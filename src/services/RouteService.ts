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

const saveRoute = (route: Route): void => {
  DatabaseService.saveRoute(route);
};

const getAllRoutes = (): Route[] => DatabaseService.fetchAllRoutes();

const getRouteById = (id: string): Route | null => DatabaseService.fetchRouteById(id);

const deleteRoute = (id: string): void => DatabaseService.deleteRoute(id);

export const RouteService = {
  createRoute,
  addCheckpoint,
  addNote,
  appendPathPoint,
  removeLastPathPoint,
  saveRoute,
  getAllRoutes,
  getRouteById,
  deleteRoute,
};
