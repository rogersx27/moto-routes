import type { Route, Checkpoint, Note } from '../models';

// ─── Raw row shapes returned by SQLite ──────────────────────────────────────

export type RouteRow = {
  id: string;
  name: string;
  description: string | null;
  path: string;
  created_at: number;
  updated_at: number;
};

export type CheckpointRow = {
  id: string;
  route_id: string;
  latitude: number;
  longitude: number;
  label: string;
  created_at: number;
};

export type NoteRow = {
  id: string;
  route_id: string;
  latitude: number;
  longitude: number;
  text: string;
  created_at: number;
};

// ─── Deserializers: DB row → domain model ───────────────────────────────────

export const toCheckpoint = (row: CheckpointRow): Checkpoint => ({
  id: row.id,
  routeId: row.route_id,
  coordinate: { latitude: row.latitude, longitude: row.longitude },
  label: row.label,
  createdAt: row.created_at,
});

export const toNote = (row: NoteRow): Note => ({
  id: row.id,
  routeId: row.route_id,
  coordinate: { latitude: row.latitude, longitude: row.longitude },
  text: row.text,
  createdAt: row.created_at,
});

export const toRoute = (
  row: RouteRow,
  checkpoints: Checkpoint[],
  notes: Note[]
): Route => {
  let path: Route['path'];
  try {
    path = JSON.parse(row.path);
  } catch {
    path = [];
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    path,
    checkpoints,
    notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// ─── Serializers: domain model → DB row params for writes ───────────────────

export const fromRoute = (route: Route): Omit<RouteRow, 'description'> & { description: string } => ({
  id: route.id,
  name: route.name,
  description: route.description,
  path: JSON.stringify(route.path),
  created_at: route.createdAt,
  updated_at: route.updatedAt,
});

export const fromCheckpoint = (cp: Checkpoint): CheckpointRow => ({
  id: cp.id,
  route_id: cp.routeId,
  latitude: cp.coordinate.latitude,
  longitude: cp.coordinate.longitude,
  label: cp.label,
  created_at: cp.createdAt,
});

export const fromNote = (note: Note): NoteRow => ({
  id: note.id,
  route_id: note.routeId,
  latitude: note.coordinate.latitude,
  longitude: note.coordinate.longitude,
  text: note.text,
  created_at: note.createdAt,
});
