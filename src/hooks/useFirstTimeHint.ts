import { useCallback, useRef, useState } from 'react';
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

interface HintDialogState {
  visible: boolean;
  title: string;
  message: string;
}

// Returns a stable triggerHint function and dialog state to render an AlertDialog.
export const useFirstTimeHint = () => {
  const seen = useRef<Set<HintKey>>(new Set());
  const [hintDialog, setHintDialog] = useState<HintDialogState>({
    visible: false,
    title: '',
    message: '',
  });

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
      setHintDialog({ visible: true, title, message });
    } catch {
      // AsyncStorage failure — skip hint silently rather than crashing
    }
  }, []);

  const dismissHint = useCallback(() => {
    setHintDialog((prev) => ({ ...prev, visible: false }));
  }, []);

  return { triggerHint, hintDialog, dismissHint };
};
