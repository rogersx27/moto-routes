import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Route } from '../../models';
import { PillButton } from '../../components';
import { spacing } from '../../theme';
import type { DrawingMode } from './types';

interface Props {
  currentRoute: Route | null;
  mode: DrawingMode;
  bottom: number;
  onNewRoute: () => void;
  onToggleDrawing: () => void;
  onToggleCheckpoint: () => void;
  onToggleNote: () => void;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onUndo: () => void;
  onSave: () => void;
}

export const MapToolbar: React.FC<Props> = ({
  currentRoute,
  mode,
  bottom,
  onNewRoute,
  onToggleDrawing,
  onToggleCheckpoint,
  onToggleNote,
  onStartTracking,
  onStopTracking,
  onUndo,
  onSave,
}) => (
  <View style={[styles.toolbar, { bottom }]}>
    {!currentRoute && (
      <PillButton
        label="+ Ruta"
        onPress={onNewRoute}
        accessibilityLabel="Crear nueva ruta"
      />
    )}

    {currentRoute && (
      <>
        {mode !== 'tracking' && (
          <PillButton
            label="Dibujar"
            onPress={onToggleDrawing}
            active={mode === 'drawing'}
            accessibilityLabel="Modo dibujar"
          />
        )}

        <PillButton
          label="Checkpoint"
          onPress={onToggleCheckpoint}
          active={mode === 'checkpoint'}
          accessibilityLabel="Añadir checkpoint"
        />

        <PillButton
          label="Nota"
          onPress={onToggleNote}
          active={mode === 'note'}
          accessibilityLabel="Añadir nota"
        />

        {mode !== 'tracking' && (
          <PillButton
            label="⏺ Grabar ruta"
            onPress={onStartTracking}
            variant="gps"
            accessibilityLabel="Grabar ruta con GPS"
          />
        )}

        {mode === 'drawing' && currentRoute.path.length > 0 && (
          <PillButton
            label="↩ Deshacer"
            onPress={onUndo}
            accessibilityLabel="Deshacer último punto"
          />
        )}

        {mode !== 'tracking' ? (
          <PillButton
            label="Guardar"
            onPress={onSave}
            variant="save"
            accessibilityLabel="Guardar ruta"
          />
        ) : (
          <PillButton
            label="⏹ Detener"
            onPress={onStopTracking}
            variant="stop"
            accessibilityLabel="Detener grabación GPS"
          />
        )}
      </>
    )}
  </View>
);

const styles = StyleSheet.create({
  toolbar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
});
