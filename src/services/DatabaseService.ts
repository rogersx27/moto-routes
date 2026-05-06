import * as SQLite from 'expo-sqlite';
import type { Route, Checkpoint, Note } from '../models';

const DB_NAME = 'moto_routes.db';

// Singleton database connection
let db: SQLite.SQLiteDatabase | null = null;

const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
    db.execSync(`
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
  }
  return db;
};

const saveRoute = (route: Route): void => {
  const database = getDb();

  database.withTransactionSync(() => {
    database.runSync(
      `INSERT OR REPLACE INTO routes (id, name, description, path, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [route.id, route.name, route.description, JSON.stringify(route.path), route.createdAt, route.updatedAt]
    );

    // Delete before insert so removed checkpoints/notes don't linger
    database.runSync('DELETE FROM checkpoints WHERE route_id = ?', [route.id]);
    database.runSync('DELETE FROM notes WHERE route_id = ?', [route.id]);

    route.checkpoints.forEach((cp) => {
      database.runSync(
        `INSERT INTO checkpoints (id, route_id, latitude, longitude, label, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cp.id, cp.routeId, cp.coordinate.latitude, cp.coordinate.longitude, cp.label, cp.createdAt]
      );
    });

    route.notes.forEach((note) => {
      database.runSync(
        `INSERT INTO notes (id, route_id, latitude, longitude, text, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [note.id, note.routeId, note.coordinate.latitude, note.coordinate.longitude, note.text, note.createdAt]
      );
    });
  });
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

  if (rows.length === 0) return [];

  // Batch fetch checkpoints and notes (avoids N+1 queries)
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');

  const allCheckpointRows = database.getAllSync<{
    id: string;
    route_id: string;
    latitude: number;
    longitude: number;
    label: string;
    created_at: number;
  }>(`SELECT * FROM checkpoints WHERE route_id IN (${placeholders})`, ids);

  const allNoteRows = database.getAllSync<{
    id: string;
    route_id: string;
    latitude: number;
    longitude: number;
    text: string;
    created_at: number;
  }>(`SELECT * FROM notes WHERE route_id IN (${placeholders})`, ids);

  const checkpointsByRoute = new Map<string, Checkpoint[]>();
  const notesByRoute = new Map<string, Note[]>();

  for (const row of allCheckpointRows) {
    const list = checkpointsByRoute.get(row.route_id) ?? [];
    list.push({
      id: row.id,
      routeId: row.route_id,
      coordinate: { latitude: row.latitude, longitude: row.longitude },
      label: row.label,
      createdAt: row.created_at,
    });
    checkpointsByRoute.set(row.route_id, list);
  }

  for (const row of allNoteRows) {
    const list = notesByRoute.get(row.route_id) ?? [];
    list.push({
      id: row.id,
      routeId: row.route_id,
      coordinate: { latitude: row.latitude, longitude: row.longitude },
      text: row.text,
      createdAt: row.created_at,
    });
    notesByRoute.set(row.route_id, list);
  }

  return rows.map((row) => {
    let path: { latitude: number; longitude: number }[];
    try {
      path = JSON.parse(row.path);
    } catch {
      path = [];
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      path,
      checkpoints: checkpointsByRoute.get(row.id) ?? [],
      notes: notesByRoute.get(row.id) ?? [],
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

  let path: { latitude: number; longitude: number }[];
  try {
    path = JSON.parse(row.path);
  } catch {
    path = [];
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    path,
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

const renameRoute = (id: string, name: string): void => {
  const database = getDb();
  database.runSync(
    'UPDATE routes SET name = ?, updated_at = ? WHERE id = ?',
    [name, Date.now(), id]
  );
};

export const DatabaseService = {
  saveRoute,
  fetchAllRoutes,
  fetchRouteById,
  deleteRoute,
  renameRoute,
};
