import * as SQLite from 'expo-sqlite';
import type { Route } from '../models';
import { DDL, MIGRATIONS, SCHEMA_VERSION } from '../db/schema';
import {
  fromCheckpoint,
  fromNote,
  fromRoute,
  toCheckpoint,
  toNote,
  toRoute,
  type CheckpointRow,
  type NoteRow,
  type RouteRow,
} from '../db/serializers';

const DB_NAME = 'moto_routes.db';

let db: SQLite.SQLiteDatabase | null = null;

const applyMigrations = (database: SQLite.SQLiteDatabase): void => {
  const row = database.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const sql = MIGRATIONS[v];
    if (sql) database.execSync(sql);
  }

  if (current < SCHEMA_VERSION) {
    database.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
};

const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
    db.execSync(DDL);
    applyMigrations(db);
  }
  return db;
};

const saveRoute = (route: Route): void => {
  const database = getDb();
  const r = fromRoute(route);

  database.withTransactionSync(() => {
    database.runSync(
      `INSERT OR REPLACE INTO routes (id, name, description, path, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [r.id, r.name, r.description, r.path, r.created_at, r.updated_at]
    );

    database.runSync('DELETE FROM checkpoints WHERE route_id = ?', [route.id]);
    database.runSync('DELETE FROM notes WHERE route_id = ?', [route.id]);

    route.checkpoints.forEach((cp) => {
      const c = fromCheckpoint(cp);
      database.runSync(
        `INSERT INTO checkpoints (id, route_id, latitude, longitude, label, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [c.id, c.route_id, c.latitude, c.longitude, c.label, c.created_at]
      );
    });

    route.notes.forEach((note) => {
      const n = fromNote(note);
      database.runSync(
        `INSERT INTO notes (id, route_id, latitude, longitude, text, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [n.id, n.route_id, n.latitude, n.longitude, n.text, n.created_at]
      );
    });
  });
};

const fetchAllRoutes = (): Route[] => {
  const database = getDb();

  const rows = database.getAllSync<RouteRow>(
    'SELECT * FROM routes ORDER BY updated_at DESC'
  );

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');

  const checkpointRows = database.getAllSync<CheckpointRow>(
    `SELECT * FROM checkpoints WHERE route_id IN (${placeholders})`,
    ids
  );

  const noteRows = database.getAllSync<NoteRow>(
    `SELECT * FROM notes WHERE route_id IN (${placeholders})`,
    ids
  );

  const checkpointsByRoute = new Map(ids.map((id) => [id, [] as ReturnType<typeof toCheckpoint>[]]));
  const notesByRoute = new Map(ids.map((id) => [id, [] as ReturnType<typeof toNote>[]]));

  for (const row of checkpointRows) {
    checkpointsByRoute.get(row.route_id)?.push(toCheckpoint(row));
  }

  for (const row of noteRows) {
    notesByRoute.get(row.route_id)?.push(toNote(row));
  }

  return rows.map((row) =>
    toRoute(row, checkpointsByRoute.get(row.id) ?? [], notesByRoute.get(row.id) ?? [])
  );
};

const fetchRouteById = (id: string): Route | null => {
  const database = getDb();

  const row = database.getFirstSync<RouteRow>(
    'SELECT * FROM routes WHERE id = ?',
    [id]
  );

  if (!row) return null;

  const checkpoints = database
    .getAllSync<CheckpointRow>('SELECT * FROM checkpoints WHERE route_id = ?', [id])
    .map(toCheckpoint);

  const notes = database
    .getAllSync<NoteRow>('SELECT * FROM notes WHERE route_id = ?', [id])
    .map(toNote);

  return toRoute(row, checkpoints, notes);
};

const deleteRoute = (id: string): void => {
  getDb().runSync('DELETE FROM routes WHERE id = ?', [id]);
};

const renameRoute = (id: string, name: string): void => {
  getDb().runSync(
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
