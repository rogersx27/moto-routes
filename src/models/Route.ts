import type { Coordinate } from './Coordinate';
import type { Checkpoint } from './Checkpoint';
import type { Note } from './Note';

export interface Route {
  id: string;
  name: string;
  description: string;
  path: Coordinate[];
  checkpoints: Checkpoint[];
  notes: Note[];
  createdAt: number;
  updatedAt: number;
}
