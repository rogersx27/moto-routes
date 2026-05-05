import * as SQLite from 'expo-sqlite';
import type { Route, Checkpoint, Note, Coordinate } from '../models';

const DB_NAME = 'moto_routes.db';

// Singleton database connection
let db: SQLite.SQLiteDatabase | null = null;

const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
};

const parseJsonPath = (raw: string): Coordinate[] => {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const initSchema = (): void => {
  const database = getDb();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checkpoints (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      label TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );
  `);
};

const saveRoute = (route: Route): void => {
  const database = getDb();

  try {
    database.runSync(
      `INSERT OR REPLACE INTO routes (id, name, description, path, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [route.id, route.name, route.description, JSON.stringify(route.path), route.createdAt, route.updatedAt]
    );

    route.checkpoints.forEach((cp) => {
      database.runSync(
        `INSERT OR REPLACE INTO checkpoints (id, route_id, latitude, longitude, label, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cp.id, cp.routeId, cp.coordinate.latitude, cp.coordinate.longitude, cp.label, cp.createdAt]
      );
    });

    route.notes.forEach((note) => {
      database.runSync(
        `INSERT OR REPLACE INTO notes (id, route_id, latitude, longitude, text, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [note.id, note.routeId, note.coordinate.latitude, note.coordinate.longitude, note.text, note.createdAt]
      );
    });
  } catch (e) {
    throw new Error(`Error al guardar la ruta: ${(e as Error).message}`);
  }
};

const fetchAllRoutes = (): Route[] => {
  const database = getDb();

  const rows = database.getAllSync<{
    id: string;
    name: string;
    description: string;
    path: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM routes ORDER BY updated_at DESC');

  return rows.map((row) => {
    const checkpoints = fetchCheckpointsByRouteId(row.id);
    const notes = fetchNotesByRouteId(row.id);

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      path: parseJsonPath(row.path),
      checkpoints,
      notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
};

const fetchRouteById = (id: string): Route | null => {
  const database = getDb();

  const row = database.getFirstSync<{
    id: string;
    name: string;
    description: string;
    path: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM routes WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    path: JSON.parse(row.path),
    checkpoints: fetchCheckpointsByRouteId(row.id),
    notes: fetchNotesByRouteId(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const fetchCheckpointsByRouteId = (routeId: string): Checkpoint[] => {
  const database = getDb();

  const rows = database.getAllSync<{
    id: string;
    route_id: string;
    latitude: number;
    longitude: number;
    label: string;
    created_at: number;
  }>('SELECT * FROM checkpoints WHERE route_id = ?', [routeId]);

  return rows.map((row) => ({
    id: row.id,
    routeId: row.route_id,
    coordinate: { latitude: row.latitude, longitude: row.longitude },
    label: row.label,
    createdAt: row.created_at,
  }));
};

const fetchNotesByRouteId = (routeId: string): Note[] => {
  const database = getDb();

  const rows = database.getAllSync<{
    id: string;
    route_id: string;
    latitude: number;
    longitude: number;
    text: string;
    created_at: number;
  }>('SELECT * FROM notes WHERE route_id = ?', [routeId]);

  return rows.map((row) => ({
    id: row.id,
    routeId: row.route_id,
    coordinate: { latitude: row.latitude, longitude: row.longitude },
    text: row.text,
    createdAt: row.created_at,
  }));
};

const deleteRoute = (id: string): void => {
  const database = getDb();
  database.runSync('DELETE FROM routes WHERE id = ?', [id]);
};

export const DatabaseService = {
  initSchema,
  saveRoute,
  fetchAllRoutes,
  fetchRouteById,
  deleteRoute,
};
