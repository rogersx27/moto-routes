import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HintKey = 'drawing' | 'checkpoint' | 'note';

const HINT_CONTENT: Record<HintKey, { title: string; message: string }> = {
  drawing: {
    title: 'Modo dibujo',
    message:
      'Toca el mapa para agregar puntos al recorrido.\nUsa "↩ Deshacer" para borrar el último punto.',
  },
  checkpoint: {
    title: 'Modo checkpoint',
    message: 'Toca el mapa para marcar un punto de interés en tu ruta.',
  },
  note: {
    title: 'Modo nota',
    message: 'Toca el mapa para dejar una nota escrita en ese lugar.',
  },
};

const STORAGE_PREFIX = 'hint_seen_';

// Returns a stable function that shows the hint for a given key only once ever.
export const useFirstTimeHint = () => {
  // In-memory cache so we don't hit AsyncStorage on every mode switch
  const seen = useRef<Set<HintKey>>(new Set());

  const triggerHint = useCallback(async (key: HintKey) => {
    if (seen.current.has(key)) return;

    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const alreadySeen = await AsyncStorage.getItem(storageKey);
      if (alreadySeen) {
        seen.current.add(key);
        return;
      }

      seen.current.add(key);
      await AsyncStorage.setItem(storageKey, 'true');

      const { title, message } = HINT_CONTENT[key];
      Alert.alert(title, message, [{ text: 'Entendido' }]);
    } catch {
      // AsyncStorage failure — skip hint silently rather than crashing
    }
  }, []);

  return triggerHint;
};
