import type { Coordinate } from './Coordinate';

export interface Checkpoint {
  id: string;
  routeId: string;
  coordinate: Coordinate;
  label: string;
  createdAt: number;
}
