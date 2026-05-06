export const SCHEMA_VERSION = 1;

export const DDL = `
  CREATE TABLE IF NOT EXISTS routes (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    description TEXT,
    path        TEXT    NOT NULL,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS checkpoints (
    id         TEXT  PRIMARY KEY,
    route_id   TEXT  NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    latitude   REAL  NOT NULL,
    longitude  REAL  NOT NULL,
    label      TEXT  NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id         TEXT  PRIMARY KEY,
    route_id   TEXT  NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    latitude   REAL  NOT NULL,
    longitude  REAL  NOT NULL,
    text       TEXT  NOT NULL,
    created_at INTEGER NOT NULL
  );
`;

/**
 * Add a new entry here when the schema changes.
 * Key = version number being reached, value = SQL to apply.
 * Example for version 2:
 *   2: 'ALTER TABLE routes ADD COLUMN color TEXT;',
 */
export const MIGRATIONS: Record<number, string> = {};
