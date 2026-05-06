import React from 'react';
import { Polyline } from 'react-native-maps';

import type { Route } from '../models';
import { colors } from '../theme';
import { CheckpointMarker } from './CheckpointMarker';
import { NoteMarker } from './NoteMarker';

interface Props {
  route: Route;
}

export const RouteMap: React.FC<Props> = ({ route }) => (
  <>
    <Polyline
      coordinates={route.path}
      strokeColor={colors.primary}
      strokeWidth={4}
    />

    {route.checkpoints.map((cp) => (
      <CheckpointMarker key={cp.id} checkpoint={cp} />
    ))}

    {route.notes.map((note) => (
      <NoteMarker key={note.id} note={note} />
    ))}
  </>
);
