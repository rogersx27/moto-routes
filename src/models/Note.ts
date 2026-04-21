import type { Coordinate } from './Coordinate';

export interface Note {
  id: string;
  routeId: string;
  coordinate: Coordinate;
  text: string;
  createdAt: number;
}
